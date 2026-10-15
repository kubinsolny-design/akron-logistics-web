import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../app/actions.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const validation = {}
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/inquiry-validation.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: validation })
function fixture(options = {}) {
  const events = [], requests = [], exports = {}
  const env = { RESEND_API_KEY: 'fixture-not-a-real-key', INQUIRY_FROM_EMAIL: 'AKRON Logistics <web@akronlogistics.cz>', INQUIRY_TO_EMAIL: 'info@akronlogistics.cz', ...options.env }
  const company = { email: 'info@akronlogistics.cz', phone: '+420 606 187 648', inquiryEmail: 'old-test@example.com' }
  vm.runInNewContext(compiled, {
    exports, process: { env }, AbortSignal, Error, console: { error() {} },
    require: name => {
      if (name === './inquiry-validation') return validation
      if (name === './preparing') return { preparing: options.preparing || false }
      if (name === 'next/headers') return { draftMode: async () => ({ isEnabled: options.preview || false }) }
      if (name === '../sanity/content') return { getSettings: async () => company }
      if (name === '../supabase/inquiries') return {
        storeInquiry: async () => { events.push('store'); if (options.storageError) throw new Error(options.storageError); return options.noStorage ? null : 'fixture-inquiry' },
        markInquiryEmail: async (id, status) => events.push(`email:${id}:${status}`),
      }
      throw new Error(`Unexpected dependency ${name}`)
    },
    fetch: async (url, init) => {
      assert.equal(url, 'https://api.resend.com/emails')
      events.push('send'); requests.push({ ...JSON.parse(init.body), headers: init.headers })
      if (options.transportError) throw new Error('fixture transport failure')
      return { ok: !options.providerError, status: options.providerError ? 503 : 200 }
    },
  })
  const form = new FormData()
  for (const [key, value] of Object.entries({ pickup: 'Praha', delivery: 'Brno', date: '2026-11-01', frequency: 'once', cargo: '<script>test</script>', name: 'Fixture', phone: '+420 606 123 456', email: 'fixture@example.com', privacyAcknowledged: 'yes' })) form.set(key, value)
  return { form, events, requests, send: (data = form) => exports.sendInquiry({ status: 'idle', message: '' }, data) }
}

test('stored inquiry is sent only to the explicit server recipient, never the old CMS/test address', async () => {
  const f = fixture()
  assert.equal((await f.send()).status, 'success')
  assert.deepEqual(f.events, ['store', 'send', 'email:fixture-inquiry:sent'])
  assert.deepEqual(f.requests[0].to, ['info@akronlogistics.cz'])
  assert.equal(f.requests[0].reply_to, 'fixture@example.com')
  assert.equal(f.requests[0].headers['Idempotency-Key'], 'fixture-inquiry')
  assert.match(f.requests[0].html, /&lt;script&gt;/)
  assert.doesNotMatch(f.requests[0].html, /<script>/)
})
for (const option of [{ providerError: true }, { transportError: true }, { env: { RESEND_API_KEY: '' } }, { env: { INQUIRY_FROM_EMAIL: '' } }]) test(`saved inquiry survives email failure: ${JSON.stringify(option)}`, async () => {
  const f = fixture(option)
  assert.equal((await f.send()).status, 'success')
  assert.equal(f.events[0], 'store')
  assert.equal(f.events.at(-1), 'email:fixture-inquiry:failed')
})
test('storage failure stops email delivery and does not claim acceptance', async () => {
  const f = fixture({ storageError: 'fixture database unavailable' })
  assert.equal((await f.send()).status, 'error')
  assert.deepEqual(f.events, ['store'])
})
test('rate limit remains a friendly error', async () => {
  const f = fixture({ storageError: 'Příliš mnoho poptávek.' })
  assert.match((await f.send()).message, /Příliš mnoho/)
  assert.equal(f.requests.length, 0)
})
test('without storage and delivery, the action never reports success', async () => {
  const f = fixture({ noStorage: true, env: { RESEND_API_KEY: '' } })
  assert.equal((await f.send()).status, 'error')
  assert.equal(f.requests.length, 0)
})
test('configured email cannot bypass missing private storage and rate limiting', async () => {
  const f = fixture({ noStorage: true })
  assert.equal((await f.send()).status, 'error')
  assert.deepEqual(f.events, ['store'])
  assert.equal(f.requests.length, 0)
})
for (const options of [{ preview: true }, { preparing: true }]) test(`preview/preparing performs no writes: ${JSON.stringify(options)}`, async () => {
  const f = fixture(options)
  assert.equal((await f.send()).status, 'error')
  assert.deepEqual(f.events, [])
})
for (const [key, value] of [['email', 'invalid'], ['phone', ''], ['phone', '++++123456789'], ['pickup', ''], ['privacyAcknowledged', 'no'], ['cargo', 'x'.repeat(3001)]]) test(`invalid ${key} ${value.slice(0, 15)} is rejected before storage`, async () => {
  const f = fixture(); f.form.set(key, value)
  assert.equal((await f.send()).status, 'error')
  assert.deepEqual(f.events, [])
})
test('honeypot does not store or send anything', async () => {
  const f = fixture(); f.form.set('website', 'spam')
  await f.send()
  assert.deepEqual(f.events, [])
})
test('phone-only inquiry is stored and sent without an invalid empty Reply-To', async () => {
  const f = fixture(); f.form.delete('email')
  assert.equal((await f.send()).status, 'success')
  assert.deepEqual(f.events, ['store', 'send', 'email:fixture-inquiry:sent'])
  assert.equal('reply_to' in f.requests[0], false)
  assert.match(f.requests[0].html, /\+420 606 123 456/)
})
