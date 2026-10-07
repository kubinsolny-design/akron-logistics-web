import 'server-only'
import { createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { serviceClient } from './server'
import { storeInquiry as storeSanity, markInquiryEmail as markSanity } from '../sanity/inquiries'

const enabled = () => process.env.CMS_PROVIDER === 'supabase'

export async function storeInquiry(fields: Record<string, string>) {
  if (!enabled()) return storeSanity(fields)
  const client = serviceClient()
  const request = await headers()
  const ip = request.get('x-vercel-forwarded-for') || request.get('x-forwarded-for') || ''
  const fingerprint = createHmac('sha256', process.env.SUPABASE_SECRET_KEY!)
    .update(`${ip}:${fields.email.toLowerCase()}`).digest('hex')
  const { data, error } = await client.rpc('cms_accept_inquiry', { fields, fingerprint })
  if (error) throw new Error(error.message.startsWith('Příliš mnoho') ? error.message : 'Inquiry storage unavailable')
  if (typeof data !== 'string') throw new Error('Inquiry storage unavailable')
  return data
}

export async function markInquiryEmail(id: string | null, state: 'sent' | 'failed') {
  if (!enabled()) return markSanity(id, state)
  if (!id) return
  try {
    const { error } = await serviceClient().from('cms_inquiries').update({ email_status: state }).eq('id', id)
    if (error) throw error
  } catch { console.error('Could not update inquiry delivery status.') }
}
