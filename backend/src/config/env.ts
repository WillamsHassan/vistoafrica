import dotenv from 'dotenv'

dotenv.config()

const nodeEnv = process.env.NODE_ENV ?? 'development'
const jwtSecret = process.env.JWT_SECRET ?? ''
const databaseUrl = process.env.DATABASE_URL ?? ''

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV doit être development, test ou production.')
}

if (nodeEnv === 'production' && jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET doit contenir au moins 32 caractères en production.',
  )
}

if (nodeEnv === 'production' && !databaseUrl) {
  throw new Error('DATABASE_URL doit être défini en production.')
}

if (nodeEnv === 'production' && !process.env.EMAIL_USER) {
  throw new Error('EMAIL_USER doit être défini en production.')
}

if (nodeEnv === 'production' && !process.env.EMAIL_APP_PASSWORD) {
  throw new Error('EMAIL_APP_PASSWORD doit être défini en production.')
}

if (nodeEnv === 'production' && !process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS doit être défini en production.')
}

export const env = {
  // Serveur
  port: Number(process.env.PORT ?? 5000),
  pdfStoragePath: process.env.PDF_STORAGE_PATH ?? 'storage/invoices',

  // Base de données
  databaseUrl:
    databaseUrl ||
    'postgresql://postgres:postgres@localhost:5432/vistoafrica?schema=public',

  // JWT
  jwtSecret:
    jwtSecret || 'local-development-only-secret-change-me',

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN ?? '8h',

  // Sécurité
  bcryptRounds:
    Number(process.env.BCRYPT_ROUNDS ?? 12),

  // Administrateur
  superAdminEmail:
    process.env.SUPER_ADMIN_EMAIL ??
    'adminvistoafrica@gmail.com',

  superAdminPassword:
    process.env.SUPER_ADMIN_PASSWORD ??
    'ChangeThisPassword123!',

  // ================================
  // EMAIL - NODEMAILER + GMAIL
  // ================================

  emailUser:
    process.env.EMAIL_USER ??
    'adminvistoafrica@gmail.com',

  emailFrom:
    process.env.EMAIL_FROM ??
    'VISTOAFRIKA <adminvistoafrica@gmail.com>',

  emailTo:
    process.env.EMAIL_TO ??
    'adminvistoafrica@gmail.com',

  emailAppPassword:
    process.env.EMAIL_APP_PASSWORD ?? '',

  // Environnement
  nodeEnv,

  // CORS
  allowedOrigins:
    (process.env.ALLOWED_ORIGINS ??
      'http://localhost:5173,http://localhost:4173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
}