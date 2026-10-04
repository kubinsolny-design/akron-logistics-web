import Link from 'next/link'
import Image from 'next/image'
import { RouteJourney } from './ui'
import { Truck } from './trucks'
import { CzechMap } from './czech-map'

export default function Home() {
  return <>
    <section className="hero hero-with-trucks hero-compact">
      <div className="hero-photo" aria-hidden="true"><Image src="/images/trucks-highway.png" alt="" fill priority sizes="100vw" /></div>
      <div className="shell hero-content">
        <div className="hero-copy">
          <p className="eyebrow">Silniční přeprava · Česko a Evropa</p>
          <h1>Přepravu vyřešíme.<br /><em>Od A do B.</em></h1>
          <p className="hero-description">Najdeme vhodné vozidlo a postaráme se o průběh přepravy.</p>
          <div className="hero-actions"><Link className="button" href="/spoluprace#poptavka">Poptat přepravu</Link><Link className="hero-text-link" href="/preprava">Co umíme přepravit</Link></div>
        </div>
      </div>
      <div className="hero-road"><div className="shell"><RouteJourney /></div></div>
    </section>

    <section className="trust-strip" aria-label="Přehled přepravních možností"><div className="shell trust-grid"><p><strong>Česko i Evropa</strong><span>vnitrostátní a mezinárodní trasy</span></p><p><strong>Dodávka až návěs</strong><span>vozidlo podle nákladu</span></p><p><strong>Jednorázově i pravidelně</strong><span>včetně expresních zásilek</span></p><p><strong>Jeden přímý kontakt</strong><span>po celou dobu přepravy</span></p></div></section>

    <section className="shell introduction">
      <div className="intro-copy"><p className="eyebrow">Nejdřív potřebujeme pochopit náklad</p><h2>Termín. Trasa. Rozměry. Způsob nakládky.</h2><p>Tyto detaily rozhodují o tom, jaké řešení dává smysl. AKRON Logistics je spojí do jedné přepravy, vybere vhodnou možnost a domluví ji se spolupracujícím dopravcem.</p><Link className="text-link" href="/spoluprace">Jak spolupráce probíhá</Link></div>
    </section>

    <section className="truck-focus">
      <div className="shell truck-focus-grid">
        <div className="truck-focus-copy"><p className="eyebrow">Přeprava je souhra detailů</p><h2>Nejde jen sehnat auto. Všechno musí navazovat.</h2><p>Vhodné vozidlo, čas nakládky, podmínky na trase i předání informací dopravci. Zakázku koordinujeme tak, abyste věděli, kdo ji řeší a co bude následovat.</p><Link className="text-link text-link-light" href="/spoluprace">Poznat náš postup</Link></div>
        <figure><Image src="/images/logistics-coordination.jpg" alt="Kamion u nakládací rampy během koordinace přepravy" width={1672} height={941} sizes="(max-width: 750px) 100vw, 53vw" /><figcaption><span>Vozidlo</span><span>Termín</span><span>Trasa</span><em>Jedna koordinovaná zakázka</em></figcaption></figure>
      </div>
    </section>

    <section className="service-band">
      <div className="shell service-heading"><p className="eyebrow">Vyberte situaci, kterou právě řešíte</p><h2>Pro každý náklad nehledáme stejné auto.</h2></div>
      <div className="shell service-rail service-rail-four">
        <article><div className="rail-icon"><Truck type="trailer" label="Návěs" /></div><h3>Plný návěs</h3><p>Když zboží zaplní prostor nebo potřebuje jet samostatně.</p><Link href="/preprava#celovozova">Zjistit více</Link></article>
        <article><div className="rail-icon"><Truck type="box" label="Sólo vozidlo" /></div><h3>Menší zásilka</h3><p>Pro náklad, který nepotřebuje celý návěs, ale potřebuje se dostat na místo.</p><Link href="/preprava#mensi">Zjistit více</Link></article>
        <article><div className="rail-icon"><Truck type="van" label="Dodávka" /></div><h3>Rychlé doručení</h3><p>Když rozhoduje čas, ladíme vozidlo a trasu podle aktuální situace.</p><Link href="/preprava#expres">Zjistit více</Link></article>
        <article><div className="rail-number">↻</div><h3>Pravidelné trasy</h3><p>Pro opakované přepravy s domluvenou četností a jasným postupem.</p><Link href="/preprava#pravidelna">Zjistit více</Link></article>
      </div>
      <p className="shell service-note">Podobu zakázky vždy koordinujeme s dopravcem, který odpovídá trase, termínu a nákladu.</p>
    </section>

    <section className="shell area-section" id="trasy">
      <CzechMap />
      <div><p className="eyebrow">Odkud a kam</p><h2>Po Česku. Do Evropy. A také zpět.</h2><p>Přepravy řešíme po celé České republice i do zahraničí. Z Prahy a středních Čech, z Moravy nebo odkudkoli podle potřeby konkrétní zakázky.</p><Link className="text-link" href="/moznosti#smery">Přepravní možnosti a směry</Link></div>
    </section>

    <section className="faq-section"><div className="shell faq-grid"><div className="faq-intro"><p className="eyebrow">Nejčastější otázky</p><h2>Stačí vědět, co potřebujete přepravit.</h2></div><div className="faq-list"><details><summary>Musím předem znát typ vozidla?</summary><p>Nemusíte. Podle rozměrů, hmotnosti, termínu a způsobu nakládky společně vybereme vhodnou přepravní možnost.</p></details><details><summary>Řešíte i menší zásilky?</summary><p>Ano. Vedle celovozových přeprav zajišťujeme menší zásilky, sběrnou přepravu i expresní jízdy.</p></details><details><summary>Mohu poptat pravidelnou trasu?</summary><p>Ano. U opakovaných přeprav nastavíme četnost, podmínky nakládek a způsob komunikace.</p></details><details><summary>Kam přepravujete?</summary><p>Po celé České republice i do zahraničí. Konkrétní trasu a možnosti ověříme podle nákladu a požadovaného termínu.</p></details></div></div></section>

    <section className="closing-strip"><div className="shell"><span>Máte trasu, termín a náklad?</span><Link href="/spoluprace#poptavka">Připravit poptávku</Link></div></section>
  </>
}
