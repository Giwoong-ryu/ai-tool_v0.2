-- EasyPick 사용량 추적 및 쿼터 관리 스키마
-- 목적: 월간 사용량 추적, 쿼터 제한, 이벤트 로깅
-- 작성자: Claude Security Specialist

-- 사용량 이벤트 로깅 테이블
CREATE TABLE IF NOT EXISTS usage_events (
    id BIGSERIAL PRIMARY KEY,
    
    -- 사용자/팀 정보
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- 이벤트 정보
    event_type TEXT NOT NULL CHECK (event_type IN (
        'compile', 'save', 'api_call', 'workflow_run', 
        'prompt_generate', 'storage_write', 'export', 
        'search', 'ai_tool_access'
    )),
    resource_type TEXT, -- 'workflow', 'prompt', 'ai_tool' 등
    resource_id TEXT,   -- 리소스의 고유 ID
    
    -- 사용량 정보
    quantity INTEGER DEFAULT 1, -- 사용량 (토큰 수, 파일 크기 등)
    metadata JSONB DEFAULT '{}', -- 추가 메타데이터
    
    -- 요금제 정보 (이벤트 발생 시점 기준)
    plan_id TEXT NOT NULL,
    plan_limits JSONB, -- 이벤트 발생 시점의 플랜 제한
    
    -- IP 및 세션 정보 (보안)
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 월간 사용량 집계 테이블 (성능 최적화)
CREATE TABLE IF NOT EXISTS usage_summary (
    id BIGSERIAL PRIMARY KEY,
    
    -- 집계 키
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    
    -- 집계 데이터
    total_events INTEGER DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    plan_id TEXT NOT NULL,
    
    -- 플랜 제한 (월 기준)
    monthly_limit INTEGER, -- -1은 무제한
    
    -- 메타데이터
    first_event_at TIMESTAMPTZ,
    last_event_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, team_id, event_type, year, month)
);

-- 실시간 쿼터 상태 테이블 (빠른 조회용)
CREATE TABLE IF NOT EXISTS quota_status (
    id BIGSERIAL PRIMARY KEY,
    
    -- 사용자/팀 정보
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- 현재 월 정보
    current_month DATE NOT NULL, -- 월의 첫 날 (2024-01-01)
    plan_id TEXT NOT NULL,
    
    -- 쿼터 정보
    compiles_used INTEGER DEFAULT 0,
    compiles_limit INTEGER DEFAULT 0, -- -1은 무제한
    
    saves_used INTEGER DEFAULT 0,
    saves_limit INTEGER DEFAULT 0,
    
    api_calls_used INTEGER DEFAULT 0,
    api_calls_limit INTEGER DEFAULT 0,
    
    storage_used_mb INTEGER DEFAULT 0,
    storage_limit_mb INTEGER DEFAULT 0,
    
    -- 메타데이터
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, team_id, current_month)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_usage_events_user_time ON usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_team_time ON usage_events(team_id, created_at DESC) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_events_type_time ON usage_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_monthly ON usage_events(user_id, event_type, date_trunc('month', created_at));

