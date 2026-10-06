import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Building2,
  AlertCircle,
  Eye,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import { useExpenses, useProjectRecordedCosts } from '@/hooks/useFinance';
import { EXPENSE_CATEGORIES } from '@/types/finance';

export function ExpensesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: expenses = [], isLoading, isError, refetch } = useExpenses({
    search: searchTerm,
    projectId: selectedProject,
    category: selectedCategory,
    status: selectedStatus,
  });

  const { data: projects = [] } = useProjectRecordedCosts();

  // Aggregate metrics
  const totalExpenses = useMemo(
    () => expenses.filter((e) => e.status === 'Confirmed').reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const siteExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.status === 'Confirmed' && e.project_id !== null)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const overheadExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.status === 'Confirmed' && e.project_id === null)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Direct Expenses"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7EFEF] text-[#4A0E0E] border border-[#4A0E0E]/20">
            <Receipt className="w-3.5 h-3.5 text-[#C99A2E]" />
            Site Outflows
          </span>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/expenses/new')}
            className="gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#C99A2E]" />
            <span>Add Expense</span>
          </Button>
        }
      />

      {/* Financial Metrics Cards (Strict Non-Profit Invariants) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Total Recorded Expenses
            </span>
            <Receipt className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-2 tabular-nums">
            {formatINR(totalExpenses)}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Confirmed operational expenditures
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Direct Site Expenses
            </span>
            <Building2 className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-2 tabular-nums">
            {formatINR(siteExpenses)}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Component of Recorded Project Cost
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              General Overhead
            </span>
            <Briefcase className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-2 tabular-nums">
            {formatINR(overheadExpenses)}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Branch office utilities, telecom, & administration
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center justify-start">
          <Search
            size="sm"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by expense #, description, paid by..."
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs text-[#242424] shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="overhead">General Overhead (No Site)</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs text-[#242424] shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
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

      {/* Main Content: Desktop Table & Mobile Cards */}
      {isLoading ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 text-center space-y-3">
          <div className="animate-spin w-6 h-6 border-2 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-[#6B6B6B]">Loading expenses...</p>
        </div>
      ) : isError ? (
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Could not load expenses</h3>
          <p className="text-xs text-[#6B6B6B]">
            There was a problem loading expense records. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-10 text-center space-y-3">
          <Receipt className="w-8 h-8 text-[#8C8880] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">No expenses recorded yet</h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            Log site petty cash, equipment hire, machinery fuel, tools, and office utilities.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/expenses/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4 text-[#C99A2E]" />
            <span>Add Expense</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[#6B6B6B] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Expense #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Site Allocation</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Paid By / Ref</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                  {expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-[#F7F5F0]/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/expenses/${e.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#4A0E0E]">
                        {e.expense_number}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#6B6B6B]">
                        {e.expense_date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5] font-medium text-[11px] text-[#242424]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={e.description}>
                        {e.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {e.project ? (
                          <div>
                            <div className="font-semibold text-[#242424] truncate max-w-[150px]">
                              {e.project.name}
                            </div>
                            <div className="text-[10px] text-[#6B6B6B] font-mono">
                              {e.project.project_code}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#6B6B6B] text-[10px] font-semibold">
                            General Overhead
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#242424] tabular-nums">
                        {formatINR(e.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[120px] font-medium">{e.paid_by || '—'}</div>
                        <div className="text-[10px] text-[#6B6B6B]">
                          {e.payment_method || ''} {e.reference_number ? `• ${e.reference_number}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            e.status === 'Confirmed'
                              ? 'bg-[#EAF5EE] text-[#1E6B37]'
                              : e.status === 'Draft'
                              ? 'bg-[#FEF5E7] text-[#B86E00]'
                              : 'bg-[#FDF7F7] text-[#9E2A2B]'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/expenses/${e.id}`}
                          onClick={(evt) => evt.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F7F5F0] hover:bg-[#EFECE6] text-[#242424] font-medium text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#6B6B6B]" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards (Strict 360px & 390px Zero Overflow) */}
          <div className="md:hidden space-y-3 pb-8">
            {expenses.map((e) => (
              <div
                key={e.id}
                onClick={() => navigate(`/expenses/${e.id}`)}
                className="bg-white border border-[#E2DDD5] rounded-xl p-3.5 shadow-xs space-y-2.5 active:bg-[#F7F5F0]/70 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                      {e.expense_number}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">{e.expense_date}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      e.status === 'Confirmed'
                        ? 'bg-[#EAF5EE] text-[#1E6B37]'
                        : e.status === 'Draft'
                        ? 'bg-[#FEF5E7] text-[#B86E00]'
                        : 'bg-[#FDF7F7] text-[#9E2A2B]'
                    }`}
                  >
                    {e.status}
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#C99A2E] uppercase tracking-wider">
                    {e.category}
                  </div>
                  <h4 className="font-semibold text-xs text-[#242424] mt-0.5 line-clamp-2">
                    {e.description}
                  </h4>
                  <div className="text-[11px] text-[#6B6B6B] mt-1 truncate">
                    {e.project ? `Site: ${e.project.name}` : 'General Business Overhead'}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between">
                  <div className="text-[11px] text-[#6B6B6B] truncate max-w-[170px]">
                    {e.paid_by ? `Paid by ${e.paid_by}` : (e.payment_method || 'Expense')}
                  </div>
                  <div className="text-base font-bold font-mono text-[#242424] tabular-nums">
                    {formatINR(e.amount)}
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
