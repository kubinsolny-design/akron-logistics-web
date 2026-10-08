import type { Metadata } from 'next'

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const cleanTitle = title.replace(/\s+/g, ' ').trim()
  const fullTitle = /AKRON Logistics/i.test(cleanTitle) ? cleanTitle : `${cleanTitle} | AKRON Logistics`
  const image = `/og/${path === '/' ? 'home' : path.slice(1)}`
  return {
    title: { absolute: fullTitle }, description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle, description, url: path, type: 'website',
      siteName: 'AKRON Logistics', locale: 'cs_CZ',
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [image] },
  }
}
