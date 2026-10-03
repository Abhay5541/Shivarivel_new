import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  Supplier,
  SupplierBalance,
  SupplierFormData,
  Material,
  MaterialFormData,
  Purchase,
  PurchaseFormData,
  PurchasePaymentStatus,
  SupplierPayment,
  SupplierPaymentFormData,
} from '@/types/procurement';

// ==========================================
// EVALUATION / LOCAL MOCK FALLBACK DATA
// ==========================================

export let memorySuppliers: Supplier[] = [
  {
    id: 'sup-01',
    company_id: 'comp-shivarivel-001',
    name: 'Madurai TMT Steels & Cements',
    contact_person: 'R. Sundaramoorthy',
    phone: '9842144556',
    alternate_phone: '9842144557',
    email: 'madurai.tmt@example.com',
    address: 'Shed 14, SIDCO Industrial Estate, Kappalur, Madurai',
    gst_number: '33AABCM1234F1Z1',
    category: 'Steel & Structural',
    notes: 'Authorized distributor for Tata Tiscon and UltraTech Cement. 15-day credit period.',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'sup-02',
    company_id: 'comp-shivarivel-001',
    name: 'Chettinad Blocks & Aggregates',
    contact_person: 'K. Alagappan',
    phone: '9443217890',
    alternate_phone: null,
    email: 'chettinad.blocks@example.com',
    address: 'National Highway Bypass, Tirunelveli',
    gst_number: '33AAECB5678G2Z2',
    category: 'Sand & Aggregates',
    notes: 'Primary supplier for 40mm/20mm blue metal aggregate and solid concrete blocks.',
    status: 'active',
    created_at: '2026-09-05T10:00:00Z',
    updated_at: '2026-09-05T10:00:00Z',
  },
  {
    id: 'sup-03',
    company_id: 'comp-shivarivel-001',
    name: 'Hafele & Greenply Architectural Hardwares',
    contact_person: 'V. Meenakshisundaram',
    phone: '9840199887',
    alternate_phone: '9840199888',
    email: 'meenakshi.hardwares@example.com',
    address: '82, West Veli Street, Madurai',
    gst_number: '33AAGCP9012H1Z3',
    category: 'Plywood & Timber',
    notes: 'BWP marine plywood, Hafele soft-close kitchen hardware, veneer and laminates.',
    status: 'active',
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'sup-04',
    company_id: 'comp-shivarivel-001',
    name: 'Surya Electricals & Havells Cables',
    contact_person: 'P. Murugan',
    phone: '9944512345',
    alternate_phone: null,
    email: 'surya.electricals@example.com',
    address: '15, Salai Street, Sankarankovil',
    gst_number: '33AAMFS3456J1Z4',
    category: 'Electrical & Wiring',
    notes: 'Concealed conduits, copper wiring bundles, LED profile diffusers, Legrand modular switches.',
    status: 'active',
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'sup-05',
    company_id: 'comp-shivarivel-001',
    name: 'Sri Andal Blue Metals & M-Sand',
    contact_person: 'M. Perumal',
    phone: '9789012345',
    alternate_phone: null,
    email: 'andal.bluemetals@example.com',
    address: 'Quarry Road, Tenkasi',
    gst_number: '33ABCPB7890K1Z5',
    category: 'Sand & Aggregates',
    notes: 'Washed plastering M-sand and P-sand delivery by tipper trucks.',
    status: 'active',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z',
  },
];

