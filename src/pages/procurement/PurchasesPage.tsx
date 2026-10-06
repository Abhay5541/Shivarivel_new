import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Building2,
  Truck,
  CreditCard,
  Edit2,
  Package,
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { ActionButton } from '@/components/ui/ActionButton';
import { PageContainer } from '@/components/layout/PageContainer';
import { usePurchases, computeSupplierSummary } from '@/hooks/useProcurement';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { RecordPaymentModal } from '@/components/business/RecordPaymentModal';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import { SplitText } from '@/components/ui/SplitText';
import type { Purchase } from '@/types/procurement';

type ProcurementTab = 'project' | 'general' | 'suppliers';

export const PurchasesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: 'project' | 'general' | 'suppliers'
  const activeTab = (searchParams.get('tab') as ProcurementTab) || 'project';
  const setActiveTab = (tab: ProcurementTab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    newParams.delete('new');
    newParams.delete('mode');
    setSearchParams(newParams);
  };

  const { data: purchases = [], isLoading, isError, error, refetch } = usePurchases();
  const { data: projects = [] } = useProjects();
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Search query across current tab
  const [search, setSearch] = useState('');

  // Payment status filters per tab
  const [projectPaymentFilter, setProjectPaymentFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [generalPaymentFilter, setGeneralPaymentFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Modals state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseModalMode, setPurchaseModalMode] = useState<'project' | 'general'>('project');
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetPurchase, setPaymentTargetPurchase] = useState<Purchase | null>(null);

  // Auto-open if query param ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      const mode = searchParams.get('mode') === 'general' ? 'general' : 'project';
      setPurchaseModalMode(mode);
      setEditingPurchase(null);
      setIsPurchaseModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      nextParams.delete('mode');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle open create purchase
  const handleOpenAddPurchase = (mode: 'project' | 'general') => {
    setPurchaseModalMode(mode);
    setEditingPurchase(null);
    setIsPurchaseModalOpen(true);
  };

  // Handle edit purchase
  const handleEditPurchase = (purchase: Purchase) => {
    setPurchaseModalMode(purchase.project_id ? 'project' : 'general');
    setEditingPurchase(purchase);
    setIsPurchaseModalOpen(true);
  };

  // Handle record payment
  const handleOpenRecordPayment = (purchase: Purchase) => {
    setPaymentTargetPurchase(purchase);
    setIsPaymentModalOpen(true);
  };

  // 1. PROJECT PURCHASES DATA & TOTALS
  const allProjectPurchases = useMemo(() => {
    return purchases.filter((p) => Boolean(p.project_id));
  }, [purchases]);

  const filteredProjectPurchases = useMemo(() => {
    if (!search.trim()) return allProjectPurchases;
    const q = search.toLowerCase();
    return allProjectPurchases.filter((p) => {
      const prodName = p.items?.[0]?.description || p.items?.[0]?.material?.name || '';
      const supName = p.supplier?.name || '';
      const prj = p.project?.name || projectMap.get(p.project_id || '')?.name || '';
      return (
        prodName.toLowerCase().includes(q) ||
        supName.toLowerCase().includes(q) ||
        prj.toLowerCase().includes(q)
      );
    });
  }, [allProjectPurchases, search, projectMap]);

  // Project: Separate Pending Payment vs Fully Paid
  const projectPendingPurchases = useMemo(() => {
    return filteredProjectPurchases.filter((p) => {
      const bal = p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated ?? 0));
      return bal > 0 && p.payment_status !== 'Paid';
    });
  }, [filteredProjectPurchases]);

  const projectPaidPurchases = useMemo(() => {
    return filteredProjectPurchases.filter((p) => {
      const bal = p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated ?? 0));
      return bal <= 0 || p.payment_status === 'Paid';
    });
  }, [filteredProjectPurchases]);

  const projectPendingBalance = useMemo(() => {
    return projectPendingPurchases.reduce((sum, p) => {
      const bal = p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated ?? 0));
      return sum + bal;
    }, 0);
  }, [projectPendingPurchases]);

  const projectPaidSettled = useMemo(() => {
    return projectPaidPurchases.reduce((sum, p) => sum + (p.total_allocated || p.total_amount || 0), 0);
  }, [projectPaidPurchases]);

  const projectProcurementTotal = useMemo(() => {
    return allProjectPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  }, [allProjectPurchases]);

  const projectPaidTotal = useMemo(() => {
    return allProjectPurchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
  }, [allProjectPurchases]);

  const projectBalanceTotal = useMemo(() => {
    return Math.max(0, projectProcurementTotal - projectPaidTotal);
  }, [projectProcurementTotal, projectPaidTotal]);

  // Segment options for project purchases with live counts
  const projectFilterOptions = useMemo<SegmentOption<'all' | 'pending' | 'paid'>[]>(
    () => [
      {
        id: 'all',
        label: 'All',
        count: filteredProjectPurchases.length,
        activeColorClass: 'text-[#242424]',
      },
      {
        id: 'pending',
        label: 'Pending Payment',
        count: projectPendingPurchases.length,
        dotColor: '#C99A2E',
        activeColorClass: 'text-[#991B1B]',
      },
      {
        id: 'paid',
        label: 'Fully Paid',
        count: projectPaidPurchases.length,
        dotColor: '#166534',
        activeColorClass: 'text-[#166534]',
      },
    ],
    [filteredProjectPurchases.length, projectPendingPurchases.length, projectPaidPurchases.length]
  );

  // 2. GENERAL PURCHASES DATA & TOTALS
  const generalPurchases = useMemo(() => {
    return purchases.filter((p) => !p.project_id);
  }, [purchases]);

  const filteredGeneralPurchases = useMemo(() => {
    if (!search.trim()) return generalPurchases;
    const q = search.toLowerCase();
    return generalPurchases.filter((p) => {
      const prodName = p.items?.[0]?.description || p.items?.[0]?.material?.name || '';
      const supName = p.supplier?.name || '';
      return prodName.toLowerCase().includes(q) || supName.toLowerCase().includes(q);
    });
  }, [generalPurchases, search]);

  // General: Separate Pending Payment vs Fully Paid
  const generalPendingPurchases = useMemo(() => {
    return filteredGeneralPurchases.filter((p) => {
      const bal = p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated ?? 0));
      return bal > 0 && p.payment_status !== 'Paid';
    });
  }, [filteredGeneralPurchases]);

  const generalPaidPurchases = useMemo(() => {
    return filteredGeneralPurchases.filter((p) => {
      const bal = p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated ?? 0));
      return bal <= 0 || p.payment_status === 'Paid';
    });
  }, [filteredGeneralPurchases]);

  const generalPendingBalance = useMemo(() => {
    return generalPendingPurchases.reduce((sum, p) => {
      const bal = p.outstanding_balance ?? Math.max(0, p.total_amount - (p.total_allocated ?? 0));
      return sum + bal;
    }, 0);
  }, [generalPendingPurchases]);

  const generalPaidSettled = useMemo(() => {
    return generalPaidPurchases.reduce((sum, p) => sum + (p.total_allocated || p.total_amount || 0), 0);
  }, [generalPaidPurchases]);

  const generalTotalPurchased = useMemo(() => {
    return generalPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  }, [generalPurchases]);

  const generalTotalPaid = useMemo(() => {
    return generalPurchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
  }, [generalPurchases]);

  const generalTotalOutstanding = useMemo(() => {
    return Math.max(0, generalTotalPurchased - generalTotalPaid);
  }, [generalTotalPurchased, generalTotalPaid]);

  // Segment options for general purchases with live counts
  const generalFilterOptions = useMemo<SegmentOption<'all' | 'pending' | 'paid'>[]>(
    () => [
      {
        id: 'all',
        label: 'All',
        count: filteredGeneralPurchases.length,
        activeColorClass: 'text-[#242424]',
      },
      {
        id: 'pending',
        label: 'Pending Payment',
        count: generalPendingPurchases.length,
        dotColor: '#C99A2E',
        activeColorClass: 'text-[#991B1B]',
      },
      {
        id: 'paid',
        label: 'Fully Paid',
        count: generalPaidPurchases.length,
        dotColor: '#166534',
        activeColorClass: 'text-[#166534]',
      },
    ],
    [filteredGeneralPurchases.length, generalPendingPurchases.length, generalPaidPurchases.length]
  );

  // 3. SUPPLIER SUMMARY DERIVED AGGREGATION
  const allSupplierSummaries = useMemo(() => {
    return computeSupplierSummary(purchases);
  }, [purchases]);

  const filteredSupplierSummaries = useMemo(() => {
    if (!search.trim()) return allSupplierSummaries;
    const q = search.toLowerCase();
    return allSupplierSummaries.filter((s) => s.supplier_name.toLowerCase().includes(q));
  }, [allSupplierSummaries, search]);

  // Segment options for main Procurement tabs (Project, General, Suppliers)
  const procurementTabOptions = useMemo<SegmentOption<ProcurementTab>[]>(
    () => [
      {
        id: 'project',
        label: 'Project Purchases',
        icon: <Building2 className="w-4 h-4 text-[#C99A2E]" />,
        count: allProjectPurchases.length,
        activeColorClass: 'text-[#4A0E0E]',
      },
      {
        id: 'general',
        label: 'General Purchases',
        icon: <Package className="w-4 h-4 text-[#C99A2E]" />,
        count: generalPurchases.length,
        activeColorClass: 'text-[#4A0E0E]',
      },
      {
        id: 'suppliers',
        label: 'Supplier Summary',
        icon: <Truck className="w-4 h-4 text-[#C99A2E]" />,
        count: allSupplierSummaries.length,
        activeColorClass: 'text-[#4A0E0E]',
      },
    ],
    [allProjectPurchases.length, generalPurchases.length, allSupplierSummaries.length]
  );

  // Reusable purchase card rendering with clear payment badge & action
  const renderPurchaseCard = (p: Purchase, isProject: boolean) => {
    const item = p.items?.[0];
    const productName = item?.description || item?.material?.name || 'Material Item';
    const quantity = item ? `${item.quantity} ${item.unit}` : '1 Unit';
    const supplierName = p.supplier?.name || 'Supplier';
    const projectName = isProject ? (p.project?.name || projectMap.get(p.project_id || '')?.name) : null;
    const totalVal = p.total_amount;
    const paidAmt = p.total_allocated ?? 0;
    const bal = p.outstanding_balance ?? Math.max(0, totalVal - paidAmt);
    const isPaid = bal <= 0 || p.payment_status === 'Paid';

    return (
      <div
        key={p.id}
        className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
          isPaid ? 'border-[#E2DDD5] hover:border-[#166534]/40' : 'border-[#E2DDD5] hover:border-[#C99A2E]/50'
        }`}
      >
        {/* Top: Product, Supplier, Quantity badge, Project badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-[#242424]">
                {productName}
              </span>
              <span className="text-xs font-bold bg-[#4A0E0E]/10 text-[#4A0E0E] px-2.5 py-0.5 rounded-lg border border-[#4A0E0E]/15">
                {quantity}
              </span>
              {projectName && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#F7F5F0] text-[#4A0E0E] px-2.5 py-0.5 rounded-lg border border-[#E2DDD5]">
                  <Building2 className="w-3 h-3 text-[#C99A2E]" />
                  <span>{projectName}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
              <span className="flex items-center gap-1 font-semibold text-[#242424]">
                <Truck className="w-3.5 h-3.5 text-[#C99A2E]" />
                <span>{supplierName}</span>
              </span>
              <span>•</span>
              <span>{p.purchase_date}</span>
            </div>
          </div>

          {/* Financials */}
          <div className="flex items-center gap-4 sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DDD5]/70">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block">
                Total
              </span>
              <span className="text-sm sm:text-base font-bold text-[#242424]">
                ₹{formatINR(totalVal)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block">
                Paid
              </span>
              <span className="text-sm sm:text-base font-bold text-[#166534]">
                ₹{formatINR(paidAmt)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block">
                Balance
              </span>
              <span
                className={`text-sm sm:text-base font-bold ${
                  bal > 0 ? 'text-[#991B1B]' : 'text-[#166534]'
                }`}
              >
                ₹{formatINR(bal)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              isPaid
                ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                : p.payment_status === 'Partial'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {isPaid ? '✓ Fully Paid' : p.payment_status === 'Partial' ? 'Partial Payment' : 'Pending Payment'}
          </span>

          <div className="flex items-center gap-2">
            {!isPaid && (
              <button
                type="button"
                onClick={() => handleOpenRecordPayment(p)}
                className="h-8 px-3 text-xs font-bold text-[#166534] bg-[#DCFCE7] hover:bg-[#bbf7d0] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleEditPurchase(p)}
              className="h-8 px-3 text-xs font-bold text-[#242424] bg-[#F7F5F0] hover:bg-[#E2DDD5] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer className="pb-24 select-none">
      {/* Top Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SplitText
            text="Procurement"
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

        {/* Search & Action Button side-by-side */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Search
            size="sm"
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === 'project'
                ? 'Search product, supplier, or project...'
                : activeTab === 'general'
                ? 'Search general purchases...'
                : 'Search suppliers...'
            }
          />
          {activeTab === 'general' ? (
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              label="Add Purchase"
              onClick={() => handleOpenAddPurchase('general')}
            />
          ) : activeTab === 'project' ? (
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              label="Add Purchase"
              onClick={() => handleOpenAddPurchase('project')}
            />
          ) : null}
        </div>
      </div>

      {/* Tabs Switcher: [ Project Purchases ] [ General Purchases ] [ Supplier Summary ] */}
      <div className="mb-6 overflow-x-auto no-scrollbar">
        <SlidingSegmentedControl
          options={procurementTabOptions}
          value={activeTab}
          onChange={setActiveTab}
          size="md"
          ariaLabel="Procurement sections"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorState
          title="Failed to load procurement records"
          description={error instanceof Error ? error.message : 'Please check your connection.'}
          onRetry={refetch}
        />
      ) : (
        <>
          {/* ========================================================= */}
          {/* TAB 1: PROJECT PURCHASES */}
          {/* ========================================================= */}
          {activeTab === 'project' && (
            <div key={activeTab} className="space-y-5 animate-filter-slide">
              {/* Project Totals Cards (Rule 10: Cost, Paid, Balance) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                    Total Procurement Cost
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#242424] font-heading">
                    ₹{formatINR(projectProcurementTotal)}
                  </span>
                </div>

                <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                    Total Paid
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#166534] font-heading">
                    ₹{formatINR(projectPaidTotal)}
                  </span>
                </div>

                <div
                  className={`border rounded-2xl p-4 shadow-xs ${
                    projectBalanceTotal > 0
                      ? 'bg-[#FEE2E2]/30 border-red-200 text-[#991B1B]'
                      : 'bg-white border-[#E2DDD5] text-[#242424]'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                    Total Balance
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-heading">
                    ₹{formatINR(projectBalanceTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Filter Segmented Control */}
              <SlidingSegmentedControl
                options={projectFilterOptions}
                value={projectPaymentFilter}
                onChange={setProjectPaymentFilter}
              />

              {/* Project Purchases List */}
              {allProjectPurchases.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No project purchases yet."
                  actionLabel="Add Purchase"
                  onAction={() => handleOpenAddPurchase('project')}
                />
              ) : filteredProjectPurchases.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No project purchases match &ldquo;{search}&rdquo;.
                </div>
              ) : (
                <div key={projectPaymentFilter} className="space-y-6 animate-filter-slide">
                  {/* 1. Pending Payment Section */}
                  {(projectPaymentFilter === 'all' || projectPaymentFilter === 'pending') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
                          <h3 className="text-sm font-bold text-[#242424] font-heading">
                            Pending Payment
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {projectPendingPurchases.length}
                          </span>
                        </div>
                        {projectPendingBalance > 0 && (
                          <span className="text-xs font-bold text-[#991B1B]">
                            ₹{formatINR(projectPendingBalance)} pending
                          </span>
                        )}
                      </div>

                      {projectPendingPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#166534] font-medium">
                          ✓ All project purchases are fully paid!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {projectPendingPurchases.map((p) => renderPurchaseCard(p, true))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Fully Paid Section */}
                  {(projectPaymentFilter === 'all' || projectPaymentFilter === 'paid') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                          <h3 className="text-sm font-bold text-[#242424] font-heading">
                            Fully Paid
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {projectPaidPurchases.length}
                          </span>
                        </div>
                        {projectPaidSettled > 0 && (
                          <span className="text-xs font-bold text-[#166534]">
                            ₹{formatINR(projectPaidSettled)} settled
                          </span>
                        )}
                      </div>

                      {projectPaidPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                          No fully paid purchases yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {projectPaidPurchases.map((p) => renderPurchaseCard(p, true))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GENERAL PURCHASES */}
          {/* ========================================================= */}
          {activeTab === 'general' && (
            <div key={activeTab} className="space-y-5 animate-filter-slide">
              {/* General Purchases Summary Cards (Rule 11: Purchased, Paid, Outstanding) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                    TOTAL PURCHASED
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#242424] font-heading">
                    ₹{formatINR(generalTotalPurchased)}
                  </span>
                </div>

                <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                    TOTAL PAID
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#166534] font-heading">
                    ₹{formatINR(generalTotalPaid)}
                  </span>
                </div>

                <div
                  className={`border rounded-2xl p-4 shadow-xs ${
                    generalTotalOutstanding > 0
                      ? 'bg-[#FEE2E2]/30 border-red-200 text-[#991B1B]'
                      : 'bg-white border-[#E2DDD5] text-[#242424]'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                    TOTAL OUTSTANDING
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-heading">
                    ₹{formatINR(generalTotalOutstanding)}
                  </span>
                </div>
              </div>

              {/* Payment Filter Segmented Control */}
              <SlidingSegmentedControl
                options={generalFilterOptions}
                value={generalPaymentFilter}
                onChange={setGeneralPaymentFilter}
              />

              {/* General Purchases List */}
              {generalPurchases.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No general purchases yet."
                  actionLabel="Add Purchase"
                  onAction={() => handleOpenAddPurchase('general')}
                />
              ) : filteredGeneralPurchases.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No general purchases match &ldquo;{search}&rdquo;.
                </div>
              ) : (
                <div key={generalPaymentFilter} className="space-y-6 animate-filter-slide">
                  {/* 1. Pending Payment Section */}
                  {(generalPaymentFilter === 'all' || generalPaymentFilter === 'pending') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
                          <h3 className="text-sm font-bold text-[#242424] font-heading">
                            Pending Payment
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {generalPendingPurchases.length}
                          </span>
                        </div>
                        {generalPendingBalance > 0 && (
                          <span className="text-xs font-bold text-[#991B1B]">
                            ₹{formatINR(generalPendingBalance)} pending
                          </span>
                        )}
                      </div>

                      {generalPendingPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#166534] font-medium">
                          ✓ All general purchases are fully paid!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {generalPendingPurchases.map((p) => renderPurchaseCard(p, false))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Fully Paid Section */}
                  {(generalPaymentFilter === 'all' || generalPaymentFilter === 'paid') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                          <h3 className="text-sm font-bold text-[#242424] font-heading">
                            Fully Paid
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {generalPaidPurchases.length}
                          </span>
                        </div>
                        {generalPaidSettled > 0 && (
                          <span className="text-xs font-bold text-[#166534]">
                            ₹{formatINR(generalPaidSettled)} settled
                          </span>
                        )}
                      </div>

                      {generalPaidPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                          No fully paid purchases yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {generalPaidPurchases.map((p) => renderPurchaseCard(p, false))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SUPPLIER SUMMARY */}
          {/* ========================================================= */}
          {activeTab === 'suppliers' && (
            <div key={activeTab} className="space-y-5 animate-filter-slide">
              {/* Header Info & Search */}
              {/* Header Info */}
              <div className="flex items-center justify-end pb-1">
                <span className="text-xs text-[#6B6B6B]">
                  {filteredSupplierSummaries.length} suppliers
                </span>
              </div>

              {/* Suppliers List */}
              {allSupplierSummaries.length === 0 ? (
                <EmptyState
                  icon={<Truck className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No supplier purchases yet."
                  actionLabel="Add Purchase"
                  onAction={() => handleOpenAddPurchase('project')}
                />
              ) : filteredSupplierSummaries.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No suppliers match &ldquo;{search}&rdquo;.
                </div>
              ) : (
                <div className="bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden divide-y divide-[#E2DDD5]">
                  {filteredSupplierSummaries.map((s) => (
                    <div
                      key={s.supplier_name}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F5F0]/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-bold text-[#242424]">
                            {s.supplier_name}
                          </span>
                          <span className="text-[11px] font-semibold bg-[#F7F5F0] text-[#6B6B6B] px-2 py-0.5 rounded-md border border-[#E2DDD5]">
                            {s.purchase_count} {s.purchase_count === 1 ? 'purchase' : 'purchases'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DDD5]/70">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block">
                            Purchased
                          </span>
                          <span className="text-sm sm:text-base font-bold text-[#242424]">
                            ₹{formatINR(s.total_purchased)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block">
                            Paid
                          </span>
                          <span className="text-sm sm:text-base font-bold text-[#166534]">
                            ₹{formatINR(s.total_paid)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] block">
                            Outstanding
                          </span>
                          <span
                            className={`text-sm sm:text-base font-bold ${
                              s.total_outstanding > 0 ? 'text-[#991B1B]' : 'text-[#166534]'
                            }`}
                          >
                            ₹{formatINR(s.total_outstanding)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Record / Edit Purchase Modal */}
      <SimplePurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          if (searchParams.has('new') || searchParams.has('mode')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('new');
            nextParams.delete('mode');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        mode={purchaseModalMode}
        editPurchase={editingPurchase}
        preselectedProjectId={null}
        onSuccess={() => refetch()}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        purchase={paymentTargetPurchase}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  );
};
