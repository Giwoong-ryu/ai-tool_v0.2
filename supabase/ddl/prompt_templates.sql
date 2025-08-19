-- ========================================
-- EasyPick Prompt Templates Schema
-- 템플릿 버전 관리 및 메타데이터 시스템
-- ========================================

-- ========================================
-- PROMPT TEMPLATES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  -- Primary Key & Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL, -- URL-friendly identifier
  
  -- Template Metadata
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '📝',
  
  -- Version Management
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'draft')),
  
  -- Template Content (Handlebars format)
  template_content TEXT NOT NULL,
  
  -- JSON Schema Definition
  schema_definition JSONB NOT NULL,
  compiled_schema JSONB, -- Compiled/optimized schema for runtime
  
  -- Options Configuration
  options JSONB NOT NULL DEFAULT '[]',
  default_values JSONB DEFAULT '{}',
  
  -- Usage & Performance Metrics
  usage_stats JSONB DEFAULT jsonb_build_object(
    'total_usage', 0,
    'monthly_usage', 0,
    'success_rate', 100.0,
    'avg_generation_time', 0
  ),
  
  -- Template Metadata
  metadata JSONB DEFAULT jsonb_build_object(
    'author', 'EasyPick',
    'tags', '[]',
    'difficulty', 'beginner',
    'estimated_time', '5-10분',
    'last_tested', null
  ),
  
  -- Ownership & Access Control
  created_by UUID REFERENCES public.clerk_profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(slug, version),
  CONSTRAINT valid_version CHECK (version ~ '^\\d+\\.\\d+\\.\\d+$'),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9_-]+$'),
  CONSTRAINT schema_required CHECK (jsonb_typeof(schema_definition) = 'object'),
  CONSTRAINT options_is_array CHECK (jsonb_typeof(options) = 'array')
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_prompt_templates_slug ON public.prompt_templates(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON public.prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_status ON public.prompt_templates(status);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_created_by ON public.prompt_templates(created_by);

-- Version and metadata queries
CREATE INDEX IF NOT EXISTS idx_prompt_templates_version ON public.prompt_templates(version);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_featured ON public.prompt_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public ON public.prompt_templates(is_public) WHERE is_public = true;

-- Usage and performance queries
CREATE INDEX IF NOT EXISTS idx_prompt_templates_usage_stats ON public.prompt_templates USING GIN(usage_stats);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_metadata ON public.prompt_templates USING GIN(metadata);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active_public ON public.prompt_templates(category, status) 
  WHERE status = 'active' AND is_public = true;

-- ========================================
-- TEMPLATE VERSION MANAGEMENT
-- ========================================

-- Function to get latest version of a template
CREATE OR REPLACE FUNCTION get_latest_template_version(template_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  latest_version TEXT;
BEGIN
  SELECT version INTO latest_version
  FROM public.prompt_templates
  WHERE slug = template_slug AND status IN ('active', 'draft')
  ORDER BY 
    string_to_array(version, '.')::int[] DESC,
    updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(latest_version, '1.0.0');
END;
$$ LANGUAGE plpgsql;

-- Function to increment version
CREATE OR REPLACE FUNCTION increment_template_version(
  template_slug TEXT, 
  version_type TEXT DEFAULT 'patch' -- 'major', 'minor', 'patch'
)
RETURNS TEXT AS $$
DECLARE
  current_version TEXT;
  version_parts INT[];
  new_version TEXT;
BEGIN
  -- Get current latest version
  current_version := get_latest_template_version(template_slug);
  version_parts := string_to_array(current_version, '.')::int[];
  
  -- Increment based on type
  CASE version_type
    WHEN 'major' THEN
      version_parts[1] := version_parts[1] + 1;
      version_parts[2] := 0;
      version_parts[3] := 0;
    WHEN 'minor' THEN
      version_parts[2] := version_parts[2] + 1;
      version_parts[3] := 0;
    WHEN 'patch' THEN
      version_parts[3] := version_parts[3] + 1;
    ELSE
      RAISE EXCEPTION 'Invalid version type: %', version_type;
  END CASE;
  
  new_version := array_to_string(version_parts, '.');
  RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TEMPLATE VALIDATION FUNCTIONS
-- ========================================

-- Validate template schema
CREATE OR REPLACE FUNCTION validate_template_schema(schema_def JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check required fields
  IF NOT (schema_def ? 'type' AND schema_def ? 'properties') THEN
    RETURN FALSE;
  END IF;
  
  -- Validate properties structure
  IF jsonb_typeof(schema_def->'properties') != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Additional schema validation can be added here
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Validate template options
CREATE OR REPLACE FUNCTION validate_template_options(options_array JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  option_obj JSONB;
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(options_array) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each option
  FOR option_obj IN SELECT * FROM jsonb_array_elements(options_array)
  LOOP
    -- Check required fields
    IF NOT (option_obj ? 'key' AND option_obj ? 'label' AND option_obj ? 'type') THEN
      RETURN FALSE;
    END IF;
    
    -- Validate option type
    IF NOT (option_obj->>'type' = ANY(ARRAY['text', 'select', 'textarea', 'number', 'checkbox', 'multiselect'])) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_prompt_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_template_timestamp
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_prompt_template_timestamp();

-- Validation trigger
CREATE OR REPLACE FUNCTION validate_prompt_template_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate schema definition
  IF NOT validate_template_schema(NEW.schema_definition) THEN
    RAISE EXCEPTION 'Invalid schema definition';
  END IF;
  
  -- Validate options
  IF NOT validate_template_options(NEW.options) THEN
    RAISE EXCEPTION 'Invalid options configuration';
  END IF;
  
  -- Ensure slug is lowercase
  NEW.slug = lower(NEW.slug);
  
  -- Initialize usage stats if empty
  IF NEW.usage_stats IS NULL OR NEW.usage_stats = '{}'::jsonb THEN
    NEW.usage_stats = jsonb_build_object(
      'total_usage', 0,
      'monthly_usage', 0,
      'success_rate', 100.0,
      'avg_generation_time', 0
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_prompt_template
  BEFORE INSERT OR UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION validate_prompt_template_data();

-- ========================================
-- USAGE TRACKING FUNCTIONS
-- ========================================

-- Record template usage
CREATE OR REPLACE FUNCTION record_template_usage(
  template_id UUID,
  generation_time_ms INTEGER DEFAULT NULL,
  success BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
DECLARE
  current_stats JSONB;
  new_total INTEGER;
  new_monthly INTEGER;
  new_success_rate FLOAT;
  new_avg_time FLOAT;
BEGIN
  -- Get current stats
  SELECT usage_stats INTO current_stats
  FROM public.prompt_templates
  WHERE id = template_id;
  
  IF current_stats IS NULL THEN
    current_stats = jsonb_build_object(
      'total_usage', 0,
      'monthly_usage', 0,
      'success_rate', 100.0,
      'avg_generation_time', 0
    );
  END IF;
  
  -- Calculate new values
  new_total = (current_stats->>'total_usage')::int + 1;
  new_monthly = (current_stats->>'monthly_usage')::int + 1;
  
  -- Calculate success rate
  IF success THEN
    new_success_rate = ((current_stats->>'success_rate')::float * ((current_stats->>'total_usage')::int) + 100.0) / new_total;
  ELSE
    new_success_rate = ((current_stats->>'success_rate')::float * ((current_stats->>'total_usage')::int)) / new_total;
  END IF;
  
  -- Calculate average generation time
  IF generation_time_ms IS NOT NULL THEN
    new_avg_time = ((current_stats->>'avg_generation_time')::float * ((current_stats->>'total_usage')::int) + generation_time_ms) / new_total;
  ELSE
    new_avg_time = (current_stats->>'avg_generation_time')::float;
  END IF;
  
  -- Update stats
  UPDATE public.prompt_templates
  SET usage_stats = jsonb_build_object(
    'total_usage', new_total,
    'monthly_usage', new_monthly,
    'success_rate', round(new_success_rate::numeric, 2),
    'avg_generation_time', round(new_avg_time::numeric, 2),
    'last_used', NOW()
  )
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly usage stats (run monthly)
CREATE OR REPLACE FUNCTION reset_monthly_usage_stats()
RETURNS VOID AS $$
BEGIN
  UPDATE public.prompt_templates
  SET usage_stats = usage_stats || jsonb_build_object('monthly_usage', 0);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TEMPLATE SEARCH & DISCOVERY
-- ========================================

-- Search templates with full-text search
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  category TEXT,
  description TEXT,
  icon TEXT,
  version TEXT,
  usage_count INTEGER,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.slug,
    pt.name,
    pt.category,
    pt.description,
    pt.icon,
    pt.version,
    (pt.usage_stats->>'total_usage')::INTEGER as usage_count,
    CASE 
      WHEN search_query IS NULL OR search_query = '' THEN 1.0
      ELSE (
        ts_rank(
          to_tsvector('korean', pt.name || ' ' || pt.description || ' ' || COALESCE(pt.metadata->>'tags', '')),
          plainto_tsquery('korean', search_query)
        ) * 0.7 +
        (pt.usage_stats->>'total_usage')::INTEGER * 0.0001 * 0.3
      )
    END as relevance_score
  FROM public.prompt_templates pt
  WHERE 
    pt.status = 'active' 
    AND pt.is_public = true
    AND (category_filter IS NULL OR pt.category = category_filter)
    AND (
      search_query IS NULL 
      OR search_query = '' 
      OR to_tsvector('korean', pt.name || ' ' || pt.description || ' ' || COALESCE(pt.metadata->>'tags', '')) @@ plainto_tsquery('korean', search_query)
    )
  ORDER BY relevance_score DESC, pt.usage_stats->>'total_usage' DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SECURITY POLICIES (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Public templates - everyone can read
CREATE POLICY "prompt_templates_public_read" ON public.prompt_templates
  FOR SELECT USING (is_public = true AND status = 'active');

-- Users can read their own templates
CREATE POLICY "prompt_templates_owner_read" ON public.prompt_templates
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create templates
CREATE POLICY "prompt_templates_create" ON public.prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own templates
CREATE POLICY "prompt_templates_owner_update" ON public.prompt_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "prompt_templates_owner_delete" ON public.prompt_templates
  FOR DELETE USING (auth.uid() = created_by);

-- Admin access policy
CREATE POLICY "prompt_templates_admin_all" ON public.prompt_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clerk_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "prompt_templates_service_role" ON public.prompt_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_templates TO authenticated;
GRANT USAGE ON SEQUENCE prompt_templates_id_seq TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION get_latest_template_version(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_template_version(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_template_usage(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION search_templates(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- Service role permissions
GRANT ALL ON public.prompt_templates TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert default templates (only if not exists)
INSERT INTO public.prompt_templates (
  slug, name, category, description, icon, template_content, schema_definition, options, default_values, metadata, is_public, is_featured
) VALUES (
  'resume_cover_letter',
  '자기소개서 / 커버레터',
  '취업',
  '입사지원서나 자기소개서 작성을 위한 프롬프트',
  '📝',
  '{{company}}의 {{position}} 직무에 지원하는 자기소개서를 작성해주세요.

제가 {{experience}} 수준의 경험을 가지고 있으며, 다음과 같은 내용을 포함해서 {{tone}} 어조로 {{length}} 분량으로 작성해주세요:

## 구성 요소
{{#list sections}}
{{/list}}

## 작성 지침
- 구체적인 경험과 성과를 포함해주세요
- 해당 직무와 연관성을 강조해주세요  
- 차별화된 강점을 부각해주세요',
  '{
    "type": "object",
    "properties": {
      "position": {"type": "string", "description": "지원 직무"},
      "company": {"type": "string", "description": "회사명"},
      "experience": {"type": "string", "description": "경력 수준"},
      "tone": {"type": "string", "description": "작성 톤"},
      "length": {"type": "string", "description": "분량"}
    },
    "required": ["position", "experience", "tone", "length"]
  }',
  '[
    {
      "key": "position",
      "label": "지원 직무",
      "type": "select",
      "options": ["소프트웨어 엔지니어", "프로덕트 매니저", "UI/UX 디자이너", "데이터 분석가", "마케팅 전문가", "영업 관리자"],
      "required": true
    },
    {
      "key": "company",
      "label": "회사명",
      "type": "text",
      "placeholder": "지원하는 회사명을 입력하세요",
      "required": false
    },
    {
      "key": "experience",
      "label": "경력 수준",
      "type": "select", 
      "options": ["신입", "1~3년차", "3~5년차", "5~10년차", "10년차 이상", "시니어급"],
      "required": true
    },
    {
      "key": "tone",
      "label": "작성 톤",
      "type": "select",
      "options": ["정중하고 격식있게", "친근하고 자연스럽게", "전문적이고 간결하게", "유머러스하고 재치있게", "감성적이고 따뜻하게", "단호하고 설득력있게"],
      "required": true
    },
    {
      "key": "length",
      "label": "분량",
      "type": "select",
      "options": ["마이크로카피 (50자 이하)", "짧게 (200-400자)", "보통 (500-800자)", "길게 (1000-1500자)", "아주 길게 (2000자 이상)"],
      "required": true
    }
  ]',
  '{
    "position": "소프트웨어 엔지니어",
    "experience": "신입",
    "tone": "정중하고 격식있게",
    "length": "보통 (500-800자)"
  }',
  '{
    "author": "EasyPick",
    "tags": ["취업", "자기소개서", "커버레터", "입사지원"],
    "difficulty": "beginner",
    "estimated_time": "5-10분"
  }',
  true,
  true
) ON CONFLICT (slug, version) DO NOTHING;

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Function to clean up old template versions
CREATE OR REPLACE FUNCTION cleanup_old_template_versions(keep_versions INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  template_slug TEXT;
BEGIN
  -- For each unique template slug
  FOR template_slug IN 
    SELECT DISTINCT slug FROM public.prompt_templates
  LOOP
    -- Delete old versions beyond the keep_versions limit
    WITH versions_to_delete AS (
      SELECT id
      FROM public.prompt_templates
      WHERE slug = template_slug
      ORDER BY 
        string_to_array(version, '.')::int[] DESC,
        updated_at DESC
      OFFSET keep_versions
    )
    DELETE FROM public.prompt_templates
    WHERE id IN (SELECT id FROM versions_to_delete);
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERFORMANCE MONITORING
-- ========================================

-- View for template performance analytics
CREATE OR REPLACE VIEW template_performance_analytics AS
SELECT 
  slug,
  name,
  category,
  version,
  (usage_stats->>'total_usage')::INTEGER as total_usage,
  (usage_stats->>'monthly_usage')::INTEGER as monthly_usage,
  (usage_stats->>'success_rate')::FLOAT as success_rate,
  (usage_stats->>'avg_generation_time')::FLOAT as avg_generation_time_ms,
  is_featured,
  created_at,
  updated_at
FROM public.prompt_templates
WHERE status = 'active' AND is_public = true
ORDER BY (usage_stats->>'total_usage')::INTEGER DESC;

-- Grant access to view
GRANT SELECT ON template_performance_analytics TO authenticated;

-- ========================================
-- NOTES & DOCUMENTATION
-- ========================================

/*
Template Schema Implementation Notes:

1. **Version Management**: Uses semantic versioning (major.minor.patch)
2. **Schema Validation**: JSON Schema for template structure validation
3. **Performance Tracking**: Usage statistics and generation time metrics
4. **Search Capabilities**: Full-text search with relevance scoring
5. **Security**: Row-level security for access control
6. **Maintenance**: Automated cleanup and archival functions

Key Features:
- Template versioning with automatic increment functions
- JSON Schema validation for template structure
- Usage analytics and performance monitoring
- Full-text search with Korean language support
- Comprehensive security policies
- Maintenance and cleanup procedures

Usage Guidelines:
- Use search_templates() for template discovery
- Record usage with record_template_usage() for analytics
- Use version management functions for template updates
- Regular cleanup with cleanup_old_template_versions()
*/