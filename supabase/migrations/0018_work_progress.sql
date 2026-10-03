-- =============================================================================
-- Migration 0018: Work Progress Module
-- Phase 17: Work Progress Backend Migration
-- =============================================================================
-- This migration establishes the backend foundation for Work Progress:
--   - public.project_work_items table (operational work items per project)
--   - public.work_progress auto-updatable view alias
--   - public.v_project_work_progress view for project-level progress rollups
--   - composite foreign keys guaranteeing same-company alignment
--   - validation triggers for integrity, date ordering, and progress percentage
--   - atomic RPCs:
--       * public.update_work_item_progress
--       * public.batch_create_project_work_items
--   - Row Level Security (RLS) policies enforcing multi-tenant isolation
--   - audit logging triggers using existing audit_log infrastructure
--   - performance indexes for project, status, and progress lookups
--
-- STRICT FINANCIAL SEPARATION:
-- 1. Work progress is strictly operational project information.
-- 2. Work progress entries do NOT alter Recorded Project Cost, contract_value,
--    purchases, employee wages, employee advances, expenses, or customer payments.
-- =============================================================================

-- =====================
-- 1. PROJECT WORK ITEMS TABLE
-- =====================

CREATE TABLE public.project_work_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL DEFAULT public.current_company_id()
                      REFERENCES public.companies(id) ON DELETE RESTRICT,
  project_id          uuid NOT NULL,
  name                text NOT NULL CHECK (char_length(trim(name)) > 0),
  category            text,
  status              text NOT NULL DEFAULT 'Not Started'
                      CHECK (status IN (
                        'Not Started',
                        'In Progress',
                        'On Hold',
                        'Completed',
                        'Cancelled'
                      )),
  progress_percentage numeric(5,2) NOT NULL DEFAULT 0.00
                      CHECK (progress_percentage >= 0.00 AND progress_percentage <= 100.00),
  start_date          date,
  expected_completion date,
  actual_completion   date,
  notes               text,
  created_by          uuid
                      REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for potential referencing
  CONSTRAINT uq_project_work_items_company_id_id
    UNIQUE (company_id, id),

  -- Composite foreign key to projects: project must belong to same company
  CONSTRAINT fk_pwi_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to profiles: creator must belong to same company
  CONSTRAINT fk_pwi_created_by_company
    FOREIGN KEY (company_id, created_by)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL,

  -- Date chronological sanity constraints
  CONSTRAINT chk_pwi_expected_completion_after_start
    CHECK (start_date IS NULL OR expected_completion IS NULL OR expected_completion >= start_date),
  CONSTRAINT chk_pwi_actual_completion_after_start
    CHECK (start_date IS NULL OR actual_completion IS NULL OR actual_completion >= start_date)
);

COMMENT ON TABLE public.project_work_items IS
  'Work items and operational progress tracking for construction/interior projects. Company-scoped.';

CREATE TRIGGER project_work_items_updated_at
  BEFORE UPDATE ON public.project_work_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. VALIDATION TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.validate_project_work_item_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project record;
BEGIN
  -- 1. Ensure non-blank name
  IF trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Validation error: Work item name cannot be blank';
  END IF;

  -- 2. Ensure progress percentage is within [0, 100]
  IF NEW.progress_percentage < 0.00 OR NEW.progress_percentage > 100.00 THEN
    RAISE EXCEPTION 'Validation error: Work item progress percentage must be between 0 and 100';
  END IF;

  -- 3. Validate project belongs to current company
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

COMMENT ON FUNCTION public.validate_project_work_item_integrity() IS
  'Validates non-blank name, progress range [0, 100], and project company alignment.';

CREATE TRIGGER trg_validate_project_work_item_integrity
  BEFORE INSERT OR UPDATE ON public.project_work_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_work_item_integrity();

-- =====================
-- 3. VIEWS
-- =====================

