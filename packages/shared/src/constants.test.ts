import { describe, expect, it } from 'vitest'
import * as c from './constants'

describe('constants', () => {
  it('tem os valores da ARCHITECTURE', () => {
    expect(c.PLACEMENT_MIN_QUESTIONS).toBe(10)
    expect(c.PLACEMENT_MAX_QUESTIONS).toBe(20)
    expect(c.PLACEMENT_SE_STOP).toBe(0.6)
    expect(c.PLACEMENT_COOLDOWN_DAYS).toBe(7)
    expect(c.PRACTICE_SIZE).toBe(5)
    expect(c.PRACTICE_MAX_DUE).toBe(2)
    expect(c.DIFFICULTY_OFFSET_MIN).toBe(-2)
    expect(c.DIFFICULTY_OFFSET_MAX).toBe(2)
    expect(c.LIVES_MAX).toBe(5)
    expect(c.LIFE_REGEN_HOURS).toBe(4)
    expect(c.REPORT_REASONS).toHaveLength(4)
  })

  it('TECH_INPUT_PATTERN aceita o charset e recusa o resto', () => {
    expect(c.TECH_INPUT_PATTERN.test('c# .net-1+')).toBe(true)
    expect(c.TECH_INPUT_PATTERN.test('react<script>')).toBe(false)
  })
})
