import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')
function fixture(){return new JSDOM(`<style>${css}</style><a id="nav" href="/kontakt"><span>Kontakt</span></a><a id="logo" href="/"><img alt="Logo"></a><a id="email" href="mailto:adam.bartusek@akronlogistics.cz">E-mail</a><button id="action"><span>Poptat</span></button><details><summary id="faq">Otázka</summary></details><div id="custom" role="button" tabindex="0">Otevřít</div><input id="submit" type="submit"><button id="disabled" disabled>Čekejte</button><a id="unavailable" href="/" aria-disabled="true">Nedostupné</a><input id="text" type="text"><p id="copy">Běžný text</p>`)}
test('clickable controls explicitly request a hand without altering text inputs',()=>{
  const dom=fixture(), {document,getComputedStyle}=dom.window
  for(const id of ['nav','logo','email','action','faq','custom','submit'])assert.equal(getComputedStyle(document.getElementById(id)).cursor,'pointer',id)
  for(const id of ['disabled','unavailable'])assert.equal(getComputedStyle(document.getElementById(id)).cursor,'not-allowed',id)
  for(const id of ['text','copy'])assert.notEqual(getComputedStyle(document.getElementById(id)).cursor,'pointer',id)
  dom.window.close()
})
test('nested labels and images inherit their clickable parent cursor',()=>{
  const dom=fixture()
  for(const selector of ['#nav span','#logo img','#action span'])assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector(selector)).cursor,'inherit',selector)
  dom.window.close()
})