-- 3a. Auto-updatable alias view
CREATE OR REPLACE VIEW public.work_progress AS
SELECT * FROM public.project_work_items;

COMMENT ON VIEW public.work_progress IS
  'Auto-updatable view alias for project_work_items.';

ALTER VIEW public.work_progress SET (security_invoker = true);

-- 3b. Project-level progress rollup view
CREATE OR REPLACE VIEW public.v_project_work_progress AS
SELECT
  p.company_id,
  p.id AS project_id,
  p.project_code,
  p.name AS project_name,
  p.status AS project_status,
  COUNT(wi.id)::integer AS total_work_items,
  COUNT(wi.id) FILTER (WHERE wi.status = 'Completed' OR wi.progress_percentage = 100.00)::integer AS completed_work_items,
  COUNT(wi.id) FILTER (WHERE wi.status = 'In Progress')::integer AS in_progress_work_items,
  COUNT(wi.id) FILTER (WHERE wi.status = 'Not Started')::integer AS not_started_work_items,
  COUNT(wi.id) FILTER (WHERE wi.status = 'On Hold')::integer AS on_hold_work_items,
  COUNT(wi.id) FILTER (WHERE wi.status = 'Cancelled')::integer AS cancelled_work_items,
  COALESCE(ROUND(AVG(wi.progress_percentage) FILTER (WHERE wi.status != 'Cancelled'), 2), 0.00)::numeric(5,2) AS overall_progress_percentage
FROM public.projects p
LEFT JOIN public.project_work_items wi
  ON wi.company_id = p.company_id AND wi.project_id = p.id
GROUP BY p.company_id, p.id, p.project_code, p.name, p.status;

COMMENT ON VIEW public.v_project_work_progress IS
  'Project-level work progress aggregation and overall completion percentage.';

ALTER VIEW public.v_project_work_progress SET (security_invoker = true);

-- =====================
-- 4. ATOMIC RPCS
-- =====================

