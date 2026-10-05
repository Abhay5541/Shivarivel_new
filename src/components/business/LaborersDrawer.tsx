import React, { useState } from 'react';
import { X, UserCheck, Plus, Edit2, Phone, Tag, Check, AlertCircle } from 'lucide-react';
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '@/hooks/useWorkforce';
import { indianPhoneRegex } from '@/types/business';
import type { Employee } from '@/types/workforce';
import { Button } from '@/components/ui/Button';

interface LaborersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLaborer?: (laborer: Employee) => void;
}

export const LaborersDrawer: React.FC<LaborersDrawerProps> = ({
  isOpen,
  onClose,
  onSelectLaborer,
}) => {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();

  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingLaborer, setEditingLaborer] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateEmployeeMutation = useUpdateEmployee(editingLaborer?.id || '');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingLaborer(null);
    setName('');
    setPhone('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAddingOrEditing(true);
  };

  const handleStartEdit = (laborer: Employee) => {
    setEditingLaborer(laborer);
    setName(laborer.name || '');
    setPhone(laborer.phone || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAddingOrEditing(true);
  };

  const handleCancelForm = () => {
    setIsAddingOrEditing(false);
    setEditingLaborer(null);
    setName('');
    setPhone('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a laborer name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim().replace(/\s+/g, '');
    if (trimmedPhone && !indianPhoneRegex.test(trimmedPhone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number (starts with 6-9).');
      return;
    }

    try {
      if (editingLaborer) {
        const updated = await updateEmployeeMutation.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone || null,
          worker_type: editingLaborer.worker_type || 'Field Laborer',
          daily_wage: editingLaborer.daily_wage || null,
          status: editingLaborer.status || 'active',
        });
        setSuccessMsg(`Updated ${updated.name}`);
        setIsAddingOrEditing(false);
        setEditingLaborer(null);
      } else {
        const created = await createEmployeeMutation.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone || null,
          worker_type: 'Field Laborer',
          daily_wage: null,
          status: 'active',
        });
        setSuccessMsg(`Added ${created.name} (${created.employee_code})`);
        setIsAddingOrEditing(false);
        if (onSelectLaborer) {
          onSelectLaborer(created);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save laborer. Please try again.';
      setErrorMsg(msg);
    }
  };

  const isSaving = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      {/* Drawer Container */}
      <div className="bg-[#FFFFFF] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#E2DDD5] animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F5F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <UserCheck className="w-4 h-4 text-[#C99A2E]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#242424] font-display">Laborers Directory</h2>
              <p className="text-xs text-[#6B6B6B]">Registered site workers & auto IDs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#E2DDD5]/50 transition-colors cursor-pointer"
            aria-label="Close directory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar / Success Alert */}
        <div className="px-5 py-3 border-b border-[#E2DDD5] bg-[#FFFFFF] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#6B6B6B]">
            Total Laborers: <strong className="text-[#242424]">{employees.length}</strong>
          </span>
          {!isAddingOrEditing && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartAdd}
              className="gap-1.5 h-8.5 px-3 bg-[#4A0E0E] hover:bg-[#380A0A] text-white font-medium text-xs rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
              <span>+ Add Laborer</span>
            </Button>
          )}
        </div>

        {successMsg && (
          <div className="mx-5 mt-3 p-2.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-lg flex items-center gap-2 text-xs font-semibold text-[#166534]">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Add / Edit Form Panel */}
          {isAddingOrEditing && (
            <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E]">
                  {editingLaborer ? `Edit Laborer (${editingLaborer.employee_code})` : 'New Laborer Registration'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-[#6B6B6B] hover:text-[#242424]"
                >
                  Cancel
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg flex items-center gap-2 text-xs text-[#991B1B]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1">
                    Laborer Name <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Murugan S."
                    className="w-full h-10 px-3 bg-white border border-[#E2DDD5] rounded-lg text-sm text-[#242424] placeholder:text-[#99958F] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#99958F] absolute left-3 top-3" />
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98421 11223"
                      className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2DDD5] rounded-lg text-sm text-[#242424] placeholder:text-[#99958F] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/15 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">
                    Internal Labor ID will be automatically assigned.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelForm}
                    className="h-9 px-3.5 border-[#E2DDD5] text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    className="h-9 px-4 bg-[#4A0E0E] hover:bg-[#380A0A] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : editingLaborer ? 'Save Changes' : 'Save Laborer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Laborers List */}
          {isLoading ? (
            <div className="py-8 text-center text-xs text-[#6B6B6B]">Loading laborers...</div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B6B6B] space-y-2">
              <UserCheck className="w-8 h-8 text-[#99958F] mx-auto opacity-50" />
              <p className="font-semibold text-[#242424]">No laborers registered yet.</p>
              <p>Click "+ Add Laborer" above to register your first site worker.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-3 bg-white border border-[#E2DDD5] hover:border-[#C99A2E]/70 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#242424] font-display">{emp.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#F3EFEA] text-[11px] font-semibold text-[#4A0E0E] tabular-nums">
                        <Tag className="w-2.5 h-2.5 text-[#C99A2E]" />
                        {emp.employee_code}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B6B6B]">
                      {emp.phone ? (
                        <a
                          href={`tel:${emp.phone}`}
                          className="hover:text-[#4A0E0E] underline-offset-2 hover:underline"
                        >
                          {emp.phone}
                        </a>
                      ) : (
                        <span className="text-[#99958F] italic">No phone recorded</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(emp)}
                      className="p-1.5 text-[#6B6B6B] hover:text-[#4A0E0E] hover:bg-[#F7EFEF] rounded-md transition-colors cursor-pointer"
                      title="Edit Laborer"
                      aria-label={`Edit ${emp.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2DDD5] bg-[#F7F5F0] text-center">
          <p className="text-[11px] text-[#6B6B6B]">
            All registered laborers are available on the daily wage sheet.
          </p>
        </div>
      </div>
    </div>
  );
};
