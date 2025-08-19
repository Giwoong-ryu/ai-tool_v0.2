-- ========================================
-- EasyPick Prompt Template Forks Schema
-- 포크 및 변경사항 관리 시스템
-- ========================================

-- ========================================
-- PROMPT TEMPLATE FORKS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.prompt_template_forks (
  -- Primary Key & Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Fork Relationships
  parent_template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  forked_template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  
  -- Fork Metadata
  fork_type TEXT NOT NULL DEFAULT 'fork' CHECK (fork_type IN ('fork', 'remix', 'clone')),
  fork_reason TEXT, -- User-provided reason for forking
  
  -- Change Tracking
  changes JSONB DEFAULT '{}', -- Detailed diff of changes
  change_summary JSONB DEFAULT jsonb_build_object(
    'added_fields', '[]',
    'modified_fields', '[]',
    'removed_fields', '[]',
    'total_changes', 0
  ),
  
  -- Diff Storage (parent → fork)
  content_diff JSONB, -- Template content differences
  schema_diff JSONB,  -- Schema differences  
  options_diff JSONB, -- Options differences
  metadata_diff JSONB, -- Metadata differences
  
  -- Fork Status & Lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'abandoned', 'conflict')),
  merge_status TEXT CHECK (merge_status IN ('pending', 'approved', 'rejected', 'auto-merged')),
  
  -- Ownership & Access
  created_by UUID NOT NULL REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  merged_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT different_templates CHECK (parent_template_id != forked_template_id),
  CONSTRAINT valid_diff_structure CHECK (
    jsonb_typeof(changes) = 'object' AND
    jsonb_typeof(change_summary) = 'object'
  )
);

-- ========================================
-- FORK CHANGE HISTORY TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.fork_change_history (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  fork_id UUID NOT NULL REFERENCES public.prompt_template_forks(id) ON DELETE CASCADE,
  
  -- Change Details
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'merge', 'revert')),
  field_path TEXT, -- JSON path to changed field (e.g., 'options[0].label')
  old_value JSONB,
  new_value JSONB,
  
  -- Change Context
  change_reason TEXT,
  batch_id UUID, -- Group related changes together
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexing
  CONSTRAINT valid_json_values CHECK (
    old_value IS NULL OR jsonb_typeof(old_value) IS NOT NULL
  )
);

-- ========================================
-- MERGE REQUESTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.fork_merge_requests (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  fork_id UUID NOT NULL REFERENCES public.prompt_template_forks(id) ON DELETE CASCADE,
  parent_template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  
  -- Request Details
  title TEXT NOT NULL,
  description TEXT,
  proposed_changes JSONB NOT NULL DEFAULT '{}',
  
  -- Review Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'merged')),
  reviewer_id UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  
  -- Conflict Resolution
  conflicts JSONB DEFAULT '[]', -- Array of conflicting fields
  resolution_strategy TEXT CHECK (resolution_strategy IN ('auto', 'manual', 'prefer_parent', 'prefer_fork')),
  
  -- Request Metadata
  requested_by UUID NOT NULL REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  merged_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_proposed_changes CHECK (jsonb_typeof(proposed_changes) = 'object'),
  CONSTRAINT valid_conflicts CHECK (jsonb_typeof(conflicts) = 'array')
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Fork relationships and queries
CREATE INDEX IF NOT EXISTS idx_fork_parent_template ON public.prompt_template_forks(parent_template_id);
CREATE INDEX IF NOT EXISTS idx_fork_forked_template ON public.prompt_template_forks(forked_template_id);
CREATE INDEX IF NOT EXISTS idx_fork_created_by ON public.prompt_template_forks(created_by);
CREATE INDEX IF NOT EXISTS idx_fork_status ON public.prompt_template_forks(status);
CREATE INDEX IF NOT EXISTS idx_fork_type ON public.prompt_template_forks(fork_type);

