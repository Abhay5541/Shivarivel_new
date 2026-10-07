import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { MyDayData, MyDayItem } from '@/types/dashboard';

/**
 * Isolated dev evaluation dataset for My Day when running without live Supabase
 */
export const devEvalMyDayData: MyDayData = {
  date: '2026-10-02',
  overdue: [
    {
      company_id: 'comp-01',
      item_type: 'task',
      item_id: 'task-101',
      title: 'Inspect false ceiling profile channels before gypsum board installation',
      date: '2026-10-01',
      priority: 'Urgent',
      status: 'Pending',
      urgency: 'OVERDUE',
      customer_id: 'cust-01',
      customer_name: 'Priya Menon',
      project_id: 'prj-01',
      project_code: 'PRJ-2026-0001',
      project_name: 'Greenwood Residence',
      assigned_to: 'user-02',
      assigned_name: 'A. Murugan (Site Engineer)',
      notes: 'Ensure 300mm center-to-center channel spacing verified with laser level.',
    },
    {
      company_id: 'comp-01',
      item_type: 'follow_up',
      item_id: 'fu-101',
      title: 'Customer follow-up: Send revised elevation render drawings',
      date: '2026-09-30',
      priority: 'High',
      status: 'Pending',
      urgency: 'OVERDUE',
      customer_id: 'cust-03',
      customer_name: 'K. Rajasekaran',
      project_id: null,
      project_code: null,
      project_name: null,
      assigned_to: 'user-01',
      assigned_name: 'K. Senthil Nathan',
      notes: 'Customer requested front balcony glass railing option in 3D view.',
    },
  ],
  today: [
    {
      company_id: 'comp-01',
      item_type: 'site_visit',
      item_id: 'visit-101',
      title: 'Initial site measurement & elevation survey',
      date: '2026-10-02',
      priority: 'High',
      status: 'Scheduled',
      urgency: 'TODAY',
      customer_id: 'cust-04',
      customer_name: 'S. Ramanathan',
      project_id: null,
      project_code: null,
      project_name: null,
      assigned_to: 'user-02',
      assigned_name: 'A. Murugan',
      notes: 'Plot No 42, NGO Colony, Nagercoil. Check boundary wall setback.',
    },
    {
      company_id: 'comp-01',
      item_type: 'task',
      item_id: 'task-102',
      title: 'Verify aggregate & cement bag delivery quantity from UltraTech dealer',
      date: '2026-10-02',
      priority: 'High',
      status: 'Pending',
      urgency: 'TODAY',
      customer_id: 'cust-02',
      customer_name: 'Dr. Anand Kumar',
      project_id: 'prj-02',
      project_code: 'PRJ-2026-0002',
      project_name: 'Vasanth Nagar Villa',
      assigned_to: 'user-02',
      assigned_name: 'A. Murugan',
      notes: '150 bags OPC 53 Grade cement expected by 11:30 AM.',
    },
    {
      company_id: 'comp-01',
      item_type: 'task',
      item_id: 'task-103',
      title: 'Site supervisor review: Submit daily labor attendance & wage confirmation',
      date: '2026-10-02',
      priority: 'Medium',
      status: 'Pending',
      urgency: 'TODAY',
      customer_id: null,
      customer_name: null,
      project_id: 'prj-01',
      project_code: 'PRJ-2026-0001',
      project_name: 'Greenwood Residence',
      assigned_to: 'user-02',
      assigned_name: 'A. Murugan',
      notes: '12 masons and 8 helpers deployed today.',
    },
    {
      company_id: 'comp-01',
      item_type: 'follow_up',
      item_id: 'fu-102',
      title: 'Payment milestone call: Second stage plastering completion invoice',
      date: '2026-10-02',
      priority: 'High',
      status: 'Pending',
      urgency: 'TODAY',
      customer_id: 'cust-01',
      customer_name: 'Priya Menon',
      project_id: 'prj-01',
      project_code: 'PRJ-2026-0001',
      project_name: 'Greenwood Residence',
      assigned_to: 'user-01',
      assigned_name: 'K. Senthil Nathan',
      notes: '₹2,50,000 milestone invoice due upon ceiling channel inspection signoff.',
    },
  ],
  upcoming: [
    {
      company_id: 'comp-01',
      item_type: 'task',
      item_id: 'task-104',
      title: 'Inspect electrical conduit laying for concealed lighting points',
      date: '2026-10-04',
      priority: 'Medium',
      status: 'Pending',
      urgency: 'UPCOMING',
      customer_id: 'cust-01',
      customer_name: 'Priya Menon',
      project_id: 'prj-01',
      project_code: 'PRJ-2026-0001',
      project_name: 'Greenwood Residence',
      assigned_to: 'user-02',
      assigned_name: 'A. Murugan',
      notes: 'Coordinate with electrician Suresh for profile LED drivers placement.',
    },
    {
      company_id: 'comp-01',
      item_type: 'site_visit',
      item_id: 'visit-102',
      title: 'Structural engineer site review for second floor lintel beam',
      date: '2026-10-05',
      priority: 'High',
      status: 'Scheduled',
      urgency: 'UPCOMING',
      customer_id: 'cust-05',
      customer_name: 'M. Chellappa',
      project_id: 'prj-03',
      project_code: 'PRJ-2026-0003',
      project_name: 'Kallidaikurichi Commercial Plaza',
      assigned_to: 'user-01',
      assigned_name: 'K. Senthil Nathan',
      notes: 'Check beam rebar stirrups spacing at junction columns.',
    },
    {
      company_id: 'comp-01',
      item_type: 'follow_up',
      item_id: 'fu-103',
      title: 'Supplier payment reminder: Ceramic tiles consignment from Cera Agency',
      date: '2026-10-06',
      priority: 'Medium',
      status: 'Pending',
      urgency: 'UPCOMING',
      customer_id: null,
      customer_name: null,
      project_id: 'prj-01',
      project_code: 'PRJ-2026-0001',
      project_name: 'Greenwood Residence',
      assigned_to: 'user-01',
      assigned_name: 'K. Senthil Nathan',
      notes: '₹1,20,000 balance payable within 7 days of delivery verification.',
    },
  ],
  counts: {
    overdue_tasks: 1,
    today_tasks: 2,
    overdue_follow_ups: 1,
    today_follow_ups: 1,
    today_site_visits: 1,
  },
};

