import dotenv from 'dotenv'
import { resolve } from 'node:path'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const getDatabaseName = (uri: string) => {
  try {
    const path = new URL(uri).pathname.replace(/^\//, '')
    return path ? decodeURIComponent(path) : 'non spécifiée'
  } catch {
    return 'indéterminée'
  }
}

const main = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim() ?? ''
  console.log(`MONGODB_URI : ${mongoUri ? 'présente' : 'absente'}`)
  console.log(`Base MongoDB : ${mongoUri ? getDatabaseName(mongoUri) : 'indisponible'}`)

  if (!mongoUri) {
    process.exitCode = 1
    return
  }

  const { prisma } = await import('../config/prisma.js')

  try {
    const modelAvailable = typeof prisma.admin?.findMany === 'function'
    console.log(`Modèle Admin disponible : ${modelAvailable ? 'oui' : 'non'}`)
    if (!modelAvailable) {
      process.exitCode = 1
      return
    }

    const admins = await prisma.admin.findMany({
      select: { email: true, createdAt: true, role: true, passwordHash: true },
    })
    console.log(`Nombre d’administrateurs : ${admins.length}`)

    for (const admin of admins) {
      const bcryptHashFormatValid = /^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(admin.passwordHash)
      console.log(JSON.stringify({
        email: admin.email,
        createdAt: admin.createdAt.toISOString(),
        role: admin.role,
        status: 'aucun champ de statut dans le modèle Admin',
        bcryptHashFormatValid,
      }))
    }

    const dataCounts = Object.fromEntries(await Promise.all([
      prisma.course.count().then((count) => ['courses', count] as const),
      prisma.student.count().then((count) => ['students', count] as const),
      prisma.registration.count().then((count) => ['registrations', count] as const),
      prisma.payment.count().then((count) => ['payments', count] as const),
      prisma.contactMessage.count().then((count) => ['contactMessages', count] as const),
      prisma.siteSetting.count().then((count) => ['siteSettings', count] as const),
      prisma.invoice.count().then((count) => ['invoices', count] as const),
    ]))
    console.log(`Comptages des données : ${JSON.stringify(dataCounts)}`)
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : 'DATABASE_QUERY_FAILED'
    console.error(`Inspection MongoDB impossible (${code}). URI et identifiants masqués.`)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect().catch(() => undefined)
  }
}

void main().catch((error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : 'DATABASE_CONNECTION_FAILED'
  console.error(`Inspection MongoDB impossible (${code}). URI et identifiants masqués.`)
  process.exitCode = 1
})