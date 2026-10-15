import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const compile=path=>ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const links={}, text={}, normalizer={}
const contact={}
vm.runInNewContext(compile('../app/public-contact.ts'),{exports:contact})
vm.runInNewContext(compile('../app/public-links.ts'),{exports:links})
vm.runInNewContext(compile('../app/site-text.ts'),{exports:text})
vm.runInNewContext(compile('../app/admin/handover-content.ts'),{exports:normalizer,require:name=>name==='../public-links'?links:name==='../public-contact'?contact:text})
test('handover materializes current public defaults without mutating source or draft data',()=>{
  const source={_id:'old',slug:{current:'spoluprace'},title:'Spolupráce a poptávka',sections:[{heading:'Keep content',actions:[{label:'Poptat',href:'/spoluprace#poptavka'}]}]}
  const result=normalizer.editableDocument(source,'page')
  assert.equal(result.title,'Kontakt');assert.equal(result.slug.current,'spoluprace');assert.equal(result.sections[0].heading,'Keep content')
  assert.equal(result.sections[0].actions[0].href,'/kontakt#poptavka');assert.equal(source.title,'Spolupráce a poptávka')
  const settings=normalizer.editableDocument({name:'AKRON',navigation:[{label:'Spolupráce',href:'/spoluprace'}],inquiryEmail:'private@example.com'},'settings')
  assert.equal(settings.navigation[0].label,'Kontakt');assert.equal(settings.formText.phone,'Telefon');assert.equal(settings.siteText.loading,'Nakládka');assert.equal('inquiryEmail' in settings,false)
})
test('options photos are explicit editable fields, preserving approved copy',()=>{
  const page=normalizer.editableDocument({slug:{current:'moznosti'},sections:[{layout:'hero',heading:'Keep'},{layout:'text',description:'Keep copy'},{layout:'text',anchor:'smery',description:'Keep directions'}]},'page')
  assert.equal(page.sections[0].imagePath,'/images/trucks-highway.png');assert.equal(page.sections[1].imagePath,'/images/logistics-coordination.jpg')
  assert.equal(page.sections[2].imagePath,undefined);assert.equal(page.sections[1].description,'Keep copy')
})
for(const role of [null,'viewer','editor']) test(`privileged trash actions reject ${role} without database or storage access`,async()=>{
  const out={}
  vm.runInNewContext(compile('../app/admin/manage-actions.ts'),{exports:out,require:()=>({currentMember:async()=>role?{role,client:new Proxy({},{get:()=>assert.fail('unauthorized database access')})}:null,serviceClient:()=>assert.fail('unauthorized service access')})})
  assert.equal((await out.trashRecord('member','00000000-0000-0000-0000-000000000001')).ok,false)
  assert.equal((await out.trashMedia('fixture.png')).ok,false)
  assert.equal((await out.restoreMedia('00000000-0000-0000-0000-000000000001')).ok,false)
})
test('invalid media paths never reach privileged storage',async()=>{
  const out={}
  vm.runInNewContext(compile('../app/admin/manage-actions.ts'),{exports:out,require:()=>({currentMember:async()=>({role:'admin',client:{rpc:()=>assert.fail('invalid path reached DB')}}),serviceClient:()=>assert.fail('invalid path reached storage')})})
  for(const path of ['../private.png','/root.png','https://evil.test/pic.png','fixture.png?x','a/../b.png'])assert.equal((await out.trashMedia(path)).ok,false)
})
