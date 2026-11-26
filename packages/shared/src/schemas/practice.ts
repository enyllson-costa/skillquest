import { z } from 'zod'
import { DIFFICULTY_OFFSET_MAX, DIFFICULTY_OFFSET_MIN, PRACTICE_SIZE } from '../constants'
import { AchievementDTOSchema } from './achievements'
import {
  AnswerFeedbackSchema,
  AnswerRequestSchema,
  IsoDateTimeSchema,
  PracticeQuestionDTOSchema,
  ProgressSchema,
} from './common'

export const PracticeSummaryDTOSchema = z.object({
  activeSessionId: z.string().nullable(),
  dueReviews: z.number().int().nonnegative(),
  dailyGoalDone: z.boolean(),
  lives: z.number().int().min(0),
  livesRefillAt: IsoDateTimeSchema.nullable(),
  placementAvailableAt: IsoDateTimeSchema.nullable(),
})
export type PracticeSummaryDTO = z.infer<typeof PracticeSummaryDTOSchema>

export const StartPracticeRequestSchema = z.object({ technologyId: z.string().min(1) }).strict()
export type StartPracticeRequest = z.infer<typeof StartPracticeRequestSchema>

export const StartPracticeResponseSchema = z
  .object({
    sessionId: z.string(),
    question: PracticeQuestionDTOSchema,
    progress: ProgressSchema,
    lives: z.number().int().min(0),
  })
  .strict()
export type StartPracticeResponse = z.infer<typeof StartPracticeResponseSchema>

export const PracticeAnswerRequestSchema = AnswerRequestSchema
export type PracticeAnswerRequest = z.infer<typeof PracticeAnswerRequestSchema>

export const PracticeResultSchema = z.object({
  correctCount: z.number().int().min(0).max(PRACTICE_SIZE),
  total: z.literal(PRACTICE_SIZE),
  xpGained: z.number().int().nonnegative(),
})
export type PracticeResult = z.infer<typeof PracticeResultSchema>

export const PracticeAnswerResponseSchema = z
  .object({
    feedback: AnswerFeedbackSchema,
    xpGained: z.number().int().nonnegative(),
    lives: z.number().int().min(0),
    progress: ProgressSchema,
    next: z.union([
      z.object({ question: PracticeQuestionDTOSchema }).strict(),
      z.object({ result: PracticeResultSchema }).strict(),
    ]),
    newAchievements: z.array(AchievementDTOSchema),
  })
  .strict()
export type PracticeAnswerResponse = z.infer<typeof PracticeAnswerResponseSchema>

export const PracticeFeedbackRequestSchema = z
  .object({ rating: z.enum(['facil', 'na_medida', 'dificil']) })
  .strict()
export type PracticeFeedbackRequest = z.infer<typeof PracticeFeedbackRequestSchema>

export const PracticeFeedbackResponseSchema = z.object({
  difficultyOffset: z.number().int().min(DIFFICULTY_OFFSET_MIN).max(DIFFICULTY_OFFSET_MAX),
})
export type PracticeFeedbackResponse = z.infer<typeof PracticeFeedbackResponseSchema>

export const HintRequestSchema = z.object({ questionId: z.string().min(1) }).strict()
export type HintRequest = z.infer<typeof HintRequestSchema>

export const HintResponseSchema = z.object({ eliminatedIndex: z.number().int().min(0).max(3) })
export type HintResponse = z.infer<typeof HintResponseSchema>
