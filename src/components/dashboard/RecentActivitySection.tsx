import { ArrowDownLeft, Receipt } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DashboardFinancial } from '@/types/dashboard';

interface RecentActivitySectionProps {
  financial: DashboardFinancial;
}

export function RecentActivitySection({ financial }: RecentActivitySectionProps) {
  const { recent_payments = [], recent_expenses = [] } = financial;

  // Interleave and sort recent transactions
  type ActivityItem = {
    id: string;
    type: 'payment' | 'expense';
    title: string;
    subtitle: string;
    amount: number;
    date: string;
    status: string;
  };

  const activities: ActivityItem[] = [
    ...recent_payments.map((p) => ({
      id: p.id,
      type: 'payment' as const,
      title: `Customer Receipt Recorded (${p.payment_method || 'Direct'})`,
      subtitle: `Payment Voucher`,
      amount: p.amount,
      date: p.payment_date,
      status: p.status,
    })),
    ...recent_expenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: `${e.category}: ${e.description}`,
      subtitle: `Site Expense`,
      amount: e.amount,
      date: e.expense_date,
      status: e.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <section aria-labelledby="activity-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="activity-heading"
          className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E] font-heading"
        >
          Recent Activity &amp; Audit Log
        </h2>
        <span className="text-[11px] text-[#6B6B6B]">
          Latest verified transactions
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-6 text-center shadow-xs">
          <p className="text-xs text-[#6B6B6B] italic">
            No recent financial transactions or site expenses recorded.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden divide-y divide-[#E2DDD5]/70 shadow-xs">
          {activities.map((act) => {
            const isPayment = act.type === 'payment';

            return (
              <div
                key={act.id}
                className="p-3.5 sm:p-4 hover:bg-[#F7F5F0]/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isPayment
                        ? 'bg-[#EAF5EE] text-[#1E6B37]'
                        : 'bg-[#F7F5F0] text-[#4A0E0E]'
                    }`}
                  >
                    {isPayment ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#242424] truncate">
                      {act.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mt-0.5">
                      <span>{act.date}</span>
                      <span>•</span>
                      <span>{act.subtitle}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs sm:text-sm font-bold font-heading tabular-nums ${
                      isPayment ? 'text-[#1E6B37]' : 'text-[#242424]'
                    }`}
                  >
                    {isPayment ? '+' : '-'}{formatINR(act.amount)}
                  </div>
                  <div className="mt-0.5">
                    <StatusBadge variant={act.status === 'Confirmed' ? 'completed' : 'pending'}>
                      {act.status}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
