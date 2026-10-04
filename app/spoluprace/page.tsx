import { pageMetadata } from '../seo'
import { InquiryForm } from '../inquiry-form'
import { company } from '../site'

export const metadata = pageMetadata('Poptávka přepravy a průběh spolupráce', 'Pošlete trasu, termín a popis nákladu. AKRON Logistics vybere vhodné řešení, domluví dopravce a koordinuje přepravu až do doručení.', '/spoluprace')

export default function CooperationPage() {
  return <>
    <section className="page-hero shell"><p className="eyebrow">Od první zprávy po doručení</p><h1>Zakázku koordinujeme.<br />Vy víte, na čem jste.</h1><p className="lead">Přepravu organizujeme s dopravci, se kterými spolupracujeme. Smyslem není jen sehnat auto, ale sladit trasu, náklad, termín a komunikaci tak, aby vše navazovalo.</p></section>
    <section className="shell process-layout"><div className="process-lead"><h2>Co potřebujeme vědět jako první</h2><p>Odkud a kam se jede, kdy, co vezeme a na koho se obrátit. Když bude potřeba, doptáme se na rozměry, hmotnost, teplotu nebo způsob nakládky.</p></div><div className="process-flow"><article><h3>Poptávka</h3><p>Ujasníme si náklad, termín, trasu a kontakt.</p></article><article><h3>Nalezení řešení</h3><p>Vybereme vhodnou přepravní možnost a zkoordinujeme ji s dopravcem.</p></article><article><h3>Průběh přepravy</h3><p>Jsme v kontaktu a hlídáme návaznost až do doručení.</p></article></div></section>
    <section className="person-section"><div className="shell person-grid"><div className="person-monogram" aria-hidden="true">AB</div><div><p className="eyebrow">Jednáte s člověkem, ne s anonymním systémem</p><h2>{company.contactName}<br /><span>AKRON Logistics</span></h2><p>Od prvních podkladů po doručení víte, kdo vaši zakázku řeší. Hlídáme předání informací mezi vámi a dopravcem a ozveme se, když je potřeba něco upřesnit.</p><div className="personal-contact"><a href={company.phoneHref}>{company.phone}</a><a href={`mailto:${company.email}`}>{company.email}</a></div></div></div></section>
    <section className="shell inquiry" id="poptavka"><p className="eyebrow">Poptávka přepravy</p><h2>Máte připravené základní údaje?</h2><div className="inquiry-grid"><p><strong>Nakládka a vykládka</strong>Místo nebo město stačí na začátek.</p><p><strong>Termín</strong>Jednorázově, nebo pravidelně.</p><p><strong>Náklad</strong>Popis, počet kusů, případně rozměry a hmotnost.</p></div><InquiryForm /></section>
  </>
}
