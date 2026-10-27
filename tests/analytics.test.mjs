import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const file=fileURLToPath(new URL('../app/analytics-config.ts',import.meta.url))
const mod=new Module(file)
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file)
const {analyticsAllowed,readPrivacyPreference,privacyLifetime,gaMeasurementId}=mod.exports

test('GA4 uses the requested measurement ID and excludes every non-public environment',()=>{
 assert.equal(gaMeasurementId,'G-D2XLJKJMNH')
 for(const host of ['akronlogistics.cz','www.akronlogistics.cz']){
  assert.equal(analyticsAllowed(host,'/',false,false),true)
  assert.equal(analyticsAllowed(host,'/',true,false),false)
  assert.equal(analyticsAllowed(host,'/',false,true),false)
  for(const path of ['/admin','/admin/accept','/studio','/api/admin','/unknown','/?token=private'])assert.equal(analyticsAllowed(host,path,false,false),false)
 }
 for(const host of ['localhost','akron-logistics-web.vercel.app','akron-admin-demo.vercel.app','akronlogistics.cz.evil.test'])assert.equal(analyticsAllowed(host,'/',false,false),false)
})
test('consent is explicit, expiring, versioned and fails closed',()=>{
 const now=1800000000000
 for(const raw of [null,'bad','{}',JSON.stringify({version:2,analytics:'true',savedAt:now}),JSON.stringify({version:2,analytics:true,savedAt:now+1}),JSON.stringify({version:2,analytics:true,savedAt:now-privacyLifetime})])assert.equal(readPrivacyPreference(raw,now),null)
 assert.deepEqual(readPrivacyPreference(JSON.stringify({version:1,mode:'essential-only',savedAt:now}),now),{analytics:false})
 for(const analytics of [true,false])assert.deepEqual(readPrivacyPreference(JSON.stringify({version:2,analytics,savedAt:now}),now),{analytics})
})
test('Google script is dynamically loaded only after eligibility and consent; payload strips URL secrets',()=>{
 const source=fs.readFileSync(new URL('../app/google-analytics.tsx',import.meta.url),'utf8')
 assert.ok(source.indexOf('if (!allowed)')<source.indexOf("document.createElement('script')"))
 assert.match(source,/send_page_view: false/)
 assert.match(source,/page_location: location.origin \+ pathname/)
 assert.doesNotMatch(source,/location\.href|location\.hash/)
 assert.match(source,/safeAttribution\(location.search, document.referrer, location.origin\)/)
 assert.match(source,/ga-disable-/)
})

test('runtime loads nothing before opt-in, emits one sanitized view, and stops on withdrawal',()=>{
 const saved=new Map(['window','localStorage','location','document'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]))
 const browser=new EventTarget();let preference=null;const scripts=[];let cleanup
 try{
  const values={window:browser,localStorage:{getItem:()=>preference},location:{hostname:'akronlogistics.cz',origin:'https://akronlogistics.cz',search:'?token=secret',hash:'#private'},document:Object.assign(new EventTarget(),{referrer:'https://www.google.com/search?q=private',createElement:()=>({}),head:{appendChild:script=>scripts.push(script)}})}
  for(const [key,value]of Object.entries(values))Object.defineProperty(globalThis,key,{value,configurable:true})
  const file=fileURLToPath(new URL('../app/google-analytics.tsx',import.meta.url));const component=new Module(file)
  component.require=name=>{
   if(name==='react')return{useEffect:callback=>{cleanup=callback()},useRef:value=>({current:value})}
   if(name==='next/navigation')return{usePathname:()=>'/kontakt'}
   if(name==='./preparing')return{preparing:false}
   if(name==='./analytics-config')return mod.exports
   throw Error('Unexpected test import')
  }
  component._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file)
  component.exports.GoogleAnalytics({preview:false})
  assert.equal(scripts.length,0)
  preference=JSON.stringify({version:2,analytics:false,savedAt:Date.now()});browser.dispatchEvent(new Event(mod.exports.privacyChangeEvent));assert.equal(scripts.length,0)
  preference=JSON.stringify({version:2,analytics:true,savedAt:Date.now()});browser.dispatchEvent(new Event(mod.exports.privacyChangeEvent));assert.equal(scripts.length,1)
  browser.dispatchEvent(new Event(mod.exports.privacyChangeEvent));assert.equal(scripts.length,1)
  const events=browser.dataLayer.map(value=>Array.from(value)).filter(value=>value[0]==='event')
  assert.equal(events.length,1);assert.equal(events[0][2].page_location,'https://akronlogistics.cz/kontakt')
  assert.doesNotMatch(JSON.stringify(browser.dataLayer),/secret|private/)
  browser.dispatchEvent(new Event(mod.exports.leadEvent))
  assert.equal(browser.dataLayer.map(value=>Array.from(value)).filter(value=>value[1]==='generate_lead').length,1)
  preference=JSON.stringify({version:2,analytics:false,savedAt:Date.now()});browser.dispatchEvent(new Event(mod.exports.privacyChangeEvent))
  assert.equal(browser['ga-disable-'+gaMeasurementId],true)
  browser.dispatchEvent(new Event(mod.exports.leadEvent))
  assert.equal(browser.dataLayer.map(value=>Array.from(value)).filter(value=>value[1]==='generate_lead').length,1)
  cleanup()
 }finally{for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
})
test('attribution forwards only an external origin and fixed campaign taxonomy, never URL secrets',()=>{
 const {safeAttribution}=mod.exports
 assert.deepEqual(safeAttribution('?token=secret&utm_source=google&utm_medium=cpc&utm_campaign=personal-name','https://www.google.com/search?q=private#secret','https://akronlogistics.cz'),{page_referrer:'https://www.google.com',campaign_source:'google',campaign_medium:'cpc'})
 assert.deepEqual(safeAttribution('?utm_source=name@example.com&utm_medium=cpc','https://user:secret@evil.test/private','https://akronlogistics.cz'),{page_referrer:''})
 assert.deepEqual(safeAttribution('', 'https://akronlogistics.cz/admin?token=secret','https://akronlogistics.cz'),{page_referrer:''})
})
