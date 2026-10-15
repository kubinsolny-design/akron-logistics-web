import 'server-only'
import { cache } from 'react'
import { serviceClient } from './server'
import { inquiryRecipient, validContactEmail } from '../app/inquiry-config'

/** Private delivery configuration never comes from a submitted form or public CMS. */
export const readInquirySettings = cache(async () => {
  const { data, error } = await serviceClient().from('cms_inquiry_settings')
    .select('public_email,recipient_email,revision').eq('id', true).single()
  if (error || !data || !validContactEmail(data.public_email) || !validContactEmail(data.recipient_email)) throw new Error('Inquiry settings unavailable')
  return { publicEmail: data.public_email as string, recipientEmail: data.recipient_email as string, revision: data.revision as number }
})

/** Expose only the public contact, never the possibly different private recipient. */
export async function publicContactEmail() {
  try { return (await readInquirySettings()).publicEmail }
  catch { return inquiryRecipient }
}
