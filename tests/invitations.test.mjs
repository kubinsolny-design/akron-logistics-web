import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import {createHash} from 'node:crypto'

function compile(path) { return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText }
const originModule = { exports: {} }
vm.runInNewContext(compile('../supabase/admin-origin.ts'), { exports: originModule.exports, URL })
const { adminOrigin } = originModule.exports
const actionSource = compile('../app/admin/actions.ts')
const emailModule = {exports:{}}
vm.runInNewContext(compile('../app/admin/invitation-email.ts'),{exports:emailModule.exports})

test('invitation origin accepts an HTTPS origin only', () => {
  assert.equal(adminOrigin('https://akronlogistics.cz/'), 'https://akronlogistics.cz')
  for (const value of [undefined, '', 'invalid', 'http://akronlogistics.cz', 'https://user:password@akronlogistics.cz', 'https://akronlogistics.cz/path', 'https://akronlogistics.cz?next=other', 'https://akronlogistics.cz/#token']) assert.equal(adminOrigin(value), null)
})

function fixture(options = {}) {
  const exports = {}, calls = []
  vm.runInNewContext(actionSource, {
    exports, URL, AbortSignal, process: { env: { ADMIN_SITE_URL: options.origin ?? 'https://akronlogistics.cz',NEXT_PUBLIC_SUPABASE_URL:'https://fixture.supabase.co',RESEND_API_KEY:options.noResend?undefined:'fixture-key' } },
    fetch:async(url,init)=>{calls.push({send:JSON.parse(init.body),url,headers:init.headers});if(options.mailOutage)throw new Error('fixture timeout');return{ok:!options.mailError}},
    require: name => {
      if (name === 'next/navigation') return { redirect: () => { throw new Error('Unexpected redirect') } }
      if (name === 'next/cache') return { revalidatePath() {} }
      if (name === '../../supabase/config') return { supabaseEnabled: () => true }
      if (name === '../../supabase/admin-origin') return { adminOrigin }
      if (name === './invitation-email') return emailModule.exports
      if (name === '../inquiry-config') return {defaultInquirySender:'AKRON Logistics <web@akronlogistics.cz>'}
      if (name === 'node:crypto') return {createHash}
      if (name === '../../supabase/server') return {
        currentMember: async () => options.anonymous ? null : { user:{email:'admin@example.com'},role: options.role || 'admin', client: { rpc: async (name, fields) => { calls.push({ name, fields }); return { error: options.roleError || null } } } },
        serviceClient: () => {
          if (options.missingSecret) throw new Error('fixture credentials missing')
          const invite = async (...args) => {
            calls.push({ invite: args })
            if (options.outage) throw new Error('fixture provider outage')
            return { data: { user: { id: 'fixture-user' }, properties: { action_link: options.badLink || 'https://fixture.supabase.co/auth/v1/verify?token=fixture-token&type=invite&redirect_to=https%3A%2F%2Fakronlogistics.cz%2Fadmin%2Faccept' } }, error: options.providerError || null }
          }
          return { auth: { admin: { inviteUserByEmail: invite, generateLink: invite } } }
        },
      }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  const form = new FormData(); form.set('email', 'fixture@example.com'); form.set('role', 'viewer')
  return { form, calls, invite: () => exports.inviteMember(form),preview:()=>exports.sendInvitationPreview() }
}
for (const options of [{ anonymous: true }, { role: 'viewer' }, { role: 'editor' }]) test(`non-admin cannot send invitations or change roles: ${JSON.stringify(options)}`, async () => {
  const f = fixture(options); assert.equal((await f.invite()).ok, false); assert.equal(f.calls.length, 0)
})
for (const options of [{ origin: 'invalid' }, { missingSecret: true }, { outage: true }, { providerError: 'fixture rejection' }]) test(`invitation failure is handled safely: ${JSON.stringify(options)}`, async () => {
  const f = fixture(options); assert.equal((await f.invite()).ok, false); assert.ok(!f.calls.some(call => call.name))
})
test('invitation uses the configured exact production callback and caller JWT for role assignment', async () => {
  const f = fixture(); assert.equal((await f.invite()).ok, true)
  assert.equal(f.calls[0].invite[0].options.redirectTo, 'https://akronlogistics.cz/admin/accept')
  assert.equal(f.calls[1].name, 'cms_set_member_role')
  assert.equal(f.calls[1].fields.new_role, 'viewer')
  assert.equal(f.calls[1].fields.target_user, 'fixture-user')
})
test('a failed role assignment is never reported as a ready access', async () => {
  const f = fixture({ roleError: 'fixture rejection' }); assert.equal((await f.invite()).ok, false);assert.ok(!f.calls.some(c=>c.send))
})
test('branded email is sent after role assignment, without returning a token to the UI',async()=>{
  const f=fixture();const result=await f.invite();assert.equal(result.ok,true);assert.equal(result.invitationLink,undefined)
  assert.equal(f.calls[1].name,'cms_set_member_role');const mail=f.calls[2].send
  assert.equal(mail.from,'AKRON Logistics <web@akronlogistics.cz>');assert.equal(mail.to[0],'fixture@example.com')
  assert.match(mail.subject,/AKRON Logistics/);assert.match(mail.html,/akron-email-logo.png/);assert.match(mail.html,/lang="cs"/);assert.match(mail.text,/Pouze náhled/)
  assert.match(mail.html,/Přijmout pozvánku/);assert.doesNotMatch(mail.html,/powered by|Supabase Auth/)
})
for(const options of [{noResend:true},{mailError:true},{mailOutage:true},{badLink:'https://evil.example/auth/v1/verify'},{badLink:'javascript:alert(1)'}])test(`branded invitation failure remains explicit: ${JSON.stringify(options)}`,async()=>{
 const f=fixture(options);assert.equal((await f.invite()).ok,false);if(options.badLink||options.noResend)assert.equal(f.calls.some(c=>c.name||c.send),false)
})
test('personal link delivery needs no mail service and never sends an email',async()=>{
 const f=fixture({noResend:true});f.form.set('delivery','link');const result=await f.invite();assert.equal(result.ok,true);assert.match(result.invitationLink,/fixture-token/);assert.equal(f.calls.some(c=>c.send),false)
})
test('invitation template escapes the action URL and explains privileges',()=>{
 const mail=emailModule.exports.invitationEmail({origin:'https://akronlogistics.cz',invitationLink:'https://example.com/?token="<script>',role:'editor'})
 assert.match(mail.html,/&quot;&lt;script&gt;/);assert.doesNotMatch(mail.html,/<script>/);assert.match(mail.text,/Bez správy uživatelských přístupů/)
})
test('preview only emails the signed-in admin and creates no invitation or membership',async()=>{
 const f=fixture();assert.equal((await f.preview()).ok,true);assert.equal(f.calls.length,1)
 const mail=f.calls[0].send;assert.deepEqual(mail.to,['admin@example.com']);assert.match(mail.subject,/NÁHLED/);assert.match(mail.text,/Nevytváří účet/);assert.doesNotMatch(mail.html,/fixture-token/)
})
for(const options of [{anonymous:true},{role:'viewer'},{role:'editor'}])test(`unauthorized invitation preview blocked: ${JSON.stringify(options)}`,async()=>{
 const f=fixture(options);assert.equal((await f.preview()).ok,false);assert.equal(f.calls.length,0)
})
