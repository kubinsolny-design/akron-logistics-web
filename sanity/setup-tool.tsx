'use client'

import { useState } from 'react'
import { useClient, useCurrentUser } from 'sanity'
import { initialPages, initialSettings, withKeys } from './defaults'
import { initialLegalPages } from './legal-defaults'
import type { CmsImage, CmsPage, Settings } from './types'

export function SetupTool() {
  const client = useClient({ apiVersion: '2026-10-01' })
  const user = useCurrentUser()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function initialize() {
    setBusy(true)
    setMessage('Připravuji obsah…')
    try {
      // Import only public website content. Inquiry storage is a separate setup step.
      const contentClient = client.withConfig({ perspective: 'raw', useCdn: false })
      const assets = new Map<string, CmsImage>()
      async function upload(path: string, alt: string): Promise<CmsImage> {
        const cached = assets.get(path)
        if (cached) return { ...cached, alt }
        setMessage(`Nahrávám obrázek: ${alt}…`)
        const response = await fetch(path)
        if (!response.ok) throw new Error(`Obrázek ${path} se nepodařilo načíst.`)
        const asset = await contentClient.assets.upload('image', await response.blob(), { filename: path.split('/').pop() })
        const image = { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt }
        assets.set(path, image)
        return image
      }
      const settings = withKeys({ ...initialSettings,
        logo: await upload('/images/akron-black.svg', 'AKRON Logistics'),
        lightLogo: await upload('/images/akron-white.svg', 'AKRON Logistics — světlé logo'),
      })
      const pages: CmsPage[] = []
      for (const original of [...initialPages, ...initialLegalPages]) {
        const page = withKeys(structuredClone(original))
        for (const section of page.sections || []) {
          if (section.imagePath) section.image = await upload(section.imagePath, section.editorLabel || section.heading || 'Fotografie přepravy')
        }
        pages.push(page)
      }
      setMessage('Ukládám stránky, kontakty a obrázky…')
      const ids = ['siteSettings', ...pages.map(page => page._id!)]
      const stored = await contentClient.fetch<(CmsPage & Partial<Settings> & { _id: string; _rev: string })[]>('*[_id in $ids]', { ids })
      const transaction = contentClient.transaction().createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings', ...settings })
      for (const page of pages) transaction.createIfNotExists({ ...page, _id: page._id!, _type: 'page' })
      // Existing text, ordering and uploaded images always win over defaults.
      for (const document of stored) {
        const missing: Record<string, CmsImage> = {}
        if (document._id === 'siteSettings') {
          if (!document.logo) missing.logo = settings.logo!
          if (!document.lightLogo) missing.lightLogo = settings.lightLogo!
        }
        for (const section of document.sections || []) {
          if (section._key && section.imagePath && !section.image) {
            const image = assets.get(section.imagePath)
            if (image) missing[`sections[_key==${JSON.stringify(section._key)}].image`] = { ...image, alt: section.editorLabel || section.heading }
          }
        }
        if (Object.keys(missing).length) transaction.patch(document._id, patch => patch.ifRevisionId(document._rev).setIfMissing(missing))
      }
      await transaction.commit()
      setMessage('Hotovo. Současné texty, stránky, kontakty, loga, fotografie a mapa jsou v Obsahu webu. Web načítá publikovaný obsah ze Sanity. Existující úpravy zůstaly zachované.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Inicializace se nezdařila. Zkontrolujte přihlášení a oprávnění správce.') }
    finally { setBusy(false) }
  }
  return <div className="cms-admin-tool" style={{ maxWidth: 800, padding: 40, margin: 'auto', fontFamily: 'system-ui', lineHeight: 1.6 }}>
    <h1>Vítejte v administraci AKRON Logistics</h1>
    <p>V záložce „Obsah webu“ upravíte stránky, kontakty, obrázky a vzhled. Sekce můžete přetahovat, přidávat nebo skrývat. Změny uložíte tlačítkem Publikovat.</p>
    <p>„Náhled webu“ ukazuje rozpracované změny ještě před publikací. Poptávky a interní poznámky jsou uložené v soukromém pracovním prostoru „Poptávky“.</p>
    <h2>Načtení současného webu</h2><p>Tlačítko nahraje současné texty, kontakty, obě loga, fotografie a mapu do Sanity. Vytvoří chybějící publikované stránky; existující texty ani vyměněné obrázky nepřepíše. Import lze bezpečně zopakovat. Nastavení soukromých poptávek ani tarifu nemění.</p>
    <button type="button" disabled={busy || !user} onClick={initialize} style={{ background: '#ff5a00', border: 0, padding: '14px 20px', color: 'white', borderRadius: 6, cursor: 'pointer' }}>{busy ? 'Připravuji…' : 'Připravit současný obsah webu'}</button>
    {message && <p role="status">{message}</p>}
    <h2>Běžné úpravy</h2><ol><li>Vyberte stránku nebo „Firma, kontakty a vzhled“.</li><li>Upravte text, nahrajte obrázek nebo změňte pořadí sekcí.</li><li>Zkontrolujte Náhled webu a klikněte na Publikovat.</li></ol>
    <p>Admin zve další osoby v záložce „Uživatelé a přístupy“. Role Uživatel (Editor) mění obsah a poptávky, nikoli přístupy. Admin může i spravovat uživatele. Přihlašovací údaje se nesdílejí.</p>
    <p><strong>Důležité:</strong> Soukromé poptávky a role Editor vyžadují tarif Growth nebo jeho zkušební verzi. Free nabízí jen Admin a Viewer (pouze čtení). Žádný placený tarif se tímto tlačítkem nezapíná. <a href="https://www.sanity.io/pricing" target="_blank" rel="noopener noreferrer">Podmínky Sanity</a></p>
  </div>
}
