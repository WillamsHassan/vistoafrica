import type { Request, Response } from 'express'
import { randomBytes } from 'node:crypto'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'
import { z } from 'zod'
import { emailService } from '../services/emailService'

const registrationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional().or(z.literal('')),
  city: z.string().min(2).optional().or(z.literal('')),
  courseId: z.string().min(1),
  notes: z.string().optional(),
})

export const createRegistration = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(registrationSchema, req.body)

  const course = await prisma.course.findFirst({ where: { OR: [{ id: payload.courseId }, { slug: payload.courseId }] } })
  if (!course) {
    throw new AppError('Formation introuvable.', 404)
  }

  const student = await prisma.student.upsert({
    where: { email: payload.email },
    update: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone || null,
      city: payload.city || null,
    },
    create: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone || null,
      city: payload.city || null,
    },
  })

  const registration = await prisma.registration.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      accessToken: randomBytes(32).toString('hex'),
      amount: course.price.add(course.registrationFee),
      status: 'PAYMENT_PENDING',
      notes: payload.notes ?? null,
    },
    include: {
      student: true,
      course: true,
    },
  })

  const emailData = { firstName: registration.student.firstName, lastName: registration.student.lastName, email: registration.student.email, phone: registration.student.phone, courseName: registration.course.name, amount: registration.amount.toString(), registrationId: registration.id }
  void emailService.registrationRecorded(emailData)
  void emailService.paymentInstructions(emailData)

  res.status(201).json({
    success: true,
    data: { ...registration, accessToken: registration.accessToken },
  })
})

export const getRegistrationById = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      student: true,
      course: true,
      payments: true,
      invoice: true,
    },
  })

  if (!registration) {
    throw new AppError('Inscription introuvable.', 404)
  }

  res.json({
    success: true,
    data: registration,
  })
})
