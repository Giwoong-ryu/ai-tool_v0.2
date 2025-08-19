-- ========================================
-- EasyPick 월별 사용량 집계 뷰
-- 목적: 가드 시스템을 위한 고성능 월별 사용량 조회
-- ========================================

-- ========================================
-- 현재 월 사용량 뷰 (가드 전용)
-- ========================================

CREATE OR REPLACE VIEW usage_current_month AS
SELECT 
  -- 사용자 정보
  qs.user_id,
  qs.team_id,
  qs.plan_id,
  
  -- 현재 월 정보
  qs.current_month,
  
  -- 컴파일 사용량
  qs.compiles_used,
  qs.compiles_limit,
  CASE 
    WHEN qs.compiles_limit = -1 THEN true
    ELSE qs.compiles_used < qs.compiles_limit
  END as compiles_available,
  CASE
    WHEN qs.compiles_limit = -1 THEN -1
    ELSE GREATEST(0, qs.compiles_limit - qs.compiles_used)
  END as compiles_remaining,
  
  -- 저장 사용량
  qs.saves_used,
  qs.saves_limit,
  CASE 
    WHEN qs.saves_limit = -1 THEN true
    ELSE qs.saves_used < qs.saves_limit
  END as saves_available,
  CASE
    WHEN qs.saves_limit = -1 THEN -1
    ELSE GREATEST(0, qs.saves_limit - qs.saves_used)
  END as saves_remaining,
  
  -- API 호출 사용량
  qs.api_calls_used,
  qs.api_calls_limit,
  CASE 
    WHEN qs.api_calls_limit = -1 THEN true
    ELSE qs.api_calls_used < qs.api_calls_limit
  END as api_calls_available,
  CASE
    WHEN qs.api_calls_limit = -1 THEN -1
    ELSE GREATEST(0, qs.api_calls_limit - qs.api_calls_used)
  END as api_calls_remaining,
  
  -- 스토리지 사용량
  qs.storage_used_mb,
  qs.storage_limit_mb,
  CASE 
    WHEN qs.storage_limit_mb = -1 THEN true
    ELSE qs.storage_used_mb < qs.storage_limit_mb
  END as storage_available,
  CASE
    WHEN qs.storage_limit_mb = -1 THEN -1
    ELSE GREATEST(0, qs.storage_limit_mb - qs.storage_used_mb)
  END as storage_remaining,
  
  -- 전체 쿼터 상태
  CASE 
    WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit THEN false
    WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit THEN false
    WHEN qs.api_calls_limit > 0 AND qs.api_calls_used >= qs.api_calls_limit THEN false
    WHEN qs.storage_limit_mb > 0 AND qs.storage_used_mb >= qs.storage_limit_mb THEN false
    ELSE true
  END as quota_healthy,
  
  -- 사용률 (백분율)
  CASE 
    WHEN qs.compiles_limit <= 0 THEN 0
    ELSE ROUND((qs.compiles_used::DECIMAL / qs.compiles_limit) * 100, 2)
  END as compiles_usage_percentage,
  
  CASE 
    WHEN qs.saves_limit <= 0 THEN 0
    ELSE ROUND((qs.saves_used::DECIMAL / qs.saves_limit) * 100, 2)
  END as saves_usage_percentage,
  
  CASE 
    WHEN qs.api_calls_limit <= 0 THEN 0
    ELSE ROUND((qs.api_calls_used::DECIMAL / qs.api_calls_limit) * 100, 2)
  END as api_calls_usage_percentage,
  
  CASE 
    WHEN qs.storage_limit_mb <= 0 THEN 0
    ELSE ROUND((qs.storage_used_mb::DECIMAL / qs.storage_limit_mb) * 100, 2)
  END as storage_usage_percentage,
  
  -- 메타데이터
  qs.last_reset_at,
  qs.last_updated
  
FROM quota_status qs
WHERE qs.current_month = date_trunc('month', NOW())::DATE;

-- ========================================
-- 월별 사용량 트렌드 뷰
-- ========================================

CREATE OR REPLACE VIEW usage_monthly_trends AS
SELECT 
  -- 시간 정보
  us.year,
  us.month,
  make_date(us.year, us.month, 1) as month_date,
  
  -- 사용자 정보
  us.user_id,
  us.team_id,
  us.plan_id,
  
  -- 이벤트 유형별 집계
  us.event_type,
  us.total_events,
  us.total_quantity,
  
  -- 사용량 추세 계산 (전월 대비)
  LAG(us.total_events) OVER (
    PARTITION BY us.user_id, us.event_type 
    ORDER BY us.year, us.month
  ) as prev_month_events,
  
  LAG(us.total_quantity) OVER (
    PARTITION BY us.user_id, us.event_type 
    ORDER BY us.year, us.month
  ) as prev_month_quantity,
  
  -- 증감률 계산
  CASE 
    WHEN LAG(us.total_events) OVER (
      PARTITION BY us.user_id, us.event_type 
      ORDER BY us.year, us.month
    ) > 0 THEN
      ROUND(
        ((us.total_events::DECIMAL - LAG(us.total_events) OVER (
          PARTITION BY us.user_id, us.event_type 
          ORDER BY us.year, us.month
        )) / LAG(us.total_events) OVER (
          PARTITION BY us.user_id, us.event_type 
          ORDER BY us.year, us.month
        )) * 100, 2
      )
    ELSE NULL
  END as events_growth_rate,
  
  -- 메타데이터
  us.first_event_at,
  us.last_event_at,
  us.last_updated
  
