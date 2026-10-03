import { useNavigate, Link } from 'react-router-dom';
import {
  PieChart,
  HandCoins,
  Coins,
  ChevronRight,
  Plus,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import { useFinancialSummary } from '@/hooks/useFinance';

export function FinancialSummaryPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading, isError, refetch } = useFinancialSummary();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-12 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Loading Financial Control Center...</h3>
          <p className="text-xs text-[#6B6B6B]">Aggregating live customer receipts, vendor payables, and labor costs</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Could not load financial summary</h3>
          <p className="text-xs text-[#6B6B6B]">
            There was an error compiling the company financial overview. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Financial Control Center"
        subtitle="Operational construction treasury: client receivables, vendor payables, site labor, and recorded costs"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4A0E0E]/10 text-[#4A0E0E] border border-[#4A0E0E]/20">
            <PieChart className="w-3.5 h-3.5 text-[#C99A2E]" />
            Treasury & Cost Ledger
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#6B6B6B]" />
              <span className="hidden sm:inline">Print Statement</span>
            </Button>
          </div>
        }
      />

      {/* 5-SECTION OPERATIONAL FINANCIAL HIERARCHY */}
      <div className="space-y-8 pb-12">
        {/* ========================================================= */}
        {/* SECTION 1: CUSTOMER MONEY (WHO OWES THE BUSINESS MONEY?) */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD5]/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E6B37]" />
                <h3 className="text-base font-bold text-[#242424] font-heading">
                  1. Customer Money (Receivables)
                </h3>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Contract agreed billing, confirmed client receipts, and pending customer milestone balance
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/customer-payments')}
                className="text-xs font-semibold"
              >
                View Receipts
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/customer-payments/new')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>Record Receipt</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5]">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Total Contract Value
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.customer.total_contract_value)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Total committed scope across active projects
              </div>
            </div>

            <div className="p-4 bg-[#EAF5EE] rounded-xl border border-[#1E6B37]/30">
              <span className="text-[11px] font-bold text-[#1E6B37] uppercase tracking-wider block">
                Customer Received
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#1E6B37] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.customer.total_received)}
              </div>
              <div className="text-[11px] text-[#1E6B37]/80 mt-1 font-medium">
                Cleared client stage milestone vouchers
              </div>
            </div>

            <div className="p-4 bg-[#FEF5E7] rounded-xl border border-[#C99A2E]/40">
              <span className="text-[11px] font-bold text-[#B86E00] uppercase tracking-wider block">
                Customer Outstanding
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#B86E00] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.customer.total_outstanding)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Contract Value − Customer Payments
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: SUPPLIER MONEY (WHO DOES THE BUSINESS NEED TO PAY?) */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD5]/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A84B14]" />
                <h3 className="text-base font-bold text-[#242424] font-heading">
                  2. Supplier Money (Vendor Payables)
                </h3>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Material procurement purchases, disbursed vendor payments, and outstanding invoice liabilities
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/supplier-payments')}
                className="text-xs font-semibold"
              >
                View Vendor Payments
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/supplier-payments/new')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>Record Supplier Payment</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5]">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Total Material Purchases
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.supplier.total_purchases)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Confirmed material delivery bills
              </div>
            </div>

            <div className="p-4 bg-[#EAF5EE] rounded-xl border border-[#1E6B37]/30">
              <span className="text-[11px] font-bold text-[#1E6B37] uppercase tracking-wider block">
                Supplier Payments Paid
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#1E6B37] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.supplier.total_paid)}
              </div>
              <div className="text-[11px] text-[#1E6B37]/80 mt-1 font-medium">
                Vendor disbursements and settled invoices
              </div>
            </div>

            <div className="p-4 bg-[#FEF5E7] rounded-xl border border-[#C99A2E]/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#B86E00] uppercase tracking-wider block">
                  Supplier Outstanding
                </span>
                {summary.supplier.unallocated_credit > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-[#C99A2E]/10 text-[#4A0E0E] px-1.5 py-0.5 rounded">
                    Credit: {formatINR(summary.supplier.unallocated_credit)}
                  </span>
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#B86E00] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.supplier.total_outstanding)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Purchases − Payments (Unallocated credit visible separately)
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: EMPLOYEE MONEY (STRICT NON-NETTING ISOLATION) */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD5]/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4A0E0E]" />
                <h3 className="text-base font-bold text-[#242424] font-heading">
                  3. Employee Money (Labor Compensation & Advances)
                </h3>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Strict financial purity: Daily Wages and Employee Advances are tracked separately and <strong>never netted</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/employee-payments')}
                className="text-xs font-semibold"
              >
                Disbursements
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/employee-payments/new')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>Disburse Payment</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Block A: Daily Wages Ledger */}
            <div className="bg-[#F7F5F0]/60 border border-[#E2DDD5] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
                  <Coins className="w-3.5 h-3.5 text-[#C99A2E]" />
                  <span>Wage Compensation Ledger</span>
                </div>
                <Link
                  to="/wages"
                  className="text-[11px] font-semibold text-[#4A0E0E] hover:underline"
                >
                  View All Wages →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] uppercase block">Earned</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#242424] block mt-0.5 tabular-nums">
                    {formatINR(summary.employee.wages_earned)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#1E6B37] uppercase block">Paid</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#1E6B37] block mt-0.5 tabular-nums">
                    {formatINR(summary.employee.wages_paid)}
                  </span>
                </div>
                <div className="bg-white p-1 rounded-lg border border-[#C99A2E]/40">
                  <span className="text-[10px] font-bold text-[#B86E00] uppercase block">Payable</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#B86E00] block mt-0.5 tabular-nums">
                    {formatINR(summary.employee.wage_payable)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-[#6B6B6B] italic pt-1">
                Wages Earned − Wages Paid = Wage Payable
              </div>
            </div>

            {/* Block B: Employee Advances Ledger */}
            <div className="bg-[#F7F5F0]/60 border border-[#E2DDD5] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
                  <HandCoins className="w-3.5 h-3.5 text-[#C99A2E]" />
                  <span>Advance Loan Register</span>
                </div>
                <Link
                  to="/advances"
                  className="text-[11px] font-semibold text-[#4A0E0E] hover:underline"
                >
                  View Advances →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] uppercase block">Given</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#242424] block mt-0.5 tabular-nums">
                    {formatINR(summary.employee.advances_given)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#1E6B37] uppercase block">Recovered</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#1E6B37] block mt-0.5 tabular-nums">
                    {formatINR(summary.employee.advances_recovered)}
                  </span>
                </div>
                <div className="bg-white p-1 rounded-lg border border-[#4A0E0E]/30">
                  <span className="text-[10px] font-bold text-[#4A0E0E] uppercase block">Outstanding</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#4A0E0E] block mt-0.5 tabular-nums">
                    {formatINR(summary.employee.advance_outstanding)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-[#6B6B6B] italic pt-1">
                Advances Received − Advances Recovered = Advance Outstanding
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: DIRECT EXPENSES */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD5]/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
                <h3 className="text-base font-bold text-[#242424] font-heading">
                  4. Recorded Expenses
                </h3>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Direct site petty outflows and general head office operational administration
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/expenses')}
                className="text-xs font-semibold"
              >
                View Expenses
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/expenses/new')}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>Add Expense</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5]">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Total Recorded Expenses
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.expenses.total_expenses)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Cumulative confirmed expense vouchers
              </div>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5]">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Site Direct Expenses
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#4A0E0E] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.expenses.site_expenses)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Allocated to job sites (in Recorded Project Cost)
              </div>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5]">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                General Business Overhead
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-1.5 tabular-nums">
                {formatINR(summary.expenses.overhead_expenses)}
              </div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">
                Head office utilities, telecom, & administration
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: RECORDED PROJECT COST (THE CORE METRIC) */}
        {/* Purchases + Employee Wages + Expenses (NOT profit) */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E2DDD5]/70 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4A0E0E]" />
                <h3 className="text-base font-bold text-[#242424] font-heading">
                  5. Recorded Project Cost
                </h3>
              </div>
              <div className="font-mono font-bold text-lg text-[#4A0E0E] tabular-nums">
                Total: {formatINR(summary.project_cost.total_recorded_cost)}
              </div>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Authoritative formula: <strong>Recorded Project Cost = Purchases + Employee Wages + Expenses</strong>. (This is verified recorded operational outflow, NOT profit or margin).
            </p>
          </div>

          {/* Project Cost Breakdown Table (Desktop) */}
          <div className="hidden md:block overflow-hidden border border-[#E2DDD5] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[#6B6B6B] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4 text-right">Contract Value</th>
                  <th className="py-3 px-4 text-right">Customer Recv</th>
                  <th className="py-3 px-4 text-right">Customer Balance</th>
                  <th className="py-3 px-4 text-right">Purchases</th>
                  <th className="py-3 px-4 text-right">Wages</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right font-bold text-[#4A0E0E]">Recorded Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                {summary.project_cost.project_breakdown.map((p) => (
                  <tr
                    key={p.project_id}
                    className="hover:bg-[#F7F5F0]/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${p.project_id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#242424]">{p.project_name}</div>
                      <div className="font-mono text-[10px] text-[#4A0E0E]">{p.project_code}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINR(p.contract_value)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#1E6B37] tabular-nums">
                      {formatINR(p.amount_received)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#B86E00] tabular-nums">
                      {formatINR(p.outstanding_customer_balance)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINR(p.total_purchases)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINR(p.total_wages)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINR(p.total_expenses)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#4A0E0E] tabular-nums bg-[#F7F5F0]/30">
                      {formatINR(p.recorded_project_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Project Cost Breakdown Cards (Mobile 360px & 390px Zero Overflow) */}
          <div className="md:hidden space-y-3">
            {summary.project_cost.project_breakdown.map((p) => (
              <div
                key={p.project_id}
                onClick={() => navigate(`/projects/${p.project_id}`)}
                className="p-3.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                      {p.project_code}
                    </span>
                    <h4 className="font-bold text-sm text-[#242424] font-heading truncate mt-1">
                      {p.project_name}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C8880] shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DDD5]/60 text-[11px]">
                  <div>
                    <span className="text-[#6B6B6B] block">Contract Value</span>
                    <span className="font-mono font-bold text-[#242424]">
                      {formatINR(p.contract_value)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Customer Received</span>
                    <span className="font-mono font-bold text-[#1E6B37]">
                      {formatINR(p.amount_received)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2DDD5]/60 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#6B6B6B]">
                    <span>Purchases: {formatINR(p.total_purchases)}</span>
                    <span>Wages: {formatINR(p.total_wages)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold pt-1 border-t border-[#E2DDD5]/40">
                    <span className="text-[#4A0E0E]">Recorded Project Cost</span>
                    <span className="font-mono text-sm text-[#4A0E0E] tabular-nums">
                      {formatINR(p.recorded_project_cost)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
