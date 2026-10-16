import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const file=new URL('../app/sharing-image.tsx',import.meta.url)
const mod=new Module(fileURLToPath(file));mod.paths=Module._nodeModulePaths(fileURLToPath(new URL('../',file)))
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,fileURLToPath(file))
for(const [name,heading,label,photo] of [
  ['home','Přepravu vyřešíme. Od A do B.','ČESKO A EVROPA','highway'],
  ['kontakt','Od první poptávky až po doručení.','OSOBNÍ KOMUNIKACE','coordination'],
])test(`real ${name} OG image renders local logo, Czech font and photo as a 1200×630 PNG`,async()=>{
  const response=await mod.exports.sharingImage(heading,label,photo)
  assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/png/)
  const bytes=Buffer.from(await response.arrayBuffer())
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10])
  assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630)
  assert.ok(bytes.length<5*1024*1024)
  if(process.env.SEO_IMAGE_OUTPUT_DIR)fs.writeFileSync(path.join(process.env.SEO_IMAGE_OUTPUT_DIR,`akron-og-${name}.png`),bytes)
})
