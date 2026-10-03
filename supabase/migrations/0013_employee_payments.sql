-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 12: Employee Payments Backend Migration
-- =============================================================================
-- This migration establishes employee payment transactions and allocations:
--   - public.employee_payments (payment transaction header to employees)
--   - public.employee_payment_wage_allocations (payment-to-daily-wage allocations)
--   - public.employee_payment_advance_allocations (payment-to-advance-recovery allocations)
--   - company-scoped sequential payment numbering (e.g. EP-0001)
--   - composite foreign keys guaranteeing cross-company & cross-employee isolation
--   - validation triggers enforcing allocation invariants:
--     • payment over-allocation prevention
--     • wage over-payment prevention (allocation <= wage outstanding)
--     • advance over-recovery prevention (allocation <= advance outstanding)
--     • employee matching between payment and allocation target
--     • positive amount enforcement
--   - financial immutability triggers (Rule 18: no deletion of completed payments)
--   - transaction-derived financial views:
--     • v_employee_wage_balance (wages earned, wages paid, outstanding wages)
--     • updated v_employee_advance_balance (incorporates advance recoveries)
--     • v_employee_payment_summary (complete employee financial summary)
--   - atomic RPC functions:
--     • record_employee_payment
--     • allocate_employee_payment_to_wage
--     • allocate_employee_payment_to_advance
--     • cancel_employee_payment
--   - company-scoped RLS policies
--   - audit logging triggers
--   - targeted performance indexes
--
-- FINANCIAL INVARIANTS:
-- 1. Employee payments represent MONEY ACTUALLY PAID TO WORKERS.
-- 2. Wage allocations reduce wage payable. Advance allocations reduce advance outstanding.
-- 3. SUM(wage_allocs) + SUM(advance_allocs) for a payment <= payment.amount.
-- 4. Wage allocation to a daily_wage <= daily_wage.amount - already_allocated.
-- 5. Advance allocation to an advance <= advance.amount - already_recovered.
-- 6. Wages and advances are SEPARATE financial streams. Never automatically net.
-- 7. Confirmed/Cancelled payments are immutable and cannot be physically deleted.
-- 8. Employee advance balance is NOT subtracted from wage payable.
-- =============================================================================

-- =====================
-- 1. EMPLOYEE PAYMENTS TABLE
-- =====================

