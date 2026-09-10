import type { Request, Response } from 'express'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { generateInvoicePdf, readInvoicePdf } from '../services/invoiceService'

const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)

const getInvoicePdf = async (invoice: Awaited<ReturnType<typeof prisma.invoice.findUnique>>) => {
  if (!invoice) throw new AppError('Facture introuvable.', 404)
  try {
    return await readInvoicePdf(invoice.storageKey)
  } catch {
    const fullInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { registration: { include: { student: true, course: true } }, payment: true } })
    if (!fullInvoice) throw new AppError('Facture introuvable.', 404)
    await generateInvoicePdf({ invoiceNumber: fullInvoice.invoiceNumber, registrationNumber: fullInvoice.registration.id, firstName: fullInvoice.registration.student.firstName, lastName: fullInvoice.registration.student.lastName, phone: fullInvoice.registration.student.phone, email: fullInvoice.registration.student.email, courseName: fullInvoice.registration.course.name, amount: fullInvoice.total.toString(), paymentMethod: fullInvoice.payment.method, paymentDate: fullInvoice.payment.reviewedAt ?? fullInvoice.payment.updatedAt, paymentStatus: fullInvoice.payment.status, paymentReference: fullInvoice.payment.reference }, fullInvoice.storageKey)
    await prisma.invoice.update({ where: { id: fullInvoice.id }, data: { generatedAt: new Date() } })
    return readInvoicePdf(fullInvoice.storageKey)
  }
}

export const getAdminInvoices = asyncHandler(async (_req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: 'desc' },
    include: {
      registration: { include: { student: true, course: true } },
      payment: true,
    },
  })

  res.json({ success: true, data: invoices })
})

export const downloadInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: getId(req) } })
  if (!invoice) throw new AppError('Facture introuvable.', 404)

  const pdf = await getInvoicePdf(invoice)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
  res.setHeader('Content-Length', pdf.length)
  res.send(pdf)
})
