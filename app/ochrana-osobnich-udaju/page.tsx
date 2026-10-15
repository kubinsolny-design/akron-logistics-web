import { contentMetadata, getPage, getSettings } from '../../sanity/content'
import { CmsPage } from '../cms-page'
import Link from 'next/link'

export async function generateMetadata() { return contentMetadata('ochrana-osobnich-udaju', 'Ochrana osobních údajů', 'Informace o zpracování osobních údajů při návštěvě webu a poptávce přepravy u AKRON Logistics.', '/ochrana-osobnich-udaju') }

export default async function PrivacyPage() {
  const [content, settings] = await Promise.all([getPage('ochrana-osobnich-udaju'), getSettings()])
  const company = settings
  if (content) return <CmsPage page={content} settings={settings} />
  return <article className="shell legal-page">
    <p className="eyebrow">Vaše soukromí</p>
    <h1>Ochrana osobních údajů</h1>
    <p>V těchto informacích vysvětlujeme, jak nakládáme s údaji při používání tohoto webu a při vyřizování poptávky přepravy.</p>
    <h2>Kdo je správcem údajů</h2>
    <p><strong>{company.name}</strong>, IČO {company.registrationNumber}, se sídlem {company.street}, {company.city}. Se žádostí týkající se ochrany údajů se můžete obrátit na <a href={`mailto:${company.email}`}>{company.email}</a> nebo písemně na tuto adresu, s označením „Ochrana osobních údajů“.</p>
    <h2>Jaké údaje zpracováváme a proč</h2>
    <ul>
      <li><strong>Poptávka a navazující komunikace:</strong> jméno a firma, e-mail, případně telefon, místa nakládky a vykládky, termín, četnost přeprav a popis nákladu. Tyto údaje slouží k posouzení poptávky, přípravě nabídky a komunikaci s vámi.</li>
      <li><strong>Provoz webu:</strong> technické údaje požadavků, například IP adresa, čas přístupu, navštívená adresa a informace o prohlížeči. Slouží k doručení stránky, zabezpečení a řešení technických chyb.</li>
      <li><strong>Nastavení soukromí:</strong> v prohlížeči uchováváme pouze vaši volbu nezbytných technologií a datum jejího uložení. Podrobnosti najdete na stránce <Link href="/cookies">Cookies</Link>.</li>
    </ul>
    <p>Do popisu nákladu nevkládejte citlivé osobní údaje ani údaje dalších osob, které nejsou pro poptávku potřebné. Povinné údaje potřebujeme k vyřízení poptávky; telefon je volitelný.</p>
    <h2>Na jakém základě údaje zpracováváme</h2>
    <p>U poptávající fyzické osoby jde o kroky před uzavřením smlouvy na její žádost, případně plnění smlouvy (čl. 6 odst. 1 písm. b GDPR). U kontaktních osob firem vycházíme z oprávněného zájmu na obchodní komunikaci a vyřízení poptávky (čl. 6 odst. 1 písm. f GDPR). Provoz, zabezpečení webu a ochrana práv jsou naším oprávněným zájmem. Pokud nám uchování údajů ukládá zákon, zpracováváme je pro splnění právní povinnosti (čl. 6 odst. 1 písm. c GDPR).</p>
    <p>Údaje z poptávky nepoužíváme k zasílání reklamních sdělení. Vyřízení poptávky nepodmiňujeme souhlasem s marketingem.</p>
    <h2>Kdo může mít k údajům přístup</h2>
    <p>Údaje mohou zpracovávat osoby pověřené vyřízením poptávky a poskytovatelé technických a komunikačních služeb v rozsahu nezbytném pro daný účel. Web je provozován na infrastruktuře Vercel. Pokud se domluví přeprava, nezbytné provozní údaje mohou být předány dopravci, který ji zajistí. Osobní údaje neprodáváme.</p>
    <p>Infrastruktura poskytovatele může zahrnovat zpracování mimo EU/EHP. Vercel popisuje podmínky zpracování a mechanismy předávání údajů, včetně standardních smluvních doložek, ve svých <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer">podmínkách ochrany údajů</a>. Informace o zárukách konkrétního předání si můžete vyžádat u správce.</p>
    <h2>Jak dlouho údaje uchováváme</h2>
    <p>Údaje z poptávky uchováváme po dobu jejího vyřizování a navazující komunikace. Další uchování se řídí tím, zda došlo k uzavření smlouvy, zda trvá obchodní vztah, zda je uchování potřebné pro uplatnění nebo obhajobu práv a zda je ukládají právní předpisy. Jakmile žádný z těchto důvodů netrvá, údaje se vymažou. Nastavení v prohlížeči má platnost 180 dní a můžete je kdykoli odstranit.</p>
    <h2>Jaká máte práva</h2>
    <p>Za podmínek GDPR máte právo na přístup k údajům, jejich opravu nebo doplnění, výmaz, omezení zpracování a přenositelnost. Proti zpracování založenému na oprávněném zájmu můžete vznést námitku. Na žádost odpovíme zpravidla do jednoho měsíce; v případech stanovených GDPR lze tuto lhůtu prodloužit. O případném prodloužení a jeho důvodu vás informujeme.</p>
    <p>Můžete také podat stížnost u <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer">Úřadu pro ochranu osobních údajů</a>, Pplk. Sochora 27, 170 00 Praha 7.</p>
    <h2>Automatizované rozhodování a cookies</h2>
    <p>Na tomto webu neprovádíme profilování ani automatizované rozhodování s právními nebo obdobně významnými účinky. Nepoužíváme reklamní ani analytické cookies. <Link href="/cookies">Přečtěte si informace o cookies a úložišti prohlížeče.</Link></p>
    <p className="legal-updated">Aktualizováno 4. října 2026.</p>
  </article>
}
