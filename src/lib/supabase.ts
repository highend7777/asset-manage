import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Types ---

export type AssetCategory = 'stock' | 'bond' | 'cash' | 'crypto' | 'etc'

export interface Account {
  id: string
  user_id: string
  name: string
  institution: string
  created_at: string
}

export interface Product {
  id: string
  user_id: string
  symbol: string
  name: string
  category: AssetCategory
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  product_id: string
  amount: number
  price: number
  transaction_date: string
  created_at: string
}

export interface ProductPrice {
  id: string
  product_id: string
  price: number
  price_date: string
  created_at: string
}

export interface Dividend {
  id: string
  product_id: string
  amount_per_share: number
  payment_date: string
  created_at: string
}

export interface NewsItem {
  id: string
  user_id: string
  asset_symbol: string
  title: string
  summary: string
  relevance_score: number
  importance: string
  source_url: string
  created_at: string
}

export interface Report {
  id: string
  user_id: string
  content: string
  created_at: string
}
