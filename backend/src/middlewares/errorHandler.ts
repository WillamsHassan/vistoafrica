import { Prisma } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../utils/appError'

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
    const message = target.includes('slug')
      ? 'Une formation avec ce slug existe déjà. Choisissez un slug différent.'
      : 'Une valeur identique existe déjà pour un champ qui doit être unique.'

    res.status(409).json({ success: false, message })
    return
  }

  if (!(error instanceof AppError)) console.error('[HTTP] Erreur interne:', error)
  const statusCode = error instanceof AppError ? error.statusCode : 500
  const message = error instanceof AppError ? error.message : 'Une erreur interne s’est produite.'

  res.status(statusCode).json({
    success: false,
    message,
    ...(error instanceof AppError && error.details !== undefined ? { details: error.details } : {}),
  })
}
