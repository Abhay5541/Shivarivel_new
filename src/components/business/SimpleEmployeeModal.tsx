import React, { useState, useEffect } from 'react';
import { X, UserCheck, Trash2 } from 'lucide-react';
import { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useWorkforce';
import { indianPhoneRegex } from '@/types/business';
import type { Employee } from '@/types/workforce';
import { Button } from '@/components/ui/Button';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface SimpleEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess?: (employee: Employee) => void;
}

export const SimpleEmployeeModal: React.FC<SimpleEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const isEditing = Boolean(employee);
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee(employee?.id || '');
  const deleteEmployeeMutation = useDeleteEmployee();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setPhone(employee.phone || '');
      setDailyWage(employee.daily_wage ? String(employee.daily_wage) : '');
    } else {
      setName('');
      setPhone('');
      setDailyWage('');
    }
    setErrorMsg(null);
    setIsDeleteModalOpen(false);
  }, [employee, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const count = Number(document.body.dataset.scrollLockCount || '0') + 1;
    document.body.dataset.scrollLockCount = String(count);
    if (count === 1) {
      document.body.dataset.prevOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }
    return () => {
      const remaining = Math.max(0, Number(document.body.dataset.scrollLockCount || '1') - 1);
      document.body.dataset.scrollLockCount = String(remaining);
      if (remaining === 0) {
        document.body.style.overflow = document.body.dataset.prevOverflow || '';
        delete document.body.dataset.prevOverflow;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter an employee name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim().replace(/\s+/g, '');
    if (trimmedPhone && !indianPhoneRegex.test(trimmedPhone)) {
      setErrorMsg('Please enter a valid 10-digit phone number (starts with 6-9).');
      return;
    }

    const numWage = dailyWage ? Number(dailyWage) : null;
    if (numWage !== null && (isNaN(numWage) || numWage < 0)) {
      setErrorMsg('Daily wage cannot be negative.');
      return;
    }

    try {
      if (isEditing && employee) {
        const updated = await updateEmployeeMutation.mutateAsync({
          id: employee.id,
          name: trimmedName,
          phone: trimmedPhone || null,
          worker_type: employee.worker_type || 'General Worker',
          daily_wage: numWage,
          status: employee.status || 'active',
        });
        if (updated && onSuccess) onSuccess(updated);
        onClose();
      } else {
        const created = await createEmployeeMutation.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone || null,
          worker_type: 'General Worker',
          daily_wage: numWage,
          status: 'active',
        });
        if (created && onSuccess) onSuccess(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save employee. Please try again.';
      setErrorMsg(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!employee) return;
    try {
      await deleteEmployeeMutation.mutateAsync(employee.id);
      setIsDeleteModalOpen(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to delete employee.';
      setErrorMsg(msg);
      setIsDeleteModalOpen(false);
    }
  };

  const isSaving =
    createEmployeeMutation.isPending ||
    updateEmployeeMutation.isPending ||
    deleteEmployeeMutation.isPending;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 modal-backdrop-spring">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2DDD5] overflow-hidden modal-spring">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F5F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#242424] font-heading">
                {isEditing ? 'Edit Employee' : 'Add Employee'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B6B6B] hover:text-[#242424] p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Employee Name */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ravi, M. Shanmugam"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm [@media(pointer:coarse)]:text-base font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm [@media(pointer:coarse)]:text-base font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
          </div>

          {/* Default Daily Wage */}
          <div>
            <label className="block text-xs font-bold text-[#242424] uppercase tracking-wider mb-1.5">
              Default Daily Wage (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={dailyWage}
              onChange={(e) => setDailyWage(e.target.value)}
              placeholder="e.g. 900"
              className="w-full h-11 px-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm [@media(pointer:coarse)]:text-base font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all"
            />
            <p className="mt-1 text-[11px] text-[#6B6B6B]">
              Automatically pre-fills the wage when logging daily work.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-between gap-3">
            {isEditing && employee ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(true)}
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
                className="h-11 px-5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 px-6 text-sm font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white shadow-sm cursor-pointer"
              >
                {isSaving ? 'Saving...' : isEditing ? 'Update Employee' : 'Save Employee'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDeleteModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleConfirmDelete}
      title="Delete Employee"
      itemName={employee?.name || 'this employee'}
    />
  </>
  );
};
