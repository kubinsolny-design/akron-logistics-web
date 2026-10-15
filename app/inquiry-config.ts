/** Only our private Supabase database can receive inquiries. Fail closed on stale routing. */
export function inquiryStorageProvider(env: Record<string, string | undefined> = process.env): 'supabase' {
  if (env.INQUIRY_PROVIDER && env.INQUIRY_PROVIDER !== 'supabase') throw new Error('Unsupported inquiry provider; use Supabase')
  return 'supabase'
}

export const inquiryRecipient = 'adam.bartusek@akronlogistics.cz'
export const defaultInquirySender = 'AKRON Logistics <web@akronlogistics.cz>'

export function validContactEmail(value: string) {
  return value.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value)
}

export function validInquirySender(sender: string) {
  return /^(?:[^<>\r\n]*<web@akronlogistics\.cz>|web@akronlogistics\.cz)$/i.test(sender.trim())
}
