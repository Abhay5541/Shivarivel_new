import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Receipt,
  Save,
  ArrowLeft,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useRecordExpense, useProjectRecordedCosts } from '@/hooks/useFinance';
import {
  expenseFormSchema,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/types/finance';

export function ExpenseEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProjectId = searchParams.get('project_id') || '';

  const { data: projects = [] } = useProjectRecordedCosts();
  const recordExpenseMutation = useRecordExpense();

  const [category, setCategory] = useState<ExpenseCategory>('Site Transportation');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [projectId, setProjectId] = useState(prefillProjectId);
  const [paidBy, setPaidBy] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const payload = {
      category,
      description: description.trim(),
      amount: Number(amount) || 0,
      expense_date: expenseDate,
      project_id: projectId ? projectId : null,
      paid_by: paidBy.trim() || null,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || null,
      notes: notes.trim() || null,
    };

    const validation = expenseFormSchema.safeParse(payload);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[String(err.path[0])] = err.message;
        }
      });
      setFormErrors(errMap);
      return;
    }

    setIsSaving(true);
    try {
      await recordExpenseMutation.mutateAsync(payload);
      navigate('/expenses');
    } catch {
      setFormErrors({ submit: 'Expense could not be recorded. Please review the details and try again.' });
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Add Expense"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7EFEF] text-[#4A0E0E] border border-[#4A0E0E]/20">
            <Receipt className="w-3.5 h-3.5 text-[#C99A2E]" />
            Expense Voucher
          </span>
        }
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/expenses')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 pb-28 md:pb-8">
        {formErrors.submit && (
          <div className="p-4 bg-[#FDF7F7] border border-[#9E2A2B]/40 rounded-xl flex items-center gap-2 text-xs text-[#9E2A2B]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formErrors.submit}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Categorization & Scope */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#242424] font-heading flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4A0E0E]" />
                <span>Expense Classification & Site Allocation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Expense Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className={`w-full h-11 px-3 bg-[#F7F5F0] border rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                      formErrors.category ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                    }`}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                      {formErrors.category}
                    </span>
                  )}
                </div>

                {/* Project Allocation */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Job Site Allocation (Optional)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                  >
                    <option value="">— General Company Overhead (No Site) —</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_code} • {p.project_name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                    {projectId
                      ? 'Allocates to Recorded Project Cost for this job site'
                      : 'Logged as general head office business overhead'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Expense Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scaffolding pipe hire for 3 days or Diesel for site generator"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full h-11 px-3 bg-[#F7F5F0] border rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                    formErrors.description ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                  }`}
                />
                {formErrors.description && (
                  <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                    {formErrors.description}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Transaction Details */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#242424] font-heading flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#4A0E0E]" />
                <span>Payment & Verification Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#242424] text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="e.g. 15000"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className={`w-full h-11 pl-8 pr-3 bg-[#F7F5F0] border rounded-lg text-sm font-mono font-bold text-[#242424] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                        formErrors.amount ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                      }`}
                    />
                  </div>
                  {formErrors.amount && (
                    <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                      {formErrors.amount}
                    </span>
                  )}
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className={`w-full h-11 px-3 bg-[#F7F5F0] border rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                      formErrors.expense_date ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                    }`}
                  />
                  {formErrors.expense_date && (
                    <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                      {formErrors.expense_date}
                    </span>
                  )}
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Paid By (Staff / Maistry Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K. Senthil Nathan (Supervisor)"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-11 px-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Receipt / Bill / Voucher Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILL-9821 or UPI Ref 44102914"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full h-11 px-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any operational remarks or supplier agency details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Financial Guidance Card */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                Financial Cost Allocation
              </h3>

              <div className="p-3.5 bg-[#F7F5F0] rounded-lg border border-[#E2DDD5] space-y-2 text-xs">
                <span className="font-bold text-[#4A0E0E] block">
                  Recorded Project Cost Policy:
                </span>
                <p className="text-[#6B6B6B] leading-relaxed text-[11px]">
                  Site-allocated expenses are combined directly with <strong>Material Purchases</strong> and <strong>Employee Wages</strong> to form the project's cumulative <strong>Recorded Project Cost</strong>.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed text-[11px] pt-1 border-t border-[#E2DDD5]">
                  Overhead expenses without site allocation are tracked separately under company operating overhead.
                </p>
              </div>

              {projectId && (
                <div className="p-3 bg-[#EAF5EE] border border-[#1E6B37]/30 rounded-lg text-xs space-y-1">
                  <div className="text-[10px] text-[#1E6B37] font-bold uppercase">
                    Site Allocation Active
                  </div>
                  <div className="font-semibold text-[#242424]">
                    {projects.find((p) => p.project_id === projectId)?.project_name}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Save Button */}
            <div className="hidden md:block">
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="w-full h-11 font-bold text-sm gap-2 shadow-xs"
              >
                <Save className="w-4 h-4 text-[#C99A2E]" />
                <span>{isSaving ? 'Saving Expense...' : 'Save Expense'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Save Action Bar (360px & 390px Optimized - Above Mobile Bottom Nav) */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-[#E2DDD5] shadow-lg z-30 flex items-center gap-2">
          <Link to="/expenses" className="flex-1">
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
            <span>{isSaving ? 'Saving...' : 'Save Expense'}</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
