/**
 * Phase 7: Purchases Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company integrity triggers, deterministic
 * line item calculations, parent total synchronization, sequential company-scoped
 * purchase numbering, atomic RPC transaction function, audit logging triggers,
 * database indexes, financial corrections compliance (Rule 18), and scope boundaries for:
 * 1. Purchases table schema & constraints
 * 2. Purchase items table schema & constraints
 * 3. Company integrity and cross-company attack prevention
 * 4. Deterministic line-item calculations (amount = quantity * unit_price)
 * 5. Purchase total synchronization from items
 * 6. Company-scoped sequential purchase numbering (e.g. PUR-0001)
 * 7. Status constraints & lifecycle
 * 8. Company-scoped Row Level Security (RLS) & Owner-only draft deletion
 * 9. Audit logging triggers for purchases and purchase items
 * 10. Historical price preservation (actual purchase price vs catalog rates)
 * 11. Performance indexes
 * 12. TypeScript database types alignment
 * 13. Financial corrections & immutability compliance (DATABASE_RULES.md Rule 18)
 * 14. Scope integrity (no supplier payments, payment allocations, inventory, wages, or frontend code)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0008_PATH = join(ROOT, 'supabase', 'migrations', '0008_purchases.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration8 = existsSync(MIGRATION_0008_PATH)
  ? readFileSync(MIGRATION_0008_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. PURCHASE SCHEMA
// ============================================================

describe('A. Purchase Schema', () => {
  it('migration 0008 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0008_PATH)).toBe(true);
    expect(migration8.length).toBeGreaterThan(100);
  });

  it('creates public.purchases table', () => {
    expect(migration8).toContain('CREATE TABLE public.purchases');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration8).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration8).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration8).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires supplier_id referencing suppliers(id) ON DELETE RESTRICT', () => {
    expect(migration8).toContain('supplier_id     uuid NOT NULL');
    expect(migration8).toContain('REFERENCES public.suppliers(id) ON DELETE RESTRICT');
  });

  it('allows optional project_id referencing projects(id) ON DELETE SET NULL', () => {
    expect(migration8).toContain('project_id      uuid');
    expect(migration8).toContain('REFERENCES public.projects(id) ON DELETE SET NULL');
  });

  it('contains all required purchase fields', () => {
    const fields = [
      'purchase_number',
      'purchase_date',
      'invoice_number',
      'status',
      'discount',
      'tax',
      'total_amount',
      'due_date',
      'notes',
      'reversal_of_id',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration8).toContain(field);
    }
  });

  it('uses numeric(14,2) for discount, tax, and total_amount', () => {
    expect(migration8).toContain('discount        numeric(14,2) NOT NULL DEFAULT 0.00');
    expect(migration8).toContain('tax             numeric(14,2) NOT NULL DEFAULT 0.00');
    expect(migration8).toContain('total_amount    numeric(14,2) NOT NULL DEFAULT 0.00');
  });

  it('attaches updated_at trigger to purchases', () => {
    expect(migration8).toContain('CREATE TRIGGER purchases_updated_at');
    expect(migration8).toContain('BEFORE UPDATE ON public.purchases');
  });
});

// ============================================================
// B. PURCHASE ITEM SCHEMA
// ============================================================

describe('B. Purchase Item Schema', () => {
  it('creates public.purchase_items table', () => {
    expect(migration8).toContain('CREATE TABLE public.purchase_items');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration8).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires purchase_id referencing purchases(id) ON DELETE CASCADE', () => {
    expect(migration8).toContain('purchase_id uuid NOT NULL');
    expect(migration8).toContain('REFERENCES public.purchases(id) ON DELETE CASCADE');
  });

  it('requires material_id referencing materials(id) ON DELETE RESTRICT', () => {
    expect(migration8).toContain('material_id uuid NOT NULL');
    expect(migration8).toContain('REFERENCES public.materials(id) ON DELETE RESTRICT');
  });

  it('contains required purchase item fields', () => {
    const fields = [
      'quantity',
      'unit',
      'unit_price',
      'amount',
      'description',
      'notes',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration8).toContain(field);
    }
  });

  it('enforces positive quantity and non-negative unit_price and amount', () => {
    expect(migration8).toContain('CHECK (quantity > 0)');
    expect(migration8).toContain('CHECK (unit_price >= 0)');
    expect(migration8).toContain('CHECK (amount >= 0)');
  });

  it('attaches updated_at trigger to purchase_items', () => {
    expect(migration8).toContain('CREATE TRIGGER purchase_items_updated_at');
    expect(migration8).toContain('BEFORE UPDATE ON public.purchase_items');
  });
});

// ============================================================
// C. COMPANY INTEGRITY & COMPOSITE FOREIGN KEYS
// ============================================================

describe('C. Company Integrity & Foreign Keys', () => {
  it('enforces composite foreign key to suppliers: (company_id, supplier_id)', () => {
    expect(migration8).toContain('CONSTRAINT fk_purchases_supplier_company');
    expect(migration8).toContain('FOREIGN KEY (company_id, supplier_id)');
    expect(migration8).toContain('REFERENCES public.suppliers (company_id, id)');
  });

  it('enforces composite foreign key to projects: (company_id, project_id)', () => {
    expect(migration8).toContain('CONSTRAINT fk_purchases_project_company');
    expect(migration8).toContain('FOREIGN KEY (company_id, project_id)');
    expect(migration8).toContain('REFERENCES public.projects (company_id, id)');
  });

  it('enforces composite foreign key to reversal target: (company_id, reversal_of_id)', () => {
    expect(migration8).toContain('CONSTRAINT fk_purchases_reversal_company');
    expect(migration8).toContain('FOREIGN KEY (company_id, reversal_of_id)');
    expect(migration8).toContain('REFERENCES public.purchases (company_id, id)');
  });

  it('enforces composite foreign key to purchases: (company_id, purchase_id)', () => {
    expect(migration8).toContain('CONSTRAINT fk_purchase_items_purchase_company');
    expect(migration8).toContain('FOREIGN KEY (company_id, purchase_id)');
    expect(migration8).toContain('REFERENCES public.purchases (company_id, id)');
  });

  it('enforces composite foreign key to materials: (company_id, material_id)', () => {
    expect(migration8).toContain('CONSTRAINT fk_purchase_items_material_company');
    expect(migration8).toContain('FOREIGN KEY (company_id, material_id)');
    expect(migration8).toContain('REFERENCES public.materials (company_id, id)');
  });

  it('defines composite unique key on (company_id, id) for both tables', () => {
    expect(migration8).toContain('CONSTRAINT uq_purchases_company_id_id');
    expect(migration8).toContain('CONSTRAINT uq_purchase_items_company_id_id');
  });
});

// ============================================================
// D. CROSS-COMPANY ATTACK DEFENSE
// ============================================================

describe('D. Cross-Company Integrity Triggers', () => {
  it('defines validate_purchase_integrity trigger function', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.validate_purchase_integrity()');
    expect(migration8).toContain('Cross-company integrity violation: Supplier % does not belong to company %');
    expect(migration8).toContain('Cross-company integrity violation: Project % does not belong to company %');
    expect(migration8).toContain('Cross-company integrity violation: Reversal target purchase % does not belong to company %');
    expect(migration8).toContain('Financial integrity violation: A purchase cannot reverse itself');
  });

  it('attaches validate_purchase_integrity trigger to purchases', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_validate_purchase_integrity');
    expect(migration8).toContain('BEFORE INSERT OR UPDATE ON public.purchases');
  });

  it('defines validate_purchase_item_integrity trigger function', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.validate_purchase_item_integrity()');
    expect(migration8).toContain('Cross-company integrity violation: Material % does not belong to company %');
    expect(migration8).toContain('Cross-company integrity violation: Purchase % does not belong to company %');
  });

  it('attaches validate_purchase_item_integrity trigger to purchase_items', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_validate_purchase_item_integrity');
    expect(migration8).toContain('BEFORE INSERT OR UPDATE ON public.purchase_items');
  });
});

// ============================================================
// E. LINE CALCULATION (QUANTITY * UNIT_PRICE = AMOUNT)
// ============================================================

describe('E. Deterministic Line Item Calculation', () => {
  it('defines sync_purchase_item_amount function', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.sync_purchase_item_amount()');
    expect(migration8).toContain('NEW.amount := round(NEW.quantity * NEW.unit_price, 2);');
  });

  it('attaches sync_purchase_item_amount BEFORE INSERT OR UPDATE ON purchase_items', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_sync_purchase_item_amount');
    expect(migration8).toContain('BEFORE INSERT OR UPDATE ON public.purchase_items');
  });
});

// ============================================================
// F. PURCHASE TOTAL SYNCHRONIZATION
// ============================================================

describe('F. Purchase Total Synchronization', () => {
  it('defines recalculate_purchase_total function', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.recalculate_purchase_total()');
    expect(migration8).toContain('SELECT COALESCE(sum(amount), 0.00) INTO v_items_sum');
    expect(migration8).toContain('GREATEST(0.00, v_items_sum - COALESCE(v_discount, 0.00) + COALESCE(v_tax, 0.00))');
  });

  it('attaches recalculate_purchase_total AFTER INSERT OR UPDATE OR DELETE ON purchase_items', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_recalculate_purchase_total');
    expect(migration8).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items');
  });

  it('defines sync_purchase_header_totals to recalculate total when discount or tax changes', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.sync_purchase_header_totals()');
    expect(migration8).toContain('CREATE TRIGGER trg_sync_purchase_header_totals');
    expect(migration8).toContain('BEFORE UPDATE OF discount, tax ON public.purchases');
  });
});

// ============================================================
// G. PURCHASE NUMBERING
// ============================================================

describe('G. Company-Scoped Purchase Numbering', () => {
  it('enforces unique purchase_number within company', () => {
    expect(migration8).toContain('CONSTRAINT uq_purchases_company_number');
    expect(migration8).toContain('UNIQUE (company_id, purchase_number)');
  });

  it('defines handle_purchase_number trigger generating PUR-0001 format', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.handle_purchase_number()');
    expect(migration8).toContain("'PUR-' || lpad(v_next_num::text, 4, '0')");
  });

  it('attaches handle_purchase_number BEFORE INSERT ON purchases', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_handle_purchase_number');
    expect(migration8).toContain('BEFORE INSERT ON public.purchases');
  });
});

// ============================================================
// H. PURCHASE STATUS LIFECYCLE
// ============================================================

describe('H. Purchase Status Lifecycle', () => {
  it('enforces status in (Draft, Confirmed, Cancelled)', () => {
    expect(migration8).toContain("CHECK (status IN ('Draft', 'Confirmed', 'Cancelled'))");
    expect(migration8).toContain("DEFAULT 'Confirmed'");
  });
});

// ============================================================
// I. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('I. Row Level Security Policies', () => {
  it('enables RLS on purchases and purchase_items', () => {
    expect(migration8).toContain('ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;');
    expect(migration8).toContain('ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-isolated SELECT/INSERT/UPDATE for purchases', () => {
    expect(migration8).toContain('CREATE POLICY "Users can view company purchases"');
    expect(migration8).toContain('CREATE POLICY "Users can insert company purchases"');
    expect(migration8).toContain('CREATE POLICY "Users can update company purchases"');
    expect(migration8).toContain('company_id = public.current_company_id()');
  });

  it('restricts purchase deletion to owners on draft purchases only', () => {
    expect(migration8).toContain('CREATE POLICY "Owners can delete draft company purchases"');
    expect(migration8).toMatch(/company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)\s+AND status = 'Draft'/);
  });

  it('restricts purchase_items update and delete to draft purchases only', () => {
    expect(migration8).toContain('CREATE POLICY "Users can update draft purchase items"');
    expect(migration8).toContain('CREATE POLICY "Users can delete draft purchase items"');
    expect(migration8).toContain("p.status = 'Draft'");
  });

  it('does NOT contain permissive USING (true) or WITH CHECK (true)', () => {
    expect(migration8).not.toContain('USING (true)');
    expect(migration8).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// J. AUDIT LOGGING
// ============================================================

describe('J. Audit Logging Triggers', () => {
  it('defines audit_purchase_changes function and trigger', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.audit_purchase_changes()');
    expect(migration8).toContain("'create_purchase'");
    expect(migration8).toContain("'purchase_status_change'");
    expect(migration8).toContain("'update_purchase'");
    expect(migration8).toContain("'delete_purchase'");
    expect(migration8).toContain('CREATE TRIGGER trg_audit_purchase_changes');
    expect(migration8).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.purchases');
  });

  it('defines audit_purchase_item_changes function and trigger', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.audit_purchase_item_changes()');
    expect(migration8).toContain("'create_purchase_item'");
    expect(migration8).toContain("'update_purchase_item'");
    expect(migration8).toContain("'delete_purchase_item'");
    expect(migration8).toContain('CREATE TRIGGER trg_audit_purchase_item_changes');
    expect(migration8).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items');
  });

  it('all trigger and RPC functions enforce SECURITY DEFINER and search_path = public', () => {
    const lines = migration8.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration8.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// K. HISTORICAL PRICE PRESERVATION & ATOMIC RPC
// ============================================================

describe('K. Historical Price Preservation & Atomic RPC', () => {
  it('purchase_items stores explicit unit_price independent of materials catalog', () => {
    expect(migration8).toContain('unit_price  numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0)');
    expect(migration8).not.toContain('materials.standard_rate');
    expect(migration8).not.toContain('supplier_materials.supplier_rate');
  });

  it('defines atomic RPC create_purchase_transaction supporting reversal_of_id', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.create_purchase_transaction(');
    expect(migration8).toContain('p_supplier_id   uuid');
    expect(migration8).toContain('p_items         jsonb');
    expect(migration8).toContain('p_reversal_of_id uuid DEFAULT NULL');
  });
});

// ============================================================
// L. PERFORMANCE INDEXES
// ============================================================

describe('L. Performance Indexes', () => {
  it('creates performance indexes on purchases', () => {
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_id');
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_supplier');
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_project');
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_date');
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_status');
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_number');
    expect(migration8).toContain('CREATE INDEX idx_purchases_company_reversal');
  });

  it('creates performance indexes on purchase_items', () => {
    expect(migration8).toContain('CREATE INDEX idx_purchase_items_company_purchase');
    expect(migration8).toContain('CREATE INDEX idx_purchase_items_company_material');
  });
});

// ============================================================
// M. TYPESCRIPT DATABASE TYPES
// ============================================================

describe('M. TypeScript Database Types', () => {
  it('defines purchases table with reversal_of_id in Database interface', () => {
    expect(typesSource).toContain('purchases: {');
    expect(typesSource).toContain("status: 'Draft' | 'Confirmed' | 'Cancelled';");
    expect(typesSource).toContain('purchase_number: string;');
    expect(typesSource).toContain('supplier_id: string;');
    expect(typesSource).toContain('project_id: string | null;');
    expect(typesSource).toContain('reversal_of_id: string | null;');
    expect(typesSource).toContain('total_amount: number;');
  });

  it('defines purchase_items table in Database interface', () => {
    expect(typesSource).toContain('purchase_items: {');
    expect(typesSource).toContain('purchase_id: string;');
    expect(typesSource).toContain('material_id: string;');
    expect(typesSource).toContain('quantity: number;');
    expect(typesSource).toContain('unit_price: number;');
    expect(typesSource).toContain('amount: number;');
  });

  it('defines create_purchase_transaction with p_reversal_of_id in Functions interface', () => {
    expect(typesSource).toContain('create_purchase_transaction: {');
    expect(typesSource).toContain('p_reversal_of_id?: string | null;');
  });
});

// ============================================================
// N. FINANCIAL CORRECTIONS & IMMUTABILITY (DATABASE_RULES.md RULE 18 AUDIT)
// ============================================================

describe('N. Financial Corrections Compliance (Rule 18 Audit)', () => {
  it('defines prevent_completed_purchase_deletion trigger function', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_purchase_deletion()');
    expect(migration8).toContain('IF OLD.status != \'Draft\' THEN');
    expect(migration8).toContain('Financial integrity violation: Cannot delete % purchase %');
  });

  it('attaches prevent_completed_purchase_deletion trigger to purchases BEFORE DELETE', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_prevent_completed_purchase_deletion');
    expect(migration8).toContain('BEFORE DELETE ON public.purchases');
  });

  it('defines prevent_completed_purchase_item_modification trigger function', () => {
    expect(migration8).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_purchase_item_modification()');
    expect(migration8).toContain("IF v_status IS NOT NULL AND v_status != 'Draft' THEN");
    expect(migration8).toContain('Cannot delete line items from % purchase %');
    expect(migration8).toContain('Cannot modify line items of % purchase %');
  });

  it('attaches prevent_completed_purchase_item_modification trigger BEFORE UPDATE OR DELETE ON purchase_items', () => {
    expect(migration8).toContain('CREATE TRIGGER trg_prevent_completed_purchase_item_modification');
    expect(migration8).toContain('BEFORE UPDATE OR DELETE ON public.purchase_items');
  });

  it('supports reversal referencing: reversal_of_id references original purchase', () => {
    expect(migration8).toContain('reversal_of_id  uuid');
    expect(migration8).toContain('REFERENCES public.purchases(id) ON DELETE RESTRICT');
    expect(migration8).toContain('CONSTRAINT fk_purchases_reversal_company');
  });

  it('rejects self-reversal in validate_purchase_integrity', () => {
    expect(migration8).toContain('IF NEW.id IS NOT NULL AND NEW.id = NEW.reversal_of_id THEN');
    expect(migration8).toContain('Financial integrity violation: A purchase cannot reverse itself');
  });

  it('includes reversal_of_id in audit logging for financial tracking', () => {
    expect(migration8).toContain("'reversal_of_id', NEW.reversal_of_id");
  });
});

// ============================================================
// O. SCOPE INTEGRITY & BOUNDARY PROTECTION
// ============================================================

describe('O. Scope Integrity & Boundary Protection', () => {
  it('does NOT create future business tables in Phase 7', () => {
    const forbidden = [
      'CREATE TABLE public.supplier_payments',
      'CREATE TABLE public.payment_allocations',
      'CREATE TABLE public.inventory',
      'CREATE TABLE public.stock_movements',
      'CREATE TABLE public.material_consumption',
      'CREATE TABLE public.employees',
      'CREATE TABLE public.attendance',
      'CREATE TABLE public.daily_wages',
      'CREATE TABLE public.employee_advances',
      'CREATE TABLE public.employee_payments',
      'CREATE TABLE public.expenses',
      'CREATE TABLE public.customer_payments',
      'CREATE TABLE public.tasks',
      'CREATE TABLE public.work_progress',
      'CREATE TABLE public.daily_reports',
      'CREATE TABLE public.milestones',
    ];
    for (const table of forbidden) {
      expect(migration8).not.toContain(table);
    }
  });

  it('does NOT implement supplier payment, outstanding balance, or financial ledger logic in Phase 7', () => {
    const forbiddenPatterns = [
      'supplier_balance',
      'supplier_payable',
      'payment_allocation',
      'allocate_payment',
      'inventory_valuation',
      'calculate_profit',
      'project_profit',
    ];
    for (const term of forbiddenPatterns) {
      expect(migration8).not.toContain(term);
    }
  });
});
