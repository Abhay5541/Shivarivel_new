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

export let memoryEmployees: Employee[] = [];
export let memoryAttendance: AttendanceRecord[] = [];
export let memoryDailyWages: DailyWage[] = [];
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
      try {
        let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Employees query error:', error.message);
          return [];
        }

        let result = (data as Employee[]) || [];
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
      } catch (err) {
        console.warn('Employees query notice:', err);
        return [];
      }
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
      const codeNumber = memoryEmployees.length + 1;
      const generatedCode = `EMP-${String(codeNumber).padStart(4, '0')}`;
      const now = new Date().toISOString();

      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .insert({
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
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        return data as Employee;
      } catch {
        // Local memory persistence fallback
        const newEmp: Employee = {
          id: `emp-local-${Date.now()}`,
          company_id: 'comp-shivarivel-001',
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
        memoryEmployees = [newEmp, ...memoryEmployees];
        return newEmp;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmployeeFormData): Promise<Employee> => {
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
        return data as Employee;
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
          return memoryEmployees[idx];
        }
        throw new Error('Employee not found');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await (supabase as any).from('employees').delete().eq('id', id);
        if (error) {
          await (supabase as any).from('employees').update({ status: 'inactive' }).eq('id', id);
        }
      } catch {
        // Local fallback
      }
      memoryEmployees = memoryEmployees.filter((e) => e.id !== id);
      return id;
    },
    onSuccess: (id) => {
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
        try {
          // Attempt real Supabase RPC record_attendance
          const { error } = await (supabase as any).rpc('record_attendance', {
            p_employee_id: entry.employee_id,
            p_status: entry.status,
            p_attendance_date: date,
            p_project_id: entry.project_id || null,
            p_overtime_hours: entry.overtime_hours || 0,
            p_overtime_amount: 0,
            p_daily_wage_rate: null,
            p_notes: entry.notes || null,
            p_auto_generate_wage: true,
          });

          if (error) {
            // Upsert fallback directly on attendance table
            await (supabase as any).from('attendance').upsert(
              {
                employee_id: entry.employee_id,
                attendance_date: date,
                status: entry.status,
                project_id: entry.project_id || null,
                overtime_hours: entry.overtime_hours || 0,
                notes: entry.notes || null,
              },
              { onConflict: 'company_id, employee_id, attendance_date' }
            );
          }
          savedCount++;
        } catch {
          // Memory mock persistence
          const emp = memoryEmployees.find((e) => e.id === entry.employee_id);
          const existingIdx = memoryAttendance.findIndex(
            (a) => a.employee_id === entry.employee_id && a.attendance_date === date
          );

          const record: AttendanceRecord = {
            id: existingIdx >= 0 ? memoryAttendance[existingIdx].id : `att-${Date.now()}-${entry.employee_id}`,
            company_id: 'comp-shivarivel-001',
            employee_id: entry.employee_id,
            project_id: entry.project_id || emp?.assigned_project_id || null,
            attendance_date: date,
            status: entry.status,
            daily_wage_snapshot: emp?.daily_wage || 0,
            overtime_hours: entry.overtime_hours || 0,
            overtime_amount: 0,
            notes: entry.notes || null,
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
                  status: emp.status,
                }
              : undefined,
            project: emp?.assigned_project_id
              ? {
                  id: emp.assigned_project_id,
                  name: emp.assigned_project_name || 'Assigned Site',
                  project_code: 'PRJ-SITE',
                }
              : null,
          };

          if (existingIdx >= 0) {
            memoryAttendance[existingIdx] = record;
          } else {
            memoryAttendance.push(record);
          }

          // Auto-generate or update memory wage
          const units = entry.status === 'Present' ? 1.0 : entry.status === 'Half Day' ? 0.5 : 0;
          const rate = emp?.daily_wage || 0;
          const wageAmount = Math.round(units * rate * 100) / 100;

          const wageIdx = memoryDailyWages.findIndex(
            (w) => w.employee_id === entry.employee_id && w.wage_date === date
          );
          if (wageIdx >= 0) {
            memoryDailyWages[wageIdx] = {
              ...memoryDailyWages[wageIdx],
              payable_units: units,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
            };
          } else {
            memoryDailyWages.push({
              id: `dw-${Date.now()}-${entry.employee_id}`,
              company_id: 'comp-shivarivel-001',
              employee_id: entry.employee_id,
              attendance_id: record.id,
              project_id: entry.project_id || null,
              wage_number: `WG-${String(memoryDailyWages.length + 1).padStart(4, '0')}`,
              wage_date: date,
              payable_units: units,
              rate,
              base_wage: wageAmount,
              overtime_hours: 0,
              overtime_amount: 0,
              amount: wageAmount,
              status: 'Confirmed',
              reversal_of_id: null,
              notes: entry.notes || null,
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
              amount_paid: 0,
              amount_payable: wageAmount,
            });
          }

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
      queryClient.invalidateQueries({ queryKey: ['project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['project-recorded-costs'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['report-workforce'] });
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
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Daily wages query error:', error.message);
          return [];
        }
        return (data as DailyWage[]) || [];
      } catch (err) {
        console.warn('Daily wages query notice:', err);
        return [];
      }
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

      // 1. If wage_id provided, attempt direct update
      if (payload.wage_id) {
        try {
          const { error } = await (supabase as any)
            .from('daily_wages')
            .update({
              project_id: payload.project_id || null,
              wage_date: payload.wage_date,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
            })
            .eq('id', payload.wage_id);

          if (error) throw error;

          // Also update linked attendance record if present
          if (payload.attendance_id) {
            await (supabase as any)
              .from('attendance')
              .update({
                status: status,
                project_id: payload.project_id || null,
                attendance_date: payload.wage_date,
                daily_wage_snapshot: rate,
              })
              .eq('id', payload.attendance_id);
          }
        } catch {
          // Update in-memory fallback
          const idx = memoryDailyWages.findIndex((w) => w.id === payload.wage_id);
          const proj = payload.project_id ? { id: payload.project_id, name: 'Project', project_code: 'PRJ' } : null;
          if (idx >= 0) {
            const attId = payload.attendance_id || memoryDailyWages[idx].attendance_id;
            memoryDailyWages[idx] = {
              ...memoryDailyWages[idx],
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

            const attIdx = memoryAttendance.findIndex((a) => a.id === attId);
            if (attIdx >= 0) {
              memoryAttendance[attIdx] = {
                ...memoryAttendance[attIdx],
                status: status,
                project_id: payload.project_id || null,
                attendance_date: payload.wage_date,
                daily_wage_snapshot: rate,
                updated_at: new Date().toISOString(),
              };
            }
          }
        }
      } else {
        // 2. Insert new daily wage using atomic RPC record_attendance
        try {
          const { error } = await (supabase as any).rpc('record_attendance', {
            p_employee_id: payload.employee_id,
            p_status: status,
            p_attendance_date: payload.wage_date,
            p_project_id: payload.project_id || null,
            p_overtime_hours: 0,
            p_overtime_amount: 0,
            p_daily_wage_rate: rate,
            p_notes: 'Daily wage entry',
            p_auto_generate_wage: true,
          });

          if (error) {
            // Check for duplicate constraint violation
            if (error.code === '23505' || String(error.message || '').toLowerCase().includes('unique')) {
              throw new Error('A wage entry already exists for this laborer on this date.');
            }
            throw error;
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.includes('already exists')) {
            throw err;
          }
          console.warn('Supabase record_attendance RPC notice, updating in memory fallback:', err);
          const emp = memoryEmployees.find((e) => e.id === payload.employee_id);
          const proj = payload.project_id ? { id: payload.project_id, name: 'Project', project_code: 'PRJ' } : null;
          const existingIdx = memoryDailyWages.findIndex(
            (w) => w.employee_id === payload.employee_id && w.wage_date === payload.wage_date
          );

          if (existingIdx >= 0) {
            memoryDailyWages[existingIdx] = {
              ...memoryDailyWages[existingIdx],
              project_id: payload.project_id || null,
              payable_units: units,
              rate: rate,
              base_wage: wageAmount,
              amount: wageAmount,
              amount_payable: wageAmount,
              project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
              updated_at: new Date().toISOString(),
            };
          } else {
            const nextNum = memoryDailyWages.length + 1;
            const newAttId = `att-${Date.now()}-${payload.employee_id}`;
            const wageRecord: DailyWage = {
              id: `dw-${Date.now()}-${payload.employee_id}`,
              company_id: 'comp-shivarivel-001',
              employee_id: payload.employee_id,
              attendance_id: newAttId,
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
              project: proj
                ? {
                    id: proj.id,
                    name: proj.name,
                    project_code: proj.project_code,
                  }
                : null,
              amount_paid: 0,
              amount_payable: wageAmount,
            };
            memoryDailyWages = [wageRecord, ...memoryDailyWages];

            // Also add to memoryAttendance
            const attRecord: AttendanceRecord = {
              id: newAttId,
              company_id: 'comp-shivarivel-001',
              employee_id: payload.employee_id,
              project_id: payload.project_id || null,
              attendance_date: payload.wage_date,
              status: status,
              daily_wage_snapshot: rate,
              overtime_hours: 0,
              overtime_amount: 0,
              notes: 'Daily wage entry',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee: emp,
              project: proj ? { id: proj.id, name: proj.name, project_code: proj.project_code } : null,
            };
            memoryAttendance.push(attRecord);
          }
        }
      }

      // Recalculate employee summary in memory
      const emp = memoryEmployees.find((e) => e.id === payload.employee_id);
      if (emp) {
        const empWages = memoryDailyWages.filter((w) => w.employee_id === emp.id && w.status === 'Confirmed');
        emp.total_wages_earned = empWages.reduce((sum, w) => sum + w.amount, 0);
        emp.total_present_days = empWages.length;
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
    },
  });
}

export function useDeleteDailyWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wageId, attendanceId }: { wageId: string; attendanceId?: string }) => {
      try {
        const { error } = await (supabase as any)
          .from('daily_wages')
          .update({ status: 'Cancelled' })
          .eq('id', wageId);
        if (error) {
          await (supabase as any).from('daily_wages').delete().eq('id', wageId);
        }
        if (attendanceId) {
          await (supabase as any).from('attendance').delete().eq('id', attendanceId);
        }
      } catch {
        // Continue to memory fallback
      }

      // In-memory fallback removal
      memoryDailyWages = memoryDailyWages.filter((w) => w.id !== wageId);
      if (attendanceId) {
        memoryAttendance = memoryAttendance.filter((a) => a.id !== attendanceId);
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
