import { prisma } from '../config/prisma'
import { env } from '../config/env'

let lastPurgeAt = 0
let purgeInProgress: Promise<void> | null = null

export const purgeOldAnalytics = async () => {
  if (Date.now() - lastPurgeAt < 60 * 60 * 1000) return
  if (purgeInProgress) return purgeInProgress
  const cutoff = new Date(Date.now() - env.analyticsRetentionDays * 24 * 60 * 60 * 1000)
  purgeInProgress = prisma.visitorSession.deleteMany({ where: { lastSeenAt: { lt: cutoff } } })
    .then(() => { lastPurgeAt = Date.now() })
    .finally(() => { purgeInProgress = null })
  await purgeInProgress
}

export const scheduleAnalyticsPurge = () => {
  const run = () => { void purgeOldAnalytics().catch((error) => console.error('[Analytics] Purge automatique échouée:', error)) }
  run()
  const timer = setInterval(run, 60 * 60 * 1000)
  timer.unref()
}

export const analyticsStatus = (types: string[]) => {
  if (types.includes('PAYMENT_DECLARED')) return 'PAYMENT_DECLARED'
  if (types.includes('REGISTRATION_COMPLETED')) return 'REGISTRATION_COMPLETED'
  if (types.includes('REGISTRATION_STARTED')) return 'REGISTRATION_STARTED'
  return 'VISITOR'
}
