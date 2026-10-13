import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  MapPin,
  User,
  ArrowRight,
  Edit2,
  SlidersHorizontal,
  Search as SearchIcon,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { useProjects, useUpdateProject } from '@/hooks/useProjects';
import type { Project, ProjectStatus } from '@/types/projects';

export const ProjectsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const updateProjectMutation = useUpdateProject();

  // Auto-open modal if navigated with ?new=1 or ?new=true
  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingProject(null);
      setIsSiteModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    data: sites = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects();

  // Status counts
  const allCount = sites.length;
  const activeCount = sites.filter((s) => s.status !== 'Completed').length;
  const completedCount = sites.filter((s) => s.status === 'Completed').length;

  // Search & status filtering
  const filteredSites = useMemo(() => {
    let list = sites;

    if (statusFilter === 'active') {
      list = list.filter((s) => s.status !== 'Completed');
    } else if (statusFilter === 'completed') {
      list = list.filter((s) => s.status === 'Completed');
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;

    return list.filter((site) => {
      const siteMatch = site.name.toLowerCase().includes(term);
      const customerMatch = site.customer?.name
        ? site.customer.name.toLowerCase().includes(term)
        : false;
      const locationMatch = site.site_address
        ? site.site_address.toLowerCase().includes(term)
        : false;
      const codeMatch = site.project_code
        ? site.project_code.toLowerCase().includes(term)
        : false;
      return siteMatch || customerMatch || locationMatch || codeMatch;
    });
  }, [sites, searchTerm, statusFilter]);

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setIsSiteModalOpen(true);
  };

  const handleOpenEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsSiteModalOpen(true);
  };

  const handleSiteCreated = (createdSite: Project) => {
    navigate(`/projects/${createdSite.id}`);
  };

  const handleToggleComplete = (site: Project) => {
    const isCompleted = site.status === 'Completed';
    const newStatus: ProjectStatus = isCompleted ? 'Active' : 'Completed';
    updateProjectMutation.mutate({
      id: site.id,
      payload: {
        status: newStatus,
      },
    });
  };

  const renderProjectCard = (site: Project) => {
    const isCompleted = site.status === 'Completed';

    return (
      <div
        key={site.id}
        onClick={() => navigate(`/projects/${site.id}`)}
        className="bg-white border border-[#E8E4DC] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
      >
        <div>
          {/* Header: Project Icon, Name, Project Code & Status Badge */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] font-bold text-[#A67C24]">
                    {site.project_code || 'PRJ'}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-[#242424] font-inter group-hover:text-[#4A0E0E] transition-colors truncate">
                  {site.name}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(site);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-[#E8F8EE] text-[#1E7E34] hover:bg-[#d4f3de]'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              title={isCompleted ? 'Click to reopen as Active' : 'Click to mark as Complete'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted ? 'bg-[#1E7E34]' : 'bg-blue-500'
                }`}
              />
              <span>{isCompleted ? 'Completed' : 'Active'}</span>
            </button>
          </div>

          {/* Details: Client, Location, Contract Value */}
          <div className="mt-3 space-y-1.5 text-xs text-[#6B6B6B] pl-1">
            {site.customer?.name && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                <span className="font-semibold text-[#242424] truncate">
                  {site.customer.name}
                </span>
              </div>
            )}
            {site.site_address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                <span className="truncate">{site.site_address}</span>
              </div>
            )}
            {site.contract_value ? (
              <div className="text-[11.5px] font-medium text-[#6B6B6B]">
                Contract: <span className="font-bold text-[#242424] font-mono">₹{Number(site.contract_value).toLocaleString('en-IN')}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Action Bar: Edit Project & View Details */}
        <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={(e) => handleOpenEditProject(e, site)}
            className="font-medium text-[#6B6B6B] hover:text-[#4A0E0E] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Edit</span>
          </button>

          <span className="font-bold text-[#4A0E0E] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
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
          title="Could not load projects"
          description={error?.message || 'Unable to retrieve projects.'}
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
            Projects
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5 font-inter">
            Manage and track your active construction sites
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddProject}
          className="h-9 px-3.5 rounded-xl bg-[#4A0E0E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-[#380A0A] active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Project</span>
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
            placeholder="Search by project, client or location..."
            className="w-full h-11 pl-10 pr-3.5 bg-[#FAF7F0] border border-[#E8E4DC] rounded-xl text-xs sm:text-sm text-[#242424] placeholder:text-[#8C867E] focus:outline-none focus:border-[#4A0E0E] focus:bg-white transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setStatusFilter((prev) => (prev === 'all' ? 'active' : prev === 'active' ? 'completed' : 'all'));
          }}
          className="w-11 h-11 rounded-xl bg-[#FAF7F0] border border-[#E8E4DC] flex items-center justify-center text-[#4A0E0E] hover:bg-white active:scale-95 transition-all shrink-0 cursor-pointer"
          title="Toggle Filter"
          aria-label="Filter Projects"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 3. SEGMENTED FILTER PILLS: [ All (X) ] [ Active (Y) ] [ Completed (Z) ] */}
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
          onClick={() => setStatusFilter('completed')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-[#4A0E0E] text-white shadow-xs'
              : 'bg-[#EFECE6] text-[#6B6B6B] hover:bg-[#E5E1D8]'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* 4. PROJECT LIST */}
      {filteredSites.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={
            searchTerm
              ? 'No matching projects found'
              : statusFilter === 'completed'
              ? 'No completed projects yet.'
              : statusFilter === 'active'
              ? 'No active projects found.'
              : 'No projects yet.'
          }
          description={
            searchTerm
              ? `No project matching "${searchTerm}". Try another search keyword.`
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSites.map(renderProjectCard)}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <SimpleSiteModal
        isOpen={isSiteModalOpen}
        onClose={() => {
          setIsSiteModalOpen(false);
          setEditingProject(null);
        }}
        site={editingProject}
        onSuccess={handleSiteCreated}
      />
    </PageContainer>
  );
};
