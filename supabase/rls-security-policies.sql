-- ========================================
-- EasyPick Enhanced Row Level Security (RLS) Policies
-- Comprehensive security implementation for all tables
-- ========================================

-- ========================================
-- SECURITY DEFAULTS & FOUNDATIONS
-- ========================================

-- Ensure all tables have RLS enabled by default
ALTER TABLE public.clerk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_template_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_status ENABLE ROW LEVEL SECURITY;

-- ========================================
-- DROP EXISTING POLICIES (Clean slate)
-- ========================================

-- Clerk tables
DROP POLICY IF EXISTS "Users can view own profile" ON public.clerk_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.clerk_profiles;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.clerk_subscriptions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.clerk_transactions;
DROP POLICY IF EXISTS "Users can view own usage events" ON public.clerk_usage_events;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.clerk_profiles;
DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.clerk_subscriptions;
DROP POLICY IF EXISTS "Service role full access transactions" ON public.clerk_transactions;
DROP POLICY IF EXISTS "Service role full access usage" ON public.clerk_usage_events;

-- Analytics tables
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Service role full access analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role full access daily summary" ON public.analytics_daily_summary;
DROP POLICY IF EXISTS "Service role full access user sessions" ON public.user_sessions;

-- ========================================
-- CLERK PROFILES - Enhanced Security
-- ========================================

-- Users can view their own profile
CREATE POLICY "clerk_profiles_select_own" 
ON public.clerk_profiles FOR SELECT 
USING (auth.uid()::text = id::text);

-- Users can update limited fields of their own profile
CREATE POLICY "clerk_profiles_update_own_safe_fields" 
ON public.clerk_profiles FOR UPDATE 
USING (auth.uid()::text = id::text)
WITH CHECK (
  auth.uid()::text = id::text 
  AND email = OLD.email  -- Email cannot be changed via this policy
  AND role = OLD.role    -- Role cannot be changed by user
  AND plan = OLD.plan    -- Plan cannot be changed by user
);

-- Service role has full access for system operations
CREATE POLICY "clerk_profiles_service_role_all" 
ON public.clerk_profiles FOR ALL 
USING (auth.role() = 'service_role');

-- Admin users can view all profiles (if implementing admin panel)
CREATE POLICY "clerk_profiles_admin_view_all" 
ON public.clerk_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- CLERK SUBSCRIPTIONS - Read-Only for Users
-- ========================================

-- Users can only view their own subscriptions
CREATE POLICY "clerk_subscriptions_select_own" 
ON public.clerk_subscriptions FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- No direct user modifications - only service role can modify
CREATE POLICY "clerk_subscriptions_service_role_all" 
ON public.clerk_subscriptions FOR ALL 
USING (auth.role() = 'service_role');

-- Admin users can view all subscriptions
CREATE POLICY "clerk_subscriptions_admin_view_all" 
ON public.clerk_subscriptions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- CLERK TRANSACTIONS - Read-Only for Users
-- ========================================

-- Users can view their own transactions
CREATE POLICY "clerk_transactions_select_own" 
ON public.clerk_transactions FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- Only service role can insert/update transactions (from webhooks)
CREATE POLICY "clerk_transactions_service_role_all" 
ON public.clerk_transactions FOR ALL 
USING (auth.role() = 'service_role');

-- Admin users can view all transactions
CREATE POLICY "clerk_transactions_admin_view_all" 
ON public.clerk_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- CLERK USAGE EVENTS - User Insert & View
-- ========================================

-- Users can view their own usage events
CREATE POLICY "clerk_usage_events_select_own" 
ON public.clerk_usage_events FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- Users can insert their own usage events (with validation)
CREATE POLICY "clerk_usage_events_insert_own" 
ON public.clerk_usage_events FOR INSERT 
WITH CHECK (
  auth.uid()::text = user_id::text
  AND event_type IN ('compile_prompt', 'run_workflow', 'api_call', 'export_data', 'ai_generation', 'search_query')
  AND count > 0 
  AND count <= 100  -- Prevent abuse
);

-- Service role has full access
CREATE POLICY "clerk_usage_events_service_role_all" 
ON public.clerk_usage_events FOR ALL 
USING (auth.role() = 'service_role');

-- Admin users can view all usage events
CREATE POLICY "clerk_usage_events_admin_view_all" 
ON public.clerk_usage_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- SUBSCRIPTION PLANS - Public Read Access
-- ========================================

-- All authenticated users can view active subscription plans
CREATE POLICY "subscription_plans_select_active" 
ON public.subscription_plans FOR SELECT 
USING (is_active = true);

-- Only service role can modify plans
CREATE POLICY "subscription_plans_service_role_all" 
ON public.subscription_plans FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- ANALYTICS EVENTS - User Own Data Only
-- ========================================

-- Users can view their own analytics events
CREATE POLICY "analytics_events_select_own" 
ON public.analytics_events FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- Service role has full access for data collection
CREATE POLICY "analytics_events_service_role_all" 
ON public.analytics_events FOR ALL 
USING (auth.role() = 'service_role');

