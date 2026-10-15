import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const cache = new Map()
function load(relative) {
  const file = new URL(relative, import.meta.url).pathname
  if (cache.has(file)) return cache.get(file).exports
  const mod = new Module(file); cache.set(file, mod)
  mod.paths = Module._nodeModulePaths(file.slice(0, file.lastIndexOf('/')))
  const fallback = mod.require.bind(mod)
  mod.require = request => {
    if (request === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }
    if (request === 'next/image') return { __esModule: true, default: props => { const image = { ...props }; delete image.fill; delete image.priority; return React.createElement('img', image) } }
    if (request === '../sanity/client') return { imageUrl: () => undefined, safeHref: value => load('../app/public-links.ts').publicHref(value || '#') }
    if (request === './ui') return { RouteJourney: () => React.createElement('div', { className: 'route-journey' }) }
    if (request === './cookie-preferences') return { CookieSettingsButton: () => null }
    if (request === './actions') return { sendInquiry: async () => ({ status: 'idle', message: '' }) }
    if (request === '../app/site') return { company: {} }
    if (request.startsWith('./')) return load(`../app/${request.slice(2)}.${fs.existsSync(new URL(`../app/${request.slice(2)}.tsx`, import.meta.url)) ? 'tsx' : 'ts'}`)
    return fallback(request)
  }
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, file)
  return mod.exports
}
test('live contact replaces legacy mentions and mailto links without changing drafts or other addresses', () => {
  const { withPublicContact } = load('../app/public-contact.ts')
  const stored = { body: [{ text: 'info@akronlogistics.cz', href: 'mailto:info@akronlogistics.cz' }, { text: 'adam.bartusek@akronlogistics.cz' }, { text: 'other@example.com' }] }
  const shown = withPublicContact(stored, 'dispatch@example.com')
  assert.equal(shown.body[0].href, 'mailto:dispatch@example.com')
  assert.equal(shown.body[1].text, 'dispatch@example.com')
  assert.equal(shown.body[2].text, 'other@example.com')
  assert.equal(stored.body[0].text, 'info@akronlogistics.cz')
})
test('contact URLs preserve anchors and external links are not rewritten', () => {
  const { publicHref, publicNavigationLabel } = load('../app/public-links.ts')
  assert.equal(publicHref('/spoluprace#poptavka'), '/kontakt#poptavka')
  assert.equal(publicHref('https://example.com/spoluprace'), 'https://example.com/spoluprace')
  assert.equal(publicNavigationLabel('Spolupráce', '/spoluprace'), 'Kontakt')
})
test('home hero has exactly one inquiry CTA even with multiple stored CMS actions', () => {
  const { CmsPage } = load('../app/cms-page.tsx')
  for (const imagePath of ['/images/trucks-highway.png', undefined]) {
    const page = { slug: { current: 'home' }, sections: [{ layout: 'hero', heading: 'Přepravu vyřešíme.', imagePath, actions: [{ label: 'Call', href: 'tel:123' }, { label: 'Old', href: '/spoluprace' }] }] }
    const html = renderToStaticMarkup(React.createElement(CmsPage, { page, settings: {} }))
    assert.equal((html.match(/<a /g) || []).length, 1)
    assert.match(html, /class="(?:button|text-link)"/)
    assert.doesNotMatch(html, />Call</)
    assert.match(html, />Old</) // The selected inquiry button label is now editable, not replaced by hardcoded copy.
  }
})
test('options presentation preserves every approved section text and adds existing photos only', () => {
  const { initialPages } = load('../sanity/defaults.ts')
  const page = initialPages.find(page => page.slug.current === 'moznosti')
  const before = JSON.stringify(page)
  const { CmsPage } = load('../app/cms-page.tsx')
  const html = renderToStaticMarkup(React.createElement(CmsPage, { page, settings: {} }))
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  for (const section of page.sections) for (const key of ['heading', 'description', 'eyebrow']) if (section[key]) assert.ok(html.includes(escape(section[key])), key)
  assert.match(html, /page-hero-visual/)
  assert.match(html, /logistics-coordination.jpg/)
  assert.equal(JSON.stringify(page), before)
})
test('form requires phone but not email, keeping privacy acknowledgment required', () => {
  const { InquiryForm } = load('../app/inquiry-form.tsx')
  const html = renderToStaticMarkup(React.createElement(InquiryForm))
  const input = name => html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] || ''
  assert.match(input('phone'), /required=""/)
  assert.match(input('phone'), /type="tel"/)
  assert.match(input('email'), /type="email"/)
  assert.doesNotMatch(input('email'), /required/)
  assert.match(input('privacyAcknowledged'), /required=""/)
})
test('request quota ignores spoofed headers outside Vercel and hashes trusted IPs', () => {
  const { requestFingerprint } = load('../app/request-fingerprint.ts')
  const a = new Headers({ 'x-forwarded-for': '198.51.100.1' })
  const b = new Headers({ 'x-forwarded-for': '198.51.100.2' })
  assert.equal(requestFingerprint(a, 'fixture-secret', false), requestFingerprint(b, 'fixture-secret', false))
  assert.notEqual(requestFingerprint(a, 'fixture-secret', true), requestFingerprint(b, 'fixture-secret', true))
  assert.match(requestFingerprint(a, 'fixture-secret', true), /^[a-f0-9]{64}$/)
})
test('public and editor links reject script, protocol-relative, control and backslash URLs', () => {
  const { safePublicHref } = load('../app/public-links.ts')
  const { safeTextLink } = load('../app/admin/rich-text.ts')
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '//example.com', '/\\example.com', 'java\nscript:alert(1)', '/\u0000test']) {
    assert.equal(safePublicHref(value), '#', value)
    assert.equal(safeTextLink(value), false, value)
  }
  assert.equal(safePublicHref('/spoluprace#poptavka'), '/kontakt#poptavka')
  assert.equal(safePublicHref('tel:+420606187648'), 'tel:+420606187648')
})
