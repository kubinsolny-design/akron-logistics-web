import 'server-only'
import { cache } from 'react'
import { draftMode } from 'next/headers'
import { imageUrl } from './client'
import { company } from '../app/site'
import { pageMetadata } from '../app/seo'
import type { CmsPage, Settings } from './types'
import { readDocument, publishedSlugs } from '../supabase/content'
import { publicContactEmail } from '../supabase/inquiry-settings'

export const defaultSettings: Settings = {
  ...company,
  navigation: [
    { label: 'Úvod', href: '/' }, { label: 'Přepravy', href: '/preprava' },
    { label: 'Vozidla a možnosti', href: '/moznosti' }, { label: 'Kontakt', href: '/kontakt' },
  ],
  footerText: 'Silniční přeprava a spedice\nv Česku i za hranicemi.',
  headerAction: { label: 'Poptat přepravu', href: '/kontakt#poptavka' },
  footerAction: { label: 'Poslat poptávku', href: '/kontakt#poptavka' },
  footerContactLabel: 'Přepravu s vámi řeší', footerTagline: 'Vnitrostátní a mezinárodní silniční přeprava',
  inquiryEmail: company.email, formHeading: 'Krátká poptávka',
  formDescription: 'Stačí základní údaje. Co bude potřeba, společně upřesníme. Hvězdičkou (*) jsou označené povinné údaje.',
  submitLabel: 'Odeslat poptávku', successMessage: 'Děkujeme. Poptávku jsme přijali a ozveme se vám s dalším postupem.',
}

export const getPage = cache(async (slug: string) =>
  readDocument<CmsPage>('page', slug, (await draftMode()).isEnabled))
export const getPublishedSlugs = publishedSlugs
export const getSettings = cache(async (): Promise<Settings> => {
  const [stored, email] = await Promise.all([
    readDocument<Partial<Settings>>('settings', undefined, (await draftMode()).isEnabled), publicContactEmail(),
  ])
  const settings = { ...defaultSettings, ...Object.fromEntries(Object.entries(stored || {}).filter(([, value]) => value != null)) } as Settings
  // The shared live contact setting applies to all published pages.
  settings.email = email
  delete settings.inquiryEmail
  settings.phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`
  return settings
})

export async function contentMetadata(slug: string, title: string, description: string, path: string) {
  const page = await getPage(slug)
  const { seoPages } = await import('../app/seo-pages')
  const fallback = seoPages[path === '/kontakt' ? 'kontakt' : slug]
  const bodyText = (page?.body || []).flatMap(block => block.children || []).map(child => child && typeof child === 'object' && 'text' in child && typeof child.text === 'string' ? child.text : '').join(' ').replace(/\s+/g, ' ').trim()
  const summary = description || page?.sections?.find(section => section.visible !== false && section.description)?.description || bodyText.slice(0, 160) || `Informace na stránce ${page?.title || title} společnosti AKRON Logistics.`
  const metadata = pageMetadata(page?.seoTitle || fallback?.title || title, page?.seoDescription || fallback?.description || summary, path)
  if ((await draftMode()).isEnabled) metadata.robots = { index: false, follow: false }
  const image = imageUrl(page?.shareImage)
  // Social crawlers do not reliably support SVG/PDF as preview images.
  if (image && /\.(?:png|jpe?g|webp)(?:[?#]|$)/i.test(image)) {
    metadata.openGraph = { ...metadata.openGraph, images: [{ url: image, alt: page?.shareImage?.alt || title }] }
    metadata.twitter = { ...metadata.twitter, images: [image] }
  }
  return metadata
}
