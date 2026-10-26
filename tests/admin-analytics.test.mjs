import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import ts from 'typescript'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'

const source = fs.readFileSync(new URL('../app/admin/analytics-data.ts', import.meta.url), 'utf8')
const credential = JSON.stringify({ type: 'service_account', client_email: 'reader@fixture.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\nFAKE-NOT-A-KEY\n-----END PRIVATE KEY-----', token_uri: 'https://untrusted.invalid' })

function fixture({ role = 'admin', configured = true, fail = false, reports } = {}) {
  const calls = { auth: 0, google: 0, cache: 0, options: null, identity: null }
  const mod = new Module(import.meta.filename)
  mod.require = request => {
    if (request === 'server-only') return {}
    if (request === '../../supabase/server') return { currentMember: async () => { calls.auth++; return role ? { role } : null } }
    if (request === 'next/cache') return { unstable_cache: (fn, key, options) => { calls.cache++; calls.identity = { key, options }; return fn } }
    if (request === 'google-auth-library') return { JWT: class {
      constructor(options) { calls.options = options }
      async request(request) {
        calls.google++; calls.request = request
        if (fail) throw new Error('Sensitive Bearer token MUST NOT escape')
        return { data: { reports: reports ?? [
          { rows: [{ metricValues: [{ value: '5' }, { value: '8' }, { value: '12' }, { value: '.625' }] }], metadata: { timeZone: 'Europe/Prague', subjectToThresholding: true } },
          { rows: [] },
          { rows: [{ dimensionValues: [{ value: '/kontakt' }], metricValues: [{ value: '7' }] }, { dimensionValues: [{ value: '/admin/secret' }], metricValues: [{ value: '9' }] }] },
          { rows: [{ dimensionValues: [{ value: 'Organic Search' }], metricValues: [{ value: '3' }] }] },
        ] } }
      }
    } }
    if (request === 'node:crypto') return Module.createRequire(import.meta.url)(request)
    throw new Error(`Unexpected import ${request}`)
  }
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  // Pass an isolated env object, never inspect or change real machine credentials.
  const run = new Function('require', 'module', 'exports', 'process', code)
  run(mod.require.bind(mod), mod, mod.exports, { env: configured ? { GA4_PROPERTY_ID: '559040702', GA4_SERVICE_ACCOUNT_JSON: credential } : {} })
  return { load: mod.exports.authorizedAnalytics, calls }
}

test('analytics blocks anonymous, revoked and non-admin roles before config/cache/Google', async () => {
  for (const role of [null, 'editor', 'viewer']) {
    const { load, calls } = fixture({ role })
    assert.equal((await load(28)).status, 'forbidden')
    assert.equal(calls.google, 0); assert.equal(calls.cache, 0); assert.equal(calls.auth, 1)
  }
})
test('analytics validates fixed periods and missing configuration without fake metrics', async () => {
  const invalid = fixture()
  for (const range of [0, 1, '28', 365, {}, null]) assert.equal((await invalid.load(range)).status, 'error')
  assert.equal(invalid.calls.google, 0)
  const missing = fixture({ configured: false })
  assert.equal((await missing.load(28)).status, 'unconfigured')
  assert.equal(missing.calls.cache, 0)
})
test('analytics uses readonly SDK auth, a fixed batch endpoint, safe filters and bounded cache', async () => {
  const { load, calls } = fixture()
  const result = await load(7)
  assert.equal(result.status, 'ready')
  assert.deepEqual(calls.options.scopes, ['https://www.googleapis.com/auth/analytics.readonly'])
  assert.equal(calls.options.token_uri, undefined)
  assert.equal(calls.google, 1)
  assert.equal(calls.request.url, 'https://analyticsdata.googleapis.com/v1beta/properties/559040702:batchRunReports')
  assert.equal(calls.request.data.requests.length, 4)
  assert.deepEqual(calls.request.data.requests[0].dateRanges, [{ startDate: '7daysAgo', endDate: 'yesterday' }])
  assert.deepEqual(calls.request.data.requests[0].dimensionFilter.andGroup.expressions[0].filter.inListFilter.values, ['akronlogistics.cz', 'www.akronlogistics.cz'])
  assert.equal(calls.request.timeout, 15000); assert.equal(calls.request.retry, false)
  assert.equal(calls.identity.options.revalidate, 300)
  assert.doesNotMatch(JSON.stringify(calls.identity), /PRIVATE KEY|reader@/)
  assert.equal(result.report.users, 5); assert.equal(result.report.sessions, 8); assert.equal(result.report.views, 12)
  assert.equal(result.report.engagementRate, .625); assert.equal(result.report.days.length, 7)
  assert.equal(result.report.thresholded, true)
  assert.deepEqual(result.report.pages, [{ label: '/kontakt', count: 7 }])
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE KEY|reader@|token|\/admin\/secret/)
})
test('analytics failures never disclose Google errors or credentials', async () => {
  const { load } = fixture({ fail: true })
  const result = await load(28)
  assert.equal(result.status, 'error')
  assert.doesNotMatch(JSON.stringify(result), /Sensitive|Bearer|PRIVATE KEY/)
})
test('every analytics load rechecks membership, even if aggregate caching is enabled', async () => {
  const { load, calls } = fixture()
  await load(7); await load(28)
  assert.equal(calls.auth, 2)
})
test('missing report responses fail closed rather than showing false zeros', async () => {
  assert.equal((await fixture({ reports: [] }).load(28)).status, 'error')
})

test('analytics panel renders actual aggregates and updates the selected period', async () => {
  const dom = new JSDOM('<div id="root"></div>')
  const originals = { document: globalThis.document, window: globalThis.window, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT }
  Object.assign(globalThis, { document: dom.window.document, window: dom.window, IS_REACT_ACT_ENVIRONMENT: true })
  const require = Module.createRequire(import.meta.url)
  const mod = new Module(import.meta.filename)
  const ranges = []
  mod.require = request => request === './analytics-actions' ? { loadAnalytics: async range => { ranges.push(range); return fixture().load(range) } } : require(request)
  const code = ts.transpileModule(fs.readFileSync(new URL('../app/admin/analytics-panel.tsx', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  mod._compile(code, import.meta.filename)
  let mounted
  try {
    const { createRoot } = await import('react-dom/client')
    const container = document.getElementById('root')
    mounted = createRoot(container)
    await act(async () => mounted.render(React.createElement(mod.exports.AnalyticsPanel, { administrator: true })))
    assert.deepEqual(ranges, [28])
    assert.equal(container.querySelectorAll('.admin-analytics-metrics article').length, 4)
    assert.match(container.textContent, /Aktivní uživatelé5/)
    assert.match(container.textContent, /62,5 %/)
    assert.match(container.textContent, /Google část dat/)
    assert.equal(container.querySelectorAll('.admin-analytics-chart > div').length, 28)
    const select = container.querySelector('select')
    await act(async () => { select.value = '7'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
    assert.deepEqual(ranges, [28, 7])
    assert.equal(container.querySelectorAll('.admin-analytics-chart > div').length, 7)
    await act(async () => mounted.render(React.createElement(mod.exports.AnalyticsPanel, { administrator: false })))
    assert.match(container.textContent, /pouze administrátor/)
    assert.equal(container.querySelector('.admin-analytics-metrics'), null)
  } finally {
    if (mounted) await act(async () => mounted.unmount())
    Object.assign(globalThis, originals); dom.window.close()
  }
})
