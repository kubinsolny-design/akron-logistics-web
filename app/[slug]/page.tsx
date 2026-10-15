import { notFound } from 'next/navigation'
import { CmsPage } from '../cms-page'
import { contentMetadata, getPage, getSettings } from '../../content/content'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  return contentMetadata(slug, page?.title || 'AKRON Logistics', page?.seoDescription || '', `/${slug}`)
}
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [page, settings] = await Promise.all([getPage(slug), getSettings()])
  if (!page) notFound()
  return <CmsPage page={page} settings={settings} />
}
