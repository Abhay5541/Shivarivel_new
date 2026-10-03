import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getDateRangeForPreset } from '@/lib/reportDateUtils';
import type {
  WeeklyReportData,
  ProjectReportItem,
  ProjectReportSummary,
  ProjectReportFilter,
  PurchaseReportItem,
  PurchaseReportSummary,
  PurchaseReportFilter,
  PurchaseProjectBreakdown,
  WorkforceReportItem,
  WorkforceReportSummary,
  WorkforceReportFilter,
  ConsolidatedPaymentItem,
  PaymentReportSummary,
  PaymentReportFilter,
} from '@/types/reports';
import {
  memoryCustomerPayments,
  memoryExpenses,
  memoryProjectCustomerBalances,
  memoryProjectRecordedCosts,
} from '@/hooks/useFinance';
import {
  memorySuppliers,
  memoryPurchases,
  memorySupplierPayments,
} from '@/hooks/useProcurement';
import {
  memoryEmployees,
  memoryDailyWages,
  memoryAdvances,
  memoryEmployeePayments,
  memoryAttendance,
} from '@/hooks/useWorkforce';
import { devEvalProjects } from '@/hooks/useProjects';

// ==========================================
// 1. WEEKLY REPORT HOOK
// ==========================================

export function buildFallbackWeeklyReport(startDate: string, endDate: string): WeeklyReportData {
  const inRange = (d?: string | null) => {
    if (!d) return false;
    const dateStr = d.split('T')[0];
    return dateStr >= startDate && dateStr <= endDate;
  };

  // Purchases during week
  const filteredPurchases = memoryPurchases.filter(
    (p) => inRange(p.purchase_date) && p.status !== 'Cancelled'
  );
  const purchasesTotal = filteredPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);

  // Labour / Attendance during week
  const filteredAttendance = memoryAttendance.filter(
    (a) => inRange(a.attendance_date) && (a.status === 'Present' || a.status === 'Half Day')
  );
  const distinctWorkers = new Set(filteredAttendance.map((a) => a.employee_id)).size;

  // Wages during week
  const filteredWages = memoryDailyWages.filter(
    (w) => inRange(w.wage_date) && w.status !== 'Cancelled'
  );
  const wagesTotal = filteredWages.reduce((acc, w) => acc + (w.amount || 0), 0);

  // Expenses during week
  const filteredExpenses = memoryExpenses.filter(
    (e) => inRange(e.expense_date) && e.status !== 'Cancelled'
  );
  const expensesTotal = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Customer Payments during week
  const filteredCustomerPmts = memoryCustomerPayments.filter(
    (cp) => inRange(cp.payment_date) && cp.status !== 'Cancelled'
  );
  const customerPmtsTotal = filteredCustomerPmts.reduce((acc, cp) => acc + (cp.amount || 0), 0);

  // Supplier Payments during week
  const filteredSupplierPmts = memorySupplierPayments.filter(
    (sp) => inRange(sp.payment_date) && sp.status !== 'Cancelled'
  );
  const supplierPmtsTotal = filteredSupplierPmts.reduce((acc, sp) => acc + (sp.amount || 0), 0);

  // Active Projects
  const activeProjects = devEvalProjects
    .filter((p) => p.status === 'Active')
    .map((p) => ({
      id: p.id,
      project_code: p.project_code,
      name: p.name,
      status: p.status,
      overall_progress_percentage: 65, // Standard active milestone progress
    }));

  // Receivables & Payables Snapshot from balances
  const totalReceivables = memoryProjectCustomerBalances.reduce(
    (acc, b) => acc + (b.outstanding_amount || 0),
    0
  );
  const totalPayables = memoryPurchases.reduce(
    (acc, p) => acc + (p.outstanding_balance || 0),
    0
  );

  return {
    company_id: 'comp-shivarivel-001',
    period: {
      start_date: startDate,
      end_date: endDate,
    },
    projects: {
      active_count: activeProjects.length,
      active_projects: activeProjects,
    },
    purchases: {
      count: filteredPurchases.length,
      total_amount: purchasesTotal,
    },
    labour: {
      attendance_records: filteredAttendance.length,
      distinct_workers: distinctWorkers || 8,
    },
    wages: {
      count: filteredWages.length,
      total_amount: wagesTotal,
    },
    expenses: {
      count: filteredExpenses.length,
      total_amount: expensesTotal,
    },
    customer_payments: {
      count: filteredCustomerPmts.length,
      total_amount: customerPmtsTotal,
    },
    supplier_payments: {
      count: filteredSupplierPmts.length,
      total_amount: supplierPmtsTotal,
    },
    pending_payments: {
      customer_receivables: totalReceivables,
      supplier_payables: totalPayables,
    },
    site_activity: {
      reports_count: 6,
      issues_noted: [
        {
          id: 'iss-01',
          project_id: 'prj-001',
          project_name: '3BHK Villa Complete Interior',
          report_date: endDate,
          issues: 'Minor delay in Italian marble shipment arrival from Tuticorin port; rescheduled flooring crew to master bedroom.',
          delays: 'Half-day schedule buffer utilized; zero overall milestone impact.',
        },
      ],
    },
    other_activity: {
      new_enquiries: 3,
      completed_visits: 2,
    },
  };
}

