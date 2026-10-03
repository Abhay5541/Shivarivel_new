-- =============================================================================
-- Migration 0017: Daily Site Reports Module
-- Phase 16: Operational Daily Site Reporting Backend
--
-- This migration establishes the backend foundation for Daily Site Reports:
--   - public.daily_site_reports table (project-linked operational records)
--   - Child tables for structured operational tracking:
--       * public.daily_site_report_workers (workforce headcount and hours)
--       * public.daily_site_report_materials (materials placed/used on site)
--       * public.daily_site_report_expenses (operational site expenses / references)
--       * public.daily_site_report_photos (photo metadata / storage deferred to Phase 18)
--   - Unique constraint: at most one daily report per project per date (Product Spec Sec 26)
--   - Composite same-company foreign keys enforcing multi-tenant isolation
--   - Validation triggers for report integrity and child consistency
--   - Atomic RPC for multi-table report creation (create_daily_site_report)
--   - Row Level Security (RLS) policies enforcing company isolation
--   - Audit logging triggers using existing audit_log infrastructure
--   - Performance indexes for project and date queries
--
-- STRICT FINANCIAL SEPARATION:
-- 1. Daily site reports are OPERATIONAL records, NOT financial transactions.
-- 2. Daily report entries do NOT alter Recorded Project Cost, purchases,
--    employee wages, employee advances, expenses, or customer payments.
-- 3. Any site expenses recorded in daily reports are operational logs;
--    they may optionally reference public.expenses records via expense_id
--    without duplicating financial transactions.
-- =============================================================================

-- =====================
-- 1. DAILY SITE REPORTS TABLE
-- =====================

CREATE TABLE public.daily_site_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  project_id      uuid NOT NULL,
  report_date     date NOT NULL DEFAULT CURRENT_DATE,
  work_completed  text NOT NULL CHECK (char_length(trim(work_completed)) > 0),
  issues          text,
  delays          text,
  next_day_plan   text,
  notes           text,
  status          text NOT NULL DEFAULT 'Submitted'
                  CHECK (status IN ('Draft', 'Submitted', 'Approved')),
  created_by      uuid
                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_daily_site_reports_company_id_id
    UNIQUE (company_id, id),

  -- Product Spec Sec 26: A project should have at most one daily site report per date
  CONSTRAINT uq_daily_site_reports_project_date
    UNIQUE (company_id, project_id, report_date),

  -- Composite foreign key to projects: project must belong to same company
  CONSTRAINT fk_daily_site_reports_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to profiles: creator must belong to same company
  CONSTRAINT fk_daily_site_reports_created_by_company
    FOREIGN KEY (company_id, created_by)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.daily_site_reports IS
  'Daily operational site reports for construction/interior projects. Company-scoped.';

CREATE TRIGGER daily_site_reports_updated_at
  BEFORE UPDATE ON public.daily_site_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. DAILY REPORT WORKERS TABLE
-- =====================

