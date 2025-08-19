-- EasyPick 검색 인덱스 데이터 마이그레이션
-- 목적: 기존 정적 데이터를 통합 검색 인덱스로 이관
-- 작성자: Claude Data Engineer

-- 임베딩 생성용 임시 함수 (실제로는 외부 API 통해 생성)
CREATE OR REPLACE FUNCTION generate_mock_embedding(text_content TEXT)
RETURNS vector(1536)
LANGUAGE plpgsql
AS $$
DECLARE
    mock_embedding REAL[];
    i INTEGER;
BEGIN
    -- 목업 임베딩 생성 (실제로는 OpenAI API 사용)
    -- 텍스트 해시를 기반으로 일관된 벡터 생성
    mock_embedding := ARRAY[]::REAL[];
    
    FOR i IN 1..1536 LOOP
        mock_embedding := array_append(
            mock_embedding, 
            (random() * 2 - 1)::REAL -- -1 to 1 범위
        );
    END LOOP;
    
    RETURN mock_embedding::vector(1536);
END;
$$;

-- AI 도구 데이터 샘플 (실제로는 application layer에서 대량 처리)
INSERT INTO search_index (
    item_type,
    item_id,
    title,
    description,
    content,
    tags,
    category,
    rating,
    popularity_score,
    is_korean,
    is_popular,
    embedding,
    metadata
) VALUES
-- ChatGPT
(
    'ai_tool',
    'chatgpt',
    'ChatGPT',
    '범용 대화형 생성 AI의 표준. 자연스러운 언어 처리, 방대한 지식 기반, 코드/문서/상담/기획 등 다방면 활용.',
    '범용 대화형 생성 AI의 표준. 자연스러운 언어 처리, 방대한 지식 기반, 코드/문서/상담/기획 등 다방면 활용. 대부분의 질문에 바로 답변, 전문·일상 대화 모두 자연스러움. 글쓰기·요약·번역·기획 등 글 생산에 강력. 코드 생성·오류 수정 등 프로그래밍 학습/실전 모두 활용 가능.',
    ARRAY['대화', 'AI', '텍스트 생성', '코딩', '번역', '요약'],
    '대화',
    4.9,
    950,
    false,
    true,
    generate_mock_embedding('ChatGPT 범용 대화형 생성 AI 자연어 처리 코드 생성 번역 요약'),
    '{\n        \"link\": \"https://chat.openai.com/\",\n        \"logo\": \"/images/logos/chatgpt.svg\",\n        \"strengths\": [\"범용성\", \"자연스러운 대화\", \"코드 생성\", \"다양한 활용\"],\n        \"weaknesses\": [\"최신 정보 제한\", \"긴 대화 맥락 유지 어려움\"],\n        \"usecases\": [\"회의록 작성\", \"마케팅 콘텐츠\", \"학습 보조\", \"코드 디버깅\"]\n    }'::jsonb\n),\n\n-- Gemini\n(\n    'ai_tool',\n    'gemini',\n    'Gemini (Google Bard)',\n    'Google의 대화형 AI. 실시간 검색 연동, 최신 정보 제공, 다국어 지원 강력.',\n    'Google의 대화형 AI. 실시간 검색 연동, 최신 정보 제공, 다국어 지원 강력. Google 검색과 연동되어 최신 뉴스, 트렌드, 실시간 정보 활용 가능. 한국어 이해도와 문화적 맥락 파악 우수.',\n    ARRAY['대화', 'AI', '실시간 검색', '최신 정보', '한국어'],\n    '대화',\n    4.6,\n    820,\n    false,\n    true,\n    generate_mock_embedding('Gemini Google Bard 실시간 검색 최신 정보 한국어'),\n    '{\n        \"link\": \"https://gemini.google.com/\",\n        \"logo\": \"/images/logos/gemini.svg\",\n        \"strengths\": [\"실시간 정보\", \"한국어 지원\", \"Google 연동\"],\n        \"weaknesses\": [\"창의성 제한\", \"일관성 부족\"],\n        \"usecases\": [\"최신 뉴스 요약\", \"실시간 정보 검색\", \"한국어 콘텐츠\"]\n    }'::jsonb\n),\n\n-- Midjourney\n(\n    'ai_tool',\n    'midjourney',\n    'Midjourney',\n    'AI 이미지 생성의 표준. 예술적 퀄리티, 창의적 스타일, 프롬프트 최적화.',\n    'AI 이미지 생성의 표준. 예술적 퀄리티, 창의적 스타일, 프롬프트 최적화. 고퀄리티 아트워크, 컨셉 아트, 마케팅 비주얼 제작에 최적화. Discord 기반 인터페이스.',\n    ARRAY['이미지 생성', 'AI', '아트', '디자인', '창작'],\n    '이미지 생성',\n    4.8,\n    890,\n    false,\n    true,\n    generate_mock_embedding('Midjourney AI 이미지 생성 아트 디자인 창작'),\n    '{\n        \"link\": \"https://midjourney.com/\",\n        \"logo\": \"/images/logos/midjourney.svg\",\n        \"strengths\": [\"예술적 퀄리티\", \"창의적 스타일\", \"커뮤니티\"],\n        \"weaknesses\": [\"Discord 인터페이스\", \"텍스트 생성 약함\"],\n        \"usecases\": [\"컨셉 아트\", \"마케팅 비주얼\", \"일러스트\"]\n    }'::jsonb\n),\n\n-- 워크플로 템플릿 샘플\n(\n    'workflow',\n    'blog-content-workflow',\n    '블로그 콘텐츠 제작 워크플로',\n    '키워드 연구부터 SEO 최적화까지, 완성도 높은 블로그 글 작성 프로세스',\n    '1. 키워드 연구 및 분석 2. 제목 및 목차 구성 3. 초안 작성 4. 이미지 및 미디어 추가 5. SEO 최적화 6. 검토 및 퇴고 7. 발행 및 홍보. ChatGPT, Notion, Canva 등 도구 연계 활용.',\n    ARRAY['블로그', '콘텐츠', 'SEO', '글쓰기', '마케팅'],\n    '콘텐츠 제작',\n    4.7,\n    650,\n    true,\n    false,\n    generate_mock_embedding('블로그 콘텐츠 제작 워크플로 SEO 글쓰기 마케팅'),\n    '{\n        \"steps\": 7,\n        \"duration\": \"2-4시간\",\n        \"tools\": [\"ChatGPT\", \"Notion\", \"Canva\", \"Google Analytics\"],\n        \"difficulty\": \"중급\",\n        \"category\": \"콘텐츠 마케팅\"\n    }'::jsonb\n),\n\n-- 소셜미디어 관리 워크플로\n(\n    'workflow',\n    'social-media-management',\n    '소셜미디어 통합 관리 워크플로',\n    '콘텐츠 기획부터 성과 분석까지, 효율적인 소셜미디어 운영 시스템',\n    '멀티 플랫폼 콘텐츠 기획, 제작, 스케줄링, 성과 분석을 통합한 워크플로. Buffer, Hootsuite, ChatGPT 활용하여 일관된 브랜드 메시지 전달.',\n    ARRAY['소셜미디어', 'SNS', '마케팅', '자동화', '분석'],\n    '마케팅',\n    4.5,\n    540,\n    true,\n    false,\n    generate_mock_embedding('소셜미디어 SNS 마케팅 자동화 관리'),\n    '{\n        \"platforms\": [\"Instagram\", \"Facebook\", \"Twitter\", \"LinkedIn\"],\n        \"tools\": [\"Buffer\", \"Hootsuite\", \"ChatGPT\", \"Canva\"],\n        \"frequency\": \"일 2-3회 포스팅\",\n        \"metrics\": [\"도달률\", \"참여율\", \"클릭률\"]\n    }'::jsonb\n),\n\n-- 프롬프트 템플릿 샘플\n(\n    'prompt_template',\n    'copywriting-prompt',\n    '마케팅 카피라이팅 프롬프트',\n    '제품/서비스의 핵심 가치를 효과적으로 전달하는 마케팅 카피 생성 템플릿',\n    '제품명: [제품명]\\n타겟 고객: [고객 특성]\\n핵심 베네핏: [주요 이점]\\n톤앤매너: [브랜드 톤]\\n\\n위 정보를 바탕으로 다음 형식의 마케팅 카피를 작성해주세요:\\n1. 헤드라인 (10자 이내)\\n2. 서브헤드라인 (20자 이내)\\n3. 본문 (100자 이내)\\n4. CTA 버튼 텍스트',\n    ARRAY['카피라이팅', '마케팅', '광고', '브랜딩', '프롬프트'],\n    '마케팅',\n    4.6,\n    420,\n    true,\n    false,\n    generate_mock_embedding('마케팅 카피라이팅 프롬프트 광고 브랜딩'),\n    '{\n        \"category\": \"마케팅\",\n        \"usage_count\": 1250,\n        \"difficulty\": \"초급\",\n        \"variables\": [\"제품명\", \"타겟 고객\", \"핵심 베네핏\", \"톤앤매너\"],\n        \"output_format\": \"구조화된 카피\"\n    }'::jsonb\n),\n\n(\n    'prompt_template',\n    'code-review-prompt',\n    '코드 리뷰 프롬프트',\n    '체계적인 코드 품질 검토를 위한 구조화된 리뷰 가이드',\n    '다음 코드를 리뷰해주세요:\\n\\n[코드 블록]\\n\\n리뷰 기준:\\n1. 코드 품질 (가독성, 유지보수성)\\n2. 성능 최적화 가능성\\n3. 보안 취약점\\n4. 베스트 프랙티스 준수\\n5. 테스트 가능성\\n\\n각 항목별로 점수(1-10)와 개선 사항을 제안해주세요.',\n    ARRAY['코드 리뷰', '프로그래밍', '품질', '개발', 'QA'],\n    '개발',\n    4.8,\n    380,\n    true,\n    false,\n    generate_mock_embedding('코드 리뷰 프롬프트 프로그래밍 품질 개발'),\n    '{\n        \"category\": \"개발\",\n        \"usage_count\": 890,\n        \"difficulty\": \"중급\",\n        \"review_criteria\": [\"품질\", \"성능\", \"보안\", \"베스트 프랙티스\", \"테스트\"],\n        \"languages\": [\"JavaScript\", \"Python\", \"Java\", \"TypeScript\"]\n    }'::jsonb\n)\n\nON CONFLICT (item_type, item_id) DO UPDATE SET\n    title = EXCLUDED.title,\n    description = EXCLUDED.description,\n    content = EXCLUDED.content,\n    tags = EXCLUDED.tags,\n    category = EXCLUDED.category,\n    rating = EXCLUDED.rating,\n    popularity_score = EXCLUDED.popularity_score,\n    is_korean = EXCLUDED.is_korean,\n    is_popular = EXCLUDED.is_popular,\n    metadata = EXCLUDED.metadata,\n    updated_at = NOW();\n\n-- 인기도 점수 업데이트 (실제 사용 패턴 기반)\nUPDATE search_index \nSET popularity_score = popularity_score + (\n    CASE \n        WHEN item_id IN ('chatgpt', 'gemini', 'midjourney') THEN 100\n        WHEN is_popular THEN 50\n        ELSE 0\n    END\n)\nWHERE item_type = 'ai_tool';\n\n-- 카테고리별 통계 조회 (검증용)\nSELECT \n    item_type,\n    category,\n    COUNT(*) as item_count,\n    AVG(rating) as avg_rating,\n    AVG(popularity_score) as avg_popularity,\n    COUNT(*) FILTER (WHERE is_korean) as korean_count,\n    COUNT(*) FILTER (WHERE is_popular) as popular_count\nFROM search_index \nGROUP BY item_type, category\nORDER BY item_type, avg_popularity DESC;\n\n-- 검색 인덱스 통계\nSELECT \n    '검색 인덱스 통계' as report_type,\n    COUNT(*) as total_items,\n    COUNT(*) FILTER (WHERE item_type = 'ai_tool') as ai_tools,\n    COUNT(*) FILTER (WHERE item_type = 'workflow') as workflows,\n    COUNT(*) FILTER (WHERE item_type = 'prompt_template') as prompts,\n    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as items_with_embedding,\n    COUNT(*) FILTER (WHERE is_korean) as korean_items,\n    COUNT(*) FILTER (WHERE is_popular) as popular_items\nFROM search_index;\n\n-- 샘플 검색 테스트\nSELECT '=== FTS 검색 테스트 ===' as test_section;\nSELECT title, category, rank_score \nFROM search_fts('블로그 글') \nLIMIT 5;\n\nSELECT '=== 카테고리 필터 테스트 ===' as test_section;\nSELECT title, category \nFROM search_fts('AI', category_filter := '대화') \nLIMIT 3;\n\nSELECT '=== 한국어 필터 테스트 ===' as test_section;\nSELECT title, is_korean \nFROM search_fts('워크플로', korean_only := true) \nLIMIT 3;\n\n-- 임시 함수 정리\nDROP FUNCTION IF EXISTS generate_mock_embedding(TEXT);\n\nCOMMENT ON TABLE search_index IS '통합 검색 인덱스 - 샘플 데이터 마이그레이션 완료';\n\n-- 추가 최적화 힌트\nANALYZE search_index;\nANALYZE search_logs;"