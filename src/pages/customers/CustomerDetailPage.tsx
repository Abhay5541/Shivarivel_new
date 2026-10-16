import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Edit2,
  Building2,
  Plus,
  ArrowRight,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Users2,
  IndianRupee,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SimpleCustomerModal } from '@/components/business/SimpleCustomerModal';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import { useCustomer, useDeleteCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useProjects } from '@/hooks/useProjects';
import { useWages } from '@/hooks/useWorkforce';
import type { Project } from '@/types/projects';

// Sub-component: summary card for a completed project
const CompletedProjectSummary: React.FC<{ site: Project; onNavigate: () => void }> = ({
  site,
  onNavigate,
}) => {
  const { data: wages = [] } = useWages({ projectId: site.id });

  const summary = React.useMemo(() => {
    const labourSet = new Set<string>();
    let totalWages = 0;
    let totalDays = 0;
    for (const w of wages) {
      if (w.status !== 'Confirmed') continue;
      labourSet.add(w.employee_id);
      totalWages += Number((w as any).amount || (w as any).rate || 0);
      totalDays += 1;
    }
    return { uniqueLabourers: labourSet.size, totalWages, totalDays };
  }, [wages]);

  return (
    <div
      onClick={onNavigate}
      className="bg-white border border-[#E2DDD5] rounded-2xl overflow-hidden hover:border-[#4A0E0E]/30 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Top bar */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#242424] font-heading group-hover:text-[#4A0E0E] transition-colors truncate">
            {site.name}
          </h3>
          {site.site_address && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6B6B6B]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{site.site_address}</span>
            </div>
          )}
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8EE] text-[#1E7E34] shrink-0 ml-2">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-[#E8E4DC] border-t border-[#E8E4DC] bg-[#FAFAF8]">
        <div className="px-3 py-2.5 flex flex-col items-center text-center">
          <Users2 className="w-3.5 h-3.5 text-[#4A0E0E] mb-1" />
          <span className="text-sm font-bold text-[#242424]">{summary.uniqueLabourers}</span>
          <span className="text-[10px] text-[#6B6B6B]">Labourers</span>
        </div>
        <div className="px-3 py-2.5 flex flex-col items-center text-center">
          <Briefcase className="w-3.5 h-3.5 text-[#4A0E0E] mb-1" />
          <span className="text-sm font-bold text-[#242424]">{summary.totalDays}</span>
          <span className="text-[10px] text-[#6B6B6B]">Man-days</span>
        </div>
        <div className="px-3 py-2.5 flex flex-col items-center text-center">
          <IndianRupee className="w-3.5 h-3.5 text-[#1E6B37] mb-1" />
          <span className="text-sm font-bold text-[#1E6B37]">
            {summary.totalWages >= 1000
              ? `${(summary.totalWages / 1000).toFixed(1)}K`
              : summary.totalWages > 0
              ? `${summary.totalWages}`
              : '—'}
          </span>
          <span className="text-[10px] text-[#6B6B6B]">Wages</span>
        </div>
      </div>
    </div>
  );
};

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState<'active' | 'completed'>('active');

  const deleteCustomerMutation = useDeleteCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const { data: allProjects = [] } = useProjects({ customerId: id });

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleDeleteCustomer = () => {
    if (!customer) return;
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customer) return;
    try {
      await deleteCustomerMutation.mutateAsync(customer.id);
      setIsConfirmDeleteOpen(false);
      navigate('/customers');
    } catch {
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!customer) return;
    setIsTogglingStatus(true);
    try {
      const newStatus = customer.status === 'inactive' ? 'active' : 'inactive';
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: { status: newStatus },
      });
    } catch (err) {
      console.warn('Failed to toggle customer status:', err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Filter projects for this customer
  const customerSites = allProjects.filter((p) => p.customer_id === id);
  const activeProjects = customerSites.filter((p) => p.status !== 'Completed');
  const completedProjects = customerSites.filter((p) => p.status === 'Completed');

  const projectFilterOptions = React.useMemo<SegmentOption<'active' | 'completed'>[]>(
    () => [
      {
        id: 'active',
        label: 'Active',
        count: activeProjects.length,
        dotColor: '#166534',
        activeColorClass: 'text-[#166534]',
      },
      {
        id: 'completed',
        label: 'Completed',
        count: completedProjects.length,
        dotColor: '#7A7265',
        activeColorClass: 'text-[#6B6B6B]',
      },
    ],
    [activeProjects.length, completedProjects.length]
  );

  const isActive = customer?.status !== 'inactive';

  if (isLoading) {
    return (
      <div className="py-16 max-w-4xl mx-auto">
        <LoadingState message="Loading customer details..." />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          title="Customer not found"
          description={error?.message || `No customer found matching identifier ${id}`}
          onRetry={refetch}
        />
      </div>
    );
  }

  const handleSiteCreated = (createdSite: Project) => {
    navigate(`/projects/${createdSite.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none pb-20">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/customers'))}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs">
        {/* Status + Name row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Customer Profile
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading mt-0.5 uppercase truncate">
              {customer.name}
            </h1>
          </div>

          {/* Status badge + toggle */}
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isTogglingStatus || updateCustomerMutation.isPending}
            title={isActive ? 'Mark as Inactive' : 'Mark as Active'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 shrink-0 ${
              isActive
                ? 'bg-[#E8F8EE] text-[#1E7E34] hover:bg-[#D4F3E0]'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {isActive ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isTogglingStatus ? 'Updating...' : isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="sm:hidden">{isActive ? 'Active' : 'Inactive'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-[#6B6B6B]">
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#4A0E0E] shrink-0" />
              <a
                href={`tel:${customer.phone}`}
                className="font-bold text-[#242424] font-sans tabular-nums hover:text-[#4A0E0E]"
              >
                {customer.phone}
              </a>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4A0E0E] shrink-0" />
              <span className="text-[#242424]">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#E8E4DC]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditCustomerOpen(true)}
            className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Customer</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleDeleteCustomer}
            disabled={deleteCustomerMutation.isPending}
            className="h-10 px-3.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Project Stats Overview */}
      {customerSites.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 shadow-xs text-center">
            <span className="text-2xl font-bold text-[#4A0E0E] block">{activeProjects.length}</span>
            <span className="text-xs text-[#6B6B6B] font-medium">Active Projects</span>
          </div>
          <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 shadow-xs text-center">
            <span className="text-2xl font-bold text-[#1E6B37] block">{completedProjects.length}</span>
            <span className="text-xs text-[#6B6B6B] font-medium">Completed</span>
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#242424] font-heading">Projects</h2>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => setIsAddSiteOpen(true)}
            className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </Button>
        </div>

        {/* Tabs: Active / Completed */}
        {customerSites.length > 0 && (
          <div className="w-fit">
            <SlidingSegmentedControl
              options={projectFilterOptions}
              value={activeProjectTab}
              onChange={setActiveProjectTab}
              size="sm"
              ariaLabel="Filter projects"
            />
          </div>
        )}

        {/* Active Projects */}
        {activeProjectTab === 'active' && (
          <>
            {activeProjects.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-6 h-6" />}
                title="No active projects."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeProjects.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => navigate(`/projects/${site.id}`)}
                    className="bg-white border border-[#E2DDD5] rounded-2xl p-5 hover:border-[#4A0E0E]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-[#242424] font-heading group-hover:text-[#4A0E0E] transition-colors">
                          {site.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            site.status === 'Active'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-[#EFECE6] text-[#6B6B6B]'
                          }`}
                        >
                          {site.status}
                        </span>
                      </div>

                      {site.site_address && (
                        <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#6B6B6B]" />
                          <span>{site.site_address}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs">
                      <span className="text-[#6B6B6B]">{customer.name}</span>
                      <span className="font-bold text-[#4A0E0E] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Open Project
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Completed Projects */}
        {activeProjectTab === 'completed' && (
          <>
            {completedProjects.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6" />}
                title="No completed projects yet."
                description="Projects marked as complete will appear here with their work summary."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedProjects.map((site) => (
                  <CompletedProjectSummary
                    key={site.id}
                    site={site}
                    onNavigate={() => navigate(`/projects/${site.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Customer Modal */}
      <SimpleCustomerModal
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        customer={customer}
      />

      {/* Add Site Modal */}
      <SimpleSiteModal
        isOpen={isAddSiteOpen}
        onClose={() => setIsAddSiteOpen(false)}
        preselectedCustomer={customer}
        defaultLocation={customer.address}
        onSuccess={handleSiteCreated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={customer?.name}
        isLoading={deleteCustomerMutation.isPending}
      />
    </div>
  );
};
