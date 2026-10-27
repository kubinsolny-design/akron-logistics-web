import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const config = {}
vm.runInNewContext(compile('../app/inquiry-config.ts'), { exports: config, process: { env: {} } })
function fixture(role, changed = false) {
  const exports = {}, calls = []
  vm.runInNewContext(compile('../app/admin/inquiry-settings-actions.ts'), { exports, FormData, Number, require: name => {
    if (name === '../../supabase/server') return { currentMember: async () => role ? { role, client: {
      from: () => { calls.push('read'); return { select: () => ({ eq: () => ({ single: async () => ({ data: { public_email: 'public@example.com', recipient_email: 'private@example.com', revision: 2 } }) }) }) } },
      rpc: async (name, args) => { calls.push([name, args]); return { error: changed ? { message: 'Settings changed' } : null } },
    } } : null }
    if (name === '../inquiry-config') return config
    if (name === '../../supabase/content-cache') return { publicContactTag: 'akron-public-contact-v1' }
    if (name === 'next/cache') return { updateTag: tag => calls.push(['invalidate', tag]), revalidatePath: () => calls.push('revalidate') }
    throw new Error(name)
  } })
  const form = new FormData()
  form.set('publicEmail', 'contact@example.com'); form.set('recipientEmail', 'dispatch@example.com'); form.set('revision', '2')
  return { ...exports, calls, form }
}
for (const role of [null, 'editor', 'viewer']) test(`email configuration rejects ${role} before any database access`, async () => {
  const f = fixture(role)
  assert.equal(await f.loadInquirySettings(), null)
  assert.equal((await f.saveInquirySettings({}, f.form)).status, 'error')
  assert.deepEqual(f.calls, [])
})
test('admin saves addresses immediately through the versioned authenticated RPC', async () => {
  const f = fixture('admin')
  assert.equal((await f.loadInquirySettings()).revision, 2)
  assert.equal((await f.saveInquirySettings({}, f.form)).status, 'success')
  assert.equal(f.calls[1][0], 'cms_update_inquiry_settings')
  assert.equal(f.calls[1][1].delivery_email, 'dispatch@example.com')
  assert.equal(f.calls[1][1].expected_revision, 2)
  assert.deepEqual(f.calls[2], ['invalidate', 'akron-public-contact-v1'])
  assert.equal(f.calls[3], 'revalidate')
})
test('invalid recipient and stale revisions fail without claiming success', async () => {
  const f = fixture('admin'); f.form.set('recipientEmail', 'one@example.com,two@example.com')
  assert.equal((await f.saveInquirySettings({}, f.form)).status, 'error')
  assert.deepEqual(f.calls, [])
  const stale = fixture('admin', true)
  assert.match((await stale.saveInquirySettings({}, stale.form)).message, /jiný administrátor/)
  assert.notEqual(stale.calls.at(-1), 'revalidate')
})
test('contact validation excludes header injection and multi-recipient values', () => {
  for (const value of ['a@example.com\nBcc:x@example.com', 'a@example.com,b@example.com', 'a@example.com;b@example.com', 'x<y@example.com>', 'a@-invalid.com']) assert.equal(config.validContactEmail(value), false, value)
  assert.equal(config.validContactEmail('dispatch+web@akronlogistics.cz'), true)
  assert.equal(config.validInquirySender('billing@akronlogistics.cz'), false)
  assert.equal(config.validInquirySender('AKRON Logistics <web@akronlogistics.cz>'), true)
})
