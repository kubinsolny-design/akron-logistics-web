'use client'

import { useEffect, useState } from 'react'
import { loadOverview, type Overview } from './overview-actions'
import { AdminIcon } from './icons'

export function OverviewPanel({ role, pages, onNavigate }: { role: string; pages: number; onNavigate: (tab: 'content' | 'inquiries' | 'analytics' | 'settings') => void }) {
  const [result, setResult] = useState<Overview | null>(null)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    if (role === 'viewer') return
    let active = true
    const refresh = () => {
      if (document.visibilityState === 'hidden') return
      loadOverview().then(value => { if (active) setResult(value) }).catch(() => { if (active) setResult({ status: 'error', message: 'Přehled se nepodařilo načíst.' }) })
    }
    refresh()
    const timer = window.setInterval(refresh, 60000)
    return () => { active = false; window.clearInterval(timer) }
  }, [role, reload])
  const data = result?.status === 'ready' ? result : null
  return <section className="admin-overview" aria-label="Úvodní přehled">
    <div className="admin-overview-welcome"><div><p className="admin-kicker">VŠE DŮLEŽITÉ NA JEDNOM MÍSTĚ</p><h3>Co dnes potřebuje vaši pozornost?</h3><p>{role === 'viewer' ? 'Prohlédněte si obsah a společné nastavení webu.' : 'Poptávky jsou uložené přímo zde. Návštěvnost najdete samostatně v analytice.'}</p></div><button type="button" onClick={() => setReload(value => value + 1)} disabled={role === 'viewer'}>Obnovit přehled</button></div>
    {role !== 'viewer' && !result && <p role="status">Načítám aktuální přehled…</p>}
    {result?.status === 'error' && <p className="admin-error" role="alert">{result.message}</p>}
    {data && <>
      {(data.failed > 0 || data.stalled > 0) && <div className="admin-overview-alert" role="alert"><strong>Upozornění na e-mailové doručování</strong><p>{data.failed} neodeslaných upozornění, {data.stalled} dlouho čekajících. Poptávky jsou bezpečně uložené. Zkontrolujte je v seznamu; přijetí Resendem není potvrzení doručení.</p><button type="button" onClick={() => onNavigate('inquiries')}>Zkontrolovat poptávky</button></div>}
      <div className="admin-overview-metrics">{[
        ['Nové poptávky', data.fresh, 'Čekají na první reakci'], ['V řešení', data.processing, 'Rozpracované přepravy'], ['Poptávky za 30 dní', data.month, 'Bez položek v koši'], ['E-mail vyžaduje kontrolu', data.failed + data.stalled, 'Upozornění nejsou potvrzena'],
      ].map(([label, count, hint]) => <button type="button" key={label} onClick={() => onNavigate('inquiries')}><span>{label}</span><strong>{count}</strong><small>{hint}</small></button>)}</div>
      <div className="admin-records"><div className="admin-section-heading"><h3>Poslední poptávky</h3><button type="button" onClick={() => onNavigate('inquiries')}>Všechny poptávky</button></div>{data.recent.length ? <div className="admin-table-wrap"><table><thead><tr><th>Přeprava</th><th>Přijato</th><th>Stav</th></tr></thead><tbody>{data.recent.map(row => <tr key={row.id}><td><strong>{row.route}</strong><small className="admin-recent-name">{row.name}</small></td><td>{new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Prague' }).format(new Date(row.createdAt))}</td><td><span className={`admin-badge status-${row.status}`}>{({ new: 'Nová', processing: 'V řešení', done: 'Vyřízená' })[row.status] || row.status}</span></td></tr>)}</tbody></table></div> : <p className="admin-muted">Zatím nepřišla žádná poptávka. Jakmile někdo odešle formulář, objeví se zde.</p>}</div>
    </>}
    <div className="admin-overview-shortcuts"><button type="button" onClick={() => onNavigate('content')}><AdminIcon name="pages" /><strong>Upravit obsah</strong><span>{pages} stránek · texty a fotografie</span></button>{role === 'admin' && <button type="button" onClick={() => onNavigate('analytics')}><AdminIcon name="analytics" /><strong>Výsledky webu</strong><span>Návštěvnost, zdroje a poptávky v GA4</span></button>}<button type="button" onClick={() => onNavigate('settings')}><AdminIcon name="settings" /><strong>Nastavení webu</strong><span>Kontakty, loga a společné prvky</span></button></div>
    {role !== 'viewer' && <p className="admin-muted">Přehled poptávek se při otevřené kartě obnovuje každou minutu. Počty zahrnují i označené technické testy, dokud je nepřesunete do koše.</p>}
  </section>
}
