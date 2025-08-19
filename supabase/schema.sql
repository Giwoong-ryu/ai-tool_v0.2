-- ========================================
-- EasyPick AI Tools Platform - Comprehensive Database Schema
-- 한국어 최적화 및 완전한 기능 구현
-- ========================================

-- ========================================
-- EXTENSIONS AND CONFIGURATION
-- ========================================

-- 필요한 확장들 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";           -- UUID 생성
CREATE EXTENSION IF NOT EXISTS "pg_trgm";             -- 삼중문자 검색 (퍼지 매칭)
CREATE EXTENSION IF NOT EXISTS "vector";              -- 벡터 임베딩 검색
CREATE EXTENSION IF NOT EXISTS "btree_gin";           -- GIN 인덱스 성능 개선

-- 한국어 텍스트 검색 설정
CREATE TEXT SEARCH CONFIGURATION korean ( COPY = simple );

-- ========================================
-- CORE USER AND SUBSCRIPTION MANAGEMENT
-- ========================================

-- 1. 사용자 프로필 (Clerk/Supabase Auth 통합)
CREATE TABLE IF NOT EXISTS public.clerk_profiles (
  id UUID PRIMARY KEY,                                 -- Clerk/Supabase user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'free' CHECK (role IN ('free', 'pro', 'business', 'admin')),
  plan VARCHAR(50),                                    -- 현재 구독 플랜
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  auth_metadata JSONB DEFAULT '{}',                    -- 인증 메타데이터
  preferences JSONB DEFAULT '{}',                      -- 사용자 설정
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 구독 플랜 정의
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code VARCHAR(50) UNIQUE NOT NULL,              -- 'pro_monthly', 'business_yearly'
  plan_name VARCHAR(100) NOT NULL,                     -- '프로 월간', '비즈니스 연간'
  role VARCHAR(20) NOT NULL CHECK (role IN ('free', 'pro', 'business')),
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL,                             -- 가격 (원 단위)
  currency VARCHAR(3) DEFAULT 'KRW',
  trial_period_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '{}',                         -- 기능 플래그들
  usage_limits JSONB DEFAULT '{}',                     -- 사용량 제한
  paypal_plan_id VARCHAR(255),                         -- PayPal 플랜 ID
  toss_plan_id VARCHAR(255),                          -- TossPayments 플랜 ID  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 구독 정보
CREATE TABLE IF NOT EXISTS public.clerk_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'suspended', 'trialing', 'incomplete')),
  payment_provider VARCHAR(20) DEFAULT 'paypal' CHECK (payment_provider IN ('paypal', 'toss')),
  paypal_subscription_id VARCHAR(255),
  toss_subscription_id VARCHAR(255),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 거래 내역
CREATE TABLE IF NOT EXISTS public.clerk_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.clerk_subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,                             -- 원 단위
  currency VARCHAR(3) DEFAULT 'KRW',
  transaction_type VARCHAR(20) DEFAULT 'payment' CHECK (transaction_type IN ('payment', 'refund', 'chargeback', 'fee')),
  payment_method VARCHAR(20) DEFAULT 'paypal' CHECK (payment_method IN ('paypal', 'toss', 'card', 'bank_transfer')),
  paypal_tx_id VARCHAR(255),
  toss_tx_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'canceled', 'refunded')),
  description TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 사용량 이벤트
CREATE TABLE IF NOT EXISTS public.clerk_usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('compile_prompt', 'run_workflow', 'api_call', 'export_data', 'ai_generation', 'search_query', 'bookmark_create', 'review_create')),
  resource_id UUID,                                    -- 관련 리소스 ID
  count INTEGER DEFAULT 1,                             -- 사용량
  billing_period_start TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CONTENT MANAGEMENT TABLES
-- ========================================

