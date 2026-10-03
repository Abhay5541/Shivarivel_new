-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 11: Employee Advances Backend Migration
-- =============================================================================
-- This migration establishes employee advance transactions and balance tracking:
--   - public.employee_advances table (money given to workers separately from wages)
--   - company-scoped sequential advance numbering (e.g. ADV-0001)
--   - composite unique keys and composite foreign keys enforcing company-scoped integrity
--   - active employee validation on insert (inactive workers cannot receive new advances)
--   - strictly positive numeric amount constraints (amount > 0, NUMERIC(14,2))
--   - controlled payment method constraint ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other')
--   - financial immutability triggers (Rule 18: no physical deletion of completed advances)
--   - self-reversal reference support (reversal_of_id) with company isolation & self-reversal prevention
--   - derived financial views: v_employee_advance_balance and v_employee_advance_outstanding
--   - atomic RPC functions: record_employee_advance and cancel_employee_advance
--   - company-scoped RLS policies with owner-only draft deletion
--   - audit logging triggers recording advance creations, updates, and cancellations in audit_log
--   - targeted performance indexes
--
-- FINANCIAL INVARIANTS:
-- 1. Employee advances represent MONEY GIVEN TO WORKERS IN ADVANCE.
-- 2. Advances are NOT wages earned.
-- 3. Wages earned and employee advances are separate accounting concepts.
-- 4. Advance does NOT reduce wage payable in Phase 11 (explicit recovery belongs to Phase 12).
-- 5. Confirmed and Cancelled advances are immutable and cannot be physically deleted.
-- =============================================================================

-- =====================
-- 1. EMPLOYEE ADVANCES TABLE
-- =====================

