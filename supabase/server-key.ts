import 'server-only'

export function hasServiceKey() {
  return Boolean(process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

export function serverServiceKey() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) throw new Error('Supabase server credentials are not configured')
  return key
}
