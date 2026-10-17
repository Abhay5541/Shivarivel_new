import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  Employee,
  EmployeeFormData,
  AttendanceRecord,
  AttendanceStatus,
  DailyWage,
  EmployeeAdvance,
  AdvanceFormData,
  EmployeePayment,
  EmployeePaymentFormData,
} from '@/types/workforce';

// Helper to get today's date string YYYY-MM-DD in local time
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EMPLOYEES_STORAGE_KEY = 'shivarivel_employees';
const ATTENDANCE_STORAGE_KEY = 'shivarivel_attendance';
const DAILY_WAGES_STORAGE_KEY = 'shivarivel_daily_wages';

export function loadStoredEmployees(): Employee[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

export function saveStoredEmployees(emps: Employee[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(emps));
    } catch {}
  }
}

export function loadStoredDailyWages(): DailyWage[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DAILY_WAGES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

export function saveStoredDailyWages(wages: DailyWage[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DAILY_WAGES_STORAGE_KEY, JSON.stringify(wages));
    } catch {}
  }
}

function getStoredProject(projectId: string): { id: string; name: string; project_code: string } | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('shivarivel_projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => p && p.id === projectId);
          if (found) {
            return {
              id: found.id,
              name: found.name && found.name !== 'Project' ? found.name : 'General Site Work',
              project_code: found.project_code || 'PRJ',
            };
          }
        }
      }
    } catch {}
  }
  return null;
}

export function loadStoredAttendance(): AttendanceRecord[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

export function saveStoredAttendance(att: AttendanceRecord[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(att));
    } catch {}
  }
}

export let memoryEmployees: Employee[] = loadStoredEmployees();
export let memoryAttendance: AttendanceRecord[] = loadStoredAttendance();
export let memoryDailyWages: DailyWage[] = loadStoredDailyWages();
export let memoryAdvances: EmployeeAdvance[] = [];
export let memoryEmployeePayments: EmployeePayment[] = [];

// ==========================================
// 1. EMPLOYEES HOOKS
// ==========================================

