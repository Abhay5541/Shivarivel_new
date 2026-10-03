import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Receipt,
  Save,
  CreditCard,
  Package,
} from 'lucide-react';
import {
  purchaseFormSchema,
  type PurchaseFormData,
  PAYMENT_METHODS,
  MATERIAL_UNITS,
} from '@/types/procurement';
import {
  useSuppliers,
  useMaterials,
  useCreatePurchase,
} from '@/hooks/useProcurement';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';

export const PurchaseEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplierId = searchParams.get('supplier_id') || '';
  const preselectedProjectId = searchParams.get('project_id') || '';

  const { data: suppliers = [] } = useSuppliers();
  const { data: materials = [] } = useMaterials();
  const { data: projects = [] } = useProjects();
  const createPurchaseMutation = useCreatePurchase();

  const [formGeneralError, setFormGeneralError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema) as any,
    defaultValues: {
      supplier_id: preselectedSupplierId,
      project_id: preselectedProjectId || null,
      invoice_number: '',
      purchase_date: new Date().toISOString().split('T')[0],
      due_date: '',
      discount: 0,
      tax: 0,
      notes: '',
      items: [
        {
          material_id: '',
          description: '',
          quantity: 1,
          unit: 'Nos',
          unit_price: 0,
          notes: '',
        },
      ],
      record_initial_payment: false,
      initial_payment_amount: 0,
      initial_payment_method: 'Bank Transfer (NEFT / RTGS)',
      initial_payment_reference: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount') || 0;
  const watchedTax = watch('tax') || 0;
  const watchedRecordPayment = watch('record_initial_payment');

  // Compute live totals for UX feedback
  const { itemsSubtotal, finalTotal } = useMemo(() => {
    const subtotal = (watchedItems || []).reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.unit_price) || 0;
      return sum + q * r;
    }, 0);

    const disc = Number(watchedDiscount) || 0;
    const tx = Number(watchedTax) || 0;
    const total = Math.max(0, subtotal - disc + tx);

    return {
      itemsSubtotal: subtotal,
      finalTotal: total,
    };
  }, [watchedItems, watchedDiscount, watchedTax]);

  // When material is selected, auto-fill unit and benchmark rate
  const handleMaterialSelect = (index: number, materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      setValue(`items.${index}.material_id`, mat.id);
      setValue(`items.${index}.unit`, mat.unit);
      if (mat.standard_rate !== null) {
        setValue(`items.${index}.unit_price`, mat.standard_rate);
      }
      if (!watchedItems[index]?.description) {
        setValue(`items.${index}.description`, mat.name);
      }
    }
  };

  const onSubmit = async (data: PurchaseFormData) => {
    setFormGeneralError(null);
    try {
      const newPurchaseId = await createPurchaseMutation.mutateAsync(data);
      navigate(`/purchases/${newPurchaseId}`);
    } catch (err: any) {
      console.error('Purchase creation error:', err);
      if (err?.message?.includes('duplicate key') || err?.message?.includes('invoice_number')) {
        setFormGeneralError(
          `Invoice number "${data.invoice_number}" has already been logged for this supplier.`
        );
      } else {
        setFormGeneralError(err?.message || 'Failed to create purchase record.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-1.5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Purchases
          </button>
          <h1 className="text-2xl font-bold text-[#242424] font-heading mt-1">
            New Purchase Invoice & Delivery
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Log vendor material delivery, bill of quantities, project assignment, and initial payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="px-4 py-2.5 rounded-lg border border-[#E2DDD5] bg-white text-xs font-semibold text-[#242424] hover:bg-[#F7F5F0] transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createPurchaseMutation.isPending || isSubmitting}
            className="inline-flex items-center gap-2 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            {createPurchaseMutation.isPending ? 'Logging Purchase...' : 'Save Purchase'}
          </button>
        </div>
      </div>

      {formGeneralError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formGeneralError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Supplier & Project Assignment */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <Building2 className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
              Vendor & Project Association
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Material Supplier / Vendor *
              </label>
              <select
                {...register('supplier_id')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(+91 ${s.phone})` : ''}
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="text-[11px] text-[#A84B14] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.supplier_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Assigned Construction Project (Optional)
              </label>
              <select
                {...register('project_id')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                <option value="">-- General / Warehouse Overhead --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} — {p.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                Assigning to a project logs direct material cost in the Project Command Center
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Vendor Invoice / Delivery Challan #
              </label>
              <input
                type="text"
                {...register('invoice_number')}
                placeholder="e.g. INV-2026-1044 or DC-8821"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono uppercase text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
              <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                Must be unique per vendor (enforced by backend integrity rules)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  {...register('purchase_date')}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Purchase Line Items Editor */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C99A2E]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
                Materials & Delivery Items
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                append({
                  material_id: '',
                  description: '',
                  quantity: 1,
                  unit: 'Nos',
                  unit_price: 0,
                  notes: '',
                })
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#4A0E0E] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F0] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                <tr>
                  <th className="py-2.5 px-3 w-1/3">Material Item</th>
                  <th className="py-2.5 px-2 w-20">Qty</th>
                  <th className="py-2.5 px-2 w-24">Unit</th>
                  <th className="py-2.5 px-3 w-28">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60">
                {fields.map((field, idx) => {
                  const qty = Number(watchedItems[idx]?.quantity) || 0;
                  const rate = Number(watchedItems[idx]?.unit_price) || 0;
                  const lineAmt = Math.round(qty * rate * 100) / 100;

                  return (
                    <tr key={field.id} className="hover:bg-[#F7F5F0]/30">
                      <td className="py-2.5 px-3">
                        <select
                          {...register(`items.${idx}.material_id`)}
                          onChange={(e) => handleMaterialSelect(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E2DDD5] rounded text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                        >
                          <option value="">-- Choose Material --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          {...register(`items.${idx}.description`)}
                          placeholder="Optional specific specification / brand..."
                          className="w-full px-2 py-1 bg-transparent text-[11px] text-[#6B6B6B] placeholder:text-[#6B6B6B]/60 mt-1 focus:outline-none border-b border-transparent focus:border-[#E2DDD5]"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          step="any"
                          {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                          className="w-full px-2 py-1.5 bg-white border border-[#E2DDD5] rounded text-xs font-mono text-right text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <select
                          {...register(`items.${idx}.unit`)}
                          className="w-full px-2 py-1.5 bg-white border border-[#E2DDD5] rounded text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                        >
                          {MATERIAL_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          {...register(`items.${idx}.unit_price`, { valueAsNumber: true })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E2DDD5] rounded text-xs font-mono text-right text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#242424] tabular-nums">
                        {formatINR(lineAmt)}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Items (360px & 390px Optimized) */}
          <div className="sm:hidden space-y-3">
            {fields.map((field, idx) => {
              const qty = Number(watchedItems[idx]?.quantity) || 0;
              const rate = Number(watchedItems[idx]?.unit_price) || 0;
              const lineAmt = Math.round(qty * rate * 100) / 100;

              return (
                <div
                  key={field.id}
                  className="bg-[#F7F5F0]/60 p-3.5 rounded-lg border border-[#E2DDD5] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#242424]">
                      Item #{idx + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-red-600 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B6B] uppercase block mb-1">
                      Material
                    </label>
                    <select
                      {...register(`items.${idx}.material_id`)}
                      onChange={(e) => handleMaterialSelect(idx, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded text-xs text-[#242424] min-h-[44px]"
                    >
                      <option value="">-- Choose Material --</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B6B6B] uppercase block mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded text-xs font-mono min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#6B6B6B] uppercase block mb-1">
                        Unit
                      </label>
                      <select
                        {...register(`items.${idx}.unit`)}
                        className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded text-xs min-h-[44px]"
                      >
                        {MATERIAL_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B6B6B] uppercase block mb-1">
                        Unit Rate (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register(`items.${idx}.unit_price`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white border border-[#E2DDD5] rounded text-xs font-mono min-h-[44px]"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                        Line Amount
                      </span>
                      <span className="font-mono font-bold text-xs text-[#242424] tabular-nums block mt-1">
                        {formatINR(lineAmt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {errors.items && (
            <p className="text-[11px] text-[#A84B14] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.items.message}
            </p>
          )}
        </div>

        {/* Section 3: Summary, Tax & Discount */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <Receipt className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
              Purchase Calculation Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('discount', { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Tax / GST (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('tax', { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] min-h-[44px]"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="bg-[#F7F5F0] p-4 rounded-xl border border-[#E2DDD5] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Items Subtotal:</span>
                <span className="font-mono font-semibold text-[#242424]">
                  {formatINR(itemsSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Discount Deduction:</span>
                <span className="font-mono text-[#A84B14]">
                  - {formatINR(Number(watchedDiscount) || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Taxes & Levies:</span>
                <span className="font-mono text-[#242424]">
                  + {formatINR(Number(watchedTax) || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E2DDD5] flex items-center justify-between font-bold text-sm">
                <span className="text-[#242424]">Final Purchase Total:</span>
                <span className="font-mono text-[#4A0E0E] text-base tabular-nums">
                  {formatINR(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Optional Immediate Initial Payment */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#C99A2E]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
                Initial Supplier Payment (Optional)
              </h2>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#242424]">
              <input
                type="checkbox"
                {...register('record_initial_payment')}
                className="w-4 h-4 text-[#4A0E0E] rounded border-[#E2DDD5] focus:ring-[#4A0E0E]"
              />
              Record Payment Now
            </label>
          </div>

          {watchedRecordPayment && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Paid Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('initial_payment_amount', { valueAsNumber: true })}
                  placeholder={finalTotal.toString()}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono font-bold text-[#1E6B37] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Payment Method
                </label>
                <select
                  {...register('initial_payment_method')}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] min-h-[44px]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Reference # (Chq / UTR / Transaction)
                </label>
                <input
                  type="text"
                  {...register('initial_payment_reference')}
                  placeholder="e.g. UTR-992144 or Cheque 00412"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] min-h-[44px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Notes */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs">
          <label className="block text-xs font-semibold text-[#242424] mb-1">
            Delivery Challan & Site Receiving Notes
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            placeholder="e.g. Received at site by supervisor M. Manikandan. Quality of sand inspected before unloading."
            className="w-full px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          />
        </div>

        {/* Mobile Sticky Save */}
        <div className="sm:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E2DDD5] flex gap-2 z-20">
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="flex-1 py-3 border border-[#E2DDD5] rounded-lg text-xs font-bold text-[#242424] bg-white min-h-[48px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createPurchaseMutation.isPending || isSubmitting}
            className="flex-1 py-3 bg-[#4A0E0E] text-white rounded-lg text-xs font-bold shadow-xs min-h-[48px]"
          >
            {createPurchaseMutation.isPending ? 'Logging...' : 'Save Purchase'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default PurchaseEditorPage;
