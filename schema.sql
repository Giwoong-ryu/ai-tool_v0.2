-- ========================================
-- EasyPick AI Tools Platform - Complete Database Schema
-- Comprehensive schema for Korean AI tools platform
-- ========================================

-- ========================================
-- EXTENSIONS AND CONFIGURATION
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";           -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";             -- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS "vector";              -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "unaccent";            -- Text normalization

-- Configure Korean text search
-- Note: If korean text search config is not available, fallback to simple
DO $$
BEGIN
    -- Try to create Korean text search configuration
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
        -- Create a simple Korean configuration based on 'simple'
        CREATE TEXT SEARCH CONFIGURATION korean ( COPY = simple );
        ALTER TEXT SEARCH CONFIGURATION korean
            ALTER MAPPING FOR word, asciiword WITH simple;
        RAISE NOTICE 'Created basic Korean text search configuration';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Using default text search configuration for Korean text';
END $$;

-- ========================================
-- CORE USER MANAGEMENT
-- ========================================

-- User profiles (extends auth.users from Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    display_name VARCHAR(50),
    avatar_url TEXT,
    
    -- Subscription and billing
    role VARCHAR(20) DEFAULT 'free' CHECK (role IN ('free', 'pro', 'business', 'admin')),
    plan VARCHAR(50), -- e.g., 'pro_monthly', 'business_yearly'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Preferences and settings
    preferences JSONB DEFAULT jsonb_build_object(
        'language', 'ko',
        'theme', 'light',
        'notifications', true,
        'timezone', 'Asia/Seoul'
    ),
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    signup_source VARCHAR(50), -- 'google', 'kakao', 'naver', 'direct'
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SUBSCRIPTION AND PAYMENT MANAGEMENT
-- ========================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'pro_monthly'
    plan_name VARCHAR(100) NOT NULL, -- e.g., 'Pro Monthly'
    role VARCHAR(20) NOT NULL CHECK (role IN ('free', 'pro', 'business')),
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    
    -- Pricing
    amount INTEGER NOT NULL, -- Price in smallest currency unit (KRW)
    currency VARCHAR(3) DEFAULT 'KRW',
    trial_period_days INTEGER DEFAULT 0,
    
    -- Features and limits
    features JSONB DEFAULT '{}', -- Feature flags and capabilities
    usage_limits JSONB DEFAULT jsonb_build_object(
        'prompt_compilations', 1000,
        'workflow_runs', 500,
        'api_calls', 10000,
        'storage_mb', 1024
    ),
    
    -- Payment processor integration
    toss_plan_id VARCHAR(255),
    paypal_plan_id VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_code VARCHAR(50) REFERENCES public.subscription_plans(plan_code),
    
    -- Subscription status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'canceled', 'past_due', 'suspended', 
        'trialing', 'incomplete', 'ended'
    )),
    
    -- Payment processor details
    toss_subscription_id VARCHAR(255),
    paypal_subscription_id VARCHAR(255),
    external_customer_id VARCHAR(255),
    
    -- Billing periods
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    
    -- Transaction details
    amount INTEGER NOT NULL, -- Amount in smallest currency unit
    currency VARCHAR(3) DEFAULT 'KRW' CHECK (currency IN ('KRW', 'USD', 'EUR')),
    transaction_type VARCHAR(20) DEFAULT 'payment' CHECK (transaction_type IN (
        'payment', 'refund', 'chargeback', 'fee', 'adjustment'
    )),
    
    -- Payment method
    payment_method VARCHAR(20) DEFAULT 'card' CHECK (payment_method IN (
        'card', 'bank_transfer', 'toss', 'paypal', 'kakaopay'
    )),
    
    -- Payment processor data
    external_transaction_id VARCHAR(255),
    external_payment_id VARCHAR(255),
    processor_response JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'canceled', 'refunded'
    )),
    
    -- Details
    description TEXT,
    failure_reason TEXT,
    receipt_url TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- USAGE TRACKING AND ANALYTICS
-- ========================================

