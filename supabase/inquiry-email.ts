import 'server-only'

export type InquiryMailFields = { pickup: string; delivery: string; date: string; frequency: string; cargo: string; name: string; email: string; phone: string }
export type EmailPayload = { from: string; to: string[]; subject: string; html: string; reply_to?: string }
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')

export function inquiryMessage(fields: InquiryMailFields, from: string, to: string[], test = false): EmailPayload {
  const frequencies: Record<string, string> = { once: 'Jednorázová přeprava', regular: 'Pravidelná přeprava', unknown: 'Zatím nevím' }
  const rows = [['Nakládka', fields.pickup], ['Vykládka', fields.delivery], ['Termín', fields.date], ['Četnost', frequencies[fields.frequency] || fields.frequency], ['Náklad', fields.cargo], ['Jméno a firma', fields.name], ['Telefon', fields.phone], ['E-mail', fields.email || 'neuveden']]
  return { from, to, ...(fields.email ? { reply_to: fields.email } : {}), subject: `${test ? '[TEST WEBU – NEOBJEDNÁVAT PŘEPRAVU] ' : ''}Nová poptávka: ${fields.pickup} → ${fields.delivery}`,
    html: `<h1>Nová poptávka přepravy</h1><table cellpadding="8" cellspacing="0" style="border-collapse:collapse">${rows.map(([label, value]) => `<tr><th align="left" valign="top">${escape(label)}</th><td>${escape(value).replaceAll('\n', '<br>')}</td></tr>`).join('')}</table>` }
}

/** Bounded in-request retries, not a durable queue. DB records survive failures. */
export async function sendEmailWithRetry(payload: EmailPayload, id: string, apiKey: string, dependencies: { fetcher?: typeof fetch; wait?: (ms: number) => Promise<void> } = {}): Promise<boolean> {
  const fetcher = dependencies.fetcher || fetch
  const wait = dependencies.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)))
  const body = JSON.stringify(payload) // Identical payload and key on every attempt.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': id }, body, signal: AbortSignal.timeout(5000) })
      if (response.ok) return true
      if (response.status !== 429 && (response.status < 500 || response.status > 599)) return false
      const retryAfter = Number(response.headers?.get('retry-after') || 0)
      // Do not ignore a longer rate-limit window or keep a form open indefinitely.
      if (response.status === 429 && (!Number.isFinite(retryAfter) || retryAfter > 2)) return false
      if (attempt < 2) await wait(Math.max(retryAfter * 1000, attempt === 0 ? 500 : 1500))
    } catch {
      // Network/Auth error objects may contain headers and credentials. Never log them.
      if (attempt < 2) await wait(attempt === 0 ? 500 : 1500)
    }
  }
  return false
}
