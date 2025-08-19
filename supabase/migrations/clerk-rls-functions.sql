-- ========================================
-- Clerk JWT Integration for Supabase RLS
-- Clerk 인증을 위한 RLS 함수들
-- ========================================

-- Clerk JWT에서 사용자 ID 추출 함수
CREATE OR REPLACE FUNCTION auth.clerk_user_id() 
RETURNS text AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',           -- Clerk standard claim
    (auth.jwt() ->> 'user_id')::text, -- Clerk custom claim
    auth.uid()::text                 -- Supabase fallback
  );
$$ LANGUAGE sql STABLE;

-- 현재 사용자 UUID 반환 (RLS 정책에서 사용)
CREATE OR REPLACE FUNCTION auth.clerk_user_uuid()
RETURNS uuid AS $$
  SELECT auth.clerk_user_id()::uuid;
$$ LANGUAGE sql STABLE;

-- 현재 사용자가 특정 역할인지 확인
CREATE OR REPLACE FUNCTION auth.has_role(required_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.clerk_user_uuid()
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
  WHERE id = auth.clerk_user_uuid();
  
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
    WHERE user_id = auth.clerk_user_uuid()
    AND status = 'active'
    AND current_period_end > NOW()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 사용자 소유 확인
CREATE OR REPLACE FUNCTION auth.is_owner(resource_user_id uuid)
RETURNS boolean AS $$
  SELECT auth.clerk_user_uuid() = resource_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 관리자 권한 확인
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
  SELECT auth.has_role('admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 인증된 사용자 확인
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS boolean AS $$
  SELECT auth.clerk_user_id() IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- 사용량 제한 확인 (RLS용)
CREATE OR REPLACE FUNCTION auth.can_use_feature(feature_name text)
RETURNS boolean AS $$
DECLARE
  user_id uuid;
  user_role text;
  has_subscription boolean;
BEGIN
  user_id := auth.clerk_user_uuid();
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 사용자 역할 조회
  SELECT role INTO user_role 
  FROM public.clerk_profiles 
  WHERE id = user_id;

  -- 구독 상태 확인
  has_subscription := auth.has_active_subscription();

  -- 기능별 접근 권한 확인
  CASE feature_name
    WHEN 'compile_prompt' THEN
      RETURN user_role IN ('pro', 'business', 'admin') OR has_subscription;
    WHEN 'run_workflow' THEN
      RETURN user_role IN ('pro', 'business', 'admin') OR has_subscription;
    WHEN 'ai_generation' THEN
      RETURN user_role IN ('pro', 'business', 'admin') OR has_subscription;
    WHEN 'export_data' THEN
      RETURN user_role IN ('business', 'admin') OR has_subscription;
    WHEN 'team_management' THEN
      RETURN user_role IN ('business', 'admin');
    WHEN 'search_query', 'bookmark_create', 'review_create' THEN
      RETURN true; -- 모든 사용자 허용
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================
-- 업데이트된 RLS 정책들 (Clerk 대응)
-- ========================================

-- 기존 RLS 정책들을 Clerk 함수로 업데이트

-- 사용자 프로필 정책 업데이트
DROP POLICY IF EXISTS "Users can view own profile" ON public.clerk_profiles;
CREATE POLICY "Users can view own profile" ON public.clerk_profiles
  FOR SELECT USING (auth.is_owner(id));

DROP POLICY IF EXISTS "Users can update own profile" ON public.clerk_profiles;
CREATE POLICY "Users can update own profile" ON public.clerk_profiles
  FOR UPDATE USING (auth.is_owner(id));

-- 구독 정보 정책 업데이트  
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.clerk_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.clerk_subscriptions
  FOR SELECT USING (auth.is_owner(user_id));

-- 거래 내역 정책 업데이트
DROP POLICY IF EXISTS "Users can view own transactions" ON public.clerk_transactions;
CREATE POLICY "Users can view own transactions" ON public.clerk_transactions
  FOR SELECT USING (auth.is_owner(user_id));

-- 사용량 이벤트 정책 업데이트
DROP POLICY IF EXISTS "Users can view own usage events" ON public.clerk_usage_events;
CREATE POLICY "Users can view own usage events" ON public.clerk_usage_events
  FOR SELECT USING (auth.is_owner(user_id));

-- AI 도구 정책 (생성자 확인)
DROP POLICY IF EXISTS "Users can create AI tools" ON public.ai_tools;
CREATE POLICY "Users can create AI tools" ON public.ai_tools
  FOR INSERT WITH CHECK (auth.is_authenticated() AND auth.is_owner(created_by));

DROP POLICY IF EXISTS "Users can update own AI tools" ON public.ai_tools;
CREATE POLICY "Users can update own AI tools" ON public.ai_tools
  FOR UPDATE USING (auth.is_owner(created_by));

-- 프롬프트 템플릿 정책
DROP POLICY IF EXISTS "Users can view own prompt templates" ON public.prompt_templates;
CREATE POLICY "Users can view own prompt templates" ON public.prompt_templates
  FOR SELECT USING (auth.is_owner(created_by));

DROP POLICY IF EXISTS "Users can create prompt templates" ON public.prompt_templates;
CREATE POLICY "Users can create prompt templates" ON public.prompt_templates
  FOR INSERT WITH CHECK (auth.is_authenticated() AND auth.can_use_feature('compile_prompt') AND auth.is_owner(created_by));

DROP POLICY IF EXISTS "Users can update own prompt templates" ON public.prompt_templates;
CREATE POLICY "Users can update own prompt templates" ON public.prompt_templates
  FOR UPDATE USING (auth.is_owner(created_by));

-- 워크플로 정책
DROP POLICY IF EXISTS "Users can view own workflows" ON public.workflows;
CREATE POLICY "Users can view own workflows" ON public.workflows
  FOR SELECT USING (auth.is_owner(created_by));

DROP POLICY IF EXISTS "Users can create workflows" ON public.workflows;
CREATE POLICY "Users can create workflows" ON public.workflows
  FOR INSERT WITH CHECK (auth.is_authenticated() AND auth.can_use_feature('run_workflow') AND auth.is_owner(created_by));

DROP POLICY IF EXISTS "Users can update own workflows" ON public.workflows;
CREATE POLICY "Users can update own workflows" ON public.workflows
  FOR UPDATE USING (auth.is_owner(created_by));

-- 북마크 정책
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.is_owner(user_id));

-- 리뷰 정책
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.is_owner(user_id));

