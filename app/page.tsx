import Link from 'next/link'
import Image from 'next/image'
import { Arrow, RouteLine } from './ui'
import { Truck } from './trucks'

export default function Home() {
  return <>
    <section className="hero hero-with-trucks">
      <div className="hero-photo" aria-hidden="true"><Image src="/images/scania-volvo-highway.png" alt="" fill priority sizes="100vw" /></div>
      <div className="shell hero-topline"><span>Česko · Evropa</span><span>Silniční přeprava &amp; spedice</span></div>
      <div className="shell"><h1>Zboží potřebuje jet.<br />Vy potřebujete vědět, <em>že je o něj postaráno.</em></h1></div>
      <div className="hero-road" aria-hidden="true"><div className="shell"><RouteLine /></div></div>
      <div className="shell hero-bottom">
        <p>Najdeme vhodné vozidlo, domluvíme přepravu a zůstáváme v obraze až do doručení.</p>
        <Link className="button button-light" href="/spoluprace#poptavka">Poptat přepravu <Arrow /></Link>
      </div>
    </section>

    <section className="shell introduction">
      <p className="eyebrow">Když řešíte náklad, řešíte víc než trasu.</p>
      <div className="intro-copy"><h2>Termín. Povahu zboží. Místo nakládky. Prostor na rampě.</h2><p>AKRON Logistics propojí tyto detaily do jedné přepravy. A místo automatické odpovědi máte na druhé straně člověka, který ví, co se s vaší zakázkou děje.</p><Link className="text-link" href="/spoluprace">Jak spolupráce probíhá <Arrow /></Link></div>
    </section>

    <section className="truck-focus">
      <div className="shell truck-focus-grid">
        <div className="truck-focus-copy"><p className="eyebrow">Tahače, které mají být vidět</p><h2>Scania a Volvo<br />v popředí přepravy.</h2><p>Na evropských trasách chceme stavět na tahačích Scania a Volvo. Značky jsou součástí přepravního obrazu AKRON Logistics — vedle správně zvolené soupravy a domluveného průběhu zakázky.</p></div>
        <figure><Image src="/images/scania-volvo-highway.png" alt="Dva dálkové tahače na evropské dálnici" width={2055} height={765} sizes="(max-width: 750px) 100vw, 53vw" /><figcaption><span>Scania</span><span>Volvo</span><em>Evropské silniční přepravy</em></figcaption></figure>
      </div>
    </section>

    <section className="service-band">
      <div className="shell service-heading"><p className="eyebrow">Vyberte situaci, kterou právě řešíte</p><h2>Pro každý náklad nehledáme stejné auto.</h2></div>
      <div className="shell service-rail">
        <article><div className="rail-icon"><Truck type="trailer" label="Návěs" /></div><h3>Plný návěs</h3><p>Když zboží zaplní prostor nebo potřebuje jet samostatně.</p><Link href="/preprava#celovozova">Zjistit více <Arrow /></Link></article>
        <article><div className="rail-icon"><Truck type="box" label="Sólo vozidlo" /></div><h3>Menší zásilka</h3><p>Pro náklad, který nepotřebuje celý návěs, ale potřebuje se dostat na místo.</p><Link href="/preprava#mensi">Zjistit více <Arrow /></Link></article>
        <article><div className="rail-icon"><Truck type="van" label="Dodávka" /></div><h3>Rychlé doručení</h3><p>Když rozhoduje čas, ladíme vozidlo a trasu podle aktuální situace.</p><Link href="/preprava#expres">Zjistit více <Arrow /></Link></article>
      </div>
    </section>

    <section className="shell area-section">
      <div className="area-map" aria-hidden="true"><div className="map-cz"></div><span className="map-point point-prague">Praha</span><span className="map-point point-morava">Morava</span><span className="map-point point-europe">Evropa</span></div>
      <div><p className="eyebrow">Odkud a kam</p><h2>Česko jako výchozí bod. Evropské trasy jako každodenní práce.</h2><p>Přepravy řešíme po celé České republice i do zahraničí. Obsluhujeme zákazníky z Prahy, středních Čech i Moravy — bez zbytečného dělení na regiony.</p><Link className="text-link" href="/moznosti#smery">Přepravní možnosti a směry <Arrow /></Link></div>
    </section>

    <section className="closing-strip"><div className="shell"><span>Máte trasu, termín a náklad?</span><Link href="/spoluprace#poptavka">Připravit poptávku <Arrow /></Link></div></section>
  </>
}
