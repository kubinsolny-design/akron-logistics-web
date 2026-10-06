import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
import { currentMember } from './server'

export function contentEnabled() { return process.env.CMS_PROVIDER === 'supabase' }

function publicClient() {
  const { url, key } = supabaseConfig()
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(6000) }) },
  })
}

export async function readDocument<T>(kind: 'page' | 'settings', slug?: string, draft = false): Promise<T | null> {
  try {
    const member = draft ? await currentMember() : null
    if (draft && !member) return null
    const client = member?.client || publicClient()
    let query = client.from(draft ? 'cms_drafts' : 'cms_published').select('data').eq('kind', kind)
    query = kind === 'settings' ? query.eq('id', 'site-settings') : query.eq('data->slug->>current', slug || '')
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    return data?.data as T || null
  } catch {
    console.error('Supabase content is temporarily unavailable.')
    return null
  }
}

export async function publishedSlugs(): Promise<string[]> {
  const { data, error } = await publicClient().from('cms_published').select('data').eq('kind', 'page')
  if (error) return []
  return (data || []).map(item => item.data?.slug?.current).filter((slug): slug is string => typeof slug === 'string')
}
