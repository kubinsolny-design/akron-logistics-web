import 'server-only'
import { createHash } from 'node:crypto'
import { JWT } from 'google-auth-library'
import { unstable_cache } from 'next/cache'
import { currentMember } from '../../supabase/server'
import { analyticsDay, analyticsPeriod } from './analytics-calendar'
import type { AnalyticsDates, AnalyticsReport, AnalyticsResult } from './analytics-types'

type Config = { property: string; email: string; key: string }
type Row = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }
type Report = { rows?: Row[]; metadata?: { timeZone?: string; subjectToThresholding?: boolean }; rowCount?: number }
const publicPaths = ['/', '/preprava', '/moznosti', '/kontakt', '/cookies', '/ochrana-osobnich-udaju']

function configuration(): Config | null {
  const property = process.env.GA4_PROPERTY_ID?.trim() || ''
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON
  if (!/^\d+$/.test(property) || !raw) return null
  try {
    const value = JSON.parse(raw)
    if (value.type !== 'service_account' || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(value.client_email || '') || typeof value.private_key !== 'string' || !value.private_key.includes('-----BEGIN PRIVATE KEY-----')) return null
    // Never trust token_uri, universe_domain or other endpoints from a JSON file.
    return { property, email: value.client_email, key: value.private_key.replace(/\\n/g, '\n') }
  } catch { return null }
}

function number(row: Row | undefined, index = 0) {
  const value = Number(row?.metricValues?.[index]?.value || 0)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function dateLabel(value: string) {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : ''
}

async function query(config: Config, period: AnalyticsDates): Promise<AnalyticsReport> {
  const client = new JWT({ email: config.email, key: config.key, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] })
  const length = Math.round((Date.parse(period.endDate) - Date.parse(period.startDate)) / 86400000) + 1
  const base = {
    dateRanges: [period],
    dimensionFilter: { andGroup: { expressions: [
      { filter: { fieldName: 'hostName', inListFilter: { values: ['akronlogistics.cz', 'www.akronlogistics.cz'] } } },
      { filter: { fieldName: 'pagePath', inListFilter: { values: publicPaths } } },
    ] } },
    keepEmptyRows: true,
  }
  const metrics = ['activeUsers', 'sessions', 'screenPageViews', 'engagementRate', 'newUsers', 'averageSessionDuration'].map(name => ({ name }))
  const grouped = (dimension: string, metric = 'sessions') => ({ ...base, dimensions: [{ name: dimension }], metrics: [{ name: metric }, { name: 'activeUsers' }], orderBys: [{ metric: { metricName: metric }, desc: true }], limit: 10 })
  const previousEnd = new Date(`${period.startDate}T12:00:00Z`)
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1)
  const previousStart = new Date(previousEnd); previousStart.setUTCDate(previousStart.getUTCDate() - length + 1)
  const requests = [
    { ...base, metrics },
    { ...base, dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 366 },
    grouped('pagePath', 'screenPageViews'), grouped('sessionDefaultChannelGroup'), grouped('sessionSourceMedium'), grouped('deviceCategory'), grouped('country'),
    { ...base, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { andGroup: { expressions: [...base.dimensionFilter.andGroup.expressions, { filter: { fieldName: 'eventName', inListFilter: { values: ['generate_lead', 'contact_phone', 'contact_email'] } } }] } }, limit: 3 },
    { ...base, dateRanges: [{ startDate: previousStart.toISOString().slice(0, 10), endDate: previousEnd.toISOString().slice(0, 10) }], metrics },
  ]
  // The API permits at most five reports per batch. No per-visitor identifiers.
  const batches = await Promise.all([requests.slice(0, 5), requests.slice(5)].map(async batch => {
    const { data } = await client.request<{ reports?: Report[] }>({ url: `https://analyticsdata.googleapis.com/v1beta/properties/${config.property}:batchRunReports`, method: 'POST', timeout: 15000, retry: false, data: { requests: batch } })
    if (!Array.isArray(data.reports) || data.reports.length !== batch.length) throw new Error('Invalid Analytics response')
    return data.reports
  }))
  const reports = batches.flat()
  const [summary, daily, pages, sources, sourceMedium, devices, countries, events, previous] = reports
  const timeZone = summary.metadata?.timeZone || 'Europe/Prague'
  // Use the same explicit dates in API requests and UI, even across midnight.
  const start = new Date(`${period.startDate}T12:00:00Z`)
  const dayValues = new Map((daily.rows || []).map(row => [dateLabel(row.dimensionValues?.[0]?.value || ''), row]))
  const days = Array.from({ length }, (_, i) => {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + i)
    const label = date.toISOString().slice(0, 10)
    return { date: label, views: number(dayValues.get(label)), sessions: number(dayValues.get(label), 1), users: number(dayValues.get(label), 2) }
  })
  const rows = (report: Report) => (report.rows || []).slice(0, 10).map(row => ({ label: (row.dimensionValues?.[0]?.value || 'Neurčeno').slice(0, 100), count: number(row), users: number(row, 1) }))
  return {
    range: period, fetchedAt: new Date().toISOString(), startDate: days[0].date, endDate: days[days.length - 1].date, timeZone,
    thresholded: reports.some(report => report.metadata?.subjectToThresholding === true),
    users: number(summary.rows?.[0]), sessions: number(summary.rows?.[0], 1), views: number(summary.rows?.[0], 2), engagementRate: Math.min(1, number(summary.rows?.[0], 3)), days,
    newUsers: number(summary.rows?.[0], 4), averageDuration: number(summary.rows?.[0], 5),
    previous: { users: number(previous.rows?.[0]), sessions: number(previous.rows?.[0], 1), views: number(previous.rows?.[0], 2), engagementRate: Math.min(1, number(previous.rows?.[0], 3)) },
    pages: rows(pages).filter(row => publicPaths.includes(row.label)), sources: rows(sources),
    sourceMedium: rows(sourceMedium).map(row => ({ ...row, label: /^[a-z0-9 .()_/-]{1,100}$/i.test(row.label) && !row.label.includes('://') ? row.label : 'Jiný zdroj' })),
    devices: rows(devices), countries: rows(countries),
    events: rows(events).filter(row => ['generate_lead', 'contact_phone', 'contact_email'].includes(row.label)).map(({ label, count }) => ({ label, count })),
  }
}

