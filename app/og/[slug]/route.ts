import { seoPages, reservedSlugs } from '../../seo-pages'
import { sharingImage } from '../../sharing-image'
import { readDocument } from '../../../supabase/content'
import type { CmsPage } from '../../../content/types'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response(null, { status: 404 })
  const entry = seoPages[slug]
  if (entry) return sharingImage(entry.card, entry.label, ['preprava', 'kontakt', 'spoluprace'].includes(slug) ? 'coordination' : 'highway')
  if (reservedSlugs.has(slug)) return new Response(null, { status: 404 })
  // Publicly cacheable images must never contain an authenticated editor's draft.
  const page = await readDocument<CmsPage>('page', slug, false)
  if (!page) return new Response(null, { status: 404 })
  return sharingImage(page.seoTitle || page.title || 'AKRON Logistics', 'AKRON LOGISTICS')
}
