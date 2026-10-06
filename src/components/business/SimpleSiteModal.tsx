import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import type { Project } from '@/types/projects';
import type { Customer } from '@/types/business';
import { Button } from '@/components/ui/Button';

interface SimpleSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  site?: Project | null;
  preselectedCustomer?: Customer | null;
  preselectedCustomerId?: string | null;
  defaultLocation?: string | null;
  onSuccess?: (site: Project) => void;
}

export const SimpleSiteModal: React.FC<SimpleSiteModalProps> = ({
  isOpen,
  onClose,
  site,
  preselectedCustomer,
  preselectedCustomerId,
  defaultLocation,
  onSuccess,
}) => {
  const isEditing = Boolean(site);
  const { data: customers = [] } = useCustomers();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const [customerId, setCustomerId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (site) {
      setCustomerId(site.customer_id || '');
      setSiteName(site.name || '');
      setLocation(site.site_address || '');
    } else {
      const initialCustId =
        preselectedCustomer?.id || preselectedCustomerId || (customers.length > 0 ? customers[0].id : '');
      setCustomerId(initialCustId);
      setSiteName('');
      setLocation(defaultLocation || preselectedCustomer?.address || '');
    }
    setErrorMsg(null);
  }, [site, preselectedCustomer, preselectedCustomerId, defaultLocation, isOpen, customers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId) {
      setErrorMsg('Please select a client for this project.');
      return;
    }

    const trimmedName = siteName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a project name (at least 2 characters).');
      return;
    }

    try {
      if (isEditing && site) {
        const updated = await updateProjectMutation.mutateAsync({
          id: site.id,
          payload: {
            customer_id: customerId,
            name: trimmedName,
            site_address: location.trim() || null,
            status: site.status || 'Active',
          },
        });
        if (updated && onSuccess) onSuccess(updated);
        onClose();
      } else {
        const created = await createProjectMutation.mutateAsync({
          customer_id: customerId,
          name: trimmedName,
          site_address: location.trim() || null,
          status: 'Active',
        });
        if (created && onSuccess) onSuccess(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save project. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = createProjectMutation.isPending || updateProjectMutation.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-modal-title"
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
            <div className="w-9 h-9 rounded-lg bg-[#C99A2E] text-white flex items-center justify-center shadow-xs font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="site-modal-title"
                className="text-base font-bold text-[#242424] font-heading leading-tight"
              >
                {isEditing ? 'Edit Project' : 'Add New Project'}
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

          {/* Client Selection */}
          <div>
            <label htmlFor="simple-site-customer" className="block text-xs font-bold text-[#242424] mb-1">
              Client <span className="text-[#9E2A2B]">*</span>
            </label>
            <select
              id="simple-site-customer"
              value={customerId}
              onChange={(e) => {
                const newId = e.target.value;
                setCustomerId(newId);
                // If location is empty, prefill from customer address
                const selectedCust = customers.find((c) => c.id === newId);
                if (selectedCust && !location && selectedCust.address) {
                  setLocation(selectedCust.address);
                }
              }}
              className="w-full h-11 px-3 text-sm bg-white border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/20 transition-all font-medium text-[#242424]"
            >
              <option value="" disabled>
                Select Client...
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="simple-site-name" className="block text-xs font-bold text-[#242424] mb-1">
              Project Name <span className="text-[#9E2A2B]">*</span>
            </label>
            <input
              id="simple-site-name"
              type="text"
              required
              placeholder="e.g. Arun Kumar Residence"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full h-11 px-3 text-sm bg-white border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="simple-site-location" className="block text-xs font-bold text-[#242424] mb-1">
              Location
            </label>
            <input
              id="simple-site-location"
              type="text"
              placeholder="e.g. Nagercoil"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-11 px-3 text-sm bg-white border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/20 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
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
              {isSaving ? 'Saving...' : isEditing ? 'Update Project' : 'Save Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
