import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'

const requiredNumber = z.preprocess((value) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return undefined
  return value
}, z.union([
  z.number().nonnegative(),
  z.string().trim().regex(/^\d+(?:\.\d+)?$/).transform((entry) => Number(entry)),
]))

const nullableNumber = z.preprocess((value) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null
  return value
}, z.union([
  z.number().nonnegative(),
  z.string().trim().regex(/^\d+(?:\.\d+)?$/).transform((entry) => Number(entry)),
]).nullable())

const optionalText = z.preprocess((value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' && value.trim() === '') return ''
  return value
}, z.union([z.string().trim().min(1), z.literal('')]).optional().nullable())

const courseSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().transform((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).pipe(z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  category: z.string().trim().min(2),
  type: z.string().trim().min(2),
  description: z.string().trim().min(10),
  price: requiredNumber,
  registrationFee: requiredNumber,
  duration: optionalText,
  frequency: optionalText,
  sessionDuration: optionalText,
  hourlyRate: nullableNumber.optional(),
  examIncluded: z.boolean().default(false),
  manualIncluded: z.boolean().default(false),
  preparationFees: nullableNumber.optional(),
  installments: z.array(z.string().trim().min(1)).default([]),
  image: z.preprocess((value) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return ''
    return value
  }, z.union([z.string().url(), z.literal('')]).nullable().optional()),
})
const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
const decimal = (value: number | null | undefined) => value === null || value === undefined ? null : value
const normalizeOptionalString = (value: string | null | undefined) => value === null || value === undefined || value === '' ? null : value

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const includeRegistrationCounts = req.query.includeInactive === 'true'
  const data = includeRegistrationCounts
    ? await prisma.course.findMany({ where: {}, orderBy: { createdAt: 'asc' }, include: { _count: { select: { registrations: true } } } }).then((courses) => Promise.all(courses.map(async (course) => ({
        ...course,
        registrationCount: course._count.registrations,
        hasActiveRegistration: Boolean(await prisma.registration.findFirst({ where: { courseId: course.id, status: { notIn: ['CANCELLED', 'REJECTED'] } }, select: { id: true } })),
      }))))
    : await prisma.course.findMany({ where: { isActive: true, archivedAt: null }, orderBy: { createdAt: 'asc' } })

  res.json({
    success: true,
    data,
  })
})

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(courseSchema, req.body) as {
    name: string
    slug: string
    category: string
    type: string
    description: string
    price: number
    registrationFee: number
    duration?: string | null
    frequency?: string | null
    sessionDuration?: string | null
    hourlyRate?: number | null
    examIncluded: boolean
    manualIncluded: boolean
    preparationFees?: number | null
    installments: string[]
    image?: string | null
  }
  const existingCourse = await prisma.course.findUnique({ where: { slug: payload.slug }, select: { id: true } })
  if (existingCourse) {
    throw new AppError('Une formation avec ce slug existe déjà. Choisissez un slug différent.', 409)
  }

  const course = await prisma.course.create({
    data: {
      ...payload,
      duration: normalizeOptionalString(payload.duration),
      frequency: normalizeOptionalString(payload.frequency),
      sessionDuration: normalizeOptionalString(payload.sessionDuration),
      image: normalizeOptionalString(payload.image),
      hourlyRate: decimal(payload.hourlyRate),
      preparationFees: decimal(payload.preparationFees),
    },
  })
  res.status(201).json({ success: true, data: course })
})

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(courseSchema.partial(), req.body) as Partial<{
    name: string
    slug: string
    category: string
    type: string
    description: string
    price: number
    registrationFee: number
    duration: string | null
    frequency: string | null
    sessionDuration: string | null
    hourlyRate: number | null
    examIncluded: boolean
    manualIncluded: boolean
    preparationFees: number | null
    installments: string[]
    image: string | null
  }>
  const existing = await prisma.course.findUnique({ where: { id: getId(req) } })
  if (!existing) throw new AppError('Formation introuvable.', 404)
  const course = await prisma.course.update({
    where: { id: existing.id },
    data: {
      ...payload,
      ...(payload.duration !== undefined ? { duration: normalizeOptionalString(payload.duration) } : {}),
      ...(payload.frequency !== undefined ? { frequency: normalizeOptionalString(payload.frequency) } : {}),
      ...(payload.sessionDuration !== undefined ? { sessionDuration: normalizeOptionalString(payload.sessionDuration) } : {}),
      ...(payload.image !== undefined ? { image: normalizeOptionalString(payload.image) } : {}),
      ...(payload.hourlyRate !== undefined ? { hourlyRate: decimal(payload.hourlyRate) } : {}),
      ...(payload.preparationFees !== undefined ? { preparationFees: decimal(payload.preparationFees) } : {}),
    },
  })
  res.json({ success: true, data: course })
})

export const setCourseActive = asyncHandler(async (req: Request, res: Response) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body)
  const existing = await prisma.course.findUnique({ where: { id: getId(req) } })
  if (!existing) throw new AppError('Formation introuvable.', 404)
  const course = await prisma.course.update({ where: { id: existing.id }, data: { isActive: active } })
  res.json({ success: true, data: course })
})
