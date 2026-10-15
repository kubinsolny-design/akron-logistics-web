import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import Module from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Isolated render fixtures: no real credentials, network, or database writes.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixture = ['Úvodní stránka', 'Přepravní možnosti', 'Přeprava', 'Spolupráce', 'Ochrana osobních údajů', 'Cookies'].map((title, i) => ({ id: i === 0 ? 'page-home' : `page-${i}`, kind: 'page', revision: 1, data: { title, sections: [{ heading: 'Ukázková sekce' }], slug: { current: i === 0 ? 'home' : `stranka-${i}` } } }))
fixture.push({ id: 'site-settings', kind: 'settings', revision: 1, data: { name: 'AKRON Logistics' } })
const cache = new Map()
function load(file) {
  if (cache.has(file)) return cache.get(file).exports
  const mod = new Module(file)
  cache.set(file, mod)
  mod.filename = file
  mod.paths = Module._nodeModulePaths(path.dirname(file))
  const normalRequire = mod.require.bind(mod)
  mod.require = request => {
    if (request === './records') return { AdminRecords: () => null }
    if (request === './actions') return { signOut: () => {} }
    if (request === './auth-shell') return { AuthShell: () => null }
    if (request === './login-form') return { LoginForm: () => null }
    if (request === '../../supabase/browser') return { browserClient: () => { throw new Error('Network is disabled in design fixtures') } }
    if (request === '../../supabase/config') return { supabaseEnabled: () => true }
    if (request === '../../supabase/server') return { currentMember: async () => ({ user: { id: 'fixture', email: 'ukazka@akronlogistics.cz' }, role: 'admin', client: { from: () => ({ select: () => ({ order: async () => ({ data: fixture }) }) }) } }) }
    if (request === '../../sanity/client') return { imageUrl: () => undefined }
    if (request === 'next/image') return { __esModule: true, default: props => React.createElement('img', props) }
    if (request.endsWith('.css')) return {}
    if (request.startsWith('./')) { const base = path.resolve(path.dirname(file), request); return load(base + (fs.existsSync(base + '.tsx') ? '.tsx' : '.ts')) }
    return normalRequire(request)
  }
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file)
  return mod.exports
}
const { AdminPanel, Fields, PageEditor } = load(path.join(root, 'app/admin/panel.tsx'))
const render = role => renderToStaticMarkup(React.createElement(AdminPanel, { documents: fixture, role, userId: 'fixture', email: 'ukazka@akronlogistics.cz' }))

test('admin header uses the exact shared favicon asset instead of a font glyph', async () => {
  const { default: AdminPage } = load(path.join(root, 'app/admin/page.tsx'))
  const html = renderToStaticMarkup(await AdminPage({ searchParams: Promise.resolve({}) }))
  assert.match(html, /<img[^>]*class="admin-brand-mark"[^>]*src="\/icon\.svg"/)
  assert.doesNotMatch(html, /↗|admin-brand-mark[^>]*>A/)
})

test('page editor opens the first section and keeps technical options out of everyday fields', () => {
  const value = { title: 'Úvod', slug: { current: 'home' }, seoTitle: 'SEO title', sections: [{ _key: 'hero', layout: 'hero', heading: 'První nadpis', description: 'Popis', imagePath: '/images/trucks-highway.png', actions: [{ _key: 'action', label: 'Poptat', href: '/spoluprace' }] }, { _key: 'second', layout: 'text', heading: 'Druhá sekce' }] }
  const before = JSON.stringify(value)
  const html = renderToStaticMarkup(React.createElement(PageEditor, { value, onChange: () => {}, disabled: false, onUpload: async () => {} }))
  assert.match(html, /aria-label="Sekce vybrané stránky"/)
  assert.match(html, />První nadpis<\/textarea>/)
  assert.doesNotMatch(html, />Druhá sekce<\/textarea>/)
  assert.match(html, /<details open="" class="admin-item"/)
  assert.match(html, /<summary>Pokročilé nastavení<\/summary>/)
  assert.match(html, /<summary>SEO, adresa stránky a sdílení<\/summary>/)
  assert.equal(JSON.stringify(value), before, 'displaying simplified fields must not rewrite stored content')
})
test('simplified legal pages retain the document editor and read-only restrictions', () => {
  const { initialLegalPages } = load(path.join(root, 'sanity/legal-defaults.ts'))
  for (const value of initialLegalPages) {
    const html = renderToStaticMarkup(React.createElement(PageEditor, { value, onChange: () => {}, disabled: true, onUpload: async () => {} }))
    assert.match(html, /Text stránky — dokumentový editor/)
    assert.match(html, /aria-readonly="true"/)
    assert.doesNotMatch(html, /Sekce vybrané stránky/)
  }
})

