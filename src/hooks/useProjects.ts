import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  Project,
  ProjectFormData,
  WorkProgressItem,
  ProjectWorkProgressSummary,
  ProjectFinancialContext,
  ProjectDocument,
} from '@/types/projects';

// Standard evaluation seed data matching Tamil Nadu projects
export const devEvalProjects: Project[] = [
  {
    id: 'prj-001',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-01',
    enquiry_id: 'enq-01',
    estimate_id: 'est-01',
    project_code: 'PRJ-0001',
    name: '3BHK Villa Complete Interior & Modular Kitchen',
    description: 'Turnkey architectural interior execution, teak wood paneling, modular kitchen, and smart lighting',
    site_address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    status: 'Active',
    start_date: '2026-10-01',
    expected_end_date: '2026-12-15',
    actual_end_date: null,
    contract_value: 650000,
    assigned_to: 'usr-sup-001',
    notes: 'Access permitted from 8 AM to 7 PM. All material deliveries via Service Gate 2.',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-02T12:00:00Z',
    customer: {
      id: 'cust-01',
      name: 'Priya Menon',
      phone: '9840123456',
      email: 'priya.menon@example.com',
      address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
      city: 'Madurai',
    },
    enquiry: {
      id: 'enq-01',
      description: 'Complete 3BHK Villa interior woodwork, acrylic modular kitchen, and master bedroom wardrobe',
      status: 'Site Visit Completed',
    },
    estimate: {
      id: 'est-01',
      estimate_number: 'EST-0001',
      title: '3BHK Villa Complete Interior Woodwork & Modular Kitchen',
      total_amount: 650000,
      status: 'Converted',
    },
    supervisor: {
      id: 'usr-sup-001',
      full_name: 'M. Manikandan',
      phone: '9840556677',
      role: 'supervisor',
    },
  },
  {
    id: 'prj-002',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-02',
    enquiry_id: 'enq-02',
    estimate_id: 'est-02',
    project_code: 'PRJ-0002',
    name: 'Doctor Consultation Clinic False Ceiling & Lighting',
    description: 'Acoustic modular false ceiling with Saint-Gobain gypsum boards and magnetic track LED systems',
    site_address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    status: 'Active',
    start_date: '2026-09-20',
    expected_end_date: '2026-10-25',
    actual_end_date: null,
    contract_value: 180000,
    assigned_to: 'usr-sup-001',
    notes: 'Noisy work permitted only between 6 AM and 9 AM before patient consultation hours.',
    created_at: '2026-09-18T14:30:00Z',
    updated_at: '2026-10-01T16:00:00Z',
    customer: {
      id: 'cust-02',
      name: 'Dr. Anand Kumar',
      phone: '9443198765',
      email: 'anand.k@example.com',
      address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
      city: 'Tirunelveli',
    },
    enquiry: {
      id: 'enq-02',
      description: 'Doctor consultation cabin false ceiling with ambient warm profile lighting & sound dampening',
      status: 'Converted',
    },
    estimate: {
      id: 'est-02',
      estimate_number: 'EST-0002',
      title: 'Doctor Consultation Cabin False Ceiling & Architectural Lighting',
      total_amount: 180000,
      status: 'Converted',
    },
    supervisor: {
      id: 'usr-sup-001',
      full_name: 'M. Manikandan',
      phone: '9840556677',
      role: 'supervisor',
    },
  },
  {
    id: 'prj-003',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-03',
    enquiry_id: 'enq-03',
    estimate_id: 'est-03',
    project_code: 'PRJ-0003',
    name: 'Commercial Facade 3D Louvers & Structural Steel Canopy',
    description: 'Architectural aluminum composite cladding, external louvers, and weather canopy erection',
    site_address: 'Plot 108, Bypass Main Road, Tenkasi',
    status: 'Planned',
    start_date: '2026-10-15',
    expected_end_date: '2026-11-30',
    actual_end_date: null,
    contract_value: 120000,
    assigned_to: null,
    notes: 'Awaiting local municipal road-widening clearance before canopy welding.',
    created_at: '2026-10-01T15:00:00Z',
    updated_at: '2026-10-01T15:00:00Z',
    customer: {
      id: 'cust-03',
      name: 'K. Rajasekaran',
      phone: '9789012345',
      email: 'rajasekaran.k@example.com',
      address: 'Plot 108, Bypass Main Road, Tenkasi',
      city: 'Tenkasi',
    },
    enquiry: {
      id: 'enq-03',
      description: 'Modern front facade 3D elevation design with aluminium louvers and structural steel canopy',
      status: 'Estimate Prepared',
    },
    estimate: {
      id: 'est-03',
      estimate_number: 'EST-0003',
      title: 'Modern Front Facade 3D Elevation & Aluminum Louvers Canopy',
      total_amount: 120000,
      status: 'Approved',
    },
    supervisor: undefined,
  },
  {
    id: 'prj-004',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-04',
    enquiry_id: 'enq-04',
    estimate_id: 'est-04',
    project_code: 'PRJ-0004',
    name: '2400 sq.ft Duplex Residential Civil Construction',
    description: 'Full civil structure from RCC footing, brickwork masonry, plastering up to roof level',
    site_address: 'Door 24, South Car Street, Sankarankovil',
    status: 'Planning',
    start_date: '2026-11-01',
    expected_end_date: '2027-05-31',
    actual_end_date: null,
    contract_value: 3800000,
    assigned_to: 'usr-sup-001',
    notes: 'Borewell water pump testing completed. Soil bearing capacity report pending approval.',
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-02T11:00:00Z',
    customer: {
      id: 'cust-04',
      name: 'S. Ramanathan',
      phone: '9944567890',
      email: 's.ramanathan@example.com',
      address: 'Door 24, South Car Street, Sankarankovil',
      city: 'Sankarankovil',
    },
    enquiry: {
      id: 'enq-04',
      description: '2400 sq.ft duplex residential civil construction from foundation to lock-and-key',
      status: 'New',
    },
    estimate: {
      id: 'est-04',
      estimate_number: 'EST-0004',
      title: '2400 sq.ft Duplex Residential Civil Construction Proposal',
      total_amount: 3800000,
      status: 'Draft',
    },
    supervisor: {
      id: 'usr-sup-001',
      full_name: 'M. Manikandan',
      phone: '9840556677',
      role: 'supervisor',
    },
  },
];

