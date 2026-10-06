import React from 'react';
import { Printer, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  dateRangeText?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
  backToReports?: boolean;
}

export function ReportHeader({
  title,
  subtitle,
  badgeText = 'Historical Operational Record',
  badgeIcon,
  dateRangeText,
  onRefresh,
  isRefreshing = false,
  actions,
  backToReports = false,
}: ReportHeaderProps) {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 print:hidden">
      {backToReports && (
        <button
          type="button"
          onClick={() => navigate('/reports/weekly')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Weekly Report</span>
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DDD5] pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#242424] font-heading tracking-tight">
              {title}
            </h1>
            {badgeText && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4A0E0E]/10 text-[#4A0E0E] border border-[#4A0E0E]/20">
                {badgeIcon || <Calendar className="w-3 h-3 text-[#C99A2E]" />}
                <span>{badgeText}</span>
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#6B6B6B] mt-1 max-w-2xl">{subtitle}</p>}

          {dateRangeText && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A0E0E] bg-[#F7F5F0] border border-[#E2DDD5] px-2.5 py-1 rounded-md mt-2.5">
              <Calendar className="w-3.5 h-3.5 text-[#C99A2E]" />
              <span className="font-mono">{dateRangeText}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {actions}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs font-semibold min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#6B6B6B] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold min-h-[44px] border-[#4A0E0E]/30 text-[#4A0E0E] hover:bg-[#4A0E0E]/5"
          >
            <Printer className="w-3.5 h-3.5 text-[#4A0E0E]" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
