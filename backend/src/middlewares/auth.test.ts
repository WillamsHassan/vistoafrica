import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findAdmin, verifyAdminToken } = vi.hoisted(() => ({ findAdmin: vi.fn(), verifyAdminToken: vi.fn() }))

vi.mock('../config/prisma', () => ({ prisma: { admin: { findUnique: findAdmin } } }))
vi.mock('../config/jwt', () => ({ verifyAdminToken }))

import { protectAdmin } from './auth'

const invoke = async (authorization?: string) => {
  const req = { headers: authorization ? { authorization } : {} } as Request
  const next = vi.fn() as unknown as NextFunction
  await protectAdmin(req, {} as Response, next)
  return { req, next: next as unknown as ReturnType<typeof vi.fn> }
}

describe('protection des actions admin', () => {
  beforeEach(() => {
    findAdmin.mockReset()
    verifyAdminToken.mockReset().mockReturnValue({ id: '507f1f77bcf86cd799439011' })
  })

  it('refuse un appel sans JWT', async () => {
    const { next } = await invoke()
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
    expect(verifyAdminToken).not.toHaveBeenCalled()
  })

  it('refuse un utilisateur authentifié qui ne possède pas un rôle administrateur', async () => {
    findAdmin.mockResolvedValue({ id: '507f1f77bcf86cd799439011', email: 'visitor@example.com', fullName: 'Visitor', role: 'STUDENT' })
    const { next } = await invoke('Bearer valid-token')
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('autorise le rôle %s', async (role) => {
    findAdmin.mockResolvedValue({ id: '507f1f77bcf86cd799439011', email: 'admin@example.com', fullName: 'Admin', role })
    const { req, next } = await invoke('Bearer valid-token')
    expect(req.user).toMatchObject({ role })
    expect(next).toHaveBeenCalledWith()
  })
})
