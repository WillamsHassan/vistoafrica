import { describe, expect, it } from 'vitest'

import { analyticsStatus } from './analyticsService'

describe('statut du parcours analytics', () => {
  it('retient le statut métier le plus avancé', () => {
    expect(analyticsStatus([])).toBe('VISITOR')
    expect(analyticsStatus(['REGISTRATION_STARTED'])).toBe('REGISTRATION_STARTED')
    expect(analyticsStatus(['REGISTRATION_STARTED', 'REGISTRATION_COMPLETED'])).toBe('REGISTRATION_COMPLETED')
    expect(analyticsStatus(['PAYMENT_DECLARED', 'REGISTRATION_COMPLETED'])).toBe('PAYMENT_DECLARED')
  })
})
