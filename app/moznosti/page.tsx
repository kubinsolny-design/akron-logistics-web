import type { Metadata } from 'next'
import Link from 'next/link'
import { Truck } from '../trucks'

export const metadata: Metadata = {
  title: 'Vozidla a přepravní směry',
  description: 'Dodávka, sólo vozidlo nebo návěs v plachtovém, skříňovém či chladírenském provedení pro přepravy po Česku a Evropě.',
}

export default function OptionsPage() {
  return <>
    <section className="page-hero shell"><p className="eyebrow">Vozidlo odpovídá nákladu</p><h1>Dodávka, sólo, návěs.<br />Bez zkratek, které nemusíte znát.</h1><p className="lead">Řekněte nám, co vezete a kam. Pomůžeme vybrat přepravní řešení podle prostoru, teploty, manipulace a termínu.</p></section>
    <section className="vehicle-stage"><div className="shell vehicle-grid">
      <div className="vehicle-copy"><p className="eyebrow">Možnosti přepravy</p><h2>Od menšího nákladu po plný vůz.</h2><p>Dodávka pro menší a rychlé zásilky. Sólo vozidlo pro střední objem. Návěs, když je nákladu víc nebo má jet samostatně. Podle povahy zboží řešíme plachtové, skříňové i chladírenské provedení.</p><div className="vehicle-formats"><span>Plachta</span><span>Skříň</span><span>Chladírna</span></div></div>
      <div className="vehicle-set"><div><Truck type="van" label="Dodávka" /><strong>Dodávka</strong><span>menší náklad</span></div><div><Truck type="box" label="Sólo vozidlo" /><strong>Sólo</strong><span>střední objem</span></div><div><Truck type="trailer" label="Návěs" /><strong>Návěs</strong><span>velký náklad</span></div></div>
    </div></section>
    <section className="shell directions" id="smery"><div className="directions-copy"><p className="eyebrow">Přepravní směry</p><h2>Z Česka do Evropy a zpět.</h2><p>Trasy z Prahy a středních Čech i spolupráci s firmami na Moravě řešíme jako přirozenou součást celorepublikového záběru. Potřebujete jiný směr? Pošlete trasu a ověříme možnosti.</p></div><div className="direction-list"><span>Česká republika</span><span>Německo</span><span>Polsko</span><span>Francie</span><span>Španělsko</span><span>Maďarsko</span></div></section>
    <section className="closing-strip"><div className="shell"><span>Nevíte, které vozidlo je pro náklad vhodné?</span><Link href="/spoluprace#poptavka">Probrat možnosti</Link></div></section>
  </>
}
