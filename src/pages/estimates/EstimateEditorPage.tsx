import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Save,
  Calculator,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useEnquiries } from '@/hooks/useEnquiries';
import { useEstimate, useCreateEstimate, useUpdateEstimate } from '@/hooks/useEstimates';
import { EstimateLineItemRow } from '@/components/estimates/EstimateLineItemRow';
import { EstimateLineItemCard } from '@/components/estimates/EstimateLineItemCard';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import {
  ESTIMATE_CATEGORIES,
  numberToIndianWords,
  type EstimateFormData,
  type EstimateItemFormData,
  type EstimateStatus,
} from '@/types/estimates';

export const EstimateEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  // Existing estimate query if editing
  const { data: existingEstimate, isLoading: isEstimateLoading } = useEstimate(id);

  // Customers & Enquiries lookups
  const { data: customers = [] } = useCustomers();
  const { data: allEnquiries = [] } = useEnquiries();

  // Mutations
  const createEstimateMutation = useCreateEstimate();
  const updateEstimateMutation = useUpdateEstimate();

  // Pre-fill parameters from URL
  const paramCustomerId = searchParams.get('customer_id') || '';
  const paramEnquiryId = searchParams.get('enquiry_id') || '';

  // Form State
  const [customerId, setCustomerId] = useState<string>(paramCustomerId);
  const [enquiryId, setEnquiryId] = useState<string>(paramEnquiryId);
  const [title, setTitle] = useState<string>('');
  const [estimateDate, setEstimateDate] = useState<string>('2026-10-02');
  const [validUntil, setValidUntil] = useState<string>('2026-11-01');
  const [status, setStatus] = useState<EstimateStatus>('Draft');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<EstimateItemFormData[]>([
    {
      category: 'Interior',
      description: '',
      quantity: 1,
      unit: 'sq.ft',
      unit_price: 0,
      amount: 0,
      sort_order: 1,
      notes: null,
    },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill if editing existing estimate
  useEffect(() => {
    if (existingEstimate) {
      setCustomerId(existingEstimate.customer_id);
      setEnquiryId(existingEstimate.enquiry_id || '');
      setTitle(existingEstimate.title || '');
      setEstimateDate(existingEstimate.estimate_date);
      setValidUntil(existingEstimate.valid_until || '');
      setStatus(existingEstimate.status);
      setNotes(existingEstimate.notes || '');
      if (existingEstimate.items && existingEstimate.items.length > 0) {
        setItems(
          existingEstimate.items.map((i) => ({
            id: i.id,
            category: i.category,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
            amount: i.amount,
            sort_order: i.sort_order,
            notes: i.notes,
          }))
        );
      }
    }
  }, [existingEstimate]);

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  // Customer-scoped enquiries
  const customerEnquiries = useMemo(() => {
    if (!customerId) return [];
    return allEnquiries.filter((e) => e.customer_id === customerId);
  }, [allEnquiries, customerId]);

  // Calculate live total
  const calculatedTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  // Handle validity period presets
  const handleValidityPreset = (days: number) => {
    const base = new Date(estimateDate);
    base.setDate(base.getDate() + days);
    setValidUntil(base.toISOString().split('T')[0]);
  };

  // Line item handlers
  const handleItemChange = (index: number, updated: EstimateItemFormData) => {
    const newItems = [...items];
    newItems[index] = updated;
    setItems(newItems);
  };

  const handleAddItem = (categoryOverride?: typeof ESTIMATE_CATEGORIES[number]) => {
    setItems([
      ...items,
      {
        category: categoryOverride || 'Material',
        description: '',
        quantity: 1,
        unit: 'sq.ft',
        unit_price: 0,
        amount: 0,
        sort_order: items.length + 1,
        notes: null,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSave = async (submitStatus: EstimateStatus) => {
    setFormError(null);

    if (!customerId) {
      setFormError('Please select a customer for this estimate.');
      return;
    }

    if (!title.trim()) {
      setFormError('Please enter an estimate title or project scope heading.');
      return;
    }

    if (items.length === 0) {
      setFormError('At least one line item is required.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        setFormError(`Item #${i + 1} requires a valid work description.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setFormError(`Item #${i + 1} quantity must be greater than zero.`);
        return;
      }
      if (items[i].unit_price < 0) {
        setFormError(`Item #${i + 1} unit price cannot be negative.`);
        return;
      }
    }

    const payload: EstimateFormData = {
      customer_id: customerId,
      enquiry_id: enquiryId || null,
      estimate_date: estimateDate,
      valid_until: validUntil || null,
      title: title.trim(),
      notes: notes.trim() || null,
      status: submitStatus,
      items,
    };

    try {
      if (isEditing && id) {
        await updateEstimateMutation.mutateAsync({ id, data: payload });
        navigate(`/estimates/${id}`);
      } else {
        const created = await createEstimateMutation.mutateAsync(payload);
        navigate(`/estimates/${created.id}`);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save estimate. Please try again.');
    }
  };

  if (isEditing && isEstimateLoading) {
    return (
      <div className="p-8 text-center text-xs text-[#6B6B6B]">
        Loading estimate details...
      </div>
    );
  }

  const isSaving =
    createEstimateMutation.isPending || updateEstimateMutation.isPending;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/estimates')}
            className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Estimates
          </button>
          <h1 className="text-2xl font-bold text-[#242424] font-heading">
            {isEditing ? `Edit Estimate (${existingEstimate?.estimate_number || 'Draft'})` : 'New Estimate'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/estimates')}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSave('Draft')}
            disabled={isSaving}
            className="cursor-pointer"
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => handleSave(status === 'Draft' ? 'Sent' : status)}
            disabled={isSaving}
            className="cursor-pointer min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : isEditing ? 'Update & Preview' : 'Save & Review'}
          </Button>
        </div>
      </div>

      {/* Validation Banner */}
      {formError && (
        <div className="p-4 bg-[#FCE8E6] border border-[#C5221F]/30 rounded-xl flex items-center gap-3 text-xs text-[#C5221F]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: Customer & Estimate Coordinates */}
      <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-[#242424] font-heading flex items-center gap-2">
          <User className="w-4 h-4 text-[#C99A2E]" />
          Client & Quotation Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer Selection */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
              Customer / Client *
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setEnquiryId('');
              }}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden font-medium min-h-[42px]"
              required
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer?.address && (
              <p className="text-[11px] text-[#6B6B6B] truncate mt-1">
                Site: {selectedCustomer.address}
              </p>
            )}
          </div>

          {/* Linked Enquiry */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
              Linked Business Enquiry (Optional)
            </label>
            <select
              value={enquiryId}
              onChange={(e) => setEnquiryId(e.target.value)}
              disabled={!customerId}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden disabled:bg-[#F7F5F0] min-h-[42px]"
            >
              <option value="">-- General Quote / No linked enquiry --</option>
              {customerEnquiries.map((enq) => (
                <option key={enq.id} value={enq.id}>
                  {(enq.description || 'General Enquiry Scope').slice(0, 45)}... ({enq.status})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
              Proposal Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EstimateStatus)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden font-semibold min-h-[42px]"
            >
              <option value="Draft">Draft (Internal Working Proposal)</option>
              <option value="Sent">Sent (Submitted to Customer)</option>
              <option value="Approved">Approved (Client Agreed to Terms)</option>
              <option value="Accepted">Accepted (Formal Work Order)</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
              <option value="Converted">Converted to Project</option>
            </select>
          </div>

          {/* Estimate Title */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
              Estimate Scope Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3BHK Villa Complete Interior Woodwork & Modular Kitchen"
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden font-medium min-h-[42px]"
              required
            />
          </div>

          {/* Estimate Date */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
              Estimate Date *
            </label>
            <input
              type="date"
              value={estimateDate}
              onChange={(e) => setEstimateDate(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[42px]"
              required
            />
          </div>

          {/* Valid Until & Presets */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                Validity Expiry Date
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-[#8C8880]">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleValidityPreset(15)}
                  className="text-[#4A0E0E] hover:underline font-semibold cursor-pointer"
                >
                  15 Days
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleValidityPreset(30)}
                  className="text-[#4A0E0E] hover:underline font-semibold cursor-pointer"
                >
                  30 Days
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleValidityPreset(60)}
                  className="text-[#4A0E0E] hover:underline font-semibold cursor-pointer"
                >
                  60 Days
                </button>
              </div>
            </div>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[42px]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Bill of Quantities (Work Line Items) */}
      <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2DDD5]/60">
          <div>
            <h2 className="text-sm font-bold text-[#242424] font-heading flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C99A2E]" />
              Bill of Quantities (Line Items)
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Enter proposed specifications, measured quantities, and unit rates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddItem()}
              className="cursor-pointer min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#4A0E0E]" />
              + Add Line Item
            </Button>
          </div>
        </div>

        {/* Desktop Table View (>=768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-9 bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                <th className="py-2 px-3 text-center w-10">#</th>
                <th className="py-2 px-2 w-36">Category</th>
                <th className="py-2 px-2">Work Description / Specification</th>
                <th className="py-2 px-2 w-24 text-right">Qty</th>
                <th className="py-2 px-2 w-28">Unit</th>
                <th className="py-2 px-2 w-28 text-right">Rate (₹)</th>
                <th className="py-2 px-3 w-32 text-right">Amount (₹)</th>
                <th className="py-2 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <EstimateLineItemRow
                  key={index}
                  index={index}
                  item={item}
                  onChange={handleItemChange}
                  onRemove={handleRemoveItem}
                  canRemove={items.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (<768px, verified at 360px & 390px) */}
        <div className="md:hidden space-y-3">
          {items.map((item, index) => (
            <EstimateLineItemCard
              key={index}
              index={index}
              item={item}
              onChange={handleItemChange}
              onRemove={handleRemoveItem}
              canRemove={items.length > 1}
            />
          ))}
        </div>

        {/* Add item button at bottom of list */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleAddItem()}
            className="w-full py-3 border-2 border-dashed border-[#E2DDD5] hover:border-[#4A0E0E] hover:bg-[#F7F5F0]/50 rounded-xl text-xs font-bold text-[#4A0E0E] flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[48px]"
          >
            <Plus className="w-4 h-4" />
            Add Another Work Item
          </button>
        </div>
      </div>

      {/* SECTION 3: Commercial Total & Indian Words */}
      <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
            Total Proposed Quotation Value
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#242424]">
            {formatINR(calculatedTotal)}
          </div>
        </div>

        <div className="p-3 bg-[#F9F3E5] border border-[#C99A2E]/40 rounded-lg text-xs flex items-start gap-2 text-[#4A0E0E]">
          <Sparkles className="w-4 h-4 text-[#C99A2E] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-[#6B6B6B]">
              In Words (Indian Currency Standard):
            </span>
            <span className="font-semibold text-xs text-[#242424]">
              {numberToIndianWords(calculatedTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: Scope Conditions & Notes */}
      <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-[#242424] font-heading">
          Scope Conditions, Payment Milestones & Exclusions
        </h2>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Rate includes materials, transport, labor, and 1-year complimentary service warranty. 40% advance on signing, 40% on carcass completion, 20% on handover."
          className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-3 focus:border-[#4A0E0E] focus:outline-hidden resize-none"
        />
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2DDD5] py-3 px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <span className="text-[11px] text-[#6B6B6B] block">Total Amount</span>
            <span className="font-mono font-bold text-lg text-[#242424]">
              {formatINR(calculatedTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/estimates')}
              className="cursor-pointer min-h-[44px]"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={() => handleSave(status === 'Draft' ? 'Sent' : status)}
              disabled={isSaving}
              className="cursor-pointer min-h-[44px] flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : isEditing ? 'Update Estimate' : 'Save & Review Proposal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
