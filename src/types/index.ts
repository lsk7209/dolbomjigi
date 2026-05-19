export interface Robot {
  id: number
  slug: string
  name_ko: string
  name_en?: string
  manufacturer: string
  category: string
  price_min?: number
  price_max?: number
  subscription_monthly?: number
  description?: string
  image_url?: string
  features?: string[]
  target_users?: string[]
  created_at?: string
  updated_at?: string
}

export interface Region {
  id: number
  slug: string
  sido_name: string
  sigungu_name?: string
  level: 'sido' | 'sigungu'
  population?: number
  elderly_ratio?: number
  created_at?: string
  updated_at?: string
}

export interface SupportProgram {
  id: number
  slug: string
  name_ko: string
  program_type: string
  human_reviewed: boolean
  status: string
  region_id?: number
  description?: string
  eligibility?: string
  benefit?: string
  application_url?: string
  source_url?: string
  source_name?: string
  license?: string
  confirmed_at?: string
  next_update_at?: string
  created_at?: string
  updated_at?: string
}

export interface Author {
  id: number
  slug: string
  name: string
  role?: string
  credentials_json?: string
  bio?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface FAQ {
  question: string
  answer: string
}

export interface LintViolations {
  medical: string[]
  promotional: string[]
}

export interface LintResult {
  ok: boolean
  violations: LintViolations
}
