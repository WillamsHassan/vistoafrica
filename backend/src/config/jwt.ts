import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

import { env } from './env'

export const signAdminToken = (admin: { id: string; email: string; fullName: string; role: string }) => {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] }

  return jwt.sign({ id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role }, env.jwtSecret, {
    algorithm: 'HS256',
    ...options,
  })
}

export const verifyAdminToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as {
    id: string
    email: string
    fullName: string
    role: string
    iat?: number
    exp?: number
  }
}
