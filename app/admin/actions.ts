'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { currentMember, serviceClient, sessionClient, type MemberRole } from '../../supabase/server'
import { supabaseEnabled } from '../../supabase/config'
import { adminOrigin } from '../../supabase/admin-origin'
import { invitationEmail } from './invitation-email'
import { defaultInquirySender } from '../inquiry-config'
import { createHash } from 'node:crypto'

async function deliverInvitation(email:string, origin:string, invitationLink:string, role:string, apiKey:string, preview=false) {
  const message = invitationEmail({origin,invitationLink,role,preview})
  const identity = preview ? `preview-${email}-${Math.floor(Date.now()/600_000)}` : invitationLink
  const response = await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',
      'Idempotency-Key':`akron-invite-${createHash('sha256').update(identity).digest('hex')}`},
    body:JSON.stringify({from:defaultInquirySender,to:[email],...message}),signal:AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error('Invite transport rejected')
}

export async function sendInvitationPreview() {
  const member=await currentMember()
  if(!member || member.role!=='admin' || !member.user.email)return{ok:false,message:'Náhled si může poslat pouze přihlášený administrátor.'}
  const origin=adminOrigin(process.env.ADMIN_SITE_URL),apiKey=process.env.RESEND_API_KEY?.trim()
  if(!origin||!apiKey)return{ok:false,message:'Ověřte adresu administrace a propojení Resendu.'}
  try{
    await deliverInvitation(member.user.email,origin,new URL('/admin',origin).href,'editor',apiKey,true)
    return{ok:true,message:'Resend přijal náhled pro vaši přihlašovací e-mailovou adresu. Náhled nevytváří účet ani nemění oprávnění; ověřte doručení ve schránce.'}
  }catch{return{ok:false,message:'Odeslání náhledu se nepodařilo potvrdit. Ověřte Resend a svou schránku.'}}
}

export async function signIn(form: FormData) {
  if (!supabaseEnabled()) redirect('/admin?error=unavailable')
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
  const origin = adminOrigin(process.env.ADMIN_SITE_URL)
  if (!origin) {
    return { ok: false, message: 'Nejdříve je nutné nastavit adresu administrace.' }
  }
  // Missing server credentials or a transport outage must not crash the UI.
  let invitation
  const linkOnly = form.get('delivery') === 'link'
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!linkOnly && !apiKey) return {ok:false,message:'Odesílání pozvánek není nastavené. Správce musí ověřit Resend; případně zvolte osobní odkaz.'}
  const redirectTo = new URL('/admin/accept', origin).href
  try {
    const service = serviceClient()
    // Supabase creates the single-use token; our transactional provider sends
    // the branded email only after the caller's role assignment succeeds.
    invitation = await service.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
  } catch {
    return { ok: false, message: 'Pozvánky nejsou momentálně dostupné. Správce musí ověřit serverové propojení a nastavení přihlašování.' }
  }
  const { data, error } = invitation
  const properties = 'properties' in data ? data.properties : undefined
  const invitationLink = properties && typeof properties === 'object'
    && 'action_link' in properties && typeof properties.action_link === 'string'
    ? properties.action_link : undefined
  if (error || !data.user || !invitationLink) {
    // Do not return provider errors containing internal configuration or tokens.
    return { ok: false, message: 'Pozvánku se nepodařilo odeslat. Uživatel už může být zaregistrovaný nebo není nastavené odesílání e-mailů.' }
  }
  try {
    const target = new URL(invitationLink)
    if (target.origin !== process.env.NEXT_PUBLIC_SUPABASE_URL || target.pathname !== '/auth/v1/verify'
      || target.searchParams.get('type') !== 'invite' || target.searchParams.get('redirect_to') !== redirectTo) throw new Error('Unexpected invite link')
  } catch { return {ok:false,message:'Pozvánku nelze bezpečně připravit. Správce musí ověřit adresy přihlašování.'} }
  // Use caller JWT for role assignment: the database rechecks current admin rights.
  const { error: roleError } = await member.client.rpc('cms_set_member_role', {
    target_user: data.user.id, new_role: role,
  })
  if (roleError) return { ok: false, message: 'Přístup se nepodařilo přidělit. Pozvánka nebyla odeslaná; kontaktujte správce.' }
  revalidatePath('/admin')
  if (linkOnly && invitationLink) {
    return { ok: true, message: 'Osobní pozvánka je připravená. Předejte ji pouze pozvanému člověku; odkaz umožňuje přijmout jeho přístup.', invitationLink }
  }
  try {
    await deliverInvitation(email,origin,invitationLink,role,apiKey!)
  } catch {return {ok:false,message:'Přístup je připravený, ale odeslání e-mailu se nepodařilo potvrdit. Ověřte doručení a Resend; lze také připravit osobní odkaz.'}}
  return { ok: true, message: 'Pozvánka byla odeslána. Uživatel si přes ni nastaví vlastní heslo.' }
}
