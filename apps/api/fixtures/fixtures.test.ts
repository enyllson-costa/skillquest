import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TechnologyFixtureSchema, type TechnologyFixture } from '@skillquest/shared/fixtures'

function load(name: string): TechnologyFixture {
  const raw: unknown = JSON.parse(readFileSync(join(import.meta.dirname, `${name}.json`), 'utf8'))
  return TechnologyFixtureSchema.parse(raw)
}

function expectIntegrity(fx: TechnologyFixture): void {
  const ids = fx.questions.map((q) => q.id)
  expect(new Set(ids).size).toBe(ids.length)
  const topicSlugs = new Set(fx.topics.map((t) => t.slug))
  for (const q of fx.questions) {
    expect(topicSlugs.has(q.topicSlug)).toBe(true)
    expect(new Set(q.options.map((o) => o.trim().toLowerCase())).size).toBe(4)
  }
}

describe('fixtures de tecnologia', () => {
  it('typescript: 5 topicos e >= 2 perguntas por topico x dificuldade', () => {
    const fx = load('typescript')
    expect(fx.slug).toBe('typescript')
    expect(fx.topics.map((t) => t.slug)).toEqual([
      'tipos-basicos',
      'funcoes',
      'interfaces-e-tipos',
      'generics',
      'narrowing',
    ])
    expectIntegrity(fx)
    for (const topic of fx.topics) {
      for (const d of [1, 2, 3, 4, 5]) {
        const n = fx.questions.filter(
          (q) => q.topicSlug === topic.slug && q.difficulty === d,
        ).length
        expect(n, `${topic.slug} d${d}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it.each(['python', 'go'])('%s: 5 topicos e >= 10 perguntas', (name) => {
    const fx = load(name)
    expect(fx.slug).toBe(name)
    expect(fx.topics).toHaveLength(5)
    expect(fx.questions.length).toBeGreaterThanOrEqual(10)
    expectIntegrity(fx)
  })
})
