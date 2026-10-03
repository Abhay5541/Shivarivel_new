-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 6: Suppliers & Materials Backend Migration
-- =============================================================================
-- This migration establishes master data for procurement:
--   - public.suppliers table (company-scoped vendor directory)
--   - public.materials table (company-scoped material catalog)
--   - public.supplier_materials table (supplier-material catalog links & reference rates)
--   - composite foreign keys guaranteeing cross-company isolation
--   - validation triggers for cross-company integrity
--   - RLS policies enforcing tenant isolation
--   - audit logging triggers using the existing audit_log infrastructure
--   - performance indexes for common access patterns
--
-- DESIGN DECISIONS:
-- 1. Suppliers and Materials are master catalog data, NOT transactional accounting records.
--    No vendor balances, purchase transactions, or stock tracking records are created.
-- 2. GST is stored as text and is optional (not all small vendors are GST-registered).
-- 3. standard_rate and supplier_rate are catalog reference rates (numeric(14,2)).
-- 4. Hard deletion of master records is restricted to active owners;
--    operational workflows prefer status deactivation ('inactive').
-- =============================================================================

-- =====================
-- 1. SUPPLIERS TABLE
-- =====================

CREATE TABLE public.suppliers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  name            text NOT NULL CHECK (char_length(trim(name)) > 0),
  contact_person  text,
  phone           text,
  alternate_phone text,
  email           text,
  address         text,
  gst_number      text,
  category        text,
  notes           text,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite foreign key referencing
  CONSTRAINT uq_suppliers_company_id_id
    UNIQUE (company_id, id)
);

COMMENT ON TABLE public.suppliers IS
  'Suppliers and vendors providing materials and subcontractor services. Company-scoped.';

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. MATERIALS TABLE
-- =====================

CREATE TABLE public.materials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL DEFAULT public.current_company_id()
                REFERENCES public.companies(id) ON DELETE RESTRICT,
  name          text NOT NULL CHECK (char_length(trim(name)) > 0),
  category      text NOT NULL CHECK (char_length(trim(category)) > 0),
  unit          text NOT NULL DEFAULT 'nos' CHECK (char_length(trim(unit)) > 0),
  standard_rate numeric(14,2) CHECK (standard_rate IS NULL OR standard_rate >= 0),
  description   text,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite foreign key referencing
  CONSTRAINT uq_materials_company_id_id
    UNIQUE (company_id, id)
);

COMMENT ON TABLE public.materials IS
  'Reusable catalog of construction, interior, electrical, and plumbing materials. Company-scoped.';

CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. SUPPLIER MATERIALS JUNCTION TABLE
-- =====================

CREATE TABLE public.supplier_materials (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL DEFAULT public.current_company_id()
                          REFERENCES public.companies(id) ON DELETE RESTRICT,
  supplier_id             uuid NOT NULL
                          REFERENCES public.suppliers(id) ON DELETE CASCADE,
  material_id             uuid NOT NULL
                          REFERENCES public.materials(id) ON DELETE CASCADE,
  supplier_material_code  text,
  supplier_rate           numeric(14,2) CHECK (supplier_rate IS NULL OR supplier_rate >= 0),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Constraint 1: composite unique to avoid duplicate vendor-material mappings
  CONSTRAINT uq_supplier_materials_unique
    UNIQUE (company_id, supplier_id, material_id),

  -- Constraint 2: composite FK to suppliers ensuring supplier belongs to same company
  CONSTRAINT fk_supplier_materials_supplier_company
    FOREIGN KEY (company_id, supplier_id)
    REFERENCES public.suppliers (company_id, id)
    ON DELETE CASCADE,

  -- Constraint 3: composite FK to materials ensuring material belongs to same company
  CONSTRAINT fk_supplier_materials_material_company
    FOREIGN KEY (company_id, material_id)
    REFERENCES public.materials (company_id, id)
    ON DELETE CASCADE
);

COMMENT ON TABLE public.supplier_materials IS
  'Junction mapping materials available from specific suppliers with reference pricing. Company-scoped.';

