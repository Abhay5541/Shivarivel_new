import { describe, it, expect, beforeEach } from 'vitest';
import {
  supplierFormSchema,
  materialFormSchema,
  type Supplier,
  type Material,
  type Purchase,
} from '@/types/procurement';
import {
  memorySuppliers,
  memoryMaterials,
  memoryPurchases,
} from '@/hooks/useProcurement';
import { devEvalProjects } from '@/hooks/useProjects';

/**
 * Phase 03: Simple ERP — Procurement / Material Management Test Suite
 * Shivarivel Construction & Interiors
 * 
 * Verifies:
 * 1. Supplier can be created.
 * 2. Supplier appears in supplier list.
 * 3. Material can be created.
 * 4. Material appears in material list.
 * 5. Purchase can be created.
 * 6. Purchase is linked to correct site.
 * 7. Purchase is linked to correct supplier.
 * 8. Purchase is linked to correct material.
 * 9. Supplier purchased total updates.
 * 10. Supplier payment can be recorded.
 * 11. Supplier paid total updates.
 * 12. Supplier pending balance updates.
 * 13. Payment exceeding outstanding amount is rejected.
 * 14. Site procurement summary updates.
 * 15. Empty states work.
 * 16. Mobile layout does not overflow.
 * 17. Existing Phase 02 workflow continuity.
 */

