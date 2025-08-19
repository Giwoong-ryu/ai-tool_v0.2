-- ========================================
-- EasyPick 통합 검색 RPC 함수들
-- Advanced Search Functions with pgvector
-- ========================================

-- ========================================
-- 통합 검색 함수 (FTS + 임베딩 재정렬)
-- ========================================

CREATE OR REPLACE FUNCTION search_with_hybrid_ranking(
    search_query TEXT,
    query_embedding vector(1536) DEFAULT NULL,
    item_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    categories TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    similarity_threshold REAL DEFAULT 0.1,
    use_embedding_rerank BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id BIGINT,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    rating DECIMAL(2,1),
    popularity_score INTEGER,
    search_rank REAL,
    similarity_score REAL,
    combined_score REAL
) AS $$
DECLARE
    fts_weight REAL := 0.6;
    embedding_weight REAL := 0.4;
BEGIN
    RETURN QUERY
    WITH fts_results AS (
        SELECT 
            si.id,
            si.item_type,
            si.item_id,
            si.title,
            si.description,
            si.category,
            si.tags,
            si.rating,
            si.popularity_score,
            si.embedding,
            -- FTS 순위 점수 (0-1 정규화)
            CASE 
                WHEN search_query IS NOT NULL AND search_query != '' THEN
                    ts_rank_cd(
                        si.tsv,
                        plainto_tsquery('korean', search_query),
                        1 -- normalization flag
                    )
                ELSE 0.5
            END AS fts_score,
            -- 인기도 점수 (0-1 정규화)
            CASE 
                WHEN si.popularity_score > 0 THEN
                    LEAST(1.0, log(si.popularity_score + 1) / 10.0)
                ELSE 0.0
            END AS popularity_normalized
        FROM public.search_index si
        WHERE 
            si.item_type = ANY(item_types)
            AND (categories IS NULL OR si.category = ANY(categories))
            AND (
                search_query IS NULL 
                OR search_query = '' 
                OR si.tsv @@ plainto_tsquery('korean', search_query)
            )
    ),
    embedding_scores AS (
        SELECT 
            fr.*,
            -- 임베딩 유사도 점수 (코사인 유사도)
            CASE 
                WHEN use_embedding_rerank AND query_embedding IS NOT NULL AND fr.embedding IS NOT NULL THEN
                    1 - (fr.embedding <=> query_embedding)
                ELSE 0.0
            END AS embedding_similarity
        FROM fts_results fr
    ),
    ranked_results AS (
        SELECT 
            es.*,
            es.fts_score AS search_rank,
            es.embedding_similarity AS similarity_score,
            -- 최종 통합 점수 계산
            (es.fts_score * fts_weight) + 
            (es.embedding_similarity * embedding_weight) + 
            (es.popularity_normalized * 0.2) AS combined_score
        FROM embedding_scores es
        WHERE 
            (query_embedding IS NULL OR es.embedding_similarity >= similarity_threshold)
    )
    SELECT 
        rr.id,
        rr.item_type,
        rr.item_id,
        rr.title,
        rr.description,
        rr.category,
        rr.tags,
        rr.rating,
        rr.popularity_score,
        rr.search_rank,
        rr.similarity_score,
        rr.combined_score
    FROM ranked_results rr
    ORDER BY rr.combined_score DESC, rr.popularity_score DESC, rr.id DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 벡터 유사도 검색 함수
-- ========================================