-- 검색 로그 정책
DROP POLICY IF EXISTS "Users can view own search logs" ON public.search_logs;
CREATE POLICY "Users can view own search logs" ON public.search_logs
  FOR SELECT USING (auth.is_owner(user_id));

DROP POLICY IF EXISTS "Anyone can create search logs" ON public.search_logs;
CREATE POLICY "Users can create search logs" ON public.search_logs
  FOR INSERT WITH CHECK (
    auth.is_authenticated() OR user_id IS NULL -- 익명 사용자도 허용
  );

-- 분석 이벤트 정책
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics_events;
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (auth.is_owner(user_id));

DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;
CREATE POLICY "Users can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (
    auth.is_authenticated() OR user_id IS NULL -- 익명 사용자도 허용
  );

-- 관리자 정책들 업데이트
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.clerk_profiles;
CREATE POLICY "Admins have full access to profiles" ON public.clerk_profiles
  FOR ALL USING (auth.is_admin());

DROP POLICY IF EXISTS "Admins have full access to AI tools" ON public.ai_tools;
CREATE POLICY "Admins have full access to AI tools" ON public.ai_tools
  FOR ALL USING (auth.is_admin());

DROP POLICY IF EXISTS "Admins have full access to system settings" ON public.system_settings;
CREATE POLICY "Admins have full access to system settings" ON public.system_settings
  FOR ALL USING (auth.is_admin());

-- ========================================
-- JWT 검증 설정 (Clerk 대응)
-- ========================================

-- Clerk JWT 시크릿 설정 (실제 값은 환경변수에서 설정)
-- ALTER DATABASE your_database_name SET "app.jwt_secret" TO 'your_clerk_jwt_secret';

-- JWT 검증을 위한 설정
-- Supabase Dashboard의 Auth Settings에서 설정:
-- 1. JWT Secret: Clerk의 JWT Secret
-- 2. Site URL: 애플리케이션 도메인
-- 3. Additional URLs: 개발/스테이징 도메인들

COMMENT ON FUNCTION auth.clerk_user_id() IS 'Clerk JWT에서 사용자 ID 추출';
COMMENT ON FUNCTION auth.has_role(text) IS '사용자 역할 확인';  
COMMENT ON FUNCTION auth.has_active_subscription() IS '활성 구독 여부 확인';
COMMENT ON FUNCTION auth.can_use_feature(text) IS '기능 사용 권한 확인';