export function useEmployees(filters?: {
  search?: string;
  status?: string;
  role?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async (): Promise<Employee[]> => {
      const local = loadStoredEmployees();
      let remote: Employee[] = [];

      try {
        let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && data) {
          remote = data as Employee[];
          saveStoredEmployees(remote);
          let results = remote;
          if (filters?.status && filters.status !== 'all') {
            results = results.filter((e) => e.status === filters.status);
          } else {
            results = results.filter((e) => e.status !== 'inactive');
          }
          if (filters?.search?.trim()) {
            const s = filters.search.trim().toLowerCase();
            results = results.filter((e) => e.name.toLowerCase().includes(s) || e.phone?.includes(s));
          }
          return results;
        } else if (error) {
          console.warn('Employees query error:', error.message);
        }
      } catch (err) {
        console.warn('Employees query notice:', err);
      }

      let merged = local;

      // Exclude inactive employees unless explicitly requested
      if (filters?.status !== 'all' && filters?.status !== 'inactive') {
        merged = merged.filter((e) => e.status !== 'inactive');
      }

      memoryEmployees = merged;
      saveStoredEmployees(merged);

      let result = merged;
      if (filters?.role && filters.role !== 'all') {
        result = result.filter((e) => e.worker_type?.toLowerCase().includes(filters.role!.toLowerCase()));
      }
      if (filters?.search && filters.search.trim()) {
        const term = filters.search.toLowerCase().trim();
        result = result.filter(
          (e) =>
            e.name.toLowerCase().includes(term) ||
            e.employee_code.toLowerCase().includes(term) ||
            (e.phone && e.phone.includes(term)) ||
            (e.worker_type && e.worker_type.toLowerCase().includes(term))
        );
      }
      return result;
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Employee | null> => {
      if (!id) return null;
      try {
        const { data, error } = await (supabase as any).from('employees').select('*').eq('id', id).single();
        if (error || !data) {
          return null;
        }
        return data as Employee;
      } catch {
        return null;
      }
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeeFormData): Promise<Employee> => {
      // Find the highest existing employee code number among memory and stored employees to guarantee unique IDs
      const stored = loadStoredEmployees();
      const allCurrent = [...memoryEmployees, ...stored];
      let maxNum = 0;
      for (const emp of allCurrent) {
        const match = emp.employee_code?.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      const nextCodeNum = maxNum + 1;
      const generatedCode = `EMP-${String(nextCodeNum).padStart(4, '0')}`;
      const now = new Date().toISOString();

      let targetCompanyId = '1ae9407b-8bb0-4eb0-b617-a3f8d8879eef';
      try {
        const { data: existingEmp } = await (supabase.from('employees') as any).select('company_id').limit(1).maybeSingle();
        if (existingEmp?.company_id) {
          targetCompanyId = existingEmp.company_id;
        } else {
          const { data: comp } = await (supabase.from('companies') as any).select('id').limit(1).maybeSingle();
          if (comp?.id) targetCompanyId = comp.id;
        }
      } catch {}

      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .insert({
            company_id: targetCompanyId,
            employee_code: generatedCode,
            name: formData.name.trim(),
            phone: formData.phone || null,
            worker_type: formData.worker_type || null,
            daily_wage: formData.daily_wage || null,
            status: formData.status || 'active',
            joining_date: formData.joining_date || null,
            emergency_contact: formData.emergency_contact || null,
            address: formData.address || null,
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        const createdEmp = data as Employee;
        memoryEmployees = [createdEmp, ...memoryEmployees.filter((e) => e.id !== createdEmp.id)];
        saveStoredEmployees(memoryEmployees);
        return createdEmp;
      } catch {
        // Local memory persistence fallback
        const newEmp: Employee = {
          id: `emp-local-${Date.now()}`,
          company_id: targetCompanyId,
          employee_code: generatedCode,
          name: formData.name.trim(),
          phone: formData.phone || null,
          worker_type: formData.worker_type || null,
          daily_wage: formData.daily_wage || null,
          status: formData.status,
          joining_date: formData.joining_date || now.split('T')[0],
          emergency_contact: formData.emergency_contact || null,
          photo_url: null,
          address: formData.address || null,
          notes: formData.notes || null,
          created_at: now,
          updated_at: now,
          total_present_days: 0,
          total_wages_earned: 0,
          total_wages_paid: 0,
          wage_payable: 0,
          total_advances_given: 0,
          total_advances_recovered: 0,
          advance_outstanding: 0,
        };
        memoryEmployees = [newEmp, ...memoryEmployees.filter((e) => e.id !== newEmp.id)];
        saveStoredEmployees(memoryEmployees);
        return newEmp;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEmployee(hookId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeeFormData & { id?: string }): Promise<Employee> => {
      const id = formData.id || hookId;
      if (!id) {
        throw new Error('Employee ID is required to update.');
      }
      const now = new Date().toISOString();
      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .update({
            name: formData.name.trim(),
            phone: formData.phone || null,
            worker_type: formData.worker_type || null,
            daily_wage: formData.daily_wage || null,
            status: formData.status,
            joining_date: formData.joining_date || null,
            emergency_contact: formData.emergency_contact || null,
            address: formData.address || null,
            notes: formData.notes || null,
          })
          .eq('id', id)
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        const updated = data as Employee;
        const idx = memoryEmployees.findIndex((e) => e.id === id);
        if (idx !== -1) {
          memoryEmployees[idx] = updated;
        } else {
          memoryEmployees.push(updated);
        }
        saveStoredEmployees(memoryEmployees);
        return updated;
      } catch {
        const idx = memoryEmployees.findIndex((e) => e.id === id);
        if (idx !== -1) {
          memoryEmployees[idx] = {
            ...memoryEmployees[idx],
            name: formData.name.trim(),
            phone: formData.phone || null,
            worker_type: formData.worker_type || null,
            daily_wage: formData.daily_wage || null,
            status: formData.status,
            joining_date: formData.joining_date || memoryEmployees[idx].joining_date,
            emergency_contact: formData.emergency_contact || null,
            address: formData.address || null,
            notes: formData.notes || null,
            updated_at: now,
          };
          saveStoredEmployees(memoryEmployees);
          return memoryEmployees[idx];
        }
        throw new Error('Employee not found');
      }
    },
    onSuccess: (updated) => {
      if (updated?.id) {
        queryClient.setQueriesData({ queryKey: ['employees'] }, (old: Employee[] | undefined) => {
          if (!old) return old;
          return old.map((e) => (e.id === updated.id ? { ...e, ...updated } : e));
        });
      }
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (updated?.id) {
        queryClient.invalidateQueries({ queryKey: ['employee', updated.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        // Check if employee has confirmed financial transactions in daily_wages
        const { data: confirmedWages } = await (supabase.from('daily_wages') as any)
          .select('id')
          .eq('employee_id', id)
          .eq('status', 'Confirmed')
          .limit(1);

        if (confirmedWages && confirmedWages.length > 0) {
          // PostgreSQL trigger forbids deleting records with confirmed financial history; soft-delete to inactive
          await (supabase as any)
            .from('employees')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', id);
        } else {
          // If no confirmed wages, clean up non-confirmed/draft records first then delete
          await (supabase as any).from('daily_wages').delete().eq('employee_id', id);
          await (supabase as any).from('attendance').delete().eq('employee_id', id);
          const { error } = await (supabase as any).from('employees').delete().eq('id', id);
          if (error) {
            await (supabase as any)
              .from('employees')
              .update({ status: 'inactive', updated_at: new Date().toISOString() })
              .eq('id', id);
          }
        }
      } catch (err) {
        console.warn('Employee delete notice, fallback to inactive:', err);
        await (supabase as any)
          .from('employees')
          .update({ status: 'inactive' })
          .eq('id', id)
          .catch(() => {});
      }

      const stored = loadStoredEmployees();
      const updated = stored.filter((e) => e.id !== id);
      memoryEmployees = updated;
      saveStoredEmployees(updated);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['employees'], (old: Employee[] | undefined) => {
        return (old || []).filter((e) => e.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}


// ==========================================
// 2. ATTENDANCE HOOKS (FAST MUSTER)
// ==========================================

export function useAttendanceForDate(date: string, projectId?: string) {
  return useQuery({
    queryKey: ['attendance', date, projectId],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      try {
        let query = supabase
          .from('attendance')
          .select('*, employee:employees(*)')
          .eq('attendance_date', date);

        if (projectId && projectId !== 'all') {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Attendance query error:', error.message);
          return [];
        }
        return (data as AttendanceRecord[]) || [];
      } catch (err) {
        console.warn('Attendance query notice:', err);
        return [];
      }
    },
  });
}

export interface AttendanceBatchItem {
  employee_id: string;
  status: AttendanceStatus;
  project_id?: string | null;
  overtime_hours?: number;
  notes?: string | null;
}

export function useSaveAttendanceBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      entries,
    }: {
      date: string;
      entries: AttendanceBatchItem[];
    }): Promise<{ count: number }> => {
      let savedCount = 0;

      for (const entry of entries) {
        let targetCompanyId = '1ae9407b-8bb0-4eb0-b617-a3f8d8879eef';
        const emp = memoryEmployees.find((e) => e.id === entry.employee_id);
        if (emp?.company_id) targetCompanyId = emp.company_id;

        try {
          const { data: attData } = await (supabase as any)
            .from('attendance')
            .upsert(
              {
                company_id: targetCompanyId,
                employee_id: entry.employee_id,
                attendance_date: date,
                status: entry.status,
                project_id: entry.project_id || null,
                overtime_hours: entry.overtime_hours || 0,
                notes: entry.notes || null,
              },
              { onConflict: 'company_id, employee_id, attendance_date' }
            )
            .select('id')
            .single();

          const units = entry.status === 'Present' ? 1.0 : entry.status === 'Half Day' ? 0.5 : 0;
          const rate = emp?.daily_wage || 0;
          const wageAmount = Math.round(units * rate * 100) / 100;

          if (units > 0 && rate > 0) {
            let wageQuery = (supabase as any)
              .from('daily_wages')
              .select('id, status')
              .eq('employee_id', entry.employee_id)
              .eq('wage_date', date)
              .neq('status', 'Cancelled');

            if (entry.project_id) {
              wageQuery = wageQuery.eq('project_id', entry.project_id);
            } else {
              wageQuery = wageQuery.is('project_id', null);
            }

            const { data: existingW } = await wageQuery.maybeSingle();

            if (existingW?.id) {
              if (existingW.status === 'Confirmed') {
                await (supabase as any)
                  .from('daily_wages')
                  .update({ status: 'Cancelled' })
                  .eq('id', existingW.id);
                await (supabase as any)
                  .from('daily_wages')
                  .insert({
                    company_id: targetCompanyId,
                    employee_id: entry.employee_id,
                    attendance_id: attData?.id || null,
                    project_id: entry.project_id || null,
                    wage_date: date,
                    payable_units: units,
                    rate: rate,
                    base_wage: wageAmount,
                    amount: wageAmount,
                    status: 'Confirmed',
                    reversal_of_id: existingW.id,
                  });
              } else {
                await (supabase as any)
                  .from('daily_wages')
                  .update({
                    payable_units: units,
                    rate: rate,
                    base_wage: wageAmount,
                    amount: wageAmount,
                  })
                  .eq('id', existingW.id);
              }
            } else {
              await (supabase as any)
                .from('daily_wages')
                .insert({
                  company_id: targetCompanyId,
                  employee_id: entry.employee_id,
                  attendance_id: attData?.id || null,
                  project_id: entry.project_id || null,
                  wage_date: date,
                  payable_units: units,
                  rate: rate,
                  base_wage: wageAmount,
                  amount: wageAmount,
                  status: 'Confirmed',
                  notes: 'Auto attendance wage',
                });
            }
          }

          savedCount++;
        } catch (itemErr) {
          console.warn('Batch attendance item save notice:', itemErr);
          savedCount++;
        }
      }

      return { count: savedCount };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-workforce'] });
    },
  });
}

// ==========================================
// 3. WAGES HOOKS (OPERATIONAL TRACKING)
// ==========================================

export function useWages(filters?: {
  employeeId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['wages', filters],
    queryFn: async (): Promise<DailyWage[]> => {
      // Always load the FULL local store — never just the filtered slice
      const allLocal = loadStoredDailyWages();
      let remote: DailyWage[] = [];

      try {
        let query = supabase
          .from('daily_wages')
          .select('*, employee:employees(*), project:projects(*)')
          .order('wage_date', { ascending: false });

        if (filters?.employeeId && filters.employeeId !== 'all') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.projectId && filters.projectId !== 'all') {
          query = query.eq('project_id', filters.projectId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        } else {
          // By default, exclude Cancelled wages so deleted/reversed wages do not display
          query = query.neq('status', 'Cancelled');
        }

        const { data, error } = await query;
        if (!error && data) {
          remote = data as DailyWage[];
          const isUnfiltered =
            !filters ||
            (!filters.employeeId &&
              !filters.projectId &&
              !filters.startDate &&
              !filters.endDate &&
              (!filters.status || filters.status === 'all'));

          if (isUnfiltered) {
            memoryDailyWages = remote;
            saveStoredDailyWages(remote);
          } else {
            // Merge with local memory so queries filtered by project do not wipe out all other project wages
            const remoteMap = new Map(remote.map((r) => [r.id, r]));
            const existingUnchanged = memoryDailyWages.filter((m) => !remoteMap.has(m.id));
            memoryDailyWages = [...remote, ...existingUnchanged];
            saveStoredDailyWages(memoryDailyWages);
          }
          return remote;
        } else if (error) {
          console.warn('Daily wages query error:', error.message);
        }
      } catch (err) {
        console.warn('Daily wages query notice:', err);
      }

      let filtered = allLocal.filter((w) => w.status !== 'Cancelled');
      if (filters?.employeeId && filters.employeeId !== 'all') {
        filtered = filtered.filter((w) => w.employee_id === filters.employeeId);
      }
      if (filters?.projectId && filters.projectId !== 'all') {
        filtered = filtered.filter((w) => w.project_id === filters.projectId);
      }
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter((w) => w.status === filters.status);
      }
      return filtered;
    },
  });
}

export interface RecordDailyWagePayload {
  wage_id?: string;
  attendance_id?: string;
  employee_id: string;
  project_id?: string | null;
  wage_date: string;
  daily_wage: number;
  attendance_status?: AttendanceStatus; // 'Present' | 'Half Day' | 'Absent'
}

export function useRecordDailyWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecordDailyWagePayload) => {
      const status: AttendanceStatus = payload.attendance_status || 'Present';
      const wageAmount = status === 'Absent' ? 0 : Math.max(0, Number(payload.daily_wage) || 0);
      const units = status === 'Present' ? 1.0 : status === 'Half Day' ? 0.5 : 0.0;
      const rate = status === 'Half Day' ? wageAmount * 2 : wageAmount;

      // 1. Resolve target company_id from employee
      let targetCompanyId = '1ae9407b-8bb0-4eb0-b617-a3f8d8879eef';
      let emp = memoryEmployees.find((e) => e.id === payload.employee_id);
      try {
        const { data: empData } = await (supabase.from('employees') as any)
          .select('id, company_id, name, worker_type, daily_wage')
          .eq('id', payload.employee_id)
          .maybeSingle();
        if (empData) {
          emp = empData as Employee;
          if (empData.company_id) targetCompanyId = empData.company_id;
        }
      } catch {}

      const proj = payload.project_id
        ? (getStoredProject(payload.project_id) || { id: payload.project_id, name: 'General Site Work', project_code: 'PRJ' })
        : null;

      // 2. Sync Attendance record in Supabase
      let attRecordId = payload.attendance_id;
      try {
        if (!attRecordId) {
          const { data: existingAtt } = await (supabase.from('attendance') as any)
            .select('id')
            .eq('employee_id', payload.employee_id)
            .eq('attendance_date', payload.wage_date)
            .maybeSingle();
          if (existingAtt?.id) {
            attRecordId = existingAtt.id;
          }
        }

        if (attRecordId) {
          await (supabase.from('attendance') as any)
            .update({
              status: status,
              project_id: payload.project_id || null,
              attendance_date: payload.wage_date,
              daily_wage_snapshot: rate,
              updated_at: new Date().toISOString(),
            })
            .eq('id', attRecordId);
        } else {
          const { data: newAtt } = await (supabase.from('attendance') as any)
            .insert({
              company_id: targetCompanyId,
              employee_id: payload.employee_id,
              project_id: payload.project_id || null,
              attendance_date: payload.wage_date,
              status: status,
              daily_wage_snapshot: rate,
              overtime_hours: 0,
              overtime_amount: 0,
              notes: 'Daily wage entry',
            })
            .select('id')
            .single();
          if (newAtt?.id) {
            attRecordId = newAtt.id;
          }
        }
      } catch (attErr) {
        console.warn('Attendance sync error in useRecordDailyWage:', attErr);
      }

      // 3. Sync Daily Wage record in Supabase
      if (payload.wage_id) {
        // EDIT existing wage
        try {
          const { data: curWage } = await (supabase.from('daily_wages') as any)
            .select('id, status, attendance_id')
            .eq('id', payload.wage_id)
            .single();

          if (curWage?.status === 'Confirmed') {
            // Immutability trigger on Confirmed transactions: cancel old wage and insert corrected replacement
            await (supabase.from('daily_wages') as any)
              .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
              .eq('id', payload.wage_id);

            await (supabase.from('daily_wages') as any)
              .insert({
                company_id: targetCompanyId,
                employee_id: payload.employee_id,
                attendance_id: attRecordId || curWage.attendance_id || null,
                project_id: payload.project_id || null,
                wage_date: payload.wage_date,
                payable_units: units,
                rate: rate,
                base_wage: wageAmount,
                overtime_hours: 0,
                overtime_amount: 0,
                amount: wageAmount,
                status: 'Confirmed',
                reversal_of_id: payload.wage_id,
                notes: 'Edited wage entry',
              });
          } else {
            // Unconfirmed or Draft: update directly
            await (supabase.from('daily_wages') as any)
              .update({
                employee_id: payload.employee_id,
                project_id: payload.project_id || null,
                wage_date: payload.wage_date,
                payable_units: units,
                rate: rate,
                base_wage: wageAmount,
                amount: wageAmount,
                amount_payable: wageAmount,
                status: 'Confirmed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payload.wage_id);
          }
        } catch (editErr) {
          console.warn('Daily wage update error in Supabase:', editErr);
        }

        // Update local memory and localStorage
        const idx = memoryDailyWages.findIndex((w) => w.id === payload.wage_id);
        if (idx >= 0) {
          memoryDailyWages[idx] = {
            ...memoryDailyWages[idx],
            employee_id: payload.employee_id,
            employee: emp
              ? {
                  id: emp.id,
                  employee_code: emp.employee_code,
                  name: emp.name,
                  worker_type: emp.worker_type,
                }
              : memoryDailyWages[idx].employee,
            project_id: payload.project_id || null,
            wage_date: payload.wage_date,
            payable_units: units,
            rate: rate,
            base_wage: wageAmount,
            amount: wageAmount,
            amount_payable: wageAmount,
            project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        // ADD new wage
        try {
          // Check if this attendance_id is already bound to another active wage
          let wageAttId: string | null = attRecordId || null;
          if (wageAttId) {
            const { data: wageUsingAtt } = await (supabase.from('daily_wages') as any)
              .select('id')
              .eq('attendance_id', wageAttId)
              .neq('status', 'Cancelled')
              .maybeSingle();

            if (wageUsingAtt?.id) {
              // Another active wage for this worker on this date already owns this attendance_id.
              // Daily wages table has unique constraint on active (company_id, attendance_id).
              // Keep attendance_id null to allow multiple projects on the same day.
              wageAttId = null;
            }
          }

          const { data: insertedWage } = await (supabase.from('daily_wages') as any)
            .insert({
              company_id: targetCompanyId,
              employee_id: payload.employee_id,
              attendance_id: wageAttId,
              project_id: payload.project_id || null,
              wage_date: payload.wage_date,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              overtime_hours: 0,
              overtime_amount: 0,
              amount: wageAmount,
              status: 'Confirmed',
              notes: 'Daily wage entry',
            })
            .select()
            .single();

          if (insertedWage) {
            memoryDailyWages = [insertedWage as DailyWage, ...memoryDailyWages.filter((w) => w.id !== insertedWage.id)];
          }
        } catch (addErr) {
          console.warn('Daily wage insert error in Supabase:', addErr);
          const nextNum = memoryDailyWages.length + 1;
          const newWageRecord: DailyWage = {
            id: `dw-${Date.now()}-${payload.employee_id}`,
            company_id: targetCompanyId,
            employee_id: payload.employee_id,
            attendance_id: attRecordId || `att-${Date.now()}`,
            project_id: payload.project_id || null,
            wage_number: `WG-${String(nextNum).padStart(4, '0')}`,
            wage_date: payload.wage_date,
            payable_units: units,
            rate: rate,
            base_wage: wageAmount,
            overtime_hours: 0,
            overtime_amount: 0,
            amount: wageAmount,
            status: 'Confirmed',
            reversal_of_id: null,
            notes: 'Daily wage entry',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            employee: emp
              ? {
                  id: emp.id,
                  employee_code: emp.employee_code,
                  name: emp.name,
                  worker_type: emp.worker_type,
                }
              : undefined,
            project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
            amount_paid: 0,
            amount_payable: wageAmount,
          };
          memoryDailyWages = [newWageRecord, ...memoryDailyWages];
        }
      }

      saveStoredDailyWages(memoryDailyWages);

      // Recalculate employee summary in memory
      if (emp) {
        const empWages = memoryDailyWages.filter((w) => w.employee_id === emp!.id && w.status === 'Confirmed');
        emp.total_wages_earned = empWages.reduce((sum, w) => sum + w.amount, 0);
        emp.total_present_days = empWages.length;
        saveStoredEmployees(memoryEmployees);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-workforce'] });
      queryClient.invalidateQueries({ queryKey: ['project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['project-recorded-costs'] });
    },
  });
}

export function useDeleteDailyWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wageId, attendanceId }: { wageId: string; attendanceId?: string }) => {
      try {
        await (supabase as any)
          .from('daily_wages')
          .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
          .eq('id', wageId);

        if (attendanceId) {
          await (supabase as any)
            .from('attendance')
            .update({ status: 'Absent', daily_wage_snapshot: 0 })
            .eq('id', attendanceId);
        }
      } catch (err) {
        console.warn('Delete daily wage notice:', err);
      }

      // Memory & local storage sync: filter out cancelled wage
      memoryDailyWages = memoryDailyWages.filter((w) => w.id !== wageId);
      saveStoredDailyWages(memoryDailyWages);
      if (attendanceId) {
        memoryAttendance = memoryAttendance.filter((a) => a.id !== attendanceId);
        saveStoredAttendance(memoryAttendance);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-workforce'] });
    },
  });
}

// ==========================================
// 4. ADVANCES HOOKS (ADVANCE RECEIVED - RECOVERED = OUTSTANDING)
// ==========================================

export function useEmployeeAdvances(filters?: {
  employeeId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['advances', filters],
    queryFn: async (): Promise<EmployeeAdvance[]> => {
      try {
        let query = supabase
          .from('employee_advances')
          .select('*, employee:employees(*)')
          .order('advance_date', { ascending: false });

        if (filters?.employeeId && filters.employeeId !== 'all') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Employee advances query error:', error.message);
          return [];
        }
        return (data as EmployeeAdvance[]) || [];
      } catch (err) {
        console.warn('Employee advances query notice:', err);
        return [];
      }
    },
  });
}

