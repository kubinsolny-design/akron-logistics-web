import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import React from 'react'
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
const { AdminPanel } = load(path.join(root, 'app/admin/panel.tsx'))
const render = role => renderToStaticMarkup(React.createElement(AdminPanel, { documents: fixture, role, userId: 'fixture', email: 'ukazka@akronlogistics.cz' }))

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
