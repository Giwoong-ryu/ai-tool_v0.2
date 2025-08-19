-- ========================================
-- EasyPick Runner Sessions Schema
-- 런너 세션 관리 및 복구 시스템
-- ========================================

-- ========================================
-- RUNNER SESSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.runner_sessions (
  -- Primary Key & Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  
  -- Session Metadata
  session_key TEXT NOT NULL, -- Unique identifier for this session
  session_name TEXT, -- User-friendly name for the session
  
  -- Session State
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'interrupted', 'expired')),
  
  -- Session Data
  session_data JSONB NOT NULL DEFAULT '{}', -- Complete session state snapshot
  ui_state JSONB DEFAULT jsonb_build_object(
    'currentStepIndex', 0,
    'expandedSteps', '[]',
    'viewMode', 'timeline',
    'activeTab', 'main'
  ),
  
  -- Session Configuration
  auto_save_enabled BOOLEAN DEFAULT true,
  auto_save_interval INTEGER DEFAULT 30, -- seconds
  
  -- Recovery Information
  last_checkpoint_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovery_data JSONB DEFAULT '{}', -- Additional data for session recovery
  
  -- Browser/Client Info
  browser_info JSONB DEFAULT jsonb_build_object(
    'user_agent', null,
    'screen_resolution', null,
    'timezone', null,
    'language', null
  ),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  
  -- Constraints
  CONSTRAINT unique_session_key_per_user UNIQUE (user_id, session_key),
  CONSTRAINT valid_session_data CHECK (jsonb_typeof(session_data) = 'object')
);

