import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfig, supabaseEnabled } from './supabase/config'
import { preparing, hidePublicPage, preparingHtml } from './app/preparing'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (preparing && hidePublicPage(path)) return new NextResponse(preparingHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' },
  })
  // Preserve the existing auth/session refresh only on admin routes.
  if (!(path === '/admin' || path.startsWith('/admin/') || path === '/api/admin' || path.startsWith('/api/admin/'))) return NextResponse.next()
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

export const config = { matcher: ['/((?!_next/static|_next/image|images/|favicon.png|icon.svg|apple-icon).*)'] }
