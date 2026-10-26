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
  days: { date: string; views: number }[]
  pages: { label: string; count: number }[]
  sources: { label: string; count: number }[]
}
export type AnalyticsResult = { status: 'ready'; report: AnalyticsReport } | {
  status: 'unconfigured' | 'error' | 'forbidden'
  message: string
}
