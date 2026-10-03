import { Link } from 'react-router-dom';
import { ArrowUpRight, Coins, Truck, Users2, Landmark } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { DashboardFinancial } from '@/types/dashboard';

interface MoneySectionProps {
  financial: DashboardFinancial;
}

export function MoneySection({ financial }: MoneySectionProps) {
  const {
    total_customer_receivable,
    total_customer_received,
    total_supplier_payable,
    total_wage_payable,
    total_advance_outstanding,
    total_recorded_project_cost,
  } = financial;

  return (
    <section aria-labelledby="money-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="money-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E] font-heading"
          >
            Financial Position — 4 Pillars (Non-Netting)
          </h2>
          <p className="text-[11px] text-[#6B6B6B]">
            Strict Rule 18: Independent operational ledgers. Zero profit netting.
          </p>
        </div>
        <Link
          to="/financial-summary"
          className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1 transition-colors"
        >
          <span>All Ledgers</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Pillar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Customer Pending */}
        <Link
          to="/customer-payments"
          className="group bg-white border border-[#E2DDD5] hover:border-[#4A0E0E]/40 rounded-xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                Customer Pending
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F9F3E5] flex items-center justify-center text-[#C99A2E] group-hover:scale-105 transition-transform">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-2xl font-bold text-[#242424] font-heading tracking-tight tabular-nums">
                {formatINR(total_customer_receivable)}
              </div>
              <p className="text-xs text-[#1E6B37] font-medium mt-1 tabular-nums">
                Received: {formatINR(total_customer_received)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#E2DDD5]/60 flex items-center justify-between text-[11px] text-[#6B6B6B] group-hover:text-[#4A0E0E]">
            <span>Milestone dues</span>
            <span className="font-semibold flex items-center gap-0.5">
              View Dues <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Pillar 2: Supplier Pending */}
        <Link
          to="/supplier-payments"
          className="group bg-white border border-[#E2DDD5] hover:border-[#4A0E0E]/40 rounded-xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                Supplier Pending
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] flex items-center justify-center text-[#4A0E0E] group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-2xl font-bold text-[#242424] font-heading tracking-tight tabular-nums">
                {formatINR(total_supplier_payable)}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Material procurement balance
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#E2DDD5]/60 flex items-center justify-between text-[11px] text-[#6B6B6B] group-hover:text-[#4A0E0E]">
            <span>Vendor accounts</span>
            <span className="font-semibold flex items-center gap-0.5">
              View Payables <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Pillar 3: Employee Wage Payable */}
        <Link
          to="/wages"
          className="group bg-white border border-[#E2DDD5] hover:border-[#4A0E0E]/40 rounded-xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                Wage Payable
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#EAF5EE] flex items-center justify-center text-[#1E6B37] group-hover:scale-105 transition-transform">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-2xl font-bold text-[#242424] font-heading tracking-tight tabular-nums">
                {formatINR(total_wage_payable)}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Verified site labor wages
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#E2DDD5]/60 flex items-center justify-between text-[11px] text-[#6B6B6B] group-hover:text-[#4A0E0E]">
            <span>Weekly attendance</span>
            <span className="font-semibold flex items-center gap-0.5">
              Wage Ledger <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Pillar 4: Employee Advance Outstanding */}
        <Link
          to="/advances"
          className="group bg-white border border-[#E2DDD5] hover:border-[#4A0E0E]/40 rounded-xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                Advance Outstanding
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FEF5E7] flex items-center justify-center text-[#B86E00] group-hover:scale-105 transition-transform">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-2xl font-bold text-[#242424] font-heading tracking-tight tabular-nums">
                {formatINR(total_advance_outstanding)}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Independent worker loans
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#E2DDD5]/60 flex items-center justify-between text-[11px] text-[#6B6B6B] group-hover:text-[#4A0E0E]">
            <span>Non-netted loan ledger</span>
            <span className="font-semibold flex items-center gap-0.5">
              Advance Ledger <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* Operational Cost Baseline Ribbon (Strictly Operational, NOT Profit) */}
      <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C99A2E]" />
          <span className="font-semibold text-[#242424]">
            Total Recorded Project Cost:
          </span>
          <span className="font-bold text-[#4A0E0E] tabular-nums">
            {formatINR(total_recorded_project_cost)}
          </span>
          <span className="text-[#6B6B6B] text-[11px] hidden sm:inline">
            (Aggregated across materials, labor, site transport &amp; equipment)
          </span>
        </div>
        <Link
          to="/reports/project"
          className="text-[#4A0E0E] hover:text-[#C99A2E] font-medium text-[11px] flex items-center gap-1 self-start sm:self-center"
        >
          <span>View Cost Reports</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}
