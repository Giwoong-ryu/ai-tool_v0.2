// src/lib/supabase-clerk.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Clerk JWT를 지원하는 Supabase 클라이언트
export const supabaseWithClerk = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Clerk에서 세션 관리를 담당
    detectSessionInUrl: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'X-Client-Info': 'easypick-clerk-integration'
    }
  }
})

// Clerk JWT를 Supabase에 설정하는 함수
export const setSupabaseAuth = async (clerkToken) => {
  if (!clerkToken) {
    // JWT가 없으면 세션 제거
    await supabaseWithClerk.auth.signOut()
    return false
  }

  try {
    // Clerk JWT를 Supabase 세션으로 설정
    const { data, error } = await supabaseWithClerk.auth.setSession({
      access_token: clerkToken,
      refresh_token: 'clerk-managed' // Clerk에서 refresh 처리
    })

    if (error) {
      console.error('❌ Supabase JWT 설정 오류:', error)
      return false
    }

    console.log('✅ Supabase JWT 설정 완료')
    return true
  } catch (error) {
    console.error('❌ Supabase JWT 설정 예외:', error)
    return false
  }
}

// RLS 정책에서 사용할 커스텀 auth 함수들
export const createAuthHelpers = () => {
  // 현재 사용자 ID 가져오기
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabaseWithClerk.auth.getUser()
    return user?.id || null
  }

  // 사용자 권한 확인
  const checkUserRole = async (requiredRole) => {
    const userId = await getCurrentUserId()
    if (!userId) return false

    const { data, error } = await supabaseWithClerk
      .from('clerk_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return false

    const roleHierarchy = {
      'admin': 4,
      'business': 3,
      'pro': 2,
      'free': 1
    }

    return roleHierarchy[data.role] >= roleHierarchy[requiredRole]
  }

  // 활성 구독 확인
  const hasActiveSubscription = async () => {
    const userId = await getCurrentUserId()
    if (!userId) return false

    const { data, error } = await supabaseWithClerk
      .from('clerk_subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .limit(1)

    return !error && data && data.length > 0
  }

  // 사용량 제한 확인
  const checkUsageQuota = async (eventType) => {
    const userId = await getCurrentUserId()
    if (!userId) return false

    try {
      const { data, error } = await supabaseWithClerk.rpc('check_usage_limit', {
        p_user_id: userId,
        p_event_type: eventType,
        p_count: 1
      })

      return !error && data
    } catch (error) {
      console.error('사용량 확인 오류:', error)
      return false
    }
  }

  return {
    getCurrentUserId,
    checkUserRole,
    hasActiveSubscription,
    checkUsageQuota
  }
}

// RLS 정책 헬퍼 - SQL에서 사용할 수 있는 함수들
export const RLS_HELPERS = `
-- Clerk JWT에서 사용자 ID 추출 함수
CREATE OR REPLACE FUNCTION auth.clerk_user_id() 
RETURNS text AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',
    (auth.jwt() ->> 'user_id')::text,
    NULL
  );
$$ LANGUAGE sql STABLE;

-- 현재 사용자가 특정 역할인지 확인
CREATE OR REPLACE FUNCTION auth.has_role(required_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.clerk_user_id()::uuid 
    AND role = required_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 현재 사용자가 최소 역할 요구사항을 충족하는지 확인
CREATE OR REPLACE FUNCTION auth.has_min_role(min_role text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_levels jsonb := '{"free": 1, "pro": 2, "business": 3, "admin": 4}';
BEGIN
  SELECT role INTO user_role 
  FROM public.clerk_profiles 
  WHERE id = auth.clerk_user_id()::uuid;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (role_levels ->> user_role)::int >= (role_levels ->> min_role)::int;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 활성 구독 확인
CREATE OR REPLACE FUNCTION auth.has_active_subscription()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clerk_subscriptions 
    WHERE user_id = auth.clerk_user_id()::uuid
    AND status = 'active'
    AND current_period_end > NOW()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 사용자 소유 확인
CREATE OR REPLACE FUNCTION auth.is_owner(resource_user_id uuid)
RETURNS boolean AS $$
  SELECT auth.clerk_user_id()::uuid = resource_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 관리자 권한 확인
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
  SELECT auth.has_role('admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;
`

// Clerk 인증과 함께 사용할 Supabase 클라이언트 설정
export const configureSupabaseForClerk = (getToken) => {
  // 요청 인터셉터 설정
  supabaseWithClerk.rest.headers = {
    ...supabaseWithClerk.rest.headers,
    get authorization() {
      // 매 요청마다 최신 Clerk JWT 사용
      return getToken ? `Bearer ${getToken()}` : supabaseWithClerk.rest.headers.authorization
    }
  }

  return supabaseWithClerk
}