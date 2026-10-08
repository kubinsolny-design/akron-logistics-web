import assert from 'node:assert/strict'

// Fetch the Vercel host while independently verifying the canonical domain.
const base = new URL(process.argv[2] ?? 'http://localhost:3003').origin
const canonicalOrigin = new URL(process.env.SEO_CANONICAL_ORIGIN || base).origin
const production = process.env.SEO_EXPECT_INDEX !== 'false'
const required = ['/', '/preprava', '/moznosti', '/spoluprace', '/ochrana-osobnich-udaju', '/cookies']
const titles = new Set(), descriptions = new Set(), images = new Set(), internalLinks = new Set()
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2].replace(/&amp;/g, '&')]))
}
async function load(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`)
  return response
}
const sitemap = await (await load('/sitemap.xml')).text()
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]))
assert.equal(new Set(urls.map(u => u.href)).size, urls.length, 'sitemap: duplicates')
for (const path of required) assert.ok(urls.some(u => u.origin === canonicalOrigin && u.pathname === path), `sitemap: missing ${path}`)
for (const url of urls) {
  assert.equal(url.origin, canonicalOrigin, 'sitemap: incorrect host')
  assert.doesNotMatch(url.pathname, /^\/(admin|studio|api|og)(\/|$)/, 'sitemap: non-page route')
  const path = url.pathname
  const html = await (await load(path)).text()
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => attrs(m[0]))
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0]))
  const get = name => meta.find(m => m.name === name || m.property === name)?.content
  assert.equal(links.find(l => l.rel === 'canonical')?.href?.replace(/\/$/, ''), url.href.replace(/\/$/, ''), `${path}: incorrect canonical`)
  const title = html.match(/<title>(.*?)<\/title>/)?.[1]
  assert.ok(title && !titles.has(title) && title.includes('AKRON Logistics'), `${path}: missing/duplicate title or brand`)
  titles.add(title)
  assert.ok(get('description') && !descriptions.has(get('description')), `${path}: missing/duplicate description`)
  descriptions.add(get('description'))
  for (const field of ['og:title','og:description','og:url','og:image','twitter:title','twitter:description','twitter:image']) assert.ok(get(field), `${path}: missing ${field}`)
  assert.equal(get('twitter:card'), 'summary_large_image')
  assert.equal(new URL(get('og:url')).pathname, path)
  assert.equal(new URL(get('og:url')).origin, canonicalOrigin)
  const image = new URL(get('og:image'), canonicalOrigin)
  images.add(image.href)
  const response = image.origin === canonicalOrigin ? await load(image.pathname + image.search) : await fetch(image, { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, `${path}: sharing image unavailable`)
  assert.match(response.headers.get('content-type') || '', /^image\//)
  if (image.pathname.startsWith('/og/')) {
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10])
    assert.equal(bytes.readUInt32BE(16), 1200)
    assert.equal(bytes.readUInt32BE(20), 630)
  }
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${path}: expected one H1`)
  assert.ok(html.includes('<html lang="cs"'), `${path}: missing Czech language`)
  assert.ok(links.some(l => l.rel === 'icon') && links.some(l => l.rel === 'apple-touch-icon'))
  assert.ok(production ? !get('robots')?.includes('noindex') : get('robots')?.includes('noindex'), `${path}: wrong indexing directive`)
  const graph = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m => JSON.parse(m[1])['@graph'] || [])
  for (const type of ['Organization', 'WebSite', 'WebPage', ...(path !== '/' ? ['BreadcrumbList'] : [])]) assert.ok(graph.some(n => n['@type'] === type), `${path}: missing ${type}`)
  for (const tag of html.matchAll(/<a\b[^>]*>/g)) {
    const href = attrs(tag[0]).href
    if (!href) continue
    const target = new URL(href, canonicalOrigin)
    if ([canonicalOrigin, base].includes(target.origin) && !/^\/(api|admin|studio)(\/|$)/.test(target.pathname)) internalLinks.add(target.pathname)
  }
  console.log(`PASS ${path}: metadata, canonical, OG image, H1, JSON-LD, indexing`)
}
assert.ok(images.size >= required.length, 'expected distinct sharing images for all standard pages')
const lines = (await (await load('/robots.txt')).text()).split(/\r?\n/).map(line => line.trim())
assert.ok(lines.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`))
assert.ok(production ? lines.includes('Allow: /') && !lines.includes('Disallow: /') : lines.includes('Disallow: /'), 'robots: incorrect policy')
for (const path of internalLinks) await load(path)
for (const path of ['/admin', '/admin/accept']) {
  const response = await load(path)
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/)
  assert.match(await response.text(), /name="robots" content="[^"]*noindex/)
}
for (const [path, type] of [['/icon.svg','image/svg+xml'],['/favicon.png','image/png'],['/apple-icon','image/png']]) assert.ok((await load(path)).headers.get('content-type')?.includes(type))
assert.equal((await fetch(`${base}/neexistujici-stranka-seo-test`, { signal: AbortSignal.timeout(30000) })).status, 404)
console.log(`PASS sitemap, robots, ${internalLinks.size} internal link targets, icons, private routes and HTTP 404`)
