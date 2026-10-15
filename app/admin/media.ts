import { imageUrl, ownedMediaUrl } from '../../content/client'

export type MediaFile = { path: string; name: string; url: string; source: 'storage' | 'website'; mime?: string; size?: number; created?: string }
export const uploadTypes: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }
export const maxFileSize = 10 * 1024 * 1024

export function safeMediaUrl(url: string) {
  return Boolean(ownedMediaUrl(url))
}

// Include current deployment assets as well as uploaded Storage media.
export function referencedMedia(documents: { data: unknown }[]): MediaFile[] {
  const found = new Map<string, MediaFile>()
  function add(url: string, label?: string) {
    if (!safeMediaUrl(url) || found.has(url)) return
    const name = label || url.split('/').pop()?.split('?')[0] || 'Soubor webu'
    found.set(url, { path: url, name, url, source: 'website' })
  }
  function walk(value: unknown, field = '') {
    if (Array.isArray(value)) { value.forEach(item => walk(item, field)); return }
    if (!value || typeof value !== 'object') {
      if (typeof value === 'string' && (field === 'imagePath' || (['href', 'url'].includes(field) && /\.(?:pdf|jpe?g|png|webp|gif|svg)(?:\?|$)/i.test(value)))) add(value)
      return
    }
    const item = value as Record<string, unknown>
    const asset = item.asset as { _ref?: string } | undefined
    if (asset?._ref?.startsWith('image-')) {
      const url = imageUrl({ asset: { _ref: asset._ref }, url: typeof item.url === 'string' ? item.url : undefined }, 2400)
      if (url) add(url, typeof item.alt === 'string' && item.alt ? item.alt : undefined)
    }
    if (typeof item.url === 'string' && ['image', 'logo', 'lightLogo', 'portrait', 'shareImage'].includes(field)) add(item.url)
    Object.entries(item).forEach(([key, entry]) => walk(entry, key))
  }
  documents.forEach(document => walk(document.data))
  return [...found.values()]
}

export function mediaUploadPath(file: { name: string; type: string }, id: string) {
  const extension = uploadTypes[file.type]
  if (!extension) throw new Error('Unsupported file type')
  const stem = file.name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 70) || 'soubor'
  return `${id}-${stem}.${extension}`
}
