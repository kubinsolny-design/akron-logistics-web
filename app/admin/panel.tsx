'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { imageUrl } from '../../sanity/client'
import { AdminRecords } from './records'
import { AdminIcon } from './icons'
import { AdminFiles } from './files'
import { DocumentEditor } from './document-editor'
import { supportsDocumentEditor } from './rich-text'
import { signOut } from './actions'
import { browserClient } from '../../supabase/browser'
import type { MemberRole } from '../../supabase/server'

type Value = string | number | boolean | null | Value[] | { [key: string]: Value }
type ObjectValue = { [key: string]: Value }
type Document = { id: string; kind: string; data: ObjectValue; revision: number }
const labels: Record<string, string> = {
  title: 'Název', name: 'Název firmy', current: 'Adresa stránky', slug: 'Adresa stránky',
  sections: 'Sekce stránky', body: 'Text stránky', children: 'Obsah odstavce', text: 'Text',
  editorLabel: 'Název sekce v administraci', layout: 'Typ sekce', visible: 'Zobrazit sekci',
  anchor: 'Odkaz na sekci', eyebrow: 'Malý nadpis', heading: 'Nadpis', highlight: 'Zvýrazněný text',
  description: 'Popis', image: 'Obrázek', imagePath: 'Cesta k obrázku', url: 'Adresa obrázku',
  caption: 'Popisek', alt: 'Popis obrázku pro čtečky', theme: 'Barevná varianta', actions: 'Tlačítka',
  label: 'Text tlačítka', href: 'Cílový odkaz', cards: 'Karty', vehicle: 'Velikost vozidla',
  questions: 'Otázky a odpovědi', question: 'Otázka', answer: 'Odpověď', action: 'Tlačítko',
  cardStyle: 'Rozložení karet', seoTitle: 'Titulek pro vyhledávače', seoDescription: 'Popis pro vyhledávače',
  shareImage: 'Obrázek při sdílení', contactName: 'Kontaktní osoba', email: 'E-mail', phone: 'Telefon',
  registrationNumber: 'IČO', street: 'Ulice', city: 'Město', about: 'Představení firmy', portrait: 'Portrét',
  logo: 'Logo', lightLogo: 'Světlé logo', accentColor: 'Hlavní barva', darkColor: 'Tmavá barva',
  backgroundColor: 'Barva pozadí', textColor: 'Barva textu', font: 'Písmo', navigation: 'Navigace',
  footerText: 'Text v patičce', inquiryEmail: 'E-mail příjemce poptávek (neveřejný)',
  formHeading: 'Nadpis formuláře', formDescription: 'Popis formuláře', submitLabel: 'Odesílací tlačítko',
  successMessage: 'Potvrzení odeslání', headerAction: 'Tlačítko v hlavičce', footerAction: 'Tlačítko v patičce',
  footerContactLabel: 'Nadpis kontaktu v patičce', footerTagline: 'Podtitulek v patičce', style: 'Styl odstavce',
}
const options: Record<string, string[]> = {
  layout: ['hero', 'trust', 'text', 'cards', 'map', 'faq', 'process', 'person', 'inquiry', 'cta', 'note'],
  vehicle: ['none', 'van', 'box', 'trailer', 'tipper', 'walking-floor'], theme: ['light', 'dark'], cardStyle: ['rail', 'list'],
  font: ['orbitron', 'poppins'],
}
const ignored = new Set(['asset', 'phoneHref', 'markDefs', 'marks'])

function blankItem(field: string): Value {
  const key = crypto.randomUUID()
  if (field === 'sections') return { _key: key, editorLabel: 'Nová sekce', layout: 'text', visible: true, heading: '', description: '', actions: [], cards: [], questions: [], image: { url: '', alt: '' } }
  if (field === 'cards') return { _key: key, title: '', description: '', vehicle: 'box', image: { url: '', alt: '' }, action: { label: '', href: '' } }
  if (field === 'questions') return { _key: key, question: '', answer: '' }
  if (field === 'body') return { _key: key, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: crypto.randomUUID(), _type: 'span', text: '', marks: [] }] }
  if (field === 'children') return { _key: key, _type: 'span', text: '', marks: [] }
  return { _key: key, label: '', href: '' }
}

