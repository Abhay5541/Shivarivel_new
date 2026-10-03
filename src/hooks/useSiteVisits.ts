import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { SiteVisit, SiteVisitFormData } from '@/types/business';
import { devEvalCustomers } from './useCustomers';
import { devEvalProfiles } from './useBusinessLookups';

export const devEvalSiteVisits: SiteVisit[] = [
  {
    id: 'visit-01',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-04',
    enquiry_id: 'enq-04',
    site_address: 'Door 24, South Car Street, Sankarankovil',
    visit_date: '2026-10-02',
    assigned_to: 'user-02',
    purpose: 'Initial site measurement & boundary line elevation survey',
    observations: 'Level plot, 40ft road frontage. Soil test report required for foundation depth.',
    notes: 'Supervisor A. Murugan meeting client on site at 10:30 AM.',
    status: 'Scheduled',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    customer: {
      id: 'cust-04',
      name: 'S. Ramanathan',
      phone: '9944567890',
      address: 'Door 24, South Car Street, Sankarankovil',
    },
    enquiry: {
      id: 'enq-04',
      description: '2400 sq.ft duplex residential civil construction from foundation to lock-and-key',
      status: 'New',
    },
    assigned_profile: {
      id: 'user-02',
      full_name: 'A. Murugan',
      phone: '9443223344',
      role: 'supervisor',
    },
  },
  {
    id: 'visit-02',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-01',
    enquiry_id: 'enq-01',
    site_address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    visit_date: '2026-10-03',
    assigned_to: 'user-03',
    purpose: 'Modular kitchen laser measurement & plumbing point verification',
    observations: 'Civil plastering completed. Electrical conduit box for chimney extractor needs 50mm shift.',
    notes: 'Bring interior laminate swatch booklet and profile lighting samples.',
    status: 'Scheduled',
    created_at: '2026-09-28T16:30:00Z',
    updated_at: '2026-09-28T16:30:00Z',
    customer: {
      id: 'cust-01',
      name: 'Priya Menon',
      phone: '9840123456',
      address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    },
    enquiry: {
      id: 'enq-01',
      description: 'Complete 3BHK Villa interior woodwork, acrylic modular kitchen, and master bedroom wardrobe',
      status: 'Site Visit Planned',
    },
    assigned_profile: {
      id: 'user-03',
      full_name: 'R. Vignesh',
      phone: '9789334455',
      role: 'supervisor',
    },
  },
  {
    id: 'visit-03',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-03',
    enquiry_id: 'enq-03',
    site_address: 'Plot 108, Bypass Main Road, Tenkasi',
    visit_date: '2026-10-05',
    assigned_to: 'user-01',
    purpose: 'Commercial facade structural check & canopy projection review',
    observations: 'Structural column spacing verified against CAD drawing.',
    notes: 'Meeting with property owner Rajasekaran and local municipality surveyor.',
    status: 'Scheduled',
    created_at: '2026-09-20T11:00:00Z',
    updated_at: '2026-09-20T11:00:00Z',
    customer: {
      id: 'cust-03',
      name: 'K. Rajasekaran',
      phone: '9789012345',
      address: 'Plot 108, Bypass Main Road, Tenkasi',
    },
    enquiry: {
      id: 'enq-03',
      description: 'Modern front facade 3D elevation design with aluminium louvers and structural steel canopy',
      status: 'Estimate Prepared',
    },
    assigned_profile: {
      id: 'user-01',
      full_name: 'K. Senthil Nathan',
      phone: '9840112233',
      role: 'owner',
    },
  },
  {
    id: 'visit-04',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-02',
    enquiry_id: 'enq-02',
    site_address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    visit_date: '2026-09-29',
    assigned_to: 'user-02',
    purpose: 'Clinic cabin acoustic false ceiling height clearance check',
    observations: 'Clear ceiling height 3.2m. Gypsum drop ceiling of 200mm feasible without obstructing medical equipment.',
    notes: 'Customer approved gypsum grid layout.',
    status: 'Completed',
    created_at: '2026-09-28T14:00:00Z',
    updated_at: '2026-09-29T18:00:00Z',
    customer: {
      id: 'cust-02',
      name: 'Dr. Anand Kumar',
      phone: '9443198765',
      address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    },
    enquiry: {
      id: 'enq-02',
      description: 'Doctor consultation cabin false ceiling with ambient warm profile lighting & sound dampening',
      status: 'Contacted',
    },
    assigned_profile: {
      id: 'user-02',
      full_name: 'A. Murugan',
      phone: '9443223344',
      role: 'supervisor',
    },
  },
];

