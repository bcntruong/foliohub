import type { Context } from 'hono'
import type { ZodError } from 'zod'
import type { AppEnvironment } from './types'

export const STATUS = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  payloadTooLarge: 413,
  unsupportedMediaType: 415,
} as const

export class ApiError extends Error {
  constructor(
    public readonly status: (typeof STATUS)[keyof typeof STATUS],
    message: string,
    public readonly code: string,
  ) {
    super(message)
  }
}

export function validationError(error: ZodError) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu chưa hợp lệ',
      fields: error.flatten().fieldErrors,
    },
  }
}

export function apiErrorResponse(context: Context<AppEnvironment>, error: unknown) {
  if (error instanceof ApiError) {
    return context.json({ error: { code: error.code, message: error.message } }, error.status)
  }

  console.error(error)
  return context.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Hệ thống đang bận, vui lòng thử lại' } },
    500,
  )
}

