-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 2: Customers + Enquiries Migration
-- =============================================================================
-- This migration establishes the customer and enquiry modules:
--   - customers table (company-scoped client records)
--   - enquiries table (company-scoped business leads/requests)
--   - cross-company integrity constraints & validation triggers
--   - RLS policies enforcing tenant isolation
--   - audit logging triggers using the existing audit_log infrastructure
--   - performance indexes for common access patterns
--
-- DESIGN DECISION (Phone Uniqueness):
-- As specified in the Phase 2 requirements, phone uniqueness is NOT enforced
-- across customers. Multiple customers in construction/interiors frequently
-- share a contact number (e.g. husband/wife or co-owners of a property).
-- =============================================================================

-- =====================
-- 1. PRE-REQUISITE CONSTRAINT ON SERVICE_TYPES
-- =====================
-- Allows composite foreign key from enquiries(company_id, service_type_id)
-- ensuring relational cross-company integrity at the database engine level.

ALTER TABLE public.service_types
  ADD CONSTRAINT uq_service_types_company_id_id
  UNIQUE (company_id, id);

-- =====================
-- 2. CUSTOMERS TABLE
-- =====================

CREATE TABLE public.customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL DEFAULT public.current_company_id()
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  name        text NOT NULL CHECK (char_length(trim(name)) > 0),
  phone       text,
  email       text,
  address     text,
  notes       text,
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'inactive')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key to support composite foreign key referencing (company_id, id)
  CONSTRAINT uq_customers_company_id_id UNIQUE (company_id, id)
);

COMMENT ON TABLE public.customers IS
  'Customer directory for clients of the company. Company-scoped.';

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for customers
CREATE INDEX idx_customers_company_id
  ON public.customers (company_id);

CREATE INDEX idx_customers_company_name
  ON public.customers (company_id, name);

CREATE INDEX idx_customers_company_status
  ON public.customers (company_id, status);

-- =====================
-- 3. ENQUIRIES TABLE
-- =====================

CREATE TABLE public.enquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id     uuid NOT NULL
                  REFERENCES public.customers(id) ON DELETE RESTRICT,
  service_type_id uuid
                  REFERENCES public.service_types(id) ON DELETE SET NULL,
  enquiry_date    date NOT NULL DEFAULT CURRENT_DATE,
  source          text,
  description     text,
  estimated_value numeric(14,2) CHECK (estimated_value IS NULL OR estimated_value >= 0),
  status          text NOT NULL DEFAULT 'New'
                  CHECK (status IN (
                    'New',
                    'Contacted',
                    'Site Visit Planned',
                    'Estimate Prepared',
                    'Converted',
                    'Lost',
                    'On Hold'
                  )),
  follow_up_date  date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite foreign keys ensuring customer and service_type belong to the same company
  CONSTRAINT fk_enquiries_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_enquiries_service_type_company
    FOREIGN KEY (company_id, service_type_id)
    REFERENCES public.service_types (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.enquiries IS
  'Customer enquiries and potential business opportunities. Company-scoped.';

CREATE TRIGGER enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for enquiries
CREATE INDEX idx_enquiries_company_id
  ON public.enquiries (company_id);

CREATE INDEX idx_enquiries_company_customer
  ON public.enquiries (company_id, customer_id);

CREATE INDEX idx_enquiries_company_status
  ON public.enquiries (company_id, status);

CREATE INDEX idx_enquiries_company_follow_up
  ON public.enquiries (company_id, follow_up_date);

-- =====================
-- 4. CROSS-COMPANY INTEGRITY TRIGGER
-- =====================
-- Provides defense-in-depth and clear human-readable error messages
-- if an insert or update attempts to link cross-company records.

CREATE OR REPLACE FUNCTION public.validate_enquiry_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify customer belongs to the exact same company
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = NEW.customer_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Customer % does not belong to company %',
      NEW.customer_id, NEW.company_id;
  END IF;

  -- Verify service_type belongs to the exact same company if specified
  IF NEW.service_type_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.service_types
    WHERE id = NEW.service_type_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Service type % does not belong to company %',
      NEW.service_type_id, NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_enquiry_company() IS
  'Trigger function preventing cross-company customer and service_type linkages in enquiries.';

CREATE TRIGGER trg_validate_enquiry_company
  BEFORE INSERT OR UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_enquiry_company();

-- =====================
-- 5. RLS POLICIES: CUSTOMERS
-- =====================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 5a. SELECT: Users can view customers within their own company
CREATE POLICY "Users can view company customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

-- 5b. INSERT: Users can create customers for their own company
CREATE POLICY "Users can insert company customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

-- 5c. UPDATE: Users can update customers within their own company
CREATE POLICY "Users can update company customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- 5d. DELETE: Only owners can delete customer records
CREATE POLICY "Owners can delete company customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- =====================
-- 6. RLS POLICIES: ENQUIRIES
-- =====================

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 6a. SELECT: Users can view enquiries within their own company
CREATE POLICY "Users can view company enquiries"
  ON public.enquiries
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

-- 6b. INSERT: Users can create enquiries for their own company
CREATE POLICY "Users can insert company enquiries"
  ON public.enquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

-- 6c. UPDATE: Users can update enquiries within their own company
CREATE POLICY "Users can update company enquiries"
  ON public.enquiries
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- 6d. DELETE: Only owners can delete enquiry records
CREATE POLICY "Owners can delete company enquiries"
  ON public.enquiries
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- =====================
-- 7. AUDIT LOGGING TRIGGERS
-- =====================

-- Customer audit trigger function
CREATE OR REPLACE FUNCTION public.audit_customer_changes()
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
    v_action := 'create_customer';
    v_details := jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'customer_status_change';
    ELSE
      v_action := 'update_customer';
    END IF;
    v_details := jsonb_build_object(
      'name', NEW.name,
      'old_status', OLD.status,
      'new_status', NEW.status
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
    'customer',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_customer_changes() IS
  'Audits customer creation and status/information changes.';

CREATE TRIGGER trg_audit_customer_changes
  AFTER INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_customer_changes();

-- Enquiry audit trigger function
CREATE OR REPLACE FUNCTION public.audit_enquiry_changes()
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
    v_action := 'create_enquiry';
    v_details := jsonb_build_object(
      'customer_id', NEW.customer_id,
      'status', NEW.status,
      'estimated_value', NEW.estimated_value
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'enquiry_status_change';
    ELSE
      v_action := 'update_enquiry';
    END IF;
    v_details := jsonb_build_object(
      'customer_id', NEW.customer_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'estimated_value', NEW.estimated_value
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
    'enquiry',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_enquiry_changes() IS
  'Audits enquiry creation and lifecycle status changes.';

CREATE TRIGGER trg_audit_enquiry_changes
  AFTER INSERT OR UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_enquiry_changes();
