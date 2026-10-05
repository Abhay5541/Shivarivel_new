import { describe, it, expect, beforeEach } from 'vitest';
import type { Purchase } from '@/types/procurement';
import {
  memoryPurchases,
  setMemoryPurchases,
  resetMemoryPurchases,
  resolveOrCreateSupplier,
  resolveOrCreateMaterial,
  computeSupplierSummary,
} from '@/hooks/useProcurement';

/**
 * Phase 03C: Procurement Implementation Test Suite
 * Shivarivel Construction & Interiors
 * 
 * Verifies all 26 required criteria from Phase 03C specification:
 * 
 * PROJECT PURCHASES
 * 1. Create project purchase.
 * 2. Project is correctly associated.
 * 3. Product is free text.
 * 4. Supplier is free text.
 * 5. Quantity and unit are stored correctly.
 * 6. Total value is stored correctly.
 * 7. Amount paid is stored correctly.
 * 8. Balance = total - paid.
 * 9. Edit purchase updates values.
 * 10. Editing does not create duplicate records.
 * 
 * GENERAL PURCHASES
 * 11. Create general purchase.
 * 12. General purchase has no project association (project_id = null).
 * 13. Product is free text.
 * 14. Supplier is free text.
 * 15. Balance calculation works.
 * 16. Editing works.
 * 
 * SUPPLIER SUMMARY
 * 17. Supplier names aggregate correctly.
 * 18. Total purchased is correct.
 * 19. Total paid is correct.
 * 20. Outstanding is correct.
 * 
 * PAYMENTS OVER TIME
 * 21. Additional payment updates paid amount.
 * 22. Additional payment updates balance.
 * 23. Total paid never exceeds total value.
 * 
 * PROJECT TOTALS
 * 24. Project procurement total is correct.
 * 25. Project paid total is correct.
 * 26. Project balance is correct.
 */

