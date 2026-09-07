export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export const errorResponse = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      status: 'error',
      message: error.message,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      status: 'error',
      message: error.message,
      statusCode: 500,
    }
  }

  return {
    status: 'error',
    message: 'Une erreur inattendue est survenue.',
    statusCode: 500,
  }
}
