-- =============================================================================
-- Migration 0020: Dashboard & Weekly Reports Module
-- Phase 19: Dashboard / Weekly Reports Backend Migration
-- =============================================================================
-- This migration establishes the backend read models, reporting views, and RPCs
-- for the Owner Dashboard and Weekly Reports:
--   - public.weekly_reports table (storing historical report snapshots per Product Spec Sec 29)
--   - Reporting Views (consuming existing source-of-truth views without duplicating logic):
--       * public.v_dashboard_financial_summary (customer receivables, supplier payables,
--         wage payables, advance balance, expenses, recorded project cost)
--       * public.v_dashboard_project_summary (active, upcoming, on hold, progress)
--       * public.v_dashboard_workforce_summary (workers today, attendance, today wages)
--       * public.v_dashboard_actions_summary (pending tasks, follow-ups, visits, enquiries)
--   - Atomic Reporting RPC Functions:
--       * public.get_dashboard() (unified multi-section dashboard JSON response)
--       * public.get_weekly_report(p_start_date, p_end_date)
--       * public.generate_weekly_report(p_start_date, p_end_date, p_store_snapshot)
--   - Multi-tenant company isolation enforced across all views and RPCs
--   - Strict financial separation: pure read/reporting models, zero ledger mutation
-- =============================================================================

-- =====================
-- 1. WEEKLY REPORTS SNAPSHOT TABLE
-- =====================

CREATE TABLE public.weekly_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  title           text NOT NULL CHECK (char_length(trim(title)) > 0),
  summary         jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by    uuid
                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_weekly_reports_company_id_id
    UNIQUE (company_id, id),

  -- Prevent duplicate report snapshots for same company and date range
  CONSTRAINT uq_weekly_reports_company_dates
    UNIQUE (company_id, start_date, end_date),

  -- Composite foreign key to profiles
  CONSTRAINT fk_weekly_reports_generated_by_company
    FOREIGN KEY (company_id, generated_by)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL,

  -- Date ordering check
  CONSTRAINT chk_weekly_reports_date_range
    CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.weekly_reports IS
  'Historical snapshots of generated weekly business and project reports. Product Spec Sec 29.';

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company weekly reports"
  ON public.weekly_reports
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company weekly reports"
  ON public.weekly_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company weekly reports"
  ON public.weekly_reports
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company weekly reports"
  ON public.weekly_reports
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- Audit trigger for weekly reports
CREATE OR REPLACE FUNCTION public.audit_weekly_reports_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'create_weekly_report',
      'weekly_reports',
      NEW.id,
      jsonb_build_object('start_date', NEW.start_date, 'end_date', NEW.end_date, 'title', NEW.title)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      OLD.company_id,
      auth.uid(),
      'delete_weekly_report',
      'weekly_reports',
      OLD.id,
      jsonb_build_object('start_date', OLD.start_date, 'end_date', OLD.end_date, 'title', OLD.title)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_weekly_reports_changes
  AFTER INSERT OR DELETE ON public.weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_weekly_reports_changes();

-- Index on company and date range
CREATE INDEX idx_weekly_reports_company_dates ON public.weekly_reports(company_id, start_date, end_date);

-- =====================
-- 2. DASHBOARD REPORTING VIEWS
-- =====================

-- 2a. Financial Summary View
CREATE OR REPLACE VIEW public.v_dashboard_financial_summary AS
SELECT
  c.id AS company_id,
  COALESCE(rec.total_contract_value, 0.00)::numeric(14,2) AS total_contract_value,
  COALESCE(rec.total_amount_received, 0.00)::numeric(14,2) AS total_customer_received,
  COALESCE(rec.total_outstanding_receivable, 0.00)::numeric(14,2) AS total_customer_receivable,
  COALESCE(sup.total_supplier_payable, 0.00)::numeric(14,2) AS total_supplier_payable,
  COALESCE(wag.total_wage_payable, 0.00)::numeric(14,2) AS total_wage_payable,
  COALESCE(adv.total_advance_outstanding, 0.00)::numeric(14,2) AS total_advance_outstanding,
  COALESCE(exp.active_expense_total, 0.00)::numeric(14,2) AS total_expenses,
  COALESCE(cst.total_recorded_cost, 0.00)::numeric(14,2) AS total_recorded_project_cost
