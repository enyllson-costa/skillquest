import { z } from 'zod'
import { IsoDateTimeSchema, LevelSchema } from './common'

export const MeProgressResponseSchema = z.object({
  xpTotal: z.number().int().nonnegative(),
  streak: z.object({
    current: z.number().int().nonnegative(),
    best: z.number().int().nonnegative(),
  }),
  lives: z.number().int().min(0),
  livesRefillAt: IsoDateTimeSchema.nullable(),
  achievementsUnlocked: z.number().int().nonnegative(),
  technologies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      level: LevelSchema.nullable(),
      theta: z.number().nullable(),
      placementInProgress: z.boolean(),
      lastActivityAt: IsoDateTimeSchema,
      mistakesPending: z.number().int().nonnegative(),
      topics: z.array(z.object({ slug: z.string(), name: z.string(), level: LevelSchema })),
    }),
  ),
})
export type MeProgressResponse = z.infer<typeof MeProgressResponseSchema>