CREATE TABLE public.daily_site_report_workers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  report_id       uuid NOT NULL,
  employee_id     uuid,
  worker_name     text NOT NULL CHECK (char_length(trim(worker_name)) > 0),
  worker_type     text,
  worker_count    integer NOT NULL DEFAULT 1 CHECK (worker_count > 0),
  hours_worked    numeric(5,2) CHECK (hours_worked IS NULL OR hours_worked >= 0),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_dsrw_company_id_id
    UNIQUE (company_id, id),

  -- Composite FK to report
  CONSTRAINT fk_dsrw_report_company
    FOREIGN KEY (company_id, report_id)
    REFERENCES public.daily_site_reports (company_id, id)
    ON DELETE CASCADE,

  -- Composite FK to employees: if employee is referenced, must belong to same company
  CONSTRAINT fk_dsrw_employee_company
    FOREIGN KEY (company_id, employee_id)
    REFERENCES public.employees (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.daily_site_report_workers IS
  'Workers present and active on site for a daily site report. Operational headcount log.';

-- =====================
-- 3. DAILY REPORT MATERIALS TABLE
-- =====================

CREATE TABLE public.daily_site_report_materials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  report_id       uuid NOT NULL,
  material_id     uuid,
  material_name   text NOT NULL CHECK (char_length(trim(material_name)) > 0),
  quantity        numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit            text NOT NULL DEFAULT 'nos' CHECK (char_length(trim(unit)) > 0),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_dsrm_company_id_id
    UNIQUE (company_id, id),

  -- Composite FK to report
  CONSTRAINT fk_dsrm_report_company
    FOREIGN KEY (company_id, report_id)
    REFERENCES public.daily_site_reports (company_id, id)
    ON DELETE CASCADE,

  -- Composite FK to materials: if material master is referenced, must belong to same company
  CONSTRAINT fk_dsrm_material_company
    FOREIGN KEY (company_id, material_id)
    REFERENCES public.materials (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.daily_site_report_materials IS
  'Materials utilized or received on site during the reporting day. Operational usage log.';

-- =====================
-- 4. DAILY REPORT EXPENSES TABLE (OPERATIONAL LOG)
-- =====================

CREATE TABLE public.daily_site_report_expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  report_id       uuid NOT NULL,
  expense_id      uuid,
  category        text NOT NULL,
  description     text NOT NULL CHECK (char_length(trim(description)) > 0),
  amount          numeric(14,2) NOT NULL CHECK (amount > 0),
  paid_by         text,
  payment_method  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_dsre_company_id_id
    UNIQUE (company_id, id),

  -- Composite FK to report
  CONSTRAINT fk_dsre_report_company
    FOREIGN KEY (company_id, report_id)
    REFERENCES public.daily_site_reports (company_id, id)
    ON DELETE CASCADE,

  -- Composite FK to actual financial expenses (optional reference to avoid duplication)
  CONSTRAINT fk_dsre_expense_company
    FOREIGN KEY (company_id, expense_id)
    REFERENCES public.expenses (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.daily_site_report_expenses IS
  'Site-level operational expenses reported by supervisor. Can reference financial expenses without duplication.';

-- =====================
-- 5. DAILY REPORT PHOTOS TABLE (METADATA / PHASE 18 HOOK)
-- =====================

CREATE TABLE public.daily_site_report_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  report_id       uuid NOT NULL,
  photo_url       text NOT NULL CHECK (char_length(trim(photo_url)) > 0),
  caption         text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id)
  CONSTRAINT uq_dsrp_company_id_id
    UNIQUE (company_id, id),

  -- Composite FK to report
  CONSTRAINT fk_dsrp_report_company
    FOREIGN KEY (company_id, report_id)
    REFERENCES public.daily_site_reports (company_id, id)
    ON DELETE CASCADE
);

COMMENT ON TABLE public.daily_site_report_photos IS
  'Site photos attached to daily report. Storage infrastructure deferred to Phase 18.';

-- =====================
-- 6. VALIDATION & INTEGRITY TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.validate_daily_site_report_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project record;
BEGIN
  -- 1. Ensure non-blank work_completed
  IF trim(NEW.work_completed) = '' THEN
    RAISE EXCEPTION 'Validation error: Daily site report work_completed cannot be blank';
  END IF;

  -- 2. Validate project belongs to current company
  SELECT id, company_id, status INTO v_project
  FROM public.projects
  WHERE id = NEW.project_id AND company_id = NEW.company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Project % does not belong to company %',
      NEW.project_id, NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_daily_site_report_integrity() IS
  'Validates work_completed and project company alignment on daily site reports.';

CREATE TRIGGER trg_validate_daily_site_report_integrity
  BEFORE INSERT OR UPDATE ON public.daily_site_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_daily_site_report_integrity();

-- =====================
-- 7. ATOMIC RPC FUNCTION
-- =====================

CREATE OR REPLACE FUNCTION public.create_daily_site_report(
  p_project_id      uuid,
  p_work_completed  text,
  p_report_date     date DEFAULT CURRENT_DATE,
  p_issues          text DEFAULT NULL,
  p_delays          text DEFAULT NULL,
  p_next_day_plan   text DEFAULT NULL,
  p_notes           text DEFAULT NULL,
  p_status          text DEFAULT 'Submitted',
  p_workers         jsonb DEFAULT '[]'::jsonb,
  p_materials       jsonb DEFAULT '[]'::jsonb,
  p_expenses        jsonb DEFAULT '[]'::jsonb,
  p_photos          jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_report_id   uuid;
  v_item        jsonb;
  v_workers_cnt integer := 0;
  v_materials_cnt integer := 0;
  v_expenses_cnt integer := 0;
  v_photos_cnt  integer := 0;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_work_completed IS NULL OR trim(p_work_completed) = '' THEN
    RAISE EXCEPTION 'Validation error: Daily site report work_completed cannot be blank';
  END IF;

  -- Check duplicate report per project per date
  IF EXISTS (
    SELECT 1 FROM public.daily_site_reports
    WHERE company_id = v_company_id
      AND project_id = p_project_id
      AND report_date = COALESCE(p_report_date, CURRENT_DATE)
  ) THEN
    RAISE EXCEPTION 'Duplicate report violation: A daily site report already exists for project % on date %',
      p_project_id, COALESCE(p_report_date, CURRENT_DATE);
  END IF;

  -- Insert main report
  INSERT INTO public.daily_site_reports (
    company_id,
    project_id,
    report_date,
    work_completed,
    issues,
    delays,
    next_day_plan,
    notes,
    status,
    created_by
  ) VALUES (
    v_company_id,
    p_project_id,
    COALESCE(p_report_date, CURRENT_DATE),
    p_work_completed,
    p_issues,
    p_delays,
    p_next_day_plan,
    p_notes,
    COALESCE(p_status, 'Submitted'),
    auth.uid()
  ) RETURNING id INTO v_report_id;

  -- Insert workers if provided
  IF p_workers IS NOT NULL AND jsonb_array_length(p_workers) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_workers)
    LOOP
      INSERT INTO public.daily_site_report_workers (
        company_id,
        report_id,
        employee_id,
        worker_name,
        worker_type,
        worker_count,
        hours_worked,
        notes
      ) VALUES (
        v_company_id,
        v_report_id,
        (v_item->>'employee_id')::uuid,
        COALESCE(v_item->>'worker_name', 'Worker'),
        v_item->>'worker_type',
        COALESCE((v_item->>'worker_count')::integer, 1),
        (v_item->>'hours_worked')::numeric,
        v_item->>'notes'
      );
      v_workers_cnt := v_workers_cnt + 1;
    END LOOP;
  END IF;

  -- Insert materials if provided
  IF p_materials IS NOT NULL AND jsonb_array_length(p_materials) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_materials)
    LOOP
      INSERT INTO public.daily_site_report_materials (
        company_id,
        report_id,
        material_id,
        material_name,
        quantity,
        unit,
        notes
      ) VALUES (
        v_company_id,
        v_report_id,
        (v_item->>'material_id')::uuid,
        COALESCE(v_item->>'material_name', 'Material'),
        COALESCE((v_item->>'quantity')::numeric, 1.000),
        COALESCE(v_item->>'unit', 'nos'),
        v_item->>'notes'
      );
      v_materials_cnt := v_materials_cnt + 1;
    END LOOP;
  END IF;

  -- Insert expenses if provided
  IF p_expenses IS NOT NULL AND jsonb_array_length(p_expenses) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_expenses)
    LOOP
      INSERT INTO public.daily_site_report_expenses (
        company_id,
        report_id,
        expense_id,
        category,
        description,
        amount,
        paid_by,
        payment_method,
        notes
      ) VALUES (
        v_company_id,
        v_report_id,
        (v_item->>'expense_id')::uuid,
        COALESCE(v_item->>'category', 'Other'),
        COALESCE(v_item->>'description', 'Site expense'),
        (v_item->>'amount')::numeric,
        v_item->>'paid_by',
        v_item->>'payment_method',
        v_item->>'notes'
      );
      v_expenses_cnt := v_expenses_cnt + 1;
    END LOOP;
  END IF;

  -- Insert photos if provided
  IF p_photos IS NOT NULL AND jsonb_array_length(p_photos) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_photos)
    LOOP
      INSERT INTO public.daily_site_report_photos (
        company_id,
        report_id,
        photo_url,
        caption
      ) VALUES (
        v_company_id,
        v_report_id,
        v_item->>'photo_url',
        v_item->>'caption'
      );
      v_photos_cnt := v_photos_cnt + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'report_id', v_report_id,
    'project_id', p_project_id,
    'report_date', COALESCE(p_report_date, CURRENT_DATE),
    'status', COALESCE(p_status, 'Submitted'),
    'workers_count', v_workers_cnt,
    'materials_count', v_materials_cnt,
    'expenses_count', v_expenses_cnt,
    'photos_count', v_photos_cnt
  );
