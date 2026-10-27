'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { sendInquiry } from './actions'
import { initialInquiryState } from './inquiry-types'
import type { Settings } from '../content/types'
import { formTextDefaults } from './site-text'
import { leadEvent } from './analytics-config'

export function InquiryForm({ labels }: { labels?: Pick<Settings, 'formHeading' | 'formDescription' | 'submitLabel' | 'formText'> }) {
  const [state, formAction, isPending] = useActionState(sendInquiry, initialInquiryState)
  const text = {...formTextDefaults,...labels?.formText}
  const measured = useRef('')
  useEffect(() => {
    if (state.status !== 'success' || !state.conversionId || measured.current === state.conversionId) return
    measured.current = state.conversionId
    // Local deduplication only; the identifier and form fields never go to Google.
    window.dispatchEvent(new Event(leadEvent))
  }, [state.status, state.conversionId])

  return (
    <form className="inquiry-form" action={formAction}>
      <div className="form-heading"><h3>{labels?.formHeading || 'Krátká poptávka'}</h3><p>{labels?.formDescription || 'Stačí základní údaje. Co bude potřeba, společně upřesníme. Hvězdičkou (*) jsou označené povinné údaje.'}</p></div>
      <label className="form-honeypot" aria-hidden="true">Web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-grid">
        <label><span>{text.pickup} <span className="required-mark" aria-hidden="true">*</span></span><input required name="pickup" autoComplete="address-level2" placeholder={text.pickupPlaceholder} disabled={isPending} /></label>
        <label><span>{text.delivery} <span className="required-mark" aria-hidden="true">*</span></span><input required name="delivery" autoComplete="address-level2" placeholder={text.deliveryPlaceholder} disabled={isPending} /></label>
        <label><span>{text.date} <span className="required-mark" aria-hidden="true">*</span></span><input required name="date" type="date" disabled={isPending} /></label>
        <label>{text.frequency}<select name="frequency" defaultValue="once" disabled={isPending}><option value="once">{text.frequencyOnce}</option><option value="regular">{text.frequencyRegular}</option><option value="unknown">{text.frequencyUnknown}</option></select></label>
        <label className="form-wide"><span>{text.cargo} <span className="required-mark" aria-hidden="true">*</span></span><textarea required name="cargo" rows={4} placeholder={text.cargoPlaceholder} disabled={isPending} /></label>
        <label><span>{text.name} <span className="required-mark" aria-hidden="true">*</span></span><input required name="name" autoComplete="name" placeholder={text.namePlaceholder} disabled={isPending} /></label>
        <label><span>{text.phone} <span className="required-mark" aria-hidden="true">*</span></span><input required name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" placeholder={text.phonePlaceholder} disabled={isPending} /></label>
        <label className="form-wide">{text.email}<input name="email" type="email" maxLength={254} autoComplete="email" placeholder={text.emailPlaceholder} disabled={isPending} /></label>
      </div>
      <div className="form-action"><div className="form-privacy"><label className="privacy-confirmation"><input type="checkbox" name="privacyAcknowledged" value="yes" required disabled={isPending} /><span>{text.privacyBefore} <Link href="/ochrana-osobnich-udaju" target="_blank" rel="noopener noreferrer">{text.privacyLink}</Link>. <span className="required-mark" aria-hidden="true">*</span></span></label></div><button className="button" type="submit" disabled={isPending}>{isPending ? text.sending : labels?.submitLabel || 'Odeslat poptávku'}</button></div>
      {state.message && <p className={`form-feedback form-feedback-${state.status}`} role="status" aria-live="polite">{state.message}</p>}
    </form>
  )
}
