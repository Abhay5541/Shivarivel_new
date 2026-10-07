import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  CustomerPayment,
  CustomerPaymentFormData,
  ProjectCustomerBalance,
  Expense,
  ExpenseFormData,
  RecordedProjectCost,
  CompanyFinancialSummary,
} from '@/types/finance';

// ==========================================
// MEMORY SEED DATA FOR DEV / OFFLINE RUNS
// ==========================================

export let memoryCustomerPayments: CustomerPayment[] = [
  {
    id: 'cp-01',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-01',
    project_id: 'proj-01',
    payment_number: 'CP-0001',
    payment_date: '2026-08-15',
    amount: 1000000,
    payment_method: 'Bank Transfer',
    reference_number: 'NEFT-HDFC-992144',
    notes: 'Stage 1: Plinth level milestone payment received as per agreed contract schedule.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-08-15T11:00:00Z',
    updated_at: '2026-08-15T11:00:00Z',
    customer: {
      id: 'cust-01',
      name: 'S. Annamalai',
      phone: '9840123456',
    },
    project: {
      id: 'proj-01',
      project_code: 'PRJ-2026-001',
      name: 'Annamalai Residential Villa',
      contract_value: 4500000,
    },
  },
  {
    id: 'cp-02',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-01',
    project_id: 'proj-01',
    payment_number: 'CP-0002',
    payment_date: '2026-09-20',
    amount: 800000,
    payment_method: 'UPI',
    reference_number: 'UPI-AXIS-774012',
    notes: 'Stage 2: Ground floor roof slab casting milestone completion receipt.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-20T14:30:00Z',
    updated_at: '2026-09-20T14:30:00Z',
    customer: {
      id: 'cust-01',
      name: 'S. Annamalai',
      phone: '9840123456',
    },
    project: {
      id: 'proj-01',
      project_code: 'PRJ-2026-001',
      name: 'Annamalai Residential Villa',
      contract_value: 4500000,
    },
  },
  {
    id: 'cp-03',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-02',
    project_id: 'proj-02',
    payment_number: 'CP-0003',
    payment_date: '2026-09-10',
    amount: 1500000,
    payment_method: 'Bank Transfer',
    reference_number: 'RTGS-SBI-881290',
    notes: 'Initial mobilization advance & structural steel procurement advance.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
    customer: {
      id: 'cust-02',
      name: 'Meenakshi Sundaram',
      phone: '9443187654',
    },
    project: {
      id: 'proj-02',
      project_code: 'PRJ-2026-002',
      name: 'Meenakshi Commercial Complex',
      contract_value: 8500000,
    },
  },
  {
    id: 'cp-04',
    company_id: 'comp-shivarivel-001',
    customer_id: 'cust-03',
    project_id: 'proj-03',
    payment_number: 'CP-0004',
    payment_date: '2026-09-28',
    amount: 600000,
    payment_method: 'Cheque',
    reference_number: 'CHQ-IOB-443210',
    notes: 'Carpentry & interior false ceiling preliminary milestone payment.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-28T16:00:00Z',
    updated_at: '2026-09-28T16:00:00Z',
    customer: {
      id: 'cust-03',
      name: 'Dr. K. Rajendran',
      phone: '9842233445',
    },
    project: {
      id: 'proj-03',
      project_code: 'PRJ-2026-003',
      name: 'Karpagam Nagar Residence',
      contract_value: 2800000,
    },
  },
];

