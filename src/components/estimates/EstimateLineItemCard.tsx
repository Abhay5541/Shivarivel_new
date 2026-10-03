import React from 'react';
import { Trash2 } from 'lucide-react';
import { ESTIMATE_CATEGORIES, ESTIMATE_UNITS } from '@/types/estimates';
import type { EstimateItemFormData } from '@/types/estimates';
import { formatINR } from '@/lib/utils';

interface EstimateLineItemCardProps {
  index: number;
  item: EstimateItemFormData;
  onChange: (index: number, updated: EstimateItemFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const EstimateLineItemCard: React.FC<EstimateLineItemCardProps> = ({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
}) => {
  const handleFieldChange = (field: keyof EstimateItemFormData, value: any) => {
    const nextItem = { ...item, [field]: value };
    const qty = Number(field === 'quantity' ? value : nextItem.quantity) || 0;
    const rate = Number(field === 'unit_price' ? value : nextItem.unit_price) || 0;
    nextItem.amount = Math.round(qty * rate * 100) / 100;
    onChange(index, nextItem);
  };

  return (
    <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-3 shadow-2xs">
      {/* Header: Item index, Category, and Remove */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E2DDD5]/60">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#4A0E0E] text-white text-[11px] font-bold flex items-center justify-center font-mono">
            {index + 1}
          </span>
          <select
            value={item.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className="text-xs bg-[#F7F5F0] border border-[#E2DDD5] rounded-md px-2 py-1.5 focus:border-[#4A0E0E] focus:outline-hidden font-semibold text-[#4A0E0E] min-h-[40px]"
          >
            {ESTIMATE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove item ${index + 1}`}
            className="p-2 text-[#6B6B6B] hover:text-[#C5221F] hover:bg-[#FCE8E6] rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 text-[#C5221F]" />
          </button>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
          Work Item / Description *
        </label>
        <textarea
          rows={2}
          value={item.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="e.g. Saint-Gobain gypsum false ceiling with warm cove lighting"
          className="w-full text-xs bg-[#F7F5F0]/30 border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden resize-none"
          required
        />
      </div>

      {/* Numerical inputs: Quantity, Unit, Rate */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
            Qty *
          </label>
          <input
            type="number"
            step="any"
            min="0.001"
            inputMode="decimal"
            value={item.quantity || ''}
            onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
            className="w-full text-xs font-mono text-center bg-white border border-[#E2DDD5] rounded-lg p-2 focus:border-[#4A0E0E] focus:outline-hidden min-h-[42px]"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
            Unit
          </label>
          <select
            value={item.unit}
            onChange={(e) => handleFieldChange('unit', e.target.value)}
            className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2 focus:border-[#4A0E0E] focus:outline-hidden min-h-[42px]"
          >
            {ESTIMATE_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
            Rate (₹) *
          </label>
          <input
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={item.unit_price || ''}
            onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
            className="w-full text-xs font-mono text-right bg-white border border-[#E2DDD5] rounded-lg p-2 focus:border-[#4A0E0E] focus:outline-hidden min-h-[42px]"
            required
          />
        </div>
      </div>

      {/* Calculated Total for this Line */}
      <div className="flex items-center justify-between p-2.5 bg-[#F9F3E5] border border-[#C99A2E]/30 rounded-lg">
        <span className="text-[11px] font-bold text-[#4A0E0E]">Item Amount:</span>
        <span className="text-sm font-mono font-bold text-[#242424]">
          {formatINR(item.amount)}
        </span>
      </div>
    </div>
  );
};
