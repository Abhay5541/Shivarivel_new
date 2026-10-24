import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Edit2,
  Users2,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  Package,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { ProjectCompletionModal } from '@/components/business/ProjectCompletionModal';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { SimpleDailyWageModal } from '@/components/business/SimpleDailyWageModal';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { useWages, useEmployees } from '@/hooks/useWorkforce';
import { usePurchases } from '@/hooks/useProcurement';
import { useCustomer } from '@/hooks/useCustomers';
import { useCompanySettings } from '@/hooks/useSettings';
import { downloadProjectCompletionPDF } from '@/lib/projectReportPdf';
import { formatINR } from '@/lib/utils';
import type { Purchase } from '@/types/procurement';
import type { DailyWage } from '@/types/workforce';

// Payment status badge color helper
function paymentStatusStyle(status: string | undefined) {
  if (status === 'Paid') return 'bg-[#E8F8EE] text-[#1E7E34]';
  if (status === 'Partial') return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-600';
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  const [editingWage, setEditingWage] = useState<DailyWage | null>(null);
  const [isWageModalOpen, setIsWageModalOpen] = useState(false);
  const [showAllWages, setShowAllWages] = useState(false);

  const { data: site, isLoading: isLoadingSite, isError, error, refetch } = useProject(id);
  const { data: siteWages = [], isLoading: isLoadingWages, refetch: refetchWages } = useWages({ projectId: id });
  const { data: employees = [] } = useEmployees();
  const {
    data: projectPurchases = [],
    isLoading: isLoadingPurchases,
    refetch: refetchPurchases,
  } = usePurchases({
    project_id: id,
  });
  const updateProjectMutation = useUpdateProject();

  // Confirmed purchases for this project & displayed subset
  const confirmedPurchases = React.useMemo(
    () => projectPurchases.filter((p) => p.status === 'Confirmed'),
    [projectPurchases]
  );
  const displayedPurchases = showAllPurchases
    ? confirmedPurchases
    : confirmedPurchases.slice(0, 4);

  // Displayed wages subset (4 items default, toggleable)
  const displayedWages = showAllWages ? siteWages : siteWages.slice(0, 4);

  // Fallback: load customer directly if project join didn't include it
  const { data: fallbackCustomer } = useCustomer(
    !site?.customer && site?.customer_id ? site.customer_id : undefined
  );

  const resolvedCustomer = site?.customer || fallbackCustomer;
  const { data: companySettings } = useCompanySettings();
  const isCompleted = site?.status === 'Completed';

  // Calculate site wage breakdown (all wages, not just confirmed)
  const siteWageBreakdown = React.useMemo(() => {
    const map = new Map<string, { employeeName: string; total: number; days: number; status: string }>();
    for (const w of siteWages) {
      const empId = w.employee_id;
      const emp = employees.find((e) => e.id === empId);
      const name = (w as any).employee?.name || emp?.name || 'Employee';
      const amount = Number((w as any).amount || (w as any).rate || 0);
      const wStatus = w.status || 'Pending';

      const existing = map.get(empId) || { employeeName: name, total: 0, days: 0, status: wStatus };
      existing.total += amount;
      existing.days += 1;
      map.set(empId, existing);
    }
    const items = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const totalSiteWages = items.reduce((sum, item) => sum + item.total, 0);
    const confirmedWages = siteWages.filter((w) => w.status === 'Confirmed')
      .reduce((sum, w) => sum + Number((w as any).amount || (w as any).rate || 0), 0);
    return { items, totalSiteWages, confirmedWages };
  }, [siteWages, employees]);

  // Purchase totals
  const purchaseTotals = React.useMemo(() => {
    const total = confirmedPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const paid = confirmedPurchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
    const outstanding = Math.max(0, total - paid);
    return { total, paid, outstanding, count: confirmedPurchases.length };
  }, [confirmedPurchases]);

  const handleConfirmComplete = async () => {
    if (!site) return;
    try {
      await updateProjectMutation.mutateAsync({
        id: site.id,
        payload: { status: 'Completed' },
      });
      setIsCompletionModalOpen(false);
    } catch (err) {
      console.warn('Failed to mark project complete:', err);
    }
  };

  const handleReopenProject = async () => {
    if (!site) return;
    try {
      await updateProjectMutation.mutateAsync({
        id: site.id,
        payload: { status: 'Active' },
      });
    } catch (err) {
      console.warn('Failed to reopen project:', err);
    }
  };

  const handleDownloadProjectReport = async () => {
    if (!site) return;
    const confirmedPurchasesList = projectPurchases.filter((p) => p.status === 'Confirmed');

    await downloadProjectCompletionPDF({
      project: {
        id: site.id,
        name: site.name,
        project_code: site.project_code,
        status: site.status,
        site_address: site.site_address,
        start_date: site.start_date,
        target_completion_date: site.expected_end_date,
        actual_completion_date: site.actual_end_date || new Date().toISOString(),
        created_at: site.created_at,
      },
      customer: resolvedCustomer || null,
      company: companySettings || null,
      wages: {
        totalWages: siteWageBreakdown.totalSiteWages,
        totalDays: siteWageBreakdown.items.reduce((s, i) => s + i.days, 0),
        uniqueLabourers: siteWageBreakdown.items.length,
        items: siteWageBreakdown.items.map((item) => {
          const emp = employees.find((e) => e.name === item.employeeName);
          return {
            employeeName: item.employeeName,
            trade: (emp as any)?.trade || (emp as any)?.worker_type || emp?.worker_type || 'Field Labour',
            days: item.days,
            total: item.total,
          };
        }),
      },
      procurement: {
        totalPurchased: purchaseTotals.total,
        totalPaid: purchaseTotals.paid,
        totalOutstanding: purchaseTotals.outstanding,
        items: confirmedPurchasesList.map((p) => {
          const item = p.items?.[0];
          const prodName =
            p.items && p.items.length > 0
              ? p.items.map((i) => i.material?.name || i.description || '').filter(Boolean).join(', ')
              : p.notes || 'Material Purchase';

          return {
            date: p.purchase_date,
            productName: prodName,
            supplierName: p.supplier?.name || 'Supplier',
            quantity: item?.quantity ? `${item.quantity} ${item.unit || ''}` : null,
            amount: p.total_amount,
            paymentStatus: p.payment_status || 'Unpaid',
          };
        }),
      },
    });
  };

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
    <div className="space-y-5 max-w-4xl mx-auto pb-24 select-none">
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

      {/* ── Main Project Header Card ─────────────────────────────── */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 shadow-xs animate-dashboard-hero">
        {/* Status Badge */}
        <div className="mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isCompleted
                ? 'bg-[#E8F8EE] text-[#1E7E34]'
                : site.status === 'Active'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-[#EFECE6] text-[#6B6B6B]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompleted
                  ? 'bg-[#1E7E34]'
                  : site.status === 'Active'
                  ? 'bg-blue-500'
                  : 'bg-gray-400'
              }`}
            />
            {site.status}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading uppercase mb-4">
          {site.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Customer */}
          <div>
            <span className="text-xs font-bold text-[#6B6B6B] block mb-1">Client</span>
            {resolvedCustomer ? (
              <Link
                to={`/customers/${resolvedCustomer.id}`}
                className="font-bold text-[#4A0E0E] hover:underline flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-[#C99A2E]" />
                <span>{resolvedCustomer.name}</span>
              </Link>
            ) : site.customer_id ? (
              <span className="text-[#6B6B6B] text-xs italic">Loading client...</span>
            ) : (
              <span className="text-[#6B6B6B] italic">No client linked</span>
            )}
          </div>

          {/* Location */}
          <div>
            <span className="text-xs font-bold text-[#6B6B6B] block mb-1">Location</span>
            <div className="flex items-center gap-1.5 text-[#242424]">
              <MapPin className="w-4 h-4 text-[#C99A2E] shrink-0" />
              <span>{site.site_address || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#E8E4DC]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditSiteOpen(true)}
            className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Project</span>
          </Button>

          {isCompleted ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadProjectReport}
                className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 bg-[#4A0E0E] text-white hover:bg-[#380A0A] rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Download Report (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleReopenProject}
                disabled={updateProjectMutation.isPending}
                className="h-10 px-3.5 text-xs font-bold flex items-center gap-1.5 bg-[#EFECE6] text-[#6B6B6B] hover:bg-[#E5E1D8] rounded-xl transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCompletionModalOpen(true)}
              disabled={updateProjectMutation.isPending}
              className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 bg-[#1E6B37] text-white hover:bg-[#176130] rounded-xl transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Completed Summary Banner ─────────────────────────────── */}
      {isCompleted && (
        <div className="bg-gradient-to-br from-[#E8F8EE] via-[#F0FAF4] to-[#E8F8EE] border border-[#1E7E34]/25 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#1E7E34]" />
              <h2 className="text-sm font-bold text-[#1E7E34] uppercase tracking-wide">
                Project Completed — Summary
              </h2>
            </div>
            <button
              type="button"
              onClick={handleDownloadProjectReport}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E7E34] hover:bg-[#16652B] text-white text-xs font-bold rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-white/70 backdrop-blur-xs rounded-xl p-3 border border-[#1E7E34]/15">
            <div>
              <span className="text-lg sm:text-xl font-bold text-[#242424] block">
                <AnimatedCounter value={siteWageBreakdown.items.length} delay={40} />
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Labourers</span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold text-[#242424] block truncate">
                <AnimatedCounter
                  value={siteWageBreakdown.items.reduce((s, i) => s + i.days, 0)}
                  delay={80}
                />
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Man-days</span>
            </div>
            <div>
              <span
                className="text-lg sm:text-xl font-bold text-[#1E6B37] block truncate"
                title={formatINR(siteWageBreakdown.totalSiteWages)}
              >
                <AnimatedCounter
                  value={siteWageBreakdown.totalSiteWages}
                  delay={120}
                  formatFn={formatINR}
                />
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Total Wages</span>
            </div>
            <div>
              <span
                className="text-lg sm:text-xl font-bold text-[#4A0E0E] block truncate"
                title={formatINR(purchaseTotals.total)}
              >
                <AnimatedCounter
                  value={purchaseTotals.total}
                  delay={160}
                  formatFn={formatINR}
                />
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Procurement</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Purchases ────────────────────────────────────── */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden animate-dashboard-panel dashboard-stagger-1">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#4A0E0E]" />
            <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wide">
              Project Purchases
            </h2>
            {!isLoadingPurchases && (
              <span className="text-xs bg-[#4A0E0E]/10 text-[#4A0E0E] px-2 py-0.5 rounded-full font-bold">
                {confirmedPurchases.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingPurchase(null);
                setIsPurchaseModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 hover:opacity-95 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              style={{
                backgroundColor: '#4A0E0E',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Purchase Total Summary */}
        {purchaseTotals.count > 0 && (
          <div className="grid grid-cols-3 divide-x divide-[#E8E4DC] bg-[#FAFAF8] border-b border-[#E8E4DC] overflow-hidden">
            <div className="px-2 sm:px-4 py-3 text-center min-w-0">
              <span
                className="text-sm sm:text-base font-bold text-[#242424] block truncate"
                title={formatINR(purchaseTotals.total)}
              >
                {formatINR(purchaseTotals.total)}
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Total Purchased</span>
            </div>
            <div className="px-2 sm:px-4 py-3 text-center min-w-0">
              <span
                className="text-sm sm:text-base font-bold text-[#1E6B37] block truncate"
                title={formatINR(purchaseTotals.paid)}
              >
                {formatINR(purchaseTotals.paid)}
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Paid</span>
            </div>
            <div className="px-2 sm:px-4 py-3 text-center min-w-0">
              <span
                className="text-sm sm:text-base font-bold text-rose-600 block truncate"
                title={formatINR(purchaseTotals.outstanding)}
              >
                {formatINR(purchaseTotals.outstanding)}
              </span>
              <span className="text-[10px] text-[#6B6B6B] block truncate">Outstanding</span>
            </div>
          </div>
        )}

        {/* Purchase List */}
        {isLoadingPurchases ? (
          <div className="py-8 text-center text-xs text-[#6B6B6B]">Loading purchases...</div>
        ) : confirmedPurchases.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Package className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
            <p className="text-xs font-semibold text-[#6B6B6B]">
              No confirmed purchases for this project.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/procurement?tab=project&projectId=${site.id}`)}
              className="text-xs font-bold text-[#4A0E0E] underline cursor-pointer"
            >
              Go to Procurement →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E4DC]">
            {displayedPurchases.map((purchase) => (
              <div
                key={purchase.id}
                onClick={() => {
                  setEditingPurchase(purchase);
                  setIsPurchaseModalOpen(true);
                }}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F7F5F0] transition-colors cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  {/* Main title: product/material names */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-[#242424] group-hover:text-[#4A0E0E] transition-colors leading-snug">
                      {(() => {
                        if (purchase.items && purchase.items.length > 0) {
                          const names = purchase.items
                            .map((item) => item.material?.name || item.description || '')
                            .filter(Boolean)
                            .join(', ');
                          if (names) return names;
                        }
                        if (purchase.notes && !purchase.notes.toLowerCase().includes('direct purchase')) {
                          return purchase.notes;
                        }
                        return 'Material Purchase';
                      })()}
                    </span>
                  </div>
                  {/* Subtitle: Date below product name + supplier */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B]">
                      <Calendar className="w-3 h-3 text-[#8C867E]" />
                      <span>
                        {new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </span>
                    </div>
                    {purchase.supplier?.name && !purchase.supplier.name.toLowerCase().includes('direct purchase') && (
                      <span className="text-[11px] text-[#6B6B6B]">
                        · {purchase.supplier.name}
                      </span>
                    )}
                  </div>

                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#242424] block">
                      {formatINR(purchase.total_amount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${paymentStatusStyle(
                        purchase.payment_status
                      )}`}
                    >
                      {purchase.payment_status || 'Unpaid'}
                    </span>
                  </div>
                  <div className="p-1 rounded-md text-[#8C867E] group-hover:text-[#4A0E0E] group-hover:bg-[#4A0E0E]/10 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
            {confirmedPurchases.length > 0 && (
              <div className="px-5 py-3 text-center bg-[#FAFAF8] border-t border-[#E8E4DC] flex items-center justify-center gap-3">
                {confirmedPurchases.length > 4 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAllPurchases((prev) => !prev)}
                      className="text-xs font-bold text-[#4A0E0E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {showAllPurchases
                          ? 'Show Less (4 items)'
                          : `View all ${confirmedPurchases.length} items`}
                      </span>
                      {showAllPurchases ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[#D5D0C7]">|</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/procurement?tab=project&projectId=${site?.id || id}`)}
                  className="text-xs font-semibold text-[#8C867E] hover:text-[#4A0E0E] transition-colors cursor-pointer"
                >
                  Open in Purchases tab →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Labour / Daily Wages ─────────────────────────────────── */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden animate-dashboard-panel dashboard-stagger-2">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-[#4A0E0E]" />
            <h2 className="text-sm font-bold text-[#242424] uppercase tracking-wide">
              Labour / Daily Wages
            </h2>
            {!isLoadingWages && (
              <span className="text-xs bg-[#4A0E0E]/10 text-[#4A0E0E] px-2 py-0.5 rounded-full font-bold">
                {siteWages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingWage(null);
                setIsWageModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 hover:opacity-95 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              style={{
                backgroundColor: '#4A0E0E',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Wages Total Summary */}
        {siteWages.length > 0 && (
          <div className="grid grid-cols-3 divide-x divide-[#E8E4DC] bg-[#FAFAF8] border-b border-[#E8E4DC]">
            <div className="px-4 py-3 text-center">
              <span className="text-base font-bold text-[#242424] block">
                {siteWageBreakdown.items.length}
              </span>
              <span className="text-[10px] text-[#6B6B6B]">Labourers</span>
            </div>
            <div className="px-4 py-3 text-center">
              <span className="text-base font-bold text-[#242424] block">
                {siteWageBreakdown.items.reduce((s, i) => s + i.days, 0)}
              </span>
              <span className="text-[10px] text-[#6B6B6B]">Man-days</span>
            </div>
            <div className="px-4 py-3 text-center">
              <span className="text-base font-bold text-[#1E6B37] block">
                {formatINR(siteWageBreakdown.totalSiteWages)}
              </span>
              <span className="text-[10px] text-[#6B6B6B]">Total Wages</span>
            </div>
          </div>
        )}

        {/* Wage Entries List (individual records) */}
        {isLoadingWages ? (
          <div className="py-8 text-center text-xs text-[#6B6B6B]">Loading wages...</div>
        ) : siteWages.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Users2 className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
            <p className="text-xs font-semibold text-[#6B6B6B]">
              No daily wages recorded for this project.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingWage(null);
                  setIsWageModalOpen(true);
                }}
                className="text-xs font-bold text-[#4A0E0E] underline cursor-pointer"
              >
                Add wages →
              </button>
              <span className="text-[#D5D0C7]">|</span>
              <button
                type="button"
                onClick={() => navigate(`/wages?tab=daily&projectId=${site?.id || id}`)}
                className="text-xs font-semibold text-[#8C867E] hover:text-[#4A0E0E] transition-colors cursor-pointer"
              >
                Open in Wages tab →
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E4DC]">
            {displayedWages.map((wage) => {
              const emp = employees.find((e) => e.id === wage.employee_id);
              const name = (wage as any).employee?.name || emp?.name || 'Employee';
              const amount = Number((wage as any).amount || (wage as any).rate || 0);
              const wageDate = (wage as any).wage_date || wage.created_at;

              return (
                <div
                  key={wage.id}
                  onClick={() => {
                    setEditingWage(wage);
                    setIsWageModalOpen(true);
                  }}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F7F5F0] transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#242424] font-inter truncate group-hover:text-[#4A0E0E] transition-colors">
                        {name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#6B6B6B]">
                        {new Date(wageDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <div className="text-right">
                      <span
                        className="text-sm font-bold block text-[#1E6B37]"
                      >
                        {formatINR(amount)}
                      </span>
                      <span className="text-[10px] text-[#8C867E]">
                        {wage.payable_units ? `${wage.payable_units} day` : '1 day'}
                      </span>
                    </div>
                    <div className="p-1 rounded-md text-[#8C867E] group-hover:text-[#4A0E0E] group-hover:bg-[#4A0E0E]/10 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
            {siteWages.length > 0 && (
              <div className="px-5 py-3 text-center bg-[#FAFAF8] border-t border-[#E8E4DC] flex items-center justify-center gap-3">
                {siteWages.length > 4 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAllWages((prev) => !prev)}
                      className="text-xs font-bold text-[#4A0E0E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {showAllWages
                          ? 'Show Less (4 items)'
                          : `View all ${siteWages.length} items`}
                      </span>
                      {showAllWages ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[#D5D0C7]">|</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/wages?tab=daily&projectId=${site?.id || id}`)}
                  className="text-xs font-semibold text-[#8C867E] hover:text-[#4A0E0E] transition-colors cursor-pointer"
                >
                  Open in Wages tab →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <SimpleSiteModal
        isOpen={isEditSiteOpen}
        onClose={() => setIsEditSiteOpen(false)}
        site={site}
        onDeleteSuccess={() => navigate('/projects')}
      />

      {/* Project Completion Modal */}
      <ProjectCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        project={site}
        customer={resolvedCustomer}
        onConfirmComplete={handleConfirmComplete}
        isLoading={updateProjectMutation.isPending}
      />

      {/* Edit / Add Purchase Modal */}
      <SimplePurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setEditingPurchase(null);
        }}
        mode="project"
        editPurchase={editingPurchase}
        preselectedProjectId={site?.id || id || null}
        onSuccess={() => {
          refetchPurchases();
          refetch();
        }}
      />

      {/* Edit / Add Wage Modal */}
      <SimpleDailyWageModal
        isOpen={isWageModalOpen}
        onClose={() => {
          setIsWageModalOpen(false);
          setEditingWage(null);
        }}
        preselectedProjectId={site?.id || id || null}
        existingWage={editingWage}
        onSuccess={() => {
          refetchWages();
          refetch();
        }}
      />
    </div>
  );
};