export let memoryExpenses: Expense[] = [
  {
    id: 'exp-01',
    company_id: 'comp-shivarivel-001',
    project_id: 'proj-01',
    expense_number: 'EXP-0001',
    expense_date: '2026-09-12',
    category: 'Site Transportation',
    description: 'Tractor haulage for river sand and coarse aggregates from local quarry to site gate.',
    amount: 14500,
    paid_by: 'K. Senthil Nathan (Site Supervisor)',
    payment_method: 'Cash',
    reference_number: 'VOUCHER-089',
    notes: 'Paid cash directly to tractor driver upon offloading.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-12T11:00:00Z',
    updated_at: '2026-09-12T11:00:00Z',
    project: {
      id: 'proj-01',
      project_code: 'PRJ-2026-001',
      name: 'Annamalai Residential Villa',
    },
  },
  {
    id: 'exp-02',
    company_id: 'comp-shivarivel-001',
    project_id: 'proj-01',
    expense_number: 'EXP-0002',
    expense_date: '2026-09-18',
    category: 'Equipment Rental',
    description: 'Concrete mixer machine and vibrator needle rental for slab casting (3 days).',
    amount: 18000,
    paid_by: 'M. Shanmugam (Maistry)',
    payment_method: 'UPI',
    reference_number: 'UPI-GPay-9831',
    notes: 'Equip Rental agency: Sri Meenakshi Tools & Hire.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-18T16:30:00Z',
    updated_at: '2026-09-18T16:30:00Z',
    project: {
      id: 'proj-01',
      project_code: 'PRJ-2026-001',
      name: 'Annamalai Residential Villa',
    },
  },
  {
    id: 'exp-03',
    company_id: 'comp-shivarivel-001',
    project_id: 'proj-02',
    expense_number: 'EXP-0003',
    expense_date: '2026-09-22',
    category: 'Small Tools',
    description: 'Diamond cutting blades, safety helmets, gum boots, and scaffolding clamps.',
    amount: 12400,
    paid_by: 'K. Senthil Nathan',
    payment_method: 'UPI',
    reference_number: 'UPI-PhonePe-6621',
    notes: 'Hardware store receipt filed in site office folder.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-22T10:15:00Z',
    updated_at: '2026-09-22T10:15:00Z',
    project: {
      id: 'proj-02',
      project_code: 'PRJ-2026-002',
      name: 'Meenakshi Commercial Complex',
    },
  },
  {
    id: 'exp-04',
    company_id: 'comp-shivarivel-001',
    project_id: 'proj-02',
    expense_number: 'EXP-0004',
    expense_date: '2026-09-25',
    category: 'Fuel',
    description: 'Diesel for on-site 15 kVA generator during 3-phase TNEB power shutdown.',
    amount: 8500,
    paid_by: 'P. Alaguraj (Electrician)',
    payment_method: 'Cash',
    reference_number: 'HPCL-PETROL-8812',
    notes: '100 Litres diesel purchased from HP Petrol Bunk Kappalur.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-25T17:00:00Z',
    updated_at: '2026-09-25T17:00:00Z',
    project: {
      id: 'proj-02',
      project_code: 'PRJ-2026-002',
      name: 'Meenakshi Commercial Complex',
    },
  },
  {
    id: 'exp-05',
    company_id: 'comp-shivarivel-001',
    project_id: null, // Company General Overhead
    expense_number: 'EXP-0005',
    expense_date: '2026-09-30',
    category: 'Electricity',
    description: 'TNEB commercial headquarters electricity tariff bill for main branch office.',
    amount: 6200,
    paid_by: 'Finance Admin',
    payment_method: 'Bank Transfer',
    reference_number: 'TNEB-ONLINE-55410',
    notes: 'General head office administrative overhead, not allocated to any single site.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-09-30T09:00:00Z',
    updated_at: '2026-09-30T09:00:00Z',
    project: null,
  },
  {
    id: 'exp-06',
    company_id: 'comp-shivarivel-001',
    project_id: null, // Company General Overhead
    expense_number: 'EXP-0006',
    expense_date: '2026-10-01',
    category: 'Internet',
    description: 'BSNL Fiber optic broadband monthly subscription for head office ERP terminal.',
    amount: 1800,
    paid_by: 'Finance Admin',
    payment_method: 'UPI',
    reference_number: 'BSNL-BHARAT-991',
    notes: 'Monthly connection bill.',
    status: 'Confirmed',
    reversal_of_id: null,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    project: null,
  },
];

