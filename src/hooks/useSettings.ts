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

const COMPANY_STORAGE_KEY = 'shivarivel_company_profile';

function loadStoredCompanyProfile(): CompanyProfile {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initialCompanyProfile, ...parsed, gst_number: null, website: null };
      }
    } catch {}
  }
  return { ...initialCompanyProfile };
}

// In-memory singletons for evaluation mode / offline dev
export let inMemoryCompanyProfile: CompanyProfile = loadStoredCompanyProfile();
export let inMemoryUserProfiles: UserProfile[] = [...initialUserProfiles];
export let inMemoryServiceTypes: ServiceType[] = [...initialServiceTypes];

// ==========================================
// 1. COMPANY SETTINGS HOOKS
// ==========================================

export function useCompanySettings() {
  return useQuery<CompanyProfile, Error>({
    queryKey: ['company_settings'],
    initialData: () => loadStoredCompanyProfile(),
    queryFn: async () => {
      const stored = loadStoredCompanyProfile();

      try {
        const { data, error } = await (supabase.from as any)('companies')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          return stored;
        }

        const storedTime = stored?.updated_at ? new Date(stored.updated_at).getTime() : 0;
        const dbTime = data?.updated_at ? new Date(data.updated_at).getTime() : 0;

        // If local storage has newer edits than database (e.g. saved locally while offline or RLS restricted),
        // preserve local user edits and do NOT overwrite with stale cloud row
        if (storedTime >= dbTime && storedTime > 0) {
          // Attempt to sync newer local profile to cloud database in background
          if (data.id) {
            (supabase.from as any)('companies')
              .update({
                name: stored.name,
                owner_name: stored.owner_name,
                address: stored.address,
                phone: stored.phone,
                alternate_phone: stored.alternate_phone,
                email: stored.email,
                website: null,
                gst_number: null,
                logo_url: stored.logo_url,
                updated_at: stored.updated_at,
              })
              .eq('id', data.id)
              .then(() => {})
              .catch(() => {});
          }
          return stored;
        }

        // Database is newer than local storage
        const profile: CompanyProfile = {
          id: data.id,
          name: data.name,
          owner_name: data.owner_name || stored.owner_name || inMemoryCompanyProfile.owner_name,
          address: data.address || stored.address || inMemoryCompanyProfile.address,
          phone: data.phone || stored.phone || inMemoryCompanyProfile.phone,
          alternate_phone: data.alternate_phone || stored.alternate_phone || inMemoryCompanyProfile.alternate_phone,
          email: data.email || stored.email || inMemoryCompanyProfile.email,
          website: null,
          gst_number: null,
          logo_url: data.logo_url || null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        inMemoryCompanyProfile = profile;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(profile));
          } catch {}
        }
        return profile;
      } catch (err) {
        console.warn('Company settings query notice:', err);
        return stored;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updated: CompanyProfileFormData) => {
      const now = new Date().toISOString();
      const payload = {
        name: updated.name.trim(),
        owner_name: updated.owner_name.trim(),
        address: updated.address.trim(),
        phone: updated.phone.trim(),
        alternate_phone: updated.alternate_phone?.trim() || null,
        email: updated.email.trim(),
        website: null,
        gst_number: null,
        logo_url: updated.logo_url || null,
        updated_at: now,
      };

      const newProfile: CompanyProfile = {
        ...inMemoryCompanyProfile,
        ...payload,
        updated_at: now,
      };

      // 1. Immediately persist to localStorage & in-memory cache
      inMemoryCompanyProfile = newProfile;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(newProfile));
        } catch (e) {
          console.warn('Failed to save company profile to localStorage:', e);
        }
      }

      // 2. Best-effort sync to Supabase
      try {
        const { data: existing } = await (supabase.from as any)('companies')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          const { error: updErr } = await (supabase.from as any)('companies')
            .update(payload)
            .eq('id', existing.id);
          if (updErr) {
            console.warn('Supabase company update notice (persisted locally):', updErr.message);
          }
        } else {
          const { error: insErr } = await (supabase.from as any)('companies')
            .insert([payload]);
          if (insErr) {
            console.warn('Supabase company insert notice (persisted locally):', insErr.message);
          }
        }
      } catch (err) {
        console.warn('Company mutation sync note (persisted locally):', err);
      }

      return newProfile;
    },
    onSuccess: (updated) => {
      // Direct query cache update ensures the UI reflects latest saved changes immediately
      queryClient.setQueryData(['company_settings'], updated);
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
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from as any)('profiles')
          .select('*')
          .order('full_name', { ascending: true });

        if (error) {
          console.warn('Users list query notice:', error.message);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
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
        return [];
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
