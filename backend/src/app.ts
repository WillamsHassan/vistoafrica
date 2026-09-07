import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { env } from './config/env'
import { prisma } from './config/prisma'
import { errorHandler } from './middlewares/errorHandler'
import { notFoundHandler } from './middlewares/notFoundHandler'
import routes from './routes'

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin: env.allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '256kb' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }))
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Trop de tentatives. Réessayez plus tard.' } }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ success: true, status: 'ok', database: 'ok' })
  } catch (error) {
    console.error('[Health] Base de données indisponible:', error)
    res.status(503).json({ success: false, status: 'degraded', database: 'unavailable' })
  }
})

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

