import { Link } from 'react-router-dom';
import { Users2, CheckSquare, MapPin, ArrowUpRight, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { DashboardWorkforce, DashboardActions } from '@/types/dashboard';

interface TodayOperationsSectionProps {
  workforce: DashboardWorkforce;
  actions: DashboardActions;
}

export function TodayOperationsSection({
  workforce,
  actions,
}: TodayOperationsSectionProps) {
  const {
    workers_today,
    present_today,
    half_day_today,
    absent_today,
    today_wage_amount,
  } = workforce;

  const {
    pending_tasks,
    overdue_tasks,
    upcoming_site_visits,
    important_reminders = [],
  } = actions;

  // Filter site visits and tasks from reminders
  const todayTasks = important_reminders.filter((r) => r.item_type === 'task').slice(0, 3);
  const todayVisits = important_reminders.filter((r) => r.item_type === 'site_visit').slice(0, 3);

  const isAttendanceMarked = workers_today > 0 || present_today > 0 || absent_today > 0;

  return (
    <section aria-labelledby="today-operations-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="today-operations-heading"
          className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E] font-heading"
        >
          Today's Site Operations
        </h2>
        <Link
          to="/today"
          className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1 transition-colors"
        >
          <span>Daily Execution Center</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar A: Today's Workforce */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Site Workforce
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#EAF5EE] flex items-center justify-center text-[#1E6B37]">
                <Users2 className="w-4 h-4" />
              </div>
            </div>

            {isAttendanceMarked ? (
              <div className="mt-3">
                <div className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
                  {present_today + half_day_today} On Site
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mt-1 flex-wrap">
                  <span className="text-[#1E6B37] font-semibold tabular-nums">
                    {present_today} Full Day
                  </span>
                  <span>•</span>
                  <span className="text-[#B86E00] font-medium tabular-nums">
                    {half_day_today} Half Day
                  </span>
                  {absent_today > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-[#9E2A2B] font-medium tabular-nums">
                        {absent_today} Absent
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-[#6B6B6B]">
                  Today's Earned Wages:{' '}
                  <strong className="text-[#242424] tabular-nums font-semibold">
                    {formatINR(today_wage_amount)}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-[#FEF5E7] border border-[#B86E00]/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B86E00]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Attendance not marked yet</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  Morning site supervisor rolls have not been submitted for today.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between">
            <Link
              to="/attendance"
              className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1"
            >
              {isAttendanceMarked ? 'View Attendance Roll' : 'Mark Today Attendance'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillar B: Today's Tasks */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Site Tasks
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F9F3E5] flex items-center justify-center text-[#C99A2E]">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
                  {pending_tasks}
                </span>
                <span className="text-xs text-[#6B6B6B]">Active Tasks</span>
                {overdue_tasks > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FCEEEE] text-[#9E2A2B] border border-[#9E2A2B]/20 tabular-nums">
                    {overdue_tasks} Overdue
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1.5">
                {todayTasks.length > 0 ? (
                  todayTasks.map((t, idx) => (
                    <div
                      key={t.item_id || idx}
                      className="text-xs text-[#242424] truncate flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C99A2E] shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6B6B6B] italic">
                    Nothing scheduled for today.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between">
            <Link
              to="/today"
              className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1"
            >
              <span>Manage Tasks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillar C: Today's Site Visits */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Site Visits
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] flex items-center justify-center text-[#4A0E0E]">
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
                  {upcoming_site_visits}
                </span>
                <span className="text-xs text-[#6B6B6B]">Scheduled</span>
              </div>

              <div className="mt-2 space-y-1.5">
                {todayVisits.length > 0 ? (
                  todayVisits.map((v, idx) => (
                    <div
                      key={v.item_id || idx}
                      className="text-xs text-[#242424] truncate flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4A0E0E] shrink-0" />
                      <span className="truncate">
                        {v.customer_name ? `${v.customer_name} — ` : ''}
                        {v.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6B6B6B] italic">
                    No site visits scheduled today.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between">
            <Link
              to="/site-visits"
              className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1"
            >
              <span>View Visit Schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