FROM public.companies c
LEFT JOIN (
  SELECT
    company_id,
    SUM(contract_value) AS total_contract_value,
    SUM(amount_received) AS total_amount_received,
    SUM(GREATEST(outstanding_amount, 0.00)) AS total_outstanding_receivable
  FROM public.v_project_customer_payment_balance
  GROUP BY company_id
) rec ON rec.company_id = c.id
LEFT JOIN (
  SELECT
    company_id,
    SUM(GREATEST(outstanding_balance, 0.00)) AS total_supplier_payable
  FROM public.v_supplier_balance
  GROUP BY company_id
) sup ON sup.company_id = c.id
LEFT JOIN (
  SELECT
    company_id,
    SUM(GREATEST(wage_payable, 0.00)) AS total_wage_payable
  FROM public.v_employee_wage_payable
  GROUP BY company_id
) wag ON wag.company_id = c.id
LEFT JOIN (
  SELECT
    company_id,
    SUM(GREATEST(outstanding_advance_balance, 0.00)) AS total_advance_outstanding
  FROM public.v_employee_advance_balance
  GROUP BY company_id
) adv ON adv.company_id = c.id
LEFT JOIN public.v_expense_summary exp ON exp.company_id = c.id
LEFT JOIN (
  SELECT
    company_id,
    SUM(recorded_project_cost) AS total_recorded_cost
  FROM public.v_project_recorded_cost
  GROUP BY company_id
) cst ON cst.company_id = c.id;

COMMENT ON VIEW public.v_dashboard_financial_summary IS
  'Dashboard financial KPI summary directly derived from authoritative views.';

ALTER VIEW public.v_dashboard_financial_summary SET (security_invoker = true);

-- 2b. Project Summary View
CREATE OR REPLACE VIEW public.v_dashboard_project_summary AS
SELECT
  c.id AS company_id,
  COUNT(p.id)::integer AS total_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'Active')::integer AS active_projects,
  COUNT(p.id) FILTER (WHERE p.status IN ('Planned', 'Planning'))::integer AS upcoming_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'On Hold')::integer AS on_hold_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'Completed')::integer AS completed_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'Cancelled')::integer AS cancelled_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'On Hold' OR (p.expected_end_date IS NOT NULL AND p.expected_end_date < CURRENT_DATE AND p.status = 'Active'))::integer AS projects_requiring_attention,
  COALESCE(ROUND(AVG(wp.overall_progress_percentage) FILTER (WHERE p.status = 'Active'), 2), 0.00)::numeric(5,2) AS active_projects_avg_progress
FROM public.companies c
LEFT JOIN public.projects p ON p.company_id = c.id
LEFT JOIN public.v_project_work_progress wp ON wp.company_id = p.company_id AND wp.project_id = p.id
GROUP BY c.id;

COMMENT ON VIEW public.v_dashboard_project_summary IS
  'Dashboard project portfolio overview and completion percentages.';

ALTER VIEW public.v_dashboard_project_summary SET (security_invoker = true);

-- 2c. Workforce Summary View
CREATE OR REPLACE VIEW public.v_dashboard_workforce_summary AS
SELECT
  c.id AS company_id,
  COUNT(a.id) FILTER (WHERE a.attendance_date = CURRENT_DATE AND a.status IN ('Present', 'Half Day'))::integer AS workers_today,
  COUNT(a.id) FILTER (WHERE a.attendance_date = CURRENT_DATE AND a.status = 'Present')::integer AS present_today,
  COUNT(a.id) FILTER (WHERE a.attendance_date = CURRENT_DATE AND a.status = 'Half Day')::integer AS half_day_today,
  COUNT(a.id) FILTER (WHERE a.attendance_date = CURRENT_DATE AND a.status = 'Absent')::integer AS absent_today,
  COALESCE(SUM(dw.amount) FILTER (WHERE dw.wage_date = CURRENT_DATE AND dw.status != 'Cancelled'), 0.00)::numeric(14,2) AS today_wage_amount
FROM public.companies c
LEFT JOIN public.attendance a ON a.company_id = c.id AND a.attendance_date = CURRENT_DATE
LEFT JOIN public.daily_wages dw ON dw.company_id = c.id AND dw.wage_date = CURRENT_DATE
GROUP BY c.id;

