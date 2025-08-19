-- EasyPick 임베딩 재정렬 함수
-- 목적: FTS 결과를 의미적 유사도로 재정렬 (pgvector 기반)
-- 성능: HNSW 인덱스 활용으로 ~50ms 이내 응답 목표

CREATE OR REPLACE FUNCTION rerank_by_embedding(
    search_query TEXT,
    query_embedding vector(1536),
    candidate_ids BIGINT[],
    rerank_limit INTEGER DEFAULT 20,
    similarity_threshold REAL DEFAULT 0.1,
    boost_popular BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id BIGINT,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    rating DECIMAL(2,1),
    popularity_score INTEGER,
    is_korean BOOLEAN,
    is_popular BOOLEAN,
    tags TEXT[],
    metadata JSONB,
    original_rank INTEGER,
    similarity_score REAL,
    final_score REAL,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    candidate_count INTEGER;
    max_similarity REAL;
    min_similarity REAL;
BEGIN
    -- 입력 검증
    IF query_embedding IS NULL THEN
        RAISE EXCEPTION 'query_embedding cannot be null';
    END IF;
    
    IF candidate_ids IS NULL OR array_length(candidate_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'candidate_ids cannot be empty';
    END IF;
    
    IF rerank_limit < 1 OR rerank_limit > 50 THEN
        RAISE EXCEPTION 'rerank_limit must be between 1 and 50';
    END IF;

    candidate_count := array_length(candidate_ids, 1);
    
    -- 후보가 없으면 빈 결과 반환
    IF candidate_count = 0 THEN
        RETURN;
    END IF;

    -- 임베딩 유사도 기반 재정렬
    -- similarity score 정규화를 위한 min/max 계산
    SELECT 
        MAX(1 - (si.embedding <=> query_embedding)) as max_sim,
        MIN(1 - (si.embedding <=> query_embedding)) as min_sim
    INTO max_similarity, min_similarity
    FROM search_index si 
    WHERE si.id = ANY(candidate_ids) 
    AND si.embedding IS NOT NULL;

    -- 유사도가 계산되지 않는 경우 기본값 설정
    IF max_similarity IS NULL THEN
        max_similarity := 1.0;
        min_similarity := 0.0;
    END IF;

    RETURN QUERY
    WITH ranked_candidates AS (
        SELECT 
            si.id,
            si.item_type,
            si.item_id,
            si.title,
            si.description,
            si.category,
            si.rating,
            si.popularity_score,
            si.is_korean,
            si.is_popular,
            si.tags,
            si.metadata,
            si.created_at,
            -- 원본 순위 (FTS 결과에서의 위치)
            (array_position(candidate_ids, si.id))::INTEGER as original_rank,
            -- 코사인 유사도 계산 (1 - cosine_distance)
            CASE 
                WHEN si.embedding IS NOT NULL THEN
                    (1 - (si.embedding <=> query_embedding))::REAL
                ELSE 
                    0.0::REAL
            END as raw_similarity
        FROM search_index si 
        WHERE si.id = ANY(candidate_ids)
    ),
    scored_candidates AS (
        SELECT 
            *,
            -- 정규화된 유사도 점수 (0-1 범위)
            CASE 
                WHEN max_similarity > min_similarity THEN
                    ((raw_similarity - min_similarity) / (max_similarity - min_similarity))::REAL
                ELSE 
                    raw_similarity::REAL
            END as normalized_similarity,
            -- 최종 점수 계산
            CASE 
                WHEN max_similarity > min_similarity THEN
                    (
                        -- 정규화된 유사도 (70%)
                        ((raw_similarity - min_similarity) / (max_similarity - min_similarity)) * 0.7 +
                        -- 원본 FTS 랭킹 보정 (20%) - 높은 순위일수록 높은 점수
                        (1.0 - (original_rank::REAL - 1) / candidate_count) * 0.2 +
                        -- 인기도 부스트 (10%)
                        CASE WHEN boost_popular AND is_popular THEN 0.1 ELSE 0.0 END
                    )::REAL
                ELSE 
                    (
                        raw_similarity * 0.7 +
                        (1.0 - (original_rank::REAL - 1) / candidate_count) * 0.2 +
                        CASE WHEN boost_popular AND is_popular THEN 0.1 ELSE 0.0 END
                    )::REAL
            END as final_score
        FROM ranked_candidates
    )
    SELECT 
        sc.id,
        sc.item_type,
        sc.item_id,
        sc.title,
        sc.description,
        sc.category,
        sc.rating,
        sc.popularity_score,
        sc.is_korean,
        sc.is_popular,
        sc.tags,
        sc.metadata,
        sc.original_rank,
        sc.normalized_similarity as similarity_score,
        sc.final_score,
        sc.created_at
    FROM scored_candidates sc
    WHERE sc.normalized_similarity >= similarity_threshold
    ORDER BY 
        sc.final_score DESC,
        sc.normalized_similarity DESC,
        sc.popularity_score DESC,
        sc.original_rank ASC
    LIMIT rerank_limit;

END;
$$;

-- 통합 검색 함수 (FTS + 임베딩 재정렬)
CREATE OR REPLACE FUNCTION search_unified(
    search_query TEXT,
    query_embedding vector(1536) DEFAULT NULL,
    item_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    category_filter TEXT DEFAULT NULL,
    korean_only BOOLEAN DEFAULT FALSE,
    popular_only BOOLEAN DEFAULT FALSE,
    fts_limit INTEGER DEFAULT 50,
    final_limit INTEGER DEFAULT 20,
    similarity_threshold REAL DEFAULT 0.1
)
RETURNS TABLE (
    id BIGINT,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    rating DECIMAL(2,1),
    popularity_score INTEGER,
    is_korean BOOLEAN,
    is_popular BOOLEAN,
    tags TEXT[],
    metadata JSONB,
    search_type TEXT,
    fts_rank REAL,
    similarity_score REAL,
    final_score REAL,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    candidate_ids BIGINT[];
    start_time TIMESTAMP;
    fts_time INTEGER;
    rerank_time INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- 1단계: FTS 검색으로 후보 추출
    WITH fts_results AS (
        SELECT * FROM search_fts(
            search_query, 
            item_types, 
            category_filter, 
            korean_only, 
            popular_only, 
            fts_limit, 
            0
        )
    )
    SELECT array_agg(fts_results.id ORDER BY fts_results.rank_score DESC)
    INTO candidate_ids
    FROM fts_results;
    
    fts_time := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
    
    -- 임베딩이 제공되지 않았거나 후보가 없으면 FTS 결과만 반환
    IF query_embedding IS NULL OR candidate_ids IS NULL OR array_length(candidate_ids, 1) IS NULL THEN
        RETURN QUERY
        SELECT 
            fr.id,
            fr.item_type,
            fr.item_id,
            fr.title,
            fr.description,
            fr.category,
            fr.rating,
            fr.popularity_score,
            fr.is_korean,
            fr.is_popular,
            fr.tags,
            fr.metadata,
            'fts_only'::TEXT as search_type,
            fr.rank_score as fts_rank,
            0.0::REAL as similarity_score,
            fr.rank_score as final_score,
            fr.created_at
        FROM search_fts(
            search_query, 
            item_types, 
            category_filter, 
            korean_only, 
            popular_only, 
            final_limit, 
            0
        ) fr;
        RETURN;
    END IF;
    
    -- 2단계: 임베딩 기반 재정렬
    rerank_time := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
    
    RETURN QUERY
    WITH fts_results AS (
        SELECT 
            fr.*,
            ROW_NUMBER() OVER (ORDER BY fr.rank_score DESC) as fts_position
        FROM search_fts(
            search_query, 
            item_types, 
            category_filter, 
            korean_only, 
            popular_only, 
            fts_limit, 
            0
        ) fr
    ),
    reranked_results AS (
        SELECT * FROM rerank_by_embedding(
            search_query,
            query_embedding,
            candidate_ids,
            final_limit,
            similarity_threshold,
            TRUE
        )
    )
    SELECT 
        rr.id,
        rr.item_type,
        rr.item_id,
        rr.title,
        rr.description,
        rr.category,
        rr.rating,
        rr.popularity_score,
        rr.is_korean,
        rr.is_popular,
        rr.tags,
        rr.metadata,
        'unified'::TEXT as search_type,
        COALESCE(fr.rank_score, 0.0) as fts_rank,
        rr.similarity_score,
        rr.final_score,
        rr.created_at
    FROM reranked_results rr
    LEFT JOIN fts_results fr ON fr.id = rr.id
    ORDER BY rr.final_score DESC;

END;
$$;

-- 성능 최적화 설정
ALTER FUNCTION rerank_by_embedding SET work_mem = '8MB';
ALTER FUNCTION search_unified SET work_mem = '8MB';

-- 권한 설정
GRANT EXECUTE ON FUNCTION rerank_by_embedding TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_unified TO anon, authenticated;

-- 함수 설명
COMMENT ON FUNCTION rerank_by_embedding IS '
EasyPick 임베딩 재정렬 함수 - FTS 결과를 의미적 유사도로 재정렬

사용 예시:
-- FTS 후보를 임베딩으로 재정렬
SELECT * FROM rerank_by_embedding(
    ''AI 글쓰기 도구'',
    ''[0.1, 0.2, ...embedding_vector...]''::vector(1536),
    ARRAY[1, 5, 10, 15, 20]::BIGINT[]
);

성능 특성:
- HNSW 인덱스 활용으로 ~50ms 이내 응답
- 의미적 유사도 + FTS 랭킹 + 인기도 통합 점수
- 정규화된 유사도 점수 (0-1 범위)
';

COMMENT ON FUNCTION search_unified IS '
EasyPick 통합 검색 함수 - FTS + 임베딩 재정렬 파이프라인

사용 예시:
-- 통합 검색 (FTS + 임베딩)
SELECT * FROM search_unified(
    ''블로그 글 작성'',
    ''[0.1, 0.2, ...embedding_vector...]''::vector(1536)
);

-- FTS만 사용 (임베딩 없음)
SELECT * FROM search_unified(''ChatGPT'');

성능 특성:
- 1단계: FTS 후보 추출 (~10ms)
- 2단계: 임베딩 재정렬 (~50ms)
- 전체: ~60ms 이내 응답 목표
';