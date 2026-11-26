import { describe, expect, it } from 'vitest'
import { ERROR_HTTP_STATUS, ErrorCode, ErrorResponseSchema } from './errors'

describe('ErrorCode', () => {
  it('tem os 12 codigos e nao tem LESSON_LOCKED', () => {
    expect(Object.keys(ErrorCode)).toHaveLength(12)
    expect(Object.keys(ErrorCode)).not.toContain('LESSON_LOCKED')
  })

  it('mapeia todos os codigos para um status HTTP', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ERROR_HTTP_STATUS[code]).toBeGreaterThanOrEqual(400)
    }
    expect(ERROR_HTTP_STATUS.RATE_LIMITED).toBe(429)
    expect(ERROR_HTTP_STATUS.NOT_A_TECHNOLOGY).toBe(422)
    expect(ERROR_HTTP_STATUS.AI_INVALID_RESPONSE).toBe(502)
  })
})

describe('ErrorResponseSchema', () => {
  it('aceita retryAfterSeconds opcional', () => {
    expect(
      ErrorResponseSchema.safeParse({
        error: { code: 'NO_LIVES', message: 'x', retryAfterSeconds: 60 },
      }).success,
    ).toBe(true)
    expect(
      ErrorResponseSchema.safeParse({ error: { code: 'NOT_FOUND', message: 'x' } }).success,
    ).toBe(true)
  })

  it('recusa codigo desconhecido', () => {
    expect(
      ErrorResponseSchema.safeParse({ error: { code: 'LESSON_LOCKED', message: 'x' } }).success,
    ).toBe(false)
  })
})
