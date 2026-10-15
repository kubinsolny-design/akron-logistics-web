import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseConfig } from './config'
import { serverServiceKey } from './server-key'

export type MemberRole = 'admin' | 'editor' | 'viewer'

export async function sessionClient() {
  const { url, key } = supabaseConfig()
  const store = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        // Server Components cannot set cookies. The proxy refreshes them.
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)) }
        catch { /* Read-only rendering context. */ }
      },
    },
  })
}

export async function currentMember() {
  const client = await sessionClient()
  // Fresh Auth verification, not unverified cookie/session data.
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return null
  const { data, error: roleError } = await client.from('cms_members')
    .select('role').eq('user_id', user.id).maybeSingle()
  if (roleError || !data || !['admin', 'editor', 'viewer'].includes(data.role)) return null
  return { client, user, role: data.role as MemberRole }
}

export function serviceClient() {
  const { url } = supabaseConfig()
  const key = serverServiceKey()
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
