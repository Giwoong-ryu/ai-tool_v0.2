-- =====================================================
-- Hybrid Search RPC Functions
-- Stage 1: Fast FTS + Stage 2: Vector Reranking
-- =====================================================

-- =====================================================
-- Stage 1: Full-Text Search with Filtering
-- Performance Target: <100ms
-- =====================================================
CREATE OR REPLACE FUNCTION search_fts(
    query_input TEXT,
    item_types TEXT[] DEFAULT NULL,
    categories TEXT[] DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    search_rank REAL,
    popularity_score REAL,
    ts_rank REAL
) AS $$
DECLARE
    search_query tsquery;
    start_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();
    
    -- Parse search query
    search_query := plainto_tsquery('english', query_input);
    
    -- Execute FTS with filtering
    RETURN QUERY
    SELECT 
        s.id,
        s.item_type,
        s.item_id,
        s.title,
        s.description,
        s.category,
        s.tags,
        s.search_rank,
        s.popularity_score,
        ts_rank_cd(s.search_vector, search_query) as ts_rank
    FROM search_index s
    WHERE 
        s.is_active = TRUE
        AND s.search_vector @@ search_query
        AND (item_types IS NULL OR s.item_type = ANY(item_types))
        AND (categories IS NULL OR s.category = ANY(categories))
        AND (tags_filter IS NULL OR s.tags && tags_filter)
    ORDER BY 
        ts_rank_cd(s.search_vector, search_query) DESC,
        s.search_rank DESC,
        s.popularity_score DESC
    LIMIT limit_count
    OFFSET offset_count;
    
    -- Log performance
    INSERT INTO search_analytics (
        query, 
        item_type, 
        results_count, 
        fts_duration_ms
    ) VALUES (
        query_input,
        CASE WHEN array_length(item_types, 1) = 1 THEN item_types[1] ELSE NULL END,
        (SELECT COUNT(*) FROM search_index 
         WHERE is_active = TRUE AND search_vector @@ search_query),
        EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::INTEGER
    );
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Stage 2: Vector Similarity Reranking
-- Performance Target: <200ms for ~100 items
-- =====================================================
CREATE OR REPLACE FUNCTION rerank_by_embedding(
    item_ids_input UUID[],
    query_embedding_input vector(1536),
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    search_rank REAL,
    popularity_score REAL,
    similarity_score REAL
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    vector_duration INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Rerank by vector similarity
    RETURN QUERY
    SELECT 
        s.id,
        s.item_type,
        s.item_id,
        s.title,
        s.description,
        s.category,
        s.tags,
        s.search_rank,
        s.popularity_score,
        (1 - (s.embedding <=> query_embedding_input)) as similarity_score
    FROM search_index s
    WHERE 
        s.id = ANY(item_ids_input)
        AND s.embedding IS NOT NULL
    ORDER BY 
        (1 - (s.embedding <=> query_embedding_input)) DESC,
        s.search_rank DESC
    LIMIT limit_count;
    
    -- Log vector performance
    vector_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::INTEGER;
    
    UPDATE search_analytics 
    SET vector_duration_ms = vector_duration,
        total_duration_ms = COALESCE(fts_duration_ms, 0) + vector_duration
    WHERE id = (
        SELECT id FROM search_analytics 
        ORDER BY created_at DESC 
        LIMIT 1
    );
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Hybrid Search Orchestrator
-- Combines FTS + Vector Reranking
-- =====================================================
CREATE OR REPLACE FUNCTION hybrid_search(
    query_input TEXT,
    query_embedding_input vector(1536) DEFAULT NULL,
    item_types TEXT[] DEFAULT NULL,
    categories TEXT[] DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    fts_limit INTEGER DEFAULT 100,
    final_limit INTEGER DEFAULT 20,
    use_vector_rerank BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id UUID,
    item_type TEXT,
    item_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    search_rank REAL,
    popularity_score REAL,
    final_score REAL,
    match_type TEXT
) AS $$
DECLARE
    fts_results UUID[];
    start_time TIMESTAMPTZ;
    total_duration INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Stage 1: Get FTS candidates
    SELECT ARRAY_AGG(s.id) INTO fts_results
    FROM search_fts(
        query_input, 
        item_types, 
        categories, 
        tags_filter, 
        fts_limit,
        0
    ) s;
    
    -- Stage 2: Vector reranking (if embedding provided)
    IF use_vector_rerank AND query_embedding_input IS NOT NULL AND array_length(fts_results, 1) > 0 THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.item_type,
            r.item_id,
            r.title,
            r.description,
            r.category,
            r.tags,
            r.search_rank,
            r.popularity_score,
            r.similarity_score as final_score,
            'hybrid'::TEXT as match_type
        FROM rerank_by_embedding(fts_results, query_embedding_input, final_limit) r;
    ELSE
        -- Fallback to FTS-only results
        RETURN QUERY
        SELECT 
            s.id,
            s.item_type,
            s.item_id,
            s.title,
            s.description,
            s.category,
            s.tags,
            s.search_rank,
            s.popularity_score,
            s.ts_rank as final_score,
            'fts_only'::TEXT as match_type
        FROM search_fts(
            query_input, 
            item_types, 
            categories, 
            tags_filter, 
            final_limit,
            0
        ) s;
    END IF;
    
    -- Update total duration
    total_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::INTEGER;
    
    UPDATE search_analytics 
    SET total_duration_ms = total_duration
    WHERE id = (
        SELECT id FROM search_analytics 
        ORDER BY created_at DESC 
        LIMIT 1
    );
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Search Suggestions Function
-- For autocomplete and query expansion
-- =====================================================
CREATE OR REPLACE FUNCTION get_search_suggestions(
    partial_query TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    item_count INTEGER,
    category TEXT
) AS $$
BEGIN
    -- Return suggestions based on title/description prefixes
    RETURN QUERY
    SELECT DISTINCT
        CASE 
            WHEN s.title ILIKE partial_query || '%' THEN s.title
            ELSE regexp_split_to_table(s.description, '\W+')
        END as suggestion,
        COUNT(*)::INTEGER as item_count,
        s.category
    FROM search_index s
    WHERE 
        s.is_active = TRUE
        AND (
            s.title ILIKE partial_query || '%'
            OR s.description ILIKE '%' || partial_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(s.tags) tag 
                WHERE tag ILIKE partial_query || '%'
            )
        )
    GROUP BY suggestion, s.category
    HAVING LENGTH(suggestion) > LENGTH(partial_query)
    ORDER BY item_count DESC, LENGTH(suggestion) ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Performance Monitoring Functions
-- =====================================================

-- Get search performance metrics
CREATE OR REPLACE FUNCTION get_search_metrics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_queries INTEGER,
    avg_duration_ms REAL,
    p95_duration_ms REAL,
    avg_results_count REAL,
    slow_queries_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_queries,
        AVG(total_duration_ms)::REAL as avg_duration_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_duration_ms)::REAL as p95_duration_ms,
        AVG(results_count)::REAL as avg_results_count,
        COUNT(*) FILTER (WHERE total_duration_ms > 300)::INTEGER as slow_queries_count
    FROM search_analytics 
    WHERE created_at > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;