CREATE TRIGGER supplier_materials_updated_at
  BEFORE UPDATE ON public.supplier_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 4. CROSS-COMPANY INTEGRITY TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.validate_supplier_material_integrity()
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

  -- 2. Ensure material belongs to same company
  IF NOT EXISTS (
    SELECT 1 FROM public.materials
    WHERE id = NEW.material_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Material % does not belong to company %',
      NEW.material_id, NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_supplier_material_integrity() IS
  'Trigger function ensuring supplier_materials associations belong strictly to the same company.';

CREATE TRIGGER trg_validate_supplier_material_integrity
  BEFORE INSERT OR UPDATE ON public.supplier_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_supplier_material_integrity();

-- =====================
-- 5. RLS POLICIES
-- =====================

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_materials ENABLE ROW LEVEL SECURITY;

-- 5a. Suppliers RLS
CREATE POLICY "Users can view company suppliers"
  ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company suppliers"
  ON public.suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company suppliers"
  ON public.suppliers
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company suppliers"
  ON public.suppliers
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- 5b. Materials RLS
CREATE POLICY "Users can view company materials"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company materials"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company materials"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete company materials"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id() AND public.is_owner());

-- 5c. Supplier Materials RLS
CREATE POLICY "Users can view company supplier materials"
  ON public.supplier_materials
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company supplier materials"
  ON public.supplier_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company supplier materials"
  ON public.supplier_materials
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can delete company supplier materials"
  ON public.supplier_materials
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_company_id());

-- =====================
-- 6. AUDIT LOGGING TRIGGERS
-- =====================

-- 6a. Supplier Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_supplier_changes()
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
    v_action := 'create_supplier';
    v_details := jsonb_build_object(
      'name', NEW.name,
      'contact_person', NEW.contact_person,
      'phone', NEW.phone,
      'gst_number', NEW.gst_number,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'supplier_status_change';
    ELSE
      v_action := 'update_supplier';
    END IF;

    v_details := jsonb_build_object(
      'name', NEW.name,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'contact_person', NEW.contact_person,
      'phone', NEW.phone
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_supplier';
    v_details := jsonb_build_object(
      'name', OLD.name,
      'phone', OLD.phone
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
      'supplier',
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
    'supplier',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_supplier_changes() IS
  'Audits supplier creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_supplier_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_supplier_changes();

-- 6b. Material Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_material_changes()
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
    v_action := 'create_material';
    v_details := jsonb_build_object(
      'name', NEW.name,
      'category', NEW.category,
      'unit', NEW.unit,
      'standard_rate', NEW.standard_rate,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'material_status_change';
    ELSE
      v_action := 'update_material';
    END IF;

    v_details := jsonb_build_object(
      'name', NEW.name,
      'category', NEW.category,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'standard_rate', NEW.standard_rate
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_material';
    v_details := jsonb_build_object(
      'name', OLD.name,
      'category', OLD.category
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
      'material',
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
    'material',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_material_changes() IS
  'Audits material creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_material_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_material_changes();

-- 6c. Supplier Material Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_supplier_material_changes()
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
    v_action := 'create_supplier_material';
    v_details := jsonb_build_object(
      'supplier_id', NEW.supplier_id,
      'material_id', NEW.material_id,
      'supplier_rate', NEW.supplier_rate
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_supplier_material';
    v_details := jsonb_build_object(
      'supplier_id', NEW.supplier_id,
      'material_id', NEW.material_id,
      'old_rate', OLD.supplier_rate,
      'new_rate', NEW.supplier_rate
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_supplier_material';
    v_details := jsonb_build_object(
      'supplier_id', OLD.supplier_id,
      'material_id', OLD.material_id
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
      'supplier_material',
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
    'supplier_material',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_supplier_material_changes() IS
  'Audits supplier-material junction mapping creation, updates, and deletions.';

CREATE TRIGGER trg_audit_supplier_material_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_supplier_material_changes();

-- =====================
-- 7. INDEXES
-- =====================

-- Suppliers indexes
CREATE INDEX idx_suppliers_company_id
  ON public.suppliers (company_id);

CREATE INDEX idx_suppliers_company_name
  ON public.suppliers (company_id, name);

CREATE INDEX idx_suppliers_company_status
  ON public.suppliers (company_id, status);

-- Materials indexes
CREATE INDEX idx_materials_company_id
  ON public.materials (company_id);

CREATE INDEX idx_materials_company_name
  ON public.materials (company_id, name);

CREATE INDEX idx_materials_company_category
  ON public.materials (company_id, category);

CREATE INDEX idx_materials_company_status
  ON public.materials (company_id, status);

-- Supplier Materials indexes
CREATE INDEX idx_supplier_materials_company_supplier
  ON public.supplier_materials (company_id, supplier_id);

CREATE INDEX idx_supplier_materials_company_material
  ON public.supplier_materials (company_id, material_id);
