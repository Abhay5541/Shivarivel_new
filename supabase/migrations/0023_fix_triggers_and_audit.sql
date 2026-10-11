-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase Single-Tenant: Fix Audit Logging & Harmonize Projects Columns
-- =============================================================================

-- 1. MAKE AUDIT_LOG USER_ID NULLABLE
-- When operations are performed directly from the portal, auth.uid() may be null.
ALTER TABLE public.audit_log ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.audit_log TO anon, authenticated, service_role;

-- 2. RESTORE SAFE NULLABLE COLUMNS ON PROJECTS
-- Prevents audit triggers or queries referencing enquiry_id / estimate_id from failing.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS enquiry_id uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimate_id uuid;

-- 3. ENSURE SAFE PROJECT CODE GENERATION
-- If project_code is missing or null, auto-generate PRJ-XXXX
CREATE OR REPLACE FUNCTION public.handle_project_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_val bigint;
  v_company_id uuid;
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.project_code IS NULL OR trim(NEW.project_code) = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(project_code FROM '[0-9]+')::bigint), 0) + 1
    INTO v_next_val
    FROM public.projects
    WHERE company_id = NEW.company_id;

    NEW.project_code := 'PRJ-' || LPAD(v_next_val::text, 4, '0');
  END IF;

  RETURN NEW;
END;
$$;

-- 4. ENSURE SAFE EMPLOYEE CODE GENERATION
CREATE OR REPLACE FUNCTION public.handle_employee_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_val bigint;
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.employee_code IS NULL OR trim(NEW.employee_code) = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(employee_code FROM '[0-9]+')::bigint), 0) + 1
    INTO v_next_val
    FROM public.employees
    WHERE company_id = NEW.company_id;

    NEW.employee_code := 'EMP-' || LPAD(v_next_val::text, 4, '0');
  END IF;

  IF NEW.full_name IS NOT NULL AND (NEW.name IS NULL OR trim(NEW.name) = '') THEN
    NEW.name := NEW.full_name;
  ELSIF NEW.name IS NOT NULL AND (NEW.full_name IS NULL OR trim(NEW.full_name) = '') THEN
    NEW.full_name := NEW.name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_employee_code ON public.employees;
CREATE TRIGGER trg_handle_employee_code
  BEFORE INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_code();

-- 5. ENSURE SAFE WAGE NUMBER GENERATION
CREATE OR REPLACE FUNCTION public.handle_daily_wage_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_val bigint;
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.wage_number IS NULL OR trim(NEW.wage_number) = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(wage_number FROM '[0-9]+')::bigint), 0) + 1
    INTO v_next_val
    FROM public.daily_wages
    WHERE company_id = NEW.company_id;

    NEW.wage_number := 'WAG-' || LPAD(v_next_val::text, 5, '0');
  END IF;

  IF NEW.base_wage IS NULL THEN
    NEW.base_wage := COALESCE(NEW.amount, NEW.rate, 0);
  END IF;
  IF NEW.amount IS NULL THEN
    NEW.amount := NEW.base_wage;
  END IF;
  IF NEW.amount_payable IS NULL THEN
    NEW.amount_payable := NEW.amount;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_daily_wage_number ON public.daily_wages;
CREATE TRIGGER trg_handle_daily_wage_number
  BEFORE INSERT ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_daily_wage_number();

-- 6. ENSURE SAFE PURCHASE CODE GENERATION
CREATE OR REPLACE FUNCTION public.handle_purchase_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_val bigint;
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.purchase_number IS NULL OR trim(NEW.purchase_number) = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(purchase_number FROM '[0-9]+')::bigint), 0) + 1
    INTO v_next_val
    FROM public.purchases
    WHERE company_id = NEW.company_id;

    NEW.purchase_number := 'PUR-' || LPAD(v_next_val::text, 5, '0');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_purchase_code ON public.purchases;
CREATE TRIGGER trg_handle_purchase_code
  BEFORE INSERT ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_code();
