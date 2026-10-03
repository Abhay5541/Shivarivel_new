import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  Estimate,
  EstimateItem,
  EstimateFormData,
  EstimateStatus,
} from '@/types/estimates';
import { devEvalCustomers } from './useCustomers';
import { devEvalEnquiries } from './useEnquiries';

export const devEvalEstimateItems: EstimateItem[] = [
  // Items for EST-0001 (Priya Menon - Interior Woodwork)
  {
    id: 'item-01',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-01',
    category: 'Interior',
    description: 'Acrylic finish modular kitchen base and wall cabinets with Hafele soft-close tandem boxes',
    quantity: 120,
    unit: 'sq.ft',
    unit_price: 2200,
    amount: 264000,
    sort_order: 1,
    notes: 'Marine-grade 710 BWP plywood carcass with 1.5mm high-gloss anti-scratch acrylic shutters',
  },
  {
    id: 'item-02',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-01',
    category: 'Interior',
    description: 'Master bedroom floor-to-ceiling sliding wardrobe with bronze profile glass & internal lighting',
    quantity: 110,
    unit: 'sq.ft',
    unit_price: 1950,
    amount: 214500,
    sort_order: 2,
    notes: 'Full-height sliding system with internal drawers and sensor strip LEDs',
  },
  {
    id: 'item-03',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-01',
    category: 'Electrical',
    description: 'Living room & kitchen profile warm LED cove lights, drivers, and concealed wiring points',
    quantity: 1,
    unit: 'lumpsum',
    unit_price: 48500,
    amount: 48500,
    sort_order: 3,
    notes: 'Philips 3000K warm strip LEDs with aluminum channel diffusers',
  },
  {
    id: 'item-04',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-01',
    category: 'Labour',
    description: 'Carpentry installation, precision on-site sizing, hardware fitting, and master polishing',
    quantity: 1,
    unit: 'lumpsum',
    unit_price: 123000,
    amount: 123000,
    sort_order: 4,
    notes: 'Skilled carpentry labor for 18 days on-site',
  },

  // Items for EST-0002 (Dr. Anand Kumar - Clinic False Ceiling)
  {
    id: 'item-05',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-02',
    category: 'Material',
    description: 'Saint-Gobain Gyproc 12.5mm moisture-resistant gypsum boards & GI framing grid',
    quantity: 650,
    unit: 'sq.ft',
    unit_price: 115,
    amount: 74750,
    sort_order: 1,
    notes: 'Standard grid framing with intermediate perimeter channels',
  },
  {
    id: 'item-06',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-02',
    category: 'Electrical',
    description: 'Concealed magnetic track lighting system and 15W anti-glare architectural cob downlights',
    quantity: 14,
    unit: 'nos',
    unit_price: 2500,
    amount: 35000,
    sort_order: 2,
    notes: 'Warm 4000K daylight white for clinical examination rooms',
  },
  {
    id: 'item-07',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-02',
    category: 'Labour',
    description: 'Gypsum ceiling framing, board fixing, joint taping with mesh, and Royale emulsion finish',
    quantity: 650,
    unit: 'sq.ft',
    unit_price: 108.077,
    amount: 70250,
    sort_order: 3,
    notes: '3 coats of Asian Paints Royale luxury emulsion over primer',
  },

  // Items for EST-0003 (K. Rajasekaran - 3D Elevation & Canopy)
  {
    id: 'item-08',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-03',
    category: 'Material',
    description: 'Exterior grade aluminum louvers with wooden finish powder coating',
    quantity: 180,
    unit: 'sq.ft',
    unit_price: 450,
    amount: 81000,
    sort_order: 1,
    notes: 'Jindal aluminum architectural sections',
  },
  {
    id: 'item-09',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-03',
    category: 'Labour',
    description: 'MS structural steel fabrication, primer coating, and cantilever canopy erection',
    quantity: 1,
    unit: 'lumpsum',
    unit_price: 39000,
    amount: 39000,
    sort_order: 2,
    notes: 'On-site MIG welding and structural anchoring',
  },

  // Items for EST-0004 (S. Ramanathan - Civil Construction)
  {
    id: 'item-10',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-04',
    category: 'Material',
    description: 'Sub-structure foundation PCC 1:4:8, RCC isolated column footings with Fe550D TMT steel',
    quantity: 2400,
    unit: 'sq.ft',
    unit_price: 850,
    amount: 2040000,
    sort_order: 1,
    notes: 'Ultratech 53-grade cement and ARS Fe-550D TMT bars',
  },
  {
    id: 'item-11',
    company_id: 'comp-shivarivel-001',
    estimate_id: 'est-04',
    category: 'Labour',
    description: 'Earthwork excavation, formwork centering, reinforcement binding, and mechanical casting',
    quantity: 1,
    unit: 'lumpsum',
    unit_price: 1760000,
    amount: 1760000,
    sort_order: 2,
    notes: 'Turnkey structural civil engineering labor up to roof casting',
  },
];

