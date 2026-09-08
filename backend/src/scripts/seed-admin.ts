import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

import { prisma } from '../config/prisma'
import { env } from '../config/env'

dotenv.config()

const courses = [
  { slug: 'italien-en-ligne', name: 'Italien en ligne', type: 'Formation en ligne', description: 'Cours d’italien en ligne pour progresser rapidement en communication, écriture et compréhension orale.', category: 'Italien', duration: '6 mois', frequency: '3 fois/semaine', sessionDuration: '2h30', price: 300000, registrationFee: 10000, hourlyRate: 1000, examIncluded: false, manualIncluded: false, installments: ['100000 XAF', '100000 XAF', '100000 XAF'], image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'italien-a-domicile', name: 'Italien à domicile', type: 'Formation à domicile', description: 'Accompagnement personnalisé en italien à domicile avec suivi pédagogique.', category: 'Italien', duration: '6 mois', frequency: '3 fois/semaine', sessionDuration: '3h', price: 420000, registrationFee: 10000, hourlyRate: 1500, examIncluded: true, manualIncluded: true, installments: ['140000 XAF', '140000 XAF', '140000 XAF'], image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80' },
  { slug: 'italien-presentiel', name: 'Italien en présentiel', type: 'Formation présentielle', description: 'Formation immersive en italien en présentiel avec préparation à l’examen CELI.', category: 'Italien', duration: '6 mois', frequency: '5 fois/semaine', sessionDuration: '2h30', price: 410000, registrationFee: 10000, examIncluded: true, manualIncluded: true, installments: ['150000 XAF', '130000 XAF', '130000 XAF'], image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'anglais-en-ligne', name: 'Anglais en ligne', type: 'Formation en ligne', description: 'Apprentissage de l’anglais orienté études, travail, voyage et mobilité internationale.', category: 'Anglais', duration: '6 mois', frequency: '3 fois/semaine', sessionDuration: '2h30', price: 280000, registrationFee: 10000, examIncluded: false, manualIncluded: false, installments: ['80000 XAF', '100000 XAF', '100000 XAF'], image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80' },
  { slug: 'anglais-a-domicile', name: 'Anglais à domicile', type: 'Formation à domicile', description: 'Forfait d’anglais à domicile avec accompagnement personnalisé et suivi régulier.', category: 'Anglais', duration: '6 mois', frequency: '3 fois/semaine', sessionDuration: '2h30', price: 390000, registrationFee: 10000, preparationFees: 60000, examIncluded: false, manualIncluded: false, installments: ['100000 XAF', '140000 XAF', '150000 XAF'], image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'anglais-presentiel', name: 'Anglais en présentiel', type: 'Formation présentielle', description: 'Formation présentielle en anglais avec un rythme régulier et un suivi concret.', category: 'Anglais', duration: '6 mois', frequency: '3 fois/semaine', sessionDuration: '2h', price: 390000, registrationFee: 10000, examIncluded: false, manualIncluded: false, installments: ['130000 XAF', '130000 XAF', '130000 XAF'], image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80' },
]

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

  await Promise.all(courses.map((course) => prisma.course.upsert({
    where: { slug: course.slug },
    update: course,
    create: course,
  })))

  console.log(`Données initiales prêtes: ${email}, ${courses.length} formations`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur seed admin:', error)
    process.exit(1)
  })
