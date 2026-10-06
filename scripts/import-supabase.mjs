import { createClient as createSanityClient } from '@sanity/client'
import { createClient } from '@supabase/supabase-js'

// Read-only by default. Import only to the explicitly approved isolated project.
const apply = process.argv.includes('--apply')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (apply && url !== 'https://htgwzjcdxbknzvobwioa.supabase.co') throw new Error('Preview project URL required')
if (apply && !process.env.SUPABASE_SECRET_KEY) throw new Error('Server secret missing')
if (apply && process.env.ADMIN_SITE_URL !== 'https://akron-admin-demo.vercel.app') throw new Error('Isolated admin preview required')
const sanity = createSanityClient({ projectId: 'l802e097', dataset: 'production',
  apiVersion: '2026-10-01', useCdn: false, perspective: 'published' })
const [pages, settings] = await Promise.all([
  sanity.fetch('*[_type == "page" && !(_id in path("drafts.**"))]'),
  sanity.fetch('*[_id == "siteSettings"][0]'),
])
if (!settings || pages.length < 6) throw new Error('Expected published site content is missing; import stopped')
const stripMetadata = document => Object.fromEntries(Object.entries(document)
  .filter(([key]) => !['_id', '_rev', '_createdAt', '_updatedAt'].includes(key)))
const rows = pages.map(page => {
  const slug = page.slug?.current
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,74}$/.test(slug)) throw new Error('Invalid page slug; import stopped')
  return { id: `page-${slug}`, kind: 'page', data: stripMetadata(page), revision: 1 }
})
rows.push({ id: 'site-settings', kind: 'settings', data: stripMetadata(settings), revision: 1 })
console.log(`Read ${pages.length} published pages and site settings. No drafts or inquiries included.`)
if (!apply) {
  console.log('Dry run only. Nothing written. Use --apply with server credentials for the preview import.')
} else {
  const target = createClient(url, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: existing, error: existingError } = await target.from('cms_drafts').select('id').limit(1)
  if (existingError) throw new Error('Cannot verify target content; import stopped')
  const { data: existingPublished, error: publishedReadError } = await target.from('cms_published').select('id')
  if (publishedReadError) throw new Error('Cannot verify published content; import stopped')
  const expectedIds = rows.map(row => row.id)
  if (existing.length > 0) {
    if (!expectedIds.every(id => existingPublished.some(document => document.id === id))) {
      throw new Error('Preview contains drafts but incomplete published content. Manual recovery required; nothing overwritten or published.')
    }
    console.log('Preview content already imported. Existing drafts and published versions unchanged.')
  } else {
  // Seed only an empty project. Never publish an existing customer draft.
  const { error } = await target.from('cms_drafts').insert(rows)
  if (error) throw new Error('Draft import failed; no existing rows overwritten')
  const published = rows.map(row => {
    const data = { ...row.data }
    if (row.kind === 'settings') delete data.inquiryEmail
    return { ...row, data }
  })
  const { error: publishError } = await target.from('cms_published').insert(published)
  if (publishError) throw new Error('Published content import failed; provider switch is not safe')
  console.log('Initial preview content imported. Website provider not switched by this script.')
  }
}
