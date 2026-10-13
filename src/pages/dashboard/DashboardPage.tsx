import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  ArrowUpRight,
  HardHat,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useCustomers } from '@/hooks/useCustomers';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useWorkforce';
import { usePurchases } from '@/hooks/useProcurement';
import { useCompanySettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import heroBg from '@/Asserts/Background_UI.jpg';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Clean queries from the 4 active modules
  const { data: company } = useCompanySettings();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: purchases = [], isLoading: loadingPurchases } = usePurchases();

  const isLoading = loadingCustomers || loadingProjects || loadingEmployees || loadingPurchases;

  // Real-time KPI calculations
  const kpis = useMemo(() => {
    // 1. Projects
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'Active' || p.status === 'Planning');
    const completedProjects = projects.filter((p) => p.status === 'Completed');
    const totalContractValue = projects.reduce((acc, p) => acc + (Number(p.contract_value) || 0), 0);

    // 2. Customers
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status !== 'inactive');

    // 3. Workforce
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === 'active');
    const totalDailyWageCommitment = activeEmployees.reduce((acc, e) => acc + (Number(e.daily_wage) || 0), 0);

    // 4. Procurement
    const totalPurchases = purchases.length;
    const totalPurchaseSpent = purchases.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);
    const unpaidPurchases = purchases.filter((p) => p.payment_status === 'Unpaid' || p.payment_status === 'Partial');
    const totalPendingSupplierPayable = unpaidPurchases.reduce((acc, p) => {
      const outstanding = p.outstanding_balance ?? ((Number(p.total_amount) || 0) - (Number(p.total_allocated) || 0));
      return acc + Math.max(0, outstanding);
    }, 0);

    return {
      totalProjects,
      activeProjectsCount: activeProjects.length,
      completedProjectsCount: completedProjects.length,
      totalContractValue,
      totalCustomers,
      activeCustomersCount: activeCustomers.length,
      totalEmployees,
      activeEmployeesCount: activeEmployees.length,
      totalDailyWageCommitment,
      totalPurchases,
      totalPurchaseSpent,
      totalPendingSupplierPayable,
    };
  }, [projects, customers, employees, purchases]);

  // Greeting & Date
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const ownerName = company?.owner_name || user?.user_metadata?.full_name || 'K. Senthil Nathan';

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-44 rounded-3xl bg-[#E2DDD5]/40" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-32 rounded-3xl bg-[#E2DDD5]/40" />
            <div className="h-32 rounded-3xl bg-[#E2DDD5]/40" />
            <div className="h-32 rounded-3xl bg-[#E2DDD5]/40" />
            <div className="h-32 rounded-3xl bg-[#E2DDD5]/40" />
          </div>
          <div className="h-48 rounded-3xl bg-[#E2DDD5]/40" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-md mx-auto">
      {/* 1. HERO BANNER with Architecture Background */}
      <div className="relative overflow-hidden rounded-3xl bg-[#081812] border border-[#C9A24A]/25 text-white shadow-xl mb-4">
        {/* Background Architectural Photo with Smooth Dark Gradient */}
        <div
          className="absolute inset-0 bg-cover bg-right opacity-35 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071711] via-[#071711]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-center gap-1.5 text-[#C9A24A] text-[10px] sm:text-[11px] font-bold tracking-widest uppercase mb-2">
            <span className="w-3 h-0.5 bg-[#C9A24A] rounded-full inline-block" />
            <span>{todayFormatted}</span>
          </div>

          <h1 className="font-playfair text-2xl sm:text-3xl text-white font-normal tracking-tight leading-tight">
            {greeting},<br />
            <span className="font-semibold text-[#E5C378]">{ownerName}</span>
          </h1>

          <p className="text-xs text-[#E2DDD5]/85 font-normal mt-1.5">
            Keep building. Every project matters.
          </p>

          {/* Quick Stats Pill Strip */}
          <div className="flex items-center gap-2 flex-wrap pt-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-[#F7F5F0]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span><strong className="text-white font-semibold">{kpis.activeProjectsCount}</strong> Active Sites</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-[#F7F5F0]">
              <span className="w-2 h-2 rounded-full bg-[#E5C378]" />
              <span><strong className="text-white font-semibold">{kpis.activeEmployeesCount}</strong> Site Laborers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE EXECUTIVE KPI CARDS (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Module 1: Clients */}
        <div
          onClick={() => navigate('/customers')}
          className="group bg-white rounded-3xl border border-[#E8E4DC] p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FBF3E6] text-[#A67C24] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-[10.5px] font-bold text-[#6B6B6B] uppercase tracking-wider mt-3">
              CLIENTS
            </div>
            <div className="text-2xl font-black font-heading text-[#242424] tabular-nums mt-0.5">
              {kpis.totalCustomers}
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              <span className="font-semibold text-emerald-700">{kpis.activeCustomersCount} Active</span> clients
            </p>
          </div>
          <div className="mt-3.5 py-1.5 px-3 bg-[#FAF7F0] border border-[#EFEBE3] rounded-xl flex items-center justify-between text-[11px] font-semibold text-[#242424] group-hover:bg-[#F3EFE6] transition-colors">
            <span>View Clients →</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </div>
        </div>

        {/* Module 2: Projects */}
        <div
          onClick={() => navigate('/projects')}
          className="group bg-white rounded-3xl border border-[#E8E4DC] p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-[10.5px] font-bold text-[#6B6B6B] uppercase tracking-wider mt-3">
              PROJECTS
            </div>
            <div className="text-2xl font-black font-heading text-[#242424] tabular-nums mt-0.5">
              {kpis.activeProjectsCount}
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              <span className="font-semibold text-[#4A0E0E]">{kpis.totalProjects}</span> total sites
            </p>
          </div>
          <div className="mt-3.5 py-1.5 px-3 bg-[#FAF7F0] border border-[#EFEBE3] rounded-xl flex items-center justify-between text-[11px] font-semibold text-[#242424] group-hover:bg-[#F3EFE6] transition-colors">
            <span>View Projects →</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </div>
        </div>

        {/* Module 3: Daily Laborers */}
        <div
          onClick={() => navigate('/wages')}
          className="group bg-white rounded-3xl border border-[#E8E4DC] p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
            <div className="text-[10.5px] font-bold text-[#6B6B6B] uppercase tracking-wider mt-3">
              LABORERS
            </div>
            <div className="text-2xl font-black font-heading text-[#242424] tabular-nums mt-0.5">
              {kpis.totalEmployees}
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              <span className="font-semibold text-emerald-700">{kpis.activeEmployeesCount} active</span> laborers
            </p>
          </div>
          <div className="mt-3.5 py-1.5 px-3 bg-[#FAF7F0] border border-[#EFEBE3] rounded-xl flex items-center justify-between text-[11px] font-semibold text-[#242424] group-hover:bg-[#F3EFE6] transition-colors">
            <span>View Wages →</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </div>
        </div>

        {/* Module 4: Procurement */}
        <div
          onClick={() => navigate('/procurement')}
          className="group bg-white rounded-3xl border border-[#E8E4DC] p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FBF3E6] text-[#A67C24] flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="text-[10.5px] font-bold text-[#6B6B6B] uppercase tracking-wider mt-3">
              PURCHASES
            </div>
            <div className="text-2xl font-black font-heading text-[#242424] tabular-nums mt-0.5">
              {kpis.totalPurchases}
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              Material purchase bills
            </p>
          </div>
          <div className="mt-3.5 py-1.5 px-3 bg-[#FAF7F0] border border-[#EFEBE3] rounded-xl flex items-center justify-between text-[11px] font-semibold text-[#242424] group-hover:bg-[#F3EFE6] transition-colors">
            <span>View Purchases →</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL PANEL: ACTIVE PROJECTS */}
      <div className="mb-6">
        <div className="bg-[#081812] border border-[#C9A24A]/25 rounded-3xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-[#C9A24A]/40 flex items-center justify-center text-[#E5C378]">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Active Projects
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-xs text-[#E5C378] hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#C9A24A]/30 flex items-center justify-center text-[#C9A24A] mx-auto">
                <Building2 className="w-6 h-6 stroke-[1.75]" />
              </div>
              <p className="text-xs text-white/70 font-medium">No projects added yet.</p>
              <button
                type="button"
                onClick={() => navigate('/projects/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#C9A24A] text-xs font-semibold text-[#E5C378] hover:bg-[#C9A24A]/10 active:scale-95 transition-all cursor-pointer"
              >
                <span>+ Add First Project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C9A24A]/50 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#E5C378]">
                        {p.project_code || 'PRJ'}
                      </span>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300">
                        {p.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white truncate mt-1">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-white/60 truncate">
                      {p.customer?.name ? `Client: ${p.customer.name}` : p.site_address || 'Project Details'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {p.contract_value ? (
                      <div className="text-xs font-bold text-white font-mono">
                        ₹{Number(p.contract_value).toLocaleString('en-IN')}
                      </div>
                    ) : (
                      <div className="text-[11px] text-white/50">Value unset</div>
                    )}
                    <span className="text-[10px] text-[#E5C378] font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                      View <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
