import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ServiceTypeRow, ProfileRow } from '@/types/business';
import { inMemoryServiceTypes, inMemoryUserProfiles } from '@/hooks/useSettings';

export const devEvalServiceTypes: ServiceTypeRow[] = [
  {
    id: 'st-01',
    company_id: 'comp-shivarivel-001',
    name: 'Interior & Woodwork',
    description: 'Modular kitchen, TV units, wardrobes, and customized storage',
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'st-02',
    company_id: 'comp-shivarivel-001',
    name: 'False Ceiling & Profile Lighting',
    description: 'Saint-Gobain gypsum channel framing with warm ambient lighting',
    is_active: true,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'st-03',
    company_id: 'comp-shivarivel-001',
    name: 'Civil Construction & Contracting',
    description: 'Turnkey residential and commercial structure erection',
    is_active: true,
    sort_order: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'st-04',
    company_id: 'comp-shivarivel-001',
    name: '3D Elevation & Structural Detailing',
    description: 'Front facade architectural rendering and working structural drawings',
    is_active: true,
    sort_order: 4,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'st-05',
    company_id: 'comp-shivarivel-001',
    name: 'Building Planning & Approval Plans',
    description: 'DTCP / Municipal plan submission and surveyor documentation',
    is_active: true,
    sort_order: 5,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

export const devEvalProfiles: ProfileRow[] = [
  {
    id: 'user-01',
    company_id: 'comp-shivarivel-001',
    full_name: 'K. Senthil Nathan',
    phone: '9840112233',
    role: 'owner',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-02',
    company_id: 'comp-shivarivel-001',
    full_name: 'A. Murugan',
    phone: '9443223344',
    role: 'supervisor',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-03',
    company_id: 'comp-shivarivel-001',
    full_name: 'R. Vignesh',
    phone: '9789334455',
    role: 'supervisor',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

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
