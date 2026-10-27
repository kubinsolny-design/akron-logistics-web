'use client'
import { useId, useState } from 'react'
import type { AnalyticsReport } from './analytics-types'

const number = new Intl.NumberFormat('cs-CZ')
const date = (value: string) => new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
export const pageNames: Record<string, string> = { '/': 'Úvod', '/preprava': 'Přepravy', '/moznosti': 'Vozidla a možnosti', '/kontakt': 'Kontakt', '/cookies': 'Cookies', '/ochrana-osobnich-udaju': 'Ochrana osobních údajů' }
const channelNames: Record<string, string> = { Direct: 'Přímá návštěva', 'Organic Search': 'Vyhledávače', 'Organic Social': 'Sociální sítě', Referral: 'Odkazy z jiných webů', 'Paid Search': 'Placené vyhledávání', 'Paid Social': 'Placené sociální sítě', Email: 'E-mail', Unassigned: 'Nezařazeno', 'Cross-network': 'Více reklamních sítí' }
const deviceNames: Record<string, string> = { desktop: 'Počítač', mobile: 'Mobil', tablet: 'Tablet', smartTv: 'Televize' }
const palette = ['#ff5a00', '#193654', '#8194ab', '#c2ccd7', '#e3e9ef']

function Ranking({ title, description, rows, labels = {}, unit = 'Návštěvy' }: { title: string; description: string; rows: { label: string; count: number; users: number }[]; labels?: Record<string, string>; unit?: string }) {
  const maximum = Math.max(1, ...rows.map(row => row.count))
  return <article className="admin-records analytics-ranking"><h4>{title}</h4><p className="admin-muted">{description}</p>{rows.length ? <div className="admin-table-wrap"><table><thead><tr><th>{title.includes('stránky') ? 'Stránka' : title.startsWith('Země') ? 'Země' : 'Zdroj'}</th><th>{unit}</th><th>Uživatelé</th></tr></thead><tbody>{rows.map((row, i) => <tr key={`${row.label}-${i}`}><td><span className="analytics-rank-label">{labels[row.label] || row.label}</span><span className="analytics-rank-track" aria-hidden="true"><i style={{ width: `${row.count / maximum * 100}%`, background: palette[i % palette.length] }} /></span></td><td>{number.format(row.count)}</td><td>{number.format(row.users)}</td></tr>)}</tbody></table></div> : <p className="admin-empty-note">V tomto období zatím nejsou dostupná data.</p>}</article>
}