export function useMyDay(dateStr?: string) {
  const effectiveDate = dateStr || new Date().toISOString().split('T')[0];

  return useQuery<MyDayData, Error>({
    queryKey: ['my-day', effectiveDate],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.rpc as any)('get_my_day', {
          p_date: effectiveDate,
        });

        const emptySchedule: MyDayData = {
          date: effectiveDate,
          overdue: [],
          today: [],
          upcoming: [],
          counts: {
            overdue_tasks: 0,
            today_tasks: 0,
            overdue_follow_ups: 0,
            today_follow_ups: 0,
            today_site_visits: 0,
          },
        };

        if (error) {
          console.warn('My Day RPC notice:', error.message);
          return emptySchedule;
        }

        if (!data || typeof data !== 'object') {
          return emptySchedule;
        }

        return data as unknown as MyDayData;
      } catch (err) {
        console.warn('My Day fallback notice:', err);
        return {
          date: effectiveDate,
          overdue: [],
          today: [],
          upcoming: [],
          counts: {
            overdue_tasks: 0,
            today_tasks: 0,
            overdue_follow_ups: 0,
            today_follow_ups: 0,
            today_site_visits: 0,
          },
        };
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      // 1. Try complete_task RPC first
      const { data, error } = await (supabase.rpc as any)('complete_task', {
        p_task_id: taskId,
        p_notes: notes ?? null,
      });

      if (error) {
        // Fallback: direct update to tasks table
        const { error: updateError } = await (supabase
          .from('tasks') as any)
          .update({ status: 'Completed', notes })
          .eq('id', taskId);

        if (updateError) {
          console.warn('Local complete_task note:', updateError.message);
        }
      }

      return data ?? true;
    },
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: ['my-day'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      // Optimistically mark completed in all active my-day queries
      queryClient.setQueriesData<MyDayData>({ queryKey: ['my-day'] }, (old) => {
        if (!old) return old;
        const markItem = (item: MyDayItem) =>
          item.item_id === taskId ? { ...item, status: 'Completed' } : item;

        return {
          ...old,
          overdue: old.overdue.map(markItem),
          today: old.today.map(markItem),
          upcoming: old.upcoming.map(markItem),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-day'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followUpId, notes }: { followUpId: string; notes?: string }) => {
      const { data, error } = await (supabase.rpc as any)('complete_follow_up', {
        p_follow_up_id: followUpId,
        p_notes: notes ?? null,
      });

      if (error) {
        const { error: updateError } = await (supabase
          .from('follow_ups') as any)
          .update({ status: 'Completed', notes })
          .eq('id', followUpId);

        if (updateError) {
          console.warn('Local complete_follow_up note:', updateError.message);
        }
      }

      return data ?? true;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-day'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
