import { z } from 'zod'
import { REPORT_DETAILS_MAX, REPORT_REASONS } from '../constants'

export const ReportReasonSchema = z.enum(REPORT_REASONS)

export const ReportQuestionRequestSchema = z
  .object({
    reason: ReportReasonSchema,
    details: z.string().trim().max(REPORT_DETAILS_MAX).optional(),
  })
  .strict()
export type ReportQuestionRequest = z.infer<typeof ReportQuestionRequestSchema>
