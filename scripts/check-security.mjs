// Read-only live smoke check. No sign-in, email, account changes or business writes.
// Public browser configuration is used only as an anonymous caller and never printed.
import assert from 'node:assert/strict'

const origin = new URL(process.argv[2] || 'https://akronlogistics.cz').origin
assert.ok(['https://akronlogistics.cz', 'https://akron-logistics-web.vercel.app'].includes(origin), 'Use an approved AKRON origin')
async function read(path, init) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(20_000), ...init })
  return { response, body: await response.text() }
}
function noSecrets(source) {
  assert.doesNotMatch(source, /sb_secret_[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'A private credential appears in a public response')
  for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    let payload
    try { payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString()) } catch { continue }
    assert.notEqual(payload.role, 'service_role', 'A privileged JWT appears in a public response')
  }
}
const texts = []
for (const path of ['/', '/admin', '/admin/accept', '/admin/forgot-password']) {
  const { response, body } = await read(path)
  assert.equal(response.status, 200, `${path} must render`)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN')
  const csp = response.headers.get('content-security-policy') || ''
  for (const directive of ["base-uri 'self'", "object-src 'none'", "frame-ancestors 'self'"]) assert.ok(csp.includes(directive), 'Missing CSP baseline')
  assert.ok(!response.headers.get('access-control-allow-origin'), 'No wildcard CORS on admin HTML')
  assert.ok(!response.headers.get('x-powered-by'), 'Framework banner must be disabled')
  noSecrets(body)
  texts.push(body)
  if (path.startsWith('/admin')) {
    assert.match(response.headers.get('cache-control') || '', /no-store/, 'Admin must not be publicly cached')
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/)
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
    assert.doesNotMatch(body, /admin-sidebar-account|cms_drafts"\s*:|spam_fingerprint/, 'Anonymous HTML includes protected admin content')
  }
  console.log(`PASS ${path}: anonymous rendering, headers and public payload`)
}
// Read only script URLs actually referenced by the public HTML, never guessed private files.
const scripts = new Set(texts.flatMap(body => [...body.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'))))
for (const path of scripts) {
  const url = new URL(path, origin)
  assert.equal(url.origin, origin, 'Unexpected third-party script on anonymous auth pages')
  assert.ok(url.pathname.startsWith('/_next/static/'), 'Unexpected script path')
  const { response, body } = await read(url.href)
  assert.equal(response.status, 200, 'Public JavaScript must load')
  noSecrets(body); texts.push(body)
}
const source = texts.join('\n')
const publicKey = source.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0]
assert.ok(publicKey, 'Expected public Supabase configuration not found; anonymous DB checks were NOT performed')
const databaseOrigin = 'https://htgwzjcdxbknzvobwioa.supabase.co'
async function database(path, init) {
  const response = await fetch(databaseOrigin + path, { ...init, headers: { apikey: publicKey, 'Content-Type': 'application/json', ...init?.headers }, signal: AbortSignal.timeout(15_000) })
  return { response, body: await response.text() }
}
for (const table of ['cms_members', 'cms_drafts', 'cms_inquiries', 'cms_activity', 'cms_inquiry_settings', 'cms_content_backups', 'cms_media_trash', 'cms_recovery_limits']) {
  const { response, body } = await database(`/rest/v1/${table}?select=*&limit=1`)
  // A denied grant or an empty result protected by RLS are both safe outcomes.
  assert.ok([401, 403].includes(response.status) || response.status === 200 && body.trim() === '[]', `Anonymous access to ${table} is not denied`)
  console.log(`PASS anonymous access denied/empty: ${table}`)
}
// This RPC only reads member metadata; no mutation or email operation is invoked.
const members = await database('/rest/v1/rpc/cms_list_members', { method: 'POST', body: '{}' })
assert.ok([401, 403].includes(members.response.status), 'Anonymous member-list RPC must be denied')
const trash = await database('/storage/v1/object/list/site-media-trash', { method: 'POST', body: JSON.stringify({ prefix: '', limit: 1 }) })
assert.ok([400, 401, 403, 404].includes(trash.response.status) || trash.response.status === 200 && trash.body.trim() === '[]', 'Private trash is not protected')
const crossOrigin = await read('/api/draft-mode/enable', { method: 'POST', headers: { Origin: 'https://outside.example.invalid' } })
const anonymousPreview = await read('/api/draft-mode/enable', { method: 'POST', headers: { Origin: origin } })
const legacyPreview = await read('/api/draft-mode/enable')
if (crossOrigin.response.status === 200 && crossOrigin.body.includes('<h1>Připravujeme</h1>')) {
  for (const result of [crossOrigin, anonymousPreview, legacyPreview]) {
    assert.match(result.body, /<h1>Připravujeme<\/h1>/)
    assert.ok(!result.response.headers.get('set-cookie'), 'Closed preview API must not set cookies')
  }
  console.log('PASS canonical prelaunch gate closes the preview API (test the review host too)')
} else {
  assert.equal(crossOrigin.response.status, 403, 'Preview must reject cross-origin POST')
  assert.equal(anonymousPreview.response.status, 401, 'Preview must require an active member')
  assert.equal(legacyPreview.response.status, 410, 'Legacy GET must not enable preview')
}
for (const path of ['/.env', '/.env.local', '/.git/config']) {
  const { body } = await read(path)
  noSecrets(body)
  assert.doesNotMatch(body, /\[core\]|^\s*(?:SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY)\s*=/m, 'Private file contents are served')
}
console.log(`PASS ${scripts.size} public JS bundles: no privileged key/JWT pattern`)
console.log('PASS private Storage listing, member RPC, preview auth/CSRF and private-file checks')
console.log('LIMIT: this smoke check is not a full penetration test or a live database configuration/advisors audit.')
