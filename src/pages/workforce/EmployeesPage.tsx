import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users2,
  UserPlus,
  CalendarCheck2,
  Search,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

export function EmployeesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: employees = [], isLoading, isError, error, refetch } = useEmployees({
    search: searchTerm,
    status: statusFilter,
    role: roleFilter,
  });

  // Extract distinct trade roles for filter
  const distinctRoles = useMemo(() => {
    const roles = new Set<string>();
    employees.forEach((e) => {
      if (e.worker_type) roles.add(e.worker_type);
    });
    return Array.from(roles);
  }, [employees]);

  // Derived metrics
  const activeCount = useMemo(() => employees.filter((e) => e.status === 'active').length, [employees]);
  const totalWageLiability = useMemo(
    () => employees.reduce((sum, e) => sum + (e.wage_payable || 0), 0),
    [employees]
  );
  const totalAdvanceOutstanding = useMemo(
    () => employees.reduce((sum, e) => sum + (e.advance_outstanding || 0), 0),
    [employees]
  );

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Employees & Field Workforce"
        subtitle="Operational labor roster, site trade allocation, master daily wage rates, and contact register"
        badge={
          <Badge variant="primary" className="gap-1">
            <Users2 className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Field Workforce</span>
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
            <Link to="/employees/new">
              <Button variant="primary" size="sm" className="gap-1.5 h-9 font-semibold">
                <UserPlus className="w-4 h-4 text-[#C99A2E]" />
                <span>Add Employee</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stat Cards (Field Operational Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Active Labor Strength</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF5EE] flex items-center justify-center text-[#1E6B37]">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {activeCount}
            </span>
            <span className="text-xs text-[#6B6B6B]">of {employees.length} registered</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Ready for morning site muster</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Total Wage Payable</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF5E7] flex items-center justify-center text-[#B86E00]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {formatINR(totalWageLiability)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Verified unliquidated labor wages</p>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
            <span>Advance Outstanding</span>
            <div className="w-7 h-7 rounded-lg bg-[#F7EFEF] flex items-center justify-center text-[#4A0E0E]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {formatINR(totalAdvanceOutstanding)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B6B6B]">Separate recoverable loans (Rule 18)</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by worker name, employee ID (EMP-...), trade, or phone..."
            className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#4A0E0E] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              aria-label="Filter employees by status"
              className="bg-transparent border-none text-xs font-semibold text-[#242424] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {distinctRoles.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs">
              <Briefcase className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter employees by trade or role"
                className="bg-transparent border-none text-xs font-semibold text-[#242424] focus:outline-none"
              >
                <option value="all">All Trades</option>
                {distinctRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Employee Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white border border-[#E2DDD5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-white border border-[#9E2A2B]/30 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#242424]">Failed to load employees</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">{String(error)}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<Users2 className="w-8 h-8 text-[#C99A2E]" />}
          title="No employees added yet"
          description="Register your site maistries, barbenders, masons, carpenters, and helpers to begin marking daily attendance."
          actionLabel="Add First Employee"
          onAction={() => navigate('/employees/new')}
        />
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) - 360px & 390px Optimized */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs active:bg-[#F7F5F0] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                        {emp.employee_code}
                      </span>
                      {emp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B6B6B] bg-[#EFECE6] px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-[#242424] mt-1 truncate font-heading">
                      {emp.name}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] font-medium truncate">
                      {emp.worker_type || 'General Field Labor'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-[#6B6B6B]">Daily Wage</div>
                    <div className="text-sm font-bold text-[#242424] tabular-nums">
                      {emp.daily_wage ? formatINR(emp.daily_wage) : '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#6B6B6B] truncate">
                    {emp.phone ? (
                      <>
                        <Phone className="w-3.5 h-3.5 shrink-0 text-[#C99A2E]" />
                        <span className="tabular-nums font-mono">{emp.phone}</span>
                      </>
                    ) : (
                      <span className="italic">No phone</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {emp.wage_payable && emp.wage_payable > 0 ? (
                      <span className="text-[11px] font-semibold text-[#B86E00] bg-[#FEF5E7] px-2 py-0.5 rounded">
                        Payable: {formatINR(emp.wage_payable)}
                      </span>
                    ) : null}
                    <ArrowRight className="w-4 h-4 text-[#6B6B6B]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Trade / Role</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Assigned Site</th>
                  <th className="py-3 px-4 text-right">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Wage Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="hover:bg-[#F7F5F0]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                      {emp.employee_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#242424]">{emp.name}</div>
                      {emp.emergency_contact && (
                        <div className="text-[11px] text-[#6B6B6B]">
                          Emergency: {emp.emergency_contact}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#242424] font-medium">
                      {emp.worker_type || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B] font-mono tabular-nums">
                      {emp.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6B6B6B]">
                      {emp.assigned_project_name || 'General Roster'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#242424] tabular-nums">
                      {emp.daily_wage ? formatINR(emp.daily_wage) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#B86E00] tabular-nums">
                      {emp.wage_payable ? formatINR(emp.wage_payable) : '₹0'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {emp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B6B6B] bg-[#EFECE6] px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/employees/${emp.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] inline-flex items-center gap-1"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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
