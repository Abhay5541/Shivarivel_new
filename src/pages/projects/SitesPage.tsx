import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  MapPin,
  User,
  ArrowRight,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { ActionButton } from '@/components/ui/ActionButton';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/projects';

export const SitesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  // Search by Project name, Client name, or Location
  const filteredSites = useMemo(() => {
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
          <h1 className="text-2xl font-bold font-display text-[#242424] tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Active projects and work sites
          </p>
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

      {/* Project Cards List */}
      {filteredSites.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={searchTerm ? 'No matching projects found' : 'No projects yet.'}
          description={
            searchTerm
              ? `No project matching "${searchTerm}". Try another search keyword.`
              : 'Add a project to get started.'
          }
          actionLabel={searchTerm ? undefined : '+ Add Project'}
          onAction={searchTerm ? undefined : handleOpenAddProject}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              onClick={() => navigate(`/projects/${site.id}`)}
              className="bg-white border border-[#E2DDD5] rounded-2xl p-5 hover:border-[#4A0E0E]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <h2 className="text-base font-bold text-[#242424] font-heading group-hover:text-[#4A0E0E] transition-colors">
                  {site.name}
                </h2>

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
          ))}
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
