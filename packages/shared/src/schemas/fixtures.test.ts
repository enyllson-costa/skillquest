import { describe, expect, it } from 'vitest'
import { TechnologyFixtureSchema } from './fixtures'

const question = {
  id: 'ts-1',
  topicSlug: 'generics',
  stem: 'O que e um generic?',
  options: ['a', 'b', 'c', 'd'],
  correctIndex: 2,
  explanation: 'Porque sim.',
  difficulty: 3,
}
const tech = {
  slug: 'typescript',
  name: 'TypeScript',
  aliases: ['ts'],
  topics: [{ slug: 'generics', name: 'Generics', position: 0 }],
  questions: [question],
}

describe('TechnologyFixtureSchema', () => {
  it('aceita uma fixture valida minima', () => {
    expect(TechnologyFixtureSchema.safeParse(tech).success).toBe(true)
  })
  it('recusa id duplicado', () => {
    const r = TechnologyFixtureSchema.safeParse({ ...tech, questions: [question, question] })
    expect(r.success).toBe(false)
  })
  it('recusa topicSlug inexistente', () => {
    const r = TechnologyFixtureSchema.safeParse({
      ...tech,
      questions: [{ ...question, topicSlug: 'outro' }],
    })
    expect(r.success).toBe(false)
  })
  it('recusa opcoes repetidas depois de normalizar', () => {
    const r = TechnologyFixtureSchema.safeParse({
      ...tech,
      questions: [{ ...question, options: ['a', ' A ', 'c', 'd'] }],
    })
    expect(r.success).toBe(false)
  })
  it('recusa correctIndex 4', () => {
    const r = TechnologyFixtureSchema.safeParse({
      ...tech,
      questions: [{ ...question, correctIndex: 4 }],
    })
    expect(r.success).toBe(false)
  })
  it('recusa campo extra na tecnologia e na pergunta', () => {
    expect(TechnologyFixtureSchema.safeParse({ ...tech, extra: 1 }).success).toBe(false)
    expect(
      TechnologyFixtureSchema.safeParse({ ...tech, questions: [{ ...question, extra: 1 }] })
        .success,
    ).toBe(false)
  })
  it('recusa position negativa e dificuldade 6', () => {
    expect(
      TechnologyFixtureSchema.safeParse({
        ...tech,
        topics: [{ slug: 'generics', name: 'G', position: -1 }],
      }).success,
    ).toBe(false)
    expect(
      TechnologyFixtureSchema.safeParse({ ...tech, questions: [{ ...question, difficulty: 6 }] })
        .success,
    ).toBe(false)
  })
})
