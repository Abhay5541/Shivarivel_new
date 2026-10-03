-- =============================================================================
-- Migration 0014: Expenses Module
-- Phase 13: Business & Project Expenses Backend
--
-- This migration establishes business and project expenses:
--   - public.expenses table (company-scoped, optional project linkage)
--   - Company-scoped sequential expense numbering (EXP-0001, EXP-0002)
--   - Validated categories matching source specification
--   - Financial immutability (Rule 18: Confirmed/Cancelled non-deletion)
--   - Cancellation and reversal support preserving audit trails
--   - Derived summary views (v_expense_summary, v_project_expense_summary)
--   - Recorded project cost view (v_project_recorded_cost: Purchases + Wages + Expenses)
--   - Atomic RPC functions (record_expense, cancel_expense, reverse_expense)
--   - Row Level Security (RLS) policies enforcing multi-tenant isolation
--   - Audit logging triggers using existing audit_log infrastructure
--   - Performance indexes for operational and reporting access
--
-- FINANCIAL INVARIANTS:
-- 1. Expenses represent miscellaneous business/project costs NOT captured by
--    Purchases, Employee Wages, Employee Advances, or Supplier Payments.
-- 2. An expense may optionally belong to a project. A NULL project indicates a
--    general company/overhead expense (e.g. office rent, electricity).
-- 3. Confirmed expenses are financially immutable. Deletions are forbidden;
--    corrections require cancellation or reversal.
-- 4. Recorded Project Cost = Purchases + Employee Wages + Expenses.
--    This is recorded cost, NOT profit. No profit calculation is implemented here.
-- =============================================================================

-- =====================
-- 1. EXPENSES TABLE
-- =====================

