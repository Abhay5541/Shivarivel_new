/**
 * Phase 12: Employee Payments Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * composite foreign keys, payment sequential numbering (EP-0001),
 * wage allocation invariants, advance recovery allocation invariants,
 * financial immutability (Rule 18), cancellation/reversal support,
 * transaction-derived financial views (v_employee_wage_balance,
 * updated v_employee_advance_balance, v_employee_payment_summary,
 * updated v_employee_wage_payable), atomic RPC functions,
 * audit logging triggers, performance indexes, TypeScript types alignment,
 * strict separation of wages and advances, and scope boundary enforcement.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0013_PATH = join(ROOT, 'supabase', 'migrations', '0013_employee_payments.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration13 = existsSync(MIGRATION_0013_PATH)
  ? readFileSync(MIGRATION_0013_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. EMPLOYEE PAYMENTS TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('A. Employee Payments Table Schema & Constraints', () => {
  it('migration 0013 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0013_PATH)).toBe(true);
    expect(migration13.length).toBeGreaterThan(100);
  });

  it('creates public.employee_payments table', () => {
    expect(migration13).toContain('CREATE TABLE public.employee_payments');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration13).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration13).toContain('company_id        uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration13).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('contains all required fields for payment tracking', () => {
    expect(migration13).toContain('employee_id       uuid NOT NULL');
    expect(migration13).toContain('payment_number    text NOT NULL');
    expect(migration13).toContain('payment_date      date NOT NULL DEFAULT CURRENT_DATE');
    expect(migration13).toContain('amount            numeric(14,2) NOT NULL CHECK (amount > 0)');
    expect(migration13).toContain('payment_method    text');
    expect(migration13).toContain('reference_number  text');
    expect(migration13).toContain("status            text NOT NULL DEFAULT 'Confirmed'");
    expect(migration13).toContain('reversal_of_id    uuid');
    expect(migration13).toContain('notes             text');
    expect(migration13).toContain('created_at        timestamptz NOT NULL DEFAULT now()');
    expect(migration13).toContain('updated_at        timestamptz NOT NULL DEFAULT now()');
  });

  it('enforces strictly positive amounts at schema level', () => {
    expect(migration13).toContain('CHECK (amount > 0)');
  });

  it('restricts status to Draft, Confirmed, Cancelled', () => {
    expect(migration13).toMatch(/CHECK\s*\(status IN \('Draft', 'Confirmed', 'Cancelled'\)\)/);
  });

  it('validates payment_method enum values', () => {
    expect(migration13).toContain("'Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'");
  });

  it('has composite unique key on (company_id, id) for composite FK referencing', () => {
    expect(migration13).toContain('CONSTRAINT uq_employee_payments_company_id_id');
    expect(migration13).toContain('UNIQUE (company_id, id)');
  });

  it('has company-scoped unique payment number', () => {
    expect(migration13).toContain('CONSTRAINT uq_employee_payments_company_number');
    expect(migration13).toContain('UNIQUE (company_id, payment_number)');
  });

  it('enforces composite foreign key to employees (company_id, employee_id)', () => {
    expect(migration13).toContain('CONSTRAINT fk_employee_payments_employee_company');
    expect(migration13).toContain('FOREIGN KEY (company_id, employee_id)');
    expect(migration13).toContain('REFERENCES public.employees (company_id, id)');
  });

  it('enforces composite foreign key for reversal reference', () => {
    expect(migration13).toContain('CONSTRAINT fk_employee_payments_reversal_company');
    expect(migration13).toContain('REFERENCES public.employee_payments (company_id, id)');
  });

  it('has updated_at trigger', () => {
    expect(migration13).toContain('CREATE TRIGGER employee_payments_updated_at');
    expect(migration13).toContain('EXECUTE FUNCTION public.handle_updated_at()');
  });
});

// ============================================================
// B. WAGE ALLOCATION TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('B. Wage Allocation Table Schema & Constraints', () => {
  it('creates public.employee_payment_wage_allocations table', () => {
    expect(migration13).toContain('CREATE TABLE public.employee_payment_wage_allocations');
  });

  it('has required fields: payment_id, daily_wage_id, amount', () => {
    expect(migration13).toContain('payment_id     uuid NOT NULL');
    expect(migration13).toContain('daily_wage_id  uuid NOT NULL');
    // Check for positive amount constraint on allocation
    const wageAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_wage_allocations'),
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations')
    );
    expect(wageAllocSection).toContain('CHECK (amount > 0)');
  });

  it('has composite unique key on (company_id, id)', () => {
    expect(migration13).toContain('CONSTRAINT uq_epwa_company_id_id');
  });

  it('prevents duplicate allocation of same payment to same daily wage', () => {
    expect(migration13).toContain('CONSTRAINT uq_epwa_payment_wage');
    expect(migration13).toContain('UNIQUE (company_id, payment_id, daily_wage_id)');
  });

  it('has composite FK to employee_payments', () => {
    expect(migration13).toContain('CONSTRAINT fk_epwa_payment_company');
  });

  it('has composite FK to daily_wages', () => {
    expect(migration13).toContain('CONSTRAINT fk_epwa_daily_wage_company');
    expect(migration13).toContain('REFERENCES public.daily_wages (company_id, id)');
  });

  it('cascades deletion when payment is deleted', () => {
    const wageAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_wage_allocations'),
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations')
    );
    expect(wageAllocSection).toContain('ON DELETE CASCADE');
  });

  it('restricts deletion of referenced daily wages', () => {
    const wageAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_wage_allocations'),
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations')
    );
    expect(wageAllocSection).toContain('ON DELETE RESTRICT');
  });

  it('has updated_at trigger', () => {
    expect(migration13).toContain('CREATE TRIGGER epwa_updated_at');
  });
});

// ============================================================
// C. ADVANCE RECOVERY ALLOCATION TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('C. Advance Recovery Allocation Table Schema & Constraints', () => {
  it('creates public.employee_payment_advance_allocations table', () => {
    expect(migration13).toContain('CREATE TABLE public.employee_payment_advance_allocations');
  });

  it('has required fields: payment_id, employee_advance_id, amount', () => {
    const advAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations'),
      migration13.indexOf('PAYMENT NUMBERING TRIGGER') || migration13.indexOf('handle_employee_payment_number')
    );
    expect(advAllocSection).toContain('payment_id          uuid NOT NULL');
    expect(advAllocSection).toContain('employee_advance_id uuid NOT NULL');
    expect(advAllocSection).toContain('CHECK (amount > 0)');
  });

  it('has composite unique key on (company_id, id)', () => {
    expect(migration13).toContain('CONSTRAINT uq_epaa_company_id_id');
  });

  it('prevents duplicate allocation of same payment to same advance', () => {
    expect(migration13).toContain('CONSTRAINT uq_epaa_payment_advance');
    expect(migration13).toContain('UNIQUE (company_id, payment_id, employee_advance_id)');
  });

  it('has composite FK to employee_payments', () => {
    expect(migration13).toContain('CONSTRAINT fk_epaa_payment_company');
  });

  it('has composite FK to employee_advances', () => {
    expect(migration13).toContain('CONSTRAINT fk_epaa_advance_company');
    expect(migration13).toContain('REFERENCES public.employee_advances (company_id, id)');
  });

  it('restricts deletion of referenced employee advances', () => {
    const advAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations'),
      migration13.indexOf('PAYMENT NUMBERING TRIGGER') || migration13.indexOf('handle_employee_payment_number')
    );
    expect(advAllocSection).toContain('ON DELETE RESTRICT');
  });

  it('has updated_at trigger', () => {
    expect(migration13).toContain('CREATE TRIGGER epaa_updated_at');
  });
});

// ============================================================
// D. PAYMENT SEQUENTIAL NUMBERING
// ============================================================

describe('D. Payment Sequential Numbering', () => {
  it('creates handle_employee_payment_number function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.handle_employee_payment_number()');
  });

  it('generates EP- prefixed sequential numbers', () => {
    expect(migration13).toContain("NEW.payment_number := 'EP-'");
    expect(migration13).toContain("lpad(v_next_num::text, 4, '0')");
  });

  it('operates on BEFORE INSERT trigger', () => {
    expect(migration13).toContain('CREATE TRIGGER trg_handle_employee_payment_number');
    expect(migration13).toContain('BEFORE INSERT ON public.employee_payments');
  });

  it('is company-scoped (counts within company)', () => {
    expect(migration13).toContain('WHERE company_id = NEW.company_id');
  });
});

// ============================================================
// E. VALIDATION & INTEGRITY TRIGGERS
// ============================================================

describe('E. Payment Validation & Integrity Triggers', () => {
  it('creates validate_employee_payment_integrity trigger function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.validate_employee_payment_integrity()');
  });

  it('verifies employee belongs to same company', () => {
    expect(migration13).toContain("Cross-company integrity violation: Employee");
  });

  it('validates reversal reference within company', () => {
    expect(migration13).toContain("Cross-company integrity violation: Reversal target payment");
  });

  it('prevents self-referencing reversals', () => {
    expect(migration13).toContain("Financial integrity violation: A payment cannot reverse itself");
  });

  it('creates validate_wage_allocation_invariants trigger function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.validate_wage_allocation_invariants()');
  });

  it('prevents allocations from cancelled payments', () => {
    expect(migration13).toContain("Financial validation error: Cannot allocate from a Cancelled payment");
  });

  it('enforces employee matching between payment and wage', () => {
    expect(migration13).toContain("Employee mismatch: Payment employee");
    expect(migration13).toContain("does not match wage employee");
  });

  it('enforces employee matching between payment and advance', () => {
    expect(migration13).toContain("Employee mismatch: Payment employee");
    expect(migration13).toContain("does not match advance employee");
  });

  it('only allows allocations to Confirmed wages', () => {
    expect(migration13).toContain("Only Confirmed wages can receive payment allocations");
  });

  it('only allows allocations to Confirmed advances', () => {
    expect(migration13).toContain("Only Confirmed advances can receive recovery allocations");
  });

  it('prevents payment over-allocation (wage + advance totals)', () => {
    expect(migration13).toContain("Payment over-allocation: Total allocations");
    expect(migration13).toContain("would exceed payment amount");
  });

  it('prevents wage over-payment', () => {
    expect(migration13).toContain("Wage over-payment: Allocation amount");
    expect(migration13).toContain("exceeds wage outstanding balance");
  });

  it('creates validate_advance_allocation_invariants trigger function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.validate_advance_allocation_invariants()');
  });

  it('prevents advance over-recovery', () => {
    expect(migration13).toContain("Advance over-recovery: Recovery amount");
    expect(migration13).toContain("exceeds advance outstanding balance");
  });

  it('triggers are attached to allocation tables', () => {
    expect(migration13).toContain('CREATE TRIGGER trg_validate_wage_allocation_invariants');
    expect(migration13).toContain('BEFORE INSERT OR UPDATE ON public.employee_payment_wage_allocations');
    expect(migration13).toContain('CREATE TRIGGER trg_validate_advance_allocation_invariants');
    expect(migration13).toContain('BEFORE INSERT OR UPDATE ON public.employee_payment_advance_allocations');
  });
});

// ============================================================
// F. FINANCIAL IMMUTABILITY (RULE 18)
// ============================================================

describe('F. Financial Immutability (Rule 18)', () => {
  it('creates prevent_completed_employee_payment_deletion trigger', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_employee_payment_deletion()');
    expect(migration13).toContain('CREATE TRIGGER trg_prevent_completed_employee_payment_deletion');
    expect(migration13).toContain('BEFORE DELETE ON public.employee_payments');
  });

  it('prevents deletion of non-Draft payments', () => {
    expect(migration13).toContain("OLD.status != 'Draft'");
    expect(migration13).toContain('Cannot delete');
    expect(migration13).toContain('Completed financial transactions must be preserved');
  });

  it('creates prevent_completed_employee_payment_modification trigger', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_employee_payment_modification()');
    expect(migration13).toContain('CREATE TRIGGER trg_prevent_completed_employee_payment_modification');
    expect(migration13).toContain('BEFORE UPDATE ON public.employee_payments');
  });

  it('prevents modifications to Cancelled payments', () => {
    expect(migration13).toContain("Cancelled employee payment");
    expect(migration13).toContain("cannot be modified");
  });

  it('allows only status transition on Confirmed payments (Confirmed -> Cancelled)', () => {
    expect(migration13).toContain("Confirmed employee payment");
    expect(migration13).toContain("can only be transitioned to Cancelled");
  });

  it('prevents modification of financial fields on Confirmed payments', () => {
    expect(migration13).toContain("Cannot modify financial fields of Confirmed employee payment");
    expect(migration13).toContain("Recorded financial transactions are immutable");
  });

  it('protects allocation immutability on confirmed/cancelled payments', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.prevent_completed_employee_payment_allocation_modification()');
    expect(migration13).toContain('CREATE TRIGGER trg_prevent_completed_epwa_modification');
    expect(migration13).toContain('CREATE TRIGGER trg_prevent_completed_epaa_modification');
  });

  it('prevents allocation deletion from completed payments', () => {
    expect(migration13).toContain("Cannot delete allocations from");
  });

  it('prevents allocation modification on completed payments', () => {
    expect(migration13).toContain("Cannot modify allocations of");
  });
});

// ============================================================
// G. DERIVED FINANCIAL VIEWS
// ============================================================

describe('G. Derived Financial Views', () => {
  it('creates v_employee_wage_balance view', () => {
    expect(migration13).toContain('CREATE OR REPLACE VIEW public.v_employee_wage_balance');
  });

  it('v_employee_wage_balance derives from daily_wages and confirmed payment allocations', () => {
    // Must join daily_wages for earned
    expect(migration13).toContain('daily_wages dw');
    // Must join payment wage allocations for paid
    expect(migration13).toContain('employee_payment_wage_allocations epwa');
  });

  it('v_employee_wage_balance has outstanding_wages column', () => {
    expect(migration13).toContain('outstanding_wages');
  });

  it('v_employee_wage_balance only counts Confirmed payment allocations', () => {
    const viewSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_wage_balance'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_balance')
    );
    expect(viewSection).toContain("ep.status = 'Confirmed'");
  });

  it('updates v_employee_advance_balance to include advance recovery allocations', () => {
    const advViewSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_balance'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_outstanding')
    );
    expect(advViewSection).toContain('total_recovered_amount');
    expect(advViewSection).toContain('employee_payment_advance_allocations epaa');
  });

  it('advance balance outstanding subtracts recoveries', () => {
    const advViewSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_balance'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_outstanding')
    );
    expect(advViewSection).toContain('recovery_agg.total_recovered');
  });

  it('refreshes v_employee_advance_outstanding alias view', () => {
    expect(migration13).toContain('CREATE OR REPLACE VIEW public.v_employee_advance_outstanding');
    expect(migration13).toContain('SELECT * FROM public.v_employee_advance_balance');
  });

  it('creates v_employee_payment_summary view', () => {
    expect(migration13).toContain('CREATE OR REPLACE VIEW public.v_employee_payment_summary');
  });

  it('v_employee_payment_summary includes wages, advances, and payments columns', () => {
    const summaryViewSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_payment_summary'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_wage_payable')
    );
    expect(summaryViewSection).toContain('total_wages_earned');
    expect(summaryViewSection).toContain('total_wages_paid');
    expect(summaryViewSection).toContain('outstanding_wages');
    expect(summaryViewSection).toContain('total_advances_given');
    expect(summaryViewSection).toContain('total_advances_recovered');
    expect(summaryViewSection).toContain('outstanding_advances');
    expect(summaryViewSection).toContain('total_payments_made');
  });

  it('updates v_employee_wage_payable to incorporate actual wage payments', () => {
    expect(migration13).toContain('CREATE OR REPLACE VIEW public.v_employee_wage_payable');
    // Must have wage_paid subquery with payment wage allocations
    const wagePayableSection = migration13.substring(
      migration13.lastIndexOf('CREATE OR REPLACE VIEW public.v_employee_wage_payable'),
      migration13.indexOf('ATOMIC RPC FUNCTIONS')
    );
    expect(wagePayableSection).toContain('employee_payment_wage_allocations epwa');
    expect(wagePayableSection).toContain('wage_paid');
    expect(wagePayableSection).toContain("ep.status = 'Confirmed'");
  });
});

// ============================================================
// H. ATOMIC RPC FUNCTIONS
// ============================================================

describe('H. Atomic RPC Functions', () => {
  it('creates record_employee_payment function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.record_employee_payment(');
  });

  it('record_employee_payment accepts wage_allocations and advance_allocations as jsonb', () => {
    expect(migration13).toContain('p_wage_allocations   jsonb');
    expect(migration13).toContain('p_advance_allocations jsonb');
  });

  it('record_employee_payment requires positive amount', () => {
    const rpcSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.record_employee_payment('),
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_wage(')
    );
    expect(rpcSection).toContain("Payment amount must be strictly positive");
  });

  it('record_employee_payment inserts as Draft then transitions', () => {
    const rpcSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.record_employee_payment('),
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_wage(')
    );
    expect(rpcSection).toContain("'Draft'");
    expect(rpcSection).toContain("IF p_status IS DISTINCT FROM 'Draft'");
  });

  it('record_employee_payment returns jsonb with payment_id and payment_number', () => {
    expect(migration13).toContain("'payment_id', v_payment_id");
    expect(migration13).toContain("'payment_number', v_payment_number");
  });

  it('record_employee_payment is SECURITY DEFINER with clean search_path', () => {
    const rpcSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.record_employee_payment('),
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_wage(')
    );
    expect(rpcSection).toContain('SECURITY DEFINER');
    expect(rpcSection).toContain('SET search_path = public');
  });

  it('creates allocate_employee_payment_to_wage function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_wage(');
  });

  it('allocate_employee_payment_to_wage accepts payment_id, daily_wage_id, amount, notes', () => {
    const rpcSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_wage('),
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_advance(')
    );
    expect(rpcSection).toContain('p_payment_id');
    expect(rpcSection).toContain('p_daily_wage_id');
    expect(rpcSection).toContain('p_amount');
    expect(rpcSection).toContain('p_notes');
  });

  it('creates allocate_employee_payment_to_advance function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_advance(');
  });

  it('allocate_employee_payment_to_advance accepts payment_id, employee_advance_id, amount, notes', () => {
    const rpcSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.allocate_employee_payment_to_advance('),
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.cancel_employee_payment(')
    );
    expect(rpcSection).toContain('p_payment_id');
    expect(rpcSection).toContain('p_employee_advance_id');
    expect(rpcSection).toContain('p_amount');
    expect(rpcSection).toContain('p_notes');
  });

  it('creates cancel_employee_payment function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.cancel_employee_payment(');
  });

  it('cancel_employee_payment prevents re-cancellation', () => {
    expect(migration13).toContain("is already cancelled");
  });

  it('cancel_employee_payment appends cancellation note', () => {
    expect(migration13).toContain("'Cancellation: '");
  });

  it('cancel_employee_payment sets status to Cancelled', () => {
    const rpcSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE FUNCTION public.cancel_employee_payment('),
      migration13.indexOf('ROW LEVEL SECURITY')
    );
    expect(rpcSection).toContain("status = 'Cancelled'");
  });
});

// ============================================================
// I. ROW LEVEL SECURITY (RLS)
// ============================================================

describe('I. Row Level Security (RLS)', () => {
  it('enables RLS on employee_payments', () => {
    expect(migration13).toContain('ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY');
  });

  it('enables RLS on employee_payment_wage_allocations', () => {
    expect(migration13).toContain('ALTER TABLE public.employee_payment_wage_allocations ENABLE ROW LEVEL SECURITY');
  });

  it('enables RLS on employee_payment_advance_allocations', () => {
    expect(migration13).toContain('ALTER TABLE public.employee_payment_advance_allocations ENABLE ROW LEVEL SECURITY');
  });

  // Employee Payments Policies
  it('has SELECT policy on employee_payments', () => {
    expect(migration13).toContain('"Users can view company employee payments"');
  });

  it('has INSERT policy on employee_payments', () => {
    expect(migration13).toContain('"Users can insert company employee payments"');
  });

  it('has UPDATE policy on employee_payments', () => {
    expect(migration13).toContain('"Users can update company employee payments"');
  });

  it('has owner-only DELETE policy on draft employee_payments', () => {
    expect(migration13).toContain('"Owners can delete draft company employee payments"');
    // Find the delete policy section
    const deletePolicyIdx = migration13.indexOf('"Owners can delete draft company employee payments"');
    const policySection = migration13.substring(deletePolicyIdx, deletePolicyIdx + 300);
    expect(policySection).toContain('public.is_owner()');
    expect(policySection).toContain("status = 'Draft'");
  });

  // Wage Allocation Policies
  it('has SELECT policy on wage allocations', () => {
    expect(migration13).toContain('"Users can view company wage allocations"');
  });

  it('has INSERT policy on wage allocations', () => {
    expect(migration13).toContain('"Users can insert company wage allocations"');
  });

  it('has UPDATE policy on wage allocations restricted to draft payments', () => {
    expect(migration13).toContain('"Users can update draft wage allocations"');
  });

  it('has DELETE policy on wage allocations restricted to draft payments', () => {
    expect(migration13).toContain('"Users can delete draft wage allocations"');
  });

  // Advance Allocation Policies
  it('has SELECT policy on advance allocations', () => {
    expect(migration13).toContain('"Users can view company advance allocations"');
  });

  it('has INSERT policy on advance allocations', () => {
    expect(migration13).toContain('"Users can insert company advance allocations"');
  });

  it('has UPDATE policy on advance allocations restricted to draft payments', () => {
    expect(migration13).toContain('"Users can update draft advance allocations"');
  });

  it('has DELETE policy on advance allocations restricted to draft payments', () => {
    expect(migration13).toContain('"Users can delete draft advance allocations"');
  });

  // All policies use current_company_id()
  it('all RLS policies use public.current_company_id()', () => {
    // Count occurrences: should appear for every SELECT/INSERT/UPDATE/DELETE policy
    const matches = migration13.match(/public\.current_company_id\(\)/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(12);
  });
});

// ============================================================
// J. AUDIT LOGGING TRIGGERS
// ============================================================

describe('J. Audit Logging Triggers', () => {
  it('creates audit_employee_payment_changes function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.audit_employee_payment_changes()');
  });

  it('employee payment audit trigger is attached AFTER INSERT OR UPDATE OR DELETE', () => {
    expect(migration13).toContain('CREATE TRIGGER trg_audit_employee_payment_changes');
    expect(migration13).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.employee_payments');
  });

  it('audit logs include payment_number and amount', () => {
    expect(migration13).toContain("'payment_number', NEW.payment_number");
    expect(migration13).toContain("'amount', NEW.amount");
  });

  it('logs cancellation as a distinct action', () => {
    expect(migration13).toContain("'cancel_employee_payment'");
  });

  it('creates audit_employee_wage_allocation_changes function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.audit_employee_wage_allocation_changes()');
  });

  it('wage allocation audit trigger is attached', () => {
    expect(migration13).toContain('CREATE TRIGGER trg_audit_employee_wage_allocation_changes');
    expect(migration13).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.employee_payment_wage_allocations');
  });

  it('creates audit_employee_advance_allocation_changes function', () => {
    expect(migration13).toContain('CREATE OR REPLACE FUNCTION public.audit_employee_advance_allocation_changes()');
  });

  it('advance allocation audit trigger is attached', () => {
    expect(migration13).toContain('CREATE TRIGGER trg_audit_employee_advance_allocation_changes');
    expect(migration13).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.employee_payment_advance_allocations');
  });

  it('all audit functions log to audit_log table', () => {
    const auditInserts = migration13.match(/INSERT INTO public\.audit_log/g);
    expect(auditInserts).toBeTruthy();
    // At least 6 inserts: 3 audit functions × 2 paths (INSERT/UPDATE vs DELETE) minimum
    expect(auditInserts!.length).toBeGreaterThanOrEqual(6);
  });

  it('audit logs set entity_type correctly for each table', () => {
    expect(migration13).toContain("'employee_payments'");
    expect(migration13).toContain("'employee_wage_allocation'");
    expect(migration13).toContain("'employee_advance_allocation'");
  });
});

// ============================================================
// K. PERFORMANCE INDEXES
// ============================================================

describe('K. Performance Indexes', () => {
  it('indexes employee_payments by (company_id, employee_id)', () => {
    expect(migration13).toContain('CREATE INDEX idx_employee_payments_company_employee');
    expect(migration13).toMatch(/ON public\.employee_payments\s*\(company_id, employee_id\)/);
  });

  it('indexes employee_payments by (company_id, payment_date)', () => {
    expect(migration13).toContain('CREATE INDEX idx_employee_payments_company_date');
  });

  it('indexes employee_payments by (company_id, status)', () => {
    expect(migration13).toContain('CREATE INDEX idx_employee_payments_company_status');
  });

  it('indexes employee_payments by (company_id, payment_number)', () => {
    expect(migration13).toContain('CREATE INDEX idx_employee_payments_company_number');
  });

  it('indexes reversal references', () => {
    expect(migration13).toContain('CREATE INDEX idx_employee_payments_reversal');
  });

  it('indexes wage allocations by (company_id, payment_id)', () => {
    expect(migration13).toContain('CREATE INDEX idx_epwa_company_payment');
  });

  it('indexes wage allocations by (company_id, daily_wage_id)', () => {
    expect(migration13).toContain('CREATE INDEX idx_epwa_company_wage');
  });

  it('indexes advance allocations by (company_id, payment_id)', () => {
    expect(migration13).toContain('CREATE INDEX idx_epaa_company_payment');
  });

  it('indexes advance allocations by (company_id, employee_advance_id)', () => {
    expect(migration13).toContain('CREATE INDEX idx_epaa_company_advance');
  });
});

// ============================================================
// L. TYPESCRIPT TYPES ALIGNMENT
// ============================================================

describe('L. TypeScript Types Alignment', () => {
  it('database.ts includes employee_payments table type', () => {
    expect(typesSource).toContain('employee_payments:');
  });

  it('employee_payments Row type has required fields', () => {
    expect(typesSource).toContain('payment_number: string');
    expect(typesSource).toContain("status: 'Draft' | 'Confirmed' | 'Cancelled'");
    expect(typesSource).toContain('reversal_of_id: string | null');
  });

  it('database.ts includes employee_payment_wage_allocations table type', () => {
    expect(typesSource).toContain('employee_payment_wage_allocations:');
  });

  it('wage allocation type has payment_id and daily_wage_id', () => {
    // Search within a section of the types
    expect(typesSource).toContain('daily_wage_id: string');
  });

  it('database.ts includes employee_payment_advance_allocations table type', () => {
    expect(typesSource).toContain('employee_payment_advance_allocations:');
  });

  it('advance allocation type has employee_advance_id', () => {
    expect(typesSource).toContain('employee_advance_id: string');
  });

  it('database.ts includes v_employee_wage_balance view type', () => {
    expect(typesSource).toContain('v_employee_wage_balance:');
  });

  it('v_employee_wage_balance type has required fields', () => {
    expect(typesSource).toContain('total_wages_earned: number');
    expect(typesSource).toContain('total_wages_paid: number');
    expect(typesSource).toContain('outstanding_wages: number');
  });

  it('database.ts includes v_employee_payment_summary view type', () => {
    expect(typesSource).toContain('v_employee_payment_summary:');
  });

  it('v_employee_payment_summary type has complete financial fields', () => {
    expect(typesSource).toContain('total_wages_earned: number');
    expect(typesSource).toContain('outstanding_wages: number');
    expect(typesSource).toContain('total_advances_given: number');
    expect(typesSource).toContain('total_advances_recovered: number');
    expect(typesSource).toContain('outstanding_advances: number');
    expect(typesSource).toContain('total_payments_made: number');
  });

  it('v_employee_advance_balance type now includes total_recovered_amount', () => {
    expect(typesSource).toContain('total_recovered_amount: number');
  });

  it('database.ts includes record_employee_payment RPC type', () => {
    expect(typesSource).toContain('record_employee_payment:');
  });

  it('record_employee_payment Args include wage_allocations and advance_allocations', () => {
    expect(typesSource).toContain('p_wage_allocations?: unknown');
    expect(typesSource).toContain('p_advance_allocations?: unknown');
  });

  it('database.ts includes allocate_employee_payment_to_wage RPC type', () => {
    expect(typesSource).toContain('allocate_employee_payment_to_wage:');
  });

  it('database.ts includes allocate_employee_payment_to_advance RPC type', () => {
    expect(typesSource).toContain('allocate_employee_payment_to_advance:');
  });

  it('database.ts includes cancel_employee_payment RPC type', () => {
    expect(typesSource).toContain('cancel_employee_payment:');
  });
});

// ============================================================
// M. FINANCIAL SEPARATION OF CONCERNS
// ============================================================

describe('M. Financial Separation of Concerns', () => {
  it('wages and advances use separate allocation tables', () => {
    expect(migration13).toContain('employee_payment_wage_allocations');
    expect(migration13).toContain('employee_payment_advance_allocations');
  });

  it('wage allocations reference daily_wages, NOT employee_advances', () => {
    const wageAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_wage_allocations'),
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations')
    );
    expect(wageAllocSection).toContain('daily_wage_id');
    expect(wageAllocSection).not.toContain('employee_advance_id');
  });

  it('advance allocations reference employee_advances, NOT daily_wages', () => {
    const advAllocSection = migration13.substring(
      migration13.indexOf('CREATE TABLE public.employee_payment_advance_allocations'),
      migration13.indexOf('PAYMENT NUMBERING TRIGGER') || migration13.indexOf('handle_employee_payment_number')
    );
    expect(advAllocSection).toContain('employee_advance_id');
    expect(advAllocSection).not.toContain('daily_wage_id');
  });

  it('wage balance view does NOT mix advance data', () => {
    const viewSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_wage_balance'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_balance')
    );
    expect(viewSection).not.toContain('employee_advances');
    expect(viewSection).not.toContain('advance_balance');
  });

  it('advance balance view does NOT mix wage data', () => {
    const advViewSection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_balance'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_advance_outstanding')
    );
    expect(advViewSection).not.toContain('daily_wages');
    expect(advViewSection).not.toContain('wage_balance');
  });

  it('v_employee_payment_summary keeps wages and advances as separate columns', () => {
    const summarySection = migration13.substring(
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_payment_summary'),
      migration13.indexOf('CREATE OR REPLACE VIEW public.v_employee_wage_payable')
    );
    // Should have separate aggregations
    expect(summarySection).toContain('total_wages_earned');
    expect(summarySection).toContain('total_wages_paid');
    expect(summarySection).toContain('outstanding_wages');
    expect(summarySection).toContain('total_advances_given');
    expect(summarySection).toContain('total_advances_recovered');
    expect(summarySection).toContain('outstanding_advances');
  });
});

// ============================================================
// N. SCOPE BOUNDARY ENFORCEMENT
// ============================================================

describe('N. Scope Boundary Enforcement', () => {
  it('does NOT introduce payroll, salary, or tax concepts', () => {
    expect(migration13.toLowerCase()).not.toContain('payroll');
    expect(migration13.toLowerCase()).not.toContain('salary');
    expect(migration13.toLowerCase()).not.toContain('tax_deduction');
    expect(migration13.toLowerCase()).not.toContain('salary_slip');
  });

  it('does NOT introduce customer payment tables', () => {
    expect(migration13).not.toContain('CREATE TABLE public.customer_payments');
  });

  it('does NOT introduce inventory or consumption tables', () => {
    expect(migration13).not.toContain('CREATE TABLE public.inventory');
    expect(migration13).not.toContain('CREATE TABLE public.material_consumption');
  });

  it('does NOT introduce project expenses tables', () => {
    expect(migration13).not.toContain('CREATE TABLE public.project_expenses');
    expect(migration13).not.toContain('CREATE TABLE public.expenses');
  });

  it('does NOT implement frontend components', () => {
    expect(migration13.toLowerCase()).not.toContain('component');
    expect(migration13.toLowerCase()).not.toContain('react');
    expect(migration13.toLowerCase()).not.toContain('import');
  });

  it('does NOT modify other locked tables', () => {
    expect(migration13).not.toContain('ALTER TABLE public.employees ');
    expect(migration13).not.toContain('ALTER TABLE public.daily_wages ');
    expect(migration13).not.toContain('ALTER TABLE public.attendance ');
    expect(migration13).not.toContain('ALTER TABLE public.employee_advances ');
    expect(migration13).not.toContain('ALTER TABLE public.purchases ');
    expect(migration13).not.toContain('ALTER TABLE public.supplier_payments ');
  });
});

// ============================================================
// O. FINANCIAL INVARIANT DOCUMENTATION
// ============================================================

describe('O. Financial Invariant Documentation', () => {
  it('migration header documents financial invariants', () => {
    expect(migration13).toContain('FINANCIAL INVARIANTS');
  });

  it('documents wage payable formula', () => {
    // Rule 14: Wage Payable = Wages Earned - Employee Wage Payments
    expect(migration13).toContain('Wage allocations reduce wage payable');
  });

  it('documents separation rule', () => {
    expect(migration13).toContain('Wages and advances are SEPARATE financial streams');
  });

  it('documents immutability rule', () => {
    expect(migration13).toContain('Confirmed/Cancelled payments are immutable');
  });

  it('documents non-netting rule', () => {
    expect(migration13).toContain('Employee advance balance is NOT subtracted from wage payable');
  });
});