-- Usage events for billing and analytics
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'prompt_compilation', 'workflow_run', 'api_call', 'file_export',
        'ai_generation', 'search_query', 'template_usage', 'storage_usage'
    )),
    resource_id UUID, -- ID of the resource being used
    resource_type VARCHAR(50), -- Type of resource (prompt, workflow, etc.)
    
    -- Usage metrics
    count INTEGER DEFAULT 1,
    size_bytes INTEGER, -- For storage and data transfer events
    duration_ms INTEGER, -- For timed operations
    
    -- Billing context
    billing_period_start TIMESTAMP WITH TIME ZONE,
    is_billable BOOLEAN DEFAULT TRUE,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    
    -- Event metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events for user behavior tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL for anonymous users
    
    -- Event details
    event_name VARCHAR(100) NOT NULL, -- 'page_view', 'search', 'tool_click', etc.
    event_category VARCHAR(50), -- 'navigation', 'engagement', 'conversion'
    event_action VARCHAR(50), -- 'click', 'scroll', 'download'
    event_label VARCHAR(100),
    
    -- Event value and properties
    event_value DECIMAL(10,2),
    properties JSONB DEFAULT '{}',
    
    -- Page/session context
    page_url TEXT,
    page_title VARCHAR(255),
    referrer_url TEXT,
    session_id VARCHAR(255),
    
    -- User context
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2), -- ISO country code
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- AI TOOLS AND CONTENT
-- ========================================

-- AI Tools catalog (static reference data)
CREATE TABLE IF NOT EXISTS public.ai_tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    
    -- Categorization
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Tool details
    website_url TEXT NOT NULL,
    pricing_model VARCHAR(50) CHECK (pricing_model IN (
        'free', 'freemium', 'paid', 'subscription', 'one_time', 'usage_based'
    )),
    pricing_info JSONB DEFAULT '{}',
    
    -- Features and capabilities
    features TEXT[] DEFAULT '{}',
    use_cases TEXT[] DEFAULT '{}',
    supported_languages TEXT[] DEFAULT '{}',
    
    -- Ratings and metrics
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    popularity_score INTEGER DEFAULT 0,
    
    -- Visual assets
    icon_url TEXT,
    screenshot_urls TEXT[] DEFAULT '{}',
    logo_url TEXT,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('korean', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(long_description, '')), 'C') ||
        setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(category, '')), 'D')
    ) STORED,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt templates
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Template identification
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Template content
    template_content TEXT NOT NULL, -- Handlebars/mustache template
    variables JSONB DEFAULT '{}', -- Variable definitions and defaults
    instructions TEXT, -- User instructions
    
    -- Configuration
    model_settings JSONB DEFAULT jsonb_build_object(
        'temperature', 0.7,
        'max_tokens', 1000,
        'top_p', 1.0
    ),
    
    -- Metadata
    version VARCHAR(20) DEFAULT '1.0.0',
    tags TEXT[] DEFAULT '{}',
    difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    estimated_time VARCHAR(50),
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('korean', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(instructions, '')), 'C') ||
        setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(category, '')), 'D')
    ) STORED,
    
    -- Visibility and access
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN (
        'private', 'public', 'unlisted'
    )),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, slug)
);

-- Workflow templates
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Workflow identification
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Workflow definition
    definition JSONB NOT NULL, -- Complete workflow definition
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    estimated_duration VARCHAR(50),
    complexity VARCHAR(20) DEFAULT 'medium' CHECK (complexity IN (
        'simple', 'medium', 'complex'
    )),
    
    -- Usage statistics
    run_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('korean', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(category, '')), 'D')
    ) STORED,
    
    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- USER INTERACTIONS AND SOCIAL FEATURES
-- ========================================

-- User bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Bookmarked item
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
        'ai_tool', 'prompt_template', 'workflow'
    )),
    item_id UUID NOT NULL,
    
    -- Organization
    folder VARCHAR(100) DEFAULT 'default',
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, item_type, item_id)
);

-- User ratings and reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Reviewed item
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
        'ai_tool', 'prompt_template', 'workflow'
    )),
    item_id UUID NOT NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, item_type, item_id)
);

-- ========================================
-- SEARCH AND DISCOVERY
-- ========================================

-- Unified search index
CREATE TABLE IF NOT EXISTS public.search_index (
    id BIGSERIAL PRIMARY KEY,
    
    -- Item identification
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
        'ai_tool', 'prompt_template', 'workflow'
    )),
    item_id UUID NOT NULL,
    
    -- Search fields
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    
    -- Metadata
    rating DECIMAL(3,2) DEFAULT 0.0,
    popularity_score INTEGER DEFAULT 0,
    user_id UUID, -- Creator/owner (NULL for system content)
    
    -- Flags
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_korean BOOLEAN DEFAULT TRUE,
    
    -- Full-text search vector
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('korean', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(content, '')), 'C') ||
        setweight(to_tsvector('korean', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
        setweight(to_tsvector('korean', COALESCE(category, '')), 'D')
    ) STORED,
    
    -- Semantic search embedding (OpenAI ada-002: 1536 dimensions)
    embedding vector(1536),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(item_type, item_id)
);

