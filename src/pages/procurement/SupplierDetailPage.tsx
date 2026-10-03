import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Edit2,
  ShoppingCart,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import {
  useSupplier,
  useSupplierBalance,
  usePurchases,
  useSupplierPayments,
} from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export const SupplierDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'purchases' | 'payments'>('purchases');

  const { data: supplier, isLoading: isLoadingSupplier, isError, error, refetch } = useSupplier(id);
  const { data: balance, isLoading: isLoadingBalance } = useSupplierBalance(id);
  const { data: purchases = [], isLoading: isLoadingPurchases } = usePurchases({ supplier_id: id });
  const { data: payments = [], isLoading: isLoadingPayments } = useSupplierPayments(id);

  if (isLoadingSupplier || isLoadingBalance) {
    return (
      <div className="space-y-6 pb-20">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="space-y-6 pb-20">
        <button
          onClick={() => navigate('/suppliers')}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Suppliers
        </button>
        <ErrorState
          title="Supplier not found"
          description={error instanceof Error ? error.message : 'Unable to retrieve vendor profile.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const outstanding = balance?.outstanding_balance ?? 0;
  const totalPurchases = balance?.total_purchases ?? 0;
  const totalAllocated = balance?.total_allocated_payments ?? 0;
  const supplierCredit = balance?.supplier_credit ?? 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/suppliers')}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Suppliers
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/suppliers/${id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs font-semibold text-[#242424] hover:bg-[#F7F5F0] transition-colors min-h-[40px]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
          <button
            onClick={() => navigate(`/purchases/new?supplier_id=${id}`)}
            className="inline-flex items-center gap-1.5 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            + New Purchase
          </button>
          <button
            onClick={() => navigate(`/supplier-payments/new?supplier_id=${id}`)}
            className="inline-flex items-center gap-1.5 bg-[#1E6B37] hover:bg-[#16522A] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Supplier Identity Card */}
      <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DDD5]/70 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5]">
                {supplier.category || 'General Vendor'}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  supplier.status === 'active'
                    ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {supplier.status === 'active' ? 'Active Vendor' : 'Inactive'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#242424] font-heading">
              {supplier.name}
            </h1>

            {supplier.address && (
              <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                {supplier.address}
              </p>
            )}
          </div>

          {/* Quick Balance Snapshot */}
          <div className="bg-[#F7F5F0] border border-[#E2DDD5] p-3.5 sm:p-4 rounded-xl shrink-0 text-left md:text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Outstanding Payable
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 tabular-nums ${
                outstanding > 0 ? 'text-[#A84B14]' : 'text-[#1E6B37]'
              }`}
            >
              {formatINR(outstanding)}
            </p>
            {supplierCredit > 0 && (
              <span className="text-[10px] font-semibold text-[#1E6B37] block mt-0.5">
                Supplier Credit: {formatINR(supplierCredit)}
              </span>
            )}
          </div>
        </div>

        {/* Contact Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[#6B6B6B]">
          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Contact Person
            </span>
            <span className="text-[#242424] font-medium block mt-0.5">
              {supplier.contact_person || 'Not recorded'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Phone Numbers
            </span>
            <div className="mt-0.5 space-y-0.5">
              {supplier.phone ? (
                <div className="font-mono text-[#242424] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#C99A2E]" />
                  +91 {supplier.phone}
                </div>
              ) : (
                '—'
              )}
              {supplier.alternate_phone && (
                <div className="font-mono text-[11px] text-[#6B6B6B]">
                  Alt: +91 {supplier.alternate_phone}
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              GST Registration
            </span>
            <span className="font-mono font-bold text-[#242424] block mt-0.5">
              {supplier.gst_number || 'Unregistered / Not provided'}
            </span>
          </div>
        </div>

        {supplier.notes && (
          <div className="pt-3 border-t border-[#E2DDD5]/60 text-xs text-[#6B6B6B]">
            <span className="font-semibold text-[#242424]">Credit & Operational Terms: </span>
            {supplier.notes}
          </div>
        )}
      </div>

      {/* 4 Financial Context Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Total Purchases
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#242424] mt-2 tabular-nums">
            {formatINR(totalPurchases)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            {purchases.length} invoices recorded
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Total Payments
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#1E6B37] mt-2 tabular-nums">
            {formatINR(totalAllocated)}
          </p>
          <span className="text-[10px] text-[#1E6B37]/80 mt-0.5 block">
            {payments.length} payment entries
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Outstanding Due
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#A84B14] mt-2 tabular-nums">
            {formatINR(outstanding)}
          </p>
          <span className="text-[10px] text-[#A84B14]/80 mt-0.5 block">
            Pending invoices balance
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Supplier Credit
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#1E6B37] mt-2 tabular-nums">
            {formatINR(supplierCredit)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            Unallocated advances
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E2DDD5]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
              activeTab === 'purchases'
                ? 'border-[#4A0E0E] text-[#4A0E0E]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchases & Invoices ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-[#4A0E0E] text-[#4A0E0E]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payment History & Allocations ({payments.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {isLoadingPurchases ? (
            <TableSkeleton rows={3} />
          ) : purchases.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="w-6 h-6" />}
              title="No purchases recorded yet"
              description="Record your first material delivery or supplier bill for this vendor."
              actionLabel="Add Purchase"
              onAction={() => navigate(`/purchases/new?supplier_id=${id}`)}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  <tr>
                    <th className="py-3 px-4">Purchase / Invoice</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Date & Due</th>
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
                            <span className="text-[#6B6B6B]">General Overhead</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] text-[#242424]">{p.purchase_date}</div>
                          {p.due_date && (
                            <div className="text-[10px] text-[#6B6B6B] font-mono">
                              Due: {p.due_date}
                            </div>
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
          )}
        </div>
      )}

      {/* TAB 2: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {isLoadingPayments ? (
            <TableSkeleton rows={3} />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-6 h-6" />}
              title="No payments posted yet"
              description="Record a settlement payment and allocate it against outstanding bills."
              actionLabel="Record Payment"
              onAction={() => navigate(`/supplier-payments/new?supplier_id=${id}`)}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  <tr>
                    <th className="py-3 px-4">Payment #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4 text-right">Payment Amount</th>
                    <th className="py-3 px-4 text-right">Allocated</th>
                    <th className="py-3 px-4 text-right">Supplier Credit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/60">
                  {payments.map((sp) => {
                    const unallocated = sp.unallocated_amount ?? 0;
                    return (
                      <tr key={sp.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#4A0E0E]">
                          {sp.payment_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#242424]">
                          {sp.payment_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#242424] block">
                            {sp.payment_method || 'Direct'}
                          </span>
                          {sp.reference_number && (
                            <span className="font-mono text-[10px] text-[#6B6B6B]">
                              Ref: {sp.reference_number}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E6B37]">
                          {formatINR(sp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#242424]">
                          {formatINR(sp.total_allocated ?? sp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1E6B37]">
                          {unallocated > 0 ? formatINR(unallocated) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E6B37]/10 text-[#1E6B37]">
                            {sp.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SupplierDetailPage;
