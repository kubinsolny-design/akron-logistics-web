import type { CmsImage } from './types'
import { safePublicHref } from '../app/public-links'
import { migratedMediaUrl } from './migrated-media'

/** Public media can only come from our deployment or our own Storage bucket. */
export function imageUrl(image?: CmsImage, width = 1600) {
  // Kept for existing callers; next/image handles responsive sizing locally.
  void width
  const value = image?.url || migratedMediaUrl(image?.asset?._ref)
  return ownedMediaUrl(value)
}

export function ownedMediaUrl(value?: string) {
  if (!value) return undefined
  if (/^\/images\/[a-z0-9_./-]+$/i.test(value) && !value.includes('..')) return value
  try {
    const url = new URL(value)
    const allowedHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://htgwzjcdxbknzvobwioa.supabase.co').hostname
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port && url.hostname === allowedHost
      && url.pathname.startsWith('/storage/v1/object/public/site-media/')) return url.href
  } catch { return undefined }
}

export function safeHref(value?: string) {
  return safePublicHref(value)
}
