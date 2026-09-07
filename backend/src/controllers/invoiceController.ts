import type { Request, Response } from 'express'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { readInvoicePdf } from '../services/invoiceService'

const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)

export const downloadInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: getId(req) } })
  if (!invoice) throw new AppError('Facture introuvable.', 404)

  let pdf: Buffer
  try {
    pdf = await readInvoicePdf(invoice.storageKey)
  } catch {
    throw new AppError('Le fichier de facture est indisponible.', 404)
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
  res.setHeader('Content-Length', pdf.length)
  res.send(pdf)
})
