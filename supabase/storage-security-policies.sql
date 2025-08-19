-- ========================================
-- EasyPick Supabase Storage Security Policies
-- File upload, sharing, and access control
-- ========================================

-- ========================================
-- STORAGE BUCKETS CONFIGURATION
-- ========================================

-- Create storage buckets with appropriate settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'user-prompts',
    'user-prompts',
    false,  -- Private bucket
    5242880,  -- 5MB limit
    ARRAY['text/plain', 'application/json', 'text/markdown']
  ),
  (
    'user-exports',
    'user-exports', 
    false,  -- Private bucket
    52428800,  -- 50MB limit
    ARRAY['application/json', 'text/csv', 'application/pdf', 'text/plain']
  ),
  (
    'user-avatars',
    'user-avatars',
    false,  -- Private bucket with signed URLs
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'workflow-templates',
    'workflow-templates',
    false,  -- Private bucket
    10485760,  -- 10MB limit  
    ARRAY['application/json', 'text/yaml', 'text/plain']
  ),
  (
    'public-assets',
    'public-assets',
    true,   -- Public bucket for static assets
    10485760,  -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'text/css', 'application/javascript']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- USER PROMPTS BUCKET - Private User Data
-- ========================================

-- Users can view their own prompt files
CREATE POLICY "user_prompts_select_own" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'user-prompts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can insert their own prompt files with proper naming
CREATE POLICY "user_prompts_insert_own" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-prompts'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND array_length(storage.foldername(name), 1) >= 2  -- Must have user_id/filename structure
  AND length((storage.foldername(name))[2]) <= 255    -- Reasonable filename length
  AND (storage.foldername(name))[2] ~ '^[a-zA-Z0-9._-]+$'  -- Safe filename characters
);

-- Users can update their own prompt files
CREATE POLICY "user_prompts_update_own" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-prompts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own prompt files
CREATE POLICY "user_prompts_delete_own" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-prompts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role has full access for maintenance
CREATE POLICY "user_prompts_service_role_all" 
ON storage.objects FOR ALL 
USING (bucket_id = 'user-prompts' AND auth.role() = 'service_role');

-- ========================================
-- USER EXPORTS BUCKET - Generated Content
-- ========================================

-- Users can view their own export files
CREATE POLICY "user_exports_select_own" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'user-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only service role can create export files (from backend processes)
CREATE POLICY "user_exports_insert_service_only" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-exports'
  AND auth.role() = 'service_role'
  AND array_length(storage.foldername(name), 1) >= 2
  AND (storage.foldername(name))[2] ~ '^[a-zA-Z0-9._-]+$'
);

-- Users can delete their own export files
CREATE POLICY "user_exports_delete_own" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role has full access
CREATE POLICY "user_exports_service_role_all" 
ON storage.objects FOR ALL 
USING (bucket_id = 'user-exports' AND auth.role() = 'service_role');

-- ========================================
-- USER AVATARS BUCKET - Profile Images
-- ========================================

-- Users can view their own avatar
CREATE POLICY "user_avatars_select_own" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload their own avatar (with size validation)
CREATE POLICY "user_avatars_insert_own" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND array_length(storage.foldername(name), 1) = 2  -- Must be user_id/filename only
  AND (storage.foldername(name))[2] ~ '^avatar\.(jpg|jpeg|png|webp|avif)$'  -- Specific naming convention
);

-- Users can update their own avatar
CREATE POLICY "user_avatars_update_own" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "user_avatars_delete_own" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role has full access
CREATE POLICY "user_avatars_service_role_all" 
ON storage.objects FOR ALL 
USING (bucket_id = 'user-avatars' AND auth.role() = 'service_role');

-- ========================================
-- WORKFLOW TEMPLATES BUCKET - Shared Templates
-- ========================================

-- All authenticated users can view workflow templates
CREATE POLICY "workflow_templates_select_authenticated" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'workflow-templates' 
  AND auth.role() = 'authenticated'
);

-- Only admin users can upload workflow templates
CREATE POLICY "workflow_templates_insert_admin_only" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'workflow-templates'
  AND EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND name ~ '^[a-zA-Z0-9._/-]+$'  -- Safe path characters
);

-- Only admin users can update workflow templates
CREATE POLICY "workflow_templates_update_admin_only" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'workflow-templates'
  AND EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admin users can delete workflow templates
CREATE POLICY "workflow_templates_delete_admin_only" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'workflow-templates'
  AND EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role has full access
