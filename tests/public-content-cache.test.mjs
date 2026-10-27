import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import ts from 'typescript'

// No real configuration, credentials, network or production writes.
function fixture() {
  const state = { role: 'admin', publicTitle: 'Published', draftTitle: 'Draft', publicEmail: 'contact@example.com', recipient: 'private@example.com', failRead: false, failPublish: false }
  const calls = { reads: [], auth: 0, rpc: [], invalidations: [], paths: [] }
  const entries = new Map(), modules = new Map()
  const database = draft => ({
    from(table) {
      const filters = {}, fields = []
      const query = {
        select(value) { fields.push(value); return query },
        eq(key, value) { filters[key] = value; return query },
        async maybeSingle() { return result(false) },
        async single() { return result(false) },
        then(resolve, reject) { return Promise.resolve(result(true)).then(resolve, reject) },
      }
      function result(list) {
        calls.reads.push({ table, fields, draft, filters: { ...filters } })
        if (state.failRead) return { data: null, error: { message: 'unavailable' } }
        if (table === 'cms_inquiry_settings') return { data: fields[0] === 'public_email' ? { public_email: state.publicEmail } : { public_email: state.publicEmail, recipient_email: state.recipient, revision: 1 } }
        const data = { title: draft ? state.draftTitle : `${state.publicTitle}-${filters['data->slug->>current'] || 'settings'}`, slug: { current: 'home' } }
        return { data: list ? [{ data }] : { data }, error: null }
      }
      return query
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args })
      if (state.failPublish) return { error: { message: 'stale revision' } }
      state.publicTitle = state.draftTitle
      return { error: null }
    },
  })
  const caller = database(true)
  const server = { currentMember: async () => { calls.auth++; return state.role ? { role: state.role, client: caller } : null }, serviceClient: () => database(false) }
  const nextCache = {
    unstable_cache(fn, key, options) { return async (...args) => {
      const id = JSON.stringify([key, args])
      if (!entries.has(id)) entries.set(id, { options, value: fn(...args).catch(error => { entries.delete(id); throw error }) })
      return entries.get(id).value
    } },
    updateTag(tag) { calls.invalidations.push(tag); for (const [id, entry] of entries) if (entry.options.tags.includes(tag)) entries.delete(id) },
    revalidatePath(...args) { calls.paths.push(args) },
  }
  function load(relative) {
    const filename = path.resolve(import.meta.dirname, '..', relative)
    if (modules.has(filename)) return modules.get(filename).exports
    const mod = new Module(filename); modules.set(filename, mod)
    mod.require = name => {
      if (name === 'server-only') return {}
      if (name === 'react') return { cache: fn => fn }
      if (name === 'next/cache') return nextCache
      if (name === '@supabase/supabase-js') return { createClient: () => database(false) }
      if (name === './config') return { supabaseConfig: () => ({ url: 'https://fixture.invalid', key: 'public-fixture' }) }
      if (name.endsWith('/server')) return server
      if (name.endsWith('/inquiry-config')) return { inquiryRecipient: 'fallback@example.com', validContactEmail: value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) }
      if (name.startsWith('.')) return load(path.relative(path.resolve(import.meta.dirname, '..'), path.resolve(path.dirname(filename), name + '.ts')))
      throw new Error(`Unexpected import ${name}`)
    }
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    new Function('require', 'module', 'exports', 'console', code)(mod.require, mod, mod.exports, { error() {} })
    return mod.exports
  }
  return { state, calls, entries, content: load('supabase/content.ts'), contact: load('supabase/inquiry-settings.ts'), publish: load('app/admin/publish-actions.ts') }
}

test('published documents and sitemap slugs reuse bounded shared cache, separated by slug and kind', async () => {
  const f = fixture()
  assert.equal((await f.content.readDocument('page', 'home')).title, 'Published-home')
  f.state.publicTitle = 'Changed elsewhere'
  assert.equal((await f.content.readDocument('page', 'home')).title, 'Published-home')
  assert.equal((await f.content.readDocument('page', 'kontakt')).title, 'Changed elsewhere-kontakt')
  assert.equal((await f.content.readDocument('settings')).title, 'Changed elsewhere-settings')
  await f.content.publishedSlugs(); await f.content.publishedSlugs()
  assert.equal(f.calls.reads.length, 4)
  assert.equal(f.calls.auth, 0)
  for (const entry of f.entries.values()) assert.equal(entry.options.revalidate, 300)
})

