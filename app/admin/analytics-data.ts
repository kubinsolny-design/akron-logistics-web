import 'server-only'
import { createHash } from 'node:crypto'
import { JWT } from 'google-auth-library'
import { unstable_cache } from 'next/cache'
import { currentMember } from '../../supabase/server'
import { analyticsDay, analyticsPeriod } from './analytics-calendar'
import type { AnalyticsRange, AnalyticsReport, AnalyticsResult } from './analytics-types'

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

async function query(config: Config, range: AnalyticsRange, snapshotDay: string): Promise<AnalyticsReport> {
  const client = new JWT({ email: config.email, key: config.key, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] })
  const period = analyticsPeriod(range, snapshotDay)
  const base = {
    dateRanges: [period],
    dimensionFilter: { andGroup: { expressions: [
      { filter: { fieldName: 'hostName', inListFilter: { values: ['akronlogistics.cz', 'www.akronlogistics.cz'] } } },
      { filter: { fieldName: 'pagePath', inListFilter: { values: publicPaths } } },
    ] } },
    keepEmptyRows: true,
  }
  const { data } = await client.request<{ reports?: Report[] }>({
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${config.property}:batchRunReports`,
    method: 'POST', timeout: 15000, retry: false,
    data: { requests: [
      { ...base, metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'engagementRate' }] },
      { ...base, dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 90 },
      { ...base, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 10 },
      { ...base, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 },
    ] },
  })
  if (!Array.isArray(data.reports) || data.reports.length !== 4) throw new Error('Invalid Analytics response')
  const [summary, daily, pages, sources] = data.reports
  const timeZone = summary.metadata?.timeZone || 'Europe/Prague'
  // Use the same explicit dates in API requests and UI, even across midnight.
  const start = new Date(`${period.startDate}T12:00:00Z`)
  const dayViews = new Map((daily.rows || []).map(row => [dateLabel(row.dimensionValues?.[0]?.value || ''), number(row)]))
  const days = Array.from({ length: range }, (_, i) => {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + i)
    const label = date.toISOString().slice(0, 10)
    return { date: label, views: dayViews.get(label) || 0 }
  })
  return {
    range, fetchedAt: new Date().toISOString(), startDate: days[0].date, endDate: days[days.length - 1].date, timeZone,
    thresholded: data.reports.some(report => report.metadata?.subjectToThresholding === true),
    users: number(summary.rows?.[0]), sessions: number(summary.rows?.[0], 1), views: number(summary.rows?.[0], 2), engagementRate: Math.min(1, number(summary.rows?.[0], 3)), days,
    pages: (pages.rows || []).filter(row => publicPaths.includes(row.dimensionValues?.[0]?.value || '')).map(row => ({ label: row.dimensionValues![0].value!, count: number(row) })),
    sources: (sources.rows || []).slice(0, 10).map(row => ({ label: (row.dimensionValues?.[0]?.value || 'Neurčeno').slice(0, 100), count: number(row) })),
  }
}

export async function authorizedAnalytics(range: unknown): Promise<AnalyticsResult> {
  // This must run on EVERY invocation, including cache hits and revoked sessions.
  const member = await currentMember()
  if (!member || member.role !== 'admin') return { status: 'forbidden', message: 'Analytiku může zobrazit pouze přihlášený administrátor.' }
  if (range !== 7 && range !== 28 && range !== 90) return { status: 'error', message: 'Vyberte období 7, 28 nebo 90 dní.' }
  const config = configuration()
  if (!config) return { status: 'unconfigured', message: 'Propojení s Google Analytics ještě čeká na dokončení správcem webu. Po připojení se zde zobrazí skutečná návštěvnost.' }
  // Cache only aggregates, not cookies, auth, credentials or raw Google responses.
  // Include a credential fingerprint so rotation cannot reuse a former account's report.
  const identity = createHash('sha256').update(`${config.email}\n${config.key}`).digest('hex')
  const snapshotDay = analyticsDay(new Date())
  try {
    // First authorized opening in a new calendar day fetches a fresh snapshot.
    // A longer retention avoids a second refresh during a 25-hour DST day;
    // the DAY in the key, not a rolling TTL, controls the daily refresh.
    const report = await unstable_cache(() => query(config, range, snapshotDay), ['akron-ga4-daily-v2', config.property, identity, String(range), snapshotDay], { revalidate: 172800 })()
    return { status: 'ready', report }
  } catch {
    // Google/Auth error objects can contain request headers, tokens and key data.
    // Do not log or serialize them; surface only a safe operational message.
    return { status: 'error', message: 'Statistiky se nepodařilo načíst. Správce musí prověřit klíč, oprávnění Čtenář, ID služby a zapnutí Google Analytics Data API. Zkuste to později.' }
  }
}