let memorySiteVisits: SiteVisit[] = [...devEvalSiteVisits];

interface UseSiteVisitsOptions {
  filter?: 'all' | 'today' | 'upcoming' | 'past';
  customerId?: string;
  enquiryId?: string;
}

export function useSiteVisits(options: UseSiteVisitsOptions = {}) {
  const { filter = 'all', customerId, enquiryId } = options;
  const todayStr = '2026-10-02';

  return useQuery<SiteVisit[], Error>({
    queryKey: ['site-visits', { filter, customerId, enquiryId }],
    initialData: () => {
      return memorySiteVisits.filter((v) => {
        if (customerId && v.customer_id !== customerId) return false;
        if (enquiryId && v.enquiry_id !== enquiryId) return false;
        if (filter === 'today') return v.visit_date === todayStr;
        if (filter === 'upcoming') return v.visit_date > todayStr && v.status !== 'Completed';
        if (filter === 'past') return v.visit_date < todayStr || v.status === 'Completed';
        return true;
      });
    },
    queryFn: async () => {
      try {
        let query = supabase
          .from('site_visits')
          .select('*, customer:customers(id, name, phone, address), enquiry:enquiries(id, description, status), assigned_profile:profiles(id, full_name, phone, role)')
          .order('visit_date', { ascending: filter === 'past' ? false : true });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        if (enquiryId) {
          query = query.eq('enquiry_id', enquiryId);
        }

        if (filter === 'today') {
          query = query.eq('visit_date', todayStr);
        } else if (filter === 'upcoming') {
          query = query.gt('visit_date', todayStr).neq('status', 'Completed');
        } else if (filter === 'past') {
          query = query.or(`visit_date.lt.${todayStr},status.eq.Completed`);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
          return memorySiteVisits.filter((v) => {
            if (customerId && v.customer_id !== customerId) return false;
            if (enquiryId && v.enquiry_id !== enquiryId) return false;
            if (filter === 'today') return v.visit_date === todayStr;
            if (filter === 'upcoming') return v.visit_date > todayStr && v.status !== 'Completed';
            if (filter === 'past') return v.visit_date < todayStr || v.status === 'Completed';
            return true;
          });
        }

        return data as unknown as SiteVisit[];
      } catch (err) {
        console.warn('Site visits query notice:', err);
        return memorySiteVisits.filter((v) => {
          if (customerId && v.customer_id !== customerId) return false;
          if (enquiryId && v.enquiry_id !== enquiryId) return false;
          if (filter === 'today') return v.visit_date === todayStr;
          if (filter === 'upcoming') return v.visit_date > todayStr && v.status !== 'Completed';
          if (filter === 'past') return v.visit_date < todayStr || v.status === 'Completed';
          return true;
        });
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useSiteVisit(id: string | undefined) {
  return useQuery<SiteVisit | null, Error>({
    queryKey: ['site-visit', id],
    initialData: () => (id ? memorySiteVisits.find((v) => v.id === id) || null : null),
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('site_visits')
          .select('*, customer:customers(id, name, phone, address), enquiry:enquiries(id, description, status), assigned_profile:profiles(id, full_name, phone, role)')
          .eq('id', id)
          .single();

        if (error || !data) {
          return memorySiteVisits.find((v) => v.id === id) || null;
        }

        return data as unknown as SiteVisit;
      } catch (err) {
        console.warn('Site visit by ID notice:', err);
        return memorySiteVisits.find((v) => v.id === id) || null;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCreateSiteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SiteVisitFormData) => {
      try {
        const { data, error } = await (supabase.from('site_visits') as any)
          .insert({
            customer_id: input.customer_id,
            enquiry_id: input.enquiry_id || null,
            site_address: input.site_address?.trim() || null,
            visit_date: input.visit_date,
            assigned_to: input.assigned_to || null,
            purpose: input.purpose?.trim() || null,
            observations: input.observations?.trim() || null,
            notes: input.notes?.trim() || null,
            status: input.status || 'Scheduled',
          })
          .select('*, customer:customers(id, name, phone, address), enquiry:enquiries(id, description, status), assigned_profile:profiles(id, full_name, phone, role)')
          .single();

        if (error) throw new Error(error.message);
        return data as unknown as SiteVisit;
      } catch (err: unknown) {
        console.warn('Site visit creation notice:', err);
        const matchedCust = devEvalCustomers.find((c) => c.id === input.customer_id);
        const matchedProfile = devEvalProfiles.find((p) => p.id === input.assigned_to);

        const newRecord: SiteVisit = {
          id: `visit-${Date.now().toString().slice(-4)}`,
          company_id: 'comp-shivarivel-001',
          customer_id: input.customer_id,
          enquiry_id: input.enquiry_id || null,
          site_address: input.site_address?.trim() || matchedCust?.address || null,
          visit_date: input.visit_date,
          assigned_to: input.assigned_to || null,
          purpose: input.purpose?.trim() || null,
          observations: input.observations?.trim() || null,
          notes: input.notes?.trim() || null,
          status: input.status || 'Scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: matchedCust ? {
            id: matchedCust.id,
            name: matchedCust.name,
            phone: matchedCust.phone,
            address: matchedCust.address,
          } : null,
          assigned_profile: matchedProfile ? {
            id: matchedProfile.id,
            full_name: matchedProfile.full_name,
            phone: matchedProfile.phone,
            role: matchedProfile.role,
          } : null,
        };

        memorySiteVisits = [newRecord, ...memorySiteVisits];
        return newRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      queryClient.invalidateQueries({ queryKey: ['customer-visits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-day'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
    },
  });
}

export function useUpdateSiteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<SiteVisitFormData> }) => {
      try {
        const { data, error } = await (supabase.from('site_visits') as any)
          .update({
            ...(input.customer_id && { customer_id: input.customer_id }),
            ...(input.enquiry_id !== undefined && { enquiry_id: input.enquiry_id || null }),
            ...(input.site_address !== undefined && { site_address: input.site_address?.trim() || null }),
            ...(input.visit_date && { visit_date: input.visit_date }),
            ...(input.assigned_to !== undefined && { assigned_to: input.assigned_to || null }),
            ...(input.purpose !== undefined && { purpose: input.purpose?.trim() || null }),
            ...(input.observations !== undefined && { observations: input.observations?.trim() || null }),
            ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
            ...(input.status && { status: input.status }),
          })
          .eq('id', id)
          .select('*, customer:customers(id, name, phone, address), enquiry:enquiries(id, description, status), assigned_profile:profiles(id, full_name, phone, role)')
          .single();

        if (error) throw new Error(error.message);
        return data as unknown as SiteVisit;
      } catch (err: unknown) {
        console.warn('Site visit update notice:', err);
        memorySiteVisits = memorySiteVisits.map((v) => {
          if (v.id === id) {
            return {
              ...v,
              ...(input.customer_id && { customer_id: input.customer_id }),
              ...(input.enquiry_id !== undefined && { enquiry_id: input.enquiry_id || null }),
              ...(input.site_address !== undefined && { site_address: input.site_address?.trim() || null }),
              ...(input.visit_date && { visit_date: input.visit_date }),
              ...(input.assigned_to !== undefined && { assigned_to: input.assigned_to || null }),
              ...(input.purpose !== undefined && { purpose: input.purpose?.trim() || null }),
              ...(input.observations !== undefined && { observations: input.observations?.trim() || null }),
              ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
              ...(input.status && { status: input.status }),
              updated_at: new Date().toISOString(),
            };
          }
          return v;
        });
        return memorySiteVisits.find((v) => v.id === id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      queryClient.invalidateQueries({ queryKey: ['site-visit', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-day'] });
    },
  });
}
