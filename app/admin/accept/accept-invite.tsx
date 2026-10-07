'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { browserClient } from '../../../supabase/browser'
import { acceptSession } from '../../../supabase/accept-session'

export function AcceptInvite() {
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Ověřuji odkaz pro nastavení hesla…')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const initialization = useRef<Promise<boolean> | null>(null)
  useEffect(() => {
    let active = true
    // Reuse the same operation when React replays effects: codes are single-use.
    initialization.current ??= acceptSession(browserClient().auth, window.location.href, () => {
      window.history.replaceState(null, '', '/admin/accept')
    })
    initialization.current.then((valid) => {
      if (!active) return
      setReady(valid)
      setFailed(!valid)
      setMessage(valid ? 'Nastavte a uložte vlastní heslo pro tuto administraci. Teprve potom ho můžete použít při přihlášení.' : 'Odkaz není platný nebo už vypršel. Požádejte správce o nový odkaz pro nastavení hesla.')
    }).catch(() => {
      if (!active) return
      setFailed(true)
      setMessage('Přístup se nepodařilo ověřit. Zkuste stránku obnovit.')
    })
    return () => { active = false }
  }, [])

  async function submit(form: FormData) {
    setFailed(false)
    const password = String(form.get('password') || '')
    if (password !== String(form.get('confirm') || '')) { setFailed(true); setMessage('Hesla se neshodují.'); return }
    if (password.length < 12) { setFailed(true); setMessage('Použijte alespoň 12 znaků.'); return }
    setBusy(true)
    try {
      const { error } = await browserClient().auth.updateUser({ password })
      if (error) { setFailed(true); setMessage('Heslo se nepodařilo nastavit. Zkuste to znovu.'); return }
      router.replace('/admin'); router.refresh()
    } catch { setFailed(true); setMessage('Připojení se nezdařilo. Zkuste to znovu.') }
    finally { setBusy(false) }
  }
  return <><p className={failed ? 'admin-error' : undefined} role={failed ? 'alert' : 'status'}>{message}</p>{ready && <form action={submit}>
    <label>Nové heslo<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></label>
    <label>Heslo ještě jednou<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></label>
    <button disabled={busy}>{busy ? 'Ukládám…' : 'Nastavit heslo a pokračovat'}</button></form>}
    <Link href="/admin" prefetch={false}>Přejít na přihlášení</Link></>
}