// Seed projects customer balances
export const memoryProjectCustomerBalances: ProjectCustomerBalance[] = [
  {
    project_id: 'proj-01',
    customer_id: 'cust-01',
    customer_name: 'S. Annamalai',
    project_name: 'Annamalai Residential Villa',
    project_code: 'PRJ-2026-001',
    contract_value: 4500000,
    amount_received: 1800000,
    outstanding_amount: 2700000,
    is_fully_paid: false,
    confirmed_payment_count: 2,
  },
  {
    project_id: 'proj-02',
    customer_id: 'cust-02',
    customer_name: 'Meenakshi Sundaram',
    project_name: 'Meenakshi Commercial Complex',
    project_code: 'PRJ-2026-002',
    contract_value: 8500000,
    amount_received: 1500000,
    outstanding_amount: 7000000,
    is_fully_paid: false,
    confirmed_payment_count: 1,
  },
  {
    project_id: 'proj-03',
    customer_id: 'cust-03',
    customer_name: 'Dr. K. Rajendran',
    project_name: 'Karpagam Nagar Residence',
    project_code: 'PRJ-2026-003',
    contract_value: 2800000,
    amount_received: 600000,
    outstanding_amount: 2200000,
    is_fully_paid: false,
    confirmed_payment_count: 1,
  },
];

// Seed recorded project costs (Purchases + Wages + Expenses)
export const memoryProjectRecordedCosts: RecordedProjectCost[] = [
  {
    project_id: 'proj-01',
    project_code: 'PRJ-2026-001',
    project_name: 'Annamalai Residential Villa',
    project_status: 'in_progress',
    contract_value: 4500000,
    amount_received: 1800000,
    outstanding_customer_balance: 2700000,
    total_purchases: 840000,
    total_wages: 215000,
    total_expenses: 32500, // exp-01 (14500) + exp-02 (18000)
    recorded_project_cost: 1087500, // 840000 + 215000 + 32500
  },
  {
    project_id: 'proj-02',
    project_code: 'PRJ-2026-002',
    project_name: 'Meenakshi Commercial Complex',
    project_status: 'in_progress',
    contract_value: 8500000,
    amount_received: 1500000,
    outstanding_customer_balance: 7000000,
    total_purchases: 1420000,
    total_wages: 340000,
    total_expenses: 20900, // exp-03 (12400) + exp-04 (8500)
    recorded_project_cost: 1780900, // 1420000 + 340000 + 20900
  },
  {
    project_id: 'proj-03',
    project_code: 'PRJ-2026-003',
    project_name: 'Karpagam Nagar Residence',
    project_status: 'in_progress',
    contract_value: 2800000,
    amount_received: 600000,
    outstanding_customer_balance: 2200000,
    total_purchases: 380000,
    total_wages: 95000,
    total_expenses: 0,
    recorded_project_cost: 475000, // 380000 + 95000 + 0
  },
];

// Helper to calculate total financial summary
export function calculateCompanyFinancialSummary(): CompanyFinancialSummary {
  // 1. Customer
  const totalContract = memoryProjectCustomerBalances.reduce((sum, p) => sum + p.contract_value, 0);
  const totalReceived = memoryCustomerPayments
    .filter((cp) => cp.status === 'Confirmed')
    .reduce((sum, cp) => sum + cp.amount, 0);
  const customerOutstanding = Math.max(0, totalContract - totalReceived);

  // 2. Supplier (derived from purchases and payments)
  const totalPurchases = memoryProjectRecordedCosts.reduce((sum, p) => sum + p.total_purchases, 0);
  const supplierPaid = 1960000;
  const supplierOutstanding = Math.max(0, totalPurchases - supplierPaid);

  // 3. Employee (strict non-netting)
  const wagesEarned = memoryProjectRecordedCosts.reduce((sum, p) => sum + p.total_wages, 0);
  const wagesPaid = 505000;
  const wagePayable = Math.max(0, wagesEarned - wagesPaid);

  const advancesGiven = 92000;
  const advancesRecovered = 46000;
  const advanceOutstanding = Math.max(0, advancesGiven - advancesRecovered);

  // 4. Expenses
  const activeExpenses = memoryExpenses.filter((e) => e.status === 'Confirmed');
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const siteExpenses = activeExpenses
    .filter((e) => e.project_id !== null)
    .reduce((sum, e) => sum + e.amount, 0);
  const overheadExpenses = activeExpenses
    .filter((e) => e.project_id === null)
    .reduce((sum, e) => sum + e.amount, 0);

  // 5. Recorded Project Cost (Purchases + Wages + Expenses)
  const totalRecordedCost = memoryProjectRecordedCosts.reduce((sum, p) => sum + p.recorded_project_cost, 0);

  return {
    customer: {
      total_contract_value: totalContract,
      total_received: totalReceived,
      total_outstanding: customerOutstanding,
    },
    supplier: {
      total_purchases: totalPurchases,
      total_paid: supplierPaid,
      total_outstanding: supplierOutstanding,
      unallocated_credit: 25000,
    },
    employee: {
      wages_earned: wagesEarned,
      wages_paid: wagesPaid,
      wage_payable: wagePayable,
      advances_given: advancesGiven,
      advances_recovered: advancesRecovered,
      advance_outstanding: advanceOutstanding,
    },
    expenses: {
      total_expenses: totalExpenses,
      site_expenses: siteExpenses,
      overhead_expenses: overheadExpenses,
    },
    project_cost: {
      total_recorded_cost: totalRecordedCost,
      project_breakdown: memoryProjectRecordedCosts,
    },
  };
}

