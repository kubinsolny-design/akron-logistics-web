import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import ts from 'typescript'

function load(relative) {
  const file = new URL(relative, import.meta.url)
  const mod = new Module(file.pathname)
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file.pathname)
  return mod.exports
}
const { pageMetadata } = load('../app/seo.ts')
const { seoPages, reservedSlugs } = load('../app/seo-pages.ts')

test('each built-in page has its own share image, description and title', () => {
  const images = new Set(), descriptions = new Set(), titles = new Set()
  for (const [slug, entry] of Object.entries(seoPages)) {
    if (slug === 'spoluprace') continue // Legacy OG alias; /kontakt is canonical.
    const path = slug === 'home' ? '/' : `/${slug}`
    const metadata = pageMetadata(entry.title, entry.description, path)
    assert.equal(metadata.alternates.canonical, path)
    assert.equal(metadata.openGraph.url, path)
    assert.equal(metadata.openGraph.images[0].url, `/og/${slug}`)
    assert.equal(metadata.twitter.images[0], `/og/${slug}`)
    assert.equal(metadata.openGraph.images[0].width, 1200)
    images.add(metadata.openGraph.images[0].url)
    descriptions.add(metadata.description)
    titles.add(metadata.title.absolute)
  }
  for (const values of [images, descriptions, titles]) assert.equal(values.size, 6)
})

test('CMS title is not suffixed with a duplicate brand', () => {
  assert.equal(pageMetadata('  Naše služby | AKRON Logistics  ', 'Text', '/sluzby').title.absolute, 'Naše služby | AKRON Logistics')
  assert.equal(pageMetadata('Doprava', 'Text', '/doprava').title.absolute, 'Doprava | AKRON Logistics')
})

test('private and generated routes are excluded from custom sitemap pages', () => {
  for (const slug of ['admin', 'studio', 'api', 'og', 'opengraph-image', 'home', 'cookies']) assert.ok(reservedSlugs.has(slug))
  assert.ok(!reservedSlugs.has('nova-stranka'))
})
