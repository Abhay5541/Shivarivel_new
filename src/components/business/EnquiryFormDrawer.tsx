import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { enquirySchema, type EnquiryFormData, type Enquiry } from '@/types/business';
import { useCreateEnquiry, useUpdateEnquiry } from '@/hooks/useEnquiries';
import { useCustomers } from '@/hooks/useCustomers';
import { useServiceTypes } from '@/hooks/useBusinessLookups';

interface EnquiryFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry?: Enquiry | null;
  customerId?: string;
  onSuccess?: (savedEnquiry: Enquiry) => void;
}

export function EnquiryFormDrawer({
  isOpen,
  onClose,
  enquiry,
  customerId,
  onSuccess,
}: EnquiryFormDrawerProps) {
  const isEditing = Boolean(enquiry);
  const createMutation = useCreateEnquiry();
  const updateMutation = useUpdateEnquiry();

  const { data: customers = [] } = useCustomers({ status: 'all' });
  const { data: serviceTypes = [] } = useServiceTypes();

  const todayStr = '2026-10-02';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      customer_id: customerId || '',
      service_type_id: null,
      enquiry_date: todayStr,
      source: 'Referral',
      description: '',
      estimated_value: null,
      status: 'New',
      follow_up_date: null,
      notes: '',
    },
  });

  const estimatedValue = watch('estimated_value');

  useEffect(() => {
    if (enquiry) {
      reset({
        customer_id: enquiry.customer_id,
        service_type_id: enquiry.service_type_id || null,
        enquiry_date: enquiry.enquiry_date || todayStr,
        source: enquiry.source || '',
        description: enquiry.description || '',
        estimated_value: enquiry.estimated_value ?? null,
        status: enquiry.status || 'New',
        follow_up_date: enquiry.follow_up_date || null,
        notes: enquiry.notes || '',
      });
    } else {
      reset({
        customer_id: customerId || (customers[0]?.id ?? ''),
        service_type_id: serviceTypes[0]?.id ?? null,
        enquiry_date: todayStr,
        source: 'Referral',
        description: '',
        estimated_value: null,
        status: 'New',
        follow_up_date: null,
        notes: '',
      });
    }
  }, [enquiry, customerId, customers, serviceTypes, reset, isOpen]);

  const onSubmit = async (data: EnquiryFormData) => {
    try {
      if (isEditing && enquiry) {
        const updated = await updateMutation.mutateAsync({
          id: enquiry.id,
          data,
        });
        if (updated && onSuccess) onSuccess(updated);
      } else {
        const created = await createMutation.mutateAsync(data);
        if (created && onSuccess) onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save enquiry:', err);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const errorMsg = createMutation.error?.message || updateMutation.error?.message;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Enquiry' : 'New Business Enquiry'}
      subtitle={
        isEditing
          ? 'Update enquiry details, requirement scope, or follow-up target'
          : 'Capture prospective lead requirement, expected value, and next action'
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
          <label htmlFor="enquiry-customer" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Customer / Client <span className="text-[#9E2A2B]">*</span>
          </label>
          <select
            id="enquiry-customer"
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

        {/* Service Type & Source Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="enquiry-service-type" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Service Scope
            </label>
            <select
              id="enquiry-service-type"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('service_type_id')}
            >
              <option value="">General Construction / Other</option>
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="enquiry-source" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Lead Source
            </label>
            <select
              id="enquiry-source"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('source')}
            >
              <option value="Referral">Client Referral</option>
              <option value="Walk-in">Walk-in Studio Visit</option>
              <option value="Existing Client">Existing Client</option>
              <option value="Social Media">Social Media / Instagram</option>
              <option value="Website">Website / Online</option>
              <option value="Other">Other / Architect Ref</option>
            </select>
          </div>
        </div>

        {/* Work Requirement / Description */}
        <div>
          <label htmlFor="enquiry-description" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Requirement & Scope Details <span className="text-[#9E2A2B]">*</span>
          </label>
          <textarea
            id="enquiry-description"
            rows={3}
            placeholder="e.g. 3BHK complete interior work, modular kitchen with Hafele fittings, master wardrobe & gypsum false ceiling"
            className="w-full p-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors resize-none"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-[#9E2A2B]">{errors.description.message}</p>
          )}
        </div>

        {/* Estimated Value & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="enquiry-estimated-value" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Expected Budget / Value (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-semibold text-[#6B6B6B]">
                ₹
              </span>
              <input
                id="enquiry-estimated-value"
                type="number"
                step="5000"
                placeholder="450000"
                className="w-full h-10 pl-8 pr-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
                {...register('estimated_value', {
                  setValueAs: (v) => (v === '' || v === null ? null : parseFloat(v)),
                })}
              />
            </div>
            {errors.estimated_value && (
              <p className="mt-1 text-xs text-[#9E2A2B]">{errors.estimated_value.message}</p>
            )}
            {estimatedValue !== null && estimatedValue !== undefined && !isNaN(Number(estimatedValue)) && (
              <p className="mt-1 text-[11px] text-[#C99A2E] font-medium">
                Approx. ₹{Number(estimatedValue).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="enquiry-status" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Pipeline Stage
            </label>
            <select
              id="enquiry-status"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('status')}
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Site Visit Planned">Site Visit Planned</option>
              <option value="Estimate Prepared">Estimate Prepared</option>
              <option value="Converted">Converted (Won)</option>
              <option value="On Hold">On Hold</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Date & Follow-up Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="enquiry-date" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Enquiry Date <span className="text-[#9E2A2B]">*</span>
            </label>
            <input
              id="enquiry-date"
              type="date"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('enquiry_date')}
            />
            {errors.enquiry_date && (
              <p className="mt-1 text-xs text-[#9E2A2B]">{errors.enquiry_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="enquiry-follow-up-date" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Next Follow-up Date
            </label>
            <input
              id="enquiry-follow-up-date"
              type="date"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('follow_up_date')}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="enquiry-notes" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Internal Follow-up Notes
          </label>
          <textarea
            id="enquiry-notes"
            rows={2}
            placeholder="Special client terms, discussion summary, or architectural references"
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
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Record Enquiry'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
