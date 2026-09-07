import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'

const courseSchema = z.object({ name: z.string().trim().min(2), slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), category: z.string().trim().min(2), type: z.string().trim().min(2), description: z.string().trim().min(10), price: z.number().nonnegative(), registrationFee: z.number().nonnegative(), duration: z.string().trim().min(1).optional().or(z.literal('')), frequency: z.string().trim().min(1).optional().or(z.literal('')), sessionDuration: z.string().trim().min(1).optional().or(z.literal('')), hourlyRate: z.number().nonnegative().nullable().optional(), examIncluded: z.boolean().default(false), manualIncluded: z.boolean().default(false), preparationFees: z.number().nonnegative().nullable().optional(), installments: z.array(z.string().trim().min(1)).default([]), image: z.string().url().nullable().optional().or(z.literal('')) })
const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
const decimal = (value: number | null | undefined) => value === null || value === undefined ? null : value

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    where: req.query.includeInactive === 'true' ? {} : { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  res.json({
    success: true,
    data: courses,
  })
})

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(courseSchema, req.body)
  const course = await prisma.course.create({ data: { ...payload, duration: payload.duration || null, frequency: payload.frequency || null, sessionDuration: payload.sessionDuration || null, image: payload.image || null, hourlyRate: decimal(payload.hourlyRate), preparationFees: decimal(payload.preparationFees) } })
  res.status(201).json({ success: true, data: course })
})

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(courseSchema.partial(), req.body)
  const existing = await prisma.course.findUnique({ where: { id: getId(req) } })
  if (!existing) throw new AppError('Formation introuvable.', 404)
  const course = await prisma.course.update({ where: { id: existing.id }, data: { ...payload, ...(payload.duration !== undefined ? { duration: payload.duration || null } : {}), ...(payload.frequency !== undefined ? { frequency: payload.frequency || null } : {}), ...(payload.sessionDuration !== undefined ? { sessionDuration: payload.sessionDuration || null } : {}), ...(payload.image !== undefined ? { image: payload.image || null } : {}), ...(payload.hourlyRate !== undefined ? { hourlyRate: decimal(payload.hourlyRate) } : {}), ...(payload.preparationFees !== undefined ? { preparationFees: decimal(payload.preparationFees) } : {}) } })
  res.json({ success: true, data: course })
})

export const setCourseActive = asyncHandler(async (req: Request, res: Response) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body)
  const existing = await prisma.course.findUnique({ where: { id: getId(req) } })
  if (!existing) throw new AppError('Formation introuvable.', 404)
  const course = await prisma.course.update({ where: { id: existing.id }, data: { isActive: active } })
  res.json({ success: true, data: course })
})
