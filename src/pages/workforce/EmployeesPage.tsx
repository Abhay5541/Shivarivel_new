import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users2,
  Plus,
  Phone,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { ActionButton } from '@/components/ui/ActionButton';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';
import { SimpleEmployeeModal } from '@/components/business/SimpleEmployeeModal';
import type { Employee } from '@/types/workforce';

export function EmployeesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Auto-open modal if navigated with ?new=1 or ?new=true
  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingEmployee(null);
      setIsAddModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: employees = [], isLoading } = useEmployees();

  // Search filter (by name or phone)
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase().trim();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        (e.phone && e.phone.includes(term))
    );
  }, [employees, searchTerm]);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Employees"
        badge={
          <Badge variant="primary" className="gap-1">
            <Users2 className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Workforce</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Search
              size="sm"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search employees..."
            />
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              label="Add Employee"
              onClick={() => setIsAddModalOpen(true)}
            />
          </div>
        }
      />

      {/* Employee List */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-[#6B6B6B]">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={<Users2 className="w-6 h-6" />}
          title={searchTerm ? 'No employees found' : 'No employees registered yet'}
          description={
            searchTerm
              ? 'Try searching with a different name or phone number.'
              : undefined
          }
          actionLabel="+ Add Employee"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white border border-[#E2DDD5] hover:border-[#4A0E0E]/40 rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E] font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#242424] group-hover:text-[#4A0E0E] transition-colors text-base font-heading">
                        {emp.name}
                      </h3>
                      {emp.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mt-0.5">
                          <Phone className="w-3 h-3 text-[#6B6B6B]" />
                          <span>{emp.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B6B6B] italic">No phone added</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#6B6B6B] font-medium block">Daily Wage</span>
                    <span className="text-base font-bold text-[#1E6B37] font-heading">
                      {emp.daily_wage ? `${formatINR(emp.daily_wage)}/day` : '₹0/day'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs text-[#6B6B6B]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEmployee(emp);
                  }}
                  className="font-semibold text-[#4A0E0E] hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <div className="flex items-center gap-1 font-semibold text-[#242424] group-hover:text-[#4A0E0E] transition-colors">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      <SimpleEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <SimpleEmployeeModal
          isOpen={Boolean(editingEmployee)}
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </PageContainer>
  );
}
