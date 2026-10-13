import React from 'react';
import {
  CheckCircle2,
  X,
  Users2,
  IndianRupee,
  Briefcase,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useWages, useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';
import type { Project } from '@/types/projects';

interface ProjectCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onConfirmComplete: () => void;
  isLoading?: boolean;
}

export const ProjectCompletionModal: React.FC<ProjectCompletionModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirmComplete,
  isLoading = false,
}) => {
  const { data: siteWages = [] } = useWages({ projectId: project.id });
  const { data: employees = [] } = useEmployees();

  const summary = React.useMemo(() => {
    const labourMap = new Map<string, { name: string; days: number; total: number }>();
    let totalWages = 0;

    for (const w of siteWages) {
      if (w.status !== 'Confirmed') continue;
      const empId = w.employee_id;
      const emp = employees.find((e) => e.id === empId);
      const name = (w as any).employee?.name || emp?.name || 'Labour';
      const amount = Number((w as any).amount || (w as any).rate || 0);
      totalWages += amount;

      const existing = labourMap.get(empId) || { name, days: 0, total: 0 };
      existing.days += 1;
      existing.total += amount;
      labourMap.set(empId, existing);
    }

    const labourList = Array.from(labourMap.values()).sort((a, b) => b.total - a.total);
    const uniqueLabourers = labourList.length;
    const totalDays = labourList.reduce((sum, l) => sum + l.days, 0);

    return { labourList, uniqueLabourers, totalDays, totalWages };
  }, [siteWages, employees]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242424]/70 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Surface */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E2DDD5] z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#E2DDD5] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-gradient-to-r from-[#4A0E0E] to-[#6B1A1A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="completion-modal-title"
                className="text-base font-bold text-white font-heading leading-tight"
              >
                Mark Project Complete
              </h2>
              <p className="text-xs text-white/70 mt-0.5 truncate max-w-[200px]">
                {project.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              This sets the project status to{' '}
              <strong>Completed</strong>. You can reopen it later by editing the project.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#F7F5F0] border border-[#E8E4DC] rounded-xl p-3 flex flex-col items-center text-center">
              <Users2 className="w-5 h-5 text-[#4A0E0E] mb-1.5" />
              <span className="text-2xl font-bold text-[#242424]">
                {summary.uniqueLabourers}
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-medium mt-0.5 leading-tight">
                Labourers
              </span>
            </div>
            <div className="bg-[#F7F5F0] border border-[#E8E4DC] rounded-xl p-3 flex flex-col items-center text-center">
              <Briefcase className="w-5 h-5 text-[#4A0E0E] mb-1.5" />
              <span className="text-2xl font-bold text-[#242424]">
                {summary.totalDays}
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-medium mt-0.5 leading-tight">
                Man-days
              </span>
            </div>
            <div className="bg-[#F7F5F0] border border-[#E8E4DC] rounded-xl p-3 flex flex-col items-center text-center">
              <IndianRupee className="w-5 h-5 text-[#4A0E0E] mb-1.5" />
              <span className="text-base font-bold text-[#1E6B37]">
                {summary.totalWages > 0
                  ? summary.totalWages >= 1000
                    ? `${(summary.totalWages / 1000).toFixed(1)}K`
                    : `${summary.totalWages}`
                  : '—'}
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-medium mt-0.5 leading-tight">
                Wages Paid
              </span>
            </div>
          </div>

          {/* Labour Breakdown */}
          {summary.labourList.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#4A0E0E]" />
                <span className="text-xs font-bold text-[#242424] uppercase tracking-wide">
                  Labour Breakdown
                </span>
              </div>
              <div className="border border-[#E8E4DC] rounded-xl overflow-hidden divide-y divide-[#E8E4DC]">
                {summary.labourList.map((labour, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F7F5F0]/50"
                  >
                    <div>
                      <span className="text-sm font-semibold text-[#242424] block">
                        {labour.name}
                      </span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        {labour.days} {labour.days === 1 ? 'day' : 'days'} worked
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#1E6B37]">
                      {formatINR(labour.total)}
                    </span>
                  </div>
                ))}
                {/* Total row */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#F7F5F0]">
                  <span className="text-xs font-bold text-[#242424] uppercase tracking-wide">
                    Total Wages
                  </span>
                  <span className="text-base font-bold text-[#1E6B37]">
                    {formatINR(summary.totalWages)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#E2DDD5] space-y-1">
              <Users2 className="w-7 h-7 text-[#6B6B6B] mx-auto opacity-40" />
              <p className="text-xs text-[#6B6B6B] font-medium">
                No confirmed wages recorded for this project
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[#E2DDD5] flex items-center gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl border border-[#E2DDD5] text-sm font-semibold text-[#6B6B6B] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmComplete}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl bg-[#4A0E0E] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#380A0A] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Complete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
