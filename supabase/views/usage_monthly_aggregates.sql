-- ========================================
-- EasyPick 월간 사용량 집계 뷰
-- Monthly Usage Aggregation Views
-- ========================================

-- ========================================
-- 월간 사용량 요약 뷰
-- ========================================

CREATE OR REPLACE VIEW usage_monthly_summary AS
WITH monthly_stats AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', created_at) AS month_start,
        event_type::TEXT,
        COUNT(*) AS event_count,
        SUM(count) AS total_usage,
        MIN(created_at) AS first_event_at,
        MAX(created_at) AS last_event_at
    FROM public.clerk_usage_events
    WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
    GROUP BY user_id, DATE_TRUNC('month', created_at), event_type
),
user_plans AS (
    SELECT DISTINCT
        cp.id AS user_id,
        cp.plan,
        sp.limits,
        COALESCE(cs.current_period_start, DATE_TRUNC('month', NOW())) AS period_start
    FROM public.clerk_profiles cp
    LEFT JOIN public.subscription_plans sp ON sp.id = cp.plan
    LEFT JOIN public.clerk_subscriptions cs ON cs.user_id = cp.id AND cs.status = 'active'
)
SELECT 
    ms.user_id,
    ms.month_start,
    ms.event_type,
    ms.event_count,
    ms.total_usage,
    ms.first_event_at,
    ms.last_event_at,
    up.plan,
    up.limits,
    
    -- 월간 사용량 상태
    CASE 
        WHEN up.limits IS NULL THEN 'unknown'
        WHEN (up.limits->>CONCAT('monthly_', ms.event_type))::INT = -1 THEN 'unlimited'
        WHEN ms.total_usage >= (up.limits->>CONCAT('monthly_', ms.event_type))::INT THEN 'exceeded'
        WHEN ms.total_usage >= (up.limits->>CONCAT('monthly_', ms.event_type))::INT * 0.8 THEN 'warning'
        ELSE 'normal'
    END AS usage_status,
    
    -- 사용률 계산
    CASE 
        WHEN up.limits IS NULL OR (up.limits->>CONCAT('monthly_', ms.event_type))::INT = -1 THEN NULL
        ELSE ROUND(
            (ms.total_usage::DECIMAL / NULLIF((up.limits->>CONCAT('monthly_', ms.event_type))::INT, 0)) * 100, 
            2
        )
    END AS usage_percentage,
    
    -- 남은 사용량
    CASE 
        WHEN up.limits IS NULL OR (up.limits->>CONCAT('monthly_', ms.event_type))::INT = -1 THEN -1
        ELSE GREATEST(0, (up.limits->>CONCAT('monthly_', ms.event_type))::INT - ms.total_usage)
    END AS remaining_usage

FROM monthly_stats ms
LEFT JOIN user_plans up ON up.user_id = ms.user_id
ORDER BY ms.user_id, ms.month_start DESC, ms.event_type;

-- ========================================
-- 현재 월 사용량 뷰 (실시간 조회용)
-- ========================================

CREATE OR REPLACE VIEW current_month_usage AS
WITH current_usage AS (
    SELECT 
        user_id,
        event_type::TEXT,
        COUNT(*) AS event_count,
        SUM(count) AS total_usage,
        MIN(created_at) AS first_used_at,
        MAX(created_at) AS last_used_at
    FROM public.clerk_usage_events
    WHERE billing_period_start >= DATE_TRUNC('month', NOW())
    GROUP BY user_id, event_type
),
user_limits AS (
    SELECT 
        cp.id AS user_id,
        cp.plan,
        sp.limits,
        cs.current_period_start,
        cs.status AS subscription_status
    FROM public.clerk_profiles cp
    LEFT JOIN public.subscription_plans sp ON sp.id = cp.plan
    LEFT JOIN public.clerk_subscriptions cs ON cs.user_id = cp.id 
        AND cs.status IN ('active', 'past_due')
)
SELECT 
    ul.user_id,
    ul.plan,
    ul.subscription_status,
    ul.current_period_start,
    
    -- 각 이벤트 타입별 사용량
    COALESCE(cu_compile.total_usage, 0) AS compile_prompt_used,
    COALESCE((ul.limits->>'monthly_compile_prompt')::INT, 0) AS compile_prompt_limit,
    
    COALESCE(cu_workflow.total_usage, 0) AS run_workflow_used,
    COALESCE((ul.limits->>'monthly_run_workflow')::INT, 0) AS run_workflow_limit,
    
    COALESCE(cu_api.total_usage, 0) AS api_call_used,
    COALESCE((ul.limits->>'monthly_api_call')::INT, 0) AS api_call_limit,
    
    COALESCE(cu_export.total_usage, 0) AS export_data_used,
    COALESCE((ul.limits->>'monthly_export_data')::INT, 0) AS export_data_limit,
    
    COALESCE(cu_generation.total_usage, 0) AS ai_generation_used,
    COALESCE((ul.limits->>'monthly_ai_generation')::INT, 0) AS ai_generation_limit,
    
    COALESCE(cu_search.total_usage, 0) AS search_query_used,
    COALESCE((ul.limits->>'monthly_search_query')::INT, 0) AS search_query_limit,
    
    -- 전체 사용량 통계
    COALESCE(cu_compile.total_usage, 0) + 
    COALESCE(cu_workflow.total_usage, 0) + 
    COALESCE(cu_api.total_usage, 0) + 
    COALESCE(cu_export.total_usage, 0) + 
    COALESCE(cu_generation.total_usage, 0) + 
    COALESCE(cu_search.total_usage, 0) AS total_usage,
    
    -- 가장 많이 사용한 기능
    (
        SELECT event_type 
        FROM current_usage cu_inner 
        WHERE cu_inner.user_id = ul.user_id 
        ORDER BY total_usage DESC 
        LIMIT 1
    ) AS most_used_feature,
    
    -- 마지막 활동 시간
    (
        SELECT MAX(last_used_at) 
        FROM current_usage cu_inner 
        WHERE cu_inner.user_id = ul.user_id
    ) AS last_activity_at

