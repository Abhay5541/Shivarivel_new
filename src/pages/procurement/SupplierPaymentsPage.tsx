import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Plus,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { useSupplierPayments, useSuppliers } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export const SupplierPaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');

  const { data: payments = [], isLoading, isError, error, refetch } = useSupplierPayments(selectedSupplierId);
  const { data: suppliers = [] } = useSuppliers();

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalCount = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalAllocated = payments.reduce((sum, p) => sum + Number(p.total_allocated || 0), 0);
    const totalCredit = Math.max(0, totalAmount - totalAllocated);

    return {
      totalCount,
      totalAmount,
      totalAllocated,
      totalCredit,
    };
  }, [payments]);

  // Filter by search
  const filteredPayments = useMemo(() => {
    if (!search) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.payment_number.toLowerCase().includes(q) ||
        p.supplier?.name.toLowerCase().includes(q) ||
        p.reference_number?.toLowerCase().includes(q) ||
        p.payment_method?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#1E6B37]" />
            Supplier Payments Register
          </h1>
        </div>

        <button
          onClick={() => navigate('/supplier-payments/new')}
          className="inline-flex items-center justify-center gap-2 bg-[#1E6B37] hover:bg-[#16522A] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* 3 Financial Context KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Payments Made
            </span>
            <Receipt className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#242424] mt-2 tabular-nums">
            {formatINR(stats.totalAmount)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            {stats.totalCount} payment transactions posted
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Allocated to Invoices
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#1E6B37] mt-2 tabular-nums">
            {formatINR(stats.totalAllocated)}
          </p>
          <span className="text-[10px] text-[#1E6B37]/80 mt-0.5 block">
            Settled purchase invoices
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Supplier Credit (Unallocated)
            </span>
            <CreditCard className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#C99A2E] mt-2 tabular-nums">
            {formatINR(stats.totalCredit)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            Advance payments awaiting bills
          </span>
        </div>
      </div>

      {/* Search & Supplier Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment #, vendor name, or UTR / Chq ref..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs placeholder:text-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
          />
        </div>

        <select
          value={selectedSupplierId}
          onChange={(e) => setSelectedSupplierId(e.target.value)}
          className="bg-white border border-[#E2DDD5] rounded-lg text-xs px-3 py-2 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px] sm:w-64"
        >
          <option value="all">All Suppliers ({suppliers.length})</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table / Cards */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load payments"
          description={error instanceof Error ? error.message : 'Network error'}
          onRetry={() => refetch()}
        />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title="No supplier payments recorded"
          description={
            search || selectedSupplierId !== 'all'
              ? 'No payments match your search filter.'
              : undefined
          }
          actionLabel="Record Payment"
          onAction={() => navigate('/supplier-payments/new')}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method & Reference</th>
                  <th className="py-3 px-4 text-right">Payment Amount</th>
                  <th className="py-3 px-4 text-right">Allocated</th>
                  <th className="py-3 px-4 text-right">Supplier Credit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60">
                {filteredPayments.map((p) => {
                  const unallocated = p.unallocated_amount ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#4A0E0E]">
                        {p.payment_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#242424] block">
                          {p.supplier?.name || 'Supplier'}
                        </span>
                        {p.notes && (
                          <span className="text-[11px] text-[#6B6B6B] truncate max-w-xs block mt-0.5">
                            {p.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#242424]">
                        {p.payment_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#242424] block">
                          {p.payment_method || 'Direct'}
                        </span>
                        {p.reference_number && (
                          <span className="font-mono text-[10px] text-[#6B6B6B]">
                            Ref: {p.reference_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E6B37]">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#242424]">
                        {formatINR(p.total_allocated ?? p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#C99A2E]">
                        {unallocated > 0 ? formatINR(unallocated) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E6B37]/10 text-[#1E6B37]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (360px & 390px Optimized) */}
          <div className="md:hidden space-y-3">
            {filteredPayments.map((p) => {
              const unallocated = p.unallocated_amount ?? 0;
              return (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#4A0E0E]">
                        {p.payment_number}
                      </span>
                      <h3 className="font-bold text-sm text-[#242424] mt-0.5">
                        {p.supplier?.name || 'Supplier'}
                      </h3>
                      <span className="text-[11px] text-[#6B6B6B] block">
                        {p.payment_method} {p.reference_number ? `• ${p.reference_number}` : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#6B6B6B] uppercase block">Paid</span>
                      <span className="font-mono font-bold text-sm text-[#1E6B37] tabular-nums">
                        {formatINR(p.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs text-[#6B6B6B]">
                    <div>
                      <span>Allocated: </span>
                      <span className="font-mono font-semibold text-[#242424]">
                        {formatINR(p.total_allocated ?? p.amount)}
                      </span>
                    </div>

                    {unallocated > 0 ? (
                      <div>
                        <span className="text-[#C99A2E] font-medium">Credit: </span>
                        <span className="font-mono font-bold text-[#C99A2E]">
                          {formatINR(unallocated)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#1E6B37] font-medium">
                        Fully Allocated
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-[#6B6B6B] pt-0.5">
                    Date: {p.payment_date}
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
export default SupplierPaymentsPage;
