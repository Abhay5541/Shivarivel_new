import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Plus,
  Briefcase,
  Compass,
  User,
  Calculator,
  Building2,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCustomer } from '@/hooks/useCustomers';
import { useEnquiries } from '@/hooks/useEnquiries';
import { useSiteVisits } from '@/hooks/useSiteVisits';
import { useEstimates } from '@/hooks/useEstimates';
import { useProjects } from '@/hooks/useProjects';
import { useCustomerPayments } from '@/hooks/useFinance';
import { CustomerFormDrawer } from '@/components/business/CustomerFormDrawer';
import { EnquiryFormDrawer } from '@/components/business/EnquiryFormDrawer';
import { SiteVisitFormDrawer } from '@/components/business/SiteVisitFormDrawer';
import { SiteVisitDetailModal } from '@/components/business/SiteVisitDetailModal';
import type { SiteVisit } from '@/types/business';
import { formatINR, cn } from '@/lib/utils';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'visits' | 'estimates' | 'projects' | 'payments'>('overview');

  // Drawers & Modals
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [isNewVisitOpen, setIsNewVisitOpen] = useState(false);
  const [selectedVisitForDetail, setSelectedVisitForDetail] = useState<SiteVisit | null>(null);

  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const { data: enquiries = [] } = useEnquiries({ customerId: id });
  const { data: siteVisits = [] } = useSiteVisits({ customerId: id });
  const { data: estimates = [] } = useEstimates({ customerId: id });
  const { data: customerProjects = [] } = useProjects({ customerId: id });
  const { data: customerPayments = [] } = useCustomerPayments({ customerId: id });

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading customer record..." />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <ErrorState
        title="Customer not found"
        description={error?.message || `No customer found matching identifier ${id}`}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditCustomerOpen(true)}
            className="cursor-pointer min-h-[44px]"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Customer Record Header Card */}
      <div className="p-6 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-xl font-bold text-[#4A0E0E] shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#242424] font-heading">
                  {customer.name}
                </h1>
                <StatusBadge variant={customer.status === 'active' ? 'active' : 'inactive'}>
                  {customer.status === 'active' ? 'Active Client' : 'Inactive'}
                </StatusBadge>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 flex items-center gap-3 flex-wrap">
                <span>Client ID: <strong className="text-[#242424] font-mono">{customer.id.slice(0, 8)}</strong></span>
                <span>•</span>
                <span>Registered: {new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-[#1E6B37] text-white rounded-lg hover:bg-[#1E6B37]/90 active:scale-95 transition-all shadow-2xs min-h-[44px]"
              >
                <Phone className="w-4 h-4" />
                Call Client
              </a>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewEnquiryOpen(true)}
              className="cursor-pointer min-h-[44px]"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-[#C99A2E]" />
              + New Enquiry
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/estimates/new?customer_id=${customer.id}`)}
              className="cursor-pointer min-h-[44px]"
            >
              <Calculator className="w-3.5 h-3.5 mr-1.5 text-[#C99A2E]" />
              + New Estimate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/new?customer_id=${customer.id}`)}
              className="cursor-pointer min-h-[44px]"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#4A0E0E]" />
              + New Project
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/customer-payments/new?customer_id=${customer.id}`)}
              className="cursor-pointer min-h-[44px] text-[#1E6B37] border-[#1E6B37]/30 hover:bg-[#1E6B37]/5"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5 text-[#1E6B37]" />
              Record Payment
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewVisitOpen(true)}
              className="cursor-pointer min-h-[44px]"
            >
              <Compass className="w-3.5 h-3.5 mr-1.5" />
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* Contact Coordinates Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E2DDD5]/60 text-xs text-[#242424]">
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-[#C99A2E] shrink-0" />
            <div>
              <span className="text-[#6B6B6B] text-[11px] block">Primary Phone</span>
              <span className="font-mono font-semibold">{customer.phone ? `+91 ${customer.phone}` : 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#C99A2E] shrink-0" />
            <div>
              <span className="text-[#6B6B6B] text-[11px] block">Email Contact</span>
              <span className="truncate block font-medium">{customer.email || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#C99A2E] shrink-0" />
            <div>
              <span className="text-[#6B6B6B] text-[11px] block">Default Site Address</span>
              <span className="truncate block font-medium">{customer.address || 'Address not registered'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-px overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview & Notes', icon: User },
          { key: 'enquiries', label: `Enquiries (${enquiries.length})`, icon: Briefcase },
          { key: 'visits', label: `Site Visits (${siteVisits.length})`, icon: Compass },
          { key: 'estimates', label: `Estimates (${estimates.length})`, icon: Calculator },
          { key: 'projects', label: `Projects (${customerProjects.length})`, icon: Building2 },
          { key: 'payments', label: `Receipts (${customerPayments.length})`, icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 min-h-[44px]',
                isActive
                  ? 'border-[#4A0E0E] text-[#4A0E0E] bg-[#F7F5F0]/50'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0]/30'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-[#C99A2E]' : 'text-[#6B6B6B]')} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-[#242424] font-heading">
                Internal Construction & Client Notes
              </h3>
              {customer.notes ? (
                <p className="text-xs text-[#242424] leading-relaxed bg-[#F7F5F0]/50 p-4 border border-[#E2DDD5] rounded-lg">
                  {customer.notes}
                </p>
              ) : (
                <p className="text-xs text-[#8C8880] italic">
                  No internal notes recorded yet for this client. Click "Edit Profile" to add preferences or requirements.
                </p>
              )}
            </div>

            <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-[#242424] font-heading">
                Permanent Billing & Site Address
              </h3>
              <p className="text-xs text-[#242424] leading-relaxed">
                {customer.address || 'No permanent address recorded.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white border border-[#E2DDD5] rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-[#4A0E0E] uppercase tracking-wider">
                Relationship Summary
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#E2DDD5]/60">
                  <span className="text-[#6B6B6B]">Total Enquiries</span>
                  <span className="font-bold text-[#242424]">{enquiries.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E2DDD5]/60">
                  <span className="text-[#6B6B6B]">Site Visits Conducted</span>
                  <span className="font-bold text-[#242424]">{siteVisits.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E2DDD5]/60">
                  <span className="text-[#6B6B6B]">Active Projects</span>
                  <span className="font-bold text-[#242424]">Phase 05</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#6B6B6B]">Client Status</span>
                  <span className="font-semibold text-[#1E6B37] capitalize">{customer.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242424] font-heading">
              Enquiries for {customer.name}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewEnquiryOpen(true)}
              className="cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + New Enquiry
            </Button>
          </div>

          {enquiries.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-6 h-6 text-[#4A0E0E]" />}
              title="No enquiries recorded"
              description={`There are currently no enquiries recorded for ${customer.name}.`}
              actionLabel="+ Record New Enquiry"
              onAction={() => setIsNewEnquiryOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#4A0E0E]">
                      {enq.service_type?.name || 'General Construction'}
                    </span>
                    <StatusBadge variant={enq.status === 'Converted' ? 'completed' : 'pending'}>
                      {enq.status}
                    </StatusBadge>
                  </div>

                  <p className="text-xs text-[#242424] leading-relaxed line-clamp-2">
                    {enq.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E2DDD5]/60 text-xs">
                    <div>
                      <span className="text-[#6B6B6B] block text-[10px]">Estimated Value</span>
                      <span className="font-bold text-[#242424]">
                        {enq.estimated_value ? formatINR(enq.estimated_value) : 'TBD'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#6B6B6B] block text-[10px]">Enquiry Date</span>
                      <span className="font-mono text-[#242424]">{enq.enquiry_date}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewVisitOpen(true)}
                      className="cursor-pointer text-[11px] h-8"
                    >
                      <Compass className="w-3 h-3 mr-1 text-[#C99A2E]" />
                      Visit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Site Visits */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242424] font-heading">
              Site Visits for {customer.name}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewVisitOpen(true)}
              className="cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule Visit
            </Button>
          </div>

          {siteVisits.length === 0 ? (
            <EmptyState
              icon={<Compass className="w-6 h-6 text-[#4A0E0E]" />}
              title="No site visits scheduled"
              description={`There are no on-site inspection visits recorded for ${customer.name}.`}
              actionLabel="Schedule Site Visit"
              onAction={() => setIsNewVisitOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {siteVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisitForDetail(visit)}
                  className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs space-y-3 cursor-pointer hover:border-[#C99A2E] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#242424]">
                          {visit.visit_date}
                        </span>
                        <StatusBadge
                          variant={
                            visit.status === 'Completed'
                              ? 'completed'
                              : visit.status === 'Cancelled'
                              ? 'overdue'
                              : 'active'
                          }
                        >
                          {visit.status}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                        {visit.site_address || 'Address not specified'}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
                      View Notes
                    </Button>
                  </div>

                  <p className="text-xs text-[#242424] font-medium">
                    Purpose: {visit.purpose || 'Initial consultation & site inspection'}
                  </p>

                  {visit.observations && (
                    <div className="p-2.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs text-[#242424]">
                      <span className="font-semibold text-[#4A0E0E]">Observations:</span> {visit.observations}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-2 border-t border-[#E2DDD5]/60">
                    <span>Supervisor: <strong className="text-[#242424]">{visit.assigned_profile?.full_name || 'Unassigned'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Estimates & Commercial Proposals */}
      {activeTab === 'estimates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242424] font-heading">
              Commercial Quotations & Estimates ({estimates.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/estimates/new?customer_id=${customer.id}`)}
              className="cursor-pointer min-h-[40px]"
            >
              <Calculator className="w-3.5 h-3.5 mr-1.5 text-[#C99A2E]" />
              + New Estimate
            </Button>
          </div>

          {estimates.length === 0 ? (
            <EmptyState
              icon={<Calculator className="w-6 h-6 text-[#4A0E0E]" />}
              title="No estimates prepared yet"
              description="Create a bill of quantities (BOQ) or interior estimate for this client."
              actionLabel="+ Create Estimate"
              onAction={() => navigate(`/estimates/new?customer_id=${customer.id}`)}
            />
          ) : (
            <div className="space-y-3">
              {estimates.map((est) => (
                <div
                  key={est.id}
                  onClick={() => navigate(`/estimates/${est.id}`)}
                  className="p-4 bg-white border border-[#E2DDD5] rounded-xl shadow-2xs hover:border-[#C99A2E] transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#4A0E0E]">
                        {est.estimate_number}
                      </span>
                      <span className="text-[11px] text-[#6B6B6B] font-mono">
                        • {est.estimate_date}
                      </span>
                    </div>
                    <StatusBadge
                      variant={
                        est.status === 'Approved' || est.status === 'Accepted'
                          ? 'completed'
                          : est.status === 'Sent'
                          ? 'pending'
                          : 'draft'
                      }
                    >
                      {est.status}
                    </StatusBadge>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#242424]">
                      {est.title || 'General Construction Scope'}
                    </p>
                    <span className="text-sm font-mono font-bold text-[#242424]">
                      {formatINR(est.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-2 border-t border-[#E2DDD5]/60">
                    <span>{est.items?.length || 0} line items</span>
                    <span className="font-semibold text-[#4A0E0E] hover:underline flex items-center gap-1">
                      View Proposal &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Navigation Link */}
          <div className="p-4 bg-[#F7F5F0]/60 border border-[#E2DDD5] rounded-xl text-xs text-[#6B6B6B] flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-[#242424] block">Execution Projects</span>
              <span>Accepted estimates transition directly to active site management in the Projects Command Center.</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('projects')}
              className="text-xs font-bold text-[#4A0E0E] shrink-0"
            >
              View Projects &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Tab 5: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242424] font-heading">
              Client Construction & Interior Projects ({customerProjects.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/projects/new?customer_id=${customer.id}`)}
              className="bg-[#4A0E0E] text-white hover:bg-[#380B0B] text-xs font-semibold min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Project
            </Button>
          </div>

          {customerProjects.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-6 h-6" />}
              title="No projects for this client yet"
              description="Create a project to initialize job site tracking, milestones, and contract financials."
              actionLabel="+ Create Project"
              onAction={() => navigate(`/projects/new?customer_id=${customer.id}`)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="p-5 bg-white border border-[#E2DDD5] rounded-xl hover:border-[#4A0E0E]/40 hover:shadow-xs transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#4A0E0E] block">
                        {proj.project_code}
                      </span>
                      <h4 className="font-bold text-sm text-[#242424] mt-0.5">
                        {proj.name}
                      </h4>
                    </div>
                    <StatusBadge variant={proj.status === 'Active' ? 'active' : proj.status === 'Completed' ? 'completed' : 'pending'}>
                      {proj.status}
                    </StatusBadge>
                  </div>

                  {proj.site_address && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                      <span className="truncate">{proj.site_address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E2DDD5]/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                        Contract Value
                      </span>
                      <span className="font-mono font-bold text-[#242424]">
                        {proj.contract_value ? formatINR(proj.contract_value) : '—'}
                      </span>
                    </div>
                    <span className="font-semibold text-[#4A0E0E] hover:underline flex items-center gap-1 text-[11px]">
                      Command Center &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Customer Payment Receipts */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Customer Financial Overview Strip */}
          {(() => {
            const totalContract = customerProjects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
            const totalReceived = customerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
            const totalOutstanding = Math.max(0, totalContract - totalReceived);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-[#E2DDD5] rounded-xl">
                  <span className="text-[11px] font-bold text-[#6B6B6B] uppercase block">
                    Combined Contract Value
                  </span>
                  <span className="text-xl font-bold font-mono text-[#242424] mt-1 block">
                    {formatINR(totalContract)}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    Across {customerProjects.length} client project(s)
                  </span>
                </div>

                <div className="p-4 bg-[#1E6B37]/5 border border-[#1E6B37]/20 rounded-xl">
                  <span className="text-[11px] font-bold text-[#1E6B37] uppercase block">
                    Actual Received Money
                  </span>
                  <span className="text-xl font-bold font-mono text-[#1E6B37] mt-1 block">
                    {formatINR(totalReceived)}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    {customerPayments.length} recorded voucher(s)
                  </span>
                </div>

                <div className="p-4 bg-[#B83232]/5 border border-[#B83232]/20 rounded-xl">
                  <span className="text-[11px] font-bold text-[#B83232] uppercase block">
                    Outstanding Receivable
                  </span>
                  <span className="text-xl font-bold font-mono text-[#B83232] mt-1 block">
                    {formatINR(totalOutstanding)}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    Contract Value − Received
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#242424] font-heading">
                Customer Payment Receipts
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Actual operational receipts recorded against project work
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/customer-payments/new?customer_id=${customer.id}`)}
              className="bg-[#1E6B37] text-white hover:bg-[#1E6B37]/90 text-xs font-semibold min-h-[40px]"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Record Payment
            </Button>
          </div>

          {customerPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-6 h-6" />}
              title="No customer payments recorded yet"
              description="Record verified customer money received towards active project contracts."
              actionLabel="+ Record Payment"
              onAction={() => navigate(`/customer-payments/new?customer_id=${customer.id}`)}
            />
          ) : (
            <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[11px] uppercase text-[#6B6B6B] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Receipt / Date</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Method & Ref</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD5]/60 text-[#242424]">
                    {customerPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[#F7F5F0]/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-[#4A0E0E] block">
                            {payment.payment_number || `REC-${payment.id.slice(0, 8).toUpperCase()}`}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B] block">
                            {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold block">{payment.project?.name || 'Project'}</span>
                          <span className="font-mono text-[10px] text-[#6B6B6B]">{payment.project?.project_code || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize block font-medium">
                            {payment.payment_method?.replace(/_/g, ' ') || 'Direct'}
                          </span>
                          {payment.reference_number && (
                            <span className="font-mono text-[10px] text-[#6B6B6B] block">
                              Ref: {payment.reference_number}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono font-bold text-[#1E6B37] text-sm">
                            {formatINR(payment.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/customer-payments/${payment.id}`)}
                            className="h-8 text-[11px] px-2.5 cursor-pointer"
                          >
                            View Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Drawers */}
      <CustomerFormDrawer
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        customer={customer}
      />

      <EnquiryFormDrawer
        isOpen={isNewEnquiryOpen}
        onClose={() => setIsNewEnquiryOpen(false)}
        customerId={customer.id}
      />

      <SiteVisitFormDrawer
        isOpen={isNewVisitOpen}
        onClose={() => setIsNewVisitOpen(false)}
        customerId={customer.id}
      />

      <SiteVisitDetailModal
        isOpen={Boolean(selectedVisitForDetail)}
        onClose={() => setSelectedVisitForDetail(null)}
        siteVisit={selectedVisitForDetail}
      />
    </div>
  );
}
