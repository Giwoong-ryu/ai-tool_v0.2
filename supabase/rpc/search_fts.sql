-- EasyPick FTS 검색 함수
-- 목적: 1차 Full Text Search (tsvector 기반) 빠른 후보 추출
-- 성능: GIN 인덱스 활용으로 ~10ms 이내 응답 목표

CREATE OR REPLACE FUNCTION search_fts(
    search_query TEXT,
    item_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    category_filter TEXT DEFAULT NULL,
    korean_only BOOLEAN DEFAULT FALSE,
    popular_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
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
    rank_score REAL,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    parsed_query tsquery;
    query_length INTEGER;
    use_simple_search BOOLEAN DEFAULT FALSE;
BEGIN
    -- 입력 검증
    IF search_query IS NULL OR trim(search_query) = '' THEN
        RAISE EXCEPTION 'search_query cannot be empty';
    END IF;
    
    IF limit_count < 1 OR limit_count > 100 THEN
        RAISE EXCEPTION 'limit_count must be between 1 and 100';
    END IF;

    -- 쿼리 길이 확인 (한국어 특성 고려)
    query_length := char_length(trim(search_query));
    
    -- 쿼리 전처리 및 tsquery 생성
    BEGIN
        -- 한국어 검색을 위한 쿼리 정규화
        -- 특수문자 제거, 공백 정규화
        search_query := regexp_replace(trim(search_query), '[^\w\s가-힣]', ' ', 'g');
        search_query := regexp_replace(search_query, '\s+', ' ', 'g');
        
        -- 짧은 쿼리는 prefix 검색, 긴 쿼리는 phrase 검색 조합
        IF query_length <= 2 THEN
            -- 매우 짧은 쿼리: prefix 검색만
            parsed_query := to_tsquery('korean', search_query || ':*');
        ELSIF query_length <= 10 THEN
            -- 짧은 쿼리: prefix와 exact 조합
            parsed_query := to_tsquery('korean', 
                search_query || ':* | ' || search_query
            );
        ELSE
            -- 긴 쿼리: phrase 검색 우선, fallback으로 단어별 OR 검색
            BEGIN
                parsed_query := phraseto_tsquery('korean', search_query);
                -- phrase 검색 결과가 없으면 단어별 OR 검색으로 fallback
                IF NOT EXISTS (
                    SELECT 1 FROM search_index 
                    WHERE tsv @@ parsed_query 
                    AND item_type = ANY(item_types)
                    LIMIT 1
                ) THEN
                    parsed_query := plainto_tsquery('korean', search_query);
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- phrase 검색 실패시 기본 검색으로 fallback
                parsed_query := plainto_tsquery('korean', search_query);
            END;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- tsquery 생성 실패시 simple 검색으로 fallback
        use_simple_search := TRUE;
    END;

    -- FTS 검색 실행 또는 simple 검색 fallback
    IF use_simple_search THEN
        -- Simple 텍스트 매칭 (tsquery 실패시)
        RETURN QUERY
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
            -- Simple scoring: title match > description match > tags match
            (CASE 
                WHEN LOWER(si.title) LIKE '%' || LOWER(search_query) || '%' THEN 0.9
                WHEN LOWER(si.description) LIKE '%' || LOWER(search_query) || '%' THEN 0.7
                WHEN EXISTS (
                    SELECT 1 FROM unnest(si.tags) as tag 
                    WHERE LOWER(tag) LIKE '%' || LOWER(search_query) || '%'
                ) THEN 0.5
                ELSE 0.1
            END)::REAL as rank_score,
            si.created_at
        FROM search_index si
        WHERE 
            si.item_type = ANY(item_types)
            AND (category_filter IS NULL OR si.category = category_filter)
            AND (NOT korean_only OR si.is_korean = TRUE)
            AND (NOT popular_only OR si.is_popular = TRUE)
            AND (
                LOWER(si.title) LIKE '%' || LOWER(search_query) || '%'
                OR LOWER(si.description) LIKE '%' || LOWER(search_query) || '%'
                OR EXISTS (
                    SELECT 1 FROM unnest(si.tags) as tag 
                    WHERE LOWER(tag) LIKE '%' || LOWER(search_query) || '%'
                )
            )
        ORDER BY 
            rank_score DESC,
            si.popularity_score DESC,
            si.rating DESC NULLS LAST,
            si.created_at DESC
        LIMIT limit_count 
        OFFSET offset_count;
    ELSE
        -- FTS 검색 (메인 경로)
        RETURN QUERY
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
            -- Combined ranking: TS rank + popularity + rating
            (
                ts_rank_cd(si.tsv, parsed_query, 32) * 0.6 +  -- TS rank (60%)
                (si.popularity_score::REAL / 1000.0) * 0.3 +   -- Popularity (30%)
                (COALESCE(si.rating, 0.0)::REAL / 5.0) * 0.1   -- Rating (10%)
            )::REAL as rank_score,
            si.created_at
        FROM search_index si
        WHERE 
            si.tsv @@ parsed_query
            AND si.item_type = ANY(item_types)
            AND (category_filter IS NULL OR si.category = category_filter)
            AND (NOT korean_only OR si.is_korean = TRUE)
            AND (NOT popular_only OR si.is_popular = TRUE)
        ORDER BY 
            rank_score DESC,
            si.popularity_score DESC,
            si.rating DESC NULLS LAST,
            si.created_at DESC
        LIMIT limit_count 
        OFFSET offset_count;
    END IF;

END;
$$;

-- 성능 최적화를 위한 함수 설정
ALTER FUNCTION search_fts SET work_mem = '4MB';
ALTER FUNCTION search_fts SET enable_seqscan = off;

-- 함수에 대한 권한 설정
GRANT EXECUTE ON FUNCTION search_fts TO anon, authenticated;

-- 사용 예시 주석
COMMENT ON FUNCTION search_fts IS '
EasyPick FTS 검색 함수 - 1차 후보 추출용

사용 예시:
-- 기본 검색
SELECT * FROM search_fts(''블로그 글 작성'');

-- AI 도구만 검색
SELECT * FROM search_fts(''ChatGPT'', ARRAY[''ai_tool'']);

-- 한국어 도구만 검색  
SELECT * FROM search_fts(''번역'', korean_only := TRUE);

-- 카테고리 필터링
SELECT * FROM search_fts(''디자인'', category_filter := ''디자인'');

-- 인기 도구만 + 페이징
SELECT * FROM search_fts(''AI'', popular_only := TRUE, limit_count := 20, offset_count := 0);

성능 특성:
- GIN 인덱스 활용으로 ~10ms 이내 응답
- 한국어 텍스트 검색 최적화
- Query fallback 체계 (phrase → word → simple)
- 통합 랭킹 (TS rank + popularity + rating)
';