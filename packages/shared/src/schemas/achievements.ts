import { z } from 'zod'
import { IsoDateTimeSchema } from './common'

export const AchievementDTOSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  unlockedAt: IsoDateTimeSchema.nullable(),
})
export type AchievementDTO = z.infer<typeof AchievementDTOSchema>

export const AchievementsResponseSchema = z.object({ achievements: z.array(AchievementDTOSchema) })
export type AchievementsResponse = z.infer<typeof AchievementsResponseSchema>