COMMENT ON VIEW public.v_dashboard_workforce_summary IS
  'Dashboard workforce attendance and wage summaries for the current day.';

ALTER VIEW public.v_dashboard_workforce_summary SET (security_invoker = true);

-- 2d. Actions Summary View
CREATE OR REPLACE VIEW public.v_dashboard_actions_summary AS
SELECT
  c.id AS company_id,
  COUNT(t.id) FILTER (WHERE t.status = 'Pending')::integer AS pending_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'Pending' AND t.due_date < CURRENT_DATE)::integer AS overdue_tasks,
  COUNT(f.id) FILTER (WHERE f.status = 'Pending' AND f.follow_up_date <= CURRENT_DATE)::integer AS follow_ups_due,
  COUNT(sv.id) FILTER (WHERE sv.status = 'Scheduled' AND sv.visit_date >= CURRENT_DATE)::integer AS upcoming_site_visits,
  COUNT(e.id) FILTER (WHERE e.status = 'New')::integer AS new_enquiries,
  COUNT(dsr.id) FILTER (WHERE dsr.report_date = CURRENT_DATE)::integer AS reports_today
FROM public.companies c
LEFT JOIN public.tasks t ON t.company_id = c.id
LEFT JOIN public.follow_ups f ON f.company_id = c.id
LEFT JOIN public.site_visits sv ON sv.company_id = c.id
LEFT JOIN public.enquiries e ON e.company_id = c.id
LEFT JOIN public.daily_site_reports dsr ON dsr.company_id = c.id AND dsr.report_date = CURRENT_DATE
GROUP BY c.id;

COMMENT ON VIEW public.v_dashboard_actions_summary IS
  'Dashboard pending actions, overdue tasks, follow-ups, and upcoming visits.';

ALTER VIEW public.v_dashboard_actions_summary SET (security_invoker = true);

-- =====================
-- 3. DASHBOARD RPC (UNIFIED JSON ENDPOINT)
-- =====================

