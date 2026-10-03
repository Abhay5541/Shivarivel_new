-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 10: Attendance & Daily Wages Backend Migration
-- =============================================================================
-- This migration establishes attendance and daily earned wages:
--   - public.attendance table (daily worker attendance tracking)
--   - public.daily_wages table (financial wage transactions generated from attendance)
--   - company-scoped sequential wage numbering (e.g. WG-0001)
--   - composite unique keys and composite foreign keys enforcing company-scoped integrity
--   - one-attendance-per-day rule: UNIQUE(company_id, employee_id, attendance_date)
--   - exact supported attendance statuses: 'Present', 'Half Day', 'Absent'
--   - payable unit mapping: Present = 1.00, Half Day = 0.50, Absent = 0.00
--   - historical wage snapshot: rate captured at transaction time, immune to master rate changes
--   - inactive employee protection: inactive employees cannot receive new attendance/wages
--   - financial correction & immutability triggers (Rule 18: no deletion of completed wages)
--   - attendance-wage alignment lock: attendance cannot be altered if Confirmed wage exists
--   - derived financial view: v_employee_wage_payable (aggregates earned wages & payable units)
--   - atomic RPC functions: record_attendance and generate_employee_wages
--   - company-scoped RLS policies with owner-only draft deletion
--   - audit logging triggers recording attendance and wage events in audit_log
--   - targeted performance indexes
--
-- FINANCIAL INVARIANTS:
-- 1. Attendance records represent WORK PERFORMED.
-- 2. Daily wages represent WAGES EARNED from attendance.
-- 3. Employee advances and payments are completely separate (not in this phase).
-- 4. Confirmed and Cancelled wages are immutable and cannot be physically deleted.
-- 5. Future updates to employee master daily wage do NOT alter historical earned wages.
-- 6. All financial calculations use exact NUMERIC arithmetic.
-- =============================================================================

-- =====================
-- 1. ATTENDANCE TABLE
-- =====================

