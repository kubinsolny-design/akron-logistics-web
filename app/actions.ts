'use server'

import type { InquiryState } from './inquiry-types'
import { getSettings } from '../sanity/content'
import { storeInquiry, markInquiryEmail } from '../supabase/inquiries'
import { draftMode } from 'next/headers'
import { preparing } from './preparing'
import { inquiryValidation } from './inquiry-validation'
import { currentMember } from '../supabase/server'
import { defaultInquirySender, inquiryRecipient, inquiryStorageProvider, validInquirySender } from './inquiry-config'
import { company as defaultCompany } from './site'

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
  return acceptInquiry(formData)
}

/** Explicit admin-only test: same validation, private storage, quota and delivery. */
export async function sendTestInquiry(): Promise<InquiryState> {
  try {
    const member = await currentMember()
    if (!member || member.role !== 'admin') return { status: 'error', message: 'Test může spustit pouze přihlášený administrátor.' }
    if ((await draftMode()).isEnabled) return { status: 'error', message: 'Test nelze spustit v náhledu konceptu.' }
    if (inquiryStorageProvider() !== 'supabase' || !process.env.RESEND_API_KEY?.trim()) return { status: 'error', message: 'Nejdříve dokončete propojení Supabase a Resendu.' }
    const recipient = process.env.INQUIRY_TO_EMAIL?.trim() || inquiryRecipient
    if (recipient.toLowerCase() !== inquiryRecipient) return { status: 'error', message: 'Cílová adresa testu musí být info@akronlogistics.cz. Ověřte INQUIRY_TO_EMAIL.' }
    const data = new FormData()
    for (const [key, value] of Object.entries({
      pickup: 'TECHNICKÝ TEST – bez skutečné nakládky', delivery: 'TECHNICKÝ TEST – bez skutečné vykládky',
      date: new Date().toISOString().slice(0, 10), frequency: 'unknown',
      cargo: `Test propojení formuláře, administrace a e-mailu (${new Date().toISOString()}). Nejde o objednávku přepravy. Není třeba zajišťovat vozidlo ani kontaktovat zákazníka.`,
      name: 'Technická kontrola webu AKRON', phone: defaultCompany.phone, email: '', privacyAcknowledged: 'yes',
    })) data.set(key, value)
    return acceptInquiry(data, true)
  } catch {
    return { status: 'error', message: 'Test nelze bezpečně spustit. Ověřte přihlášení a serverové propojení.' }
  }
}

/** Isolated transport check, never a replacement for private inquiry storage. */
export async function sendTestEmail(): Promise<InquiryState> {
  try {
    const member = await currentMember()
    if (!member || member.role !== 'admin') return { status: 'error', message: 'Test může spustit pouze přihlášený administrátor.' }
    if ((await draftMode()).isEnabled) return { status: 'error', message: 'Test nelze spustit v náhledu konceptu.' }
    const apiKey = process.env.RESEND_API_KEY?.trim()
    const sender = process.env.INQUIRY_FROM_EMAIL?.trim() || defaultInquirySender
    const recipient = process.env.INQUIRY_TO_EMAIL?.trim() || inquiryRecipient
    if (!apiKey || !validInquirySender(sender) || recipient.toLowerCase() !== inquiryRecipient) return { status: 'error', message: 'Ověřte nastavení Resendu a správné adresy.' }
    // Identical payload + fixed per-admin ten-minute bucket: repeated clicks or
    // requests across server instances do not send duplicate test messages.
    const idempotencyKey = `akron-email-test-${member.user.id}-${Math.floor(Date.now() / 600_000)}`
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ from: sender, to: [inquiryRecipient], subject: '[TECHNICKÝ TEST AKRON] Kontrola odesílání e-mailů',
        html: '<h1>Technický test webu AKRON Logistics</h1><p>Tato zpráva ověřuje pouze odesílání e-mailů ze serveru webu přes Resend. Nejde o objednávku ani poptávku přepravy a není nutné na ni odpovídat.</p><p>Ukládání poptávek do administrace se ověřuje samostatně; tento test žádnou poptávku nevytváří.</p>' }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return { status: 'error', message: 'Resend testovací e-mail odmítl. Ověřte platnost klíče, odesílací doménu a záznamy Resendu.' }
    return { status: 'success', message: 'Resend přijal testovací e-mail pro info@akronlogistics.cz. Ověřte doručení. Tento test nepotvrzuje ukládání poptávek do administrace.' }
  } catch { return { status: 'error', message: 'Test e-mailu se nepodařilo dokončit. Zkuste to později nebo ověřte serverové propojení.' } }
}

