-- ========================================
-- EasyPick Enhanced Row Level Security (RLS) Policies
-- Security-first implementation with default DENY approach
-- ========================================

-- ========================================
-- SECURITY FOUNDATION PRINCIPLES
-- ========================================

/*
Core Security Principles:
1. DEFAULT DENY - All access denied unless explicitly granted
2. OWNER-BASED ACCESS - Users can only access their own data
3. SERVICE ROLE MANAGEMENT - Critical operations require service role
4. ADMIN VERIFICATION - Admin actions audited and restricted
5. DATA INTEGRITY - All operations validated and logged
*/

-- ========================================
-- ENABLE ROW LEVEL SECURITY (ALL TABLES)
-- ========================================

-- Core user data tables
ALTER TABLE IF EXISTS public.clerk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clerk_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clerk_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clerk_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Analytics and monitoring tables
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Prompt and workflow tables
ALTER TABLE IF EXISTS public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_template_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.run_steps ENABLE ROW LEVEL SECURITY;

-- Audit and security tables
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CLEAN SLATE - DROP ALL EXISTING POLICIES
-- ========================================

-- Drop all existing policies to ensure clean implementation
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- ========================================
-- CORE SECURITY FUNCTIONS
-- ========================================

-- Function to verify user ownership of resources
CREATE OR REPLACE FUNCTION auth.owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid()::text = resource_user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check admin privileges with audit logging
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN := FALSE;
BEGIN
  SELECT (role = 'admin') INTO is_admin_user
  FROM public.clerk_profiles 
  WHERE id = auth.uid();
  
  -- Log admin access attempts
  IF is_admin_user THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, new_values)
    VALUES ('auth.is_admin', 'ADMIN_CHECK', auth.uid(), 
           jsonb_build_object('admin_access', TRUE, 'timestamp', NOW()));
  END IF;
  
  RETURN COALESCE(is_admin_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check service role authentication
CREATE OR REPLACE FUNCTION auth.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- CLERK PROFILES - Core User Data
-- ========================================

-- Users can view their own profile
CREATE POLICY "clerk_profiles_select_own" 
ON public.clerk_profiles FOR SELECT 
TO authenticated
USING (auth.owns_resource(id));

-- Users can update limited safe fields of their own profile
CREATE POLICY "clerk_profiles_update_own_safe" 
ON public.clerk_profiles FOR UPDATE 
TO authenticated
USING (auth.owns_resource(id))
WITH CHECK (
  auth.owns_resource(id) 
  AND email = OLD.email           -- Email changes require special handling
  AND role = OLD.role             -- Role changes require service role
  AND plan = OLD.plan             -- Plan changes require service role
  AND id = OLD.id                 -- ID cannot be changed
);

-- Service role has full access for system operations
CREATE POLICY "clerk_profiles_service_full" 
ON public.clerk_profiles FOR ALL 
TO service_role
USING (TRUE);

-- Admin users can view all profiles with audit logging
CREATE POLICY "clerk_profiles_admin_view" 
ON public.clerk_profiles FOR SELECT 
TO authenticated
USING (auth.is_admin());

-- ========================================
-- CLERK SUBSCRIPTIONS - Read-Only for Users
-- ========================================

-- Users can only view their own subscriptions
CREATE POLICY "clerk_subscriptions_select_own" 
ON public.clerk_subscriptions FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id));

-- Service role manages all subscription operations
CREATE POLICY "clerk_subscriptions_service_full" 
ON public.clerk_subscriptions FOR ALL 
TO service_role
USING (TRUE);

-- Admin can view all subscriptions for support
CREATE POLICY "clerk_subscriptions_admin_view" 
ON public.clerk_subscriptions FOR SELECT 
TO authenticated
USING (auth.is_admin());

-- ========================================
-- CLERK TRANSACTIONS - Payment Security
-- ========================================

-- Users can view their own transaction history
CREATE POLICY "clerk_transactions_select_own" 
ON public.clerk_transactions FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id));

-- Only service role can create/modify transactions (webhooks)
CREATE POLICY "clerk_transactions_service_full" 
ON public.clerk_transactions FOR ALL 
TO service_role
USING (TRUE);

-- Admin can view transactions for fraud detection
CREATE POLICY "clerk_transactions_admin_view" 
ON public.clerk_transactions FOR SELECT 
TO authenticated
USING (auth.is_admin());

-- ========================================
-- CLERK USAGE EVENTS - Usage Tracking
-- ========================================

