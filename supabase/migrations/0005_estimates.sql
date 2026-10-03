-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 4: Estimates Backend Migration
-- =============================================================================
-- This migration establishes the estimates module:
--   - public.estimates table (company-scoped cost proposals)
--   - public.estimate_items table (line-item details by category)
--   - composite foreign keys guaranteeing cross-company & customer alignment
--   - validation trigger preventing cross-company and customer/enquiry mismatches
--   - deterministic total calculation trigger from line items
--   - company-scoped sequential estimate numbering
--   - RLS policies enforcing tenant isolation
--   - audit logging triggers using the existing audit_log infrastructure
--   - performance indexes for common access patterns
--
-- DESIGN DECISIONS:
-- 1. Estimates are proposals/budgets, NOT invoices or financial transactions.
--    They do not alter project financials, customer balances, or revenue.
-- 2. Line items are categorized into MVP categories defined in PRODUCT_SPEC.md:
--    'Material', 'Labour', 'Electrical', 'Plumbing', 'Interior', 'Other'.
-- 3. total_amount is deterministically synchronized with estimate_items.
-- 4. Hard deletion of entire estimates is restricted to active owners;
--    line-item corrections within an estimate are permitted during drafting.
-- =============================================================================

-- =====================
-- 1. ESTIMATES TABLE
-- =====================