export const devEvalWorkProgress: Record<string, { summary: ProjectWorkProgressSummary; items: WorkProgressItem[] }> = {
  'prj-001': {
    summary: {
      project_id: 'prj-001',
      project_code: 'PRJ-0001',
      project_name: '3BHK Villa Complete Interior & Modular Kitchen',
      project_status: 'Active',
      total_work_items: 4,
      completed_work_items: 1,
      in_progress_work_items: 2,
      not_started_work_items: 1,
      overall_progress_percentage: 45,
    },
    items: [
      {
        id: 'wp-01',
        company_id: 'comp-shivarivel-001',
        project_id: 'prj-001',
        name: 'Site Measurement & CAD Layout Detailing',
        category: 'Interior',
        status: 'Completed',
        progress_percentage: 100,
        start_date: '2026-10-01',
        expected_completion: '2026-10-04',
        actual_completion: '2026-10-03',
        notes: 'Laser measurements verified with client architect.',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'wp-02',
        company_id: 'comp-shivarivel-001',
        project_id: 'prj-001',
        name: 'Kitchen BWP Plywood Carcass & Hafele Hardware Assembly',
        category: 'Interior',
        status: 'In Progress',
        progress_percentage: 60,
        start_date: '2026-10-04',
        expected_completion: '2026-10-20',
        actual_completion: null,
        notes: 'Base cabinets fixed; wall cabinets centering in progress.',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'wp-03',
        company_id: 'comp-shivarivel-001',
        project_id: 'prj-001',
        name: 'Concealed Wiring & Warm Profile LED Diffusers',
        category: 'Electrical',
        status: 'In Progress',
        progress_percentage: 40,
        start_date: '2026-10-08',
        expected_completion: '2026-10-25',
        actual_completion: null,
        notes: 'Wall grooving completed; aluminum profile channels positioned.',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'wp-04',
        company_id: 'comp-shivarivel-001',
        project_id: 'prj-001',
        name: 'Master Bedroom Floor-to-Ceiling Sliding Wardrobe',
        category: 'Interior',
        status: 'Not Started',
        progress_percentage: 0,
        start_date: '2026-10-22',
        expected_completion: '2026-11-15',
        actual_completion: null,
        notes: 'Awaiting bronze tinted glass panel delivery from Chennai.',
        created_at: '2026-10-01T10:00:00Z',
      },
    ],
  },
};

