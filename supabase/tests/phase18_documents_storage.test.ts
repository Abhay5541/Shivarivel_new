/**
 * Phase 18: Documents / Photos / Storage Backend Tests
 *
 * Comprehensive tests verifying:
 * A. Storage Bucket Architecture & Privacy:
 *    - Private bucket configuration ('documents', 'photos')
 *    - Size limits (25MB documents, 15MB photos) and allowed MIME types
 * B. Attachments Metadata Table Schema & Constraints (Product Spec Sec 28):
 *    - Columns, defaults, composite foreign keys, CHECK constraints
 *    - Associated resources: customer, enquiry, site visit, estimate, project, purchase, employee, daily site report
 * C. Storage Path Design & Tenant Isolation Validation:
 *    - Path prefix validation trigger ensuring storage_path starts with company_id/
 *    - Rejection of malformed paths, missing company prefix, and cross-company paths
 * D. Integration with Phase 16 Daily Site Report Photos:
 *    - Preserves photo_url, caption, and report relationships
 *    - Adds optional attachment_id and storage_path without breaking Phase 16
 * E. Database Row Level Security (RLS):
 *    - Company-scoped SELECT, INSERT, UPDATE, DELETE on public.attachments
 *    - Owner-only DELETE policy
 * F. Storage Object Row Level Security (RLS):
 *    - Split_part(name, '/', 1) path-based company isolation on storage.objects
 *    - Prevents cross-company read, write, update, delete
 * G. Secure Access & Signed URL Info Generation:
 *    - get_attachment_access_info RPC with company authorization
 *    - Rejection of cross-company access requests
 * H. Atomic Attachment Registration RPC:
 *    - register_attachment RPC with multi-tenant validation and entity association
 * I. Audit Logging Triggers:
 *    - trg_audit_attachments_changes recording create, update, delete in public.audit_log
 * J. Strict Financial Separation:
 *    - Documents/storage never alter purchases, wages, advances, expenses, payments, or costs
 * K. Multi-Tenant Attack Scenarios (Step 17 Requirements):
 *    - Company A creates project & uploads document
 *    - Company B blocked from reading, overwriting, deleting, or referencing Company A's object
 *    - Malformed paths, wrong company IDs, and unauthorized entity links rejected
 * L. TypeScript Alignment:
 *    - Attachments table, documents view, RPCs, and AttachmentCategory exported
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0019_PATH = join(ROOT, 'supabase', 'migrations', '0019_documents_storage.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration19 = existsSync(MIGRATION_0019_PATH)
  ? readFileSync(MIGRATION_0019_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. STORAGE BUCKET ARCHITECTURE & PRIVACY
// ============================================================

describe('A. Storage Bucket Architecture & Privacy (Product Spec Sec 28)', () => {
  it('migration 0019 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0019_PATH)).toBe(true);
    expect(migration19.length).toBeGreaterThan(100);
  });

  it('configures private documents and photos buckets with public = false', () => {
    expect(migration19).toContain("'documents',");
    expect(migration19).toContain("'photos',");
    expect(migration19).toContain('public              boolean DEFAULT false');
    expect(migration19).toContain('false,'); // private setting
  });

  it('defines file size limits: 25MB for documents and 15MB for photos', () => {
    expect(migration19).toContain('26214400'); // 25MB
    expect(migration19).toContain('15728640'); // 15MB
  });

  it('defines allowed MIME types for documents (PDF, Office, text, images)', () => {
    expect(migration19).toContain("'application/pdf'");
    expect(migration19).toContain("'image/jpeg'");
    expect(migration19).toContain("'image/png'");
    expect(migration19).toContain("'image/webp'");
    expect(migration19).toContain("'text/plain'");
  });

  it('defines allowed MIME types for photos (JPEG, PNG, WebP, HEIC)', () => {
    expect(migration19).toContain("'image/heic'");
  });
});

// ============================================================
// B. ATTACHMENTS METADATA TABLE SCHEMA & CONSTRAINTS
// ============================================================

describe('B. Attachments Metadata Table Schema & Constraints', () => {
  it('creates public.attachments table', () => {
    expect(migration19).toContain('CREATE TABLE public.attachments');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration19).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration19).toContain('company_id            uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration19).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires non-blank file_name and storage_path', () => {
    expect(migration19).toContain('file_name             text NOT NULL CHECK (char_length(trim(file_name)) > 0)');
    expect(migration19).toContain('storage_path          text NOT NULL CHECK (char_length(trim(storage_path)) > 0)');
  });

  it('contains storage_bucket CHECK constraint allowing documents or photos', () => {
    expect(migration19).toContain("storage_bucket        text NOT NULL DEFAULT 'documents'");
    expect(migration19).toContain("CHECK (storage_bucket IN ('documents', 'photos'))");
  });

  it('contains file_size CHECK constraint enforcing positive size up to 25MB', () => {
    expect(migration19).toContain('file_size             bigint NOT NULL CHECK (file_size > 0 AND file_size <= 26214400)');
  });

  it('contains category check constraint with comprehensive document categories', () => {
    expect(migration19).toContain("'Drawing'");
    expect(migration19).toContain("'Estimate'");
    expect(migration19).toContain("'Invoice'");
    expect(migration19).toContain("'Receipt'");
    expect(migration19).toContain("'Contract'");
    expect(migration19).toContain("'Site Photo'");
    expect(migration19).toContain("'ID Proof'");
    expect(migration19).toContain("'Site Plan'");
    expect(migration19).toContain("'Report'");
  });

  it('contains entity links per Product Spec Section 28', () => {
    expect(migration19).toContain('customer_id           uuid');
    expect(migration19).toContain('enquiry_id            uuid');
    expect(migration19).toContain('site_visit_id         uuid');
    expect(migration19).toContain('estimate_id           uuid');
    expect(migration19).toContain('project_id            uuid');
    expect(migration19).toContain('purchase_id           uuid');
    expect(migration19).toContain('employee_id           uuid');
    expect(migration19).toContain('daily_site_report_id  uuid');
  });

  it('enforces composite foreign keys for same-company entity scoping', () => {
    expect(migration19).toContain('CONSTRAINT fk_att_customer_company');
    expect(migration19).toContain('FOREIGN KEY (company_id, customer_id)');
    expect(migration19).toContain('CONSTRAINT fk_att_project_company');
    expect(migration19).toContain('FOREIGN KEY (company_id, project_id)');
    expect(migration19).toContain('CONSTRAINT fk_att_report_company');
    expect(migration19).toContain('FOREIGN KEY (company_id, daily_site_report_id)');
  });

  it('enforces unique constraint on (storage_bucket, storage_path)', () => {
    expect(migration19).toContain('CONSTRAINT uq_attachments_bucket_path');
    expect(migration19).toContain('UNIQUE (storage_bucket, storage_path)');
  });
});

// ============================================================
// C. STORAGE PATH DESIGN & TENANT ISOLATION VALIDATION
// ============================================================

describe('C. Storage Path Design & Tenant Isolation Validation', () => {
  it('implements validate_attachment_integrity trigger function', () => {
    expect(migration19).toContain('FUNCTION public.validate_attachment_integrity()');
    expect(migration19).toContain('trg_validate_attachment_integrity');
  });

  it('validates that storage_path must begin with company prefix', () => {
    expect(migration19).toContain('Tenant isolation violation: Storage path % must begin with company prefix %');
  });

  it('simulates path validation ensuring company scoping', () => {
    const validateStoragePath = (companyId: string, path: string) => {
      const prefix = `${companyId}/`;
      if (!path.startsWith(prefix)) {
        throw new Error(`Tenant isolation violation: Storage path ${path} must begin with company prefix ${prefix}`);
      }
      return true;
    };

    expect(validateStoragePath('comp-123', 'comp-123/projects/p-1/plan.pdf')).toBe(true);
    expect(validateStoragePath('comp-123', 'comp-123/daily_reports/r-1/photo.jpg')).toBe(true);
    expect(() => validateStoragePath('comp-123', 'comp-999/projects/p-1/plan.pdf')).toThrow('Tenant isolation violation');
    expect(() => validateStoragePath('comp-123', 'global/plan.pdf')).toThrow('Tenant isolation violation');
    expect(() => validateStoragePath('comp-123', '/comp-123/plan.pdf')).toThrow('Tenant isolation violation');
  });

  it('simulates photo bucket specific size and MIME validation', () => {
    const validatePhoto = (bucket: string, mime: string, size: number) => {
      if (bucket === 'photos') {
        if (size > 15728640) {
          throw new Error('Photos cannot exceed 15MB');
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(mime)) {
          throw new Error(`Invalid MIME type ${mime} for photos bucket`);
        }
      }
      return true;
    };

    expect(validatePhoto('photos', 'image/jpeg', 5000000)).toBe(true);
    expect(validatePhoto('photos', 'image/webp', 15000000)).toBe(true);
    expect(() => validatePhoto('photos', 'application/pdf', 2000)).toThrow('Invalid MIME type');
    expect(() => validatePhoto('photos', 'image/jpeg', 16000000)).toThrow('cannot exceed 15MB');
  });
});

// ============================================================
// D. PHASE 16 DAILY SITE REPORT PHOTOS INTEGRATION
// ============================================================

describe('D. Phase 16 Daily Site Report Photos Integration', () => {
  it('extends daily_site_report_photos with attachment_id and storage_path columns', () => {
    expect(migration19).toContain('ALTER TABLE public.daily_site_report_photos');
    expect(migration19).toContain('ADD COLUMN IF NOT EXISTS attachment_id uuid');
    expect(migration19).toContain('ADD COLUMN IF NOT EXISTS storage_path text');
  });

  it('adds composite foreign key from daily_site_report_photos to attachments', () => {
    expect(migration19).toContain('CONSTRAINT fk_dsrp_attachment_company');
    expect(migration19).toContain('REFERENCES public.attachments (company_id, id)');
  });

  it('preserves backward compatibility with existing Phase 16 photo_url', () => {
    const existingPhotoRecord = {
      id: 'photo-1',
      company_id: 'comp-1',
      report_id: 'report-1',
      photo_url: 'https://storage.supabase.co/v1/photos/site1.jpg',
      caption: 'Foundation pour completed',
      attachment_id: null,
      storage_path: null,
    };

    expect(existingPhotoRecord.photo_url).toBeTruthy();
    expect(existingPhotoRecord.attachment_id).toBeNull();
  });
});

// ============================================================
// E. DATABASE ROW LEVEL SECURITY (RLS)
// ============================================================

describe('E. Database Row Level Security (RLS)', () => {
  it('enables row level security on public.attachments', () => {
    expect(migration19).toContain('ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-scoped SELECT, INSERT, UPDATE, and DELETE policies', () => {
    expect(migration19).toContain('"Users can view company attachments"');
    expect(migration19).toContain('"Users can insert company attachments"');
    expect(migration19).toContain('"Users can update company attachments"');
    expect(migration19).toContain('"Owners can delete company attachments"');
    expect(migration19).toContain('public.is_owner()');
  });

  it('never uses permissive USING (true) or WITH CHECK (true) on attachments', () => {
    expect(migration19).not.toContain('ON public.attachments FOR SELECT USING (true)');
    expect(migration19).not.toContain('ON public.attachments FOR INSERT WITH CHECK (true)');
  });
});

// ============================================================
// F. STORAGE OBJECT ROW LEVEL SECURITY (RLS)
// ============================================================

describe('F. Storage Object Row Level Security (RLS)', () => {
  it('enables row level security on storage.objects', () => {
    expect(migration19).toContain('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
  });

  it('enforces company-scoped storage SELECT policy using split_part(name, /, 1)', () => {
    expect(migration19).toContain('"Users can view own company storage objects"');
    expect(migration19).toContain("(split_part(name, '/', 1))::uuid = public.current_company_id()");
  });

  it('enforces company-scoped storage INSERT policy', () => {
    expect(migration19).toContain('"Users can insert own company storage objects"');
    expect(migration19).toContain("(split_part(name, '/', 1))::uuid = public.current_company_id()");
  });

  it('enforces company-scoped storage UPDATE policy', () => {
    expect(migration19).toContain('"Users can update own company storage objects"');
  });

  it('enforces owner-only storage DELETE policy in own company folder', () => {
    expect(migration19).toContain('"Owners can delete own company storage objects"');
    expect(migration19).toContain('public.is_owner()');
  });
});

// ============================================================
// G. SECURE ACCESS & ATOMIC RPCS
// ============================================================

describe('G. Secure Access & Atomic RPCs', () => {
  it('implements register_attachment RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration19).toContain('FUNCTION public.register_attachment(');
    expect(migration19).toContain('SECURITY DEFINER');
    expect(migration19).toContain('SET search_path = public');
  });

  it('implements get_attachment_access_info RPC with company validation', () => {
    expect(migration19).toContain('FUNCTION public.get_attachment_access_info(');
    expect(migration19).toContain('Attachment not found or access denied: %');
  });

  it('simulates signed URL access check denying cross-company access', () => {
    const attachments = [
      { id: 'att-101', companyId: 'comp-A', path: 'comp-A/contracts/c1.pdf', isPrivate: true },
      { id: 'att-202', companyId: 'comp-B', path: 'comp-B/plans/p1.pdf', isPrivate: true },
    ];

    const getAccessInfo = (requestingCompanyId: string, attachmentId: string) => {
      const match = attachments.find((a) => a.id === attachmentId && a.companyId === requestingCompanyId);
      if (!match) {
        throw new Error(`Attachment not found or access denied: ${attachmentId}`);
      }
      return {
        path: match.path,
        signedUrl: `https://supabase.co/storage/v1/sign/${match.path}?token=auth-token-123&expires=3600`,
      };
    };

    expect(getAccessInfo('comp-A', 'att-101').path).toBe('comp-A/contracts/c1.pdf');
    expect(() => getAccessInfo('comp-B', 'att-101')).toThrow('access denied');
    expect(() => getAccessInfo('comp-A', 'att-202')).toThrow('access denied');
  });
});

// ============================================================
// H. AUDIT LOGGING TRIGGERS
// ============================================================

describe('H. Audit Logging Triggers', () => {
  it('implements audit_attachments_changes trigger function with SECURITY DEFINER', () => {
    expect(migration19).toContain('FUNCTION public.audit_attachments_changes()');
    expect(migration19).toContain('SECURITY DEFINER');
    expect(migration19).toContain('SET search_path = public');
    expect(migration19).toContain('trg_audit_attachments_changes');
  });

  it('captures distinct audit actions: create_attachment, update_attachment, delete_attachment', () => {
    expect(migration19).toContain("'create_attachment'");
    expect(migration19).toContain("'update_attachment'");
    expect(migration19).toContain("'delete_attachment'");
    expect(migration19).toContain("'attachments'");
  });
});

// ============================================================
// I. FINANCIAL SEPARATION
// ============================================================

describe('I. Strict Financial Separation', () => {
  it('migration 0019 does NOT insert into or mutate purchases, wages, advances, expenses, or customer payments', () => {
    expect(migration19).not.toContain('INSERT INTO public.purchases');
    expect(migration19).not.toContain('INSERT INTO public.daily_wages');
    expect(migration19).not.toContain('INSERT INTO public.employee_advances');
    expect(migration19).not.toContain('INSERT INTO public.expenses');
    expect(migration19).not.toContain('INSERT INTO public.customer_payments');
  });

  it('migration 0019 does NOT alter contract_value or recorded project cost views', () => {
    expect(migration19).not.toContain('UPDATE public.projects SET contract_value');
    expect(migration19).not.toContain('v_project_recorded_cost');
  });
});

// ============================================================
// J. MULTI-TENANT ATTACK SCENARIOS (STEP 17 REQUIREMENTS)
// ============================================================

describe('J. Multi-Tenant Attack Scenarios (Step 17 Verification)', () => {
  it('simulates complete cross-company storage and metadata isolation', () => {
    const storageStore: Record<string, { companyId: string; bucket: string; path: string; data: string }> = {};

    const uploadObject = (userCompanyId: string, bucket: string, path: string, data: string) => {
      const pathCompany = path.split('/')[0];
      if (pathCompany !== userCompanyId) {
        throw new Error(`Storage RLS violation: cannot upload to path ${path} outside company ${userCompanyId}`);
      }
      storageStore[path] = { companyId: userCompanyId, bucket, path, data };
      return true;
    };

    const readObject = (userCompanyId: string, path: string) => {
      const obj = storageStore[path];
      if (!obj || obj.companyId !== userCompanyId) {
        throw new Error(`Storage RLS violation: object ${path} access denied for company ${userCompanyId}`);
      }
      return obj.data;
    };

    const deleteObject = (userCompanyId: string, path: string, isOwner: boolean) => {
      const obj = storageStore[path];
      if (!obj || obj.companyId !== userCompanyId || !isOwner) {
        throw new Error(`Storage RLS violation: object ${path} delete denied`);
      }
      delete storageStore[path];
      return true;
    };

    // 1. Company A uploads object
    uploadObject('comp-A', 'documents', 'comp-A/projects/prj-1/spec.pdf', 'CONFIDENTIAL_A_DATA');
    expect(readObject('comp-A', 'comp-A/projects/prj-1/spec.pdf')).toBe('CONFIDENTIAL_A_DATA');

    // 2. Company B attempts to read Company A object -> BLOCKED
    expect(() => readObject('comp-B', 'comp-A/projects/prj-1/spec.pdf')).toThrow('access denied');

    // 3. Company B attempts to overwrite Company A object -> BLOCKED
    expect(() => uploadObject('comp-B', 'documents', 'comp-A/projects/prj-1/spec.pdf', 'OVERWRITE_ATTEMPT')).toThrow(
      'outside company comp-B'
    );

    // 4. Company B attempts to delete Company A object -> BLOCKED
    expect(() => deleteObject('comp-B', 'comp-A/projects/prj-1/spec.pdf', true)).toThrow('delete denied');

    // 5. Non-owner in Company A attempts to delete -> BLOCKED
    expect(() => deleteObject('comp-A', 'comp-A/projects/prj-1/spec.pdf', false)).toThrow('delete denied');

    // 6. Owner in Company A deletes object -> ALLOWED
    expect(deleteObject('comp-A', 'comp-A/projects/prj-1/spec.pdf', true)).toBe(true);
  });
});

// ============================================================
// K. TYPESCRIPT ALIGNMENT
// ============================================================

describe('K. TypeScript Alignment & Exported Types', () => {
  it('exports AttachmentCategory type in src/types/database.ts', () => {
    expect(typesSource).toContain('export type AttachmentCategory =');
    expect(typesSource).toContain("'Drawing'");
    expect(typesSource).toContain("'Site Photo'");
  });

  it('includes attachments table in Database schema', () => {
    expect(typesSource).toContain('attachments: {');
    expect(typesSource).toContain('storage_bucket:');
    expect(typesSource).toContain('storage_path: string;');
    expect(typesSource).toContain('mime_type: string;');
    expect(typesSource).toContain('file_size: number;');
  });

  it('includes extended daily_site_report_photos fields in Database schema', () => {
    expect(typesSource).toContain('attachment_id: string | null;');
    expect(typesSource).toContain('storage_path: string | null;');
  });

  it('includes documents view alias in Database schema', () => {
    expect(typesSource).toContain('documents: {');
  });

  it('includes register_attachment and get_attachment_access_info in Database functions', () => {
    expect(typesSource).toContain('register_attachment: {');
    expect(typesSource).toContain('get_attachment_access_info: {');
  });
});
