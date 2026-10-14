'use server'

import type { InquiryState } from './inquiry-types'
import { getSettings } from '../sanity/content'
import { storeInquiry, markInquiryEmail } from '../supabase/inquiries'
import { draftMode } from 'next/headers'
import { preparing } from './preparing'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getField(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendInquiry(
  _previousState: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  if (preparing) return { status: 'error', message: 'Web připravujeme. Poptávkový formulář zatím není dostupný.' }
  if ((await draftMode()).isEnabled) return { status: 'error', message: 'Formulář v náhledu neodesílá poptávky. Pro odeslání nejdříve ukončete náhled.' }
  const website = getField(formData, 'website')
  if (website) {
    return { status: 'success', message: 'Děkujeme. Poptávku jsme přijali.' }
  }

  const pickup = getField(formData, 'pickup')
  const delivery = getField(formData, 'delivery')
  const date = getField(formData, 'date')
  const frequency = getField(formData, 'frequency')
  const cargo = getField(formData, 'cargo')
  const name = getField(formData, 'name')
  const email = getField(formData, 'email')
  const phone = getField(formData, 'phone')

  if (!pickup || !delivery || !date || !cargo || !name || !email) {
    return { status: 'error', message: 'Doplňte prosím všechna povinná pole.' }
  }

  if (!emailPattern.test(email)) {
    return { status: 'error', message: 'Zkontrolujte prosím zadaný e-mail.' }
  }

  if (getField(formData, 'privacyAcknowledged') !== 'yes') {
    return { status: 'error', message: 'Potvrďte prosím seznámení s informacemi o ochraně osobních údajů.' }
  }

  if ([pickup, delivery, date, frequency, cargo, name, email, phone].some((value) => value.length > 3_000)) {
    return { status: 'error', message: 'Některý z údajů je příliš dlouhý.' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const company = await getSettings()
  const recipient = company.inquiryEmail || process.env.INQUIRY_TO_EMAIL || company.email
  const sender = process.env.INQUIRY_FROM_EMAIL
  let inquiryId: string | null = null
  try { inquiryId = await storeInquiry({ pickup, delivery, date, frequency, cargo, name, email, phone }) }
  catch (error) {
    console.error('Could not securely store inquiry.')
    if (error instanceof Error && error.message.startsWith('Příliš mnoho')) return { status: 'error', message: error.message }
    return { status: 'error', message: `Poptávku nyní nelze přijmout. Napište prosím na ${company.email} nebo zavolejte ${company.phone}.` }
  }
  const accepted: InquiryState = { status: 'success', message: company.successMessage || 'Děkujeme. Poptávku jsme přijali a ozveme se vám s dalším postupem.' }

  if (!apiKey || !sender) {
    await markInquiryEmail(inquiryId, 'failed')
    if (inquiryId) return accepted
    console.error('Inquiry delivery is not configured.')
    return {
      status: 'error',
      message: `Poptávku se nyní nepodařilo odeslat. Napište nám prosím na ${company.email} nebo zavolejte ${company.phone}.`,
    }
  }

  const frequencyLabels: Record<string, string> = {
    once: 'Jednorázová přeprava',
    regular: 'Pravidelná přeprava',
    unknown: 'Zatím nevím',
  }

  const rows = [
    ['Nakládka', pickup],
    ['Vykládka', delivery],
    ['Termín', date],
    ['Četnost', frequencyLabels[frequency] ?? frequency],
    ['Náklad', cargo],
    ['Jméno a firma', name],
    ['E-mail', email],
    ['Telefon', phone || 'neuveden'],
  ]

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(inquiryId ? { 'Idempotency-Key': inquiryId } : {}),
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: `Nová poptávka: ${pickup} → ${delivery}`,
        html: `
          <h1>Nová poptávka přepravy</h1>
          <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
            ${rows.map(([label, value]) => `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value).replaceAll('\n', '<br>')}</td></tr>`).join('')}
          </table>
        `,
      }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    await markInquiryEmail(inquiryId, 'failed')
    if (inquiryId) return accepted
    console.error('Inquiry delivery request failed.')
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
    }
  }

  if (!response.ok) {
    await markInquiryEmail(inquiryId, 'failed')
    if (inquiryId) return accepted
    console.error('Inquiry delivery failed with status:', response.status)
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
    }
  }

  await markInquiryEmail(inquiryId, 'sent')
  return accepted
}
