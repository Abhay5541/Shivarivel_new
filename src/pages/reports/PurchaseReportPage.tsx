import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { ReportPrintHeader } from '@/components/reports/ReportPrintHeader';
import { ReportDateFilterBar } from '@/components/reports/ReportDateFilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatINR } from '@/lib/utils';
import { usePurchaseReport } from '@/hooks/useReports';
import { useSuppliers } from '@/hooks/useProcurement';
import { useProjects } from '@/hooks/useProjects';
import { getDateRangeForPreset, formatReportDateRange } from '@/lib/reportDateUtils';
import type { ReportDatePreset, DateRange, PurchaseReportFilter } from '@/types/reports';

export function PurchaseReportPage() {
  const navigate = useNavigate();
  const { data: suppliers = [] } = useSuppliers();
  const { data: projects = [] } = useProjects();

  const [preset, setPreset] = useState<ReportDatePreset>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset('this_month')
  );

  const [filter, setFilter] = useState<PurchaseReportFilter>({
    supplierId: 'all',
    projectId: 'all',
    status: 'all',
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
      supplierId: 'all',
      projectId: 'all',
      status: 'all',
      startDate: range.startDate,
      endDate: range.endDate,
      search: '',
    });
  };

  const { data, isLoading, isError, refetch, isFetching } = usePurchaseReport(filter);

  const periodFormatted = formatReportDateRange(dateRange.startDate, dateRange.endDate);

  return (
    <PageContainer>
      {/* Official Print Header */}
      <ReportPrintHeader
        reportTitle="Material Procurement & Purchase Report"
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />

      {/* Screen Interactive Header */}
      <ReportHeader
        title="Purchase Operational Report"
        badgeText="Procurement Audit"
        badgeIcon={<ShoppingCart className="w-3.5 h-3.5 text-[#C99A2E]" />}
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
              placeholder="Search invoice or vendor..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-8 pr-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
            />
          </div>

          {/* Supplier */}
          <select
            value={filter.supplierId}
            onChange={(e) => setFilter((prev) => ({ ...prev, supplierId: e.target.value }))}
            className="px-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          >
            <option value="all">All Vendors</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Project */}
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

          {/* Status */}
          <select
            value={filter.status}
            onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
            className="px-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid in Full</option>
            <option value="Partial">Partially Paid</option>
            <option value="Unpaid">Unpaid / Due</option>
          </select>
        </div>
      </ReportDateFilterBar>

      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Loading procurement records...</h3>
        </div>
      ) : isError || !data ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Purchase report could not be loaded</h3>
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
          {/* Summary Strip (Top KPIs) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Total Material Purchases
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {formatINR(data.summary.total_purchases)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">{data.summary.invoices_count} purchase order(s)</p>
            </div>

            <div className="p-4 bg-[#EAF5EE] border border-[#1E6B37]/30 rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#1E6B37] uppercase tracking-wider block">
                Supplier Payments Settled
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#1E6B37] tabular-nums">
                {formatINR(data.summary.total_paid)}
              </div>
              <p className="text-[11px] text-[#1E6B37]/80">Disbursed to vendors</p>
            </div>

            <div className="p-4 bg-[#FEF5E7] border border-[#C99A2E]/40 rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#B86E00] uppercase tracking-wider block">
                Outstanding Payables
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#B86E00] tabular-nums">
                {formatINR(data.summary.total_outstanding)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Unpaid vendor balance</p>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Project Sites Supplied
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {data.summary.project_breakdowns.length}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Allocated construction sites</p>
            </div>
          </div>

          {/* Project Breakdown Cards (Section 21) */}
          {data.summary.project_breakdowns.length > 0 && (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-2.5">
                <Building2 className="w-4 h-4 text-[#4A0E0E]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
                  Purchases by Project Allocation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {data.summary.project_breakdowns.map((pb) => (
                  <div
                    key={pb.project_id || 'unassigned'}
                    className="p-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#4A0E0E]">
                        {pb.project_code}
                      </span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        {pb.purchases_count} invoice(s)
                      </span>
                    </div>
                    <div className="font-bold text-[#242424] truncate">{pb.project_name}</div>
                    <div className="font-mono font-bold text-[#4A0E0E] text-sm tabular-nums pt-1">
                      {formatINR(pb.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Table / Mobile Cards */}
          {data.items.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-2">
              <ShoppingCart className="w-8 h-8 text-[#8C8880] mx-auto" />
              <h3 className="text-sm font-bold text-[#242424]">No purchases match the selected filters</h3>
              <p className="text-xs text-[#6B6B6B]">Adjust date range, vendor selection, or clear search.</p>
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
                        <th className="px-4 py-3">Invoice # / Date</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Project Site</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                      {data.items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F7F5F0]/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/purchases/${item.id}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-[#4A0E0E] block">
                              {item.invoice_number}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B]">
                              {new Date(item.purchase_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold block">{item.supplier_name}</span>
                          </td>
                          <td className="px-4 py-3">
                            {item.project_name ? (
                              <>
                                <span className="font-medium block">{item.project_name}</span>
                                <span className="font-mono text-[10px] text-[#6B6B6B]">{item.project_code}</span>
                              </>
                            ) : (
                              <span className="text-[#8C8880] italic">General Inventory</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                            {formatINR(item.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#1E6B37] tabular-nums font-medium">
                            {formatINR(item.paid_amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#B86E00] tabular-nums font-semibold">
                            {formatINR(item.outstanding_balance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              variant={
                                item.payment_status === 'Paid'
                                  ? 'completed'
                                  : item.payment_status === 'Partial'
                                  ? 'pending'
                                  : 'draft'
                              }
                            >
                              {item.payment_status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3 text-center print:hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/purchases/${item.id}`);
                              }}
                              className="text-[11px] font-semibold text-[#4A0E0E] hover:underline cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/purchases/${item.id}`)}
                    className="p-3.5 bg-white border border-[#E2DDD5] rounded-xl space-y-2.5 text-xs shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-[#4A0E0E] block">{item.invoice_number}</span>
                        <h4 className="font-bold text-[#242424] mt-0.5">{item.supplier_name}</h4>
                        <span className="text-[11px] text-[#6B6B6B] block">
                          {item.project_name || 'General Inventory'}
                        </span>
                      </div>
                      <StatusBadge
                        variant={
                          item.payment_status === 'Paid'
                            ? 'completed'
                            : item.payment_status === 'Partial'
                            ? 'pending'
                            : 'draft'
                        }
                      >
                        {item.payment_status}
                      </StatusBadge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2DDD5]/60 text-[11px]">
                      <div>
                        <span className="text-[#6B6B6B] block">Total</span>
                        <span className="font-mono font-bold text-[#242424]">{formatINR(item.total_amount)}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Paid</span>
                        <span className="font-mono font-bold text-[#1E6B37]">{formatINR(item.paid_amount)}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Due</span>
                        <span className="font-mono font-bold text-[#B86E00]">{formatINR(item.outstanding_balance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
