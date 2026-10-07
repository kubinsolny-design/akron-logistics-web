'use client'
import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from './config'

export function browserClient() {
  const { url, key } = supabaseConfig()
  // Invitations return implicit tokens; the SSR client defaults to PKCE.
  // The accept page explicitly handles both callbacks before validating the user.
  return createBrowserClient(url, key, { auth: { detectSessionInUrl: false } })
}
