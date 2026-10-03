import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Phone,
  MapPin,
  Eye,
  Edit2,
  Users,
  Briefcase,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { CustomerFormDrawer } from '@/components/business/CustomerFormDrawer';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/business';
import { cn } from '@/lib/utils';

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Auto-open drawer if navigated with ?new=1 or ?new=true
  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingCustomer(null);
      setIsDrawerOpen(true);
      // Clean query parameter
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomers({
    search: searchTerm,
    status: statusFilter,
  });

  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.status === 'active').length;

  const handleCreateNew = () => {
    setEditingCustomer(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (customer: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCustomer(customer);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Client phonebook, project sites, and commercial contact records
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleCreateNew}
          className="shadow-xs min-h-[44px] cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          + New Customer
        </Button>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Total Clients
            </span>
            <Users className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] font-heading mt-2">
            {totalCount}
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Active Accounts
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#1E6B37]" />
          </div>
          <p className="text-2xl font-bold text-[#1E6B37] font-heading mt-2">
            {activeCount}
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Enquiries Linked
            </span>
            <Briefcase className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] font-heading mt-2">
            {customers.reduce((acc, c) => acc + (c.enquiries_count || 0), 0)}
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Site Visits Recorded
            </span>
            <Compass className="w-4 h-4 text-[#4A0E0E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] font-heading mt-2">
            {customers.reduce((acc, c) => acc + (c.site_visits_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#E2DDD5] rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm bg-[#F7F5F0]/60 border border-[#E2DDD5] rounded-lg focus:outline-none focus:border-[#4A0E0E] focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer shrink-0 min-h-[36px]',
                statusFilter === filter
                  ? 'bg-[#4A0E0E] text-white shadow-2xs'
                  : 'bg-white text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#F7F5F0] hover:text-[#242424]'
              )}
            >
              {filter === 'all' ? 'All Customers' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <ErrorState
          title="Failed to load customers"
          description={error?.message || 'Unable to retrieve customer directory.'}
          onRetry={refetch}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-[#4A0E0E]" />}
          title={searchTerm || statusFilter !== 'all' ? 'No matching customers' : 'No customers yet'}
          description={
            searchTerm || statusFilter !== 'all'
              ? 'No client accounts match your search query or filter criteria. Try clearing filters.'
              : 'Add your first customer to start tracking enquiries, scheduling site visits, and managing projects.'
          }
          actionLabel="+ New Customer"
          onAction={handleCreateNew}
        />
      ) : (
        <>
          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-10 bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                  <th className="pl-6 pr-4">Customer Name</th>
                  <th className="px-4">Phone / Contact</th>
                  <th className="px-4">Location</th>
                  <th className="px-4 text-center">Enquiries</th>
                  <th className="px-4 text-center">Visits</th>
                  <th className="px-4">Status</th>
                  <th className="pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/60 text-sm">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="h-14 hover:bg-[#F9F3E5]/40 transition-colors cursor-pointer group"
                  >
                    <td className="pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-xs font-bold text-[#4A0E0E] shrink-0 group-hover:border-[#C99A2E] transition-colors">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-[#242424] group-hover:text-[#4A0E0E] transition-colors">
                            {c.name}
                          </span>
                          {c.email && (
                            <p className="text-[11px] text-[#6B6B6B] truncate max-w-[180px]">
                              {c.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4">
                      {c.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-[#242424]">
                            +91 {c.phone}
                          </span>
                          <a
                            href={`tel:${c.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-[#1E6B37] hover:bg-[#EAF5EE] rounded transition-colors"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8C8880]">—</span>
                      )}
                    </td>

                    <td className="px-4">
                      <span className="text-xs text-[#6B6B6B] truncate max-w-[200px] block">
                        {c.address || '—'}
                      </span>
                    </td>

                    <td className="px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-[#F7F5F0] border border-[#E2DDD5] rounded-md text-[#242424]">
                        {c.enquiries_count || 0}
                      </span>
                    </td>

                    <td className="px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-[#F7F5F0] border border-[#E2DDD5] rounded-md text-[#242424]">
                        {c.site_visits_count || 0}
                      </span>
                    </td>

                    <td className="px-4">
                      <StatusBadge variant={c.status === 'active' ? 'active' : 'inactive'}>
                        {c.status === 'active' ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </td>

                    <td className="pr-6 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${c.id}`);
                          }}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#4A0E0E] hover:bg-[#F7F5F0] rounded-lg transition-colors cursor-pointer"
                          title="View customer record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleEdit(c, e)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#C99A2E] hover:bg-[#F9F3E5] rounded-lg transition-colors cursor-pointer"
                          title="Edit details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Visible on Mobile < 768px) */}
          <div className="md:hidden space-y-3">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center font-bold text-sm text-[#4A0E0E] shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#242424] leading-tight">
                        {c.name}
                      </h3>
                      {c.phone && (
                        <p className="text-xs font-mono text-[#6B6B6B] mt-0.5">
                          +91 {c.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <StatusBadge variant={c.status === 'active' ? 'active' : 'inactive'}>
                    {c.status === 'active' ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>

                {/* Location row */}
                {c.address && (
                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                    {c.address}
                  </p>
                )}

                {/* Activity Counts */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#E2DDD5]/60 text-xs text-[#6B6B6B]">
                  <span>Enquiries: <strong className="text-[#242424]">{c.enquiries_count || 0}</strong></span>
                  <span>•</span>
                  <span>Site Visits: <strong className="text-[#242424]">{c.site_visits_count || 0}</strong></span>
                </div>

                {/* Action Buttons (Touch Target >= 48px) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {c.phone ? (
                    <a
                      href={`tel:${c.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 py-3 px-3 bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20 rounded-lg text-xs font-bold active:scale-95 transition-transform min-h-[48px]"
                    >
                      <Phone className="w-4 h-4" />
                      Call Client
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="py-3 px-3 bg-[#F7F5F0] text-[#8C8880] rounded-lg text-xs font-medium min-h-[48px]"
                    >
                      No Phone
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customers/${c.id}`);
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-3 bg-[#4A0E0E] text-white rounded-lg text-xs font-bold active:scale-95 transition-transform min-h-[48px]"
                  >
                    <Eye className="w-4 h-4" />
                    Open Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Customer Form Drawer */}
      <CustomerFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
      />
    </div>
  );
}
