'use server'

import { authorizedAnalytics } from './analytics-data'
import type { AnalyticsResult } from './analytics-types'

export async function loadAnalytics(range: unknown): Promise<AnalyticsResult> {
  try { return await authorizedAnalytics(range) }
  catch { return { status: 'error', message: 'Obnovte přihlášení a zkuste načíst statistiky znovu.' } }
}
