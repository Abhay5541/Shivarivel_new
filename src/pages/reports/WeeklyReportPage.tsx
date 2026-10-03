import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building2,
  ShoppingCart,
  Users2,
  CreditCard,
  AlertTriangle,
  Briefcase,
  Compass,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { ReportPrintHeader } from '@/components/reports/ReportPrintHeader';
import { ReportDateFilterBar } from '@/components/reports/ReportDateFilterBar';
import { formatINR } from '@/lib/utils';
import { useWeeklyReport } from '@/hooks/useReports';
import { getDateRangeForPreset, formatReportDateRange } from '@/lib/reportDateUtils';
import type { ReportDatePreset, DateRange } from '@/types/reports';

export function WeeklyReportPage() {
  const navigate = useNavigate();

  const [preset, setPreset] = useState<ReportDatePreset>('this_week');
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset('this_week')
  );

  const { data: report, isLoading, isError, refetch, isFetching } = useWeeklyReport(
    dateRange.startDate,
    dateRange.endDate
  );

  const handlePresetChange = (newPreset: ReportDatePreset) => {
    setPreset(newPreset);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleReset = () => {
    setPreset('this_week');
    setDateRange(getDateRangeForPreset('this_week'));
  };

  const periodFormatted = formatReportDateRange(dateRange.startDate, dateRange.endDate);

  return (
    <PageContainer>
      {/* Official Print Header */}
      <ReportPrintHeader
        reportTitle="Weekly Operational Summary"
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />

      {/* Screen Interactive Header */}
      <ReportHeader
        title="Weekly Operational Report"
        subtitle="Consolidated owner review: active site progress, material intake, daily labor, cash movements, and site issues."
        badgeText="Week at a Glance"
        badgeIcon={<Calendar className="w-3.5 h-3.5 text-[#C99A2E]" />}
        dateRangeText={periodFormatted}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Date Filter Bar */}
      <ReportDateFilterBar
        preset={preset}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onPresetChange={handlePresetChange}
        onDateRangeChange={handleDateRangeChange}
        onReset={handleReset}
      />

      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Compiling weekly operational records...</h3>
          <p className="text-xs text-[#6B6B6B]">Aggregating live project progress, material bills, labor hours, and cash vouchers</p>
        </div>
      ) : isError || !report ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Weekly report could not be loaded</h3>
          <p className="text-xs text-[#6B6B6B]">
            There was a problem compiling the operational summary for the selected period.
          </p>
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
          {/* 1. WEEK AT A GLANCE (KPI STRIP) */}
          {/* ========================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Projects</span>
                <Building2 className="w-4 h-4 text-[#C99A2E]" />
              </div>
              <div className="text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {report.projects.active_count}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">Live construction sites</p>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Purchases Booked</span>
                <ShoppingCart className="w-4 h-4 text-[#C99A2E]" />
              </div>
              <div className="text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {formatINR(report.purchases.total_amount)}
              </div>
              <p className="text-[11px] text-[#6B6B6B]">{report.purchases.count} confirmed order(s)</p>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Workforce On Sites</span>
                <Users2 className="w-4 h-4 text-[#C99A2E]" />
              </div>
              <div className="text-2xl font-bold font-heading text-[#242424] tabular-nums">
                {report.labour.distinct_workers} <span className="text-xs font-normal text-[#6B6B6B]">crew</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B]">{report.labour.attendance_records} total attendance logs</p>
            </div>

            <div className="p-4 bg-[#EAF5EE] border border-[#1E6B37]/30 rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[#1E6B37]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Customer Received</span>
                <CreditCard className="w-4 h-4 text-[#1E6B37]" />
              </div>
              <div className="text-2xl font-bold font-heading text-[#1E6B37] tabular-nums">
                {formatINR(report.customer_payments.total_amount)}
              </div>
              <p className="text-[11px] text-[#1E6B37]/80">{report.customer_payments.count} cleared milestone receipt(s)</p>
            </div>
          </div>

          {/* ========================================== */}
          {/* 2. BUSINESS DEVELOPMENT ACTIVITY */}
          {/* ========================================== */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  1. Business Activity
                </h3>
              </div>
              <span className="text-xs text-[#6B6B6B]">New pipeline inquiries & site measurements</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-[#4A0E0E]" />
                  <div>
                    <span className="font-semibold text-[#242424] block">New Client Enquiries</span>
                    <span className="text-[11px] text-[#6B6B6B]">Received during selected week</span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-[#4A0E0E] tabular-nums">
                  {report.other_activity.new_enquiries}
                </span>
              </div>

              <div className="p-3.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-[#C99A2E]" />
                  <div>
                    <span className="font-semibold text-[#242424] block">Completed Site Visits</span>
                    <span className="text-[11px] text-[#6B6B6B]">Surveyed and documented</span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-[#242424] tabular-nums">
                  {report.other_activity.completed_visits}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 3. PROJECT ACTIVITY & WORK PROGRESS */}
          {/* ========================================== */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DDD5]/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4A0E0E]" />
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  2. Project Activity & Site Progress
                </h3>
              </div>
              <span className="text-xs text-[#6B6B6B]">
                {report.site_activity.reports_count} Daily Site Report(s) logged
              </span>
            </div>

            {report.projects.active_projects.length === 0 ? (
              <p className="text-xs text-[#8C8880] italic py-4 text-center">
                No active projects recorded for this reporting period.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {report.projects.active_projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="p-3.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg hover:border-[#4A0E0E]/40 transition-colors cursor-pointer space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                          {proj.project_code}
                        </span>
                        <h4 className="font-bold text-[#242424] mt-1">{proj.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#1E6B37] shrink-0">
                        {proj.overall_progress_percentage}% Done
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#E2DDD5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E6B37] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, proj.overall_progress_percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Site Issues / Delays Logged */}
            {report.site_activity.issues_noted.length > 0 && (
              <div className="pt-2 border-t border-[#E2DDD5]/60 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A84B14] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Site Issues / Delays Noted During Week</span>
                </span>
                <div className="space-y-2">
                  {report.site_activity.issues_noted.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 bg-[#FEF5E7] border border-[#C99A2E]/30 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#242424]">
                        <span>{issue.project_name}</span>
                        <span className="text-[11px] font-mono text-[#6B6B6B]">{issue.report_date}</span>
                      </div>
                      {issue.issues && (
                        <p className="text-[#A84B14] leading-relaxed">
                          <strong>Issue:</strong> {issue.issues}
                        </p>
                      )}
                      {issue.delays && (
                        <p className="text-[#6B6B6B] leading-relaxed">
                          <strong>Resolution/Delay:</strong> {issue.delays}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* 4. PROCUREMENT & WORKFORCE TWO-COLUMN ROW */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Procurement Block */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#4A0E0E]" />
                  <h3 className="text-sm font-bold text-[#242424] font-heading">
                    3. Material Procurement
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/reports/purchases')}
                  className="text-xs font-semibold text-[#4A0E0E] hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <span>Purchase Report</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Invoices Booked</span>
                  <span className="text-lg font-bold font-mono text-[#242424] mt-0.5 block tabular-nums">
                    {report.purchases.count} orders
                  </span>
                </div>
                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Purchases Amount</span>
                  <span className="text-lg font-bold font-mono text-[#4A0E0E] mt-0.5 block tabular-nums">
                    {formatINR(report.purchases.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Workforce Block */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
                <div className="flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-[#4A0E0E]" />
                  <h3 className="text-sm font-bold text-[#242424] font-heading">
                    4. Workforce & Labor
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/reports/workforce')}
                  className="text-xs font-semibold text-[#4A0E0E] hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <span>Workforce Report</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Attendance Recorded</span>
                  <span className="text-lg font-bold font-mono text-[#242424] mt-0.5 block tabular-nums">
                    {report.labour.attendance_records} days
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">Across {report.labour.distinct_workers} workers</span>
                </div>
                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Wages Accrued</span>
                  <span className="text-lg font-bold font-mono text-[#242424] mt-0.5 block tabular-nums">
                    {formatINR(report.wages.total_amount)}
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">{report.wages.count} wage shifts</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 5. MONEY MOVEMENTS (SEPARATE INFLOWS/OUTFLOWS) */}
          {/* Strict Rule: NO PROFIT, NO NET CASH FLOW */}
          {/* ========================================== */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DDD5]/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E6B37]" />
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  5. Weekly Cash & Payment Activity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/reports/payments')}
                className="text-xs font-semibold text-[#4A0E0E] hover:underline flex items-center gap-1 cursor-pointer print:hidden"
              >
                <span>Full Payment Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 bg-[#EAF5EE] border border-[#1E6B37]/30 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#1E6B37] uppercase tracking-wider block">
                  Customer Receipts (Money In)
                </span>
                <div className="text-xl font-bold font-mono text-[#1E6B37] tabular-nums">
                  {formatINR(report.customer_payments.total_amount)}
                </div>
                <span className="text-[11px] text-[#1E6B37]/80 block">
                  {report.customer_payments.count} cleared payment voucher(s)
                </span>
              </div>

              <div className="p-4 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#A84B14] uppercase tracking-wider block">
                  Supplier Disbursed (Money Out)
                </span>
                <div className="text-xl font-bold font-mono text-[#242424] tabular-nums">
                  {formatINR(report.supplier_payments.total_amount)}
                </div>
                <span className="text-[11px] text-[#6B6B6B] block">
                  {report.supplier_payments.count} vendor payment(s)
                </span>
              </div>

              <div className="p-4 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#C99A2E] uppercase tracking-wider block">
                  Direct Expenses (Site Outflows)
                </span>
                <div className="text-xl font-bold font-mono text-[#242424] tabular-nums">
                  {formatINR(report.expenses.total_amount)}
                </div>
                <span className="text-[11px] text-[#6B6B6B] block">
                  {report.expenses.count} petty cash / fuel / rent expense(s)
                </span>
              </div>
            </div>

            {/* Pending Snapshot */}
            <div className="pt-2 border-t border-[#E2DDD5]/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6B6B6B] gap-2">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>
                  Pending Customer Receivables: <strong className="font-mono text-[#242424]">{formatINR(report.pending_payments.customer_receivables)}</strong>
                </span>
              </div>
              <div>
                <span>
                  Pending Supplier Payables: <strong className="font-mono text-[#A84B14]">{formatINR(report.pending_payments.supplier_payables)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
