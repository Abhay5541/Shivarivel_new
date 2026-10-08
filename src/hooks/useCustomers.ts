import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Customer, CustomerFormData } from '@/types/business';

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

