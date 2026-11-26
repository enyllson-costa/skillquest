import { z } from 'zod'
import { TECH_INPUT_MAX, TECH_INPUT_PATTERN } from '../constants'

export const TechnologyInputSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().min(1).max(TECH_INPUT_MAX).regex(TECH_INPUT_PATTERN, 'Caracteres invalidos'))

export const ResolveTechnologyRequestSchema = z.object({ input: TechnologyInputSchema }).strict()
export type ResolveTechnologyRequest = z.infer<typeof ResolveTechnologyRequestSchema>

export const ResolveTechnologyResponseSchema = z.object({
  technology: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
  topics: z.array(z.object({ slug: z.string(), name: z.string() })),
})
export type ResolveTechnologyResponse = z.infer<typeof ResolveTechnologyResponseSchema>
