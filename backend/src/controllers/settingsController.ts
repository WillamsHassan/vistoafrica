import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'

export const settingKeys = ['payment_mtn_number', 'payment_mtn_holder', 'payment_orange_number', 'payment_orange_holder', 'payment_whatsapp', 'contact_email', 'contact_phone', 'contact_address'] as const

const settingsSchema = z.object({
  payment_mtn_number: z.string().trim().min(6).max(30),
  payment_mtn_holder: z.string().trim().min(2).max(120),
  payment_orange_number: z.string().trim().min(6).max(30),
  payment_orange_holder: z.string().trim().min(2).max(120),
  payment_whatsapp: z.string().trim().min(6).max(30),
  contact_email: z.string().trim().email(),
  contact_phone: z.string().trim().min(6).max(30),
  contact_address: z.string().trim().min(3).max(250),
})

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.siteSetting.findMany({ where: { key: { in: [...settingKeys] } }, orderBy: { key: 'asc' } })

  const normalized = Object.fromEntries(
    settings.map((setting: { key: string; value: string }) => [setting.key, setting.value]),
  )

  res.json({
    success: true,
    data: normalized,
  })
})

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const payload = settingsSchema.safeParse(req.body)
  if (!payload.success) throw new AppError('Les paramètres fournis sont invalides.', 400)

  await prisma.$transaction(Object.entries(payload.data).map(([key, value]) => prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, description: 'Paramètre modifiable depuis l’administration' },
  })))

  res.json({ success: true, data: payload.data })
})
