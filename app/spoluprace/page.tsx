import { contentMetadata, getPage, getSettings } from '../../sanity/content'
import { CmsPage } from '../cms-page'
import { InquiryForm } from '../inquiry-form'
import Image from 'next/image'

export async function generateMetadata() { return contentMetadata('spoluprace', 'Kontakt a poptávka přepravy', 'Pošlete trasu, termín a popis nákladu. AKRON Logistics vybere vhodné řešení, domluví dopravce a koordinuje přepravu až do doručení.', '/kontakt') }

export default async function CooperationPage() {
  const [content, settings] = await Promise.all([getPage('spoluprace'), getSettings()])
  const company = settings
  if (content) return <CmsPage page={content} settings={settings} />
  return <>
    <section className="page-hero shell"><p className="eyebrow">Od první zprávy po doručení</p><h1>Zakázku koordinujeme.<br />Vy víte, na čem jste.</h1><p className="lead">Od první domluvy až po doručení víte, na koho se obrátit. Zajistíme vozidlo, koordinujeme termíny a případné změny řešíme přímo s vámi.</p></section>
    <section className="shell process-layout"><div className="process-lead"><h2>Co nám stačí pro začátek?</h2><p>Napište nám, co potřebujete přepravit, odkud, kam a v jakém termínu. Přidejte kontakt na sebe a další podrobnosti už doladíme společně.</p></div><div className="process-flow"><article><h3>Poptávka</h3><p>Řeknete nám, co potřebujete přepravit, odkud, kam a kdy. Další podrobnosti doladíme společně.</p></article><article><h3>Nalezení řešení</h3><p>Zajistíme vhodné vozidlo a postaráme se o vše potřebné pro vaši přepravu.</p></article><article><h3>Průběh přepravy</h3><p>Jsme v kontaktu a hlídáme návaznost až do doručení.</p></article></div></section>
    <section className="person-section"><div className="shell person-grid"><div className="person-monogram" aria-hidden="true"><Image src="/icon.svg" alt="" width={260} height={260} /></div><div><p className="eyebrow">Jednáte s člověkem, ne s anonymním systémem</p><h2>AKRON Logistics</h2><p>O vaši přepravu se postaráme od první domluvy až po doručení. Zajistíme vše potřebné a průběžně vás informujeme, abyste měli přehled bez zbytečného obvolávání.</p><div className="personal-contact"><a href={company.phoneHref}>{company.phone}</a><a href={`mailto:${company.email}`}>{company.email}</a></div></div></div></section>
    <section className="shell inquiry" id="poptavka"><p className="eyebrow">Poptávka přepravy</p><h2>Máte připravené základní údaje?</h2><div className="inquiry-grid"><p><strong>Nakládka a vykládka</strong>Místo nebo město stačí na začátek.</p><p><strong>Termín</strong>Jednorázově, nebo pravidelně.</p><p><strong>Náklad</strong>Popis, počet kusů, případně rozměry a hmotnost.</p></div><InquiryForm /></section>
  </>
}
