import { useState } from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ReportDatePreset, DateRange } from '@/types/reports';
import { getDateRangeForPreset } from '@/lib/reportDateUtils';

interface ReportDateFilterBarProps {
  preset: ReportDatePreset;
  startDate: string;
  endDate: string;
  onPresetChange: (preset: ReportDatePreset) => void;
  onDateRangeChange: (range: DateRange) => void;
  onReset?: () => void;
  children?: React.ReactNode; // Extra filter dropdowns (project, supplier, status, etc.)
  activeFilterCount?: number;
}

export function ReportDateFilterBar({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onDateRangeChange,
  onReset,
  children,
  activeFilterCount = 0,
}: ReportDateFilterBarProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const presets: { key: ReportDatePreset; label: string }[] = [
    { key: 'this_week', label: 'This Week' },
    { key: 'last_week', label: 'Last Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'today', label: 'Today' },
    { key: 'custom', label: 'Custom' },
  ];

  const handlePresetClick = (newPreset: ReportDatePreset) => {
    onPresetChange(newPreset);
    if (newPreset !== 'custom') {
      const range = getDateRangeForPreset(newPreset);
      onDateRangeChange(range);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPresetChange('custom');
    onDateRangeChange({ startDate: e.target.value, endDate });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPresetChange('custom');
    onDateRangeChange({ startDate, endDate: e.target.value });
  };

  return (
    <div className="bg-white border border-[#E2DDD5] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3 print:hidden">
      {/* Top Strip: Preset Pills & Mobile Filter Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Date Presets Group */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider mr-1 hidden sm:inline">
            Period:
          </span>
          {presets.map((p) => {
            const isSelected = preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetClick(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[36px] ${
                  isSelected
                    ? 'bg-[#4A0E0E] text-white shadow-2xs'
                    : 'bg-[#F7F5F0] text-[#6B6B6B] hover:text-[#242424] hover:bg-[#E2DDD5]/70'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls: Mobile Filters Trigger & Reset */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {children && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden text-xs font-semibold min-h-[38px] gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-[#C99A2E]" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#4A0E0E] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#4A0E0E] px-2 py-1.5 rounded hover:bg-[#F7F5F0] transition-colors cursor-pointer min-h-[38px]"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3 text-[#8C8880]" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Range Inputs & Desktop Custom Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#E2DDD5]/60">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B6B6B] font-medium text-[11px] uppercase">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="px-2.5 py-1.5 text-xs font-mono font-medium border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          />
          <span className="text-[#6B6B6B] font-medium text-[11px] uppercase">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="px-2.5 py-1.5 text-xs font-mono font-medium border border-[#E2DDD5] rounded-md bg-[#F7F5F0]/50 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
          />
        </div>

        {/* Desktop inline children filters */}
        {children && (
          <div className="hidden lg:flex items-center gap-2.5">
            {children}
          </div>
        )}
      </div>

      {/* Mobile Filters Drawer / Sheet */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C99A2E]" />
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  Filter Report Records
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-md text-[#6B6B6B] hover:bg-[#F7F5F0] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {children}
            </div>

            <div className="pt-3 border-t border-[#E2DDD5] flex items-center gap-2">
              {onReset && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReset();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-1/2 min-h-[44px]"
                >
                  Reset
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`min-h-[44px] ${onReset ? 'w-1/2' : 'w-full'}`}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
