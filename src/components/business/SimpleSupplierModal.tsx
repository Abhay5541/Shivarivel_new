import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/useProcurement';
import { indianPhoneRegex } from '@/types/business';
import type { Supplier } from '@/types/procurement';
import { Button } from '@/components/ui/Button';

interface SimpleSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSuccess?: (supplier: Supplier) => void;
}

export const SimpleSupplierModal: React.FC<SimpleSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}) => {
  const isEditing = Boolean(supplier);
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setPhone(supplier.phone || '');
    } else {
      setName('');
      setPhone('');
    }
    setErrorMsg(null);
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a supplier name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim().replace(/\s+/g, '');
    if (trimmedPhone && !indianPhoneRegex.test(trimmedPhone)) {
      setErrorMsg('Please enter a valid 10-digit phone number (starts with 6-9).');
      return;
    }

    try {
      if (isEditing && supplier) {
        const updated = await updateSupplierMutation.mutateAsync({
          id: supplier.id,
          payload: {
            name: trimmedName,
            phone: trimmedPhone || null,
            status: 'active',
          },
        });
        if (updated && onSuccess) onSuccess(updated);
        onClose();
      } else {
        const created = await createSupplierMutation.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone || null,
          category: 'General',
          status: 'active',
        });
        if (created && onSuccess) onSuccess(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save supplier. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = createSupplierMutation.isPending || updateSupplierMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 modal-backdrop-spring">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2DDD5] overflow-hidden modal-spring">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F5F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#242424] font-heading">
                {isEditing ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <p className="text-xs text-[#6B6B6B]">Quick supplier registration</p>
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
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Supplier Name */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ABC Traders, Madurai TMT Steels"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
            <p className="mt-1 text-[11px] text-[#6B6B6B]">
              Standard 10-digit mobile number for supplier contact.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-5 text-sm font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 text-sm font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white shadow-sm cursor-pointer"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
