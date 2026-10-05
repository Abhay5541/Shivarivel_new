import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Building2,
  Truck,
  CreditCard,
  Edit2,
  Package,
} from 'lucide-react';
import { usePurchases, computeSupplierSummary } from '@/hooks/useProcurement';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { RecordPaymentModal } from '@/components/business/RecordPaymentModal';
import type { Purchase } from '@/types/procurement';

type ProcurementTab = 'project' | 'general' | 'suppliers';

export const PurchasesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: 'project' | 'general' | 'suppliers'
  const activeTab = (searchParams.get('tab') as ProcurementTab) || 'project';
  const setActiveTab = (tab: ProcurementTab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  const { data: purchases = [], isLoading, isError, error, refetch } = usePurchases();
  const { data: projects = [] } = useProjects();

  // Selected project for Project Purchases tab
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    const paramPrj = searchParams.get('projectId') || searchParams.get('project_id');
    if (paramPrj) {
      setSelectedProjectId(paramPrj);
    } else if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [searchParams, projects, selectedProjectId]);

  // Search queries per tab
  const [projectSearch, setProjectSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

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
    }
  }, [searchParams]);

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
  const currentProjectPurchases = useMemo(() => {
    if (!selectedProjectId) return [];
    return purchases.filter((p) => p.project_id === selectedProjectId);
  }, [purchases, selectedProjectId]);

  const filteredProjectPurchases = useMemo(() => {
    if (!projectSearch.trim()) return currentProjectPurchases;
    const q = projectSearch.toLowerCase();
    return currentProjectPurchases.filter((p) => {
      const prodName = p.items?.[0]?.description || p.items?.[0]?.material?.name || '';
      const supName = p.supplier?.name || '';
      return prodName.toLowerCase().includes(q) || supName.toLowerCase().includes(q);
    });
  }, [currentProjectPurchases, projectSearch]);

  const projectProcurementTotal = useMemo(() => {
    return currentProjectPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  }, [currentProjectPurchases]);

  const projectPaidTotal = useMemo(() => {
    return currentProjectPurchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
  }, [currentProjectPurchases]);

  const projectBalanceTotal = useMemo(() => {
    return Math.max(0, projectProcurementTotal - projectPaidTotal);
  }, [projectProcurementTotal, projectPaidTotal]);

  // 2. GENERAL PURCHASES DATA & TOTALS
  const generalPurchases = useMemo(() => {
    return purchases.filter((p) => !p.project_id);
  }, [purchases]);

  const filteredGeneralPurchases = useMemo(() => {
    if (!generalSearch.trim()) return generalPurchases;
    const q = generalSearch.toLowerCase();
    return generalPurchases.filter((p) => {
      const prodName = p.items?.[0]?.description || p.items?.[0]?.material?.name || '';
      const supName = p.supplier?.name || '';
      return prodName.toLowerCase().includes(q) || supName.toLowerCase().includes(q);
    });
  }, [generalPurchases, generalSearch]);

  const generalTotalPurchased = useMemo(() => {
    return generalPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  }, [generalPurchases]);

  const generalTotalPaid = useMemo(() => {
    return generalPurchases.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
  }, [generalPurchases]);

  const generalTotalOutstanding = useMemo(() => {
    return Math.max(0, generalTotalPurchased - generalTotalPaid);
  }, [generalTotalPurchased, generalTotalPaid]);

  // 3. SUPPLIER SUMMARY DERIVED AGGREGATION
  const allSupplierSummaries = useMemo(() => {
    return computeSupplierSummary(purchases);
  }, [purchases]);

  const filteredSupplierSummaries = useMemo(() => {
    if (!supplierSearch.trim()) return allSupplierSummaries;
    const q = supplierSearch.toLowerCase();
    return allSupplierSummaries.filter((s) => s.supplier_name.toLowerCase().includes(q));
  }, [allSupplierSummaries, supplierSearch]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading uppercase tracking-tight">
              Procurement
            </h1>
            <span className="text-xs bg-[#4A0E0E]/10 text-[#4A0E0E] px-2.5 py-0.5 rounded-full font-bold">
              {purchases.length}
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B]">
            Material purchases, site deliveries, and supplier balances
          </p>
        </div>

        {/* Primary Action */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'general' ? (
            <Button
              type="button"
              onClick={() => handleOpenAddPurchase('general')}
              className="h-11 px-5 text-sm font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Purchase</span>
            </Button>
          ) : activeTab === 'project' ? (
            <Button
              type="button"
              onClick={() => handleOpenAddPurchase('project')}
              className="h-11 px-5 text-sm font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Purchase</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabs Switcher: [ Project Purchases ] [ General Purchases ] [ Supplier Summary ] */}
      <div className="border-b border-[#E2DDD5] flex gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'project'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Project Purchases</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>General Purchases</span>
          {generalPurchases.length > 0 && (
            <span className="text-[10px] bg-[#E2DDD5] text-[#242424] px-1.5 py-0.2 rounded-full">
              {generalPurchases.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Supplier Summary</span>
          {allSupplierSummaries.length > 0 && (
            <span className="text-[10px] bg-[#E2DDD5] text-[#242424] px-1.5 py-0.2 rounded-full">
              {allSupplierSummaries.length}
            </span>
          )}
        </button>
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
            <div className="space-y-5">
              {/* Project Selector Bar */}
              <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Select Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl text-sm font-bold text-[#242424] focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code ? `${p.project_code} — ` : ''}{p.name} {p.customer?.name ? `(${p.customer.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => handleOpenAddPurchase('project')}
                    className="h-11 px-5 text-sm font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Purchase</span>
                  </Button>
                </div>
              </div>

              {/* Project Totals Cards (Rule 10: Cost, Paid, Balance) */}
              {selectedProjectId && (
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
              )}

              {/* Search Bar */}
              {currentProjectPurchases.length > 0 && (
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search product or supplier..."
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all shadow-2xs"
                  />
                </div>
              )}

              {/* Project Purchases List */}
              {currentProjectPurchases.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No purchases for this project yet."
                  description={`Start logging materials bought for ${selectedProject?.name || 'this project'}.`}
                  actionLabel="+ Add Purchase"
                  onAction={() => handleOpenAddPurchase('project')}
                />
              ) : filteredProjectPurchases.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No purchases match &ldquo;{projectSearch}&rdquo; in this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjectPurchases.map((p) => {
                    const item = p.items?.[0];
                    const productName = item?.description || item?.material?.name || 'Material Item';
                    const quantity = item ? `${item.quantity} ${item.unit}` : '1 Unit';
                    const supplierName = p.supplier?.name || 'Supplier';
                    const totalVal = p.total_amount;
                    const paidAmt = p.total_allocated ?? 0;
                    const bal = p.outstanding_balance ?? Math.max(0, totalVal - paidAmt);

                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-[#E2DDD5] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#C99A2E]/50 transition-all space-y-3"
                      >
                        {/* Top: Product, Supplier, Quantity badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base sm:text-lg font-bold text-[#242424]">
                                {productName}
                              </span>
                              <span className="text-xs font-bold bg-[#4A0E0E]/10 text-[#4A0E0E] px-2.5 py-0.5 rounded-lg border border-[#4A0E0E]/15">
                                {quantity}
                              </span>
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

                          {/* Financials & Status */}
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
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.payment_status === 'Paid'
                                ? 'bg-[#DCFCE7] text-[#166534]'
                                : p.payment_status === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.payment_status || 'Pending'}
                          </span>

                          <div className="flex items-center gap-2">
                            {bal > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenRecordPayment(p)}
                                className="h-8 px-3 text-xs font-bold text-[#166534] bg-[#DCFCE7] hover:bg-[#bbf7d0] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GENERAL PURCHASES */}
          {/* ========================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-5">
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

              {/* Action & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={generalSearch}
                    onChange={(e) => setGeneralSearch(e.target.value)}
                    placeholder="Search general purchases..."
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all shadow-2xs"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => handleOpenAddPurchase('general')}
                  className="h-11 px-5 text-sm font-bold bg-[#4A0E0E] hover:bg-[#380A0A] text-white rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Purchase</span>
                </Button>
              </div>

              {/* General Purchases List */}
              {generalPurchases.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No general purchases yet."
                  description="Record non-project purchases like yard materials, workshop stock, or office supplies."
                  actionLabel="+ Add Purchase"
                  onAction={() => handleOpenAddPurchase('general')}
                />
              ) : filteredGeneralPurchases.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No general purchases match &ldquo;{generalSearch}&rdquo;.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGeneralPurchases.map((p) => {
                    const item = p.items?.[0];
                    const productName = item?.description || item?.material?.name || 'Material Item';
                    const quantity = item ? `${item.quantity} ${item.unit}` : '1 Unit';
                    const supplierName = p.supplier?.name || 'Supplier';
                    const totalVal = p.total_amount;
                    const paidAmt = p.total_allocated ?? 0;
                    const bal = p.outstanding_balance ?? Math.max(0, totalVal - paidAmt);

                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-[#E2DDD5] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#C99A2E]/50 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base sm:text-lg font-bold text-[#242424]">
                                {productName}
                              </span>
                              <span className="text-xs font-bold bg-[#C99A2E]/10 text-[#785711] px-2.5 py-0.5 rounded-lg border border-[#C99A2E]/20">
                                {quantity}
                              </span>
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

                        <div className="pt-2 border-t border-[#E2DDD5]/60 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.payment_status === 'Paid'
                                ? 'bg-[#DCFCE7] text-[#166534]'
                                : p.payment_status === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.payment_status || 'Pending'}
                          </span>

                          <div className="flex items-center gap-2">
                            {bal > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenRecordPayment(p)}
                                className="h-8 px-3 text-xs font-bold text-[#166534] bg-[#DCFCE7] hover:bg-[#bbf7d0] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SUPPLIER SUMMARY */}
          {/* ========================================================= */}
          {activeTab === 'suppliers' && (
            <div className="space-y-5">
              {/* Header Info & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    placeholder="Search supplier name..."
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="text-xs text-[#6B6B6B]">
                  Derived from {purchases.length} total purchase records across all sites
                </div>
              </div>

              {/* Suppliers List */}
              {allSupplierSummaries.length === 0 ? (
                <EmptyState
                  icon={<Truck className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No supplier purchases yet."
                  description="Supplier totals and balances will be calculated automatically when purchases are recorded."
                  actionLabel="+ Add Purchase"
                  onAction={() => handleOpenAddPurchase('project')}
                />
              ) : filteredSupplierSummaries.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No suppliers match &ldquo;{supplierSearch}&rdquo;.
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
        onClose={() => setIsPurchaseModalOpen(false)}
        mode={purchaseModalMode}
        editPurchase={editingPurchase}
        preselectedProjectId={selectedProjectId}
        onSuccess={() => refetch()}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        purchase={paymentTargetPurchase}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
