import { describe, expect, it } from 'vitest'
import {
  HintResponseSchema,
  PracticeAnswerResponseSchema,
  PracticeFeedbackRequestSchema,
  PracticeSummaryDTOSchema,
} from './practice'

const summary = {
  activeSessionId: null,
  dueReviews: 0,
  dailyGoalDone: false,
  lives: 5,
  livesRefillAt: null,
}

describe('PracticeSummaryDTOSchema', () => {
  it('aceita placementAvailableAt nulo', () => {
    expect(
      PracticeSummaryDTOSchema.safeParse({ ...summary, placementAvailableAt: null }).success,
    ).toBe(true)
  })
  it('aceita placementAvailableAt ISO e recusa texto livre', () => {
    expect(
      PracticeSummaryDTOSchema.safeParse({
        ...summary,
        placementAvailableAt: '2026-12-03T10:00:00.000Z',
      }).success,
    ).toBe(true)
    expect(
      PracticeSummaryDTOSchema.safeParse({ ...summary, placementAvailableAt: 'amanha' }).success,
    ).toBe(false)
  })
  it('exige placementAvailableAt', () => {
    expect(PracticeSummaryDTOSchema.safeParse(summary).success).toBe(false)
  })
})

describe('PracticeFeedbackRequestSchema', () => {
  it('aceita os 3 ratings', () => {
    for (const rating of ['facil', 'na_medida', 'dificil']) {
      expect(PracticeFeedbackRequestSchema.safeParse({ rating }).success).toBe(true)
    }
  })
  it('recusa rating desconhecido e campos extras', () => {
    expect(PracticeFeedbackRequestSchema.safeParse({ rating: 'medio' }).success).toBe(false)
    expect(PracticeFeedbackRequestSchema.safeParse({ rating: 'facil', x: 1 }).success).toBe(false)
  })
})

describe('PracticeAnswerResponseSchema', () => {
  const base = {
    feedback: { correct: false, correctIndex: 0, explanation: 'e' },
    xpGained: 0,
    lives: 4,
    progress: { answered: 5, total: 5 },
    newAchievements: [],
  }
  it('aceita next com result', () => {
    expect(
      PracticeAnswerResponseSchema.safeParse({
        ...base,
        next: { result: { correctCount: 3, total: 5, xpGained: 50 } },
      }).success,
    ).toBe(true)
  })
  it('recusa next com pergunta sem source', () => {
    expect(
      PracticeAnswerResponseSchema.safeParse({
        ...base,
        next: {
          question: {
            id: 'q',
            topic: { slug: 't', name: 'T' },
            stem: 's',
            options: ['a', 'b', 'c', 'd'],
            difficulty: 1,
            reportedByMe: false,
          },
        },
      }).success,
    ).toBe(false)
  })
  it('recusa next vazio', () => {
    expect(PracticeAnswerResponseSchema.safeParse({ ...base, next: {} }).success).toBe(false)
  })
  it('recusa next com question e result juntos', () => {
    expect(
      PracticeAnswerResponseSchema.safeParse({
        ...base,
        next: {
          question: {
            id: 'q',
            topic: { slug: 't', name: 'T' },
            stem: 's',
            options: ['a', 'b', 'c', 'd'],
            difficulty: 1,
            reportedByMe: false,
            source: 'new',
          },
          result: { correctCount: 3, total: 5, xpGained: 50 },
        },
      }).success,
    ).toBe(false)
  })
})

describe('HintResponseSchema', () => {
  it('limita o indice a 0..3', () => {
    expect(HintResponseSchema.safeParse({ eliminatedIndex: 3 }).success).toBe(true)
    expect(HintResponseSchema.safeParse({ eliminatedIndex: 4 }).success).toBe(false)
  })
})