async function acceptInquiry(formData: FormData, test = false): Promise<InquiryState> {
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

  const validation = inquiryValidation({ pickup, delivery, date, frequency, cargo, name, email, phone })
  if (validation) return { status: 'error', message: validation }

  if (getField(formData, 'privacyAcknowledged') !== 'yes') {
    return { status: 'error', message: 'Potvrďte prosím seznámení s informacemi o ochraně osobních údajů.' }
  }

  if ([pickup, delivery, date, frequency, cargo, name, email, phone].some((value) => value.length > 3_000)) {
    return { status: 'error', message: 'Některý z údajů je příliš dlouhý.' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const company = await getSettings()
  // The production delivery address is authoritative, not an old CMS/test value.
  const recipient = process.env.INQUIRY_TO_EMAIL?.trim() || inquiryRecipient
  const sender = process.env.INQUIRY_FROM_EMAIL?.trim() || defaultInquirySender
  if (!validInquirySender(sender)) return { status: 'error', message: 'Odesílání není správně nastavené. Kontaktujte nás prosím přímo.' }
  let inquiryId: string | null = null
  try {
    inquiryId = await storeInquiry({ pickup, delivery, date, frequency, cargo, name, email, phone })
    // Never send unthrottled mail when private storage/rate limiting is missing.
    if (!inquiryId) throw new Error('Private inquiry storage is not configured')
  }
  catch (error) {
    console.error('Could not securely store inquiry.')
    if (error instanceof Error && error.message.startsWith('Příliš mnoho')) return { status: 'error', message: error.message }
    return { status: 'error', message: `Poptávku nyní nelze přijmout. Napište prosím na ${company.email} nebo zavolejte ${company.phone}.` }
  }
  const accepted: InquiryState = { status: 'success', message: test ? 'Testovací poptávka je uložená v administraci a Resend přijal e-mail pro info@akronlogistics.cz. Doručení ještě ověřte ve schránce nebo v Resendu.' : company.successMessage || 'Děkujeme. Poptávku jsme přijali a ozveme se vám s dalším postupem.' }
  const savedButNotSent: InquiryState = test ? { status: 'error', message: 'Testovací poptávka je uložená, ale e-mail se nepodařilo odeslat. Ověřte klíč, odesílací doménu a záznamy Resendu.' } : accepted

  if (!apiKey || !sender) {
    await markInquiryEmail(inquiryId, 'failed')
    if (inquiryId) return savedButNotSent
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
    ['Telefon', phone],
    ['E-mail', email || 'neuveden'],
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
        ...(email ? { reply_to: email } : {}),
        subject: `${test ? '[TEST WEBU – NEOBJEDNÁVAT PŘEPRAVU] ' : ''}Nová poptávka: ${pickup} → ${delivery}`,
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
    if (inquiryId) return savedButNotSent
    console.error('Inquiry delivery request failed.')
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
    }
  }

  if (!response.ok) {
    await markInquiryEmail(inquiryId, 'failed')
    if (inquiryId) return savedButNotSent
    console.error('Inquiry delivery failed with status:', response.status)
    return {
      status: 'error',
      message: 'Poptávku se nyní nepodařilo odeslat. Zkuste to prosím znovu později.',
    }
  }

  await markInquiryEmail(inquiryId, 'sent')
  return accepted
}
