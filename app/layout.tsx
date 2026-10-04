import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './brand.css'
import './map.css'
import './form.css'
import './service.css'
import { Footer, Header } from './ui'
import { getSiteUrl } from './site'

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
  robots: process.env.ALLOW_INDEXING === 'true' || process.env.VERCEL_ENV === 'production'
    ? { index: true, follow: true }
    : { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#152236',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className={poppins.variable}>
        <a className="skip-link" href="#obsah">Přeskočit na obsah</a>
        <Header />
        <main id="obsah">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
