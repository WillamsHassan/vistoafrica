export type PrismaLike<T> = {
  [K in keyof T]: T[K]
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}
