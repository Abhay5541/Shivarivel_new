import { describe, it, expect } from 'vitest';
import {
  customerPaymentFormSchema,
  expenseFormSchema,
  PAYMENT_METHODS,
  EXPENSE_CATEGORIES,
} from '@/types/finance';
import {
  memoryCustomerPayments,
  memoryExpenses,
  memoryProjectCustomerBalances,
  memoryProjectRecordedCosts,
  calculateCompanyFinancialSummary,
} from '@/hooks/useFinance';
import { formatINR } from '@/lib/utils';

describe('Phase 08: Finance & Financial Control Center Tests', () => {
  // ==========================================
  // 1. CUSTOMER PAYMENTS SCHEMA & VALIDATION
  // ==========================================
  describe('1. Customer Payments Validation & Schema', () => {
    it('validates a valid customer payment submission', () => {
      const validPayment = {
        customer_id: 'cust-1',
        project_id: 'proj-1',
        amount: 250000,
        payment_date: '2026-03-15',
        payment_method: 'Bank Transfer' as const,
        reference_number: 'NEFT-8849201948',
        notes: 'Plinth level completion stage disbursement',
      };

      const result = customerPaymentFormSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('rejects a customer payment with zero or negative amount', () => {
      const invalidZero = {
        customer_id: 'cust-1',
        project_id: 'proj-1',
        amount: 0,
        payment_date: '2026-03-15',
        payment_method: 'UPI' as const,
      };

      const resultZero = customerPaymentFormSchema.safeParse(invalidZero);
      expect(resultZero.success).toBe(false);
      if (!resultZero.success) {
        expect(resultZero.error.issues[0]?.message).toContain('positive');
      }

      const invalidNegative = {
        ...invalidZero,
        amount: -15000,
      };
      const resultNegative = customerPaymentFormSchema.safeParse(invalidNegative);
      expect(resultNegative.success).toBe(false);
    });

    it('rejects future payment dates beyond +1 day grace period', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const invalidFuture = {
        customer_id: 'cust-1',
        project_id: 'proj-1',
        amount: 50000,
        payment_date: futureDateStr,
        payment_method: 'Cash' as const,
      };

      const result = customerPaymentFormSchema.safeParse(invalidFuture);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('future');
      }
    });

    it('permits valid payment methods supported by backend', () => {
      expect(PAYMENT_METHODS).toContain('Cash');
      expect(PAYMENT_METHODS).toContain('Bank Transfer');
      expect(PAYMENT_METHODS).toContain('UPI');
      expect(PAYMENT_METHODS).toContain('Cheque');
      expect(PAYMENT_METHODS).toContain('Other');
    });
  });

  // ==========================================
  // 2. CUSTOMER BALANCE & OVERPAYMENT LOGIC
  // ==========================================
  describe('2. Customer Balance & Contract Invariants', () => {
    it('calculates Customer Outstanding strictly as Contract Value − Customer Received', () => {
      const balance = memoryProjectCustomerBalances[0];
      expect(balance).toBeDefined();

      const expectedOutstanding = Math.max(0, balance.contract_value - balance.amount_received);
      expect(balance.outstanding_amount).toBe(expectedOutstanding);
    });

    it('contains valid seed customer payment vouchers', () => {
      expect(memoryCustomerPayments.length).toBeGreaterThan(0);
      for (const payment of memoryCustomerPayments) {
        expect(payment.amount).toBeGreaterThan(0);
        expect(payment.customer_id).toBeTruthy();
        expect(payment.project_id).toBeTruthy();
        expect(payment.payment_number).toMatch(/^CP-\d+/);
      }
    });
  });

  // ==========================================
  // 3. EXPENSES SCHEMA & VALIDATION
  // ==========================================
  describe('3. Direct Expenses Validation & Schema', () => {
    it('validates a valid operational direct expense submission', () => {
      const validExpense = {
        expense_date: '2026-03-20',
        project_id: 'proj-1',
        category: 'Fuel' as const,
        amount: 3200,
        description: 'Diesel for JCB excavation work on site',
        payment_method: 'UPI' as const,
        reference_number: 'UPI-982103819',
      };

      const result = expenseFormSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('rejects an expense with a blank description', () => {
      const invalid = {
        expense_date: '2026-03-20',
        category: 'Food / Refreshments' as const,
        amount: 450,
        description: '   ',
        payment_method: 'Cash' as const,
      };

      const result = expenseFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Description cannot be blank');
      }
    });

    it('rejects zero or negative expense amounts', () => {
      const invalid = {
        expense_date: '2026-03-20',
        category: 'Small Tools' as const,
        amount: 0,
        description: 'Mason trowels and plumb line replacement',
        payment_method: 'Cash' as const,
      };

      const result = expenseFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('positive');
      }
    });

    it('includes authentic Tamil Nadu civil contracting expense categories', () => {
      expect(EXPENSE_CATEGORIES).toContain('Site Transportation');
      expect(EXPENSE_CATEGORIES).toContain('Fuel');
      expect(EXPENSE_CATEGORIES).toContain('Food / Refreshments');
      expect(EXPENSE_CATEGORIES).toContain('Equipment Rental');
      expect(EXPENSE_CATEGORIES).toContain('Small Tools');
      expect(EXPENSE_CATEGORIES).toContain('Repair / Maintenance');
      expect(EXPENSE_CATEGORIES).toContain('Office Expenses');
    });

    it('contains valid seed direct expenses with site vs general overhead tagging', () => {
      expect(memoryExpenses.length).toBeGreaterThan(0);
      const siteExpenses = memoryExpenses.filter((e) => Boolean(e.project_id));
      const overheadExpenses = memoryExpenses.filter((e) => !e.project_id);

      expect(siteExpenses.length).toBeGreaterThan(0);
      expect(overheadExpenses.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 4. RECORDED PROJECT COST (THE CORE METRIC)
  // ==========================================
  describe('4. Recorded Project Cost Formula & Non-Profit Invariant', () => {
    it('calculates Recorded Project Cost strictly as Purchases + Employee Wages + Expenses', () => {
      for (const costRecord of memoryProjectRecordedCosts) {
        const expectedRecordedCost =
          costRecord.total_purchases +
          costRecord.total_wages +
          costRecord.total_expenses;

        expect(costRecord.recorded_project_cost).toBe(expectedRecordedCost);
      }
    });

    it('STRICT INVARIANT: No profit, margin, EBITDA, or ROI fields exist on financial records', () => {
      const summary = calculateCompanyFinancialSummary();
      const keys = Object.keys(summary);
      const forbiddenKeywords = ['profit', 'margin', 'roi', 'ebitda', 'revenue_minus_cost', 'pnl'];

      for (const key of keys) {
        for (const forbidden of forbiddenKeywords) {
          expect(key.toLowerCase()).not.toContain(forbidden);
        }
      }

      // Check section 5 breakdown
      for (const p of summary.project_cost.project_breakdown) {
        const pKeys = Object.keys(p);
        for (const pKey of pKeys) {
          for (const forbidden of forbiddenKeywords) {
            expect(pKey.toLowerCase()).not.toContain(forbidden);
          }
        }
      }
    });
  });

  // ==========================================
  // 5. EMPLOYEE FINANCIAL PURITY (NON-NETTING)
  // ==========================================
  describe('5. Employee Financial Isolation & Strict Non-Netting Rule', () => {
    it('maintains strict separation between Daily Wages and Advances', () => {
      const summary = calculateCompanyFinancialSummary();

      // Wages formula: Wages Earned − Wages Paid = Wage Payable
      expect(summary.employee.wage_payable).toBe(
        summary.employee.wages_earned - summary.employee.wages_paid
      );

      // Advances formula: Advances Given − Advances Recovered = Advance Outstanding
      expect(summary.employee.advance_outstanding).toBe(
        summary.employee.advances_given - summary.employee.advances_recovered
      );

      // Verify advances are NEVER subtracted from wages payable
      expect((summary.employee as any).net_balance).toBeUndefined();
      expect((summary.employee as any).net_employee_balance).toBeUndefined();
    });
  });

  // ==========================================
  // 6. SUPPLIER FINANCIAL INTEGRITY
  // ==========================================
  describe('6. Supplier Financial Integrity & Credit Separation', () => {
    it('calculates Supplier Outstanding as Purchases − Payments with unallocated credit separate', () => {
      const summary = calculateCompanyFinancialSummary();

      expect(summary.supplier.total_outstanding).toBe(
        summary.supplier.total_purchases - summary.supplier.total_paid
      );

      // Unallocated credit must be tracked separately
      expect(summary.supplier.unallocated_credit).toBeDefined();
      expect(typeof summary.supplier.unallocated_credit).toBe('number');
    });
  });

  // ==========================================
  // 7. FINANCIAL SUMMARY 5-SECTION HIERARCHY
  // ==========================================
  describe('7. Financial Control Center 5-Section Hierarchy', () => {
    it('provides aggregated totals across all 5 operational sections', () => {
      const summary = calculateCompanyFinancialSummary();

      // Section 1: Customer Money
      expect(summary.customer.total_contract_value).toBeGreaterThan(0);
      expect(summary.customer.total_received).toBeGreaterThan(0);
      expect(summary.customer.total_outstanding).toBe(
        summary.customer.total_contract_value - summary.customer.total_received
      );

      // Section 2: Supplier Money
      expect(summary.supplier.total_purchases).toBeGreaterThan(0);
      expect(summary.supplier.total_paid).toBeGreaterThan(0);
      expect(summary.supplier.total_outstanding).toBeGreaterThan(0);

      // Section 3: Employee Money
      expect(summary.employee.wages_earned).toBeGreaterThan(0);
      expect(summary.employee.wage_payable).toBeGreaterThan(0);
      expect(summary.employee.advance_outstanding).toBeGreaterThan(0);

      // Section 4: Direct Expenses
      expect(summary.expenses.total_expenses).toBe(
        summary.expenses.site_expenses + summary.expenses.overhead_expenses
      );

      // Section 5: Recorded Project Cost
      expect(summary.project_cost.total_recorded_cost).toBeGreaterThan(0);
      expect(summary.project_cost.project_breakdown.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 8. INDIAN RUPEE FORMATTING
  // ==========================================
  describe('8. Indian Currency Formatting', () => {
    it('formats Indian numbering with commas and Rupee symbol', () => {
      const formatted = formatINR(125000);
      expect(formatted).toContain('₹');
      // Indian grouping: ₹1,25,000
      expect(formatted).toMatch(/₹\s?1,25,000/);
    });

    it('formats large multi-lakh contract values properly', () => {
      const formatted = formatINR(3850000);
      expect(formatted).toMatch(/₹\s?38,50,000/);
    });
  });
});
