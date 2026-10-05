import { Client as PgClient } from 'pg'
import { PrismaClient } from '@prisma/client'

import { env } from '../config/env'

const sourceClient = new PgClient({ connectionString: env.postgresqlSourceUrl })
const mongoPrisma = new PrismaClient()

const safeString = (value: unknown) => (value === null || value === undefined ? null : String(value))

const toObjectId = (value: string | null | undefined) => {
  if (!value) return null
  return value.length === 24 && /^[a-fA-F0-9]+$/.test(value) ? value : null
}

const isMongoIdLike = (value: string | null | undefined) => Boolean(value && value.length === 24 && /^[a-fA-F0-9]{24}$/.test(value))

const ensureIndexes = async () => {
  const collections = ['Admin', 'Student', 'Course', 'Registration', 'Payment', 'PaymentAction', 'Invoice', 'ContactMessage', 'SiteSetting', 'VisitorSession', 'PageView', 'AnalyticsEvent']
  for (const collection of collections) {
    await mongoPrisma.$runCommandRaw({ listCollections: 1, filter: { name: collection } })
  }
}

const getLegacyIdMap = async () => {
  const map = {
    admins: new Map<string, string>(),
    students: new Map<string, string>(),
    courses: new Map<string, string>(),
    registrations: new Map<string, string>(),
    payments: new Map<string, string>(),
    invoices: new Map<string, string>(),
    contactMessages: new Map<string, string>(),
    siteSettings: new Map<string, string>(),
  }

  const adminRows = await mongoPrisma.admin.findMany({ select: { legacyId: true, id: true } })
  for (const row of adminRows) {
    if (row.legacyId) map.admins.set(row.legacyId, row.id.toString())
  }

  const studentRows = await mongoPrisma.student.findMany({ select: { legacyId: true, id: true } })
  for (const row of studentRows) {
    if (row.legacyId) map.students.set(row.legacyId, row.id.toString())
  }

  const courseRows = await mongoPrisma.course.findMany({ select: { legacyId: true, id: true } })
  for (const row of courseRows) {
    if (row.legacyId) map.courses.set(row.legacyId, row.id.toString())
  }

  const registrationRows = await mongoPrisma.registration.findMany({ select: { legacyId: true, id: true } })
  for (const row of registrationRows) {
    if (row.legacyId) map.registrations.set(row.legacyId, row.id.toString())
  }

  const paymentRows = await mongoPrisma.payment.findMany({ select: { legacyId: true, id: true } })
  for (const row of paymentRows) {
    if (row.legacyId) map.payments.set(row.legacyId, row.id.toString())
  }

  const invoiceRows = await mongoPrisma.invoice.findMany({ select: { legacyId: true, id: true } })
  for (const row of invoiceRows) {
    if (row.legacyId) map.invoices.set(row.legacyId, row.id.toString())
  }

  return map
}

const collectPostgresData = async () => {
  const tables = [
    'Admin', 'Student', 'Course', 'Registration', 'Payment', 'PaymentAction', 'Invoice', 'ContactMessage', 'SiteSetting', 'VisitorSession', 'PageView', 'AnalyticsEvent',
  ]

  const report: Record<string, { sourceCount: number; imported: number; ignored: number; errors: number; relationsChecked: number; warnings: string[] }> = {}

  for (const table of tables) {
    const result = await sourceClient.query(`SELECT * FROM "${table}"`)
    report[table] = { sourceCount: result.rowCount ?? 0, imported: 0, ignored: 0, errors: 0, relationsChecked: 0, warnings: [] }
  }

  return report
}

