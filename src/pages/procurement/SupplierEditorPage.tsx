import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Building2,
  Save,
  Phone,
  AlertCircle,
} from 'lucide-react';
import {
  supplierFormSchema,
  type SupplierFormData,
  MATERIAL_CATEGORIES,
} from '@/types/procurement';
import { useSupplier, useCreateSupplier, useUpdateSupplier } from '@/hooks/useProcurement';

export const SupplierEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingSupplier } = useSupplier(id);
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      alternate_phone: '',
      email: '',
      address: '',
      gst_number: '',
      category: 'Cement & Masonry',
      notes: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (existingSupplier) {
      reset({
        name: existingSupplier.name,
        contact_person: existingSupplier.contact_person || '',
        phone: existingSupplier.phone || '',
        alternate_phone: existingSupplier.alternate_phone || '',
        email: existingSupplier.email || '',
        address: existingSupplier.address || '',
        gst_number: existingSupplier.gst_number || '',
        category: existingSupplier.category || 'Cement & Masonry',
        notes: existingSupplier.notes || '',
        status: existingSupplier.status,
      });
    }
  }, [existingSupplier, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (isEditing && id) {
        await updateSupplierMutation.mutateAsync({ id, payload: data });
        navigate(`/suppliers/${id}`);
      } else {
        const created = await createSupplierMutation.mutateAsync(data);
        navigate(`/suppliers/${created.id}`);
      }
    } catch (err) {
      console.error('Failed to save supplier:', err);
    }
  };

  const isSaving = isSubmitting || createSupplierMutation.isPending || updateSupplierMutation.isPending;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/suppliers/${id}` : '/suppliers')}
            className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-1.5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {isEditing ? 'Back to Supplier Detail' : 'Back to Suppliers'}
          </button>
          <h1 className="text-2xl font-bold text-[#242424] font-heading mt-1">
            {isEditing ? `Edit Supplier: ${existingSupplier?.name || ''}` : 'New Material Vendor / Supplier'}
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Register vendor business identity, payment terms, contact details, and tax registration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/suppliers/${id}` : '/suppliers')}
            className="px-4 py-2.5 rounded-lg border border-[#E2DDD5] bg-white text-xs font-semibold text-[#242424] hover:bg-[#F7F5F0] transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Business Identity & Category */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <Building2 className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
              Vendor Business Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Supplier / Business Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Madurai TMT Steels & Cements"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
              {errors.name && (
                <p className="text-[11px] text-[#A84B14] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Primary Supply Category
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                {MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Supplier Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                <option value="active">Active (Procurement Allowed)</option>
                <option value="inactive">Inactive / On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Tax Information */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <Phone className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#242424]">
              Contact Details & Tax Registration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Contact Person / Sales Manager
              </label>
              <input
                type="text"
                {...register('contact_person')}
                placeholder="e.g. R. Sundaramoorthy"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Primary Phone (10-digit Indian Mobile)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                {...register('phone')}
                placeholder="e.g. 9842144556"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
              {errors.phone && (
                <p className="text-[11px] text-[#A84B14] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Alternate Phone / Landline
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                {...register('alternate_phone')}
                placeholder="e.g. 9842144557"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
              {errors.alternate_phone && (
                <p className="text-[11px] text-[#A84B14] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.alternate_phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="e.g. vendor@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
              {errors.email && (
                <p className="text-[11px] text-[#A84B14] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                GSTIN / GST Number
              </label>
              <input
                type="text"
                {...register('gst_number')}
                placeholder="e.g. 33AABCM1234F1Z1"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono uppercase text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
              <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                Recorded for GST billing records (Rule 18 immutable invoicing)
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Yard / Shop / Factory Address
              </label>
              <textarea
                rows={2}
                {...register('address')}
                placeholder="e.g. Shed 14, SIDCO Industrial Estate, Kappalur, Madurai"
                className="w-full px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Credit Terms & Operational Notes
              </label>
              <textarea
                rows={2}
                {...register('notes')}
                placeholder="e.g. 15-day credit period. Delivery charges included for full truckloads."
                className="w-full px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
              />
            </div>
          </div>
        </div>

        {/* Mobile Sticky Save Button */}
        <div className="sm:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E2DDD5] flex gap-2 z-20">
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/suppliers/${id}` : '/suppliers')}
            className="flex-1 py-3 border border-[#E2DDD5] rounded-lg text-xs font-bold text-[#242424] bg-white min-h-[48px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 bg-[#4A0E0E] text-white rounded-lg text-xs font-bold shadow-xs min-h-[48px]"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SupplierEditorPage;
