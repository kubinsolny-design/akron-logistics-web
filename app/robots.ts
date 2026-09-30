import type { MetadataRoute } from 'next'
import { getSiteUrl } from './site'

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.ALLOW_INDEXING === 'true' || process.env.VERCEL_ENV === 'production'

  return {
    rules: allowIndexing
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
