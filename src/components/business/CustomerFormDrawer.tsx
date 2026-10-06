import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import { customerSchema, type CustomerFormData, type Customer } from '@/types/business';
import { useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';

interface CustomerFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess?: (savedCustomer: Customer) => void;
}

export function CustomerFormDrawer({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: CustomerFormDrawerProps) {
  const isEditing = Boolean(customer);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
        status: customer.status || 'active',
      });
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        status: 'active',
      });
    }
  }, [customer, reset, isOpen]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEditing && customer) {
        const updated = await updateMutation.mutateAsync({
          id: customer.id,
          data,
        });
        if (updated && onSuccess) onSuccess(updated);
      } else {
        const created = await createMutation.mutateAsync(data);
        if (created && onSuccess) onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save customer:', err);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(customer.id);
      onClose();
    }
  };

  const isSaving =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;
  const errorMsg =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    deleteMutation.error?.message;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer' : 'New Customer'}
      subtitle={
        isEditing
          ? 'Update client contact details and site address'
          : 'Register client profile, site location, phone, and billing details'
      }
      width="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {errorMsg && (
          <div className="p-3 bg-[#FCEEEE] border border-[#9E2A2B]/30 rounded-lg text-xs text-[#9E2A2B]">
            {errorMsg.includes('duplicate') ? 'A customer with this record already exists.' : errorMsg}
          </div>
        )}

        {/* Customer Name */}
        <div>
          <label htmlFor="customer-name" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Customer Name <span className="text-[#9E2A2B]">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="e.g. Arun Kumar, Priya Menon"
            className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-[#9E2A2B]">{errors.name.message}</p>
          )}
        </div>

        {/* Phone & Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer-phone" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-medium text-[#6B6B6B]">
                +91
              </span>
              <input
                id="customer-phone"
                type="tel"
                inputMode="numeric"
                placeholder="9840123456"
                className="w-full h-10 pl-11 pr-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-[#9E2A2B]">{errors.phone.message}</p>
            )}
            <p className="mt-1 text-[11px] text-[#6B6B6B]">10 digits mobile number</p>
          </div>

          <div>
            <label htmlFor="customer-email" className="block text-xs font-semibold text-[#242424] mb-1.5">
              Email Address
            </label>
            <input
              id="customer-email"
              type="email"
              placeholder="client@example.com"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[#9E2A2B]">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Site / Permanent Address */}
        <div>
          <label htmlFor="customer-address" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Address / Site Location
          </label>
          <textarea
            id="customer-address"
            rows={2}
            placeholder="Plot No., Street, Area, City, Pin code"
            className="w-full p-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors resize-none"
            {...register('address')}
          />
          {errors.address && (
            <p className="mt-1 text-xs text-[#9E2A2B]">{errors.address.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="customer-status" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Customer Status
          </label>
          <select
            id="customer-status"
            className="w-full h-10 px-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors"
            {...register('status')}
          >
            <option value="active">Active (Ongoing & prospective client)</option>
            <option value="inactive">Inactive (Past or dormant record)</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="customer-notes" className="block text-xs font-semibold text-[#242424] mb-1.5">
            Internal Construction Notes
          </label>
          <textarea
            id="customer-notes"
            rows={3}
            placeholder="Key preferences, preferred materials, architect references, or special instructions"
            className="w-full p-3 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E] transition-colors resize-none"
            {...register('notes')}
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-[#9E2A2B]">{errors.notes.message}</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E2DDD5] flex items-center justify-between gap-3">
          {isEditing && customer ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isSaving}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Customer'}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
