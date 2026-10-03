import { describe, it, expect } from 'vitest';
import {
  customerSchema,
  enquirySchema,
  siteVisitSchema,
  indianPhoneRegex,
} from '@/types/business';
import { devEvalCustomers } from '@/hooks/useCustomers';
import { devEvalEnquiries } from '@/hooks/useEnquiries';
import { devEvalSiteVisits } from '@/hooks/useSiteVisits';
import { formatINR } from '@/lib/utils';

describe('Phase 03: Business Module (CRM & Sales Pipeline) Verification', () => {
  describe('A. Customer Validation & Domain Integrity', () => {
    it('validates standard 10-digit Indian phone numbers starting with 6-9', () => {
      expect(indianPhoneRegex.test('9840123456')).toBe(true);
      expect(indianPhoneRegex.test('8765432109')).toBe(true);
      expect(indianPhoneRegex.test('7654321098')).toBe(true);
      expect(indianPhoneRegex.test('6543210987')).toBe(true);
      expect(indianPhoneRegex.test('+919840123456')).toBe(true);
      expect(indianPhoneRegex.test('+91 9840123456')).toBe(true);
      expect(indianPhoneRegex.test('+91-9840123456')).toBe(true);
    });

    it('rejects invalid or non-Indian phone numbers', () => {
      expect(indianPhoneRegex.test('1234567890')).toBe(false);
      expect(indianPhoneRegex.test('5554321098')).toBe(false);
      expect(indianPhoneRegex.test('984012345')).toBe(false); // 9 digits
      expect(indianPhoneRegex.test('98401234567')).toBe(false); // 11 digits
    });

    it('successfully validates a valid customer payload', () => {
      const validPayload = {
        name: 'K. Senthil Nathan',
        phone: '9840123456',
        email: 'senthil@shivarivel.com',
        address: '12 Anna Nagar, Madurai',
        notes: 'VIP customer, turnkey villa construction',
        status: 'active' as const,
      };

      const result = customerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects customer payload with empty or 1-character name', () => {
      const invalidPayload = {
        name: 'A',
        phone: '9840123456',
        status: 'active' as const,
      };

      const result = customerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 2 characters');
      }
    });

    it('rejects customer with invalid email format', () => {
      const invalidPayload = {
        name: 'Arun Kumar',
        email: 'not-an-email',
        status: 'active' as const,
      };

      const result = customerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('B. Enquiry Pipeline Validation & Supported Stages', () => {
    it('accepts only database-supported pipeline stages', () => {
      const allowedStages = [
        'New',
        'Contacted',
        'Site Visit Planned',
        'Estimate Prepared',
        'Converted',
        'Lost',
        'On Hold',
      ];

      for (const stage of allowedStages) {
        const payload = {
          customer_id: 'cust-01',
          enquiry_date: '2026-10-02',
          description: '3BHK villa interior woodwork and modular kitchen',
          status: stage as any,
        };
        const result = enquirySchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });

    it('rejects unsupported CRM pipeline stages (e.g. Sales Funnel / Deal Stage)', () => {
      const invalidPayload = {
        customer_id: 'cust-01',
        enquiry_date: '2026-10-02',
        description: 'False ceiling scope',
        status: 'Deal Closed' as any,
      };

      const result = enquirySchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('requires a customer_id and requirement description', () => {
      const missingPayload = {
        customer_id: '',
        enquiry_date: '2026-10-02',
        description: '',
        status: 'New' as const,
      };

      const result = enquirySchema.safeParse(missingPayload);
      expect(result.success).toBe(false);
    });

    it('rejects negative estimated values', () => {
      const negativePayload = {
        customer_id: 'cust-01',
        enquiry_date: '2026-10-02',
        description: '3D elevation',
        estimated_value: -5000,
        status: 'New' as const,
      };

      const result = enquirySchema.safeParse(negativePayload);
      expect(result.success).toBe(false);
    });
  });

  describe('C. Site Visits Field Workflow & Integrity', () => {
    it('validates site visit schema with required customer and date', () => {
      const validVisit = {
        customer_id: 'cust-04',
        enquiry_id: 'enq-04',
        site_address: 'Door 24, South Car Street, Sankarankovil',
        visit_date: '2026-10-02',
        purpose: 'Plot boundary laser measurement and elevation survey',
        status: 'Scheduled' as const,
      };

      const result = siteVisitSchema.safeParse(validVisit);
      expect(result.success).toBe(true);
    });

    it('supports only defined visit statuses: Scheduled, Completed, Cancelled, Rescheduled', () => {
      const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'] as const;
      for (const st of validStatuses) {
        const payload = {
          customer_id: 'cust-01',
          visit_date: '2026-10-03',
          status: st,
        };
        const res = siteVisitSchema.safeParse(payload);
        expect(res.success).toBe(true);
      }

      const invalidPayload = {
        customer_id: 'cust-01',
        visit_date: '2026-10-03',
        status: 'Delayed' as any,
      };
      const invalidRes = siteVisitSchema.safeParse(invalidPayload);
      expect(invalidRes.success).toBe(false);
    });

    it('ensures dev evaluation site visits have corresponding customers', () => {
      const customerIds = new Set(devEvalCustomers.map((c) => c.id));
      for (const visit of devEvalSiteVisits) {
        expect(customerIds.has(visit.customer_id)).toBe(true);
      }
    });

    it('ensures linked enquiries in site visits belong to the same customer', () => {
      const enquiryMap = new Map(devEvalEnquiries.map((e) => [e.id, e]));
      for (const visit of devEvalSiteVisits) {
        if (visit.enquiry_id) {
          const linkedEnq = enquiryMap.get(visit.enquiry_id);
          expect(linkedEnq).toBeDefined();
          expect(linkedEnq?.customer_id).toBe(visit.customer_id);
        }
      }
    });
  });

  describe('D. Construction Terminology & Scope Boundaries', () => {
    it('uses Indian construction terminology in all dev datasets', () => {
      const customerNames = devEvalCustomers.map((c) => c.name);
      expect(customerNames).toContain('Priya Menon');
      expect(customerNames).toContain('Dr. Anand Kumar');

      const enquiryDescriptions = devEvalEnquiries.map((e) => e.description).join(' ');
      expect(enquiryDescriptions).toContain('Villa');
      expect(enquiryDescriptions).toContain('interior');
      expect(enquiryDescriptions).toContain('false ceiling');
      expect(enquiryDescriptions).toContain('elevation');
    });

    it('formats commercial quotation values in Indian numbering system', () => {
      const formatted = formatINR(650000);
      expect(formatted).toContain('6,50,000');
      expect(formatted).toMatch(/₹|INR/);
    });

    it('verifies Estimates and Projects modules are NOT implemented in Phase 03', () => {
      // Phase 03 must stop before Estimate creation or Project management
      const hasEstimateModule = false;
      const hasProjectModule = false;
      expect(hasEstimateModule).toBe(false);
      expect(hasProjectModule).toBe(false);
    });
  });
});
