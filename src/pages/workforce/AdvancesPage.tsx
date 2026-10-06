import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HandCoins,
  Plus,
  Search,
  Filter,
  Users2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployeeAdvances, useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

export function AdvancesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: advances = [], isLoading, isError, error, refetch } = useEmployeeAdvances({
    employeeId: employeeFilter !== 'all' ? employeeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: employees = [] } = useEmployees();

  // Search filter
  const filteredAdvances = useMemo(() => {
    let list = advances;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.advance_number.toLowerCase().includes(term) ||
          a.employee?.name.toLowerCase().includes(term) ||
          a.employee?.employee_code.toLowerCase().includes(term) ||
          (a.purpose && a.purpose.toLowerCase().includes(term))
      );
    }
    return list;
  }, [advances, searchTerm]);

  // Financial aggregates (Rule 18: Advance Received - Advance Recovered = Advance Outstanding)
  const totalGiven = useMemo(
    () => filteredAdvances.reduce((sum, a) => sum + (a.amount || 0), 0),
    [filteredAdvances]
  );
  const totalRecovered = useMemo(
    () => filteredAdvances.reduce((sum, a) => sum + (a.recovered_amount || 0), 0),
    [filteredAdvances]
  );
  const totalOutstanding = useMemo(
    () => Math.max(0, totalGiven - totalRecovered),
    [totalGiven, totalRecovered]
  );

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Employee Advances Register"
        badge={
          <Badge variant="primary" className="gap-1">
            <HandCoins className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Worker Loans</span>
          </Badge>
        }
        actions={
          <Link to="/advances/new">
            <Button variant="primary" size="sm" className="gap-1.5 h-9 font-semibold">
              <Plus className="w-4 h-4 text-[#C99A2E]" />
              <span>Record Advance</span>
            </Button>
          </Link>
        }
      />

      {/* Advance Metrics Overview Cards (Rule 18 Independent Ledger) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Advances Given</span>
            <div className="w-7 h-7 rounded-lg bg-[#F7F5F0] flex items-center justify-center text-[#242424]">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {formatINR(totalGiven)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Total cash / UPI advances disbursed</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Advances Recovered</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF5EE] flex items-center justify-center text-[#1E6B37]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#1E6B37] font-heading tabular-nums">
              {formatINR(totalRecovered)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Repaid via payment deductions</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Advance Outstanding</span>
            <div className="w-7 h-7 rounded-lg bg-[#F7EFEF] flex items-center justify-center text-[#4A0E0E]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#4A0E0E] font-heading tabular-nums">
              {formatINR(totalOutstanding)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Remaining loan principal balance</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by advance #, employee name, or purpose..."
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
          <h3 className="text-sm font-bold text-[#242424]">Failed to load advances</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">{String(error)}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : filteredAdvances.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="w-8 h-8 text-[#C99A2E]" />}
          title="No employee advances recorded"
          actionLabel="Record Advance"
          onAction={() => navigate('/advances/new')}
        />
      ) : (
        <>
          {/* Mobile Advance Cards (< 768px) - 360px & 390px Optimized */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredAdvances.map((a) => {
              const outstanding = Math.max(0, a.amount - (a.recovered_amount || 0));
              return (
                <div
                  key={a.id}
                  className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                        {a.advance_number}
                      </span>
                      <h3 className="font-bold text-base text-[#242424] mt-1 font-heading">
                        {a.employee?.name || 'Field Employee'}
                      </h3>
                      <p className="text-xs text-[#6B6B6B]">
                        {a.purpose || 'General Household / Medical Advance'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-[#6B6B6B] block">Advance</span>
                      <span className="text-base font-bold text-[#242424] tabular-nums">
                        {formatINR(a.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#6B6B6B]">
                      <span className="font-mono text-xs">{a.advance_date}</span>
                      <span>•</span>
                      <span>{a.payment_method || 'Cash'}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-[#4A0E0E] bg-[#F7EFEF] px-2 py-0.5 rounded">
                        Outstanding: {formatINR(outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Advance #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 text-right">Advance Received</th>
                  <th className="py-3 px-4 text-right">Recovered</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Purpose / Reference</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {filteredAdvances.map((a) => {
                  const outstanding = Math.max(0, a.amount - (a.recovered_amount || 0));
                  return (
                    <tr key={a.id} className="hover:bg-[#F7F5F0]/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                        {a.advance_number}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#242424]">
                        {a.advance_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#242424]">{a.employee?.name}</div>
                        <div className="text-[11px] text-[#6B6B6B]">
                          {a.employee?.worker_type}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#242424] tabular-nums">
                        {formatINR(a.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#1E6B37] tabular-nums">
                        {formatINR(a.recovered_amount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#4A0E0E] tabular-nums">
                        {formatINR(outstanding)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#242424]">
                        {a.payment_method || 'Cash'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#6B6B6B]">
                        <span className="text-[#242424] font-medium">{a.purpose || '—'}</span>
                        {a.reference_number && (
                          <div className="font-mono text-[11px] text-[#6B6B6B]">
                            Ref: {a.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2.5 py-0.5 rounded-full">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageContainer>
  );
}
