/**
 * Phase 4: Estimates Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company & customer integrity triggers,
 * deterministic total calculation, auto-numbering, indexes, and audit logging for:
 * 1. Estimates parent table schema & constraints
 * 2. Estimate items child table schema & categorization
 * 3. Cross-company integrity & cross-customer mismatch prevention
 * 4. Deterministic line-item amount & estimate total synchronization
 * 5. Company-scoped sequential estimate numbering
 * 6. Company-scoped Row Level Security (RLS)
 * 7. Audit logging on estimate mutations & status transitions
 * 8. Scope integrity (no projects, suppliers, payments, or financial logic)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0005_PATH = join(ROOT, 'supabase', 'migrations', '0005_estimates.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration5 = existsSync(MIGRATION_0005_PATH)
  ? readFileSync(MIGRATION_0005_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// 1. ESTIMATES TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('Estimates Schema & Constraints', () => {
  it('migration 0005 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0005_PATH)).toBe(true);
    expect(migration5.length).toBeGreaterThan(100);
  });

  it('creates public.estimates table', () => {
    expect(migration5).toContain('CREATE TABLE public.estimates');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration5).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration5).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration5).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires customer_id referencing customers(id) ON DELETE RESTRICT', () => {
    expect(migration5).toContain('customer_id     uuid NOT NULL');
    expect(migration5).toContain('REFERENCES public.customers(id) ON DELETE RESTRICT');
  });

  it('enquiry_id is optional and references enquiries(id) ON DELETE SET NULL', () => {
    expect(migration5).toContain('enquiry_id      uuid');
    expect(migration5).toContain('REFERENCES public.enquiries(id) ON DELETE SET NULL');
  });

  it('contains all required fields', () => {
    const requiredFields = [
      'estimate_number',
      'estimate_date',
      'valid_until',
      'title',
      'notes',
      'status',
      'total_amount',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      expect(migration5).toContain(field);
    }
  });

  it('estimate_date and valid_until use date type', () => {
    expect(migration5).toContain('estimate_date   date NOT NULL DEFAULT CURRENT_DATE');
    expect(migration5).toContain('valid_until     date');
  });

  it('total_amount uses numeric(14,2) with non-negative check', () => {
    expect(migration5).toContain('total_amount    numeric(14,2) NOT NULL DEFAULT 0.00');
    expect(migration5).toContain('CHECK (total_amount >= 0)');
  });

  it('status enforces the approved lifecycle states with default Draft', () => {
    const approvedStatuses = ['Draft', 'Sent', 'Approved', 'Accepted', 'Rejected', 'Expired', 'Converted'];
    for (const status of approvedStatuses) {
      expect(migration5).toContain(`'${status}'`);
    }
    expect(migration5).toContain("status          text NOT NULL DEFAULT 'Draft'");
  });

  it('attaches updated_at trigger function', () => {
    expect(migration5).toContain('CREATE TRIGGER estimates_updated_at');
    expect(migration5).toContain('BEFORE UPDATE ON public.estimates');
    expect(migration5).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// 2. ESTIMATE ITEMS SCHEMA & CONSTRAINTS
// ============================================================

describe('Estimate Items Schema & Constraints', () => {
  it('creates public.estimate_items table', () => {
    expect(migration5).toContain('CREATE TABLE public.estimate_items');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    const itemDef = migration5.substring(
      migration5.indexOf('CREATE TABLE public.estimate_items'),
      migration5.indexOf(');', migration5.indexOf('CREATE TABLE public.estimate_items'))
    );
    expect(itemDef).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires estimate_id referencing estimates(id) ON DELETE CASCADE', () => {
    expect(migration5).toContain('estimate_id uuid NOT NULL');
    expect(migration5).toContain('REFERENCES public.estimates(id) ON DELETE CASCADE');
  });

  it('enforces approved MVP estimate categories', () => {
    const categories = ['Material', 'Labour', 'Electrical', 'Plumbing', 'Interior', 'Other'];
    for (const cat of categories) {
      expect(migration5).toContain(`'${cat}'`);
    }
  });

  it('line item numeric constraints are strict and non-negative', () => {
    expect(migration5).toContain('quantity    numeric(12,3) NOT NULL DEFAULT 1.000 CHECK (quantity > 0)');
    expect(migration5).toContain('unit_price  numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0)');
    expect(migration5).toContain('amount      numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0)');
  });

  it('description is validated to not be blank', () => {
    expect(migration5).toContain('CHECK (char_length(trim(description)) > 0)');
  });

  it('estimate_items has updated_at trigger', () => {
    expect(migration5).toContain('CREATE TRIGGER estimate_items_updated_at');
    expect(migration5).toContain('BEFORE UPDATE ON public.estimate_items');
    expect(migration5).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// 3. CROSS-COMPANY & CUSTOMER INTEGRITY
// ============================================================

describe('Cross-Company & Customer Integrity Enforcement', () => {
  it('adds composite unique constraint on estimates (company_id, id)', () => {
    expect(migration5).toContain('CONSTRAINT uq_estimates_company_id_id');
    expect(migration5).toContain('UNIQUE (company_id, id)');
  });

  it('enforces composite foreign key on customer belonging to same company', () => {
    expect(migration5).toContain('CONSTRAINT fk_estimates_customer_company');
    expect(migration5).toContain('FOREIGN KEY (company_id, customer_id)');
    expect(migration5).toContain('REFERENCES public.customers (company_id, id)');
  });

  it('enforces composite foreign key on enquiry belonging to same company AND customer', () => {
    expect(migration5).toContain('CONSTRAINT fk_estimates_enquiry_company_customer');
    expect(migration5).toContain('FOREIGN KEY (company_id, customer_id, enquiry_id)');
    expect(migration5).toContain('REFERENCES public.enquiries (company_id, customer_id, id)');
  });

  it('enforces composite foreign key on estimate_items belonging to same company', () => {
    expect(migration5).toContain('CONSTRAINT fk_estimate_items_estimate_company');
    expect(migration5).toContain('FOREIGN KEY (company_id, estimate_id)');
    expect(migration5).toContain('REFERENCES public.estimates (company_id, id)');
  });

  it('provides validate_estimate_integrity trigger function with descriptive error exceptions', () => {
    expect(migration5).toContain('CREATE OR REPLACE FUNCTION public.validate_estimate_integrity()');
    expect(migration5).toContain('Cross-company integrity violation: Customer');
    expect(migration5).toContain('Integrity violation: Enquiry % does not belong to company % and customer %');
  });

  it('attaches validate_estimate_integrity BEFORE INSERT OR UPDATE on estimates', () => {
    expect(migration5).toContain('CREATE TRIGGER trg_validate_estimate_integrity');
    expect(migration5).toContain('BEFORE INSERT OR UPDATE ON public.estimates');
    expect(migration5).toContain('EXECUTE FUNCTION public.validate_estimate_integrity()');
  });

  it('validate_estimate_integrity uses SECURITY DEFINER with search_path = public', () => {
    const fnDef = migration5.substring(
      migration5.indexOf('FUNCTION public.validate_estimate_integrity()'),
      migration5.indexOf('$$;', migration5.indexOf('FUNCTION public.validate_estimate_integrity()'))
    );
    expect(fnDef).toContain('SECURITY DEFINER');
    expect(fnDef).toContain('SET search_path = public');
  });
});

// ============================================================
// 4. NUMBERING & TOTAL CALCULATION
// ============================================================

describe('Estimate Numbering & Deterministic Totals', () => {
  it('enforces company-scoped unique estimate numbers', () => {
    expect(migration5).toContain('CONSTRAINT uq_estimates_company_estimate_number');
    expect(migration5).toContain('UNIQUE (company_id, estimate_number)');
  });

  it('defines handle_estimate_number auto-generation trigger function', () => {
    expect(migration5).toContain('CREATE OR REPLACE FUNCTION public.handle_estimate_number()');
    expect(migration5).toContain("'EST-' || lpad(v_next_num::text, 4, '0')");
    expect(migration5).toContain('CREATE TRIGGER trg_handle_estimate_number');
    expect(migration5).toContain('BEFORE INSERT ON public.estimates');
  });

  it('defines sync_estimate_totals to compute line item amounts deterministically', () => {
    expect(migration5).toContain('CREATE OR REPLACE FUNCTION public.sync_estimate_totals()');
    expect(migration5).toContain('round(NEW.quantity * NEW.unit_price, 2)');
    expect(migration5).toContain('CREATE TRIGGER trg_sync_estimate_item_amount');
    expect(migration5).toContain('BEFORE INSERT OR UPDATE ON public.estimate_items');
  });

  it('defines recalculate_estimate_total trigger to update parent estimate total_amount', () => {
    expect(migration5).toContain('CREATE OR REPLACE FUNCTION public.recalculate_estimate_total()');
    expect(migration5).toContain('SELECT COALESCE(sum(amount), 0.00) INTO v_new_total');
    expect(migration5).toContain('UPDATE public.estimates');
    expect(migration5).toContain('CREATE TRIGGER trg_recalculate_estimate_total');
    expect(migration5).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.estimate_items');
  });
});

// ============================================================
// 5. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('Row Level Security for Estimates & Estimate Items', () => {
  it('enables RLS on both estimates and estimate_items', () => {
    expect(migration5).toContain('ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY');
    expect(migration5).toContain('ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY');
  });

  it('enforces company isolation on estimates SELECT, INSERT, UPDATE', () => {
    expect(migration5).toContain('CREATE POLICY "Users can view company estimates"');
    expect(migration5).toContain('CREATE POLICY "Users can insert company estimates"');
    expect(migration5).toContain('CREATE POLICY "Users can update company estimates"');
  });

  it('restricts estimate deletion to owners only', () => {
    expect(migration5).toContain('CREATE POLICY "Owners can delete company estimates"');
    expect(migration5).toMatch(/Owners can delete company estimates[\s\S]*?company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('enforces company isolation on estimate_items SELECT, INSERT, UPDATE, DELETE', () => {
    expect(migration5).toContain('CREATE POLICY "Users can view company estimate items"');
    expect(migration5).toContain('CREATE POLICY "Users can insert company estimate items"');
    expect(migration5).toContain('CREATE POLICY "Users can update company estimate items"');
    expect(migration5).toContain('CREATE POLICY "Users can delete company estimate items"');
  });

  it('does NOT contain USING (true) or WITH CHECK (true)', () => {
    expect(migration5).not.toContain('USING (true)');
    expect(migration5).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// 6. AUDIT LOGGING
// ============================================================

describe('Audit Logging for Estimates', () => {
  it('defines audit_estimate_changes trigger function', () => {
    expect(migration5).toContain('CREATE OR REPLACE FUNCTION public.audit_estimate_changes()');
    expect(migration5).toContain("'create_estimate'");
    expect(migration5).toContain("'estimate_status_change'");
    expect(migration5).toContain("'update_estimate'");
    expect(migration5).toContain("'delete_estimate'");
  });

  it('attaches audit_estimate_changes AFTER INSERT OR UPDATE OR DELETE on estimates', () => {
    expect(migration5).toContain('CREATE TRIGGER trg_audit_estimate_changes');
    expect(migration5).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.estimates');
  });

  it('all trigger functions in migration 0005 enforce search_path = public', () => {
    const lines = migration5.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration5.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// 7. INDEXES
// ============================================================

describe('Database Indexes for Estimates & Estimate Items', () => {
  it('creates required indexes on estimates', () => {
    expect(migration5).toContain('CREATE INDEX idx_estimates_company_id');
    expect(migration5).toContain('CREATE INDEX idx_estimates_company_customer');
    expect(migration5).toContain('CREATE INDEX idx_estimates_company_enquiry');
    expect(migration5).toContain('CREATE INDEX idx_estimates_company_status');
    expect(migration5).toContain('CREATE INDEX idx_estimates_company_date');
    expect(migration5).toContain('CREATE INDEX idx_estimates_company_valid_until');
  });

  it('creates required indexes on estimate_items', () => {
    expect(migration5).toContain('CREATE INDEX idx_estimate_items_company_estimate');
    expect(migration5).toContain('CREATE INDEX idx_estimate_items_estimate_sort');
  });
});

// ============================================================
// 8. TYPES CONSISTENCY
// ============================================================

describe('TypeScript Database Types', () => {
  it('defines estimates table in Database interface', () => {
    expect(typesSource).toContain('estimates:');
    expect(typesSource).toContain("'Draft'");
    expect(typesSource).toContain("'Sent'");
    expect(typesSource).toContain("'Approved'");
  });

  it('defines estimate_items table in Database interface', () => {
    expect(typesSource).toContain('estimate_items:');
    expect(typesSource).toContain("'Material'");
    expect(typesSource).toContain("'Labour'");
    expect(typesSource).toContain("'Electrical'");
  });
});

// ============================================================
// 9. SCOPE INTEGRITY (NO FUTURE MODULES / NO FINANCIAL LOGIC)
// ============================================================

describe('Scope Integrity', () => {
  it('does NOT create future business tables in Phase 4', () => {
    const forbidden = [
      'CREATE TABLE public.projects',
      'CREATE TABLE public.suppliers',
      'CREATE TABLE public.materials',
      'CREATE TABLE public.purchases',
      'CREATE TABLE public.employees',
      'CREATE TABLE public.attendance',
      'CREATE TABLE public.daily_wages',
      'CREATE TABLE public.employee_advances',
      'CREATE TABLE public.employee_payments',
      'CREATE TABLE public.expenses',
      'CREATE TABLE public.customer_payments',
      'CREATE TABLE public.tasks',
      'CREATE TABLE public.follow_ups',
      'CREATE TABLE public.daily_site_reports',
      'CREATE TABLE public.work_progress',
    ];
    for (const table of forbidden) {
      expect(migration5).not.toContain(table);
    }
  });

  it('does NOT implement financial transaction / balance logic in Phase 4', () => {
    const forbidden = [
      'supplier_balance',
      'purchase_balance',
      'customer_balance',
      'wage_balance',
      'calculate_profit',
      'payment_allocation',
    ];
    for (const term of forbidden) {
      expect(migration5).not.toContain(term);
    }
  });
});
