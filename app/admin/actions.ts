'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { currentMember, serviceClient, sessionClient, type MemberRole } from '../../supabase/server'
import { supabaseEnabled } from '../../supabase/config'

export async function signIn(form: FormData) {
  if (!supabaseEnabled()) redirect('/studio/obsah')
  const email = String(form.get('email') || '').trim()
  const password = String(form.get('password') || '')
  if (email.length > 254 || password.length > 1024) redirect('/admin?error=login')
  const client = await sessionClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) redirect('/admin?error=login')
  redirect('/admin')
}

export async function signOut() {
  const client = await sessionClient()
  await client.auth.signOut()
  redirect('/admin')
}

export async function inviteMember(form: FormData): Promise<{ ok: boolean; message: string; invitationLink?: string }> {
  if (!supabaseEnabled()) return { ok: false, message: 'Nová administrace není zapnutá.' }
  const member = await currentMember()
  if (!member || member.role !== 'admin') return { ok: false, message: 'Pozvánky může odesílat pouze admin.' }
  const email = String(form.get('email') || '').trim().toLowerCase()
  const role = String(form.get('role') || '') as MemberRole
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !['admin', 'editor', 'viewer'].includes(role)) {
    return { ok: false, message: 'Zkontrolujte e-mail a zvolený přístup.' }
  }
  // Fixed deployment origin: never build invitation links from untrusted Host headers.
  const origin = process.env.ADMIN_SITE_URL
  if (!origin || new URL(origin).protocol !== 'https:') {
    return { ok: false, message: 'Nejdříve je nutné nastavit adresu administrace.' }
  }
  const service = serviceClient()
  const linkOnly = form.get('delivery') === 'link'
  const redirectTo = new URL('/admin/accept', origin).href
  const invitation = linkOnly
    ? await service.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
    : await service.auth.admin.inviteUserByEmail(email, { redirectTo })
  const { data, error } = invitation
  const properties = 'properties' in data ? data.properties : undefined
  const invitationLink = properties && typeof properties === 'object'
    && 'action_link' in properties && typeof properties.action_link === 'string'
    ? properties.action_link : undefined
  if (error || !data.user) {
    // Do not return provider errors containing internal configuration or tokens.
    return { ok: false, message: 'Pozvánku se nepodařilo odeslat. Uživatel už může být zaregistrovaný nebo není nastavené odesílání e-mailů.' }
  }
  // Use caller JWT for role assignment: the database rechecks current admin rights.
  const { error: roleError } = await member.client.rpc('cms_set_member_role', {
    target_user: data.user.id, new_role: role,
  })
  if (roleError) return { ok: false, message: 'Pozvánka odešla, ale přístup se nepodařilo přidělit. Kontaktujte správce; uživatel zatím neuvidí chráněný obsah.' }
  revalidatePath('/admin')
  if (linkOnly && invitationLink) {
    return { ok: true, message: 'Osobní pozvánka je připravená. Předejte ji pouze pozvanému člověku; odkaz umožňuje přijmout jeho přístup.', invitationLink }
  }
  return { ok: true, message: 'Pozvánka byla odeslána. Uživatel si přes ni nastaví vlastní heslo.' }
}
