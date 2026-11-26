import { describe, expect, it } from 'vitest'
import { PlacementAnswerResponseSchema, StartPlacementResponseSchema } from './placement'

const question = {
  id: 'q1',
  topic: { slug: 't', name: 'T' },
  stem: 's',
  options: ['a', 'b', 'c', 'd'],
  difficulty: 2,
  reportedByMe: false,
}
const feedback = { correct: true, correctIndex: 1, explanation: 'e' }
const progress = { answered: 1, total: 20 }

describe('StartPlacementResponseSchema', () => {
  it('aceita retomada com answered > 0 e inicio com 0', () => {
    for (const answered of [0, 7]) {
      expect(
        StartPlacementResponseSchema.safeParse({
          sessionId: 's',
          question,
          progress: { answered, total: 20 },
        }).success,
      ).toBe(true)
    }
  })
})

describe('PlacementAnswerResponseSchema', () => {
  it('aceita next com question', () => {
    const r = PlacementAnswerResponseSchema.safeParse({
      feedback,
      next: { question },
      progress,
      newAchievements: [],
    })
    expect(r.success).toBe(true)
  })
  it('aceita next com result', () => {
    const r = PlacementAnswerResponseSchema.safeParse({
      feedback,
      next: {
        result: {
          level: 'basico',
          theta: -1,
          topics: [{ slug: 't', name: 'T', level: 'basico', strength: 'neutro' }],
        },
      },
      progress,
      newAchievements: [],
    })
    expect(r.success).toBe(true)
  })
  it('recusa next vazio', () => {
    expect(
      PlacementAnswerResponseSchema.safeParse({
        feedback,
        next: {},
        progress,
        newAchievements: [],
      }).success,
    ).toBe(false)
  })
})
