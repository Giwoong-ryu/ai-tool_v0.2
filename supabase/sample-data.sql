-- ========================================
-- EasyPick Sample Data Insertion Script
-- 테스트 및 개발용 샘플 데이터
-- ========================================

-- ========================================
-- 주의사항 / IMPORTANT NOTICE
-- ========================================

/*
이 스크립트는 개발 및 테스트 환경에서만 사용하세요.
프로덕션 환경에서는 실행하지 마세요.

This script should only be used in development and testing environments.
DO NOT run this in production.
*/

-- ========================================
-- 환경 확인 / Environment Check
-- ========================================

DO $$
BEGIN
    -- 프로덕션 환경 체크
    IF current_setting('server_version_num')::integer >= 140000 
       AND current_database() = 'postgres' THEN
        RAISE EXCEPTION 'This appears to be a production environment. Sample data insertion aborted.';
    END IF;
    
    RAISE NOTICE 'Inserting sample data for EasyPick development environment...';
END
$$;

-- ========================================
-- 1. SUBSCRIPTION PLANS (구독 플랜)
-- ========================================

INSERT INTO public.subscription_plans (
    id, name, name_ko, description, price_monthly, price_yearly, 
    currency, limits, features, is_active, sort_order
) VALUES 
(
    'free',
    'Free',
    '무료',
    'Get started with basic features',
    0,
    0,
    'KRW',
    '{
        "monthly_compile_prompt": 10,
        "monthly_run_workflow": 5,
        "monthly_api_call": 100,
        "monthly_export_data": 3,
        "monthly_ai_generation": 20,
        "monthly_search_query": -1,
        "storage_mb": 100
    }',
    '["기본 AI 도구 접근", "월 10개 프롬프트", "월 5개 워크플로", "커뮤니티 지원"]',
    true,
    1
),
(
    'pro',
    'Pro',
    '프로',
    'Perfect for professionals and power users',
    29000,
    290000,
    'KRW',
    '{
        "monthly_compile_prompt": 500,
        "monthly_run_workflow": 100,
        "monthly_api_call": 5000,
        "monthly_export_data": 50,
        "monthly_ai_generation": 1000,
        "monthly_search_query": -1,
        "storage_mb": 5000
    }',
    '["모든 AI 도구 접근", "월 500개 프롬프트", "월 100개 워크플로", "우선 지원", "고급 분석"]',
    true,
    2
),
(
    'enterprise',
    'Enterprise',
    '엔터프라이즈',
    'For teams and organizations',
    99000,
    990000,
    'KRW',
    '{
        "monthly_compile_prompt": -1,
        "monthly_run_workflow": -1,
        "monthly_api_call": -1,
        "monthly_export_data": -1,
        "monthly_ai_generation": -1,
        "monthly_search_query": -1,
        "storage_mb": 50000
    }',
    '["무제한 사용", "팀 협업 기능", "전담 지원", "맞춤 개발", "온프레미스 옵션"]',
    true,
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    limits = EXCLUDED.limits,
    updated_at = NOW();

-- ========================================
-- 2. CLERK PROFILES (사용자 프로필)
-- ========================================

-- 테스트 사용자 생성 (실제 auth.users와 연동하지 않는 mock 데이터)
INSERT INTO public.clerk_profiles (
    id, email, full_name, first_name, last_name, 
    plan, role, metadata, preferences, created_at
) VALUES 
(
    gen_random_uuid(),
    'admin@easypick.ai',
    '관리자',
    '관리',
    '자',
    'enterprise',
    'admin',
    '{"department": "engineering", "location": "Seoul"}',
    '{"language": "ko", "theme": "dark", "notifications": true}',
    NOW() - INTERVAL '30 days'
),
(
    gen_random_uuid(),
    'user1@example.com',
    '김철수',
    '철수',
    '김',
    'pro',
    'user',
    '{"department": "marketing", "location": "Seoul"}',
    '{"language": "ko", "theme": "light", "notifications": true}',
    NOW() - INTERVAL '15 days'
),
(
    gen_random_uuid(),
    'user2@example.com',
    '이영희',
    '영희',
    '이',
    'free',
    'user',
    '{"department": "sales", "location": "Busan"}',
    '{"language": "ko", "theme": "system", "notifications": false}',
    NOW() - INTERVAL '7 days'
),
(
    gen_random_uuid(),
    'user3@example.com',
    'John Smith',
    'John',
    'Smith',
    'pro',
    'user',
    '{"department": "design", "location": "Seoul"}',
    '{"language": "en", "theme": "light", "notifications": true}',
    NOW() - INTERVAL '3 days'
)
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 3. PROMPT TEMPLATES (프롬프트 템플릿)
-- ========================================

