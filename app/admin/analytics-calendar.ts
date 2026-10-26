import type { AnalyticsDates } from './analytics-types'

/** One reporting snapshot per Czech calendar day, independent of server timezone. */
export function analyticsDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(value => value.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Validate at both boundaries: untrusted Server Action input and date form. */
export function analyticsPeriod(range: unknown, snapshotDay: string): AnalyticsDates | null {
  const end = new Date(`${snapshotDay}T12:00:00Z`)
  end.setUTCDate(end.getUTCDate() - 1)
  const start = new Date(end)
  if (range === 7 || range === 28 || range === 30 || range === 90) start.setUTCDate(start.getUTCDate() - range + 1)
  else if (range === 'yesterday') { /* one completed day */ }
  else if (range === 'month') start.setUTCDate(1)
  else if (range === 'lastMonth') {
    end.setUTCFullYear(Number(snapshotDay.slice(0, 4)), Number(snapshotDay.slice(5, 7)) - 1, 0)
    start.setTime(end.getTime()); start.setUTCDate(1)
  } else if (range === 'year') start.setUTCMonth(0, 1)
  else if (range === 'lastYear') {
    end.setUTCFullYear(Number(snapshotDay.slice(0, 4)) - 1, 11, 31)
    start.setTime(end.getTime()); start.setUTCMonth(0, 1)
  } else if (range && typeof range === 'object' && !Array.isArray(range)) {
    const { startDate, endDate } = range as Record<string, unknown>
    const validDate = (date: unknown): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
    if (!validDate(startDate) || !validDate(endDate)) return null
    start.setTime(Date.parse(`${startDate}T12:00:00Z`)); end.setTime(Date.parse(`${endDate}T12:00:00Z`))
  } else return null
  // Current month/year have no completed days on their first day.
  if ((range === 'month' && snapshotDay.endsWith('-01')) || (range === 'year' && snapshotDay.endsWith('-01-01'))) return null
  const length = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  if (length < 1 || length > 366 || end.toISOString().slice(0, 10) >= snapshotDay || start.getUTCFullYear() < 2005) return null
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
}
