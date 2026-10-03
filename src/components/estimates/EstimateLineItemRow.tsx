import React from 'react';
import { Trash2 } from 'lucide-react';
import { ESTIMATE_CATEGORIES, ESTIMATE_UNITS } from '@/types/estimates';
import type { EstimateItemFormData } from '@/types/estimates';
import { formatINR } from '@/lib/utils';

interface EstimateLineItemRowProps {
  index: number;
  item: EstimateItemFormData;
  onChange: (index: number, updated: EstimateItemFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const EstimateLineItemRow: React.FC<EstimateLineItemRowProps> = ({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
}) => {
  const handleFieldChange = (field: keyof EstimateItemFormData, value: any) => {
    const nextItem = { ...item, [field]: value };
    // Recalculate amount dynamically
    const qty = Number(field === 'quantity' ? value : nextItem.quantity) || 0;
    const rate = Number(field === 'unit_price' ? value : nextItem.unit_price) || 0;
    nextItem.amount = Math.round(qty * rate * 100) / 100;
    onChange(index, nextItem);
  };

  return (
    <tr className="border-b border-[#E2DDD5]/70 hover:bg-[#F7F5F0]/30 transition-colors">
      {/* Index */}
      <td className="py-2.5 px-3 text-xs font-mono text-[#6B6B6B] w-10 text-center">
        {index + 1}
      </td>

      {/* Category */}
      <td className="py-2.5 px-2 w-36">
        <select
          value={item.category}
          onChange={(e) => handleFieldChange('category', e.target.value)}
          className="w-full text-xs bg-white border border-[#E2DDD5] rounded-md px-2 py-1.5 focus:border-[#4A0E0E] focus:outline-hidden font-medium"
        >
          {ESTIMATE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </td>

      {/* Description */}
      <td className="py-2.5 px-2">
        <input
          type="text"
          value={item.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="e.g. 12.5mm false ceiling with peripheral cove channel"
          className="w-full text-xs bg-white border border-[#E2DDD5] rounded-md px-2.5 py-1.5 focus:border-[#4A0E0E] focus:outline-hidden"
          required
        />
      </td>

      {/* Quantity */}
      <td className="py-2.5 px-2 w-24">
        <input
          type="number"
          step="any"
          min="0.001"
          inputMode="decimal"
          value={item.quantity || ''}
          onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
          className="w-full text-xs font-mono text-right bg-white border border-[#E2DDD5] rounded-md px-2 py-1.5 focus:border-[#4A0E0E] focus:outline-hidden"
          required
        />
      </td>

      {/* Unit */}
      <td className="py-2.5 px-2 w-28">
        <select
          value={item.unit}
          onChange={(e) => handleFieldChange('unit', e.target.value)}
          className="w-full text-xs bg-white border border-[#E2DDD5] rounded-md px-2 py-1.5 focus:border-[#4A0E0E] focus:outline-hidden"
        >
          {ESTIMATE_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.value}
            </option>
          ))}
        </select>
      </td>

      {/* Rate (₹) */}
      <td className="py-2.5 px-2 w-28">
        <input
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          value={item.unit_price || ''}
          onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
          className="w-full text-xs font-mono text-right bg-white border border-[#E2DDD5] rounded-md px-2 py-1.5 focus:border-[#4A0E0E] focus:outline-hidden"
          required
        />
      </td>

      {/* Line Amount (₹) - Auto calculated */}
      <td className="py-2.5 px-3 w-32 text-right text-xs font-mono font-bold text-[#242424]">
        {formatINR(item.amount)}
      </td>

      {/* Actions */}
      <td className="py-2.5 px-2 w-12 text-center">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove item ${index + 1}`}
            className="p-1.5 text-[#6B6B6B] hover:text-[#C5221F] hover:bg-[#FCE8E6] rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
};
