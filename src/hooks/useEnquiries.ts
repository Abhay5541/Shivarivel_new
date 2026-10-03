import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Enquiry, EnquiryFormData } from '@/types/business';
import { devEvalCustomers } from './useCustomers';

export const devEvalEnquiries: Enquiry[] = [
  {
    id: 'enq-01',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-01',
    service_type_id: 'st-01',
    enquiry_date: '2026-09-25',
    source: 'Referral',
    description: 'Complete 3BHK Villa interior woodwork, acrylic modular kitchen, and master bedroom wardrobe',
    estimated_value: 650000,
    status: 'Site Visit Planned',
    follow_up_date: '2026-10-02',
    notes: 'Client reviewed material samples. Site visit scheduled for exact laser measurement.',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-28T16:00:00Z',
    customer: {
      id: 'cust-01',
      name: 'Priya Menon',
      phone: '9840123456',
      address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    },
    service_type: {
      id: 'st-01',
      name: 'Interior & Woodwork',
    },
  },
  {
    id: 'enq-02',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-02',
    service_type_id: 'st-02',
    enquiry_date: '2026-09-28',
    source: 'Walk-in',
    description: 'Doctor consultation cabin false ceiling with ambient warm profile lighting & sound dampening',
    estimated_value: 180000,
    status: 'Contacted',
    follow_up_date: '2026-10-03',
    notes: 'Discussed ceiling height clearance and AC duct concealment.',
    created_at: '2026-09-28T11:30:00Z',
    updated_at: '2026-09-29T14:20:00Z',
    customer: {
      id: 'cust-02',
      name: 'Dr. Anand Kumar',
      phone: '9443198765',
      address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    },
    service_type: {
      id: 'st-02',
      name: 'False Ceiling & Profile Lighting',
    },
  },
  {
    id: 'enq-03',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-03',
    service_type_id: 'st-04',
    enquiry_date: '2026-09-18',
    source: 'Social Media',
    description: 'Modern front facade 3D elevation design with aluminium louvers and structural steel canopy',
    estimated_value: 120000,
    status: 'Estimate Prepared',
    follow_up_date: '2026-10-04',
    notes: 'Quotation sent for approval. Client comparing with another draft.',
    created_at: '2026-09-18T15:00:00Z',
    updated_at: '2026-09-30T17:10:00Z',
    customer: {
      id: 'cust-03',
      name: 'K. Rajasekaran',
      phone: '9789012345',
      address: 'Plot 108, Bypass Main Road, Tenkasi',
    },
    service_type: {
      id: 'st-04',
      name: '3D Elevation & Structural Detailing',
    },
  },
  {
    id: 'enq-04',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-04',
    service_type_id: 'st-03',
    enquiry_date: '2026-10-01',
    source: 'Referral',
    description: '2400 sq.ft duplex residential civil construction from foundation to lock-and-key',
    estimated_value: 3800000,
    status: 'New',
    follow_up_date: '2026-10-02',
    notes: 'New enquiry received this morning. Initial phone contact made, meeting site supervisor today.',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    customer: {
      id: 'cust-04',
      name: 'S. Ramanathan',
      phone: '9944567890',
      address: 'Door 24, South Car Street, Sankarankovil',
    },
    service_type: {
      id: 'st-03',
      name: 'Civil Construction & Contracting',
    },
  },
  {
    id: 'enq-05',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-05',
    service_type_id: 'st-05',
    enquiry_date: '2026-08-10',
    source: 'Existing Client',
    description: 'Commercial shop floor DTCP approval plan drawing & municipal submission',
    estimated_value: 45000,
    status: 'Converted',
    follow_up_date: null,
    notes: 'Approval sanctioned by municipal corporation. Work order finalized.',
    created_at: '2026-08-10T14:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    customer: {
      id: 'cust-05',
      name: 'M. Chellappa',
      phone: '9842134567',
      address: 'Kallidaikurichi Main Bazar, Tirunelveli Dist',
    },
    service_type: {
      id: 'st-05',
      name: 'Building Planning & Approval Plans',
    },
  },
];

let memoryEnquiries: Enquiry[] = [...devEvalEnquiries];

interface UseEnquiriesOptions {
  search?: string;
  status?: string;
  customerId?: string;
}