FROM usage_summary us
ORDER BY us.user_id, us.year DESC, us.month DESC, us.event_type;

-- ========================================
-- 플랜별 사용량 통계 뷰
-- ========================================

CREATE OR REPLACE VIEW usage_plan_statistics AS
SELECT 
  -- 플랜 정보
  p.id as plan_id,
  p.display_name as plan_name,
  
  -- 현재 월 기준
  date_trunc('month', NOW())::DATE as current_month,
  
  -- 활성 사용자 수
  COUNT(DISTINCT qs.user_id) as active_users,
  
  -- 평균 사용량
  ROUND(AVG(qs.compiles_used), 2) as avg_compiles_used,
  ROUND(AVG(qs.saves_used), 2) as avg_saves_used,
  ROUND(AVG(qs.api_calls_used), 2) as avg_api_calls_used,
  ROUND(AVG(qs.storage_used_mb), 2) as avg_storage_used_mb,
  
  -- 사용량 분포
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY qs.compiles_used) as median_compiles_used,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY qs.compiles_used) as p90_compiles_used,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY qs.compiles_used) as p95_compiles_used,
  
  -- 한도 근접 사용자 (90% 이상 사용)
  COUNT(CASE 
    WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.9 
    THEN 1 
  END) as users_near_compile_limit,
  
  COUNT(CASE 
    WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.9 
    THEN 1 
  END) as users_near_save_limit,
  
  -- 한도 초과 사용자
  COUNT(CASE 
    WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit 
    THEN 1 
  END) as users_over_compile_limit,
  
  COUNT(CASE 
    WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit 
    THEN 1 
  END) as users_over_save_limit,
  
  -- 업그레이드 후보 (Free 플랜에서 한도 근접)
  COUNT(CASE 
    WHEN p.id = 'free' AND (
      (qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.8) OR
      (qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.8)
    ) THEN 1 
  END) as upgrade_candidates
  
FROM plans p
JOIN quota_status qs ON qs.plan_id = p.id
WHERE qs.current_month = date_trunc('month', NOW())::DATE
  AND p.is_active = true
GROUP BY p.id, p.display_name
ORDER BY p.sort_order;

-- ========================================
-- 가드 시스템용 빠른 조회 뷰
-- ========================================

CREATE OR REPLACE VIEW guard_quota_check AS
SELECT 
  -- 사용자 식별
  qs.user_id,
  
  -- 플랜 정보
  qs.plan_id,
  CASE 
    WHEN qs.plan_id = 'pro' OR qs.plan_id = 'team' THEN true 
    ELSE false 
  END as is_premium,
  
  -- 쿼터 상태 (빠른 확인용)
  jsonb_build_object(
    'compiles', jsonb_build_object(
      'used', qs.compiles_used,
      'limit', qs.compiles_limit,
      'available', CASE 
        WHEN qs.compiles_limit = -1 THEN true
        ELSE qs.compiles_used < qs.compiles_limit
      END
    ),
    'saves', jsonb_build_object(
      'used', qs.saves_used,
      'limit', qs.saves_limit,
      'available', CASE 
        WHEN qs.saves_limit = -1 THEN true
        ELSE qs.saves_used < qs.saves_limit
      END
    ),
    'api_calls', jsonb_build_object(
      'used', qs.api_calls_used,
      'limit', qs.api_calls_limit,
      'available', CASE 
        WHEN qs.api_calls_limit = -1 THEN true
        ELSE qs.api_calls_used < qs.api_calls_limit
      END
    )
  ) as quotas,
  
  -- 전체 상태
  CASE 
    WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit THEN false
    WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit THEN false
    WHEN qs.api_calls_limit > 0 AND qs.api_calls_used >= qs.api_calls_limit THEN false
    ELSE true
  END as quota_ok,
  
  -- 다음 리셋까지 남은 시간
  EXTRACT(EPOCH FROM (
    (date_trunc('month', NOW()) + INTERVAL '1 month') - NOW()
  ))::INTEGER as seconds_until_reset,
  
  -- 마지막 업데이트
  qs.last_updated
  
FROM quota_status qs
WHERE qs.current_month = date_trunc('month', NOW())::DATE;

-- ========================================
-- 사용량 알림 뷰 (80%, 90%, 100% 도달 시)
-- ========================================