CREATE OR REPLACE FUNCTION public.get_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_financial   record;
  v_project     record;
  v_workforce   record;
  v_actions     record;
  v_recent_pmts jsonb := '[]'::jsonb;
  v_recent_exps jsonb := '[]'::jsonb;
  v_reminders   jsonb := '[]'::jsonb;
  v_active_prjs jsonb := '[]'::jsonb;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  -- 1. Fetch aggregate summaries
  SELECT * INTO v_financial FROM public.v_dashboard_financial_summary WHERE company_id = v_company_id;
  SELECT * INTO v_project FROM public.v_dashboard_project_summary WHERE company_id = v_company_id;
  SELECT * INTO v_workforce FROM public.v_dashboard_workforce_summary WHERE company_id = v_company_id;
  SELECT * INTO v_actions FROM public.v_dashboard_actions_summary WHERE company_id = v_company_id;

  -- 2. Fetch recent confirmed customer payments (last 5)
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_recent_pmts
  FROM (
    SELECT id, customer_id, project_id, amount, payment_date, payment_method, status
    FROM public.customer_payments
    WHERE company_id = v_company_id AND status = 'Confirmed'
    ORDER BY payment_date DESC, created_at DESC
    LIMIT 5
  ) sub;

  -- 3. Fetch recent confirmed expenses (last 5)
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_recent_exps
  FROM (
    SELECT id, project_id, category, description, amount, expense_date, status
    FROM public.expenses
    WHERE company_id = v_company_id AND status = 'Confirmed'
    ORDER BY expense_date DESC, created_at DESC
    LIMIT 5
  ) sub;

  -- 4. Fetch urgent/overdue reminders from v_my_day (limit 5)
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_reminders
  FROM (
    SELECT item_type, item_id, title, date, priority, urgency, project_name, customer_name
    FROM public.v_my_day
    WHERE company_id = v_company_id AND (urgency = 'OVERDUE' OR priority = 'Urgent')
    ORDER BY date ASC
    LIMIT 5
  ) sub;

  -- 5. Fetch active projects list with progress
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_active_prjs
  FROM (
    SELECT
      p.id,
      p.project_code,
      p.name,
      p.status,
      p.start_date,
      p.expected_end_date,
      p.contract_value,
      COALESCE(wp.overall_progress_percentage, 0.00) AS overall_progress_percentage,
      COALESCE(rec.amount_received, 0.00) AS amount_received,
      COALESCE(rec.outstanding_amount, 0.00) AS outstanding_amount
    FROM public.projects p
    LEFT JOIN public.v_project_work_progress wp
      ON wp.company_id = p.company_id AND wp.project_id = p.id
    LEFT JOIN public.v_project_customer_payment_balance rec
      ON rec.company_id = p.company_id AND rec.project_id = p.id
    WHERE p.company_id = v_company_id AND p.status = 'Active'
    ORDER BY p.name ASC
  ) sub;

  RETURN jsonb_build_object(
    'company_id', v_company_id,
    'financial', jsonb_build_object(
      'total_contract_value',       COALESCE(v_financial.total_contract_value, 0.00),
      'total_customer_received',    COALESCE(v_financial.total_customer_received, 0.00),
      'total_customer_receivable',  COALESCE(v_financial.total_customer_receivable, 0.00),
      'total_supplier_payable',     COALESCE(v_financial.total_supplier_payable, 0.00),
      'total_wage_payable',         COALESCE(v_financial.total_wage_payable, 0.00),
      'total_advance_outstanding',   COALESCE(v_financial.total_advance_outstanding, 0.00),
      'total_expenses',             COALESCE(v_financial.total_expenses, 0.00),
      'total_recorded_project_cost', COALESCE(v_financial.total_recorded_project_cost, 0.00),
      'recent_payments',            v_recent_pmts,
      'recent_expenses',            v_recent_exps
    ),
    'projects', jsonb_build_object(
      'total_projects',             COALESCE(v_project.total_projects, 0),
      'active_projects',            COALESCE(v_project.active_projects, 0),
      'upcoming_projects',          COALESCE(v_project.upcoming_projects, 0),
      'on_hold_projects',           COALESCE(v_project.on_hold_projects, 0),
      'completed_projects',         COALESCE(v_project.completed_projects, 0),
      'cancelled_projects',         COALESCE(v_project.cancelled_projects, 0),
      'projects_requiring_attention', COALESCE(v_project.projects_requiring_attention, 0),
      'active_projects_avg_progress', COALESCE(v_project.active_projects_avg_progress, 0.00),
      'active_project_list',        v_active_prjs
    ),
    'workforce', jsonb_build_object(
      'workers_today',              COALESCE(v_workforce.workers_today, 0),
      'present_today',              COALESCE(v_workforce.present_today, 0),
      'half_day_today',             COALESCE(v_workforce.half_day_today, 0),
      'absent_today',               COALESCE(v_workforce.absent_today, 0),
      'today_wage_amount',          COALESCE(v_workforce.today_wage_amount, 0.00)
    ),
    'actions', jsonb_build_object(
      'pending_tasks',              COALESCE(v_actions.pending_tasks, 0),
      'overdue_tasks',              COALESCE(v_actions.overdue_tasks, 0),
      'follow_ups_due',             COALESCE(v_actions.follow_ups_due, 0),
      'upcoming_site_visits',       COALESCE(v_actions.upcoming_site_visits, 0),
      'new_enquiries',              COALESCE(v_actions.new_enquiries, 0),
      'reports_today',              COALESCE(v_actions.reports_today, 0),
      'important_reminders',        v_reminders
    )
  );
END;
$$;

COMMENT ON FUNCTION public.get_dashboard() IS
  'Unified multi-section dashboard JSON response for authenticated company.';

-- =====================
-- 4. WEEKLY REPORT RPC FUNCTIONS
-- =====================