// ==========================================
// 1. CUSTOMER PAYMENTS HOOKS
// ==========================================

export function useCustomerPayments(filters?: {
  customerId?: string;
  projectId?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['customer-payments', filters],
    queryFn: async (): Promise<CustomerPayment[]> => {
      try {
        let query = supabase
          .from('customer_payments')
          .select('*, customer:customers(*), project:projects(*)')
          .order('payment_date', { ascending: false });

        if (filters?.customerId && filters.customerId !== 'all') {
          query = query.eq('customer_id', filters.customerId);
        }
        if (filters?.projectId && filters.projectId !== 'all') {
          query = query.eq('project_id', filters.projectId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Customer payments query error:', error.message);
          return [];
        }
        let list = (data || []) as unknown as CustomerPayment[];
        if (filters?.search && filters.search.trim()) {
          const term = filters.search.toLowerCase().trim();
          list = list.filter(
            (p) =>
              p.payment_number.toLowerCase().includes(term) ||
              (p.reference_number && p.reference_number.toLowerCase().includes(term)) ||
              (p.customer?.name && p.customer.name.toLowerCase().includes(term)) ||
              (p.project?.name && p.project.name.toLowerCase().includes(term))
          );
        }
        return list;
      } catch (err) {
        console.warn('Customer payments query notice:', err);
        return [];
      }
    },
  });
}

export function useCustomerPayment(id: string | undefined) {
  return useQuery({
    queryKey: ['customer-payment', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<CustomerPayment | null> => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('customer_payments')
          .select('*, customer:customers(*), project:projects(*)')
          .eq('id', id)
          .single();

        if (error || !data) {
          return null;
        }
        return data as unknown as CustomerPayment;
      } catch {
        return null;
      }
    },
  });
}

