import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function config(env = {}) {
  const exports = {}
  vm.runInNewContext(compile('../app/inquiry-config.ts'), { exports, process: { env } })
  return exports
}
test('inquiries use the admin database without switching published content providers', () => {
  const { inquiryStorageProvider } = config()
  assert.equal(inquiryStorageProvider({ NEXT_PUBLIC_ADMIN_PROVIDER: 'supabase', CMS_PROVIDER: 'sanity' }), 'supabase')
  assert.equal(inquiryStorageProvider({ CMS_PROVIDER: 'supabase' }), 'supabase')
  assert.equal(inquiryStorageProvider({ CMS_PROVIDER: 'sanity' }), 'sanity')
  assert.equal(inquiryStorageProvider({ INQUIRY_PROVIDER: 'sanity', NEXT_PUBLIC_ADMIN_PROVIDER: 'supabase' }), 'sanity')
  assert.throws(() => inquiryStorageProvider({ INQUIRY_PROVIDER: 'unknown' }))
})
function connectionFixture(options = {}) {
  const env = { NEXT_PUBLIC_ADMIN_PROVIDER: 'supabase', CMS_PROVIDER: 'sanity', RESEND_API_KEY: 'fixture-private-resend', SUPABASE_SECRET_KEY: 'fixture-private-database', ...options.env }
  const exports = {}, events = []
  vm.runInNewContext(compile('../app/admin/inquiry-connection-actions.ts'), { exports, process: { env },
    require: name => {
      if (name === '../../supabase/server') return {
        currentMember: async () => options.role ? { role: options.role } : null,
        serviceClient: () => ({ rpc: async (name, args) => { events.push('rpc'); assert.equal(name, 'cms_accept_inquiry'); assert.equal(Object.keys(args.fields).length, 0); return { error: { message: options.databaseFailure ? 'fixture-private-error' : 'Missing fields' } } } }),
      }
      if (name === '../../supabase/server-key') return { hasServiceKey: () => Boolean(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY) }
      if (name === '../inquiry-config') return config(env)
      if (name === '../../supabase/inquiry-settings') return { readInquirySettings: async () => ({ recipientEmail: 'adam.bartusek@akronlogistics.cz', revision: 1 }) }
      if (name === '../preparing') return { preparing: true }
      throw new Error(name)
    },
  })
  return { check: exports.checkInquiryConnection, events }
}
for (const role of [null, 'viewer', 'editor']) test(`connection metadata rejects ${role} without reaching database`, async () => {
  const f = connectionFixture({ role })
  const r = await f.check()
  assert.equal(r.authorized, false)
  assert.equal(r.checks.length, 0)
  assert.equal(f.events.length, 0)
})
test('admin connection check returns only boolean readiness and keeps the public gate closed', async () => {
  const f = connectionFixture({ role: 'admin' })
  const r = await f.check()
  assert.equal(r.authorized, true)
  assert.equal(r.publicFormOpen, false)
  assert.ok(r.checks.every(check => check.ok))
  assert.deepEqual(f.events, ['rpc'])
  assert.doesNotMatch(JSON.stringify(r), /fixture-private-resend|fixture-private-database/)
})
test('missing server key and RPC failure cannot report a ready database', async () => {
  for (const options of [{ env: { SUPABASE_SECRET_KEY: '' } }, { databaseFailure: true }]) {
    const f = connectionFixture({ role: 'admin', ...options })
    const r = await f.check()
    assert.equal(r.checks.find(check => check.id === 'database').ok, false)
    assert.doesNotMatch(JSON.stringify(r), /fixture-private-error/)
  }
})
test('server-only Supabase key supports integration alias without exposing it in readiness', () => {
  const env = { SUPABASE_SERVICE_ROLE_KEY: 'fixture-role-key' }, exports = {}
  vm.runInNewContext(compile('../supabase/server-key.ts'), { exports, process: { env }, require: name => { assert.equal(name, 'server-only'); return {} } })
  assert.equal(exports.hasServiceKey(), true)
  assert.equal(exports.serverServiceKey(), 'fixture-role-key')
  env.SUPABASE_SECRET_KEY = 'fixture-new-key'
  assert.equal(exports.serverServiceKey(), 'fixture-new-key')
})
