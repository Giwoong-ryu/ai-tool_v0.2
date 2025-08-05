// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 타입 정의 (TypeScript 사용시)
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic', 
  PRO: 'pro'
} as const

export const ACTIVITY_TYPES = {
  VIEW: 'view',
  SEARCH: 'search', 
  BOOKMARK: 'bookmark',
  UNBOOKMARK: 'unbookmark',
  CLICK: 'click'
} as const

export const PRICING_TYPES = {
  FREE: 'free',
  FREEMIUM: 'freemium',
  PAID: 'paid'
} as const
