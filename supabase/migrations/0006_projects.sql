-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 5: Projects Backend Migration
-- =============================================================================
-- This migration establishes the projects module:
--   - public.projects table (company-scoped central operational entity)
--   - composite foreign keys guaranteeing cross-company, customer, enquiry,
--     and estimate alignment
--   - validation trigger preventing cross-company / cross-entity mismatches
--   - company-scoped sequential project code auto-numbering (e.g. PRJ-0001)
--   - atomic project conversion RPCs from approved estimates and enquiries
--   - is_assigned_to_project(project_id) security helper function
--   - RLS policies enforcing tenant isolation
--   - audit logging triggers using the existing audit_log infrastructure
--   - performance indexes for common access patterns
--
-- DESIGN DECISIONS:
-- 1. Projects are the central operational entity for jobs.
-- 2. Projects link to customer, optional enquiry, and optional source estimate.
-- 3. contract_value is numeric(14,2) representing agreed project value.
--    No payment ledger, balances, or profit calculations are introduced here.
-- 4. Hard deletion is restricted to active owners.
-- =============================================================================

-- =====================
-- 1. PREREQUISITE COMPOSITE UNIQUE CONSTRAINTS
-- =====================

-- Allows composite foreign key from projects(company_id, customer_id, estimate_id) -> estimates(company_id, customer_id, id)
ALTER TABLE public.estimates
  ADD CONSTRAINT uq_estimates_company_customer_id_id
  UNIQUE (company_id, customer_id, id);

-- =====================
-- 2. PROJECTS TABLE
-- =====================

CREATE TABLE public.projects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL DEFAULT public.current_company_id()
                      REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id         uuid NOT NULL
                      REFERENCES public.customers(id) ON DELETE RESTRICT,
  enquiry_id          uuid
                      REFERENCES public.enquiries(id) ON DELETE SET NULL,
  estimate_id         uuid
                      REFERENCES public.estimates(id) ON DELETE SET NULL,
  project_code        text NOT NULL,
  name                text NOT NULL CHECK (char_length(trim(name)) > 0),
  description         text,
  site_address        text,
  status              text NOT NULL DEFAULT 'Planned'
                      CHECK (status IN (
                        'Planned',
                        'Planning',
                        'Active',
                        'On Hold',
                        'Completed',
                        'Cancelled'
                      )),
  start_date          date,
  expected_end_date   date,
  actual_end_date     date,
  contract_value      numeric(14,2) CHECK (contract_value IS NULL OR contract_value >= 0),
  assigned_to         uuid
                      REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Constraint 1: company-scoped unique project code
  CONSTRAINT uq_projects_company_project_code
    UNIQUE (company_id, project_code),

  -- Constraint 2: composite unique key on (company_id, id) for future referencing tables
  CONSTRAINT uq_projects_company_id_id
    UNIQUE (company_id, id),

  -- Constraint 3: composite foreign key to customers (ensures customer belongs to same company)
  CONSTRAINT fk_projects_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE RESTRICT,

  -- Constraint 4: composite foreign key to enquiries (ensures enquiry belongs to same company AND customer)
  CONSTRAINT fk_projects_enquiry_company_customer
    FOREIGN KEY (company_id, customer_id, enquiry_id)
    REFERENCES public.enquiries (company_id, customer_id, id)
    ON DELETE SET NULL,

  -- Constraint 5: composite foreign key to estimates (ensures estimate belongs to same company AND customer)
  CONSTRAINT fk_projects_estimate_company_customer
    FOREIGN KEY (company_id, customer_id, estimate_id)
    REFERENCES public.estimates (company_id, customer_id, id)
    ON DELETE SET NULL,

  -- Constraint 6: composite foreign key to profiles (ensures assigned supervisor belongs to same company)
  CONSTRAINT fk_projects_assigned_profile_company
    FOREIGN KEY (company_id, assigned_to)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.projects IS
  'Central operational entity for jobs, construction contracts, and interior works. Company-scoped.';

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. NUMBERING & INTEGRITY TRIGGERS
-- =====================

-- Auto-numbering trigger: generates company-scoped sequential project codes (e.g. PRJ-0001)
CREATE OR REPLACE FUNCTION public.handle_project_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.project_code IS NULL OR trim(NEW.project_code) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.projects
    WHERE company_id = NEW.company_id;

    NEW.project_code := 'PRJ-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_project_code() IS
  'Generates company-scoped sequential project codes (e.g. PRJ-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_project_code
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_code();

