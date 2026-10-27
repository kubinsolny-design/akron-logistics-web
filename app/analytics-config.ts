export const gaMeasurementId = 'G-D2XLJKJMNH'
export const privacyStorageKey = 'akron-privacy-preferences'
export const privacyChangeEvent = 'akron-privacy-change'
export const leadEvent = 'akron-inquiry-accepted'
export const privacyLifetime = 180 * 24 * 60 * 60 * 1000

export function readPrivacyPreference(raw: string | null, now = Date.now()) {
  try {
    const value = JSON.parse(raw || 'null')
    if (!value || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt >= privacyLifetime) return null
    if (value.version === 1 && value.mode === 'essential-only') return { analytics: false }
    if (value.version === 2 && typeof value.analytics === 'boolean') return { analytics: value.analytics }
  } catch { /* Invalid browser data never grants consent. */ }
  return null
}

const publicPaths = new Set(['/', '/preprava', '/moznosti', '/kontakt', '/cookies', '/ochrana-osobnich-udaju'])
export function analyticsAllowed(hostname: string, pathname: string, preparing: boolean, preview: boolean) {
  return !preparing && !preview && ['akronlogistics.cz', 'www.akronlogistics.cz'].includes(hostname) && publicPaths.has(pathname)
}

/** Read only after consent. Never forward raw query strings or referrer paths. */
export function safeAttribution(search: string, referrer: string, origin: string) {
  let page_referrer = ''
  try {
    const url = new URL(referrer)
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && url.origin !== origin) page_referrer = url.origin
  } catch { /* No external source. */ }
  const params = new URLSearchParams(search)
  const source = params.get('utm_source')?.toLowerCase() || ''
  const medium = params.get('utm_medium')?.toLowerCase() || ''
  // Fixed business taxonomy, not arbitrary campaign values that could contain PII.
  const campaigns = ['google', 'seznam', 'facebook', 'instagram', 'linkedin', 'newsletter'].includes(source) && ['cpc', 'organic', 'paid_social', 'social', 'email', 'referral'].includes(medium)
  return { page_referrer, ...(campaigns ? { campaign_source: source, campaign_medium: medium } : {}) }
}
