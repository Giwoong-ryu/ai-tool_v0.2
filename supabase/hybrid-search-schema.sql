-- =====================================================
-- Hybrid Search Pipeline Database Schema
-- Combines PostgreSQL FTS with pgvector for AI Tools
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- Core Search Index Table
-- =====================================================
CREATE TABLE search_index (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Content Identification
    item_type TEXT NOT NULL, -- 'tool', 'workflow', 'prompt'
    item_id TEXT NOT NULL,   -- Reference to actual item
    
    -- Searchable Content
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,            -- Full searchable text
    tags TEXT[],            -- Array of tags
    category TEXT,
    
    -- Search Vectors
    search_vector tsvector,  -- FTS vector
    embedding vector(1536),  -- OpenAI embedding
    
    -- Performance Fields
    search_rank REAL DEFAULT 0.0,     -- Pre-calculated rank
    popularity_score REAL DEFAULT 0.0, -- Usage-based scoring
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure uniqueness per item
    UNIQUE(item_type, item_id)
);

-- =====================================================
-- Indexing Strategy
-- =====================================================

-- GIN index for full-text search (primary search)
CREATE INDEX idx_search_vector_gin 
ON search_index 
USING GIN(search_vector);

-- HNSW index for vector similarity (reranking)
CREATE INDEX idx_embedding_hnsw 
ON search_index 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Composite index for filtering
CREATE INDEX idx_search_filter 
ON search_index (item_type, is_active, search_rank DESC);

-- Partial index for active items only (performance)
CREATE INDEX idx_active_items 
ON search_index (search_rank DESC, created_at DESC)
WHERE is_active = TRUE;

-- Index for tag-based filtering
CREATE INDEX idx_tags_gin 
ON search_index 
USING GIN(tags);

-- =====================================================
-- Auto-update Triggers
-- =====================================================

-- Function to update search_vector when content changes
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vectors
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- =====================================================
-- Search Statistics Table
-- =====================================================
CREATE TABLE search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    item_type TEXT,
    results_count INTEGER,
    fts_duration_ms INTEGER,
    vector_duration_ms INTEGER,
    total_duration_ms INTEGER,
    clicked_items UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX idx_search_analytics_query 
ON search_analytics (query, created_at DESC);

-- =====================================================
-- Performance Views
-- =====================================================

-- View for search performance monitoring
CREATE VIEW search_performance AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as query_count,
    AVG(total_duration_ms) as avg_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_duration_ms) as p95_duration,
    AVG(results_count) as avg_results
FROM search_analytics 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- View for popular search terms
CREATE VIEW popular_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results,
    MAX(created_at) as last_searched
FROM search_analytics 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY query
HAVING COUNT(*) > 1
ORDER BY search_count DESC
LIMIT 100;