-- Cross-company integrity validation trigger
CREATE OR REPLACE FUNCTION public.validate_project_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure customer belongs to same company
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = NEW.customer_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Customer % does not belong to company %',
      NEW.customer_id, NEW.company_id;
  END IF;

  -- 2. If enquiry_id is provided, verify it belongs to same company AND customer
  IF NEW.enquiry_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.enquiries
      WHERE id = NEW.enquiry_id
        AND company_id = NEW.company_id
        AND customer_id = NEW.customer_id
    ) THEN
      RAISE EXCEPTION 'Integrity violation: Enquiry % does not belong to company % and customer %',
        NEW.enquiry_id, NEW.company_id, NEW.customer_id;
    END IF;
  END IF;

  -- 3. If estimate_id is provided, verify it belongs to same company AND customer
  IF NEW.estimate_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.estimates
      WHERE id = NEW.estimate_id
        AND company_id = NEW.company_id
        AND customer_id = NEW.customer_id
    ) THEN
      RAISE EXCEPTION 'Integrity violation: Estimate % does not belong to company % and customer %',
        NEW.estimate_id, NEW.company_id, NEW.customer_id;
    END IF;
  END IF;

  -- 4. If assigned_to is provided, verify profile belongs to same company
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.assigned_to AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Assigned supervisor % does not belong to company %',
        NEW.assigned_to, NEW.company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_project_integrity() IS
  'Trigger function ensuring projects maintain strict company, customer, enquiry, and estimate alignment.';

CREATE TRIGGER trg_validate_project_integrity
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_integrity();

-- =====================
-- 4. PROJECT ASSIGNMENT SECURITY HELPER
-- =====================

CREATE OR REPLACE FUNCTION public.is_assigned_to_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = p_project_id
      AND company_id = public.current_company_id()
      AND (
        public.is_owner()
        OR assigned_to = auth.uid()
      )
  );
$$;

COMMENT ON FUNCTION public.is_assigned_to_project(uuid) IS
  'Returns true if authenticated user is the company owner or assigned supervisor for the project.';

-- =====================
-- 5. ATOMIC PROJECT CONVERSION FUNCTIONS
-- =====================

