'use client'

import { useActionState, useState, useTransition } from 'react'
import { sendTestEmail, sendTestInquiry } from '../actions'
import { initialInquiryState, type InquiryConnection } from '../inquiry-types'
import { checkInquiryConnection } from './inquiry-connection-actions'

export function InquiryConnectionPanel() {
  const [connection, setConnection] = useState<InquiryConnection | null>(null)
  const [checking, startCheck] = useTransition()
  const [result, testAction, sending] = useActionState(sendTestInquiry, initialInquiryState)
  const [emailResult, emailAction, testingEmail] = useActionState(sendTestEmail, initialInquiryState)
  const ready = Boolean(connection?.authorized && connection.checks.length && connection.checks.every(check => check.ok))
  const emailReady = Boolean(connection?.authorized && ['resend', 'sender', 'recipient'].every(id => connection.checks.some(check => check.id === id && check.ok)))
  return <section className="admin-records admin-connection" aria-label="Propojení poptávkového formuláře">
    <div className="admin-section-heading"><div><h3>Propojení poptávkového formuláře</h3><p className="admin-muted">Kontrola běžícího webu bez zobrazování klíčů. Nemění publikovaný obsah ani nastavení webu.</p></div><button disabled={checking || sending || testingEmail} onClick={() => startCheck(async () => {
      try { setConnection(await checkInquiryConnection()) }
      catch { setConnection({ authorized: false, checks: [], publicFormOpen: false, message: 'Kontrolu se nepodařilo načíst. Obnovte přihlášení a zkuste to znovu.' }) }
    })}>{checking ? 'Kontroluji…' : 'Prověřit propojení'}</button></div>
    {connection && <><p role="status">{connection.message}</p><ul className="admin-connection-checks">{connection.checks.map(check => <li key={check.id}><span className={`admin-badge ${check.ok ? 'connection-ok' : 'connection-missing'}`}>{check.ok ? 'V pořádku' : 'Chybí / ověřit'}</span><span>{check.label}</span></li>)}</ul>{connection.authorized && <p className="admin-muted">{connection.publicFormOpen ? 'Veřejný formulář je zapnutý.' : 'Režim Připravujeme zůstává zapnutý. Veřejný formulář nic neodesílá; test může spustit pouze přihlášený admin.'}</p>}</>}
    <form action={testAction}><p className="admin-muted">Test vytvoří označenou poptávku bez skutečné přepravy, pouze s telefonem, bez e-mailu zákazníka. Uloží ji do administrace a odešle upozornění na info@akronlogistics.cz.</p><button className="admin-primary" disabled={!ready || checking || sending || testingEmail}>{sending ? 'Odesílám test…' : 'Odeslat testovací poptávku'}</button></form>
    {result.message && <p className={`admin-status admin-status-${result.status === 'error' ? 'error' : 'success'}`} role="status">{result.message}</p>}
    <form action={emailAction}><p className="admin-muted">Samostatně lze ověřit pouze Resend. Odešle se označený technický e-mail na info@akronlogistics.cz, bez zakládání poptávky. Opakované kliknutí během deseti minut neposílá další kopii stejného testu.</p><button disabled={!emailReady || checking || sending || testingEmail}>{testingEmail ? 'Ověřuji e-mail…' : 'Ověřit pouze odesílání e-mailu'}</button></form>
    {emailResult.message && <p className={`admin-status admin-status-${emailResult.status === 'error' ? 'error' : 'success'}`} role="status">{emailResult.message}</p>}
  </section>
}