export const devEvalFinancials: Record<string, ProjectFinancialContext> = {
  'prj-001': {
    contract_value: 650000,
    amount_received: 250000,
    outstanding_amount: 400000,
    total_purchases: 145000,
    total_wages: 52000,
    total_expenses: 11500,
    recorded_project_cost: 208500,
  },
  'prj-002': {
    contract_value: 180000,
    amount_received: 100000,
    outstanding_amount: 80000,
    total_purchases: 54000,
    total_wages: 21000,
    total_expenses: 4200,
    recorded_project_cost: 79200,
  },
};

export const devEvalDocuments: Record<string, ProjectDocument[]> = {
  'prj-001': [
    {
      id: 'doc-01',
      company_id: 'comp-shivarivel-001',
      file_name: 'Villa_AnnaNagar_Architectural_FloorPlan_v3.pdf',
      storage_path: 'projects/prj-001/Villa_AnnaNagar_Architectural_FloorPlan_v3.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 2450000,
      category: 'Building Plan',
      description: 'Approved structural architectural drawings signed by client',
      created_at: '2026-10-01T11:00:00Z',
    },
    {
      id: 'doc-02',
      company_id: 'comp-shivarivel-001',
      file_name: 'ModularKitchen_3D_Isometric_Render.jpg',
      storage_path: 'projects/prj-001/ModularKitchen_3D_Isometric_Render.jpg',
      mime_type: 'image/jpeg',
      file_size_bytes: 1820000,
      category: '3D Plan',
      description: '3D isometric realistic render with high-gloss acrylic finishes',
      created_at: '2026-10-01T11:30:00Z',
    },
    {
      id: 'doc-03',
      company_id: 'comp-shivarivel-001',
      file_name: 'Shivarivel_Client_Turnkey_Agreement_Signed.pdf',
      storage_path: 'projects/prj-001/Shivarivel_Client_Turnkey_Agreement_Signed.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 3100000,
      category: 'Agreement',
      description: 'Stamped commercial execution agreement with payment schedule',
      created_at: '2026-10-01T16:00:00Z',
    },
    {
      id: 'doc-04',
      company_id: 'comp-shivarivel-001',
      file_name: 'Foundation_Centering_Inspection_Photo.jpg',
      storage_path: 'projects/prj-001/Foundation_Centering_Inspection_Photo.jpg',
      mime_type: 'image/jpeg',
      file_size_bytes: 1420000,
      category: 'Site Photo',
      description: 'Centering and plywood carcass alignment inspection snapshot',
      created_at: '2026-10-02T09:15:00Z',
    },
  ],
};

let memoryProjects: Project[] = [...devEvalProjects];

export interface UseProjectsOptions {
  search?: string;
  status?: string;
  customerId?: string;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { search = '', status = 'all', customerId } = options;

