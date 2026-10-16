import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Building2,
  CreditCard,
  Edit2,
  Package,
  CheckCircle2,
  Search as SearchIcon,
  Trash2,
  Clock,
  Wallet,
  Scale,
  Coins,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { usePurchases, useDeleteSimplePurchase } from '@/hooks/useProcurement';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { RecordPaymentModal } from '@/components/business/RecordPaymentModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import type { Purchase } from '@/types/procurement';
import procurementBannerBg from '@/Asserts/Procurement banner.png';

type ProcurementTab = 'project' | 'general';

interface ProcurementCostCardProps {
  title?: string;
  total: number;
  paid: number;
  balance: number;
}

const ProcurementCostCard: React.FC<ProcurementCostCardProps> = ({
  title = 'TOTAL PROCUREMENT COST',
  total,
  paid,
  balance,
}) => {
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const duePercent = total > 0 ? Math.max(0, 100 - paidPercent) : 0;

  return (
    <div className="bg-white dark:bg-[#1A1714] border border-[#E8E4DC] dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xs transition-colors">
      {/* 1. Header with Coins Symbol */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#F5EDE2] dark:bg-[#2A241C] text-[#8C6D23] dark:text-[#E2A855] flex items-center justify-center shrink-0">
          <Coins className="w-3.5 h-3.5 text-[#8C6D23] dark:text-[#E2A855]" />
        </div>
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
          {title}
        </span>
      </div>

      {/* 2. Big Total Currency Display */}
      <div
        className="text-2xl sm:text-3xl lg:text-[38px] font-bold font-sans text-[#1F1F1F] dark:text-white tracking-tight my-2 sm:my-2.5 tabular-nums truncate block"
        title={formatINR(total)}
      >
        {formatINR(total)}
      </div>

      {/* 3. Progress Track & Fill Bar */}
      <div className="w-full h-2 sm:h-2.5 bg-[#EDE8DC] dark:bg-white/10 rounded-full overflow-hidden mt-3 sm:mt-4">
        <div
          className="h-full bg-[#1B5E3B] dark:bg-[#22C55E] rounded-full transition-all duration-500"
          style={{ width: `${paidPercent}%` }}
        />
      </div>

      {/* 4. Ratio Labels: % Paid & % Due */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-[#6B6B6B] dark:text-[#A8A29E] mt-2 mb-4 sm:mb-5">
        <span>{paidPercent}% paid</span>
        <span>{duePercent}% due</span>
      </div>

      {/* 5. Bottom Two Tiles: PAID (Wallet) and BALANCE (Scale) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* PAID TILE with Wallet Symbol */}
        <div className="bg-[#EAF5EE] dark:bg-[#132B1C] border border-[#C6E7D2] dark:border-[#225A38]/50 rounded-2xl p-3 sm:p-4 transition-all shadow-2xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#166534] dark:text-[#4ADE80] uppercase truncate">
              <span className="w-2 h-2 rounded-full bg-[#166534] dark:bg-[#4ADE80] shrink-0" />
              <span>PAID</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#D1EDDC] dark:bg-[#1D442B] flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 text-[#166534] dark:text-[#4ADE80]" />
            </div>
          </div>
          <div
            className="text-base sm:text-xl lg:text-2xl font-bold font-sans text-[#166534] dark:text-[#4ADE80] tabular-nums mt-1.5 truncate block"
            title={formatINR(paid)}
          >
            {formatINR(paid)}
          </div>
        </div>

        {/* BALANCE TILE with Scale Symbol */}
        <div className="bg-[#FDF0F0] dark:bg-[#2F1515] border border-[#FECACA] dark:border-[#5C2323]/50 rounded-2xl p-3 sm:p-4 transition-all shadow-2xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#991B1B] dark:text-[#F87171] uppercase truncate">
              <span className="w-2 h-2 rounded-full bg-[#991B1B] dark:bg-[#F87171] shrink-0" />
              <span>BALANCE</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#FCA5A5]/40 dark:bg-[#4D1F1F] flex items-center justify-center shrink-0">
              <Scale className="w-3.5 h-3.5 text-[#991B1B] dark:text-[#F87171]" />
            </div>
          </div>
          <div
            className="text-base sm:text-xl lg:text-2xl font-bold font-sans text-[#991B1B] dark:text-[#F87171] tabular-nums mt-1.5 truncate block"
            title={formatINR(balance)}
          >
            {formatINR(balance)}
          </div>
        </div>
      </div>
    </div>
  );
};

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

  // Delete purchase state & handler
  const deletePurchaseMutation = useDeleteSimplePurchase();
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);

  const handleDeletePurchase = (purchase: Purchase) => {
    setDeletingPurchase(purchase);
  };

  const confirmDeletePurchase = () => {
    if (!deletingPurchase) return;
    deletePurchaseMutation.mutate(deletingPurchase.id, {
      onSuccess: () => {
        setDeletingPurchase(null);
        refetch();
      },
      onError: () => {
        setDeletingPurchase(null);
      },
    });
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
      const prj = p.project?.name || projectMap.get(p.project_id || '')?.name || '';
      return (
        prodName.toLowerCase().includes(q) ||
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


  // Segment options for project purchases with live counts
  const projectFilterOptions = useMemo<SegmentOption<'all' | 'pending' | 'paid'>[]>(
    () => [
      {
        id: 'all',
        label: 'All',
        shortLabel: 'All',
        count: filteredProjectPurchases.length,
        activeColorClass: 'text-[#242424]',
      },
      {
        id: 'pending',
        label: 'Pending Payment',
        shortLabel: 'Pending',
        count: projectPendingPurchases.length,
        dotColor: '#C99A2E',
        activeColorClass: 'text-[#991B1B]',
      },
      {
        id: 'paid',
        label: 'Fully Paid',
        shortLabel: 'Paid',
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
      return prodName.toLowerCase().includes(q);
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


  // Segment options for general purchases with live counts
  const generalFilterOptions = useMemo<SegmentOption<'all' | 'pending' | 'paid'>[]>(
    () => [
      {
        id: 'all',
        label: 'All',
        shortLabel: 'All',
        count: filteredGeneralPurchases.length,
        activeColorClass: 'text-[#242424]',
      },
      {
        id: 'pending',
        label: 'Pending Payment',
        shortLabel: 'Pending',
        count: generalPendingPurchases.length,
        dotColor: '#C99A2E',
        activeColorClass: 'text-[#991B1B]',
      },
      {
        id: 'paid',
        label: 'Fully Paid',
        shortLabel: 'Paid',
        count: generalPaidPurchases.length,
        dotColor: '#166534',
        activeColorClass: 'text-[#166534]',
      },
    ],
    [filteredGeneralPurchases.length, generalPendingPurchases.length, generalPaidPurchases.length]
  );

  // Segment options for main Procurement tabs (Project, General)
  const procurementTabOptions = useMemo<SegmentOption<ProcurementTab>[]>(
    () => [
      {
        id: 'project',
        label: 'Project Purchases',
        shortLabel: 'Projects',
        icon: <Building2 className="w-4 h-4 text-[#C99A2E]" />,
        count: allProjectPurchases.length,
        activeColorClass: 'text-[#4A0E0E]',
      },
      {
        id: 'general',
        label: 'General Purchases',
        shortLabel: 'General',
        icon: <Package className="w-4 h-4 text-[#C99A2E]" />,
        count: generalPurchases.length,
        activeColorClass: 'text-[#4A0E0E]',
      },
    ],
    [allProjectPurchases.length, generalPurchases.length]
  );

  // Reusable purchase card rendering with clear payment badge & action
  const renderPurchaseCard = (p: Purchase, isProject: boolean) => {
    const item = p.items?.[0];
    const productName = item?.description || item?.material?.name || 'Material Item';
    const projectObj = p.project_id ? projectMap.get(p.project_id) : p.project;
    const rawProjectName = projectObj?.name || p.project?.name || '';
    const resolvedProjectName =
      rawProjectName && rawProjectName !== 'Project'
        ? rawProjectName
        : projectMap.get(p.project_id || '')?.name || (rawProjectName !== 'Project' ? rawProjectName : '');
    const totalVal = p.total_amount;
    const paidAmt = p.total_allocated ?? 0;
    const bal = p.outstanding_balance ?? Math.max(0, totalVal - paidAmt);
    const isPaid = bal <= 0 || p.payment_status === 'Paid';

    return (
      <div
        key={p.id}
        className="bg-white dark:bg-[#1A1714] border border-[#E8E4DC] dark:border-white/10 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.99]"
      >
        <div>
          {/* Header: Avatar, Name, Date/Project, Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#FBEFEF] dark:bg-[#2A1616] text-[#4A0E0E] dark:text-[#E2A855] flex items-center justify-center shrink-0 mt-0.5">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[#242424] dark:text-[#F5F5F4] font-inter group-hover:text-[#4A0E0E] dark:group-hover:text-[#E2A855] transition-colors truncate">
                  {productName}
                </h4>
                <div className="text-xs text-[#8C867E] dark:text-[#A8A29E] mt-0.5">
                  {p.purchase_date}
                </div>
                {isProject && resolvedProjectName && (
                  <div className="mt-1.5 flex items-center">
                    <span
                      title={resolvedProjectName}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF4ED] dark:bg-[#261E17] text-[#7A272A] dark:text-[#E2A855] border border-[#ECD9C6] dark:border-white/10 text-[11px] sm:text-xs font-semibold max-w-full"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#A84B14] dark:text-[#E2A855] shrink-0" />
                      <span className="truncate">{resolvedProjectName}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                  isPaid
                    ? 'bg-[#E8F8EE] dark:bg-[#132B1C] text-[#1E7E34] dark:text-[#4ADE80] border border-[#86EFAC]/40 dark:border-[#225A38]/50'
                    : 'bg-[#FEF2F2] dark:bg-[#2F1515] text-[#991B1B] dark:text-[#F87171] border border-[#FCA5A5]/40 dark:border-[#5C2323]/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPaid ? 'bg-[#1E7E34] dark:bg-[#4ADE80]' : 'bg-[#DC2626] dark:bg-[#F87171]'
                  }`}
                />
                <span>{isPaid ? 'Fully Paid' : 'Pending'}</span>
              </span>

              {item?.quantity !== undefined && item?.quantity !== null && (
                <span
                  title={`${item.quantity} ${item.unit || ''}`}
                  className="text-[11px] sm:text-xs font-semibold text-[#5A554E] dark:text-[#C5BFB6] bg-[#F4F1EA] dark:bg-[#2A2621] px-2 py-0.5 rounded-md border border-[#E8E4DC] dark:border-white/10 tabular-nums max-w-[120px] truncate block"
                >
                  {item.quantity} {item.unit || ''}
                </span>
              )}
            </div>
          </div>

          {/* 3-Column Financial Matrix Card */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-[#FAF8F5] dark:bg-[#231F1B] border border-[#EFECE6] dark:border-white/10 rounded-xl p-2 sm:p-2.5 text-center mt-3.5 mb-1 overflow-hidden">
            <div className="min-w-0 px-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C867E] dark:text-[#A8A29E] block truncate">
                Total
              </span>
              <span
                className="text-xs sm:text-sm font-bold text-[#242424] dark:text-[#F5F5F4] font-sans tabular-nums block truncate"
                title={formatINR(totalVal)}
              >
                {formatINR(totalVal)}
              </span>
            </div>
            <div className="min-w-0 px-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C867E] dark:text-[#A8A29E] block truncate">
                Paid
              </span>
              <span
                className="text-xs sm:text-sm font-bold text-[#166534] dark:text-[#4ADE80] font-sans tabular-nums block truncate"
                title={formatINR(paidAmt)}
              >
                {formatINR(paidAmt)}
              </span>
            </div>
            <div className="min-w-0 px-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C867E] dark:text-[#A8A29E] block truncate">
                Balance
              </span>
              <span
                className={`text-xs sm:text-sm font-bold font-sans tabular-nums block truncate ${
                  bal > 0 ? 'text-[#991B1B] dark:text-[#F87171]' : 'text-[#166534] dark:text-[#4ADE80]'
                }`}
                title={formatINR(bal)}
              >
                {formatINR(bal)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar: Edit, Delete, Payment Action */}
        <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] dark:border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleEditPurchase(p)}
              className="font-medium text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#4A0E0E] dark:hover:text-[#E2A855] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B] dark:text-[#A8A29E]" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeletePurchase(p)}
              disabled={deletePurchaseMutation.isPending}
              className="font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              title={`Delete purchase ${productName}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div>
            {!isPaid ? (
              <button
                type="button"
                onClick={() => handleOpenRecordPayment(p)}
                className="h-8 px-3.5 text-xs font-bold text-white bg-[#5A0F12] hover:bg-[#43090B] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#C9A24A]" />
                <span>Update Payment</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-[#166534] dark:text-[#4ADE80]">
                <CheckCircle2 className="w-4 h-4 text-[#166534] dark:text-[#4ADE80]" />
                <span>Paid in full</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer className="pb-24 select-none">
      {/* 1. HERO BANNER (Procurement Background Banner with Text) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E2DDD5]/70 bg-[#12100E] h-[135px] sm:h-[155px] md:h-[175px] mb-4">
        <img
          src={procurementBannerBg}
          alt="Procurement Banner"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-white tracking-wide">
            Procurement
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-inter mt-1 max-w-[210px] sm:max-w-xs leading-snug">
            Track materials bought for projects and general inventory.
          </p>
        </div>
      </div>

      {/* 2. SEARCH & ADD PURCHASE ROW */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or project..."
            className="w-full h-11 pl-10 pr-3.5 bg-white/95 dark:bg-[#1A1714] border border-[#E8E4DC] dark:border-white/10 rounded-xl text-xs sm:text-sm text-[#242424] dark:text-[#F5F5F4] placeholder:text-[#8C867E] dark:placeholder:text-[#78716C] focus:outline-none focus:border-[#5A0F12] dark:focus:border-[#E2A855] focus:ring-1 focus:ring-[#5A0F12]/20 transition-all shadow-2xs"
          />
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddPurchase(activeTab === 'general' ? 'general' : 'project')}
          className="h-11 px-3.5 sm:px-4 rounded-xl bg-[#5A0F12] hover:bg-[#43090B] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Purchase</span>
        </button>
      </div>

      {/* 4. TABS SWITCHER: [ Projects ] [ General ] */}
      <div className="mb-4">
        <SlidingSegmentedControl
          options={procurementTabOptions}
          value={activeTab}
          onChange={setActiveTab}
          size="md"
          fullWidth
          ariaLabel="Procurement categories"
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
            <div key={activeTab} className="space-y-4 animate-filter-slide">
              {/* Project Totals Card (Matches Reference Design) */}
              <ProcurementCostCard
                title="TOTAL PROCUREMENT COST"
                total={projectPaidSettled + projectPendingBalance}
                paid={projectPaidSettled}
                balance={projectPendingBalance}
              />

              {/* Payment Filter Segmented Control */}
              <SlidingSegmentedControl
                options={projectFilterOptions}
                value={projectPaymentFilter}
                onChange={setProjectPaymentFilter}
                fullWidth
              />

              {/* Pending Payment Alert Strip */}
              {projectPendingPurchases.length > 0 && projectPaymentFilter !== 'paid' && (
                <div className="bg-[#FEF6E9] dark:bg-[#261E14] border border-[#F5E2B8] dark:border-[#5C451E]/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C99A2E]" />
                    <span className="font-bold text-[#784D09] dark:text-[#E2A855]">
                      {projectPendingPurchases.length} Pending {projectPendingPurchases.length === 1 ? 'Payment' : 'Payments'}
                    </span>
                  </div>
                  {projectPendingBalance > 0 && (
                    <span className="font-extrabold text-[#991B1B] dark:text-[#F87171] tabular-nums font-sans text-xs sm:text-sm">
                      {formatINR(projectPendingBalance)} pending
                    </span>
                  )}
                </div>
              )}

              {/* Project Purchases List */}
              {allProjectPurchases.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No project purchases yet."
                />
              ) : filteredProjectPurchases.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                  No project purchases match &ldquo;{search}&rdquo;.
                </div>
              ) : (
                <div key={projectPaymentFilter} className="space-y-4 animate-filter-slide">
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
                            {formatINR(projectPendingBalance)} pending
                          </span>
                        )}
                      </div>

                      {projectPendingPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#166534] font-medium">
                          ✓ All project purchases are fully paid!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                            {formatINR(projectPaidSettled)} settled
                          </span>
                        )}
                      </div>

                      {projectPaidPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                          No fully paid purchases yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
            <div key={activeTab} className="space-y-4 animate-filter-slide">
              {/* General Purchases Summary Card (Matches Reference Design) */}
              <ProcurementCostCard
                title="TOTAL PROCUREMENT COST"
                total={generalPaidSettled + generalPendingBalance}
                paid={generalPaidSettled}
                balance={generalPendingBalance}
              />

              {/* Payment Filter Segmented Control */}
              <SlidingSegmentedControl
                options={generalFilterOptions}
                value={generalPaymentFilter}
                onChange={setGeneralPaymentFilter}
                fullWidth
              />

              {/* Pending Payment Alert Strip */}
              {generalPendingPurchases.length > 0 && generalPaymentFilter !== 'paid' && (
                <div className="bg-[#FEF6E9] dark:bg-[#261E14] border border-[#F5E2B8] dark:border-[#5C451E]/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C99A2E]" />
                    <span className="font-bold text-[#784D09] dark:text-[#E2A855]">
                      {generalPendingPurchases.length} Pending {generalPendingPurchases.length === 1 ? 'Payment' : 'Payments'}
                    </span>
                  </div>
                  {generalPendingBalance > 0 && (
                    <span className="font-extrabold text-[#991B1B] dark:text-[#F87171] tabular-nums font-sans text-xs sm:text-sm">
                      {formatINR(generalPendingBalance)} pending
                    </span>
                  )}
                </div>
              )}

              {/* General Purchases List */}
              {generalPurchases.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-[#6B6B6B]" />}
                  title="No general purchases yet."
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
                            {formatINR(generalPendingBalance)} pending
                          </span>
                        )}
                      </div>

                      {generalPendingPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#166534] font-medium">
                          ✓ All general purchases are fully paid!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                            {formatINR(generalPaidSettled)} settled
                          </span>
                        )}
                      </div>

                      {generalPaidPurchases.length === 0 ? (
                        <div className="p-5 text-center bg-white border border-[#E2DDD5] rounded-2xl text-xs text-[#6B6B6B]">
                          No fully paid purchases yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {generalPaidPurchases.map((p) => renderPurchaseCard(p, false))}
                        </div>
                      )}
                    </div>
                  )}
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

      {/* Confirm Delete Purchase Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingPurchase)}
        onClose={() => setDeletingPurchase(null)}
        onConfirm={confirmDeletePurchase}
        title="Delete Purchase"
        itemName={deletingPurchase?.items?.[0]?.description || deletingPurchase?.items?.[0]?.material?.name || 'this purchase'}
        message="This purchase record will be deleted. Are you sure you want to proceed?"
        isLoading={deletePurchaseMutation.isPending}
      />
    </PageContainer>
  );
};
