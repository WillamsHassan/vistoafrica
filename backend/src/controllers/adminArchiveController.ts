import type { Request, Response } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma'
import { AppError } from '../utils/appError'
import { asyncHandler } from '../utils/asyncHandler'
import { recordAdminAudit, type AdminAuditAction, type AdminAuditEntity } from '../services/adminAuditService'
import { canPermanentlyDeleteArchivedEntity, courseRemovalPolicy, isAuthorizedAdminRole, studentRemovalPolicy } from '../services/adminArchivePolicy'

const idSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Identifiant invalide.')
const reasonSchema = z.object({ comment: z.string().trim().max(500).optional() })
const resourceId = (req: Request) => {
  const parsed = idSchema.safeParse(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  if (!parsed.success) throw new AppError('Identifiant invalide.', 400)
  return parsed.data
}
const commentFrom = (req: Request) => {
  const parsed = reasonSchema.safeParse(req.body ?? {})
  if (!parsed.success) throw new AppError('Commentaire invalide.', 400)
  return parsed.data.comment
}
const requireAdmin = (req: Request) => {
  if (!req.user || !isAuthorizedAdminRole(req.user.role)) throw new AppError('Action réservée aux administrateurs.', 403)
  return req.user.id
}

export const removeOrArchiveStudent = asyncHandler(async (req: Request, res: Response) => {
  const adminId = requireAdmin(req)
  const id = resourceId(req)
  const comment = commentFrom(req)
  const outcome = await prisma.$transaction(async (transaction) => {
    const student = await transaction.student.findUnique({ where: { id }, select: { id: true, email: true, deletedAt: true } })
    if (!student) throw new AppError('Étudiant introuvable.', 404)
    if (student.deletedAt) throw new AppError('Cet étudiant est déjà archivé.', 409)
    await transaction.student.update({ where: { id }, data: { relationGuard: { increment: 1 } } })
    const [registrations, payments, invoices] = await Promise.all([
      transaction.registration.count({ where: { studentId: id } }),
      transaction.payment.count({ where: { registration: { studentId: id } } }),
      transaction.invoice.count({ where: { registration: { studentId: id } } }),
    ])
    const hasHistory = studentRemovalPolicy({ registrations, payments, invoices }).archive
    const action: AdminAuditAction = hasHistory ? 'ADMIN_ARCHIVE_STUDENT' : 'ADMIN_DELETE_STUDENT'
    const description = [hasHistory ? `Étudiant archivé (inscriptions=${registrations}, paiements=${payments}, factures=${invoices})` : 'Étudiant supprimé sans données associées', comment].filter(Boolean).join(' — ')
    await recordAdminAudit(transaction, { adminId, action, entityType: 'Student', entityId: id, description })
    if (hasHistory) await transaction.student.update({ where: { id }, data: { deletedAt: new Date(), archivedEmail: student.email, email: `archived+${id}@invalid.vistoafrica` } })
    else await transaction.student.delete({ where: { id } })
    return { registrations, payments, invoices, archived: hasHistory }
  })
  res.json({ success: true, data: { archived: outcome.archived, counts: { registrations: outcome.registrations, payments: outcome.payments, invoices: outcome.invoices } }, message: outcome.archived ? 'Étudiant archivé afin de préserver son historique.' : 'Étudiant supprimé.' })
})

export const archiveStudent = asyncHandler(async (req: Request, res: Response) => {
  const adminId = requireAdmin(req)
  const id = resourceId(req)
  const comment = commentFrom(req)
  const student = await prisma.student.findUnique({ where: { id }, select: { id: true, email: true, deletedAt: true } })
  if (!student) throw new AppError('Étudiant introuvable.', 404)
  if (student.deletedAt) throw new AppError('Cet étudiant est déjà archivé.', 409)
  await prisma.$transaction(async (transaction) => {
    await transaction.student.update({ where: { id }, data: { deletedAt: new Date(), archivedEmail: student.email, email: `archived+${id}@invalid.vistoafrica` } })
    await recordAdminAudit(transaction, { adminId, action: 'ADMIN_ARCHIVE_STUDENT', entityType: 'Student', entityId: id, description: comment || 'Étudiant archivé par un administrateur.' })
  })
  res.json({ success: true, message: 'Étudiant archivé.' })
})

export const archiveCourse = asyncHandler(async (req: Request, res: Response) => {
  const adminId = requireAdmin(req)
  const id = resourceId(req)
  const comment = commentFrom(req)
  const outcome = await prisma.$transaction(async (transaction) => {
    const course = await transaction.course.findUnique({ where: { id }, select: { id: true, isActive: true, archivedAt: true } })
    if (!course) throw new AppError('Formation introuvable.', 404)
    if (course.archivedAt) throw new AppError('Cette formation est déjà archivée.', 409)
    await transaction.course.update({ where: { id }, data: { relationGuard: { increment: 1 } } })
    const [registrations, activeCourseRegistration] = await Promise.all([
      transaction.registration.count({ where: { courseId: id } }),
      transaction.registration.findFirst({ where: { courseId: id, status: { notIn: ['CANCELLED', 'REJECTED'] } }, select: { id: true } }),
    ])
    const removal = courseRemovalPolicy(registrations, Boolean(activeCourseRegistration))
    const action: AdminAuditAction = removal.deactivateOnly ? 'ADMIN_ARCHIVE_COURSE' : removal.archive ? 'ADMIN_ARCHIVE_COURSE' : 'ADMIN_DELETE_COURSE'
    const description = [removal.deactivateOnly ? `Formation désactivée (inscription active; ${registrations} inscription(s) liée(s))` : removal.archive ? `Formation archivée (${registrations} inscription(s) conservée(s))` : 'Formation supprimée sans inscription associée', comment].filter(Boolean).join(' — ')
    await recordAdminAudit(transaction, { adminId, action, entityType: 'Course', entityId: id, description })
    if (removal.deactivateOnly) await transaction.course.update({ where: { id }, data: { isActive: false } })
    else if (removal.archive) await transaction.course.update({ where: { id }, data: { archivedAt: new Date(), archivedWasActive: course.isActive, isActive: false } })
    else await transaction.course.delete({ where: { id } })
    return { ...removal, registrations }
  })
  res.json({ success: true, data: { archived: outcome.archive, deactivated: outcome.deactivateOnly, registrations: outcome.registrations }, message: outcome.deactivateOnly ? 'Formation désactivée : une inscription active doit conserver cette offre.' : outcome.archive ? 'Formation archivée pour préserver l’historique.' : 'Formation supprimée.' })
})

export const archivePayment = asyncHandler(async (req: Request, res: Response) => {
  const adminId = requireAdmin(req)
  const id = resourceId(req)
  const comment = commentFrom(req)
  const payment = await prisma.payment.findUnique({ where: { id }, select: { id: true, status: true, archivedAt: true } })
  if (!payment) throw new AppError('Paiement introuvable.', 404)
  if (payment.archivedAt) throw new AppError('Ce paiement est déjà archivé.', 409)
  await prisma.$transaction(async (transaction) => {
    await transaction.payment.update({ where: { id }, data: { archivedAt: new Date() } })
    await recordAdminAudit(transaction, { adminId, action: 'ADMIN_ARCHIVE_PAYMENT', entityType: 'Payment', entityId: id, description: [`Paiement archivé (statut=${payment.status})`, comment].filter(Boolean).join(' — ') })
  })
  res.json({ success: true, message: 'Paiement archivé.' })
})

const restoreEntity = async (req: Request, res: Response, entityType: AdminAuditEntity, action: AdminAuditAction) => {
  const adminId = requireAdmin(req)
  const id = resourceId(req)
  const comment = commentFrom(req)
  await prisma.$transaction(async (transaction) => {
    if (entityType === 'Student') {
      const entity = await transaction.student.findUnique({ where: { id }, select: { id: true, deletedAt: true, archivedEmail: true } })
      if (!entity) throw new AppError('Étudiant introuvable.', 404)
      if (!entity.deletedAt) throw new AppError('Cet étudiant n’est pas archivé.', 409)
      const restoredEmail = entity.archivedEmail
      if (restoredEmail) {
        const conflict = await transaction.student.findFirst({ where: { email: restoredEmail, id: { not: id } }, select: { id: true } })
        if (conflict) throw new AppError('Impossible de restaurer : cette adresse email est déjà utilisée par un autre dossier.', 409)
      }
      await transaction.student.update({ where: { id }, data: { deletedAt: null, archivedEmail: null, ...(restoredEmail ? { email: restoredEmail } : {}) } })
    } else if (entityType === 'Course') {
      const entity = await transaction.course.findUnique({ where: { id }, select: { id: true, archivedAt: true, archivedWasActive: true } })
      if (!entity) throw new AppError('Formation introuvable.', 404)
      if (!entity.archivedAt) throw new AppError('Cette formation n’est pas archivée.', 409)
      await transaction.course.update({ where: { id }, data: { archivedAt: null, isActive: entity.archivedWasActive ?? true, archivedWasActive: null } })
    } else {
      const entity = await transaction.payment.findUnique({ where: { id }, select: { id: true, archivedAt: true } })
      if (!entity) throw new AppError('Paiement introuvable.', 404)
      if (!entity.archivedAt) throw new AppError('Ce paiement n’est pas archivé.', 409)
      await transaction.payment.update({ where: { id }, data: { archivedAt: null } })
    }
    await recordAdminAudit(transaction, { adminId, action, entityType, entityId: id, description: comment || `${entityType} restauré depuis la corbeille.` })
  })
  res.json({ success: true, message: `${entityType === 'Student' ? 'Étudiant' : entityType === 'Course' ? 'Formation' : 'Paiement'} restauré.` })
}

export const restoreStudent = asyncHandler((req, res) => restoreEntity(req, res, 'Student', 'ADMIN_RESTORE_STUDENT'))
export const restoreCourse = asyncHandler((req, res) => restoreEntity(req, res, 'Course', 'ADMIN_RESTORE_COURSE'))
export const restorePayment = asyncHandler((req, res) => restoreEntity(req, res, 'Payment', 'ADMIN_RESTORE_PAYMENT'))

export const permanentlyDeleteArchived = asyncHandler(async (req: Request, res: Response) => {
  const adminId = requireAdmin(req)
  const id = resourceId(req)
  const parsedType = z.enum(['students', 'courses']).safeParse(req.params.type)
  if (!parsedType.success) throw new AppError('Type d’élément invalide.', 400)
  const entityType = parsedType.data
  const comment = commentFrom(req)
  if (entityType === 'students') {
    const student = await prisma.student.findUnique({ where: { id }, select: { id: true, deletedAt: true } })
    if (!student) throw new AppError('Étudiant introuvable.', 404)
    if (!student.deletedAt) throw new AppError('Seuls les étudiants archivés peuvent être supprimés définitivement.', 409)
    const linked = await prisma.registration.count({ where: { studentId: id } })
    if (!canPermanentlyDeleteArchivedEntity(linked)) throw new AppError('Suppression définitive impossible : des inscriptions et documents financiers doivent conserver ce lien.', 409)
    await prisma.$transaction(async (transaction) => {
      await recordAdminAudit(transaction, { adminId, action: 'ADMIN_DELETE_STUDENT', entityType: 'Student', entityId: id, description: comment || 'Suppression définitive d’un étudiant archivé sans inscription.' })
      await transaction.student.delete({ where: { id } })
    })
  } else {
    const course = await prisma.course.findUnique({ where: { id }, select: { id: true, archivedAt: true } })
    if (!course) throw new AppError('Formation introuvable.', 404)
    if (!course.archivedAt) throw new AppError('Seules les formations archivées peuvent être supprimées définitivement.', 409)
    const linked = await prisma.registration.count({ where: { courseId: id } })
    if (!canPermanentlyDeleteArchivedEntity(linked)) throw new AppError('Suppression définitive impossible : des inscriptions liées doivent conserver cette formation.', 409)
    await prisma.$transaction(async (transaction) => {
      await recordAdminAudit(transaction, { adminId, action: 'ADMIN_DELETE_COURSE', entityType: 'Course', entityId: id, description: comment || 'Suppression définitive d’une formation archivée sans inscription.' })
      await transaction.course.delete({ where: { id } })
    })
  }
  res.json({ success: true, message: 'Suppression définitive effectuée.' })
})

export const getAdminRecycleBin = asyncHandler(async (req: Request, res: Response) => {
  requireAdmin(req)
  const [students, courses, payments] = await Promise.all([
    prisma.student.findMany({ where: { deletedAt: { not: null } }, select: { id: true, firstName: true, lastName: true, email: true, archivedEmail: true, phone: true, deletedAt: true, _count: { select: { registrations: true } } }, orderBy: { deletedAt: 'desc' } }),
    prisma.course.findMany({ where: { archivedAt: { not: null } }, select: { id: true, name: true, slug: true, archivedAt: true, _count: { select: { registrations: true } } }, orderBy: { archivedAt: 'desc' } }),
    prisma.payment.findMany({ where: { archivedAt: { not: null } }, select: { id: true, amount: true, method: true, status: true, declaredAt: true, archivedAt: true, registration: { select: { student: { select: { firstName: true, lastName: true } }, course: { select: { name: true } } } } }, orderBy: { archivedAt: 'desc' } }),
  ])
  res.json({ success: true, data: { students: students.map(({ archivedEmail, _count, ...student }) => ({ ...student, email: archivedEmail ?? student.email, registrationCount: _count.registrations, canDeletePermanently: _count.registrations === 0 })), courses: courses.map(({ _count, ...course }) => ({ ...course, registrationCount: _count.registrations, canDeletePermanently: _count.registrations === 0 })), payments } })
})

export const getAdminAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  requireAdmin(req)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 50, 1), 100)
  const [items, total] = await Promise.all([
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { admin: { select: { id: true, fullName: true, email: true, role: true } } } }),
    prisma.adminAuditLog.count(),
  ])
  res.json({ success: true, data: { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } })
})
