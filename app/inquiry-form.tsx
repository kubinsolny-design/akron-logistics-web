'use client'

import { FormEvent, useState } from 'react'

export function InquiryForm() {
  const [prepared, setPrepared] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPrepared(true)
  }

  return (
    <form className="inquiry-form" onSubmit={handleSubmit}>
      <div className="form-heading"><h3>Krátká poptávka</h3><p>Stačí základní údaje. Pokud něco nevíte, nechte to na nás.</p></div>
      <div className="form-grid">
        <label> Místo nakládky <input required name="pickup" autoComplete="address-level2" placeholder="Např. Praha 10" /> </label>
        <label> Místo vykládky <input required name="delivery" autoComplete="address-level2" placeholder="Např. Mnichov" /> </label>
        <label> Termín <input required name="date" type="date" /> </label>
        <label> Jak často? <select name="frequency" defaultValue="once"><option value="once">Jednorázová přeprava</option><option value="regular">Pravidelná přeprava</option><option value="unknown">Zatím nevím</option></select> </label>
        <label className="form-wide"> Popis nákladu <textarea required name="cargo" rows={4} placeholder="Co se veze, počet kusů, rozměry, hmotnost, případně teplota nebo způsob nakládky." /> </label>
        <label> Jméno a firma <input required name="name" autoComplete="name" placeholder="Vaše jméno / firma" /> </label>
        <label> E-mail <input required name="email" type="email" autoComplete="email" placeholder="vy@firma.cz" /> </label>
        <label className="form-wide"> Telefon <input name="phone" type="tel" autoComplete="tel" placeholder="Pro rychlé upřesnění (volitelné)" /> </label>
      </div>
      <div className="form-action"><button className="button" type="submit">Připravit poptávku <span aria-hidden="true">↗</span></button><p>Odeslání na obchodní e-mail doplníme spolu s kontaktními údaji.</p></div>
      {prepared && <p className="form-feedback" role="status">Údaje jsou zkontrolované. Po doplnění obchodního e-mailu formulář napojíme na doručování poptávek.</p>}
    </form>
  )
}
