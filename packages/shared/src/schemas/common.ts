import { z } from 'zod'

export const LevelSchema = z.enum([
  'iniciante',
  'basico',
  'intermediario',
  'avancado',
  'especialista',
])
export type Level = z.infer<typeof LevelSchema>

export const DifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

export const IsoDateTimeSchema = z.iso.datetime({ offset: true })

/** Pergunta como o cliente a recebe: nunca tem correctIndex nem explanation (RNF-04). */
export const QuestionDTOSchema = z
  .object({
    id: z.string().min(1),
    topic: z.object({ slug: z.string(), name: z.string() }),
    stem: z.string(),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    difficulty: DifficultySchema,
    reportedByMe: z.boolean(),
  })
  .strict()
export type QuestionDTO = z.infer<typeof QuestionDTOSchema>

export const PracticeQuestionDTOSchema = QuestionDTOSchema.extend({
  source: z.enum(['review', 'new']),
}).strict()
export type PracticeQuestionDTO = z.infer<typeof PracticeQuestionDTOSchema>

export const AnswerFeedbackSchema = z.object({
  correct: z.boolean(),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
})
export type AnswerFeedback = z.infer<typeof AnswerFeedbackSchema>

export const ProgressSchema = z.object({
  answered: z.number().int().nonnegative(),
  total: z.number().int().positive(),
})
export type Progress = z.infer<typeof ProgressSchema>

export const AnswerRequestSchema = z
  .object({
    questionId: z.string().min(1),
    chosenIndex: z.number().int().min(0).max(3),
  })
  .strict()
export type AnswerRequest = z.infer<typeof AnswerRequestSchema>