CREATE TABLE public.employee_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL DEFAULT public.current_company_id()
                    REFERENCES public.companies(id) ON DELETE RESTRICT,
  employee_id       uuid NOT NULL,
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
  CONSTRAINT uq_employee_payments_company_id_id
    UNIQUE (company_id, id),

  -- Unique payment number per company
  CONSTRAINT uq_employee_payments_company_number
    UNIQUE (company_id, payment_number),

  -- Composite foreign key to employees: employee must belong to same company
  CONSTRAINT fk_employee_payments_employee_company
    FOREIGN KEY (company_id, employee_id)
    REFERENCES public.employees (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key for reversal reference: must belong to same company
  CONSTRAINT fk_employee_payments_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.employee_payments (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.employee_payments IS
  'Employee payment transactions. Financial records of money paid to workers. Company-scoped.';

CREATE TRIGGER employee_payments_updated_at
  BEFORE UPDATE ON public.employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. WAGE ALLOCATION TABLE
-- =====================

CREATE TABLE public.employee_payment_wage_allocations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL DEFAULT public.current_company_id()
                 REFERENCES public.companies(id) ON DELETE RESTRICT,
  payment_id     uuid NOT NULL
                 REFERENCES public.employee_payments(id) ON DELETE CASCADE,
  daily_wage_id  uuid NOT NULL
                 REFERENCES public.daily_wages(id) ON DELETE RESTRICT,
  amount         numeric(14,2) NOT NULL CHECK (amount > 0),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_epwa_company_id_id
    UNIQUE (company_id, id),

  -- Prevent duplicate allocation of same payment to same daily wage
  CONSTRAINT uq_epwa_payment_wage
    UNIQUE (company_id, payment_id, daily_wage_id),

  -- Composite FK to employee_payments
  CONSTRAINT fk_epwa_payment_company
    FOREIGN KEY (company_id, payment_id)
    REFERENCES public.employee_payments (company_id, id)
    ON DELETE CASCADE,

  -- Composite FK to daily_wages
  CONSTRAINT fk_epwa_daily_wage_company
    FOREIGN KEY (company_id, daily_wage_id)
    REFERENCES public.daily_wages (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.employee_payment_wage_allocations IS
  'Allocation of employee payments against outstanding daily wages. Company-scoped.';

CREATE TRIGGER epwa_updated_at
  BEFORE UPDATE ON public.employee_payment_wage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. ADVANCE RECOVERY ALLOCATION TABLE
-- =====================

CREATE TABLE public.employee_payment_advance_allocations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL DEFAULT public.current_company_id()
                      REFERENCES public.companies(id) ON DELETE RESTRICT,
  payment_id          uuid NOT NULL
                      REFERENCES public.employee_payments(id) ON DELETE CASCADE,
  employee_advance_id uuid NOT NULL
                      REFERENCES public.employee_advances(id) ON DELETE RESTRICT,
  amount              numeric(14,2) NOT NULL CHECK (amount > 0),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_epaa_company_id_id
    UNIQUE (company_id, id),

  -- Prevent duplicate allocation of same payment to same advance
  CONSTRAINT uq_epaa_payment_advance
    UNIQUE (company_id, payment_id, employee_advance_id),

  -- Composite FK to employee_payments
  CONSTRAINT fk_epaa_payment_company
    FOREIGN KEY (company_id, payment_id)
    REFERENCES public.employee_payments (company_id, id)
    ON DELETE CASCADE,

  -- Composite FK to employee_advances
  CONSTRAINT fk_epaa_advance_company
    FOREIGN KEY (company_id, employee_advance_id)
    REFERENCES public.employee_advances (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.employee_payment_advance_allocations IS
  'Allocation of employee payments as advance recovery. Company-scoped.';

CREATE TRIGGER epaa_updated_at
  BEFORE UPDATE ON public.employee_payment_advance_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 4. PAYMENT NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_employee_payment_number()
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
    FROM public.employee_payments
    WHERE company_id = NEW.company_id;

    NEW.payment_number := 'EP-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_employee_payment_number() IS
  'Generates company-scoped sequential employee payment numbers (e.g. EP-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_employee_payment_number
  BEFORE INSERT ON public.employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_payment_number();

-- =====================
-- 5. PAYMENT VALIDATION & INTEGRITY TRIGGERS
-- =====================

-- 5a. Employee Payment Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_employee_payment_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp record;
BEGIN
  -- 1. Ensure amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Payment amount must be strictly positive';
  END IF;

  -- 2. Validate employee belongs to same company
  SELECT id, company_id, status
  INTO v_emp
  FROM public.employees
  WHERE id = NEW.employee_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Employee % does not belong to company %',
      NEW.employee_id, NEW.company_id;
  END IF;

  -- 3. Validate reversal reference if provided
  IF NEW.reversal_of_id IS NOT NULL THEN
    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: A payment cannot reverse itself';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.employee_payments
      WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal target payment % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_employee_payment_integrity() IS
  'Trigger function ensuring employee payments maintain company and employee alignment.';

CREATE TRIGGER trg_validate_employee_payment_integrity
  BEFORE INSERT OR UPDATE ON public.employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_employee_payment_integrity();

-- 5b. Wage Allocation Invariant Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_wage_allocation_invariants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment       record;
  v_wage          record;
  v_total_allocs  numeric(14,2);
  v_wage_allocs   numeric(14,2);
  v_wage_outstanding numeric(14,2);
BEGIN
  -- 1. Verify positive amount
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Wage allocation amount must be strictly positive';
  END IF;

  -- 2. Fetch and verify payment
  SELECT id, company_id, employee_id, amount, status
  INTO v_payment
  FROM public.employee_payments
  WHERE id = NEW.payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee payment % not found', NEW.payment_id;
  END IF;

  IF v_payment.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Payment % does not belong to company %',
      NEW.payment_id, NEW.company_id;
  END IF;

  IF v_payment.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial validation error: Cannot allocate from a Cancelled payment';
  END IF;

  -- 3. Fetch and verify daily wage
  SELECT id, company_id, employee_id, amount, status
  INTO v_wage
  FROM public.daily_wages
  WHERE id = NEW.daily_wage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily wage % not found', NEW.daily_wage_id;
  END IF;

  IF v_wage.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Daily wage % does not belong to company %',
      NEW.daily_wage_id, NEW.company_id;
  END IF;

  -- 4. Employee must match between payment and wage
  IF v_payment.employee_id != v_wage.employee_id THEN
    RAISE EXCEPTION 'Employee mismatch: Payment employee % does not match wage employee %',
      v_payment.employee_id, v_wage.employee_id;
  END IF;

  -- 5. Wage must be Confirmed
  IF v_wage.status != 'Confirmed' THEN
    RAISE EXCEPTION 'Financial validation error: Cannot allocate to a % daily wage. Only Confirmed wages can receive payment allocations',
      v_wage.status;
  END IF;

  -- 6. Check total payment allocation does not exceed payment amount
  SELECT COALESCE(SUM(wa.amount), 0) + COALESCE(SUM(aa.amount), 0)
  INTO v_total_allocs
  FROM (
    SELECT amount FROM public.employee_payment_wage_allocations
    WHERE payment_id = NEW.payment_id
      AND company_id = NEW.company_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) wa
  FULL OUTER JOIN (
    SELECT amount FROM public.employee_payment_advance_allocations
    WHERE payment_id = NEW.payment_id
      AND company_id = NEW.company_id
  ) aa ON false;

  -- Recompute properly: sum wage allocs + sum advance allocs
  SELECT COALESCE(SUM(amount), 0) INTO v_total_allocs
  FROM (
    SELECT amount FROM public.employee_payment_wage_allocations
    WHERE payment_id = NEW.payment_id AND company_id = NEW.company_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT amount FROM public.employee_payment_advance_allocations
    WHERE payment_id = NEW.payment_id AND company_id = NEW.company_id
  ) combined;

  IF (v_total_allocs + NEW.amount) > v_payment.amount THEN
    RAISE EXCEPTION 'Payment over-allocation: Total allocations (%) would exceed payment amount (%)',
      (v_total_allocs + NEW.amount), v_payment.amount;
  END IF;

  -- 7. Check wage over-payment: allocation to this wage <= wage outstanding
  SELECT COALESCE(SUM(epwa.amount), 0)
  INTO v_wage_allocs
  FROM public.employee_payment_wage_allocations epwa
  JOIN public.employee_payments ep ON ep.id = epwa.payment_id AND ep.company_id = epwa.company_id
  WHERE epwa.daily_wage_id = NEW.daily_wage_id
    AND epwa.company_id = NEW.company_id
    AND epwa.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND ep.status != 'Cancelled';

  v_wage_outstanding := v_wage.amount - v_wage_allocs;

  IF NEW.amount > v_wage_outstanding THEN
    RAISE EXCEPTION 'Wage over-payment: Allocation amount (%) exceeds wage outstanding balance (%)',
      NEW.amount, v_wage_outstanding;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_wage_allocation_invariants() IS
  'Trigger function enforcing wage payment allocation business and financial invariants.';

CREATE TRIGGER trg_validate_wage_allocation_invariants
  BEFORE INSERT OR UPDATE ON public.employee_payment_wage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_wage_allocation_invariants();

-- 5c. Advance Recovery Allocation Invariant Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_advance_allocation_invariants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment           record;
  v_advance           record;
  v_total_allocs      numeric(14,2);
  v_advance_recovered numeric(14,2);
  v_advance_outstanding numeric(14,2);
BEGIN
  -- 1. Verify positive amount
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Advance recovery allocation amount must be strictly positive';
  END IF;

  -- 2. Fetch and verify payment
  SELECT id, company_id, employee_id, amount, status
  INTO v_payment
  FROM public.employee_payments
  WHERE id = NEW.payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee payment % not found', NEW.payment_id;
  END IF;

  IF v_payment.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Payment % does not belong to company %',
      NEW.payment_id, NEW.company_id;
  END IF;

  IF v_payment.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial validation error: Cannot allocate from a Cancelled payment';
  END IF;

  -- 3. Fetch and verify advance
  SELECT id, company_id, employee_id, amount, status
  INTO v_advance
  FROM public.employee_advances
  WHERE id = NEW.employee_advance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee advance % not found', NEW.employee_advance_id;
  END IF;

  IF v_advance.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Advance % does not belong to company %',
      NEW.employee_advance_id, NEW.company_id;
  END IF;

  -- 4. Employee must match between payment and advance
  IF v_payment.employee_id != v_advance.employee_id THEN
    RAISE EXCEPTION 'Employee mismatch: Payment employee % does not match advance employee %',
      v_payment.employee_id, v_advance.employee_id;
  END IF;

  -- 5. Advance must be Confirmed (non-reversed, non-cancelled)
  IF v_advance.status != 'Confirmed' THEN
    RAISE EXCEPTION 'Financial validation error: Cannot recover from a % advance. Only Confirmed advances can receive recovery allocations',
      v_advance.status;
  END IF;

  -- 6. Check total payment allocation does not exceed payment amount
  SELECT COALESCE(SUM(amount), 0) INTO v_total_allocs
  FROM (
    SELECT amount FROM public.employee_payment_wage_allocations
    WHERE payment_id = NEW.payment_id AND company_id = NEW.company_id
    UNION ALL
    SELECT amount FROM public.employee_payment_advance_allocations
    WHERE payment_id = NEW.payment_id AND company_id = NEW.company_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) combined;

  IF (v_total_allocs + NEW.amount) > v_payment.amount THEN
    RAISE EXCEPTION 'Payment over-allocation: Total allocations (%) would exceed payment amount (%)',
      (v_total_allocs + NEW.amount), v_payment.amount;
  END IF;

  -- 7. Check advance over-recovery: recovery against this advance <= advance outstanding
  SELECT COALESCE(SUM(epaa.amount), 0)
  INTO v_advance_recovered
  FROM public.employee_payment_advance_allocations epaa
  JOIN public.employee_payments ep ON ep.id = epaa.payment_id AND ep.company_id = epaa.company_id
  WHERE epaa.employee_advance_id = NEW.employee_advance_id
    AND epaa.company_id = NEW.company_id
    AND epaa.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND ep.status != 'Cancelled';

  v_advance_outstanding := v_advance.amount - v_advance_recovered;

  IF NEW.amount > v_advance_outstanding THEN
    RAISE EXCEPTION 'Advance over-recovery: Recovery amount (%) exceeds advance outstanding balance (%)',
      NEW.amount, v_advance_outstanding;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_advance_allocation_invariants() IS
  'Trigger function enforcing advance recovery allocation business and financial invariants.';

CREATE TRIGGER trg_validate_advance_allocation_invariants
  BEFORE INSERT OR UPDATE ON public.employee_payment_advance_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_advance_allocation_invariants();

-- =====================
-- 6. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- 6a. Prevent physical deletion of completed employee payments
CREATE OR REPLACE FUNCTION public.prevent_completed_employee_payment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % employee payment %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.payment_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_employee_payment_deletion() IS
  'Enforces Rule 18: completed employee payments (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_employee_payment_deletion
  BEFORE DELETE ON public.employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_employee_payment_deletion();

-- 6b. Prevent modification of financial values on completed payments
CREATE OR REPLACE FUNCTION public.prevent_completed_employee_payment_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cancelled employee payment % cannot be modified',
      OLD.payment_number;
  END IF;

  IF OLD.status = 'Confirmed' THEN
    IF NEW.status NOT IN ('Confirmed', 'Cancelled') THEN
      RAISE EXCEPTION 'Financial integrity violation: Confirmed employee payment % can only be transitioned to Cancelled',
        OLD.payment_number;
    END IF;

    IF NEW.company_id != OLD.company_id OR
       NEW.employee_id != OLD.employee_id OR
       NEW.payment_date != OLD.payment_date OR
       NEW.amount != OLD.amount OR
       COALESCE(NEW.payment_method, '') != COALESCE(OLD.payment_method, '') OR
       COALESCE(NEW.reference_number, '') != COALESCE(OLD.reference_number, '') OR
       COALESCE(NEW.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) !=
       COALESCE(OLD.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify financial fields of Confirmed employee payment %. Recorded financial transactions are immutable (use status cancellation or reversal)',
        OLD.payment_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_employee_payment_modification() IS
  'Enforces immutability: financial fields of Confirmed/Cancelled employee payments cannot be modified.';

CREATE TRIGGER trg_prevent_completed_employee_payment_modification
  BEFORE UPDATE ON public.employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_employee_payment_modification();

-- 6c. Prevent deletion/modification of allocations on completed payments
CREATE OR REPLACE FUNCTION public.prevent_completed_employee_payment_allocation_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status      text;
  v_payment_num text;
  v_payment_id  uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_payment_id := OLD.payment_id;
  ELSE
    v_payment_id := COALESCE(OLD.payment_id, NEW.payment_id);
  END IF;

  SELECT status, payment_number INTO v_status, v_payment_num
  FROM public.employee_payments
  WHERE id = v_payment_id;

  IF TG_OP = 'DELETE' THEN
    IF v_status IS NOT NULL AND v_status != 'Draft' THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot delete allocations from % employee payment %. Recorded transactions are immutable',
        v_status, v_payment_num;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF v_status IS NOT NULL AND v_status != 'Draft' THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify allocations of % employee payment %. Recorded transactions are immutable',
        v_status, v_payment_num;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_employee_payment_allocation_modification() IS
  'Enforces immutability: allocations of Confirmed or Cancelled employee payments cannot be modified or deleted.';

CREATE TRIGGER trg_prevent_completed_epwa_modification
  BEFORE UPDATE OR DELETE ON public.employee_payment_wage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_employee_payment_allocation_modification();

CREATE TRIGGER trg_prevent_completed_epaa_modification
  BEFORE UPDATE OR DELETE ON public.employee_payment_advance_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_employee_payment_allocation_modification();

-- =====================
-- 7. DERIVED FINANCIAL VIEWS
-- =====================

-- Drop existing advance views to allow schema/column alterations (avoids SQLSTATE 42P16)
DROP VIEW IF EXISTS public.v_employee_advance_outstanding CASCADE;
DROP VIEW IF EXISTS public.v_employee_advance_balance CASCADE;

-- 7a. Wage Balance: wages earned vs wages paid per employee
CREATE OR REPLACE VIEW public.v_employee_wage_balance AS
SELECT
  e.company_id,
  e.id AS employee_id,
  e.employee_code,
  e.name AS employee_name,
  e.status AS employee_status,
  COALESCE(SUM(dw.amount) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS total_wages_earned,
  COALESCE(wage_paid.total_paid, 0)::numeric(14,2) AS total_wages_paid,
  GREATEST(0.00,
    COALESCE(SUM(dw.amount) FILTER (WHERE dw.status = 'Confirmed'), 0) -
    COALESCE(wage_paid.total_paid, 0)
  )::numeric(14,2) AS outstanding_wages
FROM public.employees e
LEFT JOIN public.daily_wages dw
  ON dw.company_id = e.company_id AND dw.employee_id = e.id
LEFT JOIN (
  SELECT
    ep.company_id,
    ep.employee_id,
    SUM(epwa.amount) AS total_paid
  FROM public.employee_payments ep
  JOIN public.employee_payment_wage_allocations epwa
    ON epwa.payment_id = ep.id AND epwa.company_id = ep.company_id
  WHERE ep.status = 'Confirmed'
  GROUP BY ep.company_id, ep.employee_id
) wage_paid
  ON wage_paid.company_id = e.company_id AND wage_paid.employee_id = e.id
GROUP BY
  e.company_id,
  e.id,
  e.employee_code,
  e.name,
  e.status,
  wage_paid.total_paid;

COMMENT ON VIEW public.v_employee_wage_balance IS
  'Transaction-derived view of wage balances per employee: earned, paid, and outstanding. Company-scoped.';

-- 7b. Update advance balance view to incorporate advance recovery allocations from Phase 12
-- This CREATE OR REPLACE safely updates the Phase 11 view
CREATE OR REPLACE VIEW public.v_employee_advance_balance AS
SELECT
  e.company_id,
  e.id AS employee_id,
  e.employee_code,
  e.name AS employee_name,
  e.status AS employee_status,
  COALESCE(COUNT(ea.id) FILTER (WHERE ea.status = 'Confirmed' AND ea.reversal_of_id IS NULL), 0)::bigint AS confirmed_advances_count,
  COALESCE(SUM(ea.amount) FILTER (WHERE ea.status = 'Confirmed' AND ea.reversal_of_id IS NULL), 0)::numeric(14,2) AS total_confirmed_advances,
  COALESCE(SUM(ea.amount) FILTER (WHERE ea.status = 'Cancelled'), 0)::numeric(14,2) AS total_cancelled_amount,
  COALESCE(SUM(ea.amount) FILTER (WHERE ea.status = 'Confirmed' AND ea.reversal_of_id IS NOT NULL), 0)::numeric(14,2) AS total_reversed_amount,
  COALESCE(recovery_agg.total_recovered, 0)::numeric(14,2) AS total_recovered_amount,
  -- Outstanding advance balance = Confirmed non-reversed advances minus confirmed recoveries
  GREATEST(0.00,
    COALESCE(SUM(ea.amount) FILTER (
      WHERE ea.status = 'Confirmed'
        AND ea.reversal_of_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.employee_advances rev
          WHERE rev.reversal_of_id = ea.id
            AND rev.status = 'Confirmed'
        )
    ), 0.00)
    -
    COALESCE(recovery_agg.total_recovered, 0)
  )::numeric(14,2) AS outstanding_advance_balance
FROM public.employees e
LEFT JOIN public.employee_advances ea
  ON ea.company_id = e.company_id AND ea.employee_id = e.id
LEFT JOIN (
  SELECT
    ep.company_id,
    ep.employee_id,
    SUM(epaa.amount) AS total_recovered
  FROM public.employee_payments ep
  JOIN public.employee_payment_advance_allocations epaa
    ON epaa.payment_id = ep.id AND epaa.company_id = ep.company_id
  WHERE ep.status = 'Confirmed'
  GROUP BY ep.company_id, ep.employee_id
) recovery_agg
  ON recovery_agg.company_id = e.company_id AND recovery_agg.employee_id = e.id
GROUP BY
  e.company_id,
  e.id,
  e.employee_code,
  e.name,
  e.status,
  recovery_agg.total_recovered;

COMMENT ON VIEW public.v_employee_advance_balance IS
  'Financial summary view of employee advances and outstanding balances including advance recoveries. Company-scoped.';

-- Refresh the alias view
CREATE OR REPLACE VIEW public.v_employee_advance_outstanding AS
SELECT * FROM public.v_employee_advance_balance;

COMMENT ON VIEW public.v_employee_advance_outstanding IS
  'Alias view for v_employee_advance_balance matching DATABASE_RULES.md Rule 19.';

-- 7c. Employee Payment Summary: overall financial position per employee
CREATE OR REPLACE VIEW public.v_employee_payment_summary AS
SELECT
  e.company_id,
  e.id AS employee_id,
  e.employee_code,
  e.name AS employee_name,
  e.status AS employee_status,
  -- Wages
  COALESCE(wage_agg.total_wages_earned, 0)::numeric(14,2) AS total_wages_earned,
  COALESCE(wage_paid_agg.total_wages_paid, 0)::numeric(14,2) AS total_wages_paid,
  GREATEST(0.00,
    COALESCE(wage_agg.total_wages_earned, 0) - COALESCE(wage_paid_agg.total_wages_paid, 0)
  )::numeric(14,2) AS outstanding_wages,
  -- Advances
  COALESCE(adv_agg.total_advances_given, 0)::numeric(14,2) AS total_advances_given,
  COALESCE(adv_rec_agg.total_advances_recovered, 0)::numeric(14,2) AS total_advances_recovered,
  GREATEST(0.00,
    COALESCE(adv_agg.total_advances_given, 0) - COALESCE(adv_rec_agg.total_advances_recovered, 0)
  )::numeric(14,2) AS outstanding_advances,
  -- Payments
  COALESCE(payment_agg.total_payments, 0)::numeric(14,2) AS total_payments_made
FROM public.employees e
LEFT JOIN (
  SELECT company_id, employee_id,
    SUM(amount) AS total_wages_earned
  FROM public.daily_wages WHERE status = 'Confirmed'
  GROUP BY company_id, employee_id
) wage_agg ON wage_agg.company_id = e.company_id AND wage_agg.employee_id = e.id
LEFT JOIN (
  SELECT ep.company_id, ep.employee_id,
    SUM(epwa.amount) AS total_wages_paid
  FROM public.employee_payments ep
  JOIN public.employee_payment_wage_allocations epwa
    ON epwa.payment_id = ep.id AND epwa.company_id = ep.company_id
  WHERE ep.status = 'Confirmed'
  GROUP BY ep.company_id, ep.employee_id
) wage_paid_agg ON wage_paid_agg.company_id = e.company_id AND wage_paid_agg.employee_id = e.id
LEFT JOIN (
  SELECT company_id, employee_id,
    SUM(amount) AS total_advances_given
  FROM public.employee_advances
  WHERE status = 'Confirmed' AND reversal_of_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.employee_advances rev
      WHERE rev.reversal_of_id = employee_advances.id AND rev.status = 'Confirmed'
    )
  GROUP BY company_id, employee_id
) adv_agg ON adv_agg.company_id = e.company_id AND adv_agg.employee_id = e.id
LEFT JOIN (
  SELECT ep.company_id, ep.employee_id,
    SUM(epaa.amount) AS total_advances_recovered
  FROM public.employee_payments ep
  JOIN public.employee_payment_advance_allocations epaa
    ON epaa.payment_id = ep.id AND epaa.company_id = ep.company_id
  WHERE ep.status = 'Confirmed'
  GROUP BY ep.company_id, ep.employee_id
) adv_rec_agg ON adv_rec_agg.company_id = e.company_id AND adv_rec_agg.employee_id = e.id
LEFT JOIN (
  SELECT company_id, employee_id,
    SUM(amount) AS total_payments
  FROM public.employee_payments
  WHERE status = 'Confirmed'
  GROUP BY company_id, employee_id
) payment_agg ON payment_agg.company_id = e.company_id AND payment_agg.employee_id = e.id;

COMMENT ON VIEW public.v_employee_payment_summary IS
  'Complete financial summary per employee: wages earned/paid/outstanding, advances given/recovered/outstanding, total payments. Company-scoped.';

-- 7d. Update v_employee_wage_payable to incorporate actual wage payments
CREATE OR REPLACE VIEW public.v_employee_wage_payable AS
SELECT
  e.company_id,
  e.id AS employee_id,
  e.employee_code,
  e.name AS employee_name,
  e.worker_type,
  e.daily_wage AS master_daily_wage,
  e.status AS employee_status,
  COALESCE(COUNT(DISTINCT a.id), 0)::bigint AS total_attendance_records,
  COALESCE(COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Present'), 0)::bigint AS present_days,
  COALESCE(COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Half Day'), 0)::bigint AS half_days,
  COALESCE(COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Absent'), 0)::bigint AS absent_days,
  COALESCE(SUM(dw.payable_units) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS total_payable_units,
  COALESCE(SUM(dw.base_wage) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS total_base_wages,
  COALESCE(SUM(dw.overtime_hours) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS total_overtime_hours,
  COALESCE(SUM(dw.overtime_amount) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS total_overtime_amount,
  COALESCE(SUM(dw.amount) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS total_earned_wages,
  -- Wage payable now accounts for actual wage payments (Phase 12)
  GREATEST(0.00,
    COALESCE(SUM(dw.amount) FILTER (WHERE dw.status = 'Confirmed'), 0) -
    COALESCE(wage_paid.total_paid, 0)
  )::numeric(14,2) AS wage_payable
FROM public.employees e
LEFT JOIN public.attendance a
  ON a.company_id = e.company_id AND a.employee_id = e.id
LEFT JOIN public.daily_wages dw
  ON dw.company_id = e.company_id AND dw.attendance_id = a.id AND dw.status = 'Confirmed'
LEFT JOIN (
  SELECT
    ep.company_id,
    ep.employee_id,
    SUM(epwa.amount) AS total_paid
  FROM public.employee_payments ep
  JOIN public.employee_payment_wage_allocations epwa
    ON epwa.payment_id = ep.id AND epwa.company_id = ep.company_id
  WHERE ep.status = 'Confirmed'
  GROUP BY ep.company_id, ep.employee_id
) wage_paid
  ON wage_paid.company_id = e.company_id AND wage_paid.employee_id = e.id
GROUP BY
  e.company_id,
  e.id,
  e.employee_code,
  e.name,
  e.worker_type,
  e.daily_wage,
  e.status,
  wage_paid.total_paid;

COMMENT ON VIEW public.v_employee_wage_payable IS
  'Financial summary view of earned daily wages and payable balances per employee. Now reflects actual wage payments. Company-scoped.';

-- =====================
-- 8. ATOMIC RPC FUNCTIONS
-- =====================

-- 8a. record_employee_payment: Atomically records a payment with optional allocations
CREATE OR REPLACE FUNCTION public.record_employee_payment(
  p_employee_id        uuid,
  p_amount             numeric,
  p_payment_date       date DEFAULT CURRENT_DATE,
  p_payment_method     text DEFAULT NULL,
  p_reference_number   text DEFAULT NULL,
  p_notes              text DEFAULT NULL,
  p_status             text DEFAULT 'Confirmed',
  p_wage_allocations   jsonb DEFAULT '[]'::jsonb,
  p_advance_allocations jsonb DEFAULT '[]'::jsonb,
  p_reversal_of_id     uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id      uuid;
  v_payment_id      uuid;
  v_payment_number  text;
  v_alloc           jsonb;
  v_target_id       uuid;
  v_alloc_amt       numeric;
  v_alloc_notes     text;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Payment amount must be strictly positive';
  END IF;

  IF p_status NOT IN ('Draft', 'Confirmed') THEN
    RAISE EXCEPTION 'Invalid payment status: %. Supported: Draft, Confirmed', p_status;
  END IF;

  -- Insert payment initially as Draft so allocations can be attached
  INSERT INTO public.employee_payments (
    company_id,
    employee_id,
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
    p_employee_id,
    COALESCE(p_payment_date, CURRENT_DATE),
    p_amount,
    p_payment_method,
    p_reference_number,
    'Draft',
    p_notes,
    p_reversal_of_id
  )
  RETURNING id, payment_number INTO v_payment_id, v_payment_number;

  -- Insert wage allocations if provided
  IF p_wage_allocations IS NOT NULL AND jsonb_array_length(p_wage_allocations) > 0 THEN
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_wage_allocations)
    LOOP
      v_target_id   := (v_alloc->>'daily_wage_id')::uuid;
      v_alloc_amt   := (v_alloc->>'amount')::numeric;
      v_alloc_notes := v_alloc->>'notes';

      IF v_target_id IS NULL OR v_alloc_amt IS NULL OR v_alloc_amt <= 0 THEN
        RAISE EXCEPTION 'Invalid wage allocation: daily_wage_id and positive amount are required';
      END IF;

      INSERT INTO public.employee_payment_wage_allocations (
        company_id, payment_id, daily_wage_id, amount, notes
      ) VALUES (
        v_company_id, v_payment_id, v_target_id, v_alloc_amt, v_alloc_notes
      );
    END LOOP;
  END IF;

  -- Insert advance recovery allocations if provided
  IF p_advance_allocations IS NOT NULL AND jsonb_array_length(p_advance_allocations) > 0 THEN
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_advance_allocations)
    LOOP
      v_target_id   := (v_alloc->>'employee_advance_id')::uuid;
      v_alloc_amt   := (v_alloc->>'amount')::numeric;
      v_alloc_notes := v_alloc->>'notes';

      IF v_target_id IS NULL OR v_alloc_amt IS NULL OR v_alloc_amt <= 0 THEN
        RAISE EXCEPTION 'Invalid advance allocation: employee_advance_id and positive amount are required';
      END IF;

      INSERT INTO public.employee_payment_advance_allocations (
        company_id, payment_id, employee_advance_id, amount, notes
      ) VALUES (
        v_company_id, v_payment_id, v_target_id, v_alloc_amt, v_alloc_notes
      );
    END LOOP;
  END IF;

  -- Transition to target status if not Draft
  IF p_status IS DISTINCT FROM 'Draft' THEN
    UPDATE public.employee_payments
    SET status = COALESCE(p_status, 'Confirmed'),
        updated_at = now()
    WHERE id = v_payment_id;
  END IF;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'payment_number', v_payment_number,
    'employee_id', p_employee_id,
    'amount', p_amount,
    'status', p_status
  );
END;
$$;

COMMENT ON FUNCTION public.record_employee_payment(uuid, numeric, date, text, text, text, text, jsonb, jsonb, uuid) IS
  'Atomically records an employee payment with optional wage and advance recovery allocations.';

-- 8b. allocate_employee_payment_to_wage
CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_wage(
  p_payment_id    uuid,
  p_daily_wage_id uuid,
  p_amount        numeric,
  p_notes         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_allocation_id  uuid;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Allocation amount must be strictly positive';
  END IF;

  INSERT INTO public.employee_payment_wage_allocations (
    company_id, payment_id, daily_wage_id, amount, notes
  ) VALUES (
    v_company_id, p_payment_id, p_daily_wage_id, p_amount, p_notes
  ) RETURNING id INTO v_allocation_id;

  RETURN v_allocation_id;
END;
$$;

COMMENT ON FUNCTION public.allocate_employee_payment_to_wage(uuid, uuid, numeric, text) IS
  'Allocates an employee payment against an outstanding daily wage with full invariant verification.';

-- 8c. allocate_employee_payment_to_advance
CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_advance(
  p_payment_id          uuid,
  p_employee_advance_id uuid,
  p_amount              numeric,
  p_notes               text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_allocation_id  uuid;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Allocation amount must be strictly positive';
  END IF;

  INSERT INTO public.employee_payment_advance_allocations (
    company_id, payment_id, employee_advance_id, amount, notes
  ) VALUES (
    v_company_id, p_payment_id, p_employee_advance_id, p_amount, p_notes
  ) RETURNING id INTO v_allocation_id;

  RETURN v_allocation_id;
END;
$$;

COMMENT ON FUNCTION public.allocate_employee_payment_to_advance(uuid, uuid, numeric, text) IS
  'Allocates an employee payment as advance recovery with full invariant verification.';

-- 8d. cancel_employee_payment: Cancels a payment in compliance with Rule 18
CREATE OR REPLACE FUNCTION public.cancel_employee_payment(
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
  FROM public.employee_payments
  WHERE id = p_payment_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee payment % not found', p_payment_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Employee payment % is already cancelled', p_payment_id;
  END IF;

  UPDATE public.employee_payments
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

COMMENT ON FUNCTION public.cancel_employee_payment(uuid, text) IS
  'Cancels an employee payment in compliance with Rule 18 non-deletion.';

-- =====================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payment_wage_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payment_advance_allocations ENABLE ROW LEVEL SECURITY;

-- 9a. Employee Payments RLS
CREATE POLICY "Users can view company employee payments"
  ON public.employee_payments
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company employee payments"
  ON public.employee_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company employee payments"
  ON public.employee_payments
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete draft company employee payments"
  ON public.employee_payments
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
    AND status = 'Draft'
  );

-- 9b. Wage Allocations RLS
CREATE POLICY "Users can view company wage allocations"
  ON public.employee_payment_wage_allocations
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company wage allocations"
  ON public.employee_payment_wage_allocations
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update draft wage allocations"
  ON public.employee_payment_wage_allocations
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.employee_payments ep
      WHERE ep.id = employee_payment_wage_allocations.payment_id
        AND ep.company_id = public.current_company_id()
        AND ep.status = 'Draft'
    )
  )
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can delete draft wage allocations"
  ON public.employee_payment_wage_allocations
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.employee_payments ep
      WHERE ep.id = employee_payment_wage_allocations.payment_id
        AND ep.company_id = public.current_company_id()
        AND ep.status = 'Draft'
    )
  );

-- 9c. Advance Recovery Allocations RLS
CREATE POLICY "Users can view company advance allocations"
  ON public.employee_payment_advance_allocations
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company advance allocations"
  ON public.employee_payment_advance_allocations
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update draft advance allocations"
  ON public.employee_payment_advance_allocations
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.employee_payments ep
      WHERE ep.id = employee_payment_advance_allocations.payment_id
        AND ep.company_id = public.current_company_id()
        AND ep.status = 'Draft'
    )
  )
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can delete draft advance allocations"
  ON public.employee_payment_advance_allocations
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.employee_payments ep
      WHERE ep.id = employee_payment_advance_allocations.payment_id
        AND ep.company_id = public.current_company_id()
        AND ep.status = 'Draft'
    )
  );

-- =====================
-- 10. AUDIT LOGGING TRIGGERS
-- =====================

-- 10a. Employee Payments Audit
CREATE OR REPLACE FUNCTION public.audit_employee_payment_changes()
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
    v_action := 'create_employee_payment';
    v_details := jsonb_build_object(
      'payment_number', NEW.payment_number,
      'employee_id', NEW.employee_id,
      'amount', NEW.amount,
      'payment_date', NEW.payment_date,
      'payment_method', NEW.payment_method,
      'status', NEW.status,
      'reversal_of_id', NEW.reversal_of_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_employee_payment';
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'employee_payment_status_change';
    ELSE
      v_action := 'update_employee_payment';
    END IF;
    v_details := jsonb_build_object(
      'payment_number', NEW.payment_number,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'amount', NEW.amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_employee_payment';
    v_details := jsonb_build_object(
      'payment_number', OLD.payment_number,
      'amount', OLD.amount,
      'status', OLD.status
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id, auth.uid(), v_action, 'employee_payments', OLD.id, v_details
    );
    RETURN OLD;
  END IF;

  INSERT INTO public.audit_log (
    company_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    NEW.company_id, auth.uid(), v_action, 'employee_payments', NEW.id, v_details
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_employee_payment_changes() IS
  'Audits employee payment creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_employee_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_payment_changes();

-- 10b. Wage Allocation Audit
CREATE OR REPLACE FUNCTION public.audit_employee_wage_allocation_changes()
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
    v_action := 'create_wage_allocation';
    v_details := jsonb_build_object(
      'payment_id', NEW.payment_id,
      'daily_wage_id', NEW.daily_wage_id,
      'amount', NEW.amount
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_wage_allocation';
    v_details := jsonb_build_object(
      'payment_id', NEW.payment_id,
      'daily_wage_id', NEW.daily_wage_id,
      'old_amount', OLD.amount,
      'new_amount', NEW.amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_wage_allocation';
    v_details := jsonb_build_object(
      'payment_id', OLD.payment_id,
      'daily_wage_id', OLD.daily_wage_id,
      'amount', OLD.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id, auth.uid(), v_action, 'employee_wage_allocation', OLD.id, v_details
    );
    RETURN OLD;
  END IF;

  INSERT INTO public.audit_log (
    company_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    NEW.company_id, auth.uid(), v_action, 'employee_wage_allocation', NEW.id, v_details
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_employee_wage_allocation_changes() IS
  'Audits employee wage payment allocation creation, updates, and deletions.';

CREATE TRIGGER trg_audit_employee_wage_allocation_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_payment_wage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_wage_allocation_changes();

-- 10c. Advance Allocation Audit
CREATE OR REPLACE FUNCTION public.audit_employee_advance_allocation_changes()
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
    v_action := 'create_advance_recovery_allocation';
    v_details := jsonb_build_object(
      'payment_id', NEW.payment_id,
      'employee_advance_id', NEW.employee_advance_id,
      'amount', NEW.amount
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_advance_recovery_allocation';
    v_details := jsonb_build_object(
      'payment_id', NEW.payment_id,
      'employee_advance_id', NEW.employee_advance_id,
      'old_amount', OLD.amount,
      'new_amount', NEW.amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_advance_recovery_allocation';
    v_details := jsonb_build_object(
      'payment_id', OLD.payment_id,
      'employee_advance_id', OLD.employee_advance_id,
      'amount', OLD.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id, auth.uid(), v_action, 'employee_advance_allocation', OLD.id, v_details
    );
    RETURN OLD;
  END IF;

  INSERT INTO public.audit_log (
    company_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    NEW.company_id, auth.uid(), v_action, 'employee_advance_allocation', NEW.id, v_details
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_employee_advance_allocation_changes() IS
  'Audits employee advance recovery allocation creation, updates, and deletions.';

CREATE TRIGGER trg_audit_employee_advance_allocation_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_payment_advance_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_advance_allocation_changes();

-- =====================
-- 11. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_employee_payments_company_employee
  ON public.employee_payments (company_id, employee_id);

CREATE INDEX idx_employee_payments_company_date
  ON public.employee_payments (company_id, payment_date);

CREATE INDEX idx_employee_payments_company_status
  ON public.employee_payments (company_id, status);

CREATE INDEX idx_employee_payments_company_number
  ON public.employee_payments (company_id, payment_number);

CREATE INDEX idx_employee_payments_reversal
  ON public.employee_payments (company_id, reversal_of_id)
  WHERE reversal_of_id IS NOT NULL;

CREATE INDEX idx_epwa_company_payment
  ON public.employee_payment_wage_allocations (company_id, payment_id);

CREATE INDEX idx_epwa_company_wage
  ON public.employee_payment_wage_allocations (company_id, daily_wage_id);

CREATE INDEX idx_epaa_company_payment
  ON public.employee_payment_advance_allocations (company_id, payment_id);

CREATE INDEX idx_epaa_company_advance
  ON public.employee_payment_advance_allocations (company_id, employee_advance_id);
