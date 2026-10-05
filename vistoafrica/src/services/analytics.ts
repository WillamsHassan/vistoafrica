export type AnalyticsEventType = 'PAGE_VIEW' | 'COURSE_VIEW' | 'REGISTRATION_STARTED' | 'REGISTRATION_COMPLETED' | 'PAYMENT_STARTED' | 'PAYMENT_DECLARED'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const visitorKey = 'vistoafrica-analytics-visitor-id'
const consentKey = 'vistoafrica-analytics-consent'

export type AnalyticsConsent = { analyticsAccepted: boolean; timestamp: string }
let startedVisitorId: string | null = null
let requestQueue: Promise<void> = Promise.resolve()

export const getAnalyticsConsentRecord = (): AnalyticsConsent | null => {
  const stored = localStorage.getItem(consentKey)
  if (!stored) return null
  try {
    const consent = JSON.parse(stored) as Partial<AnalyticsConsent>
    if (typeof consent.analyticsAccepted === 'boolean' && typeof consent.timestamp === 'string') return consent as AnalyticsConsent
  } catch {
    // Upgrade the previous simple accepted/refused value without changing the user's choice.
  }
  if (stored === 'accepted' || stored === 'refused') {
    return { analyticsAccepted: stored === 'accepted', timestamp: new Date(0).toISOString() }
  }
  return null
}

export const getAnalyticsConsent = () => getAnalyticsConsentRecord()?.analyticsAccepted === true
export const setAnalyticsConsent = (accepted: boolean) => {
  localStorage.setItem(consentKey, JSON.stringify({ analyticsAccepted: accepted, timestamp: new Date().toISOString() } satisfies AnalyticsConsent))
  if (!accepted) {
    const visitorId = localStorage.getItem(visitorKey)
    localStorage.removeItem(visitorKey)
    startedVisitorId = null
    if (visitorId) void send('consent/refuse', { visitorId, analyticsAccepted: false })
  } else {
    startedVisitorId = null
  }
}

const getVisitorId = () => {
  if (!getAnalyticsConsent()) return null
  const existing = localStorage.getItem(visitorKey)
  if (existing) return existing
  const visitorId = crypto.randomUUID()
  localStorage.setItem(visitorKey, visitorId)
  return visitorId
}

const send = (path: string, body: Record<string, unknown>) => {
  requestQueue = requestQueue.then(async () => {
    try {
      await fetch(`${apiUrl}/api/analytics/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analyticsAccepted: true, ...body }), keepalive: true })
    } catch {
      // Analytics must never affect navigation or page rendering.
    }
  })
  return requestQueue
}

export const startAnalyticsSession = (path: string) => {
  const visitorId = getVisitorId()
  if (!visitorId) return
  if (startedVisitorId === visitorId) return
  startedVisitorId = visitorId
  void send('session', { visitorId, entryPage: path, referrer: document.referrer || undefined, language: navigator.language, resolution: `${Math.round(window.innerWidth / 100) * 100}x${Math.round(window.innerHeight / 100) * 100}` })
}

export const trackPageView = (path: string) => {
  const visitorId = getVisitorId()
  if (!visitorId) return
  void send('page-view', { visitorId, path })
}

export const trackEvent = (type: AnalyticsEventType, path: string, metadata?: { course: string }) => {
  const visitorId = getVisitorId()
  if (!visitorId) return
  void send('event', { visitorId, type, path, metadata })
}
