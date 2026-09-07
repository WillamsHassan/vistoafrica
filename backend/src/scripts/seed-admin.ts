import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

import { prisma } from '../config/prisma'
import { env } from '../config/env'

dotenv.config()

const run = async () => {
  const email = env.superAdminEmail
  const password = env.superAdminPassword

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD doivent être définis dans les variables d’environnement.')
  }

  const existing = await prisma.admin.findUnique({ where: { email } })

  if (existing) {
    const isPasswordUpdated = await bcrypt.compare(password, existing.passwordHash)
    if (!isPasswordUpdated) {
      await prisma.admin.update({ where: { id: existing.id }, data: { passwordHash: await bcrypt.hash(password, env.bcryptRounds) } })
    }
    console.log(`Super administrateur prêt: ${email}`)
  } else {
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds)

    await prisma.admin.create({
      data: {
        fullName: 'Super Administrateur',
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    })
  }

  const settings = {
    payment_mtn_number: process.env.PAYMENT_MTN_NUMBER ?? '653215578',
    payment_mtn_holder: process.env.PAYMENT_MTN_HOLDER ?? 'M. Tchinda Pascal',
    payment_orange_number: process.env.PAYMENT_ORANGE_NUMBER ?? '656040010',
    payment_orange_holder: process.env.PAYMENT_ORANGE_HOLDER ?? 'Mafouo Tchinda',
    payment_whatsapp: process.env.PAYMENT_WHATSAPP ?? '658818863',
    contact_email: process.env.CONTACT_EMAIL ?? process.env.CONTACT_PRIMARY_EMAIL ?? 'adminvistoafrica@gmail.com',
    contact_phone: process.env.CONTACT_PHONE ?? '658818863',
    contact_address: process.env.CONTACT_ADDRESS ?? 'Douala, Cameroun',
  }
  await Promise.all(Object.entries(settings).filter((entry): entry is [string, string] => Boolean(entry[1])).map(([key, value]) => prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })))

  console.log(`Super administrateur créé: ${email}`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur seed admin:', error)
    process.exit(1)
  })