-- Conversion from Estimate -> Project
CREATE OR REPLACE FUNCTION public.convert_estimate_to_project(
  p_estimate_id uuid,
  p_project_name text DEFAULT NULL,
  p_start_date date DEFAULT CURRENT_DATE,
  p_expected_end_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estimate record;
  v_project_id uuid;
  v_project_name text;
BEGIN
  -- 1. Verify estimate belongs to caller's company
  SELECT * INTO v_estimate
  FROM public.estimates
  WHERE id = p_estimate_id
    AND company_id = public.current_company_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estimate % not found or does not belong to current company', p_estimate_id;
  END IF;

  -- 2. Verify estimate status is eligible for conversion (must be Approved or Accepted)
  IF v_estimate.status NOT IN ('Approved', 'Accepted') THEN
    RAISE EXCEPTION 'Estimate % in status % cannot be converted to a project. Estimate must be Approved or Accepted', p_estimate_id, v_estimate.status;
  END IF;

  -- 3. Determine project name
  v_project_name := COALESCE(
    NULLIF(trim(p_project_name), ''),
    NULLIF(trim(v_estimate.title), ''),
    'Project ' || v_estimate.estimate_number
  );

  -- 4. Create project atomically
  INSERT INTO public.projects (
    company_id,
    customer_id,
    enquiry_id,
    estimate_id,
    name,
    contract_value,
    start_date,
    expected_end_date,
    status
  )
  VALUES (
    v_estimate.company_id,
    v_estimate.customer_id,
    v_estimate.enquiry_id,
    v_estimate.id,
    v_project_name,
    v_estimate.total_amount,
    p_start_date,
    p_expected_end_date,
    'Active'
  )
  RETURNING id INTO v_project_id;

  -- 5. Update estimate status to Converted
  UPDATE public.estimates
  SET status = 'Converted',
      updated_at = now()
  WHERE id = v_estimate.id;

  -- 6. If linked to an enquiry, update enquiry status to Converted
  IF v_estimate.enquiry_id IS NOT NULL THEN
    UPDATE public.enquiries
    SET status = 'Converted',
        updated_at = now()
    WHERE id = v_estimate.enquiry_id;
  END IF;

  -- 7. Audit conversion
  PERFORM public.log_audit(
    'convert_estimate_to_project',
    'project',
    v_project_id,
    jsonb_build_object(
      'estimate_id', v_estimate.id,
      'estimate_number', v_estimate.estimate_number,
      'customer_id', v_estimate.customer_id,
      'enquiry_id', v_estimate.enquiry_id,
      'contract_value', v_estimate.total_amount
    )
  );

  RETURN v_project_id;
END;
$$;

COMMENT ON FUNCTION public.convert_estimate_to_project(uuid, text, date, date) IS
  'Atomically converts an approved estimate into an active project, preserving customer/enquiry relationships.';

-- Conversion directly from Enquiry -> Project
CREATE OR REPLACE FUNCTION public.convert_enquiry_to_project(
  p_enquiry_id uuid,
  p_project_name text DEFAULT NULL,
  p_contract_value numeric DEFAULT NULL,
  p_start_date date DEFAULT CURRENT_DATE,
  p_expected_end_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enquiry record;
  v_project_id uuid;
  v_project_name text;
BEGIN
  -- 1. Verify enquiry belongs to caller's company
  SELECT * INTO v_enquiry
  FROM public.enquiries
  WHERE id = p_enquiry_id
    AND company_id = public.current_company_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enquiry % not found or does not belong to current company', p_enquiry_id;
  END IF;

  -- 2. Determine project name
  v_project_name := COALESCE(
    NULLIF(trim(p_project_name), ''),
    NULLIF(trim(v_enquiry.description), ''),
    'Project from Enquiry'
  );

  -- 3. Create project atomically
  INSERT INTO public.projects (
    company_id,
    customer_id,
    enquiry_id,
    name,
    contract_value,
    start_date,
    expected_end_date,
    status
  )
  VALUES (
    v_enquiry.company_id,
    v_enquiry.customer_id,
    v_enquiry.id,
    v_project_name,
    COALESCE(p_contract_value, v_enquiry.estimated_value),
    p_start_date,
    p_expected_end_date,
    'Active'
  )
  RETURNING id INTO v_project_id;

  -- 4. Update enquiry status to Converted
  UPDATE public.enquiries
  SET status = 'Converted',
      updated_at = now()
  WHERE id = v_enquiry.id;

  -- 5. Audit conversion
  PERFORM public.log_audit(
    'convert_enquiry_to_project',
    'project',
    v_project_id,
    jsonb_build_object(
      'enquiry_id', v_enquiry.id,
      'customer_id', v_enquiry.customer_id,
      'contract_value', COALESCE(p_contract_value, v_enquiry.estimated_value)
    )
  );

  RETURN v_project_id;
END;
$$;

COMMENT ON FUNCTION public.convert_enquiry_to_project(uuid, text, numeric, date, date) IS
  'Atomically converts an enquiry directly into an active project.';

-- =====================
-- 6. RLS POLICIES
-- =====================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- =====================
-- 7. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_project_changes()
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
    v_action := 'create_project';
    v_details := jsonb_build_object(
      'project_code', NEW.project_code,
      'name', NEW.name,
      'customer_id', NEW.customer_id,
      'enquiry_id', NEW.enquiry_id,
      'estimate_id', NEW.estimate_id,
      'status', NEW.status,
      'contract_value', NEW.contract_value
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'project_status_change';
    ELSE
      v_action := 'update_project';
    END IF;

    v_details := jsonb_build_object(
      'project_code', NEW.project_code,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'name', NEW.name,
      'contract_value', NEW.contract_value
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_project';
    v_details := jsonb_build_object(
      'project_code', OLD.project_code,
      'customer_id', OLD.customer_id,
      'name', OLD.name
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
      OLD.company_id,
      auth.uid(),
      v_action,
      'project',
      OLD.id,
      v_details
    );

    RETURN OLD;
  END IF;

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
    'project',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_project_changes() IS
  'Audits project creation, status transitions, updates, and deletions.';

CREATE TRIGGER trg_audit_project_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_project_changes();

-- =====================
-- 8. INDEXES
-- =====================

CREATE INDEX idx_projects_company_id
  ON public.projects (company_id);

CREATE INDEX idx_projects_company_customer
  ON public.projects (company_id, customer_id);

CREATE INDEX idx_projects_company_enquiry
  ON public.projects (company_id, enquiry_id);

CREATE INDEX idx_projects_company_estimate
  ON public.projects (company_id, estimate_id);

CREATE INDEX idx_projects_company_status
  ON public.projects (company_id, status);

CREATE INDEX idx_projects_company_code
  ON public.projects (company_id, project_code);

CREATE INDEX idx_projects_company_dates
  ON public.projects (company_id, start_date, expected_end_date);

CREATE INDEX idx_projects_company_assigned
  ON public.projects (company_id, assigned_to);
