'use client'

import { useActionState } from 'react'
import { sendInquiry } from './actions'
import { initialInquiryState } from './inquiry-types'

export function InquiryForm() {
  const [state, formAction, isPending] = useActionState(sendInquiry, initialInquiryState)

  return (
    <form className="inquiry-form" action={formAction}>
      <div className="form-heading"><h3>Krátká poptávka</h3><p>Stačí základní údaje. Co bude potřeba, společně upřesníme.</p></div>
      <label className="form-honeypot" aria-hidden="true">Web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-grid">
        <label> Místo nakládky <input required name="pickup" autoComplete="address-level2" placeholder="Např. Praha 10" disabled={isPending} /> </label>
        <label> Místo vykládky <input required name="delivery" autoComplete="address-level2" placeholder="Např. Mnichov" disabled={isPending} /> </label>
        <label> Termín <input required name="date" type="date" disabled={isPending} /> </label>
        <label> Jak často? <select name="frequency" defaultValue="once" disabled={isPending}><option value="once">Jednorázová přeprava</option><option value="regular">Pravidelná přeprava</option><option value="unknown">Zatím nevím</option></select> </label>
        <label className="form-wide"> Popis nákladu <textarea required name="cargo" rows={4} placeholder="Co se veze, počet kusů, rozměry, hmotnost, případně teplota nebo způsob nakládky." disabled={isPending} /> </label>
        <label> Jméno a firma <input required name="name" autoComplete="name" placeholder="Vaše jméno / firma" disabled={isPending} /> </label>
        <label> E-mail <input required name="email" type="email" autoComplete="email" placeholder="vy@firma.cz" disabled={isPending} /> </label>
        <label className="form-wide"> Telefon <input name="phone" type="tel" autoComplete="tel" placeholder="Pro rychlé upřesnění (volitelné)" disabled={isPending} /> </label>
        <label className="privacy-check form-wide"><input required name="privacy" type="checkbox" disabled={isPending} /><span>Souhlasím s použitím údajů pro vyřízení této poptávky.</span></label>
      </div>
      <div className="form-action"><button className="button" type="submit" disabled={isPending}>{isPending ? 'Odesílám…' : 'Odeslat poptávku'} <span aria-hidden="true">↗</span></button><p>Údaje použijeme pouze pro vyřízení vaší poptávky.</p></div>
      {state.message && <p className={`form-feedback form-feedback-${state.status}`} role="status" aria-live="polite">{state.message}</p>}
    </form>
  )
}
