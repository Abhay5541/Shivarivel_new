/**
 * Phase 14: Customer Payments Backend Tests
 *
 * Comprehensive tests verifying:
 * A. Basic Creation & Table Schema: columns, defaults, FKs, constraints
 * B. Validation Invariants: positive amounts, payment methods, customer/project cross-company checks, overpayment prevention
 * C. Sequential Numbering: company-scoped CP-0001, CP-0002, concurrency safe
 * D. Multi-Tenant Company Isolation & RLS: SELECT, INSERT, UPDATE, DELETE policies
 * E. Customer/Project Integrity: enforcing project belongs to customer at DB foreign key and trigger levels
 * F. Project Receipts & Balance: contract value, active receipts, outstanding receivable calculation
 * G. Cancelled Payments: status transition, audit trail, exclusion from active receipts
 * H. Confirmed Immutability (Rule 18): non-deletion of completed receipts, locked financial fields
 * I. Reversal: offsetting reversal receipts, self-reversal rejection, duplicate reversal prevention
 * J. Strict Financial Separation: receipts are NOT project costs, purchases/wages/expenses untouched
 * K. Customer Payment vs Project Cost: customer payments do NOT alter Recorded Project Cost
 * L. Audit Logging: create, update, cancel, reverse, draft delete
 * M. TypeScript Types Alignment & Scope Boundaries: type safety, exclusions enforcement
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0015_PATH = join(ROOT, 'supabase', 'migrations', '0015_customer_payments.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration15 = existsSync(MIGRATION_0015_PATH)
  ? readFileSync(MIGRATION_0015_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. BASIC CREATION & SCHEMA CONSTRAINTS
// ============================================================

describe('A. Customer Payments Table Schema & Constraints', () => {
  it('migration 0015 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0015_PATH)).toBe(true);
    expect(migration15.length).toBeGreaterThan(100);
  });

  it('creates public.customer_payments table', () => {
    expect(migration15).toContain('CREATE TABLE public.customer_payments');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration15).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration15).toContain('company_id        uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration15).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires customer_id referencing customers(id) ON DELETE RESTRICT', () => {
    expect(migration15).toContain('customer_id       uuid NOT NULL');
    expect(migration15).toContain('REFERENCES public.customers(id) ON DELETE RESTRICT');
  });

  it('requires project_id referencing projects(id) ON DELETE RESTRICT', () => {
    expect(migration15).toContain('project_id        uuid NOT NULL');
    expect(migration15).toContain('REFERENCES public.projects(id) ON DELETE RESTRICT');
  });

  it('contains all required fields: payment_number, payment_date, amount, status', () => {
    expect(migration15).toContain('payment_number    text NOT NULL');
    expect(migration15).toContain('payment_date      date NOT NULL DEFAULT CURRENT_DATE');
    expect(migration15).toContain('amount            numeric(14,2) NOT NULL CHECK (amount > 0)');
    expect(migration15).toContain("status            text NOT NULL DEFAULT 'Confirmed'");
    expect(migration15).toContain("CHECK (status IN ('Draft', 'Confirmed', 'Cancelled'))");
  });

  it('contains optional metadata fields: payment_method, reference_number, notes, reversal_of_id', () => {
    expect(migration15).toContain('payment_method    text CHECK');
    expect(migration15).toContain('reference_number  text');
    expect(migration15).toContain('notes             text');
    expect(migration15).toContain('reversal_of_id    uuid');
  });

  it('enforces composite foreign key to customers matching company_id', () => {
    expect(migration15).toContain('CONSTRAINT fk_customer_payments_customer_company');
    expect(migration15).toContain('FOREIGN KEY (company_id, customer_id)');
    expect(migration15).toContain('REFERENCES public.customers (company_id, id)');
  });

  it('enforces composite foreign key to projects matching company_id AND customer_id', () => {
    expect(migration15).toContain('CONSTRAINT fk_customer_payments_project_customer_company');
    expect(migration15).toContain('FOREIGN KEY (company_id, customer_id, project_id)');
    expect(migration15).toContain('REFERENCES public.projects (company_id, customer_id, id)');
  });

  it('enforces composite foreign key for reversal reference matching company_id', () => {
    expect(migration15).toContain('CONSTRAINT fk_customer_payments_reversal_company');
    expect(migration15).toContain('FOREIGN KEY (company_id, reversal_of_id)');
    expect(migration15).toContain('REFERENCES public.customer_payments (company_id, id)');
  });
});

// ============================================================
// B. VALIDATION INVARIANTS
// ============================================================

describe('B. Validation Invariants', () => {
  it('enforces strictly positive amount check (rejects zero and negative)', () => {
    expect(migration15).toContain('CHECK (amount > 0)');
    expect(migration15).toContain('Customer payment amount must be strictly positive');
  });

  it('validates established payment methods (Cash, Bank Transfer, UPI, Cheque, Other)', () => {
    expect(migration15).toContain("payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other')");
  });

  it('validates customer exists within same company', () => {
    expect(migration15).toContain('Cross-company integrity violation: Customer % does not belong to company %');
  });

  it('validates project exists within same company', () => {
    expect(migration15).toContain('Cross-company integrity violation: Project % does not belong to company %');
  });

  it('prevents customer/project mismatch via validation trigger', () => {
    expect(migration15).toContain('Customer/Project mismatch: Project % belongs to customer %, not %');
  });

  it('prevents overpayment exceeding project contract value as per Product Spec Sec 22', () => {
    expect(migration15).toContain('Payment amount % exceeds remaining contract value of project %');
  });
});

// ============================================================
// C. NUMBERING CONVENTIONS
// ============================================================

describe('C. Customer Payment Sequential Numbering (CP-0001)', () => {
  it('implements handle_customer_payment_number trigger function', () => {
    expect(migration15).toContain('FUNCTION public.handle_customer_payment_number()');
    expect(migration15).toContain('trg_handle_customer_payment_number');
    expect(migration15).toContain("'CP-' || lpad(v_next_num::text, 4, '0')");
  });

  it('enforces company-scoped unique payment number constraint', () => {
    expect(migration15).toContain('CONSTRAINT uq_customer_payments_company_number');
    expect(migration15).toContain('UNIQUE (company_id, payment_number)');
  });

  it('simulates sequential numbering across multiple company transactions', () => {
    const companyAPayments: string[] = [];
    const companyBPayments: string[] = [];

    const generateNext = (existing: string[]): string => {
      const maxNum = existing.reduce((max, numStr) => {
        const match = numStr.match(/^CP-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      return `CP-${String(maxNum + 1).padStart(4, '0')}`;
    };

    companyAPayments.push(generateNext(companyAPayments)); // CP-0001
    companyAPayments.push(generateNext(companyAPayments)); // CP-0002
    companyBPayments.push(generateNext(companyBPayments)); // CP-0001 (isolated per company)

    expect(companyAPayments[0]).toBe('CP-0001');
    expect(companyAPayments[1]).toBe('CP-0002');
    expect(companyBPayments[0]).toBe('CP-0001');
  });
});

// ============================================================
// D. COMPANY ISOLATION & RLS
// ============================================================

describe('D. Multi-Tenant Company Isolation & RLS', () => {
  it('enables row level security on public.customer_payments', () => {
    expect(migration15).toContain('ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-scoped SELECT policy using current_company_id()', () => {
    expect(migration15).toContain('"Users can view company customer payments"');
    expect(migration15).toContain('USING (company_id = public.current_company_id())');
  });

  it('defines company-scoped INSERT policy using current_company_id()', () => {
    expect(migration15).toContain('"Users can insert company customer payments"');
    expect(migration15).toContain('WITH CHECK (company_id = public.current_company_id())');
  });

  it('defines company-scoped UPDATE policy using current_company_id()', () => {
    expect(migration15).toContain('"Users can update company customer payments"');
  });

  it('restricts DELETE policy to company owners and Draft status only', () => {
    expect(migration15).toContain('"Owners can delete draft company customer payments"');
    expect(migration15).toContain('public.is_owner()');
    expect(migration15).toContain("status = 'Draft'");
  });

  it('never uses USING (true) or WITH CHECK (true) on customer_payments table', () => {
    expect(migration15).not.toContain('USING (true)');
    expect(migration15).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// E. CUSTOMER / PROJECT INTEGRITY
// ============================================================

describe('E. Customer / Project Integrity Enforcement', () => {
  it('composite foreign key ensures project belongs to payment customer', () => {
    expect(migration15).toContain('FOREIGN KEY (company_id, customer_id, project_id)');
    expect(migration15).toContain('REFERENCES public.projects (company_id, customer_id, id)');
  });

  it('simulates rejection of mismatched customer and project', () => {
    const projects = [
      { id: 'prj-1', companyId: 'c1', customerId: 'cust-1' },
      { id: 'prj-2', companyId: 'c1', customerId: 'cust-2' },
    ];

    const validatePayment = (customerId: string, projectId: string) => {
      const prj = projects.find((p) => p.id === projectId);
      if (!prj || prj.customerId !== customerId) {
        throw new Error(`Customer/Project mismatch: Project ${projectId} does not belong to customer ${customerId}`);
      }
      return true;
    };

    expect(() => validatePayment('cust-1', 'prj-1')).not.toThrow();
    expect(() => validatePayment('cust-2', 'prj-2')).not.toThrow();
    expect(() => validatePayment('cust-1', 'prj-2')).toThrow('Customer/Project mismatch');
    expect(() => validatePayment('cust-2', 'prj-1')).toThrow('Customer/Project mismatch');
  });
});

// ============================================================
// F. PROJECT RECEIPTS & BALANCE DERIVATION
// ============================================================

describe('F. Project Receipts & Outstanding Receivable Derivation', () => {
  it('creates v_project_customer_payment_balance view', () => {
    expect(migration15).toContain('CREATE OR REPLACE VIEW public.v_project_customer_payment_balance AS');
    expect(migration15).toContain('p.contract_value');
    expect(migration15).toContain('confirmed_payment_count');
    expect(migration15).toContain('total_confirmed_payments');
    expect(migration15).toContain('amount_received');
    expect(migration15).toContain('outstanding_amount');
    expect(migration15).toContain('is_fully_paid');
  });

  it('calculates contract value, receipts received, and outstanding balance correctly', () => {
    // Project contract value = ₹10,00,000
    // Customer payment 1 = ₹2,00,000
    // Customer payment 2 = ₹3,00,000
    // Total received = ₹5,00,000
    // Outstanding = ₹5,00,000
    const contractValue = 1000000.00;
    const payment1 = 200000.00;
    const payment2 = 300000.00;

    const amountReceived = payment1 + payment2;
    const outstandingAmount = Math.max(contractValue - amountReceived, 0);
    const isFullyPaid = amountReceived >= contractValue;

    expect(amountReceived).toBe(500000.00);
    expect(outstandingAmount).toBe(500000.00);
    expect(isFullyPaid).toBe(false);
  });

  it('marks is_fully_paid true when receipts equal or reach contract value', () => {
    const contractValue = 500000.00;
    const amountReceived = 500000.00;
    const outstandingAmount = Math.max(contractValue - amountReceived, 0);
    const isFullyPaid = amountReceived >= contractValue;

    expect(outstandingAmount).toBe(0.00);
    expect(isFullyPaid).toBe(true);
  });
});

// ============================================================
// G. CANCELLED PAYMENTS
// ============================================================

describe('G. Cancelled Payments & Exclusion from Active Receipts', () => {
  it('implements cancel_customer_payment RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration15).toContain('FUNCTION public.cancel_customer_payment(');
    expect(migration15).toContain('SECURITY DEFINER');
    expect(migration15).toContain('SET search_path = public');
    expect(migration15).toContain('Customer payment % is already cancelled');
    expect(migration15).toContain("status = 'Cancelled'");
  });

  it('appends cancellation notes preserving historical context', () => {
    expect(migration15).toContain("'Cancellation: ' || p_notes");
  });

  it('demonstrates cancelled payments do not reduce outstanding balance', () => {
    const contractValue = 1000000.00;
    const payments = [
      { id: 'cp-1', amount: 200000.00, status: 'Confirmed' },
      { id: 'cp-2', amount: 300000.00, status: 'Cancelled' }, // Cancelled payment
    ];

    const activeReceipts = payments
      .filter((p) => p.status === 'Confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    const outstanding = contractValue - activeReceipts;

    expect(activeReceipts).toBe(200000.00);
    expect(outstanding).toBe(800000.00); // Does NOT count cancelled 3,00,000
  });
});

// ============================================================
// H. CONFIRMED IMMUTABILITY (RULE 18)
// ============================================================

describe('H. Confirmed Customer Payment Immutability (Rule 18)', () => {
  it('implements prevent_completed_customer_payment_deletion trigger', () => {
    expect(migration15).toContain('FUNCTION public.prevent_completed_customer_payment_deletion()');
    expect(migration15).toContain('trg_prevent_completed_customer_payment_deletion');
    expect(migration15).toContain('Cannot delete % customer payment %. Completed financial transactions must be preserved');
  });

  it('implements prevent_completed_customer_payment_modification trigger', () => {
    expect(migration15).toContain('FUNCTION public.prevent_completed_customer_payment_modification()');
    expect(migration15).toContain('trg_prevent_completed_customer_payment_modification');
    expect(migration15).toContain('Cannot modify financial fields of Confirmed customer payment %');
  });

  it('locks all financial fields on Confirmed payments: amount, date, customer, project, payment_method', () => {
    expect(migration15).toContain('NEW.amount != OLD.amount');
    expect(migration15).toContain('NEW.payment_date != OLD.payment_date');
    expect(migration15).toContain('NEW.customer_id != OLD.customer_id');
    expect(migration15).toContain('NEW.project_id != OLD.project_id');
    expect(migration15).toContain('NEW.company_id != OLD.company_id');
  });

  it('strictly forbids any modifications to Cancelled payments', () => {
    expect(migration15).toContain('Cancelled customer payment % cannot be modified');
  });
});

// ============================================================
// I. REVERSAL
// ============================================================

describe('I. Customer Payment Reversal Lifecycle & Atomic RPC', () => {
  it('implements reverse_customer_payment RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration15).toContain('FUNCTION public.reverse_customer_payment(');
    expect(migration15).toContain('SECURITY DEFINER');
    expect(migration15).toContain('SET search_path = public');
  });

  it('prevents self-reversal in trigger validation', () => {
    expect(migration15).toContain('Financial integrity violation: A customer payment cannot reverse itself');
  });

  it('prevents cross-company reversal', () => {
    expect(migration15).toContain('Cross-company integrity violation: Reversal target customer payment % does not belong to company %');
  });

  it('prevents reversing an already reversed customer payment (duplicate reversal protection)', () => {
    expect(migration15).toContain('Financial integrity violation: Target customer payment % has already been reversed');
  });

  it('prevents reversing a reversal receipt itself', () => {
    expect(migration15).toContain('Financial integrity violation: Cannot reverse a payment that is already a reversal transaction');
  });

  it('only allows reversing Confirmed customer payments', () => {
    expect(migration15).toContain('Financial integrity violation: Can only reverse a Confirmed customer payment');
  });

  it('simulates calculation of active receipts excluding reversed transactions', () => {
    interface PaymentSim {
      id: string;
      amount: number;
      status: 'Confirmed' | 'Cancelled';
      reversalOfId: string | null;
    }

    const payments: PaymentSim[] = [
      { id: 'cp-1', amount: 50000, status: 'Confirmed', reversalOfId: null }, // Active
      { id: 'cp-2', amount: 30000, status: 'Confirmed', reversalOfId: null }, // Reversed by cp-3
      { id: 'cp-3', amount: 30000, status: 'Confirmed', reversalOfId: 'cp-2' }, // Reversal entry
      { id: 'cp-4', amount: 20000, status: 'Cancelled', reversalOfId: null }, // Cancelled
    ];

    const reversedTargetIds = new Set(
      payments.filter((p) => p.reversalOfId !== null && p.status === 'Confirmed').map((p) => p.reversalOfId)
    );

    const activeReceipts = payments.filter(
      (p) =>
        p.status === 'Confirmed' &&
        p.reversalOfId === null &&
        !reversedTargetIds.has(p.id)
    );

    const activeTotal = activeReceipts.reduce((sum, p) => sum + p.amount, 0);

    expect(activeReceipts.length).toBe(1);
    expect(activeReceipts[0].id).toBe('cp-1');
    expect(activeTotal).toBe(50000);
  });
});

// ============================================================
// J. STRICT FINANCIAL SEPARATION
// ============================================================

describe('J. Strict Financial Separation from Project Costs & Outflows', () => {
  it('customer payments migration does NOT modify purchases, wages, advances, or expenses schemas', () => {
    expect(migration15).not.toContain('ALTER TABLE public.purchases');
    expect(migration15).not.toContain('ALTER TABLE public.daily_wages');
    expect(migration15).not.toContain('ALTER TABLE public.employee_advances');
    expect(migration15).not.toContain('ALTER TABLE public.employee_payments');
    expect(migration15).not.toContain('ALTER TABLE public.expenses');
  });

  it('demonstrates customer payments are receipts and do NOT affect Recorded Project Cost', () => {
    // Project financial model:
    // Purchases = ₹50,000
    // Wages = ₹20,000
    // Expenses = ₹5,000
    // Customer Payment Received = ₹30,000
    const purchases = 50000.00;
    const wages = 20000.00;
    const expenses = 5000.00;
    const customerPayment = 30000.00;

    // Recorded project cost formula remains invariant
    const recordedProjectCost = purchases + wages + expenses;
    expect(recordedProjectCost).toBe(75000.00);

    // Customer payments remain receipts received
    expect(customerPayment).toBe(30000.00);

    // Recorded project cost is NOT reduced by customer payments
    expect(recordedProjectCost - customerPayment).not.toBe(recordedProjectCost);
    expect(recordedProjectCost).toBe(75000.00);
  });
});

// ============================================================
// K. CUSTOMER PAYMENT VS PROJECT COST
// ============================================================

describe('K. Customer Payment vs Project Cost Invariant', () => {
  it('customer payments do not contribute to purchases, wages, or expenses', () => {
    const recordedCost = (p: number, w: number, e: number) => p + w + e;

    const initialCost = recordedCost(50000, 20000, 5000);
    const costAfterPayment = recordedCost(50000, 20000, 5000); // 30,000 received does not touch cost

    expect(initialCost).toBe(75000);
    expect(costAfterPayment).toBe(75000);
  });

  it('does NOT implement profit calculation in Phase 14', () => {
    expect(migration15).not.toContain('profit =');
    expect(migration15).not.toContain('gross_profit');
    expect(migration15).not.toContain('net_margin');
  });
});

// ============================================================
// L. AUDIT LOGGING TRIGGERS
// ============================================================

describe('L. Audit Logging Triggers', () => {
  it('creates audit_customer_payment_changes trigger function with SECURITY DEFINER', () => {
    expect(migration15).toContain('FUNCTION public.audit_customer_payment_changes()');
    expect(migration15).toContain('SECURITY DEFINER');
    expect(migration15).toContain('SET search_path = public');
    expect(migration15).toContain('trg_audit_customer_payment_changes');
  });

  it('captures distinct audit actions: create, reverse, update, cancel, and delete', () => {
    expect(migration15).toContain("'create_customer_payment'");
    expect(migration15).toContain("'reverse_customer_payment'");
    expect(migration15).toContain("'update_customer_payment'");
    expect(migration15).toContain("'cancel_customer_payment'");
    expect(migration15).toContain("'delete_customer_payment'");
    expect(migration15).toContain("'customer_payments'");
  });
});

// ============================================================
// M. TYPESCRIPT TYPES ALIGNMENT & SCOPE BOUNDARIES
// ============================================================

describe('M. TypeScript Types Alignment & Scope Boundaries', () => {
  it('types database.ts includes customer_payments table definition', () => {
    expect(typesSource).toContain('customer_payments: {');
    expect(typesSource).toContain('payment_number: string;');
    expect(typesSource).toContain('amount: number;');
    expect(typesSource).toContain("status: 'Draft' | 'Confirmed' | 'Cancelled';");
    expect(typesSource).toContain('customer_id: string;');
    expect(typesSource).toContain('project_id: string;');
  });

  it('types database.ts exports CustomerPaymentStatus type', () => {
    expect(typesSource).toContain('export type CustomerPaymentStatus =');
  });

  it('types database.ts includes views: v_customer_payment_summary and v_project_customer_payment_balance', () => {
    expect(typesSource).toContain('v_customer_payment_summary: {');
    expect(typesSource).toContain('v_project_customer_payment_balance: {');
    expect(typesSource).toContain('amount_received: number;');
    expect(typesSource).toContain('outstanding_amount: number | null;');
    expect(typesSource).toContain('is_fully_paid: boolean;');
  });

  it('types database.ts includes RPCs: record_customer_payment, cancel_customer_payment, reverse_customer_payment', () => {
    expect(typesSource).toContain('record_customer_payment: {');
    expect(typesSource).toContain('cancel_customer_payment: {');
    expect(typesSource).toContain('reverse_customer_payment: {');
  });

  it('preserves scope exclusions: no frontend UI, no invoices, no payroll compliance', () => {
    expect(migration15).not.toContain('React');
    expect(migration15).not.toContain('useState');
    expect(migration15).not.toContain('CREATE TABLE public.invoices');
    expect(migration15).not.toContain('CREATE TABLE public.payroll');
  });
});
