import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { useCreateMaterial } from '@/hooks/useProcurement';
import type { Material } from '@/types/procurement';
import { Button } from '@/components/ui/Button';

interface SimpleMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (material: Material) => void;
}

const COMMON_UNITS = ['Bag', 'Load', 'Sq.ft', 'Litre', 'Metre', 'Sheet', 'Kg', 'Ton', 'Piece', 'Box'];

export const SimpleMaterialModal: React.FC<SimpleMaterialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createMaterialMutation = useCreateMaterial();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bag');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a material name (at least 2 characters).');
      return;
    }

    const trimmedUnit = unit.trim();
    if (!trimmedUnit) {
      setErrorMsg('Please enter or select a unit of measure (e.g. Bag, Load, Sq.ft).');
      return;
    }

    try {
      const created = await createMaterialMutation.mutateAsync({
        name: trimmedName,
        category: 'General',
        unit: trimmedUnit,
        status: 'active',
      });
      if (created && onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save material. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = createMaterialMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 modal-backdrop-spring">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2DDD5] overflow-hidden modal-spring">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F5F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#242424] font-heading">
                Add Material
              </h2>
              <p className="text-xs text-[#6B6B6B]">Add reusable construction item</p>
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

          {/* Material Name */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Material Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cement, Sand, Tiles, Paint, Wire, Plywood"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
          </div>

          {/* Unit of measure */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Bag, Load, Sq.ft, Litre, Metre, Sheet"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all mb-2"
            />

            {/* Quick unit chips for fast mobile selection */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    unit.toLowerCase() === u.toLowerCase()
                      ? 'bg-[#4A0E0E] text-white shadow-xs'
                      : 'bg-[#F7F5F0] text-[#242424] hover:bg-[#E2DDD5]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
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
              {isSaving ? 'Saving...' : 'Save Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