export async function authorizedAnalytics(range: unknown): Promise<AnalyticsResult> {
  // This must run on EVERY invocation, including cache hits and revoked sessions.
  const member = await currentMember()
  if (!member || member.role !== 'admin') return { status: 'forbidden', message: 'Analytiku může zobrazit pouze přihlášený administrátor.' }
  const snapshotDay = analyticsDay(new Date())
  const period = analyticsPeriod(range, snapshotDay)
  if (!period) return { status: 'error', message: 'Vyberte platné období do včerejška, nejvýše 366 dní. Počáteční datum nesmí být po koncovém.' }
  const config = configuration()
  if (!config) return { status: 'unconfigured', message: 'Propojení s Google Analytics ještě čeká na dokončení správcem webu. Po připojení se zde zobrazí skutečná návštěvnost.' }
  // Cache only aggregates, not cookies, auth, credentials or raw Google responses.
  // Include a credential fingerprint so rotation cannot reuse a former account's report.
  const identity = createHash('sha256').update(`${config.email}\n${config.key}`).digest('hex')
  try {
    // First authorized opening in a new calendar day fetches a fresh snapshot.
    // A longer retention avoids a second refresh during a 25-hour DST day;
    // the DAY in the key, not a rolling TTL, controls the daily refresh.
    const report = await unstable_cache(() => query(config, period), ['akron-ga4-daily-v4', config.property, identity, period.startDate, period.endDate, snapshotDay], { revalidate: 172800 })()
    return { status: 'ready', report }
  } catch {
    // Google/Auth error objects can contain request headers, tokens and key data.
    // Do not log or serialize them; surface only a safe operational message.
    return { status: 'error', message: 'Statistiky se nepodařilo načíst. Správce musí prověřit klíč, oprávnění Čtenář, ID služby a zapnutí Google Analytics Data API. Zkuste to později.' }
  }
}