FROM user_limits ul
LEFT JOIN current_usage cu_compile ON cu_compile.user_id = ul.user_id AND cu_compile.event_type = 'compile_prompt'
LEFT JOIN current_usage cu_workflow ON cu_workflow.user_id = ul.user_id AND cu_workflow.event_type = 'run_workflow'
LEFT JOIN current_usage cu_api ON cu_api.user_id = ul.user_id AND cu_api.event_type = 'api_call'
LEFT JOIN current_usage cu_export ON cu_export.user_id = ul.user_id AND cu_export.event_type = 'export_data'
LEFT JOIN current_usage cu_generation ON cu_generation.user_id = ul.user_id AND cu_generation.event_type = 'ai_generation'
LEFT JOIN current_usage cu_search ON cu_search.user_id = ul.user_id AND cu_search.event_type = 'search_query'
ORDER BY ul.user_id;

-- ========================================
-- 사용량 추세 분석 뷰
-- ========================================

CREATE OR REPLACE VIEW usage_trends AS
WITH monthly_trends AS (
    SELECT 
        user_id,
        event_type::TEXT,
        DATE_TRUNC('month', created_at) AS month_start,
        SUM(count) AS monthly_usage,
        COUNT(*) AS monthly_events,
        LAG(SUM(count), 1) OVER (
            PARTITION BY user_id, event_type 
            ORDER BY DATE_TRUNC('month', created_at)
        ) AS prev_month_usage
    FROM public.clerk_usage_events
    WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
    GROUP BY user_id, event_type, DATE_TRUNC('month', created_at)
)
SELECT 
    user_id,
    event_type,
    month_start,
    monthly_usage,
    monthly_events,
    prev_month_usage,
    
    -- 월대월 증감률 계산
    CASE 
        WHEN prev_month_usage IS NULL OR prev_month_usage = 0 THEN NULL
        ELSE ROUND(
            ((monthly_usage - prev_month_usage)::DECIMAL / prev_month_usage) * 100, 
            2
        )
    END AS month_over_month_change_pct,
    
    -- 트렌드 방향
    CASE 
        WHEN prev_month_usage IS NULL THEN 'new'
        WHEN monthly_usage > prev_month_usage * 1.1 THEN 'increasing'
        WHEN monthly_usage < prev_month_usage * 0.9 THEN 'decreasing'
        ELSE 'stable'
    END AS trend_direction,
    
    -- 사용량 수준
    CASE 
        WHEN monthly_usage = 0 THEN 'inactive'
        WHEN monthly_usage <= 10 THEN 'low'
        WHEN monthly_usage <= 100 THEN 'medium'
        ELSE 'high'
    END AS usage_level

FROM monthly_trends
ORDER BY user_id, event_type, month_start DESC;

-- ========================================
-- 플랫폼 전체 사용량 통계 뷰
-- ========================================

CREATE OR REPLACE VIEW platform_usage_stats AS
WITH daily_stats AS (
    SELECT 
        DATE_TRUNC('day', created_at) AS date,
        event_type::TEXT,
        COUNT(DISTINCT user_id) AS unique_users,
        COUNT(*) AS total_events,
        SUM(count) AS total_usage
    FROM public.clerk_usage_events
    WHERE created_at >= DATE_TRUNC('day', NOW() - INTERVAL '30 days')
    GROUP BY DATE_TRUNC('day', created_at), event_type
),
user_stats AS (
    SELECT 
        COUNT(DISTINCT id) AS total_users,
        COUNT(DISTINCT CASE WHEN plan != 'free' THEN id END) AS paying_users,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN id END) AS recent_signups
    FROM public.clerk_profiles
)
SELECT 
    ds.date,
    ds.event_type,
    ds.unique_users,
    ds.total_events,
    ds.total_usage,
    
    -- 일일 성장률
    LAG(ds.unique_users, 1) OVER (
        PARTITION BY ds.event_type 
        ORDER BY ds.date
    ) AS prev_day_users,
    
    -- 사용자 관련 통계 (최신 날짜에만)
    CASE 
        WHEN ds.date = DATE_TRUNC('day', NOW()) THEN us.total_users
        ELSE NULL
    END AS platform_total_users,
    
    CASE 
        WHEN ds.date = DATE_TRUNC('day', NOW()) THEN us.paying_users
        ELSE NULL
    END AS platform_paying_users,
    
    CASE 
        WHEN ds.date = DATE_TRUNC('day', NOW()) THEN us.recent_signups
        ELSE NULL
    END AS platform_recent_signups

