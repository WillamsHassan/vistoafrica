import { ZodSchema } from 'zod'

import { AppError } from './appError'

export const validateBody = <T>(schema: ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new AppError('Validation des données échouée.', 400, result.error.flatten())
  }

  return result.data
}
