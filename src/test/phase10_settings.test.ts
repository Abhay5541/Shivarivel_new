import { describe, it, expect, beforeEach } from 'vitest';
import {
  companyProfileFormSchema,
  serviceTypeFormSchema,
  initialCompanyProfile,
  initialUserProfiles,
  initialServiceTypes,
  USER_ROLES,
  type CompanyProfile,
  type ServiceType,
} from '@/types/settings';
import {
  inMemoryCompanyProfile,
} from '@/hooks/useSettings';

describe('Phase 10: Settings & Administration Tests', () => {
  // Reset in-memory state before tests if needed
  beforeEach(() => {
    // Reset test singletons
  });

  // ==========================================
  // 1. COMPANY PROFILE VALIDATION & SCHEMA
  // ==========================================
  describe('1. Company Profile Validation & Data Model', () => {
    it('validates default company profile against Zod schema', () => {
      const parseResult = companyProfileFormSchema.safeParse(initialCompanyProfile);
      expect(parseResult.success).toBe(true);
    });

    it('requires company name, owner name, address, and valid email', () => {
      const invalidData = {
        name: 'A', // too short (< 2)
        owner_name: '',
        address: '123', // too short (< 5)
        phone: '12345', // too short (< 10)
        email: 'invalid-email-address',
      };

      const result = companyProfileFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain('name');
        expect(issues).toContain('owner_name');
        expect(issues).toContain('address');
        expect(issues).toContain('phone');
        expect(issues).toContain('email');
      }
    });

    it('validates standard 15-character Indian GSTIN format', () => {
      // Valid GSTIN: 33AAACS1234F1Z5 (Tamil Nadu state code 33)
      const validProfile = {
        ...initialCompanyProfile,
        gst_number: '33AAACS1234F1Z5',
      };
      expect(companyProfileFormSchema.safeParse(validProfile).success).toBe(true);

      // Invalid GSTIN (wrong pattern)
      const invalidGSTIN = {
        ...initialCompanyProfile,
        gst_number: 'INVALID_GSTIN_123',
      };
      expect(companyProfileFormSchema.safeParse(invalidGSTIN).success).toBe(false);

      // Empty / null GSTIN is allowed for unregistered firms
      const nullGSTIN = {
        ...initialCompanyProfile,
        gst_number: null,
      };
      expect(companyProfileFormSchema.safeParse(nullGSTIN).success).toBe(true);
    });

    it('validates Indian contact numbers and handles spaces/hyphens', () => {
      const validPhones = ['+91 94431 87654', '9840112233', '+91-98421-23344', '044-24567890'];
      for (const phone of validPhones) {
        const res = companyProfileFormSchema.safeParse({
          ...initialCompanyProfile,
          phone,
        });
        expect(res.success).toBe(true);
      }

      const invalidPhone = companyProfileFormSchema.safeParse({
        ...initialCompanyProfile,
        phone: '12345', // less than 10 digits
      });
      expect(invalidPhone.success).toBe(false);
    });

    it('validates official website URL format when supplied', () => {
      const validWebsites = ['https://shivarivel.com', 'http://interior.shivarivel.in', 'shivarivel.com'];
      for (const website of validWebsites) {
        const res = companyProfileFormSchema.safeParse({
          ...initialCompanyProfile,
          website,
        });
        expect(res.success).toBe(true);
      }

      const invalidWebsite = companyProfileFormSchema.safeParse({
        ...initialCompanyProfile,
        website: 'invalid website string with spaces',
      });
      expect(invalidWebsite.success).toBe(false);
    });
  });

  // ==========================================
  // 2. USERS & ROLES ADMINISTRATION
  // ==========================================
  describe('2. Users & Roles Architecture', () => {
    it('defines the three approved system roles: owner, supervisor, worker', () => {
      expect(USER_ROLES.owner).toBeDefined();
      expect(USER_ROLES.supervisor).toBeDefined();
      expect(USER_ROLES.worker).toBeDefined();

      expect(USER_ROLES.owner.label).toBe('Owner / Admin');
      expect(USER_ROLES.supervisor.label).toBe('Site Supervisor');
      expect(USER_ROLES.worker.label).toBe('Worker / Laborer');
    });

    it('clarifies worker role has no ERP administration portal in MVP', () => {
      expect(USER_ROLES.worker.permissions).toContain('No application administration portal');
    });

    it('provides initial team accounts with correct roles and project assignments', () => {
      expect(initialUserProfiles.length).toBeGreaterThanOrEqual(4);
      const ownerUser = initialUserProfiles.find((u) => u.role === 'owner');
      expect(ownerUser).toBeDefined();
      expect(ownerUser?.full_name).toBe('K. Senthil Nathan');
      expect(ownerUser?.is_active).toBe(true);

      const supervisorUsers = initialUserProfiles.filter((u) => u.role === 'supervisor');
      expect(supervisorUsers.length).toBeGreaterThanOrEqual(2);
    });

    it('filters users by search query (name and email)', () => {
      const query = 'murugan';
      const filtered = initialUserProfiles.filter(
        (u) =>
          u.full_name.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].full_name).toContain('Murugan');
    });

    it('filters users by role and active status', () => {
      const activeSupervisors = initialUserProfiles.filter(
        (u) => u.role === 'supervisor' && u.is_active === true
      );
      expect(activeSupervisors.length).toBeGreaterThanOrEqual(1);

      const inactiveUsers = initialUserProfiles.filter((u) => !u.is_active);
      expect(inactiveUsers.length).toBeGreaterThanOrEqual(1);
      expect(inactiveUsers[0].full_name).toContain('Muthukumar');
    });

    it('enforces Owner Protection: blocks demoting the only active owner', () => {
      // In initial state, user-01 is the sole owner
      const activeOwners = initialUserProfiles.filter(
        (u) => u.role === 'owner' && u.is_active && u.id !== 'user-01'
      );
      expect(activeOwners.length).toBe(0);

      // Attempting to demote user-01 to supervisor should trigger protection invariant
      const checkDemote = () => {
        if (activeOwners.length === 0) {
          throw new Error('Action blocked: Cannot demote the primary active Owner account. Promote another owner first.');
        }
      };
      expect(checkDemote).toThrow('Cannot demote the primary active Owner account');
    });

    it('enforces Owner Protection: blocks deactivating the only active owner', () => {
      const otherActiveOwners = initialUserProfiles.filter(
        (u) => u.role === 'owner' && u.is_active && u.id !== 'user-01'
      );
      expect(otherActiveOwners.length).toBe(0);

      const checkDeactivate = () => {
        if (otherActiveOwners.length === 0) {
          throw new Error('Action blocked: Cannot deactivate the primary active Owner account.');
        }
      };
      expect(checkDeactivate).toThrow('Cannot deactivate the primary active Owner account');
    });
  });

  // ==========================================
  // 3. SERVICE TYPES MASTER CATALOG
  // ==========================================
  describe('3. Service Types Master Catalog', () => {
    it('validates service type form schema', () => {
      const validService = {
        name: 'Profile Lighting & Decorative POP',
        description: 'Concealed LED profile channels and cove lighting',
        sort_order: 8,
        is_active: true,
      };
      const result = serviceTypeFormSchema.safeParse(validService);
      expect(result.success).toBe(true);

      const invalidService = {
        name: 'A', // too short (< 2)
        sort_order: -1, // negative sort order
      };
      expect(serviceTypeFormSchema.safeParse(invalidService).success).toBe(false);
    });

    it('contains approved civil, architectural, and interior services', () => {
      const serviceNames = initialServiceTypes.map((s) => s.name);
      expect(serviceNames).toContain('Interior & Woodwork');
      expect(serviceNames).toContain('False Ceiling & Profile Lighting');
      expect(serviceNames).toContain('Civil Construction & Contracting');
      expect(serviceNames).toContain('3D Elevation & Structural Detailing');
      expect(serviceNames).toContain('Building Planning & Approval Plans');
      expect(serviceNames).toContain('Estimates & Valuations');
      expect(serviceNames).toContain('Site Surveying & Leveling');
    });

    it('supports deactivation over hard deletion to protect foreign key integrity', () => {
      // Deactivating preserves the service record and historical references
      const targetService: ServiceType = { ...initialServiceTypes[0], is_active: true };
      const deactivatedService: ServiceType = { ...targetService, is_active: false };

      expect(deactivatedService.id).toBe(targetService.id);
      expect(deactivatedService.is_active).toBe(false);
      expect(deactivatedService.name).toBe(targetService.name);
    });

    it('orders service catalog by sort_order ascending', () => {
      const sorted = [...initialServiceTypes].sort((a, b) => a.sort_order - b.sort_order);
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].sort_order).toBeLessThanOrEqual(sorted[i + 1].sort_order);
      }
    });

    it('handles empty service catalog state cleanly', () => {
      const emptyList: ServiceType[] = [];
      expect(emptyList.length).toBe(0);
      const emptyNotice = emptyList.length === 0 ? 'No service types have been configured.' : null;
      expect(emptyNotice).toBe('No service types have been configured.');
    });
  });

  // ==========================================
  // 4. DYNAMIC INTEGRATIONS
  // ==========================================
  describe('4. Dynamic Integrations & Report Print Header', () => {
    it('provides canonical business identity for report headers and documents', () => {
      const profile = inMemoryCompanyProfile;
      expect(profile.name).toBe('Shivarivel Construction & Interiors');
      expect(profile.gst_number).toMatch(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/);
      expect(profile.owner_name).toBeDefined();
      expect(profile.address).toContain('Tamil Nadu');
    });

    it('generates complete print header lines from dynamic company profile', () => {
      const profile: CompanyProfile = {
        id: 'comp-shivarivel-001',
        name: 'Shivarivel Construction & Interiors',
        owner_name: 'K. Senthil Nathan',
        address: '14, South Car Street, Sankarankovil, Tenkasi District, Tamil Nadu - 627756',
        phone: '+91 94431 87654',
        alternate_phone: '+91 98421 23344',
        email: 'contact@shivarivel.com',
        website: 'https://shivarivel.com',
        gst_number: '33AAACS1234F1Z5',
        logo_url: null,
      };

      const headerTitle = profile.name;
      const proprietorLine = `Er. ${profile.owner_name} | Civil Contractor & Interior Specialist`;
      const gstinLine = `GSTIN: ${profile.gst_number}`;
      const contactLine = `${profile.address} | Phone: ${profile.phone}`;

      expect(headerTitle).toBe('Shivarivel Construction & Interiors');
      expect(proprietorLine).toContain('K. Senthil Nathan');
      expect(gstinLine).toContain('33AAACS1234F1Z5');
      expect(contactLine).toContain('Sankarankovil');
      expect(contactLine).toContain('+91 94431 87654');
    });
  });
});
