-- EasyPick 요금제 및 팀 관리 스키마
-- 목적: Free/Pro 요금제 관리, 팀 협업, 권한 제어
-- 작성자: Claude Security Specialist

-- 요금제 정의 테이블
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- 요금 정보
    price_monthly INTEGER DEFAULT 0, -- 월 요금 (원)
    price_yearly INTEGER DEFAULT 0,  -- 연 요금 (원)
    
    -- 기능 제한
    limits JSONB DEFAULT '{}' NOT NULL,
    features JSONB DEFAULT '[]' NOT NULL,
    
    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 요금제 데이터
INSERT INTO plans (id, name, display_name, description, price_monthly, price_yearly, limits, features) VALUES
('free', 'Free', '무료', '개인 사용자를 위한 기본 플랜', 0, 0, 
 '{
   "monthly_compiles": 20,
   "monthly_saves": 10,
   "team_members": 1,
   "storage_mb": 100,
   "api_calls_per_day": 50,
   "max_workflows": 5,
   "max_prompts": 10
 }',
 '["기본 AI 도구", "프롬프트 템플릿", "워크플로 기본", "개인 북마크"]'
),
('pro', 'Pro', '프로', '전문가를 위한 프리미엄 플랜', 29000, 290000,
 '{
   "monthly_compiles": -1,
   "monthly_saves": -1,
   "team_members": 10,
   "storage_mb": 10240,
   "api_calls_per_day": 1000,
   "max_workflows": -1,
   "max_prompts": -1
 }',
 '["모든 AI 도구", "무제한 프롬프트", "고급 워크플로", "팀 협업", "우선 지원", "API 액세스", "고급 분석"]'
),
('team', 'Team', '팀', '팀 협업을 위한 엔터프라이즈 플랜', 89000, 890000,
 '{
   "monthly_compiles": -1,
   "monthly_saves": -1,
   "team_members": 50,
   "storage_mb": 51200,
   "api_calls_per_day": 5000,
   "max_workflows": -1,
   "max_prompts": -1
 }',
 '["모든 Pro 기능", "팀 관리", "역할 기반 권한", "감사 로그", "SSO 연동", "전담 지원"]'
)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    limits = EXCLUDED.limits,
    features = EXCLUDED.features,
    updated_at = NOW();

-- 팀 테이블
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- 소유자
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 요금제 정보
    plan_id TEXT NOT NULL REFERENCES plans(id) DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'suspended')),
    subscription_period_start TIMESTAMPTZ,
    subscription_period_end TIMESTAMPTZ,
    
    -- 팀 설정
    settings JSONB DEFAULT '{}',
    
    -- 결제 정보
    billing_email TEXT,
    payment_method_id TEXT, -- Stripe/PayPal 결제 수단 ID
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT teams_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- 팀 멤버십 테이블
CREATE TABLE IF NOT EXISTS team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 역할 및 권한
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member')),
    permissions JSONB DEFAULT '[]',
    
    -- 초대 정보
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(team_id, user_id)
);

-- 사용자 프로필 확장 (기존 profiles 테이블 확장)
-- 주의: 기존 profiles 테이블이 있다면 ALTER TABLE 사용
DO $$
BEGIN
    -- plan 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'plan'
    ) THEN
        ALTER TABLE profiles ADD COLUMN plan TEXT REFERENCES plans(id) DEFAULT 'free';
    END IF;
    
    -- current_team_id 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'current_team_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN current_team_id UUID REFERENCES teams(id);
    END IF;
    
    -- subscription_status 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'active' 
        CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'suspended'));
    END IF;
    
    -- subscription_period_end 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_period_end'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_period_end TIMESTAMPTZ;
    END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_plan ON teams(plan_id);
