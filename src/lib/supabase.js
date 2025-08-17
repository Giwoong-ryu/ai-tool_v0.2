// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 상수 정의
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic', 
  PRO: 'pro'
}

export const ACTIVITY_TYPES = {
  VIEW: 'view',
  SEARCH: 'search', 
  BOOKMARK: 'bookmark',
  UNBOOKMARK: 'unbookmark',
  CLICK: 'click'
}

export const PRICING_TYPES = {
  FREE: 'free',
  FREEMIUM: 'freemium',
  PAID: 'paid'
}
