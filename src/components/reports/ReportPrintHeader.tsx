import { useCompanySettings } from '@/hooks/useSettings';
import { DEFAULT_COMPANY_REPORT_INFO } from '@/types/reports';
import { formatReportDateRange, getGeneratedTimestamp } from '@/lib/reportDateUtils';

interface ReportPrintHeaderProps {
  reportTitle: string;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
}

export function ReportPrintHeader({
  reportTitle,
  startDate,
  endDate,
  periodLabel,
}: ReportPrintHeaderProps) {
  const { data: companyData } = useCompanySettings();
  const company = companyData || DEFAULT_COMPANY_REPORT_INFO;
  const companyName = company.name || DEFAULT_COMPANY_REPORT_INFO.name;
  const companyAddress = company.address || DEFAULT_COMPANY_REPORT_INFO.address;
  const companyPhone =
    company.phone || (company as any).phone || DEFAULT_COMPANY_REPORT_INFO.phone;
  const companyGst =
    (company as any).gst_number || (company as any).gstNumber || DEFAULT_COMPANY_REPORT_INFO.gstNumber;

  const dateRangeStr =
    periodLabel || (startDate && endDate ? formatReportDateRange(startDate, endDate) : '');
  const timestamp = getGeneratedTimestamp();

  return (
    <div className="hidden print:block pb-6 mb-6 border-b-2 border-[#4A0E0E]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#4A0E0E] font-heading">
            {companyName}
          </h1>
          <p className="text-xs font-medium text-[#6B6B6B] mt-0.5">
            General Civil Contractors &amp; Interior Specialists
          </p>
          <p className="text-[11px] text-[#242424] mt-1">{companyAddress}</p>
          <div className="flex items-center gap-4 text-[10px] text-[#6B6B6B] mt-1">
            {companyGst && (
              <span>
                GSTIN: <strong className="font-mono text-[#242424]">{companyGst}</strong>
              </span>
            )}
            {companyGst && companyPhone && <span>•</span>}
            {companyPhone && (
              <span>
                Phone: <strong className="text-[#242424]">{companyPhone}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-[#4A0E0E]/10 text-[#4A0E0E] border border-[#4A0E0E]/30 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
            {reportTitle}
          </div>
          {dateRangeStr && (
            <p className="text-xs font-semibold text-[#242424] mt-2 font-mono">
              Period: {dateRangeStr}
            </p>
          )}
          <p className="text-[10px] text-[#8C8880] mt-1">
            Generated: {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}
