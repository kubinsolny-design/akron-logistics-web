/** Inquiry storage is independent of the public content provider. */
export function inquiryStorageProvider(env: Record<string, string | undefined> = process.env): 'supabase' | 'sanity' {
  if (env.INQUIRY_PROVIDER && !['supabase', 'sanity'].includes(env.INQUIRY_PROVIDER)) throw new Error('Invalid inquiry provider')
  if (env.INQUIRY_PROVIDER) return env.INQUIRY_PROVIDER as 'supabase' | 'sanity'
  return env.CMS_PROVIDER === 'supabase' || env.NEXT_PUBLIC_ADMIN_PROVIDER === 'supabase' ? 'supabase' : 'sanity'
}

export const inquiryRecipient = 'info@akronlogistics.cz'
export const defaultInquirySender = 'AKRON Logistics <web@akronlogistics.cz>'

export function validInquirySender(sender: string) {
  return /^(?:[^<>\r\n]*<[^<>\s@]+@akronlogistics\.cz>|[^<>\s@]+@akronlogistics\.cz)$/i.test(sender.trim())
}
