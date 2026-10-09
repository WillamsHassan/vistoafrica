import { ZodSchema } from 'zod'

import { AppError } from './appError'

type FlattenedValidation = {
  fieldErrors?: Record<string, string[] | undefined>
  formErrors?: string[]
}

const formatZodErrors = (details: FlattenedValidation | undefined) => {
  if (!details || typeof details !== 'object') return 'Validation des données échouée.'

  const fieldMessages = Object.entries(details.fieldErrors ?? {})
    .flatMap(([field, errors]) => (errors ?? []).map((message) => `${field}: ${message}`))

  const formMessages = (details.formErrors ?? []).map((message) => `payload: ${message}`)
  const messages = [...fieldMessages, ...formMessages]

  return messages.length ? messages.join(' • ') : 'Validation des données échouée.'
}

export const validateBody = <T>(schema: ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data)

  if (!result.success) {
    const details = result.error.flatten() as FlattenedValidation
    const message = formatZodErrors(details)
    throw new AppError(message, 400, details)
  }

  return result.data
}
