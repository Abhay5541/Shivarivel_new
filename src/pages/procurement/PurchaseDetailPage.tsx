import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CreditCard,
} from 'lucide-react';
import { usePurchase, useSupplierPayments } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export const PurchaseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: purchase, isLoading, isError, error, refetch } = usePurchase(id);
  const { data: allPayments = [] } = useSupplierPayments(purchase?.supplier_id);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <div className="space-y-6 pb-20">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/purchases'))}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </button>
        <ErrorState
          title="Purchase record not found"
          description={error instanceof Error ? error.message : 'Unable to find purchase entry.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const outstanding = purchase.outstanding_balance ?? purchase.total_amount;
  const paid = purchase.total_allocated ?? 0;

  // Find allocations matching this purchase across all payments
  const matchingAllocations: Array<{
    paymentNumber: string;
    paymentDate: string;
    method: string | null;
    allocatedAmount: number;
    notes: string | null;
  }> = [];

  for (const p of allPayments) {
    for (const a of p.allocations || []) {
      if (a.purchase_id === purchase.id) {
        matchingAllocations.push({
          paymentNumber: p.payment_number,
          paymentDate: p.payment_date,
          method: p.payment_method,
          allocatedAmount: a.amount,
          notes: a.notes,
        });
      }
    }
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/purchases'))}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {purchase.supplier && (
            <button
              onClick={() => navigate(`/suppliers/${purchase.supplier_id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs font-semibold text-[#242424] hover:bg-[#F7F5F0] transition-colors min-h-[40px]"
            >
              <Building2 className="w-3.5 h-3.5 text-[#C99A2E]" />
              View Supplier Profile
            </button>
          )}

          {outstanding > 0 && (
            <button
              onClick={() =>
                navigate(
                  `/supplier-payments/new?supplier_id=${purchase.supplier_id}&purchase_id=${purchase.id}`
                )
              }
              className="inline-flex items-center gap-1.5 bg-[#1E6B37] hover:bg-[#16522A] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay Balance ({formatINR(outstanding)})
            </button>
          )}
        </div>
      </div>

      {/* Invoice Identity Card */}
      <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DDD5]/70 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs bg-[#4A0E0E] text-white px-2.5 py-0.5 rounded">
                {purchase.purchase_number}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  purchase.payment_status === 'Paid'
                    ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                    : purchase.payment_status === 'Partial'
                    ? 'bg-[#C99A2E]/10 text-[#C99A2E]'
                    : 'bg-[#A84B14]/10 text-[#A84B14]'
                }`}
              >
                {purchase.payment_status || 'Unpaid'}
              </span>
              <span className="text-[10px] font-semibold text-[#6B6B6B] px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5]">
                Status: {purchase.status}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#242424] font-heading">
              {purchase.invoice_number ? `Invoice #${purchase.invoice_number}` : 'Direct Purchase Record'}
            </h1>

            {purchase.supplier && (
              <p className="text-xs text-[#242424] font-medium flex items-center gap-1.5">
                <span>Vendor:</span>
                <Link
                  to={`/suppliers/${purchase.supplier_id}`}
                  className="font-bold text-[#4A0E0E] hover:underline"
                >
                  {purchase.supplier.name}
                </Link>
                {purchase.supplier.phone && (
                  <span className="text-[#6B6B6B] font-mono text-[11px]">
                    (+91 {purchase.supplier.phone})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Quick Balance Snapshot */}
          <div className="bg-[#F7F5F0] border border-[#E2DDD5] p-3.5 sm:p-4 rounded-xl shrink-0 text-left md:text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Total Invoiced
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#242424] mt-0.5 tabular-nums">
              {formatINR(purchase.total_amount)}
            </p>
            <span
              className={`text-[10px] font-semibold block mt-0.5 ${
                outstanding > 0 ? 'text-[#A84B14]' : 'text-[#1E6B37]'
              }`}
            >
              {outstanding > 0
                ? `Remaining Due: ${formatINR(outstanding)}`
                : 'Fully Paid & Settled'}
            </span>
          </div>
        </div>

        {/* Association Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[#6B6B6B]">
          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Assigned Project
            </span>
            <div className="mt-0.5">
              {purchase.project ? (
                <div>
                  <Link
                    to={`/projects/${purchase.project.id}`}
                    className="font-semibold text-[#242424] hover:text-[#4A0E0E] hover:underline block"
                  >
                    {purchase.project.name}
                  </Link>
                  <span className="font-mono text-[11px] text-[#6B6B6B]">
                    {purchase.project.project_code}
                  </span>
                </div>
              ) : (
                <span className="text-[#6B6B6B] italic">General Overhead (Not project-specific)</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Purchase & Due Dates
            </span>
            <div className="mt-0.5 font-mono text-[#242424] space-y-0.5">
              <div>Invoice Date: {purchase.purchase_date}</div>
              {purchase.due_date && (
                <div className="text-[11px] text-[#6B6B6B]">Payment Due: {purchase.due_date}</div>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Supplier GSTIN
            </span>
            <span className="font-mono font-bold text-[#242424] block mt-0.5">
              {purchase.supplier?.gst_number || '—'}
            </span>
          </div>
        </div>

        {purchase.notes && (
          <div className="pt-3 border-t border-[#E2DDD5]/60 text-xs text-[#6B6B6B]">
            <span className="font-semibold text-[#242424]">Receiving Notes: </span>
            {purchase.notes}
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-[#E2DDD5] bg-[#F7F5F0]/60">
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
            Delivered Materials & Bill of Quantities
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              <tr>
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">Material Description</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5]/60">
              {(purchase.items || []).map((item, idx) => (
                <tr key={item.id} className="hover:bg-[#F7F5F0]/30">
                  <td className="py-3 px-4 font-mono text-[#6B6B6B]">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#242424]">
                      {item.material?.name || item.description || 'Material Item'}
                    </div>
                    {item.description && item.material?.name && item.description !== item.material.name && (
                      <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-[#242424]">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-[#6B6B6B]">{item.unit}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#242424]">
                    {formatINR(item.unit_price)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#242424]">
                    {formatINR(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Footer */}
        <div className="p-4 border-t border-[#E2DDD5] bg-[#F7F5F0]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div className="text-[#6B6B6B] text-[11px]">
            * Line item calculations and header totals are synchronized deterministically by backend triggers.
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            {purchase.discount > 0 && (
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Discount Deduction:</span>
                <span className="font-mono text-[#A84B14]">- {formatINR(purchase.discount)}</span>
              </div>
            )}
            {purchase.tax > 0 && (
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Tax / GST:</span>
                <span className="font-mono text-[#242424]">+ {formatINR(purchase.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#E2DDD5]">
              <span className="text-[#242424]">Total Amount:</span>
              <span className="font-mono text-[#4A0E0E]">{formatINR(purchase.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[#1E6B37] font-semibold text-xs">
              <span>Paid / Allocated:</span>
              <span className="font-mono">{formatINR(paid)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#E2DDD5]/60">
              <span className="text-[#A84B14]">Balance Due:</span>
              <span className="font-mono text-[#A84B14]">{formatINR(outstanding)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Allocations Section */}
      <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
              Applied Supplier Payments ({matchingAllocations.length})
            </h2>
          </div>

          {outstanding > 0 && (
            <button
              onClick={() =>
                navigate(
                  `/supplier-payments/new?supplier_id=${purchase.supplier_id}&purchase_id=${purchase.id}`
                )
              }
              className="text-xs font-bold text-[#1E6B37] hover:underline flex items-center gap-1"
            >
              + Record Payment
            </button>
          )}
        </div>

        {matchingAllocations.length === 0 ? (
          <div className="p-4 bg-[#F7F5F0] rounded-lg text-xs text-[#6B6B6B] text-center">
            No payments have been allocated to this invoice yet.
          </div>
        ) : (
          <div className="space-y-2">
            {matchingAllocations.map((alloc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[#F7F5F0]/50 rounded-lg border border-[#E2DDD5]/60 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-[#4A0E0E]">
                    {alloc.paymentNumber}
                  </span>
                  <span className="text-[#6B6B6B] ml-2">
                    via {alloc.method || 'Direct'} on {alloc.paymentDate}
                  </span>
                  {alloc.notes && (
                    <div className="text-[11px] text-[#6B6B6B] mt-0.5">{alloc.notes}</div>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-[#1E6B37]">
                    {formatINR(alloc.allocatedAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default PurchaseDetailPage;
