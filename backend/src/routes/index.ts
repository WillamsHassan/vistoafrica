import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { adminLogin, getAdminDashboard, getAdminMe } from '../controllers/adminController'
import { createCourse, getCourses, setCourseActive, updateCourse } from '../controllers/courseController'
import { createPayment, getAdminPayments, reviewPayment } from '../controllers/paymentController'
import { downloadInvoicePdf, getAdminInvoices } from '../controllers/invoiceController'
import { createRegistration } from '../controllers/registrationController'
import { createContactMessage, deleteContactMessage, getContactMessages, getUnreadContactMessageCount, updateContactMessage } from '../controllers/contactController'
import { getSettings, updateSettings } from '../controllers/settingsController'
import { changeAdminRegistrationStatus, downloadAdminRegistrationPdf, getAdminRegistrationById, getAdminRegistrations, updateAdminRegistration } from '../controllers/adminRegistrationController'
import { downloadStudentInvoice, getStudentById, getStudents, updateStudent } from '../controllers/studentController'
import { protectAdmin } from '../middlewares/auth'
import { createAnalyticsEvent, createAnalyticsPageView, createAnalyticsSession, deleteAnalyticsVisitor, getAnalyticsOverview, getAnalyticsVisitor, getAnalyticsVisitors, refuseAnalyticsConsent } from '../controllers/analyticsController'
import { archiveCourse, archivePayment, archiveStudent, getAdminAuditLogs, getAdminRecycleBin, permanentlyDeleteArchived, removeOrArchiveStudent, restoreCourse, restorePayment, restoreStudent } from '../controllers/adminArchiveController'

const router = Router()
const publicWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Trop de requêtes. Réessayez plus tard.' } })
const analyticsLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Trop de requêtes analytics. Réessayez plus tard.' } })

router.post('/analytics/session', analyticsLimiter, createAnalyticsSession)
router.post('/analytics/page-view', analyticsLimiter, createAnalyticsPageView)
router.post('/analytics/event', analyticsLimiter, createAnalyticsEvent)
router.post('/analytics/consent/refuse', analyticsLimiter, refuseAnalyticsConsent)
router.get('/admin/analytics/overview', protectAdmin, getAnalyticsOverview)
router.get('/admin/analytics/visitors', protectAdmin, getAnalyticsVisitors)
router.get('/admin/analytics/visitors/:id', protectAdmin, getAnalyticsVisitor)
router.delete('/admin/analytics/visitors/:id', protectAdmin, deleteAnalyticsVisitor)
router.get('/admin/recycle-bin', protectAdmin, getAdminRecycleBin)
router.get('/admin/audit-logs', protectAdmin, getAdminAuditLogs)
router.delete('/admin/recycle-bin/:type/:id', protectAdmin, permanentlyDeleteArchived)

router.get('/courses', getCourses)
router.get('/admin/courses', protectAdmin, getCourses)
router.post('/admin/courses', protectAdmin, createCourse)
router.patch('/admin/courses/:id', protectAdmin, updateCourse)
router.patch('/admin/courses/:id/active', protectAdmin, setCourseActive)
router.delete('/admin/courses/:id', protectAdmin, archiveCourse)
router.patch('/admin/courses/:id/archive', protectAdmin, archiveCourse)
router.patch('/admin/courses/:id/restore', protectAdmin, restoreCourse)
router.post('/registrations', publicWriteLimiter, createRegistration)
router.post('/payments', publicWriteLimiter, createPayment)
router.get('/settings', getSettings)
router.put('/admin/settings', protectAdmin, updateSettings)
router.post('/contact', publicWriteLimiter, createContactMessage)

router.post('/admin/login', adminLogin)
router.get('/admin/me', protectAdmin, getAdminMe)
router.get('/admin/dashboard', protectAdmin, getAdminDashboard)
router.get('/admin/messages', protectAdmin, getContactMessages)
router.get('/admin/messages/unread-count', protectAdmin, getUnreadContactMessageCount)
router.patch('/admin/messages/:id', protectAdmin, updateContactMessage)
router.delete('/admin/messages/:id', protectAdmin, deleteContactMessage)
router.get('/admin/payments', protectAdmin, getAdminPayments)
router.post('/admin/payments/:id/review', protectAdmin, reviewPayment)
router.patch('/admin/payments/:id/archive', protectAdmin, archivePayment)
router.patch('/admin/payments/:id/restore', protectAdmin, restorePayment)
router.get('/admin/invoices', protectAdmin, getAdminInvoices)
router.get('/invoices/:id/pdf', protectAdmin, downloadInvoicePdf)
router.get('/admin/students', protectAdmin, getStudents)
router.get('/admin/students/:id', protectAdmin, getStudentById)
router.patch('/admin/students/:id', protectAdmin, updateStudent)
router.delete('/admin/students/:id', protectAdmin, removeOrArchiveStudent)
router.patch('/admin/students/:id/archive', protectAdmin, archiveStudent)
router.patch('/admin/students/:id/restore', protectAdmin, restoreStudent)
router.get('/admin/students/:id/invoices/:invoiceId/download', protectAdmin, downloadStudentInvoice)
router.get('/admin/registrations', protectAdmin, getAdminRegistrations)
router.get('/admin/registrations/:id', protectAdmin, getAdminRegistrationById)
router.patch('/admin/registrations/:id', protectAdmin, updateAdminRegistration)
router.post('/admin/registrations/:id/status', protectAdmin, changeAdminRegistrationStatus)
router.get('/admin/registrations/:id/pdf', protectAdmin, downloadAdminRegistrationPdf)

export default router