INSERT INTO public.prompt_templates (
    slug, name, category, description, icon, template_content, 
    schema_definition, options, default_values, metadata, 
    is_public, is_featured, created_by
) VALUES 
(
    'blog_post_writer',
    '블로그 포스트 작성',
    '콘텐츠 제작',
    'SEO 최적화된 블로그 포스트를 작성하는 프롬프트',
    '📝',
    '{{target_audience}}을 위한 "{{topic}}"에 대한 {{length}} 블로그 포스트를 작성해주세요.

## 요구사항
- SEO 키워드: {{seo_keywords}}
- 톤: {{tone}}
- 구조: 서론, 본론(3-5개 섹션), 결론
- 실용적인 팁과 예시 포함

## 추가 지침
{{#if include_cta}}
- 마지막에 명확한 CTA(Call-to-Action) 포함
{{/if}}
{{#if target_seo}}
- 메타 디스크립션도 함께 작성
{{/if}}',
    '{
        "type": "object",
        "properties": {
            "topic": {"type": "string", "description": "블로그 포스트 주제"},
            "target_audience": {"type": "string", "description": "목표 독자층"},
            "length": {"type": "string", "description": "글 길이"},
            "seo_keywords": {"type": "string", "description": "SEO 키워드"},
            "tone": {"type": "string", "description": "글의 톤"},
            "include_cta": {"type": "boolean", "description": "CTA 포함 여부"},
            "target_seo": {"type": "boolean", "description": "SEO 최적화 여부"}
        },
        "required": ["topic", "target_audience", "length", "tone"]
    }',
    '[
        {
            "key": "topic",
            "label": "주제",
            "type": "text",
            "placeholder": "예: 인공지능 마케팅 트렌드",
            "required": true
        },
        {
            "key": "target_audience",
            "label": "목표 독자",
            "type": "select",
            "options": ["마케터", "개발자", "디자이너", "경영진", "학생", "일반인"],
            "required": true
        },
        {
            "key": "length",
            "label": "글 길이",
            "type": "select",
            "options": ["짧게 (500-800자)", "보통 (1000-1500자)", "길게 (2000-3000자)", "아주 길게 (3000자 이상)"],
            "required": true
        },
        {
            "key": "seo_keywords",
            "label": "SEO 키워드",
            "type": "text",
            "placeholder": "쉼표로 구분된 키워드들",
            "required": false
        },
        {
            "key": "tone",
            "label": "글의 톤",
            "type": "select",
            "options": ["전문적이고 격식있게", "친근하고 대화체로", "유머러스하고 재치있게", "간결하고 직설적으로"],
            "required": true
        },
        {
            "key": "include_cta",
            "label": "CTA 포함",
            "type": "checkbox",
            "required": false
        },
        {
            "key": "target_seo",
            "label": "SEO 최적화",
            "type": "checkbox",
            "required": false
        }
    ]',
    '{
        "target_audience": "마케터",
        "length": "보통 (1000-1500자)",
        "tone": "전문적이고 격식있게",
        "include_cta": false,
        "target_seo": true
    }',
    '{
        "author": "EasyPick",
        "tags": ["블로그", "콘텐츠", "SEO", "마케팅"],
        "difficulty": "beginner",
        "estimated_time": "5-10분"
    }',
    true,
    true,
    (SELECT id FROM public.clerk_profiles WHERE role = 'admin' LIMIT 1)
),
(
    'product_description',
    '제품 설명 작성',
    '이커머스',
    '매력적인 제품 설명을 작성하는 프롬프트',
    '🛍️',
    '{{product_name}}에 대한 매력적인 제품 설명을 {{target_length}}으로 작성해주세요.

## 제품 정보
- 브랜드: {{brand}}
- 카테고리: {{category}}
- 주요 특징: {{key_features}}
- 타겟 고객: {{target_customer}}

## 작성 요구사항
- 감정적 호소력이 있는 {{writing_style}} 스타일
- {{#each benefits}}
- {{this}}의 장점 강조
{{/each}}
- 구매 욕구를 자극하는 표현 사용
- SEO를 위한 자연스러운 키워드 포함',
    '{
        "type": "object",
        "properties": {
            "product_name": {"type": "string", "description": "제품명"},
            "brand": {"type": "string", "description": "브랜드명"},
            "category": {"type": "string", "description": "제품 카테고리"},
            "key_features": {"type": "string", "description": "주요 특징"},
            "target_customer": {"type": "string", "description": "타겟 고객"},
            "target_length": {"type": "string", "description": "설명 길이"},
            "writing_style": {"type": "string", "description": "작성 스타일"},
            "benefits": {"type": "array", "description": "강조할 장점들"}
        },
        "required": ["product_name", "category", "target_length", "writing_style"]
    }',
    '[
        {
            "key": "product_name",
            "label": "제품명",
            "type": "text",
            "required": true
        },
        {
            "key": "brand",
            "label": "브랜드명",
            "type": "text",
            "required": false
        },
        {
            "key": "category",
            "label": "제품 카테고리",
            "type": "select",
            "options": ["패션", "전자제품", "홈&리빙", "뷰티", "식품", "스포츠", "도서", "기타"],
            "required": true
        },
        {
            "key": "key_features",
            "label": "주요 특징",
            "type": "textarea",
            "placeholder": "제품의 핵심 기능이나 특징들을 나열해주세요",
            "required": false
        },
        {
            "key": "target_customer",
            "label": "타겟 고객",
            "type": "text",
            "placeholder": "예: 20-30대 여성, 직장인 남성",
            "required": false
        },
        {
            "key": "target_length",
            "label": "설명 길이",
            "type": "select",
            "options": ["간단하게 (100-200자)", "상세하게 (300-500자)", "매우 상세하게 (500자 이상)"],
            "required": true
        },
        {
            "key": "writing_style",
            "label": "작성 스타일",
            "type": "select",
            "options": ["친근하고 대화체", "전문적이고 신뢰감 있게", "트렌디하고 감성적으로", "간결하고 직접적으로"],
            "required": true
        }
    ]',
    '{
        "category": "패션",
        "target_length": "상세하게 (300-500자)",
        "writing_style": "친근하고 대화체"
    }',
    '{
        "author": "EasyPick",
        "tags": ["제품설명", "이커머스", "마케팅", "판매"],
        "difficulty": "beginner",
        "estimated_time": "3-5분"
    }',
    true,
    true,
    (SELECT id FROM public.clerk_profiles WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (slug, version) DO NOTHING;

-- ========================================
-- 4. SEARCH INDEX (검색 인덱스)
-- ========================================

INSERT INTO public.search_index (
    item_type, item_id, title, description, content, tags, category,
    rating, popularity_score, is_korean, is_popular, metadata
) VALUES 
(
    'ai_tool',
    'chatgpt',
    'ChatGPT',
    '대화형 AI 어시스턴트로 다양한 질문과 작업을 도와드립니다',
    'OpenAI에서 개발한 대화형 AI 모델입니다. 텍스트 생성, 번역, 요약, 코딩 지원 등 다양한 작업을 수행할 수 있습니다. 자연스러운 대화를 통해 사용자의 질문에 답변하고 창작 활동을 지원합니다.',
    ARRAY['AI', '대화', 'OpenAI', '텍스트생성'],
    'AI 어시스턴트',
    4.5,
    1250,
    true,
    true,
    '{"provider": "OpenAI", "pricing": "freemium", "api_available": true}'
),
(
    'ai_tool',
    'midjourney',
    'Midjourney',
    'AI 이미지 생성 도구로 텍스트 프롬프트를 통해 예술적인 이미지를 생성합니다',
    'Discord 기반의 AI 이미지 생성 서비스입니다. 간단한 텍스트 설명만으로 고품질의 예술적인 이미지를 생성할 수 있습니다. 다양한 스타일과 아트워크 생성이 가능하며, 상업적 이용도 지원합니다.',
    ARRAY['AI', '이미지생성', '아트', 'Discord'],
    'AI 이미지',
    4.3,
    980,
    true,
    true,
    '{"provider": "Midjourney", "pricing": "paid", "platform": "discord"}'
),
(
    'workflow',
    'blog_writing_process',
    '블로그 작성 워크플로우',
    '체계적인 블로그 포스트 작성을 위한 단계별 가이드',
    '성공적인 블로그 포스트 작성을 위한 완전한 워크플로우입니다. 주제 선정부터 SEO 최적화, 게시까지의 모든 단계를 포함합니다. 키워드 리서치, 구조화된 글쓰기, 이미지 선정, 편집 및 교정 과정을 체계적으로 안내합니다.',
    ARRAY['블로그', '콘텐츠', 'SEO', '마케팅'],
    '콘텐츠 제작',
    4.2,
    650,
    true,
    false,
    '{"steps": 8, "estimated_time": "2-3시간", "difficulty": "intermediate"}'
),
(
    'prompt_template',
    'email_marketing',
    '이메일 마케팅 템플릿',
    '효과적인 마케팅 이메일 작성을 위한 프롬프트 템플릿',
    '높은 오픈율과 클릭률을 달성하기 위한 이메일 마케팅 템플릿입니다. 제목 라인 최적화, 개인화된 내용, 명확한 CTA를 포함한 완전한 이메일 구조를 제공합니다. A/B 테스트를 위한 다양한 변형도 생성할 수 있습니다.',
    ARRAY['이메일', '마케팅', 'CTA', '개인화'],
    '마케팅',
    4.0,
    420,
    true,
    false,
    '{"category": "marketing", "use_cases": ["newsletter", "promotion", "welcome"], "personalization": true}'
)
ON CONFLICT (item_type, item_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    popularity_score = EXCLUDED.popularity_score,
    updated_at = NOW();

-- ========================================
-- 5. SAMPLE USAGE EVENTS (사용량 이벤트)
-- ========================================

-- 최근 30일간의 샘플 사용량 데이터 생성
WITH sample_users AS (
    SELECT id, plan FROM public.clerk_profiles WHERE role = 'user'
),
date_series AS (
    SELECT generate_series(
        NOW() - INTERVAL '30 days',
        NOW(),
        INTERVAL '1 day'
    )::date AS event_date
),
sample_events AS (
    SELECT 
        su.id AS user_id,
        ds.event_date::timestamp with time zone + 
        (random() * INTERVAL '24 hours') AS created_at,
        (ARRAY['compile_prompt', 'run_workflow', 'api_call', 'search_query', 'ai_generation'])[
            floor(random() * 5 + 1)
        ]::usage_event_type AS event_type,
        floor(random() * 5 + 1)::integer AS count,
        su.plan
    FROM sample_users su
    CROSS JOIN date_series ds
    WHERE random() < 0.3  -- 30% 확률로 해당 날짜에 이벤트 발생
)
INSERT INTO public.clerk_usage_events (
    user_id, event_type, count, billing_period_start, metadata, created_at
)
SELECT 
    se.user_id,
    se.event_type,
    se.count,
    date_trunc('month', se.created_at),
    jsonb_build_object(
        'plan', se.plan,
        'sample_data', true
    ),
    se.created_at
FROM sample_events se
ON CONFLICT DO NOTHING;

-- ========================================
-- 6. SEARCH LOGS (검색 로그)
-- ========================================

WITH sample_searches AS (
    SELECT 
        (SELECT id FROM public.clerk_profiles ORDER BY random() LIMIT 1) AS user_id,
        unnest(ARRAY[
            'ChatGPT 사용법',
            '블로그 글쓰기',
            'AI 이미지 생성',
            '마케팅 자동화',
            '프롬프트 엔지니어링',
            '콘텐츠 제작',
            'SEO 최적화',
            '이메일 마케팅'
        ]) AS query,
        generate_series(
            NOW() - INTERVAL '7 days',
            NOW(),
            INTERVAL '2 hours'
        ) AS created_at
),
search_results AS (
    SELECT 
        ss.*,
        (random() * 10 + 3)::integer AS results_count,
        CASE WHEN random() < 0.4 THEN 
            (ARRAY['ai_tool', 'workflow', 'prompt_template'])[floor(random() * 3 + 1)]
        ELSE NULL END AS clicked_item_type,
        CASE WHEN random() < 0.4 THEN 
            'item_' || floor(random() * 100 + 1)::text
        ELSE NULL END AS clicked_item_id,
        CASE WHEN random() < 0.4 THEN 
            floor(random() * 5 + 1)::integer
        ELSE NULL END AS click_position,
        (random() * 30000 + 1000)::integer AS search_time_ms,
        CASE WHEN random() < 0.4 THEN
            (random() * 120000 + 5000)::integer
        ELSE NULL END AS dwell_time_ms
    FROM sample_searches ss
    WHERE random() < 0.1  -- 10% 확률로 검색 발생
)
INSERT INTO public.search_logs (
    user_id, session_id, query, query_type, results_count,
    clicked_item_type, clicked_item_id, click_position,
    search_time_ms, dwell_time_ms, filters, created_at
)
SELECT 
    sr.user_id,
    'session_' || substr(md5(random()::text), 0, 16),
    sr.query,
    'unified',
    sr.results_count,
    sr.clicked_item_type,
    sr.clicked_item_id,
    sr.click_position,
    sr.search_time_ms,
    sr.dwell_time_ms,
    '{}',
    sr.created_at
FROM search_results sr;

-- ========================================
-- 7. WORKFLOW RUNS (워크플로우 실행)
-- ========================================

WITH sample_workflows AS (
    SELECT 
        (SELECT id FROM public.clerk_profiles WHERE role = 'user' ORDER BY random() LIMIT 1) AS user_id,
        'blog_writing_process' AS workflow_id,
        '새로운 블로그 포스트: ' || 
        (ARRAY['AI 트렌드', '마케팅 전략', '콘텐츠 최적화', '브랜드 스토리텔링'])[
            floor(random() * 4 + 1)
        ] AS title,
        (ARRAY['draft', 'running', 'completed', 'paused'])[
            floor(random() * 4 + 1)
        ]::text AS status,
        floor(random() * 100)::integer AS progress,
        generate_series(
            NOW() - INTERVAL '14 days',
            NOW() - INTERVAL '1 day',
            INTERVAL '1 day'
        ) AS created_at
)
INSERT INTO public.workflow_runs (
    user_id, workflow_id, title, description, status, progress,
    total_steps, completed_steps, created_at, started_at
)
SELECT 
    sw.user_id,
    sw.workflow_id,
    sw.title,
    '체계적인 블로그 작성 프로세스를 따라 진행 중입니다.',
    sw.status,
    sw.progress,
    8, -- 총 8단계
    CASE 
        WHEN sw.status = 'completed' THEN 8
        WHEN sw.status = 'running' THEN floor(sw.progress / 100.0 * 8)
        WHEN sw.status = 'paused' THEN floor(sw.progress / 100.0 * 8)
        ELSE 0
    END,
    sw.created_at,
    CASE 
        WHEN sw.status != 'draft' THEN sw.created_at + INTERVAL '10 minutes'
        ELSE NULL
    END
FROM sample_workflows sw
WHERE random() < 0.4;  -- 40% 확률로 워크플로우 생성

-- ========================================
-- 완료 메시지 / Completion Message
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ EasyPick 샘플 데이터 삽입이 완료되었습니다!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 생성된 데이터:';
    RAISE NOTICE '- 구독 플랜: % 개', (SELECT count(*) FROM public.subscription_plans);
    RAISE NOTICE '- 사용자 프로필: % 개', (SELECT count(*) FROM public.clerk_profiles);
    RAISE NOTICE '- 프롬프트 템플릿: % 개', (SELECT count(*) FROM public.prompt_templates);
    RAISE NOTICE '- 검색 인덱스: % 개', (SELECT count(*) FROM public.search_index);
    RAISE NOTICE '- 사용량 이벤트: % 개', (SELECT count(*) FROM public.clerk_usage_events WHERE metadata->>'sample_data' = 'true');
    RAISE NOTICE '- 검색 로그: % 개', (SELECT count(*) FROM public.search_logs);
    RAISE NOTICE '- 워크플로우 실행: % 개', (SELECT count(*) FROM public.workflow_runs);
    RAISE NOTICE '';
    RAISE NOTICE '🔧 개발 환경에서 이제 다음 기능들을 테스트할 수 있습니다:';
    RAISE NOTICE '• 사용자 가입 및 플랜 관리';
    RAISE NOTICE '• 프롬프트 템플릿 사용';
    RAISE NOTICE '• AI 검색 및 추천';
    RAISE NOTICE '• 워크플로우 실행';
    RAISE NOTICE '• 사용량 추적 및 분석';
    RAISE NOTICE '';
END
$$;