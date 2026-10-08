import { app } from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import { scheduleAnalyticsPurge } from './services/analyticsService'

const server = app.listen(env.port, () => {
  console.log(JSON.stringify({ event: 'server_started', port: env.port, environment: env.nodeEnv }))
})

const initializeDatabase = async () => {
  let connected = false
  try {
    await prisma.$connect()
    await prisma.visitorSession.count()
    connected = true
    console.info('[MongoDB] Connection successful')
  } catch (error) {
    const safeCode = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : 'DATABASE_CONNECTION_ERROR'
    console.error('[MongoDB] Connection failed', safeCode)
    console.warn('Backend continuing...')
  }
  scheduleAnalyticsPurge(connected)
}

void initializeDatabase().catch((error: unknown) => {
  console.error('[MongoDB] Initialization failed', typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : 'DATABASE_INITIALIZATION_ERROR')
  console.warn('Backend continuing...')
  scheduleAnalyticsPurge(false)
})

const shutdown = async (signal: string) => {
  console.log(JSON.stringify({ event: 'shutdown_started', signal }))
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))