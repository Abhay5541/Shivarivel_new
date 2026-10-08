import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Edit2,
  Users2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { useProject } from '@/hooks/useProjects';
import { useWages, useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);

  const { data: site, isLoading: isLoadingSite, isError, error, refetch } = useProject(id);
  const { data: siteWages = [], isLoading: isLoadingWages } = useWages({ projectId: id });
  const { data: employees = [] } = useEmployees();

  // Calculate site wage breakdown
  const siteWageBreakdown = React.useMemo(() => {
    const map = new Map<string, { employeeName: string; total: number; days: number }>();
    for (const w of siteWages) {
      if (w.status !== 'Confirmed') continue;
      const empId = w.employee_id;
      const emp = employees.find((e) => e.id === empId);
      const name = w.employee?.name || emp?.name || 'Employee';
      const amount = Number(w.amount || w.rate || 0);

      const existing = map.get(empId) || { employeeName: name, total: 0, days: 0 };
      existing.total += amount;
      existing.days += 1;
      map.set(empId, existing);
    }
    const items = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const totalSiteWages = items.reduce((sum, item) => sum + item.total, 0);
    return { items, totalSiteWages };
  }, [siteWages, employees]);

  if (isLoadingSite) {
    return (
      <div className="py-16 max-w-4xl mx-auto">
        <LoadingState message="Loading site details..." />
      </div>
    );
  }

  if (isError || !site) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          title="Site not found"
          description={error?.message || `No site found matching identifier ${id}`}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 select-none">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/projects'))}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B6B6B] hover:text-[#4A0E0E] transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading uppercase">
            {site.name}
          </h1>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Customer Link */}
            <div>
              <span className="text-xs font-bold text-[#6B6B6B] block mb-1">
                Client
              </span>
              {site.customer ? (
                <Link
                  to={`/customers/${site.customer.id}`}
                  className="font-bold text-[#4A0E0E] hover:underline flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-[#C99A2E]" />
                  <span>{site.customer.name}</span>
                </Link>
              ) : (
                <span className="text-[#6B6B6B] italic">No client linked</span>
              )}
            </div>

            {/* Location */}
            <div>
              <span className="text-xs font-bold text-[#6B6B6B] block mb-1">
                Location
              </span>
              <div className="flex items-center gap-1.5 text-[#242424]">
                <MapPin className="w-4 h-4 text-[#C99A2E] shrink-0" />
                <span>{site.site_address || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsEditSiteOpen(true)}
          className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Project</span>
        </Button>
      </div>

      {/* Project Purchases Link */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#242424] font-heading uppercase">
            Project Purchases
          </h2>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/procurement?tab=project&projectId=${site.id}`)}
          className="h-10 px-4 text-xs font-bold text-[#4A0E0E] hover:text-[#380A0A] bg-[#F7F5F0] hover:bg-[#E2DDD5] border border-[#E2DDD5] rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>View in Procurement</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Labor / Daily Wages Section (Strictly Read-Only) */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#242424] font-heading uppercase">
                Labor / Daily Wages
              </h2>
              <span className="text-xs bg-[#4A0E0E]/10 text-[#4A0E0E] px-2 py-0.5 rounded-full font-bold">
                {siteWages.length}
              </span>
            </div>
          </div>

          <Link
            to="/wages"
            className="h-10 px-4 text-xs font-bold text-[#4A0E0E] hover:text-[#380A0A] bg-[#F7EFEF] hover:bg-[#F3E5E5] border border-[#4A0E0E]/20 rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <span>View in Wages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Daily Wages Card */}
        <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-[#6B6B6B] uppercase tracking-wider">
            Total Daily Wages
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#1E6B37] font-heading">
            {formatINR(siteWageBreakdown.totalSiteWages)}
          </span>
        </div>

        {/* Employee-wise Wage Breakdown */}
        {isLoadingWages ? (
          <div className="py-6 text-center text-xs text-[#6B6B6B]">Loading site wages...</div>
        ) : siteWageBreakdown.items.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#E2DDD5] space-y-2">
            <Users2 className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[#242424]">No daily wages recorded yet for this project.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2DDD5] border border-[#E2DDD5] rounded-xl overflow-hidden">
            {siteWageBreakdown.items.map((item) => (
              <div
                key={item.employeeName}
                className="p-4 flex items-center justify-between hover:bg-[#F7F5F0]/50 transition-colors"
              >
                <div>
                  <span className="text-sm font-bold text-[#242424] font-heading block">
                    {item.employeeName}
                  </span>
                  <span className="text-xs text-[#6B6B6B]">
                    {item.days} {item.days === 1 ? 'day recorded' : 'days recorded'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#1E6B37] font-heading">
                    {formatINR(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <SimpleSiteModal
        isOpen={isEditSiteOpen}
        onClose={() => setIsEditSiteOpen(false)}
        site={site}
      />
    </div>
  );
};