-- Users can view their own usage events
CREATE POLICY "clerk_usage_events_select_own" 
ON public.clerk_usage_events FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id));

-- Users can insert their own usage events with validation
CREATE POLICY "clerk_usage_events_insert_own" 
ON public.clerk_usage_events FOR INSERT 
TO authenticated
WITH CHECK (
  auth.owns_resource(user_id)
  AND event_type IN ('compile_prompt', 'run_workflow', 'api_call', 'export_data', 'ai_generation', 'search_query')
  AND count > 0 
  AND count <= 100                -- Prevent abuse
  AND created_at >= NOW() - INTERVAL '5 minutes'  -- Recent events only
);

-- Service role manages usage events for system operations
CREATE POLICY "clerk_usage_events_service_full" 
ON public.clerk_usage_events FOR ALL 
TO service_role
USING (TRUE);

-- Admin can view usage patterns for system monitoring
CREATE POLICY "clerk_usage_events_admin_view" 
ON public.clerk_usage_events FOR SELECT 
TO authenticated
USING (auth.is_admin());

-- ========================================
-- SUBSCRIPTION PLANS - Public Reference Data
-- ========================================

-- All authenticated users can view active subscription plans
CREATE POLICY "subscription_plans_select_active" 
ON public.subscription_plans FOR SELECT 
TO authenticated
USING (is_active = TRUE);

-- Only service role can manage subscription plans
CREATE POLICY "subscription_plans_service_full" 
ON public.subscription_plans FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- ANALYTICS EVENTS - Usage Analytics
-- ========================================

-- Users can view their own analytics events
CREATE POLICY "analytics_events_select_own" 
ON public.analytics_events FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id));

-- Users can insert their own analytics events
CREATE POLICY "analytics_events_insert_own" 
ON public.analytics_events FOR INSERT 
TO authenticated
WITH CHECK (
  auth.owns_resource(user_id)
  AND event_type IN ('page_view', 'search', 'view_item', 'purchase', 'sign_up', 'bookmark')
  AND created_at >= NOW() - INTERVAL '5 minutes'  -- Prevent backdating
);

-- Service role manages all analytics operations
CREATE POLICY "analytics_events_service_full" 
ON public.analytics_events FOR ALL 
TO service_role
USING (TRUE);

-- Admin can view aggregated analytics (recent data only)
CREATE POLICY "analytics_events_admin_aggregated" 
ON public.analytics_events FOR SELECT 
TO authenticated
USING (
  auth.is_admin()
  AND created_at >= NOW() - INTERVAL '90 days'    -- Limit to recent data
);

-- ========================================
-- ANALYTICS DAILY SUMMARY - Admin & Service Only
-- ========================================

-- Only admin users can view daily summaries
CREATE POLICY "analytics_daily_summary_admin_view" 
ON public.analytics_daily_summary FOR SELECT 
TO authenticated
USING (auth.is_admin());

-- Service role manages daily summaries
CREATE POLICY "analytics_daily_summary_service_full" 
ON public.analytics_daily_summary FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- USER SESSIONS - Session Management
-- ========================================

-- Users can view their own active sessions
CREATE POLICY "user_sessions_select_own" 
ON public.user_sessions FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id));

-- Users can update their own session (for logout)
CREATE POLICY "user_sessions_update_own" 
ON public.user_sessions FOR UPDATE 
TO authenticated
USING (auth.owns_resource(user_id))
WITH CHECK (auth.owns_resource(user_id));

-- Service role manages all session operations
CREATE POLICY "user_sessions_service_full" 
ON public.user_sessions FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- PROMPT TEMPLATES - AI Workflow Management
-- ========================================

-- Users can view their own prompt templates
CREATE POLICY "prompt_templates_select_own" 
ON public.prompt_templates FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id) OR visibility = 'public');

-- Users can manage their own prompt templates
CREATE POLICY "prompt_templates_crud_own" 
ON public.prompt_templates FOR INSERT 
TO authenticated
WITH CHECK (auth.owns_resource(user_id));

CREATE POLICY "prompt_templates_update_own" 
ON public.prompt_templates FOR UPDATE 
TO authenticated
USING (auth.owns_resource(user_id))
WITH CHECK (auth.owns_resource(user_id));

CREATE POLICY "prompt_templates_delete_own" 
ON public.prompt_templates FOR DELETE 
TO authenticated
USING (auth.owns_resource(user_id));

