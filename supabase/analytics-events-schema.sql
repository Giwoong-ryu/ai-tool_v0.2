-- ========================================
-- EasyPick Analytics Events Schema
-- GA4 Integration and Event Tracking
-- ========================================

-- Analytics events table for comprehensive event tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(100) NOT NULL,
  client_id VARCHAR(100), -- GA4 client ID for correlation
  
  -- Event metadata
  event_data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  page_title TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Tracking parameters
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  
  -- Geographic data
  ip_address INET,
  country_code VARCHAR(2),
  city VARCHAR(100),
  
  -- Technical metadata
  screen_resolution VARCHAR(20),
  viewport_size VARCHAR(20),
  device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser_name VARCHAR(50),
  browser_version VARCHAR(20),
  os_name VARCHAR(50),
  os_version VARCHAR(20),
  
  -- Processing status
  ga4_sent BOOLEAN DEFAULT FALSE,
  ga4_sent_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  
  -- Timestamps
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional indexes will be created below
  CONSTRAINT check_event_name_format CHECK (event_name ~ '^[a-z0-9_]+$')
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Core query indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event ON public.analytics_events(user_id, event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_event ON public.analytics_events(session_id, event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_daily ON public.analytics_events(DATE(event_timestamp), event_name);

-- GA4 processing indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_ga4_pending ON public.analytics_events(ga4_sent, created_at) WHERE ga4_sent = FALSE;

-- JSONB indexes for event data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_data_gin ON public.analytics_events USING gin(event_data);

-- UTM tracking indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_source ON public.analytics_events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_campaign ON public.analytics_events(utm_campaign) WHERE utm_campaign IS NOT NULL;

-- ========================================
-- ANALYTICS AGGREGATION TABLES
-- ========================================

-- Daily event aggregations for performance
CREATE TABLE IF NOT EXISTS public.analytics_daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  event_name VARCHAR(50) NOT NULL,
  user_count INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  unique_users UUID[] DEFAULT '{}',
  unique_sessions VARCHAR(100)[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date, event_name)
);

-- Indexes for daily summary
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_event ON public.analytics_daily_summary(event_name);

-- User session analytics
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  
  -- Session metadata
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  
  -- Entry and exit pages
  landing_page TEXT,
  exit_page TEXT,
  
  -- Traffic source
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer TEXT,
  
  -- Geographic and technical data
  ip_address INET,
  country_code VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser_name VARCHAR(50),
  os_name VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON public.user_sessions(duration_seconds DESC);

-- ========================================
-- FUNCTIONS FOR ANALYTICS
-- ========================================

-- Function to update session data
CREATE OR REPLACE FUNCTION update_user_session(
  p_session_id VARCHAR(100),
  p_user_id UUID DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_utm_source VARCHAR(100) DEFAULT NULL,
  p_utm_medium VARCHAR(100) DEFAULT NULL,
  p_utm_campaign VARCHAR(100) DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_device_type VARCHAR(20) DEFAULT NULL,
  p_browser_name VARCHAR(50) DEFAULT NULL,
  p_os_name VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  -- Insert or update session
  INSERT INTO public.user_sessions (
    session_id,
    user_id,
    started_at,
    landing_page,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer,
    ip_address,
    device_type,
    browser_name,
    os_name
  ) VALUES (
    p_session_id,
    p_user_id,
    NOW(),
    p_page_url,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_referrer,
    p_ip_address,
    p_device_type,
    p_browser_name,
    p_os_name
  )
  ON CONFLICT (session_id) DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
    ended_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - user_sessions.started_at)),
    exit_page = COALESCE(p_page_url, user_sessions.exit_page),
    updated_at = NOW()
  RETURNING id INTO session_uuid;
  
  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment session counters
CREATE OR REPLACE FUNCTION increment_session_counters(
  p_session_id VARCHAR(100),
  p_is_page_view BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_sessions 
  SET 
    events_count = events_count + 1,
    page_views = CASE WHEN p_is_page_view THEN page_views + 1 ELSE page_views END,
    updated_at = NOW()
  WHERE session_id = p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_event_name VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  event_name VARCHAR(50),
  user_count BIGINT,
  session_count BIGINT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ae.event_timestamp) as date,
    ae.event_name,
    COUNT(DISTINCT ae.user_id) as user_count,
    COUNT(DISTINCT ae.session_id) as session_count,
    COUNT(*) as event_count
  FROM public.analytics_events ae
  WHERE DATE(ae.event_timestamp) BETWEEN p_start_date AND p_end_date
    AND (p_event_name IS NULL OR ae.event_name = p_event_name)
  GROUP BY DATE(ae.event_timestamp), ae.event_name
  ORDER BY date DESC, event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR AUTOMATION
-- ========================================

