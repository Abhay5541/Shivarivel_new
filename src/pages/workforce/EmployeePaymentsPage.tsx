import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Users2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployeePayments, useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

export function EmployeePaymentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: payments = [], isLoading, isError, error, refetch } = useEmployeePayments({
    employeeId: employeeFilter !== 'all' ? employeeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: employees = [] } = useEmployees();

  // Search filter
  const filteredPayments = useMemo(() => {
    let list = payments;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.payment_number.toLowerCase().includes(term) ||
          p.employee?.name.toLowerCase().includes(term) ||
          p.employee?.employee_code.toLowerCase().includes(term) ||
          (p.reference_number && p.reference_number.toLowerCase().includes(term))
      );
    }
    return list;
  }, [payments, searchTerm]);

  // Aggregate metrics
  const totalDisbursed = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [filteredPayments]
  );
  const totalWageSettled = useMemo(
    () =>
      filteredPayments.reduce(
        (sum, p) =>
          sum + (p.wage_allocations?.reduce((wSum, w) => wSum + w.amount, 0) || p.amount),
        0
      ),
    [filteredPayments]
  );
  const totalAdvanceRecovered = useMemo(
    () =>
      filteredPayments.reduce(
        (sum, p) =>
          sum + (p.advance_allocations?.reduce((aSum, a) => aSum + a.amount, 0) || 0),
        0
      ),
    [filteredPayments]
  );

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Employee Payments &amp; Wage Settlements"
        badge={
          <Badge variant="primary" className="gap-1">
            <Wallet className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Labor Disbursements</span>
          </Badge>
        }
        actions={
          <Link to="/employee-payments/new">
            <Button variant="primary" size="sm" className="gap-1.5 h-9 font-semibold">
              <Plus className="w-4 h-4 text-[#C99A2E]" />
              <span>Record Payment</span>
            </Button>
          </Link>
        }
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Total Payments Made</span>
            <div className="w-7 h-7 rounded-lg bg-[#F7F5F0] flex items-center justify-center text-[#242424]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {formatINR(totalDisbursed)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Total verified labor disbursements</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Wage Settlements</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF5EE] flex items-center justify-center text-[#1E6B37]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#1E6B37] font-heading tabular-nums">
              {formatINR(totalWageSettled)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Disbursed against shift attendance</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Advance Recoveries</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF5E7] flex items-center justify-center text-[#B86E00]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#B86E00] font-heading tabular-nums">
              {formatINR(totalAdvanceRecovered)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Loan repayments collected</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by payment #, employee name, or reference..."
            className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#4A0E0E]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs">
            <Users2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-[#242424] focus:outline-none"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-[#242424] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white border border-[#E2DDD5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-white border border-[#9E2A2B]/30 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#242424]">Failed to load employee payments</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">{String(error)}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-[#C99A2E]" />}
          title="No employee payments recorded"
          actionLabel="Record Payment"
          onAction={() => navigate('/employee-payments/new')}
        />
      ) : (
        <>
          {/* Mobile Payment Cards (< 768px) - 360px & 390px Optimized */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                      {p.payment_number}
                    </span>
                    <h3 className="font-bold text-base text-[#242424] mt-1 font-heading">
                      {p.employee?.name || 'Field Worker'}
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">
                      {p.employee?.worker_type || 'Site Labor'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-[#6B6B6B] block">Disbursed</span>
                    <span className="text-base font-bold text-[#242424] tabular-nums">
                      {formatINR(p.amount)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs text-[#6B6B6B]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{p.payment_date}</span>
                    <span>•</span>
                    <span>{p.payment_method || 'Cash'}</span>
                  </div>

                  <span className="text-[11px] font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 text-right">Disbursed Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F5F0]/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                      {p.payment_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#242424]">
                      {p.payment_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#242424]">{p.employee?.name}</div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        {p.employee?.worker_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#242424] tabular-nums">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#242424]">
                      {p.payment_method || 'Cash'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#6B6B6B]">
                      {p.reference_number || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6B6B6B]">
                      {p.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2.5 py-0.5 rounded-full">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageContainer>
  );
}
