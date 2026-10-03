import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Clock, Calendar, ArrowUpRight } from 'lucide-react';
import type { DashboardActions } from '@/types/dashboard';

interface AttentionSectionProps {
  actions: DashboardActions;
}

export function AttentionSection({ actions }: AttentionSectionProps) {
  const { important_reminders = [], overdue_tasks, follow_ups_due } = actions;

  // Build synthesized actionable list if reminders array is populated or counts indicate urgent action
  const hasUrgentItems =
    important_reminders.length > 0 || overdue_tasks > 0 || follow_ups_due > 0;

  return (
    <section aria-labelledby="attention-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2 h-2 rounded-full bg-[#9E2A2B] animate-pulse" />
          <h2
            id="attention-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E] font-heading"
          >
            Immediate Attention
          </h2>
          {hasUrgentItems && (
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#FCEEEE] text-[#9E2A2B] border border-[#9E2A2B]/20 tabular-nums">
              {important_reminders.length || (overdue_tasks + follow_ups_due)} Required
            </span>
          )}
        </div>
        <Link
          to="/today"
          className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1 transition-colors shrink-0 ml-auto"
        >
          <span>Open My Day</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!hasUrgentItems ? (
        // Calm Positive Empty State (Per Section 8)
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-[#EAF5EE] border border-[#1E6B37]/20 flex items-center justify-center text-[#1E6B37] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#242424] font-heading">
              Everything is on track
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Nothing needs immediate attention. All scheduled site tasks and milestone follow-ups are within target timeframes.
            </p>
          </div>
        </div>
      ) : (
        // Actionable Attention Rows
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden divide-y divide-[#E2DDD5]/70 shadow-xs">
          {important_reminders.length > 0 ? (
            important_reminders.map((item, idx) => {
              const isOverdue = item.urgency === 'OVERDUE' || item.priority === 'Urgent';
              return (
                <div
                  key={item.item_id || idx}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F5F0]/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        isOverdue ? 'bg-[#9E2A2B]' : 'bg-[#B86E00]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isOverdue
                              ? 'bg-[#FCEEEE] text-[#9E2A2B]'
                              : 'bg-[#FEF5E7] text-[#B86E00]'
                          }`}
                        >
                          {item.item_type.replace('_', ' ')}
                        </span>
                        {item.urgency === 'OVERDUE' && (
                          <span className="text-[10px] font-semibold text-[#9E2A2B] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Overdue
                          </span>
                        )}
                        {item.urgency === 'TODAY' && (
                          <span className="text-[10px] font-semibold text-[#B86E00] flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Due Today
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-[#242424] mt-1 leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#6B6B6B] mt-1 flex-wrap">
                        {item.project_name && (
                          <span>
                            Project:{' '}
                            <strong className="font-medium text-[#242424]">
                              {item.project_name}
                            </strong>
                          </span>
                        )}
                        {item.customer_name && (
                          <span>
                            Client:{' '}
                            <strong className="font-medium text-[#242424]">
                              {item.customer_name}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <Link
                      to="/today"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#F7F5F0] hover:bg-[#EFECE6] text-[#4A0E0E] border border-[#E2DDD5] transition-colors"
                    >
                      <span>Take Action</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            // Synthesized fallback alert rows from counts
            <>
              {overdue_tasks > 0 && (
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full mt-1 bg-[#9E2A2B] shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#242424]">
                        {overdue_tasks} construction task{overdue_tasks > 1 ? 's' : ''} past scheduled deadline
                      </h4>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">
                        Site execution milestones need immediate supervisor review.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/today"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#F7F5F0] text-[#4A0E0E] border border-[#E2DDD5]"
                  >
                    <span>View Tasks</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
              {follow_ups_due > 0 && (
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full mt-1 bg-[#B86E00] shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#242424]">
                        {follow_ups_due} customer follow-up{follow_ups_due > 1 ? 's' : ''} scheduled
                      </h4>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">
                        Client estimates and payment milestone calls pending contact.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/today"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#F7F5F0] text-[#4A0E0E] border border-[#E2DDD5]"
                  >
                    <span>View Follow-ups</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