export function useRecordCustomerPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CustomerPaymentFormData): Promise<CustomerPayment> => {
      try {
        // Attempt authoritative Supabase RPC
        const { data, error } = await (supabase as any).rpc('record_customer_payment', {
          p_customer_id: formData.customer_id,
          p_project_id: formData.project_id,
          p_amount: formData.amount,
          p_payment_date: formData.payment_date,
          p_payment_method: formData.payment_method,
          p_reference_number: formData.reference_number || null,
          p_notes: formData.notes || null,
          p_status: 'Confirmed',
        });

        if (error) {
          throw error;
        }
        return data as CustomerPayment;
      } catch {
        // Fallback memory state mutation
        const paymentNumber = `CP-${String(memoryCustomerPayments.length + 1).padStart(4, '0')}`;
        const bal = memoryProjectCustomerBalances.find((b) => b.project_id === formData.project_id);

        const newPayment: CustomerPayment = {
          id: `cp-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          customer_id: formData.customer_id,
          project_id: formData.project_id,
          payment_number: paymentNumber,
          payment_date: formData.payment_date,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          status: 'Confirmed',
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: bal
            ? { id: bal.customer_id, name: bal.customer_name, phone: null }
            : null,
          project: bal
            ? {
                id: bal.project_id,
                project_code: bal.project_code,
                name: bal.project_name,
                contract_value: bal.contract_value,
              }
            : null,
        };

        memoryCustomerPayments = [newPayment, ...memoryCustomerPayments];

        // Update project balance
        if (bal) {
          bal.amount_received += formData.amount;
          bal.outstanding_amount = Math.max(0, bal.contract_value - bal.amount_received);
          bal.is_fully_paid = bal.amount_received >= bal.contract_value;
          bal.confirmed_payment_count += 1;
        }

        return newPayment;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-balances'] });
      queryClient.invalidateQueries({ queryKey: ['project-customer-balance'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-payment'] });
    },
  });
}

export function useProjectCustomerBalance(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-customer-balance', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ProjectCustomerBalance | null> => {
      if (!projectId) return null;
      try {
        const { data, error } = await supabase
          .from('v_project_customer_payment_balance' as any)
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error || !data) {
          return null;
        }
        return data as unknown as ProjectCustomerBalance;
      } catch {
        return null;
      }
    },
  });
}

export function useCustomerBalances() {
  return useQuery({
    queryKey: ['customer-balances'],
    queryFn: async (): Promise<ProjectCustomerBalance[]> => {
      try {
        const { data, error } = await supabase
          .from('v_project_customer_payment_balance' as any)
          .select('*');

        if (error) {
          console.warn('Customer balances query notice:', error.message);
          return [];
        }
        return (data || []) as unknown as ProjectCustomerBalance[];
      } catch (err) {
        console.warn('Customer balances query notice:', err);
        return [];
      }
    },
  });
}

// ==========================================
// 2. EXPENSES HOOKS
// ==========================================

export function useExpenses(filters?: {
  projectId?: string;
  category?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async (): Promise<Expense[]> => {
      try {
        let query = supabase
          .from('expenses')
          .select('*, project:projects(*)')
          .order('expense_date', { ascending: false });

        if (filters?.projectId && filters.projectId !== 'all') {
          if (filters.projectId === 'overhead') {
            query = query.is('project_id', null);
          } else {
            query = query.eq('project_id', filters.projectId);
          }
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Expenses query error:', error.message);
          return [];
        }
        let list = (data || []) as unknown as Expense[];
        if (filters?.search && filters.search.trim()) {
          const term = filters.search.toLowerCase().trim();
          list = list.filter(
            (e) =>
              e.expense_number.toLowerCase().includes(term) ||
              e.description.toLowerCase().includes(term) ||
              e.category.toLowerCase().includes(term) ||
              (e.paid_by && e.paid_by.toLowerCase().includes(term)) ||
              (e.reference_number && e.reference_number.toLowerCase().includes(term))
          );
        }
        return list;
      } catch (err) {
        console.warn('Expenses query notice:', err);
        return [];
      }
    },
  });
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Expense | null> => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*, project:projects(*)')
          .eq('id', id)
          .single();

        if (error || !data) {
          return null;
        }
        return data as unknown as Expense;
      } catch {
        return null;
      }
    },
  });
}

export function useRecordExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ExpenseFormData): Promise<Expense> => {
      try {
        const { data, error } = await (supabase as any).rpc('record_expense', {
          p_category: formData.category,
          p_description: formData.description.trim(),
          p_amount: formData.amount,
          p_project_id: formData.project_id || null,
          p_expense_date: formData.expense_date,
          p_paid_by: formData.paid_by || null,
          p_payment_method: formData.payment_method || null,
          p_reference_number: formData.reference_number || null,
          p_notes: formData.notes || null,
          p_status: 'Confirmed',
        });

        if (error) {
          throw error;
        }
        return data as Expense;
      } catch {
        const expenseNumber = `EXP-${String(memoryExpenses.length + 1).padStart(4, '0')}`;
        const proj = memoryProjectRecordedCosts.find((p) => p.project_id === formData.project_id);

        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          project_id: formData.project_id || null,
          expense_number: expenseNumber,
          expense_date: formData.expense_date,
          category: formData.category as any,
          description: formData.description.trim(),
          amount: formData.amount,
          paid_by: formData.paid_by || null,
          payment_method: formData.payment_method || null,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          status: 'Confirmed',
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          project: proj
            ? {
                id: proj.project_id,
                project_code: proj.project_code,
                name: proj.project_name,
              }
            : null,
        };

        memoryExpenses = [newExpense, ...memoryExpenses];

        // Update project recorded cost if project_id is present
        if (proj) {
          proj.total_expenses += formData.amount;
          proj.recorded_project_cost = proj.total_purchases + proj.total_wages + proj.total_expenses;
        }

        return newExpense;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['project-recorded-costs'] });
      queryClient.invalidateQueries({ queryKey: ['project-recorded-cost'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-project'] });
    },
  });
}

// ==========================================
// 3. RECORDED PROJECT COST HOOKS
// Purchases + Employee Wages + Expenses (NOT profit)
// ==========================================

export function useProjectRecordedCosts() {
  return useQuery({
    queryKey: ['project-recorded-costs'],
    queryFn: async (): Promise<RecordedProjectCost[]> => {
      try {
        const { data, error } = await supabase
          .from('v_project_recorded_cost' as any)
          .select('*');

        if (error) {
          console.warn('Recorded costs query notice:', error.message);
          return [];
        }
        return (data || []) as unknown as RecordedProjectCost[];
      } catch (err) {
        console.warn('Recorded costs query notice:', err);
        return [];
      }
    },
  });
}

export function useProjectRecordedCost(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-recorded-cost', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<RecordedProjectCost | null> => {
      if (!projectId) return null;
      try {
        const { data, error } = await supabase
          .from('v_project_recorded_cost' as any)
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error || !data) {
          return null;
        }
        return data as unknown as RecordedProjectCost;
      } catch {
        return null;
      }
    },
  });
}

// ==========================================
// 4. FINANCIAL SUMMARY COMMAND HOOK
// ==========================================

export const emptyCompanyFinancialSummary: CompanyFinancialSummary = {
  customer: {
    total_contract_value: 0,
    total_received: 0,
    total_outstanding: 0,
  },
  supplier: {
    total_purchases: 0,
    total_paid: 0,
    total_outstanding: 0,
    unallocated_credit: 0,
  },
  employee: {
    wages_earned: 0,
    wages_paid: 0,
    wage_payable: 0,
    advances_given: 0,
    advances_recovered: 0,
    advance_outstanding: 0,
  },
  expenses: {
    total_expenses: 0,
    site_expenses: 0,
    overhead_expenses: 0,
  },
  project_cost: {
    total_recorded_cost: 0,
    project_breakdown: [],
  },
};

export function useFinancialSummary() {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async (): Promise<CompanyFinancialSummary> => {
      try {
        // Query authoritative dashboard financial view
        const { data, error } = await supabase
          .from('v_dashboard_financial_summary' as any)
          .select('*')
          .single();

        if (error || !data) {
          return emptyCompanyFinancialSummary;
        }

        const record = data as Record<string, any>;
        return {
          customer: {
            total_contract_value: Number(record.total_contract_value) || 0,
            total_received: Number(record.total_customer_received) || 0,
            total_outstanding: Number(record.total_customer_receivable) || 0,
          },
          supplier: {
            total_purchases: Number(record.total_purchases) || 0,
            total_paid: Number(record.total_supplier_paid) || 0,
            total_outstanding: Number(record.total_supplier_payable) || 0,
            unallocated_credit: Number(record.unallocated_credit) || 0,
          },
          employee: {
            wages_earned: Number(record.total_wages_earned) || 0,
            wages_paid: Number(record.total_wages_paid) || 0,
            wage_payable: Number(record.total_wage_payable) || 0,
            advances_given: Number(record.total_advances_given) || 0,
            advances_recovered: Number(record.total_advances_recovered) || 0,
            advance_outstanding: Number(record.total_advance_outstanding) || 0,
          },
          expenses: {
            total_expenses: Number(record.total_expenses) || 0,
            site_expenses: Number(record.site_expenses) || 0,
            overhead_expenses: Number(record.overhead_expenses) || 0,
          },
          project_cost: {
            total_recorded_cost: Number(record.total_recorded_project_cost) || 0,
            project_breakdown: [],
          },
        };
      } catch {
        return emptyCompanyFinancialSummary;
      }
    },
  });
}
