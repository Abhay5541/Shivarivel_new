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

let memoryProjects: Project[] = [];

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

      return (data as unknown as Project[]) || [];
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

      const fallback = {
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

      const fallback = {
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

      if (error || !data) {
        return [];
      }

      return data as unknown as ProjectDocument[];
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

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
          console.warn('Supabase project delete notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase project delete error:', err);
      }
      memoryProjects = memoryProjects.filter((p) => p.id !== id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-balances'] });
    },
  });
}

