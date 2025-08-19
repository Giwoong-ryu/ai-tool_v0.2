-- ========================================
-- EasyPick Workflow Runs Schema
-- 워크플로우 실행 및 상태 관리 시스템
-- ========================================

-- ========================================
-- WORKFLOW RUNS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  -- Primary Key & Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  workflow_id TEXT NOT NULL, -- Reference to workflow from aiUsageGuides
  user_id UUID NOT NULL REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  
  -- Run Metadata
  title TEXT NOT NULL,
  description TEXT,
  
  -- Run Status & Progress
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step INTEGER DEFAULT 0,
  
  -- Step Counts
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  
  -- Timing Information
  estimated_completion_time INTERVAL,
  actual_completion_time INTEGER, -- in seconds
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  
  -- Sharing & Visibility
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  share_settings JSONB DEFAULT jsonb_build_object(
    'allow_view', true,
    'allow_clone', false,
    'hide_sensitive_data', true,
    'show_timing', true
  ),
  
  -- Run Configuration
  settings JSONB DEFAULT jsonb_build_object(
    'auto_save', true,
    'auto_save_interval', 30,
    'track_time', true,
    'allow_skip', true,
    'require_confirmation', false
  ),
  
  -- Analytics & Performance
  analytics_data JSONB DEFAULT jsonb_build_object(
    'session_id', null,
    'utm_source', null,
    'utm_medium', null,
    'utm_campaign', null,
    'referrer', null,
    'user_agent', null
  ),
  
  -- Workflow Snapshot (for version consistency)
  workflow_snapshot JSONB, -- Store workflow data at time of run creation
  
  -- Constraints
  CONSTRAINT valid_progress CHECK (completed_steps <= total_steps),
  CONSTRAINT valid_current_step CHECK (current_step >= 0 AND current_step <= total_steps),
  CONSTRAINT valid_status_transitions CHECK (
    (status = 'draft' AND started_at IS NULL) OR
    (status IN ('running', 'paused', 'completed', 'failed', 'cancelled') AND started_at IS NOT NULL)
  )
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON public.workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_share_token ON public.workflow_runs(share_token) WHERE share_token IS NOT NULL;

-- Query patterns
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_status ON public.workflow_runs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at ON public.workflow_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_public_completed ON public.workflow_runs(is_public, status) 
  WHERE is_public = true AND status = 'completed';

-- Analytics queries
CREATE INDEX IF NOT EXISTS idx_workflow_runs_analytics ON public.workflow_runs USING GIN(analytics_data);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_settings ON public.workflow_runs USING GIN(settings);

-- ========================================
-- RUN MANAGEMENT FUNCTIONS
-- ========================================