CREATE TABLE public.expenses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL DEFAULT public.current_company_id()
                    REFERENCES public.companies(id) ON DELETE RESTRICT,
  project_id        uuid
                    REFERENCES public.projects(id) ON DELETE SET NULL,
  expense_number    text NOT NULL,
  expense_date      date NOT NULL DEFAULT CURRENT_DATE,
  category          text NOT NULL
                    CHECK (category IN (
                      'Site Transportation',
                      'Fuel',
                      'Travel',
                      'Food / Refreshments',
                      'Electricity',
                      'Internet',
                      'Office Expenses',
                      'Equipment Rental',
                      'Small Tools',
                      'Repair / Maintenance',
                      'Miscellaneous',
                      'Other',
                      'Site transportation',
                      'Food / refreshments',
                      'Office expenses',
                      'Equipment rental',
                      'Small tools',
                      'Repair / maintenance',
                      'Miscellaneous project expense'
                    )),
  description       text NOT NULL CHECK (char_length(trim(description)) > 0),
  amount            numeric(14,2) NOT NULL CHECK (amount > 0),
  paid_by           text,
  payment_method    text CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other')),
  reference_number  text,
  status            text NOT NULL DEFAULT 'Confirmed'
                    CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  reversal_of_id    uuid,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_expenses_company_id_id
    UNIQUE (company_id, id),

  -- Unique expense number per company
  CONSTRAINT uq_expenses_company_number
    UNIQUE (company_id, expense_number),

  -- Composite foreign key to projects: project must belong to same company (if specified)
  CONSTRAINT fk_expenses_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key for reversal reference: must belong to same company
  CONSTRAINT fk_expenses_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.expenses (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.expenses IS
  'Business and project expense transactions. Actual cost records, optionally linked to projects. Company-scoped.';

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. EXPENSE NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_expense_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.expense_number IS NULL OR trim(NEW.expense_number) = '' THEN
    SELECT COALESCE(
      MAX(
        CASE 
          WHEN expense_number ~ '^EXP-[0-9]+$' 
          THEN substring(expense_number from 5)::bigint 
          ELSE 0 
        END
      ), 0) + 1 INTO v_next_num
    FROM public.expenses
    WHERE company_id = NEW.company_id;

    NEW.expense_number := 'EXP-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_expense_number() IS
  'Generates company-scoped sequential expense numbers (e.g. EXP-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_expense_number
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_number();

-- =====================
-- 3. EXPENSE VALIDATION & INTEGRITY TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.validate_expense_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target record;
BEGIN
  -- 1. Ensure amount is strictly positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Expense amount must be strictly positive';
  END IF;

  -- 2. Ensure description is non-empty
  IF trim(NEW.description) = '' THEN
    RAISE EXCEPTION 'Validation error: Expense description cannot be blank';
  END IF;

  -- 3. Validate project belongs to same company if specified
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.project_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Project % does not belong to company %',
        NEW.project_id, NEW.company_id;
    END IF;
  END IF;

  -- 4. Validate reversal reference if specified
  IF NEW.reversal_of_id IS NOT NULL THEN
    -- Cannot self-reference
    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: An expense cannot reverse itself';
    END IF;

    -- Fetch reversal target within same company
    SELECT id, company_id, status, reversal_of_id, amount, project_id
    INTO v_target
    FROM public.expenses
    WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal target expense % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;

    -- Target must be Confirmed
    IF v_target.status != 'Confirmed' THEN
      RAISE EXCEPTION 'Financial integrity violation: Can only reverse a Confirmed expense (target status is %)',
        v_target.status;
    END IF;

    -- Target cannot be a reversal itself
    IF v_target.reversal_of_id IS NOT NULL THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot reverse an expense that is already a reversal transaction';
    END IF;

    -- Prevent duplicate reversals of the same target expense
    IF EXISTS (
      SELECT 1 FROM public.expenses
      WHERE reversal_of_id = NEW.reversal_of_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status != 'Cancelled'
    ) THEN
      RAISE EXCEPTION 'Financial integrity violation: Target expense % has already been reversed',
        NEW.reversal_of_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_expense_integrity() IS
  'Trigger function ensuring expenses maintain positive amounts, non-empty description, company/project alignment, and reversal invariants.';

CREATE TRIGGER trg_validate_expense_integrity
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expense_integrity();

-- =====================
-- 4. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- 4a. Prevent physical deletion of completed expenses
CREATE OR REPLACE FUNCTION public.prevent_completed_expense_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % expense %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.expense_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_expense_deletion() IS
  'Enforces Rule 18: completed expenses (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_expense_deletion
  BEFORE DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_expense_deletion();

-- 4b. Prevent modification of financial values on Confirmed and Cancelled expenses
CREATE OR REPLACE FUNCTION public.prevent_completed_expense_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cancelled expenses cannot be modified at all
  IF OLD.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cancelled expense % cannot be modified',
      OLD.expense_number;
  END IF;

  -- Confirmed expenses allow transition to Cancelled only, and financial fields are locked
  IF OLD.status = 'Confirmed' THEN
    IF NEW.status NOT IN ('Confirmed', 'Cancelled') THEN
      RAISE EXCEPTION 'Financial integrity violation: Confirmed expense % can only be transitioned to Cancelled',
        OLD.expense_number;
    END IF;

    IF NEW.company_id != OLD.company_id OR
       COALESCE(NEW.project_id, '00000000-0000-0000-0000-000000000000'::uuid) !=
       COALESCE(OLD.project_id, '00000000-0000-0000-0000-000000000000'::uuid) OR
       NEW.expense_date != OLD.expense_date OR
       NEW.category != OLD.category OR
       NEW.amount != OLD.amount OR
       NEW.description != OLD.description OR
       COALESCE(NEW.payment_method, '') != COALESCE(OLD.payment_method, '') OR
       COALESCE(NEW.reference_number, '') != COALESCE(OLD.reference_number, '') OR
       COALESCE(NEW.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) !=
       COALESCE(OLD.reversal_of_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify financial fields of Confirmed expense %. Recorded financial transactions are immutable (use status cancellation or reversal)',
        OLD.expense_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_expense_modification() IS
  'Enforces immutability: financial fields of Confirmed/Cancelled expenses cannot be modified.';

CREATE TRIGGER trg_prevent_completed_expense_modification
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_expense_modification();

-- =====================
-- 5. DERIVED EXPENSE SUMMARY VIEWS
-- =====================

-- 5a. Company-level expense summary
CREATE OR REPLACE VIEW public.v_expense_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  COUNT(e.id) AS total_expense_count,
  COUNT(e.id) FILTER (WHERE e.status = 'Confirmed') AS confirmed_expense_count,
  COUNT(e.id) FILTER (WHERE e.status = 'Draft') AS draft_expense_count,
  COUNT(e.id) FILTER (WHERE e.status = 'Cancelled') AS cancelled_expense_count,
  COUNT(e.id) FILTER (
    WHERE e.status = 'Confirmed'
      AND (e.reversal_of_id IS NOT NULL OR e.id IN (
        SELECT r.reversal_of_id FROM public.expenses r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      ))
  ) AS reversed_expense_count,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'Confirmed'), 0.00) AS total_confirmed_expenses,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'Cancelled'), 0.00) AS total_cancelled_expenses,
  COALESCE(SUM(e.amount) FILTER (
    WHERE e.status = 'Confirmed'
      AND (e.reversal_of_id IS NOT NULL OR e.id IN (
        SELECT r.reversal_of_id FROM public.expenses r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      ))
  ), 0.00) AS total_reversed_expenses,
  COALESCE(SUM(e.amount) FILTER (
    WHERE e.status = 'Confirmed'
      AND e.reversal_of_id IS NULL
      AND e.id NOT IN (
        SELECT r.reversal_of_id FROM public.expenses r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      )
  ), 0.00) AS active_expense_total
