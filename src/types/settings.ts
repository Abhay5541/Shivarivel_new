/**
 * SHIVARIVEL CONSTRUCTION & INTERIORS
 * Phase 10: Settings & Administration TypeScript Types
 *
 * Source of truth:
 * - Migration 0001_foundation.sql: public.companies, public.profiles, public.service_types
 * - Migration 0002_auth_and_profiles.sql: RLS policies, protect_profile_fields trigger
 * - Database types: Database['public']['Tables']['companies' | 'profiles' | 'service_types']
 */

import { z } from 'zod';
import type { Database } from './database';

// ==========================================
// 1. COMPANY PROFILE TYPES & SCHEMA
// ==========================================

export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export interface CompanyProfile {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  website: string | null;
  gst_number: string | null;
  owner_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export const companyProfileFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  owner_name: z.string().min(2, 'Owner / Proprietor name is required'),
  address: z.string().min(5, 'Registered address must be at least 5 characters'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[+0-9\s-]{10,20}$/, 'Enter a valid Indian contact number'),
  alternate_phone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^[+0-9\s-]{10,20}$/.test(val), {
      message: 'Enter a valid alternate contact number',
    }),
  email: z.string().email('Enter a valid official email address'),
  website: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^https?:\/\/.+/.test(val) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(val), {
      message: 'Enter a valid website URL (e.g., https://shivarivel.com)',
    }),
  gst_number: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.trim()), {
      message: 'Enter a valid 15-character Indian GSTIN (e.g., 33AAACS1234F1Z5)',
    }),
  logo_url: z.string().optional().nullable(),
});

export type CompanyProfileFormData = z.infer<typeof companyProfileFormSchema>;

export const initialCompanyProfile: CompanyProfile = {
  id: 'comp-shivarivel-001',
  name: 'Shivarivel Construction & Interiors',
  owner_name: 'K. Senthil Nathan',
  address: '14, South Car Street, Sankarankovil, Tenkasi District, Tamil Nadu - 627756',
  phone: '+91 94431 87654',
  alternate_phone: '+91 98421 23344',
  email: 'contact@shivarivel.com',
  website: null,
  gst_number: null,
  logo_url: null,
};

// ==========================================
// 2. USERS & ROLES TYPES
// ==========================================

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type UserRole = 'owner' | 'supervisor' | 'worker';

export interface UserProfile extends ProfileRow {
  email?: string;
  assigned_projects_count?: number;
}

export interface UserRoleDefinition {
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  permissions: string[];
}

export const USER_ROLES: Record<UserRole, UserRoleDefinition> = {
  owner: {
    role: 'owner',
    label: 'Owner / Admin',
    badgeColor: 'bg-[#4A0E0E]/10 text-[#4A0E0E] border-[#4A0E0E]/30',
    description: 'Full administrative authority across all modules, finance, reports, and settings.',
    permissions: [
      'Full administrative access to all modules',
      'Finance & cash movement oversight',
      'Company profile & master settings editing',
      'User role assignment & account status control',
      'Estimates, tenders, & contract approval',
    ],
  },
  supervisor: {
    role: 'supervisor',
    label: 'Site Supervisor',
    badgeColor: 'bg-[#C99A2E]/10 text-[#8F6A18] border-[#C99A2E]/30',
    description: 'Operational execution: daily attendance, site muster, work progress, and daily reports.',
    permissions: [
      'View & manage assigned site projects',
      'Log daily worker attendance & muster',
      'Submit daily site progress reports & photos',
      'Create material requisitions & check deliveries',
      'Read-only operational reporting',
    ],
  },
  worker: {
    role: 'worker',
    label: 'Worker / Laborer',
    badgeColor: 'bg-[#6B6B6B]/10 text-[#242424] border-[#6B6B6B]/30',
    description: 'Direct field workforce tracked in attendance muster and wage compensation slips.',
    permissions: [
      'No application administration portal',
      'Daily attendance tracking in muster',
      'Individual wage slip generation',
      'Advance loan ledger records',
    ],
  },
};

export const initialUserProfiles: UserProfile[] = [
  {
    id: 'user-01',
    company_id: 'comp-shivarivel-001',
    full_name: 'K. Senthil Nathan',
    phone: '9840112233',
    email: 'owner@shivarivel.com',
    role: 'owner',
    is_active: true,
    assigned_projects_count: 5,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-02',
    company_id: 'comp-shivarivel-001',
    full_name: 'A. Murugan',
    phone: '9443223344',
    email: 'murugan@shivarivel.com',
    role: 'supervisor',
    is_active: true,
    assigned_projects_count: 2,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'user-03',
    company_id: 'comp-shivarivel-001',
    full_name: 'R. Vignesh',
    phone: '9789334455',
    email: 'vignesh@shivarivel.com',
    role: 'supervisor',
    is_active: true,
    assigned_projects_count: 1,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'user-04',
    company_id: 'comp-shivarivel-001',
    full_name: 'S. Muthukumar',
    phone: '9443887766',
    email: 'muthu@shivarivel.com',
    role: 'supervisor',
    is_active: false,
    assigned_projects_count: 0,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
  },
];

// ==========================================
// 3. SERVICE TYPES TYPES & SCHEMA
// ==========================================

export type ServiceTypeRow = Database['public']['Tables']['service_types']['Row'];

export interface ServiceType extends ServiceTypeRow {
  usage_count?: number;
}

export const serviceTypeFormSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  sort_order: z.coerce.number().min(0, 'Sort order must be 0 or greater').default(0),
  is_active: z.boolean().default(true),
});

export type ServiceTypeFormData = z.infer<typeof serviceTypeFormSchema>;

export const initialServiceTypes: ServiceType[] = [
  {
    id: 'st-01',
    company_id: 'comp-shivarivel-001',
    name: 'Interior & Woodwork',
    description: 'Modular kitchen, TV units, wardrobes, and customized storage',
    is_active: true,
    sort_order: 1,
    usage_count: 8,
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
    usage_count: 5,
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
    usage_count: 12,
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
    usage_count: 6,
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
    usage_count: 9,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'st-06',
    company_id: 'comp-shivarivel-001',
    name: 'Estimates & Valuations',
    description: 'Itemized material quantity estimation and construction valuation',
    is_active: true,
    sort_order: 6,
    usage_count: 4,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'st-07',
    company_id: 'comp-shivarivel-001',
    name: 'Site Surveying & Leveling',
    description: 'Total station topographical surveying and foundation bench marking',
    is_active: true,
    sort_order: 7,
    usage_count: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];
