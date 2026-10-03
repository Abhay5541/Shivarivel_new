import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Briefcase,
  IndianRupee,
  Calendar,
  AlertCircle,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
} from '@/hooks/useWorkforce';
import {
  TRADE_CATEGORIES,
  employeeFormSchema,
  type EmployeeFormData,
} from '@/types/workforce';

export function EmployeeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existingEmployee, isLoading: isFetching } = useEmployee(id);
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(id || '');

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    phone: '',
    worker_type: 'Mason (Brickwork / Plastering)',
    daily_wage: 950,
    status: 'active',
    joining_date: new Date().toISOString().split('T')[0],
    emergency_contact: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (existingEmployee && isEdit) {
      setFormData({
        name: existingEmployee.name || '',
        phone: existingEmployee.phone || '',
        worker_type: existingEmployee.worker_type || 'Mason (Brickwork / Plastering)',
        daily_wage: existingEmployee.daily_wage || 0,
        status: existingEmployee.status || 'active',
        joining_date: existingEmployee.joining_date || '',
        emergency_contact: existingEmployee.emergency_contact || '',
        address: existingEmployee.address || '',
        notes: existingEmployee.notes || '',
      });
    }
  }, [existingEmployee, isEdit]);

  const handleChange = (
    field: keyof EmployeeFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = employeeFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync(validation.data);
        navigate(`/employees/${id}`);
      } else {
        const created = await createMutation.mutateAsync(validation.data);
        navigate(`/employees/${created.id}`);
      }
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to save employee details. Please review entries and try again.'
      );
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isFetching) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-[#EFECE6] rounded-md" />
          <div className="h-96 bg-white border border-[#E2DDD5] rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={isEdit ? `Edit Employee (${existingEmployee?.employee_code || ''})` : 'Register New Employee'}
        subtitle="Record field worker personal identity, trade specialty, master wage rate, and emergency contacts"
        badge={
          <Badge variant="primary" className="gap-1">
            <User className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Workforce Management</span>
          </Badge>
        }
        actions={
          <Link to={isEdit && id ? `/employees/${id}` : '/employees'}>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
          </Link>
        }
      />

      {submitError && (
        <div className="p-4 bg-[#F7EFEF] border border-[#9E2A2B]/30 rounded-xl flex items-center gap-3 text-xs text-[#9E2A2B]">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#9E2A2B]" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6 pb-24 md:pb-6">
        {/* Section 1: Basic Identity */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider font-heading flex items-center gap-2">
            <User className="w-4 h-4 text-[#4A0E0E]" />
            Identity &amp; Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Full Name <span className="text-[#9E2A2B]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. M. Shanmugam"
                className={`w-full px-3 py-2 bg-[#F7F5F0] border rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E] ${
                  errors.name ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                }`}
              />
              {errors.name && <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Contact Phone (10 Digits)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="9842101122"
                  className={`w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border rounded-lg text-sm text-[#242424] font-mono focus:outline-none focus:border-[#4A0E0E] ${
                    errors.phone ? 'border-[#9E2A2B]' : 'border-[#E2DDD5]'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Trade / Skill Role <span className="text-[#9E2A2B]">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <select
                  value={formData.worker_type || ''}
                  onChange={(e) => handleChange('worker_type', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
                >
                  {TRADE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {errors.worker_type && (
                <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.worker_type}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Daily Wage Rate (₹ / Day)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.daily_wage ?? ''}
                  onChange={(e) =>
                    handleChange('daily_wage', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="e.g. 950"
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] font-bold focus:outline-none focus:border-[#4A0E0E]"
                />
              </div>
              {errors.daily_wage && (
                <p className="text-[11px] text-[#9E2A2B] mt-1">{errors.daily_wage}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Employment Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] font-semibold focus:outline-none focus:border-[#4A0E0E]"
              >
                <option value="active">Active (Available for shifts)</option>
                <option value="inactive">Inactive (On leave / terminated)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Operational & Contact Details */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider font-heading flex items-center gap-2">
            <Home className="w-4 h-4 text-[#4A0E0E]" />
            Site Context &amp; Emergency Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Joining Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="date"
                  value={formData.joining_date || ''}
                  onChange={(e) => handleChange('joining_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#242424] mb-1">
                Emergency Contact (Name &amp; Phone)
              </label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="text"
                  value={formData.emergency_contact || ''}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="e.g. 9842101123 (Wife - Gomathi)"
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Residential Village / Native Town Address
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="e.g. 14, South Car Street, Sankarankovil, Tenkasi"
              className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#242424] mb-1">
              Operational Notes / Skill Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="e.g. Lead plastering mason, operates 10/7 concrete mixer, specialized in teakwood edge banding..."
              className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#242424] focus:outline-none focus:border-[#4A0E0E]"
            />
          </div>
        </div>

        {/* Desktop Save Action */}
        <div className="hidden md:flex justify-end gap-3">
          <Link to={isEdit && id ? `/employees/${id}` : '/employees'}>
            <Button variant="outline" type="button" className="h-10 px-6 font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="h-10 px-8 font-semibold gap-2"
          >
            <Save className="w-4 h-4 text-[#C99A2E]" />
            <span>{isSaving ? 'Saving...' : isEdit ? 'Update Employee' : 'Register Employee'}</span>
          </Button>
        </div>

        {/* Sticky Mobile Save Action Bar (360px & 390px Optimized) */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-[#E2DDD5] shadow-lg z-30 flex items-center gap-2">
          <Link to={isEdit && id ? `/employees/${id}` : '/employees'} className="flex-1">
            <Button variant="outline" type="button" className="w-full h-12 text-sm font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="flex-1 h-12 text-sm font-semibold gap-2"
          >
            <Save className="w-4 h-4 text-[#C99A2E]" />
            <span>{isSaving ? 'Saving...' : 'Save Employee'}</span>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