const migrate = async () => {
  const report = await collectPostgresData()
  const validation: string[] = []

  try {
    await sourceClient.connect()
    await mongoPrisma.$connect()
    await ensureIndexes()

    const adminRows = await sourceClient.query('SELECT * FROM "Admin" ORDER BY "createdAt" ASC')
    for (const row of adminRows.rows) {
      const id = row.id as string
      const existing = await mongoPrisma.admin.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.Admin.imported += 1
        continue
      }
      await mongoPrisma.admin.upsert({
        where: { email: row.email },
        update: {},
        create: {
          legacyId: id,
          fullName: row.fullName,
          email: row.email,
          passwordHash: row.passwordHash,
          role: row.role ?? 'ADMIN',
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.Admin.imported += 1
    }

    const studentRows = await sourceClient.query('SELECT * FROM "Student" ORDER BY "createdAt" ASC')
    for (const row of studentRows.rows) {
      const id = row.id as string
      const existing = await mongoPrisma.student.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.Student.imported += 1
        continue
      }
      await mongoPrisma.student.upsert({
        where: { email: row.email },
        update: {},
        create: {
          legacyId: id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: safeString(row.phone),
          city: safeString(row.city),
          passwordHash: safeString(row.passwordHash),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.Student.imported += 1
    }

    const courseRows = await sourceClient.query('SELECT * FROM "Course" ORDER BY "createdAt" ASC')
    for (const row of courseRows.rows) {
      const id = row.id as string
      const existing = await mongoPrisma.course.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.Course.imported += 1
        continue
      }
      await mongoPrisma.course.upsert({
        where: { slug: row.slug },
        update: {},
        create: {
          legacyId: id,
          slug: row.slug,
          name: row.name,
          category: row.category ?? 'Général',
          type: row.type ?? 'Formation',
          description: row.description,
          duration: row.duration ?? null,
          frequency: row.frequency ?? null,
          sessionDuration: row.sessionDuration ?? null,
          price: Number(row.price ?? 0),
          registrationFee: Number(row.registrationFee ?? 0),
          hourlyRate: row.hourlyRate == null ? null : Number(row.hourlyRate),
          examIncluded: Boolean(row.examIncluded),
          manualIncluded: Boolean(row.manualIncluded),
          preparationFees: row.preparationFees == null ? null : Number(row.preparationFees),
          installments: row.installments ?? null,
          image: row.image ?? null,
          isActive: row.isActive ?? true,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.Course.imported += 1
    }

    const legacyMap = await getLegacyIdMap()

    const registrationRows = await sourceClient.query('SELECT * FROM "Registration" ORDER BY "createdAt" ASC')
    for (const row of registrationRows.rows) {
      const id = row.id as string
      const studentMongoId = await mongoPrisma.student.findUnique({ where: { legacyId: row.studentId } }).then((s) => s?.id.toString() ?? null)
      const courseMongoId = await mongoPrisma.course.findUnique({ where: { legacyId: row.courseId } }).then((c) => c?.id.toString() ?? null)
      if (!studentMongoId || !courseMongoId) {
        report.Registration.errors += 1
        report.Registration.warnings.push(`Registration ${id} skipped because related Student/Course was missing.`)
        continue
      }
      const existing = await mongoPrisma.registration.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.Registration.imported += 1
        continue
      }
      await mongoPrisma.registration.create({
        data: {
          legacyId: id,
          legacyStudentId: row.studentId,
          legacyCourseId: row.courseId,
          accessToken: safeString(row.accessToken),
          studentId: studentMongoId,
          courseId: courseMongoId,
          status: (row.status ?? 'PAYMENT_PENDING') as any,
          amount: Number(row.amount ?? 0),
          notes: row.notes ?? null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.Registration.imported += 1
    }

    const paymentRows = await sourceClient.query('SELECT * FROM "Payment" ORDER BY "createdAt" ASC')
    for (const row of paymentRows.rows) {
      const id = row.id as string
      const registrationMongoId = await mongoPrisma.registration.findUnique({ where: { legacyId: row.registrationId } }).then((r) => r?.id.toString() ?? null)
      const adminMongoId = row.adminId ? await mongoPrisma.admin.findUnique({ where: { legacyId: row.adminId } }).then((a) => a?.id.toString() ?? null) : null
      if (!registrationMongoId) {
        report.Payment.errors += 1
        report.Payment.warnings.push(`Payment ${id} skipped because registration ${row.registrationId} was missing.`)
        continue
      }
      const existing = await mongoPrisma.payment.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.Payment.imported += 1
        continue
      }
      await mongoPrisma.payment.create({
        data: {
          legacyId: id,
          legacyRegistrationId: row.registrationId,
          legacyAdminId: row.adminId ?? null,
          registrationId: registrationMongoId,
          method: (row.method ?? 'MTN') as any,
          status: (row.status ?? 'PENDING') as any,
          amount: Number(row.amount ?? 0),
          reference: safeString(row.reference),
          accountName: safeString(row.accountName),
          proofUrl: safeString(row.proofUrl),
          declaredAt: new Date(row.declaredAt ?? row.createdAt),
          verifiedAt: row.verifiedAt ? new Date(row.verifiedAt) : null,
          adminId: adminMongoId ?? null,
          reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.Payment.imported += 1
    }

    const paymentActionRows = await sourceClient.query('SELECT * FROM "PaymentAction" ORDER BY "createdAt" ASC')
    for (const row of paymentActionRows.rows) {
      const id = row.id as string
      const paymentMongoId = await mongoPrisma.payment.findUnique({ where: { legacyId: row.paymentId } }).then((p) => p?.id.toString() ?? null)
      const adminMongoId = await mongoPrisma.admin.findUnique({ where: { legacyId: row.adminId } }).then((a) => a?.id.toString() ?? null)
      if (!paymentMongoId || !adminMongoId) {
        report.PaymentAction.errors += 1
        report.PaymentAction.warnings.push(`PaymentAction ${id} skipped because payment/admin data was missing.`)
        continue
      }
      const existing = await mongoPrisma.paymentAction.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.PaymentAction.imported += 1
        continue
      }
      await mongoPrisma.paymentAction.create({
        data: {
          legacyId: id,
          paymentId: paymentMongoId,
          adminId: adminMongoId,
          action: (row.action ?? 'VERIFIED') as any,
          comment: row.comment ?? null,
          createdAt: new Date(row.createdAt),
        },
      })
      report.PaymentAction.imported += 1
    }

    const invoiceRows = await sourceClient.query('SELECT * FROM "Invoice" ORDER BY "createdAt" ASC')
    for (const row of invoiceRows.rows) {
      const id = row.id as string
      const registrationMongoId = await mongoPrisma.registration.findUnique({ where: { legacyId: row.registrationId } }).then((r) => r?.id.toString() ?? null)
      const paymentMongoId = await mongoPrisma.payment.findUnique({ where: { legacyId: row.paymentId } }).then((p) => p?.id.toString() ?? null)
      if (!registrationMongoId || !paymentMongoId) {
        report.Invoice.errors += 1
        report.Invoice.warnings.push(`Invoice ${id} skipped because registration/payment relation was missing.`)
        continue
      }
      const existing = await mongoPrisma.invoice.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.Invoice.imported += 1
        continue
      }
      await mongoPrisma.invoice.create({
        data: {
          legacyId: id,
          legacyRegistrationId: row.registrationId,
          legacyPaymentId: row.paymentId,
          registrationId: registrationMongoId,
          paymentId: paymentMongoId,
          invoiceNumber: row.invoiceNumber,
          total: Number(row.total ?? 0),
          storageKey: row.storageKey,
          generatedAt: row.generatedAt ? new Date(row.generatedAt) : null,
          issuedAt: new Date(row.issuedAt ?? row.createdAt),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.Invoice.imported += 1
    }

    const contactRows = await sourceClient.query('SELECT * FROM "ContactMessage" ORDER BY "createdAt" ASC')
    for (const row of contactRows.rows) {
      const id = row.id as string
      const existing = await mongoPrisma.contactMessage.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.ContactMessage.imported += 1
        continue
      }
      await mongoPrisma.contactMessage.create({
        data: {
          legacyId: id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          subject: row.subject,
          message: row.message,
          isRead: Boolean(row.isRead),
          isArchived: Boolean(row.isArchived),
          createdAt: new Date(row.createdAt),
        },
      })
      report.ContactMessage.imported += 1
    }

    const siteRows = await sourceClient.query('SELECT * FROM "SiteSetting" ORDER BY "key" ASC')
    for (const row of siteRows.rows) {
      const id = row.id as string
      const existing = await mongoPrisma.siteSetting.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.SiteSetting.imported += 1
        continue
      }
      await mongoPrisma.siteSetting.upsert({
        where: { key: row.key },
        update: {},
        create: {
          legacyId: id,
          key: row.key,
          value: row.value,
          description: row.description ?? null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.SiteSetting.imported += 1
    }

    const visitorRows = await sourceClient.query('SELECT * FROM "VisitorSession" ORDER BY "createdAt" ASC')
    for (const row of visitorRows.rows) {
      const id = row.id as string
      const existing = await mongoPrisma.visitorSession.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.VisitorSession.imported += 1
        continue
      }
      await mongoPrisma.visitorSession.create({
        data: {
          legacyId: id,
          visitorId: row.visitorId,
          firstSeenAt: new Date(row.firstSeenAt),
          lastSeenAt: new Date(row.lastSeenAt),
          duration: Number(row.duration ?? 0),
          pageViews: Number(row.pageViews ?? 0),
          entryPage: row.entryPage,
          lastPage: row.lastPage,
          referrer: row.referrer ?? null,
          deviceType: row.deviceType ?? null,
          browser: row.browser ?? null,
          operatingSystem: row.operatingSystem ?? null,
          language: row.language ?? null,
          resolution: row.resolution ?? null,
          country: row.country ?? null,
          city: row.city ?? null,
          isRegistered: Boolean(row.isRegistered),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        },
      })
      report.VisitorSession.imported += 1
    }

    const pageViewRows = await sourceClient.query('SELECT * FROM "PageView" ORDER BY "timestamp" ASC')
    for (const row of pageViewRows.rows) {
      const id = row.id as string
      const sessionMongoId = await mongoPrisma.visitorSession.findUnique({ where: { legacyId: row.visitorSessionId } }).then((s) => s?.id.toString() ?? null)
      if (!sessionMongoId) {
        report.PageView.errors += 1
        continue
      }
      const existing = await mongoPrisma.pageView.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.PageView.imported += 1
        continue
      }
      await mongoPrisma.pageView.create({
        data: {
          legacyId: id,
          visitorSessionId: sessionMongoId,
          path: row.path,
          title: row.title ?? null,
          timestamp: new Date(row.timestamp),
          duration: Number(row.duration ?? 0),
        },
      })
      report.PageView.imported += 1
    }

    const analyticsRows = await sourceClient.query('SELECT * FROM "AnalyticsEvent" ORDER BY "createdAt" ASC')
    for (const row of analyticsRows.rows) {
      const id = row.id as string
      const sessionMongoId = await mongoPrisma.visitorSession.findUnique({ where: { legacyId: row.visitorSessionId } }).then((s) => s?.id.toString() ?? null)
      if (!sessionMongoId) {
        report.AnalyticsEvent.errors += 1
        continue
      }
      const existing = await mongoPrisma.analyticsEvent.findUnique({ where: { legacyId: id } })
      if (existing) {
        report.AnalyticsEvent.imported += 1
        continue
      }
      await mongoPrisma.analyticsEvent.create({
        data: {
          legacyId: id,
          visitorSessionId: sessionMongoId,
          type: (row.type ?? 'PAGE_VIEW') as any,
          path: row.path,
          metadata: row.metadata ?? null,
          createdAt: new Date(row.createdAt),
        },
      })
      report.AnalyticsEvent.imported += 1
    }

    const counts = Object.entries(report).map(([key, value]) => `${key}: source=${value.sourceCount}, imported=${value.imported}, ignored=${value.ignored}, errors=${value.errors}, relations=${value.relationsChecked}`).join('\n')
    validation.push(counts)
    console.log(JSON.stringify({ success: true, message: 'MongoDB pre-migration transfer completed', report }, null, 2))
  } catch (error) {
    console.error('MongoDB migration failed', error)
    process.exitCode = 1
  } finally {
    await sourceClient.end().catch(() => undefined)
    await mongoPrisma.$disconnect().catch(() => undefined)
  }
}

void migrate()
