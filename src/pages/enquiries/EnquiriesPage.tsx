import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Phone,
  Compass,
  LayoutGrid,
  List,
  Edit2,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EnquiryFormDrawer } from '@/components/business/EnquiryFormDrawer';
import { SiteVisitFormDrawer } from '@/components/business/SiteVisitFormDrawer';
import { useEnquiries } from '@/hooks/useEnquiries';
import type { Enquiry } from '@/types/business';
import { formatINR, cn } from '@/lib/utils';

const PIPELINE_STATUSES = [
  'New',
  'Contacted',
  'Site Visit Planned',
  'Estimate Prepared',
  'Converted',
  'On Hold',
  'Lost',
] as const;

export function EnquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  // Drawers
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [schedulingVisitForEnquiry, setSchedulingVisitForEnquiry] = useState<Enquiry | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingEnquiry(null);
      setIsNewEnquiryOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    data: enquiries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEnquiries({
    search: searchTerm,
    status: selectedStatus,
  });

  const totalValue = enquiries.reduce((acc, e) => acc + (e.estimated_value || 0), 0);
  const activeEnquiriesCount = enquiries.filter((e) => e.status !== 'Converted' && e.status !== 'Lost').length;

  const handleCreateNew = () => {
    setEditingEnquiry(null);
    setIsNewEnquiryOpen(true);
  };

  const handleEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setIsNewEnquiryOpen(true);
  };

  const handleScheduleVisit = (enquiry: Enquiry) => {
    setSchedulingVisitForEnquiry(enquiry);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Converted':
        return 'completed';
      case 'Estimate Prepared':
      case 'Site Visit Planned':
        return 'in-progress';
      case 'New':
      case 'Contacted':
        return 'active';
      case 'Lost':
        return 'overdue';
      default:
        return 'draft';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading tracking-tight">
            Enquiries
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Active business inquiries, design requests, and estimate follow-ups
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-white border border-[#E2DDD5] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={cn(
                'p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                viewMode === 'pipeline'
                  ? 'bg-[#4A0E0E] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#242424]'
              )}
              title="Pipeline stages view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Stages
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-[#4A0E0E] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#242424]'
              )}
              title="List table view"
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleCreateNew}
            className="shadow-xs min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + New Enquiry
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Total Enquiries
            </span>
            <Briefcase className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] font-heading mt-2">
            {enquiries.length}
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
          </div>
          <p className="text-2xl font-bold text-[#C99A2E] font-heading mt-2">
            {activeEnquiriesCount}
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Potential Work Scope Value
            </span>
            <TrendingUp className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-2xl font-bold text-[#1E6B37] font-heading mt-2 font-mono">
            {formatINR(totalValue)}
          </p>
        </div>
      </div>

      {/* Search & Status Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-[#E2DDD5] rounded-xl">
        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px]',
              selectedStatus === 'all'
                ? 'bg-[#4A0E0E] text-white'
                : 'bg-[#F7F5F0] text-[#6B6B6B] hover:text-[#242424]'
            )}
          >
            All ({enquiries.length})
          </button>
          {PIPELINE_STATUSES.map((status) => {
            const count = enquiries.filter((e) => e.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px]',
                  selectedStatus === status
                    ? 'bg-[#4A0E0E] text-white'
                    : 'bg-[#F7F5F0] text-[#6B6B6B] hover:text-[#242424]'
                )}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        <div className="self-start sm:self-auto shrink-0">
          <Search
            size="sm"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search enquiries..."
          />
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load enquiries"
          description={error?.message || 'Unable to retrieve enquiries.'}
          onRetry={refetch}
        />
      ) : enquiries.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6 text-[#4A0E0E]" />}
          title={searchTerm || selectedStatus !== 'all' ? 'No matching enquiries' : 'No enquiries yet'}
          description={
            searchTerm || selectedStatus !== 'all'
              ? 'No business opportunities match your current filter criteria.'
              : 'Add your first prospective job requirement to track quotes and schedule site visits.'
          }
          actionLabel="+ New Enquiry"
          onAction={handleCreateNew}
        />
      ) : viewMode === 'pipeline' ? (
        /* Pipeline / Stage Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enquiries.map((enq) => (
            <div
              key={enq.id}
              className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3 hover:border-[#C99A2E] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#4A0E0E] uppercase tracking-wider">
                    {enq.service_type?.name || 'General Construction'}
                  </span>
                  <StatusBadge variant={getStatusVariant(enq.status)}>
                    {enq.status}
                  </StatusBadge>
                </div>

                <div>
                  <h3
                    onClick={() => enq.customer && navigate(`/customers/${enq.customer.id}`)}
                    className="text-sm font-bold text-[#242424] hover:text-[#4A0E0E] cursor-pointer transition-colors"
                  >
                    {enq.customer?.name || 'Unknown Client'}
                  </h3>
                  {enq.customer?.phone && (
                    <a
                      href={`tel:${enq.customer.phone}`}
                      className="text-xs text-[#6B6B6B] hover:text-[#1E6B37] font-mono flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3 text-[#1E6B37]" />
                      +91 {enq.customer.phone}
                    </a>
                  )}
                </div>

                <p className="text-xs text-[#242424] leading-relaxed line-clamp-3 bg-[#F7F5F0]/60 p-2.5 rounded-lg border border-[#E2DDD5]/60">
                  {enq.description}
                </p>
              </div>

              {/* Card Meta & Bottom Actions */}
              <div className="space-y-3 pt-2 border-t border-[#E2DDD5]/60">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6B6B6B] text-[10px] block">Expected Budget</span>
                    <span className="font-bold text-[#242424] font-mono">
                      {enq.estimated_value ? formatINR(enq.estimated_value) : 'TBD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] text-[10px] block">Follow-up Date</span>
                    <span className="text-[#242424] font-mono">
                      {enq.follow_up_date || 'None'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleScheduleVisit(enq)}
                    className="flex items-center justify-center gap-1 py-2 px-1.5 bg-[#F9F3E5] hover:bg-[#F9F3E5]/80 text-[#4A0E0E] border border-[#C99A2E]/40 rounded-lg text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#C99A2E]" />
                    Visit
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/estimates/new?customer_id=${enq.customer_id}&enquiry_id=${enq.id}`)}
                    className="flex items-center justify-center gap-1 py-2 px-1.5 bg-[#F7F5F0] hover:bg-[#F9F3E5] text-[#242424] border border-[#E2DDD5] rounded-lg text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-[#C99A2E]" />
                    Estimate
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(enq)}
                    className="flex items-center justify-center gap-1 py-2 px-1.5 bg-white hover:bg-[#F7F5F0] text-[#242424] border border-[#E2DDD5] rounded-lg text-xs font-semibold transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    Stage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-10 bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                <th className="pl-6 pr-4">Client</th>
                <th className="px-4">Requirement / Scope</th>
                <th className="px-4">Service</th>
                <th className="px-4">Est. Value</th>
                <th className="px-4">Follow-up</th>
                <th className="px-4">Stage</th>
                <th className="pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5]/60 text-sm">
              {enquiries.map((enq) => (
                <tr key={enq.id} className="h-14 hover:bg-[#F9F3E5]/40 transition-colors">
                  <td className="pl-6 pr-4">
                    <span
                      onClick={() => enq.customer && navigate(`/customers/${enq.customer.id}`)}
                      className="font-bold text-[#242424] hover:text-[#4A0E0E] cursor-pointer"
                    >
                      {enq.customer?.name || 'Unknown'}
                    </span>
                    {enq.customer?.phone && (
                      <p className="text-[11px] text-[#6B6B6B] font-mono">
                        +91 {enq.customer.phone}
                      </p>
                    )}
                  </td>

                  <td className="px-4">
                    <p className="text-xs text-[#242424] line-clamp-1 max-w-[240px]">
                      {enq.description}
                    </p>
                  </td>

                  <td className="px-4">
                    <span className="text-xs text-[#6B6B6B]">
                      {enq.service_type?.name || 'General'}
                    </span>
                  </td>

                  <td className="px-4 font-mono font-medium text-xs text-[#242424]">
                    {enq.estimated_value ? formatINR(enq.estimated_value) : '—'}
                  </td>

                  <td className="px-4 text-xs font-mono text-[#6B6B6B]">
                    {enq.follow_up_date || '—'}
                  </td>

                  <td className="px-4">
                    <StatusBadge variant={getStatusVariant(enq.status)}>
                      {enq.status}
                    </StatusBadge>
                  </td>

                  <td className="pr-6 pl-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleVisit(enq)}
                        className="h-8 text-xs cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 mr-1 text-[#C99A2E]" />
                        Visit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/estimates/new?customer_id=${enq.customer_id}&enquiry_id=${enq.id}`)}
                        className="h-8 text-xs cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5 mr-1 text-[#C99A2E]" />
                        Estimate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(enq)}
                        className="h-8 text-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawers */}
      <EnquiryFormDrawer
        isOpen={isNewEnquiryOpen}
        onClose={() => {
          setIsNewEnquiryOpen(false);
          setEditingEnquiry(null);
        }}
        enquiry={editingEnquiry}
      />

      <SiteVisitFormDrawer
        isOpen={Boolean(schedulingVisitForEnquiry)}
        onClose={() => setSchedulingVisitForEnquiry(null)}
        customerId={schedulingVisitForEnquiry?.customer_id}
        enquiryId={schedulingVisitForEnquiry?.id}
      />
    </div>
  );
}
