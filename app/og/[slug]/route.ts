import { seoPages, reservedSlugs } from '../../seo-pages'
import { sharingImage } from '../../sharing-image'
import { getPage } from '../../../content/content'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response(null, { status: 404 })
  const entry = seoPages[slug]
  if (entry) return sharingImage(entry.card, entry.label)
  if (reservedSlugs.has(slug)) return new Response(null, { status: 404 })
  const page = await getPage(slug)
  if (!page) return new Response(null, { status: 404 })
  return sharingImage(page.seoTitle || page.title || 'AKRON Logistics', 'AKRON LOGISTICS')
}
