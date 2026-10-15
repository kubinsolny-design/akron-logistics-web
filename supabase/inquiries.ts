import 'server-only'
import { headers } from 'next/headers'
import { serviceClient } from './server'
import { storeInquiry as storeSanity, markInquiryEmail as markSanity } from '../sanity/inquiries'
import { requestFingerprint } from '../app/request-fingerprint'

const enabled = () => process.env.CMS_PROVIDER === 'supabase'

export async function storeInquiry(fields: Record<string, string>) {
  if (!enabled()) return storeSanity(fields)
  const client = serviceClient()
  const request = await headers()
  const fingerprint = requestFingerprint(request, process.env.SUPABASE_SECRET_KEY!, process.env.VERCEL === '1')
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
