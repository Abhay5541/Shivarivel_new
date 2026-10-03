-- =============================================================================
-- ShivariVel Construction & Interiors
-- Phase 7: Purchases Backend Migration
-- =============================================================================
-- This migration establishes actual cost/purchase transactions:
--   - public.purchases table (purchase transaction header)
--   - public.purchase_items table (line-item materials purchased)
--   - company-scoped sequential purchase numbering (e.g. PUR-0001)
--   - deterministic line amount calculation (quantity * unit_price)
--   - automatic parent purchase total synchronization
--   - composite foreign keys guaranteeing cross-company isolation
--   - validation triggers for cross-company integrity
--   - atomic RPC create_purchase_transaction
--   - RLS policies enforcing tenant isolation and owner-only deletion
--   - audit logging triggers using the existing audit_log infrastructure
--   - performance indexes for common access patterns
--
-- DESIGN DECISIONS:
-- 1. Purchases represent actual procurement transactions, not catalog reference rates.
--    unit_price preserves the actual transaction price at purchase time, completely
--    independent of future changes to master catalog rates or supplier rates.
-- 2. No supplier payment logic, payment allocations, inventory movements,
--    or project profit calculations are created in this phase.
-- 3. Hard deletion of recorded purchases is restricted to active owners.
-- =============================================================================

-- =====================
-- 1. PURCHASES TABLE
-- =====================

