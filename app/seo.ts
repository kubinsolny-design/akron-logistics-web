import type { Metadata } from 'next'

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = `${title} | AKRON Logistics`
  return {
    title: { absolute: fullTitle }, description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle, description, url: path, type: 'website',
      siteName: 'AKRON Logistics', locale: 'cs_CZ',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'AKRON Logistics — silniční přeprava a spedice' }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: ['/opengraph-image'] },
  }
}
