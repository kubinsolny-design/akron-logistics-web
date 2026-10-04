import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Compile the actual action and isolate its transport/env: no e-mail is sent.
const source = readFileSync(new URL('../app/actions.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const env = {}
const requests = []
let transportStatus = 200
const exports = {}
vm.runInNewContext(compiled, {
  exports, process: { env }, AbortSignal,
  require: (name) => {
    assert.equal(name, './site')
    return { company: { email: 'info@akronlogistics.cz', phone: '+420 606 187 648' } }
  },
  console: { error() {} },
  fetch: async (url, options) => {
    requests.push({ url, ...JSON.parse(options.body) })
    return { ok: transportStatus === 200, status: transportStatus }
  },
})
const data = new FormData()
for (const [name, value] of Object.entries({ pickup: 'Praha', delivery: 'Brno', date: '2026-11-01', cargo: '<script>test</script>', name: 'Test', email: 'test@example.com', frequency: 'once' })) data.set(name, value)
const action = (form = data) => exports.sendInquiry({ status: 'idle', message: '' }, form)
assert.equal((await action(new FormData())).status, 'error')
assert.match((await action()).message, /info@akronlogistics.cz/)
assert.equal(requests.length, 0)
env.RESEND_API_KEY = 'test-only-key'
assert.equal((await action()).status, 'error')
assert.equal(requests.length, 0)
env.INQUIRY_FROM_EMAIL = 'AKRON Logistics <test@example.com>'
assert.equal((await action()).status, 'success')
assert.equal(requests[0].to[0], 'info@akronlogistics.cz')
assert.equal(requests[0].reply_to, 'test@example.com')
assert.match(requests[0].html, /&lt;script&gt;/)
assert.doesNotMatch(requests[0].html, /<script>/)
transportStatus = 500
assert.equal((await action()).status, 'error')
data.set('email', 'invalid')
assert.equal((await action()).status, 'error')
assert.equal(requests.length, 2)
console.log('PASS: validation, missing configuration, default recipient, reply-to, HTML escaping and transport failure (mocked; no email sent).')
