import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Phone,
  Calendar,
  Building2,
  Plus,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployee, useWages } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';
import { SimpleEmployeeModal } from '@/components/business/SimpleEmployeeModal';
import { SimpleDailyWageModal } from '@/components/business/SimpleDailyWageModal';
import type { DailyWage } from '@/types/workforce';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddWageModalOpen, setIsAddWageModalOpen] = useState(false);
  const [editingWage, setEditingWage] = useState<DailyWage | null>(null);

  const { data: employee, isLoading, isError } = useEmployee(id);
  const { data: wages = [] } = useWages({ employeeId: id });

  // Format date helper: e.g. "04 Oct 2026"
  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-[#EFECE6] rounded-md" />
          <div className="h-32 bg-white border border-[#E2DDD5] rounded-xl" />
          <div className="h-64 bg-white border border-[#E2DDD5] rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !employee) {
    return (
      <PageContainer>
        <div className="p-8 bg-white border border-[#E2DDD5] rounded-xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#9E2A2B] mx-auto" />
          <h2 className="text-base font-bold text-[#242424]">Employee Not Found</h2>
          <p className="text-xs text-[#6B6B6B]">
            The employee record you requested does not exist or was removed.
          </p>
          <Link to="/employees">
            <Button variant="outline" size="sm" className="mt-2">
              Back to Employees
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title={employee.name}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/employees">
              <Button variant="secondary" size="sm" className="gap-1.5 h-10 font-bold cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Employees</span>
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-1.5 h-10 font-bold cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              label="Add Daily Wage"
              onClick={() => setIsAddWageModalOpen(true)}
            />
          </div>
        }
      />

      {/* Primary Employee Info Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#242424] font-heading">{employee.name}</h2>
              {employee.phone ? (
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mt-1">
                  <Phone className="w-4 h-4 text-[#6B6B6B]" />
                  <a href={`tel:${employee.phone}`} className="hover:text-[#4A0E0E] hover:underline font-medium">
                    {employee.phone}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-[#6B6B6B] italic mt-0.5">No phone number recorded</p>
              )}
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2DDD5]">
            <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Default Daily Wage
            </span>
            <span className="text-2xl font-bold text-[#1E6B37] font-heading">
              {employee.daily_wage ? `${formatINR(employee.daily_wage)}/day` : '₹0/day'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Work Summary */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#242424] font-heading">Recent Work</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddWageModalOpen(true)}
            className="text-xs font-bold gap-1 h-8 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Wage</span>
          </Button>
        </div>

        {wages.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No work recorded yet"
            description={`No daily wage records found for ${employee.name}.`}
            actionLabel="+ Add Daily Wage"
            onAction={() => setIsAddWageModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[#E2DDD5]/70">
            {wages.map((w) => (
              <div
                key={w.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F7F5F0]/50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#4A0E0E] uppercase tracking-wider block">
                      {formatDateDisplay(w.wage_date)}
                    </span>
                    <span className="text-sm font-semibold text-[#242424]">
                      {w.project?.name || 'General Site'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                  <span className="text-base font-bold text-[#1E6B37] font-heading">
                    {formatINR(w.amount || w.rate)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingWage(w)}
                    className="text-xs text-[#6B6B6B] hover:text-[#4A0E0E] font-medium hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      <SimpleEmployeeModal
        isOpen={isEditModalOpen}
        employee={employee}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Add Daily Wage Modal */}
      <SimpleDailyWageModal
        isOpen={isAddWageModalOpen}
        preselectedEmployeeId={employee.id}
        onClose={() => setIsAddWageModalOpen(false)}
      />

      {/* Edit Daily Wage Modal */}
      {editingWage && (
        <SimpleDailyWageModal
          isOpen={Boolean(editingWage)}
          existingWage={editingWage}
          onClose={() => setEditingWage(null)}
        />
      )}
    </PageContainer>
  );
}
