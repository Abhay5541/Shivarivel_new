import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Edit2,
  Users2,
  ArrowRight,
  ShoppingCart,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { useProject } from '@/hooks/useProjects';
import { useCustomers } from '@/hooks/useCustomers';
import { usePurchases } from '@/hooks/useProcurement';
import { useWages, useEmployees } from '@/hooks/useWorkforce';
import { formatINR } from '@/lib/utils';
import type { Purchase } from '@/types/procurement';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const { data: site, isLoading: isLoadingSite, isError, error, refetch } = useProject(id);
  const { data: customers = [] } = useCustomers();
  const { data: allPurchases = [], isLoading: isLoadingPurchases } = usePurchases();
  const { data: siteWages = [], isLoading: isLoadingWages } = useWages({ projectId: id });
  const { data: employees = [] } = useEmployees();

  // Resolve linked customer reliably
  const linkedCustomer =
    site?.customer || (site?.customer_id ? customers.find((c) => c.id === site.customer_id) : null);

  // Filter site purchases
  const sitePurchases = React.useMemo(() => {
    if (!id) return [];
    return allPurchases.filter((p) => p.project_id === id);
  }, [allPurchases, id]);

  const purchaseFinancials = React.useMemo(() => {
    let totalCost = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    for (const p of sitePurchases) {
      const cost = Number(p.total_amount || 0);
      const paid = Number(p.total_allocated ?? 0);
      const bal = Number(p.outstanding_balance ?? Math.max(0, cost - paid));
      totalCost += cost;
      totalPaid += paid;
      totalBalance += bal;
    }

    return { totalCost, totalPaid, totalBalance };
  }, [sitePurchases]);

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
              {linkedCustomer ? (
                <Link
                  to={`/customers/${linkedCustomer.id}`}
                  className="font-bold text-[#4A0E0E] hover:underline flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-[#C99A2E]" />
                  <span>{linkedCustomer.name}</span>
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

      {/* Project Purchases Section */}
      <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#242424] font-heading uppercase">
              Project Purchases
            </h2>
            <span className="text-xs bg-[#C99A2E]/15 text-[#855B09] px-2 py-0.5 rounded-full font-bold">
              {sitePurchases.length}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingPurchase(null);
                setIsAddPurchaseOpen(true);
              }}
              className="h-9 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Purchase</span>
            </Button>

            <Link
              to={`/procurement?tab=project&projectId=${site.id}`}
              className="h-9 px-3 text-xs font-bold text-[#4A0E0E] hover:text-[#380A0A] bg-[#F7F5F0] hover:bg-[#E2DDD5] border border-[#E2DDD5] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View in Procurement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total Purchases
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#242424] font-heading mt-1">
              {formatINR(purchaseFinancials.totalCost)}
            </span>
          </div>

          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#166534] uppercase tracking-wider">
              Total Paid
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#166534] font-heading mt-1">
              {formatINR(purchaseFinancials.totalPaid)}
            </span>
          </div>

          <div
            className={`border rounded-xl p-4 flex flex-col justify-between ${
              purchaseFinancials.totalBalance > 0
                ? 'bg-[#FEF2F2] border-[#FECACA]'
                : 'bg-[#F7F5F0] border-[#E2DDD5]'
            }`}
          >
            <span
              className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                purchaseFinancials.totalBalance > 0 ? 'text-[#991B1B]' : 'text-[#6B6B6B]'
              }`}
            >
              Pending Balance
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold font-heading mt-1 ${
                purchaseFinancials.totalBalance > 0 ? 'text-[#991B1B]' : 'text-[#242424]'
              }`}
            >
              {formatINR(purchaseFinancials.totalBalance)}
            </span>
          </div>
        </div>

        {/* Itemized Purchases List */}
        {isLoadingPurchases ? (
          <div className="py-6 text-center text-xs text-[#6B6B6B]">Loading project purchases...</div>
        ) : sitePurchases.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#E2DDD5] space-y-3">
            <ShoppingCart className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[#242424]">No purchases recorded yet for this project.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingPurchase(null);
                setIsAddPurchaseOpen(true);
              }}
              className="h-8 px-3 text-xs font-bold mx-auto cursor-pointer"
            >
              Add First Purchase
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2DDD5] border border-[#E2DDD5] rounded-xl overflow-hidden bg-white">
            {sitePurchases.map((purchase) => {
              const item = purchase.items?.[0];
              const productName = item?.description || item?.material?.name || 'Material Item';
              const supplierName = purchase.supplier?.name || 'Supplier';
              const cost = Number(purchase.total_amount || 0);
              const paid = Number(purchase.total_allocated ?? 0);
              const bal = Number(purchase.outstanding_balance ?? Math.max(0, cost - paid));
              const isPaid = bal <= 0 || purchase.payment_status === 'Paid';

              return (
                <div
                  key={purchase.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F5F0]/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#242424] font-heading">
                        {productName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isPaid ? 'Fully Paid' : 'Pending Payment'}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B6B6B] flex items-center gap-2">
                      <span>{supplierName}</span>
                      <span>•</span>
                      <span>{purchase.purchase_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-base font-bold text-[#242424] font-mono block">
                        {formatINR(cost)}
                      </span>
                      {!isPaid && (
                        <span className="text-xs font-bold text-[#991B1B] block">
                          Bal: {formatINR(bal)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPurchase(purchase);
                        setIsAddPurchaseOpen(true);
                      }}
                      className="p-1.5 text-[#6B6B6B] hover:text-[#4A0E0E] hover:bg-[#F7EFEF] rounded-md transition-colors cursor-pointer"
                      title="Edit Purchase"
                      aria-label="Edit purchase"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Edit / Add Purchase Modal */}
      <SimplePurchaseModal
        isOpen={isAddPurchaseOpen}
        onClose={() => {
          setIsAddPurchaseOpen(false);
          setEditingPurchase(null);
        }}
        mode="project"
        preselectedProjectId={id}
        editPurchase={editingPurchase}
      />
    </div>
  );
};
