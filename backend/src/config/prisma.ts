import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & { vistoafricaPrisma?: PrismaClient }

export const prisma = globalForPrisma.vistoafricaPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

globalForPrisma.vistoafricaPrisma = prisma
