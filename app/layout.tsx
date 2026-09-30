import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './brand.css'
import './map.css'
import './form.css'
import './service.css'
import { Footer, Header } from './ui'

const orbitron = localFont({
  src: [
    { path: './fonts/static/Orbitron-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/static/Orbitron-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/static/Orbitron-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/static/Orbitron-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/static/Orbitron-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: './fonts/static/Orbitron-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-orbitron',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'AKRON Logistics', template: '%s | AKRON Logistics' },
  description: 'Vnitrostátní a mezinárodní silniční přeprava a spedice.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#123b40',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className={orbitron.variable}>
        <a className="skip-link" href="#obsah">Přeskočit na obsah</a>
        <Header />
        <main id="obsah">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