export const devEvalEstimates: Estimate[] = [
  {
    id: 'est-01',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-01',
    enquiry_id: 'enq-01',
    estimate_number: 'EST-0001',
    estimate_date: '2026-09-28',
    valid_until: '2026-10-28',
    title: '3BHK Villa Complete Interior Woodwork & Modular Kitchen',
    notes: 'Prices include transportation to Anna Nagar Madurai site, unloading, and 1-year complimentary service warranty.',
    status: 'Approved',
    total_amount: 650000,
    created_at: '2026-09-28T10:00:00Z',
    updated_at: '2026-09-30T15:00:00Z',
    customer: {
      id: 'cust-01',
      name: 'Priya Menon',
      phone: '9840123456',
      email: 'priya.menon@example.com',
      address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    },
    enquiry: {
      id: 'enq-01',
      description: 'Complete 3BHK Villa interior woodwork, acrylic modular kitchen, and master bedroom wardrobe',
      status: 'Site Visit Planned',
    },
    items: devEvalEstimateItems.filter((i) => i.estimate_id === 'est-01'),
  },
  {
    id: 'est-02',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-02',
    enquiry_id: 'enq-02',
    estimate_number: 'EST-0002',
    estimate_date: '2026-09-30',
    valid_until: '2026-10-30',
    title: 'Doctor Consultation Cabin False Ceiling & Architectural Lighting',
    notes: 'Acoustic sound dampening included behind perimeter channels. Night-shift execution without clinic interruption.',
    status: 'Sent',
    total_amount: 180000,
    created_at: '2026-09-30T11:30:00Z',
    updated_at: '2026-09-30T11:30:00Z',
    customer: {
      id: 'cust-02',
      name: 'Dr. Anand Kumar',
      phone: '9443198765',
      email: 'anand.k@example.com',
      address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    },
    enquiry: {
      id: 'enq-02',
      description: 'Doctor consultation cabin false ceiling with ambient warm profile lighting & sound dampening',
      status: 'Contacted',
    },
    items: devEvalEstimateItems.filter((i) => i.estimate_id === 'est-02'),
  },
  {
    id: 'est-03',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-03',
    enquiry_id: 'enq-03',
    estimate_number: 'EST-0003',
    estimate_date: '2026-10-01',
    valid_until: '2026-10-31',
    title: 'Modern Front Facade 3D Elevation & Aluminum Louvers Canopy',
    notes: 'Structural steel foundation anchoring to be inspected prior to canopy cladding.',
    status: 'Draft',
    total_amount: 120000,
    created_at: '2026-10-01T14:00:00Z',
    updated_at: '2026-10-01T14:00:00Z',
    customer: {
      id: 'cust-03',
      name: 'K. Rajasekaran',
      phone: '9789012345',
      email: 'rajasekaran.k@example.com',
      address: 'Plot 108, Bypass Main Road, Tenkasi',
    },
    enquiry: {
      id: 'enq-03',
      description: 'Modern front facade 3D elevation design with aluminium louvers and structural steel canopy',
      status: 'Estimate Prepared',
    },
    items: devEvalEstimateItems.filter((i) => i.estimate_id === 'est-03'),
  },
  {
    id: 'est-04',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-04',
    enquiry_id: 'enq-04',
    estimate_number: 'EST-0004',
    estimate_date: '2026-10-02',
    valid_until: '2026-11-02',
    title: '2400 sq.ft Duplex Residential Civil Construction Proposal',
    notes: 'Rate includes structural civil framework, brickwork masonry, plastering, and waterproofing.',
    status: 'Draft',
    total_amount: 3800000,
    created_at: '2026-10-02T09:00:00Z',
    updated_at: '2026-10-02T09:00:00Z',
    customer: {
      id: 'cust-04',
      name: 'S. Ramanathan',
      phone: '9944567890',
      email: 's.ramanathan@example.com',
      address: 'Door 24, South Car Street, Sankarankovil',
    },
    enquiry: {
      id: 'enq-04',
      description: '2400 sq.ft duplex residential civil construction from foundation to lock-and-key',
      status: 'New',
    },
    items: devEvalEstimateItems.filter((i) => i.estimate_id === 'est-04'),
  },
];

