import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Eye,
  Edit2,
  Calendar,
  MapPin,
  Building2,
  Clock,
  TrendingUp,
  User,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { PageContainer } from '@/components/layout/PageContainer';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import { StatusBadge, type StatusVariant } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { formatINR } from '@/lib/utils';
import type { ProjectStatus } from '@/types/projects';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects({
    search: searchTerm,
    status: selectedStatus,
  });

  // KPI Summary calculations
  const totalCount = projects.length;
  const activeCount = projects.filter((p) => p.status === 'Active').length;
  const planningCount = projects.filter(
    (p) => p.status === 'Planned' || p.status === 'Planning'
  ).length;
  const totalContractValue = projects.reduce(
    (sum, p) => sum + (p.contract_value || 0),
    0
  );

  const statusFilters: { id: string; label: string }[] = [
    { id: 'all', label: 'All Projects' },
    { id: 'Active', label: 'Active Execution' },
    { id: 'Planned', label: 'Planned' },
    { id: 'Planning', label: 'Planning' },
    { id: 'On Hold', label: 'On Hold' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Cancelled', label: 'Cancelled' },
  ];

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

  return (
    <PageContainer className="pb-24">
      {/* Top Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#242424] tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Construction command workspace, site contracts, execution tracking & operations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/projects/new')}
            className="h-10 px-4 bg-[#4A0E0E] hover:bg-[#380A0A] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer gap-1.5 flex items-center justify-center shrink-0"
          >
            <Plus className="w-4 h-4 text-[#C99A2E]" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Projects
            </span>
            <Building2 className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] mt-2 font-mono">
            {totalCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Active Execution
            </span>
            <Briefcase className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-2xl font-bold text-[#1E6B37] mt-2 font-mono">
            {activeCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Planning / Planned
            </span>
            <Clock className="w-4 h-4 text-[#C99A2E]" />
          </div>
          <p className="text-2xl font-bold text-[#242424] mt-2 font-mono">
            {planningCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Contract Value
            </span>
            <TrendingUp className="w-4 h-4 text-[#1E6B37]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1E6B37] mt-2 font-mono tabular-nums">
            {formatINR(totalContractValue)}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          {statusFilters.map((filter) => {
            const isActive = selectedStatus === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedStatus(filter.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[40px] flex items-center cursor-pointer ${
                  isActive
                    ? 'bg-[#4A0E0E] text-white shadow-xs'
                    : 'bg-white text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] border border-[#E2DDD5]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <div className="self-start sm:self-auto shrink-0">
          <Search
            size="sm"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search projects, client, site..."
          />
        </div>
      </div>


      {/* Content States */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load projects"
          description={error instanceof Error ? error.message : 'Please check your connection and retry.'}
          onRetry={() => refetch()}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={searchTerm || selectedStatus !== 'all' ? 'No matching projects found' : 'No projects yet'}
          description={
            searchTerm || selectedStatus !== 'all'
              ? 'Try adjusting your search keywords or status filter to see other projects.'
              : 'Projects represent your active job sites and contracts. Create your first project from an approved estimate or start fresh.'
          }
          actionLabel="+ New Project"
          onAction={() => navigate('/projects/new')}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2DDD5] bg-[#F7F5F0]/60 text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                    <th className="py-3 px-4 w-28">Project #</th>
                    <th className="py-3 px-4">Project & Scope</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Site Location</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4 text-right">Contract Value</th>
                    <th className="py-3 px-4 text-center w-28">Status</th>
                    <th className="py-3 px-4 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5] text-xs">
                  {projects.map((proj) => (
                    <tr
                      key={proj.id}
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="hover:bg-[#F7F5F0]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#4A0E0E]">
                        {proj.project_code}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[#242424] group-hover:text-[#4A0E0E] transition-colors truncate">
                          {proj.name}
                        </div>
                        {proj.description && (
                          <div className="text-[11px] text-[#6B6B6B] truncate mt-0.5">
                            {proj.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#242424]">
                          {proj.customer?.name || 'Client Unassigned'}
                        </div>
                        {proj.customer?.phone && (
                          <div className="text-[11px] text-[#6B6B6B] font-mono mt-0.5">
                            +91 {proj.customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#6B6B6B] max-w-xs truncate">
                        {proj.site_address || 'Address not recorded'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#242424]">
                        {proj.start_date || 'TBD'}
                        {proj.expected_end_date && (
                          <span className="text-[#6B6B6B] block">
                            → {proj.expected_end_date}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#242424] tabular-nums">
                        {proj.contract_value ? formatINR(proj.contract_value) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge variant={getStatusVariant(proj.status)}>
                          {proj.status}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/projects/${proj.id}`)}
                            title="Open Command Center"
                            aria-label={`Open command center for ${proj.project_code}`}
                            className="p-2 text-[#6B6B6B] hover:text-[#4A0E0E] hover:bg-[#F7F5F0] rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${proj.id}/edit`)}
                            title="Edit Project"
                            aria-label={`Edit ${proj.project_code}`}
                            className="p-2 text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] rounded-lg transition-colors"
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
          </div>

          {/* Mobile Cards (360px & 390px Viewports) */}
          <div className="md:hidden space-y-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="bg-white rounded-xl border border-[#E2DDD5] p-4 space-y-3 shadow-xs hover:border-[#4A0E0E]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#4A0E0E] block">
                      {proj.project_code}
                    </span>
                    <h3 className="font-bold text-sm text-[#242424] mt-0.5 leading-snug">
                      {proj.name}
                    </h3>
                  </div>
                  <StatusBadge variant={getStatusVariant(proj.status)}>
                    {proj.status}
                  </StatusBadge>
                </div>

                <div className="space-y-1.5 text-xs text-[#6B6B6B]">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                    <span className="text-[#242424] font-medium truncate">
                      {proj.customer?.name || 'Client unassigned'}
                    </span>
                  </div>

                  {proj.site_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                      <span className="truncate">{proj.site_address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                    <span className="font-mono text-[11px]">
                      {proj.start_date || 'TBD'}
                      {proj.expected_end_date ? ` → ${proj.expected_end_date}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[#E2DDD5]/70 bg-[#F7F5F0]/60 -mx-4 -mb-4 px-4 py-2.5 rounded-b-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">
                      Contract Value
                    </span>
                    <p className="font-mono font-bold text-sm text-[#242424] tabular-nums">
                      {proj.contract_value ? formatINR(proj.contract_value) : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/projects/${proj.id}/edit`)}
                      className="p-2.5 bg-white border border-[#E2DDD5] text-[#242424] rounded-lg text-xs font-semibold hover:bg-[#F7F5F0] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="px-3.5 py-2.5 bg-[#4A0E0E] text-white rounded-lg text-xs font-semibold hover:bg-[#380B0B] transition-colors min-h-[44px] flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      Command Center
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
};
