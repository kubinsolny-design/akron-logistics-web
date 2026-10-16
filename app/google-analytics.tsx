'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { preparing } from './preparing'
import { analyticsAllowed, gaMeasurementId, privacyChangeEvent, privacyStorageKey, readPrivacyPreference } from './analytics-config'

type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  'ga-disable-G-D2XLJKJMNH'?: boolean
}

// Basic consent mode: no Google script, request or cookieless ping before opt-in.
export function GoogleAnalytics({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname()
  const lastPage = useRef('')
  useEffect(() => {
    const target = window as AnalyticsWindow
    const update = () => {
      let consent = false
      try { consent = readPrivacyPreference(localStorage.getItem(privacyStorageKey))?.analytics === true } catch { /* Storage blocked: deny. */ }
      const allowed = analyticsAllowed(location.hostname, pathname, preparing, preview) && consent
      target[`ga-disable-${gaMeasurementId}`] = !allowed
      if (!allowed) { lastPage.current = ''; return }
      if (!target.gtag) {
        target.dataLayer = target.dataLayer || []
        // Google's command queue expects the standard gtag Arguments shape.
        // eslint-disable-next-line prefer-rest-params
        target.gtag = function () { target.dataLayer?.push(arguments) }
        target.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
        target.gtag('js', new Date())
        target.gtag('config', gaMeasurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 15552000, ignore_referrer: true })
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
        script.id = 'akron-ga4'
        document.head.appendChild(script)
      }
      if (lastPage.current !== pathname) {
        // Never forward form fields, query strings, invitation tokens or hash fragments.
        target.gtag('event', 'page_view', { send_to: gaMeasurementId, page_location: location.origin + pathname, page_title: 'AKRON Logistics', page_referrer: '' })
        lastPage.current = pathname
      }
    }
    update()
    window.addEventListener(privacyChangeEvent, update)
    window.addEventListener('storage', update)
    return () => {
      target[`ga-disable-${gaMeasurementId}`] = true
      window.removeEventListener(privacyChangeEvent, update)
      window.removeEventListener('storage', update)
    }
  }, [pathname, preview])
  return null
}
