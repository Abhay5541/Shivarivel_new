/**
 * Phase 8: Supplier Payments & Payment Allocations Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company and cross-supplier integrity triggers,
 * allocation invariant validations (over-allocation protection, positive amounts),
 * financial corrections and immutability (Rule 18), transaction-derived views,
 * atomic RPC transaction functions, audit logging triggers, database indexes,
 * and scope boundaries for:
 * 1. Supplier payments table schema & constraints
 * 2. Supplier payment allocations table schema & constraints
 * 3. Company isolation and cross-company attack prevention
 * 4. Cross-supplier allocation prevention
 * 5. Payment over-allocation prevention (allocations <= payment amount)
 * 6. Purchase over-allocation prevention (allocations <= purchase outstanding)
 * 7. Company-scoped sequential payment numbering (e.g. SP-0001)
 * 8. Status lifecycle & positive amount validations
 * 9. Financial corrections & immutability (DATABASE_RULES.md Rule 18)
 * 10. Derived financial views (v_purchase_balance & v_supplier_balance)
 * 11. Atomic financial RPC functions (record_supplier_payment & allocate_supplier_payment)
 * 12. Company-scoped Row Level Security (RLS) & Owner-only draft deletion
 * 13. Audit logging triggers for payments and allocations
 * 14. Performance indexes
 * 15. TypeScript database types alignment
 * 16. Scope integrity (no inventory, employees, wages, expenses, customer payments, or frontend code)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0009_PATH = join(ROOT, 'supabase', 'migrations', '0009_supplier_payments.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration9 = existsSync(MIGRATION_0009_PATH)
  ? readFileSync(MIGRATION_0009_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. SUPPLIER PAYMENT SCHEMA
// ============================================================

describe('A. Supplier Payment Schema', () => {
  it('migration 0009 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0009_PATH)).toBe(true);
    expect(migration9.length).toBeGreaterThan(100);
  });

  it('creates public.supplier_payments table', () => {
    expect(migration9).toContain('CREATE TABLE public.supplier_payments');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration9).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration9).toContain('company_id        uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration9).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires supplier_id referencing suppliers(id) ON DELETE RESTRICT', () => {
    expect(migration9).toContain('supplier_id       uuid NOT NULL');
    expect(migration9).toContain('REFERENCES public.suppliers(id) ON DELETE RESTRICT');
  });

  it('contains all required supplier payment fields', () => {
    const fields = [
      'payment_number',
      'payment_date',
      'amount',
      'payment_method',
      'reference_number',
      'status',
      'notes',
      'reversal_of_id',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration9).toContain(field);
    }
  });

  it('uses numeric(14,2) with strictly positive check for payment amount', () => {
    expect(migration9).toContain('amount            numeric(14,2) NOT NULL CHECK (amount > 0)');
  });

  it('attaches updated_at trigger to supplier_payments', () => {
    expect(migration9).toContain('CREATE TRIGGER supplier_payments_updated_at');
    expect(migration9).toContain('BEFORE UPDATE ON public.supplier_payments');
  });
});

// ============================================================
// B. PAYMENT NUMBERING
// ============================================================

describe('B. Company-Scoped Payment Numbering', () => {
  it('enforces unique payment_number within company', () => {
    expect(migration9).toContain('CONSTRAINT uq_supplier_payments_company_number');
    expect(migration9).toContain('UNIQUE (company_id, payment_number)');
  });

  it('defines handle_supplier_payment_number trigger generating SP-0001 format', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.handle_supplier_payment_number()');
    expect(migration9).toContain("'SP-' || lpad(v_next_num::text, 4, '0')");
  });

  it('attaches handle_supplier_payment_number BEFORE INSERT ON supplier_payments', () => {
    expect(migration9).toContain('CREATE TRIGGER trg_handle_supplier_payment_number');
    expect(migration9).toContain('BEFORE INSERT ON public.supplier_payments');
  });
});

// ============================================================
// C. PAYMENT ALLOCATION SCHEMA
// ============================================================

describe('C. Payment Allocation Schema', () => {
  it('creates public.supplier_payment_allocations table', () => {
    expect(migration9).toContain('CREATE TABLE public.supplier_payment_allocations');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration9).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires payment_id referencing supplier_payments(id)', () => {
    expect(migration9).toContain('payment_id  uuid NOT NULL');
    expect(migration9).toContain('REFERENCES public.supplier_payments(id)');
  });

  it('requires purchase_id referencing purchases(id) ON DELETE RESTRICT', () => {
    expect(migration9).toContain('purchase_id uuid NOT NULL');
    expect(migration9).toContain('REFERENCES public.purchases(id) ON DELETE RESTRICT');
  });

  it('enforces strictly positive allocation amount with numeric(14,2)', () => {
    expect(migration9).toContain('amount      numeric(14,2) NOT NULL CHECK (amount > 0)');
  });

  it('prevents duplicate allocation rows for same payment and purchase', () => {
    expect(migration9).toContain('CONSTRAINT uq_supplier_payment_allocations_payment_purchase');
    expect(migration9).toContain('UNIQUE (company_id, payment_id, purchase_id)');
  });
});

// ============================================================
// D. COMPANY INTEGRITY & COMPOSITE FOREIGN KEYS
// ============================================================

describe('D. Company Integrity & Composite Foreign Keys', () => {
  it('enforces composite foreign key to suppliers: (company_id, supplier_id)', () => {
    expect(migration9).toContain('CONSTRAINT fk_supplier_payments_supplier_company');
    expect(migration9).toContain('FOREIGN KEY (company_id, supplier_id)');
    expect(migration9).toContain('REFERENCES public.suppliers (company_id, id)');
  });

  it('enforces composite foreign key for reversal reference: (company_id, reversal_of_id)', () => {
    expect(migration9).toContain('CONSTRAINT fk_supplier_payments_reversal_company');
    expect(migration9).toContain('FOREIGN KEY (company_id, reversal_of_id)');
    expect(migration9).toContain('REFERENCES public.supplier_payments (company_id, id)');
  });

  it('enforces composite foreign key to supplier_payments: (company_id, payment_id)', () => {
    expect(migration9).toContain('CONSTRAINT fk_allocations_payment_company');
    expect(migration9).toContain('FOREIGN KEY (company_id, payment_id)');
    expect(migration9).toContain('REFERENCES public.supplier_payments (company_id, id)');
  });

  it('enforces composite foreign key to purchases: (company_id, purchase_id)', () => {
    expect(migration9).toContain('CONSTRAINT fk_allocations_purchase_company');
    expect(migration9).toContain('FOREIGN KEY (company_id, purchase_id)');
    expect(migration9).toContain('REFERENCES public.purchases (company_id, id)');
  });
});

// ============================================================
// E. CROSS-COMPANY & CROSS-SUPPLIER ATTACK PREVENTION
// ============================================================

describe('E. Cross-Company & Cross-Supplier Attack Prevention', () => {
  it('defines validate_supplier_payment_integrity trigger function', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.validate_supplier_payment_integrity()');
    expect(migration9).toContain('Cross-company integrity violation: Supplier % does not belong to company %');
    expect(migration9).toContain('Cross-company integrity violation: Reversal target payment % does not belong to company %');
    expect(migration9).toContain('Financial integrity violation: A payment cannot reverse itself');
  });

  it('attaches validate_supplier_payment_integrity trigger to supplier_payments', () => {
    expect(migration9).toContain('CREATE TRIGGER trg_validate_supplier_payment_integrity');
    expect(migration9).toContain('BEFORE INSERT OR UPDATE ON public.supplier_payments');
  });

  it('enforces payment supplier equals purchase supplier in validate_payment_allocation_invariants', () => {
    expect(migration9).toContain('Cross-supplier allocation violation: Payment supplier % does not match purchase supplier %');
  });

  it('enforces company matching between payment, purchase, and allocation', () => {
    expect(migration9).toContain('Cross-company integrity violation: Payment % does not belong to company %');
    expect(migration9).toContain('Cross-company integrity violation: Purchase % does not belong to company %');
  });
});

// ============================================================
// F. OVER-ALLOCATION PROTECTION & INVARIANTS
// ============================================================

describe('F. Over-Allocation Protection & Invariants', () => {
  it('defines validate_payment_allocation_invariants trigger function', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.validate_payment_allocation_invariants()');
  });

  it('attaches validate_payment_allocation_invariants trigger to supplier_payment_allocations', () => {
    expect(migration9).toContain('CREATE TRIGGER trg_validate_payment_allocation_invariants');
    expect(migration9).toContain('BEFORE INSERT OR UPDATE ON public.supplier_payment_allocations');
  });

  it('enforces total allocations cannot exceed payment amount', () => {
    expect(migration9).toContain('Payment over-allocation: Total allocations (%) exceed payment amount (%)');
  });

  it('enforces allocation amount cannot exceed purchase outstanding balance', () => {
    expect(migration9).toContain('Purchase over-allocation: Allocation amount (%) exceeds purchase outstanding balance (%)');
  });

  it('rejects allocations to non-confirmed purchases', () => {
    expect(migration9).toContain('Financial validation error: Cannot allocate payment to a % purchase. Purchase must be Confirmed');
  });

  it('rejects allocations from cancelled payments', () => {
    expect(migration9).toContain('Financial validation error: Cannot allocate from a Cancelled payment');
  });
});

// ============================================================
// G. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
// ============================================================

describe('G. Financial Corrections & Immutability (Rule 18)', () => {
  it('defines prevent_completed_supplier_payment_deletion trigger function', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_supplier_payment_deletion()');
    expect(migration9).toContain("IF OLD.status != 'Draft' THEN");
    expect(migration9).toContain('Financial integrity violation: Cannot delete % supplier payment %');
  });

  it('attaches prevent_completed_supplier_payment_deletion trigger to supplier_payments BEFORE DELETE', () => {
    expect(migration9).toContain('CREATE TRIGGER trg_prevent_completed_supplier_payment_deletion');
    expect(migration9).toContain('BEFORE DELETE ON public.supplier_payments');
  });

  it('defines prevent_completed_allocation_modification trigger function', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_allocation_modification()');
    expect(migration9).toContain("IF v_status IS NOT NULL AND v_status != 'Draft' THEN");
    expect(migration9).toContain('Cannot delete allocations from % supplier payment %');
    expect(migration9).toContain('Cannot modify allocations of % supplier payment %');
  });

  it('attaches prevent_completed_allocation_modification trigger to supplier_payment_allocations', () => {
    expect(migration9).toContain('CREATE TRIGGER trg_prevent_completed_allocation_modification');
    expect(migration9).toContain('BEFORE UPDATE OR DELETE ON public.supplier_payment_allocations');
  });

  it('supports reversal referencing on supplier_payments', () => {
    expect(migration9).toContain('reversal_of_id    uuid');
    expect(migration9).toContain('REFERENCES public.supplier_payments(id) ON DELETE RESTRICT');
  });
});

// ============================================================
// H. TRANSACTION-DERIVED FINANCIAL VIEWS
// ============================================================

describe('H. Transaction-Derived Financial Views', () => {
  it('defines v_purchase_balance view matching DATABASE_RULES.md Section 19', () => {
    expect(migration9).toContain('CREATE OR REPLACE VIEW public.v_purchase_balance AS');
    expect(migration9).toContain('total_allocated');
    expect(migration9).toContain('outstanding_balance');
    expect(migration9).toContain("FILTER (WHERE sp.status = 'Confirmed')");
  });

  it('defines v_supplier_balance view matching DATABASE_RULES.md Section 19', () => {
    expect(migration9).toContain('CREATE OR REPLACE VIEW public.v_supplier_balance AS');
    expect(migration9).toContain('total_purchases');
    expect(migration9).toContain('total_allocated_payments');
    expect(migration9).toContain('outstanding_balance');
    expect(migration9).toContain("WHERE status = 'Confirmed'");
  });
});

// ============================================================
// I. ATOMIC FINANCIAL RPC FUNCTIONS
// ============================================================

describe('I. Atomic Financial RPC Functions', () => {
  it('defines record_supplier_payment function', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.record_supplier_payment(');
    expect(migration9).toContain('p_supplier_id       uuid');
    expect(migration9).toContain('p_amount            numeric');
    expect(migration9).toContain('p_allocations       jsonb');
    expect(migration9).toContain('p_reversal_of_id    uuid DEFAULT NULL');
  });

  it('defines allocate_supplier_payment function', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.allocate_supplier_payment(');
    expect(migration9).toContain('p_payment_id  uuid');
    expect(migration9).toContain('p_purchase_id uuid');
    expect(migration9).toContain('p_amount      numeric');
  });

  it('all trigger and RPC functions enforce SECURITY DEFINER and search_path = public', () => {
    const lines = migration9.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration9.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// J. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('J. Row Level Security Policies', () => {
  it('enables RLS on supplier_payments and supplier_payment_allocations', () => {
    expect(migration9).toContain('ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;');
    expect(migration9).toContain('ALTER TABLE public.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-isolated SELECT/INSERT/UPDATE for supplier_payments', () => {
    expect(migration9).toContain('CREATE POLICY "Users can view company supplier payments"');
    expect(migration9).toContain('CREATE POLICY "Users can insert company supplier payments"');
    expect(migration9).toContain('CREATE POLICY "Users can update company supplier payments"');
    expect(migration9).toContain('company_id = public.current_company_id()');
  });

  it('restricts supplier payment deletion to owners on draft payments only', () => {
    expect(migration9).toContain('CREATE POLICY "Owners can delete draft company supplier payments"');
    expect(migration9).toMatch(/company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)\s+AND status = 'Draft'/);
  });

  it('restricts allocation deletion and updates to draft payments only', () => {
    expect(migration9).toContain('CREATE POLICY "Users can update draft payment allocations"');
    expect(migration9).toContain('CREATE POLICY "Users can delete draft payment allocations"');
    expect(migration9).toContain("sp.status = 'Draft'");
  });

  it('does NOT contain permissive USING (true) or WITH CHECK (true)', () => {
    expect(migration9).not.toContain('USING (true)');
    expect(migration9).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// K. AUDIT LOGGING
// ============================================================

describe('K. Audit Logging Triggers', () => {
  it('defines audit_supplier_payment_changes function and trigger', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.audit_supplier_payment_changes()');
    expect(migration9).toContain("'create_supplier_payment'");
    expect(migration9).toContain("'supplier_payment_status_change'");
    expect(migration9).toContain("'update_supplier_payment'");
    expect(migration9).toContain("'delete_supplier_payment'");
    expect(migration9).toContain('CREATE TRIGGER trg_audit_supplier_payment_changes');
    expect(migration9).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payments');
  });

  it('defines audit_payment_allocation_changes function and trigger', () => {
    expect(migration9).toContain('CREATE OR REPLACE FUNCTION public.audit_payment_allocation_changes()');
    expect(migration9).toContain("'create_payment_allocation'");
    expect(migration9).toContain("'update_payment_allocation'");
    expect(migration9).toContain("'delete_payment_allocation'");
    expect(migration9).toContain('CREATE TRIGGER trg_audit_payment_allocation_changes');
    expect(migration9).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payment_allocations');
  });
});

// ============================================================
// L. PERFORMANCE INDEXES
// ============================================================

describe('L. Performance Indexes', () => {
  it('creates performance indexes on supplier_payments', () => {
    expect(migration9).toContain('CREATE INDEX idx_supplier_payments_company_id');
    expect(migration9).toContain('CREATE INDEX idx_supplier_payments_company_supplier');
    expect(migration9).toContain('CREATE INDEX idx_supplier_payments_company_date');
    expect(migration9).toContain('CREATE INDEX idx_supplier_payments_company_status');
    expect(migration9).toContain('CREATE INDEX idx_supplier_payments_company_number');
    expect(migration9).toContain('CREATE INDEX idx_supplier_payments_company_reversal');
  });

  it('creates performance indexes on supplier_payment_allocations', () => {
    expect(migration9).toContain('CREATE INDEX idx_allocations_company_payment');
    expect(migration9).toContain('CREATE INDEX idx_allocations_company_purchase');
  });
});

// ============================================================
// M. TYPESCRIPT DATABASE TYPES
// ============================================================

describe('M. TypeScript Database Types', () => {
  it('defines supplier_payments table in Database interface', () => {
    expect(typesSource).toContain('supplier_payments: {');
    expect(typesSource).toContain("status: 'Draft' | 'Confirmed' | 'Cancelled';");
    expect(typesSource).toContain('payment_number: string;');
    expect(typesSource).toContain('supplier_id: string;');
    expect(typesSource).toContain('amount: number;');
    expect(typesSource).toContain('reversal_of_id: string | null;');
  });

  it('defines supplier_payment_allocations table in Database interface', () => {
    expect(typesSource).toContain('supplier_payment_allocations: {');
    expect(typesSource).toContain('payment_id: string;');
    expect(typesSource).toContain('purchase_id: string;');
    expect(typesSource).toContain('amount: number;');
  });

  it('defines derived financial views in Database Views interface', () => {
    expect(typesSource).toContain('v_purchase_balance: {');
    expect(typesSource).toContain('v_supplier_balance: {');
  });

  it('defines financial RPCs in Functions interface', () => {
    expect(typesSource).toContain('record_supplier_payment: {');
    expect(typesSource).toContain('allocate_supplier_payment: {');
  });
});

// ============================================================
// N. SCOPE INTEGRITY & BOUNDARY PROTECTION
// ============================================================

describe('N. Scope Integrity & Boundary Protection', () => {
  it('does NOT create future business tables in Phase 8', () => {
    const forbidden = [
      'CREATE TABLE public.inventory',
      'CREATE TABLE public.stock_movements',
      'CREATE TABLE public.material_consumption',
      'CREATE TABLE public.warehouse_balance',
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
      expect(migration9).not.toContain(table);
    }
  });

  it('does NOT calculate profit or inventory valuations in Phase 8', () => {
    const forbidden = [
      'calculate_profit',
      'gross_profit',
      'net_profit',
      'profit_margin',
      'inventory_valuation',
      'fifo_valuation',
      'lifo_valuation',
    ];
    for (const term of forbidden) {
      expect(migration9).not.toContain(term);
    }
  });
});
