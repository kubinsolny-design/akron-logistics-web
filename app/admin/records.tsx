'use client'

import { useEffect, useState } from 'react'
import { browserClient } from '../../supabase/browser'
import { inviteMember } from './actions'

type Row = Record<string, unknown>
type View = 'users' | 'inquiries' | 'activity'
const roleLabels: Record<string, string> = { admin: 'Admin', editor: 'Uživatel', viewer: 'Pouze náhled' }
const statusLabels: Record<string, string> = { new: 'Nová', processing: 'V řešení', done: 'Vyřízená' }
const auditLabels: Record<string, string> = { draft: 'Uložení rozpracované verze', publish: 'Publikování na web', member: 'Změna přístupu', inquiry: 'Úprava poptávky', media: 'Nahrání obrázku', inquiry_settings: 'Změna kontaktního e-mailu / doručování' }
function timestamp(value: unknown) { return value ? new Date(String(value)).toLocaleString('cs-CZ') : 'Zatím nezaznamenáno' }
function text(value: unknown) { return typeof value === 'string' ? value : '' }

function Changes({ before, after, prefix = '' }: { before: unknown; after: unknown; prefix?: string }) {
  if (JSON.stringify(before) === JSON.stringify(after)) return null
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const a = before as Row, b = after as Row
    return <>{[...new Set([...Object.keys(a), ...Object.keys(b)])].filter(key => !key.startsWith('_')).map(key => <Changes key={key} prefix={prefix ? `${prefix} / ${key}` : key} before={a[key]} after={b[key]} />)}</>
  }
  const format = (value: unknown) => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  return <div className="admin-change"><strong>{prefix || 'Záznam'}</strong><del>{format(before)}</del><ins>{format(after)}</ins></div>
}