-- ========================================
-- SESSION CHECKPOINTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.runner_session_checkpoints (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  session_id UUID NOT NULL REFERENCES public.runner_sessions(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  -- Checkpoint Metadata
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('auto', 'manual', 'step_complete', 'pause', 'error')),
  checkpoint_name TEXT,
  
  -- Checkpoint Data
  session_snapshot JSONB NOT NULL,
  step_states JSONB DEFAULT '{}',
  progress_data JSONB DEFAULT '{}',
  
  -- Recovery Info
  recovery_instructions TEXT,
  rollback_safe BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Client context
  client_timestamp TIMESTAMP WITH TIME ZONE,
  network_status TEXT -- 'online', 'offline', 'unstable'
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_runner_sessions_user_id ON public.runner_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_runner_sessions_run_id ON public.runner_sessions(run_id);
CREATE INDEX IF NOT EXISTS idx_runner_sessions_session_key ON public.runner_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_runner_sessions_status ON public.runner_sessions(status);

-- Activity and cleanup patterns
CREATE INDEX IF NOT EXISTS idx_runner_sessions_last_activity ON public.runner_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_runner_sessions_expires_at ON public.runner_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_runner_sessions_user_active ON public.runner_sessions(user_id, status) WHERE status = 'active';

-- Checkpoints
CREATE INDEX IF NOT EXISTS idx_session_checkpoints_session_id ON public.runner_session_checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_session_checkpoints_created_at ON public.runner_session_checkpoints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_checkpoints_type ON public.runner_session_checkpoints(checkpoint_type);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_runner_sessions_run_user ON public.runner_sessions(run_id, user_id);
CREATE INDEX IF NOT EXISTS idx_session_checkpoints_session_type ON public.runner_session_checkpoints(session_id, checkpoint_type);

-- ========================================
-- SESSION MANAGEMENT FUNCTIONS
-- ========================================

-- Create or resume a runner session
CREATE OR REPLACE FUNCTION create_runner_session(
  p_run_id UUID,
  p_session_key TEXT DEFAULT NULL,
  p_session_name TEXT DEFAULT NULL,
  p_browser_info JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  generated_key TEXT;
BEGIN
  -- Generate session key if not provided
  IF p_session_key IS NULL THEN
    generated_key := 'session_' || encode(gen_random_bytes(16), 'base64url');
  ELSE
    generated_key := p_session_key;
  END IF;
  
  -- Try to resume existing session first
  SELECT id INTO session_id
  FROM public.runner_sessions
  WHERE user_id = auth.uid() 
    AND session_key = generated_key
    AND status IN ('active', 'paused')
    AND expires_at > NOW();
  
  IF session_id IS NOT NULL THEN
    -- Resume existing session
    UPDATE public.runner_sessions
    SET 
      last_activity_at = NOW(),
      status = 'active',
      updated_at = NOW()
    WHERE id = session_id;
    
    RETURN session_id;
  END IF;
  
  -- Create new session
  INSERT INTO public.runner_sessions (
    run_id,
    user_id,
    session_key,
    session_name,
    browser_info
  ) VALUES (
    p_run_id,
    auth.uid(),
    generated_key,
    COALESCE(p_session_name, 'Runner Session ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI')),
    COALESCE(p_browser_info, '{}')
  ) RETURNING id INTO session_id;
  
  -- Create initial checkpoint
  INSERT INTO public.runner_session_checkpoints (
    session_id,
    run_id,
    checkpoint_type,
    checkpoint_name,
    session_snapshot,
    created_by
  ) VALUES (
    session_id,
    p_run_id,
    'manual',
    'Session Created',
    jsonb_build_object('created_at', NOW(), 'initial_state', true),
    auth.uid()
  );
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save session state
CREATE OR REPLACE FUNCTION save_runner_session(
  p_session_id UUID,
  p_session_data JSONB,
  p_ui_state JSONB DEFAULT NULL,
  p_checkpoint_type TEXT DEFAULT 'auto'
)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN := false;
BEGIN
  -- Verify ownership
  SELECT EXISTS(
    SELECT 1 FROM public.runner_sessions 
    WHERE id = p_session_id AND user_id = auth.uid()
  ) INTO is_owner;
  
  IF NOT is_owner THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  -- Update session
  UPDATE public.runner_sessions
  SET 
    session_data = p_session_data,
    ui_state = COALESCE(p_ui_state, ui_state),
    last_activity_at = NOW(),
    last_checkpoint_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- Create checkpoint
  INSERT INTO public.runner_session_checkpoints (
    session_id,
    run_id,
    checkpoint_type,
    checkpoint_name,
    session_snapshot,
    step_states,
    created_by,
    client_timestamp
  ) VALUES (
    p_session_id,
    (SELECT run_id FROM public.runner_sessions WHERE id = p_session_id),
    p_checkpoint_type,
    CASE 
      WHEN p_checkpoint_type = 'auto' THEN 'Auto Save'
      WHEN p_checkpoint_type = 'manual' THEN 'Manual Save'
      WHEN p_checkpoint_type = 'step_complete' THEN 'Step Completed'
      ELSE 'Checkpoint'
    END,
    p_session_data,
    COALESCE(p_session_data->'steps', '{}'),
    auth.uid(),
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resume session state
CREATE OR REPLACE FUNCTION resume_runner_session(
  p_session_key TEXT
)
RETURNS TABLE (
  session_id UUID,
  run_id UUID,
  session_data JSONB,
  ui_state JSONB,
  last_checkpoint_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.id as session_id,
    rs.run_id,
    rs.session_data,
    rs.ui_state,
    rs.last_checkpoint_at
  FROM public.runner_sessions rs
  WHERE rs.user_id = auth.uid() 
    AND rs.session_key = p_session_key
    AND rs.status IN ('active', 'paused')
    AND rs.expires_at > NOW();
  
  -- Update last activity
  UPDATE public.runner_sessions
  SET 
    last_activity_at = NOW(),
    status = 'active'
  WHERE user_id = auth.uid() 
    AND session_key = p_session_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's active sessions
CREATE OR REPLACE FUNCTION get_user_active_sessions()
RETURNS TABLE (
  session_id UUID,
  run_id UUID,
  session_key TEXT,
  session_name TEXT,
  run_title TEXT,
  status TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.id as session_id,
    rs.run_id,
    rs.session_key,
    rs.session_name,
    wr.title as run_title,
    rs.status,
    rs.last_activity_at,
    wr.progress,
    rs.expires_at
  FROM public.runner_sessions rs
  JOIN public.workflow_runs wr ON wr.id = rs.run_id
  WHERE rs.user_id = auth.uid() 
    AND rs.status IN ('active', 'paused')
    AND rs.expires_at > NOW()
  ORDER BY rs.last_activity_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pause session
CREATE OR REPLACE FUNCTION pause_runner_session(
  p_session_id UUID,
  p_pause_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.runner_sessions
  SET 
    status = 'paused',
    updated_at = NOW(),
    recovery_data = jsonb_set(
      COALESCE(recovery_data, '{}'),
      '{pause_reason}',
      to_jsonb(COALESCE(p_pause_reason, 'User paused'))
    )
  WHERE id = p_session_id 
    AND user_id = auth.uid()
    AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete session
CREATE OR REPLACE FUNCTION complete_runner_session(
  p_session_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.runner_sessions
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_session_id 
    AND user_id = auth.uid()
    AND status IN ('active', 'paused');
  
  -- Create final checkpoint
  INSERT INTO public.runner_session_checkpoints (
    session_id,
    run_id,
    checkpoint_type,
    checkpoint_name,
    session_snapshot,
    created_by
  ) VALUES (
    p_session_id,
    (SELECT run_id FROM public.runner_sessions WHERE id = p_session_id),
    'manual',
    'Session Completed',
    jsonb_build_object('completed_at', NOW()),
    auth.uid()
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_timestamp
  BEFORE UPDATE ON public.runner_sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_timestamp();

-- Activity tracking trigger
CREATE OR REPLACE FUNCTION track_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update activity timestamp on any significant change
  IF TG_OP = 'UPDATE' AND (
    OLD.session_data IS DISTINCT FROM NEW.session_data OR
    OLD.status IS DISTINCT FROM NEW.status
  ) THEN
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_session_activity
  BEFORE UPDATE ON public.runner_sessions
  FOR EACH ROW EXECUTE FUNCTION track_session_activity();

-- ========================================
-- SECURITY POLICIES (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.runner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_session_checkpoints ENABLE ROW LEVEL SECURITY;

-- Users can access their own sessions
CREATE POLICY "runner_sessions_owner_access" ON public.runner_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Users can access checkpoints for their sessions
CREATE POLICY "session_checkpoints_owner_access" ON public.runner_session_checkpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.runner_sessions rs 
      WHERE rs.id = session_id AND rs.user_id = auth.uid()
    )
  );

-- Admin access
CREATE POLICY "runner_sessions_admin_access" ON public.runner_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "session_checkpoints_admin_access" ON public.runner_session_checkpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role access
CREATE POLICY "runner_sessions_service_role" ON public.runner_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "session_checkpoints_service_role" ON public.runner_session_checkpoints
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runner_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runner_session_checkpoints TO authenticated;

-- Grant function access
GRANT EXECUTE ON FUNCTION create_runner_session(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_runner_session(UUID, JSONB, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION resume_runner_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION pause_runner_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_runner_session(UUID) TO authenticated;

-- Service role permissions
GRANT ALL ON public.runner_sessions TO service_role;
GRANT ALL ON public.runner_session_checkpoints TO service_role;

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions(days_threshold INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Mark expired sessions
  UPDATE public.runner_sessions
  SET status = 'expired'
  WHERE expires_at < NOW() 
    AND status NOT IN ('completed', 'expired');
  
  -- Delete old expired sessions and their checkpoints
  DELETE FROM public.runner_sessions
  WHERE status = 'expired'
    AND updated_at < NOW() - INTERVAL '1 day' * days_threshold;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- NOTES & DOCUMENTATION
-- ========================================

/*
Runner Sessions Schema Implementation Notes:

1. **Session Management**: Complete session lifecycle with auto-save and recovery
2. **Checkpoint System**: Point-in-time snapshots for reliable recovery
3. **Browser Integration**: Client-side state synchronization
4. **Expiration Handling**: Automatic cleanup of old sessions
5. **Security**: Row-level security for user data isolation

Key Features:
- Session creation and resumption
- Auto-save with configurable intervals
- Manual and automatic checkpoints
- Browser crash recovery
- Multi-device session management
- Expiration and cleanup

Usage Guidelines:
- Use create_runner_session() to start new sessions
- Save state regularly with save_runner_session()
- Resume interrupted sessions with resume_runner_session()
- Monitor active sessions with get_user_active_sessions()
- Clean up expired sessions periodically

Security Features:
- Row-level security for user isolation
- Session key validation
- Expiration-based access control
- Admin oversight capabilities
*/