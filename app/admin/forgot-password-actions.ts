'use server'

import { createHash, createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { serviceClient } from '../../supabase/server'
import { serverServiceKey } from '../../supabase/server-key'
import { adminOrigin } from '../../supabase/admin-origin'
import { recoveryLink } from '../../supabase/recovery-link'
import { supabaseEnabled } from '../../supabase/config'
import { requestFingerprint } from '../request-fingerprint'
import { defaultInquirySender } from '../inquiry-config'

const neutralMessage = 'Pokud má tato e-mailová adresa aktivní přístup, pošleme na ni odkaz pro nastavení nového hesla. Zkontrolujte i spam. Další žádost zkuste nejdříve za minutu; používejte pouze nejnovější e-mail.'

async function requestRecovery(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase()
  if (!supabaseEnabled() || form.get('website') || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
  const origin = adminOrigin(process.env.ADMIN_SITE_URL), apiKey = process.env.RESEND_API_KEY?.trim()
  if (!origin || !apiKey) return
  const secret = serverServiceKey(), service = serviceClient()
  const { data: userId, error: quotaError } = await service.rpc('cms_request_password_recovery', {
    email_address: email,
    email_fingerprint: createHmac('sha256', secret).update(`recovery-email:${email}`).digest('hex'),
    ip_fingerprint: requestFingerprint(await headers(), secret, process.env.VERCEL === '1'),
  })
  // Fail closed: no token or email if the atomic limit is absent or denies access.
  if (quotaError || typeof userId !== 'string') return
  const { data: account, error: accountError } = await service.auth.admin.getUserById(userId)
  if (accountError || account.user?.email?.toLowerCase() !== email) return
  const { data, error } = await service.auth.admin.generateLink({ type: 'recovery', email: account.user.email,
    options: { redirectTo: new URL('/admin/accept', origin).href } })
  if (error || data.user?.id !== userId || !data.properties?.hashed_token) return
  const link = recoveryLink(origin, data.properties.hashed_token)
  const escapedLink = link.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const instructions = 'Otevřete odkaz a stiskněte „Pokračovat k nastavení hesla“. Potom si nastavte nové heslo. Odkaz je jednorázový a časově omezený. Nikomu ho nepřeposílejte a použijte jen nejnovější e-mail. Pokud jste o obnovu nežádali, zprávu ignorujte; původní heslo se nemění.'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
      'Idempotency-Key': `akron-self-recovery-${createHash('sha256').update(link).digest('hex')}` },
    body: JSON.stringify({ from: defaultInquirySender, to: [account.user.email], subject: 'Nastavení nového hesla | AKRON Logistics',
      text: `Obnova hesla do administrace AKRON Logistics\n\n${instructions}\n\n${link}`,
      html: `<html lang="cs"><body style="font-family:Arial,sans-serif;color:#152236;line-height:1.7"><h1>Obnova hesla</h1><p>${instructions}</p><p><a href="${escapedLink}" style="display:inline-block;padding:14px 22px;background:#ff5a00;color:#152236;border-radius:6px;font-weight:bold">Obnovit heslo</a></p><p>AKRON Logistics · Administrace webu</p></body></html>` }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error('Recovery mail not accepted')
}

export async function requestPasswordRecovery(_previous: { message: string }, form: FormData) {
  // Same response for unknown, revoked, limited and valid identities. No tokens,
  // email addresses, provider failures or account-existence flags are returned.
  await Promise.all([
    requestRecovery(form).catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 1500)),
  ])
  return { message: neutralMessage }
}
