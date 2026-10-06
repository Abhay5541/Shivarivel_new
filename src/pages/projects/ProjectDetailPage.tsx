import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  User,
  Phone,
  Edit2,
  FileCheck,
  FileText,
  HardHat,
  Receipt,
  ShoppingCart,
  Image,
  FolderOpen,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  useProject,
  useProjectWorkProgress,
  useProjectFinancials,
  useProjectDocuments,
  useDeleteProject,
} from '@/hooks/useProjects';
import { usePurchases } from '@/hooks/useProcurement';
import { useProjectWorkforce } from '@/hooks/useWorkforce';
import { Button } from '@/components/ui/Button';
import { StatusBadge, type StatusVariant } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { formatINR } from '@/lib/utils';
import {
  PROJECT_DOCUMENT_CATEGORIES,
  type ProjectStatus,
  type WorkItemStatus,
} from '@/types/projects';

type TabKey =
  | 'overview'
  | 'work-progress'
  | 'finance'
  | 'purchases'
  | 'workforce'
  | 'daily-reports'
  | 'documents';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'work-progress', label: 'Work Progress', icon: HardHat },
  { key: 'finance', label: 'Finance', icon: Receipt },
  { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'workforce', label: 'Workforce', icon: User },
  { key: 'daily-reports', label: 'Daily Reports', icon: FileText },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
];

