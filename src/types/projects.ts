import { z } from 'zod';

export type ProjectStatus =
  | 'Planned'
  | 'Planning'
  | 'Active'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Planned',
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled',
];

export interface ProjectCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface ProjectEnquiry {
  id: string;
  description: string;
  status: string;
}

export interface ProjectEstimate {
  id: string;
  estimate_number: string;
  title: string | null;
  total_amount: number;
  status: string;
}

export interface ProjectSupervisor {
  id: string;
  full_name: string;
  phone?: string | null;
  role: string;
}

export interface Project {
  id: string;
  company_id: string;
  customer_id: string;
  enquiry_id?: string | null;
  estimate_id?: string | null;
  project_code: string;
  name: string;
  description?: string | null;
  site_address?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  expected_end_date?: string | null;
  actual_end_date?: string | null;
  contract_value?: number | null;
  assigned_to?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  // Joined entity contexts
  customer?: ProjectCustomer;
  enquiry?: ProjectEnquiry;
  estimate?: ProjectEstimate;
  supervisor?: ProjectSupervisor;
}

// Work item status
export type WorkItemStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'On Hold'
  | 'Cancelled';

export interface WorkProgressItem {
  id: string;
  company_id: string;
  project_id: string;
  name: string;
  category?: string | null;
  status: WorkItemStatus;
  progress_percentage: number;
  start_date?: string | null;
  expected_completion?: string | null;
  actual_completion?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ProjectWorkProgressSummary {
  project_id: string;
  project_code: string;
  project_name: string;
  project_status: string;
  total_work_items: number;
  completed_work_items: number;
  in_progress_work_items: number;
  not_started_work_items: number;
  overall_progress_percentage: number;
}

// Strictly approved financial context without profit/margin/ROI
export interface ProjectFinancialContext {
  contract_value: number;
  amount_received: number;
  outstanding_amount: number;
  total_purchases: number;
  total_wages: number;
  total_expenses: number;
  recorded_project_cost: number;
}

// Project document categories matching Phase 18 backend schema
export type ProjectDocumentCategory =
  | 'Building Plan'
  | '3D Plan'
  | '3D Elevation'
  | 'Approval Document'
  | 'Estimate'
  | 'Agreement'
  | 'Invoice'
  | 'Receipt'
  | 'Payment Proof'
  | 'Site Photo'
  | 'Other';

export const PROJECT_DOCUMENT_CATEGORIES: ProjectDocumentCategory[] = [
  'Building Plan',
  '3D Plan',
  '3D Elevation',
  'Approval Document',
  'Estimate',
  'Agreement',
  'Invoice',
  'Receipt',
  'Payment Proof',
  'Site Photo',
  'Other',
];

export interface ProjectDocument {
  id: string;
  company_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes?: number;
  category: ProjectDocumentCategory;
  description?: string | null;
  created_at: string;
}

// Project Form Schema
export const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  enquiry_id: z.string().optional().nullable(),
  estimate_id: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  site_address: z.string().optional().nullable(),
  status: z.enum([
    'Planned',
    'Planning',
    'Active',
    'On Hold',
    'Completed',
    'Cancelled',
  ]),
  start_date: z.string().optional().nullable(),
  expected_end_date: z.string().optional().nullable(),
  contract_value: z.number().min(0, 'Contract value must be positive').optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
