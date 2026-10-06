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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SimpleCustomerModal } from '@/components/business/SimpleCustomerModal';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { useCustomer } from '@/hooks/useCustomers';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/projects';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);

  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const { data: allProjects = [] } = useProjects({ customerId: id });

  // Filter projects for this customer
  const customerSites = allProjects.filter((p) => p.customer_id === id);

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
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
            Customer Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading mt-0.5 uppercase">
            {customer.name}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3 text-sm text-[#6B6B6B]">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#4A0E0E] shrink-0" />
                <a
                  href={`tel:${customer.phone}`}
                  className="font-bold text-[#242424] font-mono hover:text-[#4A0E0E]"
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
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsEditCustomerOpen(true)}
          className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Customer</span>
        </Button>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#242424] font-heading">
              Projects
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Projects registered for {customer.name}
            </p>
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

        {customerSites.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title="No projects yet."
            description={`Add a project for ${customer.name} to get started.`}
            actionLabel="+ Add Project"
            onAction={() => setIsAddSiteOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customerSites.map((site) => (
              <div
                key={site.id}
                onClick={() => navigate(`/projects/${site.id}`)}
                className="bg-white border border-[#E2DDD5] rounded-2xl p-5 hover:border-[#4A0E0E]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <h3 className="text-base font-bold text-[#242424] font-heading group-hover:text-[#4A0E0E] transition-colors">
                    {site.name}
                  </h3>

                  {site.site_address && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#6B6B6B]">
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
    </div>
  );
};
