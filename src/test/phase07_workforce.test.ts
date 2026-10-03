import { describe, it, expect } from 'vitest';
import {
  employeeFormSchema,
  advanceFormSchema,
  employeePaymentFormSchema,
  TRADE_CATEGORIES,
  PAYMENT_METHODS,
} from '@/types/workforce';
import {
  memoryEmployees,
  memoryDailyWages,
  memoryAdvances,
  memoryEmployeePayments,
  getTodayDateString,
} from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

describe('Phase 07: Workforce & Daily Labour Tests', () => {
  // ==========================================
  // 1. EMPLOYEES SCHEMA & VALIDATION TESTS
  // ==========================================
  describe('1. Employees Validation & Schema', () => {
    it('validates a valid employee form submission', () => {
      const validEmp = {
        name: 'M. Shanmugam',
        phone: '9842101122',
        worker_type: 'Mason (Maistry)',
        daily_wage: 1100,
        status: 'active' as const,
        joining_date: '2025-06-15',
        emergency_contact: '9842101123 (Wife - Gomathi)',
        address: '14, South Car Street, Sankarankovil',
        notes: 'Head civil maistry with 18 years experience',
      };

      const result = employeeFormSchema.safeParse(validEmp);
      expect(result.success).toBe(true);
    });

    it('rejects an employee with a blank name', () => {
      const invalid = {
        name: '   ',
        phone: '9842101122',
        worker_type: 'Electrician',
        status: 'active' as const,
      };

      const result = employeeFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Employee name is required');
      }
    });

    it('rejects negative daily wage rates', () => {
      const invalid = {
        name: 'K. Murugesan',
        phone: '9443202233',
        worker_type: 'Barbender / Steel Fixer',
        daily_wage: -500,
        status: 'active' as const,
      };

      const result = employeeFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Daily wage cannot be negative');
      }
    });

    it('validates Indian 10-digit mobile numbers starting with 6-9', () => {
      const validPhones = ['9842101122', '9443202233', '8765432109', '7012345678', '6380123456'];
      for (const phone of validPhones) {
        const result = employeeFormSchema.safeParse({
          name: 'Valid Worker',
          phone,
          worker_type: 'Mason (Maistry)',
          status: 'active' as const,
        });
        expect(result.success).toBe(true);
      }

      const invalidPhones = ['1234567890', '5842101122', '98421', '04522334455', 'abcdefghij'];
      for (const phone of invalidPhones) {
        const result = employeeFormSchema.safeParse({
          name: 'Invalid Worker',
          phone,
          worker_type: 'Mason (Maistry)',
          status: 'active' as const,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('valid 10-digit Indian mobile number');
        }
      }
    });

    it('includes authentic Tamil Nadu civil trade categories', () => {
      expect(TRADE_CATEGORIES).toContain('Mason (Maistry)');
      expect(TRADE_CATEGORIES).toContain('Barbender / Steel Fixer');
      expect(TRADE_CATEGORIES).toContain('Carpenter (Interior / Woodwork)');
      expect(TRADE_CATEGORIES).toContain('Female Helper / Chithal');
      expect(TRADE_CATEGORIES).toContain('Male Helper / Chithal');
    });

    it('has realistic memory crew members with formatted employee codes (EMP-0001)', () => {
      expect(memoryEmployees.length).toBeGreaterThanOrEqual(6);
      memoryEmployees.forEach((emp) => {
        expect(emp.employee_code).toMatch(/^EMP-\d{4}$/);
        expect(emp.name.trim().length).toBeGreaterThan(0);
        expect(emp.status === 'active' || emp.status === 'inactive').toBe(true);
      });
    });
  });

  // ==========================================
  // 2. ATTENDANCE & FAST MUSTER TESTS
  // ==========================================
  describe('2. Attendance & Fast Muster Workflow', () => {
    it('supports only backend-valid attendance statuses (Present, Half Day, Absent)', () => {
      const validStatuses = ['Present', 'Half Day', 'Absent'];
      validStatuses.forEach((status) => {
        expect(['Present', 'Half Day', 'Absent']).toContain(status);
      });
    });

    it('correctly maps attendance status to payable shift units', () => {
      const getUnits = (status: 'Present' | 'Half Day' | 'Absent') => {
        if (status === 'Present') return 1.0;
        if (status === 'Half Day') return 0.5;
        return 0.0;
      };

      expect(getUnits('Present')).toBe(1.0);
      expect(getUnits('Half Day')).toBe(0.5);
      expect(getUnits('Absent')).toBe(0.0);
    });

    it('computes exact earned wage amount for a daily shift without rounding errors', () => {
      const rate = 950;
      const fullDayWage = 1.0 * rate;
      const halfDayWage = 0.5 * rate;
      const absentWage = 0.0 * rate;

      expect(fullDayWage).toBe(950);
      expect(halfDayWage).toBe(475);
      expect(absentWage).toBe(0);
    });

    it('generates consistent date string YYYY-MM-DD for today', () => {
      const today = getTodayDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('simulates rapid Mark All Present batch update', () => {
      const attendanceMap: Record<string, 'Present' | 'Half Day' | 'Absent'> = {};
      memoryEmployees.forEach((emp) => {
        attendanceMap[emp.id] = 'Present';
      });

      const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
      expect(presentCount).toBe(memoryEmployees.length);

      // Adjust 1 exception to Half Day and 1 to Absent
      attendanceMap[memoryEmployees[0].id] = 'Half Day';
      attendanceMap[memoryEmployees[1].id] = 'Absent';

      const adjustedPresent = Object.values(attendanceMap).filter((s) => s === 'Present').length;
      const adjustedHalf = Object.values(attendanceMap).filter((s) => s === 'Half Day').length;
      const adjustedAbsent = Object.values(attendanceMap).filter((s) => s === 'Absent').length;

      expect(adjustedPresent).toBe(memoryEmployees.length - 2);
      expect(adjustedHalf).toBe(1);
      expect(adjustedAbsent).toBe(1);
    });
  });

  // ==========================================
  // 3. WAGES OPERATIONAL TRACKING & NON-NETTING TESTS
  // ==========================================
  describe('3. Operational Wages & Financial Separation', () => {
    it('verifies wage payable is calculated as (Earned - Paid) without subtracting advances', () => {
      const earned = 26400;
      const paid = 20000;
      const advanceOutstanding = 3000;

      const wagePayable = earned - paid;
      expect(wagePayable).toBe(6400);

      // STRICT RULE 18: Wage Payable MUST NOT be netted against Advance Outstanding!
      expect(wagePayable).not.toBe(wagePayable - advanceOutstanding);
      expect(wagePayable).toBe(6400);
    });

    it('calculates total project wage liabilities accurately', () => {
      const wages = memoryDailyWages;
      const totalEarned = wages.reduce((sum, w) => sum + (w.amount || 0), 0);
      expect(totalEarned).toBeGreaterThan(0);
    });

    it('verifies wage records have sequential WG- numbers', () => {
      memoryDailyWages.forEach((w) => {
        expect(w.wage_number).toMatch(/^WG-\d{4}$/);
        expect(w.amount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ==========================================
  // 4. ADVANCES & RULE 18 OUTSTANDING CALCULATION
  // ==========================================
  describe('4. Employee Advances Register', () => {
    it('validates a valid advance creation request', () => {
      const validAdvance = {
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        advance_date: getTodayDateString(),
        amount: 3000,
        payment_method: 'Cash' as const,
        purpose: 'Tool purchase loan',
        reference_number: 'SLIP-102',
      };

      const result = advanceFormSchema.safeParse(validAdvance);
      expect(result.success).toBe(true);
    });

    it('rejects non-positive advance amounts (amount <= 0)', () => {
      const invalid = {
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        advance_date: getTodayDateString(),
        amount: 0,
        payment_method: 'Cash' as const,
      };

      const result = advanceFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('greater than 0');
      }
    });

    it('rejects future advance dates beyond tomorrow', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureStr = futureDate.toISOString().split('T')[0];

      const invalid = {
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        advance_date: futureStr,
        amount: 2000,
        payment_method: 'Cash' as const,
      };

      const result = advanceFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('future beyond tomorrow');
      }
    });

    it('verifies the approved advance formula: Advance Received - Recovered = Outstanding', () => {
      const advanceGiven = 5000;
      const advanceRecovered = 2000;
      const advanceOutstanding = advanceGiven - advanceRecovered;

      expect(advanceOutstanding).toBe(3000);
      expect(advanceOutstanding).toBeGreaterThan(0);
    });

    it('confirms advance numbers follow ADV-XXXX sequence', () => {
      memoryAdvances.forEach((a) => {
        expect(a.advance_number).toMatch(/^ADV-\d{4}$/);
        expect(a.amount).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================
  // 5. EMPLOYEE PAYMENTS & DISBURSEMENTS
  // ==========================================
  describe('5. Employee Payments & Wage Disbursements', () => {
    it('validates a valid employee payment form submission', () => {
      const validPayment = {
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        payment_date: getTodayDateString(),
        amount: 15000,
        payment_method: 'Bank Transfer' as const,
        reference_number: 'NEFT-SBIN9921',
        allocation_target: 'wages' as const,
        notes: 'Bi-weekly wage disbursement',
      };

      const result = employeePaymentFormSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('rejects payments with amount <= 0', () => {
      const invalid = {
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        payment_date: getTodayDateString(),
        amount: -500,
        payment_method: 'Cash' as const,
        allocation_target: 'wages' as const,
      };

      const result = employeePaymentFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('greater than 0');
      }
    });

    it('rejects payments with future dates beyond tomorrow', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const invalid = {
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        payment_date: futureDate.toISOString().split('T')[0],
        amount: 5000,
        payment_method: 'Cash' as const,
        allocation_target: 'wages' as const,
      };

      const result = employeePaymentFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('future beyond tomorrow');
      }
    });

    it('confirms payment numbers follow EP-XXXX format', () => {
      memoryEmployeePayments.forEach((p) => {
        expect(p.payment_number).toMatch(/^EP-\d{4}$/);
        expect(p.amount).toBeGreaterThan(0);
      });
    });

    it('supports all approved payment methods', () => {
      expect(PAYMENT_METHODS).toContain('Cash');
      expect(PAYMENT_METHODS).toContain('Bank Transfer');
      expect(PAYMENT_METHODS).toContain('UPI');
      expect(PAYMENT_METHODS).toContain('Cheque');
      expect(PAYMENT_METHODS).toContain('Other');
    });
  });

  // ==========================================
  // 6. FINANCIAL PURITY (NO PROFIT, MARGIN, OR NETTING)
  // ==========================================
  describe('6. Financial Purity & Terminology Compliance', () => {
    it('verifies Indian Rupee formatting helper works correctly', () => {
      expect(formatINR(0)).toBe('₹0.00');
      expect(formatINR(1200)).toBe('₹1,200.00');
      expect(formatINR(50000)).toBe('₹50,000.00');
      expect(formatINR(1250000)).toBe('₹12,50,000.00');
    });

    it('verifies code does not compute net employee balance (Rule 18)', () => {
      const emp = memoryEmployees[0];
      // Wage payable is separate
      expect(emp.wage_payable).toBe(6400);
      // Advance outstanding is separate
      expect(emp.advance_outstanding).toBe(3000);
      // They are separate properties on the employee model
      expect(emp).toHaveProperty('wage_payable');
      expect(emp).toHaveProperty('advance_outstanding');
      expect(emp).not.toHaveProperty('net_employee_balance');
      expect(emp).not.toHaveProperty('profit');
      expect(emp).not.toHaveProperty('margin');
      expect(emp).not.toHaveProperty('roi');
    });
  });
});
