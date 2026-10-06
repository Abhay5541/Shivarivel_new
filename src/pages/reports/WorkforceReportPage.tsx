import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  CalendarCheck,
  Coins,
  HandCoins,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { ReportPrintHeader } from '@/components/reports/ReportPrintHeader';
import { ReportDateFilterBar } from '@/components/reports/ReportDateFilterBar';
import { formatINR } from '@/lib/utils';
import { useWorkforceReport } from '@/hooks/useReports';
import { useEmployees } from '@/hooks/useWorkforce';
import { useProjects } from '@/hooks/useProjects';
import { TRADE_CATEGORIES } from '@/types/workforce';
import { getDateRangeForPreset, formatReportDateRange } from '@/lib/reportDateUtils';
import type { ReportDatePreset, DateRange, WorkforceReportFilter } from '@/types/reports';

export function WorkforceReportPage() {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();

  const [preset, setPreset] = useState<ReportDatePreset>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset('this_month')
  );

  const [filter, setFilter] = useState<WorkforceReportFilter>({
    employeeId: 'all',
    projectId: 'all',
    trade: 'all',
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
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
      employeeId: 'all',
      projectId: 'all',
      trade: 'all',
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  const { data, isLoading, isError, refetch, isFetching } = useWorkforceReport(filter);

  const periodFormatted = formatReportDateRange(dateRange.startDate, dateRange.endDate);

  return (
    <PageContainer>
      {/* Official Print Header */}
      <ReportPrintHeader
        reportTitle="Workforce Attendance, Wages & Advances Audit"
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />

      {/* Screen Interactive Header */}
      <ReportHeader
        title="Workforce Operational Report"
        badgeText="Workforce & Payroll Audit"
        badgeIcon={<Users2 className="w-3.5 h-3.5 text-[#C99A2E]" />}
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
          {/* Employee */}
          <select
            value={filter.employeeId}
            onChange={(e) => setFilter((prev) => ({ ...prev, employeeId: e.target.value }))}
            className="px-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          >
            <option value="all">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.worker_type})
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

          {/* Trade Category */}
          <select
            value={filter.trade}
            onChange={(e) => setFilter((prev) => ({ ...prev, trade: e.target.value }))}
            className="px-2.5 py-1.5 text-xs border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          >
            <option value="all">All Trades</option>
            {TRADE_CATEGORIES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </ReportDateFilterBar>

      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Compiling workforce muster & wage ledgers...</h3>
        </div>
      ) : isError || !data ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Workforce report could not be loaded</h3>
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
          {/* 1. ATTENDANCE MUSTER SUMMARY (Section 26) */}
          {/* ========================================== */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-2.5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#4A0E0E]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
                  Attendance Muster Summary
                </h3>
              </div>
              <span className="text-xs text-[#6B6B6B]">
                {data.summary.attendance.distinct_workers} active workers deployed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E2DDD5]">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Total Days Logged</span>
                <span className="text-xl font-bold font-mono text-[#242424] mt-0.5 block tabular-nums">
                  {data.summary.attendance.total_records}
                </span>
              </div>

              <div className="p-3 bg-[#EAF5EE] rounded-lg border border-[#1E6B37]/30">
                <span className="text-[10px] text-[#1E6B37] uppercase font-bold block">Present (Full Day)</span>
                <span className="text-xl font-bold font-mono text-[#1E6B37] mt-0.5 block tabular-nums">
                  {data.summary.attendance.present_count}
                </span>
              </div>

              <div className="p-3 bg-[#FEF5E7] rounded-lg border border-[#C99A2E]/40">
                <span className="text-[10px] text-[#B86E00] uppercase font-bold block">Half Day Shifts</span>
                <span className="text-xl font-bold font-mono text-[#B86E00] mt-0.5 block tabular-nums">
                  {data.summary.attendance.half_day_count}
                </span>
              </div>

              <div className="p-3 bg-[#FDF7F7] rounded-lg border border-[#9E2A2B]/20">
                <span className="text-[10px] text-[#9E2A2B] uppercase font-bold block">Absent Days</span>
                <span className="text-xl font-bold font-mono text-[#9E2A2B] mt-0.5 block tabular-nums">
                  {data.summary.attendance.absent_count}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 2. FINANCIAL DUAL-BLOCK ISOLATION (Section 25) */}
          {/* Strict Rule: WAGES & ADVANCES NEVER COMBINED */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Block A: Daily Wages Compensation */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
                  <Coins className="w-3.5 h-3.5 text-[#C99A2E]" />
                  <span>Wages Compensation Ledger</span>
                </div>
                <span className="text-[10px] text-[#6B6B6B] italic">Earned − Paid = Payable</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#F7F5F0] rounded-lg">
                  <span className="text-[10px] text-[#6B6B6B] uppercase block">Earned</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#242424] block mt-0.5 tabular-nums">
                    {formatINR(data.summary.total_wages_earned)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#EAF5EE] rounded-lg">
                  <span className="text-[10px] text-[#1E6B37] uppercase block">Paid</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#1E6B37] block mt-0.5 tabular-nums">
                    {formatINR(data.summary.total_wages_paid)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#FEF5E7] rounded-lg border border-[#C99A2E]/40">
                  <span className="text-[10px] font-bold text-[#B86E00] uppercase block">Wage Payable</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#B86E00] block mt-0.5 tabular-nums">
                    {formatINR(data.summary.total_wage_payable)}
                  </span>
                </div>
              </div>
            </div>

            {/* Block B: Employee Advances Register */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
                  <HandCoins className="w-3.5 h-3.5 text-[#C99A2E]" />
                  <span>Advance Loan Register</span>
                </div>
                <span className="text-[10px] text-[#6B6B6B] italic">Given − Recovered = Due</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#F7F5F0] rounded-lg">
                  <span className="text-[10px] text-[#6B6B6B] uppercase block">Given</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#242424] block mt-0.5 tabular-nums">
                    {formatINR(data.summary.total_advances_given)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#EAF5EE] rounded-lg">
                  <span className="text-[10px] text-[#1E6B37] uppercase block">Recovered</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#1E6B37] block mt-0.5 tabular-nums">
                    {formatINR(data.summary.total_advances_recovered)}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-[#4A0E0E]/30">
                  <span className="text-[10px] font-bold text-[#4A0E0E] uppercase block">Advance Due</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#4A0E0E] block mt-0.5 tabular-nums">
                    {formatINR(data.summary.total_advance_outstanding)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 3. WORKFORCE DETAILED RECORDS TABLE */}
          {/* ========================================== */}
          {data.items.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-2">
              <Users2 className="w-8 h-8 text-[#8C8880] mx-auto" />
              <h3 className="text-sm font-bold text-[#242424]">No workforce records match the selected filters</h3>
              <p className="text-xs text-[#6B6B6B]">Adjust date range, trade selection, or clear filters.</p>
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
                        <th className="px-4 py-3">Employee / Trade</th>
                        <th className="px-4 py-3">Projects Worked</th>
                        <th className="px-4 py-3 text-center">Days (P / H / A)</th>
                        <th className="px-4 py-3 text-right">Wages Earned</th>
                        <th className="px-4 py-3 text-right">Wages Paid</th>
                        <th className="px-4 py-3 text-right font-bold text-[#B86E00]">Wage Payable</th>
                        <th className="px-4 py-3 text-right font-bold text-[#4A0E0E]">Advance Due</th>
                        <th className="px-4 py-3 text-center print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                      {data.items.map((emp) => (
                        <tr
                          key={emp.employee_id}
                          className="hover:bg-[#F7F5F0]/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/employees/${emp.employee_id}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-semibold block text-sm text-[#242424]">
                              {emp.employee_name}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B] block">
                              {emp.worker_type} • ₹{emp.daily_wage_rate}/day
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] text-[#242424]">
                              {emp.projects_worked.join(', ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-[11px]">
                            <span className="text-[#1E6B37] font-bold">{emp.days_present}P</span>
                            {' / '}
                            <span className="text-[#B86E00] font-bold">{emp.days_half_day}H</span>
                            {' / '}
                            <span className="text-[#9E2A2B]">{emp.days_absent}A</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                            {formatINR(emp.wages_earned)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#1E6B37] tabular-nums font-medium">
                            {formatINR(emp.wages_paid)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#B86E00] tabular-nums bg-[#FEF5E7]/40">
                            {formatINR(emp.wage_payable)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#4A0E0E] tabular-nums">
                            {formatINR(emp.advance_outstanding)}
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data.items.map((emp) => (
                  <div
                    key={emp.employee_id}
                    onClick={() => navigate(`/employees/${emp.employee_id}`)}
                    className="p-3.5 bg-white border border-[#E2DDD5] rounded-xl space-y-2.5 text-xs shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#242424]">{emp.employee_name}</h4>
                        <span className="text-[11px] text-[#6B6B6B] block">
                          {emp.worker_type} • ₹{emp.daily_wage_rate}/day
                        </span>
                      </div>
                      <div className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5]">
                        <span className="text-[#1E6B37]">{emp.days_present}P</span>
                        {' '}<span className="text-[#B86E00]">{emp.days_half_day}H</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DDD5]/60 text-[11px]">
                      <div>
                        <span className="text-[#6B6B6B] block">Wages Earned</span>
                        <span className="font-mono font-bold text-[#242424]">{formatINR(emp.wages_earned)}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Wages Paid</span>
                        <span className="font-mono font-bold text-[#1E6B37]">{formatINR(emp.wages_paid)}</span>
                      </div>
                      <div className="p-1.5 bg-[#FEF5E7] rounded border border-[#C99A2E]/30">
                        <span className="text-[#B86E00] font-bold block">Wage Payable</span>
                        <span className="font-mono font-bold text-sm text-[#B86E00]">{formatINR(emp.wage_payable)}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-[#4A0E0E]/20">
                        <span className="text-[#4A0E0E] font-bold block">Advance Due</span>
                        <span className="font-mono font-bold text-sm text-[#4A0E0E]">{formatINR(emp.advance_outstanding)}</span>
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