CREATE INDEX IF NOT EXISTS idx_usage_summary_user_month ON usage_summary(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_usage_summary_team_month ON usage_summary(team_id, year, month) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_summary_type ON usage_summary(event_type, year, month);

CREATE INDEX IF NOT EXISTS idx_quota_status_user ON quota_status(user_id, current_month);
CREATE INDEX IF NOT EXISTS idx_quota_status_team ON quota_status(team_id, current_month) WHERE team_id IS NOT NULL;

-- 사용량 기록 함수
CREATE OR REPLACE FUNCTION log_usage_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_quantity INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id UUID;
    v_plan_id TEXT;
    v_plan_limits JSONB;
    v_current_month DATE;
    v_limit_key TEXT;
    v_current_usage INTEGER;
    v_monthly_limit INTEGER;
BEGIN
    -- 사용자 정보 조회
    SELECT current_team_id INTO v_team_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- 플랜 정보 조회
    v_plan_id := get_user_plan(p_user_id);
    
    SELECT limits INTO v_plan_limits
    FROM plans
    WHERE id = v_plan_id;
    
    v_current_month := date_trunc('month', NOW())::DATE;
    
    -- 이벤트 타입별 제한 확인
    v_limit_key := CASE p_event_type
        WHEN 'compile' THEN 'monthly_compiles'
        WHEN 'save' THEN 'monthly_saves'
        WHEN 'api_call' THEN 'api_calls_per_day'
        ELSE NULL
    END;
    
    -- 제한 확인 (있는 경우)
    IF v_limit_key IS NOT NULL THEN
        v_monthly_limit := (v_plan_limits->v_limit_key)::INTEGER;
        
        -- -1은 무제한
        IF v_monthly_limit > 0 THEN
            -- 현재 사용량 조회
            SELECT COALESCE(
                CASE v_limit_key
                    WHEN 'monthly_compiles' THEN compiles_used
                    WHEN 'monthly_saves' THEN saves_used
                    WHEN 'api_calls_per_day' THEN api_calls_used
                    ELSE 0
                END, 0
            ) INTO v_current_usage
            FROM quota_status
            WHERE user_id = p_user_id
            AND team_id IS NOT DISTINCT FROM v_team_id
            AND current_month = v_current_month;
            
            -- 제한 초과 확인
            IF v_current_usage + p_quantity > v_monthly_limit THEN
                RETURN FALSE; -- 쿼터 초과
            END IF;
        END IF;
    END IF;
    
    -- 사용량 이벤트 로깅
    INSERT INTO usage_events (
        user_id, team_id, event_type, resource_type, resource_id,
        quantity, metadata, plan_id, plan_limits,
        ip_address, user_agent, session_id
    ) VALUES (
        p_user_id, v_team_id, p_event_type, p_resource_type, p_resource_id,
        p_quantity, p_metadata, v_plan_id, v_plan_limits,
        p_ip_address, p_user_agent, p_session_id
    );
    
    -- 쿼터 상태 업데이트
    INSERT INTO quota_status (
        user_id, team_id, current_month, plan_id,
        compiles_used, compiles_limit,
        saves_used, saves_limit,
        api_calls_used, api_calls_limit,
        storage_limit_mb
    ) VALUES (
        p_user_id, v_team_id, v_current_month, v_plan_id,
        CASE WHEN p_event_type = 'compile' THEN p_quantity ELSE 0 END,
        COALESCE((v_plan_limits->>'monthly_compiles')::INTEGER, 0),
        CASE WHEN p_event_type = 'save' THEN p_quantity ELSE 0 END,
        COALESCE((v_plan_limits->>'monthly_saves')::INTEGER, 0),
        CASE WHEN p_event_type = 'api_call' THEN p_quantity ELSE 0 END,
        COALESCE((v_plan_limits->>'api_calls_per_day')::INTEGER, 0),
        COALESCE((v_plan_limits->>'storage_mb')::INTEGER, 0)
    )
    ON CONFLICT (user_id, team_id, current_month) DO UPDATE SET
        compiles_used = quota_status.compiles_used + 
            CASE WHEN p_event_type = 'compile' THEN p_quantity ELSE 0 END,
        saves_used = quota_status.saves_used + 
            CASE WHEN p_event_type = 'save' THEN p_quantity ELSE 0 END,
        api_calls_used = quota_status.api_calls_used + 
            CASE WHEN p_event_type = 'api_call' THEN p_quantity ELSE 0 END,
        last_updated = NOW();
    
    RETURN TRUE;
END;
$$;

-- 사용량 확인 함수
CREATE OR REPLACE FUNCTION check_usage_quota(
    p_user_id UUID,
    p_event_type TEXT,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id UUID;
    v_plan_id TEXT;
    v_current_month DATE;
    v_quota_status quota_status%ROWTYPE;
    v_limit_value INTEGER;
    v_current_usage INTEGER;
    v_result JSONB;
BEGIN
    -- 사용자 정보 조회
    SELECT current_team_id INTO v_team_id
    FROM profiles
    WHERE id = p_user_id;
    
    v_plan_id := get_user_plan(p_user_id);
    v_current_month := date_trunc('month', NOW())::DATE;
    
    -- 현재 쿼터 상태 조회
    SELECT * INTO v_quota_status
    FROM quota_status
    WHERE user_id = p_user_id
    AND team_id IS NOT DISTINCT FROM v_team_id
    AND current_month = v_current_month;
    
    -- 이벤트 타입별 제한 및 사용량 확인
    CASE p_event_type
        WHEN 'compile' THEN
            v_limit_value := COALESCE(v_quota_status.compiles_limit, 0);
            v_current_usage := COALESCE(v_quota_status.compiles_used, 0);
        WHEN 'save' THEN
            v_limit_value := COALESCE(v_quota_status.saves_limit, 0);
            v_current_usage := COALESCE(v_quota_status.saves_used, 0);
        WHEN 'api_call' THEN
            v_limit_value := COALESCE(v_quota_status.api_calls_limit, 0);
            v_current_usage := COALESCE(v_quota_status.api_calls_used, 0);
        ELSE
            v_limit_value := -1; -- 제한 없음
            v_current_usage := 0;
    END CASE;
    
    -- 결과 생성
    v_result := jsonb_build_object(
        'allowed', CASE 
            WHEN v_limit_value = -1 THEN true -- 무제한
            WHEN v_current_usage + p_quantity <= v_limit_value THEN true
            ELSE false
        END,
        'current_usage', v_current_usage,
        'limit', v_limit_value,
        'remaining', CASE 
            WHEN v_limit_value = -1 THEN -1
            ELSE GREATEST(0, v_limit_value - v_current_usage)
        END,
        'plan_id', v_plan_id,
        'reset_date', (v_current_month + INTERVAL '1 month')::DATE
    );
    
    RETURN v_result;
END;
$$;

-- 월간 사용량 집계 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION aggregate_monthly_usage(
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW())::INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_processed_count INTEGER := 0;
BEGIN
    v_start_date := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_end_date := v_start_date + INTERVAL '1 month';
    
    -- 월간 집계 데이터 생성/업데이트
    INSERT INTO usage_summary (
        user_id, team_id, event_type, year, month,
        total_events, total_quantity, plan_id,
        first_event_at, last_event_at
    )
    SELECT 
        user_id,
        team_id,
        event_type,
        p_year,
        p_month,
        COUNT(*) as total_events,
        SUM(quantity) as total_quantity,
        plan_id,
        MIN(created_at) as first_event_at,
        MAX(created_at) as last_event_at
    FROM usage_events
    WHERE created_at >= v_start_date 
    AND created_at < v_end_date
    GROUP BY user_id, team_id, event_type, plan_id
    ON CONFLICT (user_id, team_id, event_type, year, month) DO UPDATE SET
        total_events = EXCLUDED.total_events,
        total_quantity = EXCLUDED.total_quantity,
        last_event_at = EXCLUDED.last_event_at,
        last_updated = NOW();
    
    GET DIAGNOSTICS v_processed_count = ROW_COUNT;
    
    RETURN v_processed_count;
END;
$$;

-- RLS 정책
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_status ENABLE ROW LEVEL SECURITY;

-- 본인 사용량만 조회 가능
CREATE POLICY "usage_events_read_own"
ON usage_events FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "usage_summary_read_own"
ON usage_summary FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "quota_status_read_own"
ON quota_status FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 사용량 삽입은 함수를 통해서만
CREATE POLICY "usage_events_insert_via_function"
ON usage_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "quota_status_insert_via_function"
ON quota_status FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "quota_status_update_via_function"
ON quota_status FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 권한 부여
GRANT SELECT ON usage_events TO authenticated;
GRANT SELECT ON usage_summary TO authenticated;
GRANT SELECT ON quota_status TO authenticated;
GRANT EXECUTE ON FUNCTION log_usage_event TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_quota TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_monthly_usage TO authenticated;

-- 정리 작업 (30일 이후 이벤트 로그 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_usage_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM usage_events
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

COMMENT ON TABLE usage_events IS '사용량 이벤트 로그 (30일 보관)';
COMMENT ON TABLE usage_summary IS '월간 사용량 집계 (장기 보관)';
COMMENT ON TABLE quota_status IS '실시간 쿼터 상태 (빠른 조회용)';
COMMENT ON FUNCTION log_usage_event IS '사용량 이벤트 기록 및 쿼터 업데이트';
COMMENT ON FUNCTION check_usage_quota IS '사용량 쿼터 확인';
COMMENT ON FUNCTION aggregate_monthly_usage IS '월간 사용량 집계 (배치 작업)';
COMMENT ON FUNCTION cleanup_old_usage_events IS '오래된 사용량 이벤트 정리';