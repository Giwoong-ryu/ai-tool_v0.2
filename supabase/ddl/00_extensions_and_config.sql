-- ========================================
-- EasyPick Database Extensions & Configuration
-- 통합 확장 및 설정 초기화
-- ========================================

-- ========================================
-- DATABASE EXTENSIONS
-- ========================================

-- Enable pgvector for AI search functionality
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable advanced text search (Korean language support)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable HTTP extensions for external API calls
CREATE EXTENSION IF NOT EXISTS http;

-- Enable unaccent for text normalization
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ========================================
-- TEXT SEARCH CONFIGURATION
-- ========================================

-- Create Korean text search configuration if not exists
DO $$
BEGIN
    -- Check if korean configuration exists, if not create simple one
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
        CREATE TEXT SEARCH CONFIGURATION korean (copy=simple);
        COMMENT ON TEXT SEARCH CONFIGURATION korean IS 'Korean language text search configuration';
    END IF;
EXCEPTION
    WHEN others THEN
        -- If korean config cannot be created, log warning
        RAISE NOTICE 'Korean text search configuration not available, using simple configuration';
END
$$;

-- ========================================
-- DATABASE CONFIGURATION
-- ========================================

-- Set application name and database metadata
SELECT set_config('application_name', 'EasyPick AI Tools Platform', false);

-- ========================================
-- CUSTOM TYPES
-- ========================================

-- Subscription status enum
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment method enum
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('toss', 'paypal', 'stripe', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Event type enum for analytics
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM (
        'page_view', 'search', 'view_item', 'purchase', 'sign_up', 
        'prompt_generate', 'workflow_start', 'workflow_complete',
        'ai_tool_access', 'bookmark_add', 'export_data'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Usage event type enum
DO $$ BEGIN
    CREATE TYPE usage_event_type AS ENUM (
        'compile_prompt', 'run_workflow', 'api_call', 'export_data', 
        'ai_generation', 'search_query', 'storage_write', 'ai_tool_access'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to generate secure random strings
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(length), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to normalize Korean text for search
CREATE OR REPLACE FUNCTION normalize_korean_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove extra whitespace and normalize
    RETURN trim(regexp_replace(input_text, '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create search vector with Korean support
CREATE OR REPLACE FUNCTION create_search_vector(
    title TEXT,
    description TEXT DEFAULT NULL,
    content TEXT DEFAULT NULL,
    tags TEXT[] DEFAULT NULL,
    category TEXT DEFAULT NULL
)
RETURNS tsvector AS $$
BEGIN
    RETURN 
        setweight(to_tsvector('korean', COALESCE(normalize_korean_text(title), '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(normalize_korean_text(description), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(normalize_korean_text(content), '')), 'C') ||
        setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(normalize_korean_text(category), '')), 'D');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate similarity score
CREATE OR REPLACE FUNCTION calculate_similarity_score(
    query TEXT,
    title TEXT,
    description TEXT DEFAULT NULL,
    usage_count INTEGER DEFAULT 0
)
RETURNS REAL AS $$
DECLARE
    text_similarity REAL := 0;
    title_similarity REAL := 0;
    desc_similarity REAL := 0;
    usage_boost REAL := 0;
BEGIN
    -- Title similarity (weight: 40%)
    IF title IS NOT NULL AND query IS NOT NULL THEN
        title_similarity := similarity(lower(normalize_korean_text(query)), lower(normalize_korean_text(title))) * 0.4;
    END IF;
    
    -- Description similarity (weight: 30%)
    IF description IS NOT NULL AND query IS NOT NULL THEN
        desc_similarity := similarity(lower(normalize_korean_text(query)), lower(normalize_korean_text(description))) * 0.3;
    END IF;
    
    -- Usage popularity boost (weight: 30%)
    IF usage_count > 0 THEN
        usage_boost := LEAST(0.3, log(usage_count + 1) * 0.05);
    END IF;
    
    RETURN title_similarity + desc_similarity + usage_boost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- PERFORMANCE SETTINGS
-- ========================================

-- Increase shared_preload_libraries if needed (requires restart)
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements, auto_explain';

-- Set work memory for large operations
-- SET work_mem = '256MB';

-- Set maintenance work memory for index creation
-- SET maintenance_work_mem = '512MB';

-- Set effective cache size
-- SET effective_cache_size = '4GB';

-- ========================================
-- SECURITY DEFAULTS
-- ========================================

-- Revoke default public access to new tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM public;

-- Enable RLS by default for new tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SCHEMAS TO authenticated;

-- ========================================
-- MONITORING SETUP
-- ========================================

-- Create monitoring schema if not exists
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Function to check database health
CREATE OR REPLACE FUNCTION monitoring.check_database_health()
RETURNS TABLE (
    metric TEXT,
    value TEXT,
    status TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
        ('database_size', 
         pg_size_pretty(pg_database_size(current_database())), 
         'info', 
         'Current database size'),
        ('active_connections', 
         (SELECT count(*)::TEXT FROM pg_stat_activity WHERE state = 'active'), 
         'info', 
         'Active database connections'),
        ('table_count', 
         (SELECT count(*)::TEXT FROM information_schema.tables WHERE table_schema = 'public'), 
         'info', 
         'Total public tables'),
        ('extension_count', 
         (SELECT count(*)::TEXT FROM pg_extension), 
         'info', 
         'Installed extensions');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to monitoring functions
GRANT USAGE ON SCHEMA monitoring TO authenticated;
GRANT EXECUTE ON FUNCTION monitoring.check_database_health() TO authenticated;

-- ========================================
-- COMPLETION LOG
-- ========================================

COMMENT ON EXTENSION vector IS 'EasyPick: pgvector extension for AI search functionality';
COMMENT ON EXTENSION pg_trgm IS 'EasyPick: Trigram matching for text similarity';
COMMENT ON EXTENSION pgcrypto IS 'EasyPick: Cryptographic functions for security';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'EasyPick Database Extensions & Configuration initialized successfully';
    RAISE NOTICE 'pgvector version: %', (SELECT default_version FROM pg_available_extensions WHERE name = 'vector');
    RAISE NOTICE 'Korean text search configured: %', CASE WHEN EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN 'YES' ELSE 'NO' END;
END
$$;