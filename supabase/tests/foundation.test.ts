/**
 * Phase 0: Foundation Tests
 *
 * These tests verify the structural integrity of the Phase 0 foundation
 * without requiring a running Supabase instance.
 *
 * Tests cover:
 * 1. Migration file exists and is valid SQL
 * 2. Database types are correctly defined
 * 3. Supabase client module structure
 * 4. Environment variable safety (no service-role key in frontend)
 * 5. Foundation table definitions
 * 6. RLS policy presence in migration
 * 7. Helper function definitions in migration
 * 8. Service types are company-scoped
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const MIGRATION_PATH = join(ROOT, 'supabase', 'migrations', '0001_foundation.sql');
const CLIENT_PATH = join(ROOT, 'src', 'lib', 'supabase', 'client.ts');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example');

// Read files once
const migration = existsSync(MIGRATION_PATH)
  ? readFileSync(MIGRATION_PATH, 'utf-8')
  : '';

const clientSource = existsSync(CLIENT_PATH)
  ? readFileSync(CLIENT_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

const envExample = existsSync(ENV_EXAMPLE_PATH)
  ? readFileSync(ENV_EXAMPLE_PATH, 'utf-8')
  : '';

// ============================================================
// 1. Migration File Existence
// ============================================================

describe('Migration file', () => {
  it('exists at supabase/migrations/0001_foundation.sql', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true);
  });

  it('is non-empty', () => {
    expect(migration.length).toBeGreaterThan(100);
  });
});

// ============================================================
// 2. Foundation Tables
// ============================================================

describe('Foundation tables in migration', () => {
  it('creates companies table', () => {
    expect(migration).toContain('CREATE TABLE public.companies');
  });

  it('creates profiles table', () => {
    expect(migration).toContain('CREATE TABLE public.profiles');
  });

  it('creates service_types table', () => {
    expect(migration).toContain('CREATE TABLE public.service_types');
  });

  it('creates audit_log table', () => {
    expect(migration).toContain('CREATE TABLE public.audit_log');
  });

  it('does NOT create future business tables', () => {
    const forbidden = [
      'CREATE TABLE public.customers',
      'CREATE TABLE public.enquiries',
      'CREATE TABLE public.projects',
      'CREATE TABLE public.suppliers',
      'CREATE TABLE public.purchases',
      'CREATE TABLE public.employees',
      'CREATE TABLE public.expenses',
      'CREATE TABLE public.payments',
      'CREATE TABLE public.attendance',
      'CREATE TABLE public.daily_wages',
    ];
    for (const table of forbidden) {
      expect(migration).not.toContain(table);
    }
  });
});

// ============================================================
// 3. UUID Primary Keys
// ============================================================

describe('UUID primary keys', () => {
  it('companies uses uuid primary key with gen_random_uuid()', () => {
    expect(migration).toMatch(/id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
  });

  it('profiles uses uuid primary key referencing auth.users', () => {
    expect(migration).toContain('REFERENCES auth.users(id)');
  });
});

// ============================================================
// 4. Company Isolation
// ============================================================

describe('Company isolation', () => {
  it('profiles has company_id', () => {
    // Check migration has company_id in profiles
    expect(migration).toMatch(/company_id\s+uuid\s+NOT NULL\s+REFERENCES public\.companies/);
  });

  it('service_types has company_id with DEFAULT current_company_id()', () => {
    expect(migration).toContain('DEFAULT public.current_company_id()');
  });

  it('service_types has unique constraint on (company_id, name)', () => {
    expect(migration).toContain('UNIQUE (company_id, name)');
  });
});

// ============================================================
// 5. RLS Policies
// ============================================================

describe('RLS policies', () => {
  it('enables RLS on companies', () => {
    expect(migration).toContain('ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY');
  });

  it('enables RLS on profiles', () => {
    expect(migration).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
  });

  it('enables RLS on service_types', () => {
    expect(migration).toContain('ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY');
  });

  it('enables RLS on audit_log', () => {
    expect(migration).toContain('ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY');
  });

  it('does NOT contain USING (true) for business data', () => {
    expect(migration).not.toContain('USING (true)');
  });

  it('uses current_company_id() for company-scoped policies', () => {
    expect(migration).toContain('public.current_company_id()');
  });
});

// ============================================================
// 6. Helper Functions
// ============================================================

describe('Helper functions', () => {
  it('creates current_company_id()', () => {
    expect(migration).toContain('FUNCTION public.current_company_id()');
  });

  it('creates current_role()', () => {
    expect(migration).toContain('FUNCTION public.current_role()');
  });

  it('creates is_owner()', () => {
    expect(migration).toContain('FUNCTION public.is_owner()');
  });

  it('creates has_permission(text)', () => {
    expect(migration).toContain('FUNCTION public.has_permission(');
  });

  it('creates handle_updated_at() trigger function', () => {
    expect(migration).toContain('FUNCTION public.handle_updated_at()');
  });

  it('creates handle_new_user() auth trigger function', () => {
    expect(migration).toContain('FUNCTION public.handle_new_user()');
  });

  it('creates log_audit() helper', () => {
    expect(migration).toContain('FUNCTION public.log_audit(');
  });

  it('all SECURITY DEFINER functions set search_path', () => {
    // Count SECURITY DEFINER occurrences in actual function declarations (not comments)
    // Lines starting with SECURITY DEFINER (ignoring comments that mention it)
    const lines = migration.split('\n');
    const definerLines = lines.filter(l => l.trim().startsWith('SECURITY DEFINER'));
    const searchPathCount = (migration.match(/SET search_path = public/g) || []).length;
    expect(definerLines.length).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerLines.length);
  });
});

// ============================================================
// 7. Auth Foundation
// ============================================================

describe('Auth foundation', () => {
  it('profiles references auth.users(id)', () => {
    expect(migration).toContain('REFERENCES auth.users(id)');
  });

  it('does NOT create password_hash column', () => {
    expect(migration).not.toContain('password_hash');
    expect(migration).not.toContain('password');
  });

  it('creates auth.users trigger for new user setup', () => {
    expect(migration).toContain('on_auth_user_created');
    expect(migration).toContain('AFTER INSERT ON auth.users');
  });

  it('profiles has role column with valid values', () => {
    expect(migration).toContain("CHECK (role IN ('owner', 'supervisor', 'worker'))");
  });
});

// ============================================================
// 8. Supabase Client
// ============================================================

describe('Supabase client', () => {
  it('client.ts exists', () => {
    expect(existsSync(CLIENT_PATH)).toBe(true);
  });

  it('uses VITE_SUPABASE_URL', () => {
    expect(clientSource).toContain('VITE_SUPABASE_URL');
  });

  it('uses VITE_SUPABASE_PUBLISHABLE_KEY', () => {
    expect(clientSource).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
  });

  it('does NOT contain service role key', () => {
    expect(clientSource).not.toContain('SERVICE_ROLE');
    expect(clientSource).not.toContain('service_role');
  });

  it('imports Database type for type safety', () => {
    expect(clientSource).toContain("import type { Database }");
  });

  it('throws if env vars are missing', () => {
    expect(clientSource).toContain('throw new Error');
  });
});

// ============================================================
// 9. No Service-Role Key in Frontend
// ============================================================

describe('Service-role key safety', () => {
  it('client.ts does not reference SERVICE_ROLE_KEY', () => {
    expect(clientSource).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('no frontend source file should import service role key', () => {
    // Check that the src directory has no service role references
    const srcDir = join(ROOT, 'src');
    const checkDir = (dir: string): boolean => {
      const { readdirSync, statSync } = require('fs');
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (checkDir(fullPath)) return true;
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          const content = readFileSync(fullPath, 'utf-8');
          if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) return true;
        }
      }
      return false;
    };
    expect(checkDir(srcDir)).toBe(false);
  });
});

// ============================================================
// 10. Environment Configuration
// ============================================================

describe('Environment configuration', () => {
  it('.env.example exists', () => {
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  it('documents VITE_SUPABASE_URL', () => {
    expect(envExample).toContain('VITE_SUPABASE_URL');
  });

  it('documents VITE_SUPABASE_PUBLISHABLE_KEY', () => {
    expect(envExample).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
  });

  it('documents server-only variables as separate section', () => {
    expect(envExample).toContain('Server-Only');
    expect(envExample).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('does not contain real credentials', () => {
    // VITE_SUPABASE_URL should be empty (just the key name with =)
    const urlLine = envExample.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL='));
    expect(urlLine).toBe('VITE_SUPABASE_URL=');
  });
});

// ============================================================
// 11. Database Types
// ============================================================

describe('Database type definitions', () => {
  it('database.ts exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true);
  });

  it('defines Database interface', () => {
    expect(typesSource).toContain('export interface Database');
  });

  it('defines companies table types', () => {
    expect(typesSource).toContain('companies:');
  });

  it('defines profiles table types', () => {
    expect(typesSource).toContain('profiles:');
  });

  it('defines service_types table types', () => {
    expect(typesSource).toContain('service_types:');
  });

  it('defines audit_log table types', () => {
    expect(typesSource).toContain('audit_log:');
  });

  it('defines helper function types', () => {
    expect(typesSource).toContain('current_company_id:');
    expect(typesSource).toContain('current_role:');
    expect(typesSource).toContain('is_owner:');
    expect(typesSource).toContain('has_permission:');
  });
});

// ============================================================
// 12. Timestamps
// ============================================================

describe('Timestamps in migration', () => {
  it('uses timestamptz (timezone-aware)', () => {
    expect(migration).toContain('timestamptz');
  });

  it('has created_at default now()', () => {
    expect(migration).toContain('created_at  timestamptz NOT NULL DEFAULT now()');
  });

  it('has updated_at trigger on companies', () => {
    expect(migration).toContain('companies_updated_at');
  });

  it('has updated_at trigger on profiles', () => {
    expect(migration).toContain('profiles_updated_at');
  });

  it('has updated_at trigger on service_types', () => {
    expect(migration).toContain('service_types_updated_at');
  });
});

// ============================================================
// 13. Service Types
// ============================================================

describe('Service types', () => {
  it('are company-scoped (company_id column)', () => {
    // Match the service_types section specifically
    const stSection = migration.substring(
      migration.indexOf('CREATE TABLE public.service_types'),
      migration.indexOf(');', migration.indexOf('CREATE TABLE public.service_types')) + 2
    );
    expect(stSection).toContain('company_id');
  });

  it('have sort_order for ordering', () => {
    expect(migration).toContain('sort_order');
  });

  it('have is_active for soft-disable', () => {
    const stSection = migration.substring(
      migration.indexOf('CREATE TABLE public.service_types'),
      migration.indexOf(');', migration.indexOf('CREATE TABLE public.service_types')) + 2
    );
    expect(stSection).toContain('is_active');
  });
});

// ============================================================
// 14. Project Structure
// ============================================================

describe('Project directory structure', () => {
  // Note: docs is at root level but not under src/ or supabase/
  const requiredDirs = [
    'src/components',
    'src/pages',
    'src/layouts',
    'src/hooks',
    'src/lib/supabase',
    'src/services',
    'src/queries',
    'src/mutations',
    'src/forms',
    'src/types',
    'src/validations',
    'src/utils',
    'src/features',
    'supabase/migrations',
    'supabase/functions',
    'supabase/tests',
    'docs',
  ];

  for (const dir of requiredDirs) {
    it(`${dir}/ exists`, () => {
      expect(existsSync(join(ROOT, dir))).toBe(true);
    });
  }
});
