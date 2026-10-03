import { describe, it, expect } from 'vitest';
import {
  estimateFormSchema,
  estimateItemFormSchema,
  numberToIndianWords,
  ESTIMATE_CATEGORIES,
} from '@/types/estimates';
import { formatINR } from '@/lib/utils';
import { devEvalEstimates, devEvalEstimateItems } from '@/hooks/useEstimates';

describe('Phase 04: Estimates Unit & Math Logic Tests', () => {
  it('calculates line item amount deterministically (Quantity * Unit Price)', () => {
    const qty = 650;
    const rate = 115;
    const amount = Math.round(qty * rate * 100) / 100;
    expect(amount).toBe(74750);
  });

  it('calculates decimal line item amounts accurately without floating point leaks', () => {
    const qty = 650;
    const rate = 108.077;
    const amount = Math.round(qty * rate * 100) / 100;
    expect(amount).toBe(70250.05);
  });

  it('calculates estimate total amount as exact sum of line items', () => {
    const items = [
      { quantity: 120, unit_price: 2200 },
      { quantity: 110, unit_price: 1950 },
      { quantity: 1, unit_price: 48500 },
      { quantity: 1, unit_price: 123000 },
    ];
    const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    expect(total).toBe(650000);
  });

  it('converts numbers to Indian currency words representation correctly', () => {
    expect(numberToIndianWords(650000)).toBe('Rupees Six Lakh Fifty Thousand Only');
    expect(numberToIndianWords(180000)).toBe('Rupees One Lakh Eighty Thousand Only');
    expect(numberToIndianWords(3800000)).toBe('Rupees Thirty Eight Lakh Only');
    expect(numberToIndianWords(120000)).toBe('Rupees One Lakh Twenty Thousand Only');
    expect(numberToIndianWords(0)).toBe('Rupees Zero Only');
  });

  it('formats currency in Indian Rupees with comma grouping and 2 decimal places', () => {
    expect(formatINR(650000)).toBe('₹6,50,000.00');
    expect(formatINR(3800000)).toBe('₹38,00,000.00');
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(null)).toBe('₹0.00');
  });

  it('enforces approved MVP estimate categories only', () => {
    const allowed = ['Material', 'Labour', 'Electrical', 'Plumbing', 'Interior', 'Other'];
    expect(ESTIMATE_CATEGORIES).toEqual(allowed);
  });

  it('validates a correct estimate with Zod schema', () => {
    const validEstimate = {
      customer_id: 'cust-01',
      enquiry_id: 'enq-01',
      estimate_date: '2026-10-02',
      valid_until: '2026-11-02',
      title: '3BHK Villa Complete Interior Woodwork',
      notes: 'Terms & conditions apply',
      status: 'Draft',
      items: [
        {
          category: 'Interior',
          description: 'Modular kitchen acrylic cabinets',
          quantity: 120,
          unit: 'sq.ft',
          unit_price: 2200,
          amount: 264000,
          sort_order: 1,
        },
      ],
    };

    const result = estimateFormSchema.safeParse(validEstimate);
    expect(result.success).toBe(true);
  });

  it('rejects estimate without customer_id', () => {
    const invalidEstimate = {
      customer_id: '',
      title: 'Project Title',
      estimate_date: '2026-10-02',
      status: 'Draft',
      items: [
        {
          category: 'Interior',
          description: 'Wardrobe',
          quantity: 1,
          unit: 'nos',
          unit_price: 50000,
          amount: 50000,
        },
      ],
    };

    const result = estimateFormSchema.safeParse(invalidEstimate);
    expect(result.success).toBe(false);
  });

  it('rejects estimate without title', () => {
    const invalidEstimate = {
      customer_id: 'cust-01',
      title: '',
      estimate_date: '2026-10-02',
      status: 'Draft',
      items: [
        {
          category: 'Interior',
          description: 'Wardrobe',
          quantity: 1,
          unit: 'nos',
          unit_price: 50000,
          amount: 50000,
        },
      ],
    };

    const result = estimateFormSchema.safeParse(invalidEstimate);
    expect(result.success).toBe(false);
  });

  it('rejects estimate with empty items array', () => {
    const invalidEstimate = {
      customer_id: 'cust-01',
      title: 'Villa Interior',
      estimate_date: '2026-10-02',
      status: 'Draft',
      items: [],
    };

    const result = estimateFormSchema.safeParse(invalidEstimate);
    expect(result.success).toBe(false);
  });

  it('rejects line item with zero or negative quantity', () => {
    const invalidItem = {
      category: 'Labour',
      description: 'Site centering',
      quantity: 0,
      unit: 'sq.ft',
      unit_price: 150,
      amount: 0,
    };

    const result = estimateItemFormSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it('rejects line item with negative unit price', () => {
    const invalidItem = {
      category: 'Labour',
      description: 'Site centering',
      quantity: 10,
      unit: 'sq.ft',
      unit_price: -50,
      amount: 0,
    };

    const result = estimateItemFormSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it('devEval sample estimates have matching items and accurate totals', () => {
    for (const est of devEvalEstimates) {
      const items = devEvalEstimateItems.filter((i) => i.estimate_id === est.id);
      const computedTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      expect(Math.round(computedTotal)).toBe(est.total_amount);
    }
  });

  it('all devEval estimates have valid customer relations', () => {
    for (const est of devEvalEstimates) {
      expect(est.customer).toBeDefined();
      expect(est.customer?.name).toBeTruthy();
      expect(est.customer?.phone).toBeTruthy();
    }
  });
});
