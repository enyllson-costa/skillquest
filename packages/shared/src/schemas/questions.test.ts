import { describe, expect, it } from 'vitest'
import { ReportQuestionRequestSchema } from './questions'

describe('ReportQuestionRequestSchema', () => {
  it('exige reason valido', () => {
    expect(ReportQuestionRequestSchema.safeParse({}).success).toBe(false)
    expect(ReportQuestionRequestSchema.safeParse({ reason: 'x' }).success).toBe(false)
  })
  it('aceita sem details', () => {
    expect(ReportQuestionRequestSchema.safeParse({ reason: 'ambigua' }).success).toBe(true)
  })
  it('limita details a 280', () => {
    expect(
      ReportQuestionRequestSchema.safeParse({ reason: 'outro', details: 'a'.repeat(280) }).success,
    ).toBe(true)
    expect(
      ReportQuestionRequestSchema.safeParse({ reason: 'outro', details: 'a'.repeat(281) }).success,
    ).toBe(false)
  })
  it('recusa campo extra', () => {
    expect(ReportQuestionRequestSchema.safeParse({ reason: 'outro', x: 1 }).success).toBe(false)
  })
})
