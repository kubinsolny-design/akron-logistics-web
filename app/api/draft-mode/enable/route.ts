import { draftMode } from 'next/headers'
import { currentMember } from '../../../../supabase/server'
import { readDocument } from '../../../../supabase/content'

/** Legacy external-CMS preview links no longer enable a cookie. */
export function GET() {
  return new Response('Use the authenticated administration.', { status: 410 })
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  if (request.headers.get('origin') !== origin) return new Response('Forbidden', { status: 403 })
  if (!await currentMember()) return new Response('Unauthorized', { status: 401 })
  const form = await request.formData()
  const path = form.get('path')
  if (typeof path !== 'string' || !/^\/(?:[a-z0-9][a-z0-9-]{0,74})?$/.test(path)) return new Response('Invalid path', { status: 400 })
  const slug = path === '/' ? 'home' : path === '/kontakt' ? 'spoluprace' : path.slice(1)
  if (!await readDocument('page', slug, true)) return new Response('Page not found', { status: 404 })
  const draft = await draftMode()
  draft.enable()
  return Response.redirect(new URL(path, origin), 303)
}
