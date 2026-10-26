'use client'

import { useEffect, useState, useTransition } from 'react'
import { loadAnalytics } from './analytics-actions'
import { analyticsDay } from './analytics-calendar'
import type { AnalyticsRange, AnalyticsResult } from './analytics-types'

const format = new Intl.NumberFormat('cs-CZ')
const pageNames: Record<string, string> = { '/': 'Úvod', '/preprava': 'Přepravy', '/moznosti': 'Vozidla a možnosti', '/kontakt': 'Kontakt', '/cookies': 'Cookies', '/ochrana-osobnich-udaju': 'Ochrana osobních údajů' }
const channels: Record<string, string> = { 'Direct': 'Přímá návštěva', 'Organic Search': 'Vyhledávače', 'Organic Social': 'Sociální sítě', 'Referral': 'Odkazy z jiných webů', 'Paid Search': 'Placené vyhledávání', 'Email': 'E-mail', 'Unassigned': 'Nezařazeno' }
const shortDate = (date: string) => new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))

export function AnalyticsPanel({ administrator }: { administrator: boolean }) {
  const [range, setRange] = useState<AnalyticsRange>(28)
  const [result, setResult] = useState<AnalyticsResult | null>(null)
  const [day, setDay] = useState(() => analyticsDay())
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    if (!administrator) return
    let active = true
    loadAnalytics(range).then(value => { if (active) setResult(value) }).catch(() => { if (active) setResult({ status: 'error', message: 'Načtení se nezdařilo. Zkuste to znovu.' }) })
    return () => { active = false }
  }, [administrator, range, day])
  useEffect(() => {
    if (!administrator) return
    // Clock checks are local; no API polling. A new Czech day triggers one load.
    const checkDay = () => {
      if (document.visibilityState === 'hidden') return
      const next = analyticsDay()
      if (next !== day) { setResult(null); setDay(next) }
    }
    const timer = window.setInterval(checkDay, 60000)
    document.addEventListener('visibilitychange', checkDay)
    window.addEventListener('focus', checkDay)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', checkDay); window.removeEventListener('focus', checkDay) }
  }, [administrator, day])
  const report = result?.status === 'ready' ? result.report : null
  const loading = pending || (administrator && (!result || (report && report.range !== range)))
  const maxViews = Math.max(1, ...(report?.days.map(day => day.views) || []))
  return <section className="admin-analytics" aria-labelledby="analytics-heading" aria-busy={!!loading}>
    <div className="admin-section-heading"><div><h3 id="analytics-heading">Návštěvnost webu</h3><p>Souhrn Google Analytics 4. Pouze ostrý web a návštěvníci, kteří souhlasili s analytikou.</p></div>
      {administrator && <label>Období<select value={range} disabled={pending} onChange={event => { setResult(null); setRange(Number(event.target.value) as AnalyticsRange) }}><option value={7}>Posledních 7 dní</option><option value={28}>Posledních 28 dní</option><option value={90}>Posledních 90 dní</option></select></label>}
    </div>
    {!administrator ? <p className="admin-status">Analytiku může zobrazit pouze administrátor.</p> : <>
      {loading && <p role="status">Načítám statistiky…</p>}
      {!loading && result && result.status !== 'ready' && <div className={result.status === 'error' ? 'admin-error' : 'admin-status'} role={result.status === 'error' ? 'alert' : 'status'}><p>{result.message}</p><button type="button" onClick={() => startTransition(async () => { try { setResult(await loadAnalytics(range)) } catch { setResult({ status: 'error', message: 'Načtení se nezdařilo. Zkuste to znovu.' }) } })}>Zkusit znovu</button></div>}
      {!loading && report && <>
        <p className="admin-muted">{shortDate(report.startDate)} – {shortDate(report.endDate)} {report.endDate.slice(0, 4)} · do včerejška · {report.timeZone}</p>
        <div className="admin-analytics-metrics">{[
          ['Aktivní uživatelé', format.format(report.users)], ['Návštěvy', format.format(report.sessions)], ['Zobrazení stránek', format.format(report.views)], ['Míra zapojení', `${format.format(Math.round(report.engagementRate * 1000) / 10)} %`],
        ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
        {report.views === 0 && <p className="admin-status">Za vybrané období zatím nejsou naměřená zobrazení. Nová data se v GA4 mohou objevit se zpožděním 24–48 hodin.</p>}
        <div className="admin-records"><h4>Zobrazení stránek v čase</h4><div className="admin-analytics-chart" role="img" aria-label={`Denní zobrazení stránek za posledních ${range} dní. Celkem ${format.format(report.views)}.`}>{report.days.map(day => <div key={day.date} title={`${shortDate(day.date)}: ${format.format(day.views)}`} style={{ height: `${day.views / maxViews * 100}%` }} />)}</div><div className="admin-analytics-axis"><span>{shortDate(report.startDate)}</span><span>{shortDate(report.endDate)}</span></div>
          <details><summary>Denní hodnoty v tabulce</summary><div className="admin-table-wrap"><table><thead><tr><th>Datum</th><th>Zobrazení</th></tr></thead><tbody>{report.days.map(day => <tr key={day.date}><td>{shortDate(day.date)}</td><td>{format.format(day.views)}</td></tr>)}</tbody></table></div></details>
        </div>
        <div className="admin-analytics-tables">{[{ title: 'Nejnavštěvovanější stránky', rows: report.pages, names: pageNames, unit: 'Zobrazení' }, { title: 'Odkud přicházejí návštěvníci', rows: report.sources, names: channels, unit: 'Návštěvy' }].map(group => <div className="admin-records" key={group.title}><h4>{group.title}</h4>{group.rows.length ? <div className="admin-table-wrap"><table><thead><tr><th>{group.title === 'Nejnavštěvovanější stránky' ? 'Stránka' : 'Kanál'}</th><th>{group.unit}</th></tr></thead><tbody>{group.rows.map(row => <tr key={row.label}><td>{group.names[row.label] || row.label}</td><td>{format.format(row.count)}</td></tr>)}</tbody></table></div> : <p>Zatím bez dat.</p>}</div>)}</div>
        {report.thresholded && <p className="admin-status">Google část dat kvůli ochraně soukromí nezobrazuje. Nízké počty proto mohou být neúplné.</p>}
        <p className="admin-muted">Načteno {new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Prague' }).format(new Date(report.fetchedAt))}. Aktualizace 1× denně při prvním otevření přehledu, podle času v Česku. Nezahrnuje administraci ani testovací domény. Google může data zpřesňovat 24–48 hodin.</p>
      </>}
      <a className="admin-open-site" href="https://analytics.google.com/analytics/web/#/p559040702/reports/" target="_blank" rel="noopener noreferrer">Otevřít podrobné Google Analytics</a>
    </>}
  </section>
}
