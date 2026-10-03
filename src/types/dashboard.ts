/**
 * SHIVARIVEL CONSTRUCTION & INTERIORS
 * Phase 02: Dashboard & My Day TypeScript Types
 *
 * Source of truth:
 * - Migration 0020: public.get_dashboard() & reporting views
 * - Migration 0016: public.get_my_day() & public.v_my_day
 * - Strictly non-netting: Zero profit / margin / ROI calculations.
 */

export interface RecentPaymentItem {
  id: string;
  customer_id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: string;
}

export interface RecentExpenseItem {
  id: string;
  project_id: string | null;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
}

export interface DashboardReminderItem {
  item_type: 'task' | 'follow_up' | 'site_visit';
  item_id: string;
  title: string;
  date: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING';
  project_name: string | null;
  customer_name: string | null;
}

export interface ActiveProjectSummary {
  id: string;
  project_code: string;
  name: string;
  status: string;
  start_date: string | null;
  expected_end_date: string | null;
  contract_value: number;
  overall_progress_percentage: number;
  amount_received: number;
  outstanding_amount: number;
}

export interface DashboardFinancial {
  total_contract_value: number;
  total_customer_received: number;
  total_customer_receivable: number;
  total_supplier_payable: number;
  total_wage_payable: number;
  total_advance_outstanding: number;
  total_expenses: number;
  total_recorded_project_cost: number;
  recent_payments: RecentPaymentItem[];
  recent_expenses: RecentExpenseItem[];
}

export interface DashboardProjects {
  total_projects: number;
  active_projects: number;
  upcoming_projects: number;
  on_hold_projects: number;
  completed_projects: number;
  cancelled_projects: number;
  projects_requiring_attention: number;
  active_projects_avg_progress: number;
  active_project_list: ActiveProjectSummary[];
}

export interface DashboardWorkforce {
  workers_today: number;
  present_today: number;
  half_day_today: number;
  absent_today: number;
  today_wage_amount: number;
}

export interface DashboardActions {
  pending_tasks: number;
  overdue_tasks: number;
  follow_ups_due: number;
  upcoming_site_visits: number;
  new_enquiries: number;
  reports_today: number;
  important_reminders: DashboardReminderItem[];
}

export interface DashboardData {
  company_id: string;
  financial: DashboardFinancial;
  projects: DashboardProjects;
  workforce: DashboardWorkforce;
  actions: DashboardActions;
}

export interface MyDayItem {
  company_id: string;
  item_type: 'task' | 'follow_up' | 'site_visit';
  item_id: string;
  title: string;
  date: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: string;
  urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING';
  customer_id: string | null;
  customer_name: string | null;
  project_id: string | null;
  project_code: string | null;
  project_name: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  notes: string | null;
}

export interface MyDayCounts {
  overdue_tasks: number;
  today_tasks: number;
  overdue_follow_ups: number;
  today_follow_ups: number;
  today_site_visits: number;
}

export interface MyDayData {
  date: string;
  overdue: MyDayItem[];
  today: MyDayItem[];
  upcoming: MyDayItem[];
  counts: MyDayCounts;
}