CREATE OR REPLACE FUNCTION public.get_weekly_report(
  p_start_date date DEFAULT NULL,
  p_end_date   date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id        uuid;
  v_start_date        date;
  v_end_date          date;
  v_purchases_cnt     integer;
  v_purchases_amt     numeric(14,2);
  v_attendance_cnt    integer;
  v_distinct_workers  integer;
  v_wages_cnt         integer;
  v_wages_amt         numeric(14,2);
  v_expenses_cnt      integer;
  v_expenses_amt      numeric(14,2);
  v_cust_pmts_cnt     integer;
  v_cust_pmts_amt     numeric(14,2);
  v_supp_pmts_cnt     integer;
  v_supp_pmts_amt     numeric(14,2);
  v_pending_rec       numeric(14,2);
  v_pending_pay       numeric(14,2);
  v_reports_cnt       integer;
  v_active_projects   jsonb := '[]'::jsonb;
  v_site_issues       jsonb := '[]'::jsonb;
  v_new_enquiries     integer;
  v_completed_visits  integer;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  -- Default to current week Monday to Sunday
  v_start_date := COALESCE(p_start_date, date_trunc('week', CURRENT_DATE)::date);
  v_end_date   := COALESCE(p_end_date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date);

  IF v_end_date < v_start_date THEN
    RAISE EXCEPTION 'Validation error: Weekly report end_date % cannot be before start_date %',
      v_end_date, v_start_date;
  END IF;

  -- 1. Purchases during week
  SELECT
    COUNT(id),
    COALESCE(SUM(total_amount), 0.00)
  INTO v_purchases_cnt, v_purchases_amt
  FROM public.purchases
  WHERE company_id = v_company_id
    AND status = 'Confirmed'
    AND purchase_date >= v_start_date
    AND purchase_date <= v_end_date;

  -- 2. Labour / Attendance during week
  SELECT
    COUNT(id),
    COUNT(DISTINCT employee_id)
  INTO v_attendance_cnt, v_distinct_workers
  FROM public.attendance
  WHERE company_id = v_company_id
    AND attendance_date >= v_start_date
    AND attendance_date <= v_end_date
    AND status IN ('Present', 'Half Day');

  -- 3. Wages during week
  SELECT
    COUNT(id),
    COALESCE(SUM(amount), 0.00)
  INTO v_wages_cnt, v_wages_amt
  FROM public.daily_wages
  WHERE company_id = v_company_id
    AND status != 'Cancelled'
    AND wage_date >= v_start_date
    AND wage_date <= v_end_date;

  -- 4. Expenses during week
  SELECT
    COUNT(id),
    COALESCE(SUM(amount), 0.00)
  INTO v_expenses_cnt, v_expenses_amt
  FROM public.expenses
  WHERE company_id = v_company_id
    AND status = 'Confirmed'
    AND expense_date >= v_start_date
    AND expense_date <= v_end_date;

  -- 5. Customer Payments during week
  SELECT
    COUNT(id),
    COALESCE(SUM(amount), 0.00)
  INTO v_cust_pmts_cnt, v_cust_pmts_amt
  FROM public.customer_payments
  WHERE company_id = v_company_id
    AND status = 'Confirmed'
    AND payment_date >= v_start_date
    AND payment_date <= v_end_date;

  -- 6. Supplier Payments during week
  SELECT
    COUNT(id),
    COALESCE(SUM(amount), 0.00)
  INTO v_supp_pmts_cnt, v_supp_pmts_amt
  FROM public.supplier_payments
  WHERE company_id = v_company_id
    AND status = 'Confirmed'
    AND payment_date >= v_start_date
    AND payment_date <= v_end_date;

  -- 7. Outstanding Receivables & Payables Snapshot
  SELECT COALESCE(SUM(GREATEST(outstanding_amount, 0.00)), 0.00)
  INTO v_pending_rec
  FROM public.v_project_customer_payment_balance
  WHERE company_id = v_company_id;

  SELECT COALESCE(SUM(GREATEST(outstanding_balance, 0.00)), 0.00)
  INTO v_pending_pay
  FROM public.v_supplier_balance
  WHERE company_id = v_company_id;

  -- 8. Daily Site Reports and Issues noted during week
  SELECT COUNT(id) INTO v_reports_cnt
  FROM public.daily_site_reports
  WHERE company_id = v_company_id
    AND report_date >= v_start_date
    AND report_date <= v_end_date;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_site_issues
  FROM (
    SELECT r.id, r.project_id, p.name AS project_name, r.report_date, r.issues, r.delays
    FROM public.daily_site_reports r
    JOIN public.projects p ON p.id = r.project_id AND p.company_id = r.company_id
    WHERE r.company_id = v_company_id
      AND r.report_date >= v_start_date
      AND r.report_date <= v_end_date
      AND (char_length(trim(COALESCE(r.issues, ''))) > 0 OR char_length(trim(COALESCE(r.delays, ''))) > 0)
    ORDER BY r.report_date DESC
  ) sub;

  -- 9. Active Projects summary
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_active_projects
  FROM (
    SELECT
      p.id,
      p.project_code,
      p.name,
      p.status,
      COALESCE(wp.overall_progress_percentage, 0.00) AS overall_progress_percentage
    FROM public.projects p
    LEFT JOIN public.v_project_work_progress wp
      ON wp.company_id = p.company_id AND wp.project_id = p.id
    WHERE p.company_id = v_company_id AND p.status = 'Active'
    ORDER BY p.name ASC
  ) sub;

  -- 10. Other business activity: new enquiries and completed site visits
  SELECT COUNT(id) INTO v_new_enquiries
  FROM public.enquiries
  WHERE company_id = v_company_id
    AND created_at::date >= v_start_date
    AND created_at::date <= v_end_date;

  SELECT COUNT(id) INTO v_completed_visits
  FROM public.site_visits
  WHERE company_id = v_company_id
    AND status = 'Completed'
    AND visit_date >= v_start_date
    AND visit_date <= v_end_date;

  RETURN jsonb_build_object(
    'company_id', v_company_id,
    'period', jsonb_build_object(
      'start_date', v_start_date,
      'end_date',   v_end_date
    ),
    'projects', jsonb_build_object(
      'active_count', jsonb_array_length(v_active_projects),
      'active_projects', v_active_projects
    ),
    'purchases', jsonb_build_object(
      'count', v_purchases_cnt,
      'total_amount', v_purchases_amt
    ),
    'labour', jsonb_build_object(
      'attendance_records', v_attendance_cnt,
      'distinct_workers',   v_distinct_workers
    ),
    'wages', jsonb_build_object(
      'count', v_wages_cnt,
      'total_amount', v_wages_amt
    ),
    'expenses', jsonb_build_object(
      'count', v_expenses_cnt,
      'total_amount', v_expenses_amt
    ),
    'customer_payments', jsonb_build_object(
      'count', v_cust_pmts_cnt,
      'total_amount', v_cust_pmts_amt
    ),
    'supplier_payments', jsonb_build_object(
      'count', v_supp_pmts_cnt,
      'total_amount', v_supp_pmts_amt
    ),
    'pending_payments', jsonb_build_object(
      'customer_receivables', v_pending_rec,
      'supplier_payables',    v_pending_pay
    ),
    'site_activity', jsonb_build_object(
      'reports_count', v_reports_cnt,
      'issues_noted',  v_site_issues
    ),
    'other_activity', jsonb_build_object(
      'new_enquiries',     v_new_enquiries,
      'completed_visits',  v_completed_visits
    )
  );
END;
$$;

COMMENT ON FUNCTION public.get_weekly_report(date, date) IS
  'Compiles weekly business and operational summary for given date range. Product Spec Sec 29.';

-- 4b. Generate and optionally store snapshot
CREATE OR REPLACE FUNCTION public.generate_weekly_report(
  p_start_date      date DEFAULT NULL,
  p_end_date        date DEFAULT NULL,
  p_store_snapshot  boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_report_data jsonb;
  v_start_date  date;
  v_end_date    date;
  v_snapshot_id uuid := NULL;
  v_title       text;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  v_report_data := public.get_weekly_report(p_start_date, p_end_date);
  v_start_date  := (v_report_data->'period'->>'start_date')::date;
  v_end_date    := (v_report_data->'period'->>'end_date')::date;
  v_title       := 'Weekly Report: ' || to_char(v_start_date, 'YYYY-MM-DD') || ' to ' || to_char(v_end_date, 'YYYY-MM-DD');

  IF p_store_snapshot THEN
    INSERT INTO public.weekly_reports (
      company_id,
      start_date,
      end_date,
      title,
      summary,
      generated_by
    ) VALUES (
      v_company_id,
      v_start_date,
      v_end_date,
      v_title,
      v_report_data,
      auth.uid()
    )
    ON CONFLICT (company_id, start_date, end_date)
    DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      generated_by = EXCLUDED.generated_by,
      created_at = now()
    RETURNING id INTO v_snapshot_id;
  END IF;

  RETURN jsonb_build_object(
    'report', v_report_data,
    'snapshot_id', v_snapshot_id,
    'stored', p_store_snapshot
  );
END;
$$;

COMMENT ON FUNCTION public.generate_weekly_report(date, date, boolean) IS
  'Generates weekly report and optionally persists snapshot in public.weekly_reports.';
