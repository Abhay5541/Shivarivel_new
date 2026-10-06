import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  MapPin,
  User,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { ActionButton } from '@/components/ui/ActionButton';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { useProjects, useUpdateProject } from '@/hooks/useProjects';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import type { Project, ProjectStatus } from '@/types/projects';
import { SplitText } from '@/components/ui/SplitText';

export const SitesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
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

  const statusOptions = useMemo<SegmentOption<'all' | 'active' | 'completed'>[]>(
    () => [
      {
        id: 'all',
        label: 'All',
        count: allCount,
      },
      {
        id: 'active',
        label: 'Active',
        count: activeCount,
        dotColor: '#166534',
        activeColorClass: 'text-[#166534]',
      },
      {
        id: 'completed',
        label: 'Completed',
        count: completedCount,
        dotColor: '#C99A2E',
        activeColorClass: 'text-[#4A0E0E]',
      },
    ],
    [allCount, activeCount, completedCount]
  );

  // Search & status filtering
  const searchedSites = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((site) => {
      const siteMatch = site.name.toLowerCase().includes(term);
      const customerMatch = site.customer?.name
        ? site.customer.name.toLowerCase().includes(term)
        : false;
      const locationMatch = site.site_address
        ? site.site_address.toLowerCase().includes(term)
        : false;
      return siteMatch || customerMatch || locationMatch;
    });
  }, [sites, searchTerm]);

  const activeSites = useMemo(
    () => searchedSites.filter((s) => s.status !== 'Completed'),
    [searchedSites]
  );

  const completedSites = useMemo(
    () => searchedSites.filter((s) => s.status === 'Completed'),
    [searchedSites]
  );

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

  const renderProjectCard = (site: Project) => (
    <div
      key={site.id}
      onClick={() => navigate(`/projects/${site.id}`)}
      className="bg-white border border-[#E2DDD5] rounded-2xl p-5 hover:border-[#4A0E0E]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-[#242424] font-heading group-hover:text-[#4A0E0E] transition-colors leading-snug">
            {site.name}
          </h2>

          {/* Mark Complete / Completed button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete(site);
            }}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              site.status === 'Completed'
                ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                : 'bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#DCFCE7] hover:text-[#166534] hover:border-[#86EFAC]'
            }`}
            title={
              site.status === 'Completed'
                ? 'Completed (Click to reopen as Active)'
                : 'Click to mark as Complete'
            }
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{site.status === 'Completed' ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-[#6B6B6B]">
          {site.customer?.name && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
              <span className="font-semibold text-[#242424]">
                {site.customer.name}
              </span>
            </div>
          )}

          {site.site_address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
              <span className="truncate">{site.site_address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={(e) => handleOpenEditProject(e, site)}
          className="font-medium text-[#6B6B6B] hover:text-[#4A0E0E] px-2 py-1 -ml-2 rounded-md hover:bg-[#F7F5F0] transition-colors cursor-pointer"
        >
          Edit Project
        </button>
        <span className="font-bold text-[#4A0E0E] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          View Project
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );

  const isCurrentListEmpty =
    activeTab === 'all'
      ? searchedSites.length === 0
      : activeTab === 'active'
      ? activeSites.length === 0
      : completedSites.length === 0;

  if (isLoading) {
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
          title="Could not load projects"
          description={error?.message || 'Unable to retrieve projects.'}
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
            text="Projects"
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

        <div className="flex items-center gap-2.5">
          <Search
            size="sm"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search projects or clients..."
          />
          <ActionButton
            icon={<Plus className="w-4 h-4" />}
            label="Add Project"
            onClick={handleOpenAddProject}
          />
        </div>
      </div>

      {/* Sliding Segmented Filter: All / Active / Completed */}
      <div className="mb-5 overflow-x-auto no-scrollbar">
        <SlidingSegmentedControl
          options={statusOptions}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
          size="md"
          ariaLabel="Filter projects by status"
        />
      </div>

      {/* Project Cards List */}
      {isCurrentListEmpty ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={
            searchTerm
              ? 'No matching projects found'
              : activeTab === 'completed'
              ? 'No completed projects yet.'
              : activeTab === 'active'
              ? 'No active projects found.'
              : 'No projects yet.'
          }
          description={
            searchTerm
              ? `No project matching "${searchTerm}". Try another search keyword.`
              : undefined
          }
          actionLabel={searchTerm || activeTab !== 'all' ? undefined : '+ Add Project'}
          onAction={searchTerm || activeTab !== 'all' ? undefined : handleOpenAddProject}
        />
      ) : activeTab === 'all' ? (
        <div className="space-y-6">
          {/* 1. Active Projects (Shown First - Highest Priority) */}
          {activeSites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  Active Projects
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {activeSites.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSites.map(renderProjectCard)}
              </div>
            </div>
          )}

          {/* 2. Completed Projects (Shown Below Active) */}
          {completedSites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 pt-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  Completed Projects
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {completedSites.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedSites.map(renderProjectCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeTab === 'active' ? activeSites : completedSites).map(renderProjectCard)}
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