CREATE TABLE public.attendance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL DEFAULT public.current_company_id()
                      REFERENCES public.companies(id) ON DELETE RESTRICT,
  employee_id         uuid NOT NULL,
  project_id          uuid,
  attendance_date     date NOT NULL DEFAULT CURRENT_DATE,
  status              text NOT NULL
                      CHECK (status IN ('Present', 'Half Day', 'Absent')),
  daily_wage_snapshot numeric(14,2)
                      CHECK (daily_wage_snapshot IS NULL OR daily_wage_snapshot >= 0),
  overtime_hours      numeric(5,2) NOT NULL DEFAULT 0.00
                      CHECK (overtime_hours >= 0),
  overtime_amount     numeric(14,2) NOT NULL DEFAULT 0.00
                      CHECK (overtime_amount >= 0),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_attendance_company_id_id
    UNIQUE (company_id, id),

  -- Rule: One employee should not have duplicate attendance for the same date within the company
  CONSTRAINT uq_attendance_company_employee_date
    UNIQUE (company_id, employee_id, attendance_date),

  -- Composite foreign key to employees: employee must belong to same company
  CONSTRAINT fk_attendance_employee_company
    FOREIGN KEY (company_id, employee_id)
    REFERENCES public.employees (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to projects: project must belong to same company (optional)
  CONSTRAINT fk_attendance_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.attendance IS
  'Workforce daily attendance records. Operational data representing work performed. Company-scoped.';

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. DAILY WAGES TABLE
-- =====================

CREATE TABLE public.daily_wages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL DEFAULT public.current_company_id()
                      REFERENCES public.companies(id) ON DELETE RESTRICT,
  employee_id         uuid NOT NULL,
  attendance_id       uuid NOT NULL,
  project_id          uuid,
  wage_number         text NOT NULL,
  wage_date           date NOT NULL,
  payable_units       numeric(3,2) NOT NULL
                      CHECK (payable_units >= 0 AND payable_units <= 1),
  rate                numeric(14,2) NOT NULL
                      CHECK (rate >= 0),
  base_wage           numeric(14,2) NOT NULL
                      CHECK (base_wage >= 0),
  overtime_hours      numeric(5,2) NOT NULL DEFAULT 0.00
                      CHECK (overtime_hours >= 0),
  overtime_amount     numeric(14,2) NOT NULL DEFAULT 0.00
                      CHECK (overtime_amount >= 0),
  amount              numeric(14,2) NOT NULL
                      CHECK (amount >= 0),
  status              text NOT NULL DEFAULT 'Confirmed'
                      CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  reversal_of_id      uuid,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_daily_wages_company_id_id
    UNIQUE (company_id, id),

  -- Unique wage number per company
  CONSTRAINT uq_daily_wages_company_number
    UNIQUE (company_id, wage_number),

  -- Composite foreign key to employees: employee must belong to same company
  CONSTRAINT fk_daily_wages_employee_company
    FOREIGN KEY (company_id, employee_id)
    REFERENCES public.employees (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to attendance: attendance must belong to same company
  CONSTRAINT fk_daily_wages_attendance_company
    FOREIGN KEY (company_id, attendance_id)
    REFERENCES public.attendance (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to projects: project must belong to same company (optional)
  CONSTRAINT fk_daily_wages_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key for reversal reference: must belong to same company
  CONSTRAINT fk_daily_wages_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.daily_wages (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.daily_wages IS
  'Earned daily wage transactions derived from attendance. Financial records. Company-scoped.';

CREATE TRIGGER daily_wages_updated_at
  BEFORE UPDATE ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enforce at most one active (Draft or Confirmed) wage per attendance
CREATE UNIQUE INDEX uq_daily_wages_active_attendance
  ON public.daily_wages (company_id, attendance_id)
  WHERE (status != 'Cancelled');

-- =====================
-- 3. WAGE NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_daily_wage_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.wage_number IS NULL OR trim(NEW.wage_number) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.daily_wages
    WHERE company_id = NEW.company_id;

    NEW.wage_number := 'WG-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_daily_wage_number() IS
  'Generates company-scoped sequential daily wage transaction numbers (e.g. WG-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_daily_wage_number
  BEFORE INSERT ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_daily_wage_number();

-- =====================
-- 4. VALIDATION & INTEGRITY TRIGGERS
-- =====================

-- 4a. Attendance Validation & Snapshot Trigger
CREATE OR REPLACE FUNCTION public.validate_attendance_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp record;
BEGIN
  -- 1. Fetch employee to check company alignment, status, and master daily wage
  SELECT id, company_id, status, daily_wage
  INTO v_emp
  FROM public.employees
  WHERE id = NEW.employee_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Employee % does not belong to company %',
      NEW.employee_id, NEW.company_id;
  END IF;

  -- 2. Inactive employees cannot receive new attendance
  IF TG_OP = 'INSERT' AND v_emp.status NOT IN ('active', 'Active') THEN
    RAISE EXCEPTION 'Employee status violation: Cannot record attendance for inactive employee %',
      NEW.employee_id;
  END IF;

  -- 3. Project alignment check if project_id is provided
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.project_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Project % does not belong to company %',
        NEW.project_id, NEW.company_id;
    END IF;
  END IF;

  -- 4. Snapshot employee daily wage if not explicitly supplied
  IF NEW.daily_wage_snapshot IS NULL THEN
    NEW.daily_wage_snapshot := COALESCE(v_emp.daily_wage, 0.00);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_attendance_integrity() IS
  'Trigger function ensuring attendance maintains company, employee status, and project alignment.';

CREATE TRIGGER trg_validate_attendance_integrity
  BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attendance_integrity();

-- 4b. Daily Wage Calculation & Synchronization Trigger
CREATE OR REPLACE FUNCTION public.sync_daily_wage_calculation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate base wage = payable_units * rate (rounded to 2 decimal places)
  NEW.base_wage := round(NEW.payable_units * NEW.rate, 2);

  -- Calculate total amount = base_wage + overtime_amount
  NEW.amount := round(NEW.base_wage + COALESCE(NEW.overtime_amount, 0.00), 2);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_daily_wage_calculation() IS
  'Computes base_wage and total wage amount using exact numeric arithmetic.';

CREATE TRIGGER trg_sync_daily_wage_calculation
  BEFORE INSERT OR UPDATE ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_daily_wage_calculation();

-- 4c. Daily Wage Invariant Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_daily_wage_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_att record;
  v_emp record;
BEGIN
  -- 1. Fetch employee to check company alignment
  SELECT id, company_id, status
  INTO v_emp
  FROM public.employees
  WHERE id = NEW.employee_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Employee % does not belong to company %',
      NEW.employee_id, NEW.company_id;
  END IF;

  -- 2. On INSERT, verify employee is active
  IF TG_OP = 'INSERT' AND v_emp.status NOT IN ('active', 'Active') THEN
    RAISE EXCEPTION 'Employee status violation: Cannot generate wage for inactive employee %',
      NEW.employee_id;
  END IF;

  -- 3. Fetch attendance record and verify alignment
  SELECT id, company_id, employee_id, project_id, attendance_date, status
  INTO v_att
  FROM public.attendance
  WHERE id = NEW.attendance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance record % not found', NEW.attendance_id;
  END IF;

  IF v_att.company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Attendance % does not belong to company %',
      NEW.attendance_id, NEW.company_id;
  END IF;

  IF v_att.employee_id != NEW.employee_id THEN
    RAISE EXCEPTION 'Integrity violation: Wage employee % does not match attendance employee %',
      NEW.employee_id, v_att.employee_id;
  END IF;

  -- Match wage_date to attendance_date if not explicitly matched
  IF NEW.wage_date IS NULL THEN
    NEW.wage_date := v_att.attendance_date;
  END IF;

  -- Inherit project from attendance if wage project is not explicitly specified
  IF NEW.project_id IS NULL AND v_att.project_id IS NOT NULL THEN
    NEW.project_id := v_att.project_id;
  END IF;

  -- Verify project alignment if present
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.project_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Project % does not belong to company %',
        NEW.project_id, NEW.company_id;
    END IF;
  END IF;

  -- 4. Verify reversal reference if provided
  IF NEW.reversal_of_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_wages
      WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal wage % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;

    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: A wage transaction cannot reverse itself';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_daily_wage_integrity() IS
  'Trigger function ensuring daily wages maintain cross-company, employee-attendance, and project alignment.';

CREATE TRIGGER trg_validate_daily_wage_integrity
  BEFORE INSERT OR UPDATE ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_daily_wage_integrity();

-- =====================
-- 5. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- 5a. Prevent physical deletion of completed daily wages
CREATE OR REPLACE FUNCTION public.prevent_completed_daily_wage_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % wage transaction %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.wage_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_daily_wage_deletion() IS
  'Enforces Rule 18: completed daily wages (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_daily_wage_deletion
  BEFORE DELETE ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_daily_wage_deletion();

-- 5b. Prevent modification of financial amounts on completed wages
CREATE OR REPLACE FUNCTION public.prevent_completed_daily_wage_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If previously Cancelled, no further updates are allowed
  IF OLD.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cancelled wage transaction % cannot be modified',
      OLD.wage_number;
  END IF;

  -- If previously Confirmed:
  IF OLD.status = 'Confirmed' THEN
    -- Status can only transition to 'Cancelled'
    IF NEW.status NOT IN ('Confirmed', 'Cancelled') THEN
      RAISE EXCEPTION 'Financial integrity violation: Confirmed wage transaction % can only be transitioned to Cancelled',
        OLD.wage_number;
    END IF;

    -- Financial and key relational fields are completely immutable
    IF NEW.company_id != OLD.company_id OR
       NEW.employee_id != OLD.employee_id OR
       NEW.attendance_id != OLD.attendance_id OR
       NEW.rate != OLD.rate OR
       NEW.payable_units != OLD.payable_units OR
       NEW.base_wage != OLD.base_wage OR
       NEW.overtime_amount != OLD.overtime_amount OR
       NEW.amount != OLD.amount OR
       NEW.wage_date != OLD.wage_date THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify financial values of Confirmed wage transaction %. Recorded financial amounts are immutable (use status cancellation or reversal)',
        OLD.wage_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_daily_wage_modification() IS
  'Enforces immutability: financial values of Confirmed/Cancelled wages cannot be modified.';

CREATE TRIGGER trg_prevent_completed_daily_wage_modification
  BEFORE UPDATE ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_daily_wage_modification();

-- 5c. Prevent attendance modification/deletion when a Confirmed wage exists
CREATE OR REPLACE FUNCTION public.prevent_attendance_modification_with_confirmed_wage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (
      SELECT 1 FROM public.daily_wages
      WHERE attendance_id = OLD.id AND status != 'Draft'
    ) THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot delete attendance record with completed daily wages. Completed financial records are immutable.';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If core operational fields (employee, date, status) are changing, verify no Confirmed wage exists
    IF (NEW.employee_id != OLD.employee_id OR
        NEW.attendance_date != OLD.attendance_date OR
        NEW.status != OLD.status) THEN
      IF EXISTS (
        SELECT 1 FROM public.daily_wages
        WHERE attendance_id = OLD.id AND status = 'Confirmed'
      ) THEN
        RAISE EXCEPTION 'Financial integrity violation: Cannot change status/employee/date of attendance with Confirmed daily wage. Cancel the wage transaction first.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_attendance_modification_with_confirmed_wage() IS
  'Guarantees consistency: operational attendance cannot contradict completed financial wages.';

CREATE TRIGGER trg_prevent_attendance_modification_with_confirmed_wage
  BEFORE UPDATE OR DELETE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_attendance_modification_with_confirmed_wage();

-- =====================
-- 6. DERIVED FINANCIAL VIEW
-- =====================

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
  -- In Phase 10 (no employee payments yet), earned wages = wage payable
  COALESCE(SUM(dw.amount) FILTER (WHERE dw.status = 'Confirmed'), 0)::numeric(14,2) AS wage_payable
FROM public.employees e
LEFT JOIN public.attendance a
  ON a.company_id = e.company_id AND a.employee_id = e.id
LEFT JOIN public.daily_wages dw
  ON dw.company_id = e.company_id AND dw.attendance_id = a.id AND dw.status = 'Confirmed'
GROUP BY
  e.company_id,
  e.id,
  e.employee_code,
  e.name,
  e.worker_type,
  e.daily_wage,
  e.status;

COMMENT ON VIEW public.v_employee_wage_payable IS
  'Financial summary view of earned daily wages and payable balances per employee. Company-scoped.';

-- =====================
-- 7. ATOMIC RPC FUNCTIONS
-- =====================

-- 7a. record_attendance: Records attendance and optionally generates daily wage atomically
CREATE OR REPLACE FUNCTION public.record_attendance(
  p_employee_id        uuid,
  p_status             text,
  p_attendance_date    date DEFAULT CURRENT_DATE,
  p_project_id         uuid DEFAULT NULL,
  p_overtime_hours     numeric DEFAULT 0.00,
  p_overtime_amount    numeric DEFAULT 0.00,
  p_daily_wage_rate    numeric DEFAULT NULL,
  p_notes              text DEFAULT NULL,
  p_auto_generate_wage boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_attendance_id  uuid;
  v_wage_id        uuid;
  v_wage_number    text;
  v_rate           numeric(14,2);
  v_units          numeric(3,2);
  v_base_wage      numeric(14,2);
  v_total_wage     numeric(14,2);
  v_emp_daily_wage numeric(14,2);
BEGIN
  v_company_id := public.current_company_id();

  -- Validate status
  IF p_status NOT IN ('Present', 'Half Day', 'Absent') THEN
    RAISE EXCEPTION 'Invalid attendance status: %. Supported: Present, Half Day, Absent', p_status;
  END IF;

  -- Look up employee daily wage
  SELECT daily_wage INTO v_emp_daily_wage
  FROM public.employees
  WHERE id = p_employee_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee % not found in current company', p_employee_id;
  END IF;

  v_rate := COALESCE(p_daily_wage_rate, v_emp_daily_wage, 0.00);

  -- Insert attendance record
  INSERT INTO public.attendance (
    company_id,
    employee_id,
    project_id,
    attendance_date,
    status,
    daily_wage_snapshot,
    overtime_hours,
    overtime_amount,
    notes
  ) VALUES (
    v_company_id,
    p_employee_id,
    p_project_id,
    COALESCE(p_attendance_date, CURRENT_DATE),
    p_status,
    v_rate,
    COALESCE(p_overtime_hours, 0.00),
    COALESCE(p_overtime_amount, 0.00),
    p_notes
  ) RETURNING id INTO v_attendance_id;

  -- Generate wage if requested
  IF p_auto_generate_wage THEN
    -- Map status to payable units
    IF p_status = 'Present' THEN
      v_units := 1.00;
    ELSIF p_status = 'Half Day' THEN
      v_units := 0.50;
    ELSE
      v_units := 0.00;
    END IF;

    v_base_wage := round(v_units * v_rate, 2);
    v_total_wage := round(v_base_wage + COALESCE(p_overtime_amount, 0.00), 2);

    INSERT INTO public.daily_wages (
      company_id,
      employee_id,
      attendance_id,
      project_id,
      wage_date,
      payable_units,
      rate,
      base_wage,
      overtime_hours,
      overtime_amount,
      amount,
      status,
      notes
    ) VALUES (
      v_company_id,
      p_employee_id,
      v_attendance_id,
      p_project_id,
      COALESCE(p_attendance_date, CURRENT_DATE),
      v_units,
      v_rate,
      v_base_wage,
      COALESCE(p_overtime_hours, 0.00),
      COALESCE(p_overtime_amount, 0.00),
      v_total_wage,
      'Confirmed',
      p_notes
    ) RETURNING id, wage_number INTO v_wage_id, v_wage_number;
  END IF;

  RETURN jsonb_build_object(
    'attendance_id', v_attendance_id,
    'wage_id', v_wage_id,
    'wage_number', v_wage_number,
    'status', p_status,
    'payable_units', v_units,
    'rate', v_rate,
    'amount', v_total_wage
  );
END;
$$;

COMMENT ON FUNCTION public.record_attendance(uuid, text, date, uuid, numeric, numeric, numeric, text, boolean) IS
  'Server-side atomic RPC to record employee attendance and automatically generate confirmed daily wage.';

-- 7b. generate_employee_wages: Generates wages for un-waged attendance records in a date range
CREATE OR REPLACE FUNCTION public.generate_employee_wages(
  p_from_date   date,
  p_to_date     date,
  p_employee_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_att            record;
  v_units          numeric(3,2);
  v_rate           numeric(14,2);
  v_base_wage      numeric(14,2);
  v_total_wage     numeric(14,2);
  v_count          integer := 0;
  v_total_amount   numeric(14,2) := 0.00;
BEGIN
  v_company_id := public.current_company_id();

  IF p_from_date > p_to_date THEN
    RAISE EXCEPTION 'Invalid date range: from_date (%) cannot be after to_date (%)',
      p_from_date, p_to_date;
  END IF;

  FOR v_att IN
    SELECT
      a.id AS attendance_id,
      a.employee_id,
      a.project_id,
      a.attendance_date,
      a.status,
      a.daily_wage_snapshot,
      a.overtime_hours,
      a.overtime_amount,
      e.daily_wage AS employee_master_wage
    FROM public.attendance a
    JOIN public.employees e ON e.id = a.employee_id AND e.company_id = a.company_id
    WHERE a.company_id = v_company_id
      AND a.attendance_date BETWEEN p_from_date AND p_to_date
      AND (p_employee_id IS NULL OR a.employee_id = p_employee_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_wages dw
        WHERE dw.company_id = v_company_id
          AND dw.attendance_id = a.id
          AND dw.status != 'Cancelled'
      )
    ORDER BY a.attendance_date, a.created_at
  LOOP
    -- Map units
    IF v_att.status = 'Present' THEN
      v_units := 1.00;
    ELSIF v_att.status = 'Half Day' THEN
      v_units := 0.50;
    ELSE
      v_units := 0.00;
    END IF;

    -- Rate snapshot priority: attendance snapshot > master rate > 0
    v_rate := COALESCE(v_att.daily_wage_snapshot, v_att.employee_master_wage, 0.00);
    v_base_wage := round(v_units * v_rate, 2);
    v_total_wage := round(v_base_wage + COALESCE(v_att.overtime_amount, 0.00), 2);

    INSERT INTO public.daily_wages (
      company_id,
      employee_id,
      attendance_id,
      project_id,
      wage_date,
      payable_units,
      rate,
      base_wage,
      overtime_hours,
      overtime_amount,
      amount,
      status,
      notes
    ) VALUES (
      v_company_id,
      v_att.employee_id,
      v_att.attendance_id,
      v_att.project_id,
      v_att.attendance_date,
      v_units,
      v_rate,
      v_base_wage,
      v_att.overtime_hours,
      v_att.overtime_amount,
      v_total_wage,
      'Confirmed',
      'Batch generated from attendance'
    );

    v_count := v_count + 1;
    v_total_amount := v_total_amount + v_total_wage;
  END LOOP;

  RETURN jsonb_build_object(
    'generated_count', v_count,
    'total_wage_amount', v_total_amount
  );
END;
$$;

COMMENT ON FUNCTION public.generate_employee_wages(date, date, uuid) IS
  'Server-side atomic RPC to generate confirmed daily wages for un-waged attendance records.';

-- 7c. cancel_daily_wage: Cancels a confirmed wage record (Rule 18 financial correction)
CREATE OR REPLACE FUNCTION public.cancel_daily_wage(
  p_wage_id uuid,
  p_notes   text DEFAULT NULL
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
  FROM public.daily_wages
  WHERE id = p_wage_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily wage transaction % not found', p_wage_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Daily wage transaction % is already cancelled', p_wage_id;
  END IF;

  UPDATE public.daily_wages
  SET
    status = 'Cancelled',
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Cancellation: ' || p_notes
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_wage_id AND company_id = v_company_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.cancel_daily_wage(uuid, text) IS
  'Cancels a daily wage transaction in compliance with Rule 18 non-deletion.';

-- =====================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wages ENABLE ROW LEVEL SECURITY;

-- 8a. Attendance RLS Policies
CREATE POLICY "Users can view company attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company attendance"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 8b. Daily Wages RLS Policies
CREATE POLICY "Users can view company daily wages"
  ON public.daily_wages
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company daily wages"
  ON public.daily_wages
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company daily wages"
  ON public.daily_wages
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company daily wages"
  ON public.daily_wages
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 9. AUDIT LOGGING TRIGGERS
-- =====================

-- 9a. Attendance Changes Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_attendance_changes()
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
    v_action := 'create_attendance';
    v_details := jsonb_build_object(
      'employee_id', NEW.employee_id,
      'attendance_date', NEW.attendance_date,
      'status', NEW.status,
      'project_id', NEW.project_id,
      'daily_wage_snapshot', NEW.daily_wage_snapshot,
      'overtime_hours', NEW.overtime_hours,
      'overtime_amount', NEW.overtime_amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.company_id,
      auth.uid(),
      v_action,
      'attendance',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_attendance';
    v_details := jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_overtime_amount', OLD.overtime_amount,
      'new_overtime_amount', NEW.overtime_amount,
      'old_project_id', OLD.project_id,
      'new_project_id', NEW.project_id
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.company_id,
      auth.uid(),
      v_action,
      'attendance',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_attendance';
    v_details := jsonb_build_object(
      'employee_id', OLD.employee_id,
      'attendance_date', OLD.attendance_date,
      'status', OLD.status
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id,
      auth.uid(),
      v_action,
      'attendance',
      OLD.id,
      v_details
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.audit_attendance_changes() IS
  'Audit trigger function logging attendance operational events into public.audit_log.';

CREATE TRIGGER trg_audit_attendance_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_attendance_changes();

-- 9b. Daily Wage Changes Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_daily_wage_changes()
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
    v_action := 'create_daily_wage';
    v_details := jsonb_build_object(
      'wage_number', NEW.wage_number,
      'employee_id', NEW.employee_id,
      'attendance_id', NEW.attendance_id,
      'project_id', NEW.project_id,
      'wage_date', NEW.wage_date,
      'payable_units', NEW.payable_units,
      'rate', NEW.rate,
      'base_wage', NEW.base_wage,
      'overtime_amount', NEW.overtime_amount,
      'amount', NEW.amount,
      'status', NEW.status
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.company_id,
      auth.uid(),
      v_action,
      'daily_wages',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_daily_wage';
    ELSE
      v_action := 'update_daily_wage';
    END IF;

    v_details := jsonb_build_object(
      'wage_number', NEW.wage_number,
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
      'daily_wages',
      NEW.id,
      v_details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_daily_wage';
    v_details := jsonb_build_object(
      'wage_number', OLD.wage_number,
      'status', OLD.status,
      'amount', OLD.amount
    );
    INSERT INTO public.audit_log (
      company_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      OLD.company_id,
      auth.uid(),
      v_action,
      'daily_wages',
      OLD.id,
      v_details
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.audit_daily_wage_changes() IS
  'Audit trigger function logging daily wage financial events into public.audit_log.';

CREATE TRIGGER trg_audit_daily_wage_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_wages
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_daily_wage_changes();

-- =====================
-- 10. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_attendance_company_employee_date
  ON public.attendance (company_id, employee_id, attendance_date);

CREATE INDEX idx_attendance_company_date
  ON public.attendance (company_id, attendance_date);

CREATE INDEX idx_attendance_company_project
  ON public.attendance (company_id, project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX idx_attendance_status
  ON public.attendance (company_id, status);

CREATE INDEX idx_daily_wages_company_employee
  ON public.daily_wages (company_id, employee_id);

CREATE INDEX idx_daily_wages_company_attendance
  ON public.daily_wages (company_id, attendance_id);

CREATE INDEX idx_daily_wages_company_date
  ON public.daily_wages (company_id, wage_date);

CREATE INDEX idx_daily_wages_company_project
  ON public.daily_wages (company_id, project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX idx_daily_wages_status
  ON public.daily_wages (company_id, status);
