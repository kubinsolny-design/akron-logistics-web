'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { sendInquiry } from './actions'
import { initialInquiryState } from './inquiry-types'
import type { Settings } from '../sanity/types'

export function InquiryForm({ labels }: { labels?: Pick<Settings, 'formHeading' | 'formDescription' | 'submitLabel'> }) {
  const [state, formAction, isPending] = useActionState(sendInquiry, initialInquiryState)

  return (
    <form className="inquiry-form" action={formAction}>
      <div className="form-heading"><h3>{labels?.formHeading || 'Krátká poptávka'}</h3><p>{labels?.formDescription || 'Stačí základní údaje. Co bude potřeba, společně upřesníme. Hvězdičkou (*) jsou označené povinné údaje.'}</p></div>
      <label className="form-honeypot" aria-hidden="true">Web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-grid">
        <label><span>Místo nakládky <span className="required-mark" aria-hidden="true">*</span></span><input required name="pickup" autoComplete="address-level2" placeholder="Např. Praha 10" disabled={isPending} /></label>
        <label><span>Místo vykládky <span className="required-mark" aria-hidden="true">*</span></span><input required name="delivery" autoComplete="address-level2" placeholder="Např. Mnichov" disabled={isPending} /></label>
        <label><span>Termín <span className="required-mark" aria-hidden="true">*</span></span><input required name="date" type="date" disabled={isPending} /></label>
        <label> Jak často? <select name="frequency" defaultValue="once" disabled={isPending}><option value="once">Jednorázová přeprava</option><option value="regular">Pravidelná přeprava</option><option value="unknown">Zatím nevím</option></select> </label>
        <label className="form-wide"><span>Popis nákladu <span className="required-mark" aria-hidden="true">*</span></span><textarea required name="cargo" rows={4} placeholder="Co se veze, počet kusů, rozměry, hmotnost, případně teplota nebo způsob nakládky." disabled={isPending} /></label>
        <label><span>Jméno a firma <span className="required-mark" aria-hidden="true">*</span></span><input required name="name" autoComplete="name" placeholder="Vaše jméno / firma" disabled={isPending} /></label>
        <label><span>Telefon <span className="required-mark" aria-hidden="true">*</span></span><input required name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" placeholder="+420 606 123 456" disabled={isPending} /></label>
        <label className="form-wide"> E-mail (volitelné) <input name="email" type="email" maxLength={254} autoComplete="email" placeholder="vy@firma.cz" disabled={isPending} /> </label>
      </div>
      <div className="form-action"><div className="form-privacy"><label className="privacy-confirmation"><input type="checkbox" name="privacyAcknowledged" value="yes" required disabled={isPending} /><span>Potvrzuji, že jsem se seznámil/a s <Link href="/ochrana-osobnich-udaju" target="_blank" rel="noopener noreferrer">informacemi o ochraně osobních údajů</Link>. <span className="required-mark" aria-hidden="true">*</span></span></label></div><button className="button" type="submit" disabled={isPending}>{isPending ? 'Odesílám…' : labels?.submitLabel || 'Odeslat poptávku'}</button></div>
      {state.message && <p className={`form-feedback form-feedback-${state.status}`} role="status" aria-live="polite">{state.message}</p>}
    </form>
  )
}
