export const TECH_INPUT_MAX = 40
export const TECH_INPUT_PATTERN = /^[a-z0-9 .+#-]+$/

export const PLACEMENT_MIN_QUESTIONS = 10
export const PLACEMENT_MAX_QUESTIONS = 20
export const PLACEMENT_SE_STOP = 0.6
export const PLACEMENT_COOLDOWN_DAYS = 7

export const PRACTICE_SIZE = 5
export const PRACTICE_MAX_DUE = 2
export const PRACTICE_WEAK_TOPICS = 2
export const DIFFICULTY_OFFSET_MIN = -2
export const DIFFICULTY_OFFSET_MAX = 2
export const PRACTICE_ABANDON_HOURS = 24
export const PRACTICE_SESSION_BONUS_XP = 20

export const LIVES_MAX = 5
export const LIFE_REGEN_HOURS = 4

export const REPORT_DETAILS_MAX = 280
export const REPORT_REASONS = [
  'resposta_errada',
  'ambigua',
  'mais_de_uma_correta',
  'outro',
] as const
