'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordRecovery } from '../forgot-password-actions'

export function ForgotPasswordForm({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordRecovery, { message: '' })
  return <><form action={action} className="admin-auth-form">
    <label htmlFor="recovery-email">Přihlašovací e-mail<input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={!available || pending} /></label>
    <div hidden aria-hidden="true"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
    <button className="admin-primary admin-auth-submit" disabled={!available || pending}>{pending ? 'Odesílám žádost…' : 'Poslat odkaz pro obnovu hesla'}</button>
    {state.message && <p role="status" className="admin-status">{state.message}</p>}
    {!available && <p role="alert" className="admin-error">Obnova nyní není dostupná. Kontaktujte správce.</p>}
  </form><Link href="/admin" prefetch={false}>Zpět na přihlášení</Link></>
}
