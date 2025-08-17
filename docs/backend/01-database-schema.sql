-- =====================================================
-- Search V2 Database Schema: FTS + pgvector 2단계 검색
-- =====================================================
-- 
-- 설계 원칙:
-- 1. Full-Text Search (tsvector/gin) → 1차 필터링 (빠른 텍스트 매칭)
-- 2. pgvector HNSW → 2차 재정렬 (의미적 유사도 기반)
-- 3. PostgreSQL 14+ 권장 (generated column, vector extension)
--
-- 성능 목표: 전체 쿼리 150-300ms 내 완료
-- =====================================================

-- pgvector 확장 설치 (관리자 권한 필요)
CREATE EXTENSION IF NOT EXISTS vector;

-- UUID 확장 (gen_random_uuid 사용)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 메인 AI 아이템 테이블
-- =====================================================

CREATE TABLE ai_items (
    -- 기본 메타데이터
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('tool', 'template', 'workflow')),
    title TEXT NOT NULL,
    summary TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- 확장 데이터 (JSON 형태로 유연하게 저장)
    body JSONB DEFAULT '{}',
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 검색 최적화를 위한 제약조건
    CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
    CONSTRAINT summary_length CHECK (char_length(summary) <= 1000),
    CONSTRAINT tags_count CHECK (array_length(tags, 1) <= 20)
);

-- =====================================================
-- 2. Full-Text Search 설정
-- =====================================================

-- tsvector 컬럼 추가 (Generated Column - PostgreSQL 12+)
ALTER TABLE ai_items ADD COLUMN tsv tsvector
    GENERATED ALWAYS AS (
        to_tsvector('simple',
            COALESCE(title, '') || ' ' ||
            COALESCE(summary, '') || ' ' ||
            array_to_string(COALESCE(tags, '{}'), ' ')
        )
    ) STORED;

-- GIN 인덱스 생성 (Full-Text Search 성능 최적화)
CREATE INDEX ai_items_tsv_gin ON ai_items USING gin(tsv);

-- 텍스트 검색 성능을 위한 추가 인덱스
CREATE INDEX ai_items_type_idx ON ai_items(type);
CREATE INDEX ai_items_created_at_idx ON ai_items(created_at DESC);

-- =====================================================
-- 3. pgvector 임베딩 설정  
-- =====================================================

-- OpenAI text-embedding-ada-002 기준 1536차원
-- 다른 모델 사용 시 차원 수 조정 필요
ALTER TABLE ai_items ADD COLUMN embedding vector(1536);

-- HNSW 인덱스 생성 (코사인 유사도 기반)
-- 주의: 데이터가 많을 때 인덱스 빌드 시간이 오래 걸림
CREATE INDEX ai_items_emb_hnsw ON ai_items
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 임베딩 관련 메타데이터
ALTER TABLE ai_items ADD COLUMN embedding_model TEXT DEFAULT 'text-embedding-ada-002';
ALTER TABLE ai_items ADD COLUMN embedding_updated_at TIMESTAMPTZ;

-- =====================================================
-- 4. 샘플 데이터 삽입
-- =====================================================

INSERT INTO ai_items (type, title, summary, tags, body) VALUES
-- 도구 (tool)
('tool', 'ChatGPT', 'OpenAI의 대화형 AI 어시스턴트', 
 ARRAY['ai', 'chatbot', 'openai', 'gpt'], 
 '{"category": "대화형 AI", "pricing": "freemium", "features": ["대화", "코딩", "창작"]}'
),
('tool', 'Midjourney', 'AI 기반 이미지 생성 도구', 
 ARRAY['ai', 'image', 'generation', 'creative'], 
 '{"category": "이미지 생성", "pricing": "subscription", "features": ["이미지 생성", "아트", "디자인"]}'
),
('tool', 'GitHub Copilot', 'AI 코딩 어시스턴트', 
 ARRAY['ai', 'coding', 'github', 'programming'], 
 '{"category": "개발 도구", "pricing": "subscription", "features": ["코드 완성", "코드 생성", "리팩토링"]}'
),

