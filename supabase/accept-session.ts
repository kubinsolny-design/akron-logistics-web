import type { SupabaseClient } from '@supabase/supabase-js'

type CallbackAuth = Pick<SupabaseClient['auth'], 'setSession' | 'exchangeCodeForSession' | 'getUser' | 'verifyOtp'>

/** Bridge emailed implicit invitations to SSR cookies without weakening user validation. */
export async function acceptSession(auth: CallbackAuth, href: string, clearUrl: () => void): Promise<boolean> {
  const url = new URL(href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const accessToken = hash.get('access_token')
  const refreshToken = hash.get('refresh_token')
  const code = url.searchParams.get('code')
  const tokenHash = hash.get('token_hash')
  const callbackError = hash.has('error') || hash.has('error_code') || url.searchParams.has('error')
  // Remove credentials from browser history before any network operation.
  clearUrl()
  if (callbackError) return false
  if (tokenHash) {
    if (!/^[a-f0-9]{64}$/i.test(tokenHash) || hash.get('type') !== 'recovery' || accessToken || refreshToken || code) return false
    const { error } = await auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    if (error) return false
  } else if (accessToken || refreshToken) {
    if (!accessToken || !refreshToken || code) return false
    const { error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    if (error) return false
  } else if (code) {
    const { error } = await auth.exchangeCodeForSession(code)
    if (error) return false
  }
  // Never grant access based solely on unverified URL tokens or local session data.
  const { data, error } = await auth.getUser()
  return Boolean(data.user) && !error
}