FROM public.companies c
LEFT JOIN public.expenses e ON e.company_id = c.id
GROUP BY c.id, c.name;

COMMENT ON VIEW public.v_expense_summary IS
  'Aggregated company-level expense summary including active, confirmed, cancelled, and reversed totals. Company-scoped.';

-- 5b. Project-level expense summary
CREATE OR REPLACE VIEW public.v_project_expense_summary AS
SELECT
  p.company_id,
  p.id AS project_id,
  p.project_code,
  p.name AS project_name,
  p.status AS project_status,
  COUNT(e.id) FILTER (WHERE e.status = 'Confirmed') AS confirmed_expense_count,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'Confirmed'), 0.00) AS total_confirmed_expenses,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'Cancelled'), 0.00) AS total_cancelled_expenses,
  COALESCE(SUM(e.amount) FILTER (
    WHERE e.status = 'Confirmed'
      AND e.reversal_of_id IS NULL
      AND e.id NOT IN (
        SELECT r.reversal_of_id FROM public.expenses r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      )
  ), 0.00) AS active_expense_total,
  COALESCE(SUM(e.amount) FILTER (
    WHERE e.status = 'Confirmed'
      AND e.reversal_of_id IS NULL
      AND e.id NOT IN (
        SELECT r.reversal_of_id FROM public.expenses r
        WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
      )
  ), 0.00) AS total_expenses
FROM public.projects p
LEFT JOIN public.expenses e ON e.project_id = p.id AND e.company_id = p.company_id
GROUP BY p.company_id, p.id, p.project_code, p.name, p.status;

COMMENT ON VIEW public.v_project_expense_summary IS
  'Project-level expense summary deriving total active and confirmed expenses per project. Company-scoped.';

