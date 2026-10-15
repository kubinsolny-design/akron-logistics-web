'use client'

import { useActionState, useState, useTransition } from 'react'
import { loadInquirySettings, saveInquirySettings } from './inquiry-settings-actions'
import { initialInquiryState } from '../inquiry-types'

export function InquirySettingsPanel() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof loadInquirySettings>>>(null)
  const [message, setMessage] = useState('')
  const [loading, startLoad] = useTransition()
  const [result, save, saving] = useActionState(async (previous: typeof initialInquiryState, data: FormData) => {
    const response = await saveInquirySettings(previous, data)
    if (response.status === 'success') setSettings(await loadInquirySettings())
    return response
  }, initialInquiryState)
  return <section className="admin-records admin-connection" aria-label="Kontaktní e-mail a doručování">
    <div className="admin-section-heading"><div><h3>Kontaktní e-mail a doručování</h3><p className="admin-muted">Tyto adresy platí ihned, nezávisle na konceptech stránek. Měnit je může jen administrátor. Změny se zapisují do aktivity.</p></div><button disabled={loading || saving} onClick={() => startLoad(async () => {
      try { const current = await loadInquirySettings(); setSettings(current); setMessage(current ? '' : 'Nastavení se nepodařilo načíst. Ověřte přihlášení a databázovou migraci.') }
      catch { setMessage('Nastavení se nepodařilo načíst.') }
    })}>{loading ? 'Načítám…' : 'Načíst e-mailové adresy'}</button></div>
    {message && <p role="status">{message}</p>}
    {settings && <form action={save} key={settings.revision}>
      <div className="admin-fields"><label>Veřejný kontaktní e-mail<input name="publicEmail" type="email" required maxLength={254} defaultValue={settings.publicEmail} disabled={saving} /><small>Veřejný kontakt, patička a odkazy na e-mail.</small></label><label>Příjemce poptávek<input name="recipientEmail" type="email" required maxLength={254} defaultValue={settings.recipientEmail} disabled={saving} /><small>Na tuto adresu dorazí upozornění z formuláře. Nemusí být stejná jako veřejný kontakt.</small></label></div>
      <input type="hidden" name="revision" value={settings.revision} /><p className="admin-muted">Odesílatel: AKRON Logistics &lt;web@akronlogistics.cz&gt;. Poptávky zůstávají také v administraci.</p><button className="admin-primary" disabled={saving || loading}>{saving ? 'Ukládám…' : 'Uložit e-mailové adresy'}</button>
    </form>}
    {result.message && <p role="status" className={`admin-status admin-status-${result.status === 'error' ? 'error' : 'success'}`}>{result.message}</p>}
  </section>
}