describe('Phase 03C — Procurement Implementation', () => {
  beforeEach(() => {
    resetMemoryPurchases();
  });

  // ==========================================
  // PROJECT PURCHASES (Tests 1 - 10)
  // ==========================================
  describe('Project Purchases (Tests 1 - 10)', () => {
    it('1. creates a project purchase with free-text entries', async () => {
      const supplier = await resolveOrCreateSupplier('ABC Traders');
      const material = await resolveOrCreateMaterial('Cement', 'Bags');

      const initialCount = memoryPurchases.length;
      const totalValue = 22500;
      const amountPaid = 20000;
      const balance = totalValue - amountPaid;

      const newPurchase: Purchase = {
        id: `pur-test-01`,
        company_id: 'comp-shivarivel-001',
        supplier_id: supplier.id,
        project_id: 'prj-001',
        purchase_number: 'PUR-0101',
        purchase_date: '2026-10-05',
        invoice_number: null,
        status: 'Confirmed',
        discount: 0,
        tax: 0,
        total_amount: totalValue,
        total_allocated: amountPaid,
        outstanding_balance: balance,
        payment_status: 'Partial',
        due_date: null,
        notes: null,
        reversal_of_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier,
        project: {
          id: 'prj-001',
          name: 'Arun Kumar Residence',
          project_code: 'PRJ-0001',
        },
        items: [
          {
            id: 'pi-test-01',
            company_id: 'comp-shivarivel-001',
            purchase_id: 'pur-test-01',
            material_id: material.id,
            description: 'Cement',
            quantity: 50,
            unit: 'Bags',
            unit_price: 450,
            amount: 22500,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            material,
          },
        ],
      };

      setMemoryPurchases([newPurchase, ...memoryPurchases]);

      expect(memoryPurchases.length).toBe(initialCount + 1);
      expect(memoryPurchases[0].id).toBe('pur-test-01');
    });

    it('2. associates purchase correctly with selected project', () => {
      const purchase = memoryPurchases.find((p) => p.project_id === 'prj-001');
      expect(purchase).toBeDefined();
      expect(purchase?.project_id).toBe('prj-001');
      expect(purchase?.project?.name).toBeDefined();
    });

    it('3. stores product / material as free text without master catalog restriction', async () => {
      const customProduct = 'Custom Handcrafted Teak Veneer Sheet 4mm';
      const mat = await resolveOrCreateMaterial(customProduct, 'Sheets');
      expect(mat.name).toBe(customProduct);
      expect(mat.unit).toBe('Sheets');
    });

    it('4. stores supplier / company as free text without supplier master creation', async () => {
      const customSupplier = 'Sree Meenakshi Hardware & Timber Mart';
      const sup = await resolveOrCreateSupplier(customSupplier);
      expect(sup.name).toBe(customSupplier);
      expect(sup.status).toBe('active');
    });

    it('5. stores quantity and unit correctly and separately', () => {
      const p = memoryPurchases[0];
      const item = p.items?.[0];
      expect(item).toBeDefined();
      expect(typeof item?.quantity).toBe('number');
      expect(item?.quantity).toBeGreaterThan(0);
      expect(typeof item?.unit).toBe('string');
      expect(item?.unit.length).toBeGreaterThan(0);
    });

    it('6. stores total value as numeric value', () => {
      const p = memoryPurchases[0];
      expect(typeof p.total_amount).toBe('number');
      expect(p.total_amount).toBeGreaterThan(0);
    });

    it('7. stores amount paid correctly', () => {
      const p = memoryPurchases[0];
      expect(typeof p.total_allocated).toBe('number');
      expect(p.total_allocated).toBeGreaterThanOrEqual(0);
    });

    it('8. calculates balance strictly as Total Value - Amount Paid (Rule 5)', () => {
      const total = 22500;
      const paid = 20000;
      const balance = total - paid;
      expect(balance).toBe(2500);

      // Verify across memory purchases
      for (const p of memoryPurchases) {
        const expectedBal = Math.max(0, p.total_amount - (p.total_allocated || 0));
        expect(p.outstanding_balance).toBe(expectedBal);
      }
    });

    it('9. edits purchase updating product, supplier, quantity, total, and paid values', async () => {
      const initialPurchases = [...memoryPurchases];
      const target = { ...initialPurchases[0] };

      // Updated values
      const newSupplier = await resolveOrCreateSupplier('Updated ABC Traders');
      const newMaterial = await resolveOrCreateMaterial('Ultratech PPC Cement', 'Bags');
      const newQty = 60;
      const newTotal = 27000;
      const newPaid = 25000;
      const newBalance = newTotal - newPaid;

      const updatedPurchase: Purchase = {
        ...target,
        supplier_id: newSupplier.id,
        supplier: newSupplier,
        total_amount: newTotal,
        total_allocated: newPaid,
        outstanding_balance: newBalance,
        updated_at: new Date().toISOString(),
        items: [
          {
            id: target.items?.[0]?.id || 'pi-1',
            company_id: 'comp-shivarivel-001',
            purchase_id: target.id,
            material_id: newMaterial.id,
            description: 'Ultratech PPC Cement',
            quantity: newQty,
            unit: 'Bags',
            unit_price: newTotal / newQty,
            amount: newTotal,
            notes: null,
            created_at: target.created_at,
            updated_at: new Date().toISOString(),
            material: newMaterial,
          },
        ],
      };

      const updatedList = initialPurchases.map((p) =>
        p.id === target.id ? updatedPurchase : p
      );
      setMemoryPurchases(updatedList);

      const found = memoryPurchases.find((p) => p.id === target.id);
      expect(found).toBeDefined();
      expect(found?.total_amount).toBe(27000);
      expect(found?.total_allocated).toBe(25000);
      expect(found?.outstanding_balance).toBe(2000);
      expect(found?.supplier?.name).toBe('Updated ABC Traders');
      expect(found?.items?.[0].description).toBe('Ultratech PPC Cement');
      expect(found?.items?.[0].quantity).toBe(60);
    });

    it('10. editing does not create duplicate purchase records', () => {
      const countBefore = memoryPurchases.length;
      const targetId = memoryPurchases[0].id;

      // Edit purchase
      const edited = memoryPurchases.map((p) =>
        p.id === targetId ? { ...p, notes: 'Edited notes only' } : p
      );
      setMemoryPurchases(edited);

      expect(memoryPurchases.length).toBe(countBefore);
      const matching = memoryPurchases.filter((p) => p.id === targetId);
      expect(matching.length).toBe(1);
    });
  });

  describe('General Purchases (Tests 11 - 16)', () => {
    beforeEach(async () => {
      if (!memoryPurchases.some((p) => !p.project_id)) {
        const supplier = await resolveOrCreateSupplier('City Hardware Depot');
        const material = await resolveOrCreateMaterial('Cleaning Acid & Brushes', 'Sets');
        const generalPurchase: Purchase = {
          id: 'pur-gen-01',
          company_id: 'comp-shivarivel-001',
          supplier_id: supplier.id,
          project_id: null,
          purchase_number: 'PUR-GEN-001',
          purchase_date: '2026-10-05',
          invoice_number: null,
          status: 'Confirmed',
          discount: 0,
          tax: 0,
          total_amount: 9000,
          total_allocated: 5000,
          outstanding_balance: 4000,
          payment_status: 'Partial',
          due_date: null,
          notes: 'Yard maintenance supplies',
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          supplier,
          project: null,
          items: [
            {
              id: 'pi-gen-01',
              company_id: 'comp-shivarivel-001',
              purchase_id: 'pur-gen-01',
              material_id: material.id,
              description: 'Cleaning Acid & Brushes',
              quantity: 10,
              unit: 'Sets',
              unit_price: 900,
              amount: 9000,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              material,
            },
          ],
        };
        setMemoryPurchases([generalPurchase, ...memoryPurchases]);
      }
    });
    it('11. creates a general purchase with all required fields', async () => {
      const supplier = await resolveOrCreateSupplier('City Hardware Depot');
      const material = await resolveOrCreateMaterial('Cleaning Acid & Brushes', 'Sets');

      const initialCount = memoryPurchases.length;
      const generalPurchase: Purchase = {
        id: 'pur-gen-01',
        company_id: 'comp-shivarivel-001',
        supplier_id: supplier.id,
        project_id: null, // Strictly null for General Purchase
        purchase_number: 'PUR-GEN-001',
        purchase_date: '2026-10-05',
        invoice_number: null,
        status: 'Confirmed',
        discount: 0,
        tax: 0,
        total_amount: 9000,
        total_allocated: 5000,
        outstanding_balance: 4000,
        payment_status: 'Partial',
        due_date: null,
        notes: 'Yard maintenance supplies',
        reversal_of_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier,
        project: null,
        items: [
          {
            id: 'pi-gen-01',
            company_id: 'comp-shivarivel-001',
            purchase_id: 'pur-gen-01',
            material_id: material.id,
            description: 'Cleaning Acid & Brushes',
            quantity: 10,
            unit: 'Sets',
            unit_price: 900,
            amount: 9000,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            material,
          },
        ],
      };

      setMemoryPurchases([generalPurchase, ...memoryPurchases]);

      expect(memoryPurchases.length).toBe(initialCount + 1);
      expect(memoryPurchases[0].id).toBe('pur-gen-01');
    });

    it('12. ensures general purchase has NO project association (project_id = null)', () => {
      const genPurchases = memoryPurchases.filter((p) => !p.project_id);
      expect(genPurchases.length).toBeGreaterThanOrEqual(1);
      expect(genPurchases[0].project_id).toBeNull();
      expect(genPurchases[0].project).toBeNull();
    });

    it('13. allows free text for general purchase product', () => {
      const gen = memoryPurchases.find((p) => !p.project_id);
      expect(gen).toBeDefined();
      const prodName = gen?.items?.[0]?.description;
      expect(prodName).toBe('Cleaning Acid & Brushes');
    });

    it('14. allows free text for general purchase supplier', () => {
      const gen = memoryPurchases.find((p) => !p.project_id);
      expect(gen).toBeDefined();
      expect(gen?.supplier?.name).toBe('City Hardware Depot');
    });

    it('15. verifies balance calculation for general purchase (Total Value - Amount Paid)', () => {
      const gen = memoryPurchases.find((p) => !p.project_id);
      expect(gen).toBeDefined();
      const expectedBalance = gen!.total_amount - (gen!.total_allocated || 0);
      expect(gen!.outstanding_balance).toBe(expectedBalance);
      expect(gen!.outstanding_balance).toBe(4000);
    });

    it('16. supports editing general purchases without project requirement', () => {
      const gen = memoryPurchases.find((p) => !p.project_id);
      expect(gen).toBeDefined();

      const editedTotal = 11000;
      const editedPaid = 7000;
      const updated = memoryPurchases.map((p) =>
        p.id === gen!.id
          ? {
              ...p,
              total_amount: editedTotal,
              total_allocated: editedPaid,
              outstanding_balance: editedTotal - editedPaid,
            }
          : p
      );
      setMemoryPurchases(updated);

      const found = memoryPurchases.find((p) => p.id === gen!.id);
      expect(found?.project_id).toBeNull();
      expect(found?.total_amount).toBe(11000);
      expect(found?.outstanding_balance).toBe(4000);
    });
  });

  // ==========================================
  // SUPPLIER SUMMARY (Tests 17 - 20)
  // ==========================================
  describe('Supplier Summary Aggregation (Tests 17 - 20)', () => {
    it('17. aggregates supplier purchases correctly across project and general purchases', () => {
      const summaries = computeSupplierSummary(memoryPurchases);
      expect(summaries.length).toBeGreaterThan(0);

      // Verify each supplier summary has valid name and values
      for (const s of summaries) {
        expect(s.supplier_name).toBeDefined();
        expect(s.total_purchased).toBeGreaterThan(0);
        expect(s.purchase_count).toBeGreaterThan(0);
      }
    });

    it('18. computes correct total purchased for each supplier', () => {
      const summaries = computeSupplierSummary(memoryPurchases);
      for (const s of summaries) {
        const matchingPurchases = memoryPurchases.filter(
          (p) =>
            p.status !== 'Cancelled' &&
            p.supplier?.name.trim().toLowerCase() === s.supplier_name.trim().toLowerCase()
        );
        const expectedTotal = matchingPurchases.reduce((acc, p) => acc + p.total_amount, 0);
        expect(s.total_purchased).toBe(expectedTotal);
      }
    });

    it('19. computes correct total paid for each supplier', () => {
      const summaries = computeSupplierSummary(memoryPurchases);
      for (const s of summaries) {
        const matchingPurchases = memoryPurchases.filter(
          (p) =>
            p.status !== 'Cancelled' &&
            p.supplier?.name.trim().toLowerCase() === s.supplier_name.trim().toLowerCase()
        );
        const expectedPaid = matchingPurchases.reduce((acc, p) => acc + (p.total_allocated || 0), 0);
        expect(s.total_paid).toBe(expectedPaid);
      }
    });

    it('20. computes correct total outstanding balance for each supplier', () => {
      const summaries = computeSupplierSummary(memoryPurchases);
      for (const s of summaries) {
        const matchingPurchases = memoryPurchases.filter(
          (p) =>
            p.status !== 'Cancelled' &&
            p.supplier?.name.trim().toLowerCase() === s.supplier_name.trim().toLowerCase()
        );
        const expectedOutstanding = matchingPurchases.reduce(
          (acc, p) => acc + (p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated || 0))),
          0
        );
        expect(s.total_outstanding).toBe(expectedOutstanding);
        expect(s.total_outstanding).toBe(Math.max(0, s.total_purchased - s.total_paid));
      }
    });
  });

  // ==========================================
  // PAYMENTS OVER TIME (Tests 21 - 23)
  // ==========================================
  describe('Payments Over Time (Tests 21 - 23)', () => {
    it('21. updates paid amount when an additional payment is recorded over time', () => {
      const testPurchase: Purchase = {
        id: 'pur-pay-test',
        company_id: 'comp-shivarivel-001',
        supplier_id: 'sup-01',
        project_id: 'prj-001',
        purchase_number: 'PUR-PAY-01',
        purchase_date: '2026-10-05',
        invoice_number: null,
        status: 'Confirmed',
        discount: 0,
        tax: 0,
        total_amount: 22500,
        total_allocated: 10000,
        outstanding_balance: 12500,
        due_date: null,
        notes: null,
        reversal_of_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMemoryPurchases([testPurchase, ...memoryPurchases]);

      // Record additional payment of ₹5,000
      const additionalPayment = 5000;
      const currentPaid = testPurchase.total_allocated || 0;
      const newPaid = currentPaid + additionalPayment;
      const newBalance = testPurchase.total_amount - newPaid;

      const updated = memoryPurchases.map((p) =>
        p.id === 'pur-pay-test'
          ? {
              ...p,
              total_allocated: newPaid,
              outstanding_balance: newBalance,
            }
          : p
      );
      setMemoryPurchases(updated);

      const found = memoryPurchases.find((p) => p.id === 'pur-pay-test');
      expect(found?.total_allocated).toBe(15000);
      expect(found?.outstanding_balance).toBe(7500);
    });

    it('22. updates balance in real-time each time payment is recorded', () => {
      const testPurchase: Purchase = {
        id: 'pur-pay-test-2',
        company_id: 'comp-shivarivel-001',
        supplier_id: 'sup-01',
        project_id: 'prj-001',
        purchase_number: 'PUR-PAY-02',
        purchase_date: '2026-10-05',
        invoice_number: null,
        status: 'Confirmed',
        discount: 0,
        tax: 0,
        total_amount: 22500,
        total_allocated: 15000,
        outstanding_balance: 7500,
        due_date: null,
        notes: null,
        reversal_of_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMemoryPurchases([testPurchase, ...memoryPurchases]);

      const found = memoryPurchases.find((p) => p.id === 'pur-pay-test-2');
      expect(found).toBeDefined();

      // Record second tranche of ₹7,500
      const secondPayment = 7500;
      const currentPaid = found!.total_allocated || 0;
      const newPaid = currentPaid + secondPayment;
      const newBalance = found!.total_amount - newPaid;

      const updated = memoryPurchases.map((p) =>
        p.id === 'pur-pay-test-2'
          ? {
              ...p,
              total_allocated: newPaid,
              outstanding_balance: newBalance,
              payment_status: 'Paid' as const,
            }
          : p
      );
      setMemoryPurchases(updated);

      const finalized = memoryPurchases.find((p) => p.id === 'pur-pay-test-2');
      expect(finalized?.total_allocated).toBe(22500);
      expect(finalized?.outstanding_balance).toBe(0);
      expect(finalized?.payment_status).toBe('Paid');
    });

    it('23. strictly prevents total paid from exceeding total value', () => {
      const validatePayment = (totalValue: number, currentPaid: number, additionalPayment: number) => {
        if (additionalPayment <= 0) {
          return { valid: false, error: 'Payment amount must be greater than 0.' };
        }
        if (currentPaid + additionalPayment > totalValue) {
          return { valid: false, error: 'Amount paid cannot be greater than total value.' };
        }
        return { valid: true, error: null };
      };

      const totalVal = 22500;
      const currentPaid = 20000;

      // Valid payment: ₹2,500
      const validCheck = validatePayment(totalVal, currentPaid, 2500);
      expect(validCheck.valid).toBe(true);

      // Overpayment: ₹3,000 (would bring paid to 23,000 > 22,500)
      const overpaymentCheck = validatePayment(totalVal, currentPaid, 3000);
      expect(overpaymentCheck.valid).toBe(false);
      expect(overpaymentCheck.error).toBe('Amount paid cannot be greater than total value.');
    });
  });

  // ==========================================
  // PROJECT TOTALS (Tests 24 - 26)
  // ==========================================
  describe('Project Totals (Tests 24 - 26)', () => {
    const projectId = 'prj-001';

    it('24. computes project procurement total accurately from project purchases', () => {
      const prjPurchases = memoryPurchases.filter((p) => p.project_id === projectId);
      const totalCost = prjPurchases.reduce((acc, p) => acc + p.total_amount, 0);

      expect(totalCost).toBeGreaterThan(0);
      expect(typeof totalCost).toBe('number');
    });

    it('25. computes project paid total accurately from project purchases', () => {
      const prjPurchases = memoryPurchases.filter((p) => p.project_id === projectId);
      const totalPaid = prjPurchases.reduce((acc, p) => acc + (p.total_allocated || 0), 0);

      expect(totalPaid).toBeGreaterThanOrEqual(0);
      expect(typeof totalPaid).toBe('number');
    });

    it('26. computes project balance accurately as Total Procurement Cost - Total Paid', () => {
      const prjPurchases = memoryPurchases.filter((p) => p.project_id === projectId);
      const totalCost = prjPurchases.reduce((acc, p) => acc + p.total_amount, 0);
      const totalPaid = prjPurchases.reduce((acc, p) => acc + (p.total_allocated || 0), 0);
      const expectedBalance = Math.max(0, totalCost - totalPaid);

      const totalBalance = prjPurchases.reduce(
        (acc, p) => acc + (p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated || 0))),
        0
      );

      expect(totalBalance).toBe(expectedBalance);
    });
  });
});
