import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

test('cookie banner has only two consent buttons and a normal details link', () => {
  const file = fileURLToPath(new URL('../app/cookie-preferences.tsx', import.meta.url))
  const component = new Module(file)
  component.paths = Module._nodeModulePaths(file)
  const fallback = component.require.bind(component)
  component.require = name => {
    if (name === 'react') return { useEffect: () => {}, useRef: value => ({ current: value }), useState: () => [false, () => {}], useSyncExternalStore: () => '' }
    if (name === 'next/link') return { __esModule: true, default: props => React.createElement('a', props) }
    if (name === './site-text') return { cookieTextDefaults: { title: 'Vaše soukromí', more: 'Více o cookies' } }
    if (name === './preparing') return { preparing: false }
    if (name === './analytics-config') return { privacyStorageKey: 'akron-privacy-preferences', privacyChangeEvent: 'akron-privacy-change', readPrivacyPreference: () => null }
    return fallback(name)
  }
  component._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file)
  const banner = component.exports.CookiePreferences({}).props.children[0]
  const buttons = banner.props.children[1].props.children.filter(Boolean)
  assert.deepEqual(buttons.map(button => button.props.children), ['Přijmout vše', 'Přijmout nezbytné'])
  const html = renderToStaticMarkup(banner)
  assert.equal((html.match(/<button\b/g) || []).length, 2)
  assert.match(html, /<a href="\/cookies">Více o cookies<\/a>/)
  assert.doesNotMatch(html, /Nastavení cookies|Povolit analytiku/)

  const saved = new Map(['window', 'localStorage', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const values = new Map()
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: () => {}, location: { reload: () => assert.fail('No loaded tag should need a reload') } } })
    Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie: '', getElementById: () => null } })
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: (key, value) => values.set(key, value) } })
    buttons[0].props.onClick()
    assert.equal(JSON.parse(values.get('akron-privacy-preferences')).analytics, true)
    buttons[1].props.onClick()
    assert.equal(JSON.parse(values.get('akron-privacy-preferences')).analytics, false)
  } finally {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

test('mobile banner stacks equal-width buttons and keeps its details link unboxed', () => {
  const css = fs.readFileSync(new URL('../app/legal.css', import.meta.url), 'utf8')
  const polish = fs.readFileSync(new URL('../app/final-polish.css', import.meta.url), 'utf8')
  assert.match(css, /\.cookie-notice a \{ display: inline; padding: 0; border: 0;[^}]*background: none;[^}]*text-decoration: underline;/)
  assert.match(css, /\.cookie-notice \.cookie-actions button \{ min-width: 0; width: 100%;[^}]*white-space: normal;/)
  assert.match(css, /@media \(max-width: 480px\) \{\s*\.cookie-notice \.cookie-actions \{ grid-template-columns: minmax\(0, 1fr\);/)
  assert.doesNotMatch(polish, /\.legal-page a, \.cookie-notice a, \.cookie-dialog a/)
})
