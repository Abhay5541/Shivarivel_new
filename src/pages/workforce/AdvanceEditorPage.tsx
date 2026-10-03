import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  HandCoins,
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
  useCreateEmployeeAdvance,
  getTodayDateString,
} from '@/hooks/useWorkforce';
import {
  PAYMENT_METHODS,
  advanceFormSchema,
  type AdvanceFormData,
} from '@/types/workforce';

export function AdvanceEditorPage() {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees({ status: 'active' });
  const createAdvanceMutation = useCreateEmployeeAdvance();

  const [formData, setFormData] = useState<AdvanceFormData>({
    employee_id: '',
    advance_date: getTodayDateString(),
    amount: 2000,
    payment_method: 'Cash',
    reference_number: '',
    purpose: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    field: keyof AdvanceFormData,
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

    const validation = advanceFormSchema.safeParse(formData);
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
      await createAdvanceMutation.mutateAsync(validation.data);
      navigate('/advances');
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to record employee advance. Please review details and try again.'
      );
    }
  };

  const isSaving = createAdvanceMutation.isPending;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Record Employee Advance"
        subtitle="Disburse emergency cash, tool purchase loan, or festival advance to site worker"
        badge={
          <Badge variant="primary" className="gap-1">
            <HandCoins className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Worker Advance</span>
          </Badge>
        }
        actions={
          <Link to="/advances">
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
            <HandCoins className="w-4 h-4 text-[#4A0E0E]" />
            Advance Disbursement Details
          </h2>

          {/* Select Employee */}
          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Select Employee <span className="text-[#9E2A2B]">*</span>
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
                <option value="">— Select field worker from active roster —</option>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Advance Amount */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Advance Amount (₹) <span className="text-[#9E2A2B]">*</span>
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
                  placeholder="e.g. 3000"
                  className={`w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border rounded-lg text-base text-[#242424] font-bold focus:outline-none focus:border-[#4A0E0E] ${
                    errors.amount ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.amount}</p>}
            </div>

            {/* Advance Date */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Advance Date <span className="text-[#9E2A2B]">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="date"
                  value={formData.advance_date}
                  onChange={(e) => handleChange('advance_date', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E] ${
                    errors.advance_date ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                  }`}
                />
              </div>
              {errors.advance_date && (
                <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.advance_date}</p>
              )}
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
                    handleChange('payment_method', e.target.value as AdvanceFormData['payment_method'])
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

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Voucher / UPI Ref Number
              </label>
              <input
                type="text"
                value={formData.reference_number || ''}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                placeholder="e.g. SLIP-0930 or UPI-782910"
                className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Advance Purpose
            </label>
            <input
              type="text"
              value={formData.purpose || ''}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="e.g. Emergency family medical assistance / tool purchase / festival advance"
              className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Internal Recovery Agreement Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="e.g. Agreed to deduct Rs. 1000 from each bi-weekly wage disbursement..."
              className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
            />
          </div>
        </div>

        {/* Desktop Save Action */}
        <div className="hidden md:flex justify-end gap-3">
          <Link to="/advances">
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
            <span>{isSaving ? 'Recording...' : 'Disburse Advance'}</span>
          </Button>
        </div>

        {/* Sticky Mobile Save Action Bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-[#E2DDD5] shadow-lg z-30 flex items-center gap-2">
          <Link to="/advances" className="flex-1">
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
            <span>{isSaving ? 'Recording...' : 'Save Advance'}</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
