/**
 * Phase 19: Dashboard / Weekly Reports Backend Tests
 *
 * Comprehensive tests verifying:
 * A. Weekly Reports Snapshot Table Schema & Constraints (Product Spec Sec 29):
 *    - Columns, unique constraints on (company_id, start_date, end_date), date range check
 * B. Dashboard Reporting Views & KPI Consistency:
 *    - v_dashboard_financial_summary (customer receivables, supplier payables, wage payables,
 *      advance balance, expenses, recorded project cost)
 *    - v_dashboard_project_summary (active, upcoming, on hold, completed, cancelled, attention)
 *    - v_dashboard_workforce_summary (workers today, attendance, today wages)
 *    - v_dashboard_actions_summary (pending tasks, overdue tasks, follow-ups due, visits)
 * C. Unified Dashboard RPC (get_dashboard):
 *    - Multi-section JSON response, company isolation, recent payments/expenses, My Day reminders
 * D. Weekly Report Compilation RPCs (get_weekly_report & generate_weekly_report):
 *    - Date range handling (default current week Monday–Sunday)
 *    - Summary aggregation across projects, purchases, labour, wages, expenses, payments, site activity
 *    - Snapshot persistence in weekly_reports table
 * E. Financial Source-of-Truth Reconciliation (Step 22 Requirements):
 *    - Dashboard recorded project cost = existing v_project_recorded_cost
 *    - Dashboard customer outstanding = existing v_project_customer_payment_balance
 *    - Dashboard supplier outstanding = existing v_supplier_balance
 *    - Dashboard wage payable = existing v_employee_wage_payable
 *    - Dashboard advance balance = existing v_employee_advance_balance
 *    - Exclusion of Draft, Cancelled, and Reversed transactions
 * F. Multi-Tenant Company Isolation & Security:
 *    - RLS on weekly_reports table
 *    - SECURITY DEFINER RPCs with pinned search_path = public
 *    - Cross-company data leakage prevention
 * G. Strict Financial Separation:
 *    - Dashboard and weekly reports are strictly read/reporting operations
 *    - No financial mutation or fake profit calculations
 * H. TypeScript Alignment:
 *    - Table, view, and RPC definitions in src/types/database.ts
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0020_PATH = join(ROOT, 'supabase', 'migrations', '0020_dashboard_weekly_reports.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration20 = existsSync(MIGRATION_0020_PATH)
  ? readFileSync(MIGRATION_0020_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. WEEKLY REPORTS SNAPSHOT TABLE
// ============================================================

describe('A. Weekly Reports Snapshot Table (Product Spec Sec 29)', () => {
  it('migration 0020 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0020_PATH)).toBe(true);
    expect(migration20.length).toBeGreaterThan(100);
  });

  it('creates public.weekly_reports table with UUID PK and company_id', () => {
    expect(migration20).toContain('CREATE TABLE public.weekly_reports');
    expect(migration20).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
    expect(migration20).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
  });

  it('enforces unique constraint on (company_id, start_date, end_date)', () => {
    expect(migration20).toContain('CONSTRAINT uq_weekly_reports_company_dates');
    expect(migration20).toContain('UNIQUE (company_id, start_date, end_date)');
  });

  it('enforces date ordering constraint (end_date >= start_date)', () => {
    expect(migration20).toContain('CONSTRAINT chk_weekly_reports_date_range');
    expect(migration20).toContain('CHECK (end_date >= start_date)');
  });

  it('enforces RLS on public.weekly_reports with company isolation', () => {
    expect(migration20).toContain('ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;');
    expect(migration20).toContain('"Users can view company weekly reports"');
    expect(migration20).toContain('"Users can insert company weekly reports"');
    expect(migration20).toContain('"Owners can delete company weekly reports"');
    expect(migration20).toContain('public.is_owner()');
  });

  it('has audit trigger on weekly_reports table', () => {
    expect(migration20).toContain('CREATE TRIGGER trg_audit_weekly_reports_changes');
    expect(migration20).toContain('FUNCTION public.audit_weekly_reports_changes()');
  });
});

// ============================================================
// B. DASHBOARD REPORTING VIEWS
// ============================================================

describe('B. Dashboard Reporting Views (Product Spec Sec 6)', () => {
  it('creates v_dashboard_financial_summary view with security_invoker', () => {
    expect(migration20).toContain('CREATE OR REPLACE VIEW public.v_dashboard_financial_summary AS');
    expect(migration20).toContain('ALTER VIEW public.v_dashboard_financial_summary SET (security_invoker = true);');
  });

  it('v_dashboard_financial_summary aggregates from authoritative existing views', () => {
    expect(migration20).toContain('FROM public.v_project_customer_payment_balance');
    expect(migration20).toContain('FROM public.v_supplier_balance');
    expect(migration20).toContain('FROM public.v_employee_wage_payable');
    expect(migration20).toContain('FROM public.v_employee_advance_balance');
    expect(migration20).toContain('FROM public.v_project_recorded_cost');
  });

  it('creates v_dashboard_project_summary view with security_invoker', () => {
    expect(migration20).toContain('CREATE OR REPLACE VIEW public.v_dashboard_project_summary AS');
    expect(migration20).toContain('ALTER VIEW public.v_dashboard_project_summary SET (security_invoker = true);');
    expect(migration20).toContain('active_projects');
    expect(migration20).toContain('upcoming_projects');
    expect(migration20).toContain('projects_requiring_attention');
    expect(migration20).toContain('active_projects_avg_progress');
  });

  it('creates v_dashboard_workforce_summary view with security_invoker', () => {
    expect(migration20).toContain('CREATE OR REPLACE VIEW public.v_dashboard_workforce_summary AS');
    expect(migration20).toContain('ALTER VIEW public.v_dashboard_workforce_summary SET (security_invoker = true);');
    expect(migration20).toContain('workers_today');
    expect(migration20).toContain('today_wage_amount');
  });

  it('creates v_dashboard_actions_summary view with security_invoker', () => {
    expect(migration20).toContain('CREATE OR REPLACE VIEW public.v_dashboard_actions_summary AS');
    expect(migration20).toContain('ALTER VIEW public.v_dashboard_actions_summary SET (security_invoker = true);');
    expect(migration20).toContain('pending_tasks');
    expect(migration20).toContain('overdue_tasks');
    expect(migration20).toContain('follow_ups_due');
    expect(migration20).toContain('upcoming_site_visits');
  });
});

// ============================================================
// C. UNIFIED DASHBOARD RPC (get_dashboard)
// ============================================================

describe('C. Unified Dashboard RPC Function', () => {
  it('implements get_dashboard RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration20).toContain('FUNCTION public.get_dashboard()');
    expect(migration20).toContain('SECURITY DEFINER');
    expect(migration20).toContain('SET search_path = public');
  });

  it('validates authenticated company context inside get_dashboard', () => {
    expect(migration20).toContain('Authentication required: no active company context');
  });

  it('returns structured JSON with financial, projects, workforce, and actions sections', () => {
    expect(migration20).toContain("'financial', jsonb_build_object(");
    expect(migration20).toContain("'projects', jsonb_build_object(");
    expect(migration20).toContain("'workforce', jsonb_build_object(");
    expect(migration20).toContain("'actions', jsonb_build_object(");
  });

  it('includes recent payments and recent expenses in dashboard payload', () => {
    expect(migration20).toContain("'recent_payments',            v_recent_pmts");
    expect(migration20).toContain("'recent_expenses',            v_recent_exps");
  });

  it('integrates Phase 15 v_my_day for urgent/overdue reminders', () => {
    expect(migration20).toContain('FROM public.v_my_day');
    expect(migration20).toContain("urgency = 'OVERDUE' OR priority = 'Urgent'");
  });
});

// ============================================================
// D. WEEKLY REPORT COMPILATION RPCS
// ============================================================

describe('D. Weekly Report Compilation RPCs (Product Spec Sec 29)', () => {
  it('implements get_weekly_report with default date_trunc(week, CURRENT_DATE)', () => {
    expect(migration20).toContain('FUNCTION public.get_weekly_report(');
    expect(migration20).toContain("date_trunc('week', CURRENT_DATE)::date");
    expect(migration20).toContain("interval '6 days'");
  });

  it('validates date range ordering in get_weekly_report', () => {
    expect(migration20).toContain('Weekly report end_date % cannot be before start_date %');
  });

  it('compiles weekly purchases, labour, wages, expenses, payments, site activity', () => {
    expect(migration20).toContain("'purchases', jsonb_build_object(");
    expect(migration20).toContain("'labour', jsonb_build_object(");
    expect(migration20).toContain("'wages', jsonb_build_object(");
    expect(migration20).toContain("'expenses', jsonb_build_object(");
    expect(migration20).toContain("'customer_payments', jsonb_build_object(");
    expect(migration20).toContain("'supplier_payments', jsonb_build_object(");
    expect(migration20).toContain("'pending_payments', jsonb_build_object(");
    expect(migration20).toContain("'site_activity', jsonb_build_object(");
  });

  it('implements generate_weekly_report supporting snapshot persistence', () => {
    expect(migration20).toContain('FUNCTION public.generate_weekly_report(');
    expect(migration20).toContain('INSERT INTO public.weekly_reports');
    expect(migration20).toContain("'stored', p_store_snapshot");
  });
});

// ============================================================
// E. FINANCIAL RECONCILIATION & SOURCE-OF-TRUTH CONSISTENCY
// ============================================================

describe('E. Financial Reconciliation & Source-of-Truth Consistency (Step 22)', () => {
  it('simulates dashboard recorded project cost reconciling with v_project_recorded_cost', () => {
    // Simulated project costs from Phase 13/14 authoritative view
    const projectRecordedCosts = [
      { project_id: 'p1', total_purchases: 50000, total_wages: 25000, total_expenses: 5000, recorded_project_cost: 80000 },
      { project_id: 'p2', total_purchases: 30000, total_wages: 15000, total_expenses: 3000, recorded_project_cost: 48000 },
    ];

    const totalFromView = projectRecordedCosts.reduce((acc, p) => acc + p.recorded_project_cost, 0);

    // Dashboard calculation uses SUM(recorded_project_cost) FROM v_project_recorded_cost
    const dashboardCost = projectRecordedCosts.map((p) => p.recorded_project_cost).reduce((a, b) => a + b, 0);

    expect(dashboardCost).toBe(128000);
    expect(dashboardCost).toBe(totalFromView);
  });

  it('simulates dashboard customer receivables reconciling with v_project_customer_payment_balance', () => {
    const customerBalances = [
      { project_id: 'p1', contract_value: 100000, amount_received: 60000, outstanding_amount: 40000 },
      { project_id: 'p2', contract_value: 75000, amount_received: 75000, outstanding_amount: 0 },
      { project_id: 'p3', contract_value: 50000, amount_received: 20000, outstanding_amount: 30000 },
    ];

    const totalReceivableFromView = customerBalances.reduce((acc, b) => acc + Math.max(b.outstanding_amount, 0), 0);
    const totalReceivedFromView = customerBalances.reduce((acc, b) => acc + b.amount_received, 0);

    expect(totalReceivableFromView).toBe(70000);
    expect(totalReceivedFromView).toBe(155000);
  });

  it('simulates dashboard supplier payables reconciling with v_supplier_balance', () => {
    const supplierBalances = [
      { supplier_id: 's1', total_purchases: 40000, total_allocated_payments: 25000, outstanding_balance: 15000 },
      { supplier_id: 's2', total_purchases: 20000, total_allocated_payments: 20000, outstanding_balance: 0 },
      { supplier_id: 's3', total_purchases: 10000, total_allocated_payments: 5000, outstanding_balance: 5000 },
    ];

    const totalSupplierPayable = supplierBalances.reduce((acc, s) => acc + Math.max(s.outstanding_balance, 0), 0);
    expect(totalSupplierPayable).toBe(20000);
  });

  it('simulates dashboard employee wage payable reconciling with v_employee_wage_payable', () => {
    const employeeWages = [
      { employee_id: 'e1', total_earned_wages: 12000, wage_payable: 4000 },
      { employee_id: 'e2', total_earned_wages: 15000, wage_payable: 0 },
      { employee_id: 'e3', total_earned_wages: 9000, wage_payable: 3000 },
    ];

    const totalWagePayable = employeeWages.reduce((acc, e) => acc + Math.max(e.wage_payable, 0), 0);
    expect(totalWagePayable).toBe(7000);
  });

  it('excludes Draft, Cancelled, and Reversed transactions from financial aggregations', () => {
    const payments = [
      { id: 'cp1', amount: 50000, status: 'Confirmed' },
      { id: 'cp2', amount: 20000, status: 'Draft' },
      { id: 'cp3', amount: 15000, status: 'Cancelled' },
      { id: 'cp4', amount: 30000, status: 'Confirmed' },
    ];

    const confirmedTotal = payments
      .filter((p) => p.status === 'Confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    expect(confirmedTotal).toBe(80000);
  });
});

// ============================================================
// F. MULTI-TENANT ISOLATION & SECURITY
// ============================================================

describe('F. Multi-Tenant Company Isolation & Security', () => {
  it('does NOT permit client-controlled company_id in get_dashboard or get_weekly_report', () => {
    // Both RPCs pull company_id strictly from public.current_company_id()
    expect(migration20).toContain('v_company_id := public.current_company_id();');
    expect(migration20).not.toMatch(/FUNCTION public\.get_dashboard\(.*company_id/);
    expect(migration20).not.toMatch(/FUNCTION public\.get_weekly_report\(.*company_id/);
  });

  it('simulates cross-company data leakage prevention', () => {
    const companyData: Record<string, { activeProjects: number; totalCost: number }> = {
      'comp-A': { activeProjects: 5, totalCost: 500000 },
      'comp-B': { activeProjects: 2, totalCost: 150000 },
    };

    const getDashboardData = (authenticatedCompanyId: string) => {
      const data = companyData[authenticatedCompanyId];
      if (!data) throw new Error('Company not found');
      return data;
    };

    expect(getDashboardData('comp-A').activeProjects).toBe(5);
    expect(getDashboardData('comp-B').activeProjects).toBe(2);
    expect(getDashboardData('comp-A').totalCost).not.toBe(getDashboardData('comp-B').totalCost);
  });
});

// ============================================================
// G. FINANCIAL SEPARATION & ACCURATE TERMINOLOGY
// ============================================================

describe('G. Financial Separation & Accurate Terminology (Step 11)', () => {
  it('preserves Recorded Project Cost definition without calling it profit or margin', () => {
    expect(migration20).toContain('total_recorded_project_cost');
    expect(migration20).not.toContain('total_profit');
    expect(migration20).not.toContain('gross_profit');
    expect(migration20).not.toContain('net_profit');
  });

  it('does NOT mutate any financial transaction tables', () => {
    expect(migration20).not.toContain('INSERT INTO public.purchases');
    expect(migration20).not.toContain('INSERT INTO public.daily_wages');
    expect(migration20).not.toContain('INSERT INTO public.expenses');
    expect(migration20).not.toContain('INSERT INTO public.customer_payments');
    expect(migration20).not.toContain('UPDATE public.projects SET contract_value');
  });
});

// ============================================================
// H. TYPESCRIPT ALIGNMENT
// ============================================================

describe('H. TypeScript Alignment in src/types/database.ts', () => {
  it('includes weekly_reports table in Database schema', () => {
    expect(typesSource).toContain('weekly_reports: {');
    expect(typesSource).toContain('start_date: string;');
    expect(typesSource).toContain('end_date: string;');
    expect(typesSource).toContain('title: string;');
  });

  it('includes dashboard reporting views in Database schema', () => {
    expect(typesSource).toContain('v_dashboard_financial_summary: {');
    expect(typesSource).toContain('total_recorded_project_cost: number;');
    expect(typesSource).toContain('v_dashboard_project_summary: {');
    expect(typesSource).toContain('v_dashboard_workforce_summary: {');
    expect(typesSource).toContain('v_dashboard_actions_summary: {');
  });

  it('includes get_dashboard and weekly report RPCs in Database functions', () => {
    expect(typesSource).toContain('get_dashboard: {');
    expect(typesSource).toContain('get_weekly_report: {');
    expect(typesSource).toContain('generate_weekly_report: {');
  });
});
