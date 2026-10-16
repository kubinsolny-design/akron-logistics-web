import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptSession } from '../supabase/accept-session.ts'
import { createBrowserClient } from '@supabase/ssr'

function fixture({ sessionError = null, userError = null, user = { id: 'test' } } = {}) {
  const calls = []
  return {
    calls,
    clear: () => calls.push('clear'),
    auth: {
      setSession: async (tokens) => { calls.push(['session', tokens]); return { error: sessionError } },
      exchangeCodeForSession: async (code) => { calls.push(['code', code]); return { error: sessionError } },
      getUser: async () => { calls.push('user'); return { data: { user }, error: userError } },
      verifyOtp: async (value) => { calls.push(['otp', value]); return { error: sessionError } },
    },
  }
}

test('email invitation stores both tokens then validates the user; URL cleared first', async () => {
  const f = fixture()
  assert.equal(await acceptSession(f.auth, 'https://demo.test/admin/accept#access_token=fixture-access&refresh_token=fixture-refresh&type=invite', f.clear), true)
  assert.deepEqual(f.calls, ['clear', ['session', { access_token: 'fixture-access', refresh_token: 'fixture-refresh' }], 'user'])
})
test('PKCE callbacks remain supported', async () => {
  const f = fixture()
  assert.equal(await acceptSession(f.auth, 'https://demo.test/admin/accept?code=fixture-code', f.clear), true)
  assert.deepEqual(f.calls, ['clear', ['code', 'fixture-code'], 'user'])
})

test('recovery hash is exchanged only by the explicit acceptance operation', async () => {
  const f = fixture(), hash = 'a'.repeat(64)
  assert.equal(await acceptSession(f.auth, `https://demo.test/admin/accept#token_hash=${hash}&type=recovery`, f.clear), true)
  assert.deepEqual(f.calls, ['clear', ['otp', {token_hash: hash, type: 'recovery'}], 'user'])
})

test('expired recovery never falls back to an unrelated existing session', async () => {
  const f = fixture({sessionError: new Error('expired')})
  assert.equal(await acceptSession(f.auth, `https://demo.test/admin/accept#token_hash=${'b'.repeat(64)}&type=recovery`, f.clear), false)
  assert.equal(f.calls.includes('user'), false)
})

for (const suffix of ['#token_hash=invalid&type=recovery', `#token_hash=${'a'.repeat(64)}&type=invite`, `?code=mixed#token_hash=${'a'.repeat(64)}&type=recovery`]) {
  test(`malformed recovery is rejected: ${suffix}`, async () => {
    const f = fixture()
    assert.equal(await acceptSession(f.auth, `https://demo.test/admin/accept${suffix}`, f.clear), false)
    assert.deepEqual(f.calls, ['clear'])
  })
}
test('existing verified session can reopen password setup', async () => {
  const f = fixture()
  assert.equal(await acceptSession(f.auth, 'https://demo.test/admin/accept', f.clear), true)
  assert.deepEqual(f.calls, ['clear', 'user'])
})
for (const suffix of ['#error=access_denied&error_code=otp_expired', '?error=access_denied', '#access_token=incomplete', '#refresh_token=incomplete', '?code=mixed#access_token=a&refresh_token=b']) {
  test(`invalid callback is rejected even with an existing session: ${suffix}`, async () => {
    const f = fixture()
    assert.equal(await acceptSession(f.auth, `https://demo.test/admin/accept${suffix}`, f.clear), false)
    assert.deepEqual(f.calls, ['clear'])
  })
}
test('failed token exchange never shows the password form', async () => {
  const f = fixture({ sessionError: new Error('invalid token') })
  assert.equal(await acceptSession(f.auth, 'https://demo.test/admin/accept#access_token=a&refresh_token=b', f.clear), false)
  assert.equal(f.calls.includes('user'), false)
})
test('server rejection of the user never grants access', async () => {
  const f = fixture({ userError: new Error('not authenticated'), user: null })
  assert.equal(await acceptSession(f.auth, 'https://demo.test/admin/accept#access_token=a&refresh_token=b', f.clear), false)
})

test('installed SSR SDK accepts an implicit invitation and persists SSR cookies', async () => {
  const cookies = new Map()
  const user = { id: 'fixture-user', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.invalid' }
  // Synthetic tokens and a stubbed Auth server only; no real account is touched.
  const jwt = [
    { alg: 'HS256', typ: 'JWT' },
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, aud: user.aud },
  ].map((value) => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.') + '.' + Buffer.from('fixture-signature').toString('base64url')
  let requests = 0
  const client = createBrowserClient('https://fixture.supabase.co', 'fixture-public-key', {
    isSingleton: false,
    auth: { detectSessionInUrl: false, autoRefreshToken: false },
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (values) => values.forEach(({ name, value }) => cookies.set(name, value)),
    },
    global: { fetch: async (input) => {
      assert.equal(new URL(String(input)).pathname, '/auth/v1/user')
      requests++
      return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } },
  })
  assert.equal(await acceptSession(client.auth, `https://demo.test/admin/accept#access_token=${jwt}&refresh_token=fixture-refresh`, () => {}), true)
  assert.ok(requests >= 2, 'setSession and getUser both verify against Auth')
  assert.ok([...cookies].some(([name, value]) => name.startsWith('sb-fixture-auth-token') && value), 'SSR session cookie persisted')
  await client.auth.stopAutoRefresh()
})
