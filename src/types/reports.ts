/**
 * SHIVARIVEL CONSTRUCTION & INTERIORS
 * Phase 09: Operational Reporting TypeScript Types
 *
 * Source of truth:
 * - Migration 0020: public.get_weekly_report(start_date, end_date)
 * - Migration 0006: public.v_project_work_progress & public.v_project_customer_payment_balance
 * - Migration 0008 & 0009: public.purchases & public.v_supplier_balance
 * - Migration 0011, 0012, 0013: public.attendance, public.daily_wages, public.employee_advances
 * - Migration 0014: public.expenses
 * - Strictly non-netting: Zero profit / margin / ROI calculations.
 */

// ==========================================
// 1. DATE RANGE & PRESET TYPES
// ==========================================

export type ReportDatePreset =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'today'
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ReportDateFilterProps {
  preset: ReportDatePreset;
  startDate: string;
  endDate: string;
  onPresetChange: (preset: ReportDatePreset) => void;
  onDateRangeChange: (range: DateRange) => void;
}

// ==========================================
// 2. COMPANY HEADER & PRINT INFO
// ==========================================

export interface CompanyReportInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  ownerName: string;
}

export const DEFAULT_COMPANY_REPORT_INFO: CompanyReportInfo = {
  name: 'Shivarivel Construction & Interiors',
  tagline: 'General Civil Contractors & Interior Specialists',
  address: '14, South Car Street, Sankarankovil, Tenkasi District, Tamil Nadu - 627756',
  phone: '+91 94431 87654 / +91 98421 23344',
  email: 'contact@shivarivel.com',
  gstNumber: '33AAACS1234F1Z5',
  ownerName: 'K. Senthil Nathan',
};

// ==========================================
// 3. WEEKLY REPORT DATA STRUCTURES
// ==========================================

export interface WeeklyReportActiveProject {
  id: string;
  project_code: string;
  name: string;
  status: string;
  overall_progress_percentage: number;
}

export interface WeeklyReportSiteIssue {
  id: string;
  project_id: string;
  project_name: string;
  report_date: string;
  issues: string | null;
  delays: string | null;
}

export interface WeeklyReportData {
  company_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  projects: {
    active_count: number;
    active_projects: WeeklyReportActiveProject[];
  };
  purchases: {
    count: number;
    total_amount: number;
  };
  labour: {
    attendance_records: number;
    distinct_workers: number;
  };
  wages: {
    count: number;
    total_amount: number;
  };
  expenses: {
    count: number;
    total_amount: number;
  };
  customer_payments: {
    count: number;
    total_amount: number;
  };
  supplier_payments: {
    count: number;
    total_amount: number;
  };
  pending_payments: {
    customer_receivables: number;
    supplier_payables: number;
  };
  site_activity: {
    reports_count: number;
    issues_noted: WeeklyReportSiteIssue[];
  };
  other_activity: {
    new_enquiries: number;
    completed_visits: number;
  };
}

// ==========================================
// 4. PROJECT REPORT TYPES
// ==========================================

export interface ProjectReportItem {
  id: string;
  project_code: string;
  name: string;
  customer_id: string;
  customer_name: string;
  status: 'Active' | 'Completed' | 'Upcoming' | 'On Hold' | 'Cancelled';
  start_date: string | null;
  expected_end_date: string | null;
  contract_value: number;
  amount_received: number;
  outstanding_balance: number;
  overall_progress_percentage: number;
  total_purchases: number;
  total_wages: number;
  total_expenses: number;
  recorded_project_cost: number;
  daily_reports_count: number;
}

export interface ProjectReportSummary {
  total_projects: number;
  total_contract_value: number;
  total_customer_received: number;
  total_customer_outstanding: number;
  total_recorded_cost: number;
}

export interface ProjectReportFilter {
  status: string; // 'all' | 'Active' | 'Completed' | 'Upcoming' | 'On Hold'
  customerId: string; // 'all' or specific id
  search: string;
  startDate?: string;
  endDate?: string;
}

// ==========================================
// 5. PURCHASE REPORT TYPES
// ==========================================

export interface PurchaseReportItem {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name: string;
  project_id: string | null;
  project_code: string | null;
  project_name: string | null;
  purchase_date: string;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  items_count: number;
}

export interface PurchaseProjectBreakdown {
  project_id: string | null;
  project_name: string;
  project_code: string;
  purchases_count: number;
  total_amount: number;
}

export interface PurchaseReportSummary {
  total_purchases: number;
  total_paid: number;
  total_outstanding: number;
  invoices_count: number;
  project_breakdowns: PurchaseProjectBreakdown[];
}

export interface PurchaseReportFilter {
  supplierId: string;
  projectId: string;
  status: string;
  startDate: string;
  endDate: string;
  search: string;
}

// ==========================================
// 6. WORKFORCE REPORT TYPES
// ==========================================

export interface WorkforceReportItem {
  employee_id: string;
  employee_name: string;
  worker_type: string;
  daily_wage_rate: number;
  projects_worked: string[];
  days_present: number;
  days_half_day: number;
  days_absent: number;
  wages_earned: number;
  wages_paid: number;
  wage_payable: number; // Wages Earned − Wages Paid
  advances_given: number;
  advances_recovered: number;
  advance_outstanding: number; // Advances Given − Advances Recovered
}

export interface WorkforceAttendanceSummary {
  total_records: number;
  present_count: number;
  half_day_count: number;
  absent_count: number;
  distinct_workers: number;
}

export interface WorkforceReportSummary {
  attendance: WorkforceAttendanceSummary;
  total_wages_earned: number;
  total_wages_paid: number;
  total_wage_payable: number;
  total_advances_given: number;
  total_advances_recovered: number;
  total_advance_outstanding: number;
}

export interface WorkforceReportFilter {
  employeeId: string;
  projectId: string;
  trade: string;
  startDate: string;
  endDate: string;
}

// ==========================================
// 7. PAYMENT REPORT TYPES
// ==========================================

export type PaymentDirection = 'IN' | 'OUT';
export type PaymentClassification =
  | 'Customer Receipt'
  | 'Supplier Payment'
  | 'Employee Wage Payment'
  | 'Direct Expense';

export interface ConsolidatedPaymentItem {
  id: string;
  payment_number: string;
  payment_date: string;
  classification: PaymentClassification;
  direction: PaymentDirection;
  party_name: string;
  party_role: 'Customer' | 'Supplier' | 'Employee' | 'Direct Vendor';
  project_id: string | null;
  project_name: string | null;
  project_code: string | null;
  payment_method: string | null;
  reference_number: string | null;
  amount: number;
  notes: string | null;
}

export interface PaymentReportSummary {
  customer_payments_received: number;
  supplier_payments_made: number;
  employee_payments_made: number;
  expenses_recorded: number;
  total_transactions: number;
}

export interface PaymentReportFilter {
  classification: 'all' | 'Customer Receipt' | 'Supplier Payment' | 'Employee Wage Payment' | 'Direct Expense';
  projectId: string;
  partyId?: string;
  startDate: string;
  endDate: string;
  search: string;
}
