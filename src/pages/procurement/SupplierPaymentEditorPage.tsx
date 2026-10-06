import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  AlertCircle,
  Receipt,
  Save,
} from 'lucide-react';
import {
  useSuppliers,
  useOutstandingPurchasesForSupplier,
  useRecordSupplierPayment,
} from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/types/procurement';

export const SupplierPaymentEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplierId = searchParams.get('supplier_id') || '';
  const preselectedPurchaseId = searchParams.get('purchase_id') || '';

  const { data: suppliers = [] } = useSuppliers();
  const [supplierId, setSupplierId] = useState(preselectedSupplierId);

  // Outstanding purchases for the selected supplier
  const { data: outstandingPurchases = [], isLoading: isLoadingPurchases } =
    useOutstandingPurchasesForSupplier(supplierId);

  // Form Fields
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer (NEFT / RTGS)');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Allocation state: map of purchaseId -> allocatedAmount string
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const recordPaymentMutation = useRecordSupplierPayment();

  // If preselected purchase is provided, auto-prefill allocation once purchases load
  useEffect(() => {
    if (preselectedPurchaseId && outstandingPurchases.length > 0) {
      const target = outstandingPurchases.find((p) => p.id === preselectedPurchaseId);
      if (target) {
        const bal = target.outstanding_balance ?? target.total_amount;
        setPaymentAmount(bal.toString());
        setAllocations({ [target.id]: bal.toString() });
      }
    }
  }, [preselectedPurchaseId, outstandingPurchases]);

  // Handle allocation change for a purchase row
  const handleAllocationChange = (purchaseId: string, val: string) => {
    setAllocations((prev) => ({
      ...prev,
      [purchaseId]: val,
    }));
  };

  // Quick Pay Full button for a purchase
  const handlePayFull = (purchaseId: string, balance: number) => {
    setAllocations((prev) => ({
      ...prev,
      [purchaseId]: balance.toString(),
    }));
  };

  // Calculated totals
  const totalAmountNum = parseFloat(paymentAmount) || 0;

  const totalAllocatedNum = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => {
      const num = parseFloat(val) || 0;
      return sum + num;
    }, 0);
  }, [allocations]);

  const supplierCreditNum = Math.max(0, totalAmountNum - totalAllocatedNum);
  const isOverAllocated = totalAllocatedNum > totalAmountNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    if (totalAmountNum <= 0) {
      setFormError('Payment amount must be strictly greater than 0.');
      return;
    }

    if (isOverAllocated) {
      setFormError(
        `Total allocated (${formatINR(totalAllocatedNum)}) cannot exceed total payment amount (${formatINR(totalAmountNum)}).`
      );
      return;
    }

    // Validate that no row exceeds its invoice outstanding balance
    for (const p of outstandingPurchases) {
      const rowAlloc = parseFloat(allocations[p.id] || '0') || 0;
      const rowBalance = p.outstanding_balance ?? p.total_amount;
      if (rowAlloc > rowBalance) {
        setFormError(
          `Allocation for invoice ${p.invoice_number || p.purchase_number} exceeds its outstanding balance of ${formatINR(rowBalance)}.`
        );
        return;
      }
    }

    // Build allocation array for valid positive entries
    const allocationPayload = Object.entries(allocations)
      .map(([purchase_id, amtStr]) => ({
        purchase_id,
        amount: parseFloat(amtStr) || 0,
      }))
      .filter((a) => a.amount > 0);

    try {
      await recordPaymentMutation.mutateAsync({
        supplier_id: supplierId,
        payment_date: paymentDate,
        amount: totalAmountNum,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
        allocations: allocationPayload,
      });

      navigate(preselectedSupplierId ? `/suppliers/${preselectedSupplierId}` : '/supplier-payments');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record supplier payment.');
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/supplier-payments')}
            className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-1.5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Supplier Payments
          </button>
          <h1 className="text-2xl font-bold text-[#242424] font-heading mt-1">
            Record Supplier Payment & Allocation
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/supplier-payments')}
            className="px-4 py-2.5 rounded-lg border border-[#E2DDD5] bg-white text-xs font-semibold text-[#242424] hover:bg-[#F7F5F0] transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={recordPaymentMutation.isPending}
            className="inline-flex items-center gap-2 bg-[#1E6B37] hover:bg-[#16522A] text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            {recordPaymentMutation.isPending ? 'Posting...' : 'Record Payment'}
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Payment Details */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <Building2 className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
              Disbursement Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Select Supplier / Vendor *
              </label>
              <select
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  setAllocations({});
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                <option value="">-- Choose Vendor --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(+91 ${s.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono font-bold text-[#1E6B37] text-base focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Payment Mode / Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Transaction Reference / Cheque # / UTR
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. NEFT-SBIN2026100201 or Cheque # 044109"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Payment Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Advance paid towards structural steel delivery for Anna Nagar site"
                className="w-full px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoice Allocations UI */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C99A2E]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
                Allocate Against Outstanding Invoices
              </h2>
            </div>

            <span className="text-xs text-[#6B6B6B]">
              {outstandingPurchases.length} outstanding invoice(s)
            </span>
          </div>

          {!supplierId ? (
            <div className="p-4 bg-[#F7F5F0] rounded-xl text-xs text-[#6B6B6B] text-center">
              Please choose a supplier above to load their outstanding invoices.
            </div>
          ) : isLoadingPurchases ? (
            <div className="p-4 text-center text-xs text-[#6B6B6B]">
              Loading outstanding bills...
            </div>
          ) : outstandingPurchases.length === 0 ? (
            <div className="p-4 bg-[#F7F5F0] rounded-xl text-xs text-[#6B6B6B] text-center">
              This vendor currently has no pending unpaid bills. Any payment recorded will be stored as an unallocated <strong>Supplier Credit</strong>.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F5F0] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice / Purchase</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Invoice Total</th>
                      <th className="py-2.5 px-3 text-right">Outstanding</th>
                      <th className="py-2.5 px-3 text-right w-44">Allocate (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD5]/60">
                    {outstandingPurchases.map((p) => {
                      const bal = p.outstanding_balance ?? p.total_amount;
                      const currentAlloc = allocations[p.id] || '';

                      return (
                        <tr key={p.id} className="hover:bg-[#F7F5F0]/30">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-[#4A0E0E] block">
                              {p.purchase_number}
                            </span>
                            {p.invoice_number && (
                              <span className="text-[11px] text-[#6B6B6B] block">
                                Inv: {p.invoice_number}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#242424]">
                            {p.purchase_date}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#6B6B6B]">
                            {formatINR(p.total_amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#A84B14]">
                            {formatINR(bal)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                step="any"
                                max={bal}
                                value={currentAlloc}
                                onChange={(e) => handleAllocationChange(p.id, e.target.value)}
                                placeholder="0"
                                className="w-28 px-2.5 py-1.5 bg-white border border-[#E2DDD5] rounded text-xs font-mono text-right text-[#1E6B37] font-semibold focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                              />
                              <button
                                type="button"
                                onClick={() => handlePayFull(p.id, bal)}
                                className="text-[10px] font-bold text-[#4A0E0E] bg-[#F7F5F0] hover:bg-[#E2DDD5] border border-[#E2DDD5] px-2 py-1.5 rounded transition-colors whitespace-nowrap"
                              >
                                Full
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Allocation Cards */}
              <div className="sm:hidden space-y-3">
                {outstandingPurchases.map((p) => {
                  const bal = p.outstanding_balance ?? p.total_amount;
                  const currentAlloc = allocations[p.id] || '';

                  return (
                    <div
                      key={p.id}
                      className="bg-[#F7F5F0]/60 p-3.5 rounded-lg border border-[#E2DDD5] space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-[#4A0E0E]">
                            {p.purchase_number}
                          </span>
                          {p.invoice_number && (
                            <span className="text-[11px] text-[#6B6B6B] block">
                              Inv: {p.invoice_number}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#6B6B6B] uppercase block">
                            Outstanding
                          </span>
                          <span className="font-mono font-bold text-xs text-[#A84B14]">
                            {formatINR(bal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-[#E2DDD5]/60">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-[#6B6B6B] uppercase block mb-1">
                            Allocate (₹)
                          </label>
                          <input
                            type="number"
                            step="any"
                            max={bal}
                            value={currentAlloc}
                            onChange={(e) => handleAllocationChange(p.id, e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded text-xs font-mono font-bold text-[#1E6B37] min-h-[44px]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePayFull(p.id, bal)}
                          className="mt-4 px-3 py-2.5 bg-white border border-[#E2DDD5] rounded text-xs font-bold text-[#4A0E0E] min-h-[44px]"
                        >
                          Pay Full
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allocation Balance Math Preview Card */}
          <div className="bg-[#F7F5F0] p-4 rounded-xl border border-[#E2DDD5] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Total Payment Disbursed:</span>
              <span className="font-mono font-bold text-base text-[#1E6B37]">
                {formatINR(totalAmountNum)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#6B6B6B]">
              <span>Total Allocated to Bills:</span>
              <span className="font-mono font-semibold text-[#242424]">
                {formatINR(totalAllocatedNum)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E2DDD5] flex items-center justify-between">
              <span className="font-bold text-[#242424]">
                Remaining Amount (Supplier Credit):
              </span>
              <span
                className={`font-mono font-bold text-sm tabular-nums ${
                  isOverAllocated ? 'text-red-600' : 'text-[#C99A2E]'
                }`}
              >
                {isOverAllocated
                  ? `Over-allocated by ${formatINR(totalAllocatedNum - totalAmountNum)}`
                  : formatINR(supplierCreditNum)}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="sm:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E2DDD5] flex gap-2 z-20">
          <button
            type="button"
            onClick={() => navigate('/supplier-payments')}
            className="flex-1 py-3 border border-[#E2DDD5] rounded-lg text-xs font-bold text-[#242424] bg-white min-h-[48px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={recordPaymentMutation.isPending || isOverAllocated}
            className="flex-1 py-3 bg-[#1E6B37] text-white rounded-lg text-xs font-bold shadow-xs min-h-[48px] disabled:opacity-50"
          >
            {recordPaymentMutation.isPending ? 'Posting...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SupplierPaymentEditorPage;
