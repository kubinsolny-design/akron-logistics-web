import type { Metadata } from 'next'
import Link from 'next/link'
import { Arrow } from '../ui'
import { Truck } from '../trucks'

export const metadata: Metadata = {
  title: 'Silniční přeprava podle typu nákladu',
  description: 'Celovozová, sběrná, expresní i pravidelná silniční přeprava po Česku a do zahraničí. Vhodné vozidlo vybereme podle vašeho nákladu.',
}

const services = [
  { id: 'celovozova', type: 'trailer' as const, title: 'Celovozová přeprava', text: 'Pokud náklad vyplní vozidlo nebo má jet přímo na jedno místo, hledáme odpovídající sestavu a domluvíme její průběh.' },
  { id: 'mensi', type: 'box' as const, title: 'Menší zásilka a sběrná přeprava', text: 'Když nevyužijete celý návěs, hledáme prostor odpovídající objemu a termínu. Sběrná přeprava umožní spojit zásilku s dalšími náklady na podobné trase.' },
  { id: 'expres', type: 'van' as const, title: 'Expresní přeprava', text: 'Pro náklad, kde je potřeba rozhodnout rychle. Společně ověříme trasu, čas i možnosti vhodného vozidla.' },
  { id: 'pravidelna', type: 'trailer' as const, title: 'Pravidelná přeprava', text: 'Pro opakující se nakládky nastavíme trasu, četnost a způsob komunikace. Při změně podmínek řešíte vše se stejným kontaktem.' },
]

export default function TransportPage() {
  return <>
    <section className="page-hero shell"><p className="eyebrow">Přepravy podle skutečné potřeby</p><h1>Nejdřív náklad. Potom správné auto.</h1><p className="lead">Rozhoduje objem, termín, charakter zboží a místo nakládky. Proto začínáme otázkami, které přepravu nastaví prakticky.</p></section>
    <section className="transport-list shell">{services.map((service) => <article id={service.id} key={service.id} className="transport-row"><div className="transport-visual"><Truck type={service.type} label={service.title} /></div><div><h2>{service.title}</h2><p>{service.text}</p></div><Link href="/spoluprace#poptavka" aria-label={`Poptat ${service.title}`}>Poptat <Arrow /></Link></article>)}</section>
    <section className="shell note-block"><h2>Nevíte, co přesně objednat?</h2><p>Nemusíte znát přepravní zkratky ani přesný typ auta. Popište náklad, trasu a termín. Doptáme se na to, co je pro volbu řešení důležité.</p><Link className="text-link" href="/spoluprace#poptavka">Popsat svůj náklad <Arrow /></Link></section>
  </>
}
