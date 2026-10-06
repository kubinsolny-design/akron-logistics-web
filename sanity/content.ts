import 'server-only'
import { cache } from 'react'
import { draftMode } from 'next/headers'
import { client, imageUrl } from './client'
import { company } from '../app/site'
import { pageMetadata } from '../app/seo'
import type { CmsPage, Settings } from './types'
import { contentEnabled, readDocument, publishedSlugs } from '../supabase/content'

export const defaultSettings: Settings = {
  ...company,
  navigation: [
    { label: 'Úvod', href: '/' }, { label: 'Přepravy', href: '/preprava' },
    { label: 'Vozidla a možnosti', href: '/moznosti' }, { label: 'Spolupráce', href: '/spoluprace' },
  ],
  footerText: 'Silniční přeprava a spedice\nv Česku i za hranicemi.',
  headerAction: { label: 'Poptat přepravu', href: '/spoluprace#poptavka' },
  footerAction: { label: 'Poslat poptávku', href: '/spoluprace#poptavka' },
  footerContactLabel: 'Přepravu s vámi řeší', footerTagline: 'Vnitrostátní a mezinárodní silniční přeprava',
  inquiryEmail: company.email, formHeading: 'Krátká poptávka',
  formDescription: 'Stačí základní údaje. Co bude potřeba, společně upřesníme. Hvězdičkou (*) jsou označené povinné údaje.',
  submitLabel: 'Odeslat poptávku', successMessage: 'Děkujeme. Poptávku jsme přijali a ozveme se vám s dalším postupem.',
}

async function fetchContent<T>(query: string, params: Record<string, string> = {}): Promise<T | null> {
  const { isEnabled } = await draftMode()
  try {
    return await client.withConfig({
      token: isEnabled ? process.env.SANITY_API_READ_TOKEN : undefined,
      perspective: isEnabled ? 'drafts' : 'published',
    }).fetch<T>(query, params, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
  } catch {
    console.error('CMS content is temporarily unavailable.')
    return null
  }
}

export const getPage = cache(async (slug: string) => contentEnabled()
  ? readDocument<CmsPage>('page', slug, (await draftMode()).isEnabled)
  : fetchContent<CmsPage>('*[_type == "page" && slug.current == $slug][0]', { slug }))
export async function getPublishedSlugs() {
  if (contentEnabled()) return publishedSlugs()
  try {
    return await client.fetch<string[]>('*[_type == "page" && defined(slug.current) && !(_id in path("drafts.**"))].slug.current', {}, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
  } catch { return [] }
}
export const getSettings = cache(async (): Promise<Settings> => {
  const stored = contentEnabled()
    ? await readDocument<Partial<Settings>>('settings', undefined, (await draftMode()).isEnabled)
    : await fetchContent<Partial<Settings>>('*[_id == "siteSettings"][0]')
  const settings = { ...defaultSettings, ...Object.fromEntries(Object.entries(stored || {}).filter(([, value]) => value != null)) } as Settings
  settings.phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`
  return settings
})

export async function contentMetadata(slug: string, title: string, description: string, path: string) {
  const page = await getPage(slug)
  const metadata = pageMetadata(page?.seoTitle || title, page?.seoDescription || description, path)
  const image = imageUrl(page?.shareImage)
  if (image) {
    metadata.openGraph = { ...metadata.openGraph, images: [{ url: image, alt: page?.shareImage?.alt || title }] }
    metadata.twitter = { ...metadata.twitter, images: [image] }
  }
  return metadata
}