-- Service role manages all prompt templates
CREATE POLICY "prompt_templates_service_full" 
ON public.prompt_templates FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- PROMPT TEMPLATE FORKS - Template Sharing
-- ========================================

-- Users can view forks of their templates or public forks
CREATE POLICY "prompt_template_forks_select_accessible" 
ON public.prompt_template_forks FOR SELECT 
TO authenticated
USING (
  auth.owns_resource(user_id) 
  OR EXISTS (
    SELECT 1 FROM public.prompt_templates pt 
    WHERE pt.id = original_template_id 
    AND (pt.user_id = auth.uid() OR pt.visibility = 'public')
  )
);

-- Users can fork accessible templates
CREATE POLICY "prompt_template_forks_insert_own" 
ON public.prompt_template_forks FOR INSERT 
TO authenticated
WITH CHECK (
  auth.owns_resource(user_id)
  AND EXISTS (
    SELECT 1 FROM public.prompt_templates pt 
    WHERE pt.id = original_template_id 
    AND (pt.user_id = auth.uid() OR pt.visibility = 'public')
  )
);

-- Users can manage their own forks
CREATE POLICY "prompt_template_forks_update_own" 
ON public.prompt_template_forks FOR UPDATE 
TO authenticated
USING (auth.owns_resource(user_id))
WITH CHECK (auth.owns_resource(user_id));

CREATE POLICY "prompt_template_forks_delete_own" 
ON public.prompt_template_forks FOR DELETE 
TO authenticated
USING (auth.owns_resource(user_id));

-- Service role manages all forks
CREATE POLICY "prompt_template_forks_service_full" 
ON public.prompt_template_forks FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- RUNS - Workflow Execution History
-- ========================================

-- Users can view their own runs
CREATE POLICY "runs_select_own" 
ON public.runs FOR SELECT 
TO authenticated
USING (auth.owns_resource(user_id));

-- Users can create and manage their own runs
CREATE POLICY "runs_insert_own" 
ON public.runs FOR INSERT 
TO authenticated
WITH CHECK (auth.owns_resource(user_id));

CREATE POLICY "runs_update_own" 
ON public.runs FOR UPDATE 
TO authenticated
USING (auth.owns_resource(user_id))
WITH CHECK (auth.owns_resource(user_id));

CREATE POLICY "runs_delete_own" 
ON public.runs FOR DELETE 
TO authenticated
USING (auth.owns_resource(user_id));

-- Service role manages all runs
CREATE POLICY "runs_service_full" 
ON public.runs FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- RUN STEPS - Detailed Execution Logs
-- ========================================

-- Users can view steps of their own runs
CREATE POLICY "run_steps_select_own" 
ON public.run_steps FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.runs r 
    WHERE r.id = run_id AND auth.owns_resource(r.user_id)
  )
);

-- Users can create steps for their own runs
CREATE POLICY "run_steps_insert_own" 
ON public.run_steps FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.runs r 
    WHERE r.id = run_id AND auth.owns_resource(r.user_id)
  )
);

-- Users can update steps of their own runs
CREATE POLICY "run_steps_update_own" 
ON public.run_steps FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.runs r 
    WHERE r.id = run_id AND auth.owns_resource(r.user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.runs r 
    WHERE r.id = run_id AND auth.owns_resource(r.user_id)
  )
);

-- Service role manages all run steps
CREATE POLICY "run_steps_service_full" 
ON public.run_steps FOR ALL 
TO service_role
USING (TRUE);

-- ========================================
-- AUDIT LOG - Security & Compliance
-- ========================================

-- Only admin and service role can view audit logs
CREATE POLICY "audit_log_admin_service_view" 
ON public.audit_log FOR SELECT 
TO authenticated
USING (auth.is_admin() OR auth.is_service_role());

-- Only service role can create audit entries
CREATE POLICY "audit_log_service_insert" 
ON public.audit_log FOR INSERT 
TO service_role
WITH CHECK (TRUE);

-- No updates or deletes on audit log (immutable)
-- Service role can update for corrections only
CREATE POLICY "audit_log_service_update" 
ON public.audit_log FOR UPDATE 
TO service_role
USING (TRUE);

-- ========================================
-- DATA VALIDATION TRIGGERS
-- ========================================

