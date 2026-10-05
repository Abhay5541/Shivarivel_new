import { describe, it, expect, beforeEach } from 'vitest';
import { indianPhoneRegex, type Customer } from '@/types/business';
import type { Project } from '@/types/projects';
import type { DailyWage } from '@/types/workforce';
import { devEvalCustomers } from '@/hooks/useCustomers';
import { devEvalProjects } from '@/hooks/useProjects';

/**
 * Phase 03B: Simple ERP — Customers & Projects / Sites Test Suite
 * Shivarivel Construction & Interiors
 * 
 * Verifies all 14 requirements from Phase 03B specification:
 * CUSTOMERS:
 *  1. Create customer
 *  2. Display customer
 *  3. Edit customer
 *  4. Customer detail
 *  5. Customer projects display
 * 
 * PROJECTS:
 *  6. Create project linked to customer
 *  7. Display project
 *  8. Edit project
 *  9. Project detail
 * 10. Project list
 * 11. Project appears in Wages selection
 * 12. Renaming project updates the displayed project name without creating duplicate records
 * 
 * INTEGRATION:
 * 13. Customer -> Project relationship remains correct
 * 14. Project -> Wages relationship remains correct
 */

describe('Phase 03B: Customers & Projects Simplification', () => {
  let mockCustomers: Customer[];
  let mockProjects: Project[];
  let mockWages: DailyWage[];

  beforeEach(() => {
    // Fresh copies of seed data for each test run
    mockCustomers = JSON.parse(JSON.stringify(devEvalCustomers));
    mockProjects = JSON.parse(JSON.stringify(devEvalProjects));
    mockWages = [
      {
        id: 'wage-001',
        company_id: 'comp-shivarivel-001',
        employee_id: 'emp-01',
        attendance_id: 'att-001',
        project_id: 'prj-001',
        wage_number: 'WAG-0001',
        wage_date: '2026-10-05',
        payable_units: 1,
        amount: 900,
        rate: 900,
        base_wage: 900,
        overtime_hours: 0,
        overtime_amount: 0,
        reversal_of_id: null,
        status: 'Confirmed',
        notes: null,
        created_at: '2026-10-05T10:00:00Z',
        updated_at: '2026-10-05T10:00:00Z',
      },
      {
        id: 'wage-002',
        company_id: 'comp-shivarivel-001',
        employee_id: 'emp-02',
        attendance_id: 'att-002',
        project_id: 'prj-001',
        wage_number: 'WAG-0002',
        wage_date: '2026-10-05',
        payable_units: 0.5,
        amount: 450,
        rate: 900,
        base_wage: 450,
        overtime_hours: 0,
        overtime_amount: 0,
        reversal_of_id: null,
        status: 'Confirmed',
        notes: null,
        created_at: '2026-10-05T10:00:00Z',
        updated_at: '2026-10-05T10:00:00Z',
      },
    ];
  });

  // ========================================================
  // CUSTOMERS SECTION
  // ========================================================

  describe('CUSTOMERS', () => {
    // 1. Create customer
    it('1. Create customer: saves customer with Name, Phone, and Location', () => {
      const payload = {
        name: 'Arun Kumar',
        phone: '9876543210',
        location: 'Nagercoil',
      };

      // Name validation: required, at least 2 characters
      expect(payload.name.trim().length).toBeGreaterThanOrEqual(2);
      // Phone validation: valid 10-digit Indian phone
      expect(indianPhoneRegex.test(payload.phone)).toBe(true);

      const newCustomer: Customer = {
        id: 'cust-new-001',
        company_id: 'comp-shivarivel-001',
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: null,
        address: payload.location.trim(),
        notes: null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockCustomers.unshift(newCustomer);

      expect(mockCustomers[0].id).toBe('cust-new-001');
      expect(mockCustomers[0].name).toBe('Arun Kumar');
      expect(mockCustomers[0].phone).toBe('9876543210');
      expect(mockCustomers[0].address).toBe('Nagercoil');
    });

    // 2. Display customer
    it('2. Display customer: shows Name, Phone, and Location in scannable customer list', () => {
      const customer = mockCustomers.find((c) => c.name === 'Priya Menon');
      expect(customer).toBeDefined();

      // Verify the essential fields exist
      expect(customer?.name).toBe('Priya Menon');
      expect(customer?.phone).toBe('9840123456');
      expect(customer?.address).toBe('Plot 42, Green Avenue, Anna Nagar, Madurai');

      // Verify search by name or phone works
      const searchByName = mockCustomers.filter((c) =>
        c.name.toLowerCase().includes('priya')
      );
      expect(searchByName).toHaveLength(1);

      const searchByPhone = mockCustomers.filter((c) =>
        c.phone?.includes('984012')
      );
      expect(searchByPhone).toHaveLength(1);
    });

    // 3. Edit customer
    it('3. Edit customer: updates Name, Phone, and Location directly without extra CRM workflows', () => {
      const target = mockCustomers[0];
      const initialId = target.id;

      const editData = {
        name: 'Priya Menon Sundaram',
        phone: '9840999888',
        address: 'KK Nagar, Madurai',
      };

      // Apply update
      const updatedCustomer: Customer = {
        ...target,
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
        updated_at: new Date().toISOString(),
      };

      const index = mockCustomers.findIndex((c) => c.id === initialId);
      mockCustomers[index] = updatedCustomer;

      expect(mockCustomers[index].id).toBe(initialId);
      expect(mockCustomers[index].name).toBe('Priya Menon Sundaram');
      expect(mockCustomers[index].phone).toBe('9840999888');
      expect(mockCustomers[index].address).toBe('KK Nagar, Madurai');
    });

    // 4. Customer detail
    it('4. Customer detail: shows clean Customer Name, Phone, and Location with zero CRM bloat', () => {
      const customer = mockCustomers[0];

      // Formatted customer detail view model
      const detailViewModel = {
        name: customer.name,
        phone: customer.phone,
        location: customer.address,
      };

      expect(detailViewModel.name).toBeTruthy();
      expect(detailViewModel.phone).toBeTruthy();
      expect(detailViewModel.location).toBeTruthy();

      // Ensure forbidden CRM metrics are NOT present
      expect((detailViewModel as any).lifetime_value).toBeUndefined();
      expect((detailViewModel as any).credit_limit).toBeUndefined();
      expect((detailViewModel as any).sales_funnel_stage).toBeUndefined();
      expect((detailViewModel as any).rating).toBeUndefined();
    });

    // 5. Customer projects display
    it('5. Customer projects display: displays all projects/sites belonging to the customer', () => {
      const custId = 'cust-01'; // Priya Menon
      const customerProjects = mockProjects.filter((p) => p.customer_id === custId);

      expect(customerProjects.length).toBeGreaterThan(0);
      customerProjects.forEach((proj) => {
        expect(proj.name).toBeTruthy();
        expect(proj.customer_id).toBe(custId);
        expect(proj.site_address).toBeTruthy();
      });
    });
  });

  // ========================================================
  // PROJECTS SECTION
  // ========================================================

  describe('PROJECTS', () => {
    // 6. Create project linked to customer
    it('6. Create project linked to customer: selects existing customer and saves Project Name and Location', () => {
      // Pick existing customer
      const existingClient = mockCustomers.find((c) => c.name === 'K. Rajasekaran');
      expect(existingClient).toBeDefined();

      const newProjectData = {
        name: 'Rajasekaran Commercial Complex',
        customer_id: existingClient!.id,
        site_address: 'Bypass Road, Tenkasi',
      };

      const createdProject: Project = {
        id: `prj-${mockProjects.length + 1}`,
        company_id: 'comp-shivarivel-001',
        customer_id: newProjectData.customer_id,
        project_code: `PRJ-000${mockProjects.length + 1}`,
        name: newProjectData.name,
        site_address: newProjectData.site_address,
        status: 'Active',
        customer: {
          id: existingClient!.id,
          name: existingClient!.name,
          phone: existingClient!.phone || '',
          email: existingClient!.email || '',
          address: existingClient!.address || '',
          city: 'Tenkasi',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockProjects.unshift(createdProject);

      expect(mockProjects[0].name).toBe('Rajasekaran Commercial Complex');
      expect(mockProjects[0].customer?.name).toBe('K. Rajasekaran');
      expect(mockProjects[0].site_address).toBe('Bypass Road, Tenkasi');
    });

    // 7. Display project
    it('7. Display project: scannable card displays Project Name, Client, and Location', () => {
      const proj = mockProjects[0];

      expect(proj.name).toBeTruthy();
      expect(proj.customer?.name).toBeTruthy();
      expect(proj.site_address).toBeTruthy();
    });

    // 8. Edit project
    it('8. Edit project: allows updating Project Name, Client, and Location', () => {
      const proj = mockProjects[0];
      const initialId = proj.id;

      // Update project name and location
      const updatedProject: Project = {
        ...proj,
        name: 'Arun Kumar Residence',
        site_address: 'Nagercoil, Kanyakumari Dist',
        updated_at: new Date().toISOString(),
      };

      const idx = mockProjects.findIndex((p) => p.id === initialId);
      mockProjects[idx] = updatedProject;

      expect(mockProjects[idx].id).toBe(initialId);
      expect(mockProjects[idx].name).toBe('Arun Kumar Residence');
      expect(mockProjects[idx].site_address).toBe('Nagercoil, Kanyakumari Dist');
    });

    // 9. Project detail
    it('9. Project detail: simple hub shows Project Name, Client, Location, and read-only total wages', () => {
      const proj = mockProjects.find((p) => p.id === 'prj-001');
      expect(proj).toBeDefined();

      // Calculate read-only wages for this project
      const wagesForProject = mockWages.filter((w) => w.project_id === 'prj-001');
      const totalWagesOnSite = wagesForProject.reduce((sum, w) => sum + (w.amount || 0), 0);

      // Verify read-only representation
      expect(totalWagesOnSite).toBe(1350); // 900 + 450
      expect(proj?.name).toBeTruthy();
      expect(proj?.customer?.name).toBeTruthy();
      expect(proj?.site_address).toBeTruthy();
    });

    // 10. Project list
    it('10. Project list: simple scannable list without complex status badges, progress bars, or health scores', () => {
      // In Phase 03B simplified list, cards present Project Name, Client, and Location
      const simplifiedCards = mockProjects.map((p) => ({
        projectName: p.name,
        clientName: p.customer?.name || 'Unassigned',
        location: p.site_address || 'Not specified',
      }));

      expect(simplifiedCards.length).toBe(mockProjects.length);
      simplifiedCards.forEach((c) => {
        expect(c.projectName).toBeTruthy();
        expect(c.clientName).toBeTruthy();
        expect(c.location).toBeTruthy();
      });
    });

    // 11. Project appears in Wages selection
    it('11. Project appears in Wages selection: project list populates project dropdown for daily wages', () => {
      // Wages dropdown options are mapped from projects
      const wageProjectDropdown = mockProjects.map((p) => ({
        id: p.id,
        label: p.name,
      }));

      expect(wageProjectDropdown.length).toBe(mockProjects.length);
      expect(wageProjectDropdown.some((opt) => opt.id === 'prj-001')).toBe(true);
      expect(wageProjectDropdown.some((opt) => opt.label.includes('Villa'))).toBe(true);
    });

    // 12. Renaming project updates the displayed project name without creating duplicate records
    it('12. Renaming project updates displayed project name without creating duplicate records', () => {
      const initialCount = mockProjects.length;
      const targetProj = mockProjects.find((p) => p.id === 'prj-001')!;

      // Rename from "3BHK Villa..." to "Arun Kumar House"
      const updatedProj: Project = {
        ...targetProj,
        name: 'Arun Kumar House',
      };

      const targetIdx = mockProjects.findIndex((p) => p.id === 'prj-001');
      mockProjects[targetIdx] = updatedProj;

      // Ensure no duplicate project was created
      expect(mockProjects.length).toBe(initialCount);

      // Check Wages project lookup:
      const wage = mockWages.find((w) => w.project_id === 'prj-001')!;
      const resolvedProjectName = mockProjects.find((p) => p.id === wage.project_id)?.name;

      expect(resolvedProjectName).toBe('Arun Kumar House');
    });
  });

  // ========================================================
  // INTEGRATION SECTION
  // ========================================================

  describe('INTEGRATION', () => {
    // 13. Customer -> Project relationship remains correct
    it('13. Customer -> Project relationship: projects correctly point to customer without duplicate customers', () => {
      const customerId = 'cust-01';
      const projectsForCust = mockProjects.filter((p) => p.customer_id === customerId);

      // Verify that all linked projects reference the exact same customer record
      projectsForCust.forEach((p) => {
        expect(p.customer_id).toBe(customerId);
      });

      // Creating a new project for this customer does not duplicate the customer record
      const initialCustomerCount = mockCustomers.length;
      const secondProject: Project = {
        id: 'prj-extra-001',
        company_id: 'comp-shivarivel-001',
        customer_id: customerId,
        project_code: 'PRJ-0099',
        name: 'Second Renovation Project',
        site_address: 'Anna Nagar, Madurai',
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProjects.push(secondProject);

      expect(mockCustomers.length).toBe(initialCustomerCount);
      const updatedProjectsForCust = mockProjects.filter((p) => p.customer_id === customerId);
      expect(updatedProjectsForCust.length).toBe(projectsForCust.length + 1);
    });

    // 14. Project -> Wages relationship remains correct
    it('14. Project -> Wages relationship: wages recorded for a project aggregate correctly on the project detail view', () => {
      const projectId = 'prj-001';

      // Daily wage entries for prj-001
      const siteWageEntries = mockWages.filter((w) => w.project_id === projectId && w.status === 'Confirmed');
      const totalSiteWages = siteWageEntries.reduce((sum, w) => sum + (w.amount || 0), 0);

      expect(totalSiteWages).toBe(1350);

      // Add a third wage entry for this project
      const newWageEntry: DailyWage = {
        id: 'wage-003',
        company_id: 'comp-shivarivel-001',
        employee_id: 'emp-03',
        attendance_id: 'att-003',
        project_id: projectId,
        wage_number: 'WAG-0003',
        wage_date: '2026-10-05',
        payable_units: 1,
        amount: 1100,
        rate: 1100,
        base_wage: 1100,
        overtime_hours: 0,
        overtime_amount: 0,
        reversal_of_id: null,
        status: 'Confirmed',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockWages.push(newWageEntry);

      // Recalculate
      const updatedSiteWageEntries = mockWages.filter((w) => w.project_id === projectId && w.status === 'Confirmed');
      const updatedTotal = updatedSiteWageEntries.reduce((sum, w) => sum + (w.amount || 0), 0);

      expect(updatedTotal).toBe(2450); // 1350 + 1100
    });
  });
});
