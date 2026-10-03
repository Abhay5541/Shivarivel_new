/**
 * Phase 1: Authentication + Company/Profile Backend Tests
 *
 * Verifies the structural integrity, security constraints, RLS policies,
 * triggers, and safety rules for:
 * 1. Supabase Auth configuration & user-profile linkage
 * 2. Company profile management & company isolation
 * 3. User profile management, self-update rules, and role escalation prevention
 * 4. Database constraints & immutability of company_id
 * 5. Audit logging on company/profile updates
 * 6. SECURITY DEFINER search_path enforcement
 * 7. Non-exposure of service-role keys
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0001_PATH = join(ROOT, 'supabase', 'migrations', '0001_foundation.sql');
const MIGRATION_0002_PATH = join(ROOT, 'supabase', 'migrations', '0002_auth_and_profiles.sql');
const CONFIG_PATH = join(ROOT, 'supabase', 'config.toml');
const CLIENT_PATH = join(ROOT, 'src', 'lib', 'supabase', 'client.ts');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example');

const migration1 = existsSync(MIGRATION_0001_PATH)
  ? readFileSync(MIGRATION_0001_PATH, 'utf-8')
  : '';

const migration2 = existsSync(MIGRATION_0002_PATH)
  ? readFileSync(MIGRATION_0002_PATH, 'utf-8')
  : '';

const configToml = existsSync(CONFIG_PATH)
  ? readFileSync(CONFIG_PATH, 'utf-8')
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
// 1. AUTHENTICATION BACKEND
// ============================================================

describe('Authentication Backend Configuration', () => {
  it('public signup is disabled in config.toml', () => {
    expect(configToml).toContain('enable_signup = false');
  });

  it('email confirmations disabled for controlled owner provisioning', () => {
    expect(configToml).toContain('enable_confirmations = false');
  });

  it('profiles primary key references auth.users(id)', () => {
    expect(migration1).toContain('REFERENCES auth.users(id) ON DELETE CASCADE');
  });

  it('profiles contains no password or secret columns', () => {
    expect(migration1).not.toContain('password_hash');
    expect(migration1).not.toContain('password text');
    expect(migration1).not.toContain('token text');
  });

  it('handle_new_user trigger creates profile linked to auth.users.id', () => {
    expect(migration2).toContain('INSERT INTO public.profiles (id, company_id, full_name, role)');
    expect(migration2).toContain('VALUES (NEW.id, target_company_id');
  });

  it('handle_new_user handles null full_name and email fallbacks safely', () => {
    expect(migration2).toContain("split_part(NEW.email, '@', 1)");
    expect(migration2).toContain("'User'");
  });

  it('handle_new_user supports existing company_id in metadata for invited team members', () => {
    expect(migration2).toContain("NEW.raw_user_meta_data ->> 'company_id'");
    expect(migration2).toContain('SELECT EXISTS');
  });
});

// ============================================================
// 2. COMPANY MANAGEMENT BACKEND
// ============================================================

describe('Company Management Backend', () => {
  it('companies table supports all standard profile fields', () => {
    const fields = [
      'name',
      'logo_url',
      'address',
      'phone',
      'alternate_phone',
      'email',
      'website',
      'gst_number',
      'owner_name',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration1).toContain(field);
    }
  });

  it('companies table has RLS enabled', () => {
    expect(migration1).toContain('ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY');
  });

  it('users can only view their own company (company isolation)', () => {
    expect(migration1).toContain('CREATE POLICY "Users can view own company"');
    expect(migration1).toContain('USING (id = public.current_company_id())');
  });

  it('only owners can update their own company', () => {
    expect(migration1).toContain('CREATE POLICY "Owners can update own company"');
    expect(migration1).toContain('USING (id = public.current_company_id() AND public.is_owner())');
    expect(migration1).toContain('WITH CHECK (id = public.current_company_id() AND public.is_owner())');
  });

  it('non-owners cannot update company records', () => {
    // The policy explicitly requires is_owner()
    expect(migration1).toMatch(/Owners can update own company[\s\S]*?public\.is_owner\(\)/);
  });
});

// ============================================================
// 3. PROFILE MANAGEMENT & ACCESS RULES
// ============================================================

describe('Profile Access Rules & Security', () => {
  it('profiles table contains all specified fields', () => {
    const fields = [
      'id',
      'company_id',
      'full_name',
      'phone',
      'role',
      'is_active',
      'created_at',
      'updated_at',
    ];
    for (const field of fields) {
      expect(migration1).toContain(field);
    }
  });

  it('users can view profiles within their company', () => {
    expect(migration1).toContain('CREATE POLICY "Users can view company profiles"');
    expect(migration1).toContain('USING (company_id = public.current_company_id())');
  });

  it('users can update their own profile within their current company', () => {
    expect(migration2).toContain('CREATE POLICY "Users can update own profile"');
    expect(migration2).toContain('id = auth.uid()');
    expect(migration2).toContain('company_id = public.current_company_id()');
  });

  it('owners can update team member profiles within their company', () => {
    expect(migration2).toContain('CREATE POLICY "Owners can update company profiles"');
    expect(migration2).toMatch(/company_id = public\.current_company_id\(\)\s+AND public\.is_owner\(\)/);
  });

  it('profile protection trigger prevents company_id changes', () => {
    expect(migration2).toContain('NEW.company_id IS DISTINCT FROM OLD.company_id');
    expect(migration2).toContain("RAISE EXCEPTION 'company_id cannot be changed'");
  });

  it('profile protection trigger prevents non-owners from promoting themselves to owner', () => {
    expect(migration2).toContain('IF NOT public.is_owner() THEN');
    expect(migration2).toContain('NEW.role IS DISTINCT FROM OLD.role');
    expect(migration2).toContain("RAISE EXCEPTION 'Only owners can change profile roles'");
  });

  it('profile protection trigger prevents non-owners from changing is_active status', () => {
    expect(migration2).toContain('NEW.is_active IS DISTINCT FROM OLD.is_active');
    expect(migration2).toContain("RAISE EXCEPTION 'Only owners can change account active status'");
  });

  it('trg_protect_profile_fields is attached as BEFORE UPDATE trigger', () => {
    expect(migration2).toContain('CREATE TRIGGER trg_protect_profile_fields');
    expect(migration2).toContain('BEFORE UPDATE ON public.profiles');
    expect(migration2).toContain('EXECUTE FUNCTION public.protect_profile_fields()');
  });
});

// ============================================================
// 4. AUDIT LOGGING
// ============================================================

describe('Phase 1 Audit Logging', () => {
  it('audits company profile updates', () => {
    expect(migration2).toContain('CREATE OR REPLACE FUNCTION public.audit_company_update()');
    expect(migration2).toContain("'update_company_profile'");
    expect(migration2).toContain('CREATE TRIGGER trg_audit_company_update');
    expect(migration2).toContain('AFTER UPDATE ON public.companies');
  });

  it('audits profile updates and sensitive role/status changes', () => {
    expect(migration2).toContain('CREATE OR REPLACE FUNCTION public.audit_profile_update()');
    expect(migration2).toContain("'change_role'");
    expect(migration2).toContain("'change_status'");
    expect(migration2).toContain('CREATE TRIGGER trg_audit_profile_update');
    expect(migration2).toContain('AFTER UPDATE ON public.profiles');
  });

  it('audit triggers do NOT record passwords or credentials', () => {
    expect(migration2).not.toContain('password');
    expect(migration2).not.toContain('secret');
  });

  it('audit_log RLS protects against unauthorized client insertions', () => {
    // Migration 1 only has SELECT policy for users; inserts are restricted to triggers / functions
    expect(migration1).toContain('CREATE POLICY "Users can view company audit logs"');
    expect(migration1).not.toContain('CREATE POLICY "Users can insert audit logs"');
  });
});

// ============================================================
// 5. SECURITY DEFINER REVIEW
// ============================================================

describe('Security Definer Hardening', () => {
  it('all SECURITY DEFINER functions in migration 0002 set search_path = public', () => {
    const lines = migration2.split('\n');
    const definerCount = lines.filter(l => l.trim().startsWith('SECURITY DEFINER')).length;
    const searchPathCount = (migration2.match(/SET search_path = public/g) || []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBe(definerCount);
  });

  it('no SERVICE_ROLE_KEY exposed in client code', () => {
    expect(clientSource).not.toContain('SERVICE_ROLE');
    expect(clientSource).not.toContain('service_role');
  });

  it('env example properly segregates server-only variables', () => {
    expect(envExample).toContain('Server-Only');
    expect(envExample).toContain('# SUPABASE_SERVICE_ROLE_KEY=');
  });
});

// ============================================================
// 6. SCOPE INTEGRITY (NO FUTURE MODULES / NO FINANCIAL LOGIC)
// ============================================================

describe('Scope Integrity', () => {
  it('does NOT create future business tables in Phase 1', () => {
    const forbidden = [
      'CREATE TABLE public.customers',
      'CREATE TABLE public.enquiries',
      'CREATE TABLE public.projects',
      'CREATE TABLE public.suppliers',
      'CREATE TABLE public.purchases',
      'CREATE TABLE public.employees',
      'CREATE TABLE public.expenses',
      'CREATE TABLE public.customer_payments',
      'CREATE TABLE public.daily_wages',
    ];
    for (const table of forbidden) {
      expect(migration2).not.toContain(table);
    }
  });

  it('does NOT implement financial balance calculations in Phase 1', () => {
    const forbidden = [
      'supplier_balance',
      'customer_balance',
      'purchase_balance',
      'wage_balance',
      'calculate_profit',
    ];
    for (const term of forbidden) {
      expect(migration2).not.toContain(term);
    }
  });

  it('types file is consistent with database models', () => {
    expect(typesSource).toContain('companies:');
    expect(typesSource).toContain('profiles:');
    expect(typesSource).toContain('service_types:');
    expect(typesSource).toContain('audit_log:');
  });
});
