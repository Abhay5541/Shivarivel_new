import { useState, useEffect } from 'react';
import { Phone, MapPin, Calendar, User, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { SiteVisit } from '@/types/business';
import { useUpdateSiteVisit } from '@/hooks/useSiteVisits';

interface SiteVisitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteVisit: SiteVisit | null;
  onEdit?: (visit: SiteVisit) => void;
}

export function SiteVisitDetailModal({
  isOpen,
  onClose,
  siteVisit,
  onEdit,
}: SiteVisitDetailModalProps) {
  const updateMutation = useUpdateSiteVisit();
  const [observations, setObservations] = useState(siteVisit?.observations || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (siteVisit) {
      setObservations(siteVisit.observations || '');
    }
  }, [siteVisit]);

  if (!siteVisit) return null;

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

  const handleSaveObservations = async () => {
    try {
      await updateMutation.mutateAsync({
        id: siteVisit.id,
        data: { observations },
      });
      onClose();
    } catch (err) {
      console.error('Failed to save observations:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled') => {
    try {
      setIsUpdatingStatus(true);
      await updateMutation.mutateAsync({
        id: siteVisit.id,
        data: { status: newStatus, observations },
      });
      onClose();
    } catch (err) {
      console.error('Failed to update visit status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Site Visit Record"
      description={`Visit on ${siteVisit.visit_date} for ${siteVisit.customer?.name || 'Customer'}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Top Status Bar & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#6B6B6B]">Status:</span>
            <StatusBadge variant={getStatusVariant(siteVisit.status)}>
              {siteVisit.status}
            </StatusBadge>
          </div>

          <div className="flex items-center gap-2">
            {siteVisit.customer?.phone && (
              <a
                href={`tel:${siteVisit.customer.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1E6B37] text-white rounded-lg hover:bg-[#1E6B37]/90 active:scale-95 transition-all shadow-2xs min-h-[36px]"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Customer
              </a>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(siteVisit);
                }}
              >
                Edit Visit
              </Button>
            )}
          </div>
        </div>

        {/* Customer & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
              <User className="w-4 h-4 text-[#C99A2E]" />
              Client Details
            </div>
            <p className="text-sm font-bold text-[#242424]">
              {siteVisit.customer?.name || 'Unknown Client'}
            </p>
            {siteVisit.customer?.phone && (
              <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#C99A2E]" />
                +91 {siteVisit.customer.phone}
              </p>
            )}
          </div>

          <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#C99A2E]" />
              Site Location
            </div>
            <p className="text-xs text-[#242424] leading-relaxed">
              {siteVisit.site_address || siteVisit.customer?.address || 'Address not specified'}
            </p>
          </div>
        </div>

        {/* Visit Details Box */}
        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#6B6B6B] font-medium block">Inspection Date:</span>
              <span className="font-semibold text-[#242424] flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#C99A2E]" />
                {siteVisit.visit_date}
              </span>
            </div>
            <div>
              <span className="text-[#6B6B6B] font-medium block">Assigned Engineer:</span>
              <span className="font-semibold text-[#242424] flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-[#C99A2E]" />
                {siteVisit.assigned_profile?.full_name || 'Unassigned'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-[#6B6B6B] font-medium block">Purpose / Scope:</span>
            <p className="text-xs font-medium text-[#242424] mt-0.5">
              {siteVisit.purpose || 'Initial site inspection & customer consultation'}
            </p>
          </div>

          {siteVisit.enquiry && (
            <div className="p-2.5 bg-[#F9F3E5]/60 border border-[#C99A2E]/30 rounded-lg text-xs text-[#242424]">
              <span className="font-bold text-[#4A0E0E]">Linked Enquiry:</span> {siteVisit.enquiry.description}
            </div>
          )}
        </div>

        {/* Observations & Field Findings */}
        <div>
          <label htmlFor="modal-observations" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Field Observations & Measurements
          </label>
          <textarea
            id="modal-observations"
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Record plot dimensions, level differences, existing wiring, plumbing conduits, soil type, or client instructions..."
            className="w-full p-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors resize-none"
          />
          <p className="mt-1 text-[11px] text-[#6B6B6B]">
            Site engineers can record exact measurements and findings directly from the phone.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#E2DDD5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {siteVisit.status !== 'Completed' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('Completed')}
                className="bg-[#1E6B37] hover:bg-[#1E6B37]/90 text-white min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Mark Completed
              </Button>
            )}
            {siteVisit.status !== 'Cancelled' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('Cancelled')}
                className="text-[#9E2A2B] hover:bg-[#FCEEEE] min-h-[44px]"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Cancel Visit
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="min-h-[44px]">
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveObservations}
              disabled={updateMutation.isPending}
              className="min-h-[44px]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Observations'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
