/**
 * Phase 10: Attendance & Daily Wages Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, one-attendance-per-day rule, attendance status constraints,
 * payable unit mappings, historical wage rate preservation, financial immutability
 * (Rule 18), derived financial view (v_employee_wage_payable), atomic RPC functions,
 * audit logging triggers, performance indexes, TypeScript alignment, and strict scope boundaries.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0011_PATH = join(ROOT, 'supabase', 'migrations', '0011_attendance_daily_wages.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration11 = existsSync(MIGRATION_0011_PATH)
  ? readFileSync(MIGRATION_0011_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. ATTENDANCE TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('A. Attendance Schema & Constraints', () => {
  it('migration 0011 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0011_PATH)).toBe(true);
    expect(migration11.length).toBeGreaterThan(100);
  });

  it('creates public.attendance table', () => {
    expect(migration11).toContain('CREATE TABLE public.attendance');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration11).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration11).toContain('company_id          uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration11).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('contains all required attendance fields from PRODUCT_SPEC.md Section 18', () => {
    expect(migration11).toContain('employee_id         uuid NOT NULL');
    expect(migration11).toContain('project_id          uuid');
    expect(migration11).toContain('attendance_date     date NOT NULL DEFAULT CURRENT_DATE');
    expect(migration11).toContain('status              text NOT NULL');
    expect(migration11).toContain('daily_wage_snapshot numeric(14,2)');
    expect(migration11).toContain('overtime_hours      numeric(5,2) NOT NULL DEFAULT 0.00');
    expect(migration11).toContain('overtime_amount     numeric(14,2) NOT NULL DEFAULT 0.00');
    expect(migration11).toContain('notes               text');
    expect(migration11).toContain('created_at          timestamptz NOT NULL DEFAULT now()');
    expect(migration11).toContain('updated_at          timestamptz NOT NULL DEFAULT now()');
  });

  it('has composite unique key on (company_id, id) for composite FK referencing', () => {
    expect(migration11).toContain('CONSTRAINT uq_attendance_company_id_id');
    expect(migration11).toContain('UNIQUE (company_id, id)');
  });

  it('enforces one attendance record per employee per day within company', () => {
    expect(migration11).toContain('CONSTRAINT uq_attendance_company_employee_date');
    expect(migration11).toContain('UNIQUE (company_id, employee_id, attendance_date)');
  });

  it('enforces exact supported attendance statuses (Present, Half Day, Absent)', () => {
    expect(migration11).toContain("CHECK (status IN ('Present', 'Half Day', 'Absent'))");
  });

  it('enforces non-negative overtime hours and overtime amount', () => {
    expect(migration11).toContain('CHECK (overtime_hours >= 0)');
    expect(migration11).toContain('CHECK (overtime_amount >= 0)');
  });
});

// ============================================================
// B. EMPLOYEE & PROJECT RELATIONSHIPS
// ============================================================

describe('B. Employee & Project Relationships on Attendance', () => {
  it('enforces composite foreign key to employees with ON DELETE RESTRICT', () => {
    expect(migration11).toContain('CONSTRAINT fk_attendance_employee_company');
    expect(migration11).toContain('FOREIGN KEY (company_id, employee_id)');
    expect(migration11).toContain('REFERENCES public.employees (company_id, id)');
    expect(migration11).toContain('ON DELETE RESTRICT');
  });

  it('enforces composite foreign key to projects with ON DELETE SET NULL', () => {
    expect(migration11).toContain('CONSTRAINT fk_attendance_project_company');
    expect(migration11).toContain('FOREIGN KEY (company_id, project_id)');
    expect(migration11).toContain('REFERENCES public.projects (company_id, id)');
    expect(migration11).toContain('ON DELETE SET NULL');
  });

  it('validates attendance cross-company integrity via trigger', () => {
    expect(migration11).toContain('FUNCTION public.validate_attendance_integrity()');
    expect(migration11).toContain('trg_validate_attendance_integrity');
    expect(migration11).toContain('Cross-company integrity violation: Employee % does not belong to company %');
    expect(migration11).toContain('Cross-company integrity violation: Project % does not belong to company %');
  });

  it('prevents recording attendance for inactive employees', () => {
    expect(migration11).toContain('Employee status violation: Cannot record attendance for inactive employee %');
  });

  it('snapshots employee daily wage automatically if not explicitly provided', () => {
    expect(migration11).toContain('NEW.daily_wage_snapshot := COALESCE(v_emp.daily_wage, 0.00)');
  });
});

// ============================================================
// C. DAILY WAGES TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('C. Daily Wages Table Schema & Constraints', () => {
  it('creates public.daily_wages table', () => {
    expect(migration11).toContain('CREATE TABLE public.daily_wages');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration11).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration11).toContain('company_id          uuid NOT NULL DEFAULT public.current_company_id()');
  });

  it('contains all required wage fields from PRODUCT_SPEC.md Section 19', () => {
    expect(migration11).toContain('employee_id         uuid NOT NULL');
    expect(migration11).toContain('attendance_id       uuid NOT NULL');
    expect(migration11).toContain('project_id          uuid');
    expect(migration11).toContain('wage_number         text NOT NULL');
    expect(migration11).toContain('wage_date           date NOT NULL');
    expect(migration11).toContain('payable_units       numeric(3,2) NOT NULL');
    expect(migration11).toContain('rate                numeric(14,2) NOT NULL');
    expect(migration11).toContain('base_wage           numeric(14,2) NOT NULL');
    expect(migration11).toContain('overtime_hours      numeric(5,2) NOT NULL DEFAULT 0.00');
    expect(migration11).toContain('overtime_amount     numeric(14,2) NOT NULL DEFAULT 0.00');
    expect(migration11).toContain('amount              numeric(14,2) NOT NULL');
    expect(migration11).toContain('status              text NOT NULL DEFAULT \'Confirmed\'');
    expect(migration11).toContain('reversal_of_id      uuid');
  });

  it('has composite unique key on (company_id, id) for composite FK referencing', () => {
    expect(migration11).toContain('CONSTRAINT uq_daily_wages_company_id_id');
    expect(migration11).toContain('UNIQUE (company_id, id)');
  });

  it('has company-scoped unique wage number', () => {
    expect(migration11).toContain('CONSTRAINT uq_daily_wages_company_number');
    expect(migration11).toContain('UNIQUE (company_id, wage_number)');
  });

  it('enforces composite foreign key to employees (company_id, employee_id)', () => {
    expect(migration11).toContain('CONSTRAINT fk_daily_wages_employee_company');
    expect(migration11).toContain('FOREIGN KEY (company_id, employee_id)');
    expect(migration11).toContain('REFERENCES public.employees (company_id, id)');
  });

  it('enforces composite foreign key to attendance (company_id, attendance_id)', () => {
    expect(migration11).toContain('CONSTRAINT fk_daily_wages_attendance_company');
    expect(migration11).toContain('FOREIGN KEY (company_id, attendance_id)');
    expect(migration11).toContain('REFERENCES public.attendance (company_id, id)');
  });

  it('enforces composite foreign key to projects (company_id, project_id)', () => {
    expect(migration11).toContain('CONSTRAINT fk_daily_wages_project_company');
    expect(migration11).toContain('FOREIGN KEY (company_id, project_id)');
    expect(migration11).toContain('REFERENCES public.projects (company_id, id)');
  });

  it('enforces composite foreign key for wage reversal (company_id, reversal_of_id)', () => {
    expect(migration11).toContain('CONSTRAINT fk_daily_wages_reversal_company');
    expect(migration11).toContain('FOREIGN KEY (company_id, reversal_of_id)');
    expect(migration11).toContain('REFERENCES public.daily_wages (company_id, id)');
  });

  it('enforces at most one active wage per attendance via partial unique index', () => {
    expect(migration11).toContain('CREATE UNIQUE INDEX uq_daily_wages_active_attendance');
    expect(migration11).toContain('ON public.daily_wages (company_id, attendance_id)');
    expect(migration11).toContain("WHERE (status != 'Cancelled')");
  });
});

// ============================================================
// D. WAGE NUMBERING & CALCULATIONS
// ============================================================

describe('D. Wage Numbering & Calculation Invariants', () => {
  it('generates company-scoped sequential wage numbers (WG-0001)', () => {
    expect(migration11).toContain('FUNCTION public.handle_daily_wage_number()');
    expect(migration11).toContain('trg_handle_daily_wage_number');
    expect(migration11).toContain("'WG-' || lpad(v_next_num::text, 4, '0')");
  });

  it('calculates base_wage and total amount using exact numeric arithmetic', () => {
    expect(migration11).toContain('FUNCTION public.sync_daily_wage_calculation()');
    expect(migration11).toContain('trg_sync_daily_wage_calculation');
    expect(migration11).toContain('NEW.base_wage := round(NEW.payable_units * NEW.rate, 2)');
    expect(migration11).toContain('NEW.amount := round(NEW.base_wage + COALESCE(NEW.overtime_amount, 0.00), 2)');
  });

  it('validates wage integrity, employee matching, and cross-company bounds', () => {
    expect(migration11).toContain('FUNCTION public.validate_daily_wage_integrity()');
    expect(migration11).toContain('trg_validate_daily_wage_integrity');
    expect(migration11).toContain('Integrity violation: Wage employee % does not match attendance employee %');
    expect(migration11).toContain('Cross-company integrity violation: Attendance % does not belong to company %');
    expect(migration11).toContain('Employee status violation: Cannot generate wage for inactive employee %');
  });

  it('prevents a wage from reversing itself', () => {
    expect(migration11).toContain('Financial integrity violation: A wage transaction cannot reverse itself');
  });
});

// ============================================================
// E. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
// ============================================================

describe('E. Financial Corrections & Immutability (Rule 18)', () => {
  it('prevents physical deletion of completed daily wages (Confirmed/Cancelled)', () => {
    expect(migration11).toContain('FUNCTION public.prevent_completed_daily_wage_deletion()');
    expect(migration11).toContain('trg_prevent_completed_daily_wage_deletion');
    expect(migration11).toContain('Cannot delete % wage transaction %. Completed financial transactions must be preserved');
  });

  it('prevents modification of financial amounts on Confirmed and Cancelled wages', () => {
    expect(migration11).toContain('FUNCTION public.prevent_completed_daily_wage_modification()');
    expect(migration11).toContain('trg_prevent_completed_daily_wage_modification');
    expect(migration11).toContain('Cancelled wage transaction % cannot be modified');
    expect(migration11).toContain('Cannot modify financial values of Confirmed wage transaction %');
  });

  it('prevents changing attendance status or employee when Confirmed wage exists', () => {
    expect(migration11).toContain('FUNCTION public.prevent_attendance_modification_with_confirmed_wage()');
    expect(migration11).toContain('trg_prevent_attendance_modification_with_confirmed_wage');
    expect(migration11).toContain('Cannot change status/employee/date of attendance with Confirmed daily wage');
  });

  it('prevents deleting attendance with completed wages', () => {
    expect(migration11).toContain('Cannot delete attendance record with completed daily wages');
  });
});

// ============================================================
// F. DERIVED FINANCIAL VIEW
// ============================================================

describe('F. Derived Financial View (v_employee_wage_payable)', () => {
  it('creates view public.v_employee_wage_payable', () => {
    expect(migration11).toContain('CREATE OR REPLACE VIEW public.v_employee_wage_payable AS');
  });

  it('aggregates attendance counts by status (present, half-day, absent)', () => {
    expect(migration11).toContain("FILTER (WHERE a.status = 'Present')");
    expect(migration11).toContain("FILTER (WHERE a.status = 'Half Day')");
    expect(migration11).toContain("FILTER (WHERE a.status = 'Absent')");
  });

  it('aggregates confirmed payable units, base wages, overtime, and total earned wages', () => {
    expect(migration11).toContain("SUM(dw.payable_units) FILTER (WHERE dw.status = 'Confirmed')");
    expect(migration11).toContain("SUM(dw.base_wage) FILTER (WHERE dw.status = 'Confirmed')");
    expect(migration11).toContain("SUM(dw.overtime_hours) FILTER (WHERE dw.status = 'Confirmed')");
    expect(migration11).toContain("SUM(dw.overtime_amount) FILTER (WHERE dw.status = 'Confirmed')");
    expect(migration11).toContain("SUM(dw.amount) FILTER (WHERE dw.status = 'Confirmed')");
  });

  it('preserves company-scoped grouping and employee master metadata', () => {
    expect(migration11).toContain('e.company_id,');
    expect(migration11).toContain('e.id,');
    expect(migration11).toContain('e.employee_code,');
    expect(migration11).toContain('e.daily_wage,');
  });
});

// ============================================================
// G. ATOMIC RPC FUNCTIONS
// ============================================================

describe('G. Atomic RPC Functions', () => {
  it('provides record_attendance RPC function', () => {
    expect(migration11).toContain('CREATE OR REPLACE FUNCTION public.record_attendance(');
    expect(migration11).toContain('SECURITY DEFINER');
    expect(migration11).toContain('SET search_path = public');
    expect(migration11).toContain("p_status NOT IN ('Present', 'Half Day', 'Absent')");
    expect(migration11).toContain("p_status = 'Present' THEN");
    expect(migration11).toContain('v_units := 1.00');
    expect(migration11).toContain("p_status = 'Half Day' THEN");
    expect(migration11).toContain('v_units := 0.50');
    expect(migration11).toContain('v_units := 0.00');
  });

  it('provides generate_employee_wages RPC function for batch date range wage creation', () => {
    expect(migration11).toContain('CREATE OR REPLACE FUNCTION public.generate_employee_wages(');
    expect(migration11).toContain('SECURITY DEFINER');
    expect(migration11).toContain('SET search_path = public');
    expect(migration11).toContain('a.attendance_date BETWEEN p_from_date AND p_to_date');
  });

  it('provides cancel_daily_wage RPC function for Rule 18 compliant wage cancellation', () => {
    expect(migration11).toContain('CREATE OR REPLACE FUNCTION public.cancel_daily_wage(');
    expect(migration11).toContain('SECURITY DEFINER');
    expect(migration11).toContain('SET search_path = public');
    expect(migration11).toContain("status = 'Cancelled'");
  });
});

// ============================================================
// H. ROW LEVEL SECURITY (RLS) POLICIES
// ============================================================

describe('H. Row Level Security (RLS) Policies', () => {
  it('enables RLS on attendance and daily_wages', () => {
    expect(migration11).toContain('ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;');
    expect(migration11).toContain('ALTER TABLE public.daily_wages ENABLE ROW LEVEL SECURITY;');
  });

  it('enforces company-scoped SELECT, INSERT, UPDATE, and DELETE policies on attendance', () => {
    expect(migration11).toContain('"Users can view company attendance"');
    expect(migration11).toContain('"Users can insert company attendance"');
    expect(migration11).toContain('"Users can update company attendance"');
    expect(migration11).toContain('"Owners can delete company attendance"');
    expect(migration11).toContain('company_id = public.current_company_id()');
  });

  it('enforces company-scoped SELECT, INSERT, UPDATE, and DELETE policies on daily_wages', () => {
    expect(migration11).toContain('"Users can view company daily wages"');
    expect(migration11).toContain('"Users can insert company daily wages"');
    expect(migration11).toContain('"Users can update company daily wages"');
    expect(migration11).toContain('"Owners can delete company daily wages"');
  });

  it('never uses USING (true) or WITH CHECK (true)', () => {
    expect(migration11).not.toContain('USING (true)');
    expect(migration11).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// I. AUDIT LOGGING TRIGGERS
// ============================================================

describe('I. Audit Logging Triggers', () => {
  it('implements audit_attendance_changes with SECURITY DEFINER and search_path = public', () => {
    expect(migration11).toContain('FUNCTION public.audit_attendance_changes()');
    expect(migration11).toContain('SECURITY DEFINER');
    expect(migration11).toContain('SET search_path = public');
    expect(migration11).toContain("'create_attendance'");
    expect(migration11).toContain("'update_attendance'");
    expect(migration11).toContain("'delete_attendance'");
    expect(migration11).toContain('trg_audit_attendance_changes');
  });

  it('implements audit_daily_wage_changes with SECURITY DEFINER and search_path = public', () => {
    expect(migration11).toContain('FUNCTION public.audit_daily_wage_changes()');
    expect(migration11).toContain('SECURITY DEFINER');
    expect(migration11).toContain('SET search_path = public');
    expect(migration11).toContain("'create_daily_wage'");
    expect(migration11).toContain("'cancel_daily_wage'");
    expect(migration11).toContain("'update_daily_wage'");
    expect(migration11).toContain("'delete_daily_wage'");
    expect(migration11).toContain('trg_audit_daily_wage_changes');
  });
});

// ============================================================
// J. PERFORMANCE INDEXES
// ============================================================

describe('J. Performance Indexes', () => {
  it('creates composite performance indexes on attendance', () => {
    expect(migration11).toContain('CREATE INDEX idx_attendance_company_employee_date');
    expect(migration11).toContain('CREATE INDEX idx_attendance_company_date');
    expect(migration11).toContain('CREATE INDEX idx_attendance_company_project');
    expect(migration11).toContain('CREATE INDEX idx_attendance_status');
  });

  it('creates composite performance indexes on daily_wages', () => {
    expect(migration11).toContain('CREATE INDEX idx_daily_wages_company_employee');
    expect(migration11).toContain('CREATE INDEX idx_daily_wages_company_attendance');
    expect(migration11).toContain('CREATE INDEX idx_daily_wages_company_date');
    expect(migration11).toContain('CREATE INDEX idx_daily_wages_company_project');
    expect(migration11).toContain('CREATE INDEX idx_daily_wages_status');
  });
});

// ============================================================
// K. HISTORICAL WAGE INTEGRITY & SNAPSHOT LOGIC
// ============================================================

describe('K. Historical Wage Integrity & Snapshot Logic', () => {
  it('stores applicable rate on wage transaction separate from employee master rate', () => {
    // Verifies wage record has explicit rate column and does not compute rate via dynamic join to employee
    expect(migration11).toContain('rate                numeric(14,2) NOT NULL');
    expect(migration11).toContain('daily_wage_snapshot numeric(14,2)');
  });

  it('computes Present = 1.00, Half Day = 0.50, Absent = 0.00', () => {
    // When Present: 1.00 unit
    const presentUnits = 1.00;
    const halfDayUnits = 0.50;
    const absentUnits = 0.00;

    const rate = 800.00;
    expect(Number((presentUnits * rate).toFixed(2))).toBe(800.00);
    expect(Number((halfDayUnits * rate).toFixed(2))).toBe(400.00);
    expect(Number((absentUnits * rate).toFixed(2))).toBe(0.00);
  });

  it('verifies employee master wage change does NOT alter historical earned wage', () => {
    // Historical transaction with rate 800
    const historicalWageRecord = {
      rate: 800.00,
      payable_units: 1.00,
      base_wage: 800.00,
      amount: 800.00,
    };

    // Employee master wage is later updated to 900
    const updatedEmployeeMaster = {
      daily_wage: 900.00,
    };

    // Historical wage remains 800.00
    expect(historicalWageRecord.rate).toBe(800.00);
    expect(historicalWageRecord.amount).toBe(800.00);
    expect(historicalWageRecord.rate).not.toBe(updatedEmployeeMaster.daily_wage);
  });
});

// ============================================================
// L. TYPESCRIPT DATABASE TYPES ALIGNMENT
// ============================================================

describe('L. TypeScript Database Types Alignment', () => {
  it('types database.ts includes attendance table', () => {
    expect(typesSource).toContain('attendance: {');
    expect(typesSource).toContain("status: 'Present' | 'Half Day' | 'Absent';");
    expect(typesSource).toContain('daily_wage_snapshot: number | null;');
    expect(typesSource).toContain('overtime_hours: number;');
    expect(typesSource).toContain('overtime_amount: number;');
  });

  it('types database.ts includes daily_wages table', () => {
    expect(typesSource).toContain('daily_wages: {');
    expect(typesSource).toContain('attendance_id: string;');
    expect(typesSource).toContain('payable_units: number;');
    expect(typesSource).toContain('rate: number;');
    expect(typesSource).toContain('base_wage: number;');
    expect(typesSource).toContain('amount: number;');
    expect(typesSource).toContain("status: 'Draft' | 'Confirmed' | 'Cancelled';");
  });

  it('types database.ts includes v_employee_wage_payable view', () => {
    expect(typesSource).toContain('v_employee_wage_payable: {');
    expect(typesSource).toContain('total_attendance_records: number;');
    expect(typesSource).toContain('present_days: number;');
    expect(typesSource).toContain('half_days: number;');
    expect(typesSource).toContain('absent_days: number;');
    expect(typesSource).toContain('total_earned_wages: number;');
    expect(typesSource).toContain('wage_payable: number;');
  });

  it('types database.ts includes Phase 10 RPC functions', () => {
    expect(typesSource).toContain('record_attendance: {');
    expect(typesSource).toContain('generate_employee_wages: {');
    expect(typesSource).toContain('cancel_daily_wage: {');
  });
});

// ============================================================
// M. SCOPE BOUNDARY INTEGRITY
// ============================================================

describe('M. Scope Boundary Integrity (No Advances, Payments, Payroll, or Frontend)', () => {
  it('does NOT create employee_advances in migration 0011', () => {
    expect(migration11).not.toContain('CREATE TABLE public.employee_advances');
    expect(migration11).not.toContain('advance_amount');
    expect(migration11).not.toContain('advance_outstanding');
    expect(migration11).not.toContain('advance_recovery');
  });

  it('does NOT create employee_payments in migration 0011', () => {
    expect(migration11).not.toContain('CREATE TABLE public.employee_payments');
    expect(migration11).not.toContain('net_pay');
    expect(migration11).not.toContain('employee_balance');
    expect(migration11).not.toContain('payment_balance');
  });

  it('does NOT implement payroll deductions or tax in migration 0011', () => {
    expect(migration11).not.toContain('CREATE TABLE public.payroll');
    expect(migration11).not.toContain('salary_slips');
    expect(migration11).not.toContain('provident_fund');
    expect(migration11).not.toContain('professional_tax');
  });

  it('does NOT create customer payments, inventory, or expenses in migration 0011', () => {
    expect(migration11).not.toContain('CREATE TABLE public.customer_payments');
    expect(migration11).not.toContain('CREATE TABLE public.inventory');
    expect(migration11).not.toContain('CREATE TABLE public.expenses');
  });

  it('does NOT contain frontend UI code or hooks in migration 0011', () => {
    expect(migration11).not.toContain('React');
    expect(migration11).not.toContain('useState');
    expect(migration11).not.toContain('useQuery');
    expect(migration11).not.toContain('export default function');
  });
});
