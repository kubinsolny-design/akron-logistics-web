import 'server-only'
import { headers } from 'next/headers'
import { serviceClient } from './server'
import { requestFingerprint } from '../app/request-fingerprint'
import { serverServiceKey } from './server-key'

export async function storeInquiry(fields: Record<string, string>) {
  const client = serviceClient()
  const request = await headers()
  const fingerprint = requestFingerprint(request, serverServiceKey(), process.env.VERCEL === '1')
  const { data, error } = await client.rpc('cms_accept_inquiry', { fields, fingerprint })
  if (error) throw new Error(error.message.startsWith('Příliš mnoho') ? error.message : 'Inquiry storage unavailable')
  if (typeof data !== 'string') throw new Error('Inquiry storage unavailable')
  return data
}

export async function markInquiryEmail(id: string | null, state: 'sent' | 'failed') {
  if (!id) return
  try {
    const { error } = await serviceClient().from('cms_inquiries').update({ email_status: state }).eq('id', id)
    if (error) throw error
  } catch { console.error('Could not update inquiry delivery status.') }
}
