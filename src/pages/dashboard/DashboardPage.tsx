import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  ShoppingCart,
  ArrowUpRight,
  HardHat,
  PackageCheck,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useCustomers } from '@/hooks/useCustomers';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useWorkforce';
import { usePurchases } from '@/hooks/useProcurement';
import { useCompanySettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';

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
        <div className="animate-pulse space-y-6">
          <div className="h-44 rounded-2xl bg-[#E2DDD5]/40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-32 rounded-2xl bg-[#E2DDD5]/40" />
            <div className="h-32 rounded-2xl bg-[#E2DDD5]/40" />
            <div className="h-32 rounded-2xl bg-[#E2DDD5]/40" />
            <div className="h-32 rounded-2xl bg-[#E2DDD5]/40" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-[#E2DDD5]/40" />
            <div className="h-64 rounded-2xl bg-[#E2DDD5]/40" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071510] via-[#0D241C] to-[#071510] border border-[#C9A24A]/30 p-6 sm:p-8 text-white shadow-xl mb-6">
        {/* Subtle geometric pattern & gold ambient glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#C9A24A]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-[#152B23]/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-[#E5C378]/80 font-medium block">
              {todayFormatted}
            </span>

            <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-normal text-white tracking-tight leading-tight">
              {greeting}, <span className="font-semibold text-[#E5C378]">{ownerName}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* 2. CORE EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Module 1: Clients */}
        <div
          onClick={() => navigate('/customers')}
          className="group bg-white rounded-2xl border border-[#E2DDD5] p-5 shadow-xs hover:shadow-md hover:border-[#C9A24A] transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Clients
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F9F3E5] text-[#8F6A18] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-[#242424]">
              {kpis.totalCustomers}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              <span className="font-semibold text-emerald-700">{kpis.activeCustomersCount} Active</span> registered client profiles
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs font-semibold text-[#8F6A18] group-hover:translate-x-0.5 transition-transform">
            <span>Manage Clients</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Module 2: Projects */}
        <div
          onClick={() => navigate('/projects')}
          className="group bg-white rounded-2xl border border-[#E2DDD5] p-5 shadow-xs hover:shadow-md hover:border-[#4A0E0E] transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Projects
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F7EFEF] text-[#4A0E0E] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-[#242424]">
              {kpis.activeProjectsCount}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Active projects out of <span className="font-semibold">{kpis.totalProjects} total</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs font-semibold text-[#4A0E0E] group-hover:translate-x-0.5 transition-transform">
            <span>View Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Module 3: Daily Laborers */}
        <div
          onClick={() => navigate('/wages')}
          className="group bg-white rounded-2xl border border-[#E2DDD5] p-5 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Daily Laborers
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HardHat className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-[#242424]">
              {kpis.totalEmployees}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              <span className="font-semibold text-emerald-700">{kpis.activeEmployeesCount} active</span> registered site laborers
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
            <span>Daily Wages &amp; Attendance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Module 4: Procurement */}
        <div
          onClick={() => navigate('/procurement')}
          className="group bg-white rounded-2xl border border-[#E2DDD5] p-5 shadow-xs hover:shadow-md hover:border-[#8F6A18] transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Procurement
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F9F3E5] text-[#8F6A18] flex items-center justify-center group-hover:scale-105 transition-transform">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-[#242424]">
              {kpis.totalPurchases}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Material purchase bills logged
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs font-semibold text-[#8F6A18] group-hover:translate-x-0.5 transition-transform">
            <span>Material Purchases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. DUAL OPERATIONAL PANELS: ACTIVE PROJECTS & RECENT PURCHASES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Panel: Active Projects */}
        <div className="bg-white rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD5]/70 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4A0E0E]" />
                <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider">
                  Active Projects
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects')}
                className="text-xs text-[#4A0E0E] font-semibold gap-1"
              >
                <span>View All ({projects.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Building2 className="w-8 h-8 text-[#E2DDD5] mx-auto" />
                <p className="text-xs text-[#6B6B6B] font-medium">No projects added yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/projects/new')}
                  className="text-xs text-[#4A0E0E] font-bold hover:underline cursor-pointer"
                >
                  + Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="p-3.5 rounded-xl border border-[#F0EAE1] hover:border-[#4A0E0E]/40 hover:bg-[#FAF8F5] transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#8F6A18]">
                          {p.project_code || 'PRJ'}
                        </span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7EFEF] text-[#4A0E0E]">
                          {p.status}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-[#242424] truncate mt-0.5">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B] truncate">
                        {p.customer?.name ? `Client: ${p.customer.name}` : p.site_address || 'Project Details'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {p.contract_value ? (
                        <div className="text-xs font-bold text-[#242424] font-mono">
                          ₹{Number(p.contract_value).toLocaleString('en-IN')}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#6B6B6B]">Value unset</div>
                      )}
                      <span className="text-[10px] text-[#8F6A18] font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                        View <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Procurement & Purchases Log */}
        <div className="bg-white rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD5]/70 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#8F6A18]" />
                <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wider">
                  Recent Material Procurement
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/procurement')}
                className="text-xs text-[#8F6A18] font-semibold gap-1"
              >
                <span>View All ({purchases.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {purchases.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <ShoppingCart className="w-8 h-8 text-[#E2DDD5] mx-auto" />
                <p className="text-xs text-[#6B6B6B] font-medium">No material bills logged yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/procurement?new=1')}
                  className="text-xs text-[#8F6A18] font-bold hover:underline cursor-pointer"
                >
                  + Log First Purchase
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.slice(0, 4).map((pur) => (
                  <div
                    key={pur.id}
                    onClick={() => navigate(`/procurement/purchases/${pur.id}`)}
                    className="p-3.5 rounded-xl border border-[#F0EAE1] hover:border-[#C9A24A]/40 hover:bg-[#FAF8F5] transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#6B6B6B]">
                          {pur.purchase_number || 'PUR'}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pur.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pur.payment_status || 'Unpaid'}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-[#242424] truncate mt-0.5">
                        {pur.supplier?.name || 'Material Vendor'}
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B] truncate">
                        {pur.project?.name ? `Project: ${pur.project.name}` : pur.purchase_date || 'General Stock'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#242424] font-mono">
                        ₹{Number(pur.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-[#8F6A18] font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                        Details <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. TODAY'S LABOR WORKFORCE SNAPSHOT */}
      <div className="bg-[#FAF8F5] rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4A0E0E] text-[#C9A24A] flex items-center justify-center shrink-0 shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#242424]">
              Daily Labor &amp; Wage Register
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Record morning/evening attendance, calculate wages, and handle advance settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/wages')}
            className="flex-1 md:flex-none text-xs"
          >
            Attendance Register
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/wages?mark=1')}
            className="flex-1 md:flex-none text-xs bg-[#071510] hover:bg-[#152B23] text-white"
          >
            Record Today's Wages
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
