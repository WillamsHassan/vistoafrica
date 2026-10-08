import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import { z } from 'zod'

import { signAdminToken } from '../config/jwt'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(loginSchema, req.body)
  const email = payload.email.trim().toLowerCase()

  const admin = await prisma.admin.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })

  if (!admin) {
    throw new AppError('Identifiants invalides.', 401)
  }

  const isPasswordValid = await bcrypt.compare(payload.password, admin.passwordHash)
  if (!isPasswordValid) {
    throw new AppError('Identifiants invalides.', 401)
  }

  const token = signAdminToken({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
  })

  res.json({
    success: true,
    data: {
      token,
      expiresIn: '8h',
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    },
  })
})

export const getAdminMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Utilisateur non authentifié.', 401)
  }

  const admin = await prisma.admin.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!admin) {
    throw new AppError('Compte administrateur introuvable.', 404)
  }

  res.json({
    success: true,
    data: admin,
  })
})

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalStudents,
    newRegistrations,
    pendingPayments,
    paymentsToVerify,
    confirmedPayments,
    confirmedRegistrations,
    revenue,
    recentRegistrations,
    recentPayments,
    paymentAlerts,
    monthlyRegistrations,
    monthlyPayments,
    unreadMessages,
  ] = await Promise.all([
    prisma.student.count({ where: { deletedAt: null } }),
    prisma.registration.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.count({ where: { status: 'PENDING', archivedAt: null } }),
    prisma.payment.count({ where: { status: 'DECLARED', archivedAt: null } }),
    prisma.payment.count({ where: { status: 'VERIFIED', archivedAt: null } }),
    prisma.registration.count({ where: { status: 'CONFIRMED' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED', archivedAt: null } }),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { student: true, course: true },
    }),
    prisma.payment.findMany({
      take: 5,
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { registration: { include: { student: true } } },
    }),
    prisma.payment.findMany({
      take: 5,
      where: { status: 'DECLARED', archivedAt: null },
      orderBy: { declaredAt: 'asc' },
      include: { registration: { include: { student: true } } },
    }),
    prisma.registration.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: 'VERIFIED', archivedAt: null },
      select: { createdAt: true, amount: true },
    }),
    prisma.contactMessage.count({ where: { isRead: false, isArchived: false } }),
  ])

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString('fr-FR', { month: 'short' }) }
  })

  const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`
  const statistics = months.map((month) => ({
    label: month.label,
    registrations: monthlyRegistrations.filter((item) => getMonthKey(item.createdAt) === month.key).length,
    revenue: monthlyPayments
      .filter((item) => getMonthKey(item.createdAt) === month.key)
      .reduce((total, item) => total + Number(item.amount), 0),
  }))

  res.json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        newRegistrations,
        pendingPayments,
        paymentsToVerify,
        confirmedPayments,
        confirmedRegistrations,
        revenue: Number(revenue._sum.amount ?? 0),
        unreadMessages,
      },
      statistics,
      recentRegistrations,
      recentPayments,
      paymentAlerts,
    },
  })
})