test('overview is reserved for later and contains no content or settings cards', () => {
  const html = render('admin')
  assert.match(html, /Obsah tohoto přehledu doplníme později/)
  assert.doesNotMatch(html, /admin-shortcuts|admin-overview-pages|admin-howto/)
  assert.match(html, /Soubory/)
  assert.match(html, /Analytika/)
  assert.match(html, /Aktivita/)
  assert.match(html, /Administrace/)
  assert.doesNotMatch(html, /Nové poptávky: \d/)
})
test('viewer has no inquiries, user management, audit, or publish actions', () => {
  const html = render('viewer')
  assert.doesNotMatch(html, /> Poptávky</)
  assert.doesNotMatch(html, /> Administrace<|> Aktivita</)
  assert.doesNotMatch(html, /onClick|<button[^>]*>Publikovat na web/)
  assert.match(html, /Pouze náhled/)
})
test('editor sees inquiry entry but no role management or audit', () => {
  const html = render('editor')
  assert.match(html, /> Poptávky</)
  assert.doesNotMatch(html, /> Administrace<|> Aktivita</)
})
test('account and logout live in the sidebar footer', () => {
  const html = render('admin')
  assert.match(html, /admin-sidebar-account[\s\S]*ukazka@akronlogistics.cz[\s\S]*Odhlásit se[\s\S]*<\/aside>/)
})

test('sidebar no longer contains the publishing notice', () => {
  for (const role of ['admin', 'editor', 'viewer']) assert.doesNotMatch(render(role), /admin-sidebar-note|Změny máte pod kontrolou|Uložený koncept není veřejný/)
})
test('admin navigation follows the requested workspace order', () => {
  const html = render('admin')
  const labels = ['Obsah stránek', 'Poptávky', 'Soubory', 'Analytika', 'Nastavení webu', 'Aktivita', 'Administrace']
  let previous = -1
  for (const label of labels) { const index = html.indexOf(` ${label}`); assert.ok(index > previous, label); previous = index }
})
test('public media references are deduplicated and unsafe links omitted', () => {
  const { referencedMedia, mediaUploadPath } = load(path.join(root, 'app/admin/media.ts'))
  const files = referencedMedia([{ data: { image: { url: 'https://example.com/photo.png' }, imagePath: '/images/map.svg', action: { href: 'https://example.com/brochure.pdf' }, bad: { href: 'javascript:alert(1).pdf' } } }])
  assert.equal(files.length, 3)
  assert.ok(files.some(file => file.url.endsWith('brochure.pdf')))
  assert.equal(mediaUploadPath({ name: '../Český obrázek.jpeg', type: 'image/jpeg' }, 'fixture'), 'fixture--Cesky-obrazek.jpg')
  assert.throws(() => mediaUploadPath({ name: 'script.svg', type: 'image/svg+xml' }, 'fixture'))
})

test('only the opted-in top-level body uses the document editor; other fields stay structured', () => {
  const { initialLegalPages } = load(path.join(root, 'sanity/legal-defaults.ts'))
  for (const page of initialLegalPages) {
    const html = renderToStaticMarkup(React.createElement(Fields, { value: page, documentBody: true, disabled: false, onChange: () => {} }))
    assert.match(html, /Text stránky — dokumentový editor/)
    assert.doesNotMatch(html, /Obsah odstavce 1/)
    const structured = renderToStaticMarkup(React.createElement(Fields, { value: page, disabled: false, onChange: () => {} }))
    assert.doesNotMatch(structured, /admin-document-paper/)
  }
  const html = renderToStaticMarkup(React.createElement(Fields, { value: initialLegalPages[0], documentBody: true, disabled: true, onChange: () => {} }))
  assert.match(html, /contentEditable="false"/i)
  assert.match(html, /aria-readonly="true"/)
})

