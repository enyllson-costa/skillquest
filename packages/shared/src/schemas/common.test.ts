import { describe, expect, it } from 'vitest'
import { AnswerRequestSchema, PracticeQuestionDTOSchema, QuestionDTOSchema } from './common'

const base = {
  id: 'q1',
  topic: { slug: 'generics', name: 'Generics' },
  stem: 'O que e?',
  options: ['a', 'b', 'c', 'd'],
  difficulty: 3,
  reportedByMe: false,
}

describe('QuestionDTOSchema', () => {
  it('aceita a pergunta sem resposta', () => {
    expect(QuestionDTOSchema.safeParse(base).success).toBe(true)
  })
  it('recusa correctIndex e explanation', () => {
    expect(QuestionDTOSchema.safeParse({ ...base, correctIndex: 1 }).success).toBe(false)
    expect(QuestionDTOSchema.safeParse({ ...base, explanation: 'x' }).success).toBe(false)
  })
  it('exige reportedByMe', () => {
    const rest: Record<string, unknown> = { ...base }
    delete rest['reportedByMe']
    expect(QuestionDTOSchema.safeParse(rest).success).toBe(false)
  })
})

describe('PracticeQuestionDTOSchema', () => {
  it('exige source valido', () => {
    expect(PracticeQuestionDTOSchema.safeParse(base).success).toBe(false)
    expect(PracticeQuestionDTOSchema.safeParse({ ...base, source: 'review' }).success).toBe(true)
    expect(PracticeQuestionDTOSchema.safeParse({ ...base, source: 'x' }).success).toBe(false)
  })
  it('recusa correctIndex', () => {
    expect(
      PracticeQuestionDTOSchema.safeParse({ ...base, source: 'new', correctIndex: 0 }).success,
    ).toBe(false)
  })
})

describe('AnswerRequestSchema', () => {
  it('limita chosenIndex a 0..3', () => {
    expect(AnswerRequestSchema.safeParse({ questionId: 'q', chosenIndex: 3 }).success).toBe(true)
    expect(AnswerRequestSchema.safeParse({ questionId: 'q', chosenIndex: 4 }).success).toBe(false)
  })
})
