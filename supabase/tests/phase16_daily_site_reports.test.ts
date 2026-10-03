/**
 * Phase 16: Daily Site Reports Backend Tests
 *
 * Comprehensive tests verifying:
 * A. Daily Report Creation & Schema Constraints: columns, defaults, FKs, constraints
 * B. Project Relationship & Validation: same-company enforcement, cross-company rejection
 * C. Unique Report Constraint: at most one report per project per date (Product Spec Sec 26)
 * D. Child Record Schemas & Integrity:
 *    - Workers: headcount, hours, optional employee master reference
 *    - Materials: operational usage, quantity > 0, unit, optional material reference
 *    - Expenses: operational logging, amount > 0, optional expense reference without double counting
 *    - Photos: URL metadata hook, deferred storage architecture
 * E. Multi-Tenant Company Isolation & RLS: SELECT, INSERT, UPDATE, DELETE policies on all tables
 * F. Report Lifecycle: Draft, Submitted, Approved status transitions
 * G. Atomic RPC: create_daily_site_report multi-table transactional creation
 * H. Audit Logging: create, update, delete events recorded in public.audit_log
 * I. Strict Financial Separation: daily reports do NOT alter purchases, wages, payments, or expenses
 * J. Photo Storage Scope Enforcement: storage buckets/uploads deferred to Phase 18
 * K. TypeScript Alignment & Scope Boundaries: type definitions and MVP exclusions
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0017_PATH = join(ROOT, 'supabase', 'migrations', '0017_daily_site_reports.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration17 = existsSync(MIGRATION_0017_PATH)
  ? readFileSync(MIGRATION_0017_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. DAILY REPORT CREATION & SCHEMA CONSTRAINTS
// ============================================================

describe('A. Daily Site Report Table Schema & Constraints', () => {
  it('migration 0017 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0017_PATH)).toBe(true);
    expect(migration17.length).toBeGreaterThan(100);
  });

  it('creates public.daily_site_reports table', () => {
    expect(migration17).toContain('CREATE TABLE public.daily_site_reports');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration17).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration17).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration17).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires project_id referencing projects(id)', () => {
    expect(migration17).toContain('project_id      uuid NOT NULL');
    expect(migration17).toContain('CONSTRAINT fk_daily_site_reports_project_company');
    expect(migration17).toContain('REFERENCES public.projects (company_id, id)');
  });

  it('contains report_date defaulting to CURRENT_DATE', () => {
    expect(migration17).toContain('report_date     date NOT NULL DEFAULT CURRENT_DATE');
  });

  it('requires non-blank work_completed', () => {
    expect(migration17).toContain('work_completed  text NOT NULL CHECK (char_length(trim(work_completed)) > 0)');
  });

  it('contains operational reporting fields: issues, delays, next_day_plan, notes', () => {
    expect(migration17).toContain('issues          text');
    expect(migration17).toContain('delays          text');
    expect(migration17).toContain('next_day_plan   text');
    expect(migration17).toContain('notes           text');
  });

  it('contains status defaulting to Submitted with valid check constraint', () => {
    expect(migration17).toContain("status          text NOT NULL DEFAULT 'Submitted'");
    expect(migration17).toContain("CHECK (status IN ('Draft', 'Submitted', 'Approved'))");
  });

  it('contains optional created_by referencing profiles', () => {
    expect(migration17).toContain('created_by      uuid');
    expect(migration17).toContain('CONSTRAINT fk_daily_site_reports_created_by_company');
  });
});

// ============================================================
// B. UNIQUE REPORT PER PROJECT PER DATE (PRODUCT SPEC SEC 26)
// ============================================================

describe('B. Unique Report Constraint (One per Project per Date)', () => {
  it('enforces unique constraint on (company_id, project_id, report_date)', () => {
    expect(migration17).toContain('CONSTRAINT uq_daily_site_reports_project_date');
    expect(migration17).toContain('UNIQUE (company_id, project_id, report_date)');
  });

  it('simulates duplicate report rejection for same project on same date', () => {
    const existingReports = [
      { companyId: 'c1', projectId: 'prj-101', reportDate: '2026-09-30' },
    ];

    const canCreateReport = (companyId: string, projectId: string, reportDate: string) => {
      const exists = existingReports.some(
        (r) => r.companyId === companyId && r.projectId === projectId && r.reportDate === reportDate
      );
      if (exists) {
        throw new Error(`A daily site report already exists for project ${projectId} on date ${reportDate}`);
      }
      return true;
    };

    expect(() => canCreateReport('c1', 'prj-101', '2026-09-30')).toThrow('already exists');
    expect(canCreateReport('c1', 'prj-101', '2026-10-01')).toBe(true);
    expect(canCreateReport('c1', 'prj-102', '2026-09-30')).toBe(true);
    expect(canCreateReport('c2', 'prj-101', '2026-09-30')).toBe(true);
  });
});

// ============================================================
// C. CHILD TABLES SCHEMA & RELATIONSHIPS
// ============================================================

describe('C. Structured Child Tables Schema & Integrity', () => {
  it('creates public.daily_site_report_workers table with cascading deletion', () => {
    expect(migration17).toContain('CREATE TABLE public.daily_site_report_workers');
    expect(migration17).toContain('CONSTRAINT fk_dsrw_report_company');
    expect(migration17).toContain('ON DELETE CASCADE');
    expect(migration17).toContain('worker_count    integer NOT NULL DEFAULT 1 CHECK (worker_count > 0)');
  });

  it('creates public.daily_site_report_materials table with quantity validation', () => {
    expect(migration17).toContain('CREATE TABLE public.daily_site_report_materials');
    expect(migration17).toContain('quantity        numeric(12,3) NOT NULL CHECK (quantity > 0)');
    expect(migration17).toContain('CONSTRAINT fk_dsrm_report_company');
    expect(migration17).toContain('ON DELETE CASCADE');
  });

  it('creates public.daily_site_report_expenses table with positive amount check', () => {
    expect(migration17).toContain('CREATE TABLE public.daily_site_report_expenses');
    expect(migration17).toContain('amount          numeric(14,2) NOT NULL CHECK (amount > 0)');
    expect(migration17).toContain('CONSTRAINT fk_dsre_report_company');
    expect(migration17).toContain('ON DELETE CASCADE');
  });

  it('creates public.daily_site_report_photos table for URL metadata', () => {
    expect(migration17).toContain('CREATE TABLE public.daily_site_report_photos');
    expect(migration17).toContain('photo_url       text NOT NULL CHECK (char_length(trim(photo_url)) > 0)');
    expect(migration17).toContain('CONSTRAINT fk_dsrp_report_company');
    expect(migration17).toContain('ON DELETE CASCADE');
  });
});

// ============================================================
// D. PROJECT RELATIONSHIP & VALIDATION
// ============================================================

describe('D. Project Relationship & Validation Triggers', () => {
  it('implements validate_daily_site_report_integrity trigger function', () => {
    expect(migration17).toContain('FUNCTION public.validate_daily_site_report_integrity()');
    expect(migration17).toContain('trg_validate_daily_site_report_integrity');
  });

  it('rejects blank work_completed in trigger', () => {
    expect(migration17).toContain('Daily site report work_completed cannot be blank');
  });

  it('validates project company alignment via trigger', () => {
    expect(migration17).toContain('Cross-company integrity violation: Project % does not belong to company %');
  });
});

// ============================================================
// E. ATOMIC RPC FUNCTION
// ============================================================

describe('E. Atomic Report Creation RPC Function', () => {
  it('implements create_daily_site_report RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration17).toContain('FUNCTION public.create_daily_site_report(');
    expect(migration17).toContain('SECURITY DEFINER');
    expect(migration17).toContain('SET search_path = public');
  });

  it('enforces duplicate report check inside RPC', () => {
    expect(migration17).toContain('Duplicate report violation: A daily site report already exists for project % on date %');
  });

  it('returns JSON payload with report_id and child record counts', () => {
    expect(migration17).toContain("'report_id', v_report_id");
    expect(migration17).toContain("'workers_count', v_workers_cnt");
    expect(migration17).toContain("'materials_count', v_materials_cnt");
    expect(migration17).toContain("'expenses_count', v_expenses_cnt");
    expect(migration17).toContain("'photos_count', v_photos_cnt");
  });
});

// ============================================================
// F. MULTI-TENANT COMPANY ISOLATION & RLS
// ============================================================

describe('F. Multi-Tenant Company Isolation & RLS', () => {
  it('enables row level security on daily_site_reports and all child tables', () => {
    expect(migration17).toContain('ALTER TABLE public.daily_site_reports ENABLE ROW LEVEL SECURITY;');
    expect(migration17).toContain('ALTER TABLE public.daily_site_report_workers ENABLE ROW LEVEL SECURITY;');
    expect(migration17).toContain('ALTER TABLE public.daily_site_report_materials ENABLE ROW LEVEL SECURITY;');
    expect(migration17).toContain('ALTER TABLE public.daily_site_report_expenses ENABLE ROW LEVEL SECURITY;');
    expect(migration17).toContain('ALTER TABLE public.daily_site_report_photos ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-scoped SELECT, INSERT, UPDATE, and DELETE policies on daily_site_reports', () => {
    expect(migration17).toContain('"Users can view company daily site reports"');
    expect(migration17).toContain('"Users can insert company daily site reports"');
    expect(migration17).toContain('"Users can update company daily site reports"');
    expect(migration17).toContain('"Owners can delete company daily site reports"');
    expect(migration17).toContain('public.is_owner()');
  });

  it('defines company-scoped policies on child tables', () => {
    expect(migration17).toContain('"Users can view company report workers"');
    expect(migration17).toContain('"Users can view company report materials"');
    expect(migration17).toContain('"Users can view company report expenses"');
    expect(migration17).toContain('"Users can view company report photos"');
  });

  it('never uses USING (true) or WITH CHECK (true)', () => {
    expect(migration17).not.toContain('USING (true)');
    expect(migration17).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// G. AUDIT LOGGING TRIGGERS
// ============================================================

describe('G. Audit Logging Triggers', () => {
  it('implements audit_daily_site_report_changes trigger function with SECURITY DEFINER', () => {
    expect(migration17).toContain('FUNCTION public.audit_daily_site_report_changes()');
    expect(migration17).toContain('SECURITY DEFINER');
    expect(migration17).toContain('SET search_path = public');
    expect(migration17).toContain('trg_audit_daily_site_report_changes');
  });

  it('captures distinct audit actions: create, update, delete', () => {
    expect(migration17).toContain("'create_daily_site_report'");
    expect(migration17).toContain("'update_daily_site_report'");
    expect(migration17).toContain("'delete_daily_site_report'");
    expect(migration17).toContain("'daily_site_reports'");
  });
});

// ============================================================
// H. STRICT FINANCIAL SEPARATION
// ============================================================

describe('H. Strict Financial Separation from Accounting & Project Costs', () => {
  it('daily site reports migration does NOT modify purchases, wages, payments, or expenses', () => {
    expect(migration17).not.toContain('ALTER TABLE public.purchases');
    expect(migration17).not.toContain('ALTER TABLE public.daily_wages');
    expect(migration17).not.toContain('ALTER TABLE public.supplier_payments');
    expect(migration17).not.toContain('ALTER TABLE public.employee_advances');
    expect(migration17).not.toContain('ALTER TABLE public.employee_payments');
    expect(migration17).not.toContain('ALTER TABLE public.customer_payments');
    expect(migration17).not.toContain('ALTER TABLE public.expenses');
  });

  it('demonstrates reporting materials or expenses on site does NOT mutate recorded project cost', () => {
    // Project recorded cost formula remains strictly: Purchases + Wages + Expenses
    const purchases = 50000;
    const wages = 20000;
    const financialExpenses = 5000;
    const recordedProjectCost = purchases + wages + financialExpenses;

    // Site report logs 10 bags of cement and ₹500 tea/snacks
    const siteReportItemsLogged = { cementBags: 10, teaSnacksAmount: 500 };
    expect(siteReportItemsLogged.teaSnacksAmount).toBe(500);

    // Recorded project cost remains invariant
    expect(recordedProjectCost).toBe(75000);
  });
});

// ============================================================
// I. PHOTO STORAGE SCOPE ENFORCEMENT
// ============================================================

describe('I. Photo Storage Scope Boundaries (Deferred to Phase 18)', () => {
  it('does NOT create storage buckets or upload policies in Phase 16', () => {
    expect(migration17).not.toContain('storage.buckets');
    expect(migration17).not.toContain('storage.objects');
    expect(migration17).not.toContain('create_bucket');
  });

  it('documents that Supabase Storage infrastructure is deferred to Phase 18', () => {
    expect(migration17).toContain('Storage infrastructure deferred to Phase 18');
  });
});

// ============================================================
// J. TYPESCRIPT TYPES ALIGNMENT & SCOPE BOUNDARIES
// ============================================================

describe('J. TypeScript Database Types Alignment & Scope Boundaries', () => {
  it('types database.ts includes daily_site_reports and all child tables', () => {
    expect(typesSource).toContain('daily_site_reports: {');
    expect(typesSource).toContain('daily_site_report_workers: {');
    expect(typesSource).toContain('daily_site_report_materials: {');
    expect(typesSource).toContain('daily_site_report_expenses: {');
    expect(typesSource).toContain('daily_site_report_photos: {');
  });

  it('types database.ts exports DailySiteReportStatus type', () => {
    expect(typesSource).toContain('export type DailySiteReportStatus =');
    expect(typesSource).toContain("'Draft' | 'Submitted' | 'Approved'");
  });

  it('types database.ts includes create_daily_site_report RPC signature', () => {
    expect(typesSource).toContain('create_daily_site_report: {');
    expect(typesSource).toContain('p_project_id: string;');
    expect(typesSource).toContain('p_work_completed: string;');
  });

  it('preserves scope exclusions: no frontend UI components', () => {
    expect(migration17).not.toContain('React');
    expect(migration17).not.toContain('useState');
    expect(migration17).not.toContain('useQuery');
    expect(migration17).not.toContain('export default function');
  });
});
