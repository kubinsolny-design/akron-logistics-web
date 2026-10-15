import test from 'node:test'
import assert from 'node:assert/strict'
import { isLegalPage, pageSlug, sortContentPages } from '../app/admin/content-order.ts'

const page = (slug, title = slug) => ({ id: `page-${slug}`, kind: 'page', data: { title, slug: { current: slug } } })
test('main pages come first, privacy and cookies last', () => {
  const input = ['cookies', 'home', 'moznosti', 'ochrana-osobnich-udaju', 'preprava', 'spoluprace'].map(slug => page(slug))
  assert.deepEqual(sortContentPages(input).map(pageSlug), ['home', 'preprava', 'moznosti', 'spoluprace', 'ochrana-osobnich-udaju', 'cookies'])
  assert.equal(input[0].id, 'page-cookies', 'sorting must not mutate fetched documents')
})
test('additional pages stay before legal pages and use deterministic Czech title order', () => {
  const input = [page('cookies'), page('novinky', 'Novinky'), page('aktuality', 'Aktuality'), page('home')]
  assert.deepEqual(sortContentPages(input).map(pageSlug), ['home', 'aktuality', 'novinky', 'cookies'])
})
test('works with renamed legal titles and missing slug, without modifying content', () => {
  const document = { id: 'page-cookies', kind: 'page', revision: 9, data: { title: 'Soukromí', unknown: { preserve: true } } }
  assert.equal(isLegalPage(document), true)
  assert.equal(sortContentPages([document])[0], document)
  assert.equal(isLegalPage(page('preprava')), false)
})
