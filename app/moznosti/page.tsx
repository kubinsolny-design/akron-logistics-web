import { pageMetadata } from '../seo'
import Link from 'next/link'
import { Truck } from '../trucks'

export const metadata = pageMetadata('Vozidla a přepravní možnosti', 'Kamiony, sóla i dodávky, plachtové, skříňové a chladírenské vozy. Pro sypké materiály zajistíme sklápěčky a návěsy s posuvnou podlahou po Česku i Evropě.', '/moznosti')

export default function OptionsPage() {
  return <>
    <section className="page-hero shell"><p className="eyebrow">Vozidlo odpovídá nákladu</p><h1>Kamiony, sóla i dodávky. Podle vašich potřeb.</h1><p className="lead">Od jedné palety po celý kamion, včetně přeprav sypkých materiálů. Zajistíme přepravu podle vašich požadavků a postaráme se o její průběh od nakládky až po doručení.</p></section>
    <section className="vehicle-stage"><div className="shell vehicle-grid">
      <div className="vehicle-copy"><p className="eyebrow">Možnosti přepravy</p><h2>Od jedné palety po celý kamion.</h2><p>Dodávky pro menší zásilky a expresní přepravy, sólo vozidla pro větší náklady a návěsy pro celovozové přepravy. Konkrétní vozidlo vybereme podle nákladu a trasy — i jednu paletu lze přepravit v rámci sběrné přepravy. Zajistíme plachtové, skříňové i chladírenské vozy podle potřeb vašeho zboží. Pro sypké materiály zajistíme sklápěčky a návěsy s posuvnou podlahou (walking floor).</p><div className="vehicle-formats"><span>Plachta</span><span>Skříň</span><span>Chladírna</span><span>Sklápěčka</span><span>Posuvná podlaha</span></div></div>
      <div className="vehicle-set vehicle-set-expanded"><div><Truck type="van" label="Dodávka" /><strong>Dodávka</strong><span>menší zásilky a expres</span></div><div><Truck type="box" label="Sólo vozidlo" /><strong>Sólo</strong><span>větší náklady</span></div><div><Truck type="trailer" label="Návěs" /><strong>Návěs</strong><span>celovozové přepravy</span></div><div><Truck type="tipper" label="Sklápěčka" /><strong>Sklápěčka</strong><span>sypké materiály</span></div><div><Truck type="walking-floor" label="Návěs s posuvnou podlahou" /><strong>Posuvná podlaha</strong><span>walking floor</span></div></div>
    </div></section>
    <section className="shell directions" id="smery"><div className="directions-copy"><p className="eyebrow">Vnitrostátní i mezinárodní přeprava</p><h2>Po České republice i napříč Evropou.</h2><p>Zajišťujeme vnitrostátní i mezinárodní přepravy podle vašich požadavků. Ať jde o jednorázovou zásilku nebo pravidelné přepravy, pošlete nám svou poptávku a připravíme vám nabídku.</p></div></section>
    <section className="closing-strip"><div className="shell"><span>Nevíte, které vozidlo je pro náklad vhodné?</span><Link href="/spoluprace#poptavka">Probrat možnosti</Link></div></section>
  </>
}
