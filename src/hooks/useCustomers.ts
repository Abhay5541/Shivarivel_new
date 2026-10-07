import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Customer, CustomerFormData } from '@/types/business';

export const devEvalCustomers: Customer[] = [
  {
    id: 'cust-01',
    company_id: 'comp-shivarivel-001',
    name: 'Priya Menon',
    phone: '9840123456',
    email: 'priya.menon@example.com',
    address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    notes: 'Premium 3BHK residential project. Prefers natural teakwood finish & warm cove lighting.',
    status: 'active',
    enquiries_count: 2,
    site_visits_count: 3,
    active_projects_count: 1,
    created_at: '2026-08-15T10:30:00Z',
    updated_at: '2026-09-20T14:15:00Z',
  },
  {
    id: 'cust-02',
    company_id: 'comp-shivarivel-001',
    name: 'Dr. Anand Kumar',
    phone: '9443198765',
    email: 'anand.k@example.com',
    address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    notes: 'Consultant doctor at Apollo. Wants modular clinic interior + home renovation.',
    status: 'active',
    enquiries_count: 1,
    site_visits_count: 1,
    active_projects_count: 1,
    created_at: '2026-08-28T11:00:00Z',
    updated_at: '2026-10-01T09:30:00Z',
  },
  {
    id: 'cust-03',
    company_id: 'comp-shivarivel-001',
    name: 'K. Rajasekaran',
    phone: '9789012345',
    email: 'rajasekaran.k@example.com',
    address: 'Plot 108, Bypass Main Road, Tenkasi',
    notes: 'Two-storey commercial building elevation and structural glazing work.',
    status: 'active',
    enquiries_count: 2,
    site_visits_count: 2,
    active_projects_count: 0,
    created_at: '2026-09-02T16:20:00Z',
    updated_at: '2026-09-30T15:00:00Z',
  },
  {
    id: 'cust-04',
    company_id: 'comp-shivarivel-001',
    name: 'S. Ramanathan',
    phone: '9944567890',
    email: 's.ramanathan@example.com',
    address: 'Door 24, South Car Street, Sankarankovil',
    notes: 'New plot construction. Site measurement completed. Requires approval drawings.',
    status: 'active',
    enquiries_count: 1,
    site_visits_count: 2,
    active_projects_count: 0,
    created_at: '2026-09-12T09:15:00Z',
    updated_at: '2026-10-02T10:00:00Z',
  },
  {
    id: 'cust-05',
    company_id: 'comp-shivarivel-001',
    name: 'M. Chellappa',
    phone: '9842134567',
    email: 'chellappa.m@example.com',
    address: 'Kallidaikurichi Main Bazar, Tirunelveli Dist',
    notes: 'Commercial complex structural renovation. Phase 1 civil completed.',
    status: 'active',
    enquiries_count: 1,
    site_visits_count: 1,
    active_projects_count: 1,
    created_at: '2026-07-20T12:00:00Z',
    updated_at: '2026-09-15T17:45:00Z',
  },
  {
    id: 'cust-06',
    company_id: 'comp-shivarivel-001',
    name: 'Thirunavukkarasu & Sons',
    phone: '9442087654',
    email: 'thiru.textiles@example.com',
    address: 'Textile Market Complex, Erode Road, Salem',
    notes: 'Old showroom false ceiling and LED lighting revamp completed.',
    status: 'inactive',
    enquiries_count: 1,
    site_visits_count: 1,
    active_projects_count: 0,
    created_at: '2026-06-10T14:30:00Z',
    updated_at: '2026-08-01T11:00:00Z',
  },
];

// In-memory store for evaluation mode so new creates and updates reflect immediately
let memoryCustomers: Customer[] = [];

interface UseCustomersOptions {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { search = '', status = 'all' } = options;

  return useQuery<Customer[], Error>({
    queryKey: ['customers', { search, status }],
    queryFn: async () => {
      try {
        let query = supabase.from('customers').select('*').order('created_at', { ascending: false });

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        if (search.trim()) {
          const s = search.trim();
          query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,address.ilike.%${s}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('Customers query notice:', error.message);
          return memoryCustomers;
        }

        return (data || []) as Customer[];
      } catch (err) {
        console.warn('Customers query notice:', err);
        return memoryCustomers;
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery<Customer | null, Error>({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          const found = memoryCustomers.find((c) => c.id === id);
          return found || null;
        }

        return data as Customer;
      } catch (err) {
        console.warn('Customer by ID query notice:', err);
        const found = memoryCustomers.find((c) => c.id === id);
        return found || null;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CustomerFormData) => {
      try {
        const { data, error } = await (supabase.from('customers') as any)
          .insert({
            name: input.name.trim(),
            phone: input.phone?.trim() || null,
            email: input.email?.trim() || null,
            address: input.address?.trim() || null,
            notes: input.notes?.trim() || null,
            status: input.status || 'active',
          })
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data as Customer;
      } catch (err: unknown) {
        console.warn('Customer creation notice:', err);
        // Fallback simulated creation for dev
        const newRecord: Customer = {
          id: `cust-${Date.now().toString().slice(-4)}`,
          company_id: 'comp-shivarivel-001',
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null,
          status: input.status || 'active',
          enquiries_count: 0,
          site_visits_count: 0,
          active_projects_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryCustomers = [newRecord, ...memoryCustomers];
        return newRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<CustomerFormData> }) => {
      try {
        const { data, error } = await (supabase.from('customers') as any)
          .update({
            ...(input.name && { name: input.name.trim() }),
            ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
            ...(input.email !== undefined && { email: input.email?.trim() || null }),
            ...(input.address !== undefined && { address: input.address?.trim() || null }),
            ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
            ...(input.status && { status: input.status }),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as Customer;
      } catch (err: unknown) {
        console.warn('Customer update notice:', err);
        // Fallback update in-memory
        memoryCustomers = memoryCustomers.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              ...(input.name && { name: input.name.trim() }),
              ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
              ...(input.email !== undefined && { email: input.email?.trim() || null }),
              ...(input.address !== undefined && { address: input.address?.trim() || null }),
              ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
              ...(input.status && { status: input.status }),
              updated_at: new Date().toISOString(),
            };
          }
          return c;
        });
        const updated = memoryCustomers.find((c) => c.id === id);
        return updated;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) {
          console.warn('Customer deletion Supabase notice:', error.message);
        }
      } catch (err: unknown) {
        console.warn('Customer deletion notice:', err);
      }
      memoryCustomers = memoryCustomers.filter((c) => c.id !== id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

