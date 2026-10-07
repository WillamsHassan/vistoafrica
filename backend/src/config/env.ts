import dotenv from 'dotenv'
import { resolve } from 'node:path'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const nodeEnv = process.env.NODE_ENV ?? 'development'
const jwtSecret = process.env.JWT_SECRET ?? ''
const mongoUri = process.env.MONGODB_URI ?? ''

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV doit être development, test ou production.')
}

if (nodeEnv === 'production' && jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET doit contenir au moins 32 caractères en production.',
  )
}

if (nodeEnv === 'production' && !mongoUri) {
  throw new Error('Configuration manquante : définissez MONGODB_URI dans les variables d’environnement du service (Render → Environment). DATABASE_URL PostgreSQL ne remplace pas MONGODB_URI.')
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
  analyticsRetentionDays: Math.max(Number(process.env.ANALYTICS_RETENTION_DAYS ?? 90) || 90, 1),

  // Base de données
  mongoUri: mongoUri || 'mongodb://127.0.0.1:27017/vistoafrica',
  databaseUrl: mongoUri || 'mongodb://127.0.0.1:27017/vistoafrica',
  postgresqlSourceUrl: process.env.POSTGRESQL_SOURCE_URL ?? process.env.DATABASE_URL ?? '',

  // JWT
  jwtSecret,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',

  // Sécurité
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),

  // Administrateur
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? '',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD ?? '',

  // ================================
  // EMAIL - NODEMAILER + GMAIL
  // ================================

  emailUser: process.env.EMAIL_USER ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
  emailTo: process.env.EMAIL_TO ?? '',
  emailAppPassword: process.env.EMAIL_APP_PASSWORD ?? '',

  // Environnement
  nodeEnv,

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}