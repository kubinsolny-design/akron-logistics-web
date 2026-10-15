import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function compile(path) { return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText }
const originModule = { exports: {} }
vm.runInNewContext(compile('../supabase/admin-origin.ts'), { exports: originModule.exports, URL })
const { adminOrigin } = originModule.exports
const actionSource = compile('../app/admin/actions.ts')

test('invitation origin accepts an HTTPS origin only', () => {
  assert.equal(adminOrigin('https://akronlogistics.cz/'), 'https://akronlogistics.cz')
  for (const value of [undefined, '', 'invalid', 'http://akronlogistics.cz', 'https://user:password@akronlogistics.cz', 'https://akronlogistics.cz/path', 'https://akronlogistics.cz?next=other', 'https://akronlogistics.cz/#token']) assert.equal(adminOrigin(value), null)
})

function fixture(options = {}) {
  const exports = {}, calls = []
  vm.runInNewContext(actionSource, {
    exports, URL, process: { env: { ADMIN_SITE_URL: options.origin ?? 'https://akronlogistics.cz' } },
    require: name => {
      if (name === 'next/navigation') return { redirect: () => { throw new Error('Unexpected redirect') } }
      if (name === 'next/cache') return { revalidatePath() {} }
      if (name === '../../supabase/config') return { supabaseEnabled: () => true }
      if (name === '../../supabase/admin-origin') return { adminOrigin }
      if (name === '../../supabase/server') return {
        currentMember: async () => options.anonymous ? null : { role: options.role || 'admin', client: { rpc: async (name, fields) => { calls.push({ name, fields }); return { error: options.roleError || null } } } },
        serviceClient: () => {
          if (options.missingSecret) throw new Error('fixture credentials missing')
          const invite = async (...args) => {
            calls.push({ invite: args })
            if (options.outage) throw new Error('fixture provider outage')
            return { data: { user: { id: 'fixture-user' }, properties: { action_link: 'https://fixture.invalid/invite' } }, error: options.providerError || null }
          }
          return { auth: { admin: { inviteUserByEmail: invite, generateLink: invite } } }
        },
      }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  const form = new FormData(); form.set('email', 'fixture@example.com'); form.set('role', 'viewer')
  return { form, calls, invite: () => exports.inviteMember(form) }
}
for (const options of [{ anonymous: true }, { role: 'viewer' }, { role: 'editor' }]) test(`non-admin cannot send invitations or change roles: ${JSON.stringify(options)}`, async () => {
  const f = fixture(options); assert.equal((await f.invite()).ok, false); assert.equal(f.calls.length, 0)
})
for (const options of [{ origin: 'invalid' }, { missingSecret: true }, { outage: true }, { providerError: 'fixture rejection' }]) test(`invitation failure is handled safely: ${JSON.stringify(options)}`, async () => {
  const f = fixture(options); assert.equal((await f.invite()).ok, false); assert.ok(!f.calls.some(call => call.name))
})
test('invitation uses the configured exact production callback and caller JWT for role assignment', async () => {
  const f = fixture(); assert.equal((await f.invite()).ok, true)
  assert.equal(f.calls[0].invite[1].redirectTo, 'https://akronlogistics.cz/admin/accept')
  assert.equal(f.calls[1].name, 'cms_set_member_role')
  assert.equal(f.calls[1].fields.new_role, 'viewer')
  assert.equal(f.calls[1].fields.target_user, 'fixture-user')
})
test('a failed role assignment is never reported as a ready access', async () => {
  const f = fixture({ roleError: 'fixture rejection' }); assert.equal((await f.invite()).ok, false)
})
