'use client'

import { useState } from 'react'
import { browserClient } from '../../supabase/browser'
import type { MemberRole } from '../../supabase/server'
import { inviteMember } from './actions'

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
  vehicle: ['large', 'medium', 'small'], theme: ['light', 'dark'], cardStyle: ['rail', 'list'],
  font: ['orbitron', 'poppins'],
}
const ignored = new Set(['asset', 'phoneHref', 'markDefs', 'marks'])

function blankItem(field: string): Value {
  const key = crypto.randomUUID()
  if (field === 'sections') return { _key: key, editorLabel: 'Nová sekce', layout: 'text', visible: true, heading: '', description: '', actions: [], cards: [], questions: [], image: { url: '', alt: '' } }
  if (field === 'cards') return { _key: key, title: '', description: '', vehicle: 'medium', action: { label: '', href: '' } }
  if (field === 'questions') return { _key: key, question: '', answer: '' }
  if (field === 'body') return { _key: key, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: crypto.randomUUID(), _type: 'span', text: '', marks: [] }] }
  if (field === 'children') return { _key: key, _type: 'span', text: '', marks: [] }
  return { _key: key, label: '', href: '' }
}

function Fields({ value, onChange, disabled, path = [], onUpload }: { value: ObjectValue; onChange: (value: ObjectValue) => void; disabled: boolean; path?: string[]; onUpload?: (file: File, path: string[]) => Promise<void> }) {
  return <div className="admin-fields">{Object.entries(value).filter(([name]) => !name.startsWith('_') && !ignored.has(name)).map(([name, item]) => {
    const label = labels[name] || name
    const change = (updated: Value) => onChange({ ...value, [name]: updated })
    if (['image', 'portrait', 'logo', 'lightLogo', 'shareImage'].includes(name)) {
      const image = item && typeof item === 'object' && !Array.isArray(item) ? item : {}
      return <fieldset key={name}><legend>{label}</legend>
        <Fields value={{ url: '', alt: '', ...image }} onChange={change} disabled={disabled} path={[...path, name]} onUpload={onUpload} />
        {!disabled && onUpload && <label>Nahrát a použít nový obrázek<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
          const file = event.target.files?.[0]; if (file) void onUpload(file, [...path, name]); event.target.value = ''
        }} /></label>}
      </fieldset>
    }
    if (Array.isArray(item)) return <fieldset key={name}><legend>{label}</legend>{item.map((entry, index) => <div className="admin-item" key={typeof entry === 'object' && entry && !Array.isArray(entry) ? String(entry._key || index) : index}>
      <div className="admin-item-tools"><span>{label} {index + 1}</span>{!disabled && <>
        <button type="button" disabled={index === 0} aria-label={`Posunout ${label} ${index + 1} nahoru`} onClick={() => { const items = [...item]; [items[index - 1], items[index]] = [items[index], items[index - 1]]; change(items) }}>↑</button>
        <button type="button" disabled={index === item.length - 1} aria-label={`Posunout ${label} ${index + 1} dolů`} onClick={() => { const items = [...item]; [items[index + 1], items[index]] = [items[index], items[index + 1]]; change(items) }}>↓</button>
        <button type="button" onClick={() => { if (window.confirm('Odebrat tuto položku z rozpracované verze?')) change(item.filter((_, i) => i !== index)) }}>Odebrat</button>
      </>}</div>
      {entry && typeof entry === 'object' && !Array.isArray(entry)
        ? <Fields value={entry} disabled={disabled} path={[...path, name, String(index)]} onUpload={onUpload} onChange={(updated) => change(item.map((it, i) => i === index ? updated : it))} />
        : <input aria-label={`${label} ${index + 1}`} value={String(entry || '')} disabled={disabled} onChange={(event) => change(item.map((it, i) => i === index ? event.target.value : it))} />}
    </div>)}{!disabled && <button type="button" onClick={() => change([...item, blankItem(name)])}>Přidat položku</button>}</fieldset>
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

export function AdminPanel({ documents, role, userId }: { documents: Document[]; role: MemberRole; userId: string }) {
  const [items, setItems] = useState(documents)
  const [selected, setSelected] = useState(documents[0]?.id || '')
  const [data, setData] = useState<ObjectValue>(documents[0]?.data || {})
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<'content' | 'users' | 'inquiries'>('content')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [invitationLink, setInvitationLink] = useState('')
  const [members, setMembers] = useState<{ user_id: string; role: MemberRole }[]>([])
  const [inquiries, setInquiries] = useState<ObjectValue[]>([])
  const current = items.find(item => item.id === selected)
  const readOnly = role === 'viewer'

  async function operation(fn: () => Promise<void>) {
    setBusy(true); setMessage('')
    try { await fn() } catch { setMessage('Operace se nezdařila. Zkuste to znovu nebo stránku obnovte.') }
    finally { setBusy(false) }
  }
  async function showTab(next: typeof tab) {
    if (dirty && !window.confirm('Opustit neuložené změny?')) return
    setTab(next)
    if (next === 'users') await operation(async () => {
      const { data, error } = await browserClient().from('cms_members').select('user_id,role')
      if (error) throw error
      setMembers(data || [])
    })
    if (next === 'inquiries') await operation(async () => {
      const { data, error } = await browserClient().from('cms_inquiries').select('id,created_at,loading_place,unloading_place,requested_date,cargo,contact_name,email,phone,status,notes,email_status').order('created_at', { ascending: false }).limit(100)
      if (error) throw error
      setInquiries(data || [])
    })
  }
  async function save(publish: boolean) {
    if (!current || readOnly || busy) return
    await operation(async () => {
      const client = browserClient()
      let revision = current.revision
      if (dirty) {
        const { data: next, error } = await client.rpc('cms_save_draft', { document_id: current.id, document_kind: current.kind, document_data: data, expected_revision: revision })
        if (error) { setMessage(error.code === '40001' ? 'Někdo mezitím upravil stejný obsah. Obnovte stránku a porovnejte změny.' : 'Obsah se nepodařilo uložit.'); return }
        revision = Number(next)
        setItems(items.map(item => item.id === current.id ? { ...item, data, revision } : item)); setDirty(false)
      }
      if (publish) {
        const { error } = await client.rpc('cms_publish', { document_id: current.id, expected_revision: revision })
        if (error) { setMessage('Zveřejnění se nezdařilo. Obnovte stránku a zkontrolujte aktuální verzi.'); return }
      }
      setMessage(publish ? 'Verze je publikovaná v Supabase.' : 'Rozpracovaná verze je uložená.')
    })
  }
  async function upload(file: File, imagePath: string[]) {
    if (!current || readOnly) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setMessage('Vyberte PNG, JPEG nebo WebP do 10 MB.'); return }
    await operation(async () => {
      const client = browserClient()
      const path = `${crypto.randomUUID()}.${({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[file.type]}`
      const { error } = await client.storage.from('site-media').upload(path, file, { upsert: false, contentType: file.type })
      if (error) throw error
      const { data: image } = client.storage.from('site-media').getPublicUrl(path)
      setData(value => replaceImage(value, imagePath, image.publicUrl) as ObjectValue)
      setDirty(true)
      setMessage('Nový obrázek je vybraný. Uložte nebo publikujte změny.')
    })
  }
  return <><nav className="admin-tabs"><button onClick={() => showTab('content')} aria-pressed={tab === 'content'}>Obsah webu</button>
    {!readOnly && <button onClick={() => showTab('inquiries')} aria-pressed={tab === 'inquiries'}>Poptávky</button>}
    {role === 'admin' && <button onClick={() => showTab('users')} aria-pressed={tab === 'users'}>Uživatelé a přístupy</button>}</nav>
    <p role="status" className="admin-status">{busy ? 'Pracuji…' : message}</p>
    {tab === 'content' && <div className="admin-workspace"><aside>{items.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => {
      if (dirty && !window.confirm('Opustit neuložené změny?')) return
      setSelected(item.id); setData(item.data); setDirty(false); setMessage('')
    }}>{String(item.data.title || (item.kind === 'settings' ? 'Nastavení webu' : item.id))}</button>)}</aside><section>
      {!current ? <p>Obsah zatím není importovaný. Nejdříve musí správce převést stránky z původní administrace.</p>
        : <><h2>{String(data.title || (current.kind === 'settings' ? 'Nastavení webu' : current.id))}</h2>
          <p>{readOnly ? 'Máte přístup pouze pro čtení.' : 'Uložení nemění publikovanou verzi. Změny zveřejníte tlačítkem Publikovat.'}</p>
          <Fields value={data} disabled={readOnly || busy} onUpload={upload} onChange={(next) => { setData(next); setDirty(true) }} />
          {!readOnly && <div className="admin-save"><button disabled={busy || !dirty} onClick={() => save(false)}>Uložit rozpracované</button><button disabled={busy} onClick={() => save(true)}>Publikovat</button>
          </div>}</>}
    </section></div>}
    {tab === 'users' && role === 'admin' && <section><h2>Pozvat uživatele</h2><p>Pozvánka přijde e-mailem. Příjemce si nastaví vlastní heslo; nezíská přístup do technického nastavení Supabase.</p>
      <form action={async form => operation(async () => { setInvitationLink(''); const result = await inviteMember(form); setMessage(result.message); setInvitationLink(result.invitationLink || '') })}>
        <label>E-mail<input name="email" type="email" required maxLength={254} /></label><label>Přístup<select name="role" defaultValue="viewer"><option value="viewer">Pouze náhled</option><option value="editor">Uživatel – obsah a poptávky</option><option value="admin">Admin – včetně správy přístupů</option></select></label>
        <label>Předání pozvánky<select name="delivery" defaultValue="link"><option value="link">Vytvořit osobní odkaz pro předání</option><option value="email">Odeslat e-mailem (vyžaduje nastavené odesílání)</option></select></label><button disabled={busy}>Vytvořit pozvánku</button>
      </form>{invitationLink && <label>Osobní pozvánkový odkaz — neposílejte jej nikomu jinému<textarea readOnly value={invitationLink} rows={4} onFocus={event => event.target.select()} /></label>}
      <h2>Současné přístupy</h2>{members.map(member => <label key={member.user_id}>{member.user_id === userId ? 'Vy' : member.user_id}<select value={member.role} disabled={busy || member.user_id === userId} onChange={event => operation(async () => {
        const { error } = await browserClient().rpc('cms_set_member_role', { target_user: member.user_id, new_role: event.target.value })
        if (error) throw error
        setMembers(members.map(item => item.user_id === member.user_id ? { ...item, role: event.target.value as MemberRole } : item)); setMessage('Přístup je změněný.')
      })}><option value="viewer">Pouze náhled</option><option value="editor">Uživatel</option><option value="admin">Admin</option></select></label>)}</section>}
    {tab === 'inquiries' && !readOnly && <section><h2>Poptávky</h2>{inquiries.length === 0 && <p>Zatím žádné poptávky.</p>}{inquiries.map(inquiry => <article className="admin-item" key={String(inquiry.id)}>
      <h3>{String(inquiry.loading_place)} → {String(inquiry.unloading_place)}</h3><p>{String(inquiry.requested_date)} · {String(inquiry.cargo)}</p>
      <p>{String(inquiry.contact_name)} · {String(inquiry.email)} · {String(inquiry.phone)}</p><p>Stav: {String(inquiry.status)} · E-mail: {String(inquiry.email_status)}</p>
    </article>)}</section>}
  </>
}
