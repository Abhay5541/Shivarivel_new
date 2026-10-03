-- =============================================================================
-- Migration 0015: Customer Payments Module
-- Phase 14: Customer Payments & Receipts Backend
--
-- This migration establishes customer payment transactions (RECEIPTS):
--   - public.customer_payments table (company-scoped, customer & project linked)
--   - Company-scoped sequential payment numbering (CP-0001, CP-0002)
--   - Database-level customer-project alignment enforcement
--   - Overpayment protection against project contract value (Product Spec Sec 22)
--   - Financial immutability (Rule 18: Confirmed/Cancelled non-deletion)
--   - Cancellation and reversal support preserving audit trails
--   - Transaction-derived views (v_customer_payment_summary, v_project_customer_payment_balance)
--   - Atomic RPC functions (record_customer_payment, cancel_customer_payment, reverse_customer_payment)
--   - Row Level Security (RLS) policies enforcing multi-tenant isolation
--   - Audit logging triggers using existing audit_log infrastructure
--   - Performance indexes for operational and reporting access
--
-- FINANCIAL INVARIANTS:
-- 1. Customer payments represent RECEIPTS (money actually received from customers for projects).
-- 2. Customer payments are NOT project costs. They must NEVER be added to Recorded Project Cost
--    (Purchases + Wages + Expenses).
-- 3. In V1, every customer payment must reference a valid project belonging to that customer.
-- 4. Confirmed customer payments are financially immutable. Deletions are forbidden;
--    corrections require cancellation or reversal.
-- 5. No profit calculation is implemented here.
-- =============================================================================

-- =====================
-- 1. PREREQUISITE CONSTRAINT ON PROJECTS
-- =====================

-- Ensure composite uniqueness of (company_id, customer_id, id) on public.projects
-- so that customer_payments can enforce that the project belongs to the same customer
-- at the foreign key constraint level.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_projects_company_customer_id_id'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT uq_projects_company_customer_id_id
      UNIQUE (company_id, customer_id, id);
  END IF;
END $$;

-- =====================
-- 2. CUSTOMER PAYMENTS TABLE
-- =====================

