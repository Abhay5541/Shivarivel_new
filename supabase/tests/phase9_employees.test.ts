/**
 * Phase 9: Employees Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * company isolation, employee numbering (e.g. EMP-0001), status constraints,
 * master wage reference field validation, audit logging, performance indexes,
 * TypeScript types alignment, and strict scope boundaries for:
 * 1. Employees table schema & constraints
 * 2. Company isolation & composite unique key
 * 3. Company-scoped sequential employee numbering
 * 4. Status lifecycle & non-blank name validation
 * 5. Master daily wage field validation (catalog reference only, non-negative)
 * 6. Contact and emergency contact fields
 * 7. Row Level Security (RLS) & Owner-only deletion
 * 8. Audit logging triggers for employee creation, updates, and status changes
 * 9. Performance indexes
 * 10. TypeScript database types alignment
 * 11. Strict scope integrity (no attendance, wages, advances, payments, payroll, or frontend code)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0010_PATH = join(ROOT, 'supabase', 'migrations', '0010_employees.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration10 = existsSync(MIGRATION_0010_PATH)
  ? readFileSync(MIGRATION_0010_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. TABLE STRUCTURE & SCHEMA
// ============================================================

describe('A. Employees Table Structure & Schema', () => {
  it('migration 0010 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0010_PATH)).toBe(true);
    expect(migration10.length).toBeGreaterThan(100);
  });

  it('creates public.employees table', () => {
    expect(migration10).toContain('CREATE TABLE public.employees');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration10).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration10).toContain('company_id        uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration10).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('contains all required employee fields from PRODUCT_SPEC.md Section 17', () => {
    const fields = [
      'employee_code',
      'name',
      'phone',
      'worker_type',
      'daily_wage',
      'status',
      'joining_date',
      'emergency_contact',
      'photo_url',
      'address',
      'notes',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration10).toContain(field);
    }
  });

  it('attaches updated_at trigger to employees', () => {
    expect(migration10).toContain('CREATE TRIGGER employees_updated_at');
    expect(migration10).toContain('BEFORE UPDATE ON public.employees');
  });
});

// ============================================================
// B. COMPANY ISOLATION & COMPOSITE KEYS
// ============================================================

describe('B. Company Isolation & Composite Keys', () => {
  it('enforces composite unique constraint on (company_id, id)', () => {
    expect(migration10).toContain('CONSTRAINT uq_employees_company_id_id');
    expect(migration10).toContain('UNIQUE (company_id, id)');
  });

  it('enforces unique employee_code within company', () => {
    expect(migration10).toContain('CONSTRAINT uq_employees_company_code');
    expect(migration10).toContain('UNIQUE (company_id, employee_code)');
  });
});

// ============================================================
// C. EMPLOYEE IDENTITY & SEQUENTIAL NUMBERING
// ============================================================

describe('C. Employee Identity & Numbering', () => {
  it('defines handle_employee_code trigger function generating EMP-0001 format', () => {
    expect(migration10).toContain('CREATE OR REPLACE FUNCTION public.handle_employee_code()');
    expect(migration10).toContain("'EMP-' || lpad(v_next_num::text, 4, '0')");
  });

  it('attaches handle_employee_code BEFORE INSERT ON employees', () => {
    expect(migration10).toContain('CREATE TRIGGER trg_handle_employee_code');
    expect(migration10).toContain('BEFORE INSERT ON public.employees');
  });
});

// ============================================================
// D. STATUS & NAME VALIDATION
// ============================================================

describe('D. Status & Name Validation', () => {
  it('rejects blank employee name', () => {
    expect(migration10).toContain('name              text NOT NULL CHECK (char_length(trim(name)) > 0)');
  });

  it('enforces status in (active, inactive) with default active', () => {
    expect(migration10).toContain("DEFAULT 'active'");
    expect(migration10).toContain("CHECK (status IN ('active', 'inactive', 'Active', 'Inactive'))");
  });
});

// ============================================================
// E. MASTER WAGE FIELD VALIDATION
// ============================================================

describe('E. Master Wage Field Validation', () => {
  it('daily_wage uses numeric(14,2) and rejects negative values', () => {
    expect(migration10).toContain('daily_wage        numeric(14,2) CHECK (daily_wage IS NULL OR daily_wage >= 0)');
    expect(migration10).not.toMatch(/daily_wage\s+(float|real|double)/i);
  });

  it('does NOT contain wage calculations, liabilities, or payroll logic in master table', () => {
    const forbidden = [
      'wage_payable',
      'wages_earned',
      'total_wages',
      'advance_balance',
      'net_salary',
      'gross_pay',
      'deductions',
      'calculate_wage',
    ];
    for (const term of forbidden) {
      expect(migration10).not.toContain(term);
    }
  });
});

// ============================================================
// F. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('F. Row Level Security Policies', () => {
  it('enables RLS on employees', () => {
    expect(migration10).toContain('ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-isolated SELECT/INSERT/UPDATE for employees', () => {
    expect(migration10).toContain('CREATE POLICY "Users can view company employees"');
    expect(migration10).toContain('CREATE POLICY "Users can insert company employees"');
    expect(migration10).toContain('CREATE POLICY "Users can update company employees"');
    expect(migration10).toContain('company_id = public.current_company_id()');
  });

  it('restricts employee deletion to owners only', () => {
    expect(migration10).toContain('CREATE POLICY "Owners can delete company employees"');
    expect(migration10).toMatch(/company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('does NOT contain permissive USING (true) or WITH CHECK (true)', () => {
    expect(migration10).not.toContain('USING (true)');
    expect(migration10).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// G. AUDIT LOGGING
// ============================================================

describe('G. Audit Logging Triggers', () => {
  it('defines audit_employee_changes function and trigger', () => {
    expect(migration10).toContain('CREATE OR REPLACE FUNCTION public.audit_employee_changes()');
    expect(migration10).toContain("'create_employee'");
    expect(migration10).toContain("'employee_status_change'");
    expect(migration10).toContain("'update_employee'");
    expect(migration10).toContain("'delete_employee'");
    expect(migration10).toContain('CREATE TRIGGER trg_audit_employee_changes');
    expect(migration10).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.employees');
  });

  it('enforces SECURITY DEFINER and search_path = public on audit and numbering functions', () => {
    const lines = migration10.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration10.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });
});

// ============================================================
// H. PERFORMANCE INDEXES
// ============================================================

describe('H. Performance Indexes', () => {
  it('creates performance indexes on employees', () => {
    expect(migration10).toContain('CREATE INDEX idx_employees_company_id');
    expect(migration10).toContain('CREATE INDEX idx_employees_company_status');
    expect(migration10).toContain('CREATE INDEX idx_employees_company_code');
    expect(migration10).toContain('CREATE INDEX idx_employees_company_name');
    expect(migration10).toContain('CREATE INDEX idx_employees_company_phone');
    expect(migration10).toContain('CREATE INDEX idx_employees_company_worker_type');
  });
});

// ============================================================
// I. TYPESCRIPT DATABASE TYPES
// ============================================================

describe('I. TypeScript Database Types', () => {
  it('defines employees table in Database interface', () => {
    expect(typesSource).toContain('employees: {');
    expect(typesSource).toContain("status: 'active' | 'inactive' | 'Active' | 'Inactive';");
    expect(typesSource).toContain('employee_code: string;');
    expect(typesSource).toContain('name: string;');
    expect(typesSource).toContain('daily_wage: number | null;');
    expect(typesSource).toContain('worker_type: string | null;');
    expect(typesSource).toContain('emergency_contact: string | null;');
    expect(typesSource).toContain('photo_url: string | null;');
  });
});

// ============================================================
// J. SCOPE INTEGRITY & BOUNDARY PROTECTION
// ============================================================

describe('J. Scope Integrity & Boundary Protection', () => {
  it('does NOT create future business tables in Phase 9', () => {
    const forbidden = [
      'CREATE TABLE public.attendance',
      'CREATE TABLE public.daily_wages',
      'CREATE TABLE public.employee_advances',
      'CREATE TABLE public.employee_payments',
      'CREATE TABLE public.salary_payments',
      'CREATE TABLE public.payroll',
      'CREATE TABLE public.deductions',
      'CREATE TABLE public.expenses',
      'CREATE TABLE public.customer_payments',
      'CREATE TABLE public.tasks',
      'CREATE TABLE public.work_progress',
      'CREATE TABLE public.daily_reports',
      'CREATE TABLE public.milestones',
    ];
    for (const table of forbidden) {
      expect(migration10).not.toContain(table);
    }
  });

  it('does NOT confuse employees with application users (profiles)', () => {
    expect(migration10).not.toContain('auth.users');
    expect(migration10).not.toContain('password');
    expect(migration10).not.toContain('user_id uuid REFERENCES public.profiles');
  });
});