-- 6. AI 도구 정보
CREATE TABLE IF NOT EXISTS public.ai_tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,                   -- URL 친화적 식별자
  name VARCHAR(200) NOT NULL,                          -- 도구 이름
  description TEXT NOT NULL,                           -- 설명
  long_description TEXT,                               -- 상세 설명
  category VARCHAR(100) NOT NULL,                      -- 카테고리
  subcategory VARCHAR(100),                            -- 하위 카테고리
  website_url TEXT,                                    -- 공식 웹사이트
  logo_url TEXT,                                       -- 로고 URL
  pricing_type VARCHAR(20) DEFAULT 'freemium' CHECK (pricing_type IN ('free', 'freemium', 'paid', 'enterprise')),
  pricing_info JSONB DEFAULT '{}',                     -- 가격 정보
  features TEXT[],                                     -- 주요 기능들
  tags TEXT[],                                         -- 태그들
  rating DECIMAL(2,1) DEFAULT 0.0,                    -- 평점 (0.0-5.0)
  review_count INTEGER DEFAULT 0,                     -- 리뷰 수
  popularity_score INTEGER DEFAULT 0,                 -- 인기도 점수
  is_featured BOOLEAN DEFAULT FALSE,                  -- 추천 도구 여부
  is_korean BOOLEAN DEFAULT FALSE,                    -- 한국어 지원 여부
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  metadata JSONB DEFAULT '{}',                        -- 추가 메타데이터
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 프롬프트 템플릿
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '📝',
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'draft')),
  template_content TEXT NOT NULL,                     -- Handlebars 템플릿
  schema_definition JSONB NOT NULL,                   -- JSON Schema
  compiled_schema JSONB,                              -- 컴파일된 스키마
  options JSONB NOT NULL DEFAULT '[]',               -- 옵션 설정
  default_values JSONB DEFAULT '{}',                 -- 기본값들
  usage_stats JSONB DEFAULT jsonb_build_object(
    'total_usage', 0,
    'monthly_usage', 0,
    'success_rate', 100.0,
    'avg_generation_time', 0
  ),
  metadata JSONB DEFAULT jsonb_build_object(
    'author', 'EasyPick',
    'tags', '[]',
    'difficulty', 'beginner',
    'estimated_time', '5-10분',
    'last_tested', null
  ),
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약조건
  UNIQUE(slug, version),
  CONSTRAINT valid_version CHECK (version ~ '^\d+\.\d+\.\d+$'),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9_-]+$'),
  CONSTRAINT schema_required CHECK (jsonb_typeof(schema_definition) = 'object'),
  CONSTRAINT options_is_array CHECK (jsonb_typeof(options) = 'array')
);

-- 8. 워크플로 템플릿
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time VARCHAR(50),                         -- '10-15분'
  steps JSONB NOT NULL,                               -- 워크플로 단계들
  tools_required TEXT[],                              -- 필요한 도구들
  tags TEXT[],
  icon TEXT DEFAULT '🔄',
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 북마크
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('ai_tool', 'prompt_template', 'workflow')),
  item_id UUID NOT NULL,                              -- 북마크된 아이템 ID
  notes TEXT,                                         -- 개인 메모
  tags TEXT[],                                        -- 개인 태그
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 사용자당 아이템별 중복 방지
  UNIQUE(user_id, item_type, item_id)
);

-- 10. 리뷰 시스템
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('ai_tool', 'prompt_template', 'workflow')),
  item_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  content TEXT,
  pros TEXT[],                                        -- 장점들
  cons TEXT[],                                        -- 단점들
  is_verified BOOLEAN DEFAULT FALSE,                  -- 검증된 리뷰
  helpful_count INTEGER DEFAULT 0,                    -- 도움됨 수
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 사용자당 아이템별 하나의 리뷰만
  UNIQUE(user_id, item_type, item_id)
);

-- 11. 통합 검색 인덱스
CREATE TABLE IF NOT EXISTS public.search_index (
  id BIGSERIAL PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('ai_tool', 'workflow', 'prompt_template')),
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  tags TEXT[],
  category TEXT,
  rating DECIMAL(2,1),
  popularity_score INTEGER DEFAULT 0,
  is_korean BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  
  -- 검색 인덱스 (자동 생성)
  tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('korean', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('korean', COALESCE(content, '')), 'C') ||
    setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('korean', COALESCE(category, '')), 'D')
  ) STORED,
  
  -- 임베딩 벡터 (OpenAI ada-002: 1536차원)
  embedding vector(1536),
  
  -- 메타데이터
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(item_type, item_id)
);