export function useCreateEmployeeAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: AdvanceFormData): Promise<EmployeeAdvance> => {
      try {
        const { data, error } = await (supabase as any).rpc('record_employee_advance', {
          p_employee_id: formData.employee_id,
          p_amount: formData.amount,
          p_advance_date: formData.advance_date,
          p_payment_method: formData.payment_method,
          p_reference_number: formData.reference_number || null,
          p_purpose: formData.purpose || null,
          p_notes: formData.notes || null,
          p_status: 'Confirmed',
        });

        if (error) {
          throw error;
        }
        return data as unknown as EmployeeAdvance;
      } catch {
        const emp = memoryEmployees.find((e) => e.id === formData.employee_id);
        const newAdv: EmployeeAdvance = {
          id: `adv-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          employee_id: formData.employee_id,
          advance_number: `ADV-${String(memoryAdvances.length + 1).padStart(4, '0')}`,
          advance_date: formData.advance_date,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          purpose: formData.purpose || null,
          notes: formData.notes || null,
          status: 'Confirmed',
          reversal_of_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee: emp
            ? {
                id: emp.id,
                employee_code: emp.employee_code,
                name: emp.name,
                phone: emp.phone,
                worker_type: emp.worker_type,
                daily_wage: emp.daily_wage,
              }
            : undefined,
          recovered_amount: 0,
          outstanding_amount: formData.amount,
        };

        memoryAdvances = [newAdv, ...memoryAdvances];

        // Update employee summary
        if (emp) {
          emp.total_advances_given = (emp.total_advances_given || 0) + formData.amount;
          emp.advance_outstanding = (emp.advance_outstanding || 0) + formData.amount;
        }

        return newAdv;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-workforce'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
    },
  });
}

// ==========================================
// 5. EMPLOYEE PAYMENTS HOOKS
// ==========================================

export function useEmployeePayments(filters?: {
  employeeId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['employee-payments', filters],
    queryFn: async (): Promise<EmployeePayment[]> => {
      try {
        let query = supabase
          .from('employee_payments')
          .select('*, employee:employees(*)')
          .order('payment_date', { ascending: false });

        if (filters?.employeeId && filters.employeeId !== 'all') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Employee payments query error:', error.message);
          return [];
        }
        return (data as EmployeePayment[]) || [];
      } catch (err) {
        console.warn('Employee payments query notice:', err);
        return [];
      }
    },
  });
}

export function useRecordEmployeePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeePaymentFormData): Promise<EmployeePayment> => {
      try {
        const { data, error } = await (supabase as any).rpc('record_employee_payment', {
          p_employee_id: formData.employee_id,
          p_amount: formData.amount,
          p_payment_date: formData.payment_date,
          p_payment_method: formData.payment_method,
          p_reference_number: formData.reference_number || null,
          p_notes: formData.notes || null,
          p_status: 'Confirmed',
          p_wage_allocations: [],
          p_advance_allocations: [],
        });

        if (error) {
          throw error;
        }
        return data as unknown as EmployeePayment;
      } catch {
        const emp = memoryEmployees.find((e) => e.id === formData.employee_id);
        const paymentNumber = `EP-${String(memoryEmployeePayments.length + 1).padStart(4, '0')}`;

        const newPayment: EmployeePayment = {
          id: `ep-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
          employee_id: formData.employee_id,
          payment_number: paymentNumber,
          payment_date: formData.payment_date,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          status: 'Confirmed',
          reversal_of_id: null,
          notes: formData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee: emp
            ? {
                id: emp.id,
                employee_code: emp.employee_code,
                name: emp.name,
                phone: emp.phone,
                worker_type: emp.worker_type,
              }
            : undefined,
          wage_allocations:
            formData.allocation_target === 'wages'
              ? [{ id: `wa-${Date.now()}`, daily_wage_id: 'dw-alloc', amount: formData.amount }]
              : [],
          advance_allocations:
            formData.allocation_target === 'advance_recovery'
              ? [{ id: `aa-${Date.now()}`, employee_advance_id: 'adv-alloc', amount: formData.amount }]
              : [],
        };

        memoryEmployeePayments = [newPayment, ...memoryEmployeePayments];

        // Adjust employee balances appropriately
        if (emp) {
          if (formData.allocation_target === 'advance_recovery') {
            emp.total_advances_recovered = (emp.total_advances_recovered || 0) + formData.amount;
            emp.advance_outstanding = Math.max(0, (emp.advance_outstanding || 0) - formData.amount);
          } else {
            emp.total_wages_paid = (emp.total_wages_paid || 0) + formData.amount;
            emp.wage_payable = Math.max(0, (emp.wage_payable || 0) - formData.amount);
          }
        }

        return newPayment;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['wages'] });
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-workforce'] });
      queryClient.invalidateQueries({ queryKey: ['report-payment'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
    },
  });
}

