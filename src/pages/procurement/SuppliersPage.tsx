import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { PageContainer } from '@/components/layout/PageContainer';
import { useSuppliers, usePurchases } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimpleSupplierModal } from '@/components/business/SimpleSupplierModal';

import { useSearchParams } from 'react-router-dom';
import { SimpleSupplierPaymentModal } from '@/components/business/SimpleSupplierPaymentModal';

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setIsAddSupplierOpen(true);
    }
    if (searchParams.get('pay') === '1' || searchParams.get('pay') === 'true') {
      setIsPaymentModalOpen(true);
    }
  }, [searchParams]);

  const { data: suppliers = [], isLoading: isLoadingSuppliers, isError, error, refetch } = useSuppliers(search);
  const { data: purchases = [], isLoading: isLoadingPurchases } = usePurchases();

  // Compute financial totals per supplier
  const supplierBalances = useMemo(() => {
    const map = new Map<string, { purchased: number; paid: number; pending: number }>();
    for (const s of suppliers) {
      const supPurchases = purchases.filter((p) => p.supplier_id === s.id && p.status === 'Confirmed');
      const purchased = supPurchases.reduce((sum, p) => sum + p.total_amount, 0);
      const paid = supPurchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
      const pending = Math.max(0, purchased - paid);
      map.set(s.id, { purchased, paid, pending });
    }
    return map;
  }, [suppliers, purchases]);

  const isLoading = isLoadingSuppliers || isLoadingPurchases;

  return (
    <PageContainer className="pb-24 select-none">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#242424] tracking-tight">
            Suppliers
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Search
            size="sm"
            value={search}
            onChange={setSearch}
            placeholder="Search suppliers..."
          />
          <ActionButton
            icon={<Plus className="w-4 h-4" />}
            label="Add Supplier"
            onClick={() => setIsAddSupplierOpen(true)}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorState
          title="Failed to load suppliers"
          description={error instanceof Error ? error.message : 'Please check your connection.'}
          onRetry={refetch}
        />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-[#6B6B6B]" />}
          title={search ? 'No suppliers match your search' : 'No suppliers added yet.'}
          description={
            search
              ? 'Try searching with a different name or phone number.'
              : undefined
          }
          actionLabel="Add Supplier"
          onAction={() => setIsAddSupplierOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((supplier) => {
            const bal = supplierBalances.get(supplier.id) || { purchased: 0, paid: 0, pending: 0 };
            return (
              <div
                key={supplier.id}
                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                className="bg-white border border-[#E2DDD5] rounded-2xl p-5 hover:border-[#4A0E0E]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#4A0E0E] shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-[#242424] group-hover:text-[#4A0E0E] transition-colors">
                        {supplier.name}
                      </h2>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#6B6B6B] group-hover:text-[#4A0E0E] group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                  </div>

                  {supplier.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] ml-11 mb-3">
                      <Phone className="w-3.5 h-3.5 text-[#C99A2E]" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary Strip */}
                <div className="mt-3 pt-3 border-t border-[#E2DDD5] grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#F7F5F0] rounded-xl p-2">
                    <span className="text-[11px] text-[#6B6B6B] block">Total Purchased</span>
                    <span className="font-bold text-[#242424]">₹{formatINR(bal.purchased)}</span>
                  </div>
                  <div className="bg-[#DCFCE7]/40 rounded-xl p-2">
                    <span className="text-[11px] text-[#166534] block">Paid</span>
                    <span className="font-bold text-[#166534]">₹{formatINR(bal.paid)}</span>
                  </div>
                  <div className={`rounded-xl p-2 ${bal.pending > 0 ? 'bg-[#FEE2E2]/50' : 'bg-[#F7F5F0]'}`}>
                    <span className={`text-[11px] block ${bal.pending > 0 ? 'text-[#991B1B]' : 'text-[#6B6B6B]'}`}>
                      Pending
                    </span>
                    <span className={`font-bold ${bal.pending > 0 ? 'text-[#991B1B]' : 'text-[#6B6B6B]'}`}>
                      ₹{formatINR(bal.pending)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Supplier Modal */}
      <SimpleSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
      />

      {/* Record Payment Modal */}
      <SimpleSupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </PageContainer>
  );
};
