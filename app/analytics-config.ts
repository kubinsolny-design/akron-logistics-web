export const gaMeasurementId = 'G-D2XLJKJMNH'
export const privacyStorageKey = 'akron-privacy-preferences'
export const privacyChangeEvent = 'akron-privacy-change'
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