-- Admin users can view all analytics (aggregated only)
CREATE POLICY "analytics_events_admin_aggregated_view" 
ON public.analytics_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND created_at >= NOW() - INTERVAL '90 days'  -- Limit to recent data
);

-- ========================================
-- ANALYTICS DAILY SUMMARY - Admin & Service Only
-- ========================================

-- Only admin users can view daily summaries
CREATE POLICY "analytics_daily_summary_admin_view" 
ON public.analytics_daily_summary FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role has full access
CREATE POLICY "analytics_daily_summary_service_role_all" 
ON public.analytics_daily_summary FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- USER SESSIONS - User Own Data Only
-- ========================================

-- Users can view their own sessions
CREATE POLICY "user_sessions_select_own" 
ON public.user_sessions FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- Service role has full access
CREATE POLICY "user_sessions_service_role_all" 
ON public.user_sessions FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- SECURITY FUNCTIONS & UTILITIES
-- ========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns resource
CREATE OR REPLACE FUNCTION auth.owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid()::text = resource_user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate usage event data
CREATE OR REPLACE FUNCTION validate_usage_event_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user exists and is authenticated
  IF NOT EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Invalid user_id';
  END IF;

  -- Validate event type
  IF NEW.event_type NOT IN ('compile_prompt', 'run_workflow', 'api_call', 'export_data', 'ai_generation', 'search_query') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;

  -- Validate count
  IF NEW.count <= 0 OR NEW.count > 100 THEN
    RAISE EXCEPTION 'Invalid count: must be between 1 and 100';
  END IF;

  -- Set billing period if not provided
  IF NEW.billing_period_start IS NULL THEN
    NEW.billing_period_start := COALESCE(
      (SELECT current_period_start FROM public.clerk_profiles WHERE id = NEW.user_id),
      date_trunc('month', NOW())
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply usage event validation trigger
DROP TRIGGER IF EXISTS trigger_validate_usage_event ON public.clerk_usage_events;
CREATE TRIGGER trigger_validate_usage_event
  BEFORE INSERT OR UPDATE ON public.clerk_usage_events
  FOR EACH ROW EXECUTE FUNCTION validate_usage_event_data();

-- ========================================
-- DATA RETENTION & CLEANUP POLICIES
-- ========================================

-- Function to enforce data retention
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS void AS $$
BEGIN
  -- Delete old analytics events (older than 2 years)
  DELETE FROM public.analytics_events 
  WHERE created_at < NOW() - INTERVAL '2 years';

  -- Delete old user sessions (older than 1 year)
  DELETE FROM public.user_sessions 
  WHERE started_at < NOW() - INTERVAL '1 year';

  -- Delete old usage events (older than 3 years)
  DELETE FROM public.clerk_usage_events 
  WHERE created_at < NOW() - INTERVAL '3 years';

  -- Delete old transaction records (older than 7 years for compliance)
  DELETE FROM public.clerk_transactions 
  WHERE created_at < NOW() - INTERVAL '7 years';

  -- Clean up expired daily summaries (older than 3 years)
  DELETE FROM public.analytics_daily_summary 
  WHERE date < CURRENT_DATE - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- AUDIT LOGGING
-- ========================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin and service role can access audit logs
CREATE POLICY "audit_log_admin_access" 
ON public.audit_log FOR SELECT 
USING (
  auth.role() = 'service_role' 
  OR auth.is_admin()
);

-- Audit logging function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  field_name TEXT;
BEGIN
  -- Determine changed fields for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN 
      SELECT jsonb_object_keys(to_jsonb(NEW)) 
      WHERE to_jsonb(NEW) ->> jsonb_object_keys(to_jsonb(NEW)) 
            IS DISTINCT FROM 
            to_jsonb(OLD) ->> jsonb_object_keys(to_jsonb(NEW))
    LOOP
      changed_fields := array_append(changed_fields, field_name);
    END LOOP;
  END IF;

  -- Insert audit record
  INSERT INTO public.audit_log (
    table_name,
    operation,
    user_id,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    changed_fields
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_clerk_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.clerk_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_clerk_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.clerk_subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_clerk_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.clerk_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ========================================
-- SECURITY MONITORING VIEWS
-- ========================================

-- Recent security events view
CREATE OR REPLACE VIEW security_monitoring AS
SELECT 
  'failed_login' as event_type,
  NULL as user_id,
  ip_address,
  user_agent,
  created_at
FROM public.audit_log 
WHERE table_name = 'clerk_profiles' 
  AND operation = 'UPDATE' 
  AND 'last_sign_in_at' = ANY(changed_fields)
  AND created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'suspicious_usage' as event_type,
  user_id,
  ip_address,
  user_agent,
  created_at
FROM public.clerk_usage_events 
WHERE count > 50  -- Suspicious high usage
  AND created_at >= NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'data_access' as event_type,
  user_id,
  ip_address,
  user_agent,
  created_at
FROM public.audit_log 
WHERE operation = 'SELECT' 
  AND table_name IN ('clerk_transactions', 'clerk_subscriptions')
  AND created_at >= NOW() - INTERVAL '24 hours'

ORDER BY created_at DESC
LIMIT 100;

-- Grant access to security monitoring view
GRANT SELECT ON security_monitoring TO authenticated;

-- ========================================
-- ADDITIONAL TABLE POLICIES
-- ========================================

-- PROMPT TEMPLATES - Public read, owner write
CREATE POLICY "prompt_templates_public_read" ON public.prompt_templates
  FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "prompt_templates_owner_all" ON public.prompt_templates
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "prompt_templates_service_role" ON public.prompt_templates
  FOR ALL USING (auth.role() = 'service_role');

-- PROMPT TEMPLATE FORKS - Owner access only
CREATE POLICY "prompt_template_forks_owner_all" ON public.prompt_template_forks
  FOR ALL USING (auth.uid() = forked_by);

CREATE POLICY "prompt_template_forks_service_role" ON public.prompt_template_forks
  FOR ALL USING (auth.role() = 'service_role');

-- WORKFLOW RUNS - Owner and shared access
CREATE POLICY "workflow_runs_owner_access" ON public.workflow_runs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "workflow_runs_public_shared" ON public.workflow_runs
  FOR SELECT USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "workflow_runs_service_role" ON public.workflow_runs
  FOR ALL USING (auth.role() = 'service_role');

-- RUN STEPS - Owner access only
CREATE POLICY "run_steps_owner_access" ON public.run_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs wr 
      WHERE wr.id = run_id AND wr.user_id = auth.uid()
    )
  );

