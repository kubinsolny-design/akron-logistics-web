export type AnalyticsDates = { startDate: string; endDate: string }
export type AnalyticsPreset = 7 | 28 | 30 | 90 | 'yesterday' | 'month' | 'lastMonth' | 'year' | 'lastYear'
export type AnalyticsRange = AnalyticsPreset | AnalyticsDates
export type AnalyticsReport = {
  range: AnalyticsRange
  fetchedAt: string
  startDate: string
  endDate: string
  timeZone: string
  thresholded: boolean
  users: number
  sessions: number
  views: number
  engagementRate: number
  newUsers: number
  averageDuration: number
  previous: { users: number; sessions: number; views: number; engagementRate: number }
  days: { date: string; views: number; sessions: number; users: number }[]
  pages: { label: string; count: number; users: number }[]
  sources: { label: string; count: number; users: number }[]
  sourceMedium: { label: string; count: number; users: number }[]
  devices: { label: string; count: number; users: number }[]
  countries: { label: string; count: number; users: number }[]
  events: { label: string; count: number }[]
}
export type AnalyticsResult = { status: 'ready'; report: AnalyticsReport } | {
  status: 'unconfigured' | 'error' | 'forbidden'
  message: string
}
