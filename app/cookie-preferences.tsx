'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const storageKey = 'akron-privacy-preferences'
const changeEvent = 'akron-privacy-change'
const openEvent = 'akron-privacy-open'
const lifetime = 180 * 24 * 60 * 60 * 1000

function readPreference() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return ''
    const value = JSON.parse(raw)
    return value.version === 1 && value.mode === 'essential-only' && Number.isFinite(value.savedAt) && Date.now() - value.savedAt < lifetime ? raw : ''
  } catch {
    return ''
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(changeEvent, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(changeEvent, callback)
  }
}

export function CookieSettingsButton() {
  return <button type="button" className="cookie-settings-link" onClick={() => window.dispatchEvent(new Event(openEvent))}>Nastavení cookies</button>
}

export function CookiePreferences() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'server')
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(openEvent, show)
    return () => window.removeEventListener(openEvent, show)
  }, [])

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    if (!open && dialog.current?.open) dialog.current.close()
  }, [open])

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, mode: 'essential-only', savedAt: Date.now() }))
    } catch {
      // The visitor can dismiss the notice even when browser storage is disabled.
    }
    window.dispatchEvent(new Event(changeEvent))
    setDismissed(true)
    setOpen(false)
  }

  return <>
    {preference === '' && !dismissed && !open && <section className="cookie-notice" aria-label="Informace o cookies">
      <div><strong>Vaše soukromí</strong><p>Používáme jen nezbytné technologie pro fungování webu a zapamatování této volby. Analytické ani reklamní cookies nepoužíváme. <Link href="/cookies">Více o cookies</Link>.</p></div>
      <div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => setOpen(true)}>Nastavení</button><button type="button" className="button" onClick={save}>Rozumím</button></div>
    </section>}
    <dialog ref={dialog} className="cookie-dialog" aria-labelledby="cookie-title" onClose={() => setOpen(false)}>
      <h2 id="cookie-title">Nastavení cookies</h2>
      <p>Na tomto webu jsou aktivní pouze nezbytné technologie. Jejich použití nevyžaduje souhlas.</p>
      <div className="cookie-category"><strong>Nezbytné <span>Vždy aktivní</span></strong><p>Provoz a zabezpečení webu a uložení vašeho nastavení v tomto prohlížeči.</p></div>
      <div className="cookie-category"><strong>Analytické a reklamní <span>Nepoužíváme</span></strong><p>Web nenačítá měřicí ani reklamní nástroje a žádný takový souhlas si neukládá.</p></div>
      <p><Link href="/cookies">Podrobnosti o cookies</Link> · <Link href="/ochrana-osobnich-udaju">Ochrana osobních údajů</Link></p>
      <div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => setOpen(false)}>Zavřít</button><button type="button" className="button" onClick={save}>Uložit pouze nezbytné</button></div>
    </dialog>
  </>
}