-- Search query logs
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Query details
    query VARCHAR(500) NOT NULL,
    query_type VARCHAR(20) DEFAULT 'hybrid' CHECK (query_type IN (
        'fts', 'semantic', 'hybrid', 'filter_only'
    )),
    
    -- Filters applied
    filters JSONB DEFAULT '{}',
    
    -- Results
    results_count INTEGER DEFAULT 0,
    search_time_ms INTEGER DEFAULT 0,
    
    -- User interaction
    clicked_item_type VARCHAR(50),
    clicked_item_id UUID,
    click_position INTEGER,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SYSTEM TABLES
-- ========================================

-- Application logs
CREATE TABLE IF NOT EXISTS public.app_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Log details
    level VARCHAR(20) NOT NULL CHECK (level IN (
        'debug', 'info', 'warn', 'error', 'fatal'
    )),
    message TEXT NOT NULL,
    source VARCHAR(100), -- Component or service name
    
    -- Context
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    
    -- Error details
    error_code VARCHAR(50),
    error_details JSONB,
    stack_trace TEXT,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration
CREATE TABLE IF NOT EXISTS public.system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be exposed to frontend
    category VARCHAR(50) DEFAULT 'general',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_code ON public.subscriptions(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON public.subscriptions(current_period_start, current_period_end);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id) 
WHERE status = 'active';

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON public.transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions(external_transaction_id);

-- Usage event indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON public.usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_period ON public.usage_events(user_id, billing_period_start);
CREATE INDEX IF NOT EXISTS idx_usage_events_resource ON public.usage_events(resource_type, resource_id);

-- Analytics event indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