export function Fields({ value, onChange, disabled, path = [], onUpload, documentBody = false }: { value: ObjectValue; onChange: (value: ObjectValue) => void; disabled: boolean; path?: string[]; onUpload?: (file: File, path: string[]) => Promise<void>; documentBody?: boolean }) {
  const editable = { ...value }
  if (path.length === 0 && Array.isArray(value.sections)) {
    editable.shareImage ??= { url: '', alt: '' }
  }
  if (typeof value.layout === 'string') editable.image ??= { url: '', alt: '' }
  if (path.length === 0 && !value.sections && !value.body && value.name) {
    for (const field of ['logo', 'lightLogo', 'portrait']) editable[field] ??= { url: '', alt: '' }
  }
  return <div className="admin-fields">{Object.entries(editable).filter(([name]) => !name.startsWith('_') && !ignored.has(name)).map(([name, item]) => {
    const label = labels[name] || name
    const change = (updated: Value) => onChange({ ...value, [name]: updated })
    if (name === 'body' && path.length === 0 && documentBody && Array.isArray(item) && supportsDocumentEditor(item)) return <DocumentEditor key={name} value={item} onChange={change} disabled={disabled} />
    if (['image', 'portrait', 'logo', 'lightLogo', 'shareImage'].includes(name)) {
      const image = item && typeof item === 'object' && !Array.isArray(item) ? item : {}
      const preview = imageUrl({ url: typeof image.url === 'string' ? image.url : undefined, asset: image.asset as { _ref: string } | undefined }, 600)
        || (name === 'image' && typeof value.imagePath === 'string' && /^\/images\/[a-z0-9_./-]+$/i.test(value.imagePath) ? value.imagePath : undefined)
      return <fieldset key={name}><legend>{label}</legend>
        {preview ? <div className="admin-image-preview"><Image unoptimized width={600} height={200} src={preview} alt={String(image.alt || label)} /></div> : <p className="admin-muted">Zatím není vybraný obrázek. Nahrajte JPEG, PNG nebo WebP do 10 MB.</p>}
        <Fields value={{ url: '', alt: '', ...image }} onChange={change} disabled={disabled} path={[...path, name]} onUpload={onUpload} />
        {!disabled && onUpload && <label>Nahrát a použít nový obrázek<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
          const file = event.target.files?.[0]; if (file) void onUpload(file, [...path, name]); event.target.value = ''
        }} /></label>}
      </fieldset>
    }
    if (Array.isArray(item)) return <fieldset key={name}><legend>{label} · {item.length}</legend>{item.map((entry, index) => <details className="admin-item" key={typeof entry === 'object' && entry && !Array.isArray(entry) ? String(entry._key || index) : index}>
      <summary>{entry && typeof entry === 'object' && !Array.isArray(entry) ? String(entry.editorLabel || entry.title || entry.question || entry.label || `${label} ${index + 1}`) : `${label} ${index + 1}`}</summary>
      <div className="admin-item-tools"><span>{label} {index + 1}</span>{!disabled && <>
        <button type="button" disabled={index === 0} aria-label={`Posunout ${label} ${index + 1} nahoru`} onClick={() => { const items = [...item]; [items[index - 1], items[index]] = [items[index], items[index - 1]]; change(items) }}>↑</button>
        <button type="button" disabled={index === item.length - 1} aria-label={`Posunout ${label} ${index + 1} dolů`} onClick={() => { const items = [...item]; [items[index + 1], items[index]] = [items[index], items[index + 1]]; change(items) }}>↓</button>
        <button type="button" onClick={() => { if (window.confirm('Odebrat tuto položku z rozpracované verze?')) change(item.filter((_, i) => i !== index)) }}>Odebrat</button>
      </>}</div>
      {entry && typeof entry === 'object' && !Array.isArray(entry)
        ? <Fields value={entry} disabled={disabled} path={[...path, name, String(index)]} onUpload={onUpload} onChange={(updated) => change(item.map((it, i) => i === index ? updated : it))} />
        : <input aria-label={`${label} ${index + 1}`} value={String(entry || '')} disabled={disabled} onChange={(event) => change(item.map((it, i) => i === index ? event.target.value : it))} />}
    </details>)}{!disabled && <button type="button" onClick={() => change([...item, blankItem(name)])}>Přidat položku</button>}</fieldset>
    if (item && typeof item === 'object') return <fieldset key={name}><legend>{label}</legend><Fields value={item} onChange={change} disabled={disabled} path={[...path, name]} onUpload={onUpload} /></fieldset>
    if (typeof item === 'boolean') return <label key={name} className="admin-check"><input type="checkbox" checked={item} disabled={disabled} onChange={(event) => change(event.target.checked)} />{label}</label>
    if (name === 'layout') return <label key={name}>{label}<select value={String(item || '')} disabled={disabled} onChange={event => change(event.target.value)}>{Object.entries({ hero: 'Úvodní velký obrázek', trust: 'Přehled výhod', text: 'Text', cards: 'Karty služeb', map: 'Mapa', faq: 'Otázky a odpovědi', process: 'Postup spolupráce', person: 'Kontaktní osoba', inquiry: 'Poptávkový formulář', cta: 'Výzva s tlačítkem', note: 'Poznámka' }).map(([type, title]) => <option key={type} value={type}>{title}</option>)}</select></label>
    if (options[name]) return <label key={name}>{label}<select value={String(item || '')} disabled={disabled} onChange={(event) => change(event.target.value)}><option value="">Výchozí</option>{options[name].map(option => <option key={option}>{option}</option>)}</select></label>
    const long = ['description', 'text', 'answer', 'about', 'footerText', 'formDescription', 'seoDescription'].includes(name)
    return <label key={name}>{label}{long ? <textarea rows={3} value={String(item || '')} disabled={disabled} onChange={(event) => change(event.target.value)} />
      : <input value={String(item ?? '')} type={typeof item === 'number' ? 'number' : 'text'} disabled={disabled} onChange={(event) => change(typeof item === 'number' ? Number(event.target.value) : event.target.value)} />}</label>
  })}</div>
}

