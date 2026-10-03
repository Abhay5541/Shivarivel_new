import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { ReportPrintHeader } from '@/components/reports/ReportPrintHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatINR } from '@/lib/utils';
import { useProjectReport } from '@/hooks/useReports';
import { useCustomers } from '@/hooks/useCustomers';
import type { ProjectReportFilter } from '@/types/reports';

export function ProjectReportPage() {
  const navigate = useNavigate();
  const { data: customers = [] } = useCustomers();

  const [filter, setFilter] = useState<ProjectReportFilter>({
    status: 'Active',
    customerId: 'all',
    search: '',
  });

  const { data, isLoading, isError, refetch, isFetching } = useProjectReport(filter);

  const handleReset = () => {
    setFilter({
      status: 'Active',
      customerId: 'all',
      search: '',
    });
  };

  return (
    <PageContainer>
      {/* Official Print Header */}
      <ReportPrintHeader
        reportTitle="Project Operational Status & Cost Ledger"
        periodLabel={`Filter: ${filter.status === 'all' ? 'All Projects' : filter.status + ' Projects'}`}
      />

      {/* Screen Interactive Header */}
      <ReportHeader
        title="Project Operational Report"
        subtitle="Cross-project milestone progress, customer receivable balances, and recorded site costs."
        badgeText="Multi-Project Audit"
        badgeIcon={<Building2 className="w-3.5 h-3.5 text-[#C99A2E]" />}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        backToReports
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C8880] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, title, or client..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2DDD5] rounded-lg bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase shrink-0">Status:</span>
            <select
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-[#E2DDD5] rounded-lg bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
            >
              <option value="all">All Projects</option>
              <option value="Active">Active Projects</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase shrink-0">Client:</span>
            <select
              value={filter.customerId}
              onChange={(e) => setFilter((prev) => ({ ...prev, customerId: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-[#E2DDD5] rounded-lg bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
            >
              <option value="all">All Clients</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E2DDD5]/60 text-xs text-[#6B6B6B]">
          <span>
            Showing <strong>{data?.items.length || 0}</strong> project record(s)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-[#4A0E0E] hover:underline font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Loading project operational records...</h3>
        </div>
      ) : isError || !data ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Project report could not be loaded</h3>
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
                Total Scope Value
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {formatINR(data.summary.total_contract_value)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Across {data.summary.total_projects} project(s)</p>
            </div>

            <div className="p-4 bg-[#EAF5EE] border border-[#1E6B37]/30 rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#1E6B37] uppercase tracking-wider block">
                Customer Received
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#1E6B37] tabular-nums">
                {formatINR(data.summary.total_customer_received)}
              </div>
              <p className="text-[11px] text-[#1E6B37]/80">Cleared milestone payments</p>
            </div>

            <div className="p-4 bg-[#FEF5E7] border border-[#C99A2E]/40 rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#B86E00] uppercase tracking-wider block">
                Customer Balance
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#B86E00] tabular-nums">
                {formatINR(data.summary.total_customer_outstanding)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Pending collection (Contract − Recv)</p>
            </div>

            <div className="p-4 bg-white border border-[#4A0E0E]/30 rounded-xl space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
                Recorded Project Cost
              </span>
              <div className="text-xl sm:text-2xl font-bold font-heading text-[#4A0E0E] tabular-nums">
                {formatINR(data.summary.total_recorded_cost)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Purchases + Wages + Expenses</p>
            </div>
          </div>

          {/* Project List / Table */}
          {data.items.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-[#8C8880] mx-auto" />
              <h3 className="text-sm font-bold text-[#242424]">No projects match the selected filters</h3>
              <p className="text-xs text-[#6B6B6B]">Try changing the status or search criteria.</p>
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
              {/* Desktop Professional Table */}
              <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] uppercase text-[#6B6B6B] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Project / Client</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Progress</th>
                        <th className="px-4 py-3 text-right">Contract Value</th>
                        <th className="px-4 py-3 text-right">Received</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        <th className="px-4 py-3 text-right font-bold text-[#4A0E0E]">Recorded Cost</th>
                        <th className="px-4 py-3 text-center print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                      {data.items.map((proj) => (
                        <tr
                          key={proj.id}
                          className="hover:bg-[#F7F5F0]/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/projects/${proj.id}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                              {proj.project_code}
                            </span>
                            <span className="font-semibold block text-sm text-[#242424] mt-1">
                              {proj.name}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B] block">
                              Client: {proj.customer_name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge variant={proj.status === 'Active' ? 'active' : proj.status === 'Completed' ? 'completed' : 'pending'}>
                              {proj.status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span className="font-bold text-[#1E6B37] block">
                              {proj.overall_progress_percentage}%
                            </span>
                            <div className="w-16 bg-[#E2DDD5] h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                              <div
                                className="bg-[#1E6B37] h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, proj.overall_progress_percentage))}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                            {formatINR(proj.contract_value)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#1E6B37] tabular-nums font-medium">
                            {formatINR(proj.amount_received)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#B86E00] tabular-nums font-semibold">
                            {formatINR(proj.outstanding_balance)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#4A0E0E] tabular-nums bg-[#F7F5F0]/30">
                            {formatINR(proj.recorded_project_cost)}
                          </td>
                          <td className="px-4 py-3 text-center print:hidden">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4A0E0E] hover:underline">
                              <span>Detail</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Grouped Cards (360px & 390px Zero Overflow) */}
              <div className="md:hidden space-y-3">
                {data.items.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-3 text-xs shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                          {proj.project_code}
                        </span>
                        <h4 className="font-bold text-sm text-[#242424] mt-1">{proj.name}</h4>
                        <span className="text-[11px] text-[#6B6B6B]">Client: {proj.customer_name}</span>
                      </div>
                      <StatusBadge variant={proj.status === 'Active' ? 'active' : proj.status === 'Completed' ? 'completed' : 'pending'}>
                        {proj.status}
                      </StatusBadge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-[#6B6B6B]">Milestone Execution</span>
                        <span className="font-bold text-[#1E6B37]">{proj.overall_progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-[#E2DDD5] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1E6B37] h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, proj.overall_progress_percentage))}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DDD5]/60 text-[11px]">
                      <div>
                        <span className="text-[#6B6B6B] block">Contract Value</span>
                        <span className="font-mono font-bold text-[#242424]">{formatINR(proj.contract_value)}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Customer Received</span>
                        <span className="font-mono font-bold text-[#1E6B37]">{formatINR(proj.amount_received)}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Outstanding</span>
                        <span className="font-mono font-bold text-[#B86E00]">{formatINR(proj.outstanding_balance)}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Recorded Cost</span>
                        <span className="font-mono font-bold text-[#4A0E0E]">{formatINR(proj.recorded_project_cost)}</span>
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
