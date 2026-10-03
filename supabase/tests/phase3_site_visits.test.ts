/**
 * Phase 3: Site Visits Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company & customer integrity triggers,
 * indexes, and audit logging for:
 * 1. Site Visits module schema & constraints
 * 2. Cross-company integrity & cross-customer mismatch prevention
 * 3. Company-scoped Row Level Security (RLS)
 * 4. Audit logging on site visit creation, status changes, and rescheduling
 * 5. Scope integrity (no projects, estimates, or financial logic)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0004_PATH = join(ROOT, 'supabase', 'migrations', '0004_site_visits.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration4 = existsSync(MIGRATION_0004_PATH)
  ? readFileSync(MIGRATION_0004_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// 1. SITE VISITS TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('Site Visits Schema & Constraints', () => {
  it('migration 0004 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0004_PATH)).toBe(true);
    expect(migration4.length).toBeGreaterThan(100);
  });

  it('creates public.site_visits table', () => {
    expect(migration4).toContain('CREATE TABLE public.site_visits');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration4).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration4).toContain('company_id    uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration4).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires customer_id referencing customers(id) ON DELETE RESTRICT', () => {
    expect(migration4).toContain('customer_id   uuid NOT NULL');
    expect(migration4).toContain('REFERENCES public.customers(id) ON DELETE RESTRICT');
  });

  it('enquiry_id is optional and references enquiries(id) ON DELETE SET NULL', () => {
    expect(migration4).toContain('enquiry_id    uuid');
    expect(migration4).toContain('REFERENCES public.enquiries(id) ON DELETE SET NULL');
  });

  it('assigned_to is optional and references profiles(id) ON DELETE SET NULL', () => {
    expect(migration4).toContain('assigned_to   uuid');
    expect(migration4).toContain('REFERENCES public.profiles(id) ON DELETE SET NULL');
  });

  it('contains all required fields', () => {
    const requiredFields = [
      'site_address',
      'visit_date',
      'purpose',
      'observations',
      'notes',
      'status',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      expect(migration4).toContain(field);
    }
  });

  it('visit_date uses date type (calendar date)', () => {
    expect(migration4).toContain('visit_date    date NOT NULL');
  });

  it('status enforces the approved lifecycle states', () => {
    const approvedStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
    for (const status of approvedStatuses) {
      expect(migration4).toContain(`'${status}'`);
    }
  });

  it('status defaults to Scheduled', () => {
    expect(migration4).toContain("status        text NOT NULL DEFAULT 'Scheduled'");
  });

  it('uses timestamptz for created_at and updated_at', () => {
    expect(migration4).toContain('created_at    timestamptz NOT NULL DEFAULT now()');
    expect(migration4).toContain('updated_at    timestamptz NOT NULL DEFAULT now()');
  });

  it('attaches updated_at trigger function', () => {
    expect(migration4).toContain('CREATE TRIGGER site_visits_updated_at');
    expect(migration4).toContain('BEFORE UPDATE ON public.site_visits');
    expect(migration4).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// 2. CROSS-COMPANY & CUSTOMER INTEGRITY
// ============================================================

describe('Cross-Company & Customer Integrity Enforcement', () => {
  it('adds composite unique constraint on profiles (company_id, id)', () => {
    expect(migration4).toContain('ALTER TABLE public.profiles');
    expect(migration4).toContain('CONSTRAINT uq_profiles_company_id_id');
    expect(migration4).toContain('UNIQUE (company_id, id)');
  });

  it('adds composite unique constraint on enquiries (company_id, customer_id, id)', () => {
    expect(migration4).toContain('ALTER TABLE public.enquiries');
    expect(migration4).toContain('CONSTRAINT uq_enquiries_company_id_customer_id_id');
    expect(migration4).toContain('UNIQUE (company_id, customer_id, id)');
  });

  it('enforces composite foreign key on customer belonging to same company', () => {
    expect(migration4).toContain('CONSTRAINT fk_site_visits_customer_company');
    expect(migration4).toContain('FOREIGN KEY (company_id, customer_id)');
    expect(migration4).toContain('REFERENCES public.customers (company_id, id)');
  });

  it('enforces composite foreign key on enquiry belonging to same company AND customer', () => {
    expect(migration4).toContain('CONSTRAINT fk_site_visits_enquiry_company_customer');
    expect(migration4).toContain('FOREIGN KEY (company_id, customer_id, enquiry_id)');
    expect(migration4).toContain('REFERENCES public.enquiries (company_id, customer_id, id)');
  });

  it('enforces composite foreign key on assigned profile belonging to same company', () => {
    expect(migration4).toContain('CONSTRAINT fk_site_visits_assigned_profile_company');
    expect(migration4).toContain('FOREIGN KEY (company_id, assigned_to)');
    expect(migration4).toContain('REFERENCES public.profiles (company_id, id)');
  });

  it('provides validate_site_visit_integrity trigger function with descriptive error messages', () => {
    expect(migration4).toContain('CREATE OR REPLACE FUNCTION public.validate_site_visit_integrity()');
    expect(migration4).toContain('Cross-company integrity violation: Customer');
    expect(migration4).toContain('Integrity violation: Enquiry % does not belong to company % and customer %');
    expect(migration4).toContain('Cross-company integrity violation: Assigned user');
  });

  it('attaches validate_site_visit_integrity BEFORE INSERT OR UPDATE on site_visits', () => {
    expect(migration4).toContain('CREATE TRIGGER trg_validate_site_visit_integrity');
    expect(migration4).toContain('BEFORE INSERT OR UPDATE ON public.site_visits');
    expect(migration4).toContain('EXECUTE FUNCTION public.validate_site_visit_integrity()');
  });

  it('validate_site_visit_integrity uses SECURITY DEFINER with search_path = public', () => {
    const fnDef = migration4.substring(
      migration4.indexOf('FUNCTION public.validate_site_visit_integrity()'),
      migration4.indexOf('$$;', migration4.indexOf('FUNCTION public.validate_site_visit_integrity()'))
    );
    expect(fnDef).toContain('SECURITY DEFINER');
    expect(fnDef).toContain('SET search_path = public');
  });
});

// ============================================================
// 3. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('Row Level Security for Site Visits', () => {
  it('enables RLS on site_visits', () => {
    expect(migration4).toContain('ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY');
  });

  it('enforces company isolation on SELECT, INSERT, UPDATE', () => {
    expect(migration4).toContain('CREATE POLICY "Users can view company site visits"');
    expect(migration4).toContain('CREATE POLICY "Users can insert company site visits"');
    expect(migration4).toContain('CREATE POLICY "Users can update company site visits"');
  });

  it('all standard policies check company_id = public.current_company_id()', () => {
    expect(migration4).toMatch(/Users can view company site visits[\s\S]*?company_id = public\.current_company_id\(\)/);
    expect(migration4).toMatch(/Users can insert company site visits[\s\S]*?company_id = public\.current_company_id\(\)/);
    expect(migration4).toMatch(/Users can update company site visits[\s\S]*?company_id = public\.current_company_id\(\)/);
  });

  it('restricts DELETE to company owners only', () => {
    expect(migration4).toContain('CREATE POLICY "Owners can delete company site visits"');
    expect(migration4).toMatch(/Owners can delete company site visits[\s\S]*?company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('does NOT contain USING (true) or WITH CHECK (true)', () => {
    expect(migration4).not.toContain('USING (true)');
    expect(migration4).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// 4. AUDIT LOGGING
// ============================================================

describe('Audit Logging for Site Visits', () => {
  it('defines audit_site_visit_changes trigger function', () => {
    expect(migration4).toContain('CREATE OR REPLACE FUNCTION public.audit_site_visit_changes()');
    expect(migration4).toContain("'create_site_visit'");
    expect(migration4).toContain("'site_visit_status_change'");
    expect(migration4).toContain("'reschedule_site_visit'");
    expect(migration4).toContain("'update_site_visit'");
  });

  it('attaches audit_site_visit_changes AFTER INSERT OR UPDATE on site_visits', () => {
    expect(migration4).toContain('CREATE TRIGGER trg_audit_site_visit_changes');
    expect(migration4).toContain('AFTER INSERT OR UPDATE ON public.site_visits');
  });

  it('audit_site_visit_changes sets search_path = public', () => {
    const fnDef = migration4.substring(
      migration4.indexOf('FUNCTION public.audit_site_visit_changes()'),
      migration4.indexOf('$$;', migration4.indexOf('FUNCTION public.audit_site_visit_changes()'))
    );
    expect(fnDef).toContain('SECURITY DEFINER');
    expect(fnDef).toContain('SET search_path = public');
  });
});

// ============================================================
// 5. INDEXES
// ============================================================

describe('Database Indexes for Site Visits', () => {
  it('creates required indexes for performance', () => {
    expect(migration4).toContain('CREATE INDEX idx_site_visits_company_id');
    expect(migration4).toContain('CREATE INDEX idx_site_visits_company_customer');
    expect(migration4).toContain('CREATE INDEX idx_site_visits_company_enquiry');
    expect(migration4).toContain('CREATE INDEX idx_site_visits_company_date');
    expect(migration4).toContain('CREATE INDEX idx_site_visits_company_status');
    expect(migration4).toContain('CREATE INDEX idx_site_visits_company_assigned');
  });
});

// ============================================================
// 6. TYPES CONSISTENCY
// ============================================================

describe('TypeScript Database Types', () => {
  it('defines site_visits table in Database interface', () => {
    expect(typesSource).toContain('site_visits:');
    expect(typesSource).toContain("status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';");
  });
});

// ============================================================
// 7. SCOPE INTEGRITY (NO FUTURE MODULES / NO FINANCIAL LOGIC)
// ============================================================

describe('Scope Integrity', () => {
  it('does NOT create future business tables in Phase 3', () => {
    const forbidden = [
      'CREATE TABLE public.projects',
      'CREATE TABLE public.estimates',
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
      expect(migration4).not.toContain(table);
    }
  });

  it('does NOT create is_assigned_to_project in Phase 3', () => {
    expect(migration4).not.toContain('is_assigned_to_project');
  });

  it('does NOT implement financial balance calculations in Phase 3', () => {
    const forbidden = [
      'supplier_balance',
      'purchase_balance',
      'customer_balance',
      'wage_balance',
      'calculate_profit',
      'payment_allocation',
    ];
    for (const term of forbidden) {
      expect(migration4).not.toContain(term);
    }
  });
});
