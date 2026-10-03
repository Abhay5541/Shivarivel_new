-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 9: Employees Backend Migration
-- =============================================================================
-- This migration establishes the master data foundation for workers/employees:
--   - public.employees table (company-scoped worker directory)
--   - company-scoped sequential employee numbering (e.g. EMP-0001)
--   - master reference daily_wage (numeric(14,2), non-negative, catalog/reference only)
--   - composite unique key on (company_id, id) for future foreign key referencing
--   - company-scoped RLS policies (SELECT/INSERT/UPDATE, owner-only DELETE)
--   - audit logging triggers recording creations, status changes, updates, and deletions
--   - targeted performance indexes
--
-- DESIGN DECISIONS:
-- 1. Employees represent workers managed by the construction business (PRODUCT_SPEC.md #17).
--    They are NOT application login accounts (profiles). No user authentication credentials exist.
-- 2. daily_wage is master/reference data only. No wages earned, liabilities, advances,
--    or payroll calculations are implemented in this phase.
-- 3. Hard deletion is restricted to active company owners; operational offboarding
--    prefers status deactivation ('inactive') to preserve future financial history.
-- =============================================================================

-- =====================
-- 1. EMPLOYEES TABLE
-- =====================

CREATE TABLE public.employees (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL DEFAULT public.current_company_id()
                    REFERENCES public.companies(id) ON DELETE RESTRICT,
  employee_code     text NOT NULL,
  name              text NOT NULL CHECK (char_length(trim(name)) > 0),
  phone             text,
  worker_type       text,
  daily_wage        numeric(14,2) CHECK (daily_wage IS NULL OR daily_wage >= 0),
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'Active', 'Inactive')),
  joining_date      date,
  emergency_contact text,
  photo_url         text,
  address           text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_employees_company_id_id
    UNIQUE (company_id, id),

  -- Unique employee code within the company
  CONSTRAINT uq_employees_company_code
    UNIQUE (company_id, employee_code)
);

COMMENT ON TABLE public.employees IS
  'Worker and employee directory for the company. Master data. Company-scoped.';

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. EMPLOYEE NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_employee_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.employee_code IS NULL OR trim(NEW.employee_code) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.employees
    WHERE company_id = NEW.company_id;

    NEW.employee_code := 'EMP-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_employee_code() IS
  'Generates company-scoped sequential employee codes (e.g. EMP-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_employee_code
  BEFORE INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_code();

-- =====================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company employees"
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company employees"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company employees"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 4. AUDIT LOGGING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.audit_employee_changes()
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
    v_action := 'create_employee';
    v_details := jsonb_build_object(
      'employee_code', NEW.employee_code,
      'name', NEW.name,
      'phone', NEW.phone,
      'worker_type', NEW.worker_type,
      'daily_wage', NEW.daily_wage,
      'status', NEW.status,
      'joining_date', NEW.joining_date
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'employee_status_change';
    ELSE
      v_action := 'update_employee';
    END IF;

    v_details := jsonb_build_object(
      'employee_code', NEW.employee_code,
      'name', NEW.name,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_daily_wage', OLD.daily_wage,
      'new_daily_wage', NEW.daily_wage,
      'worker_type', NEW.worker_type
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_employee';
    v_details := jsonb_build_object(
      'employee_code', OLD.employee_code,
      'name', OLD.name,
      'phone', OLD.phone
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
      'employee',
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
    'employee',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_employee_changes() IS
  'Audits employee creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_employee_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_changes();

-- =====================
-- 5. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_employees_company_id
  ON public.employees (company_id);

CREATE INDEX idx_employees_company_status
  ON public.employees (company_id, status);

CREATE INDEX idx_employees_company_code
  ON public.employees (company_id, employee_code);

CREATE INDEX idx_employees_company_name
  ON public.employees (company_id, name);

CREATE INDEX idx_employees_company_phone
  ON public.employees (company_id, phone);

CREATE INDEX idx_employees_company_worker_type
  ON public.employees (company_id, worker_type);
