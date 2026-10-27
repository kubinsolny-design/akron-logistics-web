'use server'

import { currentMember, serviceClient } from '../../supabase/server'
import { readInquirySettings } from '../../supabase/inquiry-settings'
import { defaultInquirySender, validInquirySender } from '../inquiry-config'
import { inquiryMessage, sendEmailWithRetry } from '../../supabase/inquiry-email'
import { markInquiryEmail } from '../../supabase/inquiries'

export type Overview = { status: 'ready'; fresh: number; processing: number; month: number; failed: number; stalled: number; recent: { id: string; name: string; route: string; createdAt: string; status: string }[] } | { status: 'error' | 'readonly'; message: string }

export async function loadOverview(): Promise<Overview> {
  try {
    const member = await currentMember()
    if (!member || !['admin', 'editor'].includes(member.role)) return { status: 'readonly', message: 'Tento účet má přístup pouze k náhledu obsahu.' }
    const base = () => member.client.from('cms_inquiries').select('id', { count: 'exact', head: true }).is('deleted_at', null)
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const [fresh, processing, month, failed, stalled, recent] = await Promise.all([
      base().eq('status', 'new'), base().eq('status', 'processing'), base().gte('created_at', since),
      base().eq('email_status', 'failed'), base().eq('email_status', 'pending').lt('created_at', new Date(Date.now() - 120000).toISOString()),
      member.client.from('cms_inquiries').select('id,contact_name,loading_place,unloading_place,created_at,status').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
    ])
    if ([fresh, processing, month, failed, stalled, recent].some(result => result.error)) throw new Error('Overview unavailable')
    return { status: 'ready', fresh: fresh.count || 0, processing: processing.count || 0, month: month.count || 0, failed: failed.count || 0, stalled: stalled.count || 0,
      recent: (recent.data || []).map(row => ({ id: String(row.id), name: String(row.contact_name), route: `${row.loading_place} → ${row.unloading_place}`, createdAt: String(row.created_at), status: String(row.status) })) }
  } catch { return { status: 'error', message: 'Přehled se nepodařilo načíst. Zkuste jej obnovit; nezobrazujeme neověřené nulové počty.' } }
}

/** No arbitrary recipient or payload accepted from the browser. Atomic failed→pending claim. */
export async function retryInquiryEmail(id: unknown): Promise<{ ok: boolean; message: string }> {
  let claimed: string | null = null
  try {
    const member = await currentMember()
    if (!member || member.role !== 'admin' || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { ok: false, message: 'Odeslání může zopakovat pouze přihlášený administrátor.' }
    const key = process.env.RESEND_API_KEY?.trim()
    const sender = process.env.INQUIRY_FROM_EMAIL?.trim() || defaultInquirySender
    if (!key || !validInquirySender(sender)) return { ok: false, message: 'Nejdříve je potřeba opravit nastavení odesílání.' }
    const { recipientEmail } = await readInquirySettings()
    // Stay safely inside Resend's 24-hour idempotency window. Never resend sent,
    // deleted or stale records, or take over an in-flight initial delivery.
    const { data, error } = await serviceClient().from('cms_inquiries').update({ email_status: 'pending' })
      .eq('id', id).eq('email_status', 'failed').is('deleted_at', null).gte('created_at', new Date(Date.now() - 23 * 3600000).toISOString())
      .select('id,loading_place,unloading_place,requested_date,frequency,cargo,contact_name,email,phone').maybeSingle()
    if (error || !data) return { ok: false, message: 'Záznam již zpracovává jiný požadavek, byl odeslán, nebo je starší než 23 hodin. U staršího nejdříve ověřte doručení v Resendu; záměrně neriskujeme duplicitní e-mail.' }
    claimed = id
    const fields = { pickup: String(data.loading_place), delivery: String(data.unloading_place), date: String(data.requested_date).slice(0, 10), frequency: String(data.frequency), cargo: String(data.cargo), name: String(data.contact_name), email: String(data.email || ''), phone: String(data.phone || '') }
    if (/TECHNICKÝ TEST/i.test(fields.pickup)) { await markInquiryEmail(id, 'failed'); return { ok: false, message: 'Starý technický test znovu neposíláme. Použijte výslovný test správce.' } }
    const sent = await sendEmailWithRetry(inquiryMessage(fields, sender, [recipientEmail]), id, key)
    await markInquiryEmail(id, sent ? 'sent' : 'failed')
    return { ok: sent, message: sent ? 'Resend přijal upozornění. Poptávka zůstává v administraci; nejde o potvrzení doručení do schránky.' : 'Odeslání stále selhává. Poptávka je uložená; správce musí zkontrolovat Resend a adresu příjemce.' }
  } catch {
    if (claimed) await markInquiryEmail(claimed, 'failed')
    return { ok: false, message: 'Opakování se nepodařilo potvrdit. Ověřte přihlášení a stav v Resendu.' }
  }
}
