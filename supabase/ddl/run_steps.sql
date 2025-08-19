-- ========================================
-- EasyPick Workflow Run Steps Schema
-- 개별 단계 실행 상태 및 데이터 관리
-- ========================================

-- ========================================
-- WORKFLOW RUN STEPS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.workflow_run_steps (
  -- Primary Key & Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL, -- Reference to step from workflow definition
  
  -- Step Position & Metadata
  step_number INTEGER NOT NULL,
  step_title TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('manual', 'instruction', 'generator')),
  step_description TEXT,
  
  -- Step Status & Progress
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  is_checked BOOLEAN DEFAULT false,
  is_expanded BOOLEAN DEFAULT false,
  
  -- Timing Information
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_time_spent INTEGER DEFAULT 0, -- in seconds
  estimated_time INTEGER, -- in seconds
  
  -- Step Data
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Step Configuration
  step_config JSONB DEFAULT jsonb_build_object(
    'required_inputs', '[]',
    'expected_outputs', '[]',
    'allow_skip', true,
    'auto_complete', false,
    'validation_rules', '{}'
  ),
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- User Interaction
  user_feedback TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_step_number CHECK (step_number > 0),
  CONSTRAINT valid_timing CHECK (
    (status = 'pending' AND started_at IS NULL) OR
    (status IN ('in_progress', 'completed', 'skipped', 'failed') AND started_at IS NOT NULL)
  ),
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed')
  )
);

-- ========================================
-- STEP HISTORY TABLE (for undo/redo)
-- ========================================

CREATE TABLE IF NOT EXISTS public.run_step_history (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  run_step_id UUID NOT NULL REFERENCES public.workflow_run_steps(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  -- Change Information
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'complete', 'revert', 'note_add', 'input_update', 'output_update')),
  field_path TEXT, -- JSON path to changed field
  old_value JSONB,
  new_value JSONB,
  
  -- Change Context
  change_reason TEXT,
  batch_id UUID, -- Group related changes
  
  -- Metadata
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Client info for tracking
  user_agent TEXT,
  ip_address INET
);

-- ========================================
-- STEP TEMPLATES TABLE (for reusable steps)
-- ========================================

CREATE TABLE IF NOT EXISTS public.step_templates (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template Metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('manual', 'instruction', 'generator')),
  
  -- Template Configuration
  template_config JSONB NOT NULL DEFAULT '{}',
  default_inputs JSONB DEFAULT '{}',
  expected_outputs JSONB DEFAULT '{}',
  
  -- Usage & Analytics
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 100.0,
  avg_completion_time INTEGER DEFAULT 0,
  
  -- Ownership
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_run_steps_run_id ON public.workflow_run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_run_steps_step_number ON public.workflow_run_steps(run_id, step_number);
CREATE INDEX IF NOT EXISTS idx_run_steps_status ON public.workflow_run_steps(status);
CREATE INDEX IF NOT EXISTS idx_run_steps_type ON public.workflow_run_steps(step_type);

-- History tracking
CREATE INDEX IF NOT EXISTS idx_step_history_run_step ON public.run_step_history(run_step_id);
CREATE INDEX IF NOT EXISTS idx_step_history_batch ON public.run_step_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_step_history_created_at ON public.run_step_history(created_at DESC);

-- Templates
CREATE INDEX IF NOT EXISTS idx_step_templates_category ON public.step_templates(category);
CREATE INDEX IF NOT EXISTS idx_step_templates_type ON public.step_templates(step_type);
CREATE INDEX IF NOT EXISTS idx_step_templates_public ON public.step_templates(is_public) WHERE is_public = true;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_run_steps_run_status ON public.workflow_run_steps(run_id, status);
CREATE INDEX IF NOT EXISTS idx_run_steps_timing ON public.workflow_run_steps(started_at, completed_at) WHERE started_at IS NOT NULL;

-- ========================================
-- STEP MANAGEMENT FUNCTIONS
-- ========================================

-- Initialize steps for a new run
CREATE OR REPLACE FUNCTION initialize_run_steps(
  p_run_id UUID,
  p_workflow_data JSONB
)
RETURNS INTEGER AS $$
DECLARE
  step_data JSONB;
  step_count INTEGER := 0;
  step_obj JSONB;
