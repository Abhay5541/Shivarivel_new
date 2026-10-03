/**
 * Phase 5: Projects Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, cross-company & customer/enquiry/estimate integrity triggers,
 * sequential project code numbering, atomic conversion RPCs, project assignment helper,
 * indexes, and audit logging for:
 * 1. Projects parent table schema & constraints
 * 2. Sequential company-scoped project numbering (e.g. PRJ-0001)
 * 3. Cross-company, customer, enquiry, and estimate integrity enforcement
 * 4. Project assignment security helper: is_assigned_to_project(project_id)
 * 5. Atomic conversion functions: convert_estimate_to_project & convert_enquiry_to_project
 * 6. Company-scoped Row Level Security (RLS)
 * 7. Audit logging on project creation, status transitions, updates, and deletion
 * 8. Scope integrity (no suppliers, materials, purchases, employees, payments, or frontend UI)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0006_PATH = join(ROOT, 'supabase', 'migrations', '0006_projects.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration6 = existsSync(MIGRATION_0006_PATH)
  ? readFileSync(MIGRATION_0006_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// 1. PROJECTS TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('Projects Schema & Constraints', () => {
  it('migration 0006 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0006_PATH)).toBe(true);
    expect(migration6.length).toBeGreaterThan(100);
  });

  it('creates public.projects table', () => {
    expect(migration6).toContain('CREATE TABLE public.projects');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration6).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration6).toContain('company_id          uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration6).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires customer_id referencing customers(id) ON DELETE RESTRICT', () => {
    expect(migration6).toContain('customer_id         uuid NOT NULL');
    expect(migration6).toContain('REFERENCES public.customers(id) ON DELETE RESTRICT');
  });

  it('enquiry_id and estimate_id are optional and reference parent entities ON DELETE SET NULL', () => {
    expect(migration6).toContain('enquiry_id          uuid');
    expect(migration6).toContain('REFERENCES public.enquiries(id) ON DELETE SET NULL');
    expect(migration6).toContain('estimate_id         uuid');
    expect(migration6).toContain('REFERENCES public.estimates(id) ON DELETE SET NULL');
  });

  it('assigned_to is optional and references profiles(id) ON DELETE SET NULL', () => {
    expect(migration6).toContain('assigned_to         uuid');
    expect(migration6).toContain('REFERENCES public.profiles(id) ON DELETE SET NULL');
  });

  it('contains all required fields', () => {
    const requiredFields = [
      'project_code',
      'name',
      'description',
      'site_address',
      'status',
      'start_date',
      'expected_end_date',
      'actual_end_date',
      'contract_value',
      'notes',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      expect(migration6).toContain(field);
    }
  });

  it('dates use date type', () => {
    expect(migration6).toContain('start_date          date');
    expect(migration6).toContain('expected_end_date   date');
    expect(migration6).toContain('actual_end_date     date');
  });

  it('contract_value uses numeric(14,2) with non-negative validation', () => {
    expect(migration6).toMatch(/contract_value\s+numeric\(14,2\)/);
    expect(migration6).toContain('CHECK (contract_value IS NULL OR contract_value >= 0)');
  });

  it('name is validated to not be empty', () => {
    expect(migration6).toContain('CHECK (char_length(trim(name)) > 0)');
  });

  it('status enforces the approved lifecycle states with default Planned', () => {
    const approvedStatuses = ['Planned', 'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
    for (const status of approvedStatuses) {
      expect(migration6).toContain(`'${status}'`);
    }
    expect(migration6).toContain("status              text NOT NULL DEFAULT 'Planned'");
  });

  it('attaches updated_at trigger function', () => {
    expect(migration6).toContain('CREATE TRIGGER projects_updated_at');
    expect(migration6).toContain('BEFORE UPDATE ON public.projects');
    expect(migration6).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// 2. PROJECT NUMBERING
// ============================================================

describe('Project Code Numbering', () => {
  it('enforces company-scoped unique project codes', () => {
    expect(migration6).toContain('CONSTRAINT uq_projects_company_project_code');
    expect(migration6).toContain('UNIQUE (company_id, project_code)');
  });

  it('defines handle_project_code trigger to auto-generate PRJ-xxxx', () => {
    expect(migration6).toContain('CREATE OR REPLACE FUNCTION public.handle_project_code()');
    expect(migration6).toContain("'PRJ-' || lpad(v_next_num::text, 4, '0')");
    expect(migration6).toContain('CREATE TRIGGER trg_handle_project_code');
    expect(migration6).toContain('BEFORE INSERT ON public.projects');
  });
});

// ============================================================
// 3. CROSS-COMPANY & ENTITY INTEGRITY
// ============================================================

describe('Cross-Company & Entity Integrity Enforcement', () => {
  it('adds composite unique constraint on estimates (company_id, customer_id, id)', () => {
    expect(migration6).toContain('ALTER TABLE public.estimates');
    expect(migration6).toContain('CONSTRAINT uq_estimates_company_customer_id_id');
    expect(migration6).toContain('UNIQUE (company_id, customer_id, id)');
  });

  it('enforces composite foreign key on customer belonging to same company', () => {
    expect(migration6).toContain('CONSTRAINT fk_projects_customer_company');
    expect(migration6).toContain('FOREIGN KEY (company_id, customer_id)');
    expect(migration6).toContain('REFERENCES public.customers (company_id, id)');
  });

  it('enforces composite foreign key on enquiry belonging to same company AND customer', () => {
    expect(migration6).toContain('CONSTRAINT fk_projects_enquiry_company_customer');
    expect(migration6).toContain('FOREIGN KEY (company_id, customer_id, enquiry_id)');
    expect(migration6).toContain('REFERENCES public.enquiries (company_id, customer_id, id)');
  });

  it('enforces composite foreign key on estimate belonging to same company AND customer', () => {
    expect(migration6).toContain('CONSTRAINT fk_projects_estimate_company_customer');
    expect(migration6).toContain('FOREIGN KEY (company_id, customer_id, estimate_id)');
    expect(migration6).toContain('REFERENCES public.estimates (company_id, customer_id, id)');
  });

  it('enforces composite foreign key on assigned supervisor belonging to same company', () => {
    expect(migration6).toContain('CONSTRAINT fk_projects_assigned_profile_company');
    expect(migration6).toContain('FOREIGN KEY (company_id, assigned_to)');
    expect(migration6).toContain('REFERENCES public.profiles (company_id, id)');
  });

  it('provides validate_project_integrity trigger function with descriptive error exceptions', () => {
    expect(migration6).toContain('CREATE OR REPLACE FUNCTION public.validate_project_integrity()');
    expect(migration6).toContain('Cross-company integrity violation: Customer');
    expect(migration6).toContain('Integrity violation: Enquiry % does not belong to company % and customer %');
    expect(migration6).toContain('Integrity violation: Estimate % does not belong to company % and customer %');
    expect(migration6).toContain('Cross-company integrity violation: Assigned supervisor');
  });

  it('attaches validate_project_integrity BEFORE INSERT OR UPDATE on projects', () => {
    expect(migration6).toContain('CREATE TRIGGER trg_validate_project_integrity');
    expect(migration6).toContain('BEFORE INSERT OR UPDATE ON public.projects');
    expect(migration6).toContain('EXECUTE FUNCTION public.validate_project_integrity()');
  });
});

// ============================================================
// 4. PROJECT ASSIGNMENT SECURITY HELPER
// ============================================================

describe('Project Assignment Security Helper', () => {
  it('defines is_assigned_to_project(uuid)', () => {
    expect(migration6).toContain('CREATE OR REPLACE FUNCTION public.is_assigned_to_project(p_project_id uuid)');
    expect(migration6).toContain('RETURNS boolean');
    expect(migration6).toContain('STABLE');
    expect(migration6).toContain('SECURITY DEFINER');
    expect(migration6).toContain('SET search_path = public');
  });

  it('validates current company and either owner status or assigned supervisor status', () => {
    const fnDef = migration6.substring(
      migration6.indexOf('FUNCTION public.is_assigned_to_project(p_project_id uuid)'),
      migration6.indexOf('$$;', migration6.indexOf('FUNCTION public.is_assigned_to_project(p_project_id uuid)'))
    );
    expect(fnDef).toContain('company_id = public.current_company_id()');
    expect(fnDef).toContain('public.is_owner()');
    expect(fnDef).toContain('assigned_to = auth.uid()');
  });
});

// ============================================================
// 5. ATOMIC PROJECT CONVERSION FUNCTIONS
// ============================================================

describe('Atomic Project Conversion Functions', () => {
  it('defines convert_estimate_to_project function', () => {
    expect(migration6).toContain('CREATE OR REPLACE FUNCTION public.convert_estimate_to_project(');
    expect(migration6).toContain('RETURNS uuid');
    expect(migration6).toContain('SECURITY DEFINER');
    expect(migration6).toContain('SET search_path = public');
  });

  it('convert_estimate_to_project enforces tenant company validation', () => {
    const fnDef = migration6.substring(
      migration6.indexOf('FUNCTION public.convert_estimate_to_project('),
      migration6.indexOf('$$;', migration6.indexOf('FUNCTION public.convert_estimate_to_project('))
    );
    expect(fnDef).toContain('company_id = public.current_company_id()');
    expect(fnDef).toContain('RAISE EXCEPTION');
  });

  it('convert_estimate_to_project preserves customer, enquiry, and contract value', () => {
    const fnDef = migration6.substring(
      migration6.indexOf('FUNCTION public.convert_estimate_to_project('),
      migration6.indexOf('$$;', migration6.indexOf('FUNCTION public.convert_estimate_to_project('))
    );
    expect(fnDef).toContain('v_estimate.customer_id');
    expect(fnDef).toContain('v_estimate.enquiry_id');
    expect(fnDef).toContain('v_estimate.total_amount');
    expect(fnDef).toContain("status = 'Converted'");
  });

  it('convert_estimate_to_project only allows Approved or Accepted estimates', () => {
    const fnDef = migration6.substring(
      migration6.indexOf('FUNCTION public.convert_estimate_to_project('),
      migration6.indexOf('$$;', migration6.indexOf('FUNCTION public.convert_estimate_to_project('))
    );
    expect(fnDef).toContain("v_estimate.status NOT IN ('Approved', 'Accepted')");
    expect(fnDef).toContain('Estimate must be Approved or Accepted');
  });

  it('convert_estimate_to_project explicitly rejects Draft estimates', () => {
    const fnDef = migration6.substring(
      migration6.indexOf('FUNCTION public.convert_estimate_to_project('),
      migration6.indexOf('$$;', migration6.indexOf('FUNCTION public.convert_estimate_to_project('))
    );
    // Ensure 'Draft' is NOT in the allowed conversion list
    expect(fnDef).not.toMatch(/v_estimate\.status\s+NOT\s+IN\s*\([^)]*'Draft'[^)]*\)/);
  });

  it('convert_estimate_to_project explicitly rejects Sent estimates', () => {
    const fnDef = migration6.substring(
      migration6.indexOf('FUNCTION public.convert_estimate_to_project('),
      migration6.indexOf('$$;', migration6.indexOf('FUNCTION public.convert_estimate_to_project('))
    );
    // Ensure 'Sent' is NOT in the allowed conversion list
    expect(fnDef).not.toMatch(/v_estimate\.status\s+NOT\s+IN\s*\([^)]*'Sent'[^)]*\)/);
  });

  it('defines convert_enquiry_to_project function', () => {
    expect(migration6).toContain('CREATE OR REPLACE FUNCTION public.convert_enquiry_to_project(');
    expect(migration6).toContain('RETURNS uuid');
    expect(migration6).toContain('SECURITY DEFINER');
    expect(migration6).toContain('SET search_path = public');
  });
});

// ============================================================
// 6. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('Row Level Security for Projects', () => {
  it('enables RLS on projects', () => {
    expect(migration6).toContain('ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY');
  });

  it('enforces company isolation on SELECT, INSERT, UPDATE', () => {
    expect(migration6).toContain('CREATE POLICY "Users can view company projects"');
    expect(migration6).toContain('CREATE POLICY "Users can insert company projects"');
    expect(migration6).toContain('CREATE POLICY "Users can update company projects"');
  });

  it('restricts project deletion to owners only', () => {
    expect(migration6).toContain('CREATE POLICY "Owners can delete company projects"');
    expect(migration6).toMatch(/Owners can delete company projects[\s\S]*?company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('does NOT contain USING (true) or WITH CHECK (true)', () => {
    expect(migration6).not.toContain('USING (true)');
    expect(migration6).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// 7. AUDIT LOGGING
// ============================================================

describe('Audit Logging for Projects', () => {
  it('defines audit_project_changes trigger function', () => {
    expect(migration6).toContain('CREATE OR REPLACE FUNCTION public.audit_project_changes()');
    expect(migration6).toContain("'create_project'");
    expect(migration6).toContain("'project_status_change'");
    expect(migration6).toContain("'update_project'");
    expect(migration6).toContain("'delete_project'");
  });

  it('attaches audit_project_changes AFTER INSERT OR UPDATE OR DELETE on projects', () => {
    expect(migration6).toContain('CREATE TRIGGER trg_audit_project_changes');
    expect(migration6).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.projects');
  });

  it('all trigger and RPC functions enforce search_path = public', () => {
    const lines = migration6.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration6.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// 8. INDEXES
// ============================================================

describe('Database Indexes for Projects', () => {
  it('creates required indexes on projects', () => {
    expect(migration6).toContain('CREATE INDEX idx_projects_company_id');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_customer');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_enquiry');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_estimate');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_status');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_code');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_dates');
    expect(migration6).toContain('CREATE INDEX idx_projects_company_assigned');
  });
});

// ============================================================
// 9. TYPES CONSISTENCY
// ============================================================

describe('TypeScript Database Types', () => {
  it('defines projects table in Database interface', () => {
    expect(typesSource).toContain('projects:');
    expect(typesSource).toContain("'Planned'");
    expect(typesSource).toContain("'Active'");
    expect(typesSource).toContain("'Completed'");
  });

  it('defines project functions in Database interface', () => {
    expect(typesSource).toContain('is_assigned_to_project:');
    expect(typesSource).toContain('convert_estimate_to_project:');
    expect(typesSource).toContain('convert_enquiry_to_project:');
  });
});

// ============================================================
// 10. SCOPE INTEGRITY (NO FUTURE MODULES / NO FINANCIAL LOGIC)
// ============================================================

describe('Scope Integrity', () => {
  it('does NOT create future business tables in Phase 5', () => {
    const forbidden = [
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
      'CREATE TABLE public.work_progress',
      'CREATE TABLE public.daily_site_reports',
      'CREATE TABLE public.milestones',
    ];
    for (const table of forbidden) {
      expect(migration6).not.toContain(table);
    }
  });

  it('does NOT implement financial balance calculations in Phase 5', () => {
    const forbidden = [
      'supplier_balance',
      'purchase_balance',
      'customer_balance',
      'wage_balance',
      'calculate_profit',
      'payment_allocation',
    ];
    for (const term of forbidden) {
      expect(migration6).not.toContain(term);
    }
  });
});
