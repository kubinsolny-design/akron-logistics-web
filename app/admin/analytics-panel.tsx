'use client'

import { useEffect, useState, useTransition } from 'react'
import { loadAnalytics } from './analytics-actions'
import { analyticsDay, analyticsPeriod } from './analytics-calendar'
import type { AnalyticsPreset, AnalyticsRange, AnalyticsResult } from './analytics-types'

const format = new Intl.NumberFormat('cs-CZ')
const pageNames: Record<string, string> = { '/': 'Úvod', '/preprava': 'Přepravy', '/moznosti': 'Vozidla a možnosti', '/kontakt': 'Kontakt', '/cookies': 'Cookies', '/ochrana-osobnich-udaju': 'Ochrana osobních údajů' }
const channels: Record<string, string> = { 'Direct': 'Přímá návštěva', 'Organic Search': 'Vyhledávače', 'Organic Social': 'Sociální sítě', 'Referral': 'Odkazy z jiných webů', 'Paid Search': 'Placené vyhledávání', 'Email': 'E-mail', 'Unassigned': 'Nezařazeno' }
const shortDate = (date: string) => new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
const fullDate = (date: string) => new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
const presets: { value: AnalyticsPreset; label: string }[] = [
  { value: 'yesterday', label: 'Včera' }, { value: 7, label: 'Posledních 7 dní' }, { value: 30, label: 'Posledních 30 dní' }, { value: 90, label: 'Posledních 90 dní' },
  { value: 'month', label: 'Tento měsíc' }, { value: 'lastMonth', label: 'Minulý měsíc' }, { value: 'year', label: 'Tento rok' }, { value: 'lastYear', label: 'Minulý rok' },
]

