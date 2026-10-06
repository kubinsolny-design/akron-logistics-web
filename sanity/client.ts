import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { CmsImage } from './types'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'l802e097',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-10-01', useCdn: false,
})

export function imageUrl(image?: CmsImage, width = 1600) {
  if (!image?.asset?._ref) return undefined
  try { return imageUrlBuilder(client).image(image).width(width).auto('format').url() }
  catch { return undefined }
}

export function safeHref(value?: string) {
  if (!value) return '#'
  if (/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value)) return value
  return '#'
}