-- Create a new workflow run
CREATE OR REPLACE FUNCTION create_workflow_run(
  p_workflow_id TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_workflow_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_run_id UUID;
  step_count INTEGER := 0;
BEGIN
  -- Count steps from workflow data
  IF p_workflow_data IS NOT NULL AND p_workflow_data ? 'steps' THEN
    SELECT jsonb_array_length(p_workflow_data->'steps') INTO step_count;
  END IF;
  
  -- Create the run
  INSERT INTO public.workflow_runs (
    workflow_id,
    user_id,
    title,
    description,
    total_steps,
    workflow_snapshot
  ) VALUES (
    p_workflow_id,
    auth.uid(),
    p_title,
    p_description,
    step_count,
    p_workflow_data
  ) RETURNING id INTO new_run_id;
  
  RETURN new_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start a workflow run
CREATE OR REPLACE FUNCTION start_workflow_run(run_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_status TEXT;
BEGIN
  -- Check current status
  SELECT status INTO current_status
  FROM public.workflow_runs
  WHERE id = run_id AND user_id = auth.uid();
  
  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Run not found or access denied';
  END IF;
  
  IF current_status NOT IN ('draft', 'paused') THEN
    RAISE EXCEPTION 'Cannot start run with status: %', current_status;
  END IF;
  
  -- Update status
  UPDATE public.workflow_runs
  SET 
    status = 'running',
    started_at = CASE WHEN started_at IS NULL THEN NOW() ELSE started_at END,
    paused_at = NULL,
    updated_at = NOW()
  WHERE id = run_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pause a workflow run
CREATE OR REPLACE FUNCTION pause_workflow_run(run_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.workflow_runs
  SET 
    status = 'paused',
    paused_at = NOW(),
    updated_at = NOW()
  WHERE id = run_id 
    AND user_id = auth.uid() 
    AND status = 'running';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a workflow run
CREATE OR REPLACE FUNCTION complete_workflow_run(run_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_time INTEGER;
BEGIN
  -- Calculate total time
  SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
  INTO total_time
  FROM public.workflow_runs
  WHERE id = run_id AND user_id = auth.uid();
  
  -- Update status
  UPDATE public.workflow_runs
  SET 
    status = 'completed',
    progress = 100,
    completed_at = NOW(),
    actual_completion_time = total_time,
    completed_steps = total_steps,
    updated_at = NOW()
  WHERE id = run_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update run progress
CREATE OR REPLACE FUNCTION update_run_progress(
  run_id UUID,
  step_number INTEGER DEFAULT NULL,
  increment_completed BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
  new_progress INTEGER;
  total INTEGER;
  completed INTEGER;
BEGIN
  -- Get current values
  SELECT total_steps, completed_steps 
  INTO total, completed
  FROM public.workflow_runs
  WHERE id = run_id AND user_id = auth.uid();
  
  IF total IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update completed steps if needed
  IF increment_completed THEN
    completed := completed + 1;
  END IF;
  
  -- Calculate progress
  IF total > 0 THEN
    new_progress := LEAST(100, (completed * 100) / total);
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update the run
  UPDATE public.workflow_runs
  SET 
    current_step = COALESCE(step_number, current_step),
    completed_steps = completed,
    progress = new_progress,
    updated_at = NOW()
  WHERE id = run_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate share token
CREATE OR REPLACE FUNCTION generate_share_token(run_id UUID)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a secure random token
  token := encode(gen_random_bytes(32), 'base64url');
  
  -- Update the run
  UPDATE public.workflow_runs
  SET 
    share_token = token,
    is_public = true,
    updated_at = NOW()
  WHERE id = run_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Run not found or access denied';
  END IF;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get run by share token (public access)
CREATE OR REPLACE FUNCTION get_shared_run(token TEXT)
RETURNS TABLE (
  run_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', wr.id,
      'workflow_id', wr.workflow_id,
      'title', wr.title,
      'description', wr.description,
      'status', wr.status,
      'progress', wr.progress,
      'total_steps', wr.total_steps,
      'completed_steps', wr.completed_steps,
      'created_at', wr.created_at,
      'completed_at', wr.completed_at,
      'actual_completion_time', wr.actual_completion_time,
      'workflow_snapshot', wr.workflow_snapshot,
      'is_completed', wr.status = 'completed',
      'completion_rate', CASE WHEN wr.total_steps > 0 THEN (wr.completed_steps * 100.0 / wr.total_steps) ELSE 0 END
    ) as run_data
  FROM public.workflow_runs wr
  WHERE wr.share_token = token 
    AND wr.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ANALYTICS & REPORTING FUNCTIONS
-- ========================================

-- Get user run statistics
CREATE OR REPLACE FUNCTION get_user_run_stats(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_runs BIGINT,
  completed_runs BIGINT,
  completion_rate NUMERIC,
  avg_completion_time NUMERIC,
  most_used_workflows JSONB
) AS $$
DECLARE
  user_filter UUID := COALESCE(target_user_id, auth.uid());
BEGIN
  RETURN QUERY
  WITH run_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      AVG(actual_completion_time) as avg_time
    FROM public.workflow_runs
    WHERE user_id = user_filter
  ),
  workflow_usage AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'workflow_id', workflow_id,
          'usage_count', usage_count,
          'avg_completion_rate', avg_completion_rate
        )
        ORDER BY usage_count DESC
        LIMIT 5
      ) as workflows
    FROM (
      SELECT 
        workflow_id,
        COUNT(*) as usage_count,
        AVG(CASE WHEN total_steps > 0 THEN (completed_steps * 100.0 / total_steps) ELSE 0 END) as avg_completion_rate
      FROM public.workflow_runs
      WHERE user_id = user_filter
      GROUP BY workflow_id
    ) wf
  )
  SELECT 
    rs.total,
    rs.completed,
    CASE WHEN rs.total > 0 THEN ROUND((rs.completed * 100.0 / rs.total), 2) ELSE 0 END,
    ROUND(rs.avg_time, 2),
    wu.workflows
  FROM run_stats rs, workflow_usage wu;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_run_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_run_timestamp
  BEFORE UPDATE ON public.workflow_runs
  FOR EACH ROW EXECUTE FUNCTION update_run_timestamp();

-- Analytics tracking trigger
CREATE OR REPLACE FUNCTION track_run_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes for analytics
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Insert analytics event (you can extend this to integrate with external analytics)
    INSERT INTO public.analytics_events (
      user_id,
      event_type,
      event_data,
      metadata
    ) VALUES (
      NEW.user_id,
      'workflow_status_change',
      jsonb_build_object(
        'run_id', NEW.id,
        'workflow_id', NEW.workflow_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'progress', NEW.progress
      ),
      jsonb_build_object(
        'completion_time', NEW.actual_completion_time,
        'steps_completed', NEW.completed_steps,
        'total_steps', NEW.total_steps
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_run_analytics
  AFTER UPDATE ON public.workflow_runs
  FOR EACH ROW EXECUTE FUNCTION track_run_analytics();

-- ========================================
-- SECURITY POLICIES (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Users can access their own runs
CREATE POLICY "workflow_runs_owner_access" ON public.workflow_runs
  FOR ALL USING (auth.uid() = user_id);

-- Public access to shared runs (read-only)
CREATE POLICY "workflow_runs_public_shared" ON public.workflow_runs
  FOR SELECT USING (is_public = true AND share_token IS NOT NULL);

-- Admin access
CREATE POLICY "workflow_runs_admin_access" ON public.workflow_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role access
CREATE POLICY "workflow_runs_service_role" ON public.workflow_runs
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;

-- Grant function access
GRANT EXECUTE ON FUNCTION create_workflow_run(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION start_workflow_run(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION pause_workflow_run(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_workflow_run(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_run_progress(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_share_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shared_run(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_run_stats(UUID) TO authenticated;

-- Service role permissions
GRANT ALL ON public.workflow_runs TO service_role;

-- ========================================
-- PERFORMANCE MONITORING VIEWS
-- ========================================

-- Run performance analytics
CREATE OR REPLACE VIEW run_performance_analytics AS
SELECT 
  workflow_id,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
  ROUND(AVG(CASE WHEN status = 'completed' THEN progress ELSE NULL END), 2) as avg_completion_rate,
  ROUND(AVG(actual_completion_time), 2) as avg_completion_time_seconds,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_runs,
  MAX(created_at) as last_run_date
FROM public.workflow_runs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY workflow_id
ORDER BY total_runs DESC;

GRANT SELECT ON run_performance_analytics TO authenticated;

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Clean up old draft runs
CREATE OR REPLACE FUNCTION cleanup_old_draft_runs(days_threshold INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.workflow_runs
  WHERE status = 'draft'
    AND created_at < NOW() - INTERVAL '1 day' * days_threshold
    AND updated_at < NOW() - INTERVAL '1 day' * days_threshold;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Archive completed runs
CREATE OR REPLACE FUNCTION archive_completed_runs(days_threshold INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- This could move old runs to an archive table
  -- For now, we'll just count what would be archived
  SELECT COUNT(*)
  INTO archived_count
  FROM public.workflow_runs
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '1 day' * days_threshold;
  
  -- Future: Move to archive table instead of counting
  -- INSERT INTO public.workflow_runs_archive SELECT * FROM public.workflow_runs WHERE ...
  -- DELETE FROM public.workflow_runs WHERE ...
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- NOTES & DOCUMENTATION
-- ========================================

/*
Workflow Runs Schema Implementation Notes:

1. **Run Lifecycle**: draft → running → (paused) → completed/failed/cancelled
2. **Progress Tracking**: Real-time progress updates with step counting
3. **Sharing System**: Secure token-based sharing with privacy controls
4. **Analytics Integration**: Built-in event tracking for user behavior
5. **Performance Monitoring**: Views and functions for performance analysis

Key Features:
- Complete run lifecycle management
- Real-time progress tracking and status updates
- Secure sharing with token-based access
- Analytics event integration
- Performance monitoring and reporting
- Automatic cleanup and maintenance

Usage Guidelines:
- Use create_workflow_run() to start new runs
- Update progress with update_run_progress()
- Generate sharing links with generate_share_token()
- Monitor performance with run_performance_analytics view
- Regular cleanup with maintenance functions

Security Features:
- Row-level security for user data isolation
- Secure token generation for sharing
- Privacy controls for sensitive data
- Admin access for system management
*/