import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  Receipt,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { usePurchases, useSuppliers } from '@/hooks/useProcurement';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export const PurchasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partial' | 'Paid'>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const { data: purchases = [], isLoading, isError, error, refetch } = usePurchases({
    supplier_id: selectedSupplierId,
    project_id: selectedProjectId,
    payment_status: statusFilter,
    search,
  });

  const { data: suppliers = [] } = useSuppliers();
  const { data: projects = [] } = useProjects();

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalCount = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPaid = purchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
    const totalOutstanding = Math.max(0, totalAmount - totalPaid);
    const pendingCount = purchases.filter((p) => p.payment_status !== 'Paid').length;

    return {
      totalCount,
      totalAmount,
      totalPaid,
      totalOutstanding,
      pendingCount,
    };
  }, [purchases]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-[#4A0E0E]" />
            Material Purchases & Invoices
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Supplier deliveries, project procurement invoices, payment status & outstanding balances
          </p>
        </div>

        <button
          onClick={() => navigate('/purchases/new')}
          className="inline-flex items-center justify-center gap-2 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add Purchase
        </button>
      </div>

      {/* 4 Operations KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Invoiced
            </span>
            <Receipt className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#242424] mt-2 tabular-nums">
            {formatINR(stats.totalAmount)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            {stats.totalCount} purchases logged
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Paid
            </span>
            <CreditCard className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#1E6B37] mt-2 tabular-nums">
            {formatINR(stats.totalPaid)}
          </p>
          <span className="text-[10px] text-[#1E6B37]/80 mt-0.5 block">
            Allocated bank & cash
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Outstanding Due
            </span>
            <AlertCircle className="w-4 h-4 text-[#A84B14]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#A84B14] mt-2 tabular-nums">
            {formatINR(stats.totalOutstanding)}
          </p>
          <span className="text-[10px] text-[#A84B14]/80 mt-0.5 block">
            Unpaid vendor balance
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Pending Bills
            </span>
            <Calendar className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#242424] mt-2">
            {stats.pendingCount}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            Unpaid / partial invoices
          </span>
        </div>
      </div>

      {/* Search & Comprehensive Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, supplier name, or project..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs placeholder:text-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
            />
          </div>

          {/* Payment Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {(['all', 'Unpaid', 'Partial', 'Paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
                  statusFilter === st
                    ? 'bg-[#4A0E0E] text-white'
                    : 'bg-white border border-[#E2DDD5] text-[#6B6B6B] hover:text-[#242424]'
                }`}
              >
                {st === 'all' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Dropdowns: Supplier & Project Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="bg-white border border-[#E2DDD5] rounded-lg text-xs px-3 py-2 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[40px] flex-1 sm:max-w-xs"
          >
            <option value="all">All Suppliers ({suppliers.length})</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white border border-[#E2DDD5] rounded-lg text-xs px-3 py-2 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[40px] flex-1 sm:max-w-xs"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load purchases"
          description={error instanceof Error ? error.message : 'Network error'}
          onRetry={() => refetch()}
        />
      ) : purchases.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-6 h-6" />}
          title="No purchases recorded yet"
          description={
            search || statusFilter !== 'all' || selectedSupplierId !== 'all' || selectedProjectId !== 'all'
              ? 'No purchases match your filter parameters. Clear filters to view all entries.'
              : 'Record your first supplier delivery or construction materials purchase invoice.'
          }
          actionLabel="Add Purchase"
          onAction={() => navigate('/purchases/new')}
        />
      ) : (
        <>
          {/* Desktop Operations Table */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                <tr>
                  <th className="py-3 px-4">Purchase / Invoice</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Project Assigned</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60">
                {purchases.map((p) => {
                  const bal = p.outstanding_balance ?? p.total_amount;
                  const paid = p.total_allocated ?? 0;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/purchases/${p.id}`)}
                      className="hover:bg-[#F7F5F0]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#4A0E0E] block">
                          {p.purchase_number}
                        </span>
                        {p.invoice_number && (
                          <span className="text-[11px] text-[#6B6B6B] block">
                            Inv: {p.invoice_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#242424]">
                          {p.supplier?.name || 'Supplier'}
                        </div>
                        {p.supplier?.category && (
                          <span className="text-[10px] text-[#6B6B6B]">
                            {p.supplier.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#242424]">
                        {p.project ? (
                          <div>
                            <span className="font-medium hover:text-[#4A0E0E]">
                              {p.project.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#6B6B6B] block">
                              {p.project.project_code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6B6B6B] italic">General Overhead</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-[#242424] block">
                          {p.purchase_date}
                        </span>
                        {p.due_date && (
                          <span className="text-[10px] font-mono text-[#6B6B6B]">
                            Due: {p.due_date}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#242424]">
                        {formatINR(p.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#1E6B37]">
                        {formatINR(paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#A84B14]">
                        {formatINR(bal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.payment_status === 'Paid'
                              ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                              : p.payment_status === 'Partial'
                              ? 'bg-[#C99A2E]/10 text-[#C99A2E]'
                              : 'bg-[#A84B14]/10 text-[#A84B14]'
                          }`}
                        >
                          {p.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#6B6B6B] ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Purchases Cards (360px & 390px Optimized) */}
          <div className="md:hidden space-y-3">
            {purchases.map((p) => {
              const bal = p.outstanding_balance ?? p.total_amount;
              const paid = p.total_allocated ?? 0;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/purchases/${p.id}`)}
                  className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs active:bg-[#F7F5F0] transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#4A0E0E]">
                          {p.purchase_number}
                        </span>
                        {p.invoice_number && (
                          <span className="text-[10px] text-[#6B6B6B]">
                            ({p.invoice_number})
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-[#242424] mt-0.5">
                        {p.supplier?.name || 'Supplier'}
                      </h3>
                      {p.project && (
                        <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                          Project: {p.project.name}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        p.payment_status === 'Paid'
                          ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                          : p.payment_status === 'Partial'
                          ? 'bg-[#C99A2E]/10 text-[#C99A2E]'
                          : 'bg-[#A84B14]/10 text-[#A84B14]'
                      }`}
                    >
                      {p.payment_status || 'Unpaid'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD5]/60 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase block">Total</span>
                      <span className="font-mono font-bold text-[#242424]">
                        {formatINR(p.total_amount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase block">Paid</span>
                      <span className="font-mono text-[#1E6B37]">
                        {formatINR(paid)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#6B6B6B] uppercase block">Balance</span>
                      <span className="font-mono font-bold text-[#A84B14]">
                        {formatINR(bal)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-1">
                    <span className="font-mono">Date: {p.purchase_date}</span>
                    <span className="text-[#4A0E0E] font-semibold flex items-center gap-0.5">
                      View Record
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
export default PurchasesPage;