export function AnalyticsPanel({ administrator }: { administrator: boolean }) {
  const [range, setRange] = useState<AnalyticsRange>(30)
  const [selection, setSelection] = useState('30')
  const [result, setResult] = useState<AnalyticsResult | null>(null)
  const [day, setDay] = useState(() => analyticsDay())
  const [dates, setDates] = useState(() => analyticsPeriod(30, analyticsDay())!)
  const [dateError, setDateError] = useState('')
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
  const loading = pending || (administrator && !result)
  const maxViews = Math.max(1, ...(report?.days.map(day => day.views) || []))
  return <section className="admin-analytics" aria-labelledby="analytics-heading" aria-busy={!!loading}>
    <div className="admin-section-heading"><div><h3 id="analytics-heading">Návštěvnost webu</h3><p>Souhrn Google Analytics 4. Pouze ostrý web a návštěvníci, kteří souhlasili s analytikou.</p></div>
      {administrator && <label>Období<select value={selection} disabled={pending} onChange={event => {
        const value = event.target.value
        setSelection(value); setDateError('')
        if (value !== 'custom') {
          const preset = presets.find(preset => String(preset.value) === value)
          if (preset && preset.value !== range) { setResult(null); setRange(preset.value) }
        }
      }}>{presets.map(preset => <option key={preset.value} value={preset.value} disabled={!analyticsPeriod(preset.value, day)}>{preset.label}</option>)}<option value="custom">Vlastní období</option></select></label>}
    </div>
    {!administrator ? <p className="admin-status">Analytiku může zobrazit pouze administrátor.</p> : <>
      {selection === 'custom' && <form className="admin-analytics-period" onSubmit={event => {
        event.preventDefault()
        // Read the visible form values as well: native autofill/date pickers may
        // commit a value without a React change event before submission.
        const form = new FormData(event.currentTarget)
        const requested = { startDate: String(form.get('startDate') || ''), endDate: String(form.get('endDate') || '') }
        setDates(requested)
        if (!analyticsPeriod(requested, day)) { setDateError('Zvolte platné datum od–do, nejvýše 366 dní a nejpozději do včerejška.'); return }
        setDateError(''); setResult(null); setRange(requested)
      }}>
        <label>Od<input name="startDate" type="date" required min="2005-01-01" max={analyticsPeriod('yesterday', day)!.endDate} value={dates.startDate} aria-describedby="analytics-period-hint" aria-invalid={!!dateError} onChange={event => { setDateError(''); setDates({ ...dates, startDate: event.target.value }) }} /></label>
        <label>Do<input name="endDate" type="date" required min={dates.startDate || '2005-01-01'} max={analyticsPeriod('yesterday', day)!.endDate} value={dates.endDate} aria-describedby="analytics-period-hint" aria-invalid={!!dateError} onChange={event => { setDateError(''); setDates({ ...dates, endDate: event.target.value }) }} /></label>
        <button type="submit" disabled={!!loading}>Zobrazit období</button>
        <p id="analytics-period-hint" className="admin-muted">Dokončené dny do včerejška, nejvýše 366 dní. Rozsah potvrďte tlačítkem.</p>
        {dateError && <p className="admin-error" role="alert">{dateError}</p>}
      </form>}
      {loading && <p role="status">Načítám statistiky…</p>}
      {!loading && result && result.status !== 'ready' && <div className={result.status === 'error' ? 'admin-error' : 'admin-status'} role={result.status === 'error' ? 'alert' : 'status'}><p>{result.message}</p><button type="button" onClick={() => startTransition(async () => { try { setResult(await loadAnalytics(range)) } catch { setResult({ status: 'error', message: 'Načtení se nezdařilo. Zkuste to znovu.' }) } })}>Zkusit znovu</button></div>}
      {!loading && report && <>
        <p className="admin-muted">{fullDate(report.startDate)} – {fullDate(report.endDate)} · {report.timeZone}</p>
        <div className="admin-analytics-metrics">{[
          ['Aktivní uživatelé', format.format(report.users)], ['Návštěvy', format.format(report.sessions)], ['Zobrazení stránek', format.format(report.views)], ['Míra zapojení', `${format.format(Math.round(report.engagementRate * 1000) / 10)} %`],
        ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
        {report.views === 0 && <p className="admin-status">Za vybrané období zatím nejsou naměřená zobrazení. Nová data se v GA4 mohou objevit se zpožděním 24–48 hodin.</p>}
        <div className="admin-records"><h4>Zobrazení stránek v čase</h4><div className="admin-analytics-chart" style={{ gap: report.days.length > 90 ? 0 : undefined }} role="img" aria-label={`Denní zobrazení stránek od ${fullDate(report.startDate)} do ${fullDate(report.endDate)}. Celkem ${format.format(report.views)}.`}>{report.days.map(day => <div key={day.date} title={`${fullDate(day.date)}: ${format.format(day.views)}`} style={{ height: `${day.views / maxViews * 100}%` }} />)}</div><div className="admin-analytics-axis"><span>{shortDate(report.startDate)}</span><span>{shortDate(report.endDate)}</span></div>
          <details><summary>Denní hodnoty v tabulce</summary><div className="admin-table-wrap"><table><thead><tr><th>Datum</th><th>Zobrazení</th></tr></thead><tbody>{report.days.map(day => <tr key={day.date}><td>{fullDate(day.date)}</td><td>{format.format(day.views)}</td></tr>)}</tbody></table></div></details>
        </div>
        <div className="admin-analytics-tables">{[{ title: 'Nejnavštěvovanější stránky', rows: report.pages, names: pageNames, unit: 'Zobrazení' }, { title: 'Odkud přicházejí návštěvníci', rows: report.sources, names: channels, unit: 'Návštěvy' }].map(group => <div className="admin-records" key={group.title}><h4>{group.title}</h4>{group.rows.length ? <div className="admin-table-wrap"><table><thead><tr><th>{group.title === 'Nejnavštěvovanější stránky' ? 'Stránka' : 'Kanál'}</th><th>{group.unit}</th></tr></thead><tbody>{group.rows.map(row => <tr key={row.label}><td>{group.names[row.label] || row.label}</td><td>{format.format(row.count)}</td></tr>)}</tbody></table></div> : <p>Zatím bez dat.</p>}</div>)}</div>
        {report.thresholded && <p className="admin-status">Google část dat kvůli ochraně soukromí nezobrazuje. Nízké počty proto mohou být neúplné.</p>}
        <p className="admin-muted">Načteno {new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Prague' }).format(new Date(report.fetchedAt))}. Aktualizace 1× denně při prvním otevření přehledu, podle času v Česku. Nezahrnuje administraci ani testovací domény. Google může data zpřesňovat 24–48 hodin.</p>
      </>}
      <a className="admin-open-site" href="https://analytics.google.com/analytics/web/#/p559040702/reports/" target="_blank" rel="noopener noreferrer">Otevřít podrobné Google Analytics</a>
    </>}
  </section>
}
