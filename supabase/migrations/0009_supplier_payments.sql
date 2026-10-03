-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 8: Supplier Payments & Payment Allocations Backend Migration
-- =============================================================================
-- This migration establishes supplier payment transactions and allocations:
--   - public.supplier_payments table (supplier-level payment transaction header)
--   - public.supplier_payment_allocations table (payment-to-purchase allocations)
--   - company-scoped sequential payment numbering (e.g. SP-0001)
--   - composite foreign keys guaranteeing cross-company & cross-supplier isolation
--   - validation triggers enforcing allocation invariants (over-allocation protection,
--     positive amounts, matching suppliers, confirmed purchase requirements)
--   - financial correction & immutability triggers (Rule 18: no deletion of completed payments)
--   - derived financial views: v_purchase_balance and v_supplier_balance
--   - atomic RPC functions: record_supplier_payment and allocate_supplier_payment
--   - company-scoped RLS policies with owner-only draft deletion
--   - audit logging triggers recording payment and allocation events in audit_log
--   - targeted performance indexes
--
-- FINANCIAL INVARIANTS:
-- 1. A supplier payment is a supplier-level transaction (not bound to only one purchase).
-- 2. Total allocations from a payment <= payment amount.
-- 3. Allocation to a purchase <= purchase outstanding balance.
-- 4. Payment supplier must equal purchase supplier.
-- 5. Allocation amount must be positive.
-- 6. Confirmed and Cancelled payments are immutable and cannot be physically deleted.
-- 7. Corrections use reversal references (reversal_of_id) and/or status cancellation.
-- =============================================================================

-- =====================
-- 1. SUPPLIER PAYMENTS TABLE
-- =====================

