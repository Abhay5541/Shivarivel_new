/**
 * Phase 2: Customers + Enquiries Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company validation triggers, indexes,
 * and audit logging for:
 * 1. Customers module (company-scoped client directory)
 * 2. Enquiries module (company-scoped business leads/requests)
 * 3. Cross-company integrity protection
 * 4. Audit logging on customer and enquiry operations
 * 5. Scope integrity (no projects, site visits, or financial logic)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0003_PATH = join(ROOT, 'supabase', 'migrations', '0003_customers_enquiries.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration3 = existsSync(MIGRATION_0003_PATH)
  ? readFileSync(MIGRATION_0003_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// 1. CUSTOMERS TABLE
// ============================================================

describe('Customers Table Structure & Constraints', () => {
  it('migration 0003 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0003_PATH)).toBe(true);
    expect(migration3.length).toBeGreaterThan(100);
  });

  it('creates customers table', () => {
    expect(migration3).toContain('CREATE TABLE public.customers');
  });

  it('customers uses UUID primary key with gen_random_uuid()', () => {
    expect(migration3).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('customers requires company_id with foreign key to companies', () => {
    expect(migration3).toMatch(/company_id\s+uuid\s+NOT NULL\s+DEFAULT\s+public\.current_company_id\(\)\s+REFERENCES public\.companies\(id\)\s+ON DELETE RESTRICT/);
  });

  it('customers contains all required fields', () => {
    const requiredFields = [
      'name',
      'phone',
      'email',
      'address',
      'notes',
      'status',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      expect(migration3).toContain(field);
    }
  });

  it('customers name is validated to not be empty', () => {
    expect(migration3).toContain('CHECK (char_length(trim(name)) > 0)');
  });

  it('customers status is constrained to active or inactive', () => {
    expect(migration3).toContain("CHECK (status IN ('active', 'inactive'))");
    expect(migration3).toContain("DEFAULT 'active'");
  });

  it('customers uses timestamptz for created_at and updated_at', () => {
    expect(migration3).toContain('created_at  timestamptz NOT NULL DEFAULT now()');
    expect(migration3).toContain('updated_at  timestamptz NOT NULL DEFAULT now()');
  });

  it('customers has updated_at trigger attached', () => {
    expect(migration3).toContain('CREATE TRIGGER customers_updated_at');
    expect(migration3).toContain('BEFORE UPDATE ON public.customers');
    expect(migration3).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });

  it('does NOT enforce phone uniqueness across customers', () => {
    // Phone numbers can be legitimately shared by household members / partners
    expect(migration3).not.toContain('UNIQUE (phone)');
    expect(migration3).not.toContain('UNIQUE (company_id, phone)');
  });

  it('has composite unique constraint on (company_id, id)', () => {
    expect(migration3).toContain('CONSTRAINT uq_customers_company_id_id UNIQUE (company_id, id)');
  });
});

// ============================================================
// 2. ENQUIRIES TABLE
// ============================================================

describe('Enquiries Table Structure & Constraints', () => {
  it('creates enquiries table', () => {
    expect(migration3).toContain('CREATE TABLE public.enquiries');
  });

  it('enquiries uses UUID primary key with gen_random_uuid()', () => {
    expect(migration3).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('enquiries requires company_id with foreign key to companies', () => {
    expect(migration3).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration3).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('enquiries requires customer_id with foreign key to customers', () => {
    expect(migration3).toContain('customer_id     uuid NOT NULL');
    expect(migration3).toContain('REFERENCES public.customers(id) ON DELETE RESTRICT');
  });

  it('enquiries optionally references service_types', () => {
    expect(migration3).toContain('service_type_id uuid');
    expect(migration3).toContain('REFERENCES public.service_types(id) ON DELETE SET NULL');
  });

  it('enquiries contains all required fields', () => {
    const requiredFields = [
      'enquiry_date',
      'source',
      'description',
      'estimated_value',
      'status',
      'follow_up_date',
      'notes',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      expect(migration3).toContain(field);
    }
  });

  it('estimated_value uses numeric(14,2) and allows null', () => {
    expect(migration3).toMatch(/estimated_value\s+numeric\(14,2\)/);
    expect(migration3).toContain('CHECK (estimated_value IS NULL OR estimated_value >= 0)');
  });

  it('status enforces the approved Product Spec lifecycle states', () => {
    const approvedStatuses = [
      'New',
      'Contacted',
      'Site Visit Planned',
      'Estimate Prepared',
      'Converted',
      'Lost',
      'On Hold',
    ];
    for (const status of approvedStatuses) {
      expect(migration3).toContain(`'${status}'`);
    }
  });

  it('status defaults to New', () => {
    expect(migration3).toContain("status          text NOT NULL DEFAULT 'New'");
  });

  it('enquiry_date defaults to CURRENT_DATE', () => {
    expect(migration3).toContain('enquiry_date    date NOT NULL DEFAULT CURRENT_DATE');
  });

  it('enquiries has updated_at trigger attached', () => {
    expect(migration3).toContain('CREATE TRIGGER enquiries_updated_at');
    expect(migration3).toContain('BEFORE UPDATE ON public.enquiries');
    expect(migration3).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// 3. CROSS-COMPANY INTEGRITY PROTECTION
// ============================================================

describe('Cross-Company Integrity Enforcement', () => {
  it('adds composite unique constraint on service_types (company_id, id)', () => {
    expect(migration3).toContain('ALTER TABLE public.service_types');
    expect(migration3).toContain('CONSTRAINT uq_service_types_company_id_id');
    expect(migration3).toContain('UNIQUE (company_id, id)');
  });

  it('enforces composite foreign key on customer belonging to same company', () => {
    expect(migration3).toContain('CONSTRAINT fk_enquiries_customer_company');
    expect(migration3).toContain('FOREIGN KEY (company_id, customer_id)');
    expect(migration3).toContain('REFERENCES public.customers (company_id, id)');
  });

  it('enforces composite foreign key on service_type belonging to same company', () => {
    expect(migration3).toContain('CONSTRAINT fk_enquiries_service_type_company');
    expect(migration3).toContain('FOREIGN KEY (company_id, service_type_id)');
    expect(migration3).toContain('REFERENCES public.service_types (company_id, id)');
  });

  it('provides validate_enquiry_company trigger function with clear exceptions', () => {
    expect(migration3).toContain('CREATE OR REPLACE FUNCTION public.validate_enquiry_company()');
    expect(migration3).toContain('Cross-company integrity violation: Customer');
    expect(migration3).toContain('Cross-company integrity violation: Service type');
  });

  it('attaches validate_enquiry_company BEFORE INSERT OR UPDATE on enquiries', () => {
    expect(migration3).toContain('CREATE TRIGGER trg_validate_enquiry_company');
    expect(migration3).toContain('BEFORE INSERT OR UPDATE ON public.enquiries');
    expect(migration3).toContain('EXECUTE FUNCTION public.validate_enquiry_company()');
  });

  it('validate_enquiry_company uses SECURITY DEFINER with search_path = public', () => {
    const fnDef = migration3.substring(
      migration3.indexOf('FUNCTION public.validate_enquiry_company()'),
      migration3.indexOf('$$;', migration3.indexOf('FUNCTION public.validate_enquiry_company()'))
    );
    expect(fnDef).toContain('SECURITY DEFINER');
    expect(fnDef).toContain('SET search_path = public');
  });
});

// ============================================================
// 4. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('Row Level Security for Customers & Enquiries', () => {
  it('enables RLS on customers', () => {
    expect(migration3).toContain('ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY');
  });

  it('enables RLS on enquiries', () => {
    expect(migration3).toContain('ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY');
  });

  it('customers policies enforce company isolation on SELECT, INSERT, UPDATE', () => {
    expect(migration3).toContain('CREATE POLICY "Users can view company customers"');
    expect(migration3).toContain('CREATE POLICY "Users can insert company customers"');
    expect(migration3).toContain('CREATE POLICY "Users can update company customers"');
    expect(migration3).toContain('CREATE POLICY "Owners can delete company customers"');
  });

  it('enquiries policies enforce company isolation on SELECT, INSERT, UPDATE', () => {
    expect(migration3).toContain('CREATE POLICY "Users can view company enquiries"');
    expect(migration3).toContain('CREATE POLICY "Users can insert company enquiries"');
    expect(migration3).toContain('CREATE POLICY "Users can update company enquiries"');
    expect(migration3).toContain('CREATE POLICY "Owners can delete company enquiries"');
  });

  it('does NOT contain USING (true) or WITH CHECK (true)', () => {
    expect(migration3).not.toContain('USING (true)');
    expect(migration3).not.toContain('WITH CHECK (true)');
  });

  it('deletion of customers and enquiries is restricted to owners', () => {
    expect(migration3).toMatch(/Owners can delete company customers[\s\S]*?public\.is_owner\(\)/);
    expect(migration3).toMatch(/Owners can delete company enquiries[\s\S]*?public\.is_owner\(\)/);
  });
});

// ============================================================
// 5. AUDIT LOGGING
// ============================================================

describe('Audit Logging for Customers & Enquiries', () => {
  it('defines audit_customer_changes trigger function', () => {
    expect(migration3).toContain('CREATE OR REPLACE FUNCTION public.audit_customer_changes()');
    expect(migration3).toContain("'create_customer'");
    expect(migration3).toContain("'customer_status_change'");
    expect(migration3).toContain("'update_customer'");
  });

  it('attaches audit_customer_changes AFTER INSERT OR UPDATE on customers', () => {
    expect(migration3).toContain('CREATE TRIGGER trg_audit_customer_changes');
    expect(migration3).toContain('AFTER INSERT OR UPDATE ON public.customers');
  });

  it('defines audit_enquiry_changes trigger function', () => {
    expect(migration3).toContain('CREATE OR REPLACE FUNCTION public.audit_enquiry_changes()');
    expect(migration3).toContain("'create_enquiry'");
    expect(migration3).toContain("'enquiry_status_change'");
    expect(migration3).toContain("'update_enquiry'");
  });

  it('attaches audit_enquiry_changes AFTER INSERT OR UPDATE on enquiries', () => {
    expect(migration3).toContain('CREATE TRIGGER trg_audit_enquiry_changes');
    expect(migration3).toContain('AFTER INSERT OR UPDATE ON public.enquiries');
  });

  it('all audit functions set search_path = public', () => {
    const lines = migration3.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration3.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// 6. INDEXES
// ============================================================

describe('Database Indexes', () => {
  it('creates required indexes on customers', () => {
    expect(migration3).toContain('CREATE INDEX idx_customers_company_id');
    expect(migration3).toContain('CREATE INDEX idx_customers_company_name');
    expect(migration3).toContain('CREATE INDEX idx_customers_company_status');
  });

  it('creates required indexes on enquiries', () => {
    expect(migration3).toContain('CREATE INDEX idx_enquiries_company_id');
    expect(migration3).toContain('CREATE INDEX idx_enquiries_company_customer');
    expect(migration3).toContain('CREATE INDEX idx_enquiries_company_status');
    expect(migration3).toContain('CREATE INDEX idx_enquiries_company_follow_up');
  });
});

// ============================================================
// 7. TYPES CONSISTENCY
// ============================================================

describe('TypeScript Database Types', () => {
  it('defines customers table in Database interface', () => {
    expect(typesSource).toContain('customers:');
    expect(typesSource).toContain("status: 'active' | 'inactive';");
  });

  it('defines enquiries table in Database interface', () => {
    expect(typesSource).toContain('enquiries:');
    expect(typesSource).toContain("'Site Visit Planned'");
    expect(typesSource).toContain("'Estimate Prepared'");
    expect(typesSource).toContain("'Converted'");
  });
});

// ============================================================
// 8. SCOPE INTEGRITY (NO FUTURE MODULES / NO FINANCIAL LOGIC)
// ============================================================

describe('Scope Integrity', () => {
  it('does NOT create future business tables in Phase 2', () => {
    const forbidden = [
      'CREATE TABLE public.projects',
      'CREATE TABLE public.site_visits',
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
      expect(migration3).not.toContain(table);
    }
  });

  it('does NOT create financial balance logic in Phase 2', () => {
    const forbidden = [
      'supplier_balance',
      'purchase_balance',
      'customer_balance',
      'wage_balance',
      'calculate_profit',
      'payment_allocation',
    ];
    for (const term of forbidden) {
      expect(migration3).not.toContain(term);
    }
  });
});
