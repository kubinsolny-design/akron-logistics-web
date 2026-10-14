import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import ts from 'typescript'

const file = new URL('../app/preparing.ts', import.meta.url)
const mod = new Module(file.pathname)
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file.pathname)
const { preparing, hidePublicPage, preparingHtml } = mod.exports

test('preparing gate covers every public page, unknown routes and form submissions', () => {
  assert.equal(preparing, true)
  for (const path of ['/', '/preprava', '/moznosti', '/spoluprace', '/cookies', '/ochrana-osobnich-udaju', '/nova-stranka', '/api/draft-mode/enable', '/administrator', '/og/home']) assert.equal(hidePublicPage(path), true, path)
})
test('admin, invitation callback and necessary assets stay available', () => {
  for (const path of ['/admin', '/admin/accept', '/api/admin/users', '/studio', '/_next/static/file.js', '/images/akron-white.svg', '/robots.txt', '/sitemap.xml', '/favicon.png']) assert.equal(hidePublicPage(path), false, path)
})
test('the standalone page has no public navigation, tracking or inquiry form', () => {
  assert.match(preparingHtml, /<h1>Připravujeme<\/h1>/)
  assert.match(preparingHtml, /noindex, nofollow/)
  assert.doesNotMatch(preparingHtml, /<form|<script|href="\/preprava/)
})

test('a stale form or direct server action cannot write inquiries while preparing', async () => {
  const actionFile = new URL('../app/actions.ts', import.meta.url)
  const actionModule = new Module(actionFile.pathname)
  const forbidden = () => assert.fail('Preparing must not access CMS, database or email')
  actionModule.require = name => {
    if (name === './preparing') return mod.exports
    if (name === '../sanity/content') return { getSettings: forbidden }
    if (name === '../supabase/inquiries') return { storeInquiry: forbidden, markInquiryEmail: forbidden }
    if (name === 'next/headers') return { draftMode: forbidden }
    throw new Error(`Unexpected import ${name}`)
  }
  actionModule._compile(ts.transpileModule(fs.readFileSync(actionFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, actionFile.pathname)
  const result = await actionModule.exports.sendInquiry({}, new FormData())
  assert.equal(result.status, 'error')
  assert.match(result.message, /Web připravujeme/)
})