-- Trigger to update session data when events are inserted
CREATE OR REPLACE FUNCTION trigger_update_session_from_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session counters
  PERFORM increment_session_counters(
    NEW.session_id,
    NEW.event_name = 'page_view'
  );
  
  -- Update session with new data
  PERFORM update_user_session(
    NEW.session_id,
    NEW.user_id,
    NEW.page_url,
    NEW.utm_source,
    NEW.utm_medium,
    NEW.utm_campaign,
    NEW.referrer,
    NEW.ip_address,
    NEW.device_type,
    NEW.browser_name,
    NEW.os_name
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analytics_events_update_session
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION trigger_update_session_from_event();

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- Real-time analytics dashboard view
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT 
  'today' as period,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) as sessions_with_pageviews,
  AVG(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as avg_pageviews_per_session
FROM public.analytics_events 
WHERE event_timestamp >= CURRENT_DATE

UNION ALL

SELECT 
  'yesterday' as period,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) as sessions_with_pageviews,
  AVG(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as avg_pageviews_per_session
FROM public.analytics_events 
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '1 day'
  AND event_timestamp < CURRENT_DATE

UNION ALL

SELECT 
  'last_7_days' as period,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) as sessions_with_pageviews,
  AVG(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as avg_pageviews_per_session
FROM public.analytics_events 
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- Top events view
CREATE OR REPLACE VIEW top_events_today AS
SELECT 
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events 
WHERE event_timestamp >= CURRENT_DATE
GROUP BY event_name
ORDER BY event_count DESC
LIMIT 20;

-- User activity view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  cp.id as user_id,
  cp.email,
  cp.role,
  COUNT(ae.id) as total_events,
  COUNT(DISTINCT ae.session_id) as total_sessions,
  MAX(ae.event_timestamp) as last_activity,
  COUNT(CASE WHEN ae.event_timestamp >= CURRENT_DATE THEN 1 END) as events_today
FROM public.clerk_profiles cp
LEFT JOIN public.analytics_events ae ON cp.id = ae.user_id
WHERE ae.event_timestamp >= CURRENT_DATE - INTERVAL '30 days' OR ae.id IS NULL
GROUP BY cp.id, cp.email, cp.role
ORDER BY total_events DESC;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own analytics data
CREATE POLICY "Users can view own analytics events" ON public.analytics_events
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role has full access for analytics processing
CREATE POLICY "Service role full access analytics events" ON public.analytics_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access daily summary" ON public.analytics_daily_summary
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access user sessions" ON public.user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant access to authenticated users for their own data
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.user_sessions TO authenticated;
GRANT SELECT ON analytics_dashboard TO authenticated;
GRANT SELECT ON top_events_today TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION get_analytics_summary TO authenticated;

-- Service role gets full access
GRANT ALL ON public.analytics_events TO service_role;
GRANT ALL ON public.analytics_daily_summary TO service_role;
GRANT ALL ON public.user_sessions TO service_role;
GRANT EXECUTE ON FUNCTION update_user_session TO service_role;
GRANT EXECUTE ON FUNCTION increment_session_counters TO service_role;
GRANT EXECUTE ON FUNCTION get_analytics_summary TO service_role;

-- ========================================
-- DATA RETENTION AND CLEANUP
-- ========================================

-- Function to cleanup old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old events
  DELETE FROM public.analytics_events 
  WHERE event_timestamp < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old sessions
  DELETE FROM public.user_sessions 
  WHERE started_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  -- Delete old daily summaries
  DELETE FROM public.analytics_daily_summary 
  WHERE date < CURRENT_DATE - (retention_days || ' days')::INTERVAL;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA (for testing)
-- ========================================

-- Insert sample analytics events (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.analytics_events LIMIT 1) THEN
    INSERT INTO public.analytics_events (
      event_name,
      session_id,
      event_data,
      page_url,
      page_title,
      event_timestamp
    ) VALUES 
      ('page_view', 'sample_session_1', '{"page": "home"}', 'https://easypick.ai/', 'EasyPick - Home', NOW() - INTERVAL '1 hour'),
      ('select_template', 'sample_session_1', '{"template_id": "marketing_001", "template_type": "marketing"}', 'https://easypick.ai/prompts', 'Prompts', NOW() - INTERVAL '50 minutes'),
      ('compile_prompt', 'sample_session_1', '{"prompt_length": 150, "model_type": "gpt-4"}', 'https://easypick.ai/prompts', 'Prompts', NOW() - INTERVAL '45 minutes'),
      ('page_view', 'sample_session_2', '{"page": "tools"}', 'https://easypick.ai/tools', 'AI Tools', NOW() - INTERVAL '30 minutes'),
      ('start_workflow', 'sample_session_2', '{"workflow_id": "content_creation", "step_count": 5}', 'https://easypick.ai/workflows', 'Workflows', NOW() - INTERVAL '25 minutes');
  END IF;
END $$;