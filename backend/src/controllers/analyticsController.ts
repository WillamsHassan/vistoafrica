import type { Request, Response } from 'express'
import { z } from 'zod'
import { AnalyticsEventType } from '@prisma/client'

import { prisma } from '../config/prisma'
import { asyncHandler } from '../utils/asyncHandler'
import { validateBody } from '../utils/validate'
import { AppError } from '../utils/appError'
import { env } from '../config/env'
import { analyticsStatus, purgeOldAnalytics } from '../services/analyticsService'

const eventTypes = ['PAGE_VIEW', 'COURSE_VIEW', 'REGISTRATION_STARTED', 'REGISTRATION_COMPLETED', 'PAYMENT_STARTED', 'PAYMENT_DECLARED'] as const
const consentField = { analyticsAccepted: z.literal(true) }
const safePath = z.string().trim().min(1).max(200).refine((value) => value.startsWith('/') && !value.startsWith('//') && !/[?#]/.test(value), 'Chemin invalide.')
const sessionSchema = z.object({ ...consentField, visitorId: z.string().uuid(), entryPage: safePath, referrer: z.string().trim().max(500).optional(), language: z.string().trim().max(32).optional(), resolution: z.string().trim().max(32).optional() })
const pageViewSchema = z.object({ ...consentField, visitorId: z.string().uuid(), path: safePath, duration: z.number().int().min(0).max(86400).optional() })
const eventSchema = z.object({ ...consentField, visitorId: z.string().uuid(), type: z.enum(eventTypes), path: safePath, metadata: z.object({ course: z.string().trim().max(80) }).strict().optional() })
const getId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
const safeSessionSelect = { id: true, visitorId: true, firstSeenAt: true, lastSeenAt: true, duration: true, pageViews: true, entryPage: true, lastPage: true, referrer: true, deviceType: true, browser: true, operatingSystem: true, language: true, resolution: true, country: true, city: true, isRegistered: true, createdAt: true, updatedAt: true } as const

const parseUserAgent = (value: string) => ({
  deviceType: /mobile|android|iphone|ipad/i.test(value) ? 'Mobile' : /tablet/i.test(value) ? 'Tablette' : 'Ordinateur',
  browser: /edg/i.test(value) ? 'Edge' : /chrome|crios/i.test(value) ? 'Chrome' : /firefox|fxios/i.test(value) ? 'Firefox' : /safari/i.test(value) ? 'Safari' : 'Autre',
  operatingSystem: /windows/i.test(value) ? 'Windows' : /android/i.test(value) ? 'Android' : /iphone|ipad|ios/i.test(value) ? 'iOS' : /mac os/i.test(value) ? 'macOS' : /linux/i.test(value) ? 'Linux' : 'Autre',
})

const upsertSession = async (visitorId: string, values: { entryPage?: string; referrer?: string; language?: string; resolution?: string }, req: Request) => {
  const userAgent = req.get('user-agent') ?? ''
  let referrerHost: string | null = null
  if (values.referrer) {
    try { referrerHost = new URL(values.referrer).hostname.slice(0, 200) } catch { referrerHost = null }
  }
  return prisma.visitorSession.upsert({
    where: { visitorId },
    update: { lastSeenAt: new Date(), ...(values.language ? { language: values.language } : {}), ...(values.resolution ? { resolution: values.resolution } : {}) },
    create: { visitorId, entryPage: values.entryPage ?? '/', lastPage: values.entryPage ?? '/', referrer: referrerHost, language: values.language || null, resolution: values.resolution || null, ...parseUserAgent(userAgent) },
  })
}

export const createAnalyticsSession = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(sessionSchema, req.body)
  const session = await upsertSession(payload.visitorId, payload, req)
  await purgeOldAnalytics()
  res.status(201).json({ success: true, data: { id: session.id, visitorId: session.visitorId } })
})

export const refuseAnalyticsConsent = asyncHandler(async (req: Request, res: Response) => {
  const payload = z.object({ visitorId: z.string().uuid(), analyticsAccepted: z.literal(false) }).parse(req.body)
  const session = await prisma.visitorSession.findUnique({ where: { visitorId: payload.visitorId }, select: { id: true } })
  if (session) await prisma.visitorSession.delete({ where: { id: session.id } })
  res.status(200).json({ success: true })
})

