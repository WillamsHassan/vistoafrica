import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'

const updateSchema = z.object({ notes: z.string().max(2000).nullable().optional(), amount: z.number().positive().optional() })
const statusSchema = z.object({ action: z.enum(['confirm', 'cancel']) })
const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)

const registrationInclude = { student: true, course: true, payments: true, invoice: true } as const

export const getAdminRegistrations = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : ''
  const where = {
    ...(status ? { status: status as never } : {}),
    ...(courseId ? { courseId } : {}),
    ...(search ? { OR: [{ id: { contains: search, mode: 'insensitive' as const } }, { student: { OR: [{ firstName: { contains: search, mode: 'insensitive' as const } }, { lastName: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] } }] } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.registration.findMany({ where, include: registrationInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.registration.count({ where }),
  ])
  res.json({ success: true, data: { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } })
})

export const getAdminRegistrationById = asyncHandler(async (req: Request, res: Response) => {
  const registration = await prisma.registration.findUnique({ where: { id: getId(req) }, include: registrationInclude })
  if (!registration) throw new AppError('Inscription introuvable.', 404)
  res.json({ success: true, data: registration })
})

export const updateAdminRegistration = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(updateSchema, req.body)
  const registration = await prisma.registration.findUnique({ where: { id: getId(req) } })
  if (!registration) throw new AppError('Inscription introuvable.', 404)
  if (['CONFIRMED', 'CANCELLED', 'REJECTED'].includes(registration.status)) throw new AppError('Cette inscription est clôturée et ne peut plus être modifiée.', 409)
  const updated = await prisma.registration.update({ where: { id: registration.id }, data: payload, include: registrationInclude })
  res.json({ success: true, data: updated })
})

export const changeAdminRegistrationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { action } = validateBody(statusSchema, req.body)
  const registration = await prisma.registration.findUnique({ where: { id: getId(req) }, include: { payments: true } })
  if (!registration) throw new AppError('Inscription introuvable.', 404)
  if (action === 'confirm') {
    if (registration.status !== 'PAYMENT_VERIFIED') throw new AppError('Une inscription doit avoir un paiement vérifié avant confirmation.', 409)
    const updated = await prisma.registration.update({ where: { id: registration.id }, data: { status: 'CONFIRMED' }, include: registrationInclude })
    res.json({ success: true, data: updated }); return
  }
  if (['CONFIRMED', 'CANCELLED', 'REJECTED'].includes(registration.status)) throw new AppError('Cette inscription ne peut plus être annulée.', 409)
  const updated = await prisma.registration.update({ where: { id: registration.id }, data: { status: 'CANCELLED' }, include: registrationInclude })
  res.json({ success: true, data: updated })
})

const pdfEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
const makePdf = (lines: string[]) => {
  const stream = `BT\n/F1 12 Tf\n50 780 Td\n${lines.map((line, index) => `${index ? '0 -22 Td\n' : ''}(${pdfEscape(line)}) Tj`).join('\n')}\nET`
  const objects = [`<< /Type /Catalog /Pages 2 0 R >>`, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`]
  let pdf = '%PDF-1.4\n'; const offsets = [0]
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

export const downloadAdminRegistrationPdf = asyncHandler(async (req: Request, res: Response) => {
  const registration = await prisma.registration.findUnique({ where: { id: getId(req) }, include: { student: true, course: true } })
  if (!registration) throw new AppError('Inscription introuvable.', 404)
  const pdf = makePdf(['VISTOAFRIKA - INSCRIPTION', `Numero: ${registration.id}`, `Etudiant: ${registration.student.firstName} ${registration.student.lastName}`, `Email: ${registration.student.email}`, `Formation: ${registration.course.name}`, `Montant: ${registration.amount} FCFA`, `Statut: ${registration.status}`, `Date: ${registration.createdAt.toLocaleDateString('fr-FR')}`])
  res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="inscription-${registration.id}.pdf"`); res.send(pdf)
})