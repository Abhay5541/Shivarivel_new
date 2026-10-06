import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Save,
  ArrowLeft,
  AlertCircle,
  Users,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import { useRecordCustomerPayment, useCustomerBalances } from '@/hooks/useFinance';
import { useCustomers } from '@/hooks/useCustomers';
import { customerPaymentFormSchema, PAYMENT_METHODS, type PaymentMethod } from '@/types/finance';

export function CustomerPaymentEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCustomerId = searchParams.get('customer_id') || '';
  const prefillProjectId = searchParams.get('project_id') || '';

  const { data: customers = [] } = useCustomers();
  const { data: projectBalances = [] } = useCustomerBalances();
  const recordPaymentMutation = useRecordCustomerPayment();

  const [customerId, setCustomerId] = useState(prefillCustomerId);
  const [projectId, setProjectId] = useState(prefillProjectId);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Available projects for selected customer (or all projects if no customer selected)
  const availableProjects = useMemo(() => {
    if (!customerId) return projectBalances;
    return projectBalances.filter((p) => p.customer_id === customerId);
  }, [projectBalances, customerId]);

  // Selected project financial balance reference
  const selectedProjectBalance = useMemo(() => {
    if (!projectId) return null;
    return projectBalances.find((p) => p.project_id === projectId) || null;
  }, [projectBalances, projectId]);

  // If project changes, synchronize customerId
  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    if (newProjId) {
      const match = projectBalances.find((p) => p.project_id === newProjId);
      if (match && (!customerId || customerId !== match.customer_id)) {
        setCustomerId(match.customer_id);
      }
    }
  };

  // If customer changes and current project does not belong to customer, reset project
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    if (newCustId && projectId) {
      const match = projectBalances.find((p) => p.project_id === projectId);
      if (match && match.customer_id !== newCustId) {
        setProjectId('');
      }
    }
  };

  // Overpayment check
  const isOverpayment = useMemo(() => {
    if (!selectedProjectBalance || !amount || amount <= 0) return false;
    return amount > selectedProjectBalance.outstanding_amount;
  }, [selectedProjectBalance, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const payload = {
      customer_id: customerId,
      project_id: projectId,
      amount: Number(amount) || 0,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || null,
      notes: notes.trim() || null,
    };

    const validation = customerPaymentFormSchema.safeParse(payload);
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
      await recordPaymentMutation.mutateAsync(payload);
      navigate('/customer-payments');
    } catch {
      setFormErrors({ submit: 'Payment could not be recorded. Please review the details and try again.' });
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Record Customer Payment"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20">
            <CreditCard className="w-3.5 h-3.5" />
            Client Receipt Voucher
          </span>
        }
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/customer-payments')}
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
            {/* 1. Account & Project Selection */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#242424] font-heading flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4A0E0E]" />
                <span>Client & Project Destination</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Customer Account *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className={`w-full h-11 px-3 bg-[#F7F5F0] border rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                      formErrors.customer_id ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                    }`}
                  >
                    <option value="">— Select Customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.customer_id && (
                    <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                      {formErrors.customer_id}
                    </span>
                  )}
                </div>

                {/* Project */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Site / Construction Project *
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className={`w-full h-11 px-3 bg-[#F7F5F0] border rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                      formErrors.project_id ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                    }`}
                  >
                    <option value="">— Select Project Site —</option>
                    {availableProjects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_code} • {p.project_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.project_id && (
                    <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                      {formErrors.project_id}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Payment Transaction Details */}
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#242424] font-heading flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#4A0E0E]" />
                <span>Receipt Inflow Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Receipt Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#242424] text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="e.g. 500000"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className={`w-full h-11 pl-8 pr-3 bg-[#F7F5F0] border rounded-lg text-sm font-mono font-bold text-[#1E6B37] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
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

                {/* Payment Date */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Payment Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`w-full h-11 px-3 bg-[#F7F5F0] border rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] ${
                      formErrors.payment_date ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                    }`}
                  />
                  {formErrors.payment_date && (
                    <span className="text-[11px] text-[#9E2A2B] mt-1 block">
                      {formErrors.payment_date}
                    </span>
                  )}
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

                {/* Reference Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Transaction / Cheque / UTR #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-9988124 or Cheque 002144"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Milestone Description / Site Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Stage 3 first floor slab completion payment received via RTGS"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs sm:text-sm text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Project Financial Context */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                Project Contract Balance Reference
              </h3>

              {selectedProjectBalance ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-[#6B6B6B]">Project Code</div>
                    <div className="font-mono font-bold text-xs text-[#4A0E0E]">
                      {selectedProjectBalance.project_code}
                    </div>
                    <div className="font-bold text-sm text-[#242424] mt-0.5">
                      {selectedProjectBalance.project_name}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD5]/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6B6B]">Contract Agreed Value</span>
                      <span className="font-mono font-bold text-[#242424] tabular-nums">
                        {formatINR(selectedProjectBalance.contract_value)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#1E6B37]">Previous Receipts</span>
                      <span className="font-mono font-bold text-[#1E6B37] tabular-nums">
                        {formatINR(selectedProjectBalance.amount_received)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E2DDD5]/40">
                      <span className="text-[#B86E00] font-semibold">Remaining Customer Balance</span>
                      <span className="font-mono font-bold text-[#B86E00] tabular-nums">
                        {formatINR(selectedProjectBalance.outstanding_amount)}
                      </span>
                    </div>
                  </div>

                  {isOverpayment && (
                    <div className="p-3 bg-[#FEF5E7] border border-[#B86E00]/40 rounded-lg text-xs text-[#B86E00] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Entered receipt (<strong>{formatINR(Number(amount) || 0)}</strong>) exceeds the current remaining balance (<strong>{formatINR(selectedProjectBalance.outstanding_amount)}</strong>).
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#F7F5F0] rounded-lg text-center space-y-2 text-xs text-[#6B6B6B]">
                  <Building2 className="w-6 h-6 mx-auto text-[#8C8880]" />
                  <p>Select a project site to view contract value and remaining customer balance.</p>
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
                <span>{isSaving ? 'Recording Receipt...' : 'Record Customer Payment'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Save Action Bar (360px & 390px Optimized - Sitting above Mobile Bottom Nav) */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-[#E2DDD5] shadow-lg z-30 flex items-center gap-2">
          <Link to="/customer-payments" className="flex-1">
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
            <span>{isSaving ? 'Recording...' : 'Record Payment'}</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
