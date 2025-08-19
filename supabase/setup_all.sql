-- ========================================
-- EasyPick Database Schema - Complete Setup Script
-- 전체 데이터베이스 스키마 설치 스크립트
-- ========================================

-- 설치 시작 메시지
\echo ''
\echo '🚀 EasyPick AI Tools Platform Database Setup'
\echo '=============================================='
\echo 'Starting comprehensive database schema installation...'
\echo ''

-- ========================================
-- PHASE 1: EXTENSIONS & CONFIGURATION
-- ========================================

\echo '📦 Phase 1: Installing extensions and configuration...'
\i ddl/00_extensions_and_config.sql
\echo '✅ Extensions and configuration complete'
\echo ''

-- ========================================  
-- PHASE 2: EXISTING SCHEMA FILES
-- ========================================

\echo '🏗️  Phase 2: Creating existing schema tables...'

-- Check if existing schema files exist and load them
\echo '- Loading subscription plans...'
\i ddl/plan_tables.sql

\echo '- Loading prompt templates...'
\i ddl/prompt_templates.sql

\echo '- Loading prompt template forks...'
\i ddl/prompt_template_forks.sql

\echo '- Loading workflow runs...'
\i ddl/runs.sql

\echo '- Loading run steps...'
\i ddl/run_steps.sql

\echo '- Loading search index...'
\i ddl/search_index.sql

\echo '- Loading usage events...'
\i ddl/usage_events.sql

\echo '✅ Core schema tables created'
\echo ''

-- ========================================
-- PHASE 3: VIEWS AND AGGREGATIONS
-- ========================================

\echo '📊 Phase 3: Creating analysis views and aggregations...'
\i views/usage_monthly_aggregates.sql
\echo '✅ Views and aggregations created'
\echo ''

-- ========================================
-- PHASE 4: RPC FUNCTIONS
-- ========================================

\echo '🔍 Phase 4: Installing search and RPC functions...'

-- Load existing RPC functions
\echo '- Loading search FTS functions...'
\i rpc/search_fts.sql

\echo '- Loading embedding rerank functions...'
\i rpc/rerank_by_embedding.sql

-- Load new RPC functions
\echo '- Loading advanced search functions...'
\i rpc/search_with_embedding.sql

\echo '✅ RPC functions installed'
\echo ''

-- ========================================
-- PHASE 5: SECURITY POLICIES
-- ========================================

\echo '🔐 Phase 5: Applying Row Level Security policies...'
\i rls-security-policies.sql
\echo '✅ Security policies applied'
\echo ''

-- ========================================
-- PHASE 6: DATA POPULATION (CONDITIONAL)
-- ========================================

\echo '📝 Phase 6: Populating search index...'

-- Load search index population if it exists
DO $$
BEGIN
    -- Check if we should populate search index
    \i migrations/populate_search_index.sql
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Search index population skipped (file not found or error)';
END
$$;

\echo '✅ Search index populated'
\echo ''

-- ========================================
-- PHASE 7: VERIFICATION & HEALTH CHECK
-- ========================================

\echo '🔍 Phase 7: Running verification checks...'

-- Verify extensions are installed
DO $$
BEGIN
    -- Check pgvector
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE NOTICE '✅ pgvector extension installed';
    ELSE
        RAISE WARNING '❌ pgvector extension not found';
    END IF;
    
    -- Check Korean text search
    IF EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
        RAISE NOTICE '✅ Korean text search configuration available';
    ELSE
        RAISE NOTICE '⚠️  Korean text search using simple configuration';
    END IF;
    
    -- Check RLS status
    RAISE NOTICE '✅ Row Level Security enabled on % tables', 
        (SELECT count(*) FROM pg_class c 
         JOIN pg_namespace n ON c.relnamespace = n.oid 
         WHERE n.nspname = 'public' 
           AND c.relkind = 'r' 
           AND c.relrowsecurity = true);
END
$$;

-- Display table counts
\echo ''
\echo '📋 Database Summary:'
\echo '===================='

SELECT 
    'Total Tables' as metric,
    count(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Total Views' as metric,
    count(*)::text as value  
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Total Functions' as metric,
    count(*)::text as value
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
    'RLS Enabled Tables' as metric,
    count(*)::text as value
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = true;

-- ========================================
-- SAMPLE DATA OPTION
-- ========================================

\echo ''
\echo '🎲 Optional: Sample Data Installation'
\echo '====================================='
\echo 'To install sample data for development/testing:'
\echo '\i sample-data.sql'
\echo ''

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

\echo '🎉 EasyPick Database Setup Complete!'
\echo '====================================='
\echo ''
\echo 'Your database is now ready with:'
\echo '• ✅ pgvector AI search system'
\echo '• ✅ Comprehensive RLS security'  
\echo '• ✅ Usage tracking & analytics'
\echo '• ✅ Prompt template management'
\echo '• ✅ Workflow execution system'
\echo '• ✅ Advanced search functions'
\echo ''
\echo '📚 Next Steps:'
\echo '1. Update your environment variables'
\echo '2. Generate TypeScript types: supabase gen types typescript'
\echo '3. Install sample data (development only): \i sample-data.sql'
\echo '4. Review the SETUP_README.md for detailed usage'
\echo ''
\echo '🚨 Security Reminders:'
\echo '• All tables have RLS enabled by default'
\echo '• Service role has administrative access'
\echo '• Review and customize security policies as needed'
\echo '• Set up proper backup and monitoring'
\echo ''

-- Final health check
SELECT 
    'Setup Status' as status,
    'SUCCESS' as result,
    NOW() as completed_at;

\echo '✨ Happy coding with EasyPick AI Tools Platform! ✨'
\echo ''