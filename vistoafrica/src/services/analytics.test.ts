import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAnalyticsConsent, getAnalyticsConsentRecord, setAnalyticsConsent, startAnalyticsSession, trackEvent, trackPageView } from './analytics'

const visitorId = '01934d5e-7c00-7000-8000-000000000001'

describe('consentement et tracking analytics', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 201 })))
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(visitorId)
  })

  it('n’émet aucune requête tant que le consentement analytics est absent ou refusé', () => {
    startAnalyticsSession('/')
    trackPageView('/')
    trackEvent('COURSE_VIEW', '/cours-italien', { course: 'cours-italien' })
    expect(fetch).not.toHaveBeenCalled()

    setAnalyticsConsent(false)
    startAnalyticsSession('/')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('enregistre un consentement horodaté et transmet uniquement après acceptation', async () => {
    setAnalyticsConsent(true)
    expect(getAnalyticsConsent()).toBe(true)
    expect(getAnalyticsConsentRecord()).toMatchObject({ analyticsAccepted: true })

    startAnalyticsSession('/')
    trackPageView('/')
    trackEvent('COURSE_VIEW', '/cours-italien', { course: 'cours-italien' })
    trackEvent('REGISTRATION_STARTED', '/inscription')
    trackEvent('REGISTRATION_COMPLETED', '/inscription')
    trackEvent('PAYMENT_STARTED', '/inscription/paiement')
    trackEvent('PAYMENT_DECLARED', '/inscription/paiement')

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
    for (const [, request] of vi.mocked(fetch).mock.calls) {
      expect(JSON.parse(String(request?.body))).toMatchObject({ analyticsAccepted: true, visitorId })
    }
  })

  it('supprime l’identifiant local et demande la suppression de session au refus', async () => {
    setAnalyticsConsent(true)
    startAnalyticsSession('/')
    vi.mocked(fetch).mockClear()

    setAnalyticsConsent(false)

    expect(localStorage.getItem('vistoafrica-analytics-visitor-id')).toBeNull()
    expect(getAnalyticsConsent()).toBe(false)
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/analytics/consent/refuse'), expect.objectContaining({ body: JSON.stringify({ analyticsAccepted: false, visitorId }) })))
  })
})
