import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  IndianRupee,
  Search,
  Filter,
  Building2,
  Users2,
  CalendarCheck2,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWages, useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

export function WagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: wages = [], isLoading, isError, error, refetch } = useWages({
    employeeId: employeeFilter !== 'all' ? employeeFilter : undefined,
    projectId: projectFilter !== 'all' ? projectFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: employees = [] } = useEmployees();

  // Search filter
  const filteredWages = useMemo(() => {
    let list = wages;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.wage_number.toLowerCase().includes(term) ||
          w.employee?.name.toLowerCase().includes(term) ||
          w.employee?.employee_code.toLowerCase().includes(term) ||
          w.project?.name.toLowerCase().includes(term)
      );
    }
    return list;
  }, [wages, searchTerm]);

  // Aggregate metrics (Strict non-netting)
  const totalEarned = useMemo(
    () => filteredWages.reduce((sum, w) => sum + (w.amount || 0), 0),
    [filteredWages]
  );
  const totalPaid = useMemo(
    () => filteredWages.reduce((sum, w) => sum + (w.amount_paid || 0), 0),
    [filteredWages]
  );
  const totalPayable = useMemo(
    () => Math.max(0, totalEarned - totalPaid),
    [totalEarned, totalPaid]
  );

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Workforce Daily Wages"
        subtitle="Operational wage tracking based on verified daily site attendance muster rolls"
        badge={
          <Badge variant="primary" className="gap-1">
            <Coins className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Labor Liabilities</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/attendance">
              <Button variant="outline" size="sm" className="gap-1.5 h-9 font-semibold">
                <CalendarCheck2 className="w-4 h-4 text-[#1E6B37]" />
                <span>Mark Attendance</span>
              </Button>
            </Link>
            <Link to="/employee-payments/new">
              <Button variant="primary" size="sm" className="gap-1.5 h-9 font-semibold">
                <Wallet className="w-4 h-4 text-[#C99A2E]" />
                <span>Record Payment</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Wage Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Total Wages Earned</span>
            <div className="w-7 h-7 rounded-lg bg-[#F7F5F0] flex items-center justify-center text-[#242424]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {formatINR(totalEarned)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Earned via verified shift attendance</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Total Wages Paid</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF5EE] flex items-center justify-center text-[#1E6B37]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#1E6B37] font-heading tabular-nums">
              {formatINR(totalPaid)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Disbursed settlement payments</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Total Wage Payable</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF5E7] flex items-center justify-center text-[#B86E00]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#B86E00] font-heading tabular-nums">
              {formatINR(totalPayable)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Unsettled labor liability (not netted with advances)</p>
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
            placeholder="Search by wage #, worker name, or project..."
            className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#4A0E0E]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Employee Filter */}
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

          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-[#242424] focus:outline-none"
            >
              <option value="all">All Projects</option>
              <option value="proj-01">Annamalai Residential Villa</option>
              <option value="proj-02">Meenakshi Commercial Complex</option>
            </select>
          </div>

          {/* Status Filter */}
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
          <h3 className="text-sm font-bold text-[#242424]">Failed to load wage records</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">{String(error)}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : filteredWages.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-8 h-8 text-[#C99A2E]" />}
          title="No wage records found"
          description="Daily wage records are generated automatically when attendance is recorded and confirmed."
          actionLabel="Go to Attendance"
          onAction={() => (window.location.href = '/attendance')}
        />
      ) : (
        <>
          {/* Mobile Wage Cards (< 768px) - 390px Optimized */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredWages.map((w) => (
              <div
                key={w.id}
                className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                      {w.wage_number}
                    </span>
                    <h3 className="font-bold text-base text-[#242424] mt-1 font-heading">
                      {w.employee?.name || 'Field Worker'}
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">
                      {w.project?.name || 'General Site Labor'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-[#6B6B6B] block">Earned</span>
                    <span className="text-base font-bold text-[#242424] tabular-nums">
                      {formatINR(w.amount)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs text-[#6B6B6B]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{w.wage_date}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#242424]">
                      {w.payable_units === 1 ? '1.0 Full' : w.payable_units === 0.5 ? '0.5 Half' : '0.0 Absent'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                    {w.status}
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
                  <th className="py-3 px-4">Wage #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4 text-center">Shift Units</th>
                  <th className="py-3 px-4 text-right">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Wages Earned</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {filteredWages.map((w) => (
                  <tr key={w.id} className="hover:bg-[#F7F5F0]/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                      {w.wage_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#242424]">
                      {w.wage_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#242424]">{w.employee?.name}</div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        {w.employee?.worker_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6B6B6B]">
                      {w.project?.name || 'General Civil Work'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {w.payable_units === 1 ? '1.0 (Full Day)' : w.payable_units === 0.5 ? '0.5 (Half Day)' : '0.0 (Absent)'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#242424]">
                      {formatINR(w.rate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#242424] tabular-nums">
                      {formatINR(w.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2.5 py-0.5 rounded-full">
                        {w.status}
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
