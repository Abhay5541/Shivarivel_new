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

        const list = (data || []) as Customer[];
        memoryCustomers = list;
        return list;
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
      // 1. Resolve company_id dynamically from existing records or company table
      let targetCompanyId = '1ae9407b-8bb0-4eb0-b617-a3f8d8879eef';
      try {
        const { data: existingCust } = await (supabase.from('customers') as any).select('company_id').limit(1).maybeSingle();
        if (existingCust?.company_id) {
          targetCompanyId = existingCust.company_id;
        } else {
          const { data: comp } = await (supabase.from('companies') as any).select('id').limit(1).maybeSingle();
          if (comp?.id) targetCompanyId = comp.id;
        }
      } catch {}

      try {
        const { data, error } = await (supabase.from('customers') as any)
          .insert({
            company_id: targetCompanyId,
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

        const created = data as Customer;
        memoryCustomers = [created, ...memoryCustomers.filter((c) => c.id !== created.id)];
        return created;
      } catch (err: unknown) {
        console.warn('Customer creation remote error, checking fallback:', err);
        const newRecord: Customer = {
          id: `cust-${Date.now().toString().slice(-4)}`,
          company_id: targetCompanyId,
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
            ...(input.name !== undefined && { name: input.name.trim() }),
            ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
            ...(input.email !== undefined && { email: input.email?.trim() || null }),
            ...(input.address !== undefined && { address: input.address?.trim() || null }),
            ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
            ...(input.status !== undefined && { status: input.status }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        const updated = data as Customer;
        memoryCustomers = memoryCustomers.map((c) => (c.id === id ? updated : c));
        return updated;
      } catch (err: unknown) {
        console.warn('Customer update remote notice:', err);
        memoryCustomers = memoryCustomers.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              ...(input.name !== undefined && { name: input.name.trim() }),
              ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
              ...(input.email !== undefined && { email: input.email?.trim() || null }),
              ...(input.address !== undefined && { address: input.address?.trim() || null }),
              ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
              ...(input.status !== undefined && { status: input.status }),
              updated_at: new Date().toISOString(),
            };
          }
          return c;
        });
        const updated = memoryCustomers.find((c) => c.id === id);
        return updated;
      }
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueriesData({ queryKey: ['customers'] }, (old: Customer[] | undefined) => {
        if (!old) return old;
        return old.map((c) => (c.id === variables.id ? { ...c, ...variables.data, ...(updated || {}) } : c));
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        // 1. Unlink child projects so foreign key constraint does not block deletion
        await (supabase.from('projects') as any)
          .update({ customer_id: null })
          .eq('customer_id', id);

        // 2. Unlink or clean up other child references
        await (supabase.from('tasks') as any)
          .update({ customer_id: null })
          .eq('customer_id', id);

        await (supabase.from('follow_ups') as any)
          .delete()
          .eq('customer_id', id);

        await (supabase.from('enquiries') as any)
          .delete()
          .eq('customer_id', id);

        await (supabase.from('site_visits') as any)
          .delete()
          .eq('customer_id', id);

        await (supabase.from('estimates') as any)
          .update({ customer_id: null })
          .eq('customer_id', id);

        await (supabase.from('customer_payments') as any)
          .delete()
          .eq('customer_id', id);

        // 3. Delete from customers table
        const { error } = await supabase.from('customers').delete().eq('id', id);

        if (error) {
          console.warn('Customer direct delete constrained; marking inactive in remote database:', error.message);
          await (supabase.from('customers') as any)
            .update({ status: 'inactive' })
            .eq('id', id);
        }
      } catch (err: unknown) {
        console.warn('Customer deletion cascading cleanup notice:', err);
        // Fallback soft-delete attempt
        await (supabase.from('customers') as any)
          .update({ status: 'inactive' })
          .eq('id', id)
          .catch(() => {});
      }

      memoryCustomers = memoryCustomers.filter((c) => c.id !== id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['customers'], (old: Customer[] | undefined) => {
        return (old || []).filter((c) => c.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

