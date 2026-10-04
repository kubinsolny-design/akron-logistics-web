import assert from 'node:assert/strict'

const base = (process.argv[2] ?? 'http://localhost:3003').replace(/\/$/, '')
const paths = ['/', '/preprava', '/moznosti', '/spoluprace', '/ochrana-osobnich-udaju', '/cookies']
const titles = new Set()
const descriptions = new Set()
const production = process.env.SEO_EXPECT_INDEX !== 'false'
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2].replace(/&amp;/g, '&')]))
}
async function load(path) {
  const response = await fetch(`${base}${path}`)
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`)
  return response
}
for (const path of paths) {
  const html = await (await load(path)).text()
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => attrs(m[0]))
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0]))
  const get = name => meta.find(m => m.name === name || m.property === name)?.content
  const canonical = links.find(l => l.rel === 'canonical')?.href
  assert.equal(new URL(canonical).pathname, path, `${path}: incorrect canonical`)
  assert.equal(new URL(canonical).origin, new URL(base).origin, `${path}: incorrect canonical host`)
  const title = html.match(/<title>(.*?)<\/title>/)?.[1]
  assert.ok(title && !titles.has(title), `${path}: missing or duplicate title`)
  assert.ok(title.includes('AKRON Logistics'), `${path}: missing brand in title`)
  titles.add(title)
  const description = get('description')
  assert.ok(description && !descriptions.has(description), `${path}: missing or duplicate description`)
  descriptions.add(description)
  for (const field of ['og:title','og:description','og:url','og:image','twitter:title','twitter:description','twitter:image']) assert.ok(get(field), `${path}: missing ${field}`)
  assert.equal(new URL(get('og:url')).pathname, path, `${path}: incorrect OG URL`)
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${path}: expected one H1`)
  assert.ok(html.includes('<html lang="cs"'), `${path}: missing Czech language`)
  assert.ok(links.some(l => l.rel === 'icon') && links.some(l => l.rel === 'apple-touch-icon'), `${path}: missing icons`)
  assert.ok(production ? !get('robots')?.includes('noindex') : get('robots')?.includes('noindex'), `${path}: wrong indexing directive`)
  const schema = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]))
  assert.ok(schema.some(s => s['@graph']?.some(n => n['@type'] === 'Organization' && n.email === 'info@akronlogistics.cz')), `${path}: missing organization`)
  console.log(`PASS ${path}: title, description, canonical, sharing, H1, icons, JSON-LD, robots`)
}
const robots = await (await load('/robots.txt')).text()
assert.ok(robots.includes(`${base}/sitemap.xml`), 'robots: missing sitemap')
assert.ok(production ? robots.includes('Allow: /') && !robots.includes('Disallow: /') : robots.includes('Disallow: /'), 'robots: incorrect policy')
const sitemap = await (await load('/sitemap.xml')).text()
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]))
assert.equal(urls.length, paths.length, 'sitemap: incorrect page count')
for (const path of paths) assert.ok(urls.some(u => u.origin === new URL(base).origin && u.pathname === path), `sitemap: missing ${path}`)
for (const [path, type] of [['/icon.svg','image/svg+xml'],['/favicon.png','image/png'],['/apple-icon','image/png'],['/opengraph-image','image/png']]) {
  const response = await load(path)
  assert.ok(response.headers.get('content-type')?.includes(type), `${path}: wrong content type`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  assert.ok(bytes.length > 100, `${path}: empty image`)
  if (type === 'image/png') assert.deepEqual([...bytes.slice(0,8)], [137,80,78,71,13,10,26,10], `${path}: invalid PNG`)
  console.log(`PASS ${path}: ${type}, ${bytes.length} bytes`)
}
assert.equal((await fetch(`${base}/neexistujici-stranka-seo-test`)).status, 404, 'missing route should return 404')
console.log('PASS sitemap, robots and HTTP 404')
