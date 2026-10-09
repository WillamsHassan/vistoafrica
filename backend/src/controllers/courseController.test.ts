import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    course: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('../config/prisma', () => ({ prisma: prismaMock }))

import { createCourse } from './courseController'

const createResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

const validCourse = {
  name: 'Cours de japonais',
  slug: 'japonais-en-ligne',
  category: 'Japonais',
  type: 'Formation en ligne',
  description: 'Cours de japonais pour tous les niveaux.',
  price: 120000,
  registrationFee: 5000,
  examIncluded: false,
  manualIncluded: false,
  installments: [],
}

describe('createCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a course when its slug is not already used', async () => {
    const createdCourse = { id: 'course-id', ...validCourse }
    prismaMock.course.findUnique.mockResolvedValue(null)
    prismaMock.course.create.mockResolvedValue(createdCourse)
    const req = { body: validCourse } as never
    const res = createResponse()
    const next = vi.fn()

    createCourse(req, res as never, next)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(prismaMock.course.create).toHaveBeenCalledOnce()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: createdCourse })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns a conflict without creating a course when its slug already exists', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: 'existing-course' })
    const req = { body: validCourse } as never
    const res = createResponse()
    const next = vi.fn()

    createCourse(req, res as never, next)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(prismaMock.course.create).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 409,
      message: 'Une formation avec ce slug existe déjà. Choisissez un slug différent.',
    })
  })

  it('surfaces the exact rejected field instead of the generic validation message', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null)
    const req = {
      body: {
        ...validCourse,
        slug: '!!!',
        price: '',
      },
    } as never
    const res = createResponse()
    const next = vi.fn()

    createCourse(req, res as never, next)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(prismaMock.course.create).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 400,
    })
    expect(next.mock.calls[0][0].message).toContain('slug')
    expect(next.mock.calls[0][0].message).toContain('price')
  })
})