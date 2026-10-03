import { Link } from 'react-router-dom';
import { Building2, ArrowUpRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DashboardProjects } from '@/types/dashboard';

interface ActiveProjectsSectionProps {
  projects: DashboardProjects;
}

export function ActiveProjectsSection({ projects }: ActiveProjectsSectionProps) {
  const { active_project_list = [], active_projects = 0 } = projects;

  return (
    <section aria-labelledby="projects-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2
            id="projects-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E] font-heading"
          >
            Active Projects Portfolio
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20 tabular-nums">
            {active_projects} Sites Running
          </span>
        </div>
        <Link
          to="/projects"
          className="text-xs font-semibold text-[#4A0E0E] hover:text-[#C99A2E] flex items-center gap-1 transition-colors"
        >
          <span>View All Projects</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {active_project_list.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="Your active project list is clear"
          description="There are currently no projects marked as active. You can create a new project from an approved estimate or start a direct site."
          actionLabel="+ New Project"
          onAction={() => {
            window.location.href = '/projects';
          }}
          className="py-10"
        />
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden divide-y divide-[#E2DDD5]/70 shadow-xs">
          {active_project_list.map((proj) => {
            const progress = Math.min(100, Math.max(0, proj.overall_progress_percentage || 0));

            return (
              <div
                key={proj.id}
                className="p-4 sm:p-5 hover:bg-[#F7F5F0]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Project Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#6B6B6B] bg-[#F7F5F0] px-1.5 py-0.5 rounded border border-[#E2DDD5]">
                      {proj.project_code || 'PRJ-2026'}
                    </span>
                    <StatusBadge variant="active">Active Site</StatusBadge>
                    {proj.expected_end_date && (
                      <span className="text-[11px] text-[#6B6B6B]">
                        Target completion: <strong className="text-[#242424] font-medium">{proj.expected_end_date}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#242424] font-heading truncate">
                    {proj.name}
                  </h3>

                  {/* Progress Bar */}
                  <div className="pt-1 max-w-md">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#6B6B6B]">Work Execution Progress</span>
                      <span className="font-bold text-[#242424] tabular-nums">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C99A2E] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Position & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2DDD5]/60 shrink-0">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-[#6B6B6B]">Contract Value</div>
                    <div className="text-sm sm:text-base font-bold text-[#242424] font-heading tabular-nums">
                      {formatINR(proj.contract_value)}
                    </div>
                    {proj.outstanding_amount > 0 && (
                      <div className="text-[11px] text-[#9E2A2B] font-semibold mt-0.5 tabular-nums">
                        Due: {formatINR(proj.outstanding_amount)}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/projects/${proj.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#4A0E0E] text-white hover:bg-[#380A0A] shadow-xs transition-colors shrink-0"
                  >
                    <span>Open Site</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
