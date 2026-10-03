-- =============================================================================
-- Migration 0019: Documents, Photos & Storage Module
-- Phase 18: Documents / Photos / Storage Backend Migration
-- =============================================================================
-- This migration establishes the backend foundation for Documents, Photos & Storage:
--   - Supabase Storage private buckets: 'documents' and 'photos'
--   - public.attachments table (metadata repository per Product Spec Sec 28)
--   - public.documents view alias (security_invoker = true)
--   - Extended public.daily_site_report_photos with attachment_id and storage_path
--   - Composite foreign keys enforcing same-company relationships for:
--       * Customer, Enquiry, Site Visit, Estimate, Project, Purchase, Employee, Daily Site Report
--   - Path prefix validation trigger ensuring storage_path starts with company_id/
--   - Storage RLS policies on storage.objects enforcing multi-tenant company isolation
--   - Database RLS policies on public.attachments
--   - Atomic RPC functions:
--       * public.register_attachment
--       * public.get_attachment_access_info
--   - Audit logging triggers recording create, update, delete in public.audit_log
--   - Performance indexes on company_id, parent resource foreign keys, and storage paths
--
-- STRICT FINANCIAL SEPARATION:
-- 1. Documents and attachments are strictly operational/archival metadata.
-- 2. They do NOT alter purchases, wages, advances, expenses, customer payments,
--    contract_value, or recorded project costs.
-- =============================================================================

-- =====================
-- 1. STORAGE BUCKET CONFIGURATION
-- =====================

-- Ensure storage schema and buckets table exist before configuring
DO $$
BEGIN
  BEGIN
    CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS storage.buckets (
      id                  text PRIMARY KEY,
      name                text NOT NULL,
      owner               uuid,
      created_at          timestamptz DEFAULT now(),
      updated_at          timestamptz DEFAULT now(),
      public              boolean DEFAULT false,
      avif_autodetection  boolean DEFAULT false,
      file_size_limit     bigint,
      allowed_mime_types  text[]
    );
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL; -- In hosted Supabase, storage schema and buckets are pre-managed
  END;
END $$;

