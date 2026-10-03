-- =============================================================================
-- Migration 0016: My Day / Tasks / Follow-ups Module
-- Phase 15: Operational Work Management & Command Center
--
-- This migration establishes operational work-management tracking:
--   - public.tasks table (concrete actions: call, visit, estimate, order, review)
--   - public.follow_ups table (scheduled customer/enquiry/project interactions)
--   - Composite foreign keys enforcing company-scoped relationship integrity
--   - Triggers for timestamp tracking, validation, and auto-populating completed_at
--   - Operational views & RPCs for My Day (v_my_day, get_my_day)
--   - Safe completion RPCs (complete_task, complete_follow_up)
--   - Row Level Security (RLS) policies enforcing multi-tenant isolation
--   - Audit logging triggers using existing audit_log infrastructure
--   - Performance indexes for operational and query access
--
-- OPERATIONAL PRINCIPLES:
-- 1. My Day is the owner's operational command center ("What do I deal with today?").
-- 2. It surfaces active work grouped into OVERDUE, TODAY, and UPCOMING.
-- 3. Completed and cancelled records remain historically preserved.
-- 4. Tasks and follow-ups are work records, NOT financial transactions.
--    They do NOT alter purchases, wages, advances, expenses, or customer receipts.
-- =============================================================================

-- =====================
-- 0. PREREQUISITE COMPOSITE UNIQUE CONSTRAINTS
-- =====================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_enquiries_company_id_id'
  ) THEN
    EXECUTE 'ALTER TABLE ONLY ' || 'public.enquiries ADD CONSTRAINT uq_enquiries_company_id_id UNIQUE (company_id, id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_site_visits_company_id_id'
  ) THEN
    EXECUTE 'ALTER TABLE ONLY ' || 'public.site_visits ADD CONSTRAINT uq_site_visits_company_id_id UNIQUE (company_id, id)';
  END IF;
END $$;

-- =====================
-- 1. TASKS TABLE
-- =====================