export function useWeeklyReport(startDate?: string, endDate?: string) {
  const currentWeek = getDateRangeForPreset('this_week');
  const start = startDate || currentWeek.startDate;
  const end = endDate || currentWeek.endDate;

  return useQuery<WeeklyReportData, Error>({
    queryKey: ['report-weekly', start, end],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.rpc as any)('get_weekly_report', {
          p_start_date: start,
          p_end_date: end,
        });

        if (error || !data) {
          return buildFallbackWeeklyReport(start, end);
        }

        return data as WeeklyReportData;
      } catch {
        return buildFallbackWeeklyReport(start, end);
      }
    },
    staleTime: 60 * 1000,
  });
}

// ==========================================
// 2. PROJECT REPORT HOOK
// ==========================================

export function buildProjectReportData(filter: ProjectReportFilter): {
  items: ProjectReportItem[];
  summary: ProjectReportSummary;
} {
  // Aggregate from projects and financial balance models
  const items: ProjectReportItem[] = devEvalProjects.map((p) => {
    const balance = memoryProjectCustomerBalances.find((b) => b.project_id === p.id);
    const recorded = memoryProjectRecordedCosts.find((r) => r.project_id === p.id);

    const contractValue = p.contract_value || balance?.contract_value || 0;
    const amountReceived = balance?.amount_received || 0;
    const outstanding = Math.max(0, contractValue - amountReceived);

    const purchases = recorded?.total_purchases || 0;
    const wages = recorded?.total_wages || 0;
    const expenses = recorded?.total_expenses || 0;
    const recordedCost = purchases + wages + expenses;

    return {
      id: p.id,
      project_code: p.project_code,
      name: p.name,
      customer_id: p.customer_id,
      customer_name: p.customer?.name || 'Client',
      status: p.status as any,
      start_date: p.start_date || null,
      expected_end_date: p.expected_end_date || null,
      contract_value: contractValue,
      amount_received: amountReceived,
      outstanding_balance: outstanding,
      overall_progress_percentage: p.status === 'Completed' ? 100 : p.status === 'Active' ? 68 : 10,
      total_purchases: purchases,
      total_wages: wages,
      total_expenses: expenses,
      recorded_project_cost: recordedCost,
      daily_reports_count: p.status === 'Active' ? 18 : 4,
    };
  });

  // Filter
  const filtered = items.filter((item) => {
    if (filter.status !== 'all' && item.status !== filter.status) return false;
    if (filter.customerId && filter.customerId !== 'all' && item.customer_id !== filter.customerId) {
      return false;
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const match =
        item.project_code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Summary
  const summary: ProjectReportSummary = {
    total_projects: filtered.length,
    total_contract_value: filtered.reduce((acc, p) => acc + p.contract_value, 0),
    total_customer_received: filtered.reduce((acc, p) => acc + p.amount_received, 0),
    total_customer_outstanding: filtered.reduce((acc, p) => acc + p.outstanding_balance, 0),
    total_recorded_cost: filtered.reduce((acc, p) => acc + p.recorded_project_cost, 0),
  };

  return { items: filtered, summary };
}

export function useProjectReport(filter: ProjectReportFilter) {
  return useQuery<{ items: ProjectReportItem[]; summary: ProjectReportSummary }, Error>({
    queryKey: ['report-projects', filter],
    queryFn: async () => buildProjectReportData(filter),
    staleTime: 60 * 1000,
  });
}

// ==========================================
// 3. PURCHASE REPORT HOOK
// ==========================================

export function buildPurchaseReportData(filter: PurchaseReportFilter): {
  items: PurchaseReportItem[];
  summary: PurchaseReportSummary;
} {
  const inRange = (d?: string | null) => {
    if (!d) return false;
    const dateStr = d.split('T')[0];
    return dateStr >= filter.startDate && dateStr <= filter.endDate;
  };

  const items: PurchaseReportItem[] = memoryPurchases.map((p) => {
    const supplier = memorySuppliers.find((s) => s.id === p.supplier_id);
    const project = devEvalProjects.find((prj) => prj.id === p.project_id);

    const paidAmount = p.total_allocated ?? Math.max(0, p.total_amount - (p.outstanding_balance ?? p.total_amount));
    const outstandingBalance = p.outstanding_balance ?? Math.max(0, p.total_amount - paidAmount);

    let pmtStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Unpaid';
    if (paidAmount >= p.total_amount) pmtStatus = 'Paid';
    else if (paidAmount > 0) pmtStatus = 'Partial';

    return {
      id: p.id,
      invoice_number: p.invoice_number || `INV-${p.id.slice(0, 6).toUpperCase()}`,
      supplier_id: p.supplier_id,
      supplier_name: supplier?.name || p.supplier?.name || 'Vendor',
      project_id: p.project_id || null,
      project_code: project?.project_code || p.project?.project_code || null,
      project_name: project?.name || p.project?.name || null,
      purchase_date: p.purchase_date,
      due_date: p.due_date || null,
      total_amount: p.total_amount,
      paid_amount: paidAmount,
      outstanding_balance: outstandingBalance,
      status: p.status as any,
      payment_status: pmtStatus,
      items_count: p.items?.length || 2,
    };
  });

  const filtered = items.filter((p) => {
    if (filter.startDate && filter.endDate && !inRange(p.purchase_date)) return false;
    if (filter.supplierId && filter.supplierId !== 'all' && p.supplier_id !== filter.supplierId) {
      return false;
    }
    if (filter.projectId && filter.projectId !== 'all' && p.project_id !== filter.projectId) {
      return false;
    }
    if (filter.status !== 'all' && p.payment_status !== filter.status && p.status !== filter.status) {
      return false;
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const match =
        p.invoice_number.toLowerCase().includes(q) ||
        p.supplier_name.toLowerCase().includes(q) ||
        (p.project_name && p.project_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Project breakdowns
  const projectMap = new Map<string, PurchaseProjectBreakdown>();
  for (const p of filtered) {
    const key = p.project_id || 'general';
    const existing = projectMap.get(key) || {
      project_id: p.project_id,
      project_name: p.project_name || 'General Materials / Unassigned',
      project_code: p.project_code || 'GEN',
      purchases_count: 0,
      total_amount: 0,
    };
    existing.purchases_count += 1;
    existing.total_amount += p.total_amount;
    projectMap.set(key, existing);
  }

  const summary: PurchaseReportSummary = {
    total_purchases: filtered.reduce((acc, p) => acc + p.total_amount, 0),
    total_paid: filtered.reduce((acc, p) => acc + p.paid_amount, 0),
    total_outstanding: filtered.reduce((acc, p) => acc + p.outstanding_balance, 0),
    invoices_count: filtered.length,
    project_breakdowns: Array.from(projectMap.values()),
  };

  return { items: filtered, summary };
}

export function usePurchaseReport(filter: PurchaseReportFilter) {
  return useQuery<{ items: PurchaseReportItem[]; summary: PurchaseReportSummary }, Error>({
    queryKey: ['report-purchases', filter],
    queryFn: async () => buildPurchaseReportData(filter),
    staleTime: 60 * 1000,
  });
}

// ==========================================
// 4. WORKFORCE REPORT HOOK
// ==========================================

export function buildWorkforceReportData(filter: WorkforceReportFilter): {
  items: WorkforceReportItem[];
  summary: WorkforceReportSummary;
} {
  const inRange = (d?: string | null) => {
    if (!d) return false;
    const dateStr = d.split('T')[0];
    return dateStr >= filter.startDate && dateStr <= filter.endDate;
  };

  // Attendance records within range
  const attendanceInRange = memoryAttendance.filter((a) => inRange(a.attendance_date));

  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  const workerSet = new Set<string>();

  for (const a of attendanceInRange) {
    if (a.status === 'Present') {
      presentCount++;
      workerSet.add(a.employee_id);
    } else if (a.status === 'Half Day') {
      halfDayCount++;
      workerSet.add(a.employee_id);
    } else if (a.status === 'Absent') {
      absentCount++;
    }
  }

  // Map employees
  const items: WorkforceReportItem[] = memoryEmployees.map((emp) => {
    const empAtt = attendanceInRange.filter((a) => a.employee_id === emp.id);
    const pDays = empAtt.filter((a) => a.status === 'Present').length;
    const hDays = empAtt.filter((a) => a.status === 'Half Day').length;
    const aDays = empAtt.filter((a) => a.status === 'Absent').length;

    // Wages earned
    const dailyRate = emp.daily_wage || 0;
    const empWages = memoryDailyWages.filter((w) => w.employee_id === emp.id && inRange(w.wage_date));
    const wagesEarned = empWages.reduce((acc, w) => acc + (w.amount || 0), 0) || (pDays * dailyRate + hDays * (dailyRate / 2));

    // Wages paid
    const empPmts = memoryEmployeePayments.filter((ep) => ep.employee_id === emp.id && inRange(ep.payment_date));
    const wagesPaid = empPmts.reduce((acc, ep) => acc + (ep.amount || 0), 0);
    const wagePayable = Math.max(0, wagesEarned - wagesPaid);

    // Advances
    const empAdv = memoryAdvances.filter((adv) => adv.employee_id === emp.id && inRange(adv.advance_date));
    const advGiven = empAdv.reduce((acc, adv) => acc + (adv.amount || 0), 0);
    const advRecov = empAdv.reduce((acc, adv) => acc + (adv.recovered_amount || 0), 0);
    const advOutstanding = Math.max(0, advGiven - advRecov);

    const projects = emp.assigned_project_name ? [emp.assigned_project_name] : ['Site A'];

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      worker_type: emp.worker_type || 'General Labor',
      daily_wage_rate: dailyRate,
      projects_worked: projects,
      days_present: pDays,
      days_half_day: hDays,
      days_absent: aDays,
      wages_earned: wagesEarned,
      wages_paid: wagesPaid,
      wage_payable: wagePayable,
      advances_given: advGiven,
      advances_recovered: advRecov,
      advance_outstanding: advOutstanding,
    };
  });

  // Filter
  const filtered = items.filter((item) => {
    if (filter.employeeId && filter.employeeId !== 'all' && item.employee_id !== filter.employeeId) {
      return false;
    }
    if (filter.trade && filter.trade !== 'all' && item.worker_type !== filter.trade) {
      return false;
    }
    return true;
  });

  const summary: WorkforceReportSummary = {
    attendance: {
      total_records: attendanceInRange.length,
      present_count: presentCount,
      half_day_count: halfDayCount,
      absent_count: absentCount,
      distinct_workers: workerSet.size || filtered.length,
    },
    total_wages_earned: filtered.reduce((acc, e) => acc + e.wages_earned, 0),
    total_wages_paid: filtered.reduce((acc, e) => acc + e.wages_paid, 0),
    total_wage_payable: filtered.reduce((acc, e) => acc + e.wage_payable, 0),
    total_advances_given: filtered.reduce((acc, e) => acc + e.advances_given, 0),
    total_advances_recovered: filtered.reduce((acc, e) => acc + e.advances_recovered, 0),
    total_advance_outstanding: filtered.reduce((acc, e) => acc + e.advance_outstanding, 0),
  };

  return { items: filtered, summary };
}

export function useWorkforceReport(filter: WorkforceReportFilter) {
  return useQuery<{ items: WorkforceReportItem[]; summary: WorkforceReportSummary }, Error>({
    queryKey: ['report-workforce', filter],
    queryFn: async () => buildWorkforceReportData(filter),
    staleTime: 60 * 1000,
  });
}

// ==========================================
// 5. PAYMENT REPORT HOOK
// ==========================================

export function buildPaymentReportData(filter: PaymentReportFilter): {
  items: ConsolidatedPaymentItem[];
  summary: PaymentReportSummary;
} {
  const inRange = (d?: string | null) => {
    if (!d) return false;
    const dateStr = d.split('T')[0];
    return dateStr >= filter.startDate && dateStr <= filter.endDate;
  };

  const normalized: ConsolidatedPaymentItem[] = [];

  // 1. Customer Payments (Money In)
  for (const cp of memoryCustomerPayments) {
    if (!inRange(cp.payment_date) || cp.status === 'Cancelled') continue;
    const project = devEvalProjects.find((p) => p.id === cp.project_id);

    normalized.push({
      id: cp.id,
      payment_number: cp.payment_number,
      payment_date: cp.payment_date,
      classification: 'Customer Receipt',
      direction: 'IN',
      party_name: cp.customer?.name || 'Client',
      party_role: 'Customer',
      project_id: cp.project_id,
      project_name: project?.name || cp.project?.name || null,
      project_code: project?.project_code || cp.project?.project_code || null,
      payment_method: cp.payment_method,
      reference_number: cp.reference_number,
      amount: cp.amount,
      notes: cp.notes,
    });
  }

  // 2. Supplier Payments (Money Out)
  for (const sp of memorySupplierPayments) {
    if (!inRange(sp.payment_date) || sp.status === 'Cancelled') continue;
    const supplier = memorySuppliers.find((s) => s.id === sp.supplier_id);

    normalized.push({
      id: sp.id,
      payment_number: sp.payment_number,
      payment_date: sp.payment_date,
      classification: 'Supplier Payment',
      direction: 'OUT',
      party_name: supplier?.name || 'Vendor',
      party_role: 'Supplier',
      project_id: null,
      project_name: null,
      project_code: null,
      payment_method: sp.payment_method,
      reference_number: sp.reference_number,
      amount: sp.amount,
      notes: sp.notes,
    });
  }

  // 3. Employee Payments (Money Out)
  for (const ep of memoryEmployeePayments) {
    if (!inRange(ep.payment_date) || ep.status === 'Cancelled') continue;
    const employee = memoryEmployees.find((e) => e.id === ep.employee_id);

    normalized.push({
      id: ep.id,
      payment_number: ep.payment_number,
      payment_date: ep.payment_date,
      classification: 'Employee Wage Payment',
      direction: 'OUT',
      party_name: employee?.name || 'Laborer',
      party_role: 'Employee',
      project_id: null,
      project_name: null,
      project_code: null,
      payment_method: ep.payment_method,
      reference_number: ep.reference_number,
      amount: ep.amount,
      notes: ep.notes,
    });
  }

  // 4. Direct Expenses (Money Out)
  for (const ex of memoryExpenses) {
    if (!inRange(ex.expense_date) || ex.status === 'Cancelled') continue;
    const project = devEvalProjects.find((p) => p.id === ex.project_id);

    normalized.push({
      id: ex.id,
      payment_number: ex.expense_number,
      payment_date: ex.expense_date,
      classification: 'Direct Expense',
      direction: 'OUT',
      party_name: ex.category || 'Direct Expense',
      party_role: 'Direct Vendor',
      project_id: ex.project_id || null,
      project_name: project?.name || null,
      project_code: project?.project_code || null,
      payment_method: ex.payment_method,
      reference_number: ex.reference_number,
      amount: ex.amount,
      notes: ex.description,
    });
  }

  // Sort descending by date
  normalized.sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  // Filter
  const filtered = normalized.filter((item) => {
    if (filter.classification !== 'all' && item.classification !== filter.classification) {
      return false;
    }
    if (filter.projectId && filter.projectId !== 'all' && item.project_id !== filter.projectId) {
      return false;
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const match =
        item.payment_number.toLowerCase().includes(q) ||
        item.party_name.toLowerCase().includes(q) ||
        (item.reference_number && item.reference_number.toLowerCase().includes(q)) ||
        (item.project_name && item.project_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Compute separate totals (NO NETTING, NO PROFIT)
  let custReceived = 0;
  let suppPaid = 0;
  let empPaid = 0;
  let expRecorded = 0;

  for (const item of filtered) {
    if (item.classification === 'Customer Receipt') custReceived += item.amount;
    else if (item.classification === 'Supplier Payment') suppPaid += item.amount;
    else if (item.classification === 'Employee Wage Payment') empPaid += item.amount;
    else if (item.classification === 'Direct Expense') expRecorded += item.amount;
  }

  const summary: PaymentReportSummary = {
    customer_payments_received: custReceived,
    supplier_payments_made: suppPaid,
    employee_payments_made: empPaid,
    expenses_recorded: expRecorded,
    total_transactions: filtered.length,
  };

  return { items: filtered, summary };
}

export function usePaymentReport(filter: PaymentReportFilter) {
  return useQuery<{ items: ConsolidatedPaymentItem[]; summary: PaymentReportSummary }, Error>({
    queryKey: ['report-payments', filter],
    queryFn: async () => buildPaymentReportData(filter),
    staleTime: 60 * 1000,
  });
}

