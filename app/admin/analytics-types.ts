export type AnalyticsRange = 7 | 28 | 90
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