-- 12. 검색 로그
CREATE TABLE IF NOT EXISTS public.search_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  query TEXT NOT NULL,
  query_type TEXT DEFAULT 'unified' CHECK (query_type IN ('unified', 'fts_only', 'vector_only')),
  results_count INTEGER,
  search_time_ms INTEGER,
  clicked_item_type TEXT,
  clicked_item_id TEXT,
  click_position INTEGER,
  dwell_time_ms INTEGER,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 분석 이벤트
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),                            -- 세션 추적
  event_name VARCHAR(100) NOT NULL,                   -- 'page_view', 'search', 'bookmark_add'
  event_category VARCHAR(50) DEFAULT 'general',       -- 'navigation', 'engagement', 'conversion'
  page_path TEXT,                                     -- 페이지 경로
  referrer TEXT,                                      -- 참조자
  user_agent TEXT,                                    -- 브라우저 정보
  ip_address INET,                                    -- IP 주소 (익명화된)
  country_code VARCHAR(2),                            -- 국가 코드
  properties JSONB DEFAULT '{}',                      -- 커스텀 이벤트 속성
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 시스템 설정
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,                   -- 설정 키
  value JSONB NOT NULL,                               -- 설정 값
  description TEXT,                                   -- 설명
  is_public BOOLEAN DEFAULT FALSE,                    -- 클라이언트 노출 여부
  updated_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- 사용자 프로필 인덱스
CREATE INDEX IF NOT EXISTS idx_clerk_profiles_email ON public.clerk_profiles(email);
CREATE INDEX IF NOT EXISTS idx_clerk_profiles_role ON public.clerk_profiles(role);
CREATE INDEX IF NOT EXISTS idx_clerk_profiles_plan ON public.clerk_profiles(plan);

-- 구독 인덱스
CREATE INDEX IF NOT EXISTS idx_clerk_subscriptions_user_id ON public.clerk_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_subscriptions_status ON public.clerk_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_clerk_subscriptions_period ON public.clerk_subscriptions(current_period_start, current_period_end);

-- 거래 인덱스
CREATE INDEX IF NOT EXISTS idx_clerk_transactions_user_id ON public.clerk_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_transactions_created_at ON public.clerk_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clerk_transactions_status ON public.clerk_transactions(status);

-- 사용량 이벤트 인덱스
CREATE INDEX IF NOT EXISTS idx_clerk_usage_events_user_id ON public.clerk_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_usage_events_type ON public.clerk_usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_clerk_usage_events_billing_period ON public.clerk_usage_events(user_id, billing_period_start);