CREATE TABLE public.estimates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id     uuid NOT NULL
                  REFERENCES public.customers(id) ON DELETE RESTRICT,
  enquiry_id      uuid
                  REFERENCES public.enquiries(id) ON DELETE SET NULL,
  estimate_number text NOT NULL,
  estimate_date   date NOT NULL DEFAULT CURRENT_DATE,
  valid_until     date,
  title           text,
  notes           text,
  status          text NOT NULL DEFAULT 'Draft'
                  CHECK (status IN (
                    'Draft',
                    'Sent',
                    'Approved',
                    'Accepted',
                    'Rejected',
                    'Expired',
                    'Converted'
                  )),
  total_amount    numeric(14,2) NOT NULL DEFAULT 0.00
                  CHECK (total_amount >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Constraint 1: company-scoped unique estimate numbering
  CONSTRAINT uq_estimates_company_estimate_number
    UNIQUE (company_id, estimate_number),

  -- Constraint 2: composite unique key on (company_id, id) for composite foreign keys
  CONSTRAINT uq_estimates_company_id_id
    UNIQUE (company_id, id),

  -- Constraint 3: composite foreign key to customers (ensures customer belongs to same company)
  CONSTRAINT fk_estimates_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE RESTRICT,

  -- Constraint 4: composite foreign key to enquiries (ensures enquiry belongs to same company AND customer)
  CONSTRAINT fk_estimates_enquiry_company_customer
    FOREIGN KEY (company_id, customer_id, enquiry_id)
    REFERENCES public.enquiries (company_id, customer_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.estimates IS
  'Cost estimates / quotations prepared for customers and enquiries. Company-scoped.';

CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. ESTIMATE ITEMS TABLE
-- =====================

CREATE TABLE public.estimate_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL DEFAULT public.current_company_id()
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  estimate_id uuid NOT NULL
              REFERENCES public.estimates(id) ON DELETE CASCADE,
  category    text NOT NULL
              CHECK (category IN (
                'Material',
                'Labour',
                'Electrical',
                'Plumbing',
                'Interior',
                'Other'
              )),
  description text NOT NULL CHECK (char_length(trim(description)) > 0),
  quantity    numeric(12,3) NOT NULL DEFAULT 1.000 CHECK (quantity > 0),
  unit        text NOT NULL DEFAULT 'nos',
  unit_price  numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  amount      numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
  sort_order  integer NOT NULL DEFAULT 0,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Composite foreign key: ensures item belongs to the same company as the estimate
  CONSTRAINT fk_estimate_items_estimate_company
    FOREIGN KEY (company_id, estimate_id)
    REFERENCES public.estimates (company_id, id)
    ON DELETE CASCADE
);

COMMENT ON TABLE public.estimate_items IS
  'Line-item breakdown for estimates by category. Amounts are deterministically calculated.';

CREATE TRIGGER estimate_items_updated_at
  BEFORE UPDATE ON public.estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. NUMBERING & CROSS-COMPANY VALIDATION TRIGGERS
-- =====================

-- Auto-numbering trigger: generates company-scoped sequential estimate number if not provided
CREATE OR REPLACE FUNCTION public.handle_estimate_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.estimate_number IS NULL OR trim(NEW.estimate_number) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.estimates
    WHERE company_id = NEW.company_id;

    NEW.estimate_number := 'EST-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_estimate_number() IS
  'Generates company-scoped sequential estimate numbers (e.g. EST-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_estimate_number
  BEFORE INSERT ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_estimate_number();

-- Cross-company integrity validation trigger
CREATE OR REPLACE FUNCTION public.validate_estimate_integrity()
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

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_estimate_integrity() IS
  'Trigger function ensuring estimates maintain strict company and customer-enquiry alignment.';

CREATE TRIGGER trg_validate_estimate_integrity
  BEFORE INSERT OR UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_estimate_integrity();

-- Deterministic line-item amount calculation & estimate total synchronization
CREATE OR REPLACE FUNCTION public.sync_estimate_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estimate_id uuid;
  v_new_total numeric(14,2);
BEGIN
  -- Determine which estimate_id to update
  IF TG_OP = 'DELETE' THEN
    v_estimate_id := OLD.estimate_id;
  ELSE
    -- Compute item amount from quantity and unit_price
    NEW.amount := round(NEW.quantity * NEW.unit_price, 2);
    v_estimate_id := NEW.estimate_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_estimate_totals() IS
  'Computes estimate line item amount deterministically before insert/update.';

CREATE TRIGGER trg_sync_estimate_item_amount
  BEFORE INSERT OR UPDATE ON public.estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_estimate_totals();

-- Recalculate parent estimate total_amount after item insert/update/delete
CREATE OR REPLACE FUNCTION public.recalculate_estimate_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estimate_id uuid;
  v_new_total numeric(14,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_estimate_id := OLD.estimate_id;
  ELSE
    v_estimate_id := NEW.estimate_id;
  END IF;

  SELECT COALESCE(sum(amount), 0.00) INTO v_new_total
  FROM public.estimate_items
  WHERE estimate_id = v_estimate_id;

  UPDATE public.estimates
  SET total_amount = v_new_total,
      updated_at = now()
  WHERE id = v_estimate_id;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.recalculate_estimate_total() IS
  'Recalculates parent estimate total_amount whenever estimate line items change.';

CREATE TRIGGER trg_recalculate_estimate_total
  AFTER INSERT OR UPDATE OR DELETE ON public.estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_estimate_total();

-- =====================
-- 4. RLS POLICIES
-- =====================

ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

-- 4a. Estimates RLS
CREATE POLICY "Users can view company estimates"
  ON public.estimates
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company estimates"
  ON public.estimates
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company estimates"
  ON public.estimates
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company estimates"
  ON public.estimates
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- 4b. Estimate Items RLS
CREATE POLICY "Users can view company estimate items"
  ON public.estimate_items
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company estimate items"
  ON public.estimate_items
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company estimate items"
  ON public.estimate_items
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can delete company estimate items"
  ON public.estimate_items
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id());

-- =====================
-- 5. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_estimate_changes()
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
    v_action := 'create_estimate';
    v_details := jsonb_build_object(
      'estimate_number', NEW.estimate_number,
      'customer_id', NEW.customer_id,
      'enquiry_id', NEW.enquiry_id,
      'status', NEW.status,
      'total_amount', NEW.total_amount
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'estimate_status_change';
    ELSE
      v_action := 'update_estimate';
    END IF;

    v_details := jsonb_build_object(
      'estimate_number', NEW.estimate_number,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_total_amount', OLD.total_amount,
      'new_total_amount', NEW.total_amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_estimate';
    v_details := jsonb_build_object(
      'estimate_number', OLD.estimate_number,
      'customer_id', OLD.customer_id,
      'total_amount', OLD.total_amount
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
      'estimate',
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
    'estimate',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_estimate_changes() IS
  'Audits estimate creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_estimate_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_estimate_changes();

-- =====================
-- 6. INDEXES
-- =====================

CREATE INDEX idx_estimates_company_id
  ON public.estimates (company_id);

CREATE INDEX idx_estimates_company_customer
  ON public.estimates (company_id, customer_id);

CREATE INDEX idx_estimates_company_enquiry
  ON public.estimates (company_id, enquiry_id);

CREATE INDEX idx_estimates_company_status
  ON public.estimates (company_id, status);

CREATE INDEX idx_estimates_company_date
  ON public.estimates (company_id, estimate_date);

CREATE INDEX idx_estimates_company_valid_until
  ON public.estimates (company_id, valid_until);

CREATE INDEX idx_estimate_items_company_estimate
  ON public.estimate_items (company_id, estimate_id);

CREATE INDEX idx_estimate_items_estimate_sort
  ON public.estimate_items (estimate_id, sort_order);
