import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Trash2,
  Edit2,
  SlidersHorizontal,
  Search as SearchIcon,
  Plus,
  ToggleRight,
  ToggleLeft,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SimpleCustomerModal } from '@/components/business/SimpleCustomerModal';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useCustomers, useDeleteCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types/business';
import type { Project } from '@/types/projects';

export const CustomersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const deleteCustomerMutation = useDeleteCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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

  // Counts for tabs
  const allCount = customers.length;
  const activeCount = customers.filter((c) => c.status !== 'inactive').length;
  const inactiveCount = customers.filter((c) => c.status === 'inactive').length;

  // Search & status filter
  const filteredCustomers = useMemo(() => {
    let list = customers;

    if (statusFilter === 'active') {
      list = list.filter((c) => c.status !== 'inactive');
    } else if (statusFilter === 'inactive') {
      list = list.filter((c) => c.status === 'inactive');
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;

    return list.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(term);
      const phoneMatch = c.phone ? c.phone.includes(term) : false;
      const locationMatch = c.address ? c.address.toLowerCase().includes(term) : false;
      return nameMatch || phoneMatch || locationMatch;
    });
  }, [customers, searchTerm, statusFilter]);

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const handleDeleteCustomer = (c: Customer) => {
    setDeletingCustomer(c);
  };

  const confirmDeleteCustomer = async () => {
    if (deletingCustomer) {
      await deleteCustomerMutation.mutateAsync(deletingCustomer.id);
      setDeletingCustomer(null);
    }
  };

  const handleRequestCreateSite = (newlySavedCust: Customer) => {
    setTargetCustomerForSite(newlySavedCust);
    setIsSiteModalOpen(true);
  };

  const handleToggleStatus = async (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    setTogglingId(c.id);
    try {
      const newStatus = c.status === 'inactive' ? 'active' : 'inactive';
      await updateCustomerMutation.mutateAsync({ id: c.id, data: { status: newStatus } });
    } catch (err) {
      console.warn('Toggle status failed:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSiteCreated = (createdSite: Project) => {
    navigate(`/projects/${createdSite.id}`);
  };

  if (isCustomersLoading) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <div className="h-10 w-48 bg-[#E2DDD5]/60 rounded-xl animate-pulse" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <PageContainer className="py-8 max-w-md mx-auto">
        <ErrorState
          title="Could not load customers"
          description={error?.message || 'Unable to retrieve customer records.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24 max-w-md mx-auto">
      {/* 1. TOP HEADER & ADD BUTTON */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-[#242424] tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5 font-inter">
            Manage and track your customer details
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddCustomer}
          className="h-9 px-3.5 rounded-xl bg-[#4A0E0E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-[#380A0A] active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER ROW */}
      <div className="mb-3.5 flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone or location..."
            className="w-full h-11 pl-10 pr-3.5 bg-[#FAF7F0] border border-[#E8E4DC] rounded-xl text-xs sm:text-sm text-[#242424] placeholder:text-[#8C867E] focus:outline-none focus:border-[#4A0E0E] focus:bg-white transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            // Cycle filter or toggle
            setStatusFilter((prev) => (prev === 'all' ? 'active' : prev === 'active' ? 'inactive' : 'all'));
          }}
          className="w-11 h-11 rounded-xl bg-[#FAF7F0] border border-[#E8E4DC] flex items-center justify-center text-[#4A0E0E] hover:bg-white active:scale-95 transition-all shrink-0 cursor-pointer"
          title="Toggle Filter"
          aria-label="Filter Customers"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 3. SEGMENTED FILTER PILLS: [ All (4) ] [ Active (4) ] [ Inactive (0) ] */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#4A0E0E] text-white shadow-xs'
              : 'bg-[#EFECE6] text-[#6B6B6B] hover:bg-[#E5E1D8]'
          }`}
        >
          All ({allCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-[#4A0E0E] text-white shadow-xs'
              : 'bg-[#EFECE6] text-[#6B6B6B] hover:bg-[#E5E1D8]'
          }`}
        >
          Active ({activeCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('inactive')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'inactive'
              ? 'bg-[#4A0E0E] text-white shadow-xs'
              : 'bg-[#EFECE6] text-[#6B6B6B] hover:bg-[#E5E1D8]'
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* 4. CUSTOMER LIST */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-6 h-6" />}
          title={searchTerm ? 'No matching customers found' : 'No customers yet.'}
          description={
            searchTerm
              ? `No customer matching "${searchTerm}". Try another name or phone number.`
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((c) => {
            const isActive = c.status !== 'inactive';
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="bg-white border border-[#E8E4DC] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                <div>
                  {/* Header: Avatar, Name, Status Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#FBF3E6] text-[#A67C24] flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <h2 className="text-sm font-bold text-[#242424] font-inter group-hover:text-[#4A0E0E] transition-colors truncate">
                        {c.name}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                        isActive
                          ? 'bg-[#E8F8EE] text-[#1E7E34]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-[#1E7E34]' : 'bg-gray-400'
                        }`}
                      />
                      <span>{isActive ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>

                  {/* Contact Info: Phone & Location */}
                  <div className="mt-3 space-y-1 text-xs text-[#6B6B6B] pl-1">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                        <span className="font-semibold text-[#242424] font-mono">
                          +91 {c.phone}
                        </span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar: Edit, Toggle Status, Delete, View Details */}
                <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomer(c);
                        setIsCustomerModalOpen(true);
                      }}
                      className="font-medium text-[#6B6B6B] hover:text-[#4A0E0E] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      <span>Edit</span>
                    </button>

                    {/* Active / Inactive toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(e, c)}
                      disabled={togglingId === c.id}
                      title={isActive ? 'Mark Inactive' : 'Mark Active'}
                      className={`font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${
                        isActive
                          ? 'text-[#1E7E34] hover:text-[#165a28]'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {isActive ? (
                        <ToggleRight className="w-3.5 h-3.5" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                      <span>{togglingId === c.id ? '...' : isActive ? 'Active' : 'Inactive'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(c);
                      }}
                      disabled={deleteCustomerMutation.isPending}
                      className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <span className="font-bold text-[#242424] group-hover:text-[#4A0E0E] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Details</span>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={confirmDeleteCustomer}
        itemName={deletingCustomer?.name}
        isLoading={deleteCustomerMutation.isPending}
      />
    </PageContainer>
  );
};

export default CustomersPage;
