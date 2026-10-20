import type { Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'
import {
  generateInvoicePdf,
  invoiceStorageKey,
} from '../services/invoiceService'
import { emailService } from '../services/emailService'
import {
  canDeclarePayment,
  reviewPaymentStatus,
} from '../services/paymentWorkflow'

const paymentSchema = z.object({
  registrationId: z.string().min(1),
  accessToken: z.string().length(64),
  method: z.enum(['MTN', 'ORANGE']),
  reference: z.string().min(1).optional(),
  accountName: z.string().min(1).optional(),
  proofUrl: z
    .string()
    .url()
    .refine(
      (value) => ['http:', 'https:'].includes(new URL(value).protocol),
      'URL de reçu invalide.',
    )
    .optional(),
})

const paymentActionSchema = z.object({
  action: z.enum(['confirm', 'reject']),
  comment: z.string().trim().max(2000).optional(),
})

const getId = (req: Request) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

const paymentInclude = {
  registration: {
    include: {
      student: true,
      course: true,
      invoice: true,
    },
  },
  actions: {
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const

/**
 * Déclare un paiement.
 */
export const createPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = validateBody(paymentSchema, req.body)

    const registration = await prisma.registration.findUnique({
      where: {
        id: payload.registrationId,
        accessToken: payload.accessToken,
      },
      include: {
        student: true,
        course: true,
      },
    })

    if (!registration) {
      throw new AppError(
        'Inscription introuvable pour ce paiement.',
        404,
      )
    }

    if (
      !canDeclarePayment(
        registration.status as
          | 'PAYMENT_PENDING'
          | 'REJECTED'
          | 'PAYMENT_DECLARED'
          | 'CONFIRMED',
      )
    ) {
      throw new AppError(
        'Cette inscription ne peut plus recevoir une déclaration de paiement.',
        409,
      )
    }

    const payment = await prisma.$transaction(async (transaction) => {
      const created = await transaction.payment.create({
        data: {
          registrationId: registration.id,
          method: payload.method,
          amount: registration.amount,
          reference: payload.reference ?? null,
          accountName: payload.accountName ?? null,
          proofUrl: payload.proofUrl ?? null,
          status: 'DECLARED',
        },
      })

      await transaction.registration.update({
        where: { id: registration.id },
        data: { status: 'PAYMENT_DECLARED' },
      })

      return created
    })

    const emailData = {
      firstName: registration.student.firstName,
      lastName: registration.student.lastName,
      email: registration.student.email,
      phone: registration.student.phone,
      courseName: registration.course.name,
      amount: payment.amount.toString(),
      registrationId: registration.id,
      paymentMethod: payment.method,
      paymentReference: payment.reference,
    }

    // L'envoi du mail ne doit pas ralentir la réponse HTTP.
    void emailService.paymentDeclared(emailData).catch((error) => {
      console.error(
        '[Payment] Échec inattendu du mail de déclaration :',
        error,
      )
    })

    res.status(201).json({
      success: true,
      data: payment,
    })
  },
)

/**
 * Liste les paiements non archivés.
 * Inclut les documents où archivedAt est absent de MongoDB.
 */
export const getAdminPayments = asyncHandler(
  async (_req: Request, res: Response) => {
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { archivedAt: null },
          { archivedAt: { isSet: false } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: paymentInclude,
    })

    res.json({
      success: true,
      data: payments,
    })
  },
)

/**
 * Confirme ou rejette un paiement.
 */
