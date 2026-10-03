import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Printer,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import { useCustomerPayment, useProjectCustomerBalance } from '@/hooks/useFinance';

export function CustomerPaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: payment, isLoading, isError } = useCustomerPayment(id);
  const { data: projectBalance } = useProjectCustomerBalance(payment?.project_id);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 text-center space-y-3">
          <div className="animate-spin w-6 h-6 border-2 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-[#6B6B6B]">Loading payment voucher...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !payment) {
    return (
      <PageContainer>
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Customer payment not found</h3>
          <p className="text-xs text-[#6B6B6B]">The requested customer payment voucher does not exist or was removed.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/customer-payments')}>
            Back to Customer Payments
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Voucher: ${payment.payment_number}`}
        subtitle={`Recorded on ${payment.payment_date} for ${payment.project?.name || 'Project'}`}
        badge={
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              payment.status === 'Confirmed'
                ? 'bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20'
                : payment.status === 'Draft'
                ? 'bg-[#FEF5E7] text-[#B86E00] border border-[#B86E00]/20'
                : 'bg-[#FDF7F7] text-[#9E2A2B] border border-[#9E2A2B]/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {payment.status} Receipt
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#6B6B6B]" />
              <span className="hidden sm:inline">Print Receipt</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/customer-payments')}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Authoritative Receipt Card */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="bg-[#4A0E0E] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#C99A2E]">
                  Shivarivel Construction & Interiors
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading mt-1">
                Official Receipt Voucher
              </h2>
              <p className="text-xs text-white/70 mt-1">
                Voucher No: <span className="font-mono font-bold text-white">{payment.payment_number}</span>
              </p>
            </div>

            <div className="sm:text-right bg-white/10 p-3 sm:p-4 rounded-xl backdrop-blur-xs">
              <span className="text-[11px] uppercase tracking-wider text-white/80 block">
                Amount Received
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#C99A2E] tabular-nums block mt-0.5">
                {formatINR(payment.amount)}
              </span>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-[#E2DDD5]">
              <div className="space-y-4">
                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Received From (Client)
                  </span>
                  <div className="text-base font-bold text-[#242424] font-heading mt-1">
                    {payment.customer?.name}
                  </div>
                  {payment.customer?.phone && (
                    <div className="text-xs text-[#6B6B6B] font-mono mt-0.5">
                      Phone: +91 {payment.customer.phone}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Project / Construction Site
                  </span>
                  <div className="text-sm font-bold text-[#242424] mt-1">
                    {payment.project?.name}
                  </div>
                  <div className="text-xs text-[#4A0E0E] font-mono font-semibold mt-0.5">
                    {payment.project?.project_code}
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:border-l sm:border-[#E2DDD5] sm:pl-6">
                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Receipt Date
                  </span>
                  <div className="text-sm font-semibold text-[#242424] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C99A2E]" />
                    <span>{payment.payment_date}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Payment Method & Reference
                  </span>
                  <div className="text-sm font-semibold text-[#242424] mt-1">
                    {payment.payment_method || 'Direct Receipt'}
                  </div>
                  {payment.reference_number && (
                    <div className="text-xs font-mono text-[#6B6B6B] mt-0.5">
                      Ref: {payment.reference_number}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {payment.notes && (
              <div className="bg-[#F7F5F0] p-4 rounded-xl border border-[#E2DDD5] text-xs space-y-1">
                <span className="text-[11px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
                  Milestone & Operational Notes
                </span>
                <p className="text-[#242424] leading-relaxed whitespace-pre-line">
                  {payment.notes}
                </p>
              </div>
            )}

            {/* Project Financial Standing Snapshot */}
            {projectBalance && (
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                  Project Contract Ledger Balance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-[#F7F5F0] border border-[#E2DDD5] p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#6B6B6B] block uppercase">
                      Contract Value
                    </span>
                    <span className="font-mono font-bold text-sm text-[#242424] mt-0.5 block tabular-nums">
                      {formatINR(projectBalance.contract_value)}
                    </span>
                  </div>

                  <div className="bg-[#EAF5EE] border border-[#1E6B37]/30 p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#1E6B37] block uppercase">
                      Total Received
                    </span>
                    <span className="font-mono font-bold text-sm text-[#1E6B37] mt-0.5 block tabular-nums">
                      {formatINR(projectBalance.amount_received)}
                    </span>
                  </div>

                  <div className="bg-[#FEF5E7] border border-[#B86E00]/30 p-3 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#B86E00] block uppercase">
                      Remaining Balance
                    </span>
                    <span className="font-mono font-bold text-sm text-[#B86E00] mt-0.5 block tabular-nums">
                      {formatINR(projectBalance.outstanding_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Immutability & Audit Footer */}
            <div className="pt-4 border-t border-[#E2DDD5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#6B6B6B]">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#1E6B37]" />
                <span>Confirmed financial receipt. Transaction is immutable under company audit policy.</span>
              </div>
              <div className="font-mono text-[10px]">
                ID: {payment.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
