-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 3: Site Visits Migration
-- =============================================================================
-- This migration establishes the site visits module:
--   - public.site_visits table (company-scoped customer site visits)
--   - composite unique constraints on profiles and enquiries to support
--     composite foreign key verification
--   - cross-company integrity constraints & validation triggers
--   - RLS policies enforcing tenant isolation
--   - audit logging triggers using the existing audit_log infrastructure
--   - performance indexes for common access patterns
--
-- DESIGN DECISIONS:
-- 1. visit_date uses `date` (not timestamptz) as site visits represent
--    business calendar dates without timezone offset issues.
-- 2. site_address allows capturing project/property location independently
--    from the customer's permanent/billing address.
-- 3. Hard deletion is restricted to active owners; normal workflows
--    prefer status changes ('Cancelled').
-- =============================================================================

-- =====================
-- 1. PREREQUISITE COMPOSITE UNIQUE CONSTRAINTS
-- =====================

-- Allows composite foreign key from site_visits(company_id, assigned_to) -> profiles(company_id, id)
ALTER TABLE public.profiles
  ADD CONSTRAINT uq_profiles_company_id_id
  UNIQUE (company_id, id);

-- Allows composite foreign key from site_visits(company_id, customer_id, enquiry_id) -> enquiries(company_id, customer_id, id)
ALTER TABLE public.enquiries
  ADD CONSTRAINT uq_enquiries_company_id_customer_id_id
  UNIQUE (company_id, customer_id, id);

-- =====================
-- 2. SITE VISITS TABLE
-- =====================

CREATE TABLE public.site_visits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL DEFAULT public.current_company_id()
                REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id   uuid NOT NULL
                REFERENCES public.customers(id) ON DELETE RESTRICT,
  enquiry_id    uuid
                REFERENCES public.enquiries(id) ON DELETE SET NULL,
  site_address  text,
  visit_date    date NOT NULL,
  assigned_to   uuid
                REFERENCES public.profiles(id) ON DELETE SET NULL,
  purpose       text,
  observations  text,
  notes         text,
  status        text NOT NULL DEFAULT 'Scheduled'
                CHECK (status IN (
                  'Scheduled',
                  'Completed',
                  'Cancelled',
                  'Rescheduled'
                )),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Composite foreign key 1: customer must belong to the same company
  CONSTRAINT fk_site_visits_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key 2: if enquiry_id is provided, it must belong to the same company AND customer
  CONSTRAINT fk_site_visits_enquiry_company_customer
    FOREIGN KEY (company_id, customer_id, enquiry_id)
    REFERENCES public.enquiries (company_id, customer_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key 3: if assigned_to is provided, profile must belong to the same company
  CONSTRAINT fk_site_visits_assigned_profile_company
    FOREIGN KEY (company_id, assigned_to)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.site_visits IS
  'Site visits for customer properties and enquiries. Company-scoped.';

CREATE TRIGGER site_visits_updated_at
  BEFORE UPDATE ON public.site_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. INDEXES
-- =====================

CREATE INDEX idx_site_visits_company_id
  ON public.site_visits (company_id);

CREATE INDEX idx_site_visits_company_customer
  ON public.site_visits (company_id, customer_id);

CREATE INDEX idx_site_visits_company_enquiry
  ON public.site_visits (company_id, enquiry_id);

CREATE INDEX idx_site_visits_company_date
  ON public.site_visits (company_id, visit_date);

CREATE INDEX idx_site_visits_company_status
  ON public.site_visits (company_id, status);

CREATE INDEX idx_site_visits_company_assigned
  ON public.site_visits (company_id, assigned_to);

-- =====================
-- 4. CROSS-COMPANY & CUSTOMER INTEGRITY TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.validate_site_visit_integrity()
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

  -- 3. If assigned_to is provided, verify profile belongs to same company
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.assigned_to AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Assigned user % does not belong to company %',
        NEW.assigned_to, NEW.company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_site_visit_integrity() IS
  'Trigger function ensuring site visits maintain strict company, customer, and enquiry alignment.';

CREATE TRIGGER trg_validate_site_visit_integrity
  BEFORE INSERT OR UPDATE ON public.site_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_site_visit_integrity();

-- =====================
-- 5. RLS POLICIES
-- =====================

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- 5a. SELECT: Users can view site visits within their company
CREATE POLICY "Users can view company site visits"
  ON public.site_visits
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

-- 5b. INSERT: Users can create site visits for their company
CREATE POLICY "Users can insert company site visits"
  ON public.site_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

-- 5c. UPDATE: Users can update site visits within their company
CREATE POLICY "Users can update company site visits"
  ON public.site_visits
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- 5d. DELETE: Only owners can delete site visits
CREATE POLICY "Owners can delete company site visits"
  ON public.site_visits
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- =====================
-- 6. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_site_visit_changes()
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
    v_action := 'create_site_visit';
    v_details := jsonb_build_object(
      'customer_id', NEW.customer_id,
      'enquiry_id', NEW.enquiry_id,
      'visit_date', NEW.visit_date,
      'status', NEW.status,
      'assigned_to', NEW.assigned_to
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'site_visit_status_change';
    ELSIF NEW.visit_date IS DISTINCT FROM OLD.visit_date THEN
      v_action := 'reschedule_site_visit';
    ELSE
      v_action := 'update_site_visit';
    END IF;

    v_details := jsonb_build_object(
      'customer_id', NEW.customer_id,
      'enquiry_id', NEW.enquiry_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_visit_date', OLD.visit_date,
      'new_visit_date', NEW.visit_date,
      'assigned_to', NEW.assigned_to
    );
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
    'site_visit',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_site_visit_changes() IS
  'Audits site visit creation, status changes, and rescheduling.';

CREATE TRIGGER trg_audit_site_visit_changes
  AFTER INSERT OR UPDATE ON public.site_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_site_visit_changes();