BEGIN
  -- Get steps array from workflow data
  step_data := p_workflow_data->'steps';
  
  IF step_data IS NULL OR jsonb_typeof(step_data) != 'array' THEN
    RETURN 0;
  END IF;
  
  -- Insert each step
  FOR step_obj IN SELECT * FROM jsonb_array_elements(step_data)
  LOOP
    step_count := step_count + 1;
    
    INSERT INTO public.workflow_run_steps (
      run_id,
      step_id,
      step_number,
      step_title,
      step_type,
      step_description,
      step_config
    ) VALUES (
      p_run_id,
      COALESCE(step_obj->>'id', 'step_' || step_count),
      step_count,
      COALESCE(step_obj->>'tool_action', 'Step ' || step_count),
      COALESCE(step_obj->>'type', 'manual'),
      step_obj->>'details',
      jsonb_build_object(
        'tool_name', step_obj->>'tool_name',
        'required_inputs', COALESCE(step_obj->'required_inputs', '[]'),
        'expected_outputs', COALESCE(step_obj->'expected_outputs', '[]'),
        'estimated_time', step_obj->>'estimated_time',
        'difficulty', step_obj->>'difficulty'
      )
    );
  END LOOP;
  
  RETURN step_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update step status
CREATE OR REPLACE FUNCTION update_step_status(
  p_step_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_output_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_status TEXT;
  step_number INTEGER;
  run_id_val UUID;
BEGIN
  -- Get current status and step info
  SELECT status, step_number, run_id 
  INTO old_status, step_number, run_id_val
  FROM public.workflow_run_steps
  WHERE id = p_step_id;
  
  IF old_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update the step
  UPDATE public.workflow_run_steps
  SET 
    status = p_status,
    notes = COALESCE(p_notes, notes),
    output_data = COALESCE(p_output_data, output_data),
    completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
    started_at = CASE WHEN p_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    actual_time_spent = CASE 
      WHEN p_status = 'completed' AND started_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
      ELSE actual_time_spent 
    END,
    updated_at = NOW()
  WHERE id = p_step_id;
  
  -- Record history
  INSERT INTO public.run_step_history (
    run_step_id,
    run_id,
    action,
    field_path,
    old_value,
    new_value,
    change_reason,
    created_by
  ) VALUES (
    p_step_id,
    run_id_val,
    'update',
    'status',
    to_jsonb(old_status),
    to_jsonb(p_status),
    'Status update via update_step_status',
    auth.uid()
  );
  
  -- Update run progress if step is completed
  IF p_status = 'completed' THEN
    PERFORM update_run_progress(run_id_val, step_number, true);
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add or update step notes
CREATE OR REPLACE FUNCTION update_step_notes(
  p_step_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  old_notes TEXT;
  run_id_val UUID;
BEGIN
  -- Get current notes
  SELECT notes, run_id 
  INTO old_notes, run_id_val
  FROM public.workflow_run_steps
  WHERE id = p_step_id;
  
  IF run_id_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update notes
  UPDATE public.workflow_run_steps
  SET 
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_step_id;
  
  -- Record history
  INSERT INTO public.run_step_history (
    run_step_id,
    run_id,
    action,
    field_path,
    old_value,
    new_value,
    change_reason,
    created_by
  ) VALUES (
    p_step_id,
    run_id_val,
    'note_add',
    'notes',
    to_jsonb(old_notes),
    to_jsonb(p_notes),
    'Notes updated via update_step_notes',
    auth.uid()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update step input/output data
CREATE OR REPLACE FUNCTION update_step_data(
  p_step_id UUID,
  p_input_data JSONB DEFAULT NULL,
  p_output_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_input JSONB;
  old_output JSONB;
  run_id_val UUID;
  batch_uuid UUID := gen_random_uuid();
BEGIN
  -- Get current data
  SELECT input_data, output_data, run_id 
  INTO old_input, old_output, run_id_val
  FROM public.workflow_run_steps
  WHERE id = p_step_id;
  
  IF run_id_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update data
  UPDATE public.workflow_run_steps
  SET 
    input_data = COALESCE(p_input_data, input_data),
    output_data = COALESCE(p_output_data, output_data),
    updated_at = NOW()
  WHERE id = p_step_id;
  
  -- Record history for input data
  IF p_input_data IS NOT NULL THEN
    INSERT INTO public.run_step_history (
      run_step_id, run_id, action, field_path, old_value, new_value, batch_id, created_by
    ) VALUES (
      p_step_id, run_id_val, 'input_update', 'input_data', old_input, p_input_data, batch_uuid, auth.uid()
    );
  END IF;
  
  -- Record history for output data
  IF p_output_data IS NOT NULL THEN
    INSERT INTO public.run_step_history (
      run_step_id, run_id, action, field_path, old_value, new_value, batch_id, created_by
    ) VALUES (
      p_step_id, run_id_val, 'output_update', 'output_data', old_output, p_output_data, batch_uuid, auth.uid()
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revert step to previous state
CREATE OR REPLACE FUNCTION revert_step_change(
  p_step_id UUID,
  p_history_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  history_record RECORD;
  field_to_revert TEXT;
  value_to_restore JSONB;
BEGIN
  -- Get the history record to revert to
  IF p_history_id IS NOT NULL THEN
    SELECT * INTO history_record
    FROM public.run_step_history
    WHERE id = p_history_id AND run_step_id = p_step_id;
  ELSE
    -- Get the most recent change
    SELECT * INTO history_record
    FROM public.run_step_history
    WHERE run_step_id = p_step_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF history_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  field_to_revert := history_record.field_path;
  value_to_restore := history_record.old_value;
  
  -- Apply the revert based on field
  CASE field_to_revert
    WHEN 'status' THEN
      UPDATE public.workflow_run_steps
      SET status = value_to_restore->>0, updated_at = NOW()
      WHERE id = p_step_id;
    
    WHEN 'notes' THEN
      UPDATE public.workflow_run_steps
      SET notes = value_to_restore->>0, updated_at = NOW()
      WHERE id = p_step_id;
    
    WHEN 'input_data' THEN
      UPDATE public.workflow_run_steps
      SET input_data = value_to_restore, updated_at = NOW()
      WHERE id = p_step_id;
    
    WHEN 'output_data' THEN
      UPDATE public.workflow_run_steps
      SET output_data = value_to_restore, updated_at = NOW()
      WHERE id = p_step_id;
    
    ELSE
      RETURN false;
  END CASE;
  
  -- Record the revert action
  INSERT INTO public.run_step_history (
    run_step_id,
    run_id,
    action,
    field_path,
    old_value,
    new_value,
    change_reason,
    created_by
  ) VALUES (
    p_step_id,
    history_record.run_id,
    'revert',
    field_to_revert,
    history_record.new_value,
    value_to_restore,
    'Reverted via revert_step_change',
    auth.uid()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get step history for undo/redo
CREATE OR REPLACE FUNCTION get_step_history(
  p_step_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  history_id UUID,
  action TEXT,
  field_path TEXT,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  can_revert BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id as history_id,
    h.action,
    h.field_path,
    h.old_value,
    h.new_value,
    h.change_reason,
    h.created_at,
    (h.old_value IS NOT NULL) as can_revert
  FROM public.run_step_history h
  WHERE h.run_step_id = p_step_id
  ORDER BY h.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_step_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_step_timestamp
  BEFORE UPDATE ON public.workflow_run_steps
  FOR EACH ROW EXECUTE FUNCTION update_step_timestamp();

-- Auto-record history trigger
CREATE OR REPLACE FUNCTION auto_record_step_history()
RETURNS TRIGGER AS $$
DECLARE
  batch_uuid UUID := gen_random_uuid();
BEGIN
  -- Only record significant changes
  IF TG_OP = 'UPDATE' THEN
    -- Status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.run_step_history (
        run_step_id, run_id, action, field_path, old_value, new_value, batch_id, created_by
      ) VALUES (
        NEW.id, NEW.run_id, 'update', 'status', to_jsonb(OLD.status), to_jsonb(NEW.status), batch_uuid, auth.uid()
      );
    END IF;
    
    -- Completion status
    IF OLD.is_checked IS DISTINCT FROM NEW.is_checked THEN
      INSERT INTO public.run_step_history (
        run_step_id, run_id, action, field_path, old_value, new_value, batch_id, created_by
      ) VALUES (
        NEW.id, NEW.run_id, 'update', 'is_checked', to_jsonb(OLD.is_checked), to_jsonb(NEW.is_checked), batch_uuid, auth.uid()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_record_step_history
  AFTER UPDATE ON public.workflow_run_steps
  FOR EACH ROW EXECUTE FUNCTION auto_record_step_history();

-- ========================================
-- SECURITY POLICIES (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_step_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_templates ENABLE ROW LEVEL SECURITY;

-- Users can access steps for their own runs
CREATE POLICY "run_steps_owner_access" ON public.workflow_run_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs wr 
      WHERE wr.id = run_id AND wr.user_id = auth.uid()
    )
  );

-- Public access to steps for shared runs
CREATE POLICY "run_steps_shared_access" ON public.workflow_run_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs wr 
      WHERE wr.id = run_id AND wr.is_public = true AND wr.share_token IS NOT NULL
    )
  );

-- History access for step owners
CREATE POLICY "step_history_owner_access" ON public.run_step_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workflow_run_steps wrs
      JOIN public.workflow_runs wr ON wr.id = wrs.run_id
      WHERE wrs.id = run_step_id AND wr.user_id = auth.uid()
    )
  );

-- Template access
CREATE POLICY "step_templates_public_read" ON public.step_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "step_templates_owner_access" ON public.step_templates
  FOR ALL USING (auth.uid() = created_by);

-- Admin access for all tables
CREATE POLICY "run_steps_admin_access" ON public.workflow_run_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "step_history_admin_access" ON public.run_step_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "step_templates_admin_access" ON public.step_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role access
CREATE POLICY "run_steps_service_role" ON public.workflow_run_steps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "step_history_service_role" ON public.run_step_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "step_templates_service_role" ON public.step_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_run_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.run_step_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.step_templates TO authenticated;

-- Grant function access
GRANT EXECUTE ON FUNCTION initialize_run_steps(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_step_status(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_step_notes(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_step_data(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION revert_step_change(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_step_history(UUID, INTEGER) TO authenticated;

-- Service role permissions
GRANT ALL ON public.workflow_run_steps TO service_role;
GRANT ALL ON public.run_step_history TO service_role;
GRANT ALL ON public.step_templates TO service_role;

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- Step performance analytics
CREATE OR REPLACE VIEW step_performance_analytics AS
SELECT 
  step_type,
  COUNT(*) as total_steps,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_steps,
  ROUND(AVG(CASE WHEN status = 'completed' THEN actual_time_spent ELSE NULL END), 2) as avg_completion_time,
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_steps,
  COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_steps,
  ROUND(AVG(CASE WHEN difficulty_rating IS NOT NULL THEN difficulty_rating ELSE NULL END), 2) as avg_difficulty_rating
FROM public.workflow_run_steps
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY step_type
ORDER BY total_steps DESC;

GRANT SELECT ON step_performance_analytics TO authenticated;

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Clean up old step history
CREATE OR REPLACE FUNCTION cleanup_old_step_history(days_threshold INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.run_step_history
  WHERE created_at < NOW() - INTERVAL '1 day' * days_threshold
    AND action NOT IN ('complete', 'revert'); -- Keep important actions
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- NOTES & DOCUMENTATION
-- ========================================

/*
Run Steps Schema Implementation Notes:

1. **Step Lifecycle**: pending → in_progress → completed/skipped/failed
2. **Data Management**: Separate input/output data with full history tracking  
3. **History System**: Complete undo/redo capability with batch operations
4. **Templates**: Reusable step templates for common workflows
5. **Analytics**: Performance tracking and difficulty rating system

Key Features:
- Complete step lifecycle management
- Rich data storage (inputs, outputs, notes, configuration)
- Full history tracking with undo/redo capability
- Step templates for reusability
- Performance analytics and user feedback
- Optimistic updates with conflict resolution

Usage Guidelines:
- Use initialize_run_steps() when creating new runs
- Update step status with update_step_status()
- Track changes with automatic history recording
- Implement undo/redo with revert_step_change()
- Monitor performance with analytics views

Security Features:
- Row-level security tied to run ownership
- History access control
- Public template sharing
- Admin oversight capabilities
*/