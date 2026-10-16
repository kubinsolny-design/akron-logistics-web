import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=name=>fs.readFileSync(new URL('../app/'+name,import.meta.url),'utf8')
test('mobile header remains sticky and colour notes keep their background edge-to-edge',()=>{
 const css=read('final-polish.css')
 assert.match(css,/\.site-header \{ position: sticky; top: 0;/)
 assert.match(css,/\.note-block\.shell \{ width: 100%; max-width: none; margin: 0 auto 70px;/)
 assert.match(css,/\.closing-strip > \.shell \{ display: flex; flex-direction: column;/)
})
test('footer credit is last, separated from text-only legal links',()=>{
 const ui=read('ui.tsx'),css=read('final-polish.css')
 assert.ok(ui.indexOf('footer-credit-row')>ui.indexOf('footer-legal'))
 assert.match(css,/\.footer-credit-row \{[^}]*border-top:/)
 assert.match(css,/\.footer-legal a, \.footer-legal button \{[^}]*border: 0;[^}]*background: none;/)
 assert.match(css,/\.footer-legal \{ display: grid; grid-template-columns:/)
})
test('contact retains full accessible email with a shorter mobile label; native date stays contained',()=>{
 assert.match(read('cms-page.tsx'),/aria-label=\{`E-mail: \$\{settings.email\}`\}/)
 const css=read('final-polish.css')
 assert.match(css,/\.personal-contact \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
 assert.match(css,/\.form-grid label, \.form-grid input, \.form-grid select, \.form-grid textarea \{ min-width: 0;/)
 assert.match(css,/\.form-action > \.button \{[^}]*margin: 18px auto 0;/)
})
test('truck endpoint accounts for its own width, destination circle and an eight-pixel gap',()=>{
 const css=read('globals.css')
 assert.match(css,/left: calc\(93% - 34px - var\(--route-truck-width\) - 8px\)/)
 assert.match(css,/left: calc\(94% - 34px - var\(--route-truck-width, 145px\) - 8px\)/)
 for(const width of [284,354,394]){
  const truckLeft=.93*width-34-75-8
  const destinationLeft=.93*width-34
  assert.equal(Math.round(destinationLeft-(truckLeft+75)),8)
  assert.ok(truckLeft>0)
 }
})
