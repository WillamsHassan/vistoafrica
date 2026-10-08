import { beforeEach, describe, expect, it, vi } from 'vitest'

import { analyticsStatus } from './analyticsService'

const mocks = vi.hoisted(() => ({ deleteMany: vi.fn() }))

vi.mock('../config/prisma', () => ({
  prisma: { visitorSession: { deleteMany: mocks.deleteMany } },
}))

describe('statut du parcours analytics', () => {
  it('retient le statut métier le plus avancé', () => {
    expect(analyticsStatus([])).toBe('VISITOR')
    expect(analyticsStatus(['REGISTRATION_STARTED'])).toBe('REGISTRATION_STARTED')
    expect(analyticsStatus(['REGISTRATION_STARTED', 'REGISTRATION_COMPLETED'])).toBe('REGISTRATION_COMPLETED')
    expect(analyticsStatus(['PAYMENT_DECLARED', 'REGISTRATION_COMPLETED'])).toBe('PAYMENT_DECLARED')
  })
})

describe('purge analytics résiliente', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T12:00:00.000Z'))
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('limite la suppression aux seules sessions dépassant la durée de rétention', async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 })
    const { purgeOldAnalytics } = await import('./analyticsService.js')

    await purgeOldAnalytics()

    expect(mocks.deleteMany).toHaveBeenCalledTimes(1)
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { lastSeenAt: { lt: expect.any(Date) } } })
    expect(console.info).toHaveBeenCalledWith('[Analytics] Purge démarrée')
  })

  it('absorbe une panne MongoDB, journalise le report et autorise un nouvel essai', async () => {
    mocks.deleteMany.mockRejectedValueOnce(Object.assign(new Error('unavailable'), { code: 'P2010' })).mockResolvedValueOnce({ count: 0 })
    const { purgeOldAnalytics } = await import('./analyticsService.js')

    await expect(purgeOldAnalytics()).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith('[Analytics] MongoDB indisponible', 'P2010')
    expect(console.warn).toHaveBeenCalledWith('[Analytics] Purge reportée')
    await expect(purgeOldAnalytics()).resolves.toBeUndefined()
    expect(mocks.deleteMany).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(60 * 60 * 1000 + 1)
    await expect(purgeOldAnalytics()).resolves.toBeUndefined()
    expect(mocks.deleteMany).toHaveBeenCalledTimes(2)
  })

  it('ne lance pas plusieurs purges simultanément', async () => {
    let finishPurge: (result: { count: number }) => void = () => undefined
    mocks.deleteMany.mockReturnValue(new Promise((resolve) => { finishPurge = resolve }))
    const { purgeOldAnalytics } = await import('./analyticsService.js')

    const first = purgeOldAnalytics()
    const second = purgeOldAnalytics()
    expect(mocks.deleteMany).toHaveBeenCalledTimes(1)
    finishPurge({ count: 0 })
    await Promise.all([first, second])
  })
})
