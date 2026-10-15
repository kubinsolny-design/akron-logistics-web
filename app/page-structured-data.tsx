import { contentMetadata, getPage } from '../content/content'
import { getSiteUrl } from './site'
import { seoPages } from './seo-pages'
import { publicHref } from './public-links'

export async function PageStructuredData({ slug }: { slug: string }) {
  const path = publicHref(slug === 'home' ? '/' : `/${slug}`)
  const entry = seoPages[slug]
  const cmsSlug = slug === 'kontakt' ? 'spoluprace' : slug
  const page = await getPage(cmsSlug)
  if (!entry && !page) return null
  const metadata = await contentMetadata(cmsSlug, page?.title || entry?.title || 'AKRON Logistics', '', path)
  const title = typeof metadata.title === 'object' && metadata.title && 'absolute' in metadata.title ? metadata.title.absolute : page?.title || entry?.title
  const site = getSiteUrl()
  const url = path === '/' ? site : `${site}${path}`
  const graph: Record<string, unknown>[] = [{
    '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title,
    description: metadata.description, inLanguage: 'cs-CZ',
    isPartOf: { '@id': `${site}/#website` },
    about: { '@id': `${site}/#organization` },
    ...(slug !== 'home' ? { breadcrumb: { '@id': `${url}#breadcrumbs` } } : {}),
  }]
  if (slug !== 'home') graph.push({
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Úvod', item: site },
      { '@type': 'ListItem', position: 2, name: page?.title || entry?.title, item: url },
    ],
  })
  if (slug === 'preprava') graph.push({
    '@type': 'Service', '@id': `${url}#service`, name: 'Organizace silniční přepravy',
    description: metadata.description, url, serviceType: 'Silniční přeprava a spedice',
    provider: { '@id': `${site}/#organization` },
    areaServed: [{ '@type': 'Country', name: 'Česko' }, { '@type': 'Continent', name: 'Evropa' }],
  })
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />
}
