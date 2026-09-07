export type ApiError = {
  message: string
  statusCode?: number
  details?: unknown
}

export type RequestBody = Record<string, unknown>
