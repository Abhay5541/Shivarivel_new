import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import type { Purchase } from '@/types/procurement';
import { useRecordPurchasePayment } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  purchase,
  onSuccess,
}) => {
  const recordPaymentMutation = useRecordPurchasePayment();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount('');
      setErrorMsg(null);
    }
  }, [isOpen, purchase]);

  if (!isOpen || !purchase) return null;

  const currentTotal = purchase.total_amount;
  const currentPaid = purchase.total_allocated ?? 0;
  const currentBalance = purchase.outstanding_balance ?? Math.max(0, currentTotal - currentPaid);

  const numPayment = Number(paymentAmount) || 0;
  const projectedPaid = currentPaid + numPayment;
  const projectedBalance = Math.max(0, currentBalance - numPayment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numPayment <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    if (numPayment > currentBalance) {
      setErrorMsg('Amount paid cannot be greater than total value.');
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        purchaseId: purchase.id,
        paymentAmount: numPayment,
        paymentMethod: 'Cash',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to record payment. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = recordPaymentMutation.isPending;
  const productName = purchase.items?.[0]?.description || purchase.items?.[0]?.material?.name || 'Material Item';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 modal-backdrop-spring">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2DDD5] overflow-hidden modal-spring">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F5F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C99A2E]/10 flex items-center justify-center text-[#C99A2E]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#242424] font-heading">
                Update Payment
              </h2>
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

        {/* Purchase Info Summary */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#242424]">{productName}</span>
              <span className="text-[#6B6B6B] font-medium">{purchase.purchase_date}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E2DDD5]/70 text-center overflow-hidden">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block truncate">Total</span>
                <span className="text-xs font-bold text-[#242424] truncate block" title={formatINR(currentTotal)}>
                  {formatINR(currentTotal)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block truncate">Paid</span>
                <span className="text-xs font-bold text-[#166534] truncate block" title={formatINR(currentPaid)}>
                  {formatINR(currentPaid)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block truncate">Balance</span>
                <span className="text-xs font-bold text-[#991B1B] truncate block" title={formatINR(currentBalance)}>
                  {formatINR(currentBalance)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="1"
                max={currentBalance}
                required
                autoFocus
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Up to ₹${currentBalance}`}
                className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-semibold text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
              />
            </div>

            {/* Balance Preview */}
            {numPayment > 0 && numPayment <= currentBalance && (
              <div className="p-3 bg-[#DCFCE7]/30 border border-[#166534]/20 rounded-xl text-xs flex items-center justify-between gap-2 overflow-hidden">
                <div className="min-w-0">
                  <span className="text-[#6B6B6B] block truncate">New Paid Amount:</span>
                  <span className="font-bold text-[#166534] truncate block" title={formatINR(projectedPaid)}>
                    {formatINR(projectedPaid)}
                  </span>
                </div>
                <div className="min-w-0 text-right">
                  <span className="text-[#6B6B6B] block truncate">Remaining Balance:</span>
                  <span className="font-bold text-[#991B1B] truncate block" title={formatINR(projectedBalance)}>
                    {formatINR(projectedBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSaving}
                className="h-11 px-5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 px-6 text-xs font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white rounded-xl shadow-xs cursor-pointer"
              >
                {isSaving ? 'Updating...' : 'Update Payment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
