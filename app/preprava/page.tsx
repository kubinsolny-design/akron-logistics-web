import { contentMetadata, getPage, getSettings } from '../../sanity/content'
import { CmsPage } from '../cms-page'
import Link from 'next/link'
import { Truck } from '../trucks'

export async function generateMetadata() { return contentMetadata('preprava', 'Silniční přeprava podle vašich požadavků', 'Celovozová, sběrná, expresní i pravidelná přeprava po Česku a Evropě. Zajišťujeme také přepravu sypkých materiálů sklápěčkami a návěsy s posuvnou podlahou.', '/preprava') }

const services = [
  { id: 'celovozova', type: 'trailer' as const, title: 'Celovozová přeprava', text: 'Vozidlo vyhrazené pro váš náklad. Zajistíme přímou přepravu z místa nakládky do cíle podle dohodnutých podmínek.' },
  { id: 'mensi', type: 'box' as const, title: 'Částečné náklady a sběrná přeprava', text: 'Nepotřebujete celý vůz? Zajistíme přepravu jedné palety i větší zásilky a navrhneme vhodné řešení s ohledem na cenu a termín doručení.' },
  { id: 'expres', type: 'van' as const, title: 'Expresní přeprava', text: 'Když rozhoduje čas. Zajistíme přímou přepravu vhodným vozidlem podle velikosti zásilky a požadovaného termínu.' },
  { id: 'pravidelna', type: 'trailer' as const, title: 'Pravidelné přepravy', text: 'Potřebujete dopravu opakovaně? Domluvíme trasy, četnost a termíny podle provozu vaší firmy a postaráme se o průběžné zajištění přeprav.' },
  { id: 'sypke', type: 'tipper' as const, title: 'Přeprava sypkých materiálů', text: 'Zajistíme sklápěčky a návěsy s posuvnou podlahou (walking floor) podle druhu materiálu, množství a podmínek nakládky i vykládky.' },
]

export default async function TransportPage() {
  const [content, settings] = await Promise.all([getPage('preprava'), getSettings()])
  if (content) return <CmsPage page={content} settings={settings} />
  return <>
    <section className="page-hero shell"><p className="eyebrow">Přepravy podle skutečné potřeby</p><h1>Přeprava podle vašich požadavků.</h1><p className="lead">Jednorázová zásilka, pravidelné přepravy nebo urgentní doručení. Zajistíme řešení podle vašeho nákladu, termínu a trasy.</p></section>
    <section className="transport-list shell">{services.map((service) => <article id={service.id} key={service.id} className="transport-row"><div className="transport-visual"><Truck type={service.type} label={service.title} /></div><div><h2>{service.title}</h2><p>{service.text}</p></div><Link href="/kontakt#poptavka" aria-label={`Poptat ${service.title}`}>Poptat</Link></article>)}</section>
    <section className="shell note-block"><h2>Potřebujete přepravu? Postaráme se o ni.</h2><p>Pošlete nám trasu, termín a informace o nákladu. Připravíme vám nabídku a vše potřebné domluvíme společně.</p><Link className="text-link" href="/kontakt#poptavka">Získat nabídku přepravy</Link></section>
  </>
}