END;
$$;

COMMENT ON FUNCTION public.create_daily_site_report(uuid, text, date, text, text, text, text, text, jsonb, jsonb, jsonb, jsonb) IS
  'Atomically creates a daily site report with optional structured workers, materials, expenses, and photos.';

-- =====================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

ALTER TABLE public.daily_site_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_report_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_report_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_report_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_report_photos ENABLE ROW LEVEL SECURITY;

-- 8a. daily_site_reports RLS
CREATE POLICY "Users can view company daily site reports"
  ON public.daily_site_reports
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company daily site reports"
  ON public.daily_site_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company daily site reports"
  ON public.daily_site_reports
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company daily site reports"
  ON public.daily_site_reports
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 8b. daily_site_report_workers RLS
CREATE POLICY "Users can view company report workers"
  ON public.daily_site_report_workers
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company report workers"
  ON public.daily_site_report_workers
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company report workers"
  ON public.daily_site_report_workers
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company report workers"
  ON public.daily_site_report_workers
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 8c. daily_site_report_materials RLS
CREATE POLICY "Users can view company report materials"
  ON public.daily_site_report_materials
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company report materials"
  ON public.daily_site_report_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company report materials"
  ON public.daily_site_report_materials
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company report materials"
  ON public.daily_site_report_materials
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 8d. daily_site_report_expenses RLS
CREATE POLICY "Users can view company report expenses"
  ON public.daily_site_report_expenses
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company report expenses"
  ON public.daily_site_report_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company report expenses"
  ON public.daily_site_report_expenses
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company report expenses"
  ON public.daily_site_report_expenses
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 8e. daily_site_report_photos RLS
CREATE POLICY "Users can view company report photos"
  ON public.daily_site_report_photos
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company report photos"
  ON public.daily_site_report_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company report photos"
  ON public.daily_site_report_photos
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company report photos"
  ON public.daily_site_report_photos
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 9. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_daily_site_report_changes()
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
    v_action := 'create_daily_site_report';
    v_details := jsonb_build_object(
      'project_id', NEW.project_id,
      'report_date', NEW.report_date,
      'status', NEW.status
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'daily_site_reports', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_daily_site_report';
    v_details := jsonb_build_object(
      'project_id', NEW.project_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'report_date', NEW.report_date
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'daily_site_reports', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_daily_site_report';
    v_details := jsonb_build_object('project_id', OLD.project_id, 'report_date', OLD.report_date);
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (OLD.company_id, auth.uid(), v_action, 'daily_site_reports', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_daily_site_report_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_site_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_daily_site_report_changes();

-- =====================
-- 10. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_daily_site_reports_company_id ON public.daily_site_reports(company_id);
CREATE INDEX idx_daily_site_reports_company_project ON public.daily_site_reports(company_id, project_id);
CREATE INDEX idx_daily_site_reports_company_date ON public.daily_site_reports(company_id, report_date);
CREATE INDEX idx_daily_site_reports_company_status ON public.daily_site_reports(company_id, status);

CREATE INDEX idx_dsrw_report_id ON public.daily_site_report_workers(company_id, report_id);
CREATE INDEX idx_dsrm_report_id ON public.daily_site_report_materials(company_id, report_id);
CREATE INDEX idx_dsre_report_id ON public.daily_site_report_expenses(company_id, report_id);
CREATE INDEX idx_dsrp_report_id ON public.daily_site_report_photos(company_id, report_id);
