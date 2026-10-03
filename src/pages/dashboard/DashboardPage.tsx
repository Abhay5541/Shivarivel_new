import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarCheck,
  ShieldCheck,
  HardHat,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';

import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { AttentionSection } from '@/components/dashboard/AttentionSection';
import { MoneySection } from '@/components/dashboard/MoneySection';
import { ActiveProjectsSection } from '@/components/dashboard/ActiveProjectsSection';
import { TodayOperationsSection } from '@/components/dashboard/TodayOperationsSection';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  // Role detection: 'Owner' | 'Supervisor' (default to Owner if not specified)
  const userRole = (user?.user_metadata?.role as string) || 'Owner';
  const isSupervisor = userRole.toLowerCase().includes('supervisor');
  const isOwner = !isSupervisor;

  const userName =
    user?.user_metadata?.full_name ||
    (isSupervisor ? 'A. Murugan' : 'K. Senthil Nathan');

  // Time-adaptive greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <ErrorState
          title="Command Center Unavailable"
          description="Failed to load live dashboard operational summaries from the server."
          error={error}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 10-Second Operations Briefing Header */}
      <PageHeader
        title={`${greeting}, ${userName}`}
        subtitle={`Today's Operations Briefing · ${todayFormatted}`}
        badge={
          isOwner ? (
            <Badge variant="primary" className="gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C99A2E]" />
              <span>Executive Command</span>
            </Badge>
          ) : (
            <Badge variant="neutral" className="gap-1">
              <HardHat className="w-3 h-3 text-[#4A0E0E]" />
              <span>Field Supervisor</span>
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/today">
              <Button variant="secondary" size="sm" className="gap-1.5 h-9">
                <CalendarCheck className="w-4 h-4 text-[#C99A2E]" />
                <span>My Day</span>
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="primary" size="sm" className="gap-1.5 h-9">
                <Building2 className="w-4 h-4" />
                <span>Projects</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6 mt-2">
        {/* SECTION 1 — ATTENTION (Strict Priority 1) */}
        <AttentionSection actions={data.actions} />

        {/* SECTION 2 — MONEY (Strict Priority 2, Rule 18 Non-Netting)
            Displayed for Owner/Admin role; Supervisors focus on field operations */}
        {isOwner && <MoneySection financial={data.financial} />}

        {/* SECTION 3 — ACTIVE PROJECTS (Strict Priority 3) */}
        <ActiveProjectsSection projects={data.projects} />

        {/* SECTION 4 — TODAY (Workforce, Tasks, Site Visits) */}
        <TodayOperationsSection
          workforce={data.workforce}
          actions={data.actions}
        />

        {/* SECTION 5 — RECENT ACTIVITY (Strict Priority 5) */}
        {isOwner && <RecentActivitySection financial={data.financial} />}
      </div>
    </PageContainer>
  );
}
