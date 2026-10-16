import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const root=fileURLToPath(new URL('../',import.meta.url))
const compile=file=>ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
const manifest={},client={}
vm.runInNewContext(compile('content/migrated-media.ts'),{exports:manifest})
vm.runInNewContext(compile('content/client.ts'),{exports:client,URL,process:{env:{}},require:name=>name==='./migrated-media'?manifest:{safePublicHref:value=>value}})

test('every legacy image identifier resolves to an existing own file without a network client',()=>{
  assert.equal(Object.keys(manifest.migratedMedia).length,5)
  for(const [reference,target] of Object.entries(manifest.migratedMedia)){
    assert.equal(client.imageUrl({asset:{_ref:reference}}),target)
    assert.ok(fs.existsSync(path.join(root,'public',target)),target)
  }
  assert.equal(client.imageUrl({asset:{_ref:'image-unknown-100x100-png'}}),undefined)
  assert.equal(client.imageUrl({url:'/images/akron-white.svg',asset:{_ref:'image-unknown'}}),'/images/akron-white.svg')
})
test('images and gallery URLs permit only deployment files and the own public Storage bucket',()=>{
  for(const url of ['/images/trucks-highway.png','https://htgwzjcdxbknzvobwioa.supabase.co/storage/v1/object/public/site-media/own.jpg'])assert.equal(client.ownedMediaUrl(url),url)
  for(const url of ['https://cdn.sanity.io/images/l802e097/production/old.png','https://example.com/image.jpg','//example.com/image.jpg','/images/../private.jpg','https://user@htgwzjcdxbknzvobwioa.supabase.co/storage/v1/object/public/site-media/own.jpg','https://htgwzjcdxbknzvobwioa.supabase.co/storage/v1/object/public/other/private.pdf'])assert.equal(client.ownedMediaUrl(url),undefined,url)
})
test('runtime code has no retired SDK, API, credentials or fallback storage',()=>{
  function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):/\.(?:tsx?|mjs)$/.test(entry.name)?[path.join(dir,entry.name)]:[])}
  for(const file of [...walk(path.join(root,'app')),...walk(path.join(root,'content')),...fs.readdirSync(path.join(root,'supabase')).filter(name=>name.endsWith('.ts')).map(name=>path.join(root,'supabase',name))]){
    const source=fs.readFileSync(file,'utf8')
    assert.doesNotMatch(source,/(?:from|import\s*)\s*['"](?:next-sanity|sanity|@sanity\/)|process\.env\.[A-Z_]*SANITY|https:\/\/[^\s'"]*(?:api|cdn)\.sanity\.io/,file)
  }
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))
  assert.ok(!Object.keys(pkg.dependencies).some(name=>name==='sanity'||name==='next-sanity'||name.startsWith('@sanity/')))
  assert.doesNotMatch(pkg.scripts['build:admin-preview'],/import/)
})
function previewFixture(member){
  const exported={},events=[]
  vm.runInNewContext(compile('app/api/draft-mode/enable/route.ts'),{exports:exported,URL,Response,require:name=>{
    if(name==='next/headers')return{draftMode:async()=>({enable:()=>events.push('cookie')})}
    if(name.includes('/server'))return{currentMember:async()=>member}
    if(name.includes('/content'))return{readDocument:async()=>{events.push('read');return{title:'Draft'}}}
    throw new Error(name)
  }})
  return{...exported,events}
}
test('retired GET cannot enable preview; POST checks origin, membership and local path',async()=>{
  const request=(origin,path)=>({url:'https://akronlogistics.cz/api/draft-mode/enable',headers:new Headers(origin?{origin}:{}),formData:async()=>new Map([['path',path]])})
  const anonymous=previewFixture(null)
  assert.equal(anonymous.GET().status,410)
  assert.equal((await anonymous.POST(request('https://akronlogistics.cz','/'))).status,401)
  assert.equal(anonymous.events.length,0)
  const member=previewFixture({role:'editor'})
  assert.equal((await member.POST(request('https://evil.test','/'))).status,403)
  assert.equal((await member.POST(request('https://akronlogistics.cz','//evil.test'))).status,400)
  assert.equal(member.events.length,0)
  const response=await member.POST(request('https://akronlogistics.cz','/kontakt'))
  assert.equal(response.status,303)
  assert.equal(response.headers.get('location'),'https://akronlogistics.cz/kontakt')
  assert.deepEqual(member.events,['read','cookie'])
})
