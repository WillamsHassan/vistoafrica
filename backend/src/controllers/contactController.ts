import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(30),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(5000),
})

const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)

export const createContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(contactSchema, req.body)
  const message = await prisma.contactMessage.create({ data: payload })
  res.status(201).json({ success: true, data: { id: message.id, message: 'Message envoyé avec succès.' } })
})

export const getContactMessages = asyncHandler(async (_req: Request, res: Response) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ success: true, data: messages })
})

export const getUnreadContactMessageCount = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.contactMessage.count({ where: { isRead: false, isArchived: false } })
  res.json({ success: true, data: { count } })
})

export const updateContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const payload = z.object({ isRead: z.boolean().optional(), isArchived: z.boolean().optional() }).refine((value) => value.isRead !== undefined || value.isArchived !== undefined).parse(req.body)
  const existing = await prisma.contactMessage.findUnique({ where: { id: getId(req) } })
  if (!existing) throw new AppError('Message introuvable.', 404)
  const message = await prisma.contactMessage.update({ where: { id: existing.id }, data: payload })
  res.json({ success: true, data: message })
})

export const deleteContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.contactMessage.findUnique({ where: { id: getId(req) } })
  if (!existing) throw new AppError('Message introuvable.', 404)
  await prisma.contactMessage.delete({ where: { id: existing.id } })
  res.json({ success: true, data: { id: existing.id } })
})