CREATE TABLE public.customer_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL DEFAULT public.current_company_id()
                    REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id       uuid NOT NULL
                    REFERENCES public.customers(id) ON DELETE RESTRICT,
  project_id        uuid NOT NULL
                    REFERENCES public.projects(id) ON DELETE RESTRICT,
  payment_number    text NOT NULL,
  payment_date      date NOT NULL DEFAULT CURRENT_DATE,
  amount            numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_method    text CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other')),
  reference_number  text,
  status            text NOT NULL DEFAULT 'Confirmed'
                    CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  reversal_of_id    uuid,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_customer_payments_company_id_id
    UNIQUE (company_id, id),

  -- Unique payment number per company
  CONSTRAINT uq_customer_payments_company_number
    UNIQUE (company_id, payment_number),

  -- Composite foreign key to customers: customer must belong to same company
  CONSTRAINT fk_customer_payments_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to projects: project must belong to same company AND same customer
  CONSTRAINT fk_customer_payments_project_customer_company
    FOREIGN KEY (company_id, customer_id, project_id)
    REFERENCES public.projects (company_id, customer_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key for reversal reference: must belong to same company
  CONSTRAINT fk_customer_payments_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.customer_payments (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.customer_payments IS
  'Customer payment receipts for project work. Actual revenue receipts. Company-scoped.';

CREATE TRIGGER customer_payments_updated_at
  BEFORE UPDATE ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. PAYMENT NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_customer_payment_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.payment_number IS NULL OR trim(NEW.payment_number) = '' THEN
    SELECT COALESCE(
      MAX(
        CASE 
          WHEN payment_number ~ '^CP-[0-9]+$' 
          THEN substring(payment_number from 4)::bigint 
          ELSE 0 
        END
      ), 0) + 1 INTO v_next_num
    FROM public.customer_payments
    WHERE company_id = NEW.company_id;

    NEW.payment_number := 'CP-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_customer_payment_number() IS
  'Generates company-scoped sequential customer payment numbers (e.g. CP-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_customer_payment_number
  BEFORE INSERT ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_payment_number();

-- =====================
-- 4. VALIDATION & INTEGRITY TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.validate_customer_payment_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer           record;
  v_project            record;
  v_existing_confirmed numeric(14,2);
  v_target             record;
BEGIN
  -- 1. Ensure amount is strictly positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Customer payment amount must be strictly positive';
  END IF;

  -- 2. Validate customer belongs to same company
  SELECT id, company_id, name, status
  INTO v_customer
  FROM public.customers
  WHERE id = NEW.customer_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Customer % does not belong to company %',
      NEW.customer_id, NEW.company_id;
  END IF;

  -- 3. Validate project belongs to same company
  SELECT id, company_id, customer_id, contract_value, status
  INTO v_project
  FROM public.projects
  WHERE id = NEW.project_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Project % does not belong to company %',
      NEW.project_id, NEW.company_id;
  END IF;

  -- 4. Ensure project belongs to the specified customer
  IF v_project.customer_id != NEW.customer_id THEN
    RAISE EXCEPTION 'Customer/Project mismatch: Project % belongs to customer %, not %',
      NEW.project_id, v_project.customer_id, NEW.customer_id;
  END IF;

  -- 5. Overpayment prevention against contract value (Product Spec Sec 22: "Overpayment should fail unless explicitly supported later")
  IF NEW.status = 'Confirmed' AND v_project.contract_value IS NOT NULL AND NEW.reversal_of_id IS NULL THEN
    SELECT COALESCE(SUM(amount), 0.00) INTO v_existing_confirmed
    FROM public.customer_payments
    WHERE project_id = NEW.project_id
      AND company_id = NEW.company_id
      AND status = 'Confirmed'
      AND reversal_of_id IS NULL
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND id NOT IN (
        SELECT r.reversal_of_id FROM public.customer_payments r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      );

    IF (v_existing_confirmed + NEW.amount) > v_project.contract_value THEN
      RAISE EXCEPTION 'Financial validation error: Payment amount % exceeds remaining contract value of project % (contract value: %, already confirmed: %)',
        NEW.amount, v_project.id, v_project.contract_value, v_existing_confirmed;
    END IF;
  END IF;

  -- 6. Validate reversal reference if provided
  IF NEW.reversal_of_id IS NOT NULL THEN
    -- Cannot self-reference
    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: A customer payment cannot reverse itself';
    END IF;

    -- Fetch reversal target within same company
    SELECT id, company_id, customer_id, project_id, status, reversal_of_id, amount
    INTO v_target
    FROM public.customer_payments
    WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal target customer payment % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;

    -- Target must be Confirmed
    IF v_target.status != 'Confirmed' THEN
      RAISE EXCEPTION 'Financial integrity violation: Can only reverse a Confirmed customer payment (target status is %)',
        v_target.status;
    END IF;

    -- Target cannot be a reversal itself
    IF v_target.reversal_of_id IS NOT NULL THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot reverse a payment that is already a reversal transaction';
    END IF;

    -- Target customer and project must match reversal entry
    IF v_target.customer_id != NEW.customer_id OR v_target.project_id != NEW.project_id THEN
      RAISE EXCEPTION 'Integrity violation: Reversal target customer/project does not match reversal entry';
    END IF;

    -- Prevent duplicate reversals of the same target payment
    IF EXISTS (
      SELECT 1 FROM public.customer_payments
      WHERE reversal_of_id = NEW.reversal_of_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status != 'Cancelled'
    ) THEN
      RAISE EXCEPTION 'Financial integrity violation: Target customer payment % has already been reversed',
        NEW.reversal_of_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_customer_payment_integrity() IS
  'Trigger function ensuring customer payments maintain company, customer, project alignment, overpayment prevention, and reversal invariants.';

CREATE TRIGGER trg_validate_customer_payment_integrity
  BEFORE INSERT OR UPDATE ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_customer_payment_integrity();

-- =====================
-- 5. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- 5a. Prevent physical deletion of completed customer payments
CREATE OR REPLACE FUNCTION public.prevent_completed_customer_payment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % customer payment %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.payment_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_customer_payment_deletion() IS
  'Enforces Rule 18: completed customer payments (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_customer_payment_deletion
  BEFORE DELETE ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_customer_payment_deletion();

-- 5b. Prevent modification of financial values on Confirmed and Cancelled customer payments
CREATE OR REPLACE FUNCTION public.prevent_completed_customer_payment_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cancelled payments cannot be modified at all
  IF OLD.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cancelled customer payment % cannot be modified',
      OLD.payment_number;
  END IF;

  -- Confirmed payments allow transition to Cancelled only, and financial fields are locked
  IF OLD.status = 'Confirmed' THEN
    IF NEW.status NOT IN ('Confirmed', 'Cancelled') THEN
      RAISE EXCEPTION 'Financial integrity violation: Confirmed customer payment % can only be transitioned to Cancelled',
        OLD.payment_number;
    END IF;

    IF NEW.company_id != OLD.company_id OR
       NEW.customer_id != OLD.customer_id OR
       NEW.project_id != OLD.project_id OR
       NEW.payment_date != OLD.payment_date OR
       NEW.amount != OLD.amount OR
       COALESCE(NEW.payment_method, '') != COALESCE(OLD.payment_method, '') OR
       COALESCE(NEW.reference_number, '') != COALESCE(OLD.reference_number, '') OR
       COALESCE(NEW.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) !=
       COALESCE(OLD.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify financial fields of Confirmed customer payment %. Recorded financial transactions are immutable (use status cancellation or reversal)',
        OLD.payment_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_customer_payment_modification() IS
  'Enforces immutability: financial fields of Confirmed/Cancelled customer payments cannot be modified.';

CREATE TRIGGER trg_prevent_completed_customer_payment_modification
  BEFORE UPDATE ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_customer_payment_modification();

-- =====================
-- 6. DERIVED RECEIPT & BALANCE VIEWS
-- =====================

-- 6a. Company-level customer payment summary
CREATE OR REPLACE VIEW public.v_customer_payment_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  COUNT(cp.id) AS total_payment_count,
  COUNT(cp.id) FILTER (WHERE cp.status = 'Confirmed') AS confirmed_payment_count,
  COUNT(cp.id) FILTER (WHERE cp.status = 'Draft') AS draft_payment_count,
  COUNT(cp.id) FILTER (WHERE cp.status = 'Cancelled') AS cancelled_payment_count,
  COUNT(cp.id) FILTER (
    WHERE cp.status = 'Confirmed'
      AND (cp.reversal_of_id IS NOT NULL OR cp.id IN (
        SELECT r.reversal_of_id FROM public.customer_payments r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      ))
  ) AS reversed_payment_count,
  COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'Confirmed'), 0.00) AS total_confirmed_receipts,
  COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'Cancelled'), 0.00) AS total_cancelled_amount,
  COALESCE(SUM(cp.amount) FILTER (
    WHERE cp.status = 'Confirmed'
      AND (cp.reversal_of_id IS NOT NULL OR cp.id IN (
        SELECT r.reversal_of_id FROM public.customer_payments r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      ))
  ), 0.00) AS total_reversed_amount,
  COALESCE(SUM(cp.amount) FILTER (
    WHERE cp.status = 'Confirmed'
      AND cp.reversal_of_id IS NULL
      AND cp.id NOT IN (
        SELECT r.reversal_of_id FROM public.customer_payments r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      )
  ), 0.00) AS active_receipt_total
