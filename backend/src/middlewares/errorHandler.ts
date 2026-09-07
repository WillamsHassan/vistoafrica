import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../utils/appError'

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (!(error instanceof AppError)) console.error('[HTTP] Erreur interne:', error)
  const statusCode = error instanceof AppError ? error.statusCode : 500
  const message = error instanceof AppError ? error.message : 'Une erreur interne s’est produite.'

  res.status(statusCode).json({
    success: false,
    message,
    ...(error instanceof AppError && error.details !== undefined ? { details: error.details } : {}),
  })
}
