import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useCreateSimplePurchase, useUpdateSimplePurchase } from '@/hooks/useProcurement';
import type { Purchase } from '@/types/procurement';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SimplePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'project' | 'general';
  editPurchase?: Purchase | null;
  preselectedProjectId?: string | null;
  preselectedSupplierId?: string | null;
  onSuccess?: () => void;
}

export const SimplePurchaseModal: React.FC<SimplePurchaseModalProps> = ({
  isOpen,
  onClose,
  mode = 'project',
  editPurchase,
  preselectedProjectId,
  onSuccess,
}) => {
  const { data: projects = [] } = useProjects();
  const createPurchaseMutation = useCreateSimplePurchase();
  const updatePurchaseMutation = useUpdateSimplePurchase();

  const [projectId, setProjectId] = useState('');
  const [productName, setProductName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [totalValue, setTotalValue] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEdit = Boolean(editPurchase);
  const isProjectPurchase = mode === 'project' || Boolean(editPurchase?.project_id);

  useEffect(() => {
    if (isOpen) {
      if (editPurchase) {
        setProjectId(editPurchase.project_id || '');
        const item = editPurchase.items?.[0];
        setProductName(item?.description || item?.material?.name || '');
        setSupplierName(editPurchase.supplier?.name || '');
        setQuantity(item?.quantity ? String(item.quantity) : '');
        setUnit(item?.unit || 'Bags');
        setTotalValue(editPurchase.total_amount ? String(editPurchase.total_amount) : '');
        setAmountPaid(
          editPurchase.total_allocated !== undefined ? String(editPurchase.total_allocated) : '0'
        );
        setNotes(editPurchase.notes || '');
      } else {
        const defaultPrj = preselectedProjectId || (projects.length > 0 ? projects[0].id : '');
        setProjectId(isProjectPurchase ? defaultPrj : '');
        setProductName('');
        setSupplierName('');
        setQuantity('');
        setUnit('Bags');
        setTotalValue('');
        setAmountPaid('0');
        setNotes('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, editPurchase, preselectedProjectId, projects, isProjectPurchase]);

  if (!isOpen) return null;

  const numTotal = Number(totalValue) || 0;
  const numPaid = Number(amountPaid) || 0;
  const numQty = Number(quantity) || 0;
  const balance = Math.max(0, numTotal - numPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isProjectPurchase && !projectId) {
      setErrorMsg('Please select a project.');
      return;
    }

    if (!productName.trim()) {
      setErrorMsg('Product / Material is required.');
      return;
    }

    if (!supplierName.trim()) {
      setErrorMsg('Supplier / Company is required.');
      return;
    }

    if (!quantity || numQty <= 0) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }

    if (!unit.trim()) {
      setErrorMsg('Please enter a unit (e.g. Bags, Tonnes, Pieces).');
      return;
    }

    if (!totalValue || numTotal <= 0) {
      setErrorMsg('Please enter a valid total value in ₹.');
      return;
    }

    if (numPaid < 0) {
      setErrorMsg('Amount paid cannot be negative.');
      return;
    }

    if (numPaid > numTotal) {
      setErrorMsg('Amount paid cannot be greater than total value.');
      return;
    }

    try {
      if (isEdit && editPurchase) {
        await updatePurchaseMutation.mutateAsync({
          id: editPurchase.id,
          project_id: isProjectPurchase ? projectId : null,
          product_name: productName.trim(),
          supplier_name: supplierName.trim(),
          quantity: numQty,
          unit: unit.trim(),
          total_value: numTotal,
          amount_paid: numPaid,
          notes: notes.trim() || null,
        });
      } else {
        await createPurchaseMutation.mutateAsync({
          project_id: isProjectPurchase ? projectId : null,
          product_name: productName.trim(),
          supplier_name: supplierName.trim(),
          quantity: numQty,
          unit: unit.trim(),
          total_value: numTotal,
          amount_paid: numPaid,
          notes: notes.trim() || null,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save purchase. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = createPurchaseMutation.isPending || updatePurchaseMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E2DDD5] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F5F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424] font-heading">
                {isEdit
                  ? 'Edit Purchase'
                  : isProjectPurchase
                  ? 'Record Project Purchase'
                  : 'Record General Purchase'}
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                {isProjectPurchase
                  ? 'Purchase associated with a project'
                  : 'General purchase not tied to any project'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B6B6B] hover:text-[#242424] p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Project (ONLY for Project Purchases) */}
          {isProjectPurchase && (
            <div>
              <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required={isProjectPurchase}
                className="w-full h-11 px-3 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all cursor-pointer"
              >
                <option value="" disabled>
                  Select Project...
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.customer?.name ? `(${p.customer.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Product / Material (Free-text) */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Product / Material <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Cement, Steel Rod, Sand, Bricks, Tiles"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
          </div>

          {/* 3. Supplier / Company (Free-text) */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Supplier / Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. ABC Traders, XYZ Building Materials"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
          </div>

          {/* 4. Quantity & 5. Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Bags, Tonnes, Pieces, Sq.ft"
                className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
              />
            </div>
          </div>

          {/* 6. Total Value & 7. Amount Paid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
                Total Value (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="e.g. 22500"
                className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-semibold text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
                Amount Paid (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max={numTotal || undefined}
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-semibold text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
              />
            </div>
          </div>

          {/* 8. Live Balance Preview */}
          <div className="p-3 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#6B6B6B] block">Total Value:</span>
              <span className="font-bold text-[#242424]">₹{formatINR(numTotal)}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] block">Paid:</span>
              <span className="font-bold text-[#166534]">₹{formatINR(numPaid)}</span>
            </div>
            <div className="text-right">
              <span className="text-[#6B6B6B] block">Balance to Pay:</span>
              <span className={`font-bold text-sm ${balance > 0 ? 'text-[#991B1B]' : 'text-[#166534]'}`}>
                ₹{formatINR(balance)}
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-5 text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 text-xs font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white rounded-xl shadow-xs cursor-pointer"
            >
              {isSaving ? 'Saving...' : isEdit ? 'Update Purchase' : 'Save Purchase'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
