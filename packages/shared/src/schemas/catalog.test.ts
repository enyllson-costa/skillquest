import { describe, expect, it } from 'vitest'
import {
  ResolveTechnologyRequestSchema,
  ResolveTechnologyResponseSchema,
  TechnologyInputSchema,
} from './catalog'

describe('TechnologyInputSchema', () => {
  it('normaliza trim e minusculas', () => {
    expect(TechnologyInputSchema.parse(' React ')).toBe('react')
  })
  it('aceita 40 e recusa 41 caracteres', () => {
    expect(TechnologyInputSchema.safeParse('a'.repeat(40)).success).toBe(true)
    expect(TechnologyInputSchema.safeParse('a'.repeat(41)).success).toBe(false)
  })
  it('recusa charset invalido e vazio', () => {
    expect(TechnologyInputSchema.safeParse('react<script>').success).toBe(false)
    expect(TechnologyInputSchema.safeParse('   ').success).toBe(false)
  })
  it('aceita c# e .net', () => {
    expect(TechnologyInputSchema.safeParse('C#').success).toBe(true)
    expect(TechnologyInputSchema.safeParse('.NET').success).toBe(true)
  })
})

describe('Resolve schemas', () => {
  it('request normaliza e recusa campo extra', () => {
    expect(ResolveTechnologyRequestSchema.parse({ input: ' Go ' })).toEqual({ input: 'go' })
    expect(ResolveTechnologyRequestSchema.safeParse({ input: 'go', x: 1 }).success).toBe(false)
  })
  it('response valida', () => {
    expect(
      ResolveTechnologyResponseSchema.safeParse({
        technology: { id: '1', slug: 'go', name: 'Go' },
        topics: [{ slug: 'a', name: 'A' }],
      }).success,
    ).toBe(true)
  })
})
