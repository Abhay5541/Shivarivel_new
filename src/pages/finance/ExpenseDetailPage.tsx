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
import { useExpense } from '@/hooks/useFinance';

export function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: expense, isLoading, isError } = useExpense(id);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 text-center space-y-3">
          <div className="animate-spin w-6 h-6 border-2 border-[#4A0E0E] border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-[#6B6B6B]">Loading expense voucher...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !expense) {
    return (
      <PageContainer>
        <div className="bg-[#FDF7F7] border border-[#9E2A2B]/30 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9E2A2B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">Expense not found</h3>
          <p className="text-xs text-[#6B6B6B]">The requested expense record does not exist or was removed.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/expenses')}>
            Back to Expenses
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Voucher: ${expense.expense_number}`}
        subtitle={`Recorded on ${expense.expense_date} • ${expense.category}`}
        badge={
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              expense.status === 'Confirmed'
                ? 'bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20'
                : expense.status === 'Draft'
                ? 'bg-[#FEF5E7] text-[#B86E00] border border-[#B86E00]/20'
                : 'bg-[#FDF7F7] text-[#9E2A2B] border border-[#9E2A2B]/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {expense.status} Expense
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
              <span className="hidden sm:inline">Print Voucher</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/expenses')}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          {/* Top Banner */}
          <div className="bg-[#242424] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#C99A2E]">
                Operational Expense Voucher
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-heading mt-1">
                {expense.category}
              </h2>
              <p className="text-xs text-white/70 mt-1 font-mono">
                Voucher #: <strong>{expense.expense_number}</strong>
              </p>
            </div>

            <div className="sm:text-right bg-white/10 p-3 sm:p-4 rounded-xl backdrop-blur-xs">
              <span className="text-[11px] uppercase tracking-wider text-white/80 block">
                Disbursed Amount
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums block mt-0.5">
                {formatINR(expense.amount)}
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Description Block */}
            <div className="space-y-1.5 pb-6 border-b border-[#E2DDD5]">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Expense Purpose / Description
              </span>
              <p className="text-sm sm:text-base font-semibold text-[#242424] leading-relaxed">
                {expense.description}
              </p>
            </div>

            {/* Coordinates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-[#E2DDD5]">
              <div className="space-y-4">
                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Cost Allocation
                  </span>
                  {expense.project ? (
                    <div className="mt-1">
                      <div className="text-sm font-bold text-[#242424]">
                        {expense.project.name}
                      </div>
                      <div className="text-xs font-mono font-semibold text-[#4A0E0E]">
                        {expense.project.project_code}
                      </div>
                      <span className="inline-block mt-1 text-[11px] text-[#1E6B37] font-medium bg-[#EAF5EE] px-2 py-0.5 rounded">
                        Recorded Project Cost
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="text-sm font-bold text-[#242424]">
                        General Company Overhead
                      </div>
                      <span className="inline-block mt-1 text-[11px] text-[#6B6B6B] font-medium bg-[#EFECE6] px-2 py-0.5 rounded">
                        Administrative Outflow
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Disbursed By
                  </span>
                  <div className="text-sm font-semibold text-[#242424] mt-1">
                    {expense.paid_by || 'Field Supervisor / Petty Cash'}
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:border-l sm:border-[#E2DDD5] sm:pl-6">
                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Expense Date
                  </span>
                  <div className="text-sm font-semibold text-[#242424] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C99A2E]" />
                    <span>{expense.expense_date}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#6B6B6B] block uppercase tracking-wider text-[10px] font-semibold">
                    Payment Method & Reference
                  </span>
                  <div className="text-sm font-semibold text-[#242424] mt-1">
                    {expense.payment_method || 'Cash / Field Voucher'}
                  </div>
                  {expense.reference_number && (
                    <div className="text-xs font-mono text-[#6B6B6B] mt-0.5">
                      Ref: {expense.reference_number}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {expense.notes && (
              <div className="bg-[#F7F5F0] p-4 rounded-xl border border-[#E2DDD5] text-xs space-y-1">
                <span className="text-[11px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
                  Additional Remarks
                </span>
                <p className="text-[#242424] leading-relaxed whitespace-pre-line">
                  {expense.notes}
                </p>
              </div>
            )}

            {/* Audit Notice */}
            <div className="pt-4 border-t border-[#E2DDD5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#6B6B6B]">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#1E6B37]" />
                <span>Confirmed operational expenditure. Immutable financial record under Rule 18.</span>
              </div>
              <div className="font-mono text-[10px]">
                ID: {expense.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