CREATE OR REPLACE VIEW usage_alerts AS
SELECT 
  -- 사용자 정보
  qs.user_id,
  cp.email,
  qs.plan_id,
  
  -- 알림 유형 및 세부사항
  alert_type,
  alert_message,
  alert_data,
  
  -- 우선순위 (1: 높음, 2: 보통, 3: 낮음)
  CASE alert_type
    WHEN 'quota_exceeded' THEN 1
    WHEN 'quota_near_limit' THEN 2
    WHEN 'quota_warning' THEN 3
    ELSE 4
  END as priority,
  
  -- 마지막 업데이트
  qs.last_updated
  
FROM quota_status qs
JOIN clerk_profiles cp ON cp.id = qs.user_id
CROSS JOIN LATERAL (
  SELECT 
    unnest(ARRAY[
      -- 컴파일 쿼터 체크
      CASE 
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit THEN 'quota_exceeded'
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.9 THEN 'quota_near_limit'
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.8 THEN 'quota_warning'
        ELSE NULL
      END,
      -- 저장 쿼터 체크
      CASE 
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit THEN 'quota_exceeded'
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.9 THEN 'quota_near_limit'
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.8 THEN 'quota_warning'
        ELSE NULL
      END
    ]) as alert_type,
    
    unnest(ARRAY[
      -- 컴파일 메시지
      CASE 
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit THEN 
          '프롬프트 컴파일 한도를 초과했습니다. Pro 플랜으로 업그레이드하세요.'
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.9 THEN 
          '프롬프트 컴파일 한도의 90%에 도달했습니다.'
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.8 THEN 
          '프롬프트 컴파일 사용량이 많습니다. 한도 확인을 권장합니다.'
        ELSE NULL
      END,
      -- 저장 메시지
      CASE 
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit THEN 
          '워크플로우 저장 한도를 초과했습니다. Pro 플랜으로 업그레이드하세요.'
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.9 THEN 
          '워크플로우 저장 한도의 90%에 도달했습니다.'
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.8 THEN 
          '워크플로우 저장 사용량이 많습니다. 한도 확인을 권장합니다.'
        ELSE NULL
      END
    ]) as alert_message,
    
    unnest(ARRAY[
      -- 컴파일 데이터
      CASE 
        WHEN qs.compiles_limit > 0 AND qs.compiles_used >= qs.compiles_limit * 0.8 THEN 
          jsonb_build_object(
            'type', 'compiles',
            'used', qs.compiles_used,
            'limit', qs.compiles_limit,
            'percentage', ROUND((qs.compiles_used::DECIMAL / qs.compiles_limit) * 100, 2)
          )
        ELSE NULL
      END,
      -- 저장 데이터
      CASE 
        WHEN qs.saves_limit > 0 AND qs.saves_used >= qs.saves_limit * 0.8 THEN 
          jsonb_build_object(
            'type', 'saves',
            'used', qs.saves_used,
            'limit', qs.saves_limit,
            'percentage', ROUND((qs.saves_used::DECIMAL / qs.saves_limit) * 100, 2)
          )
        ELSE NULL
      END
    ]) as alert_data
) alerts
WHERE alerts.alert_type IS NOT NULL
  AND qs.current_month = date_trunc('month', NOW())::DATE
ORDER BY qs.user_id, priority;

-- ========================================
-- 뷰 권한 설정
-- ========================================

-- 사용자는 자신의 데이터만 볼 수 있음
GRANT SELECT ON usage_current_month TO authenticated;
GRANT SELECT ON usage_monthly_trends TO authenticated;
GRANT SELECT ON guard_quota_check TO authenticated;
GRANT SELECT ON usage_alerts TO authenticated;

-- 관리자는 모든 통계 볼 수 있음
GRANT SELECT ON usage_plan_statistics TO authenticated;

-- ========================================
-- 성능 최적화를 위한 추가 인덱스
-- ========================================

-- 가드 시스템용 빠른 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_quota_status_guard_lookup 
ON quota_status(user_id, current_month) 
WHERE current_month = date_trunc('month', NOW())::DATE;

-- 알림 시스템용 인덱스
CREATE INDEX IF NOT EXISTS idx_quota_status_alerts 
ON quota_status(user_id, plan_id, last_updated) 
WHERE (
  (compiles_limit > 0 AND compiles_used >= compiles_limit * 0.8) OR
  (saves_limit > 0 AND saves_used >= saves_limit * 0.8)
);

-- ========================================
-- 뷰 설명
-- ========================================

COMMENT ON VIEW usage_current_month IS '현재 월 사용량 및 쿼터 상태 (가드 시스템용)';
COMMENT ON VIEW usage_monthly_trends IS '월별 사용량 트렌드 및 증감률 분석';
COMMENT ON VIEW usage_plan_statistics IS '플랜별 사용량 통계 및 업그레이드 후보 분석';
COMMENT ON VIEW guard_quota_check IS '가드 시스템용 빠른 쿼터 체크 (성능 최적화)';
COMMENT ON VIEW usage_alerts IS '사용량 알림 및 경고 메시지 (80%, 90%, 100% 도달 시)';