CREATE POLICY "workflow_templates_service_role_all" 
ON storage.objects FOR ALL 
USING (bucket_id = 'workflow-templates' AND auth.role() = 'service_role');

-- ========================================
-- PUBLIC ASSETS BUCKET - Static Files
-- ========================================

-- Everyone can view public assets
CREATE POLICY "public_assets_select_all" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'public-assets');

-- Only admin users can manage public assets
CREATE POLICY "public_assets_insert_admin_only" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'public-assets'
  AND EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND name ~ '^[a-zA-Z0-9._/-]+$'
);

CREATE POLICY "public_assets_update_admin_only" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'public-assets'
  AND EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "public_assets_delete_admin_only" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'public-assets'
  AND EXISTS (
    SELECT 1 FROM public.clerk_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role has full access
CREATE POLICY "public_assets_service_role_all" 
ON storage.objects FOR ALL 
USING (bucket_id = 'public-assets' AND auth.role() = 'service_role');

-- ========================================
-- STORAGE UTILITY FUNCTIONS
-- ========================================

-- Function to generate secure signed URLs with limited expiry
CREATE OR REPLACE FUNCTION storage.generate_secure_url(
  bucket_name TEXT,
  object_path TEXT,
  expires_in_seconds INTEGER DEFAULT 900  -- 15 minutes default
) RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
  user_folder TEXT;
BEGIN
  -- Security check: ensure user can only access their own files
  user_folder := split_part(object_path, '/', 1);
  
  IF user_folder != auth.uid()::text THEN
    RAISE EXCEPTION 'Access denied: cannot access other users files';
  END IF;
  
  -- Limit expiry time to maximum of 1 hour
  IF expires_in_seconds > 3600 THEN
    expires_in_seconds := 3600;
  END IF;
  
  -- Generate signed URL
  signed_url := storage.presigned_url(bucket_name, object_path, expires_in_seconds);
  
  RETURN signed_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old files
CREATE OR REPLACE FUNCTION storage.cleanup_old_files()
RETURNS void AS $$
BEGIN
  -- Delete user exports older than 30 days
  DELETE FROM storage.objects 
  WHERE bucket_id = 'user-exports' 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Delete temporary files older than 24 hours
  DELETE FROM storage.objects 
  WHERE bucket_id IN ('user-prompts', 'user-exports')
    AND name LIKE '%/temp/%'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- Log cleanup activity
  INSERT INTO public.audit_log (table_name, operation, user_id, new_values)
  VALUES ('storage.objects', 'CLEANUP', NULL, 
    jsonb_build_object('cleaned_at', NOW(), 'action', 'automated_cleanup'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file uploads
CREATE OR REPLACE FUNCTION storage.validate_upload()
RETURNS TRIGGER AS $$
DECLARE
  file_extension TEXT;
  user_storage_usage BIGINT;
  user_storage_limit BIGINT;
BEGIN
  -- Extract file extension
  file_extension := lower(split_part(NEW.name, '.', array_length(string_to_array(NEW.name, '.'), 1)));
  
  -- Check if user has exceeded storage quota
  SELECT COALESCE(SUM(metadata->>'size'), 0)::BIGINT INTO user_storage_usage
  FROM storage.objects 
  WHERE bucket_id IN ('user-prompts', 'user-exports', 'user-avatars')
    AND (storage.foldername(name))[1] = auth.uid()::text;
  
  -- Get user storage limit based on subscription
  SELECT CASE 
    WHEN role = 'business' THEN 10737418240  -- 10GB
    WHEN role = 'pro' THEN 1073741824       -- 1GB  
    ELSE 104857600                          -- 100MB for free users
  END INTO user_storage_limit
  FROM public.clerk_profiles 
  WHERE id = auth.uid();
  
  -- Check storage limit
  IF user_storage_usage + COALESCE((NEW.metadata->>'size')::BIGINT, 0) > user_storage_limit THEN
    RAISE EXCEPTION 'Storage quota exceeded. Usage: % bytes, Limit: % bytes', 
      user_storage_usage, user_storage_limit;
  END IF;
  
  -- Validate file naming conventions
  IF NEW.bucket_id != 'public-assets' THEN
    -- Check for malicious file extensions
    IF file_extension = ANY(ARRAY['exe', 'bat', 'cmd', 'sh', 'php', 'asp', 'jsp', 'js', 'html', 'htm']) THEN
      RAISE EXCEPTION 'File type not allowed: %', file_extension;
    END IF;
    
    -- Check for directory traversal attempts
    IF NEW.name ~ '\.\.|//|\\' THEN
      RAISE EXCEPTION 'Invalid file path: %', NEW.name;
    END IF;
  END IF;
  
  -- Set metadata
  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'uploaded_by', auth.uid(),
      'uploaded_at', NOW(),
      'ip_address', current_setting('request.headers')::json->>'cf-connecting-ip'
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply upload validation trigger
CREATE TRIGGER validate_storage_upload
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION storage.validate_upload();

-- ========================================
-- STORAGE MONITORING VIEWS
-- ========================================

-- User storage usage view
CREATE OR REPLACE VIEW user_storage_usage AS
SELECT 
  cp.id as user_id,
  cp.email,
  cp.role,
  COALESCE(SUM(CASE WHEN so.bucket_id = 'user-prompts' THEN (so.metadata->>'size')::BIGINT END), 0) as prompts_usage,
  COALESCE(SUM(CASE WHEN so.bucket_id = 'user-exports' THEN (so.metadata->>'size')::BIGINT END), 0) as exports_usage,
  COALESCE(SUM(CASE WHEN so.bucket_id = 'user-avatars' THEN (so.metadata->>'size')::BIGINT END), 0) as avatars_usage,
  COALESCE(SUM((so.metadata->>'size')::BIGINT), 0) as total_usage,
  CASE 
    WHEN cp.role = 'business' THEN 10737418240  -- 10GB
    WHEN cp.role = 'pro' THEN 1073741824       -- 1GB  
    ELSE 104857600                             -- 100MB
  END as storage_limit,
  COUNT(so.id) as total_files
FROM public.clerk_profiles cp
LEFT JOIN storage.objects so ON (storage.foldername(so.name))[1] = cp.id::text
WHERE so.bucket_id IN ('user-prompts', 'user-exports', 'user-avatars') OR so.id IS NULL
GROUP BY cp.id, cp.email, cp.role;

-- Storage security events view
CREATE OR REPLACE VIEW storage_security_events AS
SELECT 
  'quota_exceeded' as event_type,
  (metadata->>'uploaded_by')::UUID as user_id,
  bucket_id,
  name as file_path,
  created_at,
  metadata->>'ip_address' as ip_address
FROM storage.objects 
WHERE metadata ? 'quota_warning'
  AND created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'suspicious_upload' as event_type,
  (metadata->>'uploaded_by')::UUID as user_id,
  bucket_id,
  name as file_path,
  created_at,
  metadata->>'ip_address' as ip_address
FROM storage.objects 
WHERE name ~ '\.(exe|bat|cmd|sh|php|asp|jsp)$'
  AND created_at >= NOW() - INTERVAL '24 hours'

ORDER BY created_at DESC;

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant access to storage utility functions
GRANT EXECUTE ON FUNCTION storage.generate_secure_url TO authenticated;
GRANT EXECUTE ON FUNCTION storage.cleanup_old_files TO service_role;

-- Grant access to monitoring views
GRANT SELECT ON user_storage_usage TO authenticated;
GRANT SELECT ON storage_security_events TO authenticated;

-- Ensure service role has full storage access
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

-- ========================================
-- STORAGE SECURITY NOTES
-- ========================================

/*
Storage Security Implementation Summary:

1. **Bucket Isolation**: 
   - Private buckets for user data with signed URL access
   - Public bucket only for verified static assets
   - Separate buckets by data type and sensitivity

2. **Access Control**:
   - Users can only access their own files (folder-based isolation)
   - Admin-only access for templates and public assets
   - Service role for automated operations

3. **File Validation**:
   - MIME type restrictions per bucket
   - File size limits enforced
   - Malicious file extension blocking
   - Directory traversal prevention

4. **Storage Quotas**:
   - Role-based storage limits
   - Real-time usage tracking
   - Quota enforcement on upload

5. **Security Features**:
   - Automatic file cleanup
   - Upload validation triggers
   - Security event monitoring
   - Audit trail for all operations

6. **Signed URLs**:
   - Limited expiry (max 1 hour)
   - User ownership validation
   - Secure URL generation

Usage Guidelines:
- Use signed URLs for file access with minimal expiry
- Implement client-side file validation before upload
- Monitor storage usage and security events
- Run cleanup function periodically
- Rotate signed URL secrets regularly
*/