-- 5c. Recorded Project Cost (Purchases + Employee Wages + Expenses)
CREATE OR REPLACE VIEW public.v_project_recorded_cost AS
WITH project_purchases AS (
  SELECT
    pur.project_id,
    COALESCE(SUM(pur.total_amount), 0.00) AS total_purchases
  FROM public.purchases pur
  WHERE pur.status = 'Confirmed'
    AND pur.project_id IS NOT NULL
    AND pur.reversal_of_id IS NULL
    AND pur.id NOT IN (
      SELECT r.reversal_of_id FROM public.purchases r
      WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
    )
  GROUP BY pur.project_id
),
project_wages AS (
  SELECT
    dw.project_id,
    COALESCE(SUM(dw.amount), 0.00) AS total_wages
  FROM public.daily_wages dw
  WHERE dw.status = 'Confirmed'
    AND dw.project_id IS NOT NULL
    AND dw.reversal_of_id IS NULL
    AND dw.id NOT IN (
      SELECT r.reversal_of_id FROM public.daily_wages r
      WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
    )
  GROUP BY dw.project_id
),
project_expenses AS (
  SELECT
    exp.project_id,
    COALESCE(SUM(exp.amount), 0.00) AS total_expenses
  FROM public.expenses exp
  WHERE exp.status = 'Confirmed'
    AND exp.project_id IS NOT NULL
    AND exp.reversal_of_id IS NULL
    AND exp.id NOT IN (
      SELECT r.reversal_of_id FROM public.expenses r
      WHERE r.reversal_of_id IS NOT NULL AND r.status = 'Confirmed'
    )
  GROUP BY exp.project_id
)
SELECT
  p.company_id,
  p.id AS project_id,
  p.project_code,
  p.name AS project_name,
  p.status AS project_status,
  COALESCE(pp.total_purchases, 0.00) AS total_purchases,
  COALESCE(pw.total_wages, 0.00) AS total_wages,
  COALESCE(pe.total_expenses, 0.00) AS total_expenses,
  (COALESCE(pp.total_purchases, 0.00) + COALESCE(pw.total_wages, 0.00) + COALESCE(pe.total_expenses, 0.00)) AS recorded_project_cost
FROM public.projects p
LEFT JOIN project_purchases pp ON pp.project_id = p.id
LEFT JOIN project_wages pw ON pw.project_id = p.id
LEFT JOIN project_expenses pe ON pe.project_id = p.id;

COMMENT ON VIEW public.v_project_recorded_cost IS
  'Recorded Project Cost view = Purchases + Employee Wages + Expenses. This is recorded cost, NOT profit.';

-- =====================
-- 6. ATOMIC RPC FUNCTIONS
-- =====================

