import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  CreditCard,
  ShoppingCart,
  Plus,
  Edit2,
  Calendar,
  Building2,
} from 'lucide-react';
import { useSupplier, usePurchases, useSupplierBalance } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimpleSupplierPaymentModal } from '@/components/business/SimpleSupplierPaymentModal';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { SimpleSupplierModal } from '@/components/business/SimpleSupplierModal';

export const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);

  const { data: supplier, isLoading: isLoadingSupplier, isError, error, refetch } = useSupplier(id);
  const { data: balance, isLoading: isLoadingBalance } = useSupplierBalance(id);
  const { data: purchases = [], isLoading: isLoadingPurchases } = usePurchases({ supplier_id: id });

  const isLoading = isLoadingSupplier || isLoadingBalance || isLoadingPurchases;

  if (isLoading) {
    return (
      <div className="py-16 max-w-4xl mx-auto">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <button
          type="button"
          onClick={() => navigate('/suppliers')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors mb-4 cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers</span>
        </button>
        <ErrorState
          title="Supplier not found"
          description={error instanceof Error ? error.message : `No supplier found matching identifier ${id}`}
          onRetry={refetch}
        />
      </div>
    );
  }

  const purchased = balance?.total_purchases ?? 0;
  const paid = balance?.total_allocated_payments ?? 0;
  const pending = balance?.outstanding_balance ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 select-none">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/suppliers')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers</span>
        </button>
      </div>

      {/* Main Supplier Profile Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
            Supplier Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading uppercase">
            {supplier.name}
          </h1>

          {supplier.phone ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-[#242424]">
              <Phone className="w-4 h-4 text-[#C99A2E]" />
              <span className="font-semibold">{supplier.phone}</span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#6B6B6B] italic">No phone number recorded</p>
          )}

          {/* Financial summary blocks */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl px-4 py-2.5 text-center min-w-[120px]">
              <span className="text-[11px] text-[#6B6B6B] block">Purchased</span>
              <span className="text-base font-bold text-[#242424]">₹{formatINR(purchased)}</span>
            </div>

            <div className="bg-[#DCFCE7]/40 border border-[#166534]/20 rounded-xl px-4 py-2.5 text-center min-w-[120px]">
              <span className="text-[11px] text-[#166534] block">Paid</span>
              <span className="text-base font-bold text-[#166534]">₹{formatINR(paid)}</span>
            </div>

            <div
              className={`rounded-xl px-4 py-2.5 text-center min-w-[120px] border ${
                pending > 0
                  ? 'bg-[#FEE2E2]/50 border-red-200'
                  : 'bg-[#F7F5F0] border-[#E2DDD5]'
              }`}
            >
              <span className={`text-[11px] block ${pending > 0 ? 'text-[#991B1B]' : 'text-[#6B6B6B]'}`}>
                Pending
              </span>
              <span className={`text-base font-bold ${pending > 0 ? 'text-[#991B1B]' : 'text-[#6B6B6B]'}`}>
                ₹{formatINR(pending)}
              </span>
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditSupplierOpen(true)}
            className="h-10 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>

          <Button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="h-10 px-4 text-xs font-bold bg-[#166534] hover:bg-[#14532D] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Purchase History Section */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#242424] font-heading">
              Purchase History
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Materials purchased from {supplier.name}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="h-10 px-4 text-xs font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Record Purchase</span>
          </Button>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#E2DDD5]">
            <ShoppingCart className="w-8 h-8 text-[#6B6B6B] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#242424]">No purchases recorded yet</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Click &quot;Record Purchase&quot; above to log materials received from this vendor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2DDD5] border border-[#E2DDD5] rounded-xl overflow-hidden">
            {purchases.map((purchase) => {
              const item = purchase.items && purchase.items.length > 0 ? purchase.items[0] : null;
              const materialName = item?.material?.name || 'Material Item';
              const qtyDisplay = item ? `${item.quantity} ${item.unit}` : '1 Unit';

              return (
                <div key={purchase.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-[#F7F5F0]/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#242424]">
                        {materialName}
                      </span>
                      <span className="text-xs text-[#6B6B6B] font-medium bg-[#F7F5F0] px-2 py-0.5 rounded-md border border-[#E2DDD5]">
                        {qtyDisplay}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B6B]">
                      {purchase.project?.name && (
                        <span className="flex items-center gap-1 text-[#4A0E0E] font-medium">
                          <Building2 className="w-3.5 h-3.5 text-[#C99A2E]" />
                          <span>{purchase.project.name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
                        <span>{purchase.purchase_date}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <div className="text-sm font-bold text-[#242424]">
                      ₹{formatINR(purchase.total_amount)}
                    </div>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        purchase.payment_status === 'Paid'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : purchase.payment_status === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {purchase.payment_status || 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <SimpleSupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedSupplierId={supplier.id}
      />

      {/* Record Purchase Modal */}
      <SimplePurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        preselectedSupplierId={supplier.id}
      />

      {/* Edit Supplier Modal */}
      <SimpleSupplierModal
        isOpen={isEditSupplierOpen}
        onClose={() => setIsEditSupplierOpen(false)}
        supplier={supplier}
      />
    </div>
  );
};
