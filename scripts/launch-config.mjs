// Configuration checks only. Never prints values or contacts the database.
export function launchConfigChecks(env) {
  const present = key => Boolean(env[key]?.trim()) && !/replace_with|xxxxxxxx|^fixture-|^test-only/i.test(env[key])
  const sender = (env.INQUIRY_FROM_EMAIL || '').trim().match(/^(?:[^<>]*<([^<>]+)>|([^<>\s]+))$/)
  const senderEmail = (sender?.[1] || sender?.[2] || '').trim().toLowerCase()
  return [
    ['Public URL is the canonical domain', env.NEXT_PUBLIC_SITE_URL === 'https://akronlogistics.cz'],
    ['Admin URL is the canonical domain', env.ADMIN_SITE_URL === 'https://akronlogistics.cz'],
    ['Admin uses Supabase', env.NEXT_PUBLIC_ADMIN_PROVIDER === 'supabase'],
    ['Published content uses Supabase (only after migration)', env.CMS_PROVIDER === 'supabase'],
    ['Existing Supabase project selected', env.NEXT_PUBLIC_SUPABASE_URL === 'https://htgwzjcdxbknzvobwioa.supabase.co'],
    ['Publishable key configured', present('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')],
    ['Server-only Supabase key configured', present('SUPABASE_SECRET_KEY') || present('SUPABASE_SERVICE_ROLE_KEY')],
    ['Server-only Resend key configured', present('RESEND_API_KEY')],
    ['Recipient is the customer mailbox', env.INQUIRY_TO_EMAIL?.trim().toLowerCase() === 'info@akronlogistics.cz'],
    ['Sender uses the customer domain', /^[^@\s<>]+@akronlogistics\.cz$/.test(senderEmail)],
    ['No privileged keys exposed with NEXT_PUBLIC_', !Object.keys(env).some(key => key.startsWith('NEXT_PUBLIC_') && /SECRET|SERVICE_ROLE|RESEND_API_KEY/.test(key) && env[key])],
  ].map(([check, ok]) => ({ check, ok: Boolean(ok) }))
}