-- 6a. record_expense: Atomically records a business or project expense
CREATE OR REPLACE FUNCTION public.record_expense(
  p_category         text,
  p_description      text,
  p_amount           numeric,
  p_project_id       uuid DEFAULT NULL,
  p_expense_date     date DEFAULT CURRENT_DATE,
  p_paid_by          text DEFAULT NULL,
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
  v_expense_id     uuid;
  v_expense_number text;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Financial validation error: Expense amount must be strictly positive';
  END IF;

  IF p_description IS NULL OR trim(p_description) = '' THEN
    RAISE EXCEPTION 'Validation error: Expense description cannot be blank';
  END IF;

  IF p_status NOT IN ('Draft', 'Confirmed') THEN
    RAISE EXCEPTION 'Invalid expense status: %. Supported: Draft, Confirmed', p_status;
  END IF;

  INSERT INTO public.expenses (
    company_id,
    project_id,
    expense_date,
    category,
    description,
    amount,
    paid_by,
    payment_method,
    reference_number,
    status,
    reversal_of_id,
    notes
  ) VALUES (
    v_company_id,
    p_project_id,
    COALESCE(p_expense_date, CURRENT_DATE),
    p_category,
    p_description,
    p_amount,
    p_paid_by,
    p_payment_method,
    p_reference_number,
    p_status,
    p_reversal_of_id,
    p_notes
  ) RETURNING id, expense_number INTO v_expense_id, v_expense_number;

  RETURN jsonb_build_object(
    'expense_id', v_expense_id,
    'expense_number', v_expense_number,
    'category', p_category,
    'amount', p_amount,
    'status', p_status,
    'project_id', p_project_id
  );
END;
$$;

COMMENT ON FUNCTION public.record_expense(text, text, numeric, uuid, date, text, text, text, text, text, uuid) IS
  'Server-side atomic RPC to record a business or project expense and generate sequential numbering.';

-- 6b. cancel_expense: Cancels an expense in compliance with Rule 18 non-deletion
CREATE OR REPLACE FUNCTION public.cancel_expense(
  p_expense_id uuid,
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
  FROM public.expenses
  WHERE id = p_expense_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense % not found', p_expense_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Expense % is already cancelled', p_expense_id;
  END IF;

  UPDATE public.expenses
  SET
    status = 'Cancelled',
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Cancellation: ' || p_notes
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_expense_id AND company_id = v_company_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.cancel_expense(uuid, text) IS
  'Cancels an expense in compliance with Rule 18 non-deletion.';

-- 6c. reverse_expense: Atomically reverses an expense by creating an offsetting reversal entry
CREATE OR REPLACE FUNCTION public.reverse_expense(
  p_expense_id uuid,
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
  FROM public.expenses
  WHERE id = p_expense_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense % not found', p_expense_id;
  END IF;

  IF v_orig.status != 'Confirmed' THEN
    RAISE EXCEPTION 'Financial integrity violation: Can only reverse a Confirmed expense (status is %)', v_orig.status;
  END IF;

  IF v_orig.reversal_of_id IS NOT NULL THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot reverse an expense that is already a reversal transaction';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.expenses
    WHERE reversal_of_id = p_expense_id AND status != 'Cancelled'
  ) THEN
    RAISE EXCEPTION 'Financial integrity violation: Target expense % has already been reversed', p_expense_id;
  END IF;

  INSERT INTO public.expenses (
    company_id,
    project_id,
    expense_date,
    category,
    description,
    amount,
    paid_by,
    payment_method,
    reference_number,
    status,
    reversal_of_id,
    notes
  ) VALUES (
    v_company_id,
    v_orig.project_id,
    CURRENT_DATE,
    v_orig.category,
    'Reversal of ' || v_orig.expense_number || ': ' || COALESCE(p_notes, v_orig.description),
    v_orig.amount,
    v_orig.paid_by,
    v_orig.payment_method,
    v_orig.reference_number,
    'Confirmed',
    v_orig.id,
    COALESCE(p_notes, 'Reversal entry')
  ) RETURNING id, expense_number INTO v_rev_id, v_rev_number;

  RETURN jsonb_build_object(
    'reversal_expense_id', v_rev_id,
    'reversal_expense_number', v_rev_number,
    'original_expense_id', v_orig.id,
    'amount', v_orig.amount,
    'status', 'Confirmed'
  );
END;
$$;

COMMENT ON FUNCTION public.reverse_expense(uuid, text) IS
  'Atomically creates an offsetting reversal expense for a confirmed expense.';

-- =====================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company expenses"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company expenses"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete draft company expenses"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
    AND status = 'Draft'
  );

-- =====================
-- 8. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_expense_changes()
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
      v_action := 'reverse_expense';
    ELSE
      v_action := 'create_expense';
    END IF;

    v_details := jsonb_build_object(
      'expense_number', NEW.expense_number,
      'project_id', NEW.project_id,
      'expense_date', NEW.expense_date,
      'category', NEW.category,
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
      'expenses',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_expense';
    ELSE
      v_action := 'update_expense';
    END IF;

    v_details := jsonb_build_object(
      'expense_number', NEW.expense_number,
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
      'expenses',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_expense';
    v_details := jsonb_build_object(
      'expense_number', OLD.expense_number,
      'status', OLD.status,
      'amount', OLD.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id,
      auth.uid(),
      v_action,
      'expenses',
      OLD.id,
      v_details
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.audit_expense_changes() IS
  'Trigger function recording audit log entries for expense creation, update, cancellation, reversal, and draft deletion.';

CREATE TRIGGER trg_audit_expense_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_expense_changes();

-- =====================
-- 9. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_expenses_company_id ON public.expenses(company_id);
CREATE INDEX idx_expenses_company_project ON public.expenses(company_id, project_id);
CREATE INDEX idx_expenses_company_date ON public.expenses(company_id, expense_date);
CREATE INDEX idx_expenses_company_category ON public.expenses(company_id, category);
CREATE INDEX idx_expenses_company_status ON public.expenses(company_id, status);
CREATE INDEX idx_expenses_reversal ON public.expenses(company_id, reversal_of_id) WHERE reversal_of_id IS NOT NULL;
CREATE INDEX idx_expenses_active ON public.expenses(company_id, status) WHERE status = 'Confirmed';