CREATE TABLE public.purchases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL DEFAULT public.current_company_id()
                  REFERENCES public.companies(id) ON DELETE RESTRICT,
  supplier_id     uuid NOT NULL
                  REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  project_id      uuid
                  REFERENCES public.projects(id) ON DELETE SET NULL,
  purchase_number text NOT NULL,
  purchase_date   date NOT NULL DEFAULT CURRENT_DATE,
  invoice_number  text,
  status          text NOT NULL DEFAULT 'Confirmed'
                  CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  discount        numeric(14,2) NOT NULL DEFAULT 0.00
                  CHECK (discount >= 0),
  tax             numeric(14,2) NOT NULL DEFAULT 0.00
                  CHECK (tax >= 0),
  total_amount    numeric(14,2) NOT NULL DEFAULT 0.00
                  CHECK (total_amount >= 0),
  due_date        date,
  notes           text,
  reversal_of_id  uuid
                  REFERENCES public.purchases(id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite foreign key referencing
  CONSTRAINT uq_purchases_company_id_id
    UNIQUE (company_id, id),

  -- Unique purchase number within the company
  CONSTRAINT uq_purchases_company_number
    UNIQUE (company_id, purchase_number),

  -- Composite foreign key to suppliers: supplier must belong to same company
  CONSTRAINT fk_purchases_supplier_company
    FOREIGN KEY (company_id, supplier_id)
    REFERENCES public.suppliers (company_id, id)
    ON DELETE RESTRICT,

  -- Composite foreign key to projects: project must belong to same company (if specified)
  CONSTRAINT fk_purchases_project_company
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects (company_id, id)
    ON DELETE SET NULL,

  -- Composite foreign key to reversal target: must belong to same company
  CONSTRAINT fk_purchases_reversal_company
    FOREIGN KEY (company_id, reversal_of_id)
    REFERENCES public.purchases (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.purchases IS
  'Material and service purchases from suppliers. Actual cost records, optionally linked to projects. Company-scoped.';

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. PURCHASE ITEMS TABLE
-- =====================

CREATE TABLE public.purchase_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL DEFAULT public.current_company_id()
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  purchase_id uuid NOT NULL
              REFERENCES public.purchases(id) ON DELETE CASCADE,
  material_id uuid NOT NULL
              REFERENCES public.materials(id) ON DELETE RESTRICT,
  description text,
  quantity    numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit        text NOT NULL DEFAULT 'nos' CHECK (char_length(trim(unit)) > 0),
  unit_price  numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  amount      numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key on (company_id, id) for composite referencing
  CONSTRAINT uq_purchase_items_company_id_id
    UNIQUE (company_id, id),

  -- Composite foreign key: ensures item belongs to the same company as the purchase
  CONSTRAINT fk_purchase_items_purchase_company
    FOREIGN KEY (company_id, purchase_id)
    REFERENCES public.purchases (company_id, id)
    ON DELETE CASCADE,

  -- Composite foreign key: ensures item material belongs to the same company
  CONSTRAINT fk_purchase_items_material_company
    FOREIGN KEY (company_id, material_id)
    REFERENCES public.materials (company_id, id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.purchase_items IS
  'Line-item materials purchased with transaction quantities and actual purchase prices. Company-scoped.';

CREATE TRIGGER purchase_items_updated_at
  BEFORE UPDATE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. NUMBERING TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.handle_purchase_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num bigint;
BEGIN
  IF NEW.purchase_number IS NULL OR trim(NEW.purchase_number) = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_num
    FROM public.purchases
    WHERE company_id = NEW.company_id;

    NEW.purchase_number := 'PUR-' || lpad(v_next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_purchase_number() IS
  'Generates company-scoped sequential purchase numbers (e.g. PUR-0001) if not explicitly set.';

CREATE TRIGGER trg_handle_purchase_number
  BEFORE INSERT ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_number();

-- =====================
-- 4. CROSS-COMPANY INTEGRITY TRIGGERS
-- =====================

CREATE OR REPLACE FUNCTION public.validate_purchase_integrity()
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

  -- 2. If project_id is provided, verify it belongs to same company
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = NEW.project_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Project % does not belong to company %',
        NEW.project_id, NEW.company_id;
    END IF;
  END IF;

  -- 3. If reversal_of_id is provided, verify it belongs to same company
  IF NEW.reversal_of_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.purchases
      WHERE id = NEW.reversal_of_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-company integrity violation: Reversal target purchase % does not belong to company %',
        NEW.reversal_of_id, NEW.company_id;
    END IF;

    IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN
      RAISE EXCEPTION 'Financial integrity violation: A purchase cannot reverse itself';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_purchase_integrity() IS
  'Trigger function ensuring purchases maintain strict company alignment with suppliers and projects.';

CREATE TRIGGER trg_validate_purchase_integrity
  BEFORE INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_purchase_integrity();

CREATE OR REPLACE FUNCTION public.validate_purchase_item_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure material belongs to same company
  IF NOT EXISTS (
    SELECT 1 FROM public.materials
    WHERE id = NEW.material_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Material % does not belong to company %',
      NEW.material_id, NEW.company_id;
  END IF;

  -- 2. Ensure purchase belongs to same company
  IF NOT EXISTS (
    SELECT 1 FROM public.purchases
    WHERE id = NEW.purchase_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Cross-company integrity violation: Purchase % does not belong to company %',
      NEW.purchase_id, NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_purchase_item_integrity() IS
  'Trigger function ensuring purchase items maintain strict company alignment with materials and purchases.';

CREATE TRIGGER trg_validate_purchase_item_integrity
  BEFORE INSERT OR UPDATE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_purchase_item_integrity();

-- =====================
-- 5. DETERMINISTIC LINE CALCULATION & TOTAL SYNCHRONIZATION
-- =====================

-- Deterministic line-item amount calculation before insert/update
CREATE OR REPLACE FUNCTION public.sync_purchase_item_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compute item amount from quantity and unit_price
  NEW.amount := round(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_purchase_item_amount() IS
  'Computes purchase line item amount deterministically (quantity * unit_price) before insert/update.';

CREATE TRIGGER trg_sync_purchase_item_amount
  BEFORE INSERT OR UPDATE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_purchase_item_amount();

-- Recalculate parent purchase total_amount after item insert/update/delete
CREATE OR REPLACE FUNCTION public.recalculate_purchase_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id uuid;
  v_items_sum numeric(14,2);
  v_discount numeric(14,2);
  v_tax numeric(14,2);
  v_new_total numeric(14,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_purchase_id := OLD.purchase_id;
  ELSE
    v_purchase_id := NEW.purchase_id;
  END IF;

  SELECT COALESCE(sum(amount), 0.00) INTO v_items_sum
  FROM public.purchase_items
  WHERE purchase_id = v_purchase_id;

  SELECT COALESCE(discount, 0.00), COALESCE(tax, 0.00)
  INTO v_discount, v_tax
  FROM public.purchases
  WHERE id = v_purchase_id;

  v_new_total := GREATEST(0.00, v_items_sum - COALESCE(v_discount, 0.00) + COALESCE(v_tax, 0.00));

  UPDATE public.purchases
  SET total_amount = v_new_total,
      updated_at = now()
  WHERE id = v_purchase_id;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.recalculate_purchase_total() IS
  'Recalculates and updates purchase total_amount whenever purchase items change.';

CREATE TRIGGER trg_recalculate_purchase_total
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_purchase_total();

-- Synchronize total when discount or tax on purchase header changes
CREATE OR REPLACE FUNCTION public.sync_purchase_header_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_sum numeric(14,2);
BEGIN
  IF (OLD.discount IS DISTINCT FROM NEW.discount) OR (OLD.tax IS DISTINCT FROM NEW.tax) THEN
    SELECT COALESCE(sum(amount), 0.00) INTO v_items_sum
    FROM public.purchase_items
    WHERE purchase_id = NEW.id;

    NEW.total_amount := GREATEST(0.00, v_items_sum - COALESCE(NEW.discount, 0.00) + COALESCE(NEW.tax, 0.00));
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_purchase_header_totals() IS
  'Recalculates total_amount on purchase header when discount or tax values are updated.';

CREATE TRIGGER trg_sync_purchase_header_totals
  BEFORE UPDATE OF discount, tax ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_purchase_header_totals();

-- =====================
-- 5b. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
-- =====================

-- Prevent physical deletion of completed financial transactions (Rule 18: Never delete completed financial transactions to correct mistakes)
CREATE OR REPLACE FUNCTION public.prevent_completed_purchase_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'Draft' THEN
    RAISE EXCEPTION 'Financial integrity violation: Cannot delete % purchase %. Completed financial transactions must be preserved (use status cancellation or reversal)',
      OLD.status, OLD.purchase_number;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_purchase_deletion() IS
  'Enforces Rule 18: completed financial transactions (Confirmed/Cancelled) cannot be physically deleted.';

CREATE TRIGGER trg_prevent_completed_purchase_deletion
  BEFORE DELETE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_purchase_deletion();

-- Prevent deletion or modification of line items on completed financial transactions
CREATE OR REPLACE FUNCTION public.prevent_completed_purchase_item_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_purchase_num text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT status, purchase_number INTO v_status, v_purchase_num
    FROM public.purchases
    WHERE id = OLD.purchase_id;

    IF v_status IS NOT NULL AND v_status != 'Draft' THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot delete line items from % purchase %. Recorded transactions are immutable',
        v_status, v_purchase_num;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT status, purchase_number INTO v_status, v_purchase_num
    FROM public.purchases
    WHERE id = OLD.purchase_id;

    IF v_status IS NOT NULL AND v_status != 'Draft' THEN
      RAISE EXCEPTION 'Financial integrity violation: Cannot modify line items of % purchase %. Recorded transactions are immutable',
        v_status, v_purchase_num;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_completed_purchase_item_modification() IS
  'Enforces immutability: purchase items of Confirmed or Cancelled purchases cannot be modified or deleted.';

CREATE TRIGGER trg_prevent_completed_purchase_item_modification
  BEFORE UPDATE OR DELETE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_completed_purchase_item_modification();

-- =====================
-- 6. ATOMIC TRANSACTION RPC
-- =====================

CREATE OR REPLACE FUNCTION public.create_purchase_transaction(
  p_supplier_id   uuid,
  p_project_id    uuid DEFAULT NULL,
  p_purchase_date date DEFAULT CURRENT_DATE,
  p_invoice_number text DEFAULT NULL,
  p_discount      numeric DEFAULT 0.00,
  p_tax           numeric DEFAULT 0.00,
  p_due_date      date DEFAULT NULL,
  p_notes         text DEFAULT NULL,
  p_status        text DEFAULT 'Confirmed',
  p_items         jsonb DEFAULT '[]'::jsonb,
  p_reversal_of_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_purchase_id uuid;
  v_item        jsonb;
  v_material_id uuid;
  v_qty         numeric;
  v_unit_price  numeric;
  v_unit        text;
  v_desc        text;
  v_notes       text;
BEGIN
  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no active company context';
  END IF;

  -- 1. Insert purchase header initially as Draft so items can be attached safely
  INSERT INTO public.purchases (
    company_id,
    supplier_id,
    project_id,
    purchase_date,
    invoice_number,
    status,
    discount,
    tax,
    due_date,
    notes,
    reversal_of_id
  )
  VALUES (
    v_company_id,
    p_supplier_id,
    p_project_id,
    COALESCE(p_purchase_date, CURRENT_DATE),
    p_invoice_number,
    'Draft',
    COALESCE(p_discount, 0.00),
    COALESCE(p_tax, 0.00),
    p_due_date,
    p_notes,
    p_reversal_of_id
  )
  RETURNING id INTO v_purchase_id;

  -- 2. Insert line items if provided
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_material_id := (v_item->>'material_id')::uuid;
      v_qty         := (v_item->>'quantity')::numeric;
      v_unit_price  := (v_item->>'unit_price')::numeric;
      v_unit        := COALESCE(v_item->>'unit', 'nos');
      v_desc        := v_item->>'description';
      v_notes       := v_item->>'notes';

      IF v_material_id IS NULL OR v_qty IS NULL OR v_qty <= 0 THEN
        RAISE EXCEPTION 'Invalid purchase item: material_id and positive quantity are required';
      END IF;

      INSERT INTO public.purchase_items (
        company_id,
        purchase_id,
        material_id,
        description,
        quantity,
        unit,
        unit_price,
        notes
      )
      VALUES (
        v_company_id,
        v_purchase_id,
        v_material_id,
        v_desc,
        v_qty,
        v_unit,
        COALESCE(v_unit_price, 0.00),
        v_notes
      );
    END LOOP;
  END IF;

  -- 3. Transition to target status if not Draft
  IF p_status IS DISTINCT FROM 'Draft' THEN
    UPDATE public.purchases
    SET status = COALESCE(p_status, 'Confirmed'),
        updated_at = now()
    WHERE id = v_purchase_id;
  END IF;

  RETURN v_purchase_id;
END;
$$;

COMMENT ON FUNCTION public.create_purchase_transaction(uuid, uuid, date, text, numeric, numeric, date, text, text, jsonb, uuid) IS
  'Atomically creates a purchase record along with its line items within the current company.';

-- =====================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- 7a. Purchases RLS
CREATE POLICY "Users can view company purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company purchases"
  ON public.purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update company purchases"
  ON public.purchases
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Owners can delete draft company purchases"
  ON public.purchases
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_owner()
    AND status = 'Draft'
  );

-- 7b. Purchase Items RLS
CREATE POLICY "Users can view company purchase items"
  ON public.purchase_items
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Users can insert company purchase items"
  ON public.purchase_items
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can update draft purchase items"
  ON public.purchase_items
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_items.purchase_id
        AND p.company_id = public.current_company_id()
        AND p.status = 'Draft'
    )
  )
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Users can delete draft purchase items"
  ON public.purchase_items
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_items.purchase_id
        AND p.company_id = public.current_company_id()
        AND p.status = 'Draft'
    )
  );

-- =====================
-- 8. AUDIT LOGGING TRIGGERS
-- =====================

-- 8a. Purchases Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_purchase_changes()
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
    v_action := 'create_purchase';
    v_details := jsonb_build_object(
       'purchase_number', NEW.purchase_number,
       'supplier_id', NEW.supplier_id,
       'project_id', NEW.project_id,
       'purchase_date', NEW.purchase_date,
       'invoice_number', NEW.invoice_number,
       'status', NEW.status,
       'total_amount', NEW.total_amount,
       'reversal_of_id', NEW.reversal_of_id
     );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'purchase_status_change';
    ELSE
      v_action := 'update_purchase';
    END IF;

    v_details := jsonb_build_object(
       'purchase_number', NEW.purchase_number,
       'old_status', OLD.status,
       'new_status', NEW.status,
       'old_total', OLD.total_amount,
       'new_total', NEW.total_amount,
       'supplier_id', NEW.supplier_id,
       'project_id', NEW.project_id,
       'reversal_of_id', NEW.reversal_of_id
     );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_purchase';
    v_details := jsonb_build_object(
      'purchase_number', OLD.purchase_number,
      'supplier_id', OLD.supplier_id,
      'project_id', OLD.project_id,
      'total_amount', OLD.total_amount
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
      'purchase',
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
    'purchase',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_purchase_changes() IS
  'Audits purchase creation, status changes, updates, and deletions.';

CREATE TRIGGER trg_audit_purchase_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_purchase_changes();

-- 8b. Purchase Items Audit Trigger
CREATE OR REPLACE FUNCTION public.audit_purchase_item_changes()
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
    v_action := 'create_purchase_item';
    v_details := jsonb_build_object(
      'purchase_id', NEW.purchase_id,
      'material_id', NEW.material_id,
      'quantity', NEW.quantity,
      'unit_price', NEW.unit_price,
      'amount', NEW.amount
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_purchase_item';
    v_details := jsonb_build_object(
      'purchase_id', NEW.purchase_id,
      'material_id', NEW.material_id,
      'old_quantity', OLD.quantity,
      'new_quantity', NEW.quantity,
      'old_amount', OLD.amount,
      'new_amount', NEW.amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_purchase_item';
    v_details := jsonb_build_object(
      'purchase_id', OLD.purchase_id,
      'material_id', OLD.material_id,
      'amount', OLD.amount
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
      'purchase_item',
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
    'purchase_item',
    NEW.id,
    v_details
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_purchase_item_changes() IS
  'Audits purchase line items creation, updates, and deletions.';

CREATE TRIGGER trg_audit_purchase_item_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_purchase_item_changes();

-- =====================
-- 9. PERFORMANCE INDEXES
-- =====================

CREATE INDEX idx_purchases_company_id
  ON public.purchases (company_id);

CREATE INDEX idx_purchases_company_supplier
  ON public.purchases (company_id, supplier_id);

CREATE INDEX idx_purchases_company_project
  ON public.purchases (company_id, project_id);

CREATE INDEX idx_purchases_company_date
  ON public.purchases (company_id, purchase_date);

CREATE INDEX idx_purchases_company_status
  ON public.purchases (company_id, status);

CREATE INDEX idx_purchases_company_number
  ON public.purchases (company_id, purchase_number);

CREATE INDEX idx_purchases_company_reversal
  ON public.purchases (company_id, reversal_of_id);

CREATE INDEX idx_purchase_items_company_purchase
  ON public.purchase_items (company_id, purchase_id);

CREATE INDEX idx_purchase_items_company_material
  ON public.purchase_items (company_id, material_id);
