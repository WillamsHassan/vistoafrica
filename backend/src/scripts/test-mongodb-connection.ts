import dotenv from 'dotenv'
import { resolve } from 'node:path'

const main = async () => {
  dotenv.config({ path: resolve(__dirname, '../../.env') })
  const { prisma } = await import('../config/prisma.js')
  try {
    await prisma.$connect()
    await prisma.visitorSession.count()
    console.log('[MongoDB] Connection successful')
    console.log('MongoDB: OK')
  } catch (error) {
    const safeCode = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : 'DATABASE_CONNECTION_ERROR'
    console.error('[MongoDB] Connection failed', safeCode)
    console.log('MongoDB: FAILED')
    process.exitCode = 1
  } finally {
    await prisma.$disconnect().catch(() => undefined)
  }
}

void main().catch((error: unknown) => {
  console.error('[MongoDB] Connection failed', typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : 'DATABASE_CONNECTION_ERROR')
  console.log('MongoDB: FAILED')
  process.exitCode = 1
})
