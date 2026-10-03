import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { siteVisitSchema, type SiteVisitFormData, type SiteVisit } from '@/types/business';
import { useCreateSiteVisit, useUpdateSiteVisit } from '@/hooks/useSiteVisits';
import { useCustomers } from '@/hooks/useCustomers';
import { useEnquiries } from '@/hooks/useEnquiries';
import { useCompanyProfiles } from '@/hooks/useBusinessLookups';

interface SiteVisitFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  siteVisit?: SiteVisit | null;
  customerId?: string;
  enquiryId?: string;
  onSuccess?: (savedVisit: SiteVisit) => void;
}

export function SiteVisitFormDrawer({
  isOpen,
  onClose,
  siteVisit,
  customerId,
  enquiryId,
  onSuccess,
}: SiteVisitFormDrawerProps) {
  const isEditing = Boolean(siteVisit);
  const createMutation = useCreateSiteVisit();
  const updateMutation = useUpdateSiteVisit();

  const { data: customers = [] } = useCustomers({ status: 'all' });
  const { data: profiles = [] } = useCompanyProfiles();

  const todayStr = '2026-10-02';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SiteVisitFormData>({
    resolver: zodResolver(siteVisitSchema),
    defaultValues: {
      customer_id: customerId || '',
      enquiry_id: enquiryId || null,
      site_address: '',
      visit_date: todayStr,
      assigned_to: null,
      purpose: 'Initial site measurement & boundary line elevation survey',
      observations: '',
      notes: '',
      status: 'Scheduled',
    },
  });

  const selectedCustomerId = watch('customer_id');

  // Load enquiries for this customer to ensure relational cross-company & customer integrity
  const { data: customerEnquiries = [] } = useEnquiries({
    customerId: selectedCustomerId || undefined,
  });

  // When customer changes, if site_address is empty, prefill with customer address
  useEffect(() => {
    if (selectedCustomerId && !isEditing) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust?.address) {
        setValue('site_address', cust.address);
      }
    }
  }, [selectedCustomerId, customers, isEditing, setValue]);

  useEffect(() => {
    if (siteVisit) {
      reset({
        customer_id: siteVisit.customer_id,
        enquiry_id: siteVisit.enquiry_id || null,
        site_address: siteVisit.site_address || '',
        visit_date: siteVisit.visit_date || todayStr,
        assigned_to: siteVisit.assigned_to || null,
        purpose: siteVisit.purpose || '',
        observations: siteVisit.observations || '',
        notes: siteVisit.notes || '',
        status: siteVisit.status || 'Scheduled',
      });
    } else {
      const initialCustId = customerId || (customers[0]?.id ?? '');
      const cust = customers.find((c) => c.id === initialCustId);

      reset({
        customer_id: initialCustId,
        enquiry_id: enquiryId || null,
        site_address: cust?.address || '',
        visit_date: todayStr,
        assigned_to: profiles[0]?.id ?? null,
        purpose: 'Initial site measurement & boundary line elevation survey',
        observations: '',
        notes: '',
        status: 'Scheduled',
      });
    }
  }, [siteVisit, customerId, enquiryId, customers, profiles, reset, isOpen]);

  const onSubmit = async (data: SiteVisitFormData) => {
    try {
      if (isEditing && siteVisit) {
        const updated = await updateMutation.mutateAsync({
          id: siteVisit.id,
          data,
        });
        if (updated && onSuccess) onSuccess(updated);
      } else {
        const created = await createMutation.mutateAsync(data);
        if (created && onSuccess) onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save site visit:', err);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const errorMsg = createMutation.error?.message || updateMutation.error?.message;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Site Visit' : 'Schedule Site Visit'}
      subtitle={
        isEditing
          ? 'Update visit date, supervisor assignment, or site address'
          : 'Plan on-site measurement, survey, structural check, or client consultation'
      }
      width="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errorMsg && (
          <div className="p-3 bg-[#FCEEEE] border border-[#9E2A2B]/30 rounded-lg text-xs text-[#9E2A2B]">
            {errorMsg}
          </div>
        )}

        {/* Customer Select */}
        <div>
          <label htmlFor="visit-customer" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Customer / Client <span className="text-[#9E2A2B]">*</span>
          </label>
          <select
            id="visit-customer"
            disabled={Boolean(customerId) || isEditing}
            className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors disabled:bg-[#EFECE6] disabled:text-[#6B6B6B]"
            {...register('customer_id')}
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
          {errors.customer_id && (
            <p className="mt-1 text-xs text-[#9E2A2B]">{errors.customer_id.message}</p>
          )}
        </div>

        {/* Linked Enquiry (Optional) */}
        <div>
          <label htmlFor="visit-enquiry" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Linked Business Enquiry (Optional)
          </label>
          <select
            id="visit-enquiry"
            className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
            {...register('enquiry_id')}
          >
            <option value="">-- No specific enquiry (general visit) --</option>
            {customerEnquiries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.description ? (e.description.length > 50 ? `${e.description.slice(0, 50)}...` : e.description) : 'Enquiry'} ({e.status})
              </option>
            ))}
          </select>
        </div>

        {/* Visit Date & Assigned Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="visit-date" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Visit Date <span className="text-[#9E2A2B]">*</span>
            </label>
            <input
              id="visit-date"
              type="date"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('visit_date')}
            />
            {errors.visit_date && (
              <p className="mt-1 text-xs text-[#9E2A2B]">{errors.visit_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="visit-assigned-to" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Assigned Supervisor / Engineer
            </label>
            <select
              id="visit-assigned-to"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('assigned_to')}
            >
              <option value="">-- Unassigned --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Site Address */}
        <div>
          <label htmlFor="visit-address" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Site / Plot Location Address
          </label>
          <textarea
            id="visit-address"
            rows={2}
            placeholder="Plot No., Landmark, Street, Village/Town"
            className="w-full p-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors resize-none"
            {...register('site_address')}
          />
        </div>

        {/* Purpose */}
        <div>
          <label htmlFor="visit-purpose" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Visit Purpose / Inspection Scope
          </label>
          <input
            id="visit-purpose"
            type="text"
            placeholder="e.g. Initial measurement, elevation check, false ceiling levels"
            className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
            {...register('purpose')}
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="visit-status" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Visit Status
          </label>
          <select
            id="visit-status"
            className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
            {...register('status')}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="visit-notes" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Pre-visit Instructions / Notes
          </label>
          <textarea
            id="visit-notes"
            rows={2}
            placeholder="Coordinates, key person to meet at site, or required testing tools"
            className="w-full p-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors resize-none"
            {...register('notes')}
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E2DDD5] flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Schedule Visit'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
