import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  X,
  Users2,
  FileText,
  Download,
  ShoppingCart,
  Layers,
} from 'lucide-react';
import { useWages, useEmployees } from '@/hooks/useWorkforce';
import { usePurchases } from '@/hooks/useProcurement';
import { useCompanySettings } from '@/hooks/useSettings';
import { formatINR } from '@/lib/utils';
import { downloadProjectCompletionPDF, type ProjectReportData } from '@/lib/projectReportPdf';
import type { Project } from '@/types/projects';

interface ProjectCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  customer?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;
  onConfirmComplete: () => void;
  isLoading?: boolean;
}

export const ProjectCompletionModal: React.FC<ProjectCompletionModalProps> = ({
  isOpen,
  onClose,
  project,
  customer,
  onConfirmComplete,
  isLoading = false,
}) => {
  const { data: siteWages = [] } = useWages({ projectId: project.id });
  const { data: employees = [] } = useEmployees();
  const { data: projectPurchases = [] } = usePurchases({ project_id: project.id });
  const { data: company } = useCompanySettings();

  const [activeTab, setActiveTab] = useState<'overview' | 'labour' | 'procurement'>('overview');
  const [autoDownloadPDF, setAutoDownloadPDF] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Workforce Summary Calculation
  const wageSummary = useMemo(() => {
    const labourMap = new Map<string, { name: string; trade?: string; days: number; total: number }>();
    let totalWages = 0;

    for (const w of siteWages) {
      if (w.status !== 'Confirmed') continue;
      const empId = w.employee_id;
      const emp = employees.find((e) => e.id === empId);
      const name = (w as any).employee?.name || emp?.name || 'Labourer';
      const trade = (w as any).employee?.trade || (w as any).employee?.worker_type || emp?.worker_type || 'Field Worker';
      const amount = Number((w as any).amount || (w as any).rate || 0);
      totalWages += amount;

      const existing = labourMap.get(empId) || { name, trade, days: 0, total: 0 };
      existing.days += 1;
      existing.total += amount;
      labourMap.set(empId, existing);
    }

    const labourList = Array.from(labourMap.values()).sort((a, b) => b.total - a.total);
    const uniqueLabourers = labourList.length;
    const totalDays = labourList.reduce((sum, l) => sum + l.days, 0);

    return { labourList, uniqueLabourers, totalDays, totalWages };
  }, [siteWages, employees]);

  // Procurement Summary Calculation
  const procurementSummary = useMemo(() => {
    const confirmed = projectPurchases.filter((p) => p.status === 'Confirmed');
    const totalPurchased = confirmed.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPaid = confirmed.reduce((sum, p) => sum + (p.total_allocated || 0), 0);
    const totalOutstanding = Math.max(0, totalPurchased - totalPaid);

    const purchaseItems = confirmed.map((p) => {
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
    });

    return {
      confirmed,
      totalPurchased,
      totalPaid,
      totalOutstanding,
      purchaseItems,
    };
  }, [projectPurchases]);

  // Combined Total Project Cost
  const totalProjectCost = wageSummary.totalWages + procurementSummary.totalPurchased;

  // Build the complete Report Payload
  const reportPayload: ProjectReportData = useMemo(() => {
    return {
      project: {
        id: project.id,
        name: project.name,
        project_code: project.project_code,
        status: 'Completed',
        site_address: project.site_address,
        start_date: project.start_date,
        target_completion_date: project.expected_end_date,
        actual_completion_date: project.actual_end_date || new Date().toISOString(),
        created_at: project.created_at,
      },
      customer: customer || project.customer || null,
      company: company || null,
      wages: {
        totalWages: wageSummary.totalWages,
        totalDays: wageSummary.totalDays,
        uniqueLabourers: wageSummary.uniqueLabourers,
        items: wageSummary.labourList.map((l) => ({
          employeeName: l.name,
          trade: l.trade,
          days: l.days,
          total: l.total,
        })),
      },
      procurement: {
        totalPurchased: procurementSummary.totalPurchased,
        totalPaid: procurementSummary.totalPaid,
        totalOutstanding: procurementSummary.totalOutstanding,
        items: procurementSummary.purchaseItems,
      },
    };
  }, [project, customer, company, wageSummary, procurementSummary]);

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await downloadProjectCompletionPDF(reportPayload);
    } catch (err) {
      console.error('Failed to generate project completion PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Confirm Complete Handler
  const handleConfirm = async () => {
    if (autoDownloadPDF) {
      await handleDownloadPDF();
    }
    onConfirmComplete();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242424]/75 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Surface */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E2DDD5] z-10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#E2DDD5] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-gradient-to-r from-[#4A0E0E] via-[#5C1414] to-[#4A0E0E] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2
                id="completion-modal-title"
                className="text-base font-bold text-white font-heading leading-tight truncate"
              >
                Project Completion & Closure
              </h2>
              <p className="text-xs text-white/80 mt-0.5 truncate max-w-[220px] sm:max-w-xs font-inter">
                {project.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center border-b border-[#E8E4DC] bg-[#FAFAF8] px-3 pt-2 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#4A0E0E] text-[#4A0E0E] bg-white'
                : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('labour')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'labour'
                ? 'border-[#4A0E0E] text-[#4A0E0E] bg-white'
                : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Workforce ({wageSummary.uniqueLabourers})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('procurement')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'procurement'
                ? 'border-[#4A0E0E] text-[#4A0E0E] bg-white'
                : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Procurement ({procurementSummary.confirmed.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Grand Total Cost Highlight Card */}
              <div className="bg-gradient-to-br from-[#FAF5F0] to-[#F5ECE1] border border-[#E8DACB] rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A272A]">
                    Total Project Expenditure
                  </span>
                  <span className="text-xs bg-[#4A0E0E]/10 text-[#4A0E0E] px-2 py-0.5 rounded-full font-bold">
                    Official Closure
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#242424] font-sans mt-1">
                  {formatINR(totalProjectCost)}
                </div>
                <div className="flex items-center justify-between text-xs text-[#6B6B6B] mt-2 pt-2 border-t border-[#E8DACB]/60">
                  <span>Wages: <strong className="text-[#1E6B37]">{formatINR(wageSummary.totalWages)}</strong></span>
                  <span>Procurement: <strong className="text-[#242424]">{formatINR(procurementSummary.totalPurchased)}</strong></span>
                </div>
              </div>

              {/* Two Column Cost Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {/* Workforce Card */}
                <div className="bg-[#F7F5F0] border border-[#E8E4DC] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
                      <Users2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#242424]">Labour Wages</span>
                  </div>
                  <div className="text-lg font-bold text-[#1E6B37]">
                    {formatINR(wageSummary.totalWages)}
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">
                    {wageSummary.uniqueLabourers} workers • {wageSummary.totalDays} man-days
                  </div>
                </div>

                {/* Procurement Card */}
                <div className="bg-[#F7F5F0] border border-[#E8E4DC] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#4A0E0E]/10 flex items-center justify-center text-[#4A0E0E]">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#242424]">Procurement</span>
                  </div>
                  <div className="text-lg font-bold text-[#242424]">
                    {formatINR(procurementSummary.totalPurchased)}
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">
                    {procurementSummary.confirmed.length} purchases recorded
                  </div>
                </div>
              </div>

              {/* PDF Report Highlights Notice */}
              <div className="bg-[#FAF8F5] border border-[#ECD9C6] rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#242424]">
                    Final Project Completion Report (PDF)
                  </h4>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-relaxed">
                    Includes company branding, full labour logs, procurement breakdown, client details, and formal sign-off blocks.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="mt-2 text-xs font-bold text-[#4A0E0E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Report Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LABOUR LIST */}
          {activeTab === 'labour' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#6B6B6B] px-1">
                <span>Labourer & Trade</span>
                <span>Days & Total Wage</span>
              </div>
              {wageSummary.labourList.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#E2DDD5]">
                  <Users2 className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40 mb-1" />
                  <p className="text-xs text-[#6B6B6B] font-medium">No confirmed wages recorded.</p>
                </div>
              ) : (
                <div className="border border-[#E8E4DC] rounded-xl overflow-hidden divide-y divide-[#E8E4DC]">
                  {wageSummary.labourList.map((labour, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#F7F5F0]/50">
                      <div>
                        <span className="text-xs font-bold text-[#242424] block">{labour.name}</span>
                        <span className="text-[10px] text-[#6B6B6B]">{labour.trade}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1E6B37] block">{formatINR(labour.total)}</span>
                        <span className="text-[10px] text-[#8C867E]">{labour.days} {labour.days === 1 ? 'day' : 'days'}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F7F5F0]">
                    <span className="text-xs font-bold text-[#242424]">Total Wages</span>
                    <span className="text-sm font-bold text-[#1E6B37]">{formatINR(wageSummary.totalWages)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROCUREMENT LIST */}
          {activeTab === 'procurement' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#6B6B6B] px-1">
                <span>Material & Date</span>
                <span>Amount & Status</span>
              </div>
              {procurementSummary.confirmed.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#E2DDD5]">
                  <ShoppingCart className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40 mb-1" />
                  <p className="text-xs text-[#6B6B6B] font-medium">No confirmed purchases recorded.</p>
                </div>
              ) : (
                <div className="border border-[#E8E4DC] rounded-xl overflow-hidden divide-y divide-[#E8E4DC]">
                  {procurementSummary.purchaseItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#F7F5F0]/50">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-xs font-bold text-[#242424] block truncate">{item.productName}</span>
                        <span className="text-[10px] text-[#6B6B6B]">
                          {item.date} {item.supplierName ? `• ${item.supplierName}` : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#242424] block">{formatINR(item.amount)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.paymentStatus === 'Paid' ? 'bg-[#E8F8EE] text-[#1E7E34]' : 'bg-rose-50 text-rose-600'}`}>
                          {item.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F7F5F0]">
                    <span className="text-xs font-bold text-[#242424]">Total Materials</span>
                    <span className="text-sm font-bold text-[#242424]">{formatINR(procurementSummary.totalPurchased)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auto Download Checkbox */}
          <label className="flex items-center gap-2.5 p-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={autoDownloadPDF}
              onChange={(e) => setAutoDownloadPDF(e.target.checked)}
              className="w-4 h-4 rounded text-[#4A0E0E] focus:ring-[#4A0E0E] border-[#E8E4DC]"
            />
            <div className="text-xs">
              <span className="font-bold text-[#242424] block">Download PDF Report on Completion</span>
              <span className="text-[11px] text-[#6B6B6B]">
                Automatically save the official executive completion report to your device
              </span>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[#E2DDD5] flex items-center gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 px-4 rounded-xl border border-[#E2DDD5] text-xs sm:text-sm font-semibold text-[#6B6B6B] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || isGeneratingPDF}
            className="flex-1 h-11 rounded-xl bg-[#4A0E0E] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#380A0A] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isLoading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark Complete {autoDownloadPDF ? '& Download PDF' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