CREATE TABLE public.supplier_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL DEFAULT public.current_company_id()
                    REFERENCES public.companies(id) ON DELETE RESTRICT,
  supplier_id       uuid NOT NULL
                    REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  payment_number    text NOT NULL,
  payment_date      date NOT NULL DEFAULT CURRENT_DATE,
  amount            numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_method    text,
  reference_number  text,
  status            text NOT NULL DEFAULT 'Confirmed'
                    CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  notes             text,
  reversal_of_id    uuid
                    REFERENCES public.supplier_payments(id) ON DELETE RESTRICT,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK references
  CONSTRAINT uq_supplier_payments_company_id_id
    UNIQUE (company_id, id),

  -- Unique payment number per company
  CONSTRAINT uq_supplier_payments_company_number
    UNIQUE (company_id, payment_number),

  -- Composite foreign key to suppliers: supplier must belong to same company
  CONSTRAINT fk_supplier_payments_supplier_company
    FOREIGN KEY (company_id, supplier_id)
    REFERENCES public.suppliers (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key for reversal reference: must belong to same company
  CONSTRAINT fk_supplier_payments_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.supplier_payments (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.supplier_payments IS
  'Payments made to suppliers. Supplier-level financial transaction records. Company-scoped.';

CREATE TRIGGER supplier_payments_updated_at
  BEFORE UPDATE ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. SUPPLIER PAYMENT ALLOCATIONS TABLE
-- =====================

CREATE TABLE public.supplier_payment_allocations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL DEFAULT public.current_company_id()
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  payment_id  uuid NOT NULL
              REFERENCES public.supplier_payments(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL
              REFERENCES public.purchases(id) ON DELETE RESTRICT,
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_supplier_payment_allocations_company_id_id
    UNIQUE (company_id, id),

  -- Prevent duplicate allocation mappings for same payment and purchase
  CONSTRAINT uq_supplier_payment_allocations_payment_purchase
    UNIQUE (company_id, payment_id, purchase_id),

  -- Composite foreign key to supplier_payments
  CONSTRAINT fk_allocations_payment_company
    FOREIGN KEY (company_id, payment_id)
    REFERENCES public.supplier_payments (company_id, id)
    ON DELETE CASCADE,

  -- Composite foreign key to purchases
  CONSTRAINT fk_allocations_purchase_company
    FOREIGN KEY (company_id, purchase_id)
    REFERENCES public.purchases (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.supplier_payment_allocations IS
  'Allocation of supplier payments against outstanding purchases. Company-scoped.';

CREATE TRIGGER supplier_payment_allocations_updated_at
  BEFORE UPDATE ON public.supplier_payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. PAYMENT NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_supplier_payment_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.payment_number IS NULL OR trim(NEW.payment_number) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.supplier_payments
    WHERE company_id = NEW.company_id;

    NEW.payment_number := 'SP-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_supplier_payment_number() IS
  'Generates company-scoped sequential supplier payment numbers (e.g. SP-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_supplier_payment_number
  BEFORE INSERT ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_supplier_payment_number();

-- =====================
-- 4. VALIDATION & INTEGRITY TRIGGERS
-- =====================

-- 4a. Supplier Payment Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_supplier_payment_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure supplier belongs to same company
  IF NOT EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE id = NEW.supplier_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Supplier % does not belong to company %',
      NEW.supplier_id, NEW.company_id;
  END IF;

  -- 2. If reversal_of_id is provided, verify it belongs to same company
  IF NEW.reversal_of_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.supplier_payments
      WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal target payment % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;

    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: A payment cannot reverse itself';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_supplier_payment_integrity() IS
  'Trigger function ensuring supplier payments maintain company and supplier alignment.';

CREATE TRIGGER trg_validate_supplier_payment_integrity
  BEFORE INSERT OR UPDATE ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_supplier_payment_integrity();

-- 4b. Allocation Invariant Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_payment_allocation_invariants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment         record;
  v_purchase        record;
  v_other_allocs    numeric(14,2);
  v_purch_allocs    numeric(14,2);
  v_purch_outstanding numeric(14,2);
BEGIN
  -- 1. Verify allocation amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Allocation amount must be strictly positive';
  END IF;

  -- 2. Fetch and lock payment record
  SELECT id, company_id, supplier_id, amount, status
  INTO v_payment
  FROM public.supplier_payments
  WHERE id = NEW.payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment % not found', NEW.payment_id;
  END IF;

  -- Verify company match
  IF v_payment.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Payment % does not belong to company %',
      NEW.payment_id, NEW.company_id;
  END IF;

  -- Cannot allocate from a Cancelled payment
  IF v_payment.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial validation error: Cannot allocate from a Cancelled payment';
  END IF;

  -- 3. Fetch purchase record
  SELECT id, company_id, supplier_id, total_amount, status
  INTO v_purchase
  FROM public.purchases
  WHERE id = NEW.purchase_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase % not found', NEW.purchase_id;
  END IF;

  -- Verify company match
  IF v_purchase.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Purchase % does not belong to company %',
      NEW.purchase_id, NEW.company_id;
  END IF;

  -- 4. Enforce: Payment supplier must equal purchase supplier
  IF v_payment.supplier_id != v_purchase.supplier_id THEN
    RAISE EXCEPTION 'Cross-supplier allocation violation: Payment supplier % does not match purchase supplier %',
      v_payment.supplier_id, v_purchase.supplier_id;
  END IF;

  -- 5. Only Confirmed purchases can receive allocations
  IF v_purchase.status != 'Confirmed' THEN
    RAISE EXCEPTION 'Financial validation error: Cannot allocate payment to a % purchase. Purchase must be Confirmed',
      v_purchase.status;
  END IF;

  -- 6. Enforce: SUM(allocations for this payment) <= payment.amount
  SELECT COALESCE(SUM(amount), 0.00) INTO v_other_allocs
  FROM public.supplier_payment_allocations
  WHERE payment_id = NEW.payment_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF (v_other_allocs + NEW.amount) > v_payment.amount THEN
    RAISE EXCEPTION 'Payment over-allocation: Total allocations (%) exceed payment amount (%)',
      (v_other_allocs + NEW.amount), v_payment.amount;
  END IF;

  -- 7. Enforce: SUM(allocations for this purchase from active payments) <= purchase.total_amount
  SELECT COALESCE(SUM(spa.amount), 0.00) INTO v_purch_allocs
  FROM public.supplier_payment_allocations spa
  JOIN public.supplier_payments sp ON sp.id = spa.payment_id
  WHERE spa.purchase_id = NEW.purchase_id
    AND spa.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND sp.status != 'Cancelled';

  v_purch_outstanding := v_purchase.total_amount - v_purch_allocs;

  IF NEW.amount > v_purch_outstanding THEN
    RAISE EXCEPTION 'Purchase over-allocation: Allocation amount (%) exceeds purchase outstanding balance (%)',
      NEW.amount, v_purch_outstanding;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_payment_allocation_invariants() IS
  'Trigger function enforcing all allocation business and financial invariants.';

CREATE TRIGGER trg_validate_payment_allocation_invariants
  BEFORE INSERT OR UPDATE ON public.supplier_payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_allocation_invariants();

-- =====================
-- 5. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- Prevent physical deletion of completed supplier payments
CREATE OR REPLACE FUNCTION public.prevent_completed_supplier_payment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % supplier payment %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.payment_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_supplier_payment_deletion() IS
  'Enforces Rule 18: completed supplier payments (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_supplier_payment_deletion
  BEFORE DELETE ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_supplier_payment_deletion();

-- Prevent deletion or modification of allocations on completed payments
CREATE OR REPLACE FUNCTION public.prevent_completed_allocation_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_payment_num text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT status, payment_number INTO v_status, v_payment_num
    FROM public.supplier_payments
    WHERE id = OLD.payment_id;

    -- If the parent payment is being deleted in cascade (Draft payment), allow it
    IF v_status IS NOT NULL AND v_status != 'Draft' THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot delete allocations from % supplier payment %. Recorded transactions are immutable',
        v_status, v_payment_num;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT status, payment_number INTO v_status, v_payment_num
    FROM public.supplier_payments
    WHERE id = OLD.payment_id;

    IF v_status IS NOT NULL AND v_status != 'Draft' THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify allocations of % supplier payment %. Recorded transactions are immutable',
        v_status, v_payment_num;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_allocation_modification() IS
  'Enforces immutability: payment allocations on Confirmed or Cancelled payments cannot be modified or deleted.';

CREATE TRIGGER trg_prevent_completed_allocation_modification
  BEFORE UPDATE OR DELETE ON public.supplier_payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_allocation_modification();

-- =====================
-- 6. DERIVED FINANCIAL VIEWS
-- =====================

-- 6a. Purchase Balance View (DATABASE_RULES.md Section 19)
CREATE OR REPLACE VIEW public.v_purchase_balance AS
SELECT
  p.id AS purchase_id,
  p.company_id,
  p.supplier_id,
  p.project_id,
  p.purchase_number,
  p.purchase_date,
  p.status,
  p.total_amount,
  COALESCE(SUM(spa.amount) FILTER (WHERE sp.status = 'Confirmed'), 0.00) AS total_allocated,
  GREATEST(
    0.00,
    p.total_amount - COALESCE(SUM(spa.amount) FILTER (WHERE sp.status = 'Confirmed'), 0.00)
  ) AS outstanding_balance
FROM public.purchases p
LEFT JOIN public.supplier_payment_allocations spa
  ON spa.purchase_id = p.id AND spa.company_id = p.company_id
LEFT JOIN public.supplier_payments sp
  ON sp.id = spa.payment_id AND sp.company_id = p.company_id
GROUP BY
  p.id,
  p.company_id,
  p.supplier_id,
  p.project_id,
  p.purchase_number,
  p.purchase_date,
  p.status,
  p.total_amount;

COMMENT ON VIEW public.v_purchase_balance IS
  'Transaction-derived view of purchases with allocated payment totals and remaining outstanding balance.';

-- 6b. Supplier Balance View (DATABASE_RULES.md Section 19)
CREATE OR REPLACE VIEW public.v_supplier_balance AS
SELECT
  s.id AS supplier_id,
  s.company_id,
  s.name AS supplier_name,
  s.status AS supplier_status,
  COALESCE(purchases_agg.total_purchases, 0.00) AS total_purchases,
  COALESCE(payments_agg.total_allocated_payments, 0.00) AS total_allocated_payments,
  GREATEST(
    0.00,
    COALESCE(purchases_agg.total_purchases, 0.00) - COALESCE(payments_agg.total_allocated_payments, 0.00)
  ) AS outstanding_balance
FROM public.suppliers s
LEFT JOIN (
  SELECT
    company_id,
    supplier_id,
    SUM(total_amount) AS total_purchases
  FROM public.purchases
  WHERE status = 'Confirmed'
  GROUP BY company_id, supplier_id
) purchases_agg
  ON purchases_agg.supplier_id = s.id AND purchases_agg.company_id = s.company_id
LEFT JOIN (
  SELECT
    sp.company_id,
    sp.supplier_id,
    SUM(spa.amount) AS total_allocated_payments
  FROM public.supplier_payments sp
  JOIN public.supplier_payment_allocations spa
    ON spa.payment_id = sp.id AND spa.company_id = sp.company_id
  WHERE sp.status = 'Confirmed'
  GROUP BY sp.company_id, sp.supplier_id
) payments_agg
  ON payments_agg.supplier_id = s.id AND payments_agg.company_id = s.company_id;

COMMENT ON VIEW public.v_supplier_balance IS
  'Transaction-derived view of suppliers with total confirmed purchases, allocated payments, and net outstanding balance.';

-- =====================
-- 7. ATOMIC FINANCIAL RPC FUNCTIONS
-- =====================

-- 7a. record_supplier_payment (DATABASE_RULES.md Section 20)
CREATE OR REPLACE FUNCTION public.record_supplier_payment(
  p_supplier_id       uuid,
  p_amount            numeric,
  p_payment_date      date DEFAULT CURRENT_DATE,
  p_payment_method    text DEFAULT NULL,
  p_reference_number  text DEFAULT NULL,
  p_notes             text DEFAULT NULL,
  p_status            text DEFAULT 'Confirmed',
  p_allocations       jsonb DEFAULT '[]'::jsonb,
  p_reversal_of_id    uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_payment_id  uuid;
  v_alloc       jsonb;
  v_purch_id    uuid;
  v_alloc_amt   numeric;
  v_alloc_notes text;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Payment amount must be strictly positive';
  END IF;

  -- 1. Insert payment initially as Draft so allocations can be attached cleanly
  INSERT INTO public.supplier_payments (
    company_id,
    supplier_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    status,
    notes,
    reversal_of_id
  )
  VALUES (
    v_company_id,
    p_supplier_id,
    COALESCE(p_payment_date, CURRENT_DATE),
    p_amount,
    p_payment_method,
    p_reference_number,
    'Draft',
    p_notes,
    p_reversal_of_id
  )
  RETURNING id INTO v_payment_id;

  -- 2. Insert allocations if provided
  IF p_allocations IS NOT NULL AND jsonb_array_length(p_allocations) > 0 THEN
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_purch_id    := (v_alloc->>'purchase_id')::uuid;
      v_alloc_amt   := (v_alloc->>'amount')::numeric;
      v_alloc_notes := v_alloc->>'notes';

      IF v_purch_id IS NULL OR v_alloc_amt IS NULL OR v_alloc_amt <= 0 THEN
        RAISE EXCEPTION 'Invalid allocation item: purchase_id and positive amount are required';
      END IF;

      INSERT INTO public.supplier_payment_allocations (
        company_id,
        payment_id,
        purchase_id,
        amount,
        notes
      )
      VALUES (
        v_company_id,
        v_payment_id,
        v_purch_id,
        v_alloc_amt,
        v_alloc_notes
      );
    END LOOP;
  END IF;

  -- 3. Transition to requested target status if not Draft
  IF p_status IS DISTINCT FROM 'Draft' THEN
    UPDATE public.supplier_payments
    SET status = COALESCE(p_status, 'Confirmed'),
        updated_at = now()
    WHERE id = v_payment_id;
  END IF;

  RETURN v_payment_id;
END;
$$;

COMMENT ON FUNCTION public.record_supplier_payment(uuid, numeric, date, text, text, text, text, jsonb, uuid) IS
  'Atomically records a supplier payment and attaches allocations in one transaction.';

-- 7b. allocate_supplier_payment (DATABASE_RULES.md Section 20)
CREATE OR REPLACE FUNCTION public.allocate_supplier_payment(
  p_payment_id  uuid,
  p_purchase_id uuid,
  p_amount      numeric,
  p_notes       text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id    uuid;
  v_allocation_id uuid;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Allocation amount must be strictly positive';
  END IF;

  INSERT INTO public.supplier_payment_allocations (
    company_id,
    payment_id,
    purchase_id,
    amount,
    notes
  )
  VALUES (
    v_company_id,
    p_payment_id,
    p_purchase_id,
    p_amount,
    p_notes
  )
  RETURNING id INTO v_allocation_id;

  RETURN v_allocation_id;
END;
$$;

COMMENT ON FUNCTION public.allocate_supplier_payment(uuid, uuid, numeric, text) IS
  'Allocates a payment against an outstanding purchase with full invariant verification.';

-- =====================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

-- 8a. Supplier Payments RLS
CREATE POLICY "Users can view company supplier payments"
  ON public.supplier_payments
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company supplier payments"
  ON public.supplier_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company supplier payments"
  ON public.supplier_payments
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete draft company supplier payments"
  ON public.supplier_payments
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
    AND status = 'Draft'
  );

-- 8b. Supplier Payment Allocations RLS
CREATE POLICY "Users can view company payment allocations"
  ON public.supplier_payment_allocations
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company payment allocations"
  ON public.supplier_payment_allocations
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update draft payment allocations"
  ON public.supplier_payment_allocations
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.supplier_payments sp
      WHERE sp.id = supplier_payment_allocations.payment_id
        AND sp.company_id = public.current_company_id()
        AND sp.status = 'Draft'
    )
  )
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can delete draft payment allocations"
  ON public.supplier_payment_allocations
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.supplier_payments sp
      WHERE sp.id = supplier_payment_allocations.payment_id
        AND sp.company_id = public.current_company_id()
        AND sp.status = 'Draft'
    )
  );

-- =====================
-- 9. AUDIT LOGGING TRIGGERS
-- =====================

-- 9a. Supplier Payments Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_supplier_payment_changes()
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
    v_action := 'create_supplier_payment';
    v_details := jsonb_build_object(
      'payment_number', NEW.payment_number,
      'supplier_id', NEW.supplier_id,
      'amount', NEW.amount,
      'payment_date', NEW.payment_date,
      'payment_method', NEW.payment_method,
      'reference_number', NEW.reference_number,
      'status', NEW.status,
      'reversal_of_id', NEW.reversal_of_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'supplier_payment_status_change';
    ELSE
      v_action := 'update_supplier_payment';
    END IF;

    v_details := jsonb_build_object(
      'payment_number', NEW.payment_number,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_amount', OLD.amount,
      'new_amount', NEW.amount,
      'supplier_id', NEW.supplier_id,
      'reversal_of_id', NEW.reversal_of_id
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_supplier_payment';
    v_details := jsonb_build_object(
      'payment_number', OLD.payment_number,
      'supplier_id', OLD.supplier_id,
      'amount', OLD.amount
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
      'supplier_payment',
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
    'supplier_payment',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_supplier_payment_changes() IS
  'Audits supplier payment creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_supplier_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_supplier_payment_changes();

-- 9b. Payment Allocations Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_payment_allocation_changes()
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
    v_action := 'create_payment_allocation';
    v_details := jsonb_build_object(
      'payment_id', NEW.payment_id,
      'purchase_id', NEW.purchase_id,
      'amount', NEW.amount
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_payment_allocation';
    v_details := jsonb_build_object(
      'payment_id', NEW.payment_id,
      'purchase_id', NEW.purchase_id,
      'old_amount', OLD.amount,
      'new_amount', NEW.amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_payment_allocation';
    v_details := jsonb_build_object(
      'payment_id', OLD.payment_id,
      'purchase_id', OLD.purchase_id,
      'amount', OLD.amount
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
      'payment_allocation',
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
    'payment_allocation',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_payment_allocation_changes() IS
  'Audits payment allocation creation, updates, and deletions.';

CREATE TRIGGER trg_audit_payment_allocation_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_allocation_changes();

-- =====================
-- 10. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_supplier_payments_company_id
  ON public.supplier_payments (company_id);

CREATE INDEX idx_supplier_payments_company_supplier
  ON public.supplier_payments (company_id, supplier_id);

CREATE INDEX idx_supplier_payments_company_date
  ON public.supplier_payments (company_id, payment_date);

CREATE INDEX idx_supplier_payments_company_status
  ON public.supplier_payments (company_id, status);

CREATE INDEX idx_supplier_payments_company_number
  ON public.supplier_payments (company_id, payment_number);

CREATE INDEX idx_supplier_payments_company_reversal
  ON public.supplier_payments (company_id, reversal_of_id);

CREATE INDEX idx_allocations_company_payment
  ON public.supplier_payment_allocations (company_id, payment_id);

CREATE INDEX idx_allocations_company_purchase
  ON public.supplier_payment_allocations (company_id, purchase_id);
