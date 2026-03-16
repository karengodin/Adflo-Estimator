export type UserRole = 'admin' | 'team' | 'sales' | 'client'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Session {
  id: string
  client_name: string
  created_by: string // profile id
  created_at: string
  updated_at: string
  status: 'draft' | 'submitted' | 'reviewed' | 'closed'
  answers: Record<number, 'Yes' | 'No'>
  activated_levers: number[]
  estimated_hours: number
  tier: string
  notes: string | null
  share_token: string
  // joined
  created_by_profile?: Profile
}

export interface HistoryEntry {
  id: string
  session_id: string | null
  client_name: string
  rep_name: string | null
  date_completed: string
  estimated_hours: number
  actual_hours: number
  tier: string
  timeline: string
  answers: Record<number, 'Yes' | 'No'>
  created_by: string
  created_at: string
}

export interface LogicSettings {
  id: string
  base_hours: number
  best_case_multiplier: number
  worst_case_multiplier: number
  learning_blend_cap: number
  min_projects_for_full_learning: number
  tiers: TierConfig[]
  updated_at: string
  updated_by: string
}

export interface TierConfig {
  name: string
  min_hours: number
  timeline: string
}

export interface Question {
  id: number
  cat: string
  q: string
  trigger: 'Yes' | 'No'
  weight: number
  can_remove: boolean
  lever_name: string | null
  lever_desc: string | null
  sort_order: number
  active: boolean
}

export interface LearnedWeight {
  question_id: number
  manual_weight: number
  learned_weight: number | null
  project_count: number
}

export interface EstimateResult {
  expected: number
  best: number
  worst: number
  tier: TierConfig
  triggeredIds: number[]
}