-- 4a. Update work item progress
CREATE OR REPLACE FUNCTION public.update_work_item_progress(
  p_work_item_id        uuid,
  p_progress_percentage numeric,
  p_status              text DEFAULT NULL,
  p_actual_completion   date DEFAULT NULL,
  p_notes               text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_item        record;
  v_new_status  text;
  v_actual_date date;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  IF p_progress_percentage IS NULL OR p_progress_percentage < 0.00 OR p_progress_percentage > 100.00 THEN
    RAISE EXCEPTION 'Validation error: progress percentage must be between 0 and 100';
  END IF;

  SELECT * INTO v_item
  FROM public.project_work_items
  WHERE id = p_work_item_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work item not found or access denied: %', p_work_item_id;
  END IF;

  -- Determine status transition if not explicitly provided
  v_new_status := COALESCE(p_status, v_item.status);
  v_actual_date := COALESCE(p_actual_completion, v_item.actual_completion);

  IF p_status IS NULL THEN
    IF p_progress_percentage = 100.00 AND v_item.status != 'Cancelled' THEN
      v_new_status := 'Completed';
      v_actual_date := COALESCE(v_actual_date, CURRENT_DATE);
    ELSIF p_progress_percentage > 0.00 AND v_item.status = 'Not Started' THEN
      v_new_status := 'In Progress';
    END IF;
  END IF;

  UPDATE public.project_work_items
  SET
    progress_percentage = p_progress_percentage,
    status              = v_new_status,
    actual_completion   = v_actual_date,
    notes               = COALESCE(p_notes, notes),
    updated_at          = now()
  WHERE id = p_work_item_id AND company_id = v_company_id
  RETURNING * INTO v_item;

  RETURN jsonb_build_object(
    'work_item_id',        v_item.id,
    'project_id',          v_item.project_id,
    'name',                v_item.name,
    'status',              v_item.status,
    'progress_percentage', v_item.progress_percentage,
    'actual_completion',   v_item.actual_completion,
    'updated_at',          v_item.updated_at
  );
END;
$$;

COMMENT ON FUNCTION public.update_work_item_progress(uuid, numeric, text, date, text) IS
  'Atomically updates progress percentage, status, completion date, and notes for a work item.';

-- 4b. Batch create project work items
CREATE OR REPLACE FUNCTION public.batch_create_project_work_items(
  p_project_id uuid,
  p_items      jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_project     record;
  v_item        jsonb;
  v_created_cnt integer := 0;
  v_item_id     uuid;
  v_ids         uuid[] := ARRAY[]::uuid[];
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  -- Verify project exists and belongs to current company
  SELECT id, company_id, status INTO v_project
  FROM public.projects
  WHERE id = p_project_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or access denied: %', p_project_id;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('project_id', p_project_id, 'items_created', 0, 'work_item_ids', '[]'::jsonb);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_item->>'name' IS NULL OR trim(v_item->>'name') = '' THEN
      RAISE EXCEPTION 'Validation error: Work item name cannot be blank';
    END IF;

    INSERT INTO public.project_work_items (
      company_id,
      project_id,
      name,
      category,
      status,
      progress_percentage,
      start_date,
      expected_completion,
      actual_completion,
      notes,
      created_by
    ) VALUES (
      v_company_id,
      p_project_id,
      trim(v_item->>'name'),
      v_item->>'category',
      COALESCE(v_item->>'status', 'Not Started'),
      COALESCE((v_item->>'progress_percentage')::numeric, 0.00),
      (v_item->>'start_date')::date,
      (v_item->>'expected_completion')::date,
      (v_item->>'actual_completion')::date,
      v_item->>'notes',
      auth.uid()
    ) RETURNING id INTO v_item_id;

    v_ids := array_append(v_ids, v_item_id);
    v_created_cnt := v_created_cnt + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'project_id',    p_project_id,
    'items_created', v_created_cnt,
    'work_item_ids', to_jsonb(v_ids)
  );
END;
$$;

COMMENT ON FUNCTION public.batch_create_project_work_items(uuid, jsonb) IS
  'Atomically creates multiple work items for a project in a single transaction.';

-- =====================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

ALTER TABLE public.project_work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company project work items"
  ON public.project_work_items
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company project work items"
  ON public.project_work_items
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company project work items"
  ON public.project_work_items
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company project work items"
  ON public.project_work_items
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 6. AUDIT LOGGING TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.audit_project_work_items_changes()
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
    v_action := 'create_work_item';
    v_details := jsonb_build_object(
      'project_id',          NEW.project_id,
      'name',                NEW.name,
      'category',            NEW.category,
      'status',              NEW.status,
      'progress_percentage', NEW.progress_percentage
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'project_work_items', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_work_item';
    v_details := jsonb_build_object(
      'project_id',             NEW.project_id,
      'name',                   NEW.name,
      'old_status',             OLD.status,
      'new_status',             NEW.status,
      'old_progress_percentage', OLD.progress_percentage,
      'new_progress_percentage', NEW.progress_percentage
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'project_work_items', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_work_item';
    v_details := jsonb_build_object(
      'project_id',          OLD.project_id,
      'name',                OLD.name,
      'status',              OLD.status,
      'progress_percentage', OLD.progress_percentage
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (OLD.company_id, auth.uid(), v_action, 'project_work_items', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_project_work_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.project_work_items
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_project_work_items_changes();

-- =====================
-- 7. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_pwi_company_id ON public.project_work_items(company_id);
CREATE INDEX idx_pwi_company_project ON public.project_work_items(company_id, project_id);
CREATE INDEX idx_pwi_company_status ON public.project_work_items(company_id, status);
CREATE INDEX idx_pwi_company_category ON public.project_work_items(company_id, category);
CREATE INDEX idx_pwi_company_progress ON public.project_work_items(company_id, progress_percentage);
