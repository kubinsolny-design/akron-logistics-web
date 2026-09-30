import type { Metadata } from 'next'
import Link from 'next/link'
import { Arrow } from '../ui'
import { Truck } from '../trucks'

export const metadata: Metadata = { title: 'Přepravy' }

const services = [
  { id: 'celovozova', type: 'trailer' as const, title: 'Celovozová přeprava', text: 'Pokud náklad vyplní vozidlo nebo má jet přímo na jedno místo, hledáme odpovídající sestavu a domluvíme její průběh.' },
  { id: 'mensi', type: 'box' as const, title: 'Menší zásilka a sběrná přeprava', text: 'Když nevyužijete celý návěs, dává smysl hledat prostor, který odpovídá objemu a termínu vaší zásilky.' },
  { id: 'expres', type: 'van' as const, title: 'Expresní přeprava', text: 'Pro náklad, kde je potřeba rozhodnout rychle. Společně ověříme trasu, čas i možnosti vhodného vozidla.' },
]

export default function TransportPage() {
  return <>
    <section className="page-hero shell"><p className="eyebrow">Přepravy podle skutečné potřeby</p><h1>Nejdřív náklad. Potom správné auto.</h1><p className="lead">Rozhoduje objem, termín, charakter zboží a místo nakládky. Proto začínáme otázkami, které přepravu nastaví prakticky.</p></section>
    <section className="transport-list shell">{services.map((service) => <article id={service.id} key={service.id} className="transport-row"><div className="transport-visual"><Truck type={service.type} label={service.title} /></div><div><h2>{service.title}</h2><p>{service.text}</p></div><Link href="/spoluprace#poptavka" aria-label={`Poptat ${service.title}`}>Poptat <Arrow /></Link></article>)}</section>
    <section className="shell note-block"><h2>Pravidelná přeprava</h2><p>Opakující se trasy řešíme se stejnou pozorností jako jednorázový náklad. Při poptávce společně projdeme četnost, nakládky i prostor pro změny.</p><Link className="text-link" href="/spoluprace#poptavka">Popsat pravidelnou trasu <Arrow /></Link></section>
  </>
}