export const createAnalyticsPageView = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(pageViewSchema, req.body)
  const session = await upsertSession(payload.visitorId, { entryPage: payload.path }, req)
  const timestamp = new Date()
  await prisma.$transaction([
    prisma.pageView.create({ data: { visitorSessionId: session.id, path: payload.path, duration: payload.duration ?? 0, timestamp } }),
    prisma.visitorSession.update({ where: { id: session.id }, data: { lastSeenAt: timestamp, lastPage: payload.path, pageViews: { increment: 1 }, duration: Math.max(0, Math.floor((timestamp.getTime() - session.firstSeenAt.getTime()) / 1000)) } }),
    prisma.analyticsEvent.create({ data: { visitorSessionId: session.id, type: 'PAGE_VIEW', path: payload.path } }),
  ])
  res.status(201).json({ success: true })
})

export const createAnalyticsEvent = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateBody(eventSchema, req.body)
  const session = await upsertSession(payload.visitorId, { entryPage: payload.path }, req)
  await prisma.$transaction([
    prisma.analyticsEvent.create({ data: { visitorSessionId: session.id, type: payload.type, path: payload.path, metadata: payload.metadata } }),
    prisma.visitorSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date(), lastPage: payload.path, ...(payload.type === 'REGISTRATION_COMPLETED' ? { isRegistered: true } : {}) } }),
  ])
  res.status(201).json({ success: true })
})

export const getAnalyticsOverview = asyncHandler(async (_req: Request, res: Response) => {
  await purgeOldAnalytics()
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sessions = await prisma.visitorSession.findMany({ where: { lastSeenAt: { gte: new Date(now.getTime() - env.analyticsRetentionDays * 24 * 60 * 60 * 1000) } }, select: { id: true, visitorId: true, firstSeenAt: true, lastSeenAt: true, duration: true, pageViews: true, entryPage: true, deviceType: true, referrer: true, pageViewRecords: { select: { path: true, timestamp: true }, orderBy: { timestamp: 'asc' } }, analyticsEvents: { select: { type: true, path: true, createdAt: true, metadata: true }, orderBy: { createdAt: 'asc' } } } })
  const countSince = (date: Date) => sessions.filter((session) => session.firstSeenAt >= date).length
  const pages = sessions.flatMap((session) => session.pageViewRecords.map((page) => ({ ...page, visitorSessionId: session.id })))
  const events = sessions.flatMap((session) => session.analyticsEvents)
  const byDay = new Map<string, { visitors: number; pageViews: number }>()
  const visitorsPerDay = new Map<string, Set<string>>()
  pages.forEach((page) => { const key = page.timestamp.toISOString().slice(0, 10); const item = byDay.get(key) ?? { visitors: 0, pageViews: 0 }; item.pageViews += 1; byDay.set(key, item); const visitors = visitorsPerDay.get(key) ?? new Set<string>(); visitors.add(page.visitorSessionId); visitorsPerDay.set(key, visitors) })
  sessions.forEach((session) => { const key = session.firstSeenAt.toISOString().slice(0, 10); const item = byDay.get(key) ?? { visitors: 0, pageViews: 0 }; byDay.set(key, item); const visitors = visitorsPerDay.get(key) ?? new Set<string>(); visitors.add(session.id); visitorsPerDay.set(key, visitors) })
  visitorsPerDay.forEach((visitors, date) => { const item = byDay.get(date); if (item) item.visitors = visitors.size })
  const topPages = [...pages.reduce((map, page) => map.set(page.path, (map.get(page.path) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, views]) => ({ path, views }))
  const countValues = (values: Array<string | null>) => {
    const counts = new Map<string, number>()
    values.forEach((value) => { if (value) counts.set(value, (counts.get(value) ?? 0) + 1) })
    return [...counts].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))
  }
  const startCount = events.filter((event) => event.type === 'REGISTRATION_STARTED').length
  const completedCount = events.filter((event) => event.type === 'REGISTRATION_COMPLETED').length
  const daily = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, value]) => ({ date, ...value }))
  const returningSessions = sessions.filter((session) => session.lastSeenAt >= startOfDay && session.firstSeenAt < startOfDay).length
  res.json({ success: true, data: { visitorsToday: countSince(startOfDay), visitorsThisWeek: countSince(startOfWeek), visitorsThisMonth: countSince(startOfMonth), uniqueVisitors: new Set(sessions.map((session) => session.visitorId)).size, pageViews: pages.length, averageDuration: sessions.length ? Math.round(sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length) : 0, returningVisitors: returningSessions, returningVisitorRate: sessions.length ? Math.round((returningSessions / sessions.length) * 100) : 0, registrationStarts: startCount, registrations: completedCount, payments: events.filter((event) => event.type === 'PAYMENT_DECLARED').length, visitorsByDay: daily, topPages, devices: countValues(sessions.map((session) => session.deviceType)), sources: countValues(sessions.map((session) => { if (!session.referrer) return 'Direct'; try { return new URL(session.referrer).hostname } catch { return 'Autre' } })), courses: countValues(events.filter((event) => event.type === 'COURSE_VIEW').map((event) => typeof event.metadata === 'object' && event.metadata && 'course' in event.metadata ? String(event.metadata.course) : event.path)) } })
})

