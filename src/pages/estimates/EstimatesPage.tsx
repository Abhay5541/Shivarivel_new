import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Search,
  Plus,
  Eye,
  Edit2,
  FileCheck,
  TrendingUp,
  FileText,
  Phone,
} from 'lucide-react';
import { useEstimates } from '@/hooks/useEstimates';
import { Button } from '@/components/ui/Button';
import { StatusBadge, type StatusVariant } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { formatINR, cn } from '@/lib/utils';
import type { EstimateStatus } from '@/types/estimates';

export const EstimatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const {
    data: estimates = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEstimates({
    search: searchTerm,
    status: selectedStatus,
  });

  // Calculate high-level summary KPIs
  const totalCount = estimates.length;
  const approvedAcceptedCount = estimates.filter(
    (e) => e.status === 'Approved' || e.status === 'Accepted'
  ).length;
  const totalValue = estimates.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const draftsCount = estimates.filter((e) => e.status === 'Draft').length;

  const statusFilters: { id: string; label: string }[] = [
    { id: 'all', label: 'All Estimates' },
    { id: 'Draft', label: 'Drafts' },
    { id: 'Sent', label: 'Sent' },
    { id: 'Approved', label: 'Approved' },
    { id: 'Accepted', label: 'Accepted' },
    { id: 'Converted', label: 'Converted' },
    { id: 'Rejected', label: 'Rejected' },
  ];

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

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading">
            Estimates
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            Cost proposals, bill of quantities (BOQ), and commercial quotations
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/estimates/new')}
          className="cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          + New Estimate
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Estimates</span>
            <Calculator className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] font-heading">{totalCount}</p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved / Accepted</span>
            <FileCheck className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-2xl font-bold text-[#1E6B37] font-heading">{approvedAcceptedCount}</p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Quoted Value</span>
            <TrendingUp className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1E6B37] font-mono">
            {formatINR(totalValue)}
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Drafts in Progress</span>
            <FileText className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] font-heading">{draftsCount}</p>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8880]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by estimate number (EST-0001), client name, or title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-xs sm:text-sm text-[#242424] placeholder-[#8C8880] focus:border-[#4A0E0E] focus:outline-hidden transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusFilters.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={cn(
                'px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 min-h-[40px]',
                selectedStatus === tab.id
                  ? 'bg-[#4A0E0E] text-white shadow-2xs'
                  : 'bg-white text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#F7F5F0] hover:text-[#242424]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load estimates"
          description={error?.message || 'Unable to retrieve estimates from database.'}
          onRetry={refetch}
        />
      ) : estimates.length === 0 ? (
        <EmptyState
          icon={<Calculator className="w-6 h-6 text-[#4A0E0E]" />}
          title={selectedStatus !== 'all' || searchTerm ? 'No matching estimates' : 'No estimates yet'}
          description={
            selectedStatus !== 'all' || searchTerm
              ? 'Try adjusting your search query or switching status filters.'
              : 'Prepare and send professional construction estimates and interior quotations to customers.'
          }
          actionLabel="+ New Estimate"
          onAction={() => navigate('/estimates/new')}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-11 bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                  <th className="py-3 px-4">Estimate #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Project Scope / Title</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60 text-xs">
                {estimates.map((est) => (
                  <tr
                    key={est.id}
                    onClick={() => navigate(`/estimates/${est.id}`)}
                    className="hover:bg-[#F7F5F0]/50 transition-colors cursor-pointer"
                  >
                    {/* Number & Date */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4A0E0E]">
                      <div>{est.estimate_number}</div>
                      <div className="text-[11px] font-normal text-[#6B6B6B]">{est.estimate_date}</div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#242424]">
                        {est.customer?.name || 'Unknown Client'}
                      </div>
                      {est.customer?.phone && (
                        <div className="text-[11px] text-[#6B6B6B] font-mono">
                          +91 {est.customer.phone}
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate font-medium text-[#242424]">
                        {est.title || 'General Construction Scope'}
                      </div>
                      <div className="text-[11px] text-[#8C8880]">
                        {est.items?.length || 0} line items
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#242424]">
                      {formatINR(est.total_amount)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge variant={getStatusVariant(est.status)}>
                        {est.status}
                      </StatusBadge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/estimates/${est.id}`)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#4A0E0E] hover:bg-[#F7F5F0] rounded-md transition-colors cursor-pointer"
                          title="View Proposal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/estimates/${est.id}/edit`)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#C99A2E] hover:bg-[#F7F5F0] rounded-md transition-colors cursor-pointer"
                          title="Edit Estimate"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (<768px, verified at 360px & 390px) */}
          <div className="md:hidden space-y-3">
            {estimates.map((est) => (
              <div
                key={est.id}
                onClick={() => navigate(`/estimates/${est.id}`)}
                className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3 cursor-pointer active:bg-[#F7F5F0]/50 transition-colors"
              >
                {/* Header: Estimate # and Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#4A0E0E]">
                      {est.estimate_number}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B] font-mono">
                      • {est.estimate_date}
                    </span>
                  </div>
                  <StatusBadge variant={getStatusVariant(est.status)}>
                    {est.status}
                  </StatusBadge>
                </div>

                {/* Customer & Scope */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#242424]">
                    {est.customer?.name || 'Unknown Client'}
                  </h3>
                  {est.customer?.phone && (
                    <a
                      href={`tel:${est.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[#1E6B37] font-mono flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      +91 {est.customer.phone}
                    </a>
                  )}
                  <p className="text-xs text-[#6B6B6B] line-clamp-2 pt-0.5">
                    {est.title || 'General Construction Estimate'}
                  </p>
                </div>

                {/* Amount and Items Count */}
                <div className="flex items-center justify-between p-2.5 bg-[#F9F3E5] border border-[#C99A2E]/30 rounded-lg">
                  <div className="text-[11px] text-[#6B6B6B]">
                    {est.items?.length || 0} work items
                  </div>
                  <div className="font-mono font-bold text-sm text-[#242424]">
                    {formatINR(est.total_amount)}
                  </div>
                </div>

                {/* Action Row (Touch targets >= 48px) */}
                <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(`/estimates/${est.id}`)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#4A0E0E] text-white rounded-lg text-xs font-bold transition-all min-h-[48px] cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-white" />
                    Open Proposal
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/estimates/${est.id}/edit`)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-[#F7F5F0] text-[#242424] border border-[#E2DDD5] rounded-lg text-xs font-bold transition-all min-h-[48px] cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-[#C99A2E]" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
