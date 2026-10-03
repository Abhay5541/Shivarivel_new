import { describe, it, expect } from 'vitest';
import {
  getDateRangeForPreset,
  formatReportDateRange,
  getGeneratedTimestamp,
} from '@/lib/reportDateUtils';
import {
  DEFAULT_COMPANY_REPORT_INFO,
} from '@/types/reports';
import {
  buildFallbackWeeklyReport,
  buildProjectReportData,
  buildPurchaseReportData,
  buildWorkforceReportData,
  buildPaymentReportData,
} from '@/hooks/useReports';
import { formatINR } from '@/lib/utils';

describe('Phase 09: Reports & Operational Reporting Tests', () => {
  // ==========================================
  // 1. DATE CONTROLS & UTILITIES
  // ==========================================
  describe('1. Date Controls & Monday-Sunday Week Convention', () => {
    it('calculates this_week conforming strictly to Monday-Sunday convention', () => {
      const range = getDateRangeForPreset('this_week');
      expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const start = new Date(range.startDate);
      const end = new Date(range.endDate);

      // Start day must be Monday (day 1)
      expect(start.getDay()).toBe(1);
      // End day must be Sunday (day 0)
      expect(end.getDay()).toBe(0);

      // Difference should be exactly 6 days (7-day span)
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6);
    });

    it('calculates last_week conforming strictly to previous Monday-Sunday', () => {
      const range = getDateRangeForPreset('last_week');
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);

      expect(start.getDay()).toBe(1);
      expect(end.getDay()).toBe(0);

      const thisWeekRange = getDateRangeForPreset('this_week');
      const thisWeekStart = new Date(thisWeekRange.startDate);
      const diffFromThisWeek = Math.round((thisWeekStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffFromThisWeek).toBe(7);
    });

    it('calculates this_month starting on 1st and ending on month end', () => {
      const range = getDateRangeForPreset('this_month');
      expect(range.startDate.endsWith('-01')).toBe(true);
      expect(new Date(range.startDate) <= new Date(range.endDate)).toBe(true);
    });

    it('formats Indian date ranges cleanly', () => {
      const formatted = formatReportDateRange('2026-03-16', '2026-03-22');
      expect(formatted).toContain('16 Mar 2026');
      expect(formatted).toContain('22 Mar 2026');
    });

    it('formats report timestamps with date and time', () => {
      const ts = getGeneratedTimestamp();
      expect(ts).toBeDefined();
      expect(ts.length).toBeGreaterThan(5);
    });
  });

  // ==========================================
  // 2. WEEKLY REPORT
  // ==========================================
  describe('2. Weekly Operational Report (/reports/weekly)', () => {
    const weeklyData = buildFallbackWeeklyReport('2026-01-01', '2026-12-31');

    it('provides week-at-a-glance operational metrics', () => {
      expect(weeklyData.projects.active_count).toBeGreaterThanOrEqual(1);
      expect(weeklyData.labour.distinct_workers).toBeGreaterThanOrEqual(1);
      expect(weeklyData.purchases.total_amount).toBeGreaterThanOrEqual(0);
      expect(weeklyData.customer_payments.total_amount).toBeGreaterThanOrEqual(0);
    });

    it('captures business activity accurately', () => {
      expect(weeklyData.other_activity).toBeDefined();
      expect(typeof weeklyData.other_activity.new_enquiries).toBe('number');
      expect(typeof weeklyData.other_activity.completed_visits).toBe('number');
    });

    it('captures project progress and site delays', () => {
      expect(weeklyData.projects.active_projects.length).toBeGreaterThanOrEqual(1);
      const proj = weeklyData.projects.active_projects[0];
      expect(proj.name).toBeDefined();
      expect(typeof proj.overall_progress_percentage).toBe('number');
      expect(proj.overall_progress_percentage).toBeGreaterThanOrEqual(0);
      expect(proj.overall_progress_percentage).toBeLessThanOrEqual(100);

      // Issues/delays
      expect(Array.isArray(weeklyData.site_activity.issues_noted)).toBe(true);
    });

    it('summarizes money movement without netting cash flow or calculating profit', () => {
      expect(weeklyData.customer_payments.total_amount).toBeGreaterThanOrEqual(0);
      expect(weeklyData.supplier_payments.total_amount).toBeGreaterThanOrEqual(0);
      expect(weeklyData.wages.total_amount).toBeGreaterThanOrEqual(0);
      expect(weeklyData.expenses.total_amount).toBeGreaterThanOrEqual(0);

      // ABSOLUTE RULE: No profit or margin anywhere in weekly schema
      const dataKeys = Object.keys(weeklyData);
      expect(dataKeys).not.toContain('profit');
      expect(dataKeys).not.toContain('net_profit');
      expect(dataKeys).not.toContain('margin');
      expect(dataKeys).not.toContain('net_cash_flow');
    });
  });

  // ==========================================
  // 3. PROJECT REPORT
  // ==========================================
  describe('3. Project Report (/reports/project)', () => {
    const { items: allProjects, summary } = buildProjectReportData({
      status: 'all',
      customerId: 'all',
      search: '',
    });

    it('calculates Customer Outstanding strictly as Contract Value - Customer Received', () => {
      allProjects.forEach((proj) => {
        const expectedOutstanding = Math.max(0, proj.contract_value - proj.amount_received);
        expect(proj.outstanding_balance).toBe(expectedOutstanding);
      });
    });

    it('strictly applies Recorded Project Cost = Purchases + Wages + Expenses', () => {
      allProjects.forEach((proj) => {
        const expectedCost = proj.total_purchases + proj.total_wages + proj.total_expenses;
        expect(proj.recorded_project_cost).toBe(expectedCost);
      });
    });

    it('never labels any difference as Profit or Margin in project reporting', () => {
      allProjects.forEach((proj) => {
        const itemRecord = proj as unknown as Record<string, unknown>;
        expect(itemRecord.profit).toBeUndefined();
        expect(itemRecord.gross_profit).toBeUndefined();
        expect(itemRecord.net_profit).toBeUndefined();
        expect(itemRecord.margin).toBeUndefined();
        expect(itemRecord.profit_margin).toBeUndefined();
      });
    });

    it('filters projects by status correctly', () => {
      const activeResult = buildProjectReportData({
        status: 'Active',
        customerId: 'all',
        search: '',
      });
      expect(activeResult.items.length).toBeGreaterThanOrEqual(1);
      activeResult.items.forEach(p => expect(p.status).toBe('Active'));
    });

    it('aggregates summary accurately across projects', () => {
      const expectedCost = allProjects.reduce((acc, p) => acc + p.recorded_project_cost, 0);
      expect(summary.total_recorded_cost).toBe(expectedCost);
      expect(summary.total_projects).toBe(allProjects.length);
    });

    it('supports quick navigation link to /projects/:id', () => {
      allProjects.forEach(p => {
        expect(p.id).toBeDefined();
        expect(p.id.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================
  // 4. PURCHASE REPORT
  // ==========================================
  describe('4. Purchase Report (/reports/purchases)', () => {
    const { items: purchases, summary } = buildPurchaseReportData({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      supplierId: 'all',
      projectId: 'all',
      status: 'all',
      search: '',
    });

    it('summarizes grand total, paid, and outstanding balances cleanly', () => {
      expect(purchases.length).toBeGreaterThan(0);
      expect(summary.total_purchases).toBeGreaterThan(0);
      expect(summary.total_paid).toBeGreaterThan(0);
      expect(summary.total_outstanding).toBeGreaterThanOrEqual(0);

      // Paid + Outstanding = Total
      purchases.forEach(p => {
        expect(p.paid_amount + p.outstanding_balance).toBe(p.total_amount);
      });
    });

    it('filters purchases by supplier or status', () => {
      const sampleSupplierId = purchases[0].supplier_id;
      const filtered = buildPurchaseReportData({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        supplierId: sampleSupplierId,
        projectId: 'all',
        status: 'all',
        search: '',
      });
      expect(filtered.items.length).toBeGreaterThanOrEqual(1);
      filtered.items.forEach(p => expect(p.supplier_id).toBe(sampleSupplierId));
    });

    it('provides project breakdown without inventory valuation', () => {
      expect(summary.project_breakdowns.length).toBeGreaterThanOrEqual(1);
      summary.project_breakdowns.forEach(pb => {
        expect(pb.purchases_count).toBeGreaterThan(0);
        expect(pb.total_amount).toBeGreaterThan(0);
      });
    });

    it('strictly forbids stock, inventory valuation, or material consumption', () => {
      purchases.forEach(p => {
        const item = p as unknown as Record<string, unknown>;
        expect(item.stock).toBeUndefined();
        expect(item.opening_stock).toBeUndefined();
        expect(item.closing_stock).toBeUndefined();
        expect(item.inventory_value).toBeUndefined();
        expect(item.material_consumption).toBeUndefined();
      });
    });
  });

  // ==========================================
  // 5. WORKFORCE REPORT & FINANCIAL SEPARATION
  // ==========================================
  describe('5. Workforce Report (/reports/workforce)', () => {
    const { items: workforce, summary } = buildWorkforceReportData({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      employeeId: 'all',
      projectId: 'all',
      trade: 'all',
    });

    it('maintains strict invariant: Wages Earned - Wages Paid = Wage Payable', () => {
      expect(workforce.length).toBeGreaterThan(0);
      workforce.forEach(emp => {
        const expectedPayable = Math.max(0, emp.wages_earned - emp.wages_paid);
        expect(emp.wage_payable).toBe(expectedPayable);
      });
    });

    it('maintains strict invariant: Advances Received - Advances Recovered = Advance Outstanding', () => {
      workforce.forEach(emp => {
        const expectedAdvanceOutstanding = Math.max(0, emp.advances_given - emp.advances_recovered);
        expect(emp.advance_outstanding).toBe(expectedAdvanceOutstanding);
      });
    });

    it('CRITICAL RULE: Never nets Advances against Wages (no net employee balance)', () => {
      workforce.forEach(emp => {
        const item = emp as unknown as Record<string, unknown>;
        expect(item.net_balance).toBeUndefined();
        expect(item.net_employee_balance).toBeUndefined();
        expect(item.net_payable).toBeUndefined();
      });
    });

    it('tracks attendance breakdown: Present, Half Day, Absent', () => {
      expect(summary.attendance.total_records).toBeGreaterThan(0);
      expect(summary.attendance.present_count).toBeGreaterThanOrEqual(0);
      expect(summary.attendance.half_day_count).toBeGreaterThanOrEqual(0);
      expect(summary.attendance.absent_count).toBeGreaterThanOrEqual(0);
      expect(summary.attendance.distinct_workers).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 6. CONSOLIDATED PAYMENT REPORT
  // ==========================================
  describe('6. Payment Report (/reports/payments)', () => {
    const { items: payments, summary } = buildPaymentReportData({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      classification: 'all',
      projectId: 'all',
      search: '',
    });

    it('strictly categorizes payment directions: Money Received (IN) vs Money Paid (OUT)', () => {
      expect(payments.length).toBeGreaterThan(0);
      payments.forEach(p => {
        if (p.classification === 'Customer Receipt') {
          expect(p.direction).toBe('IN');
        } else {
          expect(p.direction).toBe('OUT');
        }
      });
    });

    it('maintains separate totals for customer received, supplier paid, employee paid, and expenses', () => {
      expect(summary.customer_payments_received).toBeGreaterThan(0);
      expect(summary.supplier_payments_made).toBeGreaterThan(0);
      expect(summary.employee_payments_made).toBeGreaterThan(0);
      expect(summary.expenses_recorded).toBeGreaterThan(0);
      expect(summary.total_transactions).toBe(payments.length);
    });

    it('filters payments by classification cleanly', () => {
      const customerOnly = buildPaymentReportData({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        classification: 'Customer Receipt',
        projectId: 'all',
        search: '',
      });
      customerOnly.items.forEach(p => {
        expect(p.classification).toBe('Customer Receipt');
        expect(p.direction).toBe('IN');
      });
    });

    it('ABSOLUTE RULE: Never calculates Net Cash Flow or subtracts outflows from inflows', () => {
      const summaryRecord = summary as unknown as Record<string, unknown>;
      expect(summaryRecord.net_cash_flow).toBeUndefined();
      expect(summaryRecord.cash_balance).toBeUndefined();
      expect(summaryRecord.profit).toBeUndefined();
    });
  });

  // ==========================================
  // 7. PRINT & LETTERHEAD COMPLIANCE
  // ==========================================
  describe('7. Printable Letterhead Compliance', () => {
    it('supplies official company header defaults without missing legal fields', () => {
      expect(DEFAULT_COMPANY_REPORT_INFO.name).toBe('Shivarivel Construction & Interiors');
      expect(DEFAULT_COMPANY_REPORT_INFO.gstNumber).toMatch(/^33[A-Z0-9]{13}$/);
      expect(DEFAULT_COMPANY_REPORT_INFO.address).toContain('Tamil Nadu');
      expect(DEFAULT_COMPANY_REPORT_INFO.phone).toBeDefined();
    });
  });

  // ==========================================
  // 8. CURRENCY FORMATTING
  // ==========================================
  describe('8. Indian Currency Formatting Compliance', () => {
    it('formats Indian currency with INR symbol and proper comma grouping', () => {
      expect(formatINR(125000)).toBe('₹1,25,000.00');
      expect(formatINR(10000000)).toBe('₹1,00,00,000.00');
      expect(formatINR(500)).toBe('₹500.00');
    });
  });
});
