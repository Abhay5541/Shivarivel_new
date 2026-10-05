import { z } from 'zod';

export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  category: string | null;
  notes: string | null;
  status: SupplierStatus;
  created_at: string;
  updated_at: string;
}

export interface SupplierBalance {
  supplier_id: string;
  company_id: string;
  supplier_name: string;
  supplier_status: SupplierStatus;
  total_purchases: number;
  total_allocated_payments: number;
  outstanding_balance: number;
  total_payments_made?: number;
  supplier_credit?: number;
}

export interface Material {
  id: string;
  company_id: string;
  name: string;
  category: string;
  unit: string;
  standard_rate: number | null;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type PurchaseDatabaseStatus = 'Draft' | 'Confirmed' | 'Cancelled';
export type PurchasePaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export interface PurchaseItem {
  id: string;
  company_id: string;
  purchase_id: string;
  material_id: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  material?: Material;
}

export interface Purchase {
  id: string;
  company_id: string;
  supplier_id: string;
  project_id: string | null;
  purchase_number: string;
  purchase_date: string;
  invoice_number: string | null;
  status: PurchaseDatabaseStatus;
  discount: number;
  tax: number;
  total_amount: number;
  due_date: string | null;
  notes: string | null;
  reversal_of_id: string | null;
  created_at: string;
  updated_at: string;
  // Joins & derived fields
  supplier?: Supplier;
  project?: {
    id: string;
    name: string;
    project_code: string;
    site_address?: string | null;
  } | null;
  items?: PurchaseItem[];
  total_allocated?: number;
  outstanding_balance?: number;
  payment_status?: PurchasePaymentStatus;
}

export interface SupplierPaymentAllocation {
  id: string;
  company_id: string;
  payment_id: string;
  purchase_id: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase?: Purchase;
}

export interface SupplierPayment {
  id: string;
  company_id: string;
  supplier_id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  notes: string | null;
  reversal_of_id: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  allocations?: SupplierPaymentAllocation[];
  total_allocated?: number;
  unallocated_amount?: number;
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(150),
  contact_person: z.string().max(100).optional().nullable(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal(''))
    .nullable(),
  alternate_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal(''))
    .nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  address: z.string().max(300).optional().nullable(),
  gst_number: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(''))
    .nullable(),
  category: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'inactive']),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;

export const materialFormSchema = z.object({
  name: z.string().min(1, 'Material name is required').max(150),
  category: z.string().min(1, 'Category is required').max(50),
  unit: z.string().min(1, 'Unit of measure is required').max(20),
  standard_rate: z.number().min(0, 'Standard rate cannot be negative').optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  status: z.enum(['active', 'inactive']),
});

export type MaterialFormData = z.infer<typeof materialFormSchema>;

export const purchaseItemFormSchema = z.object({
  material_id: z.string().min(1, 'Please select a material'),
  description: z.string().optional().nullable(),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  notes: z.string().optional().nullable(),
});

export type PurchaseItemFormData = z.infer<typeof purchaseItemFormSchema>;

export const purchaseFormSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  project_id: z.string().optional().nullable(),
  invoice_number: z.string().max(50).optional().nullable(),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  due_date: z.string().optional().nullable(),
  discount: z.number().min(0, 'Discount cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(purchaseItemFormSchema).min(1, 'At least one line item is required'),
  // Optional immediate payment
  record_initial_payment: z.boolean(),
  initial_payment_amount: z.number().min(0).optional().nullable(),
  initial_payment_method: z.string().optional().nullable(),
  initial_payment_reference: z.string().optional().nullable(),
});

export type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export const supplierPaymentAllocationSchema = z.object({
  purchase_id: z.string().min(1, 'Purchase invoice is required'),
  amount: z.number().gt(0, 'Allocation amount must be greater than 0'),
  notes: z.string().optional().nullable(),
});

export const supplierPaymentFormSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  amount: z.number().gt(0, 'Payment amount must be greater than 0'),
  payment_method: z.string().min(1, 'Payment method is required'),
  reference_number: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  allocations: z.array(supplierPaymentAllocationSchema),
});

export type SupplierPaymentFormData = z.infer<typeof supplierPaymentFormSchema>;

// Construction Material standard categories for Tamil Nadu civil & interior
export const MATERIAL_CATEGORIES = [
  'Cement & Masonry',
  'Steel & Structural',
  'Sand & Aggregates',
  'Plywood & Timber',
  'Hardware & Fittings',
  'Electrical & Wiring',
  'Plumbing & Sanitary',
  'Paints & Wall Finishes',
  'Flooring & Tiles',
  'Glass & Aluminum',
  'Ready Mix Concrete (RMC)',
  'Miscellaneous Site Materials',
] as const;

// Common units of measurement for civil contractor
export const MATERIAL_UNITS = [
  'Bags',
  'Tonnes',
  'Kg',
  'Sq.ft',
  'Sq.m',
  'Running Ft',
  'Cft (Cu.ft)',
  'Brass',
  'Loads / Trucks',
  'Nos',
  'Litres',
  'Bundles',
  'Boxes',
] as const;

export const PAYMENT_METHODS = [
  'Bank Transfer (NEFT / RTGS)',
  'Cheque',
  'UPI / GPay / PhonePe',
  'Cash',
  'Demand Draft',
] as const;

// ==========================================
// PHASE 03C: SIMPLIFIED PROCUREMENT TYPES
// ==========================================

export interface SimplePurchaseInput {
  id?: string;
  project_id: string | null;
  product_name: string;
  supplier_name: string;
  quantity: number;
  unit: string;
  total_value: number;
  amount_paid: number;
  purchase_date?: string;
  notes?: string | null;
}

export interface SupplierSummaryItem {
  supplier_name: string;
  total_purchased: number;
  total_paid: number;
  total_outstanding: number;
  purchase_count: number;
}
