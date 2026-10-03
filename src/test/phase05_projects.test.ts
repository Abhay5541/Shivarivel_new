import { describe, it, expect } from 'vitest';
import {
  projectFormSchema,
  PROJECT_STATUSES,
  PROJECT_DOCUMENT_CATEGORIES,
} from '@/types/projects';
import {
  devEvalProjects,
  devEvalWorkProgress,
  devEvalFinancials,
  devEvalDocuments,
} from '@/hooks/useProjects';

describe('Phase 05: Project Management Unit & Logic Tests', () => {
  // 1. Zod Validation Tests
  it('validates a correct project payload with Zod schema', () => {
    const validPayload = {
      name: 'Modern 3BHK Duplex Interior',
      customer_id: 'cust-01',
      enquiry_id: 'enq-01',
      estimate_id: 'est-01',
      assigned_to: 'usr-sup-001',
      site_address: 'Plot 42, Anna Nagar, Madurai',
      status: 'Active' as const,
      start_date: '2026-10-01',
      expected_end_date: '2026-12-31',
      contract_value: 650000,
      description: 'Turnkey interior execution',
      notes: 'Site work from 8 AM to 7 PM',
    };

    const result = projectFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects project without customer_id', () => {
    const invalid = {
      name: 'No Customer Project',
      customer_id: '',
      status: 'Active' as const,
    };

    const result = projectFormSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Customer is required');
    }
  });

  it('rejects project with empty name', () => {
    const invalid = {
      name: '   ',
      customer_id: 'cust-01',
      status: 'Active' as const,
    };

    const result = projectFormSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Project name is required');
    }
  });

  it('rejects project with negative contract value', () => {
    const invalid = {
      name: 'Negative Value Project',
      customer_id: 'cust-01',
      status: 'Active' as const,
      contract_value: -50000,
    };

    const result = projectFormSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Contract value must be positive');
    }
  });

  // 2. Status Lifecycle Constraints
  it('enforces approved lifecycle states only', () => {
    expect(PROJECT_STATUSES).toEqual([
      'Planned',
      'Planning',
      'Active',
      'On Hold',
      'Completed',
      'Cancelled',
    ]);
  });

  // 3. Financial Context Non-Netting Rule
  it('strictly verifies recorded project cost formula (Purchases + Wages + Expenses)', () => {
    for (const [, fin] of Object.entries(devEvalFinancials)) {
      const sum = fin.total_purchases + fin.total_wages + fin.total_expenses;
      expect(sum).toBe(fin.recorded_project_cost);
      expect(fin.contract_value).toBeGreaterThan(0);
      expect(fin.amount_received + fin.outstanding_amount).toBe(fin.contract_value);
    }
  });

  // 4. Document Categories
  it('supports the approved document categories without standalone documents module', () => {
    const expectedCategories = [
      'Building Plan',
      '3D Plan',
      '3D Elevation',
      'Approval Document',
      'Estimate',
      'Agreement',
      'Invoice',
      'Receipt',
      'Payment Proof',
      'Site Photo',
      'Other',
    ];

    expect(PROJECT_DOCUMENT_CATEGORIES).toEqual(expectedCategories);
  });

  // 5. Seed Evaluation Dataset Integrity
  it('evaluates devEval projects data integrity', () => {
    expect(devEvalProjects.length).toBeGreaterThanOrEqual(4);

    for (const proj of devEvalProjects) {
      expect(proj.project_code).toMatch(/^PRJ-\d{4}$/);
      expect(proj.name.length).toBeGreaterThan(0);
      expect(proj.customer_id).toBeTruthy();
      expect(proj.customer).toBeDefined();
      if (proj.contract_value !== null && proj.contract_value !== undefined) {
        expect(proj.contract_value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('evaluates devEval work progress milestones', () => {
    const wp = devEvalWorkProgress['prj-001'];
    expect(wp).toBeDefined();
    expect(wp.summary.total_work_items).toBe(wp.items.length);
    expect(wp.summary.overall_progress_percentage).toBeGreaterThanOrEqual(0);
    expect(wp.summary.overall_progress_percentage).toBeLessThanOrEqual(100);
  });

  it('evaluates devEval project documents', () => {
    const docs = devEvalDocuments['prj-001'];
    expect(docs).toBeDefined();
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      expect(PROJECT_DOCUMENT_CATEGORIES).toContain(doc.category);
    }
  });
});
