import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  MapPin,
  User,
  ArrowRight,
  Edit2,
  Search as SearchIcon,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import { useProjects, useUpdateProject } from '@/hooks/useProjects';
import type { Project, ProjectStatus } from '@/types/projects';
import projectBannerBg from '@/Asserts/project_banner.png';

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

  const projectFilterOptions = useMemo<SegmentOption<'all' | 'active' | 'completed'>[]>(
    () => [
      {
        id: 'all',
        label: 'All Projects',
        shortLabel: 'All',
        count: allCount,
        activeColorClass: 'text-[#4A0E0E]',
      },
      {
        id: 'active',
        label: 'Active',
        shortLabel: 'Active',
        count: activeCount,
        dotColor: '#166534',
        activeColorClass: 'text-[#166534]',
      },
      {
        id: 'completed',
        label: 'Completed',
        shortLabel: 'Done',
        count: completedCount,
        dotColor: '#7A7265',
        activeColorClass: 'text-[#6B6B6B]',
      },
    ],
    [allCount, activeCount, completedCount]
  );

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
                Contract: <span className="font-bold text-[#242424] font-sans tabular-nums">₹{Number(site.contract_value).toLocaleString('en-IN')}</span>
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
      <div className="space-y-4">
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
    <PageContainer className="pb-24 select-none">
      {/* 1. HERO BANNER (Projects Background Banner with Text) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E2DDD5]/70 bg-[#12100E] h-[135px] sm:h-[155px] md:h-[175px] mb-4">
        <img
          src={projectBannerBg}
          alt="Projects Banner"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent sm:from-black/80 sm:via-black/35 sm:to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-white tracking-wide">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-inter mt-1 max-w-[210px] sm:max-w-xs leading-snug">
            Manage and track your active construction sites.
          </p>
        </div>
      </div>

      {/* 2. SEARCH & ADD PROJECT ROW */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project, client or location..."
            className="w-full h-11 pl-10 pr-3.5 bg-white border border-[#E8E4DC] rounded-xl text-xs sm:text-sm text-[#242424] placeholder:text-[#8C867E] focus:outline-none focus:border-[#4A0E0E] focus:ring-1 focus:ring-[#4A0E0E]/20 transition-all shadow-2xs"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenAddProject}
          className="h-11 px-3.5 sm:px-4 rounded-xl bg-[#5A0F12] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#430B0D] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Project</span>
        </button>
      </div>

      {/* 3. SLIDING SEGMENTED FILTER: [ All Projects (X) ] [ Active (Y) ] [ Completed (Z) ] */}
      <div className="mb-4">
        <SlidingSegmentedControl
          options={projectFilterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          fullWidth
          ariaLabel="Filter projects"
        />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