// ==========================================
// 6. PROJECT WORKFORCE HOOK
// ==========================================

export function useProjectWorkforce(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-workforce', projectId],
    enabled: Boolean(projectId),
    initialData: () => {
      if (!projectId) return null;
      const assignedEmployees = memoryEmployees.filter((e) => e.assigned_project_id === projectId);
      const attendance = memoryAttendance.filter((a) => a.project_id === projectId);
      const wages = memoryDailyWages.filter((w) => w.project_id === projectId);
      const totalEarned = wages.reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalDays =
        attendance.filter((a) => a.status === 'Present').length +
        attendance.filter((a) => a.status === 'Half Day').length * 0.5;
      return {
        assignedEmployees,
        attendance,
        wages,
        totalEarned,
        totalDays,
      };
    },
    queryFn: async () => {
      if (!projectId) return null;

      // Filter employees assigned to this project
      const assignedEmployees = memoryEmployees.filter((e) => e.assigned_project_id === projectId);
      // Project attendance records
      const attendance = memoryAttendance.filter((a) => a.project_id === projectId);
      // Project daily wages
      const wages = memoryDailyWages.filter((w) => w.project_id === projectId);
      // Total earned on this project
      const totalEarned = wages.reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalDays = attendance.filter((a) => a.status === 'Present').length +
        attendance.filter((a) => a.status === 'Half Day').length * 0.5;

      return {
        assignedEmployees,
        attendance,
        wages,
        totalEarned,
        totalDays,
      };
    },
  });
}
