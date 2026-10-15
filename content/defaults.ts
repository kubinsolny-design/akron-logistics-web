import type { CmsPage, Settings, Section } from './types'
import { company } from '../app/site'

const action = (label: string, href = '/spoluprace#poptavka') => ({ label, href })
const section = (layout: string, editorLabel: string, data: Partial<Section>): Section => ({ layout, editorLabel, visible: true, ...data })
export const initialSettings: Partial<Settings> = {
  headerAction: action('Poptat přepravu'), footerAction: action('Poslat poptávku'),
  footerContactLabel: 'Přepravu s vámi řeší', footerTagline: 'Vnitrostátní a mezinárodní silniční přeprava',
  ...company, accentColor: '#ff5a00', darkColor: '#152236', backgroundColor: '#f2f2f2', textColor: '#0d1117', font: 'poppins',
  navigation: [action('Úvod', '/'), action('Přepravy', '/preprava'), action('Vozidla a možnosti', '/moznosti'), action('Kontakt', '/kontakt')],
  footerText: 'Silniční přeprava a spedice\nv Česku i za hranicemi.', inquiryEmail: company.email,
  formHeading: 'Krátká poptávka', formDescription: 'Stačí základní údaje. Co bude potřeba, společně upřesníme. Hvězdičkou (*) jsou označené povinné údaje.',
  submitLabel: 'Odeslat poptávku', successMessage: 'Děkujeme. Poptávku jsme přijali a ozveme se vám s dalším postupem.',
}
export const initialPages: CmsPage[] = [
  { _id: 'page-home', title: 'Úvod', slug: { current: 'home' }, seoTitle: 'Silniční přeprava a spedice',
    seoDescription: 'Vnitrostátní a mezinárodní silniční přeprava a spedice. Najdeme vhodné vozidlo a koordinujeme zakázku od poptávky po doručení.', sections: [
      section('hero', 'Úvodní fotografie a titulek', { eyebrow: 'Silniční přeprava · Česko a Evropa', heading: 'Přepravu vyřešíme.', highlight: 'Od A do B.', description: 'Zajistíme přepravu podle vašich potřeb a vše vyřídíme od nakládky až po doručení.', imagePath: '/images/trucks-highway.png', actions: [action('Poptat přepravu'), action(`Zavolat ${company.phone}`, company.phoneHref)] }),
      section('trust', 'Přehled výhod', { cards: [
        { title: 'Česko i Evropa', description: 'vnitrostátní a mezinárodní trasy' }, { title: 'Dodávka až návěs', description: 'vozidlo podle nákladu' },
        { title: 'Jednorázově i pravidelně', description: 'včetně expresních zásilek' }, { title: 'Jeden přímý kontakt', description: 'po celou dobu přepravy' },
      ] }),
      section('text', 'Představení přeprav', { eyebrow: 'Přeprava podle vašich potřeb', heading: 'Méně starostí s dopravou. Více času na vaše podnikání.', description: 'Od jedné palety po celý kamion. Zajistíme přepravu podle vašich potřeb a postaráme se o její průběh od nakládky až po doručení.', actions: [action('Jak spolupráce probíhá', '/spoluprace')] }),
      section('text', 'Koordinace zakázky', { theme: 'dark', eyebrow: 'Přeprava je souhra detailů', heading: 'Nejde jen sehnat auto. Všechno musí navazovat.', description: 'Vhodné vozidlo, čas nakládky, podmínky na trase i předání informací dopravci. Zakázku koordinujeme tak, abyste věděli, kdo ji řeší a co bude následovat.', imagePath: '/images/logistics-coordination.jpg', caption: 'Vozidlo · Termín · Trasa — Jedna koordinovaná zakázka', actions: [action('Poznat náš postup', '/spoluprace')] }),
      section('cards', 'Služby podle potřeb', { eyebrow: 'Vyberte situaci, kterou právě řešíte', heading: 'Pro každý náklad nehledáme stejné auto.', cardStyle: 'rail', cards: [
        { title: 'Plný návěs', vehicle: 'trailer', description: 'Když zboží zaplní prostor nebo potřebuje jet samostatně.', action: action('Zjistit více', '/preprava#celovozova') },
        { title: 'Menší zásilka', vehicle: 'box', description: 'Pro náklad, který nepotřebuje celý návěs, ale potřebuje se dostat na místo.', action: action('Zjistit více', '/preprava#mensi') },
        { title: 'Rychlé doručení', vehicle: 'van', description: 'Když rozhoduje čas, ladíme vozidlo a trasu podle aktuální situace.', action: action('Zjistit více', '/preprava#expres') },
        { title: 'Pravidelné trasy', vehicle: 'none', description: 'Pro opakované přepravy s domluvenou četností a jasným postupem.', action: action('Zjistit více', '/preprava#pravidelna') },
      ] }),
      section('note', 'Sypké materiály', { description: 'Přepravujete sypké materiály? Zajistíme také sklápěčky a návěsy s posuvnou podlahou.', actions: [action('Přeprava sypkých materiálů', '/preprava#sypke')] }),
      section('map', 'Přepravní směry', { anchor: 'trasy', eyebrow: 'Odkud a kam', heading: 'Po Česku. Do Evropy. A také zpět.', description: 'Přepravy řešíme po celé České republice i do zahraničí podle potřeb konkrétní zakázky.', imagePath: '/images/europe-map.svg', caption: 'Přepravy po Česku i napříč Evropou. Konkrétní trasu ověříme podle vaší poptávky.', actions: [action('Přepravní možnosti', '/moznosti#smery')] }),
      section('faq', 'Nejčastější otázky', { eyebrow: 'Nejčastější otázky', heading: 'Stačí vědět, co potřebujete přepravit.', questions: [
        { question: 'Musím předem znát typ vozidla?', answer: 'Nemusíte. Podle rozměrů, hmotnosti, termínu a způsobu nakládky společně vybereme vhodnou přepravní možnost.' },
        { question: 'Řešíte i menší zásilky?', answer: 'Ano. Vedle celovozových přeprav zajišťujeme menší zásilky, sběrnou přepravu i expresní jízdy.' },
        { question: 'Mohu poptat pravidelnou trasu?', answer: 'Ano. U opakovaných přeprav nastavíme četnost, podmínky nakládek a způsob komunikace.' },
        { question: 'Kam přepravujete?', answer: 'Po celé České republice i do zahraničí. Konkrétní trasu a možnosti ověříme podle nákladu a požadovaného termínu.' },
      ] }),
      section('cta', 'Závěrečná výzva', { heading: 'Máte trasu, termín a náklad?', actions: [action('Připravit poptávku')] }),
    ] },
  { _id: 'page-preprava', title: 'Přepravy', slug: { current: 'preprava' }, seoTitle: 'Silniční přeprava podle vašich požadavků', seoDescription: 'Celovozová, sběrná, expresní i pravidelná přeprava po Česku a Evropě. Zajišťujeme také přepravu sypkých materiálů sklápěčkami a návěsy s posuvnou podlahou.', sections: [
    section('hero', 'Úvod', { eyebrow: 'Přepravy podle skutečné potřeby', heading: 'Přeprava podle vašich požadavků.', description: 'Jednorázová zásilka, pravidelné přepravy nebo urgentní doručení. Zajistíme řešení podle vašeho nákladu, termínu a trasy.' }),
    section('cards', 'Seznam přepravních služeb', { cardStyle: 'list', cards: [
      { anchor: 'celovozova', vehicle: 'trailer', title: 'Celovozová přeprava', description: 'Vozidlo vyhrazené pro váš náklad. Zajistíme přímou přepravu z místa nakládky do cíle podle dohodnutých podmínek.', action: action('Poptat') },
      { anchor: 'mensi', vehicle: 'box', title: 'Částečné náklady a sběrná přeprava', description: 'Nepotřebujete celý vůz? Zajistíme přepravu jedné palety i větší zásilky a navrhneme vhodné řešení s ohledem na cenu a termín doručení.', action: action('Poptat') },
      { anchor: 'expres', vehicle: 'van', title: 'Expresní přeprava', description: 'Když rozhoduje čas. Zajistíme přímou přepravu vhodným vozidlem podle velikosti zásilky a požadovaného termínu.', action: action('Poptat') },
      { anchor: 'pravidelna', vehicle: 'trailer', title: 'Pravidelné přepravy', description: 'Potřebujete dopravu opakovaně? Domluvíme trasy, četnost a termíny podle provozu vaší firmy a postaráme se o průběžné zajištění přeprav.', action: action('Poptat') },
      { anchor: 'sypke', vehicle: 'tipper', title: 'Přeprava sypkých materiálů', description: 'Zajistíme sklápěčky a návěsy s posuvnou podlahou (walking floor) podle druhu materiálu, množství a podmínek nakládky i vykládky.', action: action('Poptat') },
    ] }),
    section('note', 'Výzva k poptávce', { heading: 'Potřebujete přepravu? Postaráme se o ni.', description: 'Pošlete nám trasu, termín a informace o nákladu. Připravíme vám nabídku a vše potřebné domluvíme společně.', actions: [action('Získat nabídku přepravy')] }),
  ] },
  { _id: 'page-moznosti', title: 'Vozidla a možnosti', slug: { current: 'moznosti' }, seoTitle: 'Vozidla a přepravní možnosti', seoDescription: 'Kamiony, sóla i dodávky, plachtové, skříňové a chladírenské vozy. Pro sypké materiály zajistíme sklápěčky a návěsy s posuvnou podlahou po Česku i Evropě.', sections: [
    section('hero', 'Úvod', { imagePath: '/images/trucks-highway.png', eyebrow: 'Vozidlo odpovídá nákladu', heading: 'Kamiony, sóla i dodávky. Podle vašich potřeb.', description: 'Od jedné palety po celý kamion, včetně přeprav sypkých materiálů. Zajistíme přepravu podle vašich požadavků a postaráme se o její průběh od nakládky až po doručení.' }),
    section('text', 'Přepravní možnosti', { imagePath: '/images/logistics-coordination.jpg', eyebrow: 'Možnosti přepravy', heading: 'Od jedné palety po celý kamion.', description: 'Dodávky pro menší zásilky a expresní přepravy, sólo vozidla pro větší náklady a návěsy pro celovozové přepravy. Konkrétní vozidlo vybereme podle nákladu a trasy — i jednu paletu lze přepravit v rámci sběrné přepravy. Zajistíme plachtové, skříňové i chladírenské vozy podle potřeb vašeho zboží. Pro sypké materiály zajistíme sklápěčky a návěsy s posuvnou podlahou (walking floor).', caption: 'Plachta · Skříň · Chladírna · Sklápěčka · Posuvná podlaha' }),
    section('cards', 'Typy vozidel', { cards: [
      { vehicle: 'van', title: 'Dodávka', description: 'menší zásilky a expres' }, { vehicle: 'box', title: 'Sólo', description: 'větší náklady' },
      { vehicle: 'trailer', title: 'Návěs', description: 'celovozové přepravy' }, { vehicle: 'tipper', title: 'Sklápěčka', description: 'sypké materiály' },
      { vehicle: 'walking-floor', title: 'Posuvná podlaha', description: 'walking floor' },
    ] }),
    section('text', 'Přepravní směry', { anchor: 'smery', eyebrow: 'Vnitrostátní i mezinárodní přeprava', heading: 'Po České republice i napříč Evropou.', description: 'Zajišťujeme vnitrostátní i mezinárodní přepravy podle vašich požadavků. Ať jde o jednorázovou zásilku nebo pravidelné přepravy, pošlete nám svou poptávku a připravíme vám nabídku.' }),
    section('cta', 'Závěrečná výzva', { heading: 'Nevíte, které vozidlo je pro náklad vhodné?', actions: [action('Probrat možnosti')] }),
  ] },
  { _id: 'page-spoluprace', title: 'Spolupráce a poptávka', slug: { current: 'spoluprace' }, seoTitle: 'Poptávka přepravy a průběh spolupráce', seoDescription: 'Pošlete trasu, termín a popis nákladu. AKRON Logistics vybere vhodné řešení, domluví dopravce a koordinuje přepravu až do doručení.', sections: [
    section('hero', 'Úvod', { eyebrow: 'Od první zprávy po doručení', heading: 'Zakázku koordinujeme.\nVy víte, na čem jste.', description: 'Od první domluvy až po doručení víte, na koho se obrátit. Zajistíme vozidlo, koordinujeme termíny a případné změny řešíme přímo s vámi.' }),
    section('process', 'Postup spolupráce', { heading: 'Co nám stačí pro začátek?', description: 'Napište nám, co potřebujete přepravit, odkud, kam a v jakém termínu. Přidejte kontakt na sebe a další podrobnosti už doladíme společně.', cards: [
      { title: 'Poptávka', description: 'Řeknete nám, co potřebujete přepravit, odkud, kam a kdy. Další podrobnosti doladíme společně.' },
      { title: 'Nalezení řešení', description: 'Zajistíme vhodné vozidlo a postaráme se o vše potřebné pro vaši přepravu.' },
      { title: 'Průběh přepravy', description: 'Jsme v kontaktu a hlídáme návaznost až do doručení.' },
    ] }),
    section('person', 'Představení firmy', { eyebrow: 'Jednáte s člověkem, ne s anonymním systémem', heading: 'AKRON Logistics', description: 'O vaši přepravu se postaráme od první domluvy až po doručení. Zajistíme vše potřebné a průběžně vás informujeme, abyste měli přehled bez zbytečného obvolávání.' }),
    section('inquiry', 'Poptávkový formulář', { anchor: 'poptavka', eyebrow: 'Poptávka přepravy', heading: 'Máte připravené základní údaje?', cards: [
      { title: 'Nakládka a vykládka', description: 'Místo nebo město stačí na začátek.' }, { title: 'Termín', description: 'Jednorázově, nebo pravidelně.' }, { title: 'Náklad', description: 'Popis, počet kusů, případně rozměry a hmotnost.' },
    ] }),
  ] },
]

export function withKeys<T>(data: T, field = ''): T {
  const types: Record<string, string> = { sections: 'pageSection', cards: 'contentCard', actions: 'action', navigation: 'action', questions: 'question' }
  if (Array.isArray(data)) return data.map((item, index) => typeof item === 'object' && item !== null ? withKeys({ _key: `item-${index}`, ...(types[field] ? { _type: types[field] } : {}), ...item }) : item) as T
  if (data && typeof data === 'object') return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, withKeys(value, key)])) as T
  return data
}
