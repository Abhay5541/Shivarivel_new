import { z } from 'zod';
import type { Database } from './database';

export type CustomerRow = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type EnquiryRow = Database['public']['Tables']['enquiries']['Row'];
export type EnquiryInsert = Database['public']['Tables']['enquiries']['Insert'];
export type EnquiryUpdate = Database['public']['Tables']['enquiries']['Update'];

export type SiteVisitRow = Database['public']['Tables']['site_visits']['Row'];
export type SiteVisitInsert = Database['public']['Tables']['site_visits']['Insert'];
export type SiteVisitUpdate = Database['public']['Tables']['site_visits']['Update'];

export type ServiceTypeRow = Database['public']['Tables']['service_types']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Extended Customer with related operational counts
 */
export interface Customer extends CustomerRow {
  enquiries_count?: number;
  site_visits_count?: number;
  active_projects_count?: number;
}

/**
 * Extended Enquiry with joined customer & service_type information
 */
export interface Enquiry extends EnquiryRow {
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  } | null;
  service_type?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Extended Site Visit with joined customer, enquiry, & assigned engineer
 */
export interface SiteVisit extends SiteVisitRow {
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  } | null;
  enquiry?: {
    id: string;
    description: string | null;
    status: string;
  } | null;
  assigned_profile?: {
    id: string;
    full_name: string;
    phone: string | null;
    role: string;
  } | null;
}

// -------------------------------------------------------------
// Form Validation Schemas (Zod)
// -------------------------------------------------------------

// Indian Phone Regex: accepts 10 digits starting 6-9, or +91 followed by 10 digits
export const indianPhoneRegex = /^(\+91[- ]?)?[6-9]\d{9}$/;

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Customer name must be at least 2 characters' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || indianPhoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Enter a valid 10-digit Indian phone number (starts with 6-9)',
    }),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Enter a valid email address',
    }),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const enquirySchema = z.object({
  customer_id: z.string().min(1, { message: 'Please select a customer' }),
  service_type_id: z.string().nullable().optional(),
  enquiry_date: z.string().min(1, { message: 'Enquiry date is required' }),
  source: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .min(3, { message: 'Please describe the customer requirement / work scope' }),
  estimated_value: z
    .number({ invalid_type_error: 'Estimated value must be a valid number' })
    .min(0, { message: 'Estimated value cannot be negative' })
    .nullable()
    .optional(),
  status: z.enum([
    'New',
    'Contacted',
    'Site Visit Planned',
    'Estimate Prepared',
    'Converted',
    'Lost',
    'On Hold',
  ]),
  follow_up_date: z.string().nullable().optional(),
  notes: z.string().trim().optional(),
});

export type EnquiryFormData = z.infer<typeof enquirySchema>;

export const siteVisitSchema = z.object({
  customer_id: z.string().min(1, { message: 'Please select a customer' }),
  enquiry_id: z.string().nullable().optional(),
  site_address: z.string().trim().optional(),
  visit_date: z.string().min(1, { message: 'Visit date is required' }),
  assigned_to: z.string().nullable().optional(),
  purpose: z.string().trim().optional(),
  observations: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']),
});

export type SiteVisitFormData = z.infer<typeof siteVisitSchema>;
