import type { MetadataRoute } from 'next'
import { getSiteUrl } from './site'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()

  return [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/preprava`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/moznosti`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/spoluprace`, changeFrequency: 'monthly', priority: 0.9 },
  ]
}
