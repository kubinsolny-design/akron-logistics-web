'use server'

import type { InquiryState } from './inquiry-types'

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
  const privacyAccepted = formData.get('privacy') === 'on'

  if (!pickup || !delivery || !date || !cargo || !name || !email || !privacyAccepted) {
    return { status: 'error', message: 'Doplňte prosím všechna povinná pole.' }
  }

  if (!emailPattern.test(email)) {
    return { status: 'error', message: 'Zkontrolujte prosím zadaný e-mail.' }
  }

  if ([pickup, delivery, date, frequency, cargo, name, email, phone].some((value) => value.length > 3_000)) {
    return { status: 'error', message: 'Některý z údajů je příliš dlouhý.' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const recipient = process.env.INQUIRY_TO_EMAIL
  const sender = process.env.INQUIRY_FROM_EMAIL ?? 'AKRON Logistics <onboarding@resend.dev>'

  if (!apiKey || !recipient) {
    console.error('Inquiry delivery is not configured.')
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
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
    console.error('Inquiry delivery request failed.')
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
    }
  }

  if (!response.ok) {
    console.error('Inquiry delivery failed with status:', response.status)
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
    }
  }

  return {
    status: 'success',
    message: 'Děkujeme. Poptávku jsme přijali a ozveme se vám s dalším postupem.',
  }
}
