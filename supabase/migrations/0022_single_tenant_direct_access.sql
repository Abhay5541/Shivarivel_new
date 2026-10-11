-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase Single-Tenant: Dedicated Single-Tenant Direct Database Access
-- =============================================================================
-- Purpose:
--   1. Seed permanent primary company record.
--   2. Make current_company_id() default to Shivarivel so queries never yield NULL.
--   3. Auto-populate company_id on all tables.
--   4. Relax foreign keys & columns so web frontend can insert seamlessly.
--   5. Disable RLS on business tables so anon & authenticated clients can write
--      directly to PostgreSQL without 42501 permission errors.
-- =============================================================================

-- 1. SEED DEFAULT COMPANY
INSERT INTO public.companies (
  id,
  name,
  owner_name,
  phone,
  email,
  website,
  created_at,
  updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'Shivarivel Construction & Interiors',
  'K. Senthil Nathan',
  '+91 9443559885',
  'owner@shivarivel.com',
  'https://www.shivarivelconstruction.com',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  owner_name = EXCLUDED.owner_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  updated_at = now();

-- 2. SMART DEFAULT COMPANY ID FUNCTION
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = auth.uid()),
    'c0000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- 3. SCHEMA COLUMN ADJUSTMENTS
-- Projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type text;
ALTER TABLE public.projects ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN company_id SET DEFAULT public.current_company_id();

-- Employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.employees ALTER COLUMN company_id SET DEFAULT public.current_company_id();

-- Attendance
ALTER TABLE public.attendance ALTER COLUMN daily_wage_snapshot DROP NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN company_id SET DEFAULT public.current_company_id();

-- Daily Wages
ALTER TABLE public.daily_wages ALTER COLUMN attendance_id DROP NOT NULL;
ALTER TABLE public.daily_wages ALTER COLUMN company_id SET DEFAULT public.current_company_id();
ALTER TABLE public.daily_wages ADD COLUMN IF NOT EXISTS base_wage numeric(14,2);
ALTER TABLE public.daily_wages ADD COLUMN IF NOT EXISTS amount numeric(14,2);
ALTER TABLE public.daily_wages ADD COLUMN IF NOT EXISTS amount_payable numeric(14,2);
ALTER TABLE public.daily_wages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Recorded';

-- Customers
ALTER TABLE public.customers ALTER COLUMN company_id SET DEFAULT public.current_company_id();

-- Suppliers & Materials
ALTER TABLE public.suppliers ALTER COLUMN company_id SET DEFAULT public.current_company_id();
ALTER TABLE public.materials ALTER COLUMN company_id SET DEFAULT public.current_company_id();

-- Purchases & Payments
ALTER TABLE public.purchases ALTER COLUMN company_id SET DEFAULT public.current_company_id();
ALTER TABLE public.purchases ALTER COLUMN supplier_id DROP NOT NULL;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active';

ALTER TABLE public.supplier_payments ALTER COLUMN company_id SET DEFAULT public.current_company_id();
ALTER TABLE public.employee_advances ALTER COLUMN company_id SET DEFAULT public.current_company_id();
ALTER TABLE public.employee_payments ALTER COLUMN company_id SET DEFAULT public.current_company_id();

-- 4. AUTO-ASSIGN COMPANY_ID FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION public.auto_assign_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach auto_assign_company_id triggers to existing tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'customers', 'projects', 'suppliers', 'materials', 'purchases',
    'employees', 'attendance', 'daily_wages', 'employee_advances', 'employee_payments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_auto_assign_company_id ON public.%I;', t);
      EXECUTE format('CREATE TRIGGER trg_auto_assign_company_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.auto_assign_company_id();', t);
    END IF;
  END LOOP;
END;
$$;

-- 5. HARMONIZE CROSS-COMPANY INTEGRITY TRIGGERS
CREATE OR REPLACE FUNCTION public.validate_project_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET company_id = NEW.company_id
    WHERE id = NEW.customer_id AND company_id != NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_daily_wage_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.employee_id IS NOT NULL THEN
    UPDATE public.employees
    SET company_id = NEW.company_id
    WHERE id = NEW.employee_id AND company_id != NEW.company_id;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET company_id = NEW.company_id
    WHERE id = NEW.project_id AND company_id != NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_attendance_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.employee_id IS NOT NULL THEN
    UPDATE public.employees
    SET company_id = NEW.company_id
    WHERE id = NEW.employee_id AND company_id != NEW.company_id;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET company_id = NEW.company_id
    WHERE id = NEW.project_id AND company_id != NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_purchase_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;

  IF NEW.supplier_id IS NOT NULL THEN
    UPDATE public.suppliers
    SET company_id = NEW.company_id
    WHERE id = NEW.supplier_id AND company_id != NEW.company_id;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET company_id = NEW.company_id
    WHERE id = NEW.project_id AND company_id != NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. DISABLE RLS ON ALL PUBLIC TABLES & GRANT PERMISSIONS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', r.table_name);
  END LOOP;
END;
$$;

-- Grant usage on sequences and routines
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