FROM public.companies c
LEFT JOIN public.customer_payments cp ON cp.company_id = c.id
GROUP BY c.id, c.name;

COMMENT ON VIEW public.v_customer_payment_summary IS
  'Aggregated company-level customer receipts summary. Derived from transactions. Company-scoped.';

-- 6b. Project-level customer payment balance and receivable
CREATE OR REPLACE VIEW public.v_project_customer_payment_balance AS
SELECT
  p.company_id,
  p.customer_id,
  c.name AS customer_name,
  p.id AS project_id,
  p.project_code,
  p.name AS project_name,
  p.status AS project_status,
  p.contract_value,
  COUNT(cp.id) FILTER (WHERE cp.status = 'Confirmed') AS confirmed_payment_count,
  COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'Confirmed'), 0.00) AS total_confirmed_payments,
  COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'Cancelled'), 0.00) AS total_cancelled_payments,
  COALESCE(SUM(cp.amount) FILTER (
    WHERE cp.status = 'Confirmed'
      AND (cp.reversal_of_id IS NOT NULL OR cp.id IN (
        SELECT r.reversal_of_id FROM public.customer_payments r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      ))
  ), 0.00) AS total_reversed_payments,
  -- Active receipts received for project
  COALESCE(SUM(cp.amount) FILTER (
    WHERE cp.status = 'Confirmed'
      AND cp.reversal_of_id IS NULL
      AND cp.id NOT IN (
        SELECT r.reversal_of_id FROM public.customer_payments r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      )
  ), 0.00) AS amount_received,
  -- Outstanding receivable = Contract Value - Active Receipts (NULL if contract_value is not defined)
  CASE
    WHEN p.contract_value IS NOT NULL THEN
      GREATEST(
        p.contract_value - COALESCE(SUM(cp.amount) FILTER (
          WHERE cp.status = 'Confirmed'
            AND cp.reversal_of_id IS NULL
            AND cp.id NOT IN (
              SELECT r.reversal_of_id FROM public.customer_payments r
              WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
            )
        ), 0.00),
        0.00
      )
    ELSE NULL
  END AS outstanding_amount,
  -- Flag if project is fully paid against contract value
  CASE
    WHEN p.contract_value IS NOT NULL AND COALESCE(SUM(cp.amount) FILTER (
      WHERE cp.status = 'Confirmed'
        AND cp.reversal_of_id IS NULL
        AND cp.id NOT IN (
          SELECT r.reversal_of_id FROM public.customer_payments r
          WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
        )
    ), 0.00) >= p.contract_value THEN true
    ELSE false
  END AS is_fully_paid
