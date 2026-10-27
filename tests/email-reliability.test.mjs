import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const mail = {}
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../supabase/inquiry-email.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mail, require: () => ({}), AbortSignal })
const payload = { from: 'fixture@example.com', to: ['recipient@example.com'], subject: 'Fixture', html: '<p>Test</p>' }
for (const statuses of [[503, 200], [429, 502, 200], ['network', 200], [503, 503, 503], [401], [409], [400]]) {
  test(`bounded transport retries: ${statuses}`, async () => {
    const requests = [], waits = []
    const result = await mail.sendEmailWithRetry(payload, 'stable-id', 'fake', { fetcher: async (url, init) => {
      requests.push({ url, ...init }); const status = statuses[requests.length - 1]
      if (status === 'network') throw new Error('private transport details')
      return { ok: status === 200, status, headers: new Headers() }
    }, wait: async ms => waits.push(ms) })
    assert.equal(result, statuses.at(-1) === 200)
    assert.equal(requests.length, statuses.length)
    assert.ok(requests.every(request => request.body === JSON.stringify(payload) && request.headers['Idempotency-Key'] === 'stable-id'))
    assert.equal(waits.length, statuses.length - 1)
  })
}
test('long rate limits are not hammered or held in a public form', async () => {
  let calls = 0
  const result = await mail.sendEmailWithRetry(payload, 'id', 'fake', { fetcher: async () => { calls++; return { status: 429, ok: false, headers: new Headers({ 'retry-after': '60' }) } }, wait: async () => assert.fail('must not wait') })
  assert.equal(result, false); assert.equal(calls, 1)
})

function actions(role = 'admin', available = true) {
  const calls = [], marks = [], sent = []
  const row = { loading_place: 'Praha', unloading_place: 'Brno', requested_date: '2026-11-01', frequency: 'once', cargo: 'Paleta', contact_name: 'Fixture', email: '', phone: '+420606123456' }
  const query = new Proxy({}, { get: (_, method) => (...args) => {
    calls.push([method, ...args])
    if (method === 'maybeSingle') return Promise.resolve({ data: available ? row : null, error: null })
    return query
  } })
  const exports = {}
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/admin/overview-actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, Date, process: { env: { RESEND_API_KEY: 'fake' } }, require: name => {
      if (name.endsWith('/server')) return { currentMember: async () => role ? { role, client: { from: () => { throw new Error('not a retry query') } } } : null, serviceClient: () => ({ from: name => { calls.push(['from', name]); return query } }) }
      if (name.endsWith('/inquiry-settings')) return { readInquirySettings: async () => ({ recipientEmail: 'authoritative@example.com' }) }
      if (name.endsWith('/inquiry-config')) return { defaultInquirySender: 'web@example.com', validInquirySender: () => true }
      if (name.endsWith('/inquiry-email')) return { inquiryMessage: mail.inquiryMessage, sendEmailWithRetry: async (...args) => { sent.push(args); return true } }
      if (name.endsWith('/inquiries')) return { markInquiryEmail: async (...args) => marks.push(args) }
      throw new Error(name)
    },
  })
  return { ...exports, calls, marks, sent }
}
const id = '11111111-1111-4111-8111-111111111111'
for (const role of [null, 'viewer', 'editor']) test(`retry rejects ${role} before accessing privileged data`, async () => {
  const f = actions(role); assert.equal((await f.retryInquiryEmail(id)).ok, false); assert.equal(f.calls.length, 0); assert.equal(f.sent.length, 0)
})
test('retry only claims failed undeleted recent inquiry and uses server recipient', async () => {
  const f = actions(); assert.equal((await f.retryInquiryEmail(id)).ok, true)
  assert.ok(f.calls.some(call => call[0] === 'eq' && call[1] === 'email_status' && call[2] === 'failed'))
  assert.ok(f.calls.some(call => call[0] === 'is' && call[1] === 'deleted_at' && call[2] === null))
  assert.ok(f.calls.some(call => call[0] === 'gte' && call[1] === 'created_at'))
  assert.equal(f.sent[0][1], id); assert.deepEqual([...f.sent[0][0].to], ['authoritative@example.com']); assert.equal(f.marks[0][1], 'sent')
})
test('already claimed, sent, deleted or stale record cannot trigger a second send', async () => {
  const f = actions('admin', false); assert.equal((await f.retryInquiryEmail(id)).ok, false); assert.equal(f.sent.length, 0)
})
test('invalid browser ID cannot query or send', async () => {
  const f = actions(); assert.equal((await f.retryInquiryEmail({ id })).ok, false); assert.equal(f.calls.length, 0)
})