export function AnalyticsCharts({ report }: { report: AnalyticsReport }) {
  const [metric, setMetric] = useState<'views' | 'sessions' | 'users'>('views')
  const gradient = useId().replaceAll(':', '')
  const label = { views: 'Zobrazení stránek', sessions: 'Návštěvy', users: 'Aktivní uživatelé' }[metric]
  const maximum = Math.max(4, Math.ceil(Math.max(0, ...report.days.map(day => day[metric])) / 4) * 4)
  const point = (index: number, value: number) => [report.days.length === 1 ? 500 : index / (report.days.length - 1) * 1000, 220 - value / maximum * 200]
  const points = report.days.map((day, index) => point(index, day[metric]))
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ')
  const ticks = [...new Set([0, Math.floor((report.days.length - 1) / 4), Math.floor((report.days.length - 1) / 2), Math.floor((report.days.length - 1) * .75), report.days.length - 1])]
  const devices = report.devices.filter(row => row.count > 0)
  const deviceTotal = devices.reduce((sum, row) => sum + row.count, 0)
  const segments = devices.map((row, index) => { const start = devices.slice(0, index).reduce((sum, item) => sum + item.count, 0) / deviceTotal * 100; return `${palette[index % palette.length]} ${start}% ${start + row.count / deviceTotal * 100}%` })
  const eventCount = (name: string) => report.events.find(event => event.label === name)?.count || 0
  return <>
    <article className="admin-records analytics-trend"><div className="admin-section-heading"><div><p className="admin-kicker">VÝVOJ V ČASE</p><h4>Návštěvnost den po dni</h4></div><label>Zobrazit metriku<select value={metric} onChange={event => setMetric(event.target.value as typeof metric)}><option value="views">Zobrazení stránek</option><option value="sessions">Návštěvy</option><option value="users">Aktivní uživatelé</option></select></label></div>
      <div className="analytics-line-layout"><div className="analytics-y-axis" aria-hidden="true">{[4, 3, 2, 1, 0].map(tick => <span key={tick}>{number.format(maximum * tick / 4)}</span>)}</div><div className="analytics-plot"><svg viewBox="0 0 1000 240" preserveAspectRatio="none" role="img" aria-label={`${label} od ${report.startDate} do ${report.endDate}. Přesné denní hodnoty najdete v tabulce pod grafem.`}><defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ff5a00" stopOpacity=".22" /><stop offset="100%" stopColor="#ff5a00" stopOpacity=".01" /></linearGradient></defs>{[0, 1, 2, 3, 4].map(tick => <line key={tick} x1="0" x2="1000" y1={220 - tick * 50} y2={220 - tick * 50} stroke="#e4e9ef" strokeDasharray="4 5" />)}<path d={`${line} L${points.at(-1)?.[0]},220 L${points[0]?.[0]},220 Z`} fill={`url(#${gradient})`} /><path d={line} fill="none" stroke="#ff5a00" strokeWidth="3" vectorEffect="non-scaling-stroke" />{report.days.map((day, index) => day[metric] > 0 && <circle key={day.date} cx={points[index][0]} cy={points[index][1]} r="4" fill="#ff5a00"><title>{day.date}: {number.format(day[metric])}</title></circle>)}</svg><div className="analytics-x-axis" aria-hidden="true">{ticks.map(index => <span key={index}>{date(report.days[index].date)}</span>)}</div></div></div>
      <div className="analytics-chart-caption"><span><i />{label}</span><span>Nejvyšší den: {number.format(Math.max(...report.days.map(day => day[metric])))}</span><span>{report.days.length} dní v období</span></div>
      <details><summary>Denní hodnoty v tabulce</summary><div className="admin-table-wrap"><table><thead><tr><th>Datum</th><th>Zobrazení</th><th>Návštěvy</th><th>Uživatelé</th></tr></thead><tbody>{report.days.map(day => <tr key={day.date}><td>{day.date}</td><td>{number.format(day.views)}</td><td>{number.format(day.sessions)}</td><td>{number.format(day.users)}</td></tr>)}</tbody></table></div></details>
    </article>
    <div className="analytics-events"><div><p className="admin-kicker">CO NÁVŠTĚVNÍCI UDĚLALI</p><h4>Poptávky a kontakty</h4><p>Jen naměřené události návštěvníků se souhlasem, nikoli všechny záznamy v administraci.</p></div>{[['generate_lead', 'Přijaté poptávky'], ['contact_phone', 'Kliknutí na telefon'], ['contact_email', 'Kliknutí na e-mail']].map(([key, title]) => <article key={key}><strong>{number.format(eventCount(key))}</strong><span>{title}</span></article>)}</div>
    <div className="admin-analytics-tables"><Ranking title="Odkud přicházejí návštěvníci" description="Přehled marketingových kanálů podle počtu návštěv." rows={report.sources} labels={channelNames} /><article className="admin-records analytics-devices"><h4>Na čem si web prohlížejí</h4><p className="admin-muted">Rozdělení návštěv podle zařízení.</p>{devices.length ? <div className="analytics-device-content"><div className="analytics-donut" role="img" aria-label={devices.map(row => `${deviceNames[row.label] || row.label}: ${row.count}`).join(', ')} style={{ background: `conic-gradient(${segments.join(',')})` }}><div><strong>{number.format(deviceTotal)}</strong><span>návštěv</span></div></div><ul>{devices.map((row, index) => <li key={row.label}><i style={{ background: palette[index % palette.length] }} /><span>{deviceNames[row.label] || row.label}</span><strong>{number.format(row.count)}</strong><small>{Math.round(row.count / deviceTotal * 100)} %</small></li>)}</ul></div> : <p className="admin-empty-note">Zatím nejsou dostupná data o zařízeních.</p>}</article></div>
    <div className="admin-analytics-tables"><Ranking title="Nejnavštěvovanější stránky" description="Který obsah návštěvníci skutečně čtou." rows={report.pages} labels={pageNames} unit="Zobrazení" /><Ranking title="Konkrétní zdroje a média" description="Například google / organic nebo facebook / paid_social." rows={report.sourceMedium} /></div>
    <Ranking title="Země návštěvníků" description="Souhrnné země podle GA4, bez měst, IP adres a identifikátorů osob." rows={report.countries} />
    <p className="admin-status">Poptávky, kontaktní kliknutí a přesnější zdroje sbíráme od 27. 10. 2026. Starší chybějící údaje nelze doplnit zpětně. Počty uživatelů a návštěv v jednotlivých řádcích se kvůli metodice GA4 nemusí přesně sčítat.</p>
  </>
}