test('preview bypasses shared cache and rechecks membership including revoked users', async () => {
  const f = fixture()
  await f.content.readDocument('page', 'home')
  assert.equal((await f.content.readDocument('page', 'home', true)).title, 'Draft')
  f.state.draftTitle = 'Secret draft changes'
  assert.equal((await f.content.readDocument('page', 'home', true)).title, 'Secret draft changes')
  f.state.role = null
  assert.equal(await f.content.readDocument('page', 'home', true), null)
  assert.equal(f.calls.auth, 3)
  assert.equal(f.entries.size, 1)
  assert.equal((await f.content.readDocument('page', 'home')).title, 'Published-home')
})

test('database failures are not cached as fallback content', async () => {
  const f = fixture(); f.state.failRead = true
  assert.equal(await f.content.readDocument('page', 'home'), null)
  assert.deepEqual(await f.content.publishedSlugs(), [])
  assert.equal(await f.contact.publicContactEmail(), 'fallback@example.com')
  assert.equal(f.entries.size, 0)
  f.state.failRead = false
  assert.equal((await f.content.readDocument('page', 'home')).title, 'Published-home')
  assert.equal(await f.contact.publicContactEmail(), 'contact@example.com')
})

test('only the public contact address is cached; delivery settings remain fresh and private', async () => {
  const f = fixture()
  assert.equal(await f.contact.publicContactEmail(), 'contact@example.com')
  await f.contact.publicContactEmail()
  assert.equal(f.calls.reads.length, 1)
  assert.deepEqual(f.calls.reads[0].fields, ['public_email'])
  assert.equal((await f.contact.readInquirySettings()).recipientEmail, 'private@example.com')
  f.state.recipient = 'new-private@example.com'
  assert.equal((await f.contact.readInquirySettings()).recipientEmail, 'new-private@example.com')
  for (const entry of f.entries.values()) assert.doesNotMatch(JSON.stringify(await entry.value), /private/)
})

test('publishing uses the verified caller and expires public data only after successful revision-checked RPC', async () => {
  const f = fixture()
  await f.content.readDocument('page', 'home'); await f.content.publishedSlugs(); await f.contact.publicContactEmail()
  const result = await f.publish.publishDocument('page-home', 2)
  assert.equal(result.ok, true)
  assert.deepEqual(f.calls.rpc, [{ name: 'cms_publish', args: { document_id: 'page-home', expected_revision: 2 } }])
  assert.deepEqual(f.calls.invalidations, ['akron-public-content-v1'])
  assert.deepEqual(f.calls.paths, [['/', 'layout']])
  assert.equal(f.entries.size, 1, 'contact cache is not needlessly invalidated on page publishing')
  assert.equal((await f.content.readDocument('page', 'home')).title, 'Draft-home')
})

test('anonymous, read-only, malformed and failed publishing do not expire cache', async () => {
  const f = fixture()
  for (const role of [null, 'viewer']) { f.state.role = role; assert.equal((await f.publish.publishDocument('page-home', 1)).ok, false) }
  f.state.role = 'editor'
  for (const [id, revision] of [['../../x', 1], ['page-home', 0], ['page-home', '1'], [null, 1]]) assert.equal((await f.publish.publishDocument(id, revision)).ok, false)
  assert.equal(f.calls.rpc.length, 0)
  f.state.failPublish = true
  assert.equal((await f.publish.publishDocument('page-home', 1)).ok, false)
  assert.deepEqual(f.calls.invalidations, []); assert.deepEqual(f.calls.paths, [])
  f.state.failPublish = false
  assert.equal((await f.publish.publishDocument('page-home', 1)).ok, true, 'editors retain existing publishing permission')
})