-- Register private buckets: documents (25MB limit) and photos (15MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'documents',
    'documents',
    false,
    26214400,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  ),
  (
    'photos',
    'photos',
    false,
    15728640,
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================
-- 2. ATTACHMENTS METADATA TABLE
-- =====================

CREATE TABLE public.attachments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL DEFAULT public.current_company_id()
                        REFERENCES public.companies(id) ON DELETE RESTRICT,
  file_name             text NOT NULL CHECK (char_length(trim(file_name)) > 0),
  storage_bucket        text NOT NULL DEFAULT 'documents'
                        CHECK (storage_bucket IN ('documents', 'photos')),
  storage_path          text NOT NULL CHECK (char_length(trim(storage_path)) > 0),
  mime_type             text NOT NULL CHECK (char_length(trim(mime_type)) > 0),
  file_size             bigint NOT NULL CHECK (file_size > 0 AND file_size <= 26214400),
  category              text NOT NULL DEFAULT 'General'
                        CHECK (category IN (
                          'General',
                          'Drawing',
                          'Estimate',
                          'Invoice',
                          'Receipt',
                          'Contract',
                          'Site Photo',
                          'ID Proof',
                          'Site Plan',
                          'Report',
                          'Other'
                        )),
  caption               text,
  is_private            boolean NOT NULL DEFAULT true,

  -- Entity links per Product Spec Section 28
  customer_id           uuid,
  enquiry_id            uuid,
  site_visit_id         uuid,
  estimate_id           uuid,
  project_id            uuid,
  purchase_id           uuid,
  employee_id           uuid,
  daily_site_report_id  uuid,

  uploaded_by           uuid
                        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for foreign referencing
  CONSTRAINT uq_attachments_company_id_id
    UNIQUE (company_id, id),

  -- Prevent duplicate paths in same bucket
  CONSTRAINT uq_attachments_bucket_path
    UNIQUE (storage_bucket, storage_path),

  -- Composite same-company foreign keys
  CONSTRAINT fk_att_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_enquiry_company
    FOREIGN KEY (company_id, enquiry_id)
    REFERENCES public.enquiries (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_site_visit_company
    FOREIGN KEY (company_id, site_visit_id)
    REFERENCES public.site_visits (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_estimate_company
    FOREIGN KEY (company_id, estimate_id)
    REFERENCES public.estimates (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_purchase_company
    FOREIGN KEY (company_id, purchase_id)
    REFERENCES public.purchases (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_employee_company
    FOREIGN KEY (company_id, employee_id)
    REFERENCES public.employees (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_report_company
    FOREIGN KEY (company_id, daily_site_report_id)
    REFERENCES public.daily_site_reports (company_id, id)
    ON DELETE SET NULL,

  CONSTRAINT fk_att_uploaded_by_company
    FOREIGN KEY (company_id, uploaded_by)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.attachments IS
  'Metadata repository for documents and photos stored in Supabase Storage. Product Spec Section 28.';

CREATE TRIGGER attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. INTEGRATION WITH PHASE 16 DAILY SITE REPORT PHOTOS
-- =====================

ALTER TABLE public.daily_site_report_photos
  ADD COLUMN IF NOT EXISTS attachment_id uuid,
  ADD COLUMN IF NOT EXISTS storage_path text;

-- Add composite foreign key constraint if not existing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_dsrp_attachment_company'
  ) THEN
    ALTER TABLE public.daily_site_report_photos
      ADD CONSTRAINT fk_dsrp_attachment_company
      FOREIGN KEY (company_id, attachment_id)
      REFERENCES public.attachments (company_id, id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- =====================
-- 4. VALIDATION TRIGGER FOR PATH INTEGRITY & TENANT SCOPING
-- =====================

CREATE OR REPLACE FUNCTION public.validate_attachment_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_prefix text;
BEGIN
  -- 1. Ensure non-blank file_name and storage_path
  IF trim(NEW.file_name) = '' THEN
    RAISE EXCEPTION 'Validation error: Attachment file_name cannot be blank';
  END IF;

  IF trim(NEW.storage_path) = '' THEN
    RAISE EXCEPTION 'Validation error: Attachment storage_path cannot be blank';
  END IF;

  -- 2. Tenant path validation: storage_path MUST start with company_id/
  v_expected_prefix := NEW.company_id::text || '/';
  IF NOT (NEW.storage_path LIKE (v_expected_prefix || '%')) THEN
    RAISE EXCEPTION 'Tenant isolation violation: Storage path % must begin with company prefix %',
      NEW.storage_path, v_expected_prefix;
  END IF;

  -- 3. Enforce photo bucket size and MIME restrictions
  IF NEW.storage_bucket = 'photos' THEN
    IF NEW.file_size > 15728640 THEN
      RAISE EXCEPTION 'Validation error: Photos cannot exceed 15MB (got % bytes)', NEW.file_size;
    END IF;
    IF NOT (NEW.mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic')) THEN
      RAISE EXCEPTION 'Validation error: Invalid MIME type % for photos bucket', NEW.mime_type;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_attachment_integrity() IS
  'Validates non-blank names, company-scoped storage paths, and bucket-specific size and MIME restrictions.';

CREATE TRIGGER trg_validate_attachment_integrity
  BEFORE INSERT OR UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attachment_integrity();

-- =====================
-- 5. DOCUMENTS VIEW ALIAS
-- =====================

CREATE OR REPLACE VIEW public.documents AS
SELECT * FROM public.attachments;

COMMENT ON VIEW public.documents IS
  'Auto-updatable view alias for attachments table.';

ALTER VIEW public.documents SET (security_invoker = true);

-- =====================
-- 6. ATOMIC RPCS
-- =====================

-- 6a. Register attachment
CREATE OR REPLACE FUNCTION public.register_attachment(
  p_file_name             text,
  p_storage_path          text,
  p_mime_type             text,
  p_file_size             bigint,
  p_storage_bucket        text DEFAULT 'documents',
  p_category              text DEFAULT 'General',
  p_caption               text DEFAULT NULL,
  p_project_id            uuid DEFAULT NULL,
  p_customer_id           uuid DEFAULT NULL,
  p_enquiry_id            uuid DEFAULT NULL,
  p_site_visit_id         uuid DEFAULT NULL,
  p_estimate_id           uuid DEFAULT NULL,
  p_purchase_id           uuid DEFAULT NULL,
  p_employee_id           uuid DEFAULT NULL,
  p_daily_site_report_id  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_attachment  record;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  INSERT INTO public.attachments (
    company_id,
    file_name,
    storage_bucket,
    storage_path,
    mime_type,
    file_size,
    category,
    caption,
    project_id,
    customer_id,
    enquiry_id,
    site_visit_id,
    estimate_id,
    purchase_id,
    employee_id,
    daily_site_report_id,
    uploaded_by
  ) VALUES (
    v_company_id,
    trim(p_file_name),
    COALESCE(p_storage_bucket, 'documents'),
    trim(p_storage_path),
    p_mime_type,
    p_file_size,
    COALESCE(p_category, 'General'),
    p_caption,
    p_project_id,
    p_customer_id,
    p_enquiry_id,
    p_site_visit_id,
    p_estimate_id,
    p_purchase_id,
    p_employee_id,
    p_daily_site_report_id,
    auth.uid()
  ) RETURNING * INTO v_attachment;

  RETURN jsonb_build_object(
    'attachment_id',   v_attachment.id,
    'company_id',      v_attachment.company_id,
    'file_name',       v_attachment.file_name,
    'storage_bucket',  v_attachment.storage_bucket,
    'storage_path',    v_attachment.storage_path,
    'mime_type',       v_attachment.mime_type,
    'file_size',       v_attachment.file_size,
    'category',        v_attachment.category,
    'created_at',      v_attachment.created_at
  );
END;
$$;

COMMENT ON FUNCTION public.register_attachment IS
  'Atomically registers metadata for an uploaded file in Supabase Storage with tenant validation.';

-- 6b. Get attachment access info (for signed URL generation)
CREATE OR REPLACE FUNCTION public.get_attachment_access_info(
  p_attachment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_attachment  record;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  SELECT * INTO v_attachment
  FROM public.attachments
  WHERE id = p_attachment_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attachment not found or access denied: %', p_attachment_id;
  END IF;

  RETURN jsonb_build_object(
    'attachment_id',  v_attachment.id,
    'storage_bucket', v_attachment.storage_bucket,
    'storage_path',   v_attachment.storage_path,
    'file_name',      v_attachment.file_name,
    'mime_type',      v_attachment.mime_type,
    'file_size',      v_attachment.file_size,
    'is_private',     v_attachment.is_private
  );
END;
$$;

COMMENT ON FUNCTION public.get_attachment_access_info(uuid) IS
  'Retrieves verified storage path and metadata for signed URL generation without exposing service keys.';

-- =====================
-- 7. DATABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company attachments"
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company attachments"
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company attachments"
  ON public.attachments
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company attachments"
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 8. STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

-- Ensure storage.objects exists
DO $$
BEGIN
  BEGIN
    CREATE TABLE IF NOT EXISTS storage.objects (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id   text,
      name        text,
      owner       uuid,
      created_at  timestamptz DEFAULT now(),
      updated_at  timestamptz DEFAULT now(),
      last_accessed_at timestamptz DEFAULT now(),
      metadata    jsonb,
      path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
    );
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL; -- In hosted Supabase, storage.objects is pre-managed
  END;
END $$;

-- Storage SELECT policy: authenticated users can only read objects in their company folder
DROP POLICY IF EXISTS "Users can view own company storage objects" ON storage.objects;
CREATE POLICY "Users can view own company storage objects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('documents', 'photos')
    AND (split_part(name, '/', 1))::uuid = public.current_company_id()
  );

-- Storage INSERT policy: authenticated users can only upload into their company folder
DROP POLICY IF EXISTS "Users can insert own company storage objects" ON storage.objects;
CREATE POLICY "Users can insert own company storage objects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('documents', 'photos')
    AND (split_part(name, '/', 1))::uuid = public.current_company_id()
  );

-- Storage UPDATE policy: authenticated users can only update objects in their company folder
DROP POLICY IF EXISTS "Users can update own company storage objects" ON storage.objects;
CREATE POLICY "Users can update own company storage objects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('documents', 'photos')
    AND (split_part(name, '/', 1))::uuid = public.current_company_id()
  )
  WITH CHECK (
    bucket_id IN ('documents', 'photos')
    AND (split_part(name, '/', 1))::uuid = public.current_company_id()
  );

-- Storage DELETE policy: only company owners can delete storage objects in their company folder
DROP POLICY IF EXISTS "Owners can delete own company storage objects" ON storage.objects;
CREATE POLICY "Owners can delete own company storage objects"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('documents', 'photos')
    AND (split_part(name, '/', 1))::uuid = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 9. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_attachments_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_details jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create_attachment';
    v_details := jsonb_build_object(
      'file_name',      NEW.file_name,
      'storage_bucket', NEW.storage_bucket,
      'storage_path',   NEW.storage_path,
      'mime_type',      NEW.mime_type,
      'file_size',      NEW.file_size,
      'category',       NEW.category,
      'project_id',     NEW.project_id,
      'customer_id',    NEW.customer_id
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'attachments', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_attachment';
    v_details := jsonb_build_object(
      'file_name',    NEW.file_name,
      'old_category', OLD.category,
      'new_category', NEW.category,
      'old_caption',  OLD.caption,
      'new_caption',  NEW.caption
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'attachments', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_attachment';
    v_details := jsonb_build_object(
      'file_name',      OLD.file_name,
      'storage_bucket', OLD.storage_bucket,
      'storage_path',   OLD.storage_path
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (OLD.company_id, auth.uid(), v_action, 'attachments', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_attachments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_attachments_changes();

-- =====================
-- 10. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_attachments_company_id ON public.attachments(company_id);
CREATE INDEX idx_attachments_company_project ON public.attachments(company_id, project_id);
CREATE INDEX idx_attachments_company_customer ON public.attachments(company_id, customer_id);
CREATE INDEX idx_attachments_company_enquiry ON public.attachments(company_id, enquiry_id);
CREATE INDEX idx_attachments_company_site_visit ON public.attachments(company_id, site_visit_id);
CREATE INDEX idx_attachments_company_estimate ON public.attachments(company_id, estimate_id);
CREATE INDEX idx_attachments_company_purchase ON public.attachments(company_id, purchase_id);
CREATE INDEX idx_attachments_company_employee ON public.attachments(company_id, employee_id);
CREATE INDEX idx_attachments_company_report ON public.attachments(company_id, daily_site_report_id);
CREATE INDEX idx_attachments_company_category ON public.attachments(company_id, category);
CREATE INDEX idx_attachments_bucket_path ON public.attachments(storage_bucket, storage_path);

CREATE INDEX IF NOT EXISTS idx_dsrp_attachment_id ON public.daily_site_report_photos(company_id, attachment_id);