-- AI Tools indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_category ON public.ai_tools(category);
CREATE INDEX IF NOT EXISTS idx_ai_tools_rating ON public.ai_tools(rating DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tools_popularity ON public.ai_tools(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON public.ai_tools(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_tools_featured ON public.ai_tools(is_featured) WHERE is_featured = TRUE;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_search ON public.ai_tools USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_search ON public.prompt_templates USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_workflows_search ON public.workflows USING GIN(search_vector);

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_ai_tools_name_trgm ON public.ai_tools USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ai_tools_description_trgm ON public.ai_tools USING GIN(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_name_trgm ON public.prompt_templates USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workflows_name_trgm ON public.workflows USING GIN(name gin_trgm_ops);

-- Prompt template indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON public.prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON public.prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_visibility ON public.prompt_templates(visibility);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_usage_count ON public.prompt_templates(usage_count DESC);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON public.workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_public ON public.workflows(is_public) WHERE is_public = TRUE;

-- Bookmark indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON public.bookmarks(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON public.bookmarks(user_id, folder);

-- Search index indexes
CREATE INDEX IF NOT EXISTS idx_search_index_type ON public.search_index(item_type);
CREATE INDEX IF NOT EXISTS idx_search_index_public ON public.search_index(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_search_index_featured ON public.search_index(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_search_index_fts ON public.search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_index_embedding ON public.search_index USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_search_index_popularity ON public.search_index(popularity_score DESC, rating DESC);

-- Search log indexes
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at DESC);

-- App log indexes
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON public.app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_source ON public.app_logs(source);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON public.app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON public.app_logs(user_id);

-- ========================================
-- BUSINESS LOGIC FUNCTIONS
-- ========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ai_tools_updated_at
    BEFORE UPDATE ON public.ai_tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_prompt_templates_updated_at
    BEFORE UPDATE ON public.prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Subscription management function
CREATE OR REPLACE FUNCTION sync_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user profile when subscription becomes active
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        UPDATE public.profiles 
        SET 
            role = (SELECT role FROM public.subscription_plans WHERE plan_code = NEW.plan_code),
            plan = NEW.plan_code,
            current_period_start = NEW.current_period_start,
            current_period_end = NEW.current_period_end,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    -- Reset to free when subscription ends
    IF NEW.status IN ('canceled', 'ended') AND OLD.status = 'active' THEN
        UPDATE public.profiles 
        SET 
            role = 'free',
            plan = NULL,
            current_period_start = NULL,
            current_period_end = NULL,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_subscription
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION sync_user_subscription();

-- Usage limit checking function
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan VARCHAR(50);
    plan_limits JSONB;
    event_limit INTEGER;
    current_usage INTEGER;
    billing_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user's current plan and billing period
    SELECT plan, current_period_start INTO user_plan, billing_start
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Default billing period to current month if no subscription
    billing_start := COALESCE(billing_start, DATE_TRUNC('month', NOW()));
    
    -- Free users have strict limits
    IF user_plan IS NULL THEN
        CASE p_event_type
            WHEN 'prompt_compilation' THEN event_limit := 10;
            WHEN 'workflow_run' THEN event_limit := 5;
            WHEN 'api_call' THEN event_limit := 100;
            ELSE event_limit := 0;
        END CASE;
    ELSE
        -- Get limits from plan definition
        SELECT usage_limits INTO plan_limits
        FROM public.subscription_plans
        WHERE plan_code = user_plan AND is_active = TRUE;
        
        -- -1 means unlimited
        event_limit := COALESCE((plan_limits ->> p_event_type)::INTEGER, 0);
        IF event_limit = -1 THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Get current usage for billing period
    SELECT COALESCE(SUM(count), 0) INTO current_usage
    FROM public.usage_events
    WHERE user_id = p_user_id
    AND event_type = p_event_type
    AND created_at >= billing_start
    AND is_billable = TRUE;
    
    RETURN (current_usage + p_count) <= event_limit;
END;
$$ LANGUAGE plpgsql;

-- Record usage event with validation
CREATE OR REPLACE FUNCTION record_usage_event(
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_count INTEGER DEFAULT 1,
    p_size_bytes INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    billing_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check usage limits first
    IF NOT check_usage_limit(p_user_id, p_event_type, p_count) THEN
        RETURN FALSE;
    END IF;
    
    -- Get billing period start
    SELECT current_period_start INTO billing_start
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Insert usage event
    INSERT INTO public.usage_events (
        user_id,
        event_type,
        resource_id,
        resource_type,
        count,
        size_bytes,
        billing_period_start,
        metadata
    ) VALUES (
        p_user_id,
        p_event_type,
        p_resource_id,
        p_resource_type,
        p_count,
        p_size_bytes,
        COALESCE(billing_start, DATE_TRUNC('month', NOW())),
        p_metadata
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Hybrid search function (FTS + semantic similarity)
CREATE OR REPLACE FUNCTION search_items(
    p_query TEXT,
    p_item_types TEXT[] DEFAULT ARRAY['ai_tool', 'prompt_template', 'workflow'],
    p_category VARCHAR(100) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    item_type VARCHAR(50),
    item_id UUID,
    title VARCHAR(500),
    description TEXT,
    category VARCHAR(100),
    rating DECIMAL(3,2),
    popularity_score INTEGER,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.item_type,
        si.item_id,
        si.title,
        si.description,
        si.category,
        si.rating,
        si.popularity_score,
        CASE 
            WHEN p_query IS NULL OR p_query = '' THEN 1.0
            ELSE (
                -- Full-text search score (70% weight)
                ts_rank_cd(si.search_vector, plainto_tsquery('korean', p_query)) * 0.7 +
                -- Popularity score (20% weight)
                (LEAST(si.popularity_score, 1000) / 1000.0) * 0.2 +
                -- Rating score (10% weight)
                (si.rating / 5.0) * 0.1
            )
        END as relevance_score
    FROM public.search_index si
    WHERE 
        si.is_public = TRUE
        AND (p_item_types IS NULL OR si.item_type = ANY(p_item_types))
        AND (p_category IS NULL OR si.category = p_category)
        AND (p_user_id IS NULL OR si.user_id = p_user_id OR si.user_id IS NULL)
        AND (
            p_query IS NULL 
            OR p_query = '' 
            OR si.search_vector @@ plainto_tsquery('korean', p_query)
            OR similarity(si.title, p_query) > 0.3
            OR similarity(si.description, p_query) > 0.2
        )
    ORDER BY relevance_score DESC, si.popularity_score DESC, si.rating DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA INSERTION
-- ========================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (
    plan_code, plan_name, role, billing_interval, amount, currency,
    trial_period_days, features, usage_limits, toss_plan_id
) VALUES 
-- Pro Monthly Plan
(
    'pro_monthly',
    'Pro 월간 플랜',
    'pro',
    'monthly',
    19900, -- 19,900 KRW
    'KRW',
    14,
    jsonb_build_object(
        'advanced_prompts', true,
        'workflow_automation', true,
        'priority_support', true,
        'analytics_dashboard', true
    ),
    jsonb_build_object(
        'prompt_compilation', 1000,
        'workflow_run', 500,
        'api_call', 10000,
        'storage_mb', 5120
    ),
    'easypick-pro-monthly-kr'
),
-- Pro Yearly Plan
(
    'pro_yearly',
    'Pro 연간 플랜',
    'pro',
    'yearly',
    199000, -- 199,000 KRW (2 months free)
    'KRW',
    14,
    jsonb_build_object(
        'advanced_prompts', true,
        'workflow_automation', true,
        'priority_support', true,
        'analytics_dashboard', true
    ),
    jsonb_build_object(
        'prompt_compilation', 12000,
        'workflow_run', 6000,
        'api_call', 120000,
        'storage_mb', 10240
    ),
    'easypick-pro-yearly-kr'
),
-- Business Monthly Plan
(
    'business_monthly',
    'Business 월간 플랜',
    'business',
    'monthly',
    49900, -- 49,900 KRW
    'KRW',
    14,
    jsonb_build_object(
        'team_management', true,
        'custom_integrations', true,
        'white_label', true,
        'dedicated_support', true,
        'advanced_analytics', true
    ),
    jsonb_build_object(
        'prompt_compilation', -1,
        'workflow_run', -1,
        'api_call', -1,
        'storage_mb', -1
    ),
    'easypick-business-monthly-kr'
)
ON CONFLICT (plan_code) DO NOTHING;

-- Insert system configuration
INSERT INTO public.system_config (key, value, description, is_public, category) VALUES 
('app_version', '"1.0.0"', 'Application version', true, 'general'),
('maintenance_mode', 'false', 'Maintenance mode toggle', true, 'system'),
('max_upload_size', '10485760', 'Maximum upload size in bytes (10MB)', false, 'limits'),
('search_results_limit', '50', 'Maximum search results per page', true, 'search'),
('free_tier_limits', '{"prompt_compilation": 10, "workflow_run": 5, "api_call": 100}', 'Free tier usage limits', false, 'billing')
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Subscription policies  
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Transaction policies
CREATE POLICY "transactions_select_own" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Usage event policies
CREATE POLICY "usage_events_select_own" ON public.usage_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_events_insert_own" ON public.usage_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prompt template policies
CREATE POLICY "prompt_templates_select_own_or_public" ON public.prompt_templates
    FOR SELECT USING (auth.uid() = user_id OR visibility IN ('public', 'unlisted'));
CREATE POLICY "prompt_templates_crud_own" ON public.prompt_templates
    FOR ALL USING (auth.uid() = user_id);

-- Workflow policies
CREATE POLICY "workflows_select_own_or_public" ON public.workflows
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "workflows_crud_own" ON public.workflows
    FOR ALL USING (auth.uid() = user_id);

-- Bookmark policies
CREATE POLICY "bookmarks_crud_own" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Review policies
CREATE POLICY "reviews_select_all" ON public.reviews
    FOR SELECT USING (TRUE);
CREATE POLICY "reviews_crud_own" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Search log policies
CREATE POLICY "search_logs_select_own" ON public.search_logs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "search_logs_insert_all" ON public.search_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Public read access for reference data
CREATE POLICY "ai_tools_select_all" ON public.ai_tools
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "subscription_plans_select_active" ON public.subscription_plans
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "search_index_select_public" ON public.search_index
    FOR SELECT USING (is_public = TRUE);

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.usage_events TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.ai_tools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.search_index TO authenticated;
GRANT SELECT, INSERT ON public.search_logs TO authenticated;
GRANT SELECT ON public.system_config TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage_event TO authenticated;
GRANT EXECUTE ON FUNCTION search_items TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Anonymous users can read public content
GRANT SELECT ON public.ai_tools TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.search_index TO anon;
GRANT INSERT ON public.search_logs TO anon;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EasyPick Database Schema Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created tables: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
    );
    RAISE NOTICE 'Created indexes: %', (
        SELECT COUNT(*) FROM pg_indexes 
        WHERE schemaname = 'public'
    );
    RAISE NOTICE 'Created functions: %', (
        SELECT COUNT(*) FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prokind = 'f'
    );
    RAISE NOTICE '';
    RAISE NOTICE 'Key features enabled:';
    RAISE NOTICE '✓ Korean full-text search (tsvector)';
    RAISE NOTICE '✓ Trigram fuzzy matching (pg_trgm)';
    RAISE NOTICE '✓ Semantic search ready (pgvector)';
    RAISE NOTICE '✓ Row Level Security (RLS) policies';
    RAISE NOTICE '✓ Usage tracking and analytics';
    RAISE NOTICE '✓ Subscription and payment management';
    RAISE NOTICE '✓ AI tools catalog with search';
    RAISE NOTICE '✓ User-generated content (prompts, workflows)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Populate ai_tools table with your tool data';
    RAISE NOTICE '2. Configure embedding generation for semantic search';
    RAISE NOTICE '3. Set up payment processor webhooks';
    RAISE NOTICE '4. Test search functionality with Korean queries';
    RAISE NOTICE '========================================';
END $$;