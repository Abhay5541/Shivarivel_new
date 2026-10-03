/**
 * Phase 6: Suppliers & Materials Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company validation triggers,
 * master catalog rate constraints, audit logging, database indexes,
 * and scope boundaries for:
 * 1. Suppliers directory schema & constraints
 * 2. Materials catalog schema & constraints
 * 3. Supplier-Materials junction table & cross-company integrity
 * 4. Master rate & data validations (no floating points, non-negative rates, GST as text)
 * 5. Company-scoped Row Level Security (RLS) & Owner-only hard delete
 * 6. Audit logging triggers for suppliers, materials, and junction mappings
 * 7. Database performance indexes
 * 8. TypeScript database types alignment
 * 9. Scope integrity (strict exclusion of purchases, supplier payments, inventory, wages, and frontend code)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0007_PATH = join(ROOT, 'supabase', 'migrations', '0007_suppliers_materials.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration7 = existsSync(MIGRATION_0007_PATH)
  ? readFileSync(MIGRATION_0007_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. SUPPLIERS SCHEMA
// ============================================================

describe('A. Suppliers Schema', () => {
  it('migration 0007 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0007_PATH)).toBe(true);
    expect(migration7.length).toBeGreaterThan(100);
  });

  it('creates public.suppliers table', () => {
    expect(migration7).toContain('CREATE TABLE public.suppliers');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration7).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration7).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration7).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('contains all required supplier fields', () => {
    const fields = [
      'name',
      'contact_person',
      'phone',
      'alternate_phone',
      'email',
      'address',
      'gst_number',
      'category',
      'notes',
      'status',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration7).toContain(field);
    }
  });

  it('stores gst_number as text without financial tax logic', () => {
    expect(migration7).toContain('gst_number      text');
    expect(migration7).not.toContain('gst_rate');
    expect(migration7).not.toContain('calculate_gst');
  });

  it('enforces composite unique constraint on (company_id, id)', () => {
    expect(migration7).toContain('CONSTRAINT uq_suppliers_company_id_id');
    expect(migration7).toContain('UNIQUE (company_id, id)');
  });

  it('attaches updated_at trigger to suppliers', () => {
    expect(migration7).toContain('CREATE TRIGGER suppliers_updated_at');
    expect(migration7).toContain('BEFORE UPDATE ON public.suppliers');
  });
});

// ============================================================
// B. SUPPLIER VALIDATION
// ============================================================

describe('B. Supplier Validation Rules', () => {
  it('rejects blank supplier name', () => {
    expect(migration7).toContain("CHECK (char_length(trim(name)) > 0)");
  });

  it('enforces status in (active, inactive)', () => {
    expect(migration7).toContain("CHECK (status IN ('active', 'inactive'))");
    expect(migration7).toContain("DEFAULT 'active'");
  });

  it('does NOT enforce single unique phone or email across suppliers', () => {
    // Phone/email may be shared among vendors or contacts; not strictly unique globally
    expect(migration7).not.toMatch(/phone\s+text\s+UNIQUE/);
    expect(migration7).not.toMatch(/email\s+text\s+UNIQUE/);
  });

  it('does NOT create financial balance or credit columns on suppliers', () => {
    const forbidden = [
      'supplier_balance',
      'supplier_payable',
      'supplier_payment',
      'total_purchases',
      'outstanding_amount',
      'ledger',
      'credit_balance',
    ];
    for (const term of forbidden) {
      expect(migration7).not.toContain(term);
    }
  });
});

// ============================================================
// C. MATERIALS SCHEMA
// ============================================================

describe('C. Materials Schema', () => {
  it('creates public.materials table', () => {
    expect(migration7).toContain('CREATE TABLE public.materials');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration7).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration7).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('contains all required material fields', () => {
    const fields = [
      'name',
      'category',
      'unit',
      'standard_rate',
      'description',
      'status',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration7).toContain(field);
    }
  });

  it('uses numeric(14,2) for standard_rate, never floating point', () => {
    expect(migration7).toContain('standard_rate numeric(14,2)');
    expect(migration7).not.toMatch(/standard_rate\s+(float|real|double)/i);
  });

  it('enforces composite unique constraint on (company_id, id)', () => {
    expect(migration7).toContain('CONSTRAINT uq_materials_company_id_id');
    expect(migration7).toContain('UNIQUE (company_id, id)');
  });

  it('attaches updated_at trigger to materials', () => {
    expect(migration7).toContain('CREATE TRIGGER materials_updated_at');
    expect(migration7).toContain('BEFORE UPDATE ON public.materials');
  });
});

// ============================================================
// D. MATERIAL VALIDATION
// ============================================================

describe('D. Material Validation Rules', () => {
  it('rejects blank material name', () => {
    expect(migration7).toMatch(/name\s+text NOT NULL CHECK \(char_length\(trim\(name\)\) > 0\)/);
  });

  it('rejects blank category', () => {
    expect(migration7).toMatch(/category\s+text NOT NULL CHECK \(char_length\(trim\(category\)\) > 0\)/);
  });

  it('defaults unit to nos and rejects blank unit', () => {
    expect(migration7).toMatch(/unit\s+text NOT NULL DEFAULT 'nos' CHECK \(char_length\(trim\(unit\)\) > 0\)/);
  });

  it('rejects negative standard_rate', () => {
    expect(migration7).toContain('CHECK (standard_rate IS NULL OR standard_rate >= 0)');
  });

  it('enforces material status in (active, inactive)', () => {
    expect(migration7).toContain("CHECK (status IN ('active', 'inactive'))");
  });

  it('does NOT contain inventory valuation or cost accounting logic', () => {
    const forbidden = [
      'stock_level',
      'reorder_point',
      'valuation_method',
      'fifo',
      'lifo',
      'average_cost',
      'calculate_profit',
    ];
    for (const term of forbidden) {
      expect(migration7).not.toContain(term);
    }
  });
});

// ============================================================
// E. SUPPLIER / MATERIAL RELATIONSHIP
// ============================================================

describe('E. Supplier-Material Relationship', () => {
  it('creates public.supplier_materials table', () => {
    expect(migration7).toContain('CREATE TABLE public.supplier_materials');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration7).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('has foreign keys to suppliers and materials with ON DELETE CASCADE', () => {
    expect(migration7).toContain('REFERENCES public.suppliers(id) ON DELETE CASCADE');
    expect(migration7).toContain('REFERENCES public.materials(id) ON DELETE CASCADE');
  });

  it('enforces composite foreign key to suppliers (company_id, supplier_id)', () => {
    expect(migration7).toContain('CONSTRAINT fk_supplier_materials_supplier_company');
    expect(migration7).toContain('FOREIGN KEY (company_id, supplier_id)');
    expect(migration7).toContain('REFERENCES public.suppliers (company_id, id)');
  });

  it('enforces composite foreign key to materials (company_id, material_id)', () => {
    expect(migration7).toContain('CONSTRAINT fk_supplier_materials_material_company');
    expect(migration7).toContain('FOREIGN KEY (company_id, material_id)');
    expect(migration7).toContain('REFERENCES public.materials (company_id, id)');
  });

  it('enforces unique combination of (company_id, supplier_id, material_id)', () => {
    expect(migration7).toContain('CONSTRAINT uq_supplier_materials_unique');
    expect(migration7).toContain('UNIQUE (company_id, supplier_id, material_id)');
  });

  it('uses numeric(14,2) non-negative for supplier_rate', () => {
    expect(migration7).toContain('supplier_rate           numeric(14,2) CHECK (supplier_rate IS NULL OR supplier_rate >= 0)');
  });

  it('defines validate_supplier_material_integrity trigger function', () => {
    expect(migration7).toContain('CREATE OR REPLACE FUNCTION public.validate_supplier_material_integrity()');
    expect(migration7).toContain('Cross-company integrity violation: Supplier % does not belong to company %');
    expect(migration7).toContain('Cross-company integrity violation: Material % does not belong to company %');
  });

  it('attaches validate_supplier_material_integrity trigger to supplier_materials', () => {
    expect(migration7).toContain('CREATE TRIGGER trg_validate_supplier_material_integrity');
    expect(migration7).toContain('BEFORE INSERT OR UPDATE ON public.supplier_materials');
  });
});

// ============================================================
// F. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('F. Row Level Security Policies', () => {
  it('enables RLS on suppliers, materials, and supplier_materials', () => {
    expect(migration7).toContain('ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;');
    expect(migration7).toContain('ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;');
    expect(migration7).toContain('ALTER TABLE public.supplier_materials ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-isolated SELECT/INSERT/UPDATE for suppliers', () => {
    expect(migration7).toContain('CREATE POLICY "Users can view company suppliers"');
    expect(migration7).toContain('CREATE POLICY "Users can insert company suppliers"');
    expect(migration7).toContain('CREATE POLICY "Users can update company suppliers"');
    expect(migration7).toContain('company_id = public.current_company_id()');
  });

  it('restricts supplier DELETE to owner only', () => {
    expect(migration7).toContain('CREATE POLICY "Owners can delete company suppliers"');
    expect(migration7).toMatch(/company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('defines company-isolated SELECT/INSERT/UPDATE for materials', () => {
    expect(migration7).toContain('CREATE POLICY "Users can view company materials"');
    expect(migration7).toContain('CREATE POLICY "Users can insert company materials"');
    expect(migration7).toContain('CREATE POLICY "Users can update company materials"');
  });

  it('restricts material DELETE to owner only', () => {
    expect(migration7).toContain('CREATE POLICY "Owners can delete company materials"');
    expect(migration7).toMatch(/company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('defines company-isolated policies for supplier_materials', () => {
    expect(migration7).toContain('CREATE POLICY "Users can view company supplier materials"');
    expect(migration7).toContain('CREATE POLICY "Users can insert company supplier materials"');
    expect(migration7).toContain('CREATE POLICY "Users can update company supplier materials"');
    expect(migration7).toContain('CREATE POLICY "Users can delete company supplier materials"');
  });

  it('does NOT contain permissive USING (true) or WITH CHECK (true)', () => {
    expect(migration7).not.toContain('USING (true)');
    expect(migration7).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// G. AUDIT LOGGING
// ============================================================

describe('G. Audit Logging Triggers', () => {
  it('defines audit_supplier_changes function and trigger', () => {
    expect(migration7).toContain('CREATE OR REPLACE FUNCTION public.audit_supplier_changes()');
    expect(migration7).toContain("'create_supplier'");
    expect(migration7).toContain("'supplier_status_change'");
    expect(migration7).toContain("'update_supplier'");
    expect(migration7).toContain("'delete_supplier'");
    expect(migration7).toContain('CREATE TRIGGER trg_audit_supplier_changes');
    expect(migration7).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.suppliers');
  });

  it('defines audit_material_changes function and trigger', () => {
    expect(migration7).toContain('CREATE OR REPLACE FUNCTION public.audit_material_changes()');
    expect(migration7).toContain("'create_material'");
    expect(migration7).toContain("'material_status_change'");
    expect(migration7).toContain("'update_material'");
    expect(migration7).toContain("'delete_material'");
    expect(migration7).toContain('CREATE TRIGGER trg_audit_material_changes');
    expect(migration7).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.materials');
  });

  it('defines audit_supplier_material_changes function and trigger', () => {
    expect(migration7).toContain('CREATE OR REPLACE FUNCTION public.audit_supplier_material_changes()');
    expect(migration7).toContain("'create_supplier_material'");
    expect(migration7).toContain("'update_supplier_material'");
    expect(migration7).toContain("'delete_supplier_material'");
    expect(migration7).toContain('CREATE TRIGGER trg_audit_supplier_material_changes');
    expect(migration7).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.supplier_materials');
  });

  it('all trigger functions enforce SECURITY DEFINER and search_path = public', () => {
    const lines = migration7.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration7.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// H. DATABASE INDEXES
// ============================================================

describe('H. Database Indexes', () => {
  it('creates performance indexes on suppliers', () => {
    expect(migration7).toContain('CREATE INDEX idx_suppliers_company_id');
    expect(migration7).toContain('CREATE INDEX idx_suppliers_company_name');
    expect(migration7).toContain('CREATE INDEX idx_suppliers_company_status');
  });

  it('creates performance indexes on materials', () => {
    expect(migration7).toContain('CREATE INDEX idx_materials_company_id');
    expect(migration7).toContain('CREATE INDEX idx_materials_company_name');
    expect(migration7).toContain('CREATE INDEX idx_materials_company_category');
    expect(migration7).toContain('CREATE INDEX idx_materials_company_status');
  });

  it('creates performance indexes on supplier_materials', () => {
    expect(migration7).toContain('CREATE INDEX idx_supplier_materials_company_supplier');
    expect(migration7).toContain('CREATE INDEX idx_supplier_materials_company_material');
  });
});

// ============================================================
// I. TYPESCRIPT DATABASE TYPES
// ============================================================

describe('I. TypeScript Database Types', () => {
  it('defines suppliers table in Database interface', () => {
    expect(typesSource).toContain('suppliers: {');
    expect(typesSource).toContain("status: 'active' | 'inactive';");
    expect(typesSource).toContain('contact_person: string | null;');
    expect(typesSource).toContain('gst_number: string | null;');
  });

  it('defines materials table in Database interface', () => {
    expect(typesSource).toContain('materials: {');
    expect(typesSource).toContain('standard_rate: number | null;');
    expect(typesSource).toContain('category: string;');
    expect(typesSource).toContain('unit: string;');
  });

  it('defines supplier_materials table in Database interface', () => {
    expect(typesSource).toContain('supplier_materials: {');
    expect(typesSource).toContain('supplier_id: string;');
    expect(typesSource).toContain('material_id: string;');
    expect(typesSource).toContain('supplier_rate: number | null;');
  });
});

// ============================================================
// J. SCOPE INTEGRITY
// ============================================================

describe('J. Scope Integrity & Boundary Protection', () => {
  it('does NOT create future business tables in Phase 6', () => {
    const forbidden = [
      'CREATE TABLE public.purchases',
      'CREATE TABLE public.purchase_items',
      'CREATE TABLE public.supplier_payments',
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
      expect(migration7).not.toContain(table);
    }
  });

  it('does NOT implement financial ledger, balances, or payment allocation in Phase 6', () => {
    const forbiddenTerms = [
      'supplier_balance',
      'supplier_payable',
      'supplier_payment',
      'purchase_balance',
      'inventory_valuation',
      'project_cost',
      'financial_ledger',
      'payment_allocation',
    ];
    for (const term of forbiddenTerms) {
      expect(migration7).not.toContain(term);
    }
  });
});
