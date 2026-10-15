'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { cookieTextDefaults } from './site-text'

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

export function CookieSettingsButton({label='Nastavení cookies'}:{label?:string}) {
  return <button type="button" className="cookie-settings-link" onClick={() => window.dispatchEvent(new Event(openEvent))}>{label}</button>
}

export function CookiePreferences({text: customText}:{text?:Record<string,string>}) {
  const text={...cookieTextDefaults,...customText}
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
      <div><strong>{text.title}</strong><p>{text.notice} <Link href="/cookies">{text.more}</Link>.</p></div>
      <div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => setOpen(true)}>{text.settings}</button><button type="button" className="button" onClick={save}>{text.accept}</button></div>
    </section>}
    <dialog ref={dialog} className="cookie-dialog" aria-labelledby="cookie-title" onClose={() => setOpen(false)}>
      <h2 id="cookie-title">{text.dialogTitle}</h2>
      <p>{text.dialogIntro}</p>
      <div className="cookie-category"><strong>{text.essential} <span>{text.always}</span></strong><p>{text.essentialDescription}</p></div>
      <div className="cookie-category"><strong>{text.optional} <span>{text.unused}</span></strong><p>{text.optionalDescription}</p></div>
      <p><Link href="/cookies">{text.details}</Link> · <Link href="/ochrana-osobnich-udaju">{text.privacy}</Link></p>
      <div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => setOpen(false)}>{text.close}</button><button type="button" className="button" onClick={save}>{text.save}</button></div>
    </dialog>
  </>
}
