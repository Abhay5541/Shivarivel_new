import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import { useCustomerPayments, useCustomerBalances } from '@/hooks/useFinance';

export function CustomerPaymentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: payments = [], isLoading, isError, refetch } = useCustomerPayments({
    search: searchTerm,
    projectId: selectedProject,
    status: selectedStatus,
  });

  const { data: projectBalances = [] } = useCustomerBalances();

  // Aggregate metrics
  const totalContract = useMemo(
    () => projectBalances.reduce((sum, p) => sum + p.contract_value, 0),
    [projectBalances]
  );
  const totalReceived = useMemo(
    () => payments.filter((p) => p.status === 'Confirmed').reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const totalReceivable = useMemo(
    () => Math.max(0, totalContract - totalReceived),
    [totalContract, totalReceived]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Customer Payments"
        subtitle="Record milestone receipts, track contract inflows, and verify customer receivable balances"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Milestone Receipts
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => navigate('/customer-payments/new')}
              className="gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#C99A2E]" />
              <span>Record Customer Payment</span>
            </Button>
          </div>
        }
      />

      {/* Financial Context Cards (Strict Non-Profit Invariants) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Total Contract Value
            </span>
            <Building2 className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-2 tabular-nums">
            {formatINR(totalContract)}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Aggregated across {projectBalances.length} active construction contracts
          </div>
        </div>

        <div className="bg-white border border-[#1E6B37]/30 rounded-xl p-4 shadow-xs bg-linear-to-b from-[#F4FAF6] to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E6B37] uppercase tracking-wider">
              Total Received
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1E6B37] font-heading mt-2 tabular-nums">
            {formatINR(totalReceived)}
          </div>
          <div className="text-[11px] text-[#1E6B37]/80 mt-1 font-medium">
            Active confirmed client milestone vouchers
          </div>
        </div>

        <div className="bg-white border border-[#C99A2E]/40 rounded-xl p-4 shadow-xs bg-linear-to-b from-[#FFFDF7] to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B86E00] uppercase tracking-wider">
              Customer Receivable
            </span>
            <CreditCard className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#B86E00] font-heading mt-2 tabular-nums">
            {formatINR(totalReceivable)}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Pending contract collections (Contract − Received)
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by payment #, customer, project, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm text-[#242424] placeholder-[#8C8880] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs text-[#242424] shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projectBalances.map((pb) => (
                <option key={pb.project_id} value={pb.project_id}>
                  {pb.project_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs text-[#242424] shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Payment Content: Desktop Table & Mobile Cards */}
      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 text-center space-y-3">
          <div className="animate-spin w-6 h-6 border-2 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-[#6B6B6B]">Loading customer payments...</p>
        </div>
      ) : isError ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Could not load customer payments</h3>
          <p className="text-xs text-[#6B6B6B]">
            There was a problem loading payment records. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-10 text-center space-y-3">
          <CreditCard className="w-8 h-8 text-[#8C8880] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">No customer payments recorded yet</h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            Record customer milestone receipts as payments are deposited to keep project balances synchronized.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/customer-payments/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4 text-[#C99A2E]" />
            <span>Record Customer Payment</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[#6B6B6B] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Mode / Ref</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#F7F5F0]/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/customer-payments/${p.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#4A0E0E]">
                        {p.payment_number}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#6B6B6B]">
                        {p.payment_date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#242424]">
                          {p.customer?.name || 'Customer'}
                        </div>
                        {p.customer?.phone && (
                          <div className="text-[11px] text-[#6B6B6B]">{p.customer.phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#242424]">
                          {p.project?.name || 'Project'}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] font-mono">
                          {p.project?.project_code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{p.payment_method || '—'}</div>
                        {p.reference_number && (
                          <div className="text-[11px] text-[#6B6B6B] font-mono truncate max-w-[140px]">
                            {p.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#1E6B37] tabular-nums">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.status === 'Confirmed'
                              ? 'bg-[#EAF5EE] text-[#1E6B37]'
                              : p.status === 'Draft'
                              ? 'bg-[#FEF5E7] text-[#B86E00]'
                              : 'bg-[#FDF7F7] text-[#9E2A2B]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/customer-payments/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F7F5F0] hover:bg-[#EFECE6] text-[#242424] font-medium text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#6B6B6B]" />
                          <span>Receipt</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (Strict 360px & 390px Zero Overflow) */}
          <div className="md:hidden space-y-3 pb-8">
            {payments.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/customer-payments/${p.id}`)}
                className="bg-white border border-[#E2DDD5] rounded-xl p-3.5 shadow-xs space-y-2.5 active:bg-[#F7F5F0]/70 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                      {p.payment_number}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">{p.payment_date}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === 'Confirmed'
                        ? 'bg-[#EAF5EE] text-[#1E6B37]'
                        : p.status === 'Draft'
                        ? 'bg-[#FEF5E7] text-[#B86E00]'
                        : 'bg-[#FDF7F7] text-[#9E2A2B]'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#242424] font-heading truncate">
                    {p.customer?.name}
                  </h4>
                  <p className="text-xs text-[#6B6B6B] truncate mt-0.5">
                    {p.project?.name}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between">
                  <div className="text-[11px] text-[#6B6B6B]">
                    <span>{p.payment_method || 'Receipt'}</span>
                    {p.reference_number && (
                      <span className="font-mono text-[#242424] ml-1">
                        • {p.reference_number.slice(0, 14)}
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold font-mono text-[#1E6B37] tabular-nums">
                    {formatINR(p.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
