import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Wallet,
  IndianRupee,
  Calendar,
  Users2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useEmployees,
  useRecordEmployeePayment,
  getTodayDateString,
} from '@/hooks/useWorkforce';
import {
  PAYMENT_METHODS,
  employeePaymentFormSchema,
  type EmployeePaymentFormData,
} from '@/types/workforce';
import { formatINR } from '@/lib/utils';

export function EmployeePaymentEditorPage() {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees({ status: 'active' });
  const recordPaymentMutation = useRecordEmployeePayment();

  const [formData, setFormData] = useState<EmployeePaymentFormData>({
    employee_id: '',
    payment_date: getTodayDateString(),
    amount: 5000,
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: '',
    allocation_target: 'wages',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedEmployee = employees.find((e) => e.id === formData.employee_id);

  const handleChange = (
    field: keyof EmployeePaymentFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = employeePaymentFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync(validation.data);
      navigate('/employee-payments');
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to record employee payment. Please review details and try again.'
      );
    }
  };

  const isSaving = recordPaymentMutation.isPending;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Record Employee Payment"
        badge={
          <Badge variant="primary" className="gap-1">
            <Wallet className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Wage Disbursement</span>
          </Badge>
        }
        actions={
          <Link to="/employee-payments">
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
          </Link>
        }
      />

      {submitError && (
        <div className="p-4 bg-[#F7EFEF] border border-[#9E2A2B]/30 rounded-xl flex items-center gap-3 text-xs text-[#9E2A2B]">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#9E2A2B]" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl pb-24 md:pb-6">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider font-heading flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#4A0E0E]" />
            Payment Transaction Details
          </h2>

          {/* Select Employee */}
          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Select Field Worker <span className="text-[#9E2A2B]">*</span>
            </label>
            <div className="relative">
              <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <select
                value={formData.employee_id}
                onChange={(e) => handleChange('employee_id', e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 bg-[#F7F5F0] border rounded-lg text-sm text-[#242424] font-medium focus:outline-none focus:border-[#4A0E0E] ${
                  errors.employee_id ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                }`}
              >
                <option value="">— Select employee to disburse payout —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code}) — {emp.worker_type}
                  </option>
                ))}
              </select>
            </div>
            {errors.employee_id && (
              <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.employee_id}</p>
            )}
          </div>

          {/* Real-time Balances Reference (Strict Rule 18 Non-Netting) */}
          {selectedEmployee && (
            <div className="p-3.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-[#E2DDD5]/70">
                <span className="text-[11px] font-bold text-[#B86E00] uppercase tracking-wider block">
                  Current Wage Payable
                </span>
                <span className="text-lg font-bold text-[#242424] tabular-nums mt-0.5 block">
                  {formatINR(selectedEmployee.wage_payable || 0)}
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Unliquidated shift earnings</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#E2DDD5]/70">
                <span className="text-[11px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
                  Advance Outstanding
                </span>
                <span className="text-lg font-bold text-[#242424] tabular-nums mt-0.5 block">
                  {formatINR(selectedEmployee.advance_outstanding || 0)}
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Separate loan balance</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Disbursement Amount <span className="text-[#9E2A2B]">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    handleChange('amount', e.target.value ? Number(e.target.value) : 0)
                  }
                  placeholder="e.g. 5000"
                  className={`w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border rounded-lg text-base text-[#242424] font-bold focus:outline-none focus:border-[#4A0E0E] ${
                    errors.amount ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.amount}</p>}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Payment Date <span className="text-[#9E2A2B]">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleChange('payment_date', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E] ${
                    errors.payment_date ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                  }`}
                />
              </div>
              {errors.payment_date && (
                <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.payment_date}</p>
              )}
            </div>
          </div>

          {/* Allocation Target: Wage vs Advance Recovery */}
          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1.5">
              Payment Settlement Purpose <span className="text-[#9E2A2B]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-colors ${
                  formData.allocation_target === 'wages'
                    ? 'border-[#1E6B37] bg-[#EAF5EE]'
                    : 'border-[#E2DDD5] bg-[#F7F5F0]'
                }`}
              >
                <input
                  type="radio"
                  name="allocation_target"
                  checked={formData.allocation_target === 'wages'}
                  onChange={() => handleChange('allocation_target', 'wages')}
                  className="mt-0.5 text-[#1E6B37] focus:ring-[#1E6B37]"
                />
                <div>
                  <div className="font-bold text-xs text-[#242424]">Wage Disbursement Settlement</div>
                  <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Disburse verified earnings for logged site attendance shifts.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-colors ${
                  formData.allocation_target === 'advance_recovery'
                    ? 'border-[#C99A2E] bg-[#FEF5E7]'
                    : 'border-[#E2DDD5] bg-[#F7F5F0]'
                }`}
              >
                <input
                  type="radio"
                  name="allocation_target"
                  checked={formData.allocation_target === 'advance_recovery'}
                  onChange={() => handleChange('allocation_target', 'advance_recovery')}
                  className="mt-0.5 text-[#C99A2E] focus:ring-[#C99A2E]"
                />
                <div>
                  <div className="font-bold text-xs text-[#242424]">Advance Loan Recovery Repayment</div>
                  <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Recover emergency loan balance from worker settlement.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Disbursement Mode
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    handleChange('payment_method', e.target.value as EmployeePaymentFormData['payment_method'])
                  }
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Voucher / Reference / UTR Number
              </label>
              <input
                type="text"
                value={formData.reference_number || ''}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                placeholder="e.g. NEFT-99102 or CASH-VCH-01"
                className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Disbursement Notes / Muster Period
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="e.g. Fortnightly wage payout for Sept 1-15, signed on site muster roll..."
              className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
            />
          </div>
        </div>

        {/* Desktop Save Action */}
        <div className="hidden md:flex justify-end gap-3">
          <Link to="/employee-payments">
            <Button variant="outline" type="button" className="h-10 px-6 font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="h-10 px-8 font-semibold gap-2"
          >
            <Save className="w-4 h-4 text-[#C99A2E]" />
            <span>{isSaving ? 'Processing...' : 'Disburse Payment'}</span>
          </Button>
        </div>

        {/* Sticky Mobile Save Action Bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-[#E2DDD5] shadow-lg z-30 flex items-center gap-2">
          <Link to="/employee-payments" className="flex-1">
            <Button variant="outline" type="button" className="w-full h-12 text-sm font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="flex-1 h-12 text-sm font-semibold gap-2"
          >
            <Save className="w-4 h-4 text-[#C99A2E]" />
            <span>{isSaving ? 'Saving...' : 'Disburse'}</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
