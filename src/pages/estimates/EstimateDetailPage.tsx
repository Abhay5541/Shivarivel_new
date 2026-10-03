import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Edit2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  FileCheck,
  Send,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useEstimate, useUpdateEstimateStatus } from '@/hooks/useEstimates';
import { useCompanySettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/Button';
import { StatusBadge, type StatusVariant } from '@/components/ui/StatusBadge';
import { formatINR } from '@/lib/utils';
import { numberToIndianWords, type EstimateStatus } from '@/types/estimates';

export const EstimateDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: estimate, isLoading, isError, error } = useEstimate(id);
  const { data: company } = useCompanySettings();
  const updateStatusMutation = useUpdateEstimateStatus();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-[#6B6B6B]">
        Loading estimate proposal...
      </div>
    );
  }

  if (isError || !estimate) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#C5221F] mx-auto" />
        <h2 className="text-base font-bold text-[#242424]">Estimate not found</h2>
        <p className="text-xs text-[#6B6B6B]">
          {error?.message || 'The requested estimate could not be retrieved.'}
        </p>
        <Button variant="primary" onClick={() => navigate('/estimates')}>
          Back to Estimates
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: EstimateStatus) => {
    if (id) {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    }
  };

  const getStatusVariant = (status: EstimateStatus): StatusVariant => {
    switch (status) {
      case 'Approved':
      case 'Accepted':
      case 'Converted':
        return 'completed';
      case 'Sent':
        return 'pending';
      case 'Draft':
        return 'draft';
      case 'Rejected':
      case 'Expired':
        return 'overdue';
      default:
        return 'draft';
    }
  };

  // Group line items by category
  const itemsByCategory: Record<string, typeof estimate.items> = {};
  (estimate.items || []).forEach((item) => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category]!.push(item);
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Non-printable Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <button
            type="button"
            onClick={() => navigate('/estimates')}
            className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Estimates
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#242424] font-heading font-mono">
              {estimate.estimate_number}
            </h1>
            <StatusBadge variant={getStatusVariant(estimate.status)}>
              {estimate.status}
            </StatusBadge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick-Actions */}
          {estimate.status === 'Draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Sent')}
              className="cursor-pointer min-h-[44px]"
            >
              <Send className="w-3.5 h-3.5 mr-1.5 text-[#C99A2E]" />
              Mark as Sent
            </Button>
          )}

          {estimate.status === 'Sent' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Approved')}
              className="cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#1E6B37]" />
              Mark Approved
            </Button>
          )}

          {estimate.status === 'Approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Accepted')}
              className="cursor-pointer min-h-[44px]"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1.5 text-[#1E6B37]" />
              Mark Accepted
            </Button>
          )}

          {(estimate.status === 'Approved' || estimate.status === 'Accepted') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/projects/new?customer_id=${estimate.customer_id}&estimate_id=${estimate.id}&enquiry_id=${estimate.enquiry_id || ''}`
                )
              }
              className="cursor-pointer min-h-[44px] bg-[#4A0E0E]/5 text-[#4A0E0E] border-[#4A0E0E]/30 hover:bg-[#4A0E0E]/10"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#4A0E0E]" />
              Convert to Project
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="cursor-pointer min-h-[44px]"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print / PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/estimates/${estimate.id}/edit`)}
            className="cursor-pointer min-h-[44px]"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Estimate
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OFFICIAL ARCHITECTURAL ESTIMATE DOCUMENT SHEET */}
      {/* ============================================================ */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl shadow-xs p-6 sm:p-10 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Document Header / Contractor Letterhead */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#4A0E0E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center font-bold font-serif text-lg">
                SC
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#4A0E0E] font-heading">
                  {company?.name || 'SHIVARIVEL'}
                </h2>
                <p className="text-[10px] tracking-widest text-[#6B6B6B] uppercase font-semibold">
                  General Civil Contractors &amp; Interior Specialists
                </p>
              </div>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-2 leading-relaxed">
              {company?.address || '14, South Car Street, Sankarankovil, Tenkasi District, Tamil Nadu - 627756'}<br />
              {company?.gst_number && <>GSTIN: <span className="font-mono font-medium text-[#242424]">{company.gst_number}</span> • </>}
              Phone: {company?.phone || '+91 94431 87654'} • Email: {company?.email || 'contact@shivarivel.com'}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-[#4A0E0E] text-white text-xs font-bold uppercase tracking-wider rounded">
              Cost Estimate / BOQ
            </span>
            <div className="text-sm font-mono font-bold text-[#242424] pt-1">
              {estimate.estimate_number}
            </div>
            <div className="text-xs text-[#6B6B6B]">
              Date: <strong className="text-[#242424]">{estimate.estimate_date}</strong>
            </div>
            {estimate.valid_until && (
              <div className="text-xs text-[#6B6B6B]">
                Valid Until: <strong className="text-[#242424]">{estimate.valid_until}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Scope Header Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-[#F7F5F0]/60 border border-[#E2DDD5] rounded-xl text-xs">
          {/* Client Details */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
              Quotation Prepared For
            </span>
            <h3 className="text-sm font-bold text-[#242424]">
              {estimate.customer?.name || 'Valued Customer'}
            </h3>
            {estimate.customer?.phone && (
              <div className="text-[#6B6B6B] font-mono flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C99A2E]" />
                +91 {estimate.customer.phone}
              </div>
            )}
            {estimate.customer?.email && (
              <div className="text-[#6B6B6B] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C99A2E]" />
                {estimate.customer.email}
              </div>
            )}
            {estimate.customer?.address && (
              <div className="text-[#6B6B6B] flex items-start gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0 mt-0.5" />
                <span>{estimate.customer.address}</span>
              </div>
            )}
          </div>

          {/* Project / Scope Context */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
              Project Scope & Objective
            </span>
            <p className="text-sm font-bold text-[#242424]">
              {estimate.title || 'General Construction Scope'}
            </p>
            {estimate.enquiry && (
              <p className="text-xs text-[#6B6B6B] leading-relaxed pt-1">
                Linked Enquiry: <em>"{estimate.enquiry.description}"</em>
              </p>
            )}
          </div>
        </div>

        {/* Bill of Quantities Items Grouped by Category */}
        <div className="space-y-6">
          {/* Desktop & Print Table */}
          <div className="hidden md:block print:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#242424] text-[11px] font-bold text-[#242424] uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-10">#</th>
                  <th className="py-2.5 px-3">Item Description / Specification</th>
                  <th className="py-2.5 px-3 text-right w-20">Qty</th>
                  <th className="py-2.5 px-3 w-20">Unit</th>
                  <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60 text-xs">
                {Object.entries(itemsByCategory).map(([category, catItems]) => (
                  <React.Fragment key={category}>
                    {/* Category Sub-heading */}
                    <tr className="bg-[#F7F5F0]">
                      <td
                        colSpan={6}
                        className="py-2 px-3 font-bold text-[#4A0E0E] text-[11px] uppercase tracking-wider"
                      >
                        Trade Section: {category}
                      </td>
                    </tr>

                    {/* Category Items */}
                    {catItems?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-[#F7F5F0]/30 transition-colors">
                        <td className="py-3 px-2 text-center font-mono text-[#6B6B6B] text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#242424]">{item.description}</div>
                          {item.notes && (
                            <div className="text-[11px] text-[#6B6B6B] italic mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-[#6B6B6B]">
                          {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatINR(item.unit_price)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#242424]">
                          {formatINR(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Items (360px & 390px Viewports) */}
          <div className="md:hidden print:hidden space-y-4">
            {Object.entries(itemsByCategory).map(([category, catItems]) => (
              <div key={category} className="space-y-2">
                <div className="bg-[#F7F5F0] py-1.5 px-3 rounded-md font-bold text-[#4A0E0E] text-[11px] uppercase tracking-wider border border-[#E2DDD5]/70">
                  Trade Section: {category}
                </div>

                <div className="space-y-2.5">
                  {catItems?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-white rounded-lg border border-[#E2DDD5] space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-[#6B6B6B] bg-[#F7F5F0] px-1.5 py-0.5 rounded-sm shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 font-semibold text-[#242424] leading-snug">
                          {item.description}
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-[#6B6B6B] italic pl-6">
                          {item.notes}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2DDD5]/60 bg-[#F7F5F0]/50 p-2 rounded-md">
                        <div>
                          <div className="text-[10px] font-semibold text-[#6B6B6B] uppercase">Quantity</div>
                          <div className="font-mono font-medium text-[#242424] mt-0.5">
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-[#6B6B6B] uppercase">Rate</div>
                          <div className="font-mono text-[#242424] mt-0.5">
                            {formatINR(item.unit_price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-semibold text-[#6B6B6B] uppercase">Amount</div>
                          <div className="font-mono font-bold text-[#4A0E0E] mt-0.5">
                            {formatINR(item.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial Total Box */}
        <div className="border-t-2 border-[#242424] pt-4 space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold text-[#6B6B6B]">
            <span>Subtotal (All Trade Sections)</span>
            <span className="font-mono text-base font-bold text-[#242424]">
              {formatINR(estimate.total_amount)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-[#4A0E0E] text-white rounded-lg">
            <span className="text-sm font-bold uppercase tracking-wider">
              Total Proposed Estimate
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono">
              {formatINR(estimate.total_amount)}
            </span>
          </div>

          {/* Words standard */}
          <div className="p-3 bg-[#F9F3E5] border border-[#C99A2E]/40 rounded-lg text-xs">
            <span className="font-semibold block text-[10px] uppercase tracking-wider text-[#6B6B6B]">
              Amount in Words:
            </span>
            <span className="font-semibold text-xs text-[#242424]">
              {numberToIndianWords(estimate.total_amount)}
            </span>
          </div>
        </div>

        {/* Scope Conditions & Execution Notes */}
        {estimate.notes && (
          <div className="p-4 bg-[#F7F5F0]/60 border border-[#E2DDD5] rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold text-[#4A0E0E] uppercase tracking-wider block">
              Commercial Terms & Scope Conditions
            </span>
            <p className="text-xs text-[#242424] leading-relaxed whitespace-pre-line">
              {estimate.notes}
            </p>
          </div>
        )}

        {/* Document Sign-off / Signature Blocks */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-xs text-[#6B6B6B]">
          <div className="border-t border-[#8C8880] pt-2 text-center">
            <p className="font-semibold text-[#242424]">Customer Acceptance Signature</p>
            <p className="text-[11px] text-[#8C8880] mt-0.5">Date: ______________</p>
          </div>

          <div className="border-t border-[#8C8880] pt-2 text-center">
            <p className="font-semibold text-[#242424]">For Shivarivel Construction & Interiors</p>
            <p className="text-[11px] text-[#8C8880] mt-0.5">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
