import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfig, supabaseEnabled } from './supabase/config'

export async function proxy(request: NextRequest) {
  if (!supabaseEnabled()) return NextResponse.next()
  const { url, key } = supabaseConfig()
  let response = NextResponse.next({ request })
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  await client.auth.getClaims()
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] }
