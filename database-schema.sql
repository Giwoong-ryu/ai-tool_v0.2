-- ========================================
-- AI 도구 추천 사이트 데이터베이스 스키마
-- 실행: Supabase Dashboard > SQL Editor에서 실행
-- ========================================

-- 1. 사용자 프로필 테이블 (Supabase Auth와 연동)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
  usage_count INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AI 도구 정보 테이블
CREATE TABLE public.ai_tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  website_url TEXT NOT NULL,
  logo_url TEXT,
  pricing_type VARCHAR(50) DEFAULT 'freemium' CHECK (pricing_type IN ('free', 'freemium', 'paid')),
  pricing_info JSONB DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 활동 추적 테이블
CREATE TABLE public.user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('view', 'search', 'bookmark', 'unbookmark', 'click')),
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('tool', 'category')),
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 북마크 테이블
CREATE TABLE public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

-- 5. 구독 및 결제 정보 테이블
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 결제 내역 테이블
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- 원 단위 (4900원 = 4900)
  currency VARCHAR(3) DEFAULT 'KRW',
  payment_method VARCHAR(50),
  payment_key VARCHAR(200), -- 토스페이먼츠 결제 키
  order_id VARCHAR(100), -- 주문 ID
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 인덱스 생성 (성능 최적화)
-- ========================================

-- AI 도구 검색 최적화
CREATE INDEX idx_ai_tools_category ON public.ai_tools(category);
CREATE INDEX idx_ai_tools_pricing_type ON public.ai_tools(pricing_type);
CREATE INDEX idx_ai_tools_rating ON public.ai_tools(rating DESC);
CREATE INDEX idx_ai_tools_view_count ON public.ai_tools(view_count DESC);
CREATE INDEX idx_ai_tools_search_vector ON public.ai_tools USING gin(search_vector);

-- 사용자 활동 최적화
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX idx_user_activities_type ON public.user_activities(activity_type, target_type);

-- 북마크 최적화
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_tool_id ON public.bookmarks(tool_id);

-- ========================================
-- 트리거 및 함수 (자동화)
-- ========================================

-- 1. 검색 벡터 자동 업데이트
CREATE OR REPLACE FUNCTION update_ai_tools_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('korean', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('korean', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('korean', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_tools_search_vector
  BEFORE INSERT OR UPDATE ON public.ai_tools
  FOR EACH ROW EXECUTE FUNCTION update_ai_tools_search_vector();

-- 2. updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_tools_updated_at
  BEFORE UPDATE ON public.ai_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. 북마크 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_tools 
    SET bookmark_count = bookmark_count + 1 
    WHERE id = NEW.tool_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_tools 
    SET bookmark_count = bookmark_count - 1 
    WHERE id = OLD.tool_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bookmark_count
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_bookmark_count();

-- ========================================
-- Row Level Security (RLS) 설정
-- ========================================

-- 사용자 프로필 보안
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 북마크 보안
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- 사용자 활동 보안
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

-- AI 도구는 모든 사용자가 읽기 가능
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ai_tools" ON public.ai_tools
  FOR SELECT USING (true);

-- ========================================
-- 초기 데이터 삽입
-- ========================================

-- 카테고리별 샘플 AI 도구 데이터
INSERT INTO public.ai_tools (name, description, short_description, category, subcategory, website_url, logo_url, pricing_type, features, tags) VALUES
('ChatGPT', 'OpenAI에서 개발한 대화형 AI 모델로, 자연어 처리와 텍스트 생성에 특화되어 있습니다.', '가장 인기 있는 대화형 AI', '텍스트/언어', '대화형 AI', 'https://chat.openai.com', 'https://cdn.openai.com/API/logo-openai.svg', 'freemium', ARRAY['텍스트 생성', '대화', '코딩 도움', '번역'], ARRAY['AI', 'ChatGPT', 'OpenAI', '대화', '텍스트']),

('Midjourney', '텍스트 프롬프트를 통해 고품질 이미지를 생성하는 AI 도구입니다.', '텍스트로 이미지 생성', '이미지/비디오', '이미지 생성', 'https://midjourney.com', 'https://cdn.midjourney.com/logo.png', 'paid', ARRAY['이미지 생성', '아트웍 제작', '컨셉 아트'], ARRAY['AI', 'Midjourney', '이미지 생성', '아트']),

('Notion AI', 'Notion 워크스페이스에 통합된 AI 어시스턴트로 문서 작성과 정리를 도와줍니다.', 'Notion에 통합된 AI 어시스턴트', '생산성/업무', '문서 작성', 'https://notion.so', 'https://notion.so/images/logo-ios.png', 'freemium', ARRAY['문서 작성', '요약', '브레인스토밍'], ARRAY['AI', 'Notion', '생산성', '문서']),

('GitHub Copilot', 'AI 기반 코드 완성 도구로 개발자의 생산성을 향상시킵니다.', 'AI 코딩 어시스턴트', '개발/프로그래밍', '코드 생성', 'https://github.com/features/copilot', 'https://github.com/images/modules/site/copilot/copilot.png', 'paid', ARRAY['코드 완성', '함수 생성', '주석 생성'], ARRAY['AI', 'GitHub', '코딩', '개발']),

('Canva AI', 'AI를 활용한 디자인 도구로 로고, 포스터, 프레젠테이션을 쉽게 만들 수 있습니다.', 'AI 디자인 도구', '디자인/창작', '그래픽 디자인', 'https://canva.com', 'https://static.canva.com/web/images/12487a1e52a4401aba67c47db62b9c1c.svg', 'freemium', ARRAY['디자인 생성', '템플릿', '로고 제작'], ARRAY['AI', 'Canva', '디자인', '그래픽']);

-- 사용량 한도 설정 함수
CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier VARCHAR(20);
  current_usage INTEGER;
  monthly_limit INTEGER;
BEGIN
  SELECT subscription_tier, usage_count, 
         CASE subscription_tier
           WHEN 'free' THEN 10
           WHEN 'basic' THEN 1000
           WHEN 'pro' THEN -1
           ELSE 10
         END
  INTO user_tier, current_usage, monthly_limit
  FROM public.user_profiles 
  WHERE id = user_uuid;
  
  -- 프로 플랜은 무제한
  IF user_tier = 'pro' OR monthly_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- 사용량 체크
  RETURN current_usage < monthly_limit;
END;
$$ LANGUAGE plpgsql;

-- 사용량 증가 함수
CREATE OR REPLACE FUNCTION increment_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_profiles 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