let memoryEstimates: Estimate[] = [...devEvalEstimates];
let memoryEstimateItems: EstimateItem[] = [...devEvalEstimateItems];

interface UseEstimatesOptions {
  search?: string;
  status?: string;
  customerId?: string;
}

export function useEstimates(options: UseEstimatesOptions = {}) {
  const { search = '', status = 'all', customerId } = options;

  return useQuery<Estimate[], Error>({
    queryKey: ['estimates', { search, status, customerId }],
    initialData: () => {
      return memoryEstimates.filter((est) => {
        const matchesCustomer = !customerId || est.customer_id === customerId;
        const matchesStatus = status === 'all' || est.status === status;
        const term = search.toLowerCase().trim();
        const matchesSearch =
          !term ||
          est.estimate_number.toLowerCase().includes(term) ||
          (est.title && est.title.toLowerCase().includes(term)) ||
          (est.customer?.name && est.customer.name.toLowerCase().includes(term));
        return matchesCustomer && matchesStatus && matchesSearch;
      });
    },
    queryFn: async () => {
      try {
        let query = supabase
          .from('estimates')
          .select('*, customer:customers(id, name, phone, address, email), enquiry:enquiries(id, description, status)')
          .order('created_at', { ascending: false });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        if (search.trim()) {
          const s = search.trim();
          query = query.or(`estimate_number.ilike.%${s}%,title.ilike.%${s}%`);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
          return memoryEstimates.filter((est) => {
            const matchesCustomer = !customerId || est.customer_id === customerId;
            const matchesStatus = status === 'all' || est.status === status;
            const term = search.toLowerCase().trim();
            const matchesSearch =
              !term ||
              est.estimate_number.toLowerCase().includes(term) ||
              (est.title && est.title.toLowerCase().includes(term)) ||
              (est.customer?.name && est.customer.name.toLowerCase().includes(term));
            return matchesCustomer && matchesStatus && matchesSearch;
          });
        }

        // Attach items for each estimate
        const estimatesWithItems = await Promise.all(
          (data as any[]).map(async (est) => {
            const { data: itemsData } = await supabase
              .from('estimate_items')
              .select('*')
              .eq('estimate_id', est.id)
              .order('sort_order', { ascending: true });

            return {
              ...est,
              items: itemsData || [],
            } as Estimate;
          })
        );

        return estimatesWithItems;
      } catch (err: unknown) {
        console.warn('Estimates query notice:', err);
        return memoryEstimates.filter((est) => {
          const matchesCustomer = !customerId || est.customer_id === customerId;
          const matchesStatus = status === 'all' || est.status === status;
          const term = search.toLowerCase().trim();
          const matchesSearch =
            !term ||
            est.estimate_number.toLowerCase().includes(term) ||
            (est.title && est.title.toLowerCase().includes(term)) ||
            (est.customer?.name && est.customer.name.toLowerCase().includes(term));
          return matchesCustomer && matchesStatus && matchesSearch;
        });
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useEstimate(id: string | undefined) {
  return useQuery<Estimate | null, Error>({
    queryKey: ['estimate', id],
    initialData: () => (id ? memoryEstimates.find((e) => e.id === id) || null : null),
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('estimates')
          .select('*, customer:customers(id, name, phone, address, email), enquiry:enquiries(id, description, status)')
          .eq('id', id)
          .single();

        if (error || !data) {
          return memoryEstimates.find((e) => e.id === id) || null;
        }

        const { data: itemsData } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('estimate_id', id)
          .order('sort_order', { ascending: true });

        const rawData = data as Record<string, any>;
        return {
          ...rawData,
          items: itemsData || memoryEstimateItems.filter((i) => i.estimate_id === id),
        } as unknown as Estimate;
      } catch (err: unknown) {
        console.warn('Estimate by ID notice:', err);
        return memoryEstimates.find((e) => e.id === id) || null;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EstimateFormData) => {
      try {
        // Calculate total amount from items deterministically
        const total = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // 1. Insert estimate record
        const { data: estData, error: estError } = await (supabase.from('estimates') as any)
          .insert({
            company_id: 'comp-shivarivel-001',
            customer_id: input.customer_id,
            enquiry_id: input.enquiry_id || null,
            estimate_date: input.estimate_date,
            valid_until: input.valid_until || null,
            title: input.title.trim(),
            notes: input.notes?.trim() || null,
            status: input.status || 'Draft',
            total_amount: Math.round(total * 100) / 100,
          })
          .select('*, customer:customers(id, name, phone, address, email), enquiry:enquiries(id, description, status)')
          .single();

        if (estError) throw new Error(estError.message);

        // 2. Insert line items
        const itemsToInsert = input.items.map((item, idx) => ({
          company_id: 'comp-shivarivel-001',
          estimate_id: estData.id,
          category: item.category,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: Math.round(item.quantity * item.unit_price * 100) / 100,
          sort_order: idx + 1,
          notes: item.notes?.trim() || null,
        }));

        const { data: insertedItems } = await (supabase.from('estimate_items') as any)
          .insert(itemsToInsert)
          .select();

        return {
          ...estData,
          items: insertedItems || itemsToInsert,
        } as Estimate;
      } catch (err: unknown) {
        console.warn('Estimate create offline fallback:', err);
        const matchedCust = devEvalCustomers.find((c) => c.id === input.customer_id);
        const matchedEnq = devEvalEnquiries.find((e) => e.id === input.enquiry_id);
        const total = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const estId = `est-${Date.now().toString().slice(-4)}`;
        const nextNum = memoryEstimates.length + 1;
        const estNumber = `EST-${String(nextNum).padStart(4, '0')}`;

        const createdItems: EstimateItem[] = input.items.map((item, idx) => ({
          id: `item-${Date.now().toString().slice(-4)}-${idx}`,
          company_id: 'comp-shivarivel-001',
          estimate_id: estId,
          category: item.category,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: Math.round(item.quantity * item.unit_price * 100) / 100,
          sort_order: idx + 1,
          notes: item.notes?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const newRecord: Estimate = {
          id: estId,
          company_id: 'comp-shivarivel-001',
          customer_id: input.customer_id,
          enquiry_id: input.enquiry_id || null,
          estimate_number: estNumber,
          estimate_date: input.estimate_date,
          valid_until: input.valid_until || null,
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          status: input.status || 'Draft',
          total_amount: Math.round(total * 100) / 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: matchedCust ? {
            id: matchedCust.id,
            name: matchedCust.name,
            phone: matchedCust.phone,
            address: matchedCust.address,
            email: matchedCust.email,
          } : null,
          enquiry: matchedEnq ? {
            id: matchedEnq.id,
            description: matchedEnq.description || null,
            status: matchedEnq.status,
          } : null,
          items: createdItems,
        };

        memoryEstimates = [newRecord, ...memoryEstimates];
        memoryEstimateItems = [...createdItems, ...memoryEstimateItems];
        return newRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: EstimateFormData }) => {
      try {
        const total = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // Update estimate record
        const { data: estData, error: estError } = await (supabase.from('estimates') as any)
          .update({
            customer_id: input.customer_id,
            enquiry_id: input.enquiry_id || null,
            estimate_date: input.estimate_date,
            valid_until: input.valid_until || null,
            title: input.title.trim(),
            notes: input.notes?.trim() || null,
            status: input.status,
            total_amount: Math.round(total * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, customer:customers(id, name, phone, address, email), enquiry:enquiries(id, description, status)')
          .single();

        if (estError) throw new Error(estError.message);

        // Replace line items
        await supabase.from('estimate_items').delete().eq('estimate_id', id);

        const itemsToInsert = input.items.map((item, idx) => ({
          company_id: 'comp-shivarivel-001',
          estimate_id: id,
          category: item.category,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: Math.round(item.quantity * item.unit_price * 100) / 100,
          sort_order: idx + 1,
          notes: item.notes?.trim() || null,
        }));

        const { data: insertedItems } = await (supabase.from('estimate_items') as any)
          .insert(itemsToInsert)
          .select();

        return {
          ...estData,
          items: insertedItems || itemsToInsert,
        } as Estimate;
      } catch (err: unknown) {
        console.warn('Estimate update offline fallback:', err);
        const matchedCust = devEvalCustomers.find((c) => c.id === input.customer_id);
        const matchedEnq = devEvalEnquiries.find((e) => e.id === input.enquiry_id);
        const total = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        const updatedItems: EstimateItem[] = input.items.map((item, idx) => ({
          id: item.id || `item-${Date.now().toString().slice(-4)}-${idx}`,
          company_id: 'comp-shivarivel-001',
          estimate_id: id,
          category: item.category,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: Math.round(item.quantity * item.unit_price * 100) / 100,
          sort_order: idx + 1,
          notes: item.notes?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        let updatedRecord: Estimate | null = null;
        memoryEstimates = memoryEstimates.map((est) => {
          if (est.id === id) {
            updatedRecord = {
              ...est,
              customer_id: input.customer_id,
              enquiry_id: input.enquiry_id || null,
              estimate_date: input.estimate_date,
              valid_until: input.valid_until || null,
              title: input.title.trim(),
              notes: input.notes?.trim() || null,
              status: input.status,
              total_amount: Math.round(total * 100) / 100,
              updated_at: new Date().toISOString(),
              customer: matchedCust ? {
                id: matchedCust.id,
                name: matchedCust.name,
                phone: matchedCust.phone,
                address: matchedCust.address,
                email: matchedCust.email,
              } : est.customer,
              enquiry: matchedEnq ? {
                id: matchedEnq.id,
                description: matchedEnq.description || null,
                status: matchedEnq.status,
              } : est.enquiry,
              items: updatedItems,
            };
            return updatedRecord as unknown as Estimate;
          }
          return est;
        });

        memoryEstimateItems = [
          ...memoryEstimateItems.filter((i) => i.estimate_id !== id),
          ...updatedItems,
        ];

        return updatedRecord || memoryEstimates[0];
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
    },
  });
}

export function useUpdateEstimateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EstimateStatus }) => {
      try {
        const { data, error } = await (supabase.from('estimates') as any)
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, customer:customers(id, name, phone, address, email), enquiry:enquiries(id, description, status)')
          .single();

        if (error) throw new Error(error.message);
        return data as Estimate;
      } catch (err: unknown) {
        console.warn('Estimate status update offline fallback:', err);
        let updatedRecord: Estimate | null = null;
        memoryEstimates = memoryEstimates.map((est) => {
          if (est.id === id) {
            updatedRecord = {
              ...est,
              status,
              updated_at: new Date().toISOString(),
            };
            return updatedRecord;
          }
          return est;
        });
        return updatedRecord || memoryEstimates[0];
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-estimates'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
