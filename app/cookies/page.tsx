import { pageMetadata } from '../seo'
import Link from 'next/link'
import { CookieSettingsButton } from '../cookie-preferences'

export const metadata = pageMetadata('Cookies', 'Jak AKRON Logistics používá nezbytné technologie a jak spravovat nastavení soukromí v prohlížeči.', '/cookies')

export default function CookiesPage() {
  return <article className="shell legal-page">
    <p className="eyebrow">Nastavení soukromí</p>
    <h1>Cookies a úložiště prohlížeče</h1>
    <p>Web používá pouze nezbytné technologie pro svůj provoz a zapamatování vašeho nastavení. Analytické ani reklamní cookies nebo sledovací pixely zde nepoužíváme.</p>
    <h2>Co jsou cookies</h2>
    <p>Cookies jsou malé soubory, které prohlížeč ukládá při návštěvě webu. Podobnou funkci má místní úložiště prohlížeče (localStorage). Nezbytné technologie slouží k provozu nebo poskytování vámi požadované funkce; jejich použití nevyžaduje souhlas. Volitelné technologie pro měření či reklamu by vyžadovaly předchozí souhlas.</p>
    <h2>Co ukládáme na tomto webu</h2>
    <p><strong>akron-privacy-preferences</strong> — záznam v místním úložišti vašeho prohlížeče, který obsahuje pouze verzi nastavení, volbu „pouze nezbytné“ a čas uložení. Slouží k tomu, aby se vám informace o cookies nezobrazovala při každé návštěvě. Platnost nastavení je 180 dní; po uplynutí této doby se informace zobrazí znovu. Záznam se neodesílá na server ani třetím stranám a neslouží ke sledování návštěvnosti.</p>
    <p>Hosting může při ochraně webu před škodlivým provozem používat nezbytné technické mechanismy. Ty neslouží k reklamě ani sledování návštěvníků napříč weby.</p>
    <h2>Jak nastavení změnit</h2>
    <p>Nastavení můžete kdykoli otevřít tlačítkem níže nebo odkazem „Nastavení cookies“ v patičce webu. Protože web nepoužívá žádné volitelné kategorie, není zde co povolovat pro reklamu či analytiku.</p>
    <CookieSettingsButton />
    <p>Uložené nastavení můžete odstranit také vymazáním dat tohoto webu v prohlížeči. Při další návštěvě se informační lišta zobrazí znovu. Omezení ukládání nezbytných dat může způsobit, že si web vaši volbu nezapamatuje.</p>
    <h2>Osobní údaje</h2>
    <p>O zpracování kontaktních údajů a poptávek se dočtete na stránce <Link href="/ochrana-osobnich-udaju">Ochrana osobních údajů</Link>.</p>
    <p className="legal-updated">Aktualizováno 4. října 2026.</p>
  </article>
}
