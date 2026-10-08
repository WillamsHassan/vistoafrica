import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { resolve } from 'node:path'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const main = async () => {
  const email = process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase() ?? ''
  const password = process.env.ADMIN_RESET_PASSWORD ?? ''
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12)

  if (!process.env.MONGODB_URI?.trim()) throw new Error('MONGODB_URI_MISSING')
  if (!email) throw new Error('ADMIN_RESET_EMAIL_MISSING')
  if (password.length < 12) throw new Error('ADMIN_RESET_PASSWORD_MUST_BE_AT_LEAST_12_CHARACTERS')
  if (!Number.isInteger(rounds) || rounds < 4 || rounds > 31) throw new Error('INVALID_BCRYPT_ROUNDS')

  const { prisma } = await import('../config/prisma.js')

  try {
    const admins = await prisma.admin.findMany({ select: { id: true, email: true } })
    const admin = admins.find((candidate) => candidate.email.trim().toLowerCase() === email)
    if (!admin) throw new Error('ADMIN_NOT_FOUND; no account was created or modified')

    const passwordHash = await bcrypt.hash(password, rounds)
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } })

    const updatedAdmin = await prisma.admin.findUnique({ where: { id: admin.id }, select: { passwordHash: true } })
    if (!updatedAdmin || !(await bcrypt.compare(password, updatedAdmin.passwordHash))) {
      throw new Error('PASSWORD_RESET_VERIFICATION_FAILED')
    }

    console.log('Mot de passe administrateur réinitialisé et vérifié. Aucun autre champ ni compte modifié.')
  } finally {
    await prisma.$disconnect().catch(() => undefined)
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'ADMIN_PASSWORD_RESET_FAILED'
  console.error(`Échec de la réinitialisation : ${message}. Aucun secret n’a été affiché.`)
  process.exitCode = 1
})