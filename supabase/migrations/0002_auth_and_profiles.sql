-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 1: Authentication + Company/Profile Security Migration
-- =============================================================================
-- This migration strengthens Phase 0 foundation for Phase 1 requirements:
--   1. Protect profile fields (immutable company_id, owner-only role & is_active)
--   2. Refine profile RLS policies:
--        - Allow users to update their own non-protected profile fields
--        - Allow owners to update team profiles within their company
--   3. Audit triggers for profile and company modifications
--   4. Enhanced handle_new_user() with null safety and existing company support
-- =============================================================================

-- =====================
-- 1. PROFILE FIELD PROTECTION TRIGGER
-- =====================
-- Enforces at the database level that:
--   - company_id is strictly immutable once assigned
--   - only active owners can change a profile's role or is_active status
--   - non-owners can only update their own profile

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. company_id is immutable
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'company_id cannot be changed';
  END IF;

  -- 2. Non-owners cannot change role or is_active
  IF NOT public.is_owner() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only owners can change profile roles';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Only owners can change account active status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_fields() IS
  'Protects profile security: prevents self-privilege escalation, company hopping, and unauthorized role/status changes.';

-- Attach trigger to profiles
DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- =====================
-- 2. REFINED RLS POLICIES FOR PROFILES
-- =====================

-- Drop the old overly broad update policy from Phase 0
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policy 2a: Users can update their own profile (within their own company)
-- Field-level restrictions (role, is_active, company_id) are enforced by trg_protect_profile_fields
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    AND company_id = public.current_company_id()
  )
  WITH CHECK (
    id = auth.uid()
    AND company_id = public.current_company_id()
  );

-- Policy 2b: Owners can update team profiles within their own company
CREATE POLICY "Owners can update company profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  )
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 3. AUDIT LOGGING TRIGGERS
-- =====================

-- Function to audit company updates
CREATE OR REPLACE FUNCTION public.audit_company_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log company profile updates
  INSERT INTO public.audit_log (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    NEW.id,
    auth.uid(),
    'update_company_profile',
    'company',
    NEW.id,
    jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'gst_number', NEW.gst_number,
      'address', NEW.address
    )
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_company_update() IS
  'Audits updates to company profile information.';

DROP TRIGGER IF EXISTS trg_audit_company_update ON public.companies;
CREATE TRIGGER trg_audit_company_update
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_company_update();

-- Function to audit sensitive profile changes (role, active status, name)
CREATE OR REPLACE FUNCTION public.audit_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text := 'update_profile';
  v_details jsonb;
BEGIN
  -- Determine specific action if sensitive fields changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    v_action := 'change_role';
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    v_action := 'change_status';
  END IF;

  v_details := jsonb_build_object(
    'target_profile_id', NEW.id,
    'full_name', NEW.full_name,
    'old_role', OLD.role,
    'new_role', NEW.role,
    'old_is_active', OLD.is_active,
    'new_is_active', NEW.is_active
  );

  INSERT INTO public.audit_log (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    NEW.company_id,
    auth.uid(),
    v_action,
    'profile',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_profile_update() IS
  'Audits profile updates and sensitive changes (role, active status).';

DROP TRIGGER IF EXISTS trg_audit_profile_update ON public.profiles;
CREATE TRIGGER trg_audit_profile_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_update();

-- =====================
-- 4. ENHANCED USER PROVISIONING TRIGGER (handle_new_user)
-- =====================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_company_id uuid;
  user_full_name text;
  meta_company_id text;
  meta_role text;
  assigned_role text := 'owner';
  company_exists boolean := false;
BEGIN
  -- 1. Extract full_name with fallbacks
  user_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
    'User'
  );

  -- 2. Check if an existing company was specified in metadata (e.g. provisioned employee)
  meta_company_id := NEW.raw_user_meta_data ->> 'company_id';
  meta_role := NEW.raw_user_meta_data ->> 'role';

  IF meta_company_id IS NOT NULL AND meta_company_id ~ '^[0-9a-fA-F-]{36}$' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.companies WHERE id = meta_company_id::uuid
    ) INTO company_exists;

    IF company_exists THEN
      target_company_id := meta_company_id::uuid;
      -- Assign role from metadata if valid, else default to worker
      IF meta_role IN ('owner', 'supervisor', 'worker') THEN
        assigned_role := meta_role;
      ELSE
        assigned_role := 'worker';
      END IF;
    END IF;
  END IF;

  -- 3. If no existing company matched, create a new one
  IF target_company_id IS NULL THEN
    INSERT INTO public.companies (name)
    VALUES (
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'company_name'), ''),
        user_full_name || '''s Company'
      )
    )
    RETURNING id INTO target_company_id;
    assigned_role := 'owner';
  END IF;

  -- 4. Create user profile (idempotent via ON CONFLICT)
  INSERT INTO public.profiles (id, company_id, full_name, role)
  VALUES (NEW.id, target_company_id, user_full_name, assigned_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auth trigger: creates company + owner profile for new owners, or links invited members to existing companies.';
