-- ========================================
-- EasyPick Usage Events Schema Extensions
-- 목적: 이벤트 파이프라인 통합을 위한 usage_events 확장
-- 작성자: Claude Analytics Specialist
-- ========================================

-- ========================================
-- USAGE_EVENTS 확장 (이미 기본 테이블이 있다고 가정)
-- ========================================

-- usage_events 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  plan_id VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 파이프라인 통합을 위한 컬럼 추가
DO $$
BEGIN
  -- event_name 컬럼 추가 (표준 이벤트 명)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_events' AND column_name = 'event_name') THEN
    ALTER TABLE public.usage_events ADD COLUMN event_name VARCHAR(50);
  END IF;
  
  -- session_id 컬럼 추가 (GA4 연동)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_events' AND column_name = 'session_id') THEN
    ALTER TABLE public.usage_events ADD COLUMN session_id VARCHAR(100);
  END IF;
  
  -- processed_at 컬럼 추가 (처리 시간 추적)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_events' AND column_name = 'processed_at') THEN
    ALTER TABLE public.usage_events ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- ga4_sent 컬럼 추가 (GA4 전송 상태)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_events' AND column_name = 'ga4_sent') THEN
    ALTER TABLE public.usage_events ADD COLUMN ga4_sent BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- page_url 컬럼 추가 (이벤트 발생 페이지)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_events' AND column_name = 'page_url') THEN
    ALTER TABLE public.usage_events ADD COLUMN page_url TEXT;
  END IF;
END $$;

-- ========================================
-- 표준 이벤트 타입 ENUM 생성
-- ========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'standard_event_type') THEN
    CREATE TYPE standard_event_type AS ENUM (
      'select_template',
      'compile_prompt', 
      'start_workflow',
      'complete_step',
      'tool_interaction',
      'search',
      'page_view',
      'engagement',
      'subscription',
      'error',
      'conversion'
    );
  END IF;
END $$;

-- event_name 컬럼에 ENUM 제약 추가 (기존 데이터가 있으면 건너뛰기)
DO $$
BEGIN
  -- 제약조건이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'usage_events_event_name_check'
  ) THEN
    ALTER TABLE public.usage_events 
    ADD CONSTRAINT usage_events_event_name_check 
    CHECK (event_name IS NULL OR event_name::text = ANY(ARRAY[
      'select_template'::text,
      'compile_prompt'::text,
      'start_workflow'::text,
      'complete_step'::text,
      'tool_interaction'::text,
      'search'::text,
      'page_view'::text,
      'engagement'::text,
      'subscription'::text,
      'error'::text,
      'conversion'::text
    ]));
  END IF;
END $$;

-- ========================================
-- 인덱스 최적화
-- ========================================

-- 기본 인덱스
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON public.usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at DESC);