CREATE OR REPLACE FUNCTION search_by_embedding(
    query_embedding vector(1536),
    item_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    categories TEXT[] DEFAULT NULL,
    similarity_threshold REAL DEFAULT 0.3,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id BIGINT,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    rating DECIMAL(2,1),
    popularity_score INTEGER,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.item_type,
        si.item_id,
        si.title,
        si.description,
        si.category,
        si.tags,
        si.rating,
        si.popularity_score,
        (1 - (si.embedding <=> query_embedding)) AS similarity_score
    FROM public.search_index si
    WHERE 
        si.embedding IS NOT NULL
        AND si.item_type = ANY(item_types)
        AND (categories IS NULL OR si.category = ANY(categories))
        AND (1 - (si.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY si.embedding <=> query_embedding ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 관련 항목 추천 함수
-- ========================================

CREATE OR REPLACE FUNCTION get_related_items(
    target_item_type TEXT,
    target_item_id TEXT,
    relation_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    similarity_threshold REAL DEFAULT 0.4,
    limit_count INTEGER DEFAULT 10,
    exclude_same_item BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id BIGINT,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    rating DECIMAL(2,1),
    popularity_score INTEGER,
    similarity_score REAL,
    relation_reason TEXT
) AS $$
DECLARE
    target_embedding vector(1536);
    target_category TEXT;
    target_tags TEXT[];
BEGIN
    -- 대상 항목의 임베딩과 메타데이터 가져오기
    SELECT si.embedding, si.category, si.tags
    INTO target_embedding, target_category, target_tags
    FROM public.search_index si
    WHERE si.item_type = target_item_type 
      AND si.item_id = target_item_id;
      
    IF target_embedding IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH similarity_results AS (
        SELECT 
            si.id,
            si.item_type,
            si.item_id,
            si.title,
            si.description,
            si.category,
            si.tags,
            si.rating,
            si.popularity_score,
            (1 - (si.embedding <=> target_embedding)) AS similarity_score,
            CASE 
                WHEN si.category = target_category THEN 'same_category'
                WHEN si.tags && target_tags THEN 'shared_tags'
                ELSE 'content_similarity'
            END AS relation_reason
        FROM public.search_index si
        WHERE 
            si.embedding IS NOT NULL
            AND si.item_type = ANY(relation_types)
            AND (1 - (si.embedding <=> target_embedding)) >= similarity_threshold
            AND (
                NOT exclude_same_item 
                OR NOT (si.item_type = target_item_type AND si.item_id = target_item_id)
            )
    )
    SELECT 
        sr.id,
        sr.item_type,
        sr.item_id,
        sr.title,
        sr.description,
        sr.category,
        sr.tags,
        sr.rating,
        sr.popularity_score,
        sr.similarity_score,
        sr.relation_reason
    FROM similarity_results sr
    ORDER BY 
        sr.similarity_score DESC,
        sr.popularity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 검색 제안 함수 (자동완성)
-- ========================================

CREATE OR REPLACE FUNCTION get_search_suggestions(
    partial_query TEXT,
    item_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    item_count INTEGER,
    suggestion_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH title_matches AS (
        SELECT 
            title AS suggestion,
            COUNT(*)::INTEGER AS item_count,
            'title' AS suggestion_type
        FROM public.search_index
        WHERE 
            item_type = ANY(item_types)
            AND title ILIKE '%' || partial_query || '%'
        GROUP BY title
    ),
    tag_matches AS (
        SELECT 
            unnest(tags) AS suggestion,
            COUNT(*)::INTEGER AS item_count,
            'tag' AS suggestion_type
        FROM public.search_index
        WHERE 
            item_type = ANY(item_types)
            AND EXISTS (
                SELECT 1 FROM unnest(tags) AS tag 
                WHERE tag ILIKE '%' || partial_query || '%'
            )
        GROUP BY unnest(tags)
    ),
    category_matches AS (
        SELECT 
            category AS suggestion,
            COUNT(*)::INTEGER AS item_count,
            'category' AS suggestion_type
        FROM public.search_index
        WHERE 
            item_type = ANY(item_types)
            AND category ILIKE '%' || partial_query || '%'
        GROUP BY category
    )
    SELECT 
        combined.suggestion,
        combined.item_count,
        combined.suggestion_type
    FROM (
        SELECT * FROM title_matches
        UNION ALL
        SELECT * FROM tag_matches
        UNION ALL
        SELECT * FROM category_matches
    ) combined
    WHERE 
        combined.suggestion IS NOT NULL
        AND length(combined.suggestion) > 2
    ORDER BY 
        combined.item_count DESC,
        length(combined.suggestion) ASC,
        combined.suggestion ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 인기 검색어 함수
-- ========================================

CREATE OR REPLACE FUNCTION get_trending_searches(
    days_back INTEGER DEFAULT 7,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    unique_users BIGINT,
    click_through_rate REAL,
    avg_results_count REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.query,
        COUNT(*)::BIGINT AS search_count,
        COUNT(DISTINCT sl.user_id)::BIGINT AS unique_users,
        ROUND(
            (COUNT(sl.clicked_item_id)::REAL / COUNT(*)::REAL) * 100, 
            2
        ) AS click_through_rate,
        ROUND(AVG(sl.results_count), 1) AS avg_results_count
    FROM public.search_logs sl
    WHERE 
        sl.created_at >= NOW() - INTERVAL '1 day' * days_back
        AND sl.query IS NOT NULL
        AND length(trim(sl.query)) > 2
    GROUP BY sl.query
    HAVING COUNT(*) >= 3  -- 최소 3번 이상 검색된 쿼리만
    ORDER BY search_count DESC, unique_users DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 검색 품질 분석 함수
-- ========================================

CREATE OR REPLACE FUNCTION analyze_search_quality(
    query_text TEXT,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_searches BIGINT,
    unique_users BIGINT,
    avg_results_count REAL,
    click_through_rate REAL,
    avg_click_position REAL,
    avg_dwell_time_ms REAL,
    quality_score REAL,
    improvement_suggestions TEXT[]
) AS $$
DECLARE
    suggestions TEXT[] := '{}';
    ctr REAL;
    avg_pos REAL;
    avg_results REAL;
BEGIN
    -- 검색 통계 수집
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(DISTINCT user_id)::BIGINT,
        ROUND(AVG(results_count), 1),
        ROUND((COUNT(clicked_item_id)::REAL / COUNT(*)::REAL) * 100, 2),
        ROUND(AVG(click_position), 1),
        ROUND(AVG(dwell_time_ms), 0)
    INTO 
        total_searches,
        unique_users,
        avg_results_count,
        click_through_rate,
        avg_click_position,
        avg_dwell_time_ms
    FROM public.search_logs
    WHERE 
        query = query_text
        AND created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    ctr := click_through_rate;
    avg_pos := avg_click_position;
    avg_results := avg_results_count;
    
    -- 개선 제안 생성
    IF ctr < 10 THEN
        suggestions := array_append(suggestions, '클릭률이 낮습니다. 검색 결과의 제목과 설명을 개선하세요.');
    END IF;
    
    IF avg_pos > 5 THEN
        suggestions := array_append(suggestions, '사용자가 하위 결과를 클릭하고 있습니다. 관련성 알고리즘을 개선하세요.');
    END IF;
    
    IF avg_results < 5 THEN
        suggestions := array_append(suggestions, '검색 결과가 적습니다. 콘텐츠를 확장하거나 검색 범위를 넓히세요.');
    END IF;
    
    IF avg_dwell_time_ms < 5000 THEN
        suggestions := array_append(suggestions, '체류 시간이 짧습니다. 콘텐츠 품질을 개선하세요.');
    END IF;
    
    -- 품질 점수 계산 (0-100)
    quality_score := LEAST(100, GREATEST(0,
        (ctr * 0.3) +                           -- 클릭률 (30%)
        ((100 - LEAST(avg_pos * 10, 100)) * 0.2) + -- 클릭 위치 (20%)
        (LEAST(avg_results / 10 * 100, 100) * 0.2) + -- 결과 수 (20%)
        (LEAST(avg_dwell_time_ms / 10000 * 100, 100) * 0.3) -- 체류시간 (30%)
    ));
    
    RETURN QUERY VALUES (
        total_searches,
        unique_users,
        avg_results_count,
        click_through_rate,
        avg_click_position,
        avg_dwell_time_ms,
        ROUND(quality_score, 1),
        suggestions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 개인화된 검색 결과 함수
-- ========================================

CREATE OR REPLACE FUNCTION search_personalized(
    search_query TEXT,
    query_embedding vector(1536) DEFAULT NULL,
    target_user_id UUID DEFAULT NULL,
    item_types TEXT[] DEFAULT ARRAY['ai_tool', 'workflow', 'prompt_template'],
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id BIGINT,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    rating DECIMAL(2,1),
    popularity_score INTEGER,
    personalization_score REAL,
    combined_score REAL
) AS $$
DECLARE
    user_id UUID := COALESCE(target_user_id, auth.uid());
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        -- 사용자의 과거 검색 및 클릭 이력에서 선호도 추출
        SELECT 
            sl.clicked_item_type,
            COUNT(*) AS interaction_count
        FROM public.search_logs sl
        WHERE 
            sl.user_id = user_id
            AND sl.clicked_item_type IS NOT NULL
            AND sl.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY sl.clicked_item_type
    ),
    base_search AS (
        SELECT 
            si.*,
            (1 - COALESCE(si.embedding <=> query_embedding, 1)) AS content_similarity
        FROM public.search_index si
        WHERE 
            si.item_type = ANY(item_types)
            AND (
                search_query IS NULL 
                OR search_query = '' 
                OR si.tsv @@ plainto_tsquery('korean', search_query)
            )
    ),
    personalized_results AS (
        SELECT 
            bs.*,
            -- 개인화 점수 계산
            CASE 
                WHEN up.interaction_count IS NOT NULL THEN
                    log(up.interaction_count + 1) * 0.2  -- 과거 상호작용 기반 부스트
                ELSE 0
            END AS personalization_score
        FROM base_search bs
        LEFT JOIN user_preferences up ON up.clicked_item_type = bs.item_type
    )
    SELECT 
        pr.id,
        pr.item_type,
        pr.item_id,
        pr.title,
        pr.description,
        pr.category,
        pr.tags,
        pr.rating,
        pr.popularity_score,
        pr.personalization_score,
        -- 최종 점수: 콘텐츠 유사도 + 개인화 점수 + 인기도
        (pr.content_similarity * 0.5) + 
        (pr.personalization_score * 0.3) + 
        (LEAST(log(pr.popularity_score + 1) / 10, 1) * 0.2) AS combined_score
    FROM personalized_results pr
    ORDER BY combined_score DESC, pr.popularity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 권한 부여
-- ========================================

-- 검색 함수들에 대한 실행 권한 부여
GRANT EXECUTE ON FUNCTION search_with_hybrid_ranking TO authenticated;
GRANT EXECUTE ON FUNCTION search_by_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_searches TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_search_quality TO authenticated;
GRANT EXECUTE ON FUNCTION search_personalized TO authenticated;

-- 익명 사용자도 기본 검색 기능은 사용 가능
GRANT EXECUTE ON FUNCTION search_with_hybrid_ranking TO anon;
GRANT EXECUTE ON FUNCTION search_by_embedding TO anon;
GRANT EXECUTE ON FUNCTION get_related_items TO anon;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO anon;
GRANT EXECUTE ON FUNCTION get_trending_searches TO anon;

-- 서비스 역할은 모든 함수 실행 가능
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- 함수 문서화
-- ========================================

COMMENT ON FUNCTION search_with_hybrid_ranking IS 'FTS와 임베딩을 결합한 하이브리드 검색 함수';
COMMENT ON FUNCTION search_by_embedding IS '벡터 임베딩 기반 유사도 검색 함수';
COMMENT ON FUNCTION get_related_items IS '특정 항목과 관련된 항목 추천 함수';
COMMENT ON FUNCTION get_search_suggestions IS '검색어 자동완성 제안 함수';
COMMENT ON FUNCTION get_trending_searches IS '인기 검색어 조회 함수';
COMMENT ON FUNCTION analyze_search_quality IS '검색 품질 분석 및 개선 제안 함수';
COMMENT ON FUNCTION search_personalized IS '사용자 맞춤형 개인화 검색 함수';