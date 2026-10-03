import { describe, it, expect } from 'vitest';
import { formatINR } from '@/lib/utils';
import { devEvalDashboardData } from '@/hooks/useDashboard';
import { devEvalMyDayData } from '@/hooks/useMyDay';

describe('Phase 02: Dashboard & My Day Verification', () => {
  describe('A. Financial Display & Non-Netting (Rule 18)', () => {
    it('formats currency in Indian numbering system (INR)', () => {
      const formatted = formatINR(1450000);
      expect(formatted).toContain('14,50,000');
      expect(formatted).toMatch(/₹|INR/);
    });

    it('formats null, undefined, or NaN safely to ₹0.00', () => {
      expect(formatINR(null)).toBe('₹0.00');
      expect(formatINR(undefined)).toBe('₹0.00');
      expect(formatINR(NaN)).toBe('₹0.00');
    });

    it('does NOT contain profit, gross margin, or net ROI in dashboard data models', () => {
      const keys = Object.keys(devEvalDashboardData.financial);
      expect(keys).not.toContain('profit');
      expect(keys).not.toContain('gross_profit');
      expect(keys).not.toContain('net_profit');
      expect(keys).not.toContain('margin');
      expect(keys).not.toContain('roi');
    });

    it('maintains 4 separate non-netted financial pillars', () => {
      const { financial } = devEvalDashboardData;
      expect(financial.total_customer_receivable).toBeDefined();
      expect(financial.total_supplier_payable).toBeDefined();
      expect(financial.total_wage_payable).toBeDefined();
      expect(financial.total_advance_outstanding).toBeDefined();

      // Ensure wage payable and advance outstanding are strictly isolated numbers
      expect(financial.total_wage_payable).not.toBe(financial.total_advance_outstanding);
      expect(typeof financial.total_wage_payable).toBe('number');
      expect(typeof financial.total_advance_outstanding).toBe('number');
    });
  });

  describe('B. My Day Operational Work Queue Structure', () => {
    it('groups operational items into OVERDUE, TODAY, and UPCOMING', () => {
      expect(Array.isArray(devEvalMyDayData.overdue)).toBe(true);
      expect(Array.isArray(devEvalMyDayData.today)).toBe(true);
      expect(Array.isArray(devEvalMyDayData.upcoming)).toBe(true);
      expect(devEvalMyDayData.counts).toBeDefined();
    });

    it('supports task, follow_up, and site_visit item types', () => {
      const allItems = [
        ...devEvalMyDayData.overdue,
        ...devEvalMyDayData.today,
        ...devEvalMyDayData.upcoming,
      ];
      const types = new Set(allItems.map((i) => i.item_type));
      expect(types.has('task')).toBe(true);
      expect(types.has('follow_up')).toBe(true);
      expect(types.has('site_visit')).toBe(true);
    });
  });

  describe('C. Active Projects Portfolio Model', () => {
    it('contains project code, name, progress percentage, and contract value', () => {
      const projects = devEvalDashboardData.projects.active_project_list;
      expect(projects.length).toBeGreaterThan(0);
      const [first] = projects;
      expect(first.project_code).toMatch(/^PRJ-/);
      expect(first.overall_progress_percentage).toBeGreaterThanOrEqual(0);
      expect(first.overall_progress_percentage).toBeLessThanOrEqual(100);
      expect(first.contract_value).toBeGreaterThan(0);
    });
  });
});
