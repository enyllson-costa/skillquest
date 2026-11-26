import { z } from 'zod'
import { DifficultySchema } from './common'

// Contem a resposta correta: fica fora do index publico (subpath @skillquest/shared/fixtures).
export const QuestionFixtureSchema = z
  .object({
    id: z.string().min(1),
    topicSlug: z.string().min(1),
    stem: z.string().min(1),
    options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    difficulty: DifficultySchema,
  })
  .strict()
export type QuestionFixture = z.infer<typeof QuestionFixtureSchema>

const normalize = (s: string): string => s.trim().toLowerCase()

export const TechnologyFixtureSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    aliases: z.array(z.string()),
    topics: z.array(
      z
        .object({
          slug: z.string().min(1),
          name: z.string().min(1),
          position: z.number().int().min(0),
        })
        .strict(),
    ),
    questions: z.array(QuestionFixtureSchema),
  })
  .strict()
  .superRefine((tech, ctx) => {
    const topicSlugs = new Set(tech.topics.map((t) => t.slug))
    const ids = new Set<string>()
    tech.questions.forEach((q, i) => {
      if (ids.has(q.id)) {
        ctx.addIssue({ code: 'custom', path: ['questions', i, 'id'], message: 'id duplicado' })
      }
      ids.add(q.id)
      if (!topicSlugs.has(q.topicSlug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', i, 'topicSlug'],
          message: 'topicSlug inexistente em topics',
        })
      }
      if (new Set(q.options.map(normalize)).size !== q.options.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', i, 'options'],
          message: 'opcoes repetidas',
        })
      }
    })
  })
export type TechnologyFixture = z.infer<typeof TechnologyFixtureSchema>