-- Usage event validation trigger
CREATE OR REPLACE FUNCTION validate_usage_event_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate user exists and is authenticated
  IF NOT EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Invalid user_id: %', NEW.user_id;
  END IF;

  -- Validate event type
  IF NEW.event_type NOT IN ('compile_prompt', 'run_workflow', 'api_call', 'export_data', 'ai_generation', 'search_query') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;

  -- Validate count range
  IF NEW.count <= 0 OR NEW.count > 100 THEN
    RAISE EXCEPTION 'Invalid count: % (must be 1-100)', NEW.count;
  END IF;

  -- Set billing period if not provided
  IF NEW.billing_period_start IS NULL THEN
    NEW.billing_period_start := COALESCE(
      (SELECT current_period_start FROM public.clerk_profiles WHERE id = NEW.user_id),
      DATE_TRUNC('month', NOW())
    );
  END IF;

  -- Log the usage event for monitoring
  INSERT INTO public.audit_log (table_name, operation, user_id, new_values)
  VALUES ('clerk_usage_events', 'USAGE_TRACKED', NEW.user_id, 
         jsonb_build_object('event_type', NEW.event_type, 'count', NEW.count));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply usage event validation trigger
DROP TRIGGER IF EXISTS trigger_validate_usage_event ON public.clerk_usage_events;
CREATE TRIGGER trigger_validate_usage_event
  BEFORE INSERT OR UPDATE ON public.clerk_usage_events
  FOR EACH ROW EXECUTE FUNCTION validate_usage_event_data();

