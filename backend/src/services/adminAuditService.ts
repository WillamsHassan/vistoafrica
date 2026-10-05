import type { Prisma } from '@prisma/client'

export type AdminAuditAction = 'ADMIN_DELETE_STUDENT' | 'ADMIN_ARCHIVE_STUDENT' | 'ADMIN_RESTORE_STUDENT' | 'ADMIN_DELETE_COURSE' | 'ADMIN_ARCHIVE_COURSE' | 'ADMIN_RESTORE_COURSE' | 'ADMIN_ARCHIVE_PAYMENT' | 'ADMIN_RESTORE_PAYMENT'
export type AdminAuditEntity = 'Student' | 'Course' | 'Payment'

type AuditClient = Pick<Prisma.TransactionClient, 'adminAuditLog'>

export const recordAdminAudit = (client: AuditClient, input: { adminId: string; action: AdminAuditAction; entityType: AdminAuditEntity; entityId: string; description?: string }) => client.adminAuditLog.create({
  data: {
    adminId: input.adminId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    description: input.description?.trim().slice(0, 500) || null,
  },
})
