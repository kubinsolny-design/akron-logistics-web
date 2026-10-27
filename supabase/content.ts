import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
import { currentMember } from './server'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { publicContentTag, publicContentLifetime } from './content-cache'

export const contentEnabled = cache(async () => {
  // Publishing is enabled only after the existing database handover marker.
  // There is intentionally no alternate CMS fallback, even on database failure.
  try { const {data,error} = await publicClient().from('cms_site_state').select('enabled').eq('id',true).single(); return !error && data?.enabled === true }
  catch {return false}
})

function publicClient() {
  const { url, key } = supabaseConfig()
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(6000) }) },
  })
}

const publishedDocument = unstable_cache(async (kind: 'page' | 'settings', slug: string) => {
  // Anonymous client only. Request cookies and the draft flag never enter this cache.
  let query = publicClient().from('cms_published').select('data').eq('kind', kind)
  query = kind === 'settings' ? query.eq('id', 'site-settings') : query.eq('data->slug->>current', slug)
  const { data, error } = await query.maybeSingle()
  // Throw inside the cached function: an outage must not cache fallback content.
  if (error) throw new Error('Published content unavailable')
  return data?.data || null
}, ['akron-published-document-v1'], { tags: [publicContentTag], revalidate: publicContentLifetime })

export async function readDocument<T>(kind: 'page' | 'settings', slug?: string, draft = false): Promise<T | null> {
  try {
    if (!draft) return await publishedDocument(kind, slug || '') as T | null
    // Fresh membership and uncached caller-bound database access for every preview.
    const member = await currentMember()
    if (!member) return null
    let query = member.client.from('cms_drafts').select('data').eq('kind', kind)
    query = kind === 'settings' ? query.eq('id', 'site-settings') : query.eq('data->slug->>current', slug || '')
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    return data?.data as T || null
  } catch {
    console.error('Supabase content is temporarily unavailable.')
    return null
  }
}

const readPublishedSlugs = unstable_cache(async (): Promise<string[]> => {
  const { data, error } = await publicClient().from('cms_published').select('data').eq('kind', 'page')
  if (error) throw new Error('Published slugs unavailable')
  return (data || []).map(item => item.data?.slug?.current).filter((slug): slug is string => typeof slug === 'string')
}, ['akron-published-slugs-v1'], { tags: [publicContentTag], revalidate: publicContentLifetime })

export async function publishedSlugs(): Promise<string[]> {
  try { return await readPublishedSlugs() }
  catch { return [] }
}
