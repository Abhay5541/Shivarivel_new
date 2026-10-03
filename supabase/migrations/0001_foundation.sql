-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 0: Foundation Migration
-- =============================================================================
-- This migration establishes the core database foundation:
--   - companies table
--   - profiles table (references auth.users)
--   - service_types table
--   - audit_log table
--   - helper functions (current_company_id, current_role, is_owner, has_permission)
--   - RLS policies for all tables
--   - updated_at trigger function
-- =============================================================================

-- =====================
-- 1. EXTENSIONS
-- =====================

-- pgcrypto is enabled by default on Supabase for gen_random_uuid()
-- Ensure it's available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- 2. UPDATED_AT TRIGGER FUNCTION
-- =====================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS
  'Reusable trigger function: sets updated_at to now() on every UPDATE.';

-- =====================
-- 3. COMPANIES TABLE
-- =====================

CREATE TABLE public.companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  logo_url    text,
  address     text,
  phone       text,
  alternate_phone text,
  email       text,
  website     text,
  gst_number  text,
  owner_name  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.companies IS
  'Company profiles. All business data is company-scoped.';

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 4. PROFILES TABLE
-- =====================

CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  full_name   text NOT NULL,
  phone       text,
  role        text NOT NULL DEFAULT 'owner'
              CHECK (role IN ('owner', 'supervisor', 'worker')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'User profiles linked to auth.users. Each user belongs to one company.';

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 5. HELPER FUNCTIONS
-- =====================

-- 5a. current_company_id(): returns the company_id of the authenticated user
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_company_id() IS
  'Returns the company_id for the currently authenticated user.';

-- 5b. current_role(): returns the role of the authenticated user
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_role() IS
  'Returns the role (owner/supervisor/worker) of the currently authenticated user.';

-- 5c. is_owner(): checks if the authenticated user has owner role
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'owner'
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_owner() IS
  'Returns true if the currently authenticated user is an active owner.';

-- 5d. has_permission(permission_name text): simple permission check
-- For V1 with a single owner, this returns true for owners.
-- Future phases can implement a full permission system.
CREATE OR REPLACE FUNCTION public.has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = 'owner'
  );
$$;

COMMENT ON FUNCTION public.has_permission(text) IS
  'Checks if authenticated user has the given permission. V1: owners have all permissions.';

-- =====================
-- 6. SERVICE_TYPES TABLE
-- =====================

CREATE TABLE public.service_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL DEFAULT public.current_company_id()
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, name)
);

COMMENT ON TABLE public.service_types IS
  'Reusable service types offered by a company. Referenced by enquiries, projects, etc.';

CREATE TRIGGER service_types_updated_at
  BEFORE UPDATE ON public.service_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 7. AUDIT_LOG TABLE
-- =====================

CREATE TABLE public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL DEFAULT public.current_company_id()
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  user_id     uuid NOT NULL DEFAULT auth.uid()
              REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_log IS
  'Audit trail for important business operations. Append-only.';

CREATE INDEX idx_audit_log_entity
  ON public.audit_log (entity_type, entity_id);

CREATE INDEX idx_audit_log_company_created
  ON public.audit_log (company_id, created_at DESC);

-- =====================
-- 8. RLS POLICIES
-- =====================

-- 8a. companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own company
CREATE POLICY "Users can view own company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (id = public.current_company_id());

-- Only owners can update their company
CREATE POLICY "Owners can update own company"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (id = public.current_company_id() AND public.is_owner())
  WITH CHECK (id = public.current_company_id() AND public.is_owner());

-- 8b. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles within their company
CREATE POLICY "Users can view company profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Owners can insert profiles for their company
CREATE POLICY "Owners can insert company profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 8c. service_types
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their company's service types
CREATE POLICY "Users can view company service types"
  ON public.service_types
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

-- Owners can insert service types for their company
CREATE POLICY "Owners can insert service types"
  ON public.service_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- Owners can update their company's service types
CREATE POLICY "Owners can update service types"
  ON public.service_types
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner())
  WITH CHECK (company_id = public.current_company_id() AND public.is_owner());

-- 8d. audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for their company
CREATE POLICY "Users can view company audit logs"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

-- Audit log entries are inserted by database functions (SECURITY DEFINER),
-- not directly by clients. No INSERT policy for regular users.
-- This prevents tampering with the audit trail.

-- =====================
-- 9. HANDLE NEW USER FUNCTION
-- =====================

-- This function is called by a Supabase Auth trigger when a new user signs up.
-- It creates a company and profile for the user.
-- In V1 with public signup disabled, users are created by the owner via invite,
-- but this function provides the safe foundation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
  user_full_name text;
BEGIN
  -- Extract full_name from user metadata, or use email as fallback
  user_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create a new company for the user
  INSERT INTO public.companies (name)
  VALUES (user_full_name || '''s Company')
  RETURNING id INTO new_company_id;

  -- Create the user's profile
  INSERT INTO public.profiles (id, company_id, full_name, role)
  VALUES (NEW.id, new_company_id, user_full_name, 'owner');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auth trigger: creates a company and owner profile for new users.';

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- 10. AUDIT LOG HELPER
-- =====================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
  VALUES (
    public.current_company_id(),
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details
  );
END;
$$;

COMMENT ON FUNCTION public.log_audit(text, text, uuid, jsonb) IS
  'Inserts an audit log entry for the current user and company.';
