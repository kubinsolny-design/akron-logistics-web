'use server'

import { currentMember } from '../../supabase/server'
import { validContactEmail } from '../inquiry-config'
import type { InquiryState } from '../inquiry-types'
import { revalidatePath } from 'next/cache'

export async function loadInquirySettings() {
  const member = await currentMember()
  if (!member || member.role !== 'admin') return null
  const { data, error } = await member.client.from('cms_inquiry_settings')
    .select('public_email,recipient_email,revision').eq('id', true).single()
  if (error || !data) return null
  return { publicEmail: String(data.public_email), recipientEmail: String(data.recipient_email), revision: Number(data.revision) }
}

export async function saveInquirySettings(_previous: InquiryState, data: FormData): Promise<InquiryState> {
  try {
    const member = await currentMember()
    if (!member || member.role !== 'admin') return { status: 'error', message: 'E-mailové adresy může změnit pouze administrátor.' }
    const contact = String(data.get('publicEmail') || '').trim().toLowerCase()
    const recipient = String(data.get('recipientEmail') || '').trim().toLowerCase()
    const revision = Number(data.get('revision'))
    if (!validContactEmail(contact) || !validContactEmail(recipient) || !Number.isSafeInteger(revision) || revision < 1) return { status: 'error', message: 'Zadejte dvě platné e-mailové adresy a nejdříve načtěte aktuální nastavení.' }
    const { error } = await member.client.rpc('cms_update_inquiry_settings', { contact_email: contact, delivery_email: recipient, expected_revision: revision })
    if (error) return { status: 'error', message: error.message === 'Settings changed' ? 'Nastavení mezitím změnil jiný administrátor. Načtěte jej znovu.' : 'E-mailové adresy se nepodařilo uložit.' }
    revalidatePath('/', 'layout')
    return { status: 'success', message: 'E-mailové adresy jsou uložené a platí ihned. Není potřeba publikovat koncept.' }
  } catch { return { status: 'error', message: 'Uložení se nezdařilo. Obnovte přihlášení a zkuste to znovu.' } }
}
