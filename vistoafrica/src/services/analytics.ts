export type AnalyticsEventType = 'PAGE_VIEW' | 'COURSE_VIEW' | 'REGISTRATION_STARTED' | 'REGISTRATION_COMPLETED' | 'PAYMENT_STARTED' | 'PAYMENT_DECLARED'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const visitorKey = 'vistoafrica-analytics-visitor-id'
const consentKey = 'vistoafrica-analytics-consent'

export const getAnalyticsConsent = () => localStorage.getItem(consentKey) === 'accepted'
export const setAnalyticsConsent = (accepted: boolean) => localStorage.setItem(consentKey, accepted ? 'accepted' : 'refused')

const getVisitorId = () => {
  if (!getAnalyticsConsent()) return null
  const existing = localStorage.getItem(visitorKey)
  if (existing) return existing
  const visitorId = crypto.randomUUID()
  localStorage.setItem(visitorKey, visitorId)
  return visitorId
}

const send = async (path: string, body: Record<string, unknown>) => {
  try {
    await fetch(`${apiUrl}/api/analytics/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true })
  } catch {
    // Analytics must never affect navigation or page rendering.
  }
}

export const startAnalyticsSession = (path: string) => {
  const visitorId = getVisitorId()
  if (!visitorId) return
  void send('session', { visitorId, entryPage: path, referrer: document.referrer || undefined, language: navigator.language, resolution: `${Math.round(window.innerWidth / 100) * 100}x${Math.round(window.innerHeight / 100) * 100}` })
}

export const trackPageView = (path: string) => {
  const visitorId = getVisitorId()
  if (!visitorId) return
  void send('page-view', { visitorId, path, title: document.title })
}

export const trackEvent = (type: AnalyticsEventType, path: string, metadata?: Record<string, string | number | boolean>) => {
  const visitorId = getVisitorId()
  if (!visitorId) return
  void send('event', { visitorId, type, path, metadata })
}
