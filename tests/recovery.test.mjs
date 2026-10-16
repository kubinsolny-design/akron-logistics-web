import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createHash } from 'node:crypto'
import { recoveryLink, isRecoveryLink } from '../supabase/recovery-link.ts'

function fixture(options = {}) {
  const exports = {}, calls = [], id = 'aabb3db8-57aa-4166-89f5-cde7c3dc1e47'
  const source = ts.transpileModule(fs.readFileSync(new URL('../app/admin/recovery-actions.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  const query = {select(){return this},eq(){return this},is(){return this},async maybeSingle(){return {data:options.inactive?null:{user_id:id}}}}
  vm.runInNewContext(source, {exports, URL, AbortSignal, process:{env:{ADMIN_SITE_URL:'https://akronlogistics.cz',RESEND_API_KEY:'fixture'}},
    fetch:async(url,init)=>{calls.push({url,mail:JSON.parse(init.body)});return {ok:!options.mailError}},
    require(name){
      if(name==='node:crypto')return {createHash}
      if(name==='../../supabase/admin-origin')return {adminOrigin:value=>value}
      if(name==='../../supabase/recovery-link')return {recoveryLink}
      if(name==='../inquiry-config')return {defaultInquirySender:'AKRON Logistics <web@akronlogistics.cz>'}
      if(name==='../../supabase/server')return {
        currentMember:async()=>options.anonymous?null:{role:options.role||'admin',client:{from:()=>query}},
        serviceClient:()=>({auth:{admin:{
          getUserById:async()=>({data:{user:{id,email:'fixture@example.invalid'}}}),
          generateLink:async(input)=>{calls.push({generate:input});return {data:{user:{id:options.wrongUser?'other':id},properties:{hashed_token:'a'.repeat(64)}}}},
        }}}),
      }
      throw new Error('Unexpected dependency')
    },
  })
  return {calls,send:()=>exports.sendMemberRecovery(id)}
}

for(const options of [{anonymous:true},{role:'viewer'},{role:'editor'},{inactive:true}])test(`unauthorized or inactive recovery blocked ${JSON.stringify(options)}`,async()=>{
  const f=fixture(options);assert.equal((await f.send()).ok,false);assert.equal(f.calls.length,0)
})

test('recovery emails authoritative account through Resend without returning credentials',async()=>{
  const f=fixture(), result=await f.send()
  assert.equal(result.ok,true)
  assert.equal(f.calls[0].generate.options.redirectTo,'https://akronlogistics.cz/admin/accept')
  assert.equal(f.calls[0].generate.type,'recovery')
  assert.deepEqual(f.calls[1].mail.to,['fixture@example.invalid'])
  assert.match(f.calls[1].mail.html,/\/admin\/accept#token_hash=/)
  assert.doesNotMatch(JSON.stringify(result),/token_hash|aaaa/)
})

for(const options of [{mailError:true},{wrongUser:true}])test(`recovery failure is not reported as sent ${JSON.stringify(options)}`,async()=>{
  const f=fixture(options);assert.equal((await f.send()).ok,false)
  if(options.wrongUser)assert.equal(f.calls.some(call=>call.mail),false)
})

test('recovery points directly to password setup, with no credentials in request URL', () => {
  const link = recoveryLink('https://akronlogistics.cz', 'a'.repeat(64)), url = new URL(link)
  assert.equal(url.origin + url.pathname, 'https://akronlogistics.cz/admin/accept')
  assert.equal(url.search, '')
  assert.equal(isRecoveryLink(link), true)
  assert.throws(() => recoveryLink('https://akronlogistics.cz', 'invalid'))
})

test('sending recovery requires current admin and active target; roles and secrets stay untouched', () => {
  const source = fs.readFileSync(new URL('../app/admin/recovery-actions.ts', import.meta.url), 'utf8')
  assert.match(source, /member.role !== 'admin'/)
  assert.match(source, /\.is\('revoked_at', null\)/)
  assert.match(source, /getUserById\(userId\)/)
  assert.match(source, /data.user\?\.id !== userId/)
  assert.match(source, /type: 'recovery'/)
  assert.match(source, /https:\/\/api.resend.com\/emails/)
  assert.doesNotMatch(source, /cms_set_member_role|console\.|invitationLink:/)
})

test('email token is not consumed on page load; explicit button gates verification', () => {
  const source = fs.readFileSync(new URL('../app/admin/accept/accept-invite.tsx', import.meta.url), 'utf8')
  assert.match(source, /if \(recoveryHref.current \|\| isRecoveryLink\(window.location.href\)\)/)
  assert.match(source, /onClick=\{\(\) => void confirmRecovery\(\)\}/)
})
