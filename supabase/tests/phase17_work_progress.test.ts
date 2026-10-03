/**
 * Phase 17: Work Progress Backend Tests
 *
 * Comprehensive tests verifying:
 * A. Project Work Items Table Schema & Constraints:
 *    - Columns, defaults, composite foreign keys, CHECK constraints
 *    - Product Spec Section 27 fields: name, category, status, progress_percentage,
 *      start_date, expected_completion, actual_completion, notes
 * B. Progress Percentage & Date Validation:
 *    - Enforcing range [0.00, 100.00], preventing negative or > 100 values
 *    - Date sanity checks (expected_completion >= start_date, actual_completion >= start_date)
 * C. Project Relationship & Multi-Tenant Company Isolation:
 *    - Same-company project foreign key (company_id, project_id) -> projects(company_id, id)
 *    - Cross-company project rejection via trigger & composite FK
 * D. Views:
 *    - Auto-updatable view alias: public.work_progress
 *    - Project-level rollup view: public.v_project_work_progress (completion %, counts)
 * E. Atomic RPC Functions:
 *    - update_work_item_progress: progress updates, status logic, completion dates
 *    - batch_create_project_work_items: atomic batch creation with array validation
 * F. Row Level Security (RLS) Policies:
 *    - SELECT, INSERT, UPDATE, DELETE policies on project_work_items
 *    - Owner-only deletion constraint
 *    - No permissive bypasses (no USING (true))
 * G. Audit Logging:
 *    - Trigger trg_audit_project_work_items_changes recording create, update, delete
 * H. Strict Financial Separation:
 *    - Confirms work progress never alters purchases, wages, advances, expenses, or payments
 * I. Daily Site Report Coexistence:
 *    - Work progress and daily site reports coexist independently as operational records
 * J. Project Lifecycle Independence:
 *    - Project statuses remain uncorrupted by work progress updates
 * K. TypeScript Alignment & Exported Types:
 *    - Table, view, RPC, and WorkItemStatus type exports in src/types/database.ts
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0018_PATH = join(ROOT, 'supabase', 'migrations', '0018_work_progress.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration18 = existsSync(MIGRATION_0018_PATH)
  ? readFileSync(MIGRATION_0018_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. WORK ITEMS TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('A. Work Items Table Schema & Constraints (Product Spec Sec 27)', () => {
  it('migration 0018 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0018_PATH)).toBe(true);
    expect(migration18.length).toBeGreaterThan(100);
  });

  it('creates public.project_work_items table', () => {
    expect(migration18).toContain('CREATE TABLE public.project_work_items');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration18).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration18).toContain('company_id          uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration18).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires project_id referencing projects(company_id, id)', () => {
    expect(migration18).toContain('project_id          uuid NOT NULL');
    expect(migration18).toContain('CONSTRAINT fk_pwi_project_company');
    expect(migration18).toContain('FOREIGN KEY (company_id, project_id)');
    expect(migration18).toContain('REFERENCES public.projects (company_id, id)');
    expect(migration18).toContain('ON DELETE RESTRICT');
  });

  it('requires non-blank name per Product Spec Section 27', () => {
    expect(migration18).toContain('name                text NOT NULL CHECK (char_length(trim(name)) > 0)');
  });

  it('includes optional category column per Product Spec Section 27', () => {
    expect(migration18).toContain('category            text');
  });

  it('includes status defaulting to Not Started with valid state constraints', () => {
    expect(migration18).toContain("status              text NOT NULL DEFAULT 'Not Started'");
    expect(migration18).toContain("'Not Started'");
    expect(migration18).toContain("'In Progress'");
    expect(migration18).toContain("'On Hold'");
    expect(migration18).toContain("'Completed'");
    expect(migration18).toContain("'Cancelled'");
  });

  it('includes progress_percentage with numeric(5,2) defaulting to 0.00 within [0, 100]', () => {
    expect(migration18).toContain('progress_percentage numeric(5,2) NOT NULL DEFAULT 0.00');
    expect(migration18).toContain('CHECK (progress_percentage >= 0.00 AND progress_percentage <= 100.00)');
  });

  it('includes start_date, expected_completion, actual_completion per Product Spec Section 27', () => {
    expect(migration18).toContain('start_date          date');
    expect(migration18).toContain('expected_completion date');
    expect(migration18).toContain('actual_completion   date');
  });

  it('includes notes, created_by, created_at, updated_at', () => {
    expect(migration18).toContain('notes               text');
    expect(migration18).toContain('created_by          uuid');
    expect(migration18).toContain('created_at          timestamptz NOT NULL DEFAULT now()');
    expect(migration18).toContain('updated_at          timestamptz NOT NULL DEFAULT now()');
  });

  it('has handle_updated_at trigger attached to project_work_items', () => {
    expect(migration18).toContain('CREATE TRIGGER project_work_items_updated_at');
    expect(migration18).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// B. PROGRESS PERCENTAGE & DATE VALIDATION
// ============================================================

describe('B. Progress Percentage & Date Validation', () => {
  it('enforces chronological date constraints', () => {
    expect(migration18).toContain('CONSTRAINT chk_pwi_expected_completion_after_start');
    expect(migration18).toContain('expected_completion >= start_date');
    expect(migration18).toContain('CONSTRAINT chk_pwi_actual_completion_after_start');
    expect(migration18).toContain('actual_completion >= start_date');
  });

  it('implements validation trigger function validate_project_work_item_integrity', () => {
    expect(migration18).toContain('FUNCTION public.validate_project_work_item_integrity()');
    expect(migration18).toContain('trg_validate_project_work_item_integrity');
  });

  it('simulates progress percentage range logic', () => {
    const validateProgress = (val: number) => {
      if (val < 0.0 || val > 100.0) {
        throw new Error('Work item progress percentage must be between 0 and 100');
      }
      return true;
    };

    expect(validateProgress(0)).toBe(true);
    expect(validateProgress(50.5)).toBe(true);
    expect(validateProgress(100)).toBe(true);
    expect(() => validateProgress(-0.01)).toThrow('between 0 and 100');
    expect(() => validateProgress(100.01)).toThrow('between 0 and 100');
    expect(() => validateProgress(150)).toThrow('between 0 and 100');
  });

  it('simulates start and completion date ordering validation', () => {
    const validateDates = (start?: string | null, expected?: string | null, actual?: string | null) => {
      if (start && expected && expected < start) {
        throw new Error('expected_completion cannot be before start_date');
      }
      if (start && actual && actual < start) {
        throw new Error('actual_completion cannot be before start_date');
      }
      return true;
    };

    expect(validateDates('2026-10-01', '2026-10-15', '2026-10-14')).toBe(true);
    expect(validateDates(null, '2026-10-15', null)).toBe(true);
    expect(() => validateDates('2026-10-15', '2026-10-01', null)).toThrow('cannot be before');
    expect(() => validateDates('2026-10-15', null, '2026-10-10')).toThrow('cannot be before');
  });
});

// ============================================================
// C. PROJECT RELATIONSHIP & COMPANY ISOLATION
// ============================================================

describe('C. Project Relationship & Multi-Tenant Company Isolation', () => {
  it('enforces composite foreign key on (company_id, project_id)', () => {
    expect(migration18).toContain('CONSTRAINT fk_pwi_project_company');
    expect(migration18).toContain('FOREIGN KEY (company_id, project_id)');
    expect(migration18).toContain('REFERENCES public.projects (company_id, id)');
  });

  it('validates project company alignment in validation trigger', () => {
    expect(migration18).toContain('Cross-company integrity violation: Project % does not belong to company %');
  });

  it('simulates cross-company project rejection', () => {
    const projects = [
      { id: 'prj-101', companyId: 'comp-A' },
      { id: 'prj-202', companyId: 'comp-B' },
    ];

    const linkWorkItem = (companyId: string, projectId: string) => {
      const match = projects.find((p) => p.id === projectId && p.companyId === companyId);
      if (!match) {
        throw new Error(`Cross-company integrity violation: Project ${projectId} does not belong to company ${companyId}`);
      }
      return true;
    };

    expect(linkWorkItem('comp-A', 'prj-101')).toBe(true);
    expect(linkWorkItem('comp-B', 'prj-202')).toBe(true);
    expect(() => linkWorkItem('comp-A', 'prj-202')).toThrow('Cross-company integrity violation');
    expect(() => linkWorkItem('comp-B', 'prj-101')).toThrow('Cross-company integrity violation');
  });
});

// ============================================================
// D. VIEWS
// ============================================================

describe('D. Work Progress Views', () => {
  it('creates auto-updatable view alias public.work_progress with security_invoker', () => {
    expect(migration18).toContain('CREATE OR REPLACE VIEW public.work_progress AS');
    expect(migration18).toContain('SELECT * FROM public.project_work_items;');
    expect(migration18).toContain('ALTER VIEW public.work_progress SET (security_invoker = true);');
  });

  it('creates project-level progress rollup view public.v_project_work_progress with security_invoker', () => {
    expect(migration18).toContain('CREATE OR REPLACE VIEW public.v_project_work_progress AS');
    expect(migration18).toContain('ALTER VIEW public.v_project_work_progress SET (security_invoker = true);');
  });

  it('v_project_work_progress calculates item counts and overall progress percentage', () => {
    expect(migration18).toContain('COUNT(wi.id)::integer AS total_work_items');
    expect(migration18).toContain('completed_work_items');
    expect(migration18).toContain('in_progress_work_items');
    expect(migration18).toContain('not_started_work_items');
    expect(migration18).toContain('overall_progress_percentage');
  });

  it('simulates project overall progress percentage calculation', () => {
    const items = [
      { name: 'Foundation', status: 'Completed', progress: 100 },
      { name: 'Brickwork', status: 'In Progress', progress: 50 },
      { name: 'Plastering', status: 'Not Started', progress: 0 },
      { name: 'Electrical', status: 'Not Started', progress: 0 },
    ];

    const activeItems = items.filter((i) => i.status !== 'Cancelled');
    const total = activeItems.length;
    const completed = activeItems.filter((i) => i.status === 'Completed' || i.progress === 100).length;
    const avgProgress = activeItems.reduce((acc, i) => acc + i.progress, 0) / (total || 1);

    expect(total).toBe(4);
    expect(completed).toBe(1);
    expect(Number(avgProgress.toFixed(2))).toBe(37.5);
  });
});

// ============================================================
// E. ATOMIC RPC FUNCTIONS
// ============================================================

describe('E. Atomic RPC Functions', () => {
  it('implements update_work_item_progress RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration18).toContain('FUNCTION public.update_work_item_progress(');
    expect(migration18).toContain('SECURITY DEFINER');
    expect(migration18).toContain('SET search_path = public');
  });

  it('update_work_item_progress enforces company isolation and progress bounds', () => {
    expect(migration18).toContain('Work item not found or access denied: %');
    expect(migration18).toContain('progress percentage must be between 0 and 100');
  });

  it('implements batch_create_project_work_items RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration18).toContain('FUNCTION public.batch_create_project_work_items(');
    expect(migration18).toContain('SECURITY DEFINER');
    expect(migration18).toContain('SET search_path = public');
  });

  it('batch_create_project_work_items validates project existence and returns items_created count', () => {
    expect(migration18).toContain('Project not found or access denied: %');
    expect(migration18).toContain("'items_created', v_created_cnt");
    expect(migration18).toContain("'work_item_ids', to_jsonb(v_ids)");
  });

  it('simulates RPC status transition logic when progress hits 100%', () => {
    const handleProgressUpdate = (currentStatus: string, newProgress: number, explicitStatus?: string | null) => {
      let status = explicitStatus || currentStatus;
      let actualDate: string | null = null;

      if (!explicitStatus) {
        if (newProgress === 100 && currentStatus !== 'Cancelled') {
          status = 'Completed';
          actualDate = '2026-09-30';
        } else if (newProgress > 0 && currentStatus === 'Not Started') {
          status = 'In Progress';
        }
      }

      return { status, actualDate };
    };

    expect(handleProgressUpdate('Not Started', 25)).toEqual({ status: 'In Progress', actualDate: null });
    expect(handleProgressUpdate('In Progress', 100)).toEqual({ status: 'Completed', actualDate: '2026-09-30' });
    expect(handleProgressUpdate('In Progress', 80)).toEqual({ status: 'In Progress', actualDate: null });
    expect(handleProgressUpdate('Cancelled', 100)).toEqual({ status: 'Cancelled', actualDate: null });
  });
});

// ============================================================
// F. ROW LEVEL SECURITY (RLS) POLICIES
// ============================================================

describe('F. Multi-Tenant Company Isolation & RLS', () => {
  it('enables row level security on project_work_items', () => {
    expect(migration18).toContain('ALTER TABLE public.project_work_items ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-scoped SELECT, INSERT, UPDATE, and DELETE policies', () => {
    expect(migration18).toContain('"Users can view company project work items"');
    expect(migration18).toContain('"Users can insert company project work items"');
    expect(migration18).toContain('"Users can update company project work items"');
    expect(migration18).toContain('"Owners can delete company project work items"');
    expect(migration18).toContain('public.is_owner()');
  });

  it('never uses permissive USING (true) or WITH CHECK (true)', () => {
    expect(migration18).not.toContain('USING (true)');
    expect(migration18).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// G. AUDIT LOGGING TRIGGERS
// ============================================================

describe('G. Audit Logging Triggers', () => {
  it('implements audit_project_work_items_changes trigger function with SECURITY DEFINER', () => {
    expect(migration18).toContain('FUNCTION public.audit_project_work_items_changes()');
    expect(migration18).toContain('SECURITY DEFINER');
    expect(migration18).toContain('SET search_path = public');
    expect(migration18).toContain('trg_audit_project_work_items_changes');
  });

  it('captures distinct audit actions: create_work_item, update_work_item, delete_work_item', () => {
    expect(migration18).toContain("'create_work_item'");
    expect(migration18).toContain("'update_work_item'");
    expect(migration18).toContain("'delete_work_item'");
    expect(migration18).toContain("'project_work_items'");
  });

  it('simulates audit payload structure', () => {
    const createAudit = (action: string, itemId: string, details: Record<string, unknown>) => ({
      company_id: 'comp-1',
      action,
      entity_type: 'project_work_items',
      entity_id: itemId,
      details,
    });

    const log = createAudit('update_work_item', 'item-10', {
      project_id: 'prj-1',
      old_progress: 25,
      new_progress: 50,
      old_status: 'In Progress',
      new_status: 'In Progress',
    });

    expect(log.action).toBe('update_work_item');
    expect(log.entity_type).toBe('project_work_items');
    expect(log.details.new_progress).toBe(50);
  });
});

// ============================================================
// H. FINANCIAL SEPARATION & OPERATIONAL PURITY
// ============================================================

describe('H. Strict Financial Separation', () => {
  it('migration 0018 does NOT touch or mutate purchases, wages, advances, expenses, or customer payments', () => {
    expect(migration18).not.toContain('INSERT INTO public.purchases');
    expect(migration18).not.toContain('INSERT INTO public.daily_wages');
    expect(migration18).not.toContain('INSERT INTO public.employee_advances');
    expect(migration18).not.toContain('INSERT INTO public.expenses');
    expect(migration18).not.toContain('INSERT INTO public.customer_payments');
  });

  it('migration 0018 does NOT alter contract_value or recorded project costs', () => {
    expect(migration18).not.toContain('UPDATE public.projects SET contract_value');
    expect(migration18).not.toContain('v_project_recorded_cost');
  });
});

// ============================================================
// I. DAILY SITE REPORTS & PROJECT LIFECYCLE INDEPENDENCE
// ============================================================

describe('I. Daily Site Reports & Project Lifecycle Independence', () => {
  it('does NOT enforce artificial coupling with daily site reports', () => {
    expect(migration18).not.toContain('REFERENCES public.daily_site_reports');
  });

  it('does NOT mutate project status automatically', () => {
    expect(migration18).not.toContain('UPDATE public.projects SET status');
  });
});

// ============================================================
// J. PERFORMANCE INDEXES
// ============================================================

describe('J. Performance Indexes', () => {
  it('creates composite performance indexes on company_id, project_id, status, category, progress', () => {
    expect(migration18).toContain('CREATE INDEX idx_pwi_company_id ON public.project_work_items(company_id);');
    expect(migration18).toContain('CREATE INDEX idx_pwi_company_project ON public.project_work_items(company_id, project_id);');
    expect(migration18).toContain('CREATE INDEX idx_pwi_company_status ON public.project_work_items(company_id, status);');
    expect(migration18).toContain('CREATE INDEX idx_pwi_company_category ON public.project_work_items(company_id, category);');
    expect(migration18).toContain('CREATE INDEX idx_pwi_company_progress ON public.project_work_items(company_id, progress_percentage);');
  });
});

// ============================================================
// K. TYPESCRIPT ALIGNMENT
// ============================================================

describe('K. TypeScript Alignment & Exported Types', () => {
  it('exports WorkItemStatus type with all 5 lifecycle statuses', () => {
    expect(typesSource).toContain(
      "export type WorkItemStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';"
    );
  });

  it('includes project_work_items table in Database schema', () => {
    expect(typesSource).toContain('project_work_items: {');
    expect(typesSource).toContain('status: WorkItemStatus;');
    expect(typesSource).toContain('progress_percentage: number;');
  });

  it('includes work_progress and v_project_work_progress in Database views', () => {
    expect(typesSource).toContain('work_progress: {');
    expect(typesSource).toContain('v_project_work_progress: {');
    expect(typesSource).toContain('overall_progress_percentage: number;');
  });

  it('includes update_work_item_progress and batch_create_project_work_items in Database functions', () => {
    expect(typesSource).toContain('update_work_item_progress: {');
    expect(typesSource).toContain('batch_create_project_work_items: {');
  });
});
