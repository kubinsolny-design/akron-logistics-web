import type { MetadataRoute } from 'next'
import { getSiteUrl } from './site'
import { getPublishedSlugs } from '../sanity/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const customSlugs = (await getPublishedSlugs()).filter(slug => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !['home', 'preprava', 'moznosti', 'spoluprace', 'ochrana-osobnich-udaju', 'cookies', 'studio', 'api'].includes(slug))

  return [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/preprava`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/moznosti`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/spoluprace`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/ochrana-osobnich-udaju`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
    ...customSlugs.map(slug => ({ url: `${siteUrl}/${slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ]
}