FROM daily_stats ds
CROSS JOIN user_stats us
ORDER BY ds.date DESC, ds.event_type;

-- ========================================
-- 사용량 알림 뷰 (쿼터 초과 위험)
-- ========================================

CREATE OR REPLACE VIEW usage_alerts AS
WITH current_usage AS (
    SELECT 
        user_id,
        event_type::TEXT,
        SUM(count) AS usage_count,
        COUNT(*) AS event_count
    FROM public.clerk_usage_events
    WHERE billing_period_start >= DATE_TRUNC('month', NOW())
    GROUP BY user_id, event_type
),
user_limits AS (
    SELECT 
        cp.id AS user_id,
        cp.email,
        cp.plan,
        sp.limits
    FROM public.clerk_profiles cp
    LEFT JOIN public.subscription_plans sp ON sp.id = cp.plan
    WHERE sp.limits IS NOT NULL
)
SELECT 
    ul.user_id,
    ul.email,
    ul.plan,
    cu.event_type,
    cu.usage_count,
    (ul.limits->>CONCAT('monthly_', cu.event_type))::INT AS usage_limit,
    
    -- 사용률 계산
    ROUND(
        (cu.usage_count::DECIMAL / NULLIF((ul.limits->>CONCAT('monthly_', cu.event_type))::INT, 0)) * 100, 
        2
    ) AS usage_percentage,
    
    -- 알림 수준
    CASE 
        WHEN cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT THEN 'critical'
        WHEN cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT * 0.9 THEN 'warning'
        WHEN cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT * 0.8 THEN 'info'
        ELSE 'normal'
    END AS alert_level,
    
    -- 남은 사용량
    GREATEST(0, (ul.limits->>CONCAT('monthly_', cu.event_type))::INT - cu.usage_count) AS remaining_usage,
    
    -- 예상 소진일 (최근 7일 평균 사용량 기준)
    CASE 
        WHEN cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT THEN 'exceeded'
        ELSE (
            SELECT 
                TO_CHAR(
                    NOW() + INTERVAL '1 day' * (
                        GREATEST(0, (ul.limits->>CONCAT('monthly_', cu.event_type))::INT - cu.usage_count) / 
                        NULLIF(AVG(daily_usage.daily_count), 0)
                    ),
                    'YYYY-MM-DD'
                )
            FROM (
                SELECT 
                    DATE_TRUNC('day', created_at) AS day,
                    SUM(count) AS daily_count
                FROM public.clerk_usage_events
                WHERE user_id = ul.user_id 
                  AND event_type = cu.event_type::usage_event_type
                  AND created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE_TRUNC('day', created_at)
            ) daily_usage
        )
    END AS estimated_depletion_date

FROM user_limits ul
JOIN current_usage cu ON cu.user_id = ul.user_id
WHERE (ul.limits->>CONCAT('monthly_', cu.event_type))::INT > 0  -- 제한이 있는 경우만
  AND cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT * 0.8  -- 80% 이상 사용
ORDER BY 
    CASE 
        WHEN cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT THEN 1
        WHEN cu.usage_count >= (ul.limits->>CONCAT('monthly_', cu.event_type))::INT * 0.9 THEN 2
        ELSE 3
    END,
    cu.usage_count DESC;

-- ========================================
-- 권한 설정
-- ========================================

-- 인증된 사용자가 자신의 사용량 관련 뷰에 접근할 수 있도록 허용
GRANT SELECT ON usage_monthly_summary TO authenticated;
GRANT SELECT ON current_month_usage TO authenticated;
GRANT SELECT ON usage_trends TO authenticated;
GRANT SELECT ON usage_alerts TO authenticated;

-- 관리자는 플랫폼 전체 통계에 접근 가능
GRANT SELECT ON platform_usage_stats TO authenticated;

-- 서비스 역할은 모든 뷰에 접근 가능
GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;

-- ========================================
-- 주석 및 문서화
-- ========================================

COMMENT ON VIEW usage_monthly_summary IS '월간 사용량 요약: 사용자별 월간 사용량과 플랜 제한 비교';
COMMENT ON VIEW current_month_usage IS '현재 월 사용량: 실시간 사용량 조회 및 제한 확인';
COMMENT ON VIEW usage_trends IS '사용량 추세: 월별 사용량 변화와 트렌드 분석';
COMMENT ON VIEW platform_usage_stats IS '플랫폼 통계: 전체 플랫폼 사용량 및 사용자 통계';
COMMENT ON VIEW usage_alerts IS '사용량 알림: 쿼터 초과 위험 사용자 모니터링';