export function AdminRecords({ view, userId }: { view: View; userId: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(false)
  const [reload, setReload] = useState(0)
  const [invitation, setInvitation] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true); setError('')
      try {
        const client = browserClient()
        let result
        if (view === 'users') result = await client.rpc('cms_list_members')
        else {
          let request = client.from(view === 'activity' ? 'cms_activity' : 'cms_inquiries')
            .select(view === 'activity' ? 'id,created_at,actor_email,action,entity_id,before_data,after_data' : 'id,created_at,loading_place,unloading_place,requested_date,frequency,cargo,contact_name,email,phone,status,notes,email_status')
            .order('created_at', { ascending: false }).order('id', { ascending: false })
          if (view === 'inquiries' && filter !== 'all') request = request.eq('status', filter)
          result = await request.range(page * 25, page * 25 + 25)
        }
        if (result.error) throw result.error
        if (!cancelled) { setRows((result.data || []).slice(0, view === 'users' ? undefined : 25)); setMore(view !== 'users' && (result.data || []).length > 25) }
      } catch { if (!cancelled) setError('Záznamy se nepodařilo načíst. Ověřte připojení a dokončení databázové migrace.') }
      finally { if (!cancelled) setBusy(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [view, page, filter, reload])

  async function update(fn: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('')
    try { await fn(); setReload(value => value + 1) }
    catch { setError('Změnu se nepodařilo uložit. Zkontrolujte přístup a zkuste to znovu.') }
    finally { setBusy(false) }
  }
  const visible = rows.filter(row => Object.values(row).some(value => typeof value === 'string' && value.toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs'))))
  return <section className="admin-records">
    <div className="admin-record-toolbar"><label>Vyhledat v načtených záznamech<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="E-mail, trasa nebo záznam…" /></label>
      {view === 'inquiries' && <label>Stav<select value={filter} onChange={event => { setFilter(event.target.value); setPage(0) }}><option value="all">Všechny poptávky</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
      <button disabled={busy} onClick={() => setReload(value => value + 1)}>Obnovit</button>
    </div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p role="status" className="admin-status">{notice}</p>}
    {busy && <p role="status">Načítám…</p>}
    {!busy && !error && !visible.length && <div className="admin-empty"><h3>Zatím žádné záznamy</h3><p>{query ? 'Zkuste změnit hledaný výraz.' : view === 'inquiries' ? 'Nové poptávky se zde objeví po odeslání formuláře na webu.' : 'Záznamy se zobrazí po první aktivitě.'}</p></div>}
    {view === 'users' && <>
      <div className="admin-member-grid">{visible.map(row => <article className="admin-member" key={text(row.user_id)}><span className="admin-avatar">{text(row.email).slice(0, 1).toUpperCase() || 'U'}</span><div><h3>{text(row.email) || 'Uživatel'} {row.user_id === userId && <small>(vy)</small>}</h3><p>Poslední aktivita: {timestamp(row.last_seen_at)}</p><p>Poslední přihlášení: {timestamp(row.last_sign_in_at)}</p></div><label>Oprávnění<select value={text(row.role)} disabled={busy || row.user_id === userId} onChange={event => {
        const newRole = event.target.value
        if (!window.confirm(`Změnit přístup uživatele ${text(row.email)} na ${roleLabels[newRole]}?`)) return
        void update(async () => { const result = await browserClient().rpc('cms_set_member_role', { target_user: row.user_id, new_role: newRole }); if (result.error) throw result.error; setNotice('Oprávnění bylo změněno.') })
      }}>{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></article>)}</div>
      <details className="admin-invite"><summary>Pozvat dalšího uživatele</summary><p>Admin spravuje přístupy a historii. Uživatel upravuje obsah a vyřizuje poptávky. Pouze náhled neumožňuje úpravy ani čtení poptávek.</p><form action={async form => update(async () => {
        setInvitation(''); const result = await inviteMember(form); if (!result.ok) throw new Error(result.message); setNotice(result.message); setInvitation(result.invitationLink || '')
      })}><label>E-mail<input type="email" name="email" required maxLength={254} /></label><label>Oprávnění<select name="role" defaultValue="viewer">{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Předání pozvánky<select name="delivery" defaultValue="link"><option value="link">Osobní odkaz pro předání</option><option value="email">Odeslat e-mailem</option></select></label><button disabled={busy}>Vytvořit pozvánku</button></form>{invitation && <label>Soukromý pozvánkový odkaz<textarea value={invitation} readOnly rows={4} onFocus={event => event.target.select()} /></label>}</details>
    </>}
    {view === 'inquiries' && visible.map(row => <details className="admin-record" key={text(row.id)}><summary><div><strong>{text(row.loading_place)} → {text(row.unloading_place)}</strong><span>{text(row.contact_name)} · {timestamp(row.created_at)}</span></div><span className={`admin-badge status-${text(row.status)}`}>{statusLabels[text(row.status)] || text(row.status)}</span></summary><div className="admin-record-body"><dl><dt>Termín</dt><dd>{text(row.requested_date)}</dd><dt>Četnost</dt><dd>{({ once: 'Jednorázově', regular: 'Pravidelně', unknown: 'K upřesnění' })[text(row.frequency)] || text(row.frequency)}</dd><dt>Náklad</dt><dd>{text(row.cargo)}</dd><dt>E-mail</dt><dd>{text(row.email) ? <a href={`mailto:${text(row.email)}`}>{text(row.email)}</a> : "Neuveden"}</dd><dt>Telefon</dt><dd>{text(row.phone) || 'Neuveden'}</dd><dt>Doručení e-mailu</dt><dd>{({ pending: 'Čeká na odeslání', sent: 'Přijato e-mailovou službou', failed: 'Odeslání selhalo — poptávka je bezpečně uložená' })[text(row.email_status)] || text(row.email_status)}</dd></dl><form key={`${row.id}-${reload}`} action={async form => update(async () => {
        const result = await browserClient().rpc('cms_update_inquiry', { inquiry_id: row.id, new_status: form.get('status'), new_notes: form.get('notes') }); if (result.error) throw result.error; setNotice('Poptávka byla aktualizována.')
      })}><label>Stav zpracování<select name="status" defaultValue={text(row.status)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Interní poznámky<textarea name="notes" defaultValue={text(row.notes)} maxLength={10000} rows={3} /></label><button disabled={busy}>Uložit stav a poznámky</button></form></div></details>)}
    {view === 'activity' && visible.map(row => <details className="admin-record" key={String(row.id)}><summary><div><strong>{auditLabels[text(row.action)] || text(row.action)}</strong><span>{text(row.actor_email) || 'Systém'} · {timestamp(row.created_at)}</span></div><span className="admin-badge">{text(row.entity_id)}</span></summary><div className="admin-record-body"><h3>Co se změnilo</h3><Changes before={row.before_data} after={row.after_data} /></div></details>)}
    {view !== 'users' && <div className="admin-pagination"><button disabled={busy || page === 0} onClick={() => setPage(page - 1)}>Předchozí</button><span>Strana {page + 1} · 25 záznamů</span><button disabled={busy || !more} onClick={() => setPage(page + 1)}>Další</button></div>}
  </section>
}
