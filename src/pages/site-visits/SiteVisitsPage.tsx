import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Phone,
  MapPin,
  User,
  Edit2,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SiteVisitFormDrawer } from '@/components/business/SiteVisitFormDrawer';
import { SiteVisitDetailModal } from '@/components/business/SiteVisitDetailModal';
import { useSiteVisits } from '@/hooks/useSiteVisits';
import type { SiteVisit } from '@/types/business';
import { cn } from '@/lib/utils';

export function SiteVisitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');

  // Modals & Drawers
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SiteVisit | null>(null);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<SiteVisit | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingVisit(null);
      setIsScheduleDrawerOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    data: siteVisits = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteVisits({
    filter: filterTab,
  });

  const handleCreateNew = () => {
    setEditingVisit(null);
    setIsScheduleDrawerOpen(true);
  };

  const handleEdit = (visit: SiteVisit, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingVisit(visit);
    setIsScheduleDrawerOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'Scheduled':
        return 'active';
      case 'Rescheduled':
        return 'pending';
      case 'Cancelled':
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
            Site Visits
          </h1>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleCreateNew}
          className="shadow-xs min-h-[44px] cursor-pointer"
        >
          <Compass className="w-4 h-4 mr-2" />
          Schedule Site Visit
        </Button>
      </div>

      {/* KPI & Filter Tabs Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-[#E2DDD5] rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Visits' },
            { id: 'today', label: "Today's Agenda" },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Completed / Past' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={cn(
                'px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 min-h-[40px]',
                filterTab === tab.id
                  ? 'bg-[#4A0E0E] text-white shadow-2xs'
                  : 'bg-white text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#F7F5F0] hover:text-[#242424]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#6B6B6B] font-medium hidden sm:block">
          Total visits matching filter: <strong className="text-[#242424]">{siteVisits.length}</strong>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load site visits"
          description={error?.message || 'Unable to retrieve scheduled visits.'}
          onRetry={refetch}
        />
      ) : siteVisits.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-6 h-6 text-[#4A0E0E]" />}
          title={filterTab !== 'all' ? 'No site visits matching filter' : 'No site visits scheduled'}
          description={
            filterTab !== 'all'
              ? 'There are no visits recorded under this tab. Switch tabs or schedule a new visit.'
              : undefined
          }
          actionLabel="Schedule Site Visit"
          onAction={handleCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {siteVisits.map((visit) => (
            <div
              key={visit.id}
              onClick={() => setSelectedVisitDetail(visit)}
              className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3 cursor-pointer hover:border-[#C99A2E] active:scale-[0.99] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Top Row: Date & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#242424] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#C99A2E]" />
                      {visit.visit_date}
                    </span>
                    {visit.visit_date === '2026-10-02' && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-[#F9F3E5] text-[#C99A2E] border border-[#C99A2E]/30 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <StatusBadge variant={getStatusVariant(visit.status)}>
                      {visit.status}
                    </StatusBadge>
                    <button
                      type="button"
                      onClick={(e) => handleEdit(visit, e)}
                      className="p-1 text-[#6B6B6B] hover:text-[#C99A2E] hover:bg-[#F9F3E5] rounded transition-colors"
                      title="Edit site visit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Customer & Location */}
                <div>
                  <h3
                    onClick={(e) => {
                      if (visit.customer) {
                        e.stopPropagation();
                        navigate(`/customers/${visit.customer.id}`);
                      }
                    }}
                    className="text-sm font-bold text-[#242424] hover:text-[#4A0E0E] transition-colors"
                  >
                    {visit.customer?.name || 'Unknown Client'}
                  </h3>

                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mt-1 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                    <span>{visit.site_address || visit.customer?.address || 'Site address not specified'}</span>
                  </p>
                </div>

                {/* Purpose */}
                <p className="text-xs text-[#242424] font-medium leading-relaxed bg-[#F7F5F0]/60 p-2.5 rounded-lg border border-[#E2DDD5]/60">
                  <span className="font-bold text-[#4A0E0E]">Purpose:</span> {visit.purpose || 'Initial inspection & client consultation'}
                </p>

                {/* Observations preview */}
                {visit.observations && (
                  <p className="text-[11px] text-[#6B6B6B] line-clamp-2 italic">
                    "{visit.observations}"
                  </p>
                )}
              </div>

              {/* Card Footer: Supervisor & Call / Detail buttons */}
              <div className="pt-3 border-t border-[#E2DDD5]/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#6B6B6B]" />
                    {visit.assigned_profile?.full_name || 'Unassigned'}
                  </span>

                  <span className="text-[11px] font-mono">
                    ID: {visit.id.slice(0, 8)}
                  </span>
                </div>

                {/* Actions (Touch Target >= 48px on mobile) */}
                <div className="grid grid-cols-2 gap-2">
                  {visit.customer?.phone ? (
                    <a
                      href={`tel:${visit.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/30 rounded-lg text-xs font-bold hover:bg-[#EAF5EE]/80 active:scale-95 transition-all min-h-[44px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Client
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="py-2.5 px-3 bg-[#F7F5F0] text-[#8C8880] rounded-lg text-xs font-medium min-h-[44px]"
                    >
                      No Phone
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedVisitDetail(visit)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-[#F9F3E5] text-[#242424] border border-[#E2DDD5] rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-[#C99A2E]" />
                    Update / Notes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule / Edit Drawer */}
      <SiteVisitFormDrawer
        isOpen={isScheduleDrawerOpen}
        onClose={() => {
          setIsScheduleDrawerOpen(false);
          setEditingVisit(null);
        }}
        siteVisit={editingVisit}
      />

      {/* Detail & Observation Modal */}
      <SiteVisitDetailModal
        isOpen={Boolean(selectedVisitDetail)}
        onClose={() => setSelectedVisitDetail(null)}
        siteVisit={selectedVisitDetail}
        onEdit={(visit) => {
          setEditingVisit(visit);
          setIsScheduleDrawerOpen(true);
        }}
      />
    </div>
  );
}
