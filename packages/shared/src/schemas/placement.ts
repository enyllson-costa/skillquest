import { z } from 'zod'
import { AchievementDTOSchema } from './achievements'
import {
  AnswerFeedbackSchema,
  AnswerRequestSchema,
  LevelSchema,
  ProgressSchema,
  QuestionDTOSchema,
} from './common'

export const StartPlacementRequestSchema = z.object({ technologyId: z.string().min(1) }).strict()
export type StartPlacementRequest = z.infer<typeof StartPlacementRequestSchema>

// answered >= 0: na retomada, vem com as respostas ja dadas.
export const StartPlacementResponseSchema = z
  .object({
    sessionId: z.string(),
    question: QuestionDTOSchema,
    progress: ProgressSchema,
  })
  .strict()
export type StartPlacementResponse = z.infer<typeof StartPlacementResponseSchema>

export const PlacementAnswerRequestSchema = AnswerRequestSchema
export type PlacementAnswerRequest = z.infer<typeof PlacementAnswerRequestSchema>

export const PlacementResultSchema = z.object({
  level: LevelSchema,
  theta: z.number(),
  topics: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      level: LevelSchema,
      strength: z.enum(['forte', 'fraco', 'neutro']),
    }),
  ),
})
export type PlacementResult = z.infer<typeof PlacementResultSchema>

export const PlacementAnswerResponseSchema = z
  .object({
    feedback: AnswerFeedbackSchema,
    next: z.union([
      z.object({ question: QuestionDTOSchema }).strict(),
      z.object({ result: PlacementResultSchema }).strict(),
    ]),
    progress: ProgressSchema,
    newAchievements: z.array(AchievementDTOSchema),
  })
  .strict()
export type PlacementAnswerResponse = z.infer<typeof PlacementAnswerResponseSchema>
