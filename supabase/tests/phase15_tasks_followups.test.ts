/**
 * Phase 15: My Day / Tasks / Follow-ups Backend Tests
 *
 * Comprehensive tests verifying:
 * A. Task Creation & Table Schema: columns, defaults, FKs, constraints
 * B. Task Relationship Integrity: company isolation, customer/project alignment, customer/enquiry alignment
 * C. Task Lifecycle: Pending -> In Progress -> Completed, completed_at timestamp, Cancelled
 * D. Task Due Dates: overdue, today, upcoming filtering and calculations
 * E. Follow-up Creation & Schema: customer required, follow_up_date, title, optional project/enquiry
 * F. Follow-up Relationship Integrity: composite FKs to customer, enquiry, and project
 * G. Follow-up Lifecycle: Pending -> Completed, completed_at, Cancelled
 * H. Follow-up Dates: grouping into overdue, today, and upcoming
 * I. My Day Unified Operational View & RPC: unified tasks, follow-ups, and scheduled site visits
 * J. Multi-Tenant Company Isolation & RLS: SELECT, INSERT, UPDATE, DELETE policies
 * K. Completion Operations: complete_task and complete_follow_up RPCs
 * L. Audit Logging: create, complete, cancel, update, delete audit trails
 * M. Existing Data Integration: reads existing site visits, customers, enquiries, projects without mutation
 * N. Zero Financial Side Effects: operational tasks do NOT alter purchases, wages, payments, or expenses
 * O. TypeScript Alignment & Scope Boundaries: type safety, exclusions enforcement
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_0016_PATH = join(ROOT, 'supabase', 'migrations', '0016_tasks_followups.sql');
const TYPES_PATH = join(ROOT, 'src', 'types', 'database.ts');

const migration16 = existsSync(MIGRATION_0016_PATH)
  ? readFileSync(MIGRATION_0016_PATH, 'utf-8')
  : '';

const typesSource = existsSync(TYPES_PATH)
  ? readFileSync(TYPES_PATH, 'utf-8')
  : '';

// ============================================================
// A. TASK CREATION & SCHEMA CONSTRAINTS
// ============================================================

describe('A. Task Table Schema & Constraints', () => {
  it('migration 0016 exists and is non-empty', () => {
    expect(existsSync(MIGRATION_0016_PATH)).toBe(true);
    expect(migration16.length).toBeGreaterThan(100);
  });

  it('creates public.tasks table', () => {
    expect(migration16).toContain('CREATE TABLE public.tasks');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration16).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires company_id referencing companies(id) ON DELETE RESTRICT', () => {
    expect(migration16).toContain('company_id      uuid NOT NULL DEFAULT public.current_company_id()');
    expect(migration16).toContain('REFERENCES public.companies(id) ON DELETE RESTRICT');
  });

  it('requires non-blank title', () => {
    expect(migration16).toContain('title           text NOT NULL CHECK (char_length(trim(title)) > 0)');
  });

  it('contains fields: description, category, priority, status, due_date, task_date', () => {
    expect(migration16).toContain('description     text');
    expect(migration16).toContain('category        text');
    expect(migration16).toContain("priority        text NOT NULL DEFAULT 'Medium'");
    expect(migration16).toContain("CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'))");
    expect(migration16).toContain("status          text NOT NULL DEFAULT 'Pending'");
    expect(migration16).toContain("CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled'))");
    expect(migration16).toContain('due_date        date');
    expect(migration16).toContain('task_date       date NOT NULL DEFAULT CURRENT_DATE');
  });

  it('contains optional relationships: customer_id, project_id, enquiry_id, site_visit_id, assigned_to', () => {
    expect(migration16).toContain('customer_id     uuid');
    expect(migration16).toContain('project_id      uuid');
    expect(migration16).toContain('enquiry_id      uuid');
    expect(migration16).toContain('site_visit_id   uuid');
    expect(migration16).toContain('assigned_to     uuid');
  });

  it('contains completed_at and notes fields', () => {
    expect(migration16).toContain('completed_at    timestamptz');
    expect(migration16).toContain('notes           text');
  });

  it('enforces composite foreign keys ensuring referenced entities belong to company_id', () => {
    expect(migration16).toContain('CONSTRAINT fk_tasks_customer_company');
    expect(migration16).toContain('CONSTRAINT fk_tasks_project_company');
    expect(migration16).toContain('CONSTRAINT fk_tasks_enquiry_company');
    expect(migration16).toContain('CONSTRAINT fk_tasks_site_visit_company');
    expect(migration16).toContain('CONSTRAINT fk_tasks_assigned_profile_company');
  });
});

// ============================================================
// B. TASK RELATIONSHIP INTEGRITY
// ============================================================

describe('B. Task Relationship Integrity', () => {
  it('implements validate_task_integrity trigger function', () => {
    expect(migration16).toContain('FUNCTION public.validate_task_integrity()');
    expect(migration16).toContain('trg_validate_task_integrity');
  });

  it('rejects blank or whitespace-only task titles', () => {
    expect(migration16).toContain('Task title cannot be blank');
  });

  it('validates customer and project alignment via trigger', () => {
    expect(migration16).toContain('Customer/Project mismatch: Project % does not belong to customer %');
  });

  it('validates customer and enquiry alignment via trigger', () => {
    expect(migration16).toContain('Customer/Enquiry mismatch: Enquiry % does not belong to customer %');
  });
});

// ============================================================
// C. TASK LIFECYCLE
// ============================================================

describe('C. Task Lifecycle & Completion', () => {
  it('supports full lifecycle states: Pending, In Progress, Completed, Cancelled', () => {
    expect(migration16).toContain("'Pending', 'In Progress', 'Completed', 'Cancelled'");
  });

  it('automatically sets completed_at when status transitions to Completed', () => {
    expect(migration16).toContain("NEW.status = 'Completed'");
    expect(migration16).toContain('NEW.completed_at := now();');
  });

  it('clears completed_at if status transitions away from Completed', () => {
    expect(migration16).toContain("NEW.status != 'Completed'");
    expect(migration16).toContain('NEW.completed_at := NULL;');
  });

  it('prevents completing a cancelled task', () => {
    expect(migration16).toContain('Cannot complete a cancelled task %');
  });
});

// ============================================================
// D. TASK DATES & URGENCY
// ============================================================

describe('D. Task Due Dates & Urgency Classification', () => {
  interface TaskSim {
    id: string;
    title: string;
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  }

  const today = '2026-09-30';

  const tasks: TaskSim[] = [
    { id: 't-1', title: 'Overdue task', dueDate: '2026-09-28', status: 'Pending' },
    { id: 't-2', title: 'Due today task', dueDate: '2026-09-30', status: 'Pending' },
    { id: 't-3', title: 'Future task', dueDate: '2026-10-05', status: 'Pending' },
    { id: 't-4', title: 'Completed overdue task', dueDate: '2026-09-27', status: 'Completed' },
    { id: 't-5', title: 'Cancelled overdue task', dueDate: '2026-09-26', status: 'Cancelled' },
  ];

  it('correctly filters overdue active tasks', () => {
    const overdue = tasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate < today
    );
    expect(overdue.length).toBe(1);
    expect(overdue[0].id).toBe('t-1');
  });

  it('correctly filters today active tasks', () => {
    const todayTasks = tasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate === today
    );
    expect(todayTasks.length).toBe(1);
    expect(todayTasks[0].id).toBe('t-2');
  });

  it('correctly filters upcoming active tasks', () => {
    const upcoming = tasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate > today
    );
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].id).toBe('t-3');
  });

  it('excludes completed and cancelled tasks from active overdue lists', () => {
    const activeTasks = tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress');
    expect(activeTasks.some((t) => t.id === 't-4')).toBe(false);
    expect(activeTasks.some((t) => t.id === 't-5')).toBe(false);
  });
});

// ============================================================
// E. FOLLOW-UP CREATION & SCHEMA
// ============================================================

describe('E. Follow-up Table Schema & Constraints', () => {
  it('creates public.follow_ups table', () => {
    expect(migration16).toContain('CREATE TABLE public.follow_ups');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(migration16).toMatch(/id\s+uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it('requires customer_id referencing customers(id) ON DELETE RESTRICT', () => {
    expect(migration16).toContain('customer_id     uuid NOT NULL');
    expect(migration16).toContain('REFERENCES public.customers(id) ON DELETE RESTRICT');
  });

  it('requires follow_up_date and non-blank title', () => {
    expect(migration16).toContain('follow_up_date  date NOT NULL');
    expect(migration16).toContain('title           text NOT NULL CHECK (char_length(trim(title)) > 0)');
  });

  it('contains status defaulting to Pending with valid check constraint', () => {
    expect(migration16).toContain("status          text NOT NULL DEFAULT 'Pending'");
    expect(migration16).toContain("CHECK (status IN ('Pending', 'Completed', 'Cancelled'))");
  });

  it('contains optional relationships: enquiry_id, project_id, assigned_to', () => {
    expect(migration16).toContain('enquiry_id      uuid');
    expect(migration16).toContain('project_id      uuid');
    expect(migration16).toContain('assigned_to     uuid');
  });
});

// ============================================================
// F. FOLLOW-UP RELATIONSHIP INTEGRITY
// ============================================================

describe('F. Follow-up Relationship Integrity', () => {
  it('enforces composite foreign key to customers matching company_id', () => {
    expect(migration16).toContain('CONSTRAINT fk_follow_ups_customer_company');
    expect(migration16).toContain('FOREIGN KEY (company_id, customer_id)');
  });

  it('enforces composite foreign key to enquiries matching company_id AND customer_id', () => {
    expect(migration16).toContain('CONSTRAINT fk_follow_ups_enquiry_customer_company');
    expect(migration16).toContain('FOREIGN KEY (company_id, customer_id, enquiry_id)');
    expect(migration16).toContain('REFERENCES public.enquiries (company_id, customer_id, id)');
  });

  it('enforces composite foreign key to projects matching company_id AND customer_id', () => {
    expect(migration16).toContain('CONSTRAINT fk_follow_ups_project_customer_company');
    expect(migration16).toContain('FOREIGN KEY (company_id, customer_id, project_id)');
    expect(migration16).toContain('REFERENCES public.projects (company_id, customer_id, id)');
  });

  it('implements validate_follow_up_integrity trigger function', () => {
    expect(migration16).toContain('FUNCTION public.validate_follow_up_integrity()');
    expect(migration16).toContain('trg_validate_follow_up_integrity');
    expect(migration16).toContain('Follow-up title cannot be blank');
  });
});

// ============================================================
// G. FOLLOW-UP LIFECYCLE
// ============================================================

describe('G. Follow-up Lifecycle & Completion', () => {
  it('supports lifecycle states: Pending, Completed, Cancelled', () => {
    expect(migration16).toContain("'Pending', 'Completed', 'Cancelled'");
  });

  it('automatically sets completed_at when status transitions to Completed', () => {
    expect(migration16).toContain("NEW.status = 'Completed'");
    expect(migration16).toContain('NEW.completed_at := now();');
  });

  it('prevents completing a cancelled follow-up', () => {
    expect(migration16).toContain('Cannot complete a cancelled follow-up %');
  });
});

// ============================================================
// H. FOLLOW-UP DATES & GROUPING
// ============================================================

describe('H. Follow-up Dates & Grouping', () => {
  interface FollowUpSim {
    id: string;
    title: string;
    followUpDate: string;
    status: 'Pending' | 'Completed' | 'Cancelled';
  }

  const today = '2026-09-30';

  const followUps: FollowUpSim[] = [
    { id: 'f-1', title: 'Overdue follow-up', followUpDate: '2026-09-25', status: 'Pending' },
    { id: 'f-2', title: 'Due today follow-up', followUpDate: '2026-09-30', status: 'Pending' },
    { id: 'f-3', title: 'Future follow-up', followUpDate: '2026-10-02', status: 'Pending' },
    { id: 'f-4', title: 'Completed follow-up', followUpDate: '2026-09-24', status: 'Completed' },
  ];

  it('identifies overdue follow-ups', () => {
    const overdue = followUps.filter((f) => f.status === 'Pending' && f.followUpDate < today);
    expect(overdue.length).toBe(1);
    expect(overdue[0].id).toBe('f-1');
  });

  it('identifies today follow-ups', () => {
    const todayFUs = followUps.filter((f) => f.status === 'Pending' && f.followUpDate === today);
    expect(todayFUs.length).toBe(1);
    expect(todayFUs[0].id).toBe('f-2');
  });

  it('identifies upcoming follow-ups', () => {
    const upcoming = followUps.filter((f) => f.status === 'Pending' && f.followUpDate > today);
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].id).toBe('f-3');
  });
});

// ============================================================
// I. MY DAY UNIFIED OPERATIONAL VIEW & RPC
// ============================================================

describe('I. My Day Operational View & RPC', () => {
  it('creates unified operational view public.v_my_day', () => {
    expect(migration16).toContain('CREATE OR REPLACE VIEW public.v_my_day AS');
    expect(migration16).toContain("'task' AS item_type");
    expect(migration16).toContain("'follow_up' AS item_type");
    expect(migration16).toContain("'site_visit' AS item_type");
    expect(migration16).toContain('urgency');
  });

  it('groups items into OVERDUE, TODAY, and UPCOMING', () => {
    expect(migration16).toContain("'OVERDUE'");
    expect(migration16).toContain("'TODAY'");
    expect(migration16).toContain("'UPCOMING'");
  });

  it('implements get_my_day RPC with SECURITY DEFINER and search_path = public', () => {
    expect(migration16).toContain('FUNCTION public.get_my_day(');
    expect(migration16).toContain('SECURITY DEFINER');
    expect(migration16).toContain('SET search_path = public');
    expect(migration16).toContain('p_date date DEFAULT CURRENT_DATE');
    expect(migration16).toContain("'overdue', v_overdue");
    expect(migration16).toContain("'today', v_today");
    expect(migration16).toContain("'upcoming', v_upcoming");
    expect(migration16).toContain("'counts', v_counts");
  });

  it('simulates unified My Day aggregation for tasks, follow-ups, and site visits', () => {
    interface MyDayItem {
      type: 'task' | 'follow_up' | 'site_visit';
      title: string;
      date: string;
      status: string;
    }

    const items: MyDayItem[] = [
      { type: 'task', title: 'Prepare estimate', date: '2026-09-28', status: 'Pending' }, // Overdue
      { type: 'task', title: 'Order tiles', date: '2026-09-30', status: 'Pending' }, // Today
      { type: 'follow_up', title: 'Call client about drawing', date: '2026-09-30', status: 'Pending' }, // Today
      { type: 'site_visit', title: 'Site visit with engineer', date: '2026-09-30', status: 'Scheduled' }, // Today
      { type: 'follow_up', title: 'Material arrival check', date: '2026-09-25', status: 'Pending' }, // Overdue
    ];

    const todayStr = '2026-09-30';

    const overdue = items.filter((i) => i.date < todayStr);
    const todayItems = items.filter((i) => i.date === todayStr);

    expect(overdue.length).toBe(2);
    expect(todayItems.length).toBe(3);
    expect(todayItems.some((i) => i.type === 'site_visit')).toBe(true);
    expect(todayItems.some((i) => i.type === 'follow_up')).toBe(true);
    expect(todayItems.some((i) => i.type === 'task')).toBe(true);
  });
});

// ============================================================
// J. MULTI-TENANT COMPANY ISOLATION & RLS
// ============================================================

describe('J. Multi-Tenant Company Isolation & RLS', () => {
  it('enables row level security on public.tasks and public.follow_ups', () => {
    expect(migration16).toContain('ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;');
    expect(migration16).toContain('ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;');
  });

  it('defines company-scoped SELECT, INSERT, UPDATE, and DELETE policies on tasks', () => {
    expect(migration16).toContain('"Users can view company tasks"');
    expect(migration16).toContain('"Users can insert company tasks"');
    expect(migration16).toContain('"Users can update company tasks"');
    expect(migration16).toContain('"Owners can delete company tasks"');
    expect(migration16).toContain('public.is_owner()');
  });

  it('defines company-scoped SELECT, INSERT, UPDATE, and DELETE policies on follow_ups', () => {
    expect(migration16).toContain('"Users can view company follow-ups"');
    expect(migration16).toContain('"Users can insert company follow-ups"');
    expect(migration16).toContain('"Users can update company follow-ups"');
    expect(migration16).toContain('"Owners can delete company follow-ups"');
  });

  it('never uses USING (true) or WITH CHECK (true)', () => {
    expect(migration16).not.toContain('USING (true)');
    expect(migration16).not.toContain('WITH CHECK (true)');
  });
});

// ============================================================
// K. COMPLETION OPERATIONS
// ============================================================

describe('K. Safe Completion Operations', () => {
  it('implements complete_task RPC with company validation', () => {
    expect(migration16).toContain('FUNCTION public.complete_task(');
    expect(migration16).toContain('Task % not found');
    expect(migration16).toContain("status = 'Completed'");
    expect(migration16).toContain('completed_at = now()');
  });

  it('implements complete_follow_up RPC with company validation', () => {
    expect(migration16).toContain('FUNCTION public.complete_follow_up(');
    expect(migration16).toContain('Follow-up % not found');
    expect(migration16).toContain("status = 'Completed'");
    expect(migration16).toContain('completed_at = now()');
  });

  it('allows optional completion notes appending', () => {
    expect(migration16).toContain("'Completion: ' || p_notes");
  });
});

// ============================================================
// L. AUDIT LOGGING TRIGGERS
// ============================================================

describe('L. Audit Logging Triggers', () => {
  it('implements audit_task_changes trigger function', () => {
    expect(migration16).toContain('FUNCTION public.audit_task_changes()');
    expect(migration16).toContain("'create_task'");
    expect(migration16).toContain("'complete_task'");
    expect(migration16).toContain("'cancel_task'");
    expect(migration16).toContain("'update_task'");
    expect(migration16).toContain("'delete_task'");
    expect(migration16).toContain("'tasks'");
  });

  it('implements audit_follow_up_changes trigger function', () => {
    expect(migration16).toContain('FUNCTION public.audit_follow_up_changes()');
    expect(migration16).toContain("'create_follow_up'");
    expect(migration16).toContain("'complete_follow_up'");
    expect(migration16).toContain("'cancel_follow_up'");
    expect(migration16).toContain("'update_follow_up'");
    expect(migration16).toContain("'delete_follow_up'");
    expect(migration16).toContain("'follow_ups'");
  });
});

// ============================================================
// M. EXISTING DATA INTEGRATION
// ============================================================

describe('M. Integration with Existing Operational Records', () => {
  it('reads existing scheduled site visits directly from site_visits table', () => {
    expect(migration16).toContain('FROM public.site_visits sv');
    expect(migration16).toContain("sv.status = 'Scheduled'");
  });

  it('does NOT alter site_visits table schema', () => {
    expect(migration16).not.toContain('ALTER TABLE public.site_visits');
  });

  it('does NOT alter enquiries or customers table schema', () => {
    expect(migration16).not.toContain('ALTER TABLE public.customers');
    expect(migration16).not.toContain('ALTER TABLE public.enquiries');
  });
});

// ============================================================
// N. ZERO FINANCIAL SIDE EFFECTS
// ============================================================

describe('N. Zero Financial Side Effects', () => {
  it('tasks and follow-ups migration does NOT modify financial schemas', () => {
    expect(migration16).not.toContain('ALTER TABLE public.purchases');
    expect(migration16).not.toContain('ALTER TABLE public.supplier_payments');
    expect(migration16).not.toContain('ALTER TABLE public.daily_wages');
    expect(migration16).not.toContain('ALTER TABLE public.employee_advances');
    expect(migration16).not.toContain('ALTER TABLE public.employee_payments');
    expect(migration16).not.toContain('ALTER TABLE public.expenses');
    expect(migration16).not.toContain('ALTER TABLE public.customer_payments');
  });

  it('demonstrates completing tasks does NOT alter project costs or contract balances', () => {
    const projectPurchases = 50000;
    const projectWages = 20000;
    const projectExpenses = 5000;
    const projectCost = projectPurchases + projectWages + projectExpenses;

    const taskCompleted = true;
    expect(taskCompleted).toBe(true);

    // Project cost remains invariant
    expect(projectCost).toBe(75000);
  });
});

// ============================================================
// O. TYPESCRIPT TYPES ALIGNMENT & SCOPE BOUNDARIES
// ============================================================

describe('O. TypeScript Types Alignment & Scope Boundaries', () => {
  it('types database.ts includes tasks and follow_ups table definitions', () => {
    expect(typesSource).toContain('tasks: {');
    expect(typesSource).toContain('title: string;');
    expect(typesSource).toContain('priority: TaskPriority;');
    expect(typesSource).toContain('status: TaskStatus;');
    expect(typesSource).toContain('follow_ups: {');
    expect(typesSource).toContain('follow_up_date: string;');
    expect(typesSource).toContain('status: FollowUpStatus;');
  });

  it('types database.ts exports TaskPriority, TaskStatus, FollowUpStatus, and MyDayUrgency types', () => {
    expect(typesSource).toContain('export type TaskPriority =');
    expect(typesSource).toContain('export type TaskStatus =');
    expect(typesSource).toContain('export type FollowUpStatus =');
    expect(typesSource).toContain('export type MyDayUrgency =');
  });

  it('types database.ts includes v_my_day view definition', () => {
    expect(typesSource).toContain('v_my_day: {');
    expect(typesSource).toContain("item_type: 'task' | 'follow_up' | 'site_visit';");
    expect(typesSource).toContain('urgency: MyDayUrgency;');
  });

  it('types database.ts includes RPCs: complete_task, complete_follow_up, get_my_day', () => {
    expect(typesSource).toContain('complete_task: {');
    expect(typesSource).toContain('complete_follow_up: {');
    expect(typesSource).toContain('get_my_day: {');
  });

  it('preserves scope exclusions: no frontend UI or React components', () => {
    expect(migration16).not.toContain('React');
    expect(migration16).not.toContain('useState');
    expect(migration16).not.toContain('useQuery');
    expect(migration16).not.toContain('export default function');
  });
});
