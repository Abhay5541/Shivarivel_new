import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import {
  useSuppliers,
  useSupplierBalance,
  useOutstandingPurchasesForSupplier,
  useRecordSupplierPayment,
} from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SimpleSupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplierId?: string | null;
  onSuccess?: () => void;
}

export const SimpleSupplierPaymentModal: React.FC<SimpleSupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplierId,
  onSuccess,
}) => {
  const { data: suppliers = [] } = useSuppliers();
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSupplierId(preselectedSupplierId || (suppliers.length > 0 ? suppliers[0].id : ''));
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [isOpen, preselectedSupplierId, suppliers]);

  const { data: balance } = useSupplierBalance(supplierId || undefined);
  const { data: outstandingPurchases = [] } = useOutstandingPurchasesForSupplier(supplierId || undefined);
  const recordPaymentMutation = useRecordSupplierPayment();

  if (!isOpen) return null;

  const outstanding = balance?.outstanding_balance ?? 0;
  const purchased = balance?.total_purchases ?? 0;
  const paid = balance?.total_allocated_payments ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!supplierId) {
      setErrorMsg('Please select a supplier.');
      return;
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    // Financial invariant: Never allow Paid > Purchased / Outstanding
    if (payAmount > outstanding) {
      setErrorMsg(
        `Payment amount (₹${formatINR(payAmount)}) cannot exceed the pending balance of ₹${formatINR(outstanding)}.`
      );
      return;
    }

    // Automatically distribute payment across outstanding purchases (FIFO: oldest first)
    let remaining = payAmount;
    const allocations: { purchase_id: string; amount: number; notes?: string }[] = [];

    for (const p of outstandingPurchases) {
      if (remaining <= 0) break;
      const purchBalance = p.outstanding_balance ?? p.total_amount;
      const allocAmt = Math.min(purchBalance, remaining);
      if (allocAmt > 0) {
        allocations.push({
          purchase_id: p.id,
          amount: allocAmt,
          notes: 'Auto allocated payment',
        });
        remaining -= allocAmt;
      }
    }

    try {
      await recordPaymentMutation.mutateAsync({
        supplier_id: supplierId,
        amount: payAmount,
        payment_date: paymentDate,
        payment_method: 'Cash / Bank Transfer',
        reference_number: null,
        notes: 'Direct supplier payment',
        allocations,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to record payment. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = recordPaymentMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2DDD5] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F5F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#166534]/10 flex items-center justify-center text-[#166534]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#242424] font-heading">
                Record Payment
              </h2>
              <p className="text-xs text-[#6B6B6B]">Record money paid to supplier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B6B6B] hover:text-[#242424] p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Supplier Select */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all cursor-pointer"
            >
              <option value="" disabled>Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Balance Display */}
          {supplierId && (
            <div className="p-3 bg-[#F7F5F0] rounded-xl text-xs space-y-1.5 border border-[#E2DDD5]/60">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Total Purchased:</span>
                <span className="font-semibold text-[#242424]">₹{formatINR(purchased)}</span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Already Paid:</span>
                <span className="font-semibold text-[#166534]">₹{formatINR(paid)}</span>
              </div>
              <div className="flex items-center justify-between font-bold pt-1 border-t border-[#E2DDD5]">
                <span className="text-[#242424]">Pending Balance:</span>
                <span className="text-[#991B1B]">₹{formatINR(outstanding)}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Payment Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={outstanding > 0 ? outstanding : undefined}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
            {outstanding > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(outstanding))}
                className="mt-1.5 text-[11px] font-bold text-[#4A0E0E] hover:underline cursor-pointer"
              >
                Pay full pending amount (₹{formatINR(outstanding)})
              </button>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all cursor-pointer"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-5 text-sm font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || (outstanding <= 0 && Boolean(supplierId))}
              className="h-11 px-6 text-sm font-bold bg-[#166534] hover:bg-[#14532D] text-white shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
