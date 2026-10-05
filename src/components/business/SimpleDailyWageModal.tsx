import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Building2, AlertCircle, CheckCircle2, Clock, Ban } from 'lucide-react';
import { useEmployees, useRecordDailyWage, useWages } from '@/hooks/useWorkforce';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import type { DailyWage, AttendanceStatus } from '@/types/workforce';

interface SimpleDailyWageModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEmployeeId?: string | null;
  preselectedProjectId?: string | null;
  preselectedDate?: string | null;
  existingWage?: DailyWage | null;
  onSuccess?: () => void;
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const SimpleDailyWageModal: React.FC<SimpleDailyWageModalProps> = ({
  isOpen,
  onClose,
  preselectedEmployeeId,
  preselectedProjectId,
  preselectedDate,
  existingWage,
  onSuccess,
}) => {
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: allWages = [] } = useWages();
  const recordWageMutation = useRecordDailyWage();

  const [activeWageRecord, setActiveWageRecord] = useState<DailyWage | null>(existingWage || null);
  const [date, setDate] = useState(getTodayStr);
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [attendance, setAttendance] = useState<AttendanceStatus>('Present');
  const [wage, setWage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (isOpen) {
      setActiveWageRecord(existingWage || null);
      if (existingWage) {
        setDate(existingWage.wage_date || getTodayStr());
        setEmployeeId(existingWage.employee_id || '');
        setProjectId(existingWage.project_id || '');
        // Determine attendance status:
        const status: AttendanceStatus =
          existingWage.payable_units === 0.5
            ? 'Half Day'
            : existingWage.payable_units === 0
            ? 'Absent'
            : 'Present';
        setAttendance(status);
        setWage(String(existingWage.amount ?? existingWage.rate ?? ''));
      } else {
        const initDate = preselectedDate || getTodayStr();
        setDate(initDate);

        const initEmpId = preselectedEmployeeId || (employees.length > 0 ? employees[0].id : '');
        setEmployeeId(initEmpId);

        const initProjId = preselectedProjectId || (projects.length > 0 ? projects[0].id : '');
        setProjectId(initProjId);

        setAttendance('Present');
        setWage('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, existingWage, preselectedDate, preselectedEmployeeId, preselectedProjectId, employees, projects]);

  if (!isOpen) return null;

  // Duplicate detection check
  const duplicateEntry = allWages.find(
    (w) =>
      w.employee_id === employeeId &&
      w.wage_date === date &&
      w.status !== 'Cancelled' &&
      (!activeWageRecord || w.id !== activeWageRecord.id)
  );

  const selectedLaborer = employees.find((e) => e.id === employeeId);
  const laborerDisplayName = selectedLaborer?.name || 'This laborer';

  const handleAttendanceChange = (newStatus: AttendanceStatus) => {
    setAttendance(newStatus);
    if (newStatus === 'Absent') {
      setWage('0');
    } else if (wage === '0') {
      setWage('');
    }
  };

  const handleLoadDuplicateForEdit = () => {
    if (!duplicateEntry) return;
    setActiveWageRecord(duplicateEntry);
    setDate(duplicateEntry.wage_date);
    setEmployeeId(duplicateEntry.employee_id);
    setProjectId(duplicateEntry.project_id || '');
    const status: AttendanceStatus =
      duplicateEntry.payable_units === 0.5
        ? 'Half Day'
        : duplicateEntry.payable_units === 0
        ? 'Absent'
        : 'Present';
    setAttendance(status);
    setWage(String(duplicateEntry.amount ?? duplicateEntry.rate ?? ''));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeId) {
      setErrorMsg('Please select a laborer.');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a wage date.');
      return;
    }

    if (duplicateEntry && (!activeWageRecord || duplicateEntry.id !== activeWageRecord.id)) {
      setErrorMsg(`${laborerDisplayName} already has a wage entry for this date.`);
      return;
    }

    const numWage = attendance === 'Absent' ? 0 : Number(wage);
    if (attendance !== 'Absent' && (isNaN(numWage) || numWage < 0)) {
      setErrorMsg('Please enter a valid amount paid.');
      return;
    }

    try {
      await recordWageMutation.mutateAsync({
        wage_id: activeWageRecord?.id || undefined,
        attendance_id: activeWageRecord?.attendance_id || undefined,
        employee_id: employeeId,
        project_id: projectId || null,
        wage_date: date,
        daily_wage: numWage,
        attendance_status: attendance,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't save this entry. Please try again.";
      setErrorMsg(msg);
    }
  };

  const isSaving = recordWageMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2DDD5] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#F7F5F0] border-b border-[#E2DDD5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4 text-[#C99A2E]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#242424] font-display">
                {activeWageRecord ? 'Edit Wage Entry' : 'Add Wage Entry'}
              </h2>
              <p className="text-xs text-[#6B6B6B]">Record daily site attendance and cash paid</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#E2DDD5]/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Proactive Duplicate Warning */}
          {!activeWageRecord && duplicateEntry && !errorMsg && (
            <div className="p-3 bg-[#FEF3C7] border border-[#FDE047] rounded-xl flex items-start gap-2.5 text-xs text-[#92400E]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B45309]" />
              <div className="flex-1">
                <span className="font-semibold">{laborerDisplayName} already has a wage entry for this date.</span>
                <button
                  type="button"
                  onClick={handleLoadDuplicateForEdit}
                  className="block mt-1 font-bold underline hover:text-[#78350F] cursor-pointer"
                >
                  Edit Existing Record →
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl flex items-start gap-2.5 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {duplicateEntry && (
                  <button
                    type="button"
                    onClick={handleLoadDuplicateForEdit}
                    className="block mt-1 font-bold underline hover:text-[#7F1D1D] cursor-pointer"
                  >
                    Edit Existing Record →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Date Field */}
          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1">
              Date <span className="text-[#991B1B]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/15 transition-all"
              />
            </div>
          </div>

          {/* Laborer Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1">
              Laborer <span className="text-[#991B1B]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/15 transition-all"
              >
                <option value="" disabled>
                  Select Laborer
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project / Site Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1">
              Project / Site
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/15 transition-all"
              >
                <option value="">-- No Specific Site --</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance 3-Segmented Control (Restrained & Accessible) */}
          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Attendance Status <span className="text-[#991B1B]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] border border-[#E2DDD5] rounded-xl">
              <button
                type="button"
                onClick={() => handleAttendanceChange('Present')}
                className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  attendance === 'Present'
                    ? 'bg-white text-[#166534] border border-[#86EFAC] shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#242424] hover:bg-white/50 border border-transparent'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Full Day</span>
              </button>

              <button
                type="button"
                onClick={() => handleAttendanceChange('Half Day')}
                className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  attendance === 'Half Day'
                    ? 'bg-white text-[#854D0E] border border-[#FDE047] shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#242424] hover:bg-white/50 border border-transparent'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Half Day</span>
              </button>

              <button
                type="button"
                onClick={() => handleAttendanceChange('Absent')}
                className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  attendance === 'Absent'
                    ? 'bg-white text-[#991B1B] border border-[#FCA5A5] shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#242424] hover:bg-white/50 border border-transparent'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Absent</span>
              </button>
            </div>
          </div>

          {/* Amount Paid Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#242424]">
                Amount Paid <span className="text-[#991B1B]">*</span>
              </label>
              <span className="text-[11px] text-[#6B6B6B]">Amount entered = already paid</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-[#6B6B6B]">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                disabled={attendance === 'Absent'}
                value={attendance === 'Absent' ? '0' : wage}
                onChange={(e) => setWage(e.target.value)}
                placeholder="e.g. 1100"
                className="w-full h-10 pl-8 pr-3 bg-white border border-[#E2DDD5] rounded-lg text-sm font-semibold tabular-nums text-[#242424] placeholder:text-[#99958F] disabled:bg-[#F3EFEA] disabled:text-[#99958F] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/15 transition-all"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2DDD5]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 px-4 border-[#E2DDD5] text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="h-9 px-5 bg-[#4A0E0E] hover:bg-[#380A0A] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              {isSaving ? 'Saving...' : activeWageRecord ? 'Update Wage' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