FROM public.projects p
JOIN public.customers c ON c.id = p.customer_id AND c.company_id = p.company_id
LEFT JOIN public.customer_payments cp ON cp.project_id = p.id AND cp.company_id = p.company_id
GROUP BY p.company_id, p.customer_id, c.name, p.id, p.project_code, p.name, p.status, p.contract_value;

COMMENT ON VIEW public.v_project_customer_payment_balance IS
  'Project-level customer payment balance and receivable. Contract Value minus Active Receipts. Company-scoped.';

-- =====================
-- 7. ATOMIC RPC FUNCTIONS
-- =====================

-- 7a. record_customer_payment: Atomically records customer payment receipts
CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_customer_id      uuid,
  p_project_id       uuid,
  p_amount           numeric,
  p_payment_date     date DEFAULT CURRENT_DATE,
  p_payment_method   text DEFAULT NULL,
  p_reference_number text DEFAULT NULL,
  p_notes            text DEFAULT NULL,
  p_status           text DEFAULT 'Confirmed',
  p_reversal_of_id   uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_payment_id     uuid;
  v_payment_number text;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Customer payment amount must be strictly positive';
  END IF;

  IF p_status NOT IN ('Draft', 'Confirmed') THEN
    RAISE EXCEPTION 'Invalid customer payment status: %. Supported: Draft, Confirmed', p_status;
  END IF;

  INSERT INTO public.customer_payments (
    company_id,
    customer_id,
    project_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    status,
    reversal_of_id,
    notes
  ) VALUES (
    v_company_id,
    p_customer_id,
    p_project_id,
    COALESCE(p_payment_date, CURRENT_DATE),
    p_amount,
    p_payment_method,
    p_reference_number,
    p_status,
    p_reversal_of_id,
    p_notes
  ) RETURNING id, payment_number INTO v_payment_id, v_payment_number;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'payment_number', v_payment_number,
    'customer_id', p_customer_id,
    'project_id', p_project_id,
    'amount', p_amount,
    'status', p_status
  );
END;
$$;

COMMENT ON FUNCTION public.record_customer_payment(uuid, uuid, numeric, date, text, text, text, text, uuid) IS
  'Server-side atomic RPC to record a customer payment receipt with validation and sequential numbering.';

