'use client'
import { useState } from 'react'
import { retryInquiryEmail } from './overview-actions'
import { useConfirmation } from './confirmation'

export function RetryEmailButton({ id, onComplete }: { id: string; onComplete: () => void }) {
  const { confirm, confirmation } = useConfirmation()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  return <div className="admin-retry-email">{confirmation}<p>Poptávka je uložená. Dočasné chyby odesílání se automaticky zkoušejí nejvýše třikrát; při přetrvávající chybě můžete upozornění zopakovat do 23 hodin od přijetí.</p><button type="button" disabled={busy} onClick={async () => {
    if (!(await confirm('Znovu odeslat upozornění na tuto poptávku aktuálnímu firemnímu příjemci? Starší než 23 hodin se z bezpečnostních důvodů automaticky neposílají.'))) return
    setBusy(true); setNotice('')
    try { const result = await retryInquiryEmail(id); setNotice(result.message); if (result.ok) onComplete() }
    catch { setNotice('Odeslání se nepodařilo potvrdit. Ověřte stav v Resendu.') }
    finally { setBusy(false) }
  }}>{busy ? 'Opakuji odeslání…' : 'Znovu odeslat upozornění'}</button>{notice && <p role="status">{notice}</p>}</div>
}
