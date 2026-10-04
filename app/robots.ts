import type { MetadataRoute } from 'next'
import { getSiteUrl, isIndexingAllowed } from './site'

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = isIndexingAllowed()

  return {
    rules: allowIndexing
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
