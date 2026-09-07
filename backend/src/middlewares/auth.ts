import type { NextFunction, Request, Response } from 'express'

import { verifyAdminToken } from '../config/jwt'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'

export const protectAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token d’authentification manquant.', 401))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAdminToken(token)

    const admin = await prisma.admin.findUnique({ where: { id: payload.id }, select: { id: true, email: true, fullName: true, role: true } })
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) return next(new AppError('Compte administrateur invalide.', 401))
    req.user = admin

    next()
  } catch {
    next(new AppError('Token invalide ou expiré.', 401))
  }
}
