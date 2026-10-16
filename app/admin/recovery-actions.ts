'use server'

import { createHash } from 'node:crypto'
import { currentMember, serviceClient } from '../../supabase/server'
import { adminOrigin } from '../../supabase/admin-origin'
import { recoveryLink } from '../../supabase/recovery-link'
import { defaultInquirySender } from '../inquiry-config'

export async function sendMemberRecovery(userId: string) {
  const member = await currentMember()
  if (!member || member.role !== 'admin') return { ok: false, message: 'Obnovu může odeslat pouze administrátor.' }
  if (!/^[a-f0-9-]{36}$/i.test(userId)) return { ok: false, message: 'Neplatný účet.' }
  const origin = adminOrigin(process.env.ADMIN_SITE_URL)
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!origin || !apiKey) return { ok: false, message: 'Ověřte adresu administrace a propojení Resendu.' }
  try {
    // Authoritative active membership, not a browser-supplied recipient or role.
    const { data: target, error: targetError } = await member.client.from('cms_members')
      .select('user_id').eq('user_id', userId).is('revoked_at', null).maybeSingle()
    if (targetError || !target) return { ok: false, message: 'Účet nemá aktivní přístup.' }
    const service = serviceClient()
    const { data: account, error: accountError } = await service.auth.admin.getUserById(userId)
    if (accountError || !account.user?.email) return { ok: false, message: 'Přihlašovací účet se nepodařilo ověřit.' }
    const email = account.user.email
    const { data, error } = await service.auth.admin.generateLink({ type: 'recovery', email,
      options: { redirectTo: new URL('/admin/accept', origin).href } })
    if (error || data.user?.id !== userId || !data.properties?.hashed_token) return { ok: false, message: 'Obnovu se nepodařilo bezpečně připravit.' }
    const link = recoveryLink(origin, data.properties.hashed_token)
    const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    const instructions = 'Otevřete odkaz a na stránce stiskněte „Pokračovat k nastavení hesla“. Potom zadejte vlastní nové heslo. Odkaz je jednorázový a časově omezený. Použijte pouze nejnovější e-mail, nikomu ho nepřeposílejte. Pokud jste obnovu nečekali, kontaktujte správce.'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `akron-recovery-${createHash('sha256').update(link).digest('hex')}` },
      body: JSON.stringify({ from: defaultInquirySender, to: [email], subject: 'Nastavení nového hesla | AKRON Logistics',
        text: `Obnova hesla do administrace AKRON Logistics\n\n${instructions}\n\n${link}`,
        html: `<html lang="cs"><body style="font-family:Arial,sans-serif;color:#152236;line-height:1.7"><img src="${escape(origin)}/images/akron-email-logo.png" width="220" alt="AKRON Logistics"><h1>Nastavení nového hesla</h1><p>${instructions}</p><p><a href="${escape(link)}" style="display:inline-block;padding:14px 22px;background:#ff5a00;color:#152236;border-radius:6px;font-weight:bold">Obnovit heslo</a></p><p>Oprávnění vašeho účtu se nemění.</p></body></html>` }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return { ok: false, message: 'Resend odeslání odmítl. Doručení není potvrzené.' }
    // Never return the bearer link or provider payload to the caller or audit logs.
    return { ok: true, message: `Resend přijal obnovu hesla pro ${email}. Doručení ověřte v Resendu nebo ve schránce. Použijte pouze nejnovější odkaz.` }
  } catch { return { ok: false, message: 'Odeslání obnovy se nepodařilo potvrdit. Ověřte Resend před dalším pokusem.' } }
}