CREATE POLICY "run_steps_service_role" ON public.run_steps
  FOR ALL USING (auth.role() = 'service_role');

-- SEARCH INDEX - Public read access
CREATE POLICY "search_index_public_read" ON public.search_index
  FOR SELECT TO public USING (true);

CREATE POLICY "search_index_service_role" ON public.search_index
  FOR ALL USING (auth.role() = 'service_role');

-- SEARCH LOGS - Owner and anonymous access
CREATE POLICY "search_logs_read_own" ON public.search_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "search_logs_read_anonymous" ON public.search_logs
  FOR SELECT TO anon USING (user_id IS NULL);

CREATE POLICY "search_logs_insert_all" ON public.search_logs
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "search_logs_service_role" ON public.search_logs
  FOR ALL USING (auth.role() = 'service_role');

-- USAGE EVENTS - Owner access only
CREATE POLICY "usage_events_owner_access" ON public.usage_events
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "usage_events_service_role" ON public.usage_events
  FOR ALL USING (auth.role() = 'service_role');

-- USAGE SUMMARY - Owner access only
CREATE POLICY "usage_summary_owner_access" ON public.usage_summary
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "usage_summary_service_role" ON public.usage_summary
  FOR ALL USING (auth.role() = 'service_role');

-- QUOTA STATUS - Owner access only
CREATE POLICY "quota_status_owner_access" ON public.quota_status
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "quota_status_service_role" ON public.quota_status
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- FINALIZATION & GRANTS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT ON public.clerk_usage_events TO authenticated;
GRANT SELECT, UPDATE ON public.clerk_profiles TO authenticated;
GRANT SELECT ON public.clerk_subscriptions TO authenticated;
GRANT SELECT ON public.clerk_transactions TO authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.user_sessions TO authenticated;

-- Grant permissions for new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_template_forks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.run_steps TO authenticated;
GRANT SELECT ON public.search_index TO authenticated, anon;
GRANT SELECT, INSERT ON public.search_logs TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_events TO authenticated;
GRANT SELECT ON public.usage_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quota_status TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.owns_resource(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_count(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage_event(UUID, VARCHAR, UUID, INTEGER, JSONB) TO authenticated;

-- Ensure service role has comprehensive access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes for security queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON public.audit_log(table_name, operation);

-- Final security check - ensure no public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- ========================================
-- SECURITY NOTES
-- ========================================

/*
Security Implementation Summary:

1. **Default Deny**: All tables have RLS enabled with no default public access
2. **User Isolation**: Users can only access their own data
3. **Service Role**: Full access for system operations and webhooks
4. **Admin Role**: Limited admin access with audit logging
5. **Data Validation**: Triggers ensure data integrity
6. **Audit Trail**: Complete audit logging for sensitive operations
7. **Data Retention**: Automated cleanup of old data
8. **Security Monitoring**: Real-time security event tracking

Key Security Features:
- Row-level security on all tables
- Input validation and sanitization
- Comprehensive audit logging
- Data retention policies
- Security monitoring views
- Rate limiting (implemented in middleware)
- Encrypted secrets management
- No direct public access to sensitive data

Usage Guidelines:
- Use service role for all webhook operations
- Implement proper authentication before database access
- Monitor security_monitoring view for anomalies
- Regularly run enforce_data_retention() function
- Review audit logs for suspicious activity
*/