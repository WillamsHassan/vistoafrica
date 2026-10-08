import { prisma } from '../config/prisma'
import { env } from '../config/env'

let lastPurgeAt = 0
let lastPurgeAttemptAt = 0
let purgeInProgress: Promise<void> | null = null

const safeErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) return String(error.code)
  if (typeof error === 'object' && error !== null && 'name' in error) return String(error.name)
  return 'DATABASE_CONNECTION_ERROR'
}

export const purgeOldAnalytics = async (automatic = false) => {
  if (purgeInProgress) return purgeInProgress
  const lastAttempt = Math.max(lastPurgeAt, lastPurgeAttemptAt)
  if (Date.now() - lastAttempt < 60 * 60 * 1000) return
  lastPurgeAttemptAt = Date.now()
  const cutoff = new Date(Date.now() - env.analyticsRetentionDays * 24 * 60 * 60 * 1000)
  console.info('[Analytics] Purge démarrée')
  purgeInProgress = prisma.visitorSession.deleteMany({ where: { lastSeenAt: { lt: cutoff } } })
    .then(() => {
      lastPurgeAt = Date.now()
      if (automatic) console.info('[Analytics] Purge automatique exécutée')
    })
    .catch((error: unknown) => {
      console.warn('[Analytics] MongoDB indisponible', safeErrorCode(error))
      console.warn('[Analytics] Purge reportée')
    })
    .finally(() => { purgeInProgress = null })
  await purgeInProgress
}

export const scheduleAnalyticsPurge = (initialConnectionSuccessful = true) => {
  const run = () => { void purgeOldAnalytics(true) }
  if (initialConnectionSuccessful) run()
  else {
    console.warn('[Analytics] MongoDB indisponible')
    console.warn('[Analytics] Purge reportée')
  }
  const timer = setInterval(run, 60 * 60 * 1000)
  timer.unref()
}

export const analyticsStatus = (types: string[]) => {
  if (types.includes('PAYMENT_DECLARED')) return 'PAYMENT_DECLARED'
  if (types.includes('REGISTRATION_COMPLETED')) return 'REGISTRATION_COMPLETED'
  if (types.includes('REGISTRATION_STARTED')) return 'REGISTRATION_STARTED'
  return 'VISITOR'
}