export const reviewPayment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Utilisateur non authentifié.', 401)
    }

    const payload = validateBody(paymentActionSchema, req.body)
    const paymentId = getId(req)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new AppError('Paiement introuvable.', 404)
    }

    if (payment.archivedAt) {
      throw new AppError(
        'Ce paiement est archivé. Restaurez-le depuis la corbeille avant de le traiter.',
        409,
      )
    }

    if (payment.status !== 'DECLARED') {
      throw new AppError(
        'Seuls les paiements déclarés peuvent être traités.',
        409,
      )
    }

    const transition = reviewPaymentStatus(
      payment.status as 'PENDING' | 'DECLARED' | 'VERIFIED' | 'REJECTED',
      payload.action,
    )

    const nextStatus = transition.payment
    const now = new Date()

    const updated = await prisma.$transaction(async (transaction) => {
      // Évite de confirmer deux fois le même paiement.
      const currentPayment = await transaction.payment.findUnique({
        where: { id: payment.id },
      })

      if (!currentPayment || currentPayment.status !== 'DECLARED') {
        throw new AppError(
          'Ce paiement a déjà été traité. Actualisez la page.',
          409,
        )
      }

      const reviewedPayment = await transaction.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          adminId: req.user!.id,
          reviewedAt: now,
          ...(nextStatus === 'VERIFIED'
            ? { verifiedAt: now }
            : {}),
        },
        include: paymentInclude,
      })

      await transaction.paymentAction.create({
        data: {
          paymentId: payment.id,
          adminId: req.user!.id,
          action: nextStatus,
          comment: payload.comment || null,
        },
      })

      if (nextStatus === 'VERIFIED') {
        await transaction.registration.update({
          where: { id: payment.registrationId },
          data: { status: 'CONFIRMED' },
        })

        const invoiceNumber =
          `VAF-${now.getFullYear()}-${randomBytes(4)
            .toString('hex')
            .toUpperCase()}`

        await transaction.invoice.upsert({
          where: {
            registrationId: payment.registrationId,
          },
          create: {
            registrationId: payment.registrationId,
            paymentId: payment.id,
            invoiceNumber,
            total: payment.amount,
            storageKey: invoiceStorageKey(invoiceNumber),
          },
          update: {},
        })
      }

      return reviewedPayment
    })

    if (nextStatus === 'VERIFIED') {
      // La confirmation en base est terminée.
      // Le PDF et les e-mails sont traités en arrière-plan.
      void finalizeVerifiedPayment(payment.registrationId).catch(
        (error) => {
          console.error(
            '[Payment] Erreur inattendue de finalisation :',
            error,
          )
        },
      )
    }

    if (nextStatus === 'REJECTED') {
      void notifyRejectedPayment(payment, payload.comment).catch(
        (error) => {
          console.error(
            '[Payment] Erreur inattendue de notification de rejet :',
            error,
          )
        },
      )
    }

    res.json({
      success: true,
      message:
        nextStatus === 'VERIFIED'
          ? 'Paiement confirmé. La facture et les notifications sont en cours de traitement.'
          : 'Paiement rejeté.',
      data: updated,
    })
  },
)

/**
 * Génère la facture et envoie les e-mails de confirmation.
 */
const finalizeVerifiedPayment = async (registrationId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { registrationId },
      include: {
        registration: {
          include: {
            student: true,
            course: true,
          },
        },
        payment: true,
      },
    })

    if (!invoice) {
      throw new AppError(
        'La facture n’a pas pu être créée.',
        500,
      )
    }

    const emailData = {
      firstName: invoice.registration.student.firstName,
      lastName: invoice.registration.student.lastName,
      email: invoice.registration.student.email,
      phone: invoice.registration.student.phone,
      courseName: invoice.registration.course.name,
      amount: invoice.total.toString(),
      registrationId: invoice.registration.id,
      paymentMethod: invoice.payment.method,
      paymentReference: invoice.payment.reference,
      invoiceNumber: invoice.invoiceNumber,
    }

    // Le PDF est généré avant l'envoi des deux notifications.
    const pdfPath = await generateInvoicePdf(
      {
        invoiceNumber: invoice.invoiceNumber,
        registrationNumber: invoice.registration.id,
        firstName: invoice.registration.student.firstName,
        lastName: invoice.registration.student.lastName,
        phone: invoice.registration.student.phone,
        email: invoice.registration.student.email,
        courseName: invoice.registration.course.name,
        amount: invoice.total.toString(),
        paymentMethod: invoice.payment.method,
        paymentDate:
          invoice.payment.reviewedAt ??
          invoice.payment.updatedAt,
        paymentStatus: invoice.payment.status,
        paymentReference: invoice.payment.reference,
      },
      invoice.storageKey,
    )

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { generatedAt: new Date() },
    })

    // Chaque envoi est indépendant : l'échec du premier
    // n'empêche pas de tenter le second.
    const results = await Promise.allSettled([
      emailService.paymentConfirmed(emailData),
      emailService.invoiceAvailable(emailData, pdfPath),
    ])

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          index === 0
            ? '[Payment] Échec du mail de confirmation.'
            : '[Payment] Échec du mail avec facture.',
          result.reason,
        )
      }
    })
  } catch (error) {
    console.error(
      '[Payment] Finalisation de facture échouée :',
      error,
    )
  }
}

/**
 * Notifie le client en cas de rejet.
 */
const notifyRejectedPayment = async (
  payment: {
    registrationId: string
    amount: { toString: () => string }
  },
  comment?: string,
) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: payment.registrationId },
      include: {
        student: true,
        course: true,
      },
    })

    if (!registration) {
      throw new AppError(
        'Inscription introuvable pour la notification de rejet.',
        404,
      )
    }

    await emailService.paymentRejected(
      {
        firstName: registration.student.firstName,
        lastName: registration.student.lastName,
        email: registration.student.email,
        phone: registration.student.phone,
        courseName: registration.course.name,
        amount: payment.amount.toString(),
        registrationId: registration.id,
      },
      comment,
    )
  } catch (error) {
    console.error(
      '[Payment] Notification de rejet échouée :',
      error,
    )
  }
}
