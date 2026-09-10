import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { generateInvoicePdf, readInvoicePdf } from '../services/invoiceService'
import { validateBody } from '../utils/validate'

const studentUpdateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional().or(z.literal('')),
  city: z.string().min(2).optional().or(z.literal('')),
})

const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : ''
  const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : ''
  const status = typeof req.query.status === 'string' ? req.query.status : ''

  const where = {
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
    ...(courseId || status
      ? {
          registrations: {
            some: {
              ...(courseId ? { courseId } : {}),
              ...(status ? { status: status as never } : {}),
            },
          },
        }
      : {}),
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { course: true },
        },
      },
    }),
    prisma.student.count({ where }),
  ])

  res.json({
    success: true,
    data: {
      items: students,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    },
  })
})

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: getId(req) },
    include: {
      registrations: {
        orderBy: { createdAt: 'desc' },
        include: { course: true, payments: true, invoice: true },
      },
    },
  })

  if (!student) throw new AppError('Étudiant introuvable.', 404)

  res.json({ success: true, data: student })
})

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(studentUpdateSchema, req.body)
  const id = getId(req)
  const existing = await prisma.student.findUnique({ where: { id } })

  if (!existing) throw new AppError('Étudiant introuvable.', 404)

  const student = await prisma.student.update({
    where: { id },
    data: { ...payload, phone: payload.phone || null, city: payload.city || null },
  })

  res.json({ success: true, data: student })
})

export const downloadStudentInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = Array.isArray(req.params.invoiceId) ? req.params.invoiceId[0] : req.params.invoiceId
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      registration: { studentId: getId(req) },
    },
    include: { registration: { include: { student: true, course: true } }, payment: true },
  })

  if (!invoice) throw new AppError('Facture introuvable.', 404)

  let pdf: Buffer
  try {
    pdf = await readInvoicePdf(invoice.storageKey)
  } catch {
    await generateInvoicePdf({ invoiceNumber: invoice.invoiceNumber, registrationNumber: invoice.registration.id, firstName: invoice.registration.student.firstName, lastName: invoice.registration.student.lastName, phone: invoice.registration.student.phone, email: invoice.registration.student.email, courseName: invoice.registration.course.name, amount: invoice.total.toString(), paymentMethod: invoice.payment.method, paymentDate: invoice.payment.reviewedAt ?? invoice.issuedAt, paymentStatus: invoice.payment.status, paymentReference: invoice.payment.reference }, invoice.storageKey)
    pdf = await readInvoicePdf(invoice.storageKey)
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
  res.setHeader('Content-Length', pdf.length)
  res.send(pdf)
})