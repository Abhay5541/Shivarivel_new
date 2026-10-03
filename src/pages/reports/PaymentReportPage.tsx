import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { ReportPrintHeader } from '@/components/reports/ReportPrintHeader';
import { ReportDateFilterBar } from '@/components/reports/ReportDateFilterBar';
import { formatINR } from '@/lib/utils';
import { usePaymentReport } from '@/hooks/useReports';
import { useProjects } from '@/hooks/useProjects';
import { getDateRangeForPreset, formatReportDateRange } from '@/lib/reportDateUtils';
import type { ReportDatePreset, DateRange, PaymentReportFilter } from '@/types/reports';

export function PaymentReportPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();

  const [preset, setPreset] = useState<ReportDatePreset>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset('this_month')
  );

  const [filter, setFilter] = useState<PaymentReportFilter>({
    classification: 'all',
    projectId: 'all',
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    search: '',
  });

  const handlePresetChange = (newPreset: ReportDatePreset) => {
    setPreset(newPreset);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setFilter((prev) => ({
      ...prev,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
  };

  const handleReset = () => {
    const range = getDateRangeForPreset('this_month');
    setPreset('this_month');
    setDateRange(range);
    setFilter({
      classification: 'all',
      projectId: 'all',
      startDate: range.startDate,
      endDate: range.endDate,
      search: '',
    });
  };

  const { data, isLoading, isError, refetch, isFetching } = usePaymentReport(filter);

  const periodFormatted = formatReportDateRange(dateRange.startDate, dateRange.endDate);

  return (
    <PageContainer>
      {/* Official Print Header */}
      <ReportPrintHeader
        reportTitle="Consolidated Cash Movement & Disbursements Audit"
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />

      {/* Screen Interactive Header */}
      <ReportHeader
        title="Payment Activity Report"
        subtitle="Historical consolidated ledger: client milestone receipts, supplier settlements, labor wages disbursed, and direct expenses."
        badgeText="Payment Audit"
        badgeIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#C99A2E]" />}
        dateRangeText={periodFormatted}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        backToReports
      />

      {/* Date Filter Bar & Dropdowns */}
      <ReportDateFilterBar
        preset={preset}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onPresetChange={handlePresetChange}
        onDateRangeChange={handleDateRangeChange}
        onReset={handleReset}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C8880] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voucher, party, or ref..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-8 pr-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
            />
          </div>

          {/* Classification Filter */}
          <select
            value={filter.classification}
            onChange={(e) => setFilter((prev) => ({ ...prev, classification: e.target.value as any }))}
            className="px-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          >
            <option value="all">All Transactions</option>
            <option value="Customer Receipt">Customer Receipts (Money In)</option>
            <option value="Supplier Payment">Supplier Payments (Money Out)</option>
            <option value="Employee Wage Payment">Employee Wages (Money Out)</option>
            <option value="Direct Expense">Direct Expenses (Money Out)</option>
          </select>

          {/* Project Filter */}
          <select
            value={filter.projectId}
            onChange={(e) => setFilter((prev) => ({ ...prev, projectId: e.target.value }))}
            className="px-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </ReportDateFilterBar>

      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Aggregating payment transaction vouchers...</h3>
        </div>
      ) : isError || !data ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Payment report could not be loaded</h3>
          <p className="text-xs text-[#6B6B6B]">Please check your network and try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#4A0E0E] text-white text-xs font-semibold rounded-lg hover:bg-[#380B0B] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          {/* ========================================== */}
          {/* SUMMARY STRIP (SEPARATE TOTALS - NO NETTING) */}
          {/* Strict Rule: NEVER SUBTRACT, NO NET CASH FLOW */}
          {/* ========================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-[#EAF5EE] border border-[#1E6B37]/30 rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#1E6B37]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Customer Received</span>
                <ArrowDownLeft className="w-4 h-4 text-[#1E6B37]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#1E6B37] tabular-nums">
                {formatINR(data.summary.customer_payments_received)}
              </div>
              <p className="text-[11px] text-[#1E6B37]/80">Confirmed client milestone inflows</p>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#242424]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A84B14]">Supplier Paid</span>
                <ArrowUpRight className="w-4 h-4 text-[#A84B14]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {formatINR(data.summary.supplier_payments_made)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Vendor procurement settlements</p>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#242424]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A0E0E]">Labor Wages Paid</span>
                <ArrowUpRight className="w-4 h-4 text-[#4A0E0E]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {formatINR(data.summary.employee_payments_made)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Site crew wage disbursements</p>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#242424]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C99A2E]">Direct Expenses</span>
                <ArrowUpRight className="w-4 h-4 text-[#C99A2E]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {formatINR(data.summary.expenses_recorded)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Fuel, equipment hire, tools, overhead</p>
            </div>
          </div>

          {/* Transactions Table / Mobile Cards */}
          {data.items.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-[#8C8880] mx-auto" />
              <h3 className="text-sm font-bold text-[#242424]">No payments match the selected filters</h3>
              <p className="text-xs text-[#6B6B6B]">Adjust date range, classification, or search terms.</p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 inline-flex items-center text-xs font-semibold text-[#4A0E0E] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] uppercase text-[#6B6B6B] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Voucher # / Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Party & Role</th>
                        <th className="px-4 py-3">Project Site</th>
                        <th className="px-4 py-3">Mode & Ref</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                      {data.items.map((item) => {
                        const isIncome = item.direction === 'IN';
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-[#F7F5F0]/40 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-[#4A0E0E] block">
                                {item.payment_number}
                              </span>
                              <span className="text-[11px] text-[#6B6B6B]">
                                {new Date(item.payment_date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  isIncome
                                    ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                                    : 'bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]'
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowDownLeft className="w-3 h-3 text-[#1E6B37]" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3 text-[#8C8880]" />
                                )}
                                <span>{item.classification}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold block text-[#242424]">{item.party_name}</span>
                              <span className="text-[11px] text-[#6B6B6B] block">{item.party_role}</span>
                            </td>
                            <td className="px-4 py-3">
                              {item.project_name ? (
                                <>
                                  <span className="font-medium block">{item.project_name}</span>
                                  <span className="font-mono text-[10px] text-[#6B6B6B]">{item.project_code}</span>
                                </>
                              ) : (
                                <span className="text-[#8C8880] italic">General Company</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="capitalize block font-medium">
                                {item.payment_method?.replace(/_/g, ' ') || 'Direct'}
                              </span>
                              {item.reference_number && (
                                <span className="font-mono text-[10px] text-[#6B6B6B] block">
                                  Ref: {item.reference_number}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-mono font-bold text-sm tabular-nums ${
                                  isIncome ? 'text-[#1E6B37]' : 'text-[#242424]'
                                }`}
                              >
                                {isIncome ? '+' : '−'} {formatINR(item.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center print:hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.classification === 'Customer Receipt') {
                                    navigate(`/customer-payments/${item.id}`);
                                  } else if (item.classification === 'Direct Expense') {
                                    navigate(`/expenses/${item.id}`);
                                  } else if (item.classification === 'Supplier Payment') {
                                    navigate('/supplier-payments');
                                  } else {
                                    navigate('/employee-payments');
                                  }
                                }}
                                className="text-[11px] font-semibold text-[#4A0E0E] hover:underline cursor-pointer"
                              >
                                Voucher
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data.items.map((item) => {
                  const isIncome = item.direction === 'IN';
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white border border-[#E2DDD5] rounded-xl space-y-2 text-xs shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-[#4A0E0E] block">{item.payment_number}</span>
                          <h4 className="font-bold text-[#242424] mt-0.5">{item.party_name}</h4>
                          <span className="text-[11px] text-[#6B6B6B] block">
                            {item.classification} • {item.party_role}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-sm tabular-nums block ${
                              isIncome ? 'text-[#1E6B37]' : 'text-[#242424]'
                            }`}
                          >
                            {isIncome ? '+' : '−'} {formatINR(item.amount)}
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            {new Date(item.payment_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between text-[11px] text-[#6B6B6B]">
                        <span>{item.project_name || 'General Company'}</span>
                        <span className="capitalize">{item.payment_method || 'Direct'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
