'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn } from './actions'
import Link from 'next/link'

function Submit({ available }: { available: boolean }) {
  const { pending } = useFormStatus()
  return <button className="admin-primary admin-auth-submit" disabled={pending || !available} type="submit">{pending ? 'Přihlašuji vás…' : 'Přihlásit se'}</button>
}

export function LoginForm({ available = true }: { available?: boolean }) {
  const [visible, setVisible] = useState(false)
  return <form action={signIn} className="admin-auth-form">
    <label htmlFor="admin-email">E-mail<input id="admin-email" name="email" type="email" autoComplete="username" placeholder="vas@email.cz" required maxLength={254} disabled={!available} /></label>
    <label htmlFor="admin-password">Heslo</label><div className="admin-password-field"><input id="admin-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} disabled={!available} /><button type="button" aria-controls="admin-password" aria-pressed={visible} onClick={() => setVisible(!visible)} disabled={!available}>{visible ? 'Skrýt' : 'Zobrazit'}</button></div>
    <Submit available={available} />
    <p><Link href="/admin/forgot-password" prefetch={false}>Zapomněl jsem heslo</Link></p>
    <details className="admin-auth-help"><summary>První přihlášení?</summary><p>Otevřete pozvánku od správce a nastavte si vlastní heslo. Pokud už odkaz neplatí, použijte obnovu hesla výše.</p></details>
  </form>
}
