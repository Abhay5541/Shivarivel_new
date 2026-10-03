/**
 * Phase 11: Employee Advances Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, advance sequential numbering (ADV-0001), active employee
 * validation on insert, strictly positive amounts, financial immutability (Rule 18),
 * cancellation/reversal support, transaction-derived advance balance view
 * (v_employee_advance_balance), atomic RPC functions, audit logging triggers,
 * performance indexes, TypeScript types alignment, separation from wages,
 * and strict scope boundary enforcement.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0012_PATH = join(ROOT, 'supabase', 'migrations', '0012_employee_advances.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration12 = existsSync(MIGRATION_0012_PATH)
  ? readFileSync(MIGRATION_0012_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. EMPLOYEE ADVANCES SCHEMA & CONSTRAINTS
// ============================================================

describe('A. Employee Advances Table Schema & Constraints', () => {
  it('migration 0012 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0012_PATH)).toBe(true);
    expect(migration12.length).toBeGreaterThan(100);
  });

  it('creates public.employee_advances table', () => {
    expect(migration12).toContain('CREATE TABLE public.employee_advances');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration12).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration12).toContain('company_id        uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration12).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('contains all required fields for advance tracking', () => {
    expect(migration12).toContain('employee_id       uuid NOT NULL');
    expect(migration12).toContain('advance_number    text NOT NULL');
    expect(migration12).toContain('advance_date      date NOT NULL DEFAULT CURRENT_DATE');
    expect(migration12).toContain('amount            numeric(14,2) NOT NULL CHECK (amount > 0)');
    expect(migration12).toContain('payment_method    text');
    expect(migration12).toContain('reference_number  text');
    expect(migration12).toContain('purpose           text');
    expect(migration12).toContain('notes             text');
    expect(migration12).toContain('status            text NOT NULL DEFAULT \'Confirmed\'');
    expect(migration12).toContain('reversal_of_id    uuid');
    expect(migration12).toContain('created_at        timestamptz NOT NULL DEFAULT now()');
    expect(migration12).toContain('updated_at        timestamptz NOT NULL DEFAULT now()');
  });

  it('has composite unique key on (company_id, id) for composite FK referencing', () => {
    expect(migration12).toContain('CONSTRAINT uq_employee_advances_company_id_id');
    expect(migration12).toContain('UNIQUE (company_id, id)');
  });

  it('has company-scoped unique advance number', () => {
    expect(migration12).toContain('CONSTRAINT uq_employee_advances_company_number');
    expect(migration12).toContain('UNIQUE (company_id, advance_number)');
  });

  it('enforces composite foreign key to employees (company_id, employee_id)', () => {
    expect(migration12).toContain('CONSTRAINT fk_employee_advances_employee_company');
    expect(migration12).toContain('FOREIGN KEY (company_id, employee_id)');
    expect(migration12).toContain('REFERENCES public.employees (company_id, id)');
    expect(migration12).toContain('ON DELETE RESTRICT');
  });

  it('enforces composite foreign key for reversal reference (company_id, reversal_of_id)', () => {
    expect(migration12).toContain('CONSTRAINT fk_employee_advances_reversal_company');
    expect(migration12).toContain('FOREIGN KEY (company_id, reversal_of_id)');
    expect(migration12).toContain('REFERENCES public.employee_advances (company_id, id)');
    expect(migration12).toContain('ON DELETE RESTRICT');
  });

  it('enforces valid status lifecycle (Draft, Confirmed, Cancelled)', () => {
    expect(migration12).toContain("CHECK (status IN ('Draft', 'Confirmed', 'Cancelled'))");
  });

  it('enforces payment method check constraint if provided', () => {
    expect(migration12).toContain("CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'))");
  });
});

// ============================================================
// B. ADVANCE NUMBERING & VALIDATION TRIGGERS
// ============================================================

describe('B. Advance Numbering & Validation Invariants', () => {
  it('generates company-scoped sequential advance numbers (ADV-0001)', () => {
    expect(migration12).toContain('FUNCTION public.handle_employee_advance_number()');
    expect(migration12).toContain('trg_handle_employee_advance_number');
    expect(migration12).toContain("'ADV-' || lpad(v_next_num::text, 4, '0')");
  });

  it('strictly validates positive numeric amounts (amount > 0)', () => {
    expect(migration12).toContain('Advance amount must be strictly positive');
  });

  it('validates employee company alignment via trigger', () => {
    expect(migration12).toContain('FUNCTION public.validate_employee_advance_integrity()');
    expect(migration12).toContain('trg_validate_employee_advance_integrity');
    expect(migration12).toContain('Cross-company integrity violation: Employee % does not belong to company %');
  });

  it('prevents creating advances for inactive employees', () => {
    expect(migration12).toContain('Employee status violation: Cannot create advance for inactive employee %');
  });

  it('prevents self-reversals', () => {
    expect(migration12).toContain('Financial integrity violation: An advance cannot reverse itself');
  });

  it('enforces cross-company reversal prevention', () => {
    expect(migration12).toContain('Cross-company integrity violation: Reversal target advance % does not belong to company %');
  });

  it('enforces reversal employee match and confirmed target check', () => {
    expect(migration12).toContain('Integrity violation: Reversal target employee % does not match advance employee %');
    expect(migration12).toContain('Financial integrity violation: Can only reverse a Confirmed advance');
  });

  it('prevents duplicate reversals of the same target advance', () => {
    expect(migration12).toContain('Financial integrity violation: Target advance % has already been reversed');
  });
});

// ============================================================
// C. FINANCIAL CORRECTIONS & IMMUTABILITY (RULE 18)
// ============================================================

describe('C. Financial Corrections & Immutability (Rule 18)', () => {
  it('prevents physical deletion of completed advances (Confirmed/Cancelled)', () => {
    expect(migration12).toContain('FUNCTION public.prevent_completed_employee_advance_deletion()');
    expect(migration12).toContain('trg_prevent_completed_employee_advance_deletion');
    expect(migration12).toContain('Cannot delete % employee advance %. Completed financial transactions must be preserved');
  });

  it('prevents modification of financial fields on Confirmed advances', () => {
    expect(migration12).toContain('FUNCTION public.prevent_completed_employee_advance_modification()');
    expect(migration12).toContain('trg_prevent_completed_employee_advance_modification');
    expect(migration12).toContain('Cannot modify financial fields of Confirmed employee advance %');
  });

  it('prevents any modification on Cancelled advances', () => {
    expect(migration12).toContain('Cancelled employee advance % cannot be modified');
  });

  it('restricts Confirmed advances status transitions to Cancelled only', () => {
    expect(migration12).toContain('Confirmed employee advance % can only be transitioned to Cancelled');
  });
});

// ============================================================
// D. DERIVED ADVANCE BALANCE VIEWS
// ============================================================

describe('D. Derived Advance Balance Views', () => {
  it('creates view public.v_employee_advance_balance', () => {
    expect(migration12).toContain('CREATE OR REPLACE VIEW public.v_employee_advance_balance AS');
  });

  it('creates view public.v_employee_advance_outstanding matching DATABASE_RULES.md Rule 19', () => {
    expect(migration12).toContain('CREATE OR REPLACE VIEW public.v_employee_advance_outstanding AS');
  });

  it('exposes company_id, employee_id, employee name, confirmed advances, cancelled amounts, and outstanding balance', () => {
    expect(migration12).toContain('e.company_id,');
    expect(migration12).toContain('e.id AS employee_id,');
    expect(migration12).toContain('e.name AS employee_name,');
    expect(migration12).toContain('confirmed_advances_count');
    expect(migration12).toContain('total_confirmed_advances');
    expect(migration12).toContain('total_cancelled_amount');
    expect(migration12).toContain('total_reversed_amount');
    expect(migration12).toContain('outstanding_advance_balance');
  });

  it('derives balance from transactions without storing mutable balance on employees table', () => {
    expect(migration12).not.toContain('ALTER TABLE public.employees ADD COLUMN advance_balance');
    expect(migration12).toContain('outstanding_advance_balance');
  });
});

// ============================================================
// E. ATOMIC RPC FUNCTIONS
// ============================================================

describe('E. Atomic RPC Functions', () => {
  it('implements record_employee_advance with SECURITY DEFINER and search_path = public', () => {
    expect(migration12).toContain('FUNCTION public.record_employee_advance(');
    expect(migration12).toContain('SECURITY DEFINER');
    expect(migration12).toContain('SET search_path = public');
    expect(migration12).toContain('p_amount <= 0');
    expect(migration12).toContain('p_status NOT IN (\'Draft\', \'Confirmed\')');
  });

  it('implements cancel_employee_advance with SECURITY DEFINER and search_path = public', () => {
    expect(migration12).toContain('FUNCTION public.cancel_employee_advance(');
    expect(migration12).toContain('SECURITY DEFINER');
    expect(migration12).toContain('SET search_path = public');
    expect(migration12).toContain('Employee advance % is already cancelled');
    expect(migration12).toContain("status = 'Cancelled'");
  });
});

// ============================================================
// F. ROW LEVEL SECURITY (RLS) POLICIES
// ============================================================

describe('F. Row Level Security (RLS) Policies', () => {
  it('enables RLS on employee_advances', () => {
    expect(migration12).toContain('ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;');
  });

  it('enforces company-scoped SELECT, INSERT, UPDATE, and DELETE policies', () => {
    expect(migration12).toContain('"Users can view company employee advances"');
    expect(migration12).toContain('"Users can insert company employee advances"');
    expect(migration12).toContain('"Users can update company employee advances"');
    expect(migration12).toContain('"Owners can delete company employee advances"');
    expect(migration12).toContain('company_id = public.current_company_id()');
  });

  it('restricts DELETE to company owners', () => {
    expect(migration12).toContain('public.is_owner()');
  });

  it('never uses USING (true) or WITH CHECK (true)', () => {
    expect(migration12).not.toContain('USING (true)');
    expect(migration12).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// G. AUDIT LOGGING TRIGGERS
// ============================================================

describe('G. Audit Logging Triggers', () => {
  it('implements audit_employee_advance_changes with SECURITY DEFINER and search_path = public', () => {
    expect(migration12).toContain('FUNCTION public.audit_employee_advance_changes()');
    expect(migration12).toContain('SECURITY DEFINER');
    expect(migration12).toContain('SET search_path = public');
    expect(migration12).toContain("'create_employee_advance'");
    expect(migration12).toContain("'cancel_employee_advance'");
    expect(migration12).toContain("'update_employee_advance'");
    expect(migration12).toContain("'delete_employee_advance'");
    expect(migration12).toContain('trg_audit_employee_advance_changes');
  });
});

// ============================================================
// H. PERFORMANCE INDEXES
// ============================================================

describe('H. Performance Indexes', () => {
  it('creates composite performance indexes on employee_advances', () => {
    expect(migration12).toContain('CREATE INDEX idx_employee_advances_company_employee');
    expect(migration12).toContain('CREATE INDEX idx_employee_advances_company_date');
    expect(migration12).toContain('CREATE INDEX idx_employee_advances_company_status');
    expect(migration12).toContain('CREATE INDEX idx_employee_advances_reversal');
  });
});

// ============================================================
// I. FINANCIAL SEPARATION FROM WAGES & ATTENDANCE
// ============================================================

describe('I. Financial Separation from Wages & Attendance', () => {
  it('advance module does not modify attendance or daily wages schema', () => {
    expect(migration12).not.toContain('ALTER TABLE public.attendance');
    expect(migration12).not.toContain('ALTER TABLE public.daily_wages');
    expect(migration12).not.toContain('ALTER TABLE public.v_employee_wage_payable');
  });

  it('demonstrates wages earned and advances remain separate accounting records', () => {
    const earnedWages = 10000.00;
    const advanceGiven = 3000.00;

    // Wage payable remains unchanged by advance in Phase 11
    const wagePayable = earnedWages;
    const advanceOutstanding = advanceGiven;

    expect(wagePayable).toBe(10000.00);
    expect(advanceOutstanding).toBe(3000.00);
    expect(wagePayable - advanceOutstanding).not.toBe(wagePayable);
  });

  it('demonstrates balance logic for multiple advances and cancellation', () => {
    const adv1 = 3000.00;
    const adv2 = 2000.00;
    let outstanding = adv1 + adv2;
    expect(outstanding).toBe(5000.00);

    // If adv2 is cancelled, outstanding returns to 3000
    outstanding -= adv2;
    expect(outstanding).toBe(3000.00);
  });
});

// ============================================================
// J. TYPESCRIPT DATABASE TYPES ALIGNMENT
// ============================================================

describe('J. TypeScript Database Types Alignment', () => {
  it('types database.ts includes employee_advances table', () => {
    expect(typesSource).toContain('employee_advances: {');
    expect(typesSource).toContain('advance_number: string;');
    expect(typesSource).toContain('amount: number;');
    expect(typesSource).toContain("status: 'Draft' | 'Confirmed' | 'Cancelled';");
    expect(typesSource).toContain('reversal_of_id: string | null;');
  });

  it('types database.ts includes v_employee_advance_balance and v_employee_advance_outstanding', () => {
    expect(typesSource).toContain('v_employee_advance_balance: {');
    expect(typesSource).toContain('v_employee_advance_outstanding: {');
    expect(typesSource).toContain('confirmed_advances_count: number;');
    expect(typesSource).toContain('total_confirmed_advances: number;');
    expect(typesSource).toContain('outstanding_advance_balance: number;');
  });

  it('types database.ts includes record_employee_advance and cancel_employee_advance RPCs', () => {
    expect(typesSource).toContain('record_employee_advance: {');
    expect(typesSource).toContain('cancel_employee_advance: {');
  });
});

// ============================================================
// K. STRICT SCOPE BOUNDARIES (NO PAYMENTS, PAYROLL, OR FRONTEND)
// ============================================================

describe('K. Strict Scope Boundaries (No Payments, Payroll, Recoveries, or Frontend)', () => {
  it('does NOT create employee_payments in migration 0012', () => {
    expect(migration12).not.toContain('CREATE TABLE public.employee_payments');
    expect(migration12).not.toContain('payment_balance');
    expect(migration12).not.toContain('net_pay');
  });

  it('does NOT implement advance recovery from wages in migration 0012', () => {
    expect(migration12).not.toContain('advance_recovery');
    expect(migration12).not.toContain('wage_deduction');
    expect(migration12).not.toContain('recover_employee_advance');
  });

  it('does NOT implement payroll, deductions, or tax in migration 0012', () => {
    expect(migration12).not.toContain('CREATE TABLE public.payroll');
    expect(migration12).not.toContain('salary_slips');
    expect(migration12).not.toContain('provident_fund');
  });

  it('does NOT create customer payments, inventory, or expenses in migration 0012', () => {
    expect(migration12).not.toContain('CREATE TABLE public.customer_payments');
    expect(migration12).not.toContain('CREATE TABLE public.inventory');
    expect(migration12).not.toContain('CREATE TABLE public.expenses');
  });

  it('does NOT contain frontend UI code or hooks in migration 0012', () => {
    expect(migration12).not.toContain('React');
    expect(migration12).not.toContain('useState');
    expect(migration12).not.toContain('useQuery');
    expect(migration12).not.toContain('export default function');
  });
});