-- 7b. cancel_customer_payment: Cancels a customer payment in compliance with Rule 18 non-deletion
CREATE OR REPLACE FUNCTION public.cancel_customer_payment(
  p_payment_id uuid,
  p_notes      text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_status     text;
BEGIN
  v_company_id := public.current_company_id();

  SELECT status INTO v_status
  FROM public.customer_payments
  WHERE id = p_payment_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer payment % not found', p_payment_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Customer payment % is already cancelled', p_payment_id;
  END IF;

  UPDATE public.customer_payments
  SET
    status = 'Cancelled',
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Cancellation: ' || p_notes
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_payment_id AND company_id = v_company_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.cancel_customer_payment(uuid, text) IS
  'Cancels a customer payment in compliance with Rule 18 non-deletion.';

-- 7c. reverse_customer_payment: Atomically creates an offsetting reversal customer payment
CREATE OR REPLACE FUNCTION public.reverse_customer_payment(
  p_payment_id uuid,
  p_notes      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_orig           record;
  v_rev_id         uuid;
  v_rev_number     text;
BEGIN
  v_company_id := public.current_company_id();

  SELECT * INTO v_orig
  FROM public.customer_payments
  WHERE id = p_payment_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer payment % not found', p_payment_id;
  END IF;

  IF v_orig.status != 'Confirmed' THEN
    RAISE EXCEPTION 'Financial integrity violation: Can only reverse a Confirmed customer payment (status is %)', v_orig.status;
  END IF;

  IF v_orig.reversal_of_id IS NOT NULL THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot reverse a payment that is already a reversal transaction';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.customer_payments
    WHERE reversal_of_id = p_payment_id AND status != 'Cancelled'
  ) THEN
    RAISE EXCEPTION 'Financial integrity violation: Target customer payment % has already been reversed', p_payment_id;
  END IF;

  INSERT INTO public.customer_payments (
    company_id,
    customer_id,
    project_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    status,
    reversal_of_id,
    notes
  ) VALUES (
    v_company_id,
    v_orig.customer_id,
    v_orig.project_id,
    CURRENT_DATE,
    v_orig.amount,
    v_orig.payment_method,
    v_orig.reference_number,
    'Confirmed',
    v_orig.id,
    COALESCE(p_notes, 'Reversal entry')
  ) RETURNING id, payment_number INTO v_rev_id, v_rev_number;

  RETURN jsonb_build_object(
    'reversal_payment_id', v_rev_id,
    'reversal_payment_number', v_rev_number,
    'original_payment_id', v_orig.id,
    'amount', v_orig.amount,
    'status', 'Confirmed'
  );
END;
$$;

COMMENT ON FUNCTION public.reverse_customer_payment(uuid, text) IS
  'Atomically creates an offsetting reversal customer payment for a confirmed receipt.';

-- =====================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company customer payments"
  ON public.customer_payments
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company customer payments"
  ON public.customer_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company customer payments"
  ON public.customer_payments
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete draft company customer payments"
  ON public.customer_payments
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
    AND status = 'Draft'
  );

-- =====================
-- 9. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_customer_payment_changes()
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
    IF NEW.reversal_of_id IS NOT NULL THEN
      v_action := 'reverse_customer_payment';
    ELSE
      v_action := 'create_customer_payment';
    END IF;

    v_details := jsonb_build_object(
      'payment_number', NEW.payment_number,
      'customer_id', NEW.customer_id,
      'project_id', NEW.project_id,
      'payment_date', NEW.payment_date,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'status', NEW.status,
      'reversal_of_id', NEW.reversal_of_id
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.company_id,
      auth.uid(),
      v_action,
      'customer_payments',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_customer_payment';
    ELSE
      v_action := 'update_customer_payment';
    END IF;

    v_details := jsonb_build_object(
      'payment_number', NEW.payment_number,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'amount', NEW.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.company_id,
      auth.uid(),
      v_action,
      'customer_payments',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_customer_payment';
    v_details := jsonb_build_object(
      'payment_number', OLD.payment_number,
      'status', OLD.status,
      'amount', OLD.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id,
      auth.uid(),
      v_action,
      'customer_payments',
      OLD.id,
      v_details
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.audit_customer_payment_changes() IS
  'Trigger function recording audit log entries for customer payment creation, update, cancellation, reversal, and draft deletion.';

CREATE TRIGGER trg_audit_customer_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_customer_payment_changes();

-- =====================
-- 10. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_customer_payments_company_id ON public.customer_payments(company_id);
CREATE INDEX idx_customer_payments_company_customer ON public.customer_payments(company_id, customer_id);
CREATE INDEX idx_customer_payments_company_project ON public.customer_payments(company_id, project_id);
CREATE INDEX idx_customer_payments_company_date ON public.customer_payments(company_id, payment_date);
CREATE INDEX idx_customer_payments_company_status ON public.customer_payments(company_id, status);
CREATE INDEX idx_customer_payments_reversal ON public.customer_payments(company_id, reversal_of_id) WHERE reversal_of_id IS NOT NULL;
CREATE INDEX idx_customer_payments_active ON public.customer_payments(company_id, status) WHERE status = 'Confirmed';