export const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [documentCategory, setDocumentCategory] = useState<string>('all');

  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const { data: workProgressData } = useProjectWorkProgress(id);
  const { data: financials } = useProjectFinancials(id);
  const { data: documents = [] } = useProjectDocuments(id);
  const { data: projectPurchases = [] } = usePurchases({ project_id: id });
  const { data: workforceData } = useProjectWorkforce(id);
  const deleteProjectMutation = useDeleteProject();

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      await deleteProjectMutation.mutateAsync(project.id);
      navigate('/projects');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6 pb-20">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Projects
        </button>
        <ErrorState
          title="Project not found"
          description={error instanceof Error ? error.message : 'Unable to retrieve project details.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const getStatusVariant = (status: ProjectStatus): StatusVariant => {
    switch (status) {
      case 'Active':
        return 'active';
      case 'Planning':
      case 'Planned':
        return 'pending';
      case 'Completed':
        return 'completed';
      case 'On Hold':
        return 'overdue';
      case 'Cancelled':
        return 'inactive';
      default:
        return 'active';
    }
  };

  const getWorkItemStatusVariant = (status: WorkItemStatus): StatusVariant => {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'In Progress':
        return 'in-progress';
      case 'Not Started':
        return 'pending';
      case 'On Hold':
        return 'overdue';
      case 'Cancelled':
        return 'inactive';
      default:
        return 'pending';
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (documentCategory === 'all') return true;
    return doc.category === documentCategory;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Projects
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {project.estimate_id && (
            <Button
              variant="outline"
              onClick={() => navigate(`/estimates/${project.estimate_id}`)}
              className="text-xs font-semibold min-h-[40px] border-[#E2DDD5]"
            >
              <FileCheck className="w-4 h-4 mr-1.5 text-[#C99A2E]" />
              Linked Estimate
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => navigate(`/projects/${project.id}/edit`)}
            className="bg-[#4A0E0E] text-white hover:bg-[#380B0B] text-xs font-semibold min-h-[40px] px-4 cursor-pointer"
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            Edit Project
          </Button>

          <Button
            variant="outline"
            onClick={handleDeleteProject}
            disabled={deleteProjectMutation.isPending}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-semibold min-h-[40px] px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* PROJECT COMMAND CENTER IDENTITY HEADER */}
      <div className="bg-white rounded-2xl border border-[#E2DDD5] p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-bold text-[#4A0E0E] uppercase tracking-wider bg-[#4A0E0E]/5 px-2.5 py-0.5 rounded-sm border border-[#4A0E0E]/10">
                PROJECT COMMAND CENTER
              </span>
              <span className="font-mono text-xs font-bold text-[#4A0E0E]">
                {project.project_code}
              </span>
              <StatusBadge variant={getStatusVariant(project.status)}>
                {project.status}
              </StatusBadge>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#242424] font-heading leading-snug">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Value Box */}
          <div className="bg-[#F7F5F0] border border-[#E2DDD5] p-3.5 sm:p-4 rounded-xl shrink-0 text-left md:text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Contract Value
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#242424] mt-0.5 tabular-nums">
              {project.contract_value ? formatINR(project.contract_value) : '—'}
            </p>
            <span className="text-[10px] text-[#6B6B6B] block mt-0.5">
              Fixed Contract Execution
            </span>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-[#E2DDD5]/70 text-xs">
          {/* Customer */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Client / Customer
            </span>
            <div className="font-semibold text-[#242424]">
              {project.customer ? (
                <Link
                  to={`/customers/${project.customer.id}`}
                  className="hover:text-[#4A0E0E] hover:underline"
                >
                  {project.customer.name}
                </Link>
              ) : (
                'Client unassigned'
              )}
            </div>
            {project.customer?.phone && (
              <div className="text-[11px] text-[#6B6B6B] font-mono flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#C99A2E]" />
                +91 {project.customer.phone}
              </div>
            )}
          </div>

          {/* Site Location */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Site Location
            </span>
            <div className="font-medium text-[#242424] flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0 mt-0.5" />
              <span className="leading-snug">{project.site_address || 'Address not recorded'}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Execution Timeline
            </span>
            <div className="font-mono text-[11px] font-medium text-[#242424] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
              <span>{project.start_date || 'TBD'}</span>
              <span className="text-[#6B6B6B]">→</span>
              <span>{project.expected_end_date || 'Ongoing'}</span>
            </div>
          </div>

          {/* Supervisor */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Site Supervision
            </span>
            <div className="font-semibold text-[#242424] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
              <span>{project.supervisor?.full_name || 'Direct Company Oversight'}</span>
            </div>
            {project.supervisor?.phone && (
              <div className="text-[11px] text-[#6B6B6B] font-mono">
                +91 {project.supervisor.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7 COMMAND CENTER TABS */}
      <div className="border-b border-[#E2DDD5] overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 min-w-max pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                data-testid={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs rounded-t-lg transition-all min-h-[44px] ${
                  isActive
                    ? 'border-b-2 border-[#4A0E0E] text-[#4A0E0E] bg-white font-bold'
                    : 'text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Work Progress Snapshot */}
          <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#C99A2E]" />
                <h3 className="font-bold text-sm text-[#242424] uppercase tracking-wider">
                  Work Progress Snapshot
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('work-progress')}
                className="text-xs font-bold text-[#4A0E0E] hover:underline flex items-center gap-1"
              >
                View Work Items
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {workProgressData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#6B6B6B]">Overall Execution Milestones</span>
                  <span className="font-mono text-sm font-bold text-[#4A0E0E]">
                    {workProgressData.summary.overall_progress_percentage}% Complete
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-3 bg-[#F7F5F0] rounded-full overflow-hidden border border-[#E2DDD5]/70">
                  <div
                    className="h-full bg-[#4A0E0E] transition-all duration-500 rounded-full"
                    style={{ width: `${workProgressData.summary.overall_progress_percentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="bg-[#F7F5F0] p-2.5 rounded-lg border border-[#E2DDD5]/60">
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                      Completed
                    </span>
                    <span className="font-mono font-bold text-[#1E6B37] text-sm">
                      {workProgressData.summary.completed_work_items}
                    </span>
                  </div>
                  <div className="bg-[#F7F5F0] p-2.5 rounded-lg border border-[#E2DDD5]/60">
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                      In Progress
                    </span>
                    <span className="font-mono font-bold text-[#C99A2E] text-sm">
                      {workProgressData.summary.in_progress_work_items}
                    </span>
                  </div>
                  <div className="bg-[#F7F5F0] p-2.5 rounded-lg border border-[#E2DDD5]/60">
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                      Not Started
                    </span>
                    <span className="font-mono font-bold text-[#6B6B6B] text-sm">
                      {workProgressData.summary.not_started_work_items}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#6B6B6B]">
                No progress items recorded yet. Work milestones will appear once logged.
              </p>
            )}
          </div>

          {/* Financial Context Box (STRICTLY NO PROFIT / NO MARGINS) */}
          <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C99A2E]" />
                <h3 className="font-bold text-sm text-[#242424] uppercase tracking-wider">
                  Project Financial Context
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('finance')}
                className="text-xs font-bold text-[#4A0E0E] hover:underline flex items-center gap-1"
              >
                Financial Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {financials ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#F7F5F0] p-3 rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                    Contract Value
                  </span>
                  <p className="font-mono font-bold text-sm sm:text-base text-[#242424] mt-1 tabular-nums">
                    {formatINR(financials.contract_value)}
                  </p>
                </div>

                <div className="bg-[#F7F5F0] p-3 rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                    Customer Received
                  </span>
                  <p className="font-mono font-bold text-sm sm:text-base text-[#1E6B37] mt-1 tabular-nums">
                    {formatINR(financials.amount_received)}
                  </p>
                </div>

                <div className="bg-[#F7F5F0] p-3 rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                    Customer Outstanding
                  </span>
                  <p className="font-mono font-bold text-sm sm:text-base text-[#A84B14] mt-1 tabular-nums">
                    {formatINR(financials.outstanding_amount)}
                  </p>
                </div>

                <div className="bg-[#F7F5F0] p-3 rounded-lg border border-[#E2DDD5]">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                    Recorded Project Cost
                  </span>
                  <p className="font-mono font-bold text-sm sm:text-base text-[#4A0E0E] mt-1 tabular-nums">
                    {formatINR(financials.recorded_project_cost)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#6B6B6B]">Financial data pending initial postings.</p>
            )}

            <div className="text-[11px] text-[#6B6B6B] italic pt-1">
              * Recorded Project Cost includes purchases, verified worker wages, and logged site expenses.
            </div>
          </div>

          {/* Operational Notes */}
          {project.notes && (
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-2">
              <h3 className="font-bold text-xs text-[#242424] uppercase tracking-wider">
                Site Constraints & Access Notes
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed whitespace-pre-line">
                {project.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORK PROGRESS */}
      {activeTab === 'work-progress' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#242424] font-heading">
                Work Progress Milestones
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Field execution stages, trade assignments, and milestone completion percentages
              </p>
            </div>
          </div>

          {workProgressData && workProgressData.items.length > 0 ? (
            <div className="space-y-3">
              {workProgressData.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-[#E2DDD5] p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.category && (
                        <span className="text-[10px] font-bold text-[#4A0E0E] uppercase tracking-wider bg-[#4A0E0E]/5 px-2 py-0.5 rounded-sm border border-[#4A0E0E]/10">
                          {item.category}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-[#242424] mt-1">
                        {item.name}
                      </h4>
                    </div>

                    <StatusBadge variant={getWorkItemStatusVariant(item.status)}>
                      {item.status}
                    </StatusBadge>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-[#6B6B6B] italic">
                      {item.notes}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B6B6B]">Execution Progress</span>
                      <span className="font-mono font-bold text-[#4A0E0E]">
                        {item.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F7F5F0] rounded-full overflow-hidden border border-[#E2DDD5]">
                      <div
                        className="h-full bg-[#4A0E0E] rounded-full"
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-1 font-mono">
                    <span>Start: {item.start_date || 'TBD'}</span>
                    <span>
                      Target: {item.actual_completion || item.expected_completion || 'Ongoing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<HardHat className="w-6 h-6" />}
              title="No work progress items yet"
              description="Milestones and trade execution stages will be managed here as site operations commence."
            />
          )}
        </div>
      )}

      {/* TAB 3: FINANCE (STRICTLY NO PROFIT) */}
      {activeTab === 'finance' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#242424] font-heading">
                Project Financial Balance
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Contract billing receipts, customer balance, and aggregated cost components
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/customer-payments/new?project_id=${id}&customer_id=${project.customer_id}`)}
                className="inline-flex items-center gap-1.5 bg-[#1E6B37] hover:bg-[#18552C] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Customer Payment</span>
              </button>
              <button
                onClick={() => navigate(`/expenses/new?project_id=${id}`)}
                className="inline-flex items-center gap-1.5 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {financials ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Account Side */}
              <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-2">
                  <h3 className="font-bold text-xs text-[#242424] uppercase tracking-wider">
                    Customer Contract Account
                  </h3>
                  <Link
                    to={`/customer-payments?project_id=${id}`}
                    className="text-[11px] font-semibold text-[#1E6B37] hover:underline"
                  >
                    View Receipts →
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E2DDD5]/40">
                    <span className="text-[#6B6B6B]">Contract Agreed Value</span>
                    <span className="font-mono font-bold text-[#242424]">
                      {formatINR(financials.contract_value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E2DDD5]/40">
                    <span className="text-[#1E6B37] font-medium">Customer Amount Received</span>
                    <span className="font-mono font-bold text-[#1E6B37]">
                      {formatINR(financials.amount_received)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 pt-2">
                    <span className="text-[#A84B14] font-bold">Outstanding Customer Balance</span>
                    <span className="font-mono font-bold text-sm text-[#A84B14]">
                      {formatINR(financials.outstanding_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recorded Cost Side */}
              <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DDD5]/70 pb-2">
                  <h3 className="font-bold text-xs text-[#242424] uppercase tracking-wider">
                    Recorded Project Costs
                  </h3>
                  <Link
                    to={`/expenses?project_id=${id}`}
                    className="text-[11px] font-semibold text-[#4A0E0E] hover:underline"
                  >
                    View Expenses →
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E2DDD5]/40">
                    <span className="text-[#6B6B6B]">Material Purchases</span>
                    <span className="font-mono font-bold text-[#242424]">
                      {formatINR(financials.total_purchases)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E2DDD5]/40">
                    <span className="text-[#6B6B6B]">Employee & Labour Wages</span>
                    <span className="font-mono font-bold text-[#242424]">
                      {formatINR(financials.total_wages)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E2DDD5]/40">
                    <span className="text-[#6B6B6B]">Verified Direct Expenses</span>
                    <span className="font-mono font-bold text-[#242424]">
                      {formatINR(financials.total_expenses)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 pt-2">
                    <span className="text-[#4A0E0E] font-bold">Total Recorded Project Cost</span>
                    <span className="font-mono font-bold text-sm text-[#4A0E0E]">
                      {formatINR(financials.recorded_project_cost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Receipt className="w-6 h-6" />}
              title="No financial records posted"
              description="Customer receipts and direct site expenses will be reflected as payments are recorded."
            />
          )}

          <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD5] text-xs text-[#6B6B6B] flex items-center justify-between">
            <div>
              <strong>Recorded Project Cost:</strong> Purchases + Employee Wages + Expenses. This reflects actual field outflows.
            </div>
            <Link to="/financial-summary" className="text-xs font-semibold text-[#4A0E0E] hover:underline shrink-0 ml-2">
              Financial Summary →
            </Link>
          </div>
        </div>
      )}

      {/* TAB 4: PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#242424] font-heading">
                Project Material Purchases
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Bills of materials, vendor orders, and procurement items allocated to this job site
              </p>
            </div>

            <button
              onClick={() => navigate(`/purchases/new?project_id=${id}`)}
              className="inline-flex items-center gap-1.5 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors self-start min-h-[40px]"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              + Log Purchase for Project
            </button>
          </div>

          {projectPurchases.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="w-6 h-6" />}
              title="No purchases logged for this project"
              description="Record vendor delivery challans, structural steel orders, cement bags, or interior fittings allocated to this site."
              actionLabel="Add Purchase"
              onAction={() => navigate(`/purchases/new?project_id=${id}`)}
            />
          ) : (
            <div className="space-y-3">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#E2DDD5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                    Total Purchases Logged
                  </span>
                  <p className="text-base font-bold font-mono text-[#242424] mt-1 tabular-nums">
                    {formatINR(projectPurchases.reduce((s, p) => s + p.total_amount, 0))}
                  </p>
                  <span className="text-[10px] text-[#6B6B6B] block">
                    {projectPurchases.length} invoices
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E2DDD5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                    Disbursed Payments
                  </span>
                  <p className="text-base font-bold font-mono text-[#1E6B37] mt-1 tabular-nums">
                    {formatINR(projectPurchases.reduce((s, p) => s + (p.total_allocated || 0), 0))}
                  </p>
                  <span className="text-[10px] text-[#1E6B37]/80 block">
                    Settled to suppliers
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E2DDD5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                    Outstanding Due
                  </span>
                  <p className="text-base font-bold font-mono text-[#A84B14] mt-1 tabular-nums">
                    {formatINR(
                      Math.max(
                        0,
                        projectPurchases.reduce((s, p) => s + p.total_amount, 0) -
                          projectPurchases.reduce((s, p) => s + (p.total_allocated || 0), 0)
                      )
                    )}
                  </p>
                  <span className="text-[10px] text-[#A84B14]/80 block">
                    Pending vendor payment
                  </span>
                </div>
              </div>

              {/* Purchases List */}
              <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F5F0] border-b border-[#E2DDD5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                    <tr>
                      <th className="py-2.5 px-4">Purchase #</th>
                      <th className="py-2.5 px-4">Supplier</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                      <th className="py-2.5 px-4 text-right">Balance</th>
                      <th className="py-2.5 px-4 text-center">Payment Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD5]/60">
                    {projectPurchases.map((p) => {
                      const bal = p.outstanding_balance ?? p.total_amount;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/purchases/${p.id}`)}
                          className="hover:bg-[#F7F5F0]/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#4A0E0E] block">
                              {p.purchase_number}
                            </span>
                            {p.invoice_number && (
                              <span className="text-[10px] text-[#6B6B6B] block">
                                Inv: {p.invoice_number}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#242424]">
                            {p.supplier?.name || 'Vendor'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#242424]">
                            {p.purchase_date}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#242424]">
                            {formatINR(p.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#A84B14]">
                            {formatINR(bal)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.payment_status === 'Paid'
                                  ? 'bg-[#1E6B37]/10 text-[#1E6B37]'
                                  : p.payment_status === 'Partial'
                                  ? 'bg-[#C99A2E]/10 text-[#C99A2E]'
                                  : 'bg-[#A84B14]/10 text-[#A84B14]'
                              }`}
                            >
                              {p.payment_status || 'Unpaid'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/purchases/${p.id}`);
                              }}
                              className="text-xs font-semibold text-[#4A0E0E] hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WORKFORCE */}
      {activeTab === 'workforce' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#242424] font-heading">
              Site Workforce & Allocation
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Assigned site engineers, supervisors, and specialized trade crews
            </p>
          </div>

          {project.supervisor ? (
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-[#242424] uppercase tracking-wider">
                Assigned Supervisor Profile
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4A0E0E]/10 text-[#4A0E0E] flex items-center justify-center font-bold font-heading">
                  {project.supervisor.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#242424]">
                    {project.supervisor.full_name}
                  </h4>
                  <p className="text-xs text-[#6B6B6B]">
                    Field Supervisor • {project.supervisor.phone ? `+91 ${project.supervisor.phone}` : 'No phone recorded'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<User className="w-6 h-6" />}
              title="No dedicated supervisor assigned"
              description="Edit this project to assign a field supervisor from your team."
              actionLabel="Assign Supervisor"
              onAction={() => navigate(`/projects/${project.id}/edit`)}
            />
          )}

          {/* Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Assigned Workers
              </span>
              <span className="text-xl font-bold text-[#242424] font-heading tabular-nums mt-1 block">
                {workforceData?.assignedEmployees.length || 0} Craftsmen
              </span>
              <span className="text-[10px] text-[#6B6B6B]">Masons, barbenders, carpenters</span>
            </div>

            <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Logged Shifts
              </span>
              <span className="text-xl font-bold text-[#1E6B37] font-heading tabular-nums mt-1 block">
                {workforceData?.totalDays || 0} Days
              </span>
              <span className="text-[10px] text-[#6B6B6B]">Verified shift muster units</span>
            </div>

            <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Recorded Labor Cost
              </span>
              <span className="text-xl font-bold text-[#4A0E0E] font-heading tabular-nums mt-1 block">
                {formatINR(workforceData?.totalEarned || 0)}
              </span>
              <span className="text-[10px] text-[#6B6B6B]">Cumulative confirmed site wages</span>
            </div>
          </div>

          {/* Assigned Crew List */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#242424] uppercase tracking-wider font-heading">
                  Assigned Site Crew Roster
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Workers permanently or currently attached to this site
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/attendance">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-[#1E6B37]">
                    Mark Attendance
                  </Button>
                </Link>
                <Link to="/employees/new">
                  <Button variant="primary" size="sm" className="h-8 text-xs font-semibold">
                    Add Worker
                  </Button>
                </Link>
              </div>
            </div>

            {(!workforceData?.assignedEmployees || workforceData.assignedEmployees.length === 0) ? (
              <div className="p-6 bg-[#F7F5F0] rounded-xl text-center text-xs text-[#6B6B6B]">
                No specific workers mapped to this project yet. Use Attendance to log shifts for any roster worker.
              </div>
            ) : (
              <div className="divide-y divide-[#E2DDD5] border border-[#E2DDD5] rounded-xl overflow-hidden">
                {workforceData.assignedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="p-3.5 hover:bg-[#F7F5F0] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                          {emp.employee_code}
                        </span>
                        <span className="font-bold text-sm text-[#242424]">{emp.name}</span>
                      </div>
                      <div className="text-xs text-[#6B6B6B] mt-0.5">
                        {emp.worker_type} • Phone: {emp.phone || 'No phone'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#242424] tabular-nums">
                        {emp.daily_wage ? `${formatINR(emp.daily_wage)}/day` : '—'}
                      </div>
                      <div className="text-[11px] text-[#1E6B37] font-semibold">
                        {emp.total_present_days || 0} shifts logged
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DAILY REPORTS */}
      {activeTab === 'daily-reports' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#242424] font-heading">
              Daily Site Reports (DSR)
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Supervisor site logs, weather conditions, work completed today, and inspection notes
            </p>
          </div>

          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="Daily Site Reports"
            description="Field-native daily reporting with photo capture and site notes will be enabled in Phase 16."
          />
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#242424] font-heading">
                Project Documents & Drawings
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Architectural CAD floor plans, 3D elevation renders, municipal approvals, and signed agreements
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            <button
              onClick={() => setDocumentCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[36px] ${
                documentCategory === 'all'
                  ? 'bg-[#4A0E0E] text-white'
                  : 'bg-white text-[#6B6B6B] hover:text-[#242424] border border-[#E2DDD5]'
              }`}
            >
              All Files ({documents.length})
            </button>
            {PROJECT_DOCUMENT_CATEGORIES.map((cat) => {
              const count = documents.filter((d) => d.category === cat).length;
              if (count === 0 && documentCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setDocumentCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[36px] ${
                    documentCategory === cat
                      ? 'bg-[#4A0E0E] text-white'
                      : 'bg-white text-[#6B6B6B] hover:text-[#242424] border border-[#E2DDD5]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Document Cards */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredDocuments.map((doc) => {
                const isImg = doc.mime_type.startsWith('image/');
                const Icon = isImg ? Image : FileText;
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-[#E2DDD5] p-4 flex items-start gap-3 shadow-xs hover:border-[#4A0E0E]/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#4A0E0E] shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A0E0E] bg-[#4A0E0E]/5 px-2 py-0.5 rounded-sm">
                          {doc.category}
                        </span>
                        {doc.file_size_bytes && (
                          <span className="font-mono text-[10px] text-[#6B6B6B]">
                            {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-xs text-[#242424] truncate">
                        {doc.file_name}
                      </h4>

                      {doc.description && (
                        <p className="text-[11px] text-[#6B6B6B] line-clamp-2 leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      <div className="text-[10px] text-[#6B6B6B] pt-1 font-mono">
                        Uploaded {doc.created_at.split('T')[0]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<FolderOpen className="w-6 h-6" />}
              title="No documents in this category"
              description="Drawings and approvals will be stored and organized here under their respective architectural categories."
            />
          )}
        </div>
      )}
    </div>
  );
};
