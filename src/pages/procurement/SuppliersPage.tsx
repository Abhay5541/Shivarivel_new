import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  ChevronRight,
  Receipt,
  AlertCircle,
  Building2,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';
import { useSuppliers, memoryPurchases } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: suppliers = [], isLoading, isError, error, refetch } = useSuppliers(search, statusFilter);

  // Compute aggregate statistics
  const stats = useMemo(() => {
    const activeCount = suppliers.filter((s) => s.status === 'active').length;

    // Sum of confirmed purchases across memory/data
    const totalPurchases = memoryPurchases
      .filter((p) => p.status === 'Confirmed')
      .reduce((sum, p) => sum + p.total_amount, 0);

    const totalAllocated = memoryPurchases
      .filter((p) => p.status === 'Confirmed')
      .reduce((sum, p) => sum + (p.total_allocated || 0), 0);

    const totalOutstanding = Math.max(0, totalPurchases - totalAllocated);

    return {
      activeCount,
      totalCount: suppliers.length,
      totalPurchases,
      totalAllocated,
      totalOutstanding,
    };
  }, [suppliers]);

  // Compute per-supplier outstanding preview
  const getSupplierOutstanding = (supplierId: string) => {
    const purchases = memoryPurchases.filter(
      (p) => p.supplier_id === supplierId && p.status === 'Confirmed'
    );
    const totalP = purchases.reduce((acc, p) => acc + p.total_amount, 0);
    const totalA = purchases.reduce((acc, p) => acc + (p.total_allocated || 0), 0);
    return Math.max(0, totalP - totalA);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#4A0E0E]" />
            Suppliers & Vendors
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Construction material vendors, structural steel mills, timber yards & trade suppliers
          </p>
        </div>

        <button
          onClick={() => navigate('/suppliers/new')}
          className="inline-flex items-center justify-center gap-2 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* 4 Operations KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Active Vendors
            </span>
            <Users className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#242424] mt-2">
            {stats.activeCount}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            {stats.totalCount} registered vendors
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Purchases
            </span>
            <Receipt className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#242424] mt-2 tabular-nums">
            {formatINR(stats.totalPurchases)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            Confirmed supplier bills
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
            {formatINR(stats.totalAllocated)}
          </p>
          <span className="text-[10px] text-[#1E6B37]/80 mt-0.5 block">
            Allocated bank & UPI
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Outstanding Balance
            </span>
            <AlertCircle className="w-4 h-4 text-[#A84B14]" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#A84B14] mt-2 tabular-nums">
            {formatINR(stats.totalOutstanding)}
          </p>
          <span className="text-[10px] text-[#A84B14]/80 mt-0.5 block">
            Payable to suppliers
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name, contact, phone, GSTIN..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs placeholder:text-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
                statusFilter === st
                  ? 'bg-[#4A0E0E] text-white'
                  : 'bg-white border border-[#E2DDD5] text-[#6B6B6B] hover:text-[#242424]'
              }`}
            >
              {st === 'all' ? 'All Vendors' : st === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load suppliers"
          description={error instanceof Error ? error.message : 'Network or server communication error.'}
          onRetry={() => refetch()}
        />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="No suppliers found"
          description={
            search
              ? 'No suppliers match your search criteria. Try a different query.'
              : 'No suppliers registered yet. Add your first vendor to start recording purchases.'
          }
          actionLabel="Add Supplier"
          onAction={() => navigate('/suppliers/new')}
        />
      ) : (
        <>
          {/* Desktop Operations Table */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                <tr>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Phone & GSTIN</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60">
                {suppliers.map((sup) => {
                  const outstanding = getSupplierOutstanding(sup.id);
                  return (
                    <tr
                      key={sup.id}
                      onClick={() => navigate(`/suppliers/${sup.id}`)}
                      className="hover:bg-[#F7F5F0]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#242424] hover:text-[#4A0E0E]">
                          {sup.name}
                        </div>
                        {sup.address && (
                          <div className="text-[11px] text-[#6B6B6B] truncate max-w-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#C99A2E] shrink-0" />
                            {sup.address}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#6B6B6B]">
                        <span className="px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5] text-[11px] font-medium text-[#242424]">
                          {sup.category || 'General Vendor'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#242424]">
                          {sup.contact_person || '—'}
                        </div>
                        {sup.email && (
                          <div className="text-[11px] text-[#6B6B6B] truncate max-w-xs mt-0.5">
                            {sup.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sup.phone ? (
                          <div className="font-mono text-[11px] text-[#242424] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#C99A2E]" />
                            +91 {sup.phone}
                          </div>
                        ) : (
                          <span className="text-[#6B6B6B]">—</span>
                        )}
                        {sup.gst_number && (
                          <div className="text-[10px] font-mono text-[#6B6B6B] mt-0.5">
                            GST: {sup.gst_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-xs tabular-nums ${
                            outstanding > 0 ? 'text-[#A84B14]' : 'text-[#1E6B37]'
                          }`}
                        >
                          {formatINR(outstanding)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sup.status === 'active'
                              ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {sup.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/purchases/new?supplier_id=${sup.id}`)}
                            title="Add Purchase"
                            className="p-1.5 hover:bg-[#F7F5F0] rounded-lg text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/supplier-payments/new?supplier_id=${sup.id}`)}
                            title="Record Payment"
                            className="p-1.5 hover:bg-[#F7F5F0] rounded-lg text-[#6B6B6B] hover:text-[#1E6B37] transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/suppliers/${sup.id}`)}
                            className="p-1.5 hover:bg-[#F7F5F0] rounded-lg text-[#6B6B6B] hover:text-[#242424] transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Supplier Cards (360px & 390px Optimized) */}
          <div className="md:hidden space-y-3">
            {suppliers.map((sup) => {
              const outstanding = getSupplierOutstanding(sup.id);
              return (
                <div
                  key={sup.id}
                  onClick={() => navigate(`/suppliers/${sup.id}`)}
                  className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs active:bg-[#F7F5F0] transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#242424] truncate">{sup.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5] text-[#6B6B6B]">
                          {sup.category || 'Vendor'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            sup.status === 'active' ? 'text-[#1E6B37]' : 'text-gray-500'
                          }`}
                        >
                          • {sup.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#6B6B6B] uppercase block">Outstanding</span>
                      <span
                        className={`font-mono font-bold text-xs tabular-nums ${
                          outstanding > 0 ? 'text-[#A84B14]' : 'text-[#1E6B37]'
                        }`}
                      >
                        {formatINR(outstanding)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD5]/60 text-xs text-[#6B6B6B] space-y-1">
                    {sup.contact_person && (
                      <div className="text-[#242424] font-medium">
                        Contact: {sup.contact_person}
                      </div>
                    )}
                    {sup.phone && (
                      <div className="font-mono text-[11px] flex items-center gap-1 text-[#242424]">
                        <Phone className="w-3 h-3 text-[#C99A2E]" />
                        +91 {sup.phone}
                      </div>
                    )}
                    {sup.address && (
                      <div className="text-[11px] truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C99A2E] shrink-0" />
                        {sup.address}
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-between pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/purchases/new?supplier_id=${sup.id}`)}
                      className="text-xs font-bold text-[#4A0E0E] flex items-center gap-1 py-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      + Purchase
                    </button>

                    <button
                      onClick={() => navigate(`/supplier-payments/new?supplier_id=${sup.id}`)}
                      className="text-xs font-bold text-[#1E6B37] flex items-center gap-1 py-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay Vendor
                    </button>
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
export default SuppliersPage;
