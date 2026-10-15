import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import type { Action, Card, CmsPage as PageContent, Section, Settings } from '../sanity/types'
import { imageUrl, safeHref } from '../sanity/client'
import { InquiryForm } from './inquiry-form'
import { Truck } from './trucks'
import { RouteJourney } from './ui'
import { CookieSettingsButton } from './cookie-preferences'
import { withPublicContact } from './public-contact'

function Actions({ actions, light = false }: { actions?: Action[]; light?: boolean }) {
  return <>{actions?.map((action, i) => <Link className={`text-link${light ? ' text-link-light' : ''}`} key={action._key || i} href={safeHref(action.href)}>{action.label}</Link>)}</>
}
function Heading({ section: s }: { section: Section }) {
  return <>{s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}{s.heading && <h2>{s.heading}</h2>}{s.description && <p className="cms-paragraph">{s.description}</p>}</>
}
function CardVisual({ card }: { card: Card }) {
  const src = imageUrl(card.image, 800)
  const vehicles = ['van', 'box', 'trailer', 'tipper', 'walking-floor'] as const
  const vehicle = vehicles.find(value => value === card.vehicle)
  if (src) return <Image src={src} alt={card.image?.alt || ''} width={800} height={450} sizes="(max-width:750px) 100vw, 30vw" />
  if (vehicle) return <Truck type={vehicle} label={card.title || 'Vozidlo'} />
  return <span className="rail-number" aria-hidden="true">↻</span>
}
function RenderSection({ section: s, settings, home = false, optionsPage = false }: { section: Section; settings: Settings; home?: boolean; optionsPage?: boolean }) {
  const src = imageUrl(s.image) || s.imagePath || (optionsPage && s.layout === 'text' && !s.anchor ? '/images/logistics-coordination.jpg' : undefined)
  const actions: Action[] | undefined = home && s.layout === 'hero' ? [{ label: 'Poptat přepravu', href: '/kontakt#poptavka' }] : s.actions
  const attrs = { id: s.anchor || undefined }
  switch (s.layout) {
    case 'hero':
      if (optionsPage) return <section {...attrs} className="page-hero page-hero-visual shell"><div><p className="eyebrow">{s.eyebrow}</p><h1 className="cms-paragraph">{s.heading}{s.highlight && <em>{s.highlight}</em>}</h1><p className="lead">{s.description}</p><Actions actions={actions} /></div><figure><Image src={src || '/images/trucks-highway.png'} alt={s.image?.alt || 'Silniční přeprava nákladním vozidlem'} width={1600} height={1100} priority sizes="(max-width:750px) 100vw, 48vw" /></figure></section>
      return src ? <section {...attrs} className="hero hero-with-trucks hero-compact">
        <div className="hero-photo" aria-hidden="true"><Image src={src} alt="" fill priority sizes="100vw" /></div>
        <div className="shell hero-content"><div className="hero-copy"><p className="eyebrow">{s.eyebrow}</p><h1>{s.heading}{s.highlight && <><br /><em>{s.highlight}</em></>}</h1><p className="hero-description">{s.description}</p><div className="hero-actions">{actions?.map((a, i) => <Link key={a._key || i} className="button" href={safeHref(a.href)}>{a.label}</Link>)}</div></div></div>
        <div className="hero-road"><div className="shell"><RouteJourney /></div></div>
      </section> : <section {...attrs} className="page-hero shell"><p className="eyebrow">{s.eyebrow}</p><h1 className="cms-paragraph">{s.heading}{s.highlight && <em>{s.highlight}</em>}</h1><p className="lead">{s.description}</p><Actions actions={actions} /></section>
    case 'trust':
      return <section {...attrs} className="trust-strip"><div className="shell trust-grid">{s.cards?.map((c, i) => <p key={c._key || i}><strong>{c.title}</strong><span>{c.description}</span></p>)}</div></section>
    case 'text':
      return s.theme === 'dark' ? <section {...attrs} className="truck-focus"><div className="shell truck-focus-grid"><div className="truck-focus-copy"><Heading section={s} /><Actions actions={s.actions} light /></div>{src && <figure><Image src={src} alt={s.image?.alt || s.heading || ''} width={1672} height={941} sizes="(max-width:750px) 100vw, 53vw" />{s.caption && <figcaption>{s.caption}</figcaption>}</figure>}</div></section> : <section {...attrs} className={`shell introduction${src ? ' cms-text-image' : ''}`}><div className="intro-copy"><Heading section={s} />{s.caption && <p>{s.caption}</p>}<Actions actions={s.actions} /></div>{src && <Image src={src} alt={s.image?.alt || ''} width={1200} height={800} sizes="(max-width:750px) 100vw, 50vw" />}</section>
    case 'cards':
      if (s.cardStyle === 'list') return <section {...attrs} className="transport-list shell"><Heading section={s} />{s.cards?.map((c, i) => <article id={c.anchor} key={c._key || i} className="transport-row"><div className="transport-visual"><CardVisual card={c} /></div><div><h2>{c.title}</h2><p>{c.description}</p></div>{c.action?.label && <Link href={safeHref(c.action.href)}>{c.action.label}</Link>}</article>)}</section>
      return <section {...attrs} className={`service-band${optionsPage ? ' vehicle-options-band' : ''}`}><div className="shell service-heading"><Heading section={s} /></div><div className="shell service-rail cms-card-grid" style={{ '--cms-columns': Math.min(s.cards?.length || 1, optionsPage ? 5 : 4) } as React.CSSProperties}>{s.cards?.map((c, i) => <article id={c.anchor} key={c._key || i}><div className="rail-icon"><CardVisual card={c} /></div><h3>{c.title}</h3><p>{c.description}</p>{c.action?.label && <Link href={safeHref(c.action.href)}>{c.action.label}</Link>}</article>)}</div><div className="shell"><Actions actions={s.actions} /></div></section>
    case 'map':
      return <section {...attrs} className="shell area-section"><figure className="europe-map"><div className="map-art">{src && <Image src={src} alt={s.image?.alt || 'Mapa přepravních směrů'} width={800} height={760} sizes="(max-width:750px) 100vw, 50vw" />}</div><figcaption>{s.caption}</figcaption></figure><div><Heading section={s} /><Actions actions={s.actions} /></div></section>
    case 'faq':
      return <section {...attrs} className="faq-section"><div className="shell faq-grid"><div className="faq-intro"><Heading section={s} /></div><div className="faq-list">{s.questions?.map((q, i) => <details key={q._key || i}><summary>{q.question}</summary><p>{q.answer}</p></details>)}</div></div></section>
    case 'process':
      return <section {...attrs} className="shell process-layout"><div className="process-lead"><Heading section={s} /></div><div className="process-flow">{s.cards?.map((c, i) => <article key={c._key || i}><h3>{c.title}</h3><p>{c.description}</p></article>)}</div></section>
    case 'person': {
      const portrait = src || imageUrl(settings.portrait, 800)
      return <section {...attrs} className="person-section"><div className="shell person-grid">{portrait ? <Image className="cms-portrait" src={portrait} alt={s.image?.alt || settings.portrait?.alt || settings.contactName} width={600} height={600} /> : <div className="person-monogram" aria-hidden="true">{settings.contactName.slice(0, 1)}</div>}<div><Heading section={{ ...s, description: settings.about || s.description }} /><div className="personal-contact"><a href={settings.phoneHref}>{settings.phone}</a><a href={`mailto:${settings.email}`}>{settings.email}</a></div></div></div></section>
    }
    case 'inquiry':
      return <section {...attrs} className="shell inquiry"><Heading section={s} /><div className="inquiry-grid">{s.cards?.map((c, i) => <p key={c._key || i}><strong>{c.title}</strong>{c.description}</p>)}</div><InquiryForm labels={{ formHeading: settings.formHeading, formDescription: settings.formDescription, submitLabel: settings.submitLabel }} /></section>
    case 'cta':
      return <section {...attrs} className="closing-strip"><div className="shell"><span>{s.heading || s.description}</span>{s.actions?.map((a, i) => <Link key={a._key || i} href={safeHref(a.href)}>{a.label}</Link>)}</div></section>
    case 'note':
      return <section {...attrs} className="shell note-block"><Heading section={s} /><Actions actions={s.actions} /></section>
    default: return null
  }
}

export function CmsPage({ page: storedPage, settings }: { page: PageContent; settings: Settings }) {
  const page = withPublicContact(storedPage, settings.email)
  return <>{page.sections?.filter(s => s.visible !== false).map((s, i) => <RenderSection key={s._key || i} section={s} settings={settings} home={page.slug?.current === 'home'} optionsPage={page.slug?.current === 'moznosti'} />)}{page.body && <article className="shell legal-page"><h1>{page.title}</h1><PortableText value={page.body} components={{ marks: { link: ({ value, children }) => <a href={safeHref(value?.href)}>{children}</a> } }} />{page.slug?.current === 'cookies' && <CookieSettingsButton />}</article>}</>
}