CREATE TABLE public.tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  title           text NOT NULL CHECK (char_length(trim(title)) > 0),
  description     text,
  category        text,
  priority        text NOT NULL DEFAULT 'Medium'
                  CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status          text NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  due_date        date,
  task_date       date NOT NULL DEFAULT CURRENT_DATE,
  assigned_to     uuid
                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_id     uuid
                  REFERENCES public.customers(id) ON DELETE SET NULL,
  project_id      uuid
                  REFERENCES public.projects(id) ON DELETE SET NULL,
  enquiry_id      uuid
                  REFERENCES public.enquiries(id) ON DELETE SET NULL,
  site_visit_id   uuid
                  REFERENCES public.site_visits(id) ON DELETE SET NULL,
  completed_at    timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_tasks_company_id_id
    UNIQUE (company_id, id),

  -- Composite foreign key to customers: customer must belong to same company
  CONSTRAINT fk_tasks_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to projects: project must belong to same company
  CONSTRAINT fk_tasks_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to enquiries: enquiry must belong to same company
  CONSTRAINT fk_tasks_enquiry_company
    FOREIGN KEY (company_id, enquiry_id)
    REFERENCES public.enquiries (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to site visits: site visit must belong to same company
  CONSTRAINT fk_tasks_site_visit_company
    FOREIGN KEY (company_id, site_visit_id)
    REFERENCES public.site_visits (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to assigned profile: assigned user must belong to same company
  CONSTRAINT fk_tasks_assigned_profile_company
    FOREIGN KEY (company_id, assigned_to)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.tasks IS
  'Actionable business and operational tasks for jobs, site visits, and projects. Company-scoped.';

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. FOLLOW-UPS TABLE
-- =====================

CREATE TABLE public.follow_ups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id     uuid NOT NULL
                  REFERENCES public.customers(id) ON DELETE RESTRICT,
  enquiry_id      uuid
                  REFERENCES public.enquiries(id) ON DELETE SET NULL,
  project_id      uuid
                  REFERENCES public.projects(id) ON DELETE SET NULL,
  follow_up_date  date NOT NULL,
  title           text NOT NULL CHECK (char_length(trim(title)) > 0),
  notes           text,
  status          text NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
  assigned_to     uuid
                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite FK referencing
  CONSTRAINT uq_follow_ups_company_id_id
    UNIQUE (company_id, id),

  -- Composite foreign key to customers: customer must belong to same company
  CONSTRAINT fk_follow_ups_customer_company
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to enquiries: enquiry must belong to same company and customer
  CONSTRAINT fk_follow_ups_enquiry_customer_company
    FOREIGN KEY (company_id, customer_id, enquiry_id)
    REFERENCES public.enquiries (company_id, customer_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to projects: project must belong to same company and customer
  CONSTRAINT fk_follow_ups_project_customer_company
    FOREIGN KEY (company_id, customer_id, project_id)
    REFERENCES public.projects (company_id, customer_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to assigned profile: assigned user must belong to same company
  CONSTRAINT fk_follow_ups_assigned_profile_company
    FOREIGN KEY (company_id, assigned_to)
    REFERENCES public.profiles (company_id, id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.follow_ups IS
  'Scheduled customer and project follow-up interactions. Company-scoped.';

CREATE TRIGGER follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. VALIDATION & INTEGRITY TRIGGERS
-- =====================

-- 3a. Tasks validation trigger
CREATE OR REPLACE FUNCTION public.validate_task_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure non-blank title
  IF trim(NEW.title) = '' THEN
    RAISE EXCEPTION 'Validation error: Task title cannot be blank';
  END IF;

  -- 2. Validate customer & project consistency
  IF NEW.customer_id IS NOT NULL AND NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.project_id AND customer_id = NEW.customer_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Customer/Project mismatch: Project % does not belong to customer %',
        NEW.project_id, NEW.customer_id;
    END IF;
  END IF;

  -- 3. Validate customer & enquiry consistency
  IF NEW.customer_id IS NOT NULL AND NEW.enquiry_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.enquiries
      WHERE id = NEW.enquiry_id AND customer_id = NEW.customer_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Customer/Enquiry mismatch: Enquiry % does not belong to customer %',
        NEW.enquiry_id, NEW.customer_id;
    END IF;
  END IF;

  -- 4. Manage completed_at
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  ELSIF NEW.status != 'Completed' THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_task_integrity() IS
  'Validates task title, cross-entity customer/project/enquiry alignment, and completed_at timestamp.';

CREATE TRIGGER trg_validate_task_integrity
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_task_integrity();

-- 3b. Follow-ups validation trigger
CREATE OR REPLACE FUNCTION public.validate_follow_up_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure non-blank title
  IF trim(NEW.title) = '' THEN
    RAISE EXCEPTION 'Validation error: Follow-up title cannot be blank';
  END IF;

  -- 2. Manage completed_at
  IF NEW.status = 'Completed' AND (OLD IS NULL OR OLD.status != 'Completed') AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  ELSIF NEW.status != 'Completed' THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_follow_up_integrity() IS
  'Validates follow-up title and completed_at timestamp.';

CREATE TRIGGER trg_validate_follow_up_integrity
  BEFORE INSERT OR UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_follow_up_integrity();

-- =====================
-- 4. ATOMIC COMPLETION RPC FUNCTIONS
-- =====================

-- 4a. complete_task: Safely completes a task
CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_id uuid,
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
  FROM public.tasks
  WHERE id = p_task_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found', p_task_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot complete a cancelled task %', p_task_id;
  END IF;

  UPDATE public.tasks
  SET
    status = 'Completed',
    completed_at = now(),
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Completion: ' || p_notes
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_task_id AND company_id = v_company_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.complete_task(uuid, text) IS
  'Completes a task, recording completion timestamp and notes. Company-scoped.';

-- 4b. complete_follow_up: Safely completes a follow-up
CREATE OR REPLACE FUNCTION public.complete_follow_up(
  p_follow_up_id uuid,
  p_notes        text DEFAULT NULL
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
  FROM public.follow_ups
  WHERE id = p_follow_up_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Follow-up % not found', p_follow_up_id;
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot complete a cancelled follow-up %', p_follow_up_id;
  END IF;

  UPDATE public.follow_ups
  SET
    status = 'Completed',
    completed_at = now(),
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Completion: ' || p_notes
      ELSE notes
    END,
    updated_at = now()
  WHERE id = p_follow_up_id AND company_id = v_company_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.complete_follow_up(uuid, text) IS
  'Completes a follow-up, recording completion timestamp and notes. Company-scoped.';

-- =====================
-- 5. MY DAY UNIFIED OPERATIONAL VIEW
-- =====================

CREATE OR REPLACE VIEW public.v_my_day AS
-- 1. Active Tasks with Due Dates
SELECT
  t.company_id,
  'task' AS item_type,
  t.id AS item_id,
  t.title,
  t.due_date AS date,
  t.priority,
  t.status,
  CASE
    WHEN t.due_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN t.due_date = CURRENT_DATE THEN 'TODAY'
    ELSE 'UPCOMING'
  END AS urgency,
  t.customer_id,
  c.name AS customer_name,
  t.project_id,
  p.project_code,
  p.name AS project_name,
  t.assigned_to,
  prof.full_name AS assigned_name,
  t.notes
FROM public.tasks t
LEFT JOIN public.customers c ON c.id = t.customer_id AND c.company_id = t.company_id
LEFT JOIN public.projects p ON p.id = t.project_id AND p.company_id = t.company_id
LEFT JOIN public.profiles prof ON prof.id = t.assigned_to AND prof.company_id = t.company_id
WHERE t.status IN ('Pending', 'In Progress')
  AND t.due_date IS NOT NULL

UNION ALL

-- 2. Pending Follow-ups
SELECT
  f.company_id,
  'follow_up' AS item_type,
  f.id AS item_id,
  f.title,
  f.follow_up_date AS date,
  'Medium' AS priority,
  f.status,
  CASE
    WHEN f.follow_up_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN f.follow_up_date = CURRENT_DATE THEN 'TODAY'
    ELSE 'UPCOMING'
  END AS urgency,
  f.customer_id,
  c.name AS customer_name,
  f.project_id,
  p.project_code,
  p.name AS project_name,
  f.assigned_to,
  prof.full_name AS assigned_name,
  f.notes
FROM public.follow_ups f
JOIN public.customers c ON c.id = f.customer_id AND c.company_id = f.company_id
LEFT JOIN public.projects p ON p.id = f.project_id AND p.company_id = f.company_id
LEFT JOIN public.profiles prof ON prof.id = f.assigned_to AND prof.company_id = f.company_id
WHERE f.status = 'Pending'

UNION ALL

-- 3. Scheduled Site Visits
SELECT
  sv.company_id,
  'site_visit' AS item_type,
  sv.id AS item_id,
  COALESCE(sv.purpose, 'Site Visit for ' || c.name) AS title,
  sv.visit_date AS date,
  'High' AS priority,
  sv.status,
  CASE
    WHEN sv.visit_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN sv.visit_date = CURRENT_DATE THEN 'TODAY'
    ELSE 'UPCOMING'
  END AS urgency,
  sv.customer_id,
  c.name AS customer_name,
  NULL::uuid AS project_id,
  NULL::text AS project_code,
  NULL::text AS project_name,
  sv.assigned_to,
  prof.full_name AS assigned_name,
  sv.notes
FROM public.site_visits sv
JOIN public.customers c ON c.id = sv.customer_id AND c.company_id = sv.company_id
LEFT JOIN public.profiles prof ON prof.id = sv.assigned_to AND prof.company_id = sv.company_id
WHERE sv.status = 'Scheduled';

COMMENT ON VIEW public.v_my_day IS
  'Unified operational view combining active Tasks, Follow-ups, and scheduled Site Visits. Company-scoped.';

-- =====================
-- 6. MY DAY OPERATIONAL RPC
-- =====================

CREATE OR REPLACE FUNCTION public.get_my_day(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_overdue    jsonb;
  v_today      jsonb;
  v_upcoming   jsonb;
  v_counts     jsonb;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  -- 1. OVERDUE items
  SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
  INTO v_overdue
  FROM (
    SELECT * FROM public.v_my_day
    WHERE company_id = v_company_id
      AND date < p_date
    ORDER BY date ASC, priority DESC
  ) m;

  -- 2. TODAY items
  SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
  INTO v_today
  FROM (
    SELECT * FROM public.v_my_day
    WHERE company_id = v_company_id
      AND date = p_date
    ORDER BY priority DESC, title ASC
  ) m;

  -- 3. UPCOMING items (next 7 days)
  SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
  INTO v_upcoming
  FROM (
    SELECT * FROM public.v_my_day
    WHERE company_id = v_company_id
      AND date > p_date
      AND date <= (p_date + interval '7 days')
    ORDER BY date ASC, priority DESC
  ) m;

  -- 4. Counts breakdown
  SELECT jsonb_build_object(
    'overdue_tasks', (SELECT COUNT(*) FROM public.tasks WHERE company_id = v_company_id AND status IN ('Pending', 'In Progress') AND due_date < p_date),
    'today_tasks', (SELECT COUNT(*) FROM public.tasks WHERE company_id = v_company_id AND status IN ('Pending', 'In Progress') AND due_date = p_date),
    'overdue_follow_ups', (SELECT COUNT(*) FROM public.follow_ups WHERE company_id = v_company_id AND status = 'Pending' AND follow_up_date < p_date),
    'today_follow_ups', (SELECT COUNT(*) FROM public.follow_ups WHERE company_id = v_company_id AND status = 'Pending' AND follow_up_date = p_date),
    'today_site_visits', (SELECT COUNT(*) FROM public.site_visits WHERE company_id = v_company_id AND status = 'Scheduled' AND visit_date = p_date)
  ) INTO v_counts;

  RETURN jsonb_build_object(
    'date', p_date,
    'overdue', v_overdue,
    'today', v_today,
    'upcoming', v_upcoming,
    'counts', v_counts
  );
END;
$$;

COMMENT ON FUNCTION public.get_my_day(date) IS
  'Returns complete My Day operational command center payload grouped into OVERDUE, TODAY, and UPCOMING.';

-- =====================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- 7a. Tasks RLS
CREATE POLICY "Users can view company tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- 7b. Follow-ups RLS
CREATE POLICY "Users can view company follow-ups"
  ON public.follow_ups
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company follow-ups"
  ON public.follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company follow-ups"
  ON public.follow_ups
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company follow-ups"
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
  );

-- =====================
-- 8. AUDIT LOGGING TRIGGERS
-- =====================

-- 8a. Tasks audit trigger
CREATE OR REPLACE FUNCTION public.audit_task_changes()
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
    v_action := 'create_task';
    v_details := jsonb_build_object(
      'title', NEW.title,
      'priority', NEW.priority,
      'status', NEW.status,
      'due_date', NEW.due_date,
      'project_id', NEW.project_id,
      'customer_id', NEW.customer_id
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'tasks', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Completed' AND NEW.status = 'Completed' THEN
      v_action := 'complete_task';
    ELSIF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_task';
    ELSE
      v_action := 'update_task';
    END IF;

    v_details := jsonb_build_object(
      'title', NEW.title,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'due_date', NEW.due_date
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'tasks', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_task';
    v_details := jsonb_build_object('title', OLD.title, 'status', OLD.status);
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (OLD.company_id, auth.uid(), v_action, 'tasks', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_task_changes();

-- 8b. Follow-ups audit trigger
CREATE OR REPLACE FUNCTION public.audit_follow_up_changes()
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
    v_action := 'create_follow_up';
    v_details := jsonb_build_object(
      'title', NEW.title,
      'customer_id', NEW.customer_id,
      'follow_up_date', NEW.follow_up_date,
      'status', NEW.status,
      'enquiry_id', NEW.enquiry_id,
      'project_id', NEW.project_id
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'follow_ups', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'Completed' AND NEW.status = 'Completed' THEN
      v_action := 'complete_follow_up';
    ELSIF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
      v_action := 'cancel_follow_up';
    ELSE
      v_action := 'update_follow_up';
    END IF;

    v_details := jsonb_build_object(
      'title', NEW.title,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'follow_up_date', NEW.follow_up_date
    );
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.company_id, auth.uid(), v_action, 'follow_ups', NEW.id, v_details);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_follow_up';
    v_details := jsonb_build_object('title', OLD.title, 'status', OLD.status);
    INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (OLD.company_id, auth.uid(), v_action, 'follow_ups', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_follow_up_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_follow_up_changes();

-- =====================
-- 9. PERFORMANCE INDEXES
-- =====================

-- Tasks Indexes
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_tasks_company_due_date ON public.tasks(company_id, due_date);
CREATE INDEX idx_tasks_company_status ON public.tasks(company_id, status);
CREATE INDEX idx_tasks_company_priority ON public.tasks(company_id, priority);
CREATE INDEX idx_tasks_company_assigned ON public.tasks(company_id, assigned_to);
CREATE INDEX idx_tasks_company_project ON public.tasks(company_id, project_id);
CREATE INDEX idx_tasks_company_customer ON public.tasks(company_id, customer_id);

-- Follow-ups Indexes
CREATE INDEX idx_follow_ups_company_id ON public.follow_ups(company_id);
CREATE INDEX idx_follow_ups_company_date ON public.follow_ups(company_id, follow_up_date);
CREATE INDEX idx_follow_ups_company_status ON public.follow_ups(company_id, status);
CREATE INDEX idx_follow_ups_company_assigned ON public.follow_ups(company_id, assigned_to);
CREATE INDEX idx_follow_ups_company_customer ON public.follow_ups(company_id, customer_id);
CREATE INDEX idx_follow_ups_company_project ON public.follow_ups(company_id, project_id);
CREATE INDEX idx_follow_ups_company_enquiry ON public.follow_ups(company_id, enquiry_id);
