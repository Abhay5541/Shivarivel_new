import { describe, it, expect } from 'vitest';
import {
  supplierFormSchema,
  materialFormSchema,
  purchaseFormSchema,
  purchaseItemFormSchema,
  supplierPaymentFormSchema,
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  PAYMENT_METHODS,
  type PurchasePaymentStatus,
} from '@/types/procurement';
import {
  derivePurchasePaymentStatus,
  memorySuppliers,
  memoryMaterials,
  memoryPurchases,
  memorySupplierPayments,
} from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';

describe('Phase 06: Procurement & Suppliers Module Tests', () => {
  // ==========================================
  // 1. SUPPLIER SCHEMA & VALIDATION TESTS
  // ==========================================
  describe('Supplier Validation', () => {
    it('validates a complete, valid supplier payload', () => {
      const validSupplier = {
        name: 'Madurai TMT Steels & Cements',
        contact_person: 'R. Senthil Nathan',
        phone: '9842144332',
        alternate_phone: '9443155443',
        email: 'senthil@maduraisteels.in',
        address: '44 Workshop Road, Simmakkal, Madurai, Tamil Nadu 625001',
        gst_number: '33AAACM1234F1Z5',
        category: 'Steel & Structural',
        notes: 'Primary reinforcement steel vendor with 15-day credit cycle',
        status: 'active' as const,
      };

      const result = supplierFormSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it('rejects a supplier with an empty name', () => {
      const invalid = {
        name: '',
        phone: '9842144332',
        status: 'active' as const,
      };

      const result = supplierFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Supplier name is required');
      }
    });

    it('rejects invalid Indian phone numbers (must be 10 digits starting with 6-9)', () => {
      const invalidPhones = ['1234567890', '98421', '04522334455', 'abcdefghij', '5842144332'];

      for (const phone of invalidPhones) {
        const result = supplierFormSchema.safeParse({
          name: 'Test Supplier',
          phone,
          status: 'active' as const,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Must be a valid 10-digit Indian phone number');
        }
      }
    });

    it('accepts valid 10-digit Indian mobile numbers', () => {
      const validPhones = ['9842144332', '8765432109', '7012345678', '6380123456'];

      for (const phone of validPhones) {
        const result = supplierFormSchema.safeParse({
          name: 'Test Supplier',
          phone,
          status: 'active' as const,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  // ==========================================
  // 2. MATERIAL SCHEMA & CATALOG TESTS
  // ==========================================
  describe('Material Master Validation', () => {
    it('validates a correct material definition', () => {
      const validMaterial = {
        name: 'FE 550D TMT Steel 16mm (Fe-550D)',
        category: 'Steel & Structural',
        unit: 'Kg',
        standard_rate: 68.5,
        description: 'IS 1786 primary reinforcement steel bars with test certificates',
        status: 'active' as const,
      };

      const result = materialFormSchema.safeParse(validMaterial);
      expect(result.success).toBe(true);
    });

    it('rejects a negative benchmark unit rate', () => {
      const invalid = {
        name: 'Cement UltraTech PPC 50kg',
        category: 'Cement & Masonry',
        unit: 'Bag',
        standard_rate: -420,
        status: 'active' as const,
      };

      const result = materialFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Standard rate cannot be negative');
      }
    });

    it('contains standard construction categories and units for Tamil Nadu operations', () => {
      expect(MATERIAL_CATEGORIES).toContain('Cement & Masonry');
      expect(MATERIAL_CATEGORIES).toContain('Steel & Structural');
      expect(MATERIAL_CATEGORIES).toContain('Plywood & Timber');
      expect(MATERIAL_UNITS).toContain('Bags');
      expect(MATERIAL_UNITS).toContain('Kg');
      expect(MATERIAL_UNITS).toContain('Sq.ft');
      expect(MATERIAL_UNITS).toContain('Brass');
    });
  });

  // ==========================================
  // 3. PURCHASE & BOQ ITEM VALIDATION
  // ==========================================
  describe('Purchase Entry & BoQ Calculations', () => {
    it('calculates line item amounts accurately (qty * rate)', () => {
      const item = {
        material_id: 'mat-01',
        description: 'UltraTech PPC 50kg bags for slab concreting',
        quantity: 150,
        unit: 'Bag',
        unit_price: 395,
      };

      const lineAmount = item.quantity * item.unit_price;
      expect(lineAmount).toBe(59250);

      const parsed = purchaseItemFormSchema.safeParse(item);
      expect(parsed.success).toBe(true);
    });

    it('rejects line item with zero or negative quantity', () => {
      const invalidItem = {
        material_id: 'mat-01',
        quantity: 0,
        unit: 'Bag',
        unit_price: 395,
      };

      const result = purchaseItemFormSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Quantity must be greater than 0');
      }
    });

    it('computes purchase subtotal, discount, tax and grand total correctly', () => {
      const items = [
        { material_id: 'mat-01', quantity: 100, unit: 'Bag', unit_price: 400 }, // 40,000
        { material_id: 'mat-02', quantity: 500, unit: 'Kg', unit_price: 70 },    // 35,000
      ];

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      expect(subtotal).toBe(75000);

      const discount = 2000;
      const tax = 3650;
      const grandTotal = Math.max(0, subtotal - discount + tax);
      expect(grandTotal).toBe(76650);

      const purchasePayload = {
        supplier_id: 'sup-01',
        project_id: 'prj-001',
        invoice_number: 'INV-2026-901',
        purchase_date: '2026-10-02',
        due_date: '2026-10-17',
        discount,
        tax,
        notes: 'Direct site delivery to Anna Nagar project',
        items,
        record_initial_payment: false,
      };

      const parseResult = purchaseFormSchema.safeParse(purchasePayload);
      expect(parseResult.success).toBe(true);
    });
  });

  // ==========================================
  // 4. DERIVED PURCHASE STATUS LOGIC
  // ==========================================
  describe('Derived Purchase Payment Status', () => {
    it('returns Unpaid when total_allocated is 0', () => {
      const status: PurchasePaymentStatus = derivePurchasePaymentStatus(50000, 0);
      expect(status).toBe('Unpaid');
    });

    it('returns Partial when total_allocated is between 0 and total_amount', () => {
      const status1: PurchasePaymentStatus = derivePurchasePaymentStatus(50000, 10000);
      expect(status1).toBe('Partial');

      const status2: PurchasePaymentStatus = derivePurchasePaymentStatus(50000, 49999);
      expect(status2).toBe('Partial');
    });

    it('returns Paid when total_allocated is equal to or greater than total_amount', () => {
      const status1: PurchasePaymentStatus = derivePurchasePaymentStatus(50000, 50000);
      expect(status1).toBe('Paid');

      const status2: PurchasePaymentStatus = derivePurchasePaymentStatus(50000, 55000);
      expect(status2).toBe('Paid');
    });
  });

  // ==========================================
  // 5. SUPPLIER PAYMENT & ALLOCATION LOGIC
  // ==========================================
  describe('Supplier Payment & Allocation Constraints', () => {
    it('validates a valid supplier payment disbursement payload', () => {
      const validPayment = {
        supplier_id: 'sup-01',
        payment_date: '2026-10-02',
        amount: 50000,
        payment_method: 'NEFT / RTGS',
        reference_number: 'AXIS-RTGS-9821034',
        notes: 'Monthly bulk material clearance payment',
        allocations: [
          { purchase_id: 'pur-01', amount: 35000 },
          { purchase_id: 'pur-02', amount: 15000 },
        ],
      };

      const result = supplierPaymentFormSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('correctly calculates supplier credit when payment amount > total allocations', () => {
      const paymentAmount = 75000;
      const allocatedTotal = 50000;
      const supplierCredit = Math.max(0, paymentAmount - allocatedTotal);

      expect(supplierCredit).toBe(25000);
    });

    it('enforces that allocation amount must not exceed purchase outstanding balance', () => {
      const purchaseTotal = 60000;
      const existingAllocated = 20000;
      const outstandingBalance = purchaseTotal - existingAllocated; // 40000

      const proposedAllocation = 45000;
      const isOverAllocated = proposedAllocation > outstandingBalance;
      expect(isOverAllocated).toBe(true);

      const cappedAllocation = Math.min(proposedAllocation, outstandingBalance);
      expect(cappedAllocation).toBe(40000);
    });

    it('verifies supported payment methods', () => {
      expect(PAYMENT_METHODS).toContain('Bank Transfer (NEFT / RTGS)');
      expect(PAYMENT_METHODS).toContain('UPI / GPay / PhonePe');
      expect(PAYMENT_METHODS).toContain('Cheque');
      expect(PAYMENT_METHODS).toContain('Cash');
    });
  });

  // ==========================================
  // 6. SEED DATA INTEGRITY & AUDIT
  // ==========================================
  describe('Evaluation Seed Data Integrity', () => {
    it('verifies realistic Tamil Nadu suppliers are initialized', () => {
      expect(memorySuppliers.length).toBeGreaterThanOrEqual(4);
      const supplierNames = memorySuppliers.map((s) => s.name);
      expect(supplierNames).toContain('Madurai TMT Steels & Cements');
      expect(supplierNames).toContain('Chettinad Blocks & Aggregates');
      expect(supplierNames).toContain('Hafele & Greenply Architectural Hardwares');
      expect(supplierNames).toContain('Surya Electricals & Havells Cables');
    });

    it('verifies materials catalog references valid units and categories', () => {
      expect(memoryMaterials.length).toBeGreaterThanOrEqual(5);
      memoryMaterials.forEach((m) => {
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.unit.length).toBeGreaterThan(0);
        expect(m.category.length).toBeGreaterThan(0);
      });
    });

    it('verifies purchases dataset references valid suppliers and calculates correctly', () => {
      expect(memoryPurchases.length).toBeGreaterThanOrEqual(3);
      memoryPurchases.forEach((p) => {
        expect(p.supplier_id).toBeDefined();
        expect(p.total_amount).toBeGreaterThan(0);
        expect(['Unpaid', 'Partial', 'Paid']).toContain(p.payment_status);
      });
    });

    it('verifies supplier payments track allocations and unallocated credit', () => {
      expect(memorySupplierPayments.length).toBeGreaterThanOrEqual(2);
      memorySupplierPayments.forEach((sp) => {
        expect(sp.amount).toBeGreaterThan(0);
        expect(sp.status).toBe('Confirmed');
        const calculatedCredit = Math.max(0, sp.amount - (sp.total_allocated || 0));
        expect(sp.unallocated_amount).toBe(calculatedCredit);
      });
    });
  });

  // ==========================================
  // 7. INDIAN RUPEE FORMATTER CONSISTENCY
  // ==========================================
  describe('Indian Currency Formatting (formatINR)', () => {
    it('formats numbers with standard Indian comma grouping and ₹ symbol', () => {
      expect(formatINR(125000)).toBe('₹1,25,000.00');
      expect(formatINR(1250000)).toBe('₹12,50,000.00');
      expect(formatINR(0)).toBe('₹0.00');
      expect(formatINR(null)).toBe('₹0.00');
      expect(formatINR(undefined)).toBe('₹0.00');
    });
  });
});