CREATE TABLE public.employee_advances (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL DEFAULT public.current_company_id()
                    REFERENCES public.companies(id) ON DELETE RESTRICT,
  employee_id       uuid NOT NULL,
  advance_number    text NOT NULL,
  advance_date      date NOT NULL DEFAULT CURRENT_DATE,
  amount            numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_method    text CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other')),
  reference_number  text,
  purpose           text,
  notes             text,
  status            text NOT NULL DEFAULT 'Confirmed'
                    CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  reversal_of_id    uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_employee_advances_company_id_id
    UNIQUE (company_id, id),

  -- Unique advance number per company
  CONSTRAINT uq_employee_advances_company_number
    UNIQUE (company_id, advance_number),

  -- Composite foreign key to employees: employee must belong to same company
  CONSTRAINT fk_employee_advances_employee_company
    FOREIGN KEY (company_id, employee_id)
    REFERENCES public.employees (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key for reversal reference: must belong to same company
  CONSTRAINT fk_employee_advances_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.employee_advances (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.employee_advances IS
  'Employee cash advances. Financial records of money given to workers separately from wages. Company-scoped.';

CREATE TRIGGER employee_advances_updated_at
  BEFORE UPDATE ON public.employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. ADVANCE NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_employee_advance_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.advance_number IS NULL OR trim(NEW.advance_number) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.employee_advances
    WHERE company_id = NEW.company_id;

    NEW.advance_number := 'ADV-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_employee_advance_number() IS
  'Generates company-scoped sequential advance transaction numbers (e.g. ADV-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_employee_advance_number
  BEFORE INSERT ON public.employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_advance_number();

-- =====================
-- 3. VALIDATION & INTEGRITY TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.validate_employee_advance_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp      record;
  v_reversal record;
BEGIN
  -- 1. Ensure amount is strictly positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Advance amount must be strictly positive';
  END IF;

  -- 2. Fetch employee to check company alignment and status
  SELECT id, company_id, status
  INTO v_emp
  FROM public.employees
  WHERE id = NEW.employee_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Employee % does not belong to company %',
      NEW.employee_id, NEW.company_id;
  END IF;

  -- 3. On INSERT, verify employee is active
  IF TG_OP = 'INSERT' AND v_emp.status NOT IN ('active', 'Active') THEN
    RAISE EXCEPTION 'Employee status violation: Cannot create advance for inactive employee %',
      NEW.employee_id;
  END IF;

  -- 4. Reversal validation
  IF NEW.reversal_of_id IS NOT NULL THEN
    -- A transaction cannot reverse itself
    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: An advance cannot reverse itself';
    END IF;

    -- Fetch reversal target
    SELECT id, company_id, employee_id, status, amount
    INTO v_reversal
    FROM public.employee_advances
    WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal target advance % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;

    -- Target must belong to same employee
    IF v_reversal.employee_id != NEW.employee_id THEN
      RAISE EXCEPTION 'Integrity violation: Reversal target employee % does not match advance employee %',
        v_reversal.employee_id, NEW.employee_id;
    END IF;

    -- Can only reverse a Confirmed advance
    IF v_reversal.status != 'Confirmed' THEN
      RAISE EXCEPTION 'Financial integrity violation: Can only reverse a Confirmed advance (target is %)',
        v_reversal.status;
    END IF;

    -- Prevent duplicate reversals of the same target
    IF EXISTS (
      SELECT 1 FROM public.employee_advances
      WHERE reversal_of_id = NEW.reversal_of_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status != 'Cancelled'
    ) THEN
      RAISE EXCEPTION 'Financial integrity violation: Target advance % has already been reversed',
        NEW.reversal_of_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_employee_advance_integrity() IS
  'Trigger function ensuring employee advances maintain company, employee status, and reversal integrity.';

CREATE TRIGGER trg_validate_employee_advance_integrity
  BEFORE INSERT OR UPDATE ON public.employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_employee_advance_integrity();

-- =====================
-- 4. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- 4a. Prevent physical deletion of completed advances
CREATE OR REPLACE FUNCTION public.prevent_completed_employee_advance_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % employee advance %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.advance_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_employee_advance_deletion() IS
  'Enforces Rule 18: completed employee advances (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_employee_advance_deletion
  BEFORE DELETE ON public.employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_employee_advance_deletion();

-- 4b. Prevent modification of financial values on Confirmed and Cancelled advances
CREATE OR REPLACE FUNCTION public.prevent_completed_employee_advance_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If previously Cancelled, no modifications allowed
  IF OLD.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cancelled employee advance % cannot be modified',
      OLD.advance_number;
  END IF;

  -- If previously Confirmed:
  IF OLD.status = 'Confirmed' THEN
    -- Status can only transition to 'Cancelled'
    IF NEW.status NOT IN ('Confirmed', 'Cancelled') THEN
      RAISE EXCEPTION 'Financial integrity violation: Confirmed employee advance % can only be transitioned to Cancelled',
        OLD.advance_number;
    END IF;

    -- Financial and key relational fields are completely immutable
    IF NEW.company_id != OLD.company_id OR
       NEW.employee_id != OLD.employee_id OR
       NEW.advance_date != OLD.advance_date OR
       NEW.amount != OLD.amount OR
       COALESCE(NEW.payment_method, '') != COALESCE(OLD.payment_method, '') OR
       COALESCE(NEW.reference_number, '') != COALESCE(OLD.reference_number, '') OR
       COALESCE(NEW.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) !=
       COALESCE(OLD.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify financial fields of Confirmed employee advance %. Recorded financial transactions are immutable (use status cancellation or reversal)',
        OLD.advance_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_employee_advance_modification() IS
  'Enforces immutability: financial fields of Confirmed/Cancelled advances cannot be modified.';

CREATE TRIGGER trg_prevent_completed_employee_advance_modification
  BEFORE UPDATE ON public.employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_employee_advance_modification();

-- =====================
-- 5. DERIVED FINANCIAL VIEWS
-- =====================

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
  -- Outstanding advance balance = Confirmed advances that have not been cancelled or reversed
  -- (In Phase 11, without payments or recoveries yet)
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
  )::numeric(14,2) AS outstanding_advance_balance
FROM public.employees e
LEFT JOIN public.employee_advances ea
  ON ea.company_id = e.company_id AND ea.employee_id = e.id
GROUP BY
  e.company_id,
  e.id,
  e.employee_code,
  e.name,
  e.status;

COMMENT ON VIEW public.v_employee_advance_balance IS
  'Financial summary view of employee advances and outstanding balances. Company-scoped.';

-- View alias matching DATABASE_RULES.md Rule 19 naming
CREATE OR REPLACE VIEW public.v_employee_advance_outstanding AS
SELECT * FROM public.v_employee_advance_balance;

COMMENT ON VIEW public.v_employee_advance_outstanding IS
  'Alias view for v_employee_advance_balance matching DATABASE_RULES.md Rule 19.';

-- =====================
-- 6. ATOMIC RPC FUNCTIONS
-- =====================

-- 6a. record_employee_advance: Atomically records and optionally confirms an employee advance
CREATE OR REPLACE FUNCTION public.record_employee_advance(
  p_employee_id      uuid,
  p_amount           numeric,
  p_advance_date     date DEFAULT CURRENT_DATE,
  p_payment_method   text DEFAULT NULL,
  p_reference_number text DEFAULT NULL,
  p_purpose          text DEFAULT NULL,
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
  v_advance_id     uuid;
  v_advance_number text;
  v_emp_status     text;
BEGIN
  v_company_id := public.current_company_id();

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Advance amount must be strictly positive';
  END IF;

  IF p_status NOT IN ('Draft', 'Confirmed') THEN
    RAISE EXCEPTION 'Invalid advance status: %. Supported: Draft, Confirmed', p_status;
  END IF;

  -- Validate employee belongs to company
  SELECT status INTO v_emp_status
  FROM public.employees
  WHERE id = p_employee_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee % not found in current company', p_employee_id;
  END IF;

  IF v_emp_status NOT IN ('active', 'Active') THEN
    RAISE EXCEPTION 'Employee status violation: Cannot create advance for inactive employee %',
      p_employee_id;
  END IF;

  INSERT INTO public.employee_advances (
    company_id,
    employee_id,
    advance_date,
    amount,
    payment_method,
    reference_number,
    purpose,
    notes,
    status,
    reversal_of_id
  ) VALUES (
    v_company_id,
    p_employee_id,
    COALESCE(p_advance_date, CURRENT_DATE),
    p_amount,
    p_payment_method,
    p_reference_number,
    p_purpose,
    p_notes,
    p_status,
    p_reversal_of_id
  ) RETURNING id, advance_number INTO v_advance_id, v_advance_number;

  RETURN jsonb_build_object(
    'advance_id', v_advance_id,
    'advance_number', v_advance_number,
    'employee_id', p_employee_id,
    'amount', p_amount,
    'status', p_status
  );
END;
$$;

COMMENT ON FUNCTION public.record_employee_advance(uuid, numeric, date, text, text, text, text, text, uuid) IS
  'Server-side atomic RPC to record employee advances and generate sequential numbering.';

-- 6b. cancel_employee_advance: Cancels an advance in compliance with Rule 18 non-deletion
CREATE OR REPLACE FUNCTION public.cancel_employee_advance(
  p_advance_id uuid,
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
  FROM public.employee_advances
  WHERE id = p_advance_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee advance % not found', p_advance_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Employee advance % is already cancelled', p_advance_id;
  END IF;

  UPDATE public.employee_advances
  SET
    status = 'Cancelled',
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Cancellation: ' || p_notes
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_advance_id AND company_id = v_company_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.cancel_employee_advance(uuid, text) IS
  'Cancels an employee advance transaction in compliance with Rule 18 non-deletion.';

-- =====================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company employee advances"
  ON public.employee_advances
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company employee advances"
  ON public.employee_advances
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company employee advances"
  ON public.employee_advances
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company employee advances"
  ON public.employee_advances
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 8. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_employee_advance_changes()
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
    v_action := 'create_employee_advance';
    v_details := jsonb_build_object(
      'advance_number', NEW.advance_number,
      'employee_id', NEW.employee_id,
      'advance_date', NEW.advance_date,
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
      'employee_advances',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_employee_advance';
    ELSE
      v_action := 'update_employee_advance';
    END IF;

    v_details := jsonb_build_object(
      'advance_number', NEW.advance_number,
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
      'employee_advances',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_employee_advance';
    v_details := jsonb_build_object(
      'advance_number', OLD.advance_number,
      'status', OLD.status,
      'amount', OLD.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id,
      auth.uid(),
      v_action,
      'employee_advances',
      OLD.id,
      v_details
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.audit_employee_advance_changes() IS
  'Audit trigger function logging employee advance financial events into public.audit_log.';

CREATE TRIGGER trg_audit_employee_advance_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_advance_changes();

-- =====================
-- 9. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_employee_advances_company_employee
  ON public.employee_advances (company_id, employee_id);

CREATE INDEX idx_employee_advances_company_date
  ON public.employee_advances (company_id, advance_date);

CREATE INDEX idx_employee_advances_company_status
  ON public.employee_advances (company_id, status);

CREATE INDEX idx_employee_advances_reversal
  ON public.employee_advances (company_id, reversal_of_id)
  WHERE reversal_of_id IS NOT NULL;
