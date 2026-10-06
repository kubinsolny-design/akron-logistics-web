'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { browserClient } from '../../../supabase/browser'

export function AcceptInvite() {
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Ověřuji pozvánku…')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  useEffect(() => {
    let active = true
    const client = browserClient()
    // The SDK consumes the invitation URL fragment and persists the SSR session.
    client.auth.getUser().then(({ data, error }) => {
      if (!active) return
      setReady(Boolean(data.user) && !error)
      setMessage(data.user && !error ? 'Nastavte si vlastní heslo pro příští přihlášení.' : 'Pozvánka není platná nebo už vypršela. Požádejte admina o nový přístup.')
      if (data.user) window.history.replaceState(null, '', '/admin/accept')
    })
    return () => { active = false }
  }, [])

  async function submit(form: FormData) {
    const password = String(form.get('password') || '')
    if (password !== String(form.get('confirm') || '')) { setMessage('Hesla se neshodují.'); return }
    if (password.length < 12) { setMessage('Použijte alespoň 12 znaků.'); return }
    setBusy(true)
    try {
      const { error } = await browserClient().auth.updateUser({ password })
      if (error) { setMessage('Heslo se nepodařilo nastavit. Zkuste to znovu.'); return }
      router.replace('/admin'); router.refresh()
    } catch { setMessage('Připojení se nezdařilo. Zkuste to znovu.') }
    finally { setBusy(false) }
  }
  return <><p role="status">{message}</p>{ready && <form action={submit}>
    <label>Nové heslo<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></label>
    <label>Heslo ještě jednou<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></label>
    <button disabled={busy}>{busy ? 'Ukládám…' : 'Nastavit heslo a pokračovat'}</button></form>}
    <Link href="/admin" prefetch={false}>Přejít na přihlášení</Link></>
}
