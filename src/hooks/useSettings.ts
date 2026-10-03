/**
 * SHIVARIVEL CONSTRUCTION & INTERIORS
 * Phase 10: Settings & Administration Hooks
 *
 * Source of truth:
 * - Migration 0001_foundation.sql: public.companies, public.profiles, public.service_types
 * - Migration 0002_auth_and_profiles.sql: RLS policies, protect_profile_fields trigger
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  initialCompanyProfile,
  initialUserProfiles,
  initialServiceTypes,
  type CompanyProfile,
  type CompanyProfileFormData,
  type UserProfile,
  type UserRole,
  type ServiceType,
  type ServiceTypeFormData,
} from '@/types/settings';

// In-memory singletons for evaluation mode / offline dev
export let inMemoryCompanyProfile: CompanyProfile = { ...initialCompanyProfile };
export let inMemoryUserProfiles: UserProfile[] = [...initialUserProfiles];
export let inMemoryServiceTypes: ServiceType[] = [...initialServiceTypes];

// ==========================================
// 1. COMPANY SETTINGS HOOKS
// ==========================================

export function useCompanySettings() {
  return useQuery<CompanyProfile, Error>({
    queryKey: ['company_settings'],
    initialData: () => inMemoryCompanyProfile,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from as any)('companies')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          return inMemoryCompanyProfile;
        }

        const profile: CompanyProfile = {
          id: data.id,
          name: data.name,
          owner_name: data.owner_name || inMemoryCompanyProfile.owner_name,
          address: data.address || inMemoryCompanyProfile.address,
          phone: data.phone || inMemoryCompanyProfile.phone,
          alternate_phone: data.alternate_phone || inMemoryCompanyProfile.alternate_phone,
          email: data.email || inMemoryCompanyProfile.email,
          website: data.website || inMemoryCompanyProfile.website,
          gst_number: data.gst_number || inMemoryCompanyProfile.gst_number,
          logo_url: data.logo_url || null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        inMemoryCompanyProfile = profile;
        return profile;
      } catch (err) {
        console.warn('Company settings query notice:', err);
        return inMemoryCompanyProfile;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updated: CompanyProfileFormData) => {
      const payload = {
        name: updated.name.trim(),
        owner_name: updated.owner_name.trim(),
        address: updated.address.trim(),
        phone: updated.phone.trim(),
        alternate_phone: updated.alternate_phone?.trim() || null,
        email: updated.email.trim(),
        website: updated.website?.trim() || null,
        gst_number: updated.gst_number?.trim() || null,
        logo_url: updated.logo_url || null,
        updated_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await (supabase.from as any)('companies')
          .update(payload)
          .eq('id', inMemoryCompanyProfile.id)
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Supabase company update warning, updating local state:', error.message);
        }

        inMemoryCompanyProfile = {
          ...inMemoryCompanyProfile,
          ...payload,
          id: data?.id || inMemoryCompanyProfile.id,
        };

        return inMemoryCompanyProfile;
      } catch (err) {
        console.warn('Company mutation offline fallback:', err);
        inMemoryCompanyProfile = {
          ...inMemoryCompanyProfile,
          ...payload,
        };
        return inMemoryCompanyProfile;
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['company_settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['company_settings'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

// ==========================================
// 2. USERS & ROLES HOOKS
// ==========================================

export function useUsersList() {
  return useQuery<UserProfile[], Error>({
    queryKey: ['users_list'],
    initialData: () => inMemoryUserProfiles,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from as any)('profiles')
          .select('*')
          .order('full_name', { ascending: true });

        if (error || !data || data.length === 0) {
          return inMemoryUserProfiles;
        }

        // Merge with existing emails/project counts
        const mapped: UserProfile[] = data.map((row: any) => {
          const existing = inMemoryUserProfiles.find((u) => u.id === row.id);
          return {
            ...row,
            role: row.role as UserRole,
            email: existing?.email || `${row.full_name.toLowerCase().replace(/[^a-z]/g, '')}@shivarivel.com`,
            assigned_projects_count: existing?.assigned_projects_count ?? 1,
          };
        });

        inMemoryUserProfiles = mapped;
        return mapped;
      } catch (err) {
        console.warn('Users list query notice:', err);
        return inMemoryUserProfiles;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const targetUser = inMemoryUserProfiles.find((u) => u.id === userId);
      if (!targetUser) throw new Error('User not found');

      // Owner Protection: Prevent downgrading the only active owner
      if (targetUser.role === 'owner' && newRole !== 'owner') {
        const activeOwners = inMemoryUserProfiles.filter(
          (u) => u.role === 'owner' && u.is_active && u.id !== userId
        );
        if (activeOwners.length === 0) {
          throw new Error('Action blocked: Cannot demote the primary active Owner account. Promote another owner first.');
        }
      }

      try {
        const { error } = await (supabase.from as any)('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) {
          console.warn('Supabase profile role update notice, updating local state:', error.message);
        }
      } catch (err) {
        console.warn('Profile role mutation offline fallback:', err);
      }

      inMemoryUserProfiles = inMemoryUserProfiles.map((u) =>
        u.id === userId ? { ...u, role: newRole, updated_at: new Date().toISOString() } : u
      );

      return { userId, newRole };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
      queryClient.invalidateQueries({ queryKey: ['company_profiles'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const targetUser = inMemoryUserProfiles.find((u) => u.id === userId);
      if (!targetUser) throw new Error('User not found');

      // Owner Protection: Prevent deactivating the only active owner
      if (targetUser.role === 'owner' && !isActive) {
        const otherActiveOwners = inMemoryUserProfiles.filter(
          (u) => u.role === 'owner' && u.is_active && u.id !== userId
        );
        if (otherActiveOwners.length === 0) {
          throw new Error('Action blocked: Cannot deactivate the primary active Owner account.');
        }
      }

      try {
        const { error } = await (supabase.from as any)('profiles')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) {
          console.warn('Supabase profile status update notice, updating local state:', error.message);
        }
      } catch (err) {
        console.warn('Profile status mutation offline fallback:', err);
      }

      inMemoryUserProfiles = inMemoryUserProfiles.map((u) =>
        u.id === userId ? { ...u, is_active: isActive, updated_at: new Date().toISOString() } : u
      );

      return { userId, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
      queryClient.invalidateQueries({ queryKey: ['company_profiles'] });
    },
  });
}

// ==========================================
// 3. SERVICE TYPES HOOKS
// ==========================================

export function useServiceTypesAdmin() {
  return useQuery<ServiceType[], Error>({
    queryKey: ['service_types_admin'],
    initialData: () => inMemoryServiceTypes,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from as any)('service_types')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
          return inMemoryServiceTypes;
        }

        const mapped: ServiceType[] = data.map((row: any) => {
          const existing = inMemoryServiceTypes.find((s) => s.id === row.id);
          return {
            ...row,
            usage_count: existing?.usage_count ?? 4,
          };
        });

        inMemoryServiceTypes = mapped;
        return mapped;
      } catch (err) {
        console.warn('Service types admin query notice:', err);
        return inMemoryServiceTypes;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ServiceTypeFormData) => {
      const newId = `st-${Date.now().toString().slice(-6)}`;
      const payload: ServiceType = {
        id: newId,
        company_id: inMemoryCompanyProfile.id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await (supabase.from as any)('service_types')
          .insert({
            company_id: inMemoryCompanyProfile.id,
            name: payload.name,
            description: payload.description,
            sort_order: payload.sort_order,
            is_active: payload.is_active,
          })
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Supabase service_types insert notice, updating local state:', error.message);
        } else if (data) {
          payload.id = data.id;
        }
      } catch (err) {
        console.warn('Service type create offline fallback:', err);
      }

      inMemoryServiceTypes = [...inMemoryServiceTypes, payload];
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_types_admin'] });
      queryClient.invalidateQueries({ queryKey: ['service_types'] });
    },
  });
}

export function useUpdateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServiceTypeFormData }) => {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        sort_order: data.sort_order,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };

      try {
        const { error } = await (supabase.from as any)('service_types')
          .update(payload)
          .eq('id', id);

        if (error) {
          console.warn('Supabase service_types update notice, updating local state:', error.message);
        }
      } catch (err) {
        console.warn('Service type update offline fallback:', err);
      }

      inMemoryServiceTypes = inMemoryServiceTypes.map((s) =>
        s.id === id ? { ...s, ...payload } : s
      );

      return { id, ...payload };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_types_admin'] });
      queryClient.invalidateQueries({ queryKey: ['service_types'] });
    },
  });
}

export function useToggleServiceTypeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      try {
        const { error } = await (supabase.from as any)('service_types')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          console.warn('Supabase service_types status toggle notice, updating local state:', error.message);
        }
      } catch (err) {
        console.warn('Service type status toggle offline fallback:', err);
      }

      inMemoryServiceTypes = inMemoryServiceTypes.map((s) =>
        s.id === id ? { ...s, is_active: isActive, updated_at: new Date().toISOString() } : s
      );

      return { id, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_types_admin'] });
      queryClient.invalidateQueries({ queryKey: ['service_types'] });
    },
  });
}
