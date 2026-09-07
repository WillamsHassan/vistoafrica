import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../utils/appError'

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route introuvable: ${req.method} ${req.originalUrl}`, 404))
}
