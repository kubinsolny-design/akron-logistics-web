import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './brand.css'
import './map.css'
import './form.css'
import './service.css'
import './legal.css'
import { CookiePreferences } from './cookie-preferences'
import { Footer, Header } from './ui'
import { company, getSiteUrl, isIndexingAllowed } from './site'

const poppins = localFont({
  src: [
    { path: './fonts/static/Poppins-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/static/Poppins-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/static/Poppins-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/static/Poppins-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/static/Poppins-ExtraBold.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'AKRON Logistics | Silniční přeprava a spedice',
    template: '%s | AKRON Logistics',
  },
  description: 'Vnitrostátní a mezinárodní silniční přeprava a spedice. Najdeme vhodné vozidlo a koordinujeme zakázku od poptávky po doručení.',
  keywords: ['silniční přeprava', 'spedice', 'vnitrostátní přeprava', 'mezinárodní přeprava', 'expresní přeprava', 'sběrná přeprava'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName: 'AKRON Logistics',
    title: 'AKRON Logistics | Silniční přeprava a spedice',
    description: 'Vhodné vozidlo, domluvená přeprava a osobní komunikace až do doručení.',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: [{ url: '/favicon.png', type: 'image/png', sizes: '48x48' }], apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }] },
  robots: isIndexingAllowed()
    ? { index: true, follow: true }
    : { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#152236',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${siteUrl}/#organization`,
        name: company.name, url: siteUrl, logo: `${siteUrl}/images/akron-black.svg`,
        email: company.email, telephone: company.phone, identifier: company.registrationNumber,
        address: { '@type': 'PostalAddress', streetAddress: company.street, addressLocality: 'Ostrava', postalCode: '702 00', addressCountry: 'CZ' },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', telephone: company.phone, email: company.email, availableLanguage: 'cs' },
      },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: 'AKRON Logistics', inLanguage: 'cs-CZ', publisher: { '@id': `${siteUrl}/#organization` } },
    ],
  }
  return (
    <html lang="cs">
      <body className={poppins.variable}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <a className="skip-link" href="#obsah">Přeskočit na obsah</a>
        <Header />
        <main id="obsah">{children}</main>
        <Footer />
        <CookiePreferences />
      </body>
    </html>
  )
}