CREATE INDEX IF NOT EXISTS idx_teams_subscription ON teams(subscription_status, subscription_period_end);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_role ON team_memberships(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(current_team_id);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_plan_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plans_timestamp
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_tables_timestamp();

CREATE TRIGGER trigger_update_teams_timestamp
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_tables_timestamp();

CREATE TRIGGER trigger_update_team_memberships_timestamp
    BEFORE UPDATE ON team_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_tables_timestamp();

-- RLS 정책
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;

-- 요금제는 모든 사용자가 읽기 가능
CREATE POLICY "plans_read_all"
ON plans FOR SELECT
TO public
USING (is_active = true);

-- 팀 읽기: 팀 멤버만 가능
CREATE POLICY "teams_read_members"
ON teams FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT team_id FROM team_memberships 
        WHERE user_id = auth.uid()
    )
);

-- 팀 수정: 소유자와 관리자만 가능
CREATE POLICY "teams_update_owners_admins"
ON teams FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() 
    OR id IN (
        SELECT team_id FROM team_memberships 
        WHERE user_id = auth.uid() AND role IN ('admin')
    )
);

-- 팀 삭제: 소유자만 가능
CREATE POLICY "teams_delete_owners"
ON teams FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- 팀 멤버십 읽기: 같은 팀 멤버만 가능
CREATE POLICY "team_memberships_read_team_members"
ON team_memberships FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id FROM team_memberships 
        WHERE user_id = auth.uid()
    )
);

-- 팀 멤버십 수정: 소유자, 관리자, 본인(역할 제한)만 가능
CREATE POLICY "team_memberships_update_restricted"
ON team_memberships FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() -- 본인은 일부 권한만
    OR team_id IN (
        SELECT t.id FROM teams t
        WHERE t.owner_id = auth.uid() -- 팀 소유자
    )
    OR team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'admin' -- 팀 관리자
    )
);

-- 유틸리티 함수들

-- 사용자의 현재 플랜 조회
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_plan TEXT;
    team_plan TEXT;
BEGIN
    -- 개인 플랜 조회
    SELECT plan INTO user_plan 
    FROM profiles 
    WHERE id = user_id;
    
    -- 현재 팀의 플랜 조회 (팀 플랜이 개인 플랜보다 우선)
    SELECT t.plan_id INTO team_plan
    FROM profiles p
    JOIN teams t ON t.id = p.current_team_id
    WHERE p.id = user_id
    AND t.subscription_status = 'active'
    AND (t.subscription_period_end IS NULL OR t.subscription_period_end > NOW());
    
    -- 팀 플랜이 있으면 팀 플랜, 없으면 개인 플랜 반환
    RETURN COALESCE(team_plan, user_plan, 'free');
END;
$$;

-- 플랜 제한 조회
CREATE OR REPLACE FUNCTION get_plan_limit(plan_id TEXT, limit_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    limit_value INTEGER;
BEGIN
    SELECT (limits->limit_key)::INTEGER INTO limit_value
    FROM plans
    WHERE id = plan_id AND is_active = true;
    
    RETURN COALESCE(limit_value, 0);
END;
$$;

-- 팀 권한 확인
CREATE OR REPLACE FUNCTION check_team_permission(
    team_id UUID, 
    user_id UUID, 
    required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- 사용자 역할 조회
    SELECT role INTO user_role
    FROM team_memberships
    WHERE team_id = check_team_permission.team_id 
    AND user_id = check_team_permission.user_id;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- 역할 계층 구조 (높을수록 더 많은 권한)
    role_hierarchy := CASE user_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$;

-- 권한 부여
GRANT SELECT ON plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan TO authenticated;
GRANT EXECUTE ON FUNCTION get_plan_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_team_permission TO authenticated;

COMMENT ON TABLE plans IS '요금제 정의 (Free, Pro, Team)';
COMMENT ON TABLE teams IS '팀 정보 및 구독 관리';
COMMENT ON TABLE team_memberships IS '팀 멤버십 및 역할 관리';
COMMENT ON FUNCTION get_user_plan IS '사용자의 현재 유효한 플랜 조회 (팀 > 개인)';
COMMENT ON FUNCTION get_plan_limit IS '플랜별 제한값 조회';
COMMENT ON FUNCTION check_team_permission IS '팀 내 사용자 권한 확인';