test('document conversion retains both legal articles, headings, lists, text, and links', async () => {
  const { initialLegalPages } = load(path.join(root, 'sanity/legal-defaults.ts'))
  const { supportsDocumentEditor, portableTextHtml, readDocument, safeTextLink } = load(path.join(root, 'app/admin/rich-text.ts'))
  assert.equal(safeTextLink('javascript:alert(1)'), false)
  assert.equal(safeTextLink('//example.com'), false)
  assert.equal(safeTextLink('/cookies'), true)
  assert.equal(supportsDocumentEditor([{ _type: 'image' }]), false)
  for (const page of initialLegalPages) { assert.equal(supportsDocumentEditor(page.body), true); assert.match(portableTextHtml(page.body), /<h2/); }
  const packageDir = fs.readdirSync(path.join(root, 'node_modules/.pnpm')).find(name => name.startsWith('jsdom@'))
  if (!packageDir) throw new Error('DOM regression checks require jsdom from the local test dependencies')
  const { JSDOM } = await import(pathToFileURL(path.join(root, 'node_modules/.pnpm', packageDir, 'node_modules/jsdom/lib/api.js')).href)
  const dom = new JSDOM('<div id="editor"></div>')
  const originals = { document: globalThis.document, HTMLElement: globalThis.HTMLElement, Node: globalThis.Node, window: globalThis.window, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT }
  Object.assign(globalThis, { document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, window: dom.window, IS_REACT_ACT_ENVIRONMENT: true })
  try {
    const element = document.getElementById('editor')
    let id = 0
    const semantic = blocks => blocks.map(block => ({ style: block.style, listItem: block.listItem, text: block.children.map(child => child.text).join(''), inline: block.children.map(child => ({ text: child.text, marks: child.marks.map(mark => block.markDefs.find(def => def._key === mark)?.href || mark).sort() })) }))
    for (const page of initialLegalPages) {
      element.innerHTML = portableTextHtml(page.body)
      const result = readDocument(element, page.body, () => `test-${id++}`)
      // DOM serialization may split a span by decorations, so compare text and each character's formatting separately.
      const normalize = blocks => semantic(blocks).map(({ inline, ...block }) => ({ ...block, characters: inline.flatMap(span => [...span.text].map(char => ({ char, marks: span.marks }))) }))
      assert.deepEqual(normalize(result), normalize(page.body))
      assert.equal(supportsDocumentEditor(result), true)
    }
    element.innerHTML = '<h3>Nový nadpis</h3><p>Text <b>tučně</b> <a href="javascript:alert(1)">bez nebezpečného odkazu</a></p><script>alert(1)</script>'
    const changed = readDocument(element, [], () => `test-${id++}`)
    assert.equal(changed.length, 2)
    assert.equal(changed[0].style, 'h3')
    assert.ok(changed[1].children.some(child => child.marks.includes('strong')))
    assert.deepEqual(changed[1].markDefs, [])
    element.innerHTML = 'Začátek <b>tučně</b> konec'
    assert.equal(readDocument(element, []).length, 1)
    const wrappedList = document.createElement('p'), ul = document.createElement('ul'), li = document.createElement('li')
    li.textContent = 'Seznam'; ul.append(li); wrappedList.append(ul); element.replaceChildren(wrappedList)
    const list = readDocument(element, [])
    assert.equal(list.length, 1)
    assert.equal(list[0].listItem, 'bullet')
    assert.equal(list[0].level, 1)
    assert.equal(supportsDocumentEditor(list), true)
    const { createRoot } = await import('react-dom/client')
    const { DocumentEditor } = load(path.join(root, 'app/admin/document-editor.tsx'))
    let saved
    function ControlledFixture() {
      const [body, setBody] = React.useState(initialLegalPages[0].body)
      return React.createElement(DocumentEditor, { value: body, disabled: false, onChange: next => { saved = next; setBody(next) } })
    }
    const container = document.createElement('div'); document.body.append(container)
    const reactRoot = createRoot(container)
    await act(async () => reactRoot.render(React.createElement(ControlledFixture)))
    const editable = container.querySelector('[contenteditable="true"]')
    assert.match(editable.textContent, /Co jsou cookies/)
    await act(async () => { editable.innerHTML = '<h3>Upravený nadpis</h3><p>Nový odstavec</p>'; editable.dispatchEvent(new dom.window.Event('input', { bubbles: true })) })
    assert.equal(saved[0].style, 'h3')
    assert.equal(saved[1].children[0].text, 'Nový odstavec')
    assert.equal(editable.textContent, 'Upravený nadpisNový odstavec', 'React must not restore the initial article after each keystroke')
    await act(async () => reactRoot.unmount())
  } finally { Object.assign(globalThis, originals); dom.window.close() }
})

if (process.argv.includes('--preview')) {
  ;(async () => {
    const page = load(path.join(root, 'app/admin/page.tsx'))
    const markup = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({}) }))
    const font = fs.readFileSync(path.join(root, 'app/fonts/static/Poppins-Regular.ttf')).toString('base64')
    const css = fs.readFileSync(path.join(root, 'app/admin/admin.css'), 'utf8')
    const output = path.resolve(root, '../admin-design-preview.html')
    fs.writeFileSync(output, `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AKRON — vizuální náhled administrace</title><style>@font-face{font-family:Poppins;src:url(data:font/ttf;base64,${font})}body{margin:0;line-height:1.45}a{color:inherit;text-decoration:none}:root{--font-poppins:Poppins}${css}.design-preview-notice{background:#e7edf3;padding:8px 16px;text-align:center;font:11px Arial;color:#415366}</style></head><body><div class="design-preview-notice">Vizuální náhled · ukázkový obsah · bez připojení k databázi · tlačítka nejsou aktivní</div>${markup}</body></html>`)
    console.log(`Visual preview: ${output}`)
  })().catch(error => { console.error(error); process.exitCode = 1 })
}
