import { z } from 'zod';
import type { ExpenseCategory, ExpenseStatus, CustomerPaymentStatus } from './database';

export type { ExpenseCategory, ExpenseStatus, CustomerPaymentStatus };

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Cheque',
  'Other',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Site Transportation',
  'Fuel',
  'Travel',
  'Food / Refreshments',
  'Electricity',
  'Internet',
  'Office Expenses',
  'Equipment Rental',
  'Small Tools',
  'Repair / Maintenance',
  'Miscellaneous',
  'Other',
];

// ==========================================
// 1. CUSTOMER PAYMENTS TYPES
// ==========================================

export interface CustomerPayment {
  id: string;
  company_id: string;
  customer_id: string;
  project_id: string;
  payment_number: string; // CP-0001
  payment_date: string; // YYYY-MM-DD
  amount: number;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  notes: string | null;
  status: CustomerPaymentStatus;
  reversal_of_id: string | null;
  created_at: string;
  updated_at: string;

  // Joined metadata
  customer?: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  project?: {
    id: string;
    project_code: string;
    name: string;
    contract_value: number | null;
  } | null;
}

export const customerPaymentFormSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  project_id: z.string().min(1, 'Please select a project'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Payment amount must be strictly positive'),
  payment_date: z
    .string()
    .min(1, 'Payment date is required')
    .refine((val) => {
      const d = new Date(val);
      const maxFuture = new Date();
      maxFuture.setDate(maxFuture.getDate() + 1);
      return d <= maxFuture;
    }, 'Payment date cannot be in the future (max +1 day)'),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'] as const, {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CustomerPaymentFormData = z.infer<typeof customerPaymentFormSchema>;

export interface ProjectCustomerBalance {
  project_id: string;
  customer_id: string;
  customer_name: string;
  project_name: string;
  project_code: string;
  contract_value: number;
  amount_received: number;
  outstanding_amount: number;
  is_fully_paid: boolean;
  confirmed_payment_count: number;
}

// ==========================================
// 2. EXPENSES TYPES
// ==========================================

export interface Expense {
  id: string;
  company_id: string;
  project_id: string | null;
  expense_number: string; // EXP-0001
  expense_date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  paid_by: string | null;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  notes: string | null;
  status: ExpenseStatus;
  reversal_of_id: string | null;
  created_at: string;
  updated_at: string;

  // Joined metadata
  project?: {
    id: string;
    project_code: string;
    name: string;
  } | null;
}

export const expenseFormSchema = z.object({
  category: z.string().min(1, 'Please select an expense category'),
  description: z.string().trim().min(1, 'Description cannot be blank'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Expense amount must be strictly positive'),
  expense_date: z.string().min(1, 'Expense date is required'),
  project_id: z.string().optional().nullable(),
  paid_by: z.string().max(100).optional().nullable(),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'] as const, {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

// ==========================================
// 3. RECORDED PROJECT COST TYPES
// Purchases + Employee Wages + Expenses (NOT profit)
// ==========================================

export interface RecordedProjectCost {
  project_id: string;
  project_code: string;
  project_name: string;
  project_status: string;
  contract_value: number;
  amount_received: number;
  outstanding_customer_balance: number;
  total_purchases: number;
  total_wages: number;
  total_expenses: number;
  recorded_project_cost: number;
}

// ==========================================
// 4. FINANCIAL SUMMARY TYPES
// ==========================================

export interface CompanyFinancialSummary {
  // 1. Customer Money
  customer: {
    total_contract_value: number;
    total_received: number;
    total_outstanding: number;
  };

  // 2. Supplier Money
  supplier: {
    total_purchases: number;
    total_paid: number;
    total_outstanding: number;
    unallocated_credit: number;
  };

  // 3. Employee Money (STRICTLY SEPARATED)
  employee: {
    wages_earned: number;
    wages_paid: number;
    wage_payable: number;

    advances_given: number;
    advances_recovered: number;
    advance_outstanding: number;
  };

  // 4. Expenses
  expenses: {
    total_expenses: number;
    site_expenses: number;
    overhead_expenses: number;
  };

  // 5. Recorded Project Cost (Purchases + Wages + Expenses)
  project_cost: {
    total_recorded_cost: number;
    project_breakdown: RecordedProjectCost[];
  };
}
