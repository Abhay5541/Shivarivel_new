import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Phone,
  CalendarCheck2,
  HandCoins,
  Wallet,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useEmployee,
  useWages,
  useEmployeeAdvances,
  useEmployeePayments,
} from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

type DetailTab = 'overview' | 'attendance' | 'wages' | 'advances' | 'payments';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: employee, isLoading, isError } = useEmployee(id);
  const { data: wages = [] } = useWages({ employeeId: id });
  const { data: advances = [] } = useEmployeeAdvances({ employeeId: id });
  const { data: payments = [] } = useEmployeePayments({ employeeId: id });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-[#EFECE6] rounded-md" />
          <div className="h-40 bg-white border border-[#E2DDD5] rounded-xl" />
          <div className="h-64 bg-white border border-[#E2DDD5] rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !employee) {
    return (
      <PageContainer>
        <div className="p-8 bg-white border border-[#E2DDD5] rounded-xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#9E2A2B] mx-auto" />
          <h2 className="text-base font-bold text-[#242424]">Employee Not Found</h2>
          <p className="text-xs text-[#6B6B6B]">
            The employee record you requested does not exist or was removed.
          </p>
          <Link to="/employees">
            <Button variant="outline" size="sm" className="mt-2">
              Back to Employee Roster
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={employee.name}
        subtitle={`${employee.worker_type || 'Field Labor'} • Code: ${employee.employee_code}`}
        badge={
          employee.status === 'active' ? (
            <Badge variant="primary" className="gap-1 bg-[#EAF5EE] text-[#1E6B37] border-[#1E6B37]/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Crew</span>
            </Badge>
          ) : (
            <Badge variant="neutral" className="gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Inactive</span>
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/employees">
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Roster</span>
              </Button>
            </Link>
            <Link to={`/employees/${employee.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            </Link>
            <Link to="/attendance">
              <Button variant="outline" size="sm" className="gap-1.5 h-9 font-semibold">
                <CalendarCheck2 className="w-4 h-4 text-[#1E6B37]" />
                <span>Mark Attendance</span>
              </Button>
            </Link>
            <Link to="/advances">
              <Button variant="outline" size="sm" className="gap-1.5 h-9 font-semibold">
                <HandCoins className="w-4 h-4 text-[#C99A2E]" />
                <span>Record Advance</span>
              </Button>
            </Link>
            <Link to="/employee-payments/new">
              <Button variant="primary" size="sm" className="gap-1.5 h-9 font-semibold">
                <Wallet className="w-4 h-4 text-[#C99A2E]" />
                <span>Pay Employee</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Identity Summary Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E2DDD5]">
          {/* Identity */}
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-[#6B6B6B] tracking-wider">
              Identity &amp; Trade
            </span>
            <div className="text-lg font-bold text-[#242424] font-heading">{employee.name}</div>
            <div className="text-xs text-[#4A0E0E] font-semibold">{employee.worker_type}</div>
            <div className="text-xs font-mono font-bold text-[#6B6B6B] mt-1">
              ID: {employee.employee_code}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
            <span className="text-xs uppercase font-bold text-[#6B6B6B] tracking-wider">
              Contact &amp; Emergency
            </span>
            <div className="flex items-center gap-2 text-sm text-[#242424] font-mono">
              <Phone className="w-4 h-4 text-[#C99A2E]" />
              <span>{employee.phone || 'No phone recorded'}</span>
            </div>
            {employee.emergency_contact && (
              <div className="text-xs text-[#6B6B6B]">
                Emergency: <strong className="text-[#242424]">{employee.emergency_contact}</strong>
              </div>
            )}
            {employee.address && (
              <div className="text-xs text-[#6B6B6B] truncate">
                <MapPin className="w-3 h-3 inline mr-1 text-[#6B6B6B]" />
                {employee.address}
              </div>
            )}
          </div>

          {/* Operational Site & Wage */}
          <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
            <span className="text-xs uppercase font-bold text-[#6B6B6B] tracking-wider">
              Site &amp; Master Rate
            </span>
            <div className="text-sm font-bold text-[#242424]">
              {employee.assigned_project_name || 'General Company Roster'}
            </div>
            <div className="text-xs text-[#6B6B6B]">
              Master Wage Rate:{' '}
              <strong className="text-sm font-bold text-[#242424] font-mono">
                {employee.daily_wage ? `${formatINR(employee.daily_wage)} / day` : '—'}
              </strong>
            </div>
            {employee.joining_date && (
              <div className="text-xs text-[#6B6B6B]">
                Joined:{' '}
                {new Intl.DateTimeFormat('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(employee.joining_date))}
              </div>
            )}
          </div>

          {/* Field Operational Status */}
          <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
            <span className="text-xs uppercase font-bold text-[#6B6B6B] tracking-wider">
              Muster Days
            </span>
            <div className="text-2xl font-bold text-[#242424] font-heading tabular-nums">
              {employee.total_present_days || 0}{' '}
              <span className="text-xs font-normal text-[#6B6B6B]">recorded shifts</span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Total verified site shifts in current project tenure
            </p>
          </div>
        </div>
      </div>

      {/* Financial Split: STRICT NON-NETTING (Wage Payable vs Advance Outstanding) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box A: WAGES EARNED, PAID, PAYABLE */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD5]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF5E7] flex items-center justify-center text-[#B86E00]">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  Operational Wages
                </h3>
                <p className="text-[11px] text-[#6B6B6B]">Shift muster work valuation</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#B86E00] bg-[#FEF5E7] px-2 py-0.5 rounded">
              Wage Ledger
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 bg-[#F7F5F0] rounded-lg">
              <div className="text-[11px] text-[#6B6B6B] font-medium">Wages Earned</div>
              <div className="text-base font-bold text-[#242424] tabular-nums mt-0.5">
                {formatINR(employee.total_wages_earned || 0)}
              </div>
            </div>
            <div className="p-2.5 bg-[#F7F5F0] rounded-lg">
              <div className="text-[11px] text-[#6B6B6B] font-medium">Wages Paid</div>
              <div className="text-base font-bold text-[#1E6B37] tabular-nums mt-0.5">
                {formatINR(employee.total_wages_paid || 0)}
              </div>
            </div>
            <div className="p-2.5 bg-[#FEF5E7] border border-[#B86E00]/20 rounded-lg">
              <div className="text-[11px] text-[#B86E00] font-bold">Wage Payable</div>
              <div className="text-base font-bold text-[#B86E00] tabular-nums mt-0.5">
                {formatINR(employee.wage_payable || 0)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#6B6B6B] italic">
            * Derived directly from verified attendance shift units and Confirmed wage disbursements.
          </p>
        </div>

        {/* Box B: ADVANCES RECEIVED, RECOVERED, OUTSTANDING */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD5]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F7EFEF] flex items-center justify-center text-[#4A0E0E]">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  Employee Advances (Loans)
                </h3>
                <p className="text-[11px] text-[#6B6B6B]">Strictly separated financial tracking</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#4A0E0E] bg-[#F7EFEF] px-2 py-0.5 rounded">
              Rule 18 Independent
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 bg-[#F7F5F0] rounded-lg">
              <div className="text-[11px] text-[#6B6B6B] font-medium">Received</div>
              <div className="text-base font-bold text-[#242424] tabular-nums mt-0.5">
                {formatINR(employee.total_advances_given || 0)}
              </div>
            </div>
            <div className="p-2.5 bg-[#F7F5F0] rounded-lg">
              <div className="text-[11px] text-[#6B6B6B] font-medium">Recovered</div>
              <div className="text-base font-bold text-[#1E6B37] tabular-nums mt-0.5">
                {formatINR(employee.total_advances_recovered || 0)}
              </div>
            </div>
            <div className="p-2.5 bg-[#F7EFEF] border border-[#4A0E0E]/20 rounded-lg">
              <div className="text-[11px] text-[#4A0E0E] font-bold">Outstanding</div>
              <div className="text-base font-bold text-[#4A0E0E] tabular-nums mt-0.5">
                {formatINR(employee.advance_outstanding || 0)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#6B6B6B] italic">
            * Advance Outstanding is never netted against Wage Payable.
          </p>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="flex border-b border-[#E2DDD5] gap-4 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === 'overview'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          Overview &amp; Notes
        </button>
        <button
          onClick={() => setActiveTab('wages')}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === 'wages'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          Wage Records ({wages.length})
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === 'advances'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          Advances ({advances.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === 'payments'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] font-heading">
              Operational Notes &amp; Skill Observations
            </h3>
            <p className="text-sm text-[#242424] leading-relaxed">
              {employee.notes || 'No operational notes recorded for this employee.'}
            </p>
          </div>

          <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] font-heading">
              Quick Operations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/attendance">
                <Button variant="outline" className="w-full justify-start gap-2 h-11">
                  <CalendarCheck2 className="w-4 h-4 text-[#1E6B37]" />
                  <span>Mark Today's Attendance</span>
                </Button>
              </Link>
              <Link to="/advances">
                <Button variant="outline" className="w-full justify-start gap-2 h-11">
                  <HandCoins className="w-4 h-4 text-[#C99A2E]" />
                  <span>Record Advance Loan</span>
                </Button>
              </Link>
              <Link to="/employee-payments/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-11">
                  <Wallet className="w-4 h-4 text-[#4A0E0E]" />
                  <span>Disburse Wage Payout</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Wages */}
      {activeTab === 'wages' && (
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
          {wages.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6B6B]">
              No wage transactions recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Wage #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Site / Project</th>
                  <th className="py-3 px-4 text-center">Shift Units</th>
                  <th className="py-3 px-4 text-right">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Earned Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {wages.map((w) => (
                  <tr key={w.id} className="hover:bg-[#F7F5F0]/60">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                      {w.wage_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{w.wage_date}</td>
                    <td className="py-3 px-4 text-xs text-[#6B6B6B]">
                      {w.project?.name || 'General Civil Work'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {w.payable_units === 1 ? '1.0 (Full)' : w.payable_units === 0.5 ? '0.5 (Half)' : '0.0'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINR(w.rate)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#242424] tabular-nums">
                      {formatINR(w.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Advances */}
      {activeTab === 'advances' && (
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
          {advances.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6B6B]">
              No employee advances recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Advance #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Advance Amount</th>
                  <th className="py-3 px-4 text-right">Recovered</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Method / Ref</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {advances.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F7F5F0]/60">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                      {a.advance_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{a.advance_date}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#242424] tabular-nums">
                      {formatINR(a.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#1E6B37] tabular-nums">
                      {formatINR(a.recovered_amount || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#4A0E0E] tabular-nums">
                      {formatINR(a.outstanding_amount || a.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6B6B6B]">
                      {a.payment_method || 'Cash'} {a.reference_number ? `(${a.reference_number})` : ''}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#242424]">{a.purpose || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6B6B]">
              No payments disbursed to this employee yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Disbursed Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F5F0]/60">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#4A0E0E]">
                      {p.payment_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{p.payment_date}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#242424] tabular-nums">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#242424]">
                      {p.payment_method || 'Cash'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-[#6B6B6B]">
                      {p.reference_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6B6B6B]">{p.notes || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-semibold text-[#1E6B37] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </PageContainer>
  );
}
