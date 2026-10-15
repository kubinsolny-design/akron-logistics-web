import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './brand.css'
import './map.css'
import './form.css'
import './service.css'
import './legal.css'
import './cms.css'
import './final-polish.css'
import { getSettings } from '../content/content'
import { draftMode } from 'next/headers'
import { CookiePreferences } from './cookie-preferences'
import { imageUrl } from '../content/client'
import { Footer, Header } from './ui'
import { PublicChrome } from './public-chrome'
import { getSiteUrl, isIndexingAllowed } from './site'

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
const orbitron = localFont({ src: './fonts/Orbitron-VariableFont_wght.ttf', variable: '--font-orbitron', display: 'swap' })

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
    url: '/',
    images: [{ url: '/og/home', width: 1200, height: 630, alt: 'AKRON Logistics — přepravu vyřešíme od A do B' }],
    type: 'website',
    locale: 'cs_CZ',
    siteName: 'AKRON Logistics',
    title: 'AKRON Logistics | Silniční přeprava a spedice',
    description: 'Vhodné vozidlo, domluvená přeprava a osobní komunikace až do doručení.',
  },
  twitter: { card: 'summary_large_image', title: 'AKRON Logistics | Silniční přeprava a spedice', description: 'Vhodné vozidlo, domluvená přeprava a osobní komunikace až do doručení.', images: ['/og/home'] },
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [company, { isEnabled }] = await Promise.all([getSettings(), draftMode()])
  const color = (value: string | undefined, fallback: string) => /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback
  const theme = { '--ink': color(company.darkColor, '#152236'), '--orange': color(company.accentColor, '#ff5a00'), '--paper': color(company.backgroundColor, '#f2f2f2'), '--sand': color(company.backgroundColor, '#f2f2f2'), '--black': color(company.textColor, '#0d1117'), '--site-font': company.font === 'orbitron' ? 'var(--font-orbitron)' : 'var(--font-poppins)' } as React.CSSProperties
  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${siteUrl}/#organization`,
        name: company.name, url: siteUrl, logo: new URL(imageUrl(company.logo) || '/images/akron-black.svg',siteUrl).href,
        email: company.email, telephone: company.phone, identifier: company.registrationNumber,
        address: { '@type': 'PostalAddress', streetAddress: company.street, addressLocality: company.city.replace(/^\d{3}\s?\d{2}\s*/, ''), ...(company.city.match(/^\d{3}\s?\d{2}/) ? { postalCode: company.city.match(/^\d{3}\s?\d{2}/)?.[0] } : {}), addressCountry: 'CZ' },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', telephone: company.phone, email: company.email, availableLanguage: 'cs' },
      },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: 'AKRON Logistics', inLanguage: 'cs-CZ', publisher: { '@id': `${siteUrl}/#organization` } },
    ],
  }
  return (
    <html lang="cs" style={theme}>
      <body className={`${poppins.variable} ${orbitron.variable}`}>
        {/* A full navigation is required to clear the preview cookie. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        {isEnabled && <div className="preview-banner">Náhled nepublikovaných změn <a href="/api/draft-mode/disable">Ukončit náhled</a></div>}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <PublicChrome><a className="skip-link" href="#obsah">Přeskočit na obsah</a><Header /></PublicChrome>
        <main id="obsah">{children}</main>
        <PublicChrome><Footer /><CookiePreferences text={company.cookieText} /></PublicChrome>
      </body>
    </html>
  )
}