-- AI 도구 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_tools_slug ON public.ai_tools(slug);
CREATE INDEX IF NOT EXISTS idx_ai_tools_category ON public.ai_tools(category);
CREATE INDEX IF NOT EXISTS idx_ai_tools_status ON public.ai_tools(status);
CREATE INDEX IF NOT EXISTS idx_ai_tools_featured ON public.ai_tools(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_tools_korean ON public.ai_tools(is_korean) WHERE is_korean = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_tools_rating ON public.ai_tools(rating DESC, review_count DESC);

-- 프롬프트 템플릿 인덱스
CREATE INDEX IF NOT EXISTS idx_prompt_templates_slug ON public.prompt_templates(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON public.prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_status ON public.prompt_templates(status);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_featured ON public.prompt_templates(is_featured) WHERE is_featured = TRUE;

-- 워크플로 인덱스
CREATE INDEX IF NOT EXISTS idx_workflows_slug ON public.workflows(slug);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON public.workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_featured ON public.workflows(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflows_rating ON public.workflows(rating DESC, review_count DESC);

-- 북마크 인덱스
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item_type ON public.bookmarks(item_type);

-- 리뷰 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_item ON public.reviews(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);

-- ========================================
-- FULL-TEXT SEARCH INDEXES (Korean Optimized)
-- ========================================

-- FTS 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_search_index_tsv ON public.search_index USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_search_index_embedding ON public.search_index USING hnsw (embedding vector_cosine_ops);

-- AI 도구 텍스트 검색 (한국어 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_tools_fts ON public.ai_tools USING GIN(
  (setweight(to_tsvector('korean', name), 'A') ||
   setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
   setweight(to_tsvector('korean', COALESCE(long_description, '')), 'C') ||
   setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B'))
);

-- 프롬프트 템플릿 텍스트 검색
CREATE INDEX IF NOT EXISTS idx_prompt_templates_fts ON public.prompt_templates USING GIN(
  (setweight(to_tsvector('korean', name), 'A') ||
   setweight(to_tsvector('korean', COALESCE(description, '')), 'B'))
);

-- 워크플로 텍스트 검색
CREATE INDEX IF NOT EXISTS idx_workflows_fts ON public.workflows USING GIN(
  (setweight(to_tsvector('korean', name), 'A') ||
   setweight(to_tsvector('korean', COALESCE(description, '')), 'B'))
);

-- ========================================
-- TRIGRAM INDEXES (Fuzzy Matching)
-- ========================================

-- AI 도구 trigram 검색
CREATE INDEX IF NOT EXISTS idx_ai_tools_name_trgm ON public.ai_tools USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ai_tools_description_trgm ON public.ai_tools USING GIN(description gin_trgm_ops);

-- 프롬프트 템플릿 trigram 검색  
CREATE INDEX IF NOT EXISTS idx_prompt_templates_name_trgm ON public.prompt_templates USING GIN(name gin_trgm_ops);

-- 워크플로 trigram 검색
CREATE INDEX IF NOT EXISTS idx_workflows_name_trgm ON public.workflows USING GIN(name gin_trgm_ops);

-- 검색 로그 trigram 검색
CREATE INDEX IF NOT EXISTS idx_search_logs_query_trgm ON public.search_logs USING GIN(query gin_trgm_ops);

-- ========================================
-- BUSINESS LOGIC FUNCTIONS
-- ========================================

-- 활성 구독 확인
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clerk_subscriptions 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용량 체크
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan VARCHAR(50);
  plan_limits JSONB;
  event_limit INTEGER;
  current_usage INTEGER;
  billing_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 사용자 플랜 조회
  SELECT plan INTO user_plan FROM public.clerk_profiles WHERE id = p_user_id;
  
  -- 무료 사용자 제한
  IF user_plan IS NULL THEN
    CASE p_event_type
      WHEN 'compile_prompt' THEN event_limit := 10;
      WHEN 'run_workflow' THEN event_limit := 5;
      WHEN 'search_query' THEN event_limit := 50;
      WHEN 'ai_generation' THEN event_limit := 3;
      ELSE event_limit := 0;
    END CASE;
  ELSE
    -- 유료 플랜 제한 조회
    SELECT usage_limits INTO plan_limits
    FROM public.subscription_plans
    WHERE plan_code = user_plan AND is_active = TRUE;
    
    event_limit := COALESCE((plan_limits ->> p_event_type)::INTEGER, 999999);
  END IF;
  
  -- 현재 사용량 계산
  SELECT current_period_start INTO billing_start
  FROM public.clerk_profiles WHERE id = p_user_id;
  
  billing_start := COALESCE(billing_start, date_trunc('month', NOW()));
  
  SELECT COALESCE(SUM(count), 0) INTO current_usage
  FROM public.clerk_usage_events
  WHERE user_id = p_user_id
  AND event_type = p_event_type
  AND created_at >= billing_start;
  
  RETURN (current_usage + p_count) <= event_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용량 기록
CREATE OR REPLACE FUNCTION record_usage_event(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_resource_id UUID DEFAULT NULL,
  p_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  billing_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 사용량 제한 확인
  IF NOT check_usage_limit(p_user_id, p_event_type, p_count) THEN
    RETURN FALSE;
  END IF;
  
  -- 청구 기간 조회
  SELECT current_period_start INTO billing_start
  FROM public.clerk_profiles WHERE id = p_user_id;
  
  -- 사용량 이벤트 기록
  INSERT INTO public.clerk_usage_events (
    user_id, event_type, resource_id, count, billing_period_start, metadata
  ) VALUES (
    p_user_id, p_event_type, p_resource_id, p_count,
    COALESCE(billing_start, date_trunc('month', NOW())), p_metadata
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 통합 검색 함수 (하이브리드 검색: FTS + 벡터)
CREATE OR REPLACE FUNCTION search_items(
  p_query TEXT,
  p_item_types TEXT[] DEFAULT ARRAY['ai_tool', 'prompt_template', 'workflow'],
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  item_type TEXT,
  item_id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  rating DECIMAL,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.item_type,
    si.item_id,
    si.title,
    si.description,
    si.category,
    si.rating,
    CASE 
      WHEN p_query IS NULL OR p_query = '' THEN 1.0
      ELSE (
        ts_rank(si.tsv, plainto_tsquery('korean', p_query)) * 0.7 +
        similarity(si.title, p_query) * 0.3 +
        si.popularity_score * 0.0001
      )
    END as relevance_score
  FROM public.search_index si
  WHERE 
    si.item_type = ANY(p_item_types)
    AND (p_category IS NULL OR si.category = p_category)
    AND (
      p_query IS NULL OR p_query = '' OR
      si.tsv @@ plainto_tsquery('korean', p_query) OR
      similarity(si.title, p_query) > 0.3
    )
  ORDER BY relevance_score DESC, si.popularity_score DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS FOR AUTOMATION
-- ========================================

-- 타임스탬프 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 타임스탬프 트리거들
CREATE TRIGGER trigger_clerk_profiles_updated_at
  BEFORE UPDATE ON public.clerk_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_clerk_subscriptions_updated_at
  BEFORE UPDATE ON public.clerk_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ai_tools_updated_at
  BEFORE UPDATE ON public.ai_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 검색 인덱스 업데이트 트리거
CREATE OR REPLACE FUNCTION update_search_index_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_index_timestamp
  BEFORE UPDATE ON public.search_index
  FOR EACH ROW EXECUTE FUNCTION update_search_index_timestamp();

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.clerk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 기본 DENY 정책 (보안 우선)
-- 명시적으로 허용되지 않은 모든 접근은 차단

-- 사용자 프로필 정책
CREATE POLICY "Users can view own profile" ON public.clerk_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.clerk_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 구독 정보 정책
CREATE POLICY "Users can view own subscriptions" ON public.clerk_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 거래 내역 정책
CREATE POLICY "Users can view own transactions" ON public.clerk_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 사용량 이벤트 정책
CREATE POLICY "Users can view own usage events" ON public.clerk_usage_events
  FOR SELECT USING (auth.uid() = user_id);

-- AI 도구 정책 (공개 읽기)
CREATE POLICY "Anyone can view active AI tools" ON public.ai_tools
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create AI tools" ON public.ai_tools
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own AI tools" ON public.ai_tools
  FOR UPDATE USING (auth.uid() = created_by);

-- 프롬프트 템플릿 정책
CREATE POLICY "Anyone can view public prompt templates" ON public.prompt_templates
  FOR SELECT USING (is_public = TRUE AND status = 'active');

CREATE POLICY "Users can view own prompt templates" ON public.prompt_templates
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create prompt templates" ON public.prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own prompt templates" ON public.prompt_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- 워크플로 정책
CREATE POLICY "Anyone can view public workflows" ON public.workflows
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view own workflows" ON public.workflows
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create workflows" ON public.workflows
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own workflows" ON public.workflows
  FOR UPDATE USING (auth.uid() = created_by);

-- 북마크 정책
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- 리뷰 정책
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- 검색 인덱스 정책 (공개 읽기)
CREATE POLICY "Anyone can search" ON public.search_index
  FOR SELECT USING (true);

-- 검색 로그 정책
CREATE POLICY "Users can view own search logs" ON public.search_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create search logs" ON public.search_logs
  FOR INSERT WITH CHECK (true);

-- 분석 이벤트 정책
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- 시스템 설정 정책
CREATE POLICY "Anyone can view public settings" ON public.system_settings
  FOR SELECT USING (is_public = TRUE);

-- 관리자 정책들
CREATE POLICY "Admins have full access to profiles" ON public.clerk_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to AI tools" ON public.ai_tools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 서비스 역할 전체 접근
CREATE POLICY "Service role full access profiles" ON public.clerk_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access subscriptions" ON public.clerk_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access transactions" ON public.clerk_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage events" ON public.clerk_usage_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access ai tools" ON public.ai_tools
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access prompt templates" ON public.prompt_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access workflows" ON public.workflows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access reviews" ON public.reviews
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access search index" ON public.search_index
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access system settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- 읽기 전용 테이블들은 익명 사용자도 접근 가능
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.ai_tools TO anon;
GRANT SELECT ON public.prompt_templates TO anon;
GRANT SELECT ON public.workflows TO anon;
GRANT SELECT ON public.search_index TO anon;

-- 인증된 사용자 권한
GRANT ALL ON public.clerk_profiles TO authenticated;
GRANT ALL ON public.clerk_subscriptions TO authenticated;
GRANT ALL ON public.clerk_transactions TO authenticated;
GRANT ALL ON public.clerk_usage_events TO authenticated;
GRANT ALL ON public.ai_tools TO authenticated;
GRANT ALL ON public.prompt_templates TO authenticated;
GRANT ALL ON public.workflows TO authenticated;
GRANT ALL ON public.bookmarks TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.search_logs TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.system_settings TO authenticated;

-- 시퀀스 권한
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 함수 실행 권한
GRANT EXECUTE ON FUNCTION has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage_event TO authenticated;
GRANT EXECUTE ON FUNCTION search_items TO authenticated;

-- 서비스 역할 전체 권한
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- 구독 플랜 데이터
INSERT INTO public.subscription_plans (
  plan_code, plan_name, role, billing_interval, amount, currency,
  trial_period_days, features, usage_limits, paypal_plan_id
) VALUES 
  (
    'pro_monthly',
    'Pro 월간',
    'pro',
    'monthly',
    19900,
    'KRW',
    7,
    '{"advanced_prompts": true, "workflow_automation": true, "priority_support": true}',
    '{"compile_prompt": 1000, "run_workflow": 500, "api_call": 10000, "search_query": 5000, "ai_generation": 100}',
    'P-pro-monthly-kr'
  ),
  (
    'pro_yearly',
    'Pro 연간',
    'pro',
    'yearly',
    199000,
    'KRW',
    14,
    '{"advanced_prompts": true, "workflow_automation": true, "priority_support": true}',
    '{"compile_prompt": 12000, "run_workflow": 6000, "api_call": 120000, "search_query": 60000, "ai_generation": 1200}',
    'P-pro-yearly-kr'
  ),
  (
    'business_monthly',
    'Business 월간',
    'business',
    'monthly',
    49900,
    'KRW',
    7,
    '{"team_management": true, "custom_integrations": true, "white_label": true, "dedicated_support": true}',
    '{"compile_prompt": -1, "run_workflow": -1, "api_call": -1, "search_query": -1, "ai_generation": -1}',
    'P-business-monthly-kr'
  )
ON CONFLICT (plan_code) DO NOTHING;

-- 시스템 설정 데이터
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('site_name', '"EasyPick"', '사이트 이름', TRUE),
  ('site_description', '"AI 도구 발견과 활용을 위한 플랫폼"', '사이트 설명', TRUE),
  ('maintenance_mode', 'false', '점검 모드', TRUE),
  ('max_free_prompts', '10', '무료 사용자 프롬프트 제한', FALSE),
  ('max_free_workflows', '5', '무료 사용자 워크플로 제한', FALSE)
ON CONFLICT (key) DO NOTHING;

-- 샘플 AI 도구
INSERT INTO public.ai_tools (
  slug, name, description, category, website_url, pricing_type,
  features, tags, is_featured, is_korean, rating, popularity_score
) VALUES
  (
    'chatgpt',
    'ChatGPT',
    '강력한 대화형 AI 어시스턴트',
    'AI 채팅',
    'https://chat.openai.com',
    'freemium',
    ARRAY['자연어 처리', '코딩 지원', '창작 도우미'],
    ARRAY['OpenAI', 'GPT', '채팅', '대화형'],
    TRUE,
    TRUE,
    4.5,
    1000
  ),
  (
    'midjourney',
    'Midjourney',
    '고품질 AI 이미지 생성 도구',
    'AI 이미지',
    'https://midjourney.com',
    'paid',
    ARRAY['이미지 생성', '아트워크', '디자인'],
    ARRAY['이미지', '생성', '아트', '디자인'],
    TRUE,
    FALSE,
    4.3,
    800
  )
ON CONFLICT (slug) DO NOTHING;

-- 샘플 프롬프트 템플릿
INSERT INTO public.prompt_templates (
  slug, name, category, description, template_content, schema_definition, options,
  default_values, is_featured, is_public
) VALUES
  (
    'blog_post_writer',
    '블로그 포스트 작성기',
    '콘텐츠 작성',
    'SEO 최적화된 블로그 포스트를 작성합니다',
    '{{topic}}에 대한 {{tone}} 스타일의 블로그 포스트를 {{word_count}}자 분량으로 작성해주세요.\n\n키워드: {{keywords}}\n타겟 독자: {{audience}}\n\n구조:\n1. 매력적인 제목\n2. 도입부\n3. 본문 ({{sections}}개 섹션)\n4. 결론\n5. CTA',
    '{"type": "object", "properties": {"topic": {"type": "string"}, "tone": {"type": "string"}, "word_count": {"type": "string"}, "keywords": {"type": "string"}, "audience": {"type": "string"}, "sections": {"type": "string"}}}',
    '[{"key": "topic", "label": "주제", "type": "text", "required": true}, {"key": "tone", "label": "톤", "type": "select", "options": ["전문적", "친근한", "유머러스", "진지한"], "required": true}]',
    '{"tone": "전문적", "word_count": "1000-1500", "sections": "3"}',
    TRUE,
    TRUE
  )
ON CONFLICT (slug, version) DO NOTHING;

-- ========================================
-- COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.clerk_profiles IS '사용자 프로필 및 구독 정보';
COMMENT ON TABLE public.ai_tools IS 'AI 도구 정보 및 메타데이터';
COMMENT ON TABLE public.prompt_templates IS '프롬프트 템플릿 시스템';
COMMENT ON TABLE public.workflows IS '워크플로 템플릿';
COMMENT ON TABLE public.search_index IS '통합 검색 인덱스 (FTS + 벡터 검색)';
COMMENT ON TABLE public.analytics_events IS '사용자 행동 분석 이벤트';

COMMENT ON COLUMN public.search_index.tsv IS '한국어 최적화 전문 검색 벡터';
COMMENT ON COLUMN public.search_index.embedding IS 'OpenAI ada-002 임베딩 (1536차원)';

-- ========================================
-- DEPLOYMENT INSTRUCTIONS
-- ========================================

/*
배포 지침:

1. psql을 사용한 배포:
   psql -h your-host -U postgres -d your-database -f schema.sql

2. Supabase CLI를 사용한 배포:
   supabase db push

3. 마이그레이션으로 배포:
   - 이 파일을 supabase/migrations/ 폴더에 복사
   - supabase db push 실행

4. 배포 후 확인사항:
   - 모든 테이블이 생성되었는지 확인
   - RLS 정책이 활성화되었는지 확인
   - 인덱스가 생성되었는지 확인
   - 샘플 데이터가 삽입되었는지 확인

5. 성능 최적화:
   - VACUUM ANALYZE 실행 권장
   - 인덱스 사용량 모니터링
   - 쿼리 성능 측정

주의사항:
- 프로덕션 배포 전 백업 필수
- RLS 정책 테스트 필수  
- 환경변수 설정 확인
- 한국어 검색 기능 테스트 필요
*/