function replaceImage(value: Value, path: string[], url: string): Value {
  if (path.length === 0) return { ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}), url }
  const [key, ...rest] = path
  if (Array.isArray(value)) return value.map((item, index) => String(index) === key ? replaceImage(item, rest, url) : item)
  if (value && typeof value === 'object') return { ...value, [key]: replaceImage(value[key], rest, url) }
  return value
}

export function AdminPanel({ documents, role, userId, email = '', publishingEnabled = false }: { documents: Document[]; role: MemberRole; userId: string; email?: string; publishingEnabled?: boolean }) {
  const [items, setItems] = useState(documents)
  const initial = documents.find(item => item.id === 'page-home') || documents.find(item => item.kind === 'page') || documents[0]
  const [selected, setSelected] = useState(initial?.id || '')
  const [data, setData] = useState<ObjectValue>(initial?.data || {})
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<'overview' | 'content' | 'settings' | 'users' | 'inquiries' | 'activity' | 'files' | 'analytics'>('overview')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'info' | 'error' | 'success'>('info')
  const current = items.find(item => item.id === selected)
  const readOnly = role === 'viewer'
  function notify(text: string, tone: typeof messageTone = 'info') { setMessage(text); setMessageTone(tone) }

  useEffect(() => {
    if (!dirty) return
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  useEffect(() => {
    const touch = () => {
      if (document.visibilityState !== 'visible') return
      try { void browserClient().rpc('cms_touch_member').then(() => {}) }
      catch { /* Missing configuration must not interrupt editing. */ }
    }
    touch()
    const timer = window.setInterval(touch, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  async function operation(fn: () => Promise<void>) {
    setBusy(true); setMessage('')
    try { await fn() } catch { notify('Operace se nezdařila. Zkuste to znovu nebo stránku obnovte.', 'error') }
    finally { setBusy(false) }
  }
  async function showTab(next: typeof tab) {
    if (dirty && !window.confirm('Opustit neuložené změny?')) return
    setTab(next)
    setMenuOpen(false)
    setMessage('')
    if (dirty) { setDirty(false); setData(current?.data || {}) }
    if (next === 'settings') {
      const settings = items.find(item => item.kind === 'settings')
      if (settings) { setSelected(settings.id); setData(settings.data); setDirty(false) }
    }
    if (next === 'content' && current?.kind !== 'page') {
      const page = items.find(item => item.kind === 'page')
      if (page) { setSelected(page.id); setData(page.data); setDirty(false) }
    }
  }
  async function save(publish: boolean) {
    if (!current || readOnly || busy) return
    if (publish && !publishingEnabled) { notify('Publikování na hlavní web bude dostupné po dokončení propojení obsahu.', 'error'); return }
    if (publish && !window.confirm('Zveřejnit tuto verzi na webu? Změny uvidí návštěvníci.')) return
    await operation(async () => {
      const client = browserClient()
      let revision = current.revision
      if (dirty) {
        const { data: next, error } = await client.rpc('cms_save_draft', { document_id: current.id, document_kind: current.kind, document_data: data, expected_revision: revision })
        if (error) { notify(error.code === '40001' ? 'Někdo mezitím upravil stejný obsah. Obnovte stránku a porovnejte změny.' : 'Obsah se nepodařilo uložit.', 'error'); return }
        revision = Number(next)
        setItems(previous => previous.map(item => item.id === current.id ? { ...item, data, revision } : item)); setDirty(false)
      }
      if (publish) {
        const { error } = await client.rpc('cms_publish', { document_id: current.id, expected_revision: revision })
        if (error) { notify('Zveřejnění se nezdařilo. Obnovte stránku a zkontrolujte aktuální verzi.', 'error'); return }
      }
      notify(publish ? 'Změny jsou zveřejněné na webu.' : 'Koncept je uložený. Veřejný web se zatím nezměnil.', 'success')
    })
  }
  async function upload(file: File, imagePath: string[]) {
    if (!current || readOnly) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { notify('Vyberte PNG, JPEG nebo WebP do 10 MB.', 'error'); return }
    await operation(async () => {
      const client = browserClient()
      const path = `${crypto.randomUUID()}.${({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[file.type]}`
      const { error } = await client.storage.from('site-media').upload(path, file, { upsert: false, contentType: file.type })
      if (error) throw error
      const { data: image } = client.storage.from('site-media').getPublicUrl(path)
      setData(value => replaceImage(value, imagePath, image.publicUrl) as ObjectValue)
      setDirty(true)
      notify('Nový obrázek je vybraný. Uložte nebo publikujte změny.')
    })
  }
  function selectDocument(item: Document) {
    if (busy || (dirty && !window.confirm('Opustit neuložené změny?'))) return
    setSelected(item.id); setData(item.data); setDirty(false); setMessage('')
  }
  const pages = items.filter(item => item.kind === 'page' && String(item.data.title || '').toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs')))
  const allPages = items.filter(item => item.kind === 'page')
  const title = ({ overview: 'Přehled', content: 'Obsah stránek', settings: 'Nastavení webu', inquiries: 'Poptávky', users: 'Administrace', activity: 'Aktivita', files: 'Soubory', analytics: 'Analytika' })[tab]
  const descriptions = { overview: 'Váš pracovní prostor pro správu webu.', content: 'Všechny stránky, jejich texty, obrázky a sekce.', settings: 'Kontakty, vzhled a společné prvky celého webu.', inquiries: 'Přehled poptávek a jejich zpracování.', users: 'Uživatelé, pozvánky a jejich oprávnění.', activity: 'Kdo, kdy a co na webu změnil.', files: 'Veřejné obrázky a dokumenty pro váš web.', analytics: 'Návštěvnost a výsledky vašeho webu.' }
  return <div className="admin-shell">
    <button className="admin-menu-toggle" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Zavřít menu' : 'Menu administrace'}</button>
    <aside id="admin-sidebar" className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
      <div className="admin-sidebar-scroll">
      <p className="admin-nav-label">PRACOVNÍ PROSTOR</p>
      <nav aria-label="Správa webu"><button disabled={busy} onClick={() => showTab('overview')} aria-pressed={tab === 'overview'}><AdminIcon name="home" /> Přehled</button>
      <button disabled={busy} onClick={() => showTab('content')} aria-pressed={tab === 'content'}><AdminIcon name="pages" /> Obsah stránek <span className="admin-nav-count">{allPages.length}</span></button>
      {!readOnly && <button disabled={busy} onClick={() => showTab('inquiries')} aria-pressed={tab === 'inquiries'}><AdminIcon name="inquiries" /> Poptávky</button>}
      <button disabled={busy} onClick={() => showTab('files')} aria-pressed={tab === 'files'}><AdminIcon name="files" /> Soubory</button>
      <button disabled={busy} onClick={() => showTab('analytics')} aria-pressed={tab === 'analytics'}><AdminIcon name="analytics" /> Analytika</button>
      <button disabled={busy} onClick={() => showTab('settings')} aria-pressed={tab === 'settings'}><AdminIcon name="settings" /> Nastavení webu</button></nav>
      {role === 'admin' && <nav aria-label="Správa přístupů a historie">
      <button disabled={busy} onClick={() => showTab('activity')} aria-pressed={tab === 'activity'}><AdminIcon name="activity" /> Aktivita</button>
      <button disabled={busy} onClick={() => showTab('users')} aria-pressed={tab === 'users'}><AdminIcon name="users" /> Administrace</button></nav>}
      <div className="admin-sidebar-note"><AdminIcon name="shield" /><strong>{readOnly ? 'Pouze prohlížení' : 'Změny máte pod kontrolou'}</strong><p>{readOnly ? 'Obsah si můžete prohlédnout. Úpravy a poptávky nejsou pro tento účet dostupné.' : 'Uložený koncept není veřejný. Na web se dostane až publikováním.'}</p></div>
      </div>
      <div className="admin-sidebar-account"><div className="admin-account"><span className="admin-account-avatar" aria-hidden="true">{email.slice(0, 1).toUpperCase() || 'U'}</span><div><strong>{email || 'Přihlášený uživatel'}</strong><span>{({ admin: 'Administrátor', editor: 'Uživatel', viewer: 'Pouze náhled' })[role]}</span></div></div><form action={signOut}><button><AdminIcon name="logout" /> Odhlásit se</button></form></div>
    </aside>
    <div className="admin-main">
      <div className="admin-view-heading"><div><p className="admin-kicker">AKRON / {tab === 'overview' ? 'PŘEHLED' : 'SPRÁVA WEBU'}</p><h2>{title}</h2><p>{descriptions[tab]}</p></div><span className="admin-badge">{readOnly ? 'Pouze náhled' : role === 'admin' ? 'Administrátor' : 'Uživatel'}</span></div>
      {(busy || message) && <p role={!busy && messageTone === 'error' ? 'alert' : 'status'} className={busy ? 'admin-status' : `admin-status admin-status-${messageTone}`}>{busy ? 'Pracuji…' : message}</p>}
      {tab === 'overview' && <section className="admin-overview-placeholder" aria-label="Úvodní přehled"><span className="admin-placeholder-icon"><AdminIcon name="home" /></span><h3>Vítejte ve svém pracovním prostoru</h3><p>Pro správu webu vyberte položku v menu vlevo.</p><small>Obsah tohoto přehledu doplníme později.</small></section>}
      {tab === 'files' && <AdminFiles documents={items} readOnly={readOnly} />}
      {tab === 'analytics' && <section className="admin-records admin-feature-placeholder"><span className="admin-placeholder-icon"><AdminIcon name="analytics" /></span><h3>Google Analytics připojíme později</h3><p>Sem doplníme návštěvnost, nejnavštěvovanější stránky a další skutečné výsledky webu.</p><span className="admin-badge">Zatím nepřipojeno</span></section>}
      {tab === 'content' && <section className="admin-page-picker" aria-label="Výběr stránky">
        <div className="admin-section-heading"><h3>Vyberte stránku k úpravě</h3><label>Vyhledat stránku<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Název stránky…" /></label></div>
        <div className="admin-page-cards">{pages.map(item => <button disabled={busy} key={item.id} aria-pressed={selected === item.id} onClick={() => selectDocument(item)}><strong>{String(item.data.title || item.id)}</strong><span>{typeof item.data.slug === 'object' && item.data.slug && !Array.isArray(item.data.slug) ? '/' + (item.data.slug.current === 'home' ? '' : item.data.slug.current || '') : 'Stránka'}</span></button>)}</div>
        {!pages.length && <p className="admin-muted">Žádná odpovídající stránka.</p>}
      </section>}
      {(tab === 'content' || tab === 'settings') && <section className="admin-editor">
        {!current ? <p>Obsah zatím není importovaný. Kontaktujte správce.</p> : <>
        <div className="admin-editor-heading"><div><p className="admin-kicker">{tab === 'content' ? 'EDITOR STRÁNKY' : 'SPOLEČNÁ NASTAVENÍ'}</p><h3>{String(data.title || 'Nastavení webu')}</h3><p>{readOnly ? 'Tento účet může obsah prohlížet, ale nemůže ho měnit.' : 'Kliknutím rozbalte sekci, kterou chcete upravit.'}</p></div><span className={`admin-badge${dirty ? ' is-dirty' : ''}`}>{dirty ? 'Neuložené změny' : 'Uložený koncept'} · {current.revision}</span></div>
        <Fields key={current.id} value={data} documentBody={['page-cookies', 'page-ochrana-osobnich-udaju'].includes(current.id) || (data.slug && typeof data.slug === 'object' && !Array.isArray(data.slug) ? ['cookies', 'ochrana-osobnich-udaju'].includes(String(data.slug.current)) : false)} disabled={readOnly || busy} onUpload={upload} onChange={next => { setData(next); setDirty(true) }} />
        {!readOnly && !publishingEnabled && <p className="admin-status">Koncept můžete upravit a uložit. Publikování na hlavní web čeká na dokončení propojení obsahu.</p>}
        {!readOnly && <div className="admin-save"><span><strong>{dirty ? 'Neuložené změny' : 'Koncept je uložený'}</strong><small>Veřejný web změní až publikování.</small></span><button disabled={busy || !dirty} onClick={() => save(false)}>Uložit koncept</button><button className="admin-primary" disabled={busy || !publishingEnabled} onClick={() => save(true)}>Publikovat na web</button></div>}
        </>}
      </section>}
      {((tab === 'inquiries' && !readOnly) || ((tab === 'users' || tab === 'activity') && role === 'admin')) && <AdminRecords key={tab} view={tab as 'inquiries' | 'users' | 'activity'} userId={userId} />}
    </div>
  </div>
}
