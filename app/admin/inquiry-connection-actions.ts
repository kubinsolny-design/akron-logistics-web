'use server'

import { currentMember, serviceClient } from '../../supabase/server'
import { hasServiceKey } from '../../supabase/server-key'
import { defaultInquirySender, inquiryRecipient, inquiryStorageProvider, validInquirySender } from '../inquiry-config'
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
    if (keyConfigured && provider) {
      try {
        // Invalid input must be rejected before any write. This checks the actual
        // server credential, migration and RPC access without creating a record.
        const { error } = await serviceClient().rpc('cms_accept_inquiry', { fields: {}, fingerprint: '0'.repeat(64) })
        databaseReady = error?.message === 'Missing fields'
      } catch { /* Return only readiness, never provider details or credentials. */ }
    }
    const checks = [
      { id: 'resend', label: 'RESEND_API_KEY je nastavený', ok: Boolean(process.env.RESEND_API_KEY?.trim()) },
      { id: 'sender', label: 'Odesílací adresa používá akronlogistics.cz', ok: validInquirySender(process.env.INQUIRY_FROM_EMAIL?.trim() || defaultInquirySender) },
      { id: 'recipient', label: 'Příjemce je info@akronlogistics.cz', ok: (process.env.INQUIRY_TO_EMAIL?.trim() || inquiryRecipient).toLowerCase() === inquiryRecipient },
      { id: 'provider', label: 'Poptávky se ukládají do Supabase administrace', ok: provider },
      { id: 'server', label: 'Privátní serverový klíč Supabase je nastavený', ok: keyConfigured },
      { id: 'database', label: 'Databáze a zabezpečený příjem poptávek odpovídají', ok: databaseReady },
    ]
    return { authorized: true, publicFormOpen: !preparing, checks, message: checks.every(check => check.ok) ? 'Nastavení je připravené k chráněnému testu. Platnost Resend klíče ověří až skutečné odeslání.' : 'Propojení ještě není kompletní. Doplňte položky označené jako chybějící.' }
  } catch { return denied }
}