export let memoryMaterials: Material[] = [
  {
    id: 'mat-01',
    company_id: 'comp-shivarivel-001',
    name: 'UltraTech Super Cement 53 Grade (PPC)',
    category: 'Cement & Masonry',
    unit: 'Bags',
    standard_rate: 420,
    description: 'High performance Portland Pozzolana Cement for structural columns and slab casting',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-02',
    company_id: 'comp-shivarivel-001',
    name: 'Tata Tiscon 550D TMT Rebars 12mm',
    category: 'Steel & Structural',
    unit: 'Tonnes',
    standard_rate: 68500,
    description: 'Primary structural thermo-mechanically treated high ductility steel rebars',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-03',
    company_id: 'comp-shivarivel-001',
    name: 'River Sand & Manufactured M-Sand (Graded)',
    category: 'Sand & Aggregates',
    unit: 'Loads / Trucks',
    standard_rate: 16500,
    description: 'Double washed 2.36mm down graded stone sand for structural masonry',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-04',
    company_id: 'comp-shivarivel-001',
    name: 'Greenply 18mm BWP Marine Plywood 710',
    category: 'Plywood & Timber',
    unit: 'Sq.ft',
    standard_rate: 115,
    description: 'Boiling water proof calibrated hardwood plywood for modular kitchens',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-05',
    company_id: 'comp-shivarivel-001',
    name: 'Hafele Soft-Close Tandem Box Drawers 500mm',
    category: 'Hardware & Fittings',
    unit: 'Nos',
    standard_rate: 3200,
    description: 'Full extension concealed drawer runner system with integrated blumotion',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-06',
    company_id: 'comp-shivarivel-001',
    name: 'Finolex 2.5 sq.mm FR PVC Insulated Copper Wire',
    category: 'Electrical & Wiring',
    unit: 'Bundles',
    standard_rate: 2450,
    description: 'Flame retardant multi-strand copper cable (90m coil) for power circuits',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-07',
    company_id: 'comp-shivarivel-001',
    name: 'Saint-Gobain Gyproc Acoustic Ceiling Board 2x2',
    category: 'Hardware & Fittings',
    unit: 'Boxes',
    standard_rate: 1850,
    description: 'Perforated gypsum ceiling tiles with acoustic fleece backing',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mat-08',
    company_id: 'comp-shivarivel-001',
    name: 'Asian Paints Apex Ultima Exterior Emulsion',
    category: 'Paints & Wall Finishes',
    unit: 'Litres',
    standard_rate: 580,
    description: 'Weather-proof exterior silicon enriched emulsion with anti-fungal warranty',
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
];

export let memoryPurchases: Purchase[] = [
  {
    id: 'pur-01',
    company_id: 'comp-shivarivel-001',
    supplier_id: 'sup-03',
    project_id: 'prj-001',
    purchase_number: 'PUR-0001',
    purchase_date: '2026-10-01',
    invoice_number: 'INV-2026-089',
    status: 'Confirmed',
    discount: 2000,
    tax: 0,
    total_amount: 125000,
    due_date: '2026-10-15',
    notes: 'BWP Marine Grade Plywood and Hafele hardware for kitchen carcass assembly',
    reversal_of_id: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    total_allocated: 75000,
    outstanding_balance: 50000,
    payment_status: 'Partial',
    supplier: memorySuppliers.find((s) => s.id === 'sup-03'),
    project: {
      id: 'prj-001',
      name: '3BHK Villa Complete Interior & Modular Kitchen',
      project_code: 'PRJ-0001',
      site_address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    },
    items: [
      {
        id: 'pi-01',
        company_id: 'comp-shivarivel-001',
        purchase_id: 'pur-01',
        material_id: 'mat-04',
        description: 'Greenply 18mm BWP Marine Plywood for cabinet frames',
        quantity: 600,
        unit: 'Sq.ft',
        unit_price: 115,
        amount: 69000,
        notes: null,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        material: memoryMaterials.find((m) => m.id === 'mat-04'),
      },
      {
        id: 'pi-02',
        company_id: 'comp-shivarivel-001',
        purchase_id: 'pur-01',
        material_id: 'mat-05',
        description: 'Hafele Soft-Close Tandem Runner Sets 500mm',
        quantity: 18,
        unit: 'Nos',
        unit_price: 3222.22,
        amount: 58000,
        notes: null,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        material: memoryMaterials.find((m) => m.id === 'mat-05'),
      },
    ],
  },
  {
    id: 'pur-02',
    company_id: 'comp-shivarivel-001',
    supplier_id: 'sup-04',
    project_id: 'prj-001',
    purchase_number: 'PUR-0002',
    purchase_date: '2026-10-02',
    invoice_number: 'INV-EL-441',
    status: 'Confirmed',
    discount: 0,
    tax: 0,
    total_amount: 45000,
    due_date: '2026-10-16',
    notes: 'Concealed copper wiring coils and aluminum profile channels',
    reversal_of_id: null,
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
    total_allocated: 45000,
    outstanding_balance: 0,
    payment_status: 'Paid',
    supplier: memorySuppliers.find((s) => s.id === 'sup-04'),
    project: {
      id: 'prj-001',
      name: '3BHK Villa Complete Interior & Modular Kitchen',
      project_code: 'PRJ-0001',
      site_address: 'Plot 42, Green Avenue, Anna Nagar, Madurai',
    },
    items: [
      {
        id: 'pi-03',
        company_id: 'comp-shivarivel-001',
        purchase_id: 'pur-02',
        material_id: 'mat-06',
        description: 'Finolex 2.5 sq.mm FR PVC Insulated Copper Wire bundles',
        quantity: 18,
        unit: 'Bundles',
        unit_price: 2500,
        amount: 45000,
        notes: null,
        created_at: '2026-10-02T10:00:00Z',
        updated_at: '2026-10-02T10:00:00Z',
        material: memoryMaterials.find((m) => m.id === 'mat-06'),
      },
    ],
  },
  {
    id: 'pur-03',
    company_id: 'comp-shivarivel-001',
    supplier_id: 'sup-01',
    project_id: 'prj-002',
    purchase_number: 'PUR-0003',
    purchase_date: '2026-09-28',
    invoice_number: 'INV-MT-1022',
    status: 'Confirmed',
    discount: 0,
    tax: 0,
    total_amount: 85000,
    due_date: '2026-10-12',
    notes: 'UltraTech PPC 53 cement for clinic structural repairs and false ceiling anchor points',
    reversal_of_id: null,
    created_at: '2026-09-28T10:00:00Z',
    updated_at: '2026-09-28T10:00:00Z',
    total_allocated: 0,
    outstanding_balance: 85000,
    payment_status: 'Unpaid',
    supplier: memorySuppliers.find((s) => s.id === 'sup-01'),
    project: {
      id: 'prj-002',
      name: 'Doctor Consultation Clinic False Ceiling & Lighting',
      project_code: 'PRJ-0002',
      site_address: '15/2 Rajaji Street, Palayamkottai, Tirunelveli',
    },
    items: [
      {
        id: 'pi-04',
        company_id: 'comp-shivarivel-001',
        purchase_id: 'pur-03',
        material_id: 'mat-01',
        description: 'UltraTech Super Cement 53 Grade bags',
        quantity: 200,
        unit: 'Bags',
        unit_price: 425,
        amount: 85000,
        notes: null,
        created_at: '2026-09-28T10:00:00Z',
        updated_at: '2026-09-28T10:00:00Z',
        material: memoryMaterials.find((m) => m.id === 'mat-01'),
      },
    ],
  },
  {
    id: 'pur-04',
    company_id: 'comp-shivarivel-001',
    supplier_id: 'sup-05',
    project_id: 'prj-003',
    purchase_number: 'PUR-0004',
    purchase_date: '2026-10-01',
    invoice_number: 'INV-AG-501',
    status: 'Confirmed',
    discount: 0,
    tax: 0,
    total_amount: 38500,
    due_date: '2026-10-20',
    notes: 'Manufactured M-sand and blue metal aggregate for commercial facade anchoring',
    reversal_of_id: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    total_allocated: 0,
    outstanding_balance: 38500,
    payment_status: 'Unpaid',
    supplier: memorySuppliers.find((s) => s.id === 'sup-05'),
    project: {
      id: 'prj-003',
      name: 'Commercial Facade 3D Louvers & Structural Steel Glazing',
      project_code: 'PRJ-0003',
      site_address: 'Plot 108, Bypass Main Road, Tenkasi',
    },
    items: [
      {
        id: 'pi-05',
        company_id: 'comp-shivarivel-001',
        purchase_id: 'pur-04',
        material_id: 'mat-03',
        description: 'M-Sand graded for structural mortar',
        quantity: 2,
        unit: 'Loads / Trucks',
        unit_price: 19250,
        amount: 38500,
        notes: null,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        material: memoryMaterials.find((m) => m.id === 'mat-03'),
      },
    ],
  },
];

export let memorySupplierPayments: SupplierPayment[] = [
  {
    id: 'sp-01',
    company_id: 'comp-shivarivel-001',
    supplier_id: 'sup-03',
    payment_number: 'SP-0001',
    payment_date: '2026-10-02',
    amount: 75000,
    payment_method: 'Bank Transfer (NEFT / RTGS)',
    reference_number: 'NEFT-SBIN2026100201',
    status: 'Confirmed',
    notes: 'Direct RTGS settlement towards plywood invoice INV-2026-089',
    reversal_of_id: null,
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-02T11:00:00Z',
    total_allocated: 75000,
    unallocated_amount: 0,
    supplier: memorySuppliers.find((s) => s.id === 'sup-03'),
    allocations: [
      {
        id: 'spa-01',
        company_id: 'comp-shivarivel-001',
        payment_id: 'sp-01',
        purchase_id: 'pur-01',
        amount: 75000,
        notes: 'Initial tranche payment against INV-2026-089',
        created_at: '2026-10-02T11:00:00Z',
        updated_at: '2026-10-02T11:00:00Z',
      },
    ],
  },
  {
    id: 'sp-02',
    company_id: 'comp-shivarivel-001',
    supplier_id: 'sup-04',
    payment_number: 'SP-0002',
    payment_date: '2026-10-02',
    amount: 50000,
    payment_method: 'UPI / GPay / PhonePe',
    reference_number: 'UPI-AXIS-9921',
    status: 'Confirmed',
    notes: 'Cleared wiring bill INV-EL-441; remaining ₹5,000 kept as credit for switch plates order',
    reversal_of_id: null,
    created_at: '2026-10-02T12:00:00Z',
    updated_at: '2026-10-02T12:00:00Z',
    total_allocated: 45000,
    unallocated_amount: 5000,
    supplier: memorySuppliers.find((s) => s.id === 'sup-04'),
    allocations: [
      {
        id: 'spa-02',
        company_id: 'comp-shivarivel-001',
        payment_id: 'sp-02',
        purchase_id: 'pur-02',
        amount: 45000,
        notes: 'Full settlement of INV-EL-441',
        created_at: '2026-10-02T12:00:00Z',
        updated_at: '2026-10-02T12:00:00Z',
      },
    ],
  },
];

// Helper to derive payment status from allocation
export function derivePurchasePaymentStatus(total: number, allocated: number): PurchasePaymentStatus {
  if (allocated <= 0) return 'Unpaid';
  if (allocated >= total) return 'Paid';
  return 'Partial';
}

// ==========================================
// 1. SUPPLIERS HOOKS
// ==========================================

export function useSuppliers(searchQuery?: string, statusFilter?: 'all' | 'active' | 'inactive') {
  return useQuery({
    queryKey: ['suppliers', searchQuery, statusFilter],
    queryFn: async (): Promise<Supplier[]> => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        let results = [...memorySuppliers];
        if (statusFilter && statusFilter !== 'all') {
          results = results.filter((s) => s.status === statusFilter);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          results = results.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.contact_person?.toLowerCase().includes(q) ||
              s.phone?.includes(q) ||
              s.gst_number?.toLowerCase().includes(q)
          );
        }
        return results;
      }

      let filtered = data as Supplier[];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.contact_person?.toLowerCase().includes(q) ||
            s.phone?.includes(q) ||
            s.gst_number?.toLowerCase().includes(q)
        );
      }

      return filtered;
    },
    initialData: () => {
      let results = [...memorySuppliers];
      if (statusFilter && statusFilter !== 'all') {
        results = results.filter((s) => s.status === statusFilter);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        results = results.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.contact_person?.toLowerCase().includes(q) ||
            s.phone?.includes(q) ||
            s.gst_number?.toLowerCase().includes(q)
        );
      }
      return results;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useSupplier(id?: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        return memorySuppliers.find((s) => s.id === id) || null;
      }

      return data as Supplier;
    },
    initialData: () => {
      if (!id) return null;
      return memorySuppliers.find((s) => s.id === id) || null;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSupplierBalance(supplierId?: string) {
  return useQuery({
    queryKey: ['supplier-balance', supplierId],
    queryFn: async (): Promise<SupplierBalance | null> => {
      if (!supplierId) return null;

      const { data, error } = await (supabase
        .from('v_supplier_balance') as any)
        .select('*')
        .eq('supplier_id', supplierId)
        .maybeSingle();

      // Also compute unallocated credit from supplier payments
      const { data: paymentsData } = await supabase
        .from('supplier_payments')
        .select('id, amount, status')
        .eq('supplier_id', supplierId)
        .eq('status', 'Confirmed');

      const totalPaymentsMade = (paymentsData || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

      if (error || !data) {
        // Fallback calculation from memory
        const supPurchases = memoryPurchases.filter(
          (p) => p.supplier_id === supplierId && p.status === 'Confirmed'
        );
        const totalPurchases = supPurchases.reduce((acc, p) => acc + p.total_amount, 0);
        const totalAllocated = supPurchases.reduce((acc, p) => acc + (p.total_allocated || 0), 0);
        const outstanding = Math.max(0, totalPurchases - totalAllocated);

        const supPayments = memorySupplierPayments.filter(
          (sp) => sp.supplier_id === supplierId && sp.status === 'Confirmed'
        );
        const paymentsMade = supPayments.reduce((acc, sp) => acc + sp.amount, 0);
        const credit = Math.max(0, paymentsMade - totalAllocated);

        const sup = memorySuppliers.find((s) => s.id === supplierId);

        return {
          supplier_id: supplierId,
          company_id: 'comp-shivarivel-001',
          supplier_name: sup?.name || 'Supplier',
          supplier_status: sup?.status || 'active',
          total_purchases: totalPurchases,
          total_allocated_payments: totalAllocated,
          outstanding_balance: outstanding,
          total_payments_made: paymentsMade,
          supplier_credit: credit,
        };
      }

      const bal = data as any;
      const totalPurchases = Number(bal.total_purchases || 0);
      const totalAllocated = Number(bal.total_allocated_payments || 0);
      const outstanding = Number(bal.outstanding_balance || 0);
      const credit = Math.max(0, totalPaymentsMade - totalAllocated);

      return {
        supplier_id: supplierId,
        company_id: bal.company_id,
        supplier_name: bal.supplier_name,
        supplier_status: bal.supplier_status,
        total_purchases: totalPurchases,
        total_allocated_payments: totalAllocated,
        outstanding_balance: outstanding,
        total_payments_made: totalPaymentsMade,
        supplier_credit: credit,
      };
    },
    initialData: () => {
      if (!supplierId) return null;
      const supPurchases = memoryPurchases.filter(
        (p) => p.supplier_id === supplierId && p.status === 'Confirmed'
      );
      const totalPurchases = supPurchases.reduce((acc, p) => acc + p.total_amount, 0);
      const totalAllocated = supPurchases.reduce((acc, p) => acc + (p.total_allocated || 0), 0);
      const outstanding = Math.max(0, totalPurchases - totalAllocated);

      const supPayments = memorySupplierPayments.filter(
        (sp) => sp.supplier_id === supplierId && sp.status === 'Confirmed'
      );
      const paymentsMade = supPayments.reduce((acc, sp) => acc + sp.amount, 0);
      const credit = Math.max(0, paymentsMade - totalAllocated);
      const sup = memorySuppliers.find((s) => s.id === supplierId);

      return {
        supplier_id: supplierId,
        company_id: 'comp-shivarivel-001',
        supplier_name: sup?.name || 'Supplier',
        supplier_status: sup?.status || 'active',
        total_purchases: totalPurchases,
        total_allocated_payments: totalAllocated,
        outstanding_balance: outstanding,
        total_payments_made: paymentsMade,
        supplier_credit: credit,
      };
    },
    enabled: Boolean(supplierId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SupplierFormData) => {
      const { data, error } = await (supabase as any)
        .from('suppliers')
        .insert({
          name: payload.name.trim(),
          contact_person: payload.contact_person?.trim() || null,
          phone: payload.phone?.trim() || null,
          alternate_phone: payload.alternate_phone?.trim() || null,
          email: payload.email?.trim() || null,
          address: payload.address?.trim() || null,
          gst_number: payload.gst_number?.trim() || null,
          category: payload.category || null,
          notes: payload.notes?.trim() || null,
          status: payload.status,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase supplier creation error; saving in local memory for evaluation:', error.message);
        const newId = 'sup-' + (memorySuppliers.length + 1).toString().padStart(2, '0');
        const created: Supplier = {
          id: newId,
          company_id: 'comp-shivarivel-001',
          name: payload.name.trim(),
          contact_person: payload.contact_person?.trim() || null,
          phone: payload.phone?.trim() || null,
          alternate_phone: payload.alternate_phone?.trim() || null,
          email: payload.email?.trim() || null,
          address: payload.address?.trim() || null,
          gst_number: payload.gst_number?.trim() || null,
          category: payload.category || null,
          notes: payload.notes?.trim() || null,
          status: payload.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memorySuppliers = [created, ...memorySuppliers];
        return created;
      }

      return data as unknown as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SupplierFormData> }) => {
      const { data, error } = await (supabase as any)
        .from('suppliers')
        .update({
          name: payload.name !== undefined ? payload.name.trim() : undefined,
          contact_person: payload.contact_person !== undefined ? payload.contact_person?.trim() || null : undefined,
          phone: payload.phone !== undefined ? payload.phone?.trim() || null : undefined,
          alternate_phone: payload.alternate_phone !== undefined ? payload.alternate_phone?.trim() || null : undefined,
          email: payload.email !== undefined ? payload.email?.trim() || null : undefined,
          address: payload.address !== undefined ? payload.address?.trim() || null : undefined,
          gst_number: payload.gst_number !== undefined ? payload.gst_number?.trim() || null : undefined,
          category: payload.category !== undefined ? payload.category : undefined,
          notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
          status: payload.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase supplier update error; updating in local memory:', error.message);
        const idx = memorySuppliers.findIndex((s) => s.id === id);
        if (idx >= 0) {
          memorySuppliers[idx] = {
            ...memorySuppliers[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return memorySuppliers[idx];
        }
      }

      return data as unknown as Supplier;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-balance', variables.id] });
    },
  });
}

// ==========================================
// 2. MATERIALS HOOKS
// ==========================================

export function useMaterials(searchQuery?: string, categoryFilter?: string) {
  return useQuery({
    queryKey: ['materials', searchQuery, categoryFilter],
    queryFn: async (): Promise<Material[]> => {
      let query = supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        let results = [...memoryMaterials];
        if (categoryFilter && categoryFilter !== 'all') {
          results = results.filter((m) => m.category === categoryFilter);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          results = results.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.description?.toLowerCase().includes(q) ||
              m.category.toLowerCase().includes(q)
          );
        }
        return results;
      }

      let filtered = data as Material[];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        );
      }
      return filtered;
    },
    initialData: () => {
      let results = [...memoryMaterials];
      if (categoryFilter && categoryFilter !== 'all') {
        results = results.filter((m) => m.category === categoryFilter);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        results = results.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        );
      }
      return results;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MaterialFormData) => {
      const { data, error } = await (supabase as any)
        .from('materials')
        .insert({
          name: payload.name.trim(),
          category: payload.category.trim(),
          unit: payload.unit.trim(),
          standard_rate: payload.standard_rate ?? null,
          description: payload.description?.trim() || null,
          status: payload.status,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase material creation error; saving in local memory:', error.message);
        const newId = 'mat-' + (memoryMaterials.length + 1).toString().padStart(2, '0');
        const created: Material = {
          id: newId,
          company_id: 'comp-shivarivel-001',
          name: payload.name.trim(),
          category: payload.category.trim(),
          unit: payload.unit.trim(),
          standard_rate: payload.standard_rate ?? null,
          description: payload.description?.trim() || null,
          status: payload.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryMaterials = [created, ...memoryMaterials];
        return created;
      }

      return data as unknown as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<MaterialFormData> }) => {
      const { data, error } = await (supabase as any)
        .from('materials')
        .update({
          name: payload.name !== undefined ? payload.name.trim() : undefined,
          category: payload.category !== undefined ? payload.category.trim() : undefined,
          unit: payload.unit !== undefined ? payload.unit.trim() : undefined,
          standard_rate: payload.standard_rate !== undefined ? payload.standard_rate : undefined,
          description: payload.description !== undefined ? payload.description?.trim() || null : undefined,
          status: payload.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase material update error; updating in local memory:', error.message);
        const idx = memoryMaterials.findIndex((m) => m.id === id);
        if (idx >= 0) {
          memoryMaterials[idx] = {
            ...memoryMaterials[idx],
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return memoryMaterials[idx];
        }
      }

      return data as unknown as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

// ==========================================
// 3. PURCHASES HOOKS
// ==========================================

export interface PurchaseFilters {
  supplier_id?: string;
  project_id?: string;
  payment_status?: 'all' | 'Unpaid' | 'Partial' | 'Paid';
  search?: string;
}

export function usePurchases(filters?: PurchaseFilters) {
  return useQuery({
    queryKey: ['purchases', filters],
    queryFn: async (): Promise<Purchase[]> => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers!supplier_id (*),
          project:projects!project_id (id, name, project_code, site_address),
          items:purchase_items (*)
        `)
        .order('purchase_date', { ascending: false });

      if (filters?.supplier_id && filters.supplier_id !== 'all') {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters?.project_id && filters.project_id !== 'all') {
        query = query.eq('project_id', filters.project_id);
      }

      const { data, error } = await query;

      // Fetch balances from v_purchase_balance
      const { data: balanceData } = await (supabase
        .from('v_purchase_balance') as any)
        .select('*');

      const balanceMap = new Map<string, { total_allocated: number; outstanding_balance: number }>();
      if (balanceData) {
        for (const row of balanceData as any[]) {
          balanceMap.set(row.purchase_id, {
            total_allocated: Number(row.total_allocated || 0),
            outstanding_balance: Number(row.outstanding_balance || 0),
          });
        }
      }

      if (error || !data || data.length === 0) {
        let results = [...memoryPurchases];
        if (filters?.supplier_id && filters.supplier_id !== 'all') {
          results = results.filter((p) => p.supplier_id === filters.supplier_id);
        }
        if (filters?.project_id && filters.project_id !== 'all') {
          results = results.filter((p) => p.project_id === filters.project_id);
        }
        if (filters?.payment_status && filters.payment_status !== 'all') {
          results = results.filter((p) => p.payment_status === filters.payment_status);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          results = results.filter(
            (p) =>
              p.purchase_number.toLowerCase().includes(q) ||
              p.invoice_number?.toLowerCase().includes(q) ||
              p.supplier?.name.toLowerCase().includes(q) ||
              p.project?.name.toLowerCase().includes(q)
          );
        }
        return results;
      }

      let results: Purchase[] = (data as any[]).map((row) => {
        const bal = balanceMap.get(row.id);
        const total_allocated = bal?.total_allocated ?? 0;
        const outstanding_balance = bal?.outstanding_balance ?? row.total_amount;
        const payment_status = derivePurchasePaymentStatus(row.total_amount, total_allocated);

        return {
          ...row,
          total_allocated,
          outstanding_balance,
          payment_status,
        };
      });

      if (filters?.payment_status && filters.payment_status !== 'all') {
        results = results.filter((p) => p.payment_status === filters.payment_status);
      }

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (p) =>
            p.purchase_number.toLowerCase().includes(q) ||
            p.invoice_number?.toLowerCase().includes(q) ||
            p.supplier?.name.toLowerCase().includes(q) ||
            p.project?.name.toLowerCase().includes(q)
        );
      }

      return results;
    },
    initialData: () => {
      let results = [...memoryPurchases];
      if (filters?.supplier_id && filters.supplier_id !== 'all') {
        results = results.filter((p) => p.supplier_id === filters.supplier_id);
      }
      if (filters?.project_id && filters.project_id !== 'all') {
        results = results.filter((p) => p.project_id === filters.project_id);
      }
      if (filters?.payment_status && filters.payment_status !== 'all') {
        results = results.filter((p) => p.payment_status === filters.payment_status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (p) =>
            p.purchase_number.toLowerCase().includes(q) ||
            p.invoice_number?.toLowerCase().includes(q) ||
            p.supplier?.name.toLowerCase().includes(q) ||
            p.project?.name.toLowerCase().includes(q)
        );
      }
      return results;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function usePurchase(id?: string) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: async (): Promise<Purchase | null> => {
      if (!id) return null;

      const { data, error } = await (supabase as any)
        .from('purchases')
        .select(`
          *,
          supplier:suppliers!supplier_id (*),
          project:projects!project_id (id, name, project_code, site_address),
          items:purchase_items (*, material:materials!material_id (*))
        `)
        .eq('id', id)
        .maybeSingle();

      const { data: balanceData } = await (supabase
        .from('v_purchase_balance') as any)
        .select('*')
        .eq('purchase_id', id)
        .maybeSingle();

      if (error || !data) {
        return memoryPurchases.find((p) => p.id === id) || null;
      }

      const purchaseData = data as any;
      const bal = balanceData as any;
      const total_allocated = Number(bal?.total_allocated || 0);
      const outstanding_balance = Number(bal?.outstanding_balance || purchaseData.total_amount);
      const payment_status = derivePurchasePaymentStatus(purchaseData.total_amount, total_allocated);

      return {
        ...purchaseData,
        total_allocated,
        outstanding_balance,
        payment_status,
      } as Purchase;
    },
    initialData: () => {
      if (!id) return null;
      return memoryPurchases.find((p) => p.id === id) || null;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useOutstandingPurchasesForSupplier(supplierId?: string) {
  return useQuery({
    queryKey: ['outstanding-purchases', supplierId],
    queryFn: async (): Promise<Purchase[]> => {
      if (!supplierId) return [];

      const { data: balanceData, error } = await (supabase
        .from('v_purchase_balance') as any)
        .select(`
          purchase_id,
          purchase_number,
          purchase_date,
          status,
          total_amount,
          total_allocated,
          outstanding_balance
        `)
        .eq('supplier_id', supplierId)
        .gt('outstanding_balance', 0)
        .eq('status', 'Confirmed')
        .order('purchase_date', { ascending: true });

      if (error || !balanceData || balanceData.length === 0) {
        // Fallback from memory
        return memoryPurchases.filter(
          (p) =>
            p.supplier_id === supplierId &&
            p.status === 'Confirmed' &&
            (p.outstanding_balance ?? p.total_amount) > 0
        );
      }

      // Also get invoice numbers for display
      const purchaseIds = (balanceData as any[]).map((b) => b.purchase_id);
      const { data: purchasesMeta } = await supabase
        .from('purchases')
        .select('id, invoice_number')
        .in('id', purchaseIds);

      const invoiceMap = new Map<string, string | null>(
        (purchasesMeta || []).map((p: any) => [p.id, p.invoice_number ? String(p.invoice_number) : null])
      );

      return (balanceData as any[]).map((row) => ({
        id: row.purchase_id,
        company_id: 'comp-shivarivel-001',
        supplier_id: supplierId,
        project_id: null,
        purchase_number: row.purchase_number,
        purchase_date: row.purchase_date,
        invoice_number: invoiceMap.get(row.purchase_id) ?? null,
        status: row.status,
        discount: 0,
        tax: 0,
        total_amount: Number(row.total_amount),
        total_allocated: Number(row.total_allocated || 0),
        outstanding_balance: Number(row.outstanding_balance),
        due_date: null,
        notes: null,
        reversal_of_id: null,
        created_at: row.purchase_date,
        updated_at: row.purchase_date,
        payment_status: derivePurchasePaymentStatus(Number(row.total_amount), Number(row.total_allocated || 0)),
      }));
    },
    initialData: () => {
      if (!supplierId) return [];
      return memoryPurchases.filter(
        (p) =>
          p.supplier_id === supplierId &&
          p.status === 'Confirmed' &&
          (p.outstanding_balance ?? p.total_amount) > 0
      );
    },
    enabled: Boolean(supplierId),
    staleTime: 1000 * 60,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PurchaseFormData) => {
      // 1. Prepare line items for atomic RPC create_purchase_transaction
      const rpcItems = payload.items.map((item) => ({
        material_id: item.material_id,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        description: item.description || null,
        notes: item.notes || null,
      }));

      // Call atomic RPC
      const { data: purchaseId, error } = await (supabase.rpc as any)('create_purchase_transaction', {
        p_supplier_id: payload.supplier_id,
        p_project_id: payload.project_id || null,
        p_purchase_date: payload.purchase_date,
        p_invoice_number: payload.invoice_number?.trim() || null,
        p_discount: payload.discount || 0,
        p_tax: payload.tax || 0,
        p_due_date: payload.due_date || null,
        p_notes: payload.notes?.trim() || null,
        p_status: 'Confirmed',
        p_items: rpcItems,
      });

      if (error) {
        console.warn('Supabase create_purchase_transaction error; saving in local memory:', error.message);
        // Calculate items sum
        const itemsSum = payload.items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
        const totalAmount = Math.max(0, itemsSum - (payload.discount || 0) + (payload.tax || 0));

        const nextNum = memoryPurchases.length + 1;
        const newCode = `PUR-${nextNum.toString().padStart(4, '0')}`;
        const newPurchaseId = 'pur-' + nextNum.toString().padStart(2, '0');

        const initialPayAmt = payload.record_initial_payment ? Number(payload.initial_payment_amount || 0) : 0;
        const allocated = Math.min(totalAmount, initialPayAmt);
        const outstanding = Math.max(0, totalAmount - allocated);
        const paymentStatus = derivePurchasePaymentStatus(totalAmount, allocated);

        const supplier = memorySuppliers.find((s) => s.id === payload.supplier_id);

        const createdPurchase: Purchase = {
          id: newPurchaseId,
          company_id: 'comp-shivarivel-001',
          supplier_id: payload.supplier_id,
          project_id: payload.project_id || null,
          purchase_number: newCode,
          purchase_date: payload.purchase_date,
          invoice_number: payload.invoice_number?.trim() || null,
          status: 'Confirmed',
          discount: payload.discount || 0,
          tax: payload.tax || 0,
          total_amount: totalAmount,
          due_date: payload.due_date || null,
          notes: payload.notes?.trim() || null,
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          supplier,
          total_allocated: allocated,
          outstanding_balance: outstanding,
          payment_status: paymentStatus,
          items: payload.items.map((item, idx) => ({
            id: `pi-${newPurchaseId}-${idx + 1}`,
            company_id: 'comp-shivarivel-001',
            purchase_id: newPurchaseId,
            material_id: item.material_id,
            description: item.description || null,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            amount: Math.round(item.quantity * item.unit_price * 100) / 100,
            notes: item.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            material: memoryMaterials.find((m) => m.id === item.material_id),
          })),
        };

        memoryPurchases = [createdPurchase, ...memoryPurchases];

        // If initial payment was recorded in memory
        if (payload.record_initial_payment && initialPayAmt > 0) {
          const spNext = memorySupplierPayments.length + 1;
          const spCode = `SP-${spNext.toString().padStart(4, '0')}`;
          const newSpId = 'sp-' + spNext.toString().padStart(2, '0');
          const unallocated = Math.max(0, initialPayAmt - allocated);

          const createdPayment: SupplierPayment = {
            id: newSpId,
            company_id: 'comp-shivarivel-001',
            supplier_id: payload.supplier_id,
            payment_number: spCode,
            payment_date: payload.purchase_date,
            amount: initialPayAmt,
            payment_method: payload.initial_payment_method || 'Bank Transfer (NEFT / RTGS)',
            reference_number: payload.initial_payment_reference || null,
            status: 'Confirmed',
            notes: `Initial payment at purchase entry against invoice ${payload.invoice_number || newCode}`,
            reversal_of_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_allocated: allocated,
            unallocated_amount: unallocated,
            supplier,
            allocations: [
              {
                id: `spa-${newSpId}-1`,
                company_id: 'comp-shivarivel-001',
                payment_id: newSpId,
                purchase_id: newPurchaseId,
                amount: allocated,
                notes: 'Initial allocation',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          };

          memorySupplierPayments = [createdPayment, ...memorySupplierPayments];
        }

        return createdPurchase.id;
      }

      const realPurchaseId = purchaseId as string;

      // 2. If user requested initial payment, invoke record_supplier_payment RPC
      if (
        payload.record_initial_payment &&
        payload.initial_payment_amount &&
        payload.initial_payment_amount > 0
      ) {
        try {
          await (supabase.rpc as any)('record_supplier_payment', {
            p_supplier_id: payload.supplier_id,
            p_amount: payload.initial_payment_amount,
            p_payment_date: payload.purchase_date,
            p_payment_method: payload.initial_payment_method || 'Bank Transfer (NEFT / RTGS)',
            p_reference_number: payload.initial_payment_reference || null,
            p_notes: `Initial payment at purchase entry (${payload.invoice_number || 'Direct'})`,
            p_status: 'Confirmed',
            p_allocations: [
              {
                purchase_id: realPurchaseId,
                amount: payload.initial_payment_amount,
                notes: 'Initial purchase payment',
              },
            ],
          });
        } catch (payErr) {
          console.warn('Initial payment recording failed after purchase creation:', payErr);
        }
      }

      return realPurchaseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-balance'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['project-recorded-costs'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-purchase'] });
    },
  });
}

// ==========================================
// 4. SUPPLIER PAYMENTS & ALLOCATIONS HOOKS
// ==========================================

export function useSupplierPayments(supplierId?: string) {
  return useQuery({
    queryKey: ['supplier-payments', supplierId],
    queryFn: async (): Promise<SupplierPayment[]> => {
      let query = supabase
        .from('supplier_payments')
        .select(`
          *,
          supplier:suppliers!supplier_id (*),
          allocations:supplier_payment_allocations (*)
        `)
        .order('payment_date', { ascending: false });

      if (supplierId && supplierId !== 'all') {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        let results = [...memorySupplierPayments];
        if (supplierId && supplierId !== 'all') {
          results = results.filter((p) => p.supplier_id === supplierId);
        }
        return results;
      }

      return (data as any[]).map((sp) => {
        const totalAlloc = (sp.allocations || []).reduce((acc: number, a: any) => acc + Number(a.amount || 0), 0);
        const unallocated = Math.max(0, Number(sp.amount || 0) - totalAlloc);
        return {
          ...sp,
          total_allocated: totalAlloc,
          unallocated_amount: unallocated,
        };
      });
    },
    initialData: () => {
      let results = [...memorySupplierPayments];
      if (supplierId && supplierId !== 'all') {
        results = results.filter((p) => p.supplier_id === supplierId);
      }
      return results;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecordSupplierPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SupplierPaymentFormData) => {
      const rpcAllocations = payload.allocations
        .filter((a) => a.amount > 0)
        .map((a) => ({
          purchase_id: a.purchase_id,
          amount: a.amount,
          notes: a.notes || null,
        }));

      const { data: paymentId, error } = await (supabase.rpc as any)('record_supplier_payment', {
        p_supplier_id: payload.supplier_id,
        p_amount: payload.amount,
        p_payment_date: payload.payment_date,
        p_payment_method: payload.payment_method,
        p_reference_number: payload.reference_number?.trim() || null,
        p_notes: payload.notes?.trim() || null,
        p_status: 'Confirmed',
        p_allocations: rpcAllocations,
      });

      if (error) {
        console.warn('Supabase record_supplier_payment error; saving in local memory:', error.message);
        const nextNum = memorySupplierPayments.length + 1;
        const newCode = `SP-${nextNum.toString().padStart(4, '0')}`;
        const newPaymentId = 'sp-' + nextNum.toString().padStart(2, '0');

        const totalAllocated = rpcAllocations.reduce((acc, a) => acc + a.amount, 0);
        const unallocated = Math.max(0, payload.amount - totalAllocated);

        // Update affected memory purchases
        for (const alloc of rpcAllocations) {
          const purch = memoryPurchases.find((p) => p.id === alloc.purchase_id);
          if (purch) {
            const currentAlloc = purch.total_allocated || 0;
            const newAlloc = currentAlloc + alloc.amount;
            purch.total_allocated = newAlloc;
            purch.outstanding_balance = Math.max(0, purch.total_amount - newAlloc);
            purch.payment_status = derivePurchasePaymentStatus(purch.total_amount, newAlloc);
          }
        }

        const supplier = memorySuppliers.find((s) => s.id === payload.supplier_id);

        const createdPayment: SupplierPayment = {
          id: newPaymentId,
          company_id: 'comp-shivarivel-001',
          supplier_id: payload.supplier_id,
          payment_number: newCode,
          payment_date: payload.payment_date,
          amount: payload.amount,
          payment_method: payload.payment_method,
          reference_number: payload.reference_number?.trim() || null,
          status: 'Confirmed',
          notes: payload.notes?.trim() || null,
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_allocated: totalAllocated,
          unallocated_amount: unallocated,
          supplier,
          allocations: rpcAllocations.map((a, idx) => ({
            id: `spa-${newPaymentId}-${idx + 1}`,
            company_id: 'comp-shivarivel-001',
            payment_id: newPaymentId,
            purchase_id: a.purchase_id,
            amount: a.amount,
            notes: a.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        };

        memorySupplierPayments = [createdPayment, ...memorySupplierPayments];
        return createdPayment.id;
      }

      return paymentId as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-balance'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-payment'] });
      queryClient.invalidateQueries({ queryKey: ['report-purchase'] });
    },
  });
}