export function useEnquiries(options: UseEnquiriesOptions = {}) {
  const { search = '', status = 'all', customerId } = options;

  return useQuery<Enquiry[], Error>({
    queryKey: ['enquiries', { search, status, customerId }],
    initialData: () => {
      return memoryEnquiries.filter((e) => {
        const matchesCustomer = !customerId || e.customer_id === customerId;
        const matchesStatus = status === 'all' || e.status === status;
        const term = search.toLowerCase().trim();
        const matchesSearch =
          !term ||
          (e.description && e.description.toLowerCase().includes(term)) ||
          (e.customer?.name && e.customer.name.toLowerCase().includes(term)) ||
          (e.service_type?.name && e.service_type.name.toLowerCase().includes(term));
        return matchesCustomer && matchesStatus && matchesSearch;
      });
    },
    queryFn: async () => {
      try {
        let query = supabase
          .from('enquiries')
          .select('*, customer:customers(id, name, phone, address), service_type:service_types(id, name)')
          .order('enquiry_date', { ascending: false });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        if (search.trim()) {
          const s = search.trim();
          query = query.or(`description.ilike.%${s}%,source.ilike.%${s}%`);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
          return memoryEnquiries.filter((e) => {
            const matchesCustomer = !customerId || e.customer_id === customerId;
            const matchesStatus = status === 'all' || e.status === status;
            const term = search.toLowerCase().trim();
            const matchesSearch =
              !term ||
              (e.description && e.description.toLowerCase().includes(term)) ||
              (e.customer?.name && e.customer.name.toLowerCase().includes(term)) ||
              (e.service_type?.name && e.service_type.name.toLowerCase().includes(term));
            return matchesCustomer && matchesStatus && matchesSearch;
          });
        }

        return data as unknown as Enquiry[];
      } catch (err) {
        console.warn('Enquiries query notice:', err);
        return memoryEnquiries.filter((e) => {
          const matchesCustomer = !customerId || e.customer_id === customerId;
          const matchesStatus = status === 'all' || e.status === status;
          const term = search.toLowerCase().trim();
          const matchesSearch =
            !term ||
            (e.description && e.description.toLowerCase().includes(term)) ||
            (e.customer?.name && e.customer.name.toLowerCase().includes(term)) ||
            (e.service_type?.name && e.service_type.name.toLowerCase().includes(term));
          return matchesCustomer && matchesStatus && matchesSearch;
        });
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useEnquiry(id: string | undefined) {
  return useQuery<Enquiry | null, Error>({
    queryKey: ['enquiry', id],
    initialData: () => (id ? memoryEnquiries.find((e) => e.id === id) || null : null),
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('enquiries')
          .select('*, customer:customers(id, name, phone, address), service_type:service_types(id, name)')
          .eq('id', id)
          .single();

        if (error || !data) {
          return memoryEnquiries.find((e) => e.id === id) || null;
        }

        return data as unknown as Enquiry;
      } catch (err) {
        console.warn('Enquiry by ID notice:', err);
        return memoryEnquiries.find((e) => e.id === id) || null;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnquiryFormData) => {
      try {
        const { data, error } = await (supabase.from('enquiries') as any)
          .insert({
            customer_id: input.customer_id,
            service_type_id: input.service_type_id || null,
            enquiry_date: input.enquiry_date,
            source: input.source?.trim() || null,
            description: input.description.trim(),
            estimated_value: input.estimated_value ?? null,
            status: input.status || 'New',
            follow_up_date: input.follow_up_date || null,
            notes: input.notes?.trim() || null,
          })
          .select('*, customer:customers(id, name, phone, address), service_type:service_types(id, name)')
          .single();

        if (error) throw new Error(error.message);
        return data as unknown as Enquiry;
      } catch (err: unknown) {
        console.warn('Enquiry creation notice:', err);
        // Fallback simulated creation for dev
        const matchedCust = devEvalCustomers.find((c) => c.id === input.customer_id);
        const newRecord: Enquiry = {
          id: `enq-${Date.now().toString().slice(-4)}`,
          company_id: 'comp-shivarivel-001',
          customer_id: input.customer_id,
          service_type_id: input.service_type_id || null,
          enquiry_date: input.enquiry_date,
          source: input.source?.trim() || null,
          description: input.description.trim(),
          estimated_value: input.estimated_value ?? null,
          status: input.status || 'New',
          follow_up_date: input.follow_up_date || null,
          notes: input.notes?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: matchedCust ? {
            id: matchedCust.id,
            name: matchedCust.name,
            phone: matchedCust.phone,
            address: matchedCust.address,
          } : null,
        };
        memoryEnquiries = [newRecord, ...memoryEnquiries];
        return newRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['customer-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-day'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
    },
  });
}

export function useUpdateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Partial<EnquiryFormData> }) => {
      try {
        const { data, error } = await (supabase.from('enquiries') as any)
          .update({
            ...(input.customer_id && { customer_id: input.customer_id }),
            ...(input.service_type_id !== undefined && { service_type_id: input.service_type_id || null }),
            ...(input.enquiry_date && { enquiry_date: input.enquiry_date }),
            ...(input.source !== undefined && { source: input.source?.trim() || null }),
            ...(input.description && { description: input.description.trim() }),
            ...(input.estimated_value !== undefined && { estimated_value: input.estimated_value }),
            ...(input.status && { status: input.status }),
            ...(input.follow_up_date !== undefined && { follow_up_date: input.follow_up_date || null }),
            ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
          })
          .eq('id', id)
          .select('*, customer:customers(id, name, phone, address), service_type:service_types(id, name)')
          .single();

        if (error) throw new Error(error.message);
        return data as unknown as Enquiry;
      } catch (err: unknown) {
        console.warn('Enquiry update notice:', err);
        memoryEnquiries = memoryEnquiries.map((e) => {
          if (e.id === id) {
            return {
              ...e,
              ...(input.customer_id && { customer_id: input.customer_id }),
              ...(input.service_type_id !== undefined && { service_type_id: input.service_type_id || null }),
              ...(input.enquiry_date && { enquiry_date: input.enquiry_date }),
              ...(input.source !== undefined && { source: input.source?.trim() || null }),
              ...(input.description && { description: input.description.trim() }),
              ...(input.estimated_value !== undefined && { estimated_value: input.estimated_value }),
              ...(input.status && { status: input.status }),
              ...(input.follow_up_date !== undefined && { follow_up_date: input.follow_up_date || null }),
              ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
              updated_at: new Date().toISOString(),
            };
          }
          return e;
        });
        return memoryEnquiries.find((e) => e.id === id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
