import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import {createHash, createHmac} from 'node:crypto'
import {recoveryLink} from '../supabase/recovery-link.ts'

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const source = ts.transpileModule(read('../app/admin/forgot-password-actions.ts'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
function fixture(options = {}) {
  const exports = {}, calls = [], userId = 'fixture-user'
  const service = {
    rpc:async(name,args)=>{calls.push({quota:name,args});return {data:options.unknown||options.limited?null:userId,error:options.quotaError?'unavailable':null}},
    auth:{admin:{
      getUserById:async()=>({data:{user:{id:userId,email:options.wrongEmail?'other@example.invalid':'fixture@example.invalid'}}}),
      generateLink:async(args)=>{calls.push({generate:args});return {data:{user:{id:userId},properties:{hashed_token:'a'.repeat(56)}}}},
    }},
  }
  vm.runInNewContext(source, {exports,URL,AbortSignal,Promise,setTimeout:fn=>fn(),process:{env:{ADMIN_SITE_URL:'https://akronlogistics.cz',RESEND_API_KEY:options.noMail?undefined:'fixture',VERCEL:'1'}},
    fetch:async(url,init)=>{calls.push({mail:JSON.parse(init.body),url});return {ok:!options.mailError}},
    require(name){
      if(name==='node:crypto')return {createHash,createHmac}
      if(name==='next/headers')return {headers:async()=>({get:()=>null})}
      if(name==='../../supabase/server')return {serviceClient:()=>service}
      if(name==='../../supabase/server-key')return {serverServiceKey:()=> 'fixture-private-key'}
      if(name==='../../supabase/admin-origin')return {adminOrigin:value=>value}
      if(name==='../../supabase/config')return {supabaseEnabled:()=>true}
      if(name==='../../supabase/recovery-link')return {recoveryLink}
      if(name==='../request-fingerprint')return {requestFingerprint:()=> 'b'.repeat(64)}
      if(name==='../inquiry-config')return {defaultInquirySender:'AKRON Logistics <web@akronlogistics.cz>'}
      throw new Error('Unexpected dependency')
    },
  })
  const form = new FormData(); form.set('email', options.email??' Fixture@Example.Invalid ')
  if(options.bot)form.set('website','spam')
  return {calls,send:()=>exports.requestPasswordRecovery({message:''},form)}
}

test('anonymous recovery uses durable server-only quota before token generation and email',async()=>{
  const f=fixture(), result=await f.send()
  assert.equal(f.calls[0].quota,'cms_request_password_recovery')
  assert.equal(f.calls[0].args.email_address,'fixture@example.invalid')
  assert.match(f.calls[0].args.email_fingerprint,/^[a-f0-9]{64}$/)
  assert.equal(f.calls[1].generate.type,'recovery')
  assert.equal(f.calls[1].generate.options.redirectTo,'https://akronlogistics.cz/admin/accept')
  assert.deepEqual(f.calls[2].mail.to,['fixture@example.invalid'])
  assert.match(f.calls[2].mail.text,/původní heslo se nemění/)
  assert.doesNotMatch(JSON.stringify(result),/token_hash|fixture@example|fixture-private/)
})
for(const options of [{unknown:true},{limited:true},{quotaError:true},{wrongEmail:true},{noMail:true},{email:'invalid'},{bot:true}])test(`public recovery does not send for unsafe request ${JSON.stringify(options)}`,async()=>{
  const f=fixture(options), result=await f.send()
  assert.deepEqual(JSON.parse(JSON.stringify(result)),JSON.parse(JSON.stringify(await fixture().send())))
  assert.equal(f.calls.some(call=>call.mail||call.generate),false)
})
test('mail failure does not disclose account existence',async()=>{
  assert.deepEqual(JSON.parse(JSON.stringify(await fixture({mailError:true}).send())),JSON.parse(JSON.stringify(await fixture({unknown:true}).send())))
})
test('login and expired callback both offer self-service recovery',()=>{
  for(const file of ['../app/admin/login-form.tsx','../app/admin/accept/accept-invite.tsx'])assert.match(read(file),/href="\/admin\/forgot-password"/)
})
test('honeypot stays outside the layout and keyboard navigation on mobile',()=>{
  assert.match(read('../app/admin/forgot-password/recovery-form.tsx'),/<div hidden aria-hidden="true"><input type="text" name="website" tabIndex=\{-1\}/)
})
test('quota migration denies public reads and RPC, serializes three scopes and leaves business data unchanged',()=>{
  const sql=read('../supabase/migrations/20261019090000_self_service_recovery.sql')
  assert.match(sql,/enable row level security/)
  assert.match(sql,/revoke all on function[\s\S]*from public, anon, authenticated/)
  assert.match(sql,/pg_advisory_xact_lock/)
  assert.match(sql,/interval '60 seconds'/)
  assert.match(sql,/then 30[\s\S]*then 10 else 3/)
  assert.match(sql,/m.revoked_at is null/)
  assert.doesNotMatch(sql,/(update|delete from|insert into) (public\.cms_members|auth\.users|public\.cms_inquiries|public\.cms_drafts|public\.cms_published)/i)
})