-- 템플릿 (template)
('template', '블로그 글 초안 만들기', 'SEO 최적화된 블로그 글 구조 생성', 
 ARRAY['blog', 'writing', 'seo', 'content'], 
 '{"fields": [{"name": "주제", "type": "text"}, {"name": "키워드", "type": "text"}, {"name": "톤", "type": "select"}]}'
),
('template', 'PPT 목차 생성', '논리적인 프레젠테이션 목차 자동 생성', 
 ARRAY['presentation', 'ppt', 'outline', 'structure'], 
 '{"fields": [{"name": "주제", "type": "text"}, {"name": "발표시간", "type": "number"}, {"name": "청중", "type": "text"}]}'
),
('template', '이메일 템플릿 생성', '목적별 전문 이메일 템플릿', 
 ARRAY['email', 'business', 'communication', 'template'], 
 '{"fields": [{"name": "목적", "type": "select"}, {"name": "수신자", "type": "text"}, {"name": "톤", "type": "select"}]}'
),

-- 워크플로우 (workflow)
('workflow', '프롬프트 정리', '복잡한 프롬프트 구조화 및 최적화', 
 ARRAY['prompt', 'optimization', 'structure', 'ai'], 
 '{"steps": ["분석", "구조화", "최적화", "검증"], "tools": ["ChatGPT", "Claude"]}'
),
('workflow', '콘텐츠 전략 수립', '브랜드 콘텐츠 전략 및 캘린더 수립', 
 ARRAY['content', 'strategy', 'marketing', 'planning'], 
 '{"steps": ["분석", "기획", "제작", "배포"], "duration": "2-4주"}'
),
('workflow', '코드 리뷰 가이드', '효과적인 코드 리뷰 프로세스', 
 ARRAY['code-review', 'development', 'quality', 'process'], 
 '{"steps": ["준비", "리뷰", "피드백", "개선"], "tools": ["GitHub", "GitLab"]}'
);

-- =====================================================
-- 5. 업데이트 트리거 함수
-- =====================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER update_ai_items_updated_at
    BEFORE UPDATE ON ai_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. 검색 성능 최적화 설정
-- =====================================================

-- PostgreSQL 설정 최적화 (postgresql.conf)
-- shared_preload_libraries = 'vector'
-- max_parallel_workers_per_gather = 2
-- work_mem = '256MB'
-- effective_cache_size = '4GB'

-- 통계 정보 업데이트
ANALYZE ai_items;

-- =====================================================
-- 7. 유용한 뷰 및 함수
-- =====================================================

-- 검색 통계 뷰
CREATE OR REPLACE VIEW search_stats AS
SELECT 
    type,
    COUNT(*) as total_items,
    COUNT(embedding) as items_with_embedding,
    AVG(char_length(title)) as avg_title_length,
    AVG(char_length(summary)) as avg_summary_length,
    AVG(array_length(tags, 1)) as avg_tags_count
FROM ai_items 
GROUP BY type;

-- 임베딩 진행률 함수
CREATE OR REPLACE FUNCTION embedding_progress()
RETURNS TABLE(
    total_items BIGINT,
    embedded_items BIGINT,
    progress_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_items,
        COUNT(embedding)::BIGINT as embedded_items,
        ROUND(COUNT(embedding) * 100.0 / COUNT(*), 2) as progress_percent
    FROM ai_items;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. 인덱스 성능 모니터링 쿼리
-- =====================================================

-- 인덱스 사용률 확인
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'ai_items'
ORDER BY idx_scan DESC;
*/

-- 테이블 크기 확인
/*
SELECT 
    pg_size_pretty(pg_total_relation_size('ai_items')) as total_size,
    pg_size_pretty(pg_relation_size('ai_items')) as table_size,
    pg_size_pretty(pg_total_relation_size('ai_items') - pg_relation_size('ai_items')) as index_size;
*/

-- =====================================================
-- 9. 백업 및 마이그레이션 가이드
-- =====================================================

-- 백업 (임베딩 제외)
/*
pg_dump -h localhost -U username -d database_name \
  --exclude-table-data=ai_items \
  --schema-only > schema_backup.sql

-- 데이터만 백업 (임베딩 컬럼 제외)
COPY (
    SELECT id, type, title, summary, tags, body, created_at, updated_at
    FROM ai_items
) TO '/path/to/data_backup.csv' WITH CSV HEADER;
*/

-- 마이그레이션 시 임베딩 재생성 필요
/*
UPDATE ai_items SET embedding = NULL, embedding_updated_at = NULL;
-- 이후 임베딩 배치 작업 실행
*/

-- =====================================================
-- 사용 예시 및 성능 테스트 쿼리는 별도 파일 참조:
-- - 02-search-queries.sql (검색 쿼리 예시)
-- - 03-performance-test.sql (성능 테스트)
-- =====================================================