import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Phone,
  MapPin,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { ActionButton } from '@/components/ui/ActionButton';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SimpleCustomerModal } from '@/components/business/SimpleCustomerModal';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { useCustomers } from '@/hooks/useCustomers';
import { useProjects } from '@/hooks/useProjects';
import type { Customer } from '@/types/business';
import type { Project } from '@/types/projects';
import { SplitText } from '@/components/ui/SplitText';

export const CustomersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [targetCustomerForSite, setTargetCustomerForSite] = useState<Customer | null>(null);

  // Auto-open modal if navigated with ?new=1 or ?new=true
  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingCustomer(null);
      setIsCustomerModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    data: customers = [],
    isLoading: isCustomersLoading,
    isError,
    error,
    refetch,
  } = useCustomers();

  const { data: allProjects = [] } = useProjects();

  // Map customerId -> count of sites
  const siteCountByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    allProjects.forEach((p) => {
      if (p.customer_id) {
        map[p.customer_id] = (map[p.customer_id] || 0) + 1;
      }
    });
    return map;
  }, [allProjects]);

  // Client-side search by name or phone
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(term);
      const phoneMatch = c.phone ? c.phone.includes(term) : false;
      return nameMatch || phoneMatch;
    });
  }, [customers, searchTerm]);

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleRequestCreateSite = (newlySavedCust: Customer) => {
    setTargetCustomerForSite(newlySavedCust);
    setIsSiteModalOpen(true);
  };

  const handleSiteCreated = (createdSite: Project) => {
    navigate(`/sites/${createdSite.id}`);
  };

  if (isCustomersLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-[#E2DDD5]/60 rounded-lg animate-pulse" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <PageContainer className="py-8">
        <ErrorState
          title="Could not load customers"
          description={error?.message || 'Unable to retrieve customer records.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24">
      {/* Top Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SplitText
            text="Customers"
            tag="h1"
            className="text-2xl font-bold font-display text-[#242424] tracking-tight"
            delay={40}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 18 }}
            to={{ opacity: 1, y: 0 }}
            textAlign="left"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Search
            size="sm"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name or phone..."
          />
          <ActionButton
            icon={<UserPlus className="w-4 h-4" />}
            label="Add Customer"
            onClick={handleOpenAddCustomer}
          />
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-6 h-6" />}
          title={searchTerm ? 'No matching customers found' : 'No customers yet.'}
          description={
            searchTerm
              ? `No customer matching "${searchTerm}". Try another name or phone number.`
              : undefined
          }
          actionLabel={searchTerm ? undefined : '+ Add Customer'}
          onAction={searchTerm ? undefined : handleOpenAddCustomer}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => {
            const count = siteCountByCustomer[c.id] || 0;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="bg-white border border-[#E2DDD5] rounded-2xl p-5 hover:border-[#4A0E0E]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-bold text-[#242424] font-heading group-hover:text-[#4A0E0E] transition-colors">
                      {c.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        count > 0
                          ? 'bg-[#F9F3E5] text-[#8C6B1B] border border-[#C99A2E]/30'
                          : 'bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {count === 1 ? '1 Project' : `${count} Projects`}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#6B6B6B]">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                        <span className="font-semibold text-[#242424] font-mono">
                          {c.phone}
                        </span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer(c);
                      setIsCustomerModalOpen(true);
                    }}
                    className="font-medium text-[#6B6B6B] hover:text-[#4A0E0E] px-2 py-1 -ml-2 rounded-md hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                  >
                    Edit Customer
                  </button>
                  <span className="font-bold text-[#4A0E0E] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Customer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Modal */}
      <SimpleCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={editingCustomer}
        onRequestCreateSite={handleRequestCreateSite}
      />

      {/* Site Modal (invoked if user creates customer and chooses Create Site) */}
      <SimpleSiteModal
        isOpen={isSiteModalOpen}
        onClose={() => {
          setIsSiteModalOpen(false);
          setTargetCustomerForSite(null);
        }}
        preselectedCustomer={targetCustomerForSite}
        onSuccess={handleSiteCreated}
      />
    </PageContainer>
  );
};