-- Change history queries
CREATE INDEX IF NOT EXISTS idx_change_history_fork ON public.fork_change_history(fork_id);
CREATE INDEX IF NOT EXISTS idx_change_history_batch ON public.fork_change_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_change_history_created_at ON public.fork_change_history(created_at);

-- Merge request queries
CREATE INDEX IF NOT EXISTS idx_merge_request_fork ON public.fork_merge_requests(fork_id);
CREATE INDEX IF NOT EXISTS idx_merge_request_status ON public.fork_merge_requests(status);
CREATE INDEX IF NOT EXISTS idx_merge_request_reviewer ON public.fork_merge_requests(reviewer_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_fork_parent_status ON public.prompt_template_forks(parent_template_id, status);
CREATE INDEX IF NOT EXISTS idx_merge_request_status_date ON public.fork_merge_requests(status, requested_at);

-- ========================================
-- FORK MANAGEMENT FUNCTIONS
-- ========================================

-- Create a new fork
CREATE OR REPLACE FUNCTION create_template_fork(
  parent_id UUID,
  fork_data JSONB,
  fork_reason TEXT DEFAULT NULL,
  fork_type TEXT DEFAULT 'fork'
)
RETURNS UUID AS $$
DECLARE
  new_template_id UUID;
  new_fork_id UUID;
  parent_data JSONB;
  computed_diff JSONB;
BEGIN
  -- Get parent template data
  SELECT row_to_json(pt) INTO parent_data
  FROM public.prompt_templates pt
  WHERE id = parent_id AND status = 'active';
  
  IF parent_data IS NULL THEN
    RAISE EXCEPTION 'Parent template not found or not active';
  END IF;
  
  -- Create new template from fork data
  INSERT INTO public.prompt_templates (
    slug,
    name,
    category,
    description,
    icon,
    version,
    template_content,
    schema_definition,
    options,
    default_values,
    metadata,
    created_by,
    is_public
  ) VALUES (
    (fork_data->>'slug') || '_fork_' || extract(epoch from now())::bigint,
    fork_data->>'name',
    fork_data->>'category',
    fork_data->>'description',
    COALESCE(fork_data->>'icon', '🍴'),
    '1.0.0', -- Fork starts at 1.0.0
    fork_data->>'template_content',
    fork_data->'schema_definition',
    fork_data->'options',
    fork_data->'default_values',
    fork_data->'metadata',
    auth.uid(),
    COALESCE((fork_data->>'is_public')::boolean, false)
  ) RETURNING id INTO new_template_id;
  
  -- Calculate diff
  computed_diff := calculate_template_diff(parent_data, fork_data);
  
  -- Create fork record
  INSERT INTO public.prompt_template_forks (
    parent_template_id,
    forked_template_id,
    fork_type,
    fork_reason,
    changes,
    change_summary,
    content_diff,
    schema_diff,
    options_diff,
    metadata_diff,
    created_by
  ) VALUES (
    parent_id,
    new_template_id,
    fork_type,
    fork_reason,
    computed_diff->'changes',
    computed_diff->'summary',
    computed_diff->'content_diff',
    computed_diff->'schema_diff',
    computed_diff->'options_diff',
    computed_diff->'metadata_diff',
    auth.uid()
  ) RETURNING id INTO new_fork_id;
  
  RETURN new_fork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate diff between templates
CREATE OR REPLACE FUNCTION calculate_template_diff(
  parent_data JSONB,
  fork_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  changes JSONB := '{}';
  summary JSONB;
  added_fields TEXT[] := '{}';
  modified_fields TEXT[] := '{}';
  removed_fields TEXT[] := '{}';
  field_name TEXT;
BEGIN
  -- Compare each field
  FOR field_name IN SELECT jsonb_object_keys(parent_data UNION SELECT jsonb_object_keys(fork_data))
  LOOP
    IF parent_data->>field_name IS DISTINCT FROM fork_data->>field_name THEN
      IF parent_data ? field_name AND NOT fork_data ? field_name THEN
        -- Field removed
        removed_fields := array_append(removed_fields, field_name);
        changes := changes || jsonb_build_object(
          field_name, jsonb_build_object(
            'type', 'removed',
            'old_value', parent_data->field_name
          )
        );
      ELSIF NOT parent_data ? field_name AND fork_data ? field_name THEN
        -- Field added
        added_fields := array_append(added_fields, field_name);
        changes := changes || jsonb_build_object(
          field_name, jsonb_build_object(
            'type', 'added',
            'new_value', fork_data->field_name
          )
        );
      ELSE
        -- Field modified
        modified_fields := array_append(modified_fields, field_name);
        changes := changes || jsonb_build_object(
          field_name, jsonb_build_object(
            'type', 'modified',
            'old_value', parent_data->field_name,
            'new_value', fork_data->field_name
          )
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Build summary
  summary := jsonb_build_object(
    'added_fields', to_jsonb(added_fields),
    'modified_fields', to_jsonb(modified_fields),
    'removed_fields', to_jsonb(removed_fields),
    'total_changes', array_length(added_fields, 1) + array_length(modified_fields, 1) + array_length(removed_fields, 1)
  );
  
  -- Build result
  result := jsonb_build_object(
    'changes', changes,
    'summary', summary,
    'content_diff', CASE WHEN parent_data->>'template_content' IS DISTINCT FROM fork_data->>'template_content' 
                         THEN jsonb_build_object('old', parent_data->'template_content', 'new', fork_data->'template_content')
                         ELSE NULL END,
    'schema_diff', CASE WHEN parent_data->'schema_definition' IS DISTINCT FROM fork_data->'schema_definition'
                        THEN jsonb_build_object('old', parent_data->'schema_definition', 'new', fork_data->'schema_definition')
                        ELSE NULL END,
    'options_diff', CASE WHEN parent_data->'options' IS DISTINCT FROM fork_data->'options'
                         THEN jsonb_build_object('old', parent_data->'options', 'new', fork_data->'options')
                         ELSE NULL END,
    'metadata_diff', CASE WHEN parent_data->'metadata' IS DISTINCT FROM fork_data->'metadata'
                          THEN jsonb_build_object('old', parent_data->'metadata', 'new', fork_data->'metadata')
                          ELSE NULL END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Apply fork changes to parent
CREATE OR REPLACE FUNCTION merge_fork_to_parent(
  fork_id UUID,
  merge_strategy TEXT DEFAULT 'manual',
  reviewer_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  fork_record RECORD;
  parent_template RECORD;
  new_version TEXT;
  merge_successful BOOLEAN := false;
BEGIN
  -- Get fork details
  SELECT * INTO fork_record
  FROM public.prompt_template_forks
  WHERE id = fork_id AND status = 'active';
  
  IF fork_record IS NULL THEN
    RAISE EXCEPTION 'Fork not found or not active';
  END IF;
  
  -- Get parent template
  SELECT * INTO parent_template
  FROM public.prompt_templates
  WHERE id = fork_record.parent_template_id;
  
  -- Calculate new version for parent
  new_version := increment_template_version(parent_template.slug, 'minor');
  
  -- Create new version of parent with merged changes
  BEGIN
    -- This is a simplified merge - in production, you'd want more sophisticated conflict resolution
    UPDATE public.prompt_templates
    SET 
      template_content = COALESCE(
        fork_record.content_diff->>'new',
        template_content
      ),
      schema_definition = COALESCE(
        fork_record.schema_diff->'new',
        schema_definition
      ),
      options = COALESCE(
        fork_record.options_diff->'new',
        options
      ),
      metadata = COALESCE(
        fork_record.metadata_diff->'new',
        metadata
      ),
      version = new_version,
      updated_at = NOW()
    WHERE id = fork_record.parent_template_id;
    
    -- Update fork status
    UPDATE public.prompt_template_forks
    SET 
      status = 'merged',
      merge_status = 'approved',
      merged_at = NOW(),
      approved_by = auth.uid()
    WHERE id = fork_id;
    
    merge_successful := true;
    
  EXCEPTION WHEN OTHERS THEN
    -- Handle merge conflicts
    UPDATE public.prompt_template_forks
    SET 
      status = 'conflict',
      merge_status = 'rejected'
    WHERE id = fork_id;
    
    merge_successful := false;
  END;
  
  RETURN merge_successful;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get fork tree for a template
CREATE OR REPLACE FUNCTION get_fork_tree(template_id UUID)
RETURNS TABLE (
  fork_id UUID,
  forked_template_id UUID,
  forked_template_name TEXT,
  fork_type TEXT,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  total_changes INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE fork_tree AS (
    -- Base case: direct forks
    SELECT 
      f.id as fork_id,
      f.forked_template_id,
      pt.name as forked_template_name,
      f.fork_type,
      cp.email as created_by_name,
      f.created_at,
      (f.change_summary->>'total_changes')::INTEGER as total_changes,
      f.status,
      1 as depth
    FROM public.prompt_template_forks f
    JOIN public.prompt_templates pt ON f.forked_template_id = pt.id
    JOIN public.clerk_profiles cp ON f.created_by = cp.id
    WHERE f.parent_template_id = template_id
    
    UNION ALL
    
    -- Recursive case: forks of forks
    SELECT 
      f.id as fork_id,
      f.forked_template_id,
      pt.name as forked_template_name,
      f.fork_type,
      cp.email as created_by_name,
      f.created_at,
      (f.change_summary->>'total_changes')::INTEGER as total_changes,
      f.status,
      ft.depth + 1
    FROM public.prompt_template_forks f
    JOIN fork_tree ft ON f.parent_template_id = ft.forked_template_id
    JOIN public.prompt_templates pt ON f.forked_template_id = pt.id
    JOIN public.clerk_profiles cp ON f.created_by = cp.id
    WHERE ft.depth < 5 -- Prevent infinite recursion
  )
  SELECT * FROM fork_tree
  ORDER BY depth, created_at;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_fork_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fork_timestamp
  BEFORE UPDATE ON public.prompt_template_forks
  FOR EACH ROW EXECUTE FUNCTION update_fork_timestamp();

-- Record change history trigger
CREATE OR REPLACE FUNCTION record_fork_change()
RETURNS TRIGGER AS $$
DECLARE
  batch_uuid UUID := gen_random_uuid();
BEGIN
  -- Record changes in history table
  IF TG_OP = 'UPDATE' THEN
    -- Compare old and new values for specific fields
    IF OLD.changes IS DISTINCT FROM NEW.changes THEN
      INSERT INTO public.fork_change_history (
        fork_id, change_type, field_path, old_value, new_value, batch_id, created_by
      ) VALUES (
        NEW.id, 'update', 'changes', OLD.changes, NEW.changes, batch_uuid, auth.uid()
      );
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.fork_change_history (
        fork_id, change_type, field_path, old_value, new_value, batch_id, created_by
      ) VALUES (
        NEW.id, 'update', 'status', to_jsonb(OLD.status), to_jsonb(NEW.status), batch_uuid, auth.uid()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_fork_change
  AFTER UPDATE ON public.prompt_template_forks
  FOR EACH ROW EXECUTE FUNCTION record_fork_change();

-- ========================================
-- SECURITY POLICIES (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.prompt_template_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fork_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fork_merge_requests ENABLE ROW LEVEL SECURITY;

-- Fork access policies
CREATE POLICY "forks_owner_access" ON public.prompt_template_forks
  FOR ALL USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT pt.created_by FROM public.prompt_templates pt 
      WHERE pt.id = parent_template_id
    )
  );

CREATE POLICY "forks_public_read" ON public.prompt_template_forks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompt_templates pt 
      WHERE pt.id = parent_template_id AND pt.is_public = true
    )
  );

-- Change history policies
CREATE POLICY "change_history_owner_access" ON public.fork_change_history
  FOR ALL USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.prompt_template_forks f
      WHERE f.id = fork_id AND auth.uid() = f.created_by
    )
  );

-- Merge request policies
CREATE POLICY "merge_requests_stakeholder_access" ON public.fork_merge_requests
  FOR ALL USING (
    auth.uid() = requested_by OR
    auth.uid() = reviewer_id OR
    EXISTS (
      SELECT 1 FROM public.prompt_templates pt 
      WHERE pt.id = parent_template_id AND auth.uid() = pt.created_by
    )
  );

-- Admin access for all tables
CREATE POLICY "forks_admin_access" ON public.prompt_template_forks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "change_history_admin_access" ON public.fork_change_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "merge_requests_admin_access" ON public.fork_merge_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role access
CREATE POLICY "forks_service_role" ON public.prompt_template_forks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "change_history_service_role" ON public.fork_change_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "merge_requests_service_role" ON public.fork_merge_requests
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_template_forks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fork_change_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fork_merge_requests TO authenticated;

-- Grant function access
GRANT EXECUTE ON FUNCTION create_template_fork(UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_template_diff(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_fork_to_parent(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fork_tree(UUID) TO authenticated;

-- Service role permissions
GRANT ALL ON public.prompt_template_forks TO service_role;
GRANT ALL ON public.fork_change_history TO service_role;
GRANT ALL ON public.fork_merge_requests TO service_role;

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- Fork statistics view
CREATE OR REPLACE VIEW fork_analytics AS
SELECT 
  pt.slug as parent_slug,
  pt.name as parent_name,
  COUNT(f.id) as total_forks,
  COUNT(CASE WHEN f.status = 'active' THEN 1 END) as active_forks,
  COUNT(CASE WHEN f.status = 'merged' THEN 1 END) as merged_forks,
  COUNT(CASE WHEN f.fork_type = 'remix' THEN 1 END) as remixes,
  AVG((f.change_summary->>'total_changes')::INTEGER) as avg_changes_per_fork,
  MAX(f.created_at) as last_fork_date
FROM public.prompt_templates pt
LEFT JOIN public.prompt_template_forks f ON pt.id = f.parent_template_id
WHERE pt.is_public = true
GROUP BY pt.id, pt.slug, pt.name
HAVING COUNT(f.id) > 0
ORDER BY total_forks DESC;

GRANT SELECT ON fork_analytics TO authenticated;

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Clean up abandoned forks
CREATE OR REPLACE FUNCTION cleanup_abandoned_forks(days_threshold INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Mark old inactive forks as abandoned
  UPDATE public.prompt_template_forks
  SET status = 'abandoned'
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '1 day' * days_threshold
    AND (change_summary->>'total_changes')::INTEGER = 0;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- NOTES & DOCUMENTATION
-- ========================================

/*
Fork System Implementation Notes:

1. **Fork Types**:
   - fork: Direct copy with modifications
   - remix: Significant changes/improvements
   - clone: Exact copy for different use case

2. **Change Tracking**:
   - Detailed diff storage for all template fields
   - Change history with batch tracking
   - Summary statistics for quick analysis

3. **Merge System**:
   - Merge requests with approval workflow
   - Conflict detection and resolution
   - Version management integration

4. **Security**:
   - Row-level security for access control
   - Owner-based permissions
   - Public template fork visibility

Key Features:
- Complete fork lifecycle management
- Detailed change tracking and diff storage
- Merge request workflow with approvals
- Fork tree visualization and analytics
- Automated cleanup and maintenance

Usage Guidelines:
- Use create_template_fork() to create new forks
- Track changes with automatic history recording
- Use merge_fork_to_parent() for approved merges
- Monitor fork analytics for popular templates
- Regular cleanup with cleanup_abandoned_forks()
*/