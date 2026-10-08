import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ServiceTypeRow, ProfileRow } from '@/types/business';
import { inMemoryServiceTypes, inMemoryUserProfiles } from '@/hooks/useSettings';

export function useServiceTypes() {
  return useQuery<ServiceTypeRow[], Error>({
    queryKey: ['service_types'],
    initialData: () => inMemoryServiceTypes.filter((s) => s.is_active) as ServiceTypeRow[],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('service_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
          return inMemoryServiceTypes.filter((s) => s.is_active) as ServiceTypeRow[];
        }
        return data as ServiceTypeRow[];
      } catch (err) {
        console.warn('Service types query notice:', err);
        return inMemoryServiceTypes.filter((s) => s.is_active) as ServiceTypeRow[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyProfiles() {
  return useQuery<ProfileRow[], Error>({
    queryKey: ['company_profiles'],
    initialData: () => inMemoryUserProfiles.filter((p) => p.is_active) as ProfileRow[],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (error || !data || data.length === 0) {
          return inMemoryUserProfiles.filter((p) => p.is_active) as ProfileRow[];
        }
        return data as ProfileRow[];
      } catch (err) {
        console.warn('Profiles query notice:', err);
        return inMemoryUserProfiles.filter((p) => p.is_active) as ProfileRow[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupervisors() {
  const { data: profiles = [], ...rest } = useCompanyProfiles();
  return {
    ...rest,
    data: profiles.filter((p) => p.role === 'supervisor'),
  };
}
