import { z } from 'zod';

export type EmployeeStatus = 'active' | 'inactive';
export type AttendanceStatus = 'Present' | 'Half Day' | 'Absent';
export type AdvanceStatus = 'Draft' | 'Confirmed' | 'Cancelled';
export type EmployeePaymentStatus = 'Draft' | 'Confirmed' | 'Cancelled';
export type DailyWageStatus = 'Draft' | 'Confirmed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other';

export const TRADE_CATEGORIES = [
  'Mason (Maistry)',
  'Mason (Brickwork / Plastering)',
  'Barbender / Steel Fixer',
  'Carpenter (Shuttering)',
  'Carpenter (Interior / Woodwork)',
  'Electrician',
  'Plumber',
  'Painter',
  'Tile Layer / Polisher',
  'Welder / Fabricator',
  'Site Supervisor',
  'Male Helper / Chithal',
  'Female Helper / Chithal',
  'Heavy Machinery Operator',
  'Other Field Labor',
] as const;

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Cheque',
  'Other',
];

export interface Employee {
  id: string;
  company_id: string;
  employee_code: string;
  name: string;
  phone: string | null;
  worker_type: string | null;
  daily_wage: number | null;
  status: EmployeeStatus;
  joining_date: string | null;
  emergency_contact: string | null;
  photo_url: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Derived/joined fields for convenience
  assigned_project_id?: string | null;
  assigned_project_name?: string | null;
  total_present_days?: number;
  total_wages_earned?: number;
  total_wages_paid?: number;
  wage_payable?: number;
  total_advances_given?: number;
  total_advances_recovered?: number;
  advance_outstanding?: number;
}

export interface AttendanceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  project_id: string | null;
  attendance_date: string;
  status: AttendanceStatus;
  daily_wage_snapshot: number | null;
  overtime_hours: number;
  overtime_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  employee?: {
    id: string;
    employee_code: string;
    name: string;
    phone: string | null;
    worker_type: string | null;
    daily_wage: number | null;
    status: EmployeeStatus;
  };
  project?: {
    id: string;
    name: string;
    project_code: string;
  } | null;
  wage?: DailyWage | null;
}

export interface DailyWage {
  id: string;
  company_id: string;
  employee_id: string;
  attendance_id: string;
  project_id: string | null;
  wage_number: string;
  wage_date: string;
  payable_units: number; // 1.00 for Present, 0.50 for Half Day, 0 for Absent
  rate: number;
  base_wage: number;
  overtime_hours: number;
  overtime_amount: number;
  amount: number;
  status: DailyWageStatus;
  reversal_of_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  employee?: {
    id: string;
    employee_code: string;
    name: string;
    worker_type: string | null;
  };
  project?: {
    id: string;
    name: string;
    project_code: string;
  } | null;
  amount_paid?: number;
  amount_payable?: number;
}

export interface EmployeeAdvance {
  id: string;
  company_id: string;
  employee_id: string;
  advance_number: string;
  advance_date: string;
  amount: number;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  purpose: string | null;
  notes: string | null;
  status: AdvanceStatus;
  reversal_of_id: string | null;
  created_at: string;
  updated_at: string;
  // Joins & derived
  employee?: {
    id: string;
    employee_code: string;
    name: string;
    phone: string | null;
    worker_type: string | null;
    daily_wage: number | null;
  };
  recovered_amount?: number;
  outstanding_amount?: number;
}

export interface EmployeePayment {
  id: string;
  company_id: string;
  employee_id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  status: EmployeePaymentStatus;
  reversal_of_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins & allocations
  employee?: {
    id: string;
    employee_code: string;
    name: string;
    phone: string | null;
    worker_type: string | null;
  };
  wage_allocations?: {
    id: string;
    daily_wage_id: string;
    amount: number;
    wage_number?: string;
    wage_date?: string;
  }[];
  advance_allocations?: {
    id: string;
    employee_advance_id: string;
    amount: number;
    advance_number?: string;
  }[];
}

export interface EmployeeWagePayableSummary {
  company_id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  worker_type: string | null;
  master_daily_wage: number | null;
  employee_status: EmployeeStatus;
  total_attendance_records: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  total_payable_units: number;
  total_base_wages: number;
  total_overtime_hours: number;
  total_overtime_amount: number;
  total_earned_wages: number;
  total_wages_paid: number;
  wage_payable: number;
}

export interface EmployeeAdvanceSummary {
  company_id: string;
  employee_id: string;
  employee_name: string;
  confirmed_advances_count: number;
  total_confirmed_advances: number;
  total_cancelled_amount: number;
  total_reversed_amount: number;
  total_recovered_amount: number;
  outstanding_advance_balance: number;
}

// ==========================================
// ZOD SCHEMAS FOR FORMS & VALIDATION
// ==========================================

export const employeeFormSchema = z.object({
  name: z.string().trim().min(1, 'Employee name is required'),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
      message: 'Enter a valid 10-digit Indian mobile number',
    })
    .nullable()
    .optional(),
  worker_type: z.string().trim().min(1, 'Select or enter a trade/role'),
  daily_wage: z
    .number({ invalid_type_error: 'Enter a valid wage rate' })
    .min(0, 'Daily wage cannot be negative')
    .nullable()
    .optional(),
  status: z.enum(['active', 'inactive']),
  joining_date: z.string().nullable().optional(),
  emergency_contact: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  assigned_project_id: z.string().nullable().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export const attendanceEntrySchema = z.object({
  employee_id: z.string().uuid(),
  status: z.enum(['Present', 'Half Day', 'Absent']),
  project_id: z.string().uuid().nullable().optional(),
  overtime_hours: z.number().min(0).default(0),
  overtime_amount: z.number().min(0).default(0),
  notes: z.string().trim().nullable().optional(),
});

export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;

export const advanceFormSchema = z.object({
  employee_id: z.string().uuid('Please select an employee'),
  advance_date: z
    .string()
    .min(1, 'Select advance date')
    .refine(
      (val) => {
        const d = new Date(val);
        const max = new Date();
        max.setDate(max.getDate() + 1);
        return d <= max;
      },
      { message: 'Advance date cannot be in the future beyond tomorrow' }
    ),
  amount: z
    .number({ invalid_type_error: 'Enter a valid amount' })
    .positive('Advance amount must be greater than 0'),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other']),
  reference_number: z.string().trim().nullable().optional(),
  purpose: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export type AdvanceFormData = z.infer<typeof advanceFormSchema>;

export const employeePaymentFormSchema = z.object({
  employee_id: z.string().uuid('Please select an employee'),
  payment_date: z
    .string()
    .min(1, 'Select payment date')
    .refine(
      (val) => {
        const d = new Date(val);
        const max = new Date();
        max.setDate(max.getDate() + 1);
        return d <= max;
      },
      { message: 'Payment date cannot be in the future beyond tomorrow' }
    ),
  amount: z
    .number({ invalid_type_error: 'Enter a valid amount' })
    .positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other']),
  reference_number: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  // Allocation option: 'wage' | 'advance_recovery' | 'general'
  allocation_target: z.enum(['wages', 'advance_recovery', 'unallocated']).default('wages'),
});

export type EmployeePaymentFormData = z.infer<typeof employeePaymentFormSchema>;
