import { describe, expect, it } from 'vitest'
import { AchievementDTOSchema } from './achievements'

describe('AchievementDTOSchema', () => {
  const a = { slug: 's', name: 'n', description: 'd', icon: 'i' }
  it('aceita unlockedAt nulo ou ISO', () => {
    expect(AchievementDTOSchema.safeParse({ ...a, unlockedAt: null }).success).toBe(true)
    expect(
      AchievementDTOSchema.safeParse({ ...a, unlockedAt: '2026-11-26T10:00:00Z' }).success,
    ).toBe(true)
  })
  it('recusa data invalida', () => {
    expect(AchievementDTOSchema.safeParse({ ...a, unlockedAt: 'ontem' }).success).toBe(false)
  })
})