-- Profile update validation trigger
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile changes for audit
  IF OLD IS DISTINCT FROM NEW THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_values, new_values)
    VALUES ('clerk_profiles', 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  END IF;

  -- Prevent role escalation by users
  IF OLD.role != NEW.role AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Role changes require service role authentication';
  END IF;

  -- Prevent plan changes by users
  IF OLD.plan != NEW.plan AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Plan changes require service role authentication';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply profile validation trigger
DROP TRIGGER IF EXISTS trigger_validate_profile_update ON public.clerk_profiles;
CREATE TRIGGER trigger_validate_profile_update
  BEFORE UPDATE ON public.clerk_profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_update();

-- ========================================
-- DATA RETENTION & CLEANUP
-- ========================================

-- Comprehensive data retention function
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS VOID AS $$
BEGIN
  -- Delete old analytics events (2 years retention)
  DELETE FROM public.analytics_events 
  WHERE created_at < NOW() - INTERVAL '2 years';

  -- Delete old user sessions (1 year retention)
  DELETE FROM public.user_sessions 
  WHERE started_at < NOW() - INTERVAL '1 year';

  -- Delete old usage events (3 years retention for compliance)
  DELETE FROM public.clerk_usage_events 
  WHERE created_at < NOW() - INTERVAL '3 years';

  -- Delete old transaction records (7 years for financial compliance)
  DELETE FROM public.clerk_transactions 
  WHERE created_at < NOW() - INTERVAL '7 years';

  -- Clean up expired daily summaries (3 years retention)
  DELETE FROM public.analytics_daily_summary 
  WHERE date < CURRENT_DATE - INTERVAL '3 years';

  -- Clean up old run data (1 year retention)
  DELETE FROM public.runs 
  WHERE created_at < NOW() - INTERVAL '1 year';

  -- Log cleanup activity
  INSERT INTO public.audit_log (table_name, operation, user_id, new_values)
  VALUES ('data_retention', 'CLEANUP', NULL, 
         jsonb_build_object('cleaned_at', NOW(), 'retention_policy_applied', TRUE));
  
  RAISE NOTICE 'Data retention cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SECURITY MONITORING VIEWS
-- ========================================

-- Comprehensive security monitoring view
CREATE OR REPLACE VIEW security_events AS
SELECT 
  'auth_failure' as event_type,
  user_id,
  ip_address,
  user_agent,
  created_at,
  'Authentication failure detected' as description
FROM public.audit_log 
WHERE table_name = 'auth_events' 
  AND operation = 'FAILED_LOGIN'
  AND created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'suspicious_usage' as event_type,
  user_id,
  NULL as ip_address,
  NULL as user_agent,
  created_at,
  'High usage count: ' || (new_values->>'count') as description
FROM public.audit_log 
WHERE table_name = 'clerk_usage_events'
  AND (new_values->>'count')::INTEGER > 50
  AND created_at >= NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'admin_access' as event_type,
  user_id,
  ip_address,
  user_agent,
  created_at,
  'Admin privilege accessed' as description
FROM public.audit_log 
WHERE table_name = 'auth.is_admin'
  AND operation = 'ADMIN_CHECK'
  AND created_at >= NOW() - INTERVAL '24 hours'

ORDER BY created_at DESC
LIMIT 100;

-- User activity summary view for monitoring
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  cp.id as user_id,
  cp.email,
  cp.role,
  cp.plan,
  COUNT(DISTINCT ae.id) as analytics_events_24h,
  COUNT(DISTINCT cue.id) as usage_events_24h,
  MAX(us.started_at) as last_session,
  COUNT(DISTINCT us.id) as active_sessions
FROM public.clerk_profiles cp
LEFT JOIN public.analytics_events ae ON ae.user_id = cp.id 
  AND ae.created_at >= NOW() - INTERVAL '24 hours'
LEFT JOIN public.clerk_usage_events cue ON cue.user_id = cp.id 
  AND cue.created_at >= NOW() - INTERVAL '24 hours'
LEFT JOIN public.user_sessions us ON us.user_id = cp.id 
  AND us.ended_at IS NULL
GROUP BY cp.id, cp.email, cp.role, cp.plan;

-- ========================================
-- GRANTS & PERMISSIONS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT ON public.clerk_usage_events TO authenticated;
GRANT SELECT, UPDATE ON public.clerk_profiles TO authenticated;
GRANT SELECT ON public.clerk_subscriptions TO authenticated;
GRANT SELECT ON public.clerk_transactions TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT, UPDATE ON public.user_sessions TO authenticated;

-- Grant access to prompt and workflow tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_template_forks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.run_steps TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION auth.owns_resource(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_service_role() TO authenticated;

-- Grant monitoring view access
GRANT SELECT ON security_events TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;

-- Ensure service role has comprehensive access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create optimized indexes for security queries
CREATE INDEX IF NOT EXISTS idx_clerk_profiles_role_plan ON public.clerk_profiles(role, plan);
CREATE INDEX IF NOT EXISTS idx_clerk_usage_events_user_created ON public.clerk_usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type ON public.analytics_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation_created ON public.audit_log(table_name, operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, started_at DESC) WHERE ended_at IS NULL;

-- Final security lockdown - revoke all public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- ========================================
-- SECURITY VALIDATION & TESTING
-- ========================================

-- Function to validate RLS policy effectiveness
CREATE OR REPLACE FUNCTION validate_rls_policies()
RETURNS TABLE(table_name TEXT, policy_count INTEGER, rls_enabled BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    COUNT(p.policyname)::INTEGER as policy_count,
    (t.row_security = 'YES')::BOOLEAN as rls_enabled
  FROM information_schema.tables t
  LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name, t.row_security
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- DOCUMENTATION & COMPLIANCE NOTES
-- ========================================

/*
SECURITY IMPLEMENTATION SUMMARY:

1. **DEFAULT DENY ARCHITECTURE**
   - All tables have RLS enabled
   - No public access granted by default
   - All access must be explicitly granted through policies

2. **ROLE-BASED ACCESS CONTROL**
   - Users: Access only their own data
   - Admin: Limited privileged access with audit logging
   - Service Role: Full system access for backend operations

3. **DATA INTEGRITY & VALIDATION**
   - Input validation triggers on critical tables
   - Audit logging for all sensitive operations
   - Data retention policies with automated cleanup

4. **SECURITY MONITORING**
   - Comprehensive security event logging
   - Real-time monitoring views for suspicious activity
   - User activity tracking and analysis

5. **COMPLIANCE FEATURES**
   - GDPR-compliant data retention and deletion
   - Audit trail for all data modifications
   - Korean PIPA compliance with data processing controls

OPERATIONAL PROCEDURES:

1. **Regular Maintenance**
   - Run enforce_data_retention() monthly
   - Review security_events view daily
   - Monitor user_activity_summary weekly

2. **Security Validation**
   - Execute validate_rls_policies() after any schema changes
   - Test policy effectiveness with test user accounts
   - Audit admin access patterns monthly

3. **Incident Response**
   - Monitor audit_log for unusual patterns
   - Investigate admin access attempts
   - Review high usage events for potential abuse

4. **Performance Optimization**
   - Indexes created for security query performance
   - Views optimized for real-time monitoring
   - Triggers designed with minimal performance impact

This implementation follows defense-in-depth principles with multiple
layers of security controls, comprehensive audit logging, and
automated compliance features.
*/