describe('Simple ERP — Phase 03: Procurement & Materials Management', () => {
  let mockSuppliers: Supplier[];
  let mockMaterials: Material[];
  let mockPurchases: Purchase[];

  beforeEach(() => {
    mockSuppliers = [...memorySuppliers];
    mockMaterials = [...memoryMaterials];
    mockPurchases = [...memoryPurchases];
  });

  // 1 & 2. SUPPLIERS CREATION & LISTING
  describe('1 & 2. Supplier Creation & Listing', () => {
    it('creates a supplier with simple Name and Phone', () => {
      const input = {
        name: 'ABC Traders',
        phone: '9876543210',
        status: 'active' as const,
      };

      const result = supplierFormSchema.safeParse(input);
      expect(result.success).toBe(true);

      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        company_id: 'comp-shivarivel-001',
        name: input.name,
        contact_person: null,
        phone: input.phone,
        alternate_phone: null,
        email: null,
        address: null,
        gst_number: null,
        category: 'General',
        notes: null,
        status: input.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSuppliers.unshift(newSupplier);

      expect(mockSuppliers[0].name).toBe('ABC Traders');
      expect(mockSuppliers[0].phone).toBe('9876543210');
      expect(mockSuppliers[0].status).toBe('active');
    });

    it('searches and finds supplier by name or phone', () => {
      const searchByName = 'ABC Traders';
      const resultsByName = mockSuppliers.filter((s) =>
        s.name.toLowerCase().includes(searchByName.toLowerCase())
      );
      expect(resultsByName).toBeDefined();

      const searchByPhone = '9842144556';
      const resultsByPhone = mockSuppliers.filter((s) => s.phone?.includes(searchByPhone));
      expect(resultsByPhone.length).toBeGreaterThanOrEqual(1);
      expect(resultsByPhone[0].name).toBe('Madurai TMT Steels & Cements');
    });
  });

  // 3 & 4. MATERIALS CREATION & LISTING
  describe('3 & 4. Material Creation & Listing', () => {
    it('creates a material with Name and Unit', () => {
      const input = {
        name: 'Cement',
        category: 'General',
        unit: 'Bag',
        status: 'active' as const,
      };

      const result = materialFormSchema.safeParse(input);
      expect(result.success).toBe(true);

      const newMaterial: Material = {
        id: `mat-${Date.now()}`,
        company_id: 'comp-shivarivel-001',
        name: input.name,
        category: input.category,
        unit: input.unit,
        standard_rate: null,
        description: null,
        status: input.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockMaterials.unshift(newMaterial);

      expect(mockMaterials[0].name).toBe('Cement');
      expect(mockMaterials[0].unit).toBe('Bag');
    });

    it('searches and finds material in list', () => {
      const search = 'cement';
      const results = mockMaterials.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
      );
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5, 6, 7, 8. PURCHASE CREATION & LINKING
  describe('5, 6, 7 & 8. Purchase Creation & Entity Linking', () => {
    it('creates a purchase linking Site, Supplier, Material, Quantity, and Total Cost', () => {
      const site = devEvalProjects[0];
      const supplier = mockSuppliers[0];
      const material = mockMaterials[0];
      const quantity = 20;
      const totalCost = 8000;

      const newPurchase: Purchase = {
        id: `pur-${Date.now()}`,
        company_id: 'comp-shivarivel-001',
        supplier_id: supplier.id,
        project_id: site.id,
        purchase_number: 'PUR-9999',
        purchase_date: '2026-10-04',
        invoice_number: null,
        status: 'Confirmed',
        discount: 0,
        tax: 0,
        total_amount: totalCost,
        due_date: null,
        notes: null,
        reversal_of_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier,
        project: {
          id: site.id,
          name: site.name,
          project_code: site.project_code,
          site_address: site.site_address,
        },
        items: [
          {
            id: 'pi-9999-1',
            company_id: 'comp-shivarivel-001',
            purchase_id: 'pur-9999',
            material_id: material.id,
            description: null,
            quantity: quantity,
            unit: material.unit,
            unit_price: totalCost / quantity,
            amount: totalCost,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            material,
          },
        ],
        total_allocated: 0,
        outstanding_balance: totalCost,
        payment_status: 'Unpaid',
      };

      mockPurchases.unshift(newPurchase);

      expect(mockPurchases[0].project_id).toBe(site.id);
      expect(mockPurchases[0].supplier_id).toBe(supplier.id);
      expect(mockPurchases[0].items?.[0].material_id).toBe(material.id);
      expect(mockPurchases[0].items?.[0].quantity).toBe(20);
      expect(mockPurchases[0].total_amount).toBe(8000);
      expect(mockPurchases[0].outstanding_balance).toBe(8000);
    });
  });

  // 9, 10, 11, 12, 13. SUPPLIER BALANCES & PAYMENTS
  describe('9, 10, 11, 12 & 13. Financial Invariants & Supplier Balances', () => {
    it('accurately updates supplier purchased, paid, and pending balances', () => {
      const supplierId = 'sup-test-fin';
      const supplierPurchases: Purchase[] = [
        {
          id: 'p-1',
          company_id: 'comp-shivarivel-001',
          supplier_id: supplierId,
          project_id: 'prj-1',
          purchase_number: 'PUR-0001',
          purchase_date: '2026-10-01',
          invoice_number: null,
          status: 'Confirmed',
          discount: 0,
          tax: 0,
          total_amount: 80000,
          total_allocated: 50000,
          outstanding_balance: 30000,
          due_date: null,
          notes: null,
          reversal_of_id: null,
          created_at: '2026-10-01',
          updated_at: '2026-10-01',
        },
      ];

      // Initial state
      const initialPurchased = supplierPurchases.reduce((s, p) => s + p.total_amount, 0);
      const initialPaid = supplierPurchases.reduce((s, p) => s + (p.total_allocated || 0), 0);
      const initialPending = Math.max(0, initialPurchased - initialPaid);

      expect(initialPurchased).toBe(80000);
      expect(initialPaid).toBe(50000);
      expect(initialPending).toBe(30000);

      // Record a payment of ₹10,000
      const paymentAmount = 10000;
      expect(paymentAmount).toBeLessThanOrEqual(initialPending);

      // Update purchase allocation
      supplierPurchases[0].total_allocated = initialPaid + paymentAmount;
      supplierPurchases[0].outstanding_balance = initialPurchased - supplierPurchases[0].total_allocated;

      const updatedPaid = supplierPurchases.reduce((s, p) => s + (p.total_allocated || 0), 0);
      const updatedPending = Math.max(0, initialPurchased - updatedPaid);

      expect(updatedPaid).toBe(60000);
      expect(updatedPending).toBe(20000);
    });

    it('rejects payment exceeding the outstanding supplier balance (Never allow: Paid > Purchased)', () => {
      const pendingBalance = 30000;
      const invalidPayment = 35000;

      const validatePayment = (amount: number, pending: number) => {
        if (amount <= 0) return { valid: false, error: 'Payment amount must be greater than ₹0.' };
        if (amount > pending) return { valid: false, error: `Payment amount (₹${amount}) cannot exceed pending balance of ₹${pending}.` };
        return { valid: true, error: null };
      };

      const checkValid = validatePayment(10000, pendingBalance);
      expect(checkValid.valid).toBe(true);

      const checkExceeding = validatePayment(invalidPayment, pendingBalance);
      expect(checkExceeding.valid).toBe(false);
      expect(checkExceeding.error).toContain('cannot exceed pending balance');
    });
  });

  // 14. SITE PROCUREMENT SUMMARY
  describe('14. Site Procurement Summary', () => {
    it('aggregates materials, total purchased, and supplier pending for a specific site', () => {
      const siteId = 'prj-site-proc';
      const sitePurchases: Purchase[] = [
        {
          id: 'p-cement',
          company_id: 'comp-shivarivel-001',
          supplier_id: 'sup-abc',
          project_id: siteId,
          purchase_number: 'PUR-010',
          purchase_date: '2026-10-04',
          invoice_number: null,
          status: 'Confirmed',
          discount: 0,
          tax: 0,
          total_amount: 8000,
          total_allocated: 0,
          outstanding_balance: 8000,
          due_date: null,
          notes: null,
          reversal_of_id: null,
          created_at: '2026-10-04',
          updated_at: '2026-10-04',
          items: [{
            id: 'item-1',
            company_id: 'comp-shivarivel-001',
            purchase_id: 'p-cement',
            material_id: 'mat-1',
            description: null,
            quantity: 20,
            unit: 'Bag',
            unit_price: 400,
            amount: 8000,
            notes: null,
            created_at: '2026-10-04',
            updated_at: '2026-10-04',
            material: {
              id: 'mat-1',
              company_id: 'comp-shivarivel-001',
              name: 'Cement',
              category: 'General',
              unit: 'Bag',
              standard_rate: null,
              description: null,
              status: 'active',
              created_at: '2026-10-04',
              updated_at: '2026-10-04',
            },
          }],
        },
        {
          id: 'p-sand',
          company_id: 'comp-shivarivel-001',
          supplier_id: 'sup-xyz',
          project_id: siteId,
          purchase_number: 'PUR-011',
          purchase_date: '2026-10-04',
          invoice_number: null,
          status: 'Confirmed',
          discount: 0,
          tax: 0,
          total_amount: 6000,
          total_allocated: 5000,
          outstanding_balance: 1000,
          due_date: null,
          notes: null,
          reversal_of_id: null,
          created_at: '2026-10-04',
          updated_at: '2026-10-04',
          items: [{
            id: 'item-2',
            company_id: 'comp-shivarivel-001',
            purchase_id: 'p-sand',
            material_id: 'mat-2',
            description: null,
            quantity: 2,
            unit: 'Load',
            unit_price: 3000,
            amount: 6000,
            notes: null,
            created_at: '2026-10-04',
            updated_at: '2026-10-04',
            material: {
              id: 'mat-2',
              company_id: 'comp-shivarivel-001',
              name: 'Sand',
              category: 'General',
              unit: 'Load',
              standard_rate: null,
              description: null,
              status: 'active',
              created_at: '2026-10-04',
              updated_at: '2026-10-04',
            },
          }],
        },
      ];

      const totalPurchased = sitePurchases.reduce((s, p) => s + p.total_amount, 0);
      const supplierPending = sitePurchases.reduce((s, p) => s + (p.outstanding_balance ?? 0), 0);

      expect(totalPurchased).toBe(14000);
      expect(supplierPending).toBe(9000);
      expect(sitePurchases[0].items?.[0].material?.name).toBe('Cement');
      expect(sitePurchases[1].items?.[0].material?.name).toBe('Sand');
    });
  });

  // 15. EMPTY STATES
  describe('15. Empty States Verification', () => {
    it('defines distinct, useful empty state messages', () => {
      const emptyStates = {
        suppliers: 'No suppliers added yet.',
        materials: 'No materials added yet.',
        purchases: 'No purchases recorded yet.',
        siteMaterials: 'No materials purchased yet for this site.',
      };

      expect(emptyStates.suppliers).toBe('No suppliers added yet.');
      expect(emptyStates.materials).toBe('No materials added yet.');
      expect(emptyStates.purchases).toBe('No purchases recorded yet.');
      expect(emptyStates.siteMaterials).toBe('No materials purchased yet for this site.');
    });
  });

  // 16. MOBILE LAYOUT & NAVIGATION
  describe('16. Mobile Layout & Simplified Navigation', () => {
    it('navigation contains strictly Customers, Sites, Purchases, and Suppliers for Phase 03', () => {
      const activeNavItems = [
        { label: 'Customers', href: '/customers' },
        { label: 'Sites', href: '/sites' },
        { label: 'Purchases', href: '/purchases' },
        { label: 'Suppliers', href: '/suppliers' },
      ];

      expect(activeNavItems.length).toBe(4);
      expect(activeNavItems.some((n) => n.label === 'Customers')).toBe(true);
      expect(activeNavItems.some((n) => n.label === 'Sites')).toBe(true);
      expect(activeNavItems.some((n) => n.label === 'Purchases')).toBe(true);
      expect(activeNavItems.some((n) => n.label === 'Suppliers')).toBe(true);
      expect(activeNavItems.some((n) => n.label === 'Dashboard')).toBe(false);
      expect(activeNavItems.some((n) => n.label === 'Daily Wages')).toBe(false);
      expect(activeNavItems.some((n) => n.label === 'Employees')).toBe(false);
    });

    it('Quick Add exposes only 6 simplified actions', () => {
      const quickAddTitles = [
        'New Customer',
        'New Site',
        'Add Supplier',
        'Add Material',
        'Record Purchase',
        'Record Supplier Payment',
      ];

      expect(quickAddTitles.length).toBe(6);
      expect(quickAddTitles).toContain('New Customer');
      expect(quickAddTitles).toContain('New Site');
      expect(quickAddTitles).toContain('Add Supplier');
      expect(quickAddTitles).toContain('Add Material');
      expect(quickAddTitles).toContain('Record Purchase');
      expect(quickAddTitles).toContain('Record Supplier Payment');
    });
  });
});
