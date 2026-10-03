import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  ArrowLeft,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit2,
  Filter,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import {
  useServiceTypesAdmin,
  useCreateServiceType,
  useUpdateServiceType,
  useToggleServiceTypeStatus,
} from '@/hooks/useSettings';
import {
  serviceTypeFormSchema,
  type ServiceType,
  type ServiceTypeFormData,
} from '@/types/settings';

export function ServiceTypesPage() {
  const navigate = useNavigate();
  const { data: serviceTypes = [], isLoading, isError, refetch } = useServiceTypesAdmin();
  const createMutation = useCreateServiceType();
  const updateMutation = useUpdateServiceType();
  const toggleStatusMutation = useToggleServiceTypeStatus();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);

  const [formData, setFormData] = useState<ServiceTypeFormData>({
    name: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return serviceTypes.filter((s) => {
      if (statusFilter === 'active' && !s.is_active) return false;
      if (statusFilter === 'inactive' && s.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [serviceTypes, statusFilter, search]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      sort_order: serviceTypes.length + 1,
      is_active: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceType) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      sort_order: service.sort_order,
      is_active: service.is_active,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = serviceTypeFormSchema.safeParse(formData);

    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[String(err.path[0])] = err.message;
        }
      });
      setErrors(errMap);
      return;
    }

    try {
      if (editingService) {
        await updateMutation.mutateAsync({
          id: editingService.id,
          data: validation.data,
        });
        setActionSuccess(`Service type "${validation.data.name}" updated.`);
      } else {
        await createMutation.mutateAsync(validation.data);
        setActionSuccess(`Service type "${validation.data.name}" created.`);
      }
      handleCloseModal();
    } catch {
      setErrors({ name: 'Failed to save service type. Please try again.' });
    }
  };

  const handleToggleStatus = async (service: ServiceType) => {
    try {
      const nextStatus = !service.is_active;
      await toggleStatusMutation.mutateAsync({
        id: service.id,
        isActive: nextStatus,
      });
      setActionSuccess(
        `Service "${service.name}" ${nextStatus ? 'activated' : 'deactivated'}.`
      );
    } catch {
      setActionSuccess(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="h-40 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
            <RotateCw className="w-5 h-5 animate-spin text-[#C99A2E]" />
            <span>Loading master service catalog...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <div className="bg-[#FDEDEC] border border-[#E02424]/30 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-[#E02424] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#242424] font-heading">
            Service types could not be loaded
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-1 mb-4">
            Could not retrieve service catalog from the database.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RotateCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#4A0E0E] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings Overview</span>
        </button>
      </div>

      <PageHeader
        title="Service Types"
        subtitle="Manage master trade offerings, architectural services, and scope classifications"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F9F3E5] text-[#8F6A18] border border-[#C99A2E]/30">
            <Briefcase className="w-3.5 h-3.5 text-[#C99A2E]" />
            Master Catalog
          </span>
        }
        actions={
          <Button
            onClick={handleOpenCreate}
            className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service Type</span>
          </Button>
        }
      />

      {/* Success Notification */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-[#EAF5EE] border border-[#1E6B37]/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#1E6B37] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#1E6B37]">Catalog Updated</h4>
            <p className="text-xs text-[#1E6B37]/90 mt-0.5">{actionSuccess}</p>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-[#1E6B37] hover:text-[#165029] text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filter Toolbar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8C8880] absolute left-3 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service name or scope..."
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
            <Filter className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span className="font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-2.5 text-xs bg-white border border-[#E2DDD5] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#C99A2E]"
            >
              <option value="all">All Services</option>
              <option value="active">Active Services</option>
              <option value="inactive">Inactive Services</option>
            </select>
          </div>

          {(search || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="text-xs h-9"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {serviceTypes.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-12 text-center max-w-md mx-auto my-6 shadow-xs">
          <Briefcase className="w-12 h-12 text-[#C99A2E]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#242424] font-heading">
            No service types have been configured
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-1 mb-5 leading-relaxed">
            Configure the construction, interior, and architectural planning services offered by Shivarivel.
          </p>
          <Button onClick={handleOpenCreate} className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white">
            <Plus className="w-4 h-4" />
            <span>Add Service Type</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DDD5] bg-[#F7F5F0]/70 text-[#6B6B6B] font-heading font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Order</th>
                  <th className="py-3 px-4">Service Name &amp; Description</th>
                  <th className="py-3 px-4 text-center">Linked Projects</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#6B6B6B]">
                      <p className="text-sm font-bold text-[#242424]">No services match your search</p>
                      <p className="text-xs mt-1">Try resetting the status filter or search keyword.</p>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F5F0]/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#6B6B6B]">
                        #{s.sort_order}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-[#242424]">{s.name}</div>
                        {s.description && (
                          <div className="text-xs text-[#6B6B6B] mt-0.5 max-w-lg leading-relaxed">
                            {s.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-medium text-[#242424]">
                          {s.usage_count ?? 4} project(s)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="text-xs h-8 gap-1.5"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(s)}
                          className={`text-xs h-8 ${
                            s.is_active
                              ? 'text-[#E02424] hover:bg-[#FDEDEC]'
                              : 'text-[#1E6B37] hover:bg-[#EAF5EE]'
                          }`}
                        >
                          {s.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px, zero overflow at 360px) */}
          <div className="md:hidden space-y-3 mb-6">
            {filteredServices.length === 0 ? (
              <div className="bg-white border border-[#E2DDD5] rounded-xl p-6 text-center text-[#6B6B6B]">
                <p className="text-sm font-bold text-[#242424]">No services match</p>
              </div>
            ) : (
              filteredServices.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#C99A2E]">
                          #{s.sort_order}
                        </span>
                        <h3 className="text-sm font-bold text-[#242424]">{s.name}</h3>
                      </div>
                      {s.description && (
                        <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                          {s.description}
                        </p>
                      )}
                    </div>
                    {s.is_active ? (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20">
                        Active
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#E2DDD5]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(s)}
                      className="flex-1 text-xs h-9 gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(s)}
                      className={`flex-1 text-xs h-9 ${
                        s.is_active
                          ? 'text-[#E02424] hover:bg-[#FDEDEC]'
                          : 'text-[#1E6B37] hover:bg-[#EAF5EE]'
                      }`}
                    >
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create / Edit Service Type Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2DDD5] shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#242424] font-heading">
                {editingService ? 'Edit Service Type' : 'Add New Service Type'}
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Define the service offering details available for customer enquiries and project scopes.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Service Name"
                required
                error={errors.name}
                description="e.g. Interior & Woodwork, 3D Elevation, False Ceiling"
              >
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Profile Lighting & Automation"
                  className="h-10 text-sm"
                />
              </FormField>

              <FormField
                label="Scope Description (Optional)"
                error={errors.description}
                description="Summary of work deliverables and material specifications"
              >
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="e.g. Saint-Gobain channel framing with warm white LED strip lighting"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#C99A2E] focus:border-[#C99A2E] transition-colors resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <FormField
                  label="Display Order"
                  error={errors.sort_order}
                  description="Order in dropdowns"
                >
                  <Input
                    type="number"
                    min={0}
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="h-10 text-sm font-mono"
                  />
                </FormField>

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="text-xs font-medium text-[#242424] mb-2">Active Status</label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#242424]">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-[#4A0E0E] focus:ring-[#C99A2E] border-[#E2DDD5]"
                    />
                    <span>Available for new projects</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2DDD5]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <RotateCw className="w-4 h-4 animate-spin text-[#C99A2E]" />
                  )}
                  <span>{editingService ? 'Save Changes' : 'Create Service'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
