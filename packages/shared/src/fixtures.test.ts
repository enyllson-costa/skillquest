import { describe, expect, it } from 'vitest'
import * as fixtures from './fixtures'
import * as publicApi from './index'

describe('subpath fixtures', () => {
  it('exporta os schemas de fixtures', () => {
    expect(fixtures.TechnologyFixtureSchema).toBeDefined()
    expect(fixtures.QuestionFixtureSchema).toBeDefined()
  })
  it('o index publico nao exporta os schemas de fixtures', () => {
    expect('TechnologyFixtureSchema' in publicApi).toBe(false)
    expect('QuestionFixtureSchema' in publicApi).toBe(false)
  })
})
