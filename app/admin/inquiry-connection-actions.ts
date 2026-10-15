'use server'

import { currentMember, serviceClient } from '../../supabase/server'
import { hasServiceKey } from '../../supabase/server-key'
import { defaultInquirySender, inquiryStorageProvider, validInquirySender } from '../inquiry-config'
import { readInquirySettings } from '../../supabase/inquiry-settings'
import type { InquiryConnection } from '../inquiry-types'
import { preparing } from '../preparing'

export async function checkInquiryConnection(): Promise<InquiryConnection> {
  const denied: InquiryConnection = { authorized: false, message: 'Kontrola je dostupná pouze administrátorovi.', publicFormOpen: false, checks: [] }
  try {
    const member = await currentMember()
    if (!member || member.role !== 'admin') return denied
    const keyConfigured = hasServiceKey()
    const provider = inquiryStorageProvider() === 'supabase'
    let databaseReady = false
    let databaseNote = ''
    let recipient = ''
    try { recipient = (await readInquirySettings()).recipientEmail } catch { /* Missing or inaccessible configuration fails closed. */ }
    if (keyConfigured && provider) {
      try {
        // Invalid input must be rejected before any write. This checks the actual
        // server credential, migration and RPC access without creating a record.
        const { error } = await serviceClient().rpc('cms_accept_inquiry', { fields: {}, fingerprint: '0'.repeat(64) })
        databaseReady = error?.message === 'Missing fields'
        if (!databaseReady) databaseNote = error?.code === '42501' ? ' (nedostatečná oprávnění klíče)' : error?.code === 'PGRST202' ? ' (chybí databázová funkce)' : error?.message?.toLowerCase().includes('invalid api key') || error?.code === 'PGRST301' ? ' (klíč není platný pro tento projekt)' : ' (ověřte shodu projektu a platnost serverového klíče)'
      } catch { databaseNote = ' (serverové připojení není dostupné)' }
    }
    const checks = [
      { id: 'resend', label: 'RESEND_API_KEY je nastavený', ok: Boolean(process.env.RESEND_API_KEY?.trim()) },
      { id: 'sender', label: 'Odesílatel je web@akronlogistics.cz', ok: validInquirySender(process.env.INQUIRY_FROM_EMAIL?.trim() || defaultInquirySender) },
      { id: 'recipient', label: recipient ? `Příjemce: ${recipient}` : 'Chráněné nastavení příjemce je dostupné', ok: Boolean(recipient) },
      { id: 'provider', label: 'Poptávky se ukládají do Supabase administrace', ok: provider },
      { id: 'server', label: 'Privátní serverový klíč Supabase je nastavený', ok: keyConfigured },
      { id: 'database', label: `Databáze a zabezpečený příjem poptávek odpovídají${databaseNote}`, ok: databaseReady },
    ]
    return { authorized: true, publicFormOpen: !preparing, checks, message: checks.every(check => check.ok) ? 'Nastavení je připravené k chráněnému testu. Platnost Resend klíče ověří až skutečné odeslání.' : 'Propojení ještě není kompletní. Doplňte položky označené jako chybějící.' }
  } catch { return denied }
}
