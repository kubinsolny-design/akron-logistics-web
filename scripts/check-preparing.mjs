import assert from 'node:assert/strict'

const base = new URL(process.argv[2] || 'http://localhost:8877').origin
for (const path of ['/', '/preprava', '/moznosti', '/spoluprace', '/cookies', '/ochrana-osobnich-udaju', '/nova-stranka', '/og/home', '/api/draft-mode/enable']) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(20000) })
  assert.equal(response.status, 200, path)
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/, path)
  assert.match(response.headers.get('cache-control') || '', /no-store/, path)
  const html = await response.text()
  assert.match(html, /<h1>Připravujeme<\/h1>/, path)
  assert.doesNotMatch(html, /<form|Přepravu vyřešíme|<script/, path)
  console.log(`PASS ${path}: preparing, noindex, no-store, no public form`)
}
const post = await fetch(base, { method: 'POST', body: 'test', signal: AbortSignal.timeout(20000) })
assert.match(await post.text(), /<h1>Připravujeme<\/h1>/)
for (const path of ['/admin', '/admin/accept']) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(20000) })
  assert.equal(response.status, 200)
  assert.doesNotMatch(await response.text(), /<h1>Připravujeme<\/h1>/)
}
const robots = await (await fetch(`${base}/robots.txt`)).text()
assert.ok(robots.split(/\r?\n/).includes('Disallow: /'))
assert.doesNotMatch(await (await fetch(`${base}/sitemap.xml`)).text(), /<loc>/)
const logo = await fetch(`${base}/images/akron-white.svg`)
assert.equal(logo.status, 200)
assert.match(logo.headers.get('content-type') || '', /image\/svg\+xml/)
console.log('PASS POST gate, admin routes, robots, empty sitemap and logo')
