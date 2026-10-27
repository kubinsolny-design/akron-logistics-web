import 'server-only'
import { cache } from 'react'
import { serviceClient } from './server'
import { inquiryRecipient, validContactEmail } from '../app/inquiry-config'
import { unstable_cache } from 'next/cache'
import { publicContactTag, publicContentLifetime } from './content-cache'

/** Private delivery configuration never comes from a submitted form or public CMS. */
export const readInquirySettings = cache(async () => {
  const { data, error } = await serviceClient().from('cms_inquiry_settings')
    .select('public_email,recipient_email,revision').eq('id', true).single()
  if (error || !data || !validContactEmail(data.public_email) || !validContactEmail(data.recipient_email)) throw new Error('Inquiry settings unavailable')
  return { publicEmail: data.public_email as string, recipientEmail: data.recipient_email as string, revision: data.revision as number }
})

/** Expose only the public contact, never the possibly different private recipient. */
const readPublicContact = unstable_cache(async (): Promise<string> => {
  // Project just the public address; private recipients never enter shared cache.
  const { data, error } = await serviceClient().from('cms_inquiry_settings')
    .select('public_email').eq('id', true).single()
  if (error || !data || !validContactEmail(data.public_email)) throw new Error('Public contact unavailable')
  return data.public_email
}, ['akron-public-contact-v1'], { tags: [publicContactTag], revalidate: publicContentLifetime })

export async function publicContactEmail() {
  try { return await readPublicContact() }
  catch { return inquiryRecipient }
}