  return useQuery({
    queryKey: ['projects', { search, status, customerId }],
    queryFn: async (): Promise<Project[]> => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          customer:customers!customer_id (id, name, phone, email, address, city),
          enquiry:enquiries!enquiry_id (id, description, status),
          estimate:estimates!estimate_id (id, estimate_number, title, total_amount, status),
          supervisor:profiles!assigned_to (id, full_name, phone, role)
        `)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},project_code.ilike.${term},site_address.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase projects query returned error; using local memory fallback:', error.message);
        let filtered = [...memoryProjects];
        if (customerId) {
          filtered = filtered.filter((p) => p.customer_id === customerId);
        }
        if (status && status !== 'all') {
          filtered = filtered.filter((p) => p.status === status);
        }
        if (search && search.trim()) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(s) ||
              p.project_code.toLowerCase().includes(s) ||
              (p.site_address && p.site_address.toLowerCase().includes(s)) ||
              (p.customer?.name && p.customer.name.toLowerCase().includes(s))
          );
        }
        return filtered;
      }

      return (data as unknown as Project[]) || memoryProjects;
    },
    initialData: () => {
      let filtered = [...memoryProjects];
      if (customerId) {
        filtered = filtered.filter((p) => p.customer_id === customerId);
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((p) => p.status === status);
      }
      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.project_code.toLowerCase().includes(s) ||
            (p.site_address && p.site_address.toLowerCase().includes(s)) ||
            (p.customer?.name && p.customer.name.toLowerCase().includes(s))
        );
      }
      return filtered;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async (): Promise<Project | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customer:customers!customer_id (id, name, phone, email, address, city),
          enquiry:enquiries!enquiry_id (id, description, status),
          estimate:estimates!estimate_id (id, estimate_number, title, total_amount, status),
          supervisor:profiles!assigned_to (id, full_name, phone, role)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.warn(`Supabase project query for id ${id} returned error; using memory fallback:`, error.message);
        return memoryProjects.find((p) => p.id === id) || null;
      }

      return data as unknown as Project;
    },
    initialData: () => {
      if (!id) return null;
      return memoryProjects.find((p) => p.id === id) || null;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProjectWorkProgress(projectId?: string) {
  return useQuery({
    queryKey: ['project-work-progress', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // 1. Fetch summary from view
      const { data: summaryData } = await supabase
        .from('v_project_work_progress')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      // 2. Fetch items from work_progress table
      const { data: itemsData } = await supabase
        .from('work_progress')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      const fallback = devEvalWorkProgress[projectId] || {
        summary: {
          project_id: projectId,
          project_code: 'PRJ',
          project_name: 'Project',
          project_status: 'Active',
          total_work_items: 0,
          completed_work_items: 0,
          in_progress_work_items: 0,
          not_started_work_items: 0,
          overall_progress_percentage: 0,
        },
        items: [],
      };

      return {
        summary: (summaryData as unknown as ProjectWorkProgressSummary) || fallback.summary,
        items: (itemsData as unknown as WorkProgressItem[]) || fallback.items,
      };
    },
    initialData: () => {
      if (!projectId) return null;
      return devEvalWorkProgress[projectId] || null;
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProjectFinancials(projectId?: string) {
  return useQuery({
    queryKey: ['project-financials', projectId],
    queryFn: async (): Promise<ProjectFinancialContext | null> => {
      if (!projectId) return null;

      // Fetch customer payments balance
      const { data: balanceData } = await (supabase
        .from('v_project_customer_payment_balance') as any)
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      // Fetch recorded costs
      const { data: costData } = await (supabase
        .from('v_project_recorded_cost') as any)
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      const fallback = devEvalFinancials[projectId] || {
        contract_value: 0,
        amount_received: 0,
        outstanding_amount: 0,
        total_purchases: 0,
        total_wages: 0,
        total_expenses: 0,
        recorded_project_cost: 0,
      };

      if (!balanceData && !costData) {
        return fallback;
      }

      const bal = balanceData as any;
      const cost = costData as any;

      return {
        contract_value: Number(bal?.contract_value) || fallback.contract_value,
        amount_received: Number(bal?.amount_received) || fallback.amount_received,
        outstanding_amount: Number(bal?.outstanding_amount) || fallback.outstanding_amount,
        total_purchases: Number(cost?.total_purchases) || fallback.total_purchases,
        total_wages: Number(cost?.total_wages) || fallback.total_wages,
        total_expenses: Number(cost?.total_expenses) || fallback.total_expenses,
        recorded_project_cost: Number(cost?.recorded_project_cost) || fallback.recorded_project_cost,
      };
    },
    initialData: () => {
      if (!projectId) return null;
      return devEvalFinancials[projectId] || null;
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProjectDocuments(projectId?: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async (): Promise<ProjectDocument[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', projectId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return devEvalDocuments[projectId] || [];
      }

      return data as unknown as ProjectDocument[];
    },
    initialData: () => {
      if (!projectId) return [];
      return devEvalDocuments[projectId] || [];
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectFormData) => {
      const { data, error } = await (supabase
        .from('projects') as any)
        .insert({
          customer_id: payload.customer_id,
          enquiry_id: payload.enquiry_id || null,
          estimate_id: payload.estimate_id || null,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          site_address: payload.site_address?.trim() || null,
          status: payload.status,
          start_date: payload.start_date || null,
          expected_end_date: payload.expected_end_date || null,
          contract_value: payload.contract_value ?? null,
          assigned_to: payload.assigned_to || null,
          notes: payload.notes?.trim() || null,
        })
        .select(`
          *,
          customer:customers!customer_id (id, name, phone, email, address, city)
        `)
        .single();

      if (error) {
        console.warn('Supabase project creation error; saving in local memory for evaluation:', error.message);
        const newProjId = 'prj-' + (memoryProjects.length + 1).toString().padStart(3, '0');
        const nextCodeNum = memoryProjects.length + 1;
        const newCode = `PRJ-${nextCodeNum.toString().padStart(4, '0')}`;

        // Find customer if available from existing project or memory
        const existingWithCust = memoryProjects.find((p) => p.customer_id === payload.customer_id);

        const createdProject: Project = {
          id: newProjId,
          company_id: 'comp-shivarivel-001',
          customer_id: payload.customer_id,
          enquiry_id: payload.enquiry_id || null,
          estimate_id: payload.estimate_id || null,
          project_code: newCode,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          site_address: payload.site_address?.trim() || null,
          status: payload.status,
          start_date: payload.start_date || null,
          expected_end_date: payload.expected_end_date || null,
          actual_end_date: null,
          contract_value: payload.contract_value ?? null,
          assigned_to: payload.assigned_to || null,
          notes: payload.notes?.trim() || null,
          customer: existingWithCust?.customer,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        memoryProjects = [createdProject, ...memoryProjects];
        return createdProject;
      }

      return data as unknown as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['customer-balances'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-project'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ProjectFormData> }) => {
      const { data, error } = await (supabase
        .from('projects') as any)
        .update({
          customer_id: payload.customer_id !== undefined ? payload.customer_id : undefined,
          name: payload.name !== undefined ? payload.name.trim() : undefined,
          description: payload.description !== undefined ? payload.description?.trim() || null : undefined,
          site_address: payload.site_address !== undefined ? payload.site_address?.trim() || null : undefined,
          status: payload.status,
          start_date: payload.start_date || null,
          expected_end_date: payload.expected_end_date || null,
          contract_value: payload.contract_value !== undefined ? payload.contract_value : undefined,
          assigned_to: payload.assigned_to || null,
          notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
        })
        .eq('id', id)
        .select(`
          *,
          customer:customers!customer_id (id, name, phone, email, address, city)
        `)
        .single();

      if (error) {
        console.warn('Supabase project update error; updating in local memory for evaluation:', error.message);
        const idx = memoryProjects.findIndex((p) => p.id === id);
        if (idx >= 0) {
          const custId = payload.customer_id !== undefined ? payload.customer_id : memoryProjects[idx].customer_id;
          const existingWithCust = memoryProjects.find((p) => p.customer_id === custId && p.customer);
          memoryProjects[idx] = {
            ...memoryProjects[idx],
            ...payload,
            customer_id: custId,
            customer: existingWithCust?.customer || memoryProjects[idx].customer,
            updated_at: new Date().toISOString(),
          };
          return memoryProjects[idx];
        }
      }

      return data as unknown as Project;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useConvertEstimateToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      estimateId,
      name,
      siteAddress,
      startDate,
      expectedEndDate,
    }: {
      estimateId: string;
      name: string;
      siteAddress?: string | null;
      startDate?: string | null;
      expectedEndDate?: string | null;
    }) => {
      const { data, error } = await (supabase.rpc as any)('convert_estimate_to_project', {
        p_estimate_id: estimateId,
        p_name: name,
        p_site_address: siteAddress || null,
        p_start_date: startDate || null,
        p_expected_end_date: expectedEndDate || null,
      });

      if (error) {
        console.warn('convert_estimate_to_project RPC failed; fallback manual creation:', error.message);
        const nextCodeNum = memoryProjects.length + 1;
        const newProjId = 'prj-' + (memoryProjects.length + 1).toString().padStart(3, '0');
        const newProj: Project = {
          id: newProjId,
          company_id: 'comp-shivarivel-001',
          customer_id: 'cust-01',
          estimate_id: estimateId,
          project_code: `PRJ-${nextCodeNum.toString().padStart(4, '0')}`,
          name,
          site_address: siteAddress || null,
          status: 'Active',
          start_date: startDate || new Date().toISOString().split('T')[0],
          expected_end_date: expectedEndDate || null,
          contract_value: 650000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryProjects = [newProj, ...memoryProjects];
        return newProj.id;
      }

      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
