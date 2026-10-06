import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { indianPhoneRegex, type Customer } from '@/types/business';
import { Button } from '@/components/ui/Button';

interface SimpleCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess?: (customer: Customer) => void;
  onRequestCreateSite?: (customer: Customer) => void;
}

export const SimpleCustomerModal: React.FC<SimpleCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const isEditing = Boolean(customer);
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setLocation(customer.address || '');
    } else {
      setName('');
      setPhone('');
      setLocation('');
    }
    setErrorMsg(null);
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a customer name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim().replace(/\s+/g, '');
    if (trimmedPhone && !indianPhoneRegex.test(trimmedPhone)) {
      setErrorMsg('Please enter a valid 10-digit phone number (starts with 6-9).');
      return;
    }

    try {
      if (isEditing && customer) {
        const updated = await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data: {
            name: trimmedName,
            phone: trimmedPhone || undefined,
            address: location.trim() || undefined,
            status: 'active',
          },
        });
        if (updated && onSuccess) onSuccess(updated);
        onClose();
      } else {
        const created = await createCustomerMutation.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone || undefined,
          address: location.trim() || undefined,
          status: 'active',
        });
        if (created && onSuccess) onSuccess(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save customer. Please try again.';
      setErrorMsg(msg);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      try {
        await deleteCustomerMutation.mutateAsync(customer.id);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to delete customer.';
        setErrorMsg(msg);
      }
    }
  };

  const isSaving =
    createCustomerMutation.isPending ||
    updateCustomerMutation.isPending ||
    deleteCustomerMutation.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242424]/60 backdrop-blur-xs modal-backdrop-spring"
        onClick={() => {
          if (!isSaving) onClose();
        }}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2DDD5] z-10 overflow-hidden flex flex-col modal-spring">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F5F0]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="customer-modal-title"
                className="text-base font-bold text-[#242424] font-heading leading-tight"
              >
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-lg border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-[#FCEEEE] border border-[#9E2A2B]/30 rounded-xl text-xs text-[#9E2A2B] font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="simple-customer-name" className="block text-xs font-bold text-[#242424] mb-1">
                  Name <span className="text-[#9E2A2B]">*</span>
                </label>
                <input
                  id="simple-customer-name"
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="simple-customer-phone" className="block text-xs font-bold text-[#242424] mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-semibold text-[#6B6B6B]">
                    +91
                  </span>
                  <input
                    id="simple-customer-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 pl-11 pr-3 text-sm bg-white border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  10-digit mobile number
                </p>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="simple-customer-location" className="block text-xs font-bold text-[#242424] mb-1">
                  Location
                </label>
                <input
                  id="simple-customer-location"
                  type="text"
                  placeholder="e.g. Nagercoil, Madurai, Tirunelveli"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/20 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {isEditing && customer ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-11 px-3 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={isSaving}
                    className="h-11 px-5 text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    className="h-11 px-6 text-sm font-bold min-w-[120px]"
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Update Customer' : 'Save Customer'}
                  </Button>
                </div>
              </div>
            </form>
      </div>
    </div>
  );
};
