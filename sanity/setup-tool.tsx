'use client'

import { useState } from 'react'
import { useClient, useCurrentUser } from 'sanity'
import { initialPages, initialSettings, withKeys } from './defaults'
import { initialLegalPages } from './legal-defaults'

export function SetupTool() {
  const client = useClient({ apiVersion: '2026-10-01' })
  const user = useCurrentUser()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function initialize() {
    setBusy(true)
    setMessage('Připravuji obsah…')
    try {
      const existing = await client.datasets.list()
      const privateDataset = existing.find(d => d.name === 'inquiries')
      if (privateDataset && privateDataset.aclMode !== 'private') throw new Error('Dataset inquiries musí být soukromý. Inicializace byla zastavena.')
      if (!privateDataset) await client.datasets.create('inquiries', { aclMode: 'private' })
      const transaction = client.transaction().createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings', ...withKeys(initialSettings) })
      for (const page of [...initialPages, ...initialLegalPages]) transaction.createIfNotExists({ ...withKeys(page), _id: page._id!, _type: 'page' })
      await transaction.commit()
      setMessage('Hotovo. Obsah najdete v záložce Obsah webu, poptávky v pracovním prostoru Poptávky. Existující dokumenty a vaše úpravy zůstaly zachované.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Inicializace se nezdařila. Zkontrolujte přihlášení a oprávnění správce.') }
    finally { setBusy(false) }
  }
  return <div style={{ maxWidth: 800, padding: 40, margin: 'auto', fontFamily: 'system-ui', lineHeight: 1.6 }}>
    <h1>Vítejte v administraci AKRON Logistics</h1>
    <p>V záložce „Obsah webu“ upravíte stránky, kontakty, obrázky a vzhled. Sekce můžete přetahovat, přidávat nebo skrývat. Změny uložíte tlačítkem Publikovat.</p>
    <p>„Náhled webu“ ukazuje rozpracované změny ještě před publikací. Poptávky a interní poznámky jsou uložené v soukromém pracovním prostoru „Poptávky“.</p>
    <h2>První spuštění</h2><p>Tlačítko níže nahraje současný obsah webu a připraví soukromé úložiště poptávek. Tuto operaci provede vlastník projektu pouze jednou.</p>
    <button type="button" disabled={busy || !user} onClick={initialize} style={{ background: '#ff5a00', border: 0, padding: '14px 20px', color: 'white', borderRadius: 6, cursor: 'pointer' }}>{busy ? 'Připravuji…' : 'Připravit současný obsah webu'}</button>
    {message && <p role="status">{message}</p>}
    <h2>Běžné úpravy</h2><ol><li>Vyberte stránku nebo „Firma, kontakty a vzhled“.</li><li>Upravte text, nahrajte obrázek nebo změňte pořadí sekcí.</li><li>Zkontrolujte Náhled webu a klikněte na Publikovat.</li></ol>
    <p>Admin zve další osoby v záložce „Uživatelé a přístupy“. Role Uživatel (Editor) mění obsah a poptávky, nikoli přístupy. Admin může i spravovat uživatele. Přihlašovací údaje se nesdílejí.</p>
    <p><strong>Důležité:</strong> Soukromé poptávky a role Editor vyžadují tarif Growth nebo jeho zkušební verzi. Free nabízí jen Admin a Viewer (pouze čtení). Žádný placený tarif se tímto tlačítkem nezapíná. <a href="https://www.sanity.io/pricing" target="_blank" rel="noopener noreferrer">Podmínky Sanity</a></p>
  </div>
}
