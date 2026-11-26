import { describe, expect, it } from 'vitest'
import { MeProgressResponseSchema } from './progress'

const tech = {
  id: 't1',
  name: 'Go',
  level: null,
  theta: null,
  placementInProgress: true,
  lastActivityAt: '2026-11-26T10:00:00Z',
  mistakesPending: 0,
  topics: [],
}
const base = {
  xpTotal: 0,
  streak: { current: 0, best: 0 },
  lives: 5,
  livesRefillAt: null,
  achievementsUnlocked: 0,
  technologies: [tech],
}

describe('MeProgressResponseSchema', () => {
  it('aceita tecnologia com level nulo e nivelamento em andamento', () => {
    expect(MeProgressResponseSchema.safeParse(base).success).toBe(true)
  })
  it('exige lastActivityAt', () => {
    const semData: Record<string, unknown> = { ...tech }
    delete semData['lastActivityAt']
    expect(MeProgressResponseSchema.safeParse({ ...base, technologies: [semData] }).success).toBe(
      false,
    )
  })
  it('aceita tecnologia nivelada com topicos', () => {
    expect(
      MeProgressResponseSchema.safeParse({
        ...base,
        technologies: [
          {
            ...tech,
            level: 'avancado',
            theta: 0.8,
            placementInProgress: false,
            topics: [{ slug: 'a', name: 'A', level: 'basico' }],
          },
        ],
      }).success,
    ).toBe(true)
  })
})
