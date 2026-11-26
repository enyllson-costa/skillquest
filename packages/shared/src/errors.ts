import { z } from 'zod'

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  NOT_A_TECHNOLOGY: 'NOT_A_TECHNOLOGY',
  NO_LIVES: 'NO_LIVES',
  PLACEMENT_COOLDOWN: 'PLACEMENT_COOLDOWN',
  PLACEMENT_REQUIRED: 'PLACEMENT_REQUIRED',
  SESSION_FINISHED: 'SESSION_FINISHED',
  NO_MISTAKES: 'NO_MISTAKES',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NOT_A_TECHNOLOGY: 422,
  NO_LIVES: 409,
  PLACEMENT_COOLDOWN: 409,
  PLACEMENT_REQUIRED: 409,
  SESSION_FINISHED: 409,
  NO_MISTAKES: 409,
  RATE_LIMITED: 429,
  AI_QUOTA_EXCEEDED: 503,
  AI_INVALID_RESPONSE: 502,
}

export const ErrorCodeSchema = z.enum(ErrorCode)

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
  }),
})
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
