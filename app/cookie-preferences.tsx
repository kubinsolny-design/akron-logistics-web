'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { cookieTextDefaults } from './site-text'
import { privacyStorageKey as storageKey, privacyChangeEvent as changeEvent, readPrivacyPreference } from './analytics-config'
import { preparing } from './preparing'

const openEvent = 'akron-privacy-open'

function readPreference() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return ''
    return readPrivacyPreference(raw) ? raw : ''
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
  const [analytics, setAnalytics] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const show = () => {
      try { setAnalytics(readPrivacyPreference(localStorage.getItem(storageKey))?.analytics === true) } catch { setAnalytics(false) }
      setOpen(true)
    }
    window.addEventListener(openEvent, show)
    return () => window.removeEventListener(openEvent, show)
  }, [])

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    if (!open && dialog.current?.open) dialog.current.close()
  }, [open])

  function save(allowAnalytics = false) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 2, analytics: allowAnalytics && !preparing, savedAt: Date.now() }))
    } catch {
      // The visitor can dismiss the notice even when browser storage is disabled.
    }
    if (!allowAnalytics) {
      for (const name of document.cookie.split(';').map(value => value.trim().split('=')[0]).filter(name => name === '_ga' || name.startsWith('_ga_'))) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
        if (['akronlogistics.cz', 'www.akronlogistics.cz'].includes(location.hostname)) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=akronlogistics.cz; SameSite=Lax`
      }
    }
    window.dispatchEvent(new Event(changeEvent))
    setDismissed(true)
    setOpen(false)
    // Stop an already loaded Google tag as well as future requests after revocation.
    if (!allowAnalytics && document.getElementById('akron-ga4')) window.location.reload()
  }

  return <>
    {preference === '' && !dismissed && !open && <section className="cookie-notice" aria-label="Informace o cookies">
      <div><strong>{text.title}</strong><p>{preparing ? text.notice : 'S vaším souhlasem používáme Google Analytics pro měření návštěvnosti. Odmítnutí neomezí funkčnost webu.'} <Link href="/cookies">{text.more}</Link>.</p></div>
      <div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => setOpen(true)}>{text.settings}</button><button type="button" className="button" onClick={() => save(false)}>{preparing ? text.accept : 'Pouze nezbytné'}</button>{!preparing && <button type="button" className="button" onClick={() => save(true)}>Povolit analytiku</button>}</div>
    </section>}
    <dialog ref={dialog} className="cookie-dialog" aria-labelledby="cookie-title" onClose={() => setOpen(false)}>
      <h2 id="cookie-title">{text.dialogTitle}</h2>
      <p>{preparing ? text.dialogIntro : 'Nezbytné technologie zajišťují fungování webu. Analytiku můžete dobrovolně povolit a souhlas kdykoli odvolat zde v nastavení.'}</p>
      <div className="cookie-category"><strong>{text.essential} <span>{text.always}</span></strong><p>{text.essentialDescription}</p></div>
      <div className="cookie-category">{preparing ? <><strong>{text.optional} <span>{text.unused}</span></strong><p>{text.optionalDescription}</p></> : <><label><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)} /> Analytika — Google Analytics 4</label><p>Dobrovolné měření návštěvnosti službou Google. Cookies _ga a _ga_D2XLJKJMNH mají platnost nejvýše 180 dní. Reklamní souhlasy neudělujeme.</p></>}</div>
      <p><Link href="/cookies">{text.details}</Link> · <Link href="/ochrana-osobnich-udaju">{text.privacy}</Link></p>
      <div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => setOpen(false)}>{text.close}</button><button type="button" className="button" onClick={() => save(analytics)}>{preparing ? text.save : 'Uložit nastavení'}</button></div>
    </dialog>
  </>
}
