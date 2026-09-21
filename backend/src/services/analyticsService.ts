import { prisma } from '../config/prisma'
import { env } from '../config/env'

let lastPurgeAt = 0

export const purgeOldAnalytics = async () => {
  if (Date.now() - lastPurgeAt < 60 * 60 * 1000) return
  lastPurgeAt = Date.now()
  const cutoff = new Date(Date.now() - env.analyticsRetentionDays * 24 * 60 * 60 * 1000)
  await prisma.visitorSession.deleteMany({ where: { lastSeenAt: { lt: cutoff } } })
}

export const analyticsStatus = (types: string[]) => {
  if (types.includes('PAYMENT_DECLARED')) return 'PAYMENT_DECLARED'
  if (types.includes('REGISTRATION_COMPLETED')) return 'REGISTRATION_COMPLETED'
  if (types.includes('REGISTRATION_STARTED')) return 'REGISTRATION_STARTED'
  return 'VISITOR'
}