-- 이벤트 파이프라인용 인덱스
CREATE INDEX IF NOT EXISTS idx_usage_events_event_name ON public.usage_events(event_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_session_id ON public.usage_events(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_ga4_pending ON public.usage_events(ga4_sent, created_at) WHERE ga4_sent = FALSE;

-- 복합 인덱스 (월별 집계 최적화)
CREATE INDEX IF NOT EXISTS idx_usage_events_monthly ON public.usage_events(
  user_id, 
  event_type, 
  DATE_TRUNC('month', created_at)
);

-- 일별 집계 최적화
CREATE INDEX IF NOT EXISTS idx_usage_events_daily ON public.usage_events(
  DATE_TRUNC('day', created_at),
  event_type,
  user_id
);

-- JSONB 메타데이터 검색 최적화
CREATE INDEX IF NOT EXISTS idx_usage_events_metadata_gin ON public.usage_events USING gin(metadata);

-- ========================================
-- 월별 사용량 집계 뷰
-- ========================================

-- 월별 사용자별 집계 뷰
CREATE OR REPLACE VIEW usage_monthly_summary AS
WITH monthly_usage AS (
  SELECT 
    user_id,
    DATE_TRUNC('month', created_at) as month_start,
    event_type,
    event_name,
    resource_type,
    plan_id,
    COUNT(*) as event_count,
    SUM(quantity) as total_quantity,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event,
    array_agg(DISTINCT resource_id) FILTER (WHERE resource_id IS NOT NULL) as resource_ids
  FROM public.usage_events 
  WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
  GROUP BY 
    user_id, 
    DATE_TRUNC('month', created_at), 
    event_type, 
    event_name,
    resource_type,
    plan_id
)
SELECT 
  mu.*,
  EXTRACT(YEAR FROM month_start) as year,
  EXTRACT(MONTH FROM month_start) as month,
  -- 다음 달 초기화 날짜
  (month_start + INTERVAL '1 month')::DATE as reset_date,
  -- 현재 월 여부
  DATE_TRUNC('month', month_start) = DATE_TRUNC('month', NOW()) as is_current_month,
  -- 월별 할당량 대비 사용률 (기본값 20)
  CASE 
    WHEN plan_id = 'free' THEN 
      LEAST(100.0, (total_quantity::FLOAT / 20.0) * 100.0)
    WHEN plan_id = 'pro' THEN 
      LEAST(100.0, (total_quantity::FLOAT / 500.0) * 100.0)
    ELSE 0.0  -- unlimited plans
  END as usage_percentage
FROM monthly_usage mu
ORDER BY mu.month_start DESC, mu.user_id, mu.event_type;

-- 월별 전체 시스템 집계 뷰
CREATE OR REPLACE VIEW usage_monthly_system_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month_start,
  event_type,
  event_name,
  resource_type,
  plan_id,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_events,
  SUM(quantity) as total_quantity,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(quantity) as avg_quantity_per_event,
  -- 플랜별 통계
  COUNT(DISTINCT CASE WHEN plan_id = 'free' THEN user_id END) as free_users,
  COUNT(DISTINCT CASE WHEN plan_id = 'pro' THEN user_id END) as pro_users,
  COUNT(DISTINCT CASE WHEN plan_id = 'team' THEN user_id END) as team_users,
  -- 이벤트 분포
  COUNT(CASE WHEN event_name = 'select_template' THEN 1 END) as template_selections,
  COUNT(CASE WHEN event_name = 'compile_prompt' THEN 1 END) as prompt_compiles,
  COUNT(CASE WHEN event_name = 'start_workflow' THEN 1 END) as workflow_starts,
  COUNT(CASE WHEN event_name = 'complete_step' THEN 1 END) as workflow_completions
FROM public.usage_events 
WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
GROUP BY 
  DATE_TRUNC('month', created_at),
  event_type, 
  event_name,
  resource_type,
  plan_id
ORDER BY month_start DESC, total_events DESC;

-- 현재 월 사용자 쿼터 상태 뷰
CREATE OR REPLACE VIEW usage_current_month_quota AS
WITH current_month_usage AS (
  SELECT 
    ue.user_id,
    ue.event_type,
    cp.plan_id,
    SUM(ue.quantity) as current_usage,
    COUNT(*) as event_count,
    MAX(ue.created_at) as last_usage
  FROM public.usage_events ue
  LEFT JOIN public.clerk_profiles cp ON ue.user_id = cp.id
  WHERE DATE_TRUNC('month', ue.created_at) = DATE_TRUNC('month', NOW())
  GROUP BY ue.user_id, ue.event_type, cp.plan_id
),
quota_limits AS (
  SELECT 
    'compile' as event_type,
    'free' as plan_id,
    20 as quota_limit
  UNION ALL
  SELECT 'compile', 'pro', 500
  UNION ALL
  SELECT 'compile', 'team', 999999
  UNION ALL
  SELECT 'save', 'free', 10
  UNION ALL
  SELECT 'save', 'pro', 100
  UNION ALL
  SELECT 'save', 'team', 999999
  UNION ALL
  SELECT 'api_call', 'free', 50
  UNION ALL
  SELECT 'api_call', 'pro', 1000
  UNION ALL
  SELECT 'api_call', 'team', 999999
)
SELECT 
  cmu.user_id,
  cmu.event_type,
  cmu.plan_id,
  cmu.current_usage,
  cmu.event_count,
  cmu.last_usage,
  COALESCE(ql.quota_limit, 999999) as quota_limit,
  -- 사용률 계산
  CASE 
    WHEN COALESCE(ql.quota_limit, 999999) >= 999999 THEN 0.0  -- unlimited
    ELSE (cmu.current_usage::FLOAT / ql.quota_limit::FLOAT) * 100.0
  END as usage_percentage,
  -- 할당량 초과 여부
  cmu.current_usage >= COALESCE(ql.quota_limit, 999999) as quota_exceeded,
  -- 할당량 거의 소진 여부 (90% 이상)
  (cmu.current_usage::FLOAT / COALESCE(ql.quota_limit, 999999)::FLOAT) >= 0.9 as quota_warning,
  -- 다음 초기화 날짜
  (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE as reset_date
FROM current_month_usage cmu
LEFT JOIN quota_limits ql ON cmu.event_type = ql.event_type AND cmu.plan_id = ql.plan_id
ORDER BY cmu.user_id, cmu.event_type;

-- ========================================
-- 집계 함수
-- ========================================

-- 사용자 월별 사용량 조회 함수
CREATE OR REPLACE FUNCTION get_user_monthly_usage(
  p_user_id UUID,
  p_event_type VARCHAR(50) DEFAULT NULL,
  p_month_offset INTEGER DEFAULT 0  -- 0: 현재 월, -1: 이전 월
)
RETURNS TABLE (
  event_type VARCHAR(50),
  event_name VARCHAR(50),
  total_quantity BIGINT,
  event_count BIGINT,
  unique_sessions BIGINT,
  quota_limit INTEGER,
  usage_percentage NUMERIC,
  quota_exceeded BOOLEAN
) AS $$
DECLARE
  target_month DATE;
BEGIN
  target_month := DATE_TRUNC('month', NOW() + (p_month_offset || ' months')::INTERVAL);
  
  RETURN QUERY
  WITH monthly_usage AS (
    SELECT 
      ue.event_type,
      ue.event_name,
      SUM(ue.quantity) as total_quantity,
      COUNT(*) as event_count,
      COUNT(DISTINCT ue.session_id) as unique_sessions
    FROM public.usage_events ue
    WHERE ue.user_id = p_user_id
      AND DATE_TRUNC('month', ue.created_at) = target_month
      AND (p_event_type IS NULL OR ue.event_type = p_event_type)
    GROUP BY ue.event_type, ue.event_name
  ),
  user_plan AS (
    SELECT COALESCE(cp.plan_id, 'free') as plan_id
    FROM public.clerk_profiles cp
    WHERE cp.id = p_user_id
  ),
  quota_limits AS (
    SELECT 
      'compile' as event_type_limit,
      CASE up.plan_id
        WHEN 'free' THEN 20
        WHEN 'pro' THEN 500
        ELSE 999999
      END as limit_value
    FROM user_plan up
    UNION ALL
    SELECT 
      'save',
      CASE up.plan_id
        WHEN 'free' THEN 10
        WHEN 'pro' THEN 100
        ELSE 999999
      END
    FROM user_plan up
    UNION ALL
    SELECT 
      'api_call',
      CASE up.plan_id
        WHEN 'free' THEN 50
        WHEN 'pro' THEN 1000
        ELSE 999999
      END
    FROM user_plan up
  )
  SELECT 
    mu.event_type,
    mu.event_name,
    mu.total_quantity,
    mu.event_count,
    mu.unique_sessions,
    COALESCE(ql.limit_value, 999999) as quota_limit,
    CASE 
      WHEN COALESCE(ql.limit_value, 999999) >= 999999 THEN 0.0
      ELSE (mu.total_quantity::NUMERIC / ql.limit_value::NUMERIC) * 100.0
    END as usage_percentage,
    mu.total_quantity >= COALESCE(ql.limit_value, 999999) as quota_exceeded
  FROM monthly_usage mu
  LEFT JOIN quota_limits ql ON mu.event_type = ql.event_type_limit
  ORDER BY mu.total_quantity DESC;
END;
$$ LANGUAGE plpgsql;

-- 시스템 전체 월별 통계 함수
CREATE OR REPLACE FUNCTION get_system_monthly_stats(
  p_month_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  total_users BIGINT,
  total_events BIGINT,
  total_quantity BIGINT,
  free_users BIGINT,
  pro_users BIGINT,
  team_users BIGINT,
  avg_events_per_user NUMERIC,
  top_event_type VARCHAR(50),
  quota_exceeded_users BIGINT
) AS $$
DECLARE
  target_month DATE;
BEGIN
  target_month := DATE_TRUNC('month', NOW() + (p_month_offset || ' months')::INTERVAL);
  
  RETURN QUERY
  WITH month_stats AS (
    SELECT 
      COUNT(DISTINCT ue.user_id) as total_users,
      COUNT(*) as total_events,
      SUM(ue.quantity) as total_quantity,
      COUNT(DISTINCT CASE WHEN cp.plan_id = 'free' THEN ue.user_id END) as free_users,
      COUNT(DISTINCT CASE WHEN cp.plan_id = 'pro' THEN ue.user_id END) as pro_users,
      COUNT(DISTINCT CASE WHEN cp.plan_id = 'team' THEN ue.user_id END) as team_users
    FROM public.usage_events ue
    LEFT JOIN public.clerk_profiles cp ON ue.user_id = cp.id
    WHERE DATE_TRUNC('month', ue.created_at) = target_month
  ),
  top_event AS (
    SELECT ue.event_type
    FROM public.usage_events ue
    WHERE DATE_TRUNC('month', ue.created_at) = target_month
    GROUP BY ue.event_type
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  quota_exceeded AS (
    SELECT COUNT(DISTINCT ucmq.user_id) as exceeded_users
    FROM usage_current_month_quota ucmq
    WHERE ucmq.quota_exceeded = TRUE
  )
  SELECT 
    ms.total_users,
    ms.total_events,
    ms.total_quantity,
    ms.free_users,
    ms.pro_users,
    ms.team_users,
    CASE 
      WHEN ms.total_users > 0 THEN ms.total_events::NUMERIC / ms.total_users::NUMERIC
      ELSE 0
    END as avg_events_per_user,
    te.event_type as top_event_type,
    qe.exceeded_users as quota_exceeded_users
  FROM month_stats ms
  CROSS JOIN top_event te
  CROSS JOIN quota_exceeded qe;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 트리거 및 자동화
-- ========================================

-- usage_events 삽입 시 자동으로 processed_at 업데이트
CREATE OR REPLACE FUNCTION trigger_update_usage_event_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.processed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거가 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_usage_events_processed_at'
  ) THEN
    CREATE TRIGGER trigger_usage_events_processed_at
      BEFORE INSERT OR UPDATE ON public.usage_events
      FOR EACH ROW EXECUTE FUNCTION trigger_update_usage_event_processed_at();
  END IF;
END $$;

-- ========================================
-- 권한 설정
-- ========================================

-- 사용자는 자신의 usage_events만 조회 가능
CREATE POLICY "Users can view own usage events" ON public.usage_events
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role은 모든 권한
CREATE POLICY "Service role full access usage events" ON public.usage_events
  FOR ALL USING (auth.role() = 'service_role');

-- 뷰 접근 권한
GRANT SELECT ON usage_monthly_summary TO authenticated;
GRANT SELECT ON usage_monthly_system_summary TO authenticated;
GRANT SELECT ON usage_current_month_quota TO authenticated;

-- 함수 실행 권한
GRANT EXECUTE ON FUNCTION get_user_monthly_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_monthly_stats TO service_role;

-- ========================================
-- 데이터 정리
-- ========================================

-- 오래된 usage_events 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_usage_events(retention_months INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.usage_events 
  WHERE created_at < NOW() - (retention_months || ' months')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 샘플 사용법 주석
-- ========================================

/*
-- 1. 현재 월 사용자 사용량 조회
SELECT * FROM get_user_monthly_usage('user-uuid-here', 'compile', 0);

-- 2. 현재 월 전체 시스템 통계
SELECT * FROM get_system_monthly_stats(0);

-- 3. 사용자별 월별 집계 조회
SELECT * FROM usage_monthly_summary 
WHERE user_id = 'user-uuid-here' 
  AND is_current_month = true;

-- 4. 할당량 초과 사용자 목록
SELECT * FROM usage_current_month_quota 
WHERE quota_exceeded = true;

-- 5. 월별 시스템 전체 통계
SELECT * FROM usage_monthly_system_summary 
WHERE month_start >= '2024-01-01';

-- 6. 특정 이벤트 타입 월별 추이
SELECT 
  month_start,
  event_type,
  total_events,
  unique_users,
  avg_quantity_per_event
FROM usage_monthly_system_summary 
WHERE event_type = 'compile'
ORDER BY month_start DESC;

-- 7. 플랜별 사용량 분석
SELECT 
  plan_id,
  COUNT(*) as user_count,
  AVG(total_quantity) as avg_usage,
  SUM(CASE WHEN quota_exceeded THEN 1 ELSE 0 END) as exceeded_count
FROM usage_current_month_quota
GROUP BY plan_id;
*/