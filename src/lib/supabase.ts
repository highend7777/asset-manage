import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Publishable Key is missing in .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Database Types
export interface FamilyMember {
  id: string
  name: string
  relationship: string
  created_at: string
}

export interface Account {
  id: string
  member_id: string
  institution: string
  name: string
  account_number?: string
  created_at: string
}

export interface Asset {
  id: string
  member_id: string
  account_id: string | null
  type: 'stock' | 'bond' | 'cash' | 'crypto'
  name: string
  amount: number
  currency: string
  symbol?: string
  current_value?: number
  created_at: string
}

export type NewsItem = {
  id: string
  asset_symbol: string
  title: string
  summary: string
  relevance_score: number
  importance: '매우 중요' | '중요' | '참고'
  source_url: string
  created_at: string
}

export type WeeklyReport = {
  id: string
  start_date: string
  end_date: string
  content: string
  ai_metadata: any
  created_at: string
}