export const getAnalyticsVisitors = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 50)
  const device = typeof req.query.device === 'string' ? req.query.device : undefined
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : ''
  const eventType = status === 'REGISTRATION_STARTED' ? AnalyticsEventType.REGISTRATION_STARTED : status === 'REGISTRATION_COMPLETED' ? AnalyticsEventType.REGISTRATION_COMPLETED : status === 'PAYMENT_DECLARED' ? AnalyticsEventType.PAYMENT_DECLARED : undefined
  const validFrom = from && !Number.isNaN(from.getTime()) ? from : undefined
  const validTo = to && !Number.isNaN(to.getTime()) ? to : undefined
  const where = { ...(device ? { deviceType: device } : {}), ...(validFrom || validTo ? { firstSeenAt: { ...(validFrom ? { gte: validFrom } : {}), ...(validTo ? { lte: validTo } : {}) } } : {}), ...(status === 'VISITOR' ? { analyticsEvents: { none: { type: { in: [AnalyticsEventType.REGISTRATION_STARTED, AnalyticsEventType.REGISTRATION_COMPLETED, AnalyticsEventType.PAYMENT_DECLARED] } } } } : eventType ? { analyticsEvents: { some: { type: eventType } } } : {}), ...(search ? { OR: [{ visitorId: { contains: search } }, { entryPage: { contains: search } }, { lastPage: { contains: search } }] } : {}) }
  const [items, total] = await Promise.all([prisma.visitorSession.findMany({ where, select: safeSessionSelect, orderBy: { lastSeenAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), prisma.visitorSession.count({ where })])
  const itemIds = items.map((item) => item.id)
  const eventRows = await prisma.analyticsEvent.findMany({ where: { visitorSessionId: { in: itemIds } }, select: { visitorSessionId: true, type: true } })
  const bySession = new Map<string, string[]>(); eventRows.forEach((event) => bySession.set(event.visitorSessionId, [...(bySession.get(event.visitorSessionId) ?? []), event.type]))
  res.json({ success: true, data: { items: items.map((item) => ({ ...item, status: analyticsStatus(bySession.get(item.id) ?? []) })), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } })
})

export const getAnalyticsVisitor = asyncHandler(async (req: Request, res: Response) => {
  const session = await prisma.visitorSession.findUnique({ where: { id: getId(req) }, select: { ...safeSessionSelect, pageViewRecords: { select: { id: true, path: true, timestamp: true, duration: true }, orderBy: { timestamp: 'asc' } }, analyticsEvents: { select: { id: true, type: true, path: true, createdAt: true }, orderBy: { createdAt: 'asc' } } } })
  if (!session) throw new AppError('Session visiteur introuvable.', 404)
  res.json({ success: true, data: { ...session, status: analyticsStatus(session.analyticsEvents.map((event) => event.type)) } })
})

export const deleteAnalyticsVisitor = asyncHandler(async (req: Request, res: Response) => {
  const session = await prisma.visitorSession.findUnique({ where: { id: getId(req) }, select: { id: true } })
  if (!session) throw new AppError('Session visiteur introuvable.', 404)
  await prisma.visitorSession.delete({ where: { id: session.id } })
  res.json({ success: true })
})
