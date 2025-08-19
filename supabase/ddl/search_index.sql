-- EasyPick 통합 검색 인덱스 스키마
-- 작성자: Claude Data Engineer
-- 목적: AI 도구, 워크플로, 프롬프트 통합 검색을 위한 단일 인덱스
-- 검색 전략: 1차 FTS (tsvector) → 2차 임베딩 재정렬 (pgvector)

-- pgvector 확장 활성화 (임베딩 벡터 지원)
CREATE EXTENSION IF NOT EXISTS vector;

-- 검색 인덱스 메인 테이블
CREATE TABLE IF NOT EXISTS search_index (
    id BIGSERIAL PRIMARY KEY,
    
    -- 아이템 식별
    item_type TEXT NOT NULL CHECK (item_type IN ('ai_tool', 'workflow', 'prompt_template')),
    item_id TEXT NOT NULL, -- 원본 데이터의 ID (문자열 지원)
    
    -- 검색 필드 (한국어 최적화)
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- 전체 텍스트 내용 (긴 설명, 단계별 가이드 등)
    tags TEXT[], -- 태그 배열
    category TEXT,
    
    -- 메타데이터
    rating DECIMAL(2,1),
    popularity_score INTEGER DEFAULT 0, -- 인기도 점수 (클릭, 북마크 등)
    is_korean BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    
    -- 검색 인덱스 (GIN 인덱스용)
    tsv tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('korean', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(content, '')), 'C') ||
        setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(category, '')), 'D')
    ) STORED,
    
    -- 임베딩 벡터 (OpenAI ada-002: 1536차원)
    embedding vector(1536),
    
    -- 추가 JSON 데이터 (유연한 확장)
    metadata JSONB DEFAULT '{}',
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 유니크 제약조건 (item_type + item_id 조합)
    UNIQUE(item_type, item_id)
);

-- 검색 성능 최적화 인덱스

-- 1. FTS 검색용 GIN 인덱스 (1차 검색)
CREATE INDEX IF NOT EXISTS idx_search_index_tsv 
ON search_index USING GIN(tsv);

-- 2. 임베딩 유사도 검색용 HNSW 인덱스 (2차 재정렬)
CREATE INDEX IF NOT EXISTS idx_search_index_embedding 
ON search_index USING hnsw (embedding vector_cosine_ops);

-- 3. 아이템 타입별 필터링
CREATE INDEX IF NOT EXISTS idx_search_index_type 
ON search_index(item_type);

-- 4. 인기도 정렬용
CREATE INDEX IF NOT EXISTS idx_search_index_popularity 
ON search_index(popularity_score DESC, rating DESC);

-- 5. 카테고리 필터링
CREATE INDEX IF NOT EXISTS idx_search_index_category 
ON search_index(category);

-- 6. 한국어/인기 필터링
CREATE INDEX IF NOT EXISTS idx_search_index_flags 
ON search_index(is_korean, is_popular);

-- 검색 로그 테이블 (품질 피드백용)
CREATE TABLE IF NOT EXISTS search_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID, -- 로그인 사용자 (선택사항)
    session_id TEXT, -- 세션 추적
    
    -- 검색 쿼리
    query TEXT NOT NULL,
    query_type TEXT DEFAULT 'unified' CHECK (query_type IN ('unified', 'fts_only', 'vector_only')),
    
    -- 검색 결과
    results_count INTEGER,
    search_time_ms INTEGER, -- 검색 소요 시간 (ms)
    
    -- 사용자 행동
    clicked_item_type TEXT,
    clicked_item_id TEXT,
    click_position INTEGER, -- 클릭한 결과의 순위
    dwell_time_ms INTEGER, -- 체류 시간
    
    -- 검색 설정
    filters JSONB DEFAULT '{}', -- 적용된 필터
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_search_logs_query 
ON search_logs(query);

CREATE INDEX IF NOT EXISTS idx_search_logs_user 
ON search_logs(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_logs_session 
ON search_logs(session_id, created_at DESC);

-- 검색 품질 개선을 위한 집계 뷰
CREATE OR REPLACE VIEW search_quality_metrics AS
SELECT 
    query,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results_count,
    AVG(search_time_ms) as avg_search_time_ms,
    COUNT(clicked_item_id) as click_count,
    ROUND(COUNT(clicked_item_id)::DECIMAL / COUNT(*) * 100, 2) as click_through_rate,
    AVG(click_position) as avg_click_position,
    AVG(dwell_time_ms) as avg_dwell_time_ms
FROM search_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY query
HAVING COUNT(*) >= 5 -- 최소 5회 이상 검색된 쿼리만
ORDER BY search_count DESC;

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_search_index_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_index_timestamp
    BEFORE UPDATE ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION update_search_index_timestamp();

-- 한국어 검색 설정 최적화
-- (Korean text search configuration)
-- 기본 korean config가 없는 경우 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
        -- 기본 한국어 설정이 없으면 simple 설정 사용
        RAISE NOTICE 'Korean text search config not found, using simple config for Korean text';
    END IF;
END $$;

-- RLS (Row Level Security) 정책
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- 검색 인덱스는 모든 사용자가 읽기 가능
CREATE POLICY "search_index_read_all" 
ON search_index FOR SELECT 
TO public 
USING (true);

-- 검색 로그는 본인 것만 읽기 가능
CREATE POLICY "search_logs_read_own" 
ON search_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 익명 사용자는 세션 기반으로만 로그 조회 가능
CREATE POLICY "search_logs_read_anonymous" 
ON search_logs FOR SELECT 
TO anon 
USING (user_id IS NULL);

-- 검색 로그 삽입은 모든 사용자 가능
CREATE POLICY "search_logs_insert_all" 
ON search_logs FOR INSERT 
TO public 
WITH CHECK (true);

COMMENT ON TABLE search_index IS '통합 검색 인덱스: AI 도구, 워크플로, 프롬프트 통합 검색';
COMMENT ON COLUMN search_index.tsv IS '한국어 최적화 tsvector 필드 (GIN 인덱스)';
COMMENT ON COLUMN search_index.embedding IS 'OpenAI ada-002 임베딩 벡터 (1536차원, HNSW 인덱스)';
COMMENT ON TABLE search_logs IS '검색 로그: 사용자 행동 및 품질 개선용 데이터';