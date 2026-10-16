import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  HardHat,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useWages, useEmployees, useDeleteDailyWage } from '@/hooks/useWorkforce';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';
import { SimpleDailyWageModal } from '@/components/business/SimpleDailyWageModal';
import { LaborersDrawer } from '@/components/business/LaborersDrawer';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import type { DailyWage, AttendanceStatus } from '@/types/workforce';
import wagesBannerBg from '@/Asserts/Wages banner.png';
import totalWagesBanner from '@/Asserts/Total_wages banner.png';

function getTodayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [isAddWageModalOpen, setIsAddWageModalOpen] = useState(false);
  const [isLaborersDrawerOpen, setIsLaborersDrawerOpen] = useState(false);
  const [openInAddMode, setOpenInAddMode] = useState(false);
  const [editingWage, setEditingWage] = useState<DailyWage | null>(null);

  const dailyDateInputRef = useRef<HTMLInputElement>(null);
  const weeklyDateInputRef = useRef<HTMLInputElement>(null);

  // Segment options for Daily Wages vs Weekly Overview
  const wageViewOptions = useMemo<SegmentOption<'daily' | 'weekly'>[]>(
    () => [
      {
        id: 'daily',
        label: 'Daily Wages',
        icon: <CalendarIcon className="w-4 h-4 text-[#C99A2E]" />,
        activeColorClass: 'text-[#4A0E0E]',
      },
      {
        id: 'weekly',
        label: 'Weekly Overview',
        icon: <Clock className="w-4 h-4 text-[#C99A2E]" />,
        activeColorClass: 'text-[#4A0E0E]',
      },
    ],
    []
  );
  const [expandedWeeklyLaborerId, setExpandedWeeklyLaborerId] = useState<string | null>(null);
  const [weeklyViewMode, setWeeklyViewMode] = useState<'cards' | 'ledger'>('cards');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const todayStr = useMemo(() => getTodayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);

  // Auto-open modal if navigated with ?new=1 or ?new=true, or laborers drawer if ?laborer=1
  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setEditingWage(null);
      setIsAddWageModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    } else if (searchParams.get('laborer') === '1' || searchParams.get('laborer') === 'true') {
      setOpenInAddMode(true);
      setIsLaborersDrawerOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('laborer');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Toast notification helper
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const { data: allWages = [], isLoading: isWagesLoading } = useWages();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const deleteWageMutation = useDeleteDailyWage();
  const [deletingWageItem, setDeletingWageItem] = useState<{ wage: DailyWage; laborerName: string } | null>(null);

  const handleDeleteWage = (wage: DailyWage, laborerName: string) => {
    setDeletingWageItem({ wage, laborerName });
  };

  const confirmDeleteWage = () => {
    if (!deletingWageItem) return;
    const { wage, laborerName } = deletingWageItem;
    deleteWageMutation.mutate(
      { wageId: wage.id, attendanceId: wage.attendance_id || undefined },
      {
        onSuccess: () => {
          setToastMessage(`Wage entry for ${laborerName} deleted successfully.`);
          setDeletingWageItem(null);
        },
        onError: () => {
          setDeletingWageItem(null);
        },
      }
    );
  };

  // ==========================================
  // DATE NAVIGATION LOGIC (DAILY)
  // ==========================================

  const navigateDate = (deltaDays: number) => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + deltaDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const newDateStr = `${y}-${m}-${day}`;
      // Do not allow navigating past today
      if (deltaDays > 0 && newDateStr > todayStr) {
        return;
      }
      setSelectedDate(newDateStr);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const formattedSelectedDateShort = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isSelectedDateToday = selectedDate === todayStr;

  // Entries for selected date
  const dayEntries = useMemo(() => {
    return allWages.filter((w) => w.wage_date === selectedDate && w.status !== 'Cancelled');
  }, [allWages, selectedDate]);

  // Daily totals
  const dailySummary = useMemo(() => {
    let totalPaid = 0;
    let fullDays = 0;
    let halfDays = 0;
    let absent = 0;

    for (const entry of dayEntries) {
      const amt = Number(entry.amount || 0);
      totalPaid += amt;

      const numUnits = Number(entry.payable_units);
      if (!isNaN(numUnits) && numUnits > 0 && numUnits < 1) {
        halfDays += 1;
      } else if (numUnits === 0) {
        absent += 1;
      } else {
        fullDays += 1;
      }
    }

    const presentCount = fullDays + halfDays;

    return {
      totalPaid,
      presentCount,
      fullDays,
      halfDays,
      absent,
      totalEntries: dayEntries.length,
    };
  }, [dayEntries]);

  // ==========================================
  // WEEKLY NAVIGATION & AGGREGATION LOGIC
  // ==========================================

  // Determine week range (Monday to Sunday) based on a reference date
  const [weekReferenceDate, setWeekReferenceDate] = useState<string>(todayStr);

  const weekRange = useMemo(() => {
    const parts = weekReferenceDate.split('-');
    const ref = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    // Day of week: 0 (Sun), 1 (Mon), ..., 6 (Sat)
    const day = ref.getDay();
    // In India/ISO, week starts on Monday:
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() + diffToMonday);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${dt}`);
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDateShort = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    const label = `${formatDateShort(monday)} – ${formatDateShort(sunday)} ${sunday.getFullYear()}`;

    return {
      mondayISO: days[0],
      sundayISO: days[6],
      days,
      label,
    };
  }, [weekReferenceDate]);

  const navigateWeek = (deltaWeeks: number) => {
    const parts = weekReferenceDate.split('-');
    const ref = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    ref.setDate(ref.getDate() + deltaWeeks * 7);
    const y = ref.getFullYear();
    const m = String(ref.getMonth() + 1).padStart(2, '0');
    const day = String(ref.getDate()).padStart(2, '0');
    setWeekReferenceDate(`${y}-${m}-${day}`);
  };

  // Weekly entries
  const weeklyEntries = useMemo(() => {
    const daySet = new Set(weekRange.days);
    return allWages.filter((w) => w.wage_date && daySet.has(w.wage_date) && w.status !== 'Cancelled');
  }, [allWages, weekRange.days]);

  // Aggregated weekly data per laborer
  const weeklyLaborerAggregation = useMemo(() => {
    interface LaborerWeekData {
      employeeId: string;
      name: string;
      fullDays: number;
      halfDays: number;
      absentDays: number;
      totalPaid: number;
      projects: Set<string>;
      dailyAmounts: Record<string, { amount: number; status: AttendanceStatus; projectName: string }>;
    }

    const map = new Map<string, LaborerWeekData>();

    for (const wage of weeklyEntries) {
      const empId = wage.employee_id;
      const emp = employees.find((e) => e.id === empId);
      const name = wage.employee?.name || emp?.name || 'Laborer';
      const amount = Number(wage.amount || 0);

      const numUnits = Number(wage.payable_units);
      const status: AttendanceStatus =
        !isNaN(numUnits) && numUnits > 0 && numUnits < 1 ? 'Half Day' : numUnits === 0 ? 'Absent' : 'Present';

      const proj = projects.find((p) => p.id === wage.project_id);
      const projectName = (wage.project?.name && wage.project.name !== 'Project')
        ? wage.project.name
        : proj?.name || 'General Site Work';

      let row = map.get(empId);
      if (!row) {
        row = {
          employeeId: empId,
          name,
          fullDays: 0,
          halfDays: 0,
          absentDays: 0,
          totalPaid: 0,
          projects: new Set<string>(),
          dailyAmounts: {},
        };
        map.set(empId, row);
      }

      if (status === 'Present') row.fullDays += 1;
      else if (status === 'Half Day') row.halfDays += 1;
      else if (status === 'Absent') row.absentDays += 1;

      row.totalPaid += amount;
      if (wage.project_id) {
        row.projects.add(projectName);
      }

      row.dailyAmounts[wage.wage_date] = {
        amount,
        status,
        projectName,
      };
    }

    const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    const grandWeeklyTotal = list.reduce((sum, item) => sum + item.totalPaid, 0);

    // Day column totals
    const dayTotals: Record<string, number> = {};
    for (const d of weekRange.days) {
      dayTotals[d] = weeklyEntries
        .filter((w) => w.wage_date === d)
        .reduce((sum, w) => sum + Number(w.amount || 0), 0);
    }

    return {
      rows: list,
      grandWeeklyTotal,
      dayTotals,
    };
  }, [weeklyEntries, employees, projects, weekRange.days]);

// Weekly attendance summary totals
  const weeklySummary = useMemo(() => {
    let full = 0;
    let half = 0;
    let absent = 0;
    for (const r of weeklyLaborerAggregation.rows) {
      full += r.fullDays;
      half += r.halfDays;
      absent += r.absentDays;
    }
    return {
      totalFullDays: full,
      totalHalfDays: half,
      totalAbsentDays: absent,
    };
  }, [weeklyLaborerAggregation.rows]);

  // Actions
  const handleOpenEdit = (wage: DailyWage) => {
    setEditingWage(wage);
    setIsAddWageModalOpen(true);
  };

  // Helper for attendance pill display matching project status badge
  const renderAttendancePill = (units: number | string | undefined | null) => {
    const numUnits = Number(units);
    if (!isNaN(numUnits) && numUnits > 0 && numUnits < 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEFCE8] text-[#854D0E] text-[11px] font-semibold shrink-0 border border-[#FDE047]/60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
          <span>Half Day</span>
        </span>
      );
    }
    if (numUnits === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] text-[11px] font-semibold shrink-0 border border-[#FCA5A5]/60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          <span>Absent</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#1E7E34] text-[11px] font-semibold shrink-0 border border-[#86EFAC]/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34]" />
        <span>Full Day</span>
      </span>
    );
  };

  return (
    <PageContainer>
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#242424] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO BANNER (Wages Background Banner with Text) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E2DDD5]/70 bg-[#12100E] h-[135px] sm:h-[155px] md:h-[175px] mb-4">
        <img
          src={wagesBannerBg}
          alt="Wages Banner"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-white tracking-wide">
            Wages
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-inter mt-1 max-w-[210px] sm:max-w-xs leading-snug">
            Manage laborers and track daily / weekly wages.
          </p>
        </div>
      </div>

      {/* 2. PAGE ACTIONS: Laborers Directory & Add Wage Entry */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
        <button
          type="button"
          onClick={() => {
            setOpenInAddMode(false);
            setIsLaborersDrawerOpen(true);
          }}
          className="h-11 px-3.5 sm:px-4 rounded-xl border border-[#E8E4DC] bg-white text-[#242424] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs hover:bg-[#FAF7F0] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Users className="w-4 h-4 text-[#854D0E] shrink-0" />
          <span className="truncate">Laborers Directory</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditingWage(null);
            setIsAddWageModalOpen(true);
          }}
          className="h-11 px-3.5 sm:px-4 rounded-xl bg-[#5A0F12] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs hover:bg-[#430B0D] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
          <span className="truncate">Add Wage Entry</span>
        </button>
      </div>

      {/* 3. VIEW SWITCHER: [ Daily Wages ] [ Weekly Overview ] */}
      <div className="mb-4">
        <SlidingSegmentedControl<'daily' | 'weekly'>
          options={wageViewOptions}
          value={activeTab}
          onChange={(tab: 'daily' | 'weekly') => setActiveTab(tab)}
          size="md"
          fullWidth
          ariaLabel="Wages view"
        />
      </div>

      {/* ========================================================= */}
      {/* 1. DAILY VIEW */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div key={activeTab} className="space-y-4 animate-filter-slide">
          {/* Date Selector Bar (Matching Weekly Overview Structure) */}
          <div className="bg-white dark:bg-[#1A1714] border border-[#E2DDD5] dark:border-white/10 rounded-xl p-3 sm:p-4 shadow-xs transition-colors">
            {/* Mobile Layout (sm:hidden) */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              <div className="flex items-center justify-between bg-[#F7F5F0] dark:bg-[#231F1B] border border-[#E2DDD5] dark:border-white/10 rounded-lg px-3 py-2">
                <div className="relative flex items-center gap-2 min-w-0 cursor-pointer group">
                  <CalendarIcon className="w-4 h-4 text-[#C99A2E] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-inter font-bold text-sm text-[#242424] dark:text-[#F5F5F4] truncate group-hover:text-[#4A0E0E] dark:group-hover:text-[#E2A855] transition-colors">
                    {formattedSelectedDateShort}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C867E] dark:text-[#A8A29E] shrink-0" />
                  <input
                    ref={dailyDateInputRef}
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                    title="Click to open calendar"
                    aria-label="Select date"
                  />
                </div>
                {!isSelectedDateToday ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="relative z-10 px-2.5 py-1 rounded-lg bg-[#5A0F12] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#430B0D] transition-colors cursor-pointer shrink-0 ml-2 shadow-2xs"
                  >
                    JUMP TO TODAY
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-[#FDF9EE] dark:bg-[#2A241C] text-[#854D0E] dark:text-[#E2A855] border border-[#FDE047] dark:border-[#C9A24A]/40 text-[10px] font-bold uppercase tracking-wider">
                    TODAY
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate(-1)}
                  className="h-9 w-full border-[#E2DDD5] dark:border-white/15 text-xs font-semibold text-[#242424] dark:text-[#F5F5F4] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] bg-white dark:bg-[#231F1B]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Day</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSelectedDateToday}
                  onClick={() => navigateDate(1)}
                  className="h-9 w-full border-[#E2DDD5] dark:border-white/15 text-xs font-semibold text-[#242424] dark:text-[#F5F5F4] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] disabled:opacity-40 bg-white dark:bg-[#231F1B]"
                >
                  <span>Next Day</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout (sm and up) */}
            <div className="hidden sm:flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate(-1)}
                  className="h-9 px-3 border-[#E2DDD5] dark:border-white/15 text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] bg-white dark:bg-[#231F1B] text-[#242424] dark:text-[#F5F5F4]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Day</span>
                </Button>

                <div className="relative inline-flex items-center">
                  <div
                    className="font-inter font-bold text-sm sm:text-base text-[#242424] dark:text-[#F5F5F4] px-2.5 py-1.5 rounded-lg border border-transparent hover:border-[#E2DDD5] dark:hover:border-white/15 hover:bg-[#FAF7F0] dark:hover:bg-[#231F1B] transition-all flex items-center gap-2 cursor-pointer group"
                    title="Click to open calendar"
                  >
                    <CalendarIcon className="w-4 h-4 text-[#C99A2E] group-hover:scale-110 transition-transform shrink-0" />
                    <span>{formattedSelectedDate}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C867E] dark:text-[#A8A29E] transition-transform group-hover:translate-y-0.5 shrink-0" />
                  </div>
                  <input
                    ref={dailyDateInputRef}
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                    title="Click to open calendar"
                    aria-label="Select date"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSelectedDateToday}
                  onClick={() => navigateDate(1)}
                  className="h-9 px-3 border-[#E2DDD5] dark:border-white/15 text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] disabled:opacity-40 bg-white dark:bg-[#231F1B] text-[#242424] dark:text-[#F5F5F4]"
                >
                  <span>Next Day</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {isSelectedDateToday ? (
                <span className="px-2.5 py-1 rounded-lg bg-[#FDF9EE] dark:bg-[#2A241C] text-[#854D0E] dark:text-[#E2A855] border border-[#FDE047] dark:border-[#C9A24A]/40 text-[10px] font-bold uppercase tracking-wider">
                  TODAY
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-1 rounded-lg bg-[#5A0F12] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#430B0D] transition-colors cursor-pointer shadow-2xs"
                >
                  JUMP TO TODAY
                </button>
              )}
            </div>
          </div>

          {/* Wage Summary Card (Kishore's Card with 4 Distinct Colored Status Tiles) */}
          <div className="bg-[#FAF8F5] dark:bg-[#1A1714] border border-[#E8E4DC] dark:border-white/10 rounded-2xl shadow-xs relative overflow-hidden transition-colors">
            {/* Background illustration for Today's Wages Paid */}
            <img
              src={totalWagesBanner}
              alt=""
              className="absolute right-0 top-0 h-full w-auto max-w-[45%] sm:max-w-[35%] object-contain object-right pointer-events-none opacity-85 dark:opacity-30 select-none"
            />

            {/* Header: Today's Wages Paid + Big Amount */}
            <div className="relative z-10 p-4 sm:p-5">
              <div className="text-xs sm:text-sm font-semibold text-[#166534] dark:text-[#4ADE80]">
                {isSelectedDateToday ? "Today's Wages Paid" : `Wages Paid on ${formattedSelectedDate}`}
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans tabular-nums text-[#0E2920] dark:text-white mt-0.5 tracking-tight">
                {formatINR(dailySummary.totalPaid)}
              </div>
            </div>

            {/* 4 Stats Grid in a Single Line at the Bottom */}
            <div className="relative z-10 grid grid-cols-4 border-t border-[#E8E4DC] dark:border-white/10 bg-white/80 dark:bg-[#231F1B]/90 backdrop-blur-xs divide-x divide-[#E8E4DC] dark:divide-white/10 py-3 px-2 sm:px-3">
              {/* 1. Total Logged */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#DBEAFE] dark:bg-[#1E3A8A]/40 text-[#1E3A8A] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#1E3A8A] dark:text-[#93C5FD] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.totalEntries}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Total Logged
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 2. Full Days */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#E8F8EE] dark:bg-[#166534]/40 text-[#1E7E34] dark:text-[#86EFAC] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#1E7E34] dark:text-[#86EFAC] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.fullDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Full Days
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 3. Half Days */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FEF9E7] dark:bg-[#854D0E]/40 text-[#B45309] dark:text-[#FDE047] flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#B45309] dark:text-[#FDE047] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.halfDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Half Days
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 4. Absent */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FEE2E2] dark:bg-[#991B1B]/40 text-[#991B1B] dark:text-[#FCA5A5] flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-[#991B1B] dark:text-[#FCA5A5] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.absent}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Absent
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Workers</div>
              </div>
            </div>
          </div>

          {/* DAILY MUSTER SHEET (DESKTOP & MOBILE) */}
          {isWagesLoading ? (
            <div className="bg-white dark:bg-[#1A1714] border border-[#E2DDD5] dark:border-white/10 rounded-xl p-8 text-center text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
              Loading daily wages...
            </div>
          ) : dayEntries.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-[#1A1714] border border-[#E2DDD5] dark:border-white/10 rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F7F5F0] dark:bg-[#231F1B] border border-[#E2DDD5] dark:border-white/10 flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A8A29E]">
                <CalendarIcon className="w-6 h-6 text-[#C99A2E]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#242424] dark:text-[#F5F5F4] font-inter">
                  No wage entries for this day.
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B6B] dark:text-[#A8A29E] max-w-sm mx-auto">
                  Mark attendance and daily cash payments for site laborers who worked on {formattedSelectedDate}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 dark:bg-[#1A1714]/95 backdrop-blur-xs border border-[#E8E4DC] dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
              {/* Header */}
              <div className="px-4 sm:px-5 py-3.5 bg-[#FAF8F5] dark:bg-[#231F1B] border-b border-[#EFECE6] dark:border-white/10 flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-[#3E1012] dark:text-[#E2A855] font-inter">
                  Laborers Logged ({dayEntries.length})
                </h3>
              </div>

              {/* DESKTOP TABLE (>= 768px) - Unified rows touching with NO GAP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFECE6] dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-[#231F1B]/60 text-[11px] font-bold text-[#8C867E] dark:text-[#A8A29E] uppercase tracking-wider">
                      <th className="py-3 px-5">Laborer / Project</th>
                      <th className="py-3 px-4">Attendance</th>
                      <th className="py-3 px-5 text-right">Paid Amount</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6] dark:divide-white/10 text-sm text-[#242424] dark:text-[#F5F5F4]">
                    {dayEntries.map((wage) => {
                      const emp = employees.find((e) => e.id === wage.employee_id);
                      const laborerName = wage.employee?.name || emp?.name || 'Laborer';
                      const proj = projects.find((p) => p.id === wage.project_id);
                      const projectName = (wage.project?.name && wage.project.name !== 'Project')
                        ? wage.project.name
                        : proj?.name || 'General Site Work';

                      return (
                        <tr key={wage.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#231F1B]/60 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F9ECEB] dark:bg-[#2A1616] text-[#5A0F12] dark:text-[#E2A855] flex items-center justify-center shrink-0">
                                <HardHat className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#242424] dark:text-[#F5F5F4] font-inter truncate">{laborerName}</div>
                                <div className="flex items-center gap-1 text-xs text-[#8C867E] dark:text-[#A8A29E] mt-0.5">
                                  <Building2 className="w-3 h-3 text-[#A8A29E]" />
                                  <span className="truncate">{projectName}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">{renderAttendancePill(wage.payable_units)}</td>

                          <td className="py-3.5 px-5 text-right font-bold tabular-nums text-sm text-[#242424] dark:text-[#F5F5F4] font-sans">
                            {formatINR(wage.amount || 0)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(wage)}
                                className="font-medium text-xs text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#4A0E0E] dark:hover:text-[#E2A855] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit wage entry"
                                aria-label={`Edit wage for ${laborerName}`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B] dark:text-[#A8A29E]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWage(wage, laborerName)}
                                disabled={deleteWageMutation.isPending}
                                className="font-medium text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Delete wage entry"
                                aria-label={`Delete wage for ${laborerName}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE ROWS (< 768px) - Unified container with divide-y and NO GAP */}
              <div className="md:hidden divide-y divide-[#EFECE6] dark:divide-white/10">
                {dayEntries.map((wage) => {
                  const emp = employees.find((e) => e.id === wage.employee_id);
                  const laborerName = wage.employee?.name || emp?.name || 'Laborer';
                  const proj = projects.find((p) => p.id === wage.project_id);
                  const projectName = (wage.project?.name && wage.project.name !== 'Project')
                    ? wage.project.name
                    : proj?.name || 'General Site Work';

                  return (
                    <div
                      key={wage.id}
                      className="p-3.5 sm:p-4 hover:bg-[#FAF8F5]/60 dark:hover:bg-[#231F1B]/60 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Laborer Avatar/Icon, Name, Attendance Badge */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#FBEFEF] dark:bg-[#2A1616] text-[#4A0E0E] dark:text-[#E2A855] flex items-center justify-center shrink-0">
                              <HardHat className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#242424] dark:text-[#F5F5F4] font-inter group-hover:text-[#4A0E0E] dark:group-hover:text-[#E2A855] transition-colors truncate">
                                {laborerName}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-[#8C867E] dark:text-[#A8A29E] shrink-0" />
                                <span className="truncate">{projectName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {renderAttendancePill(wage.payable_units)}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar: Edit, Delete, Amount Paid */}
                      <div className="mt-3 pt-2.5 border-t border-[#F0EAE1]/70 dark:border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(wage)}
                            className="font-medium text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#4A0E0E] dark:hover:text-[#E2A855] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B] dark:text-[#A8A29E]" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteWage(wage, laborerName)}
                            disabled={deleteWageMutation.isPending}
                            className="font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Delete wage for ${laborerName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] font-medium mr-1.5">Paid:</span>
                          <span className="font-bold text-sm sm:text-base text-[#242424] dark:text-[#F5F5F4] font-sans tabular-nums">
                            {formatINR(wage.amount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. WEEKLY VIEW */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div key={activeTab} className="space-y-4 animate-filter-slide">
          {/* Week Selector Bar */}
          <div className="bg-white dark:bg-[#1A1714] border border-[#E2DDD5] dark:border-white/10 rounded-xl p-3 sm:p-4 shadow-xs transition-colors">
            {/* Mobile Layout (sm:hidden) */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              <div className="flex items-center justify-between bg-[#F7F5F0] dark:bg-[#231F1B] border border-[#E2DDD5] dark:border-white/10 rounded-lg px-3 py-2">
                <div className="relative flex items-center gap-2 min-w-0 cursor-pointer group">
                  <CalendarIcon className="w-4 h-4 text-[#C99A2E] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-inter font-bold text-sm text-[#242424] dark:text-[#F5F5F4] truncate group-hover:text-[#4A0E0E] dark:group-hover:text-[#E2A855] transition-colors">
                    {weekRange.label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C867E] dark:text-[#A8A29E] shrink-0" />
                  <input
                    ref={weeklyDateInputRef}
                    type="date"
                    value={weekReferenceDate}
                    onChange={(e) => {
                      if (e.target.value) setWeekReferenceDate(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                    title="Click to open calendar"
                    aria-label="Select week date"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setWeekReferenceDate(todayStr)}
                  className="relative z-10 px-2.5 py-1 rounded-lg bg-[#5A0F12] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#430B0D] transition-colors cursor-pointer shrink-0 ml-2 shadow-2xs"
                >
                  CURRENT WEEK
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                  className="h-9 w-full border-[#E2DDD5] dark:border-white/15 text-xs font-semibold text-[#242424] dark:text-[#F5F5F4] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] bg-white dark:bg-[#231F1B]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Week</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                  className="h-9 w-full border-[#E2DDD5] dark:border-white/15 text-xs font-semibold text-[#242424] dark:text-[#F5F5F4] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] bg-white dark:bg-[#231F1B]"
                >
                  <span>Next Week</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout (sm and up) */}
            <div className="hidden sm:flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                  className="h-9 px-3 border-[#E2DDD5] dark:border-white/15 text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] bg-white dark:bg-[#231F1B] text-[#242424] dark:text-[#F5F5F4]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Week</span>
                </Button>

                <div className="relative inline-flex items-center">
                  <div
                    className="font-inter font-bold text-sm sm:text-base text-[#242424] dark:text-[#F5F5F4] px-2.5 py-1.5 rounded-lg border border-transparent hover:border-[#E2DDD5] dark:hover:border-white/15 hover:bg-[#FAF7F0] dark:hover:bg-[#231F1B] transition-all flex items-center gap-2 cursor-pointer group"
                    title="Click to open calendar and select a week"
                  >
                    <CalendarIcon className="w-4 h-4 text-[#C99A2E] group-hover:scale-110 transition-transform shrink-0" />
                    <span>{weekRange.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C867E] dark:text-[#A8A29E] transition-transform group-hover:translate-y-0.5 shrink-0" />
                  </div>
                  <input
                    ref={weeklyDateInputRef}
                    type="date"
                    value={weekReferenceDate}
                    onChange={(e) => {
                      if (e.target.value) setWeekReferenceDate(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                    title="Click to open calendar"
                    aria-label="Select week date"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                  className="h-9 px-3 border-[#E2DDD5] dark:border-white/15 text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E] dark:hover:border-[#E2A855] bg-white dark:bg-[#231F1B] text-[#242424] dark:text-[#F5F5F4]"
                >
                  <span>Next Week</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setWeekReferenceDate(todayStr)}
                className="px-2.5 py-1 rounded-lg bg-[#5A0F12] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#430B0D] transition-colors cursor-pointer shadow-2xs"
              >
                CURRENT WEEK
              </button>
            </div>
          </div>

          {/* Weekly Summary Card (Matches Daily Wages Dashboard Design) */}
          <div className="bg-[#FAF8F5] dark:bg-[#1A1714] border border-[#E8E4DC] dark:border-white/10 rounded-2xl shadow-xs relative overflow-hidden transition-colors">
            {/* Background illustration */}
            <img
              src={totalWagesBanner}
              alt=""
              className="absolute right-0 top-0 h-full w-auto max-w-[45%] sm:max-w-[35%] object-contain object-right pointer-events-none opacity-85 dark:opacity-30 select-none"
            />

            {/* Header: Weekly Wages Disbursed + Big Amount */}
            <div className="relative z-10 p-4 sm:p-5">
              <div className="text-xs sm:text-sm font-semibold text-[#166534] dark:text-[#4ADE80]">
                Weekly Wages Disbursed ({weekRange.label})
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans tabular-nums text-[#0E2920] dark:text-white mt-0.5 tracking-tight">
                {formatINR(weeklyLaborerAggregation.grandWeeklyTotal)}
              </div>
            </div>

            {/* 4 Stats Grid in a Single Line at the Bottom */}
            <div className="relative z-10 grid grid-cols-4 border-t border-[#E8E4DC] dark:border-white/10 bg-white/80 dark:bg-[#231F1B]/90 backdrop-blur-xs divide-x divide-[#E8E4DC] dark:divide-white/10 py-3 px-2 sm:px-3">
              {/* 1. Total Logged (Active Workers) */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#DBEAFE] dark:bg-[#1E3A8A]/40 text-[#1E3A8A] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#1E3A8A] dark:text-[#93C5FD] text-xs sm:text-sm tabular-nums leading-none">
                    {weeklyLaborerAggregation.rows.length}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Total Logged
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 2. Full Days */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#E8F8EE] dark:bg-[#166534]/40 text-[#1E7E34] dark:text-[#86EFAC] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#1E7E34] dark:text-[#86EFAC] text-xs sm:text-sm tabular-nums leading-none">
                    {weeklySummary.totalFullDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Full Days
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Shifts</div>
              </div>

              {/* 3. Half Days */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FEF9E7] dark:bg-[#854D0E]/40 text-[#B45309] dark:text-[#FDE047] flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#B45309] dark:text-[#FDE047] text-xs sm:text-sm tabular-nums leading-none">
                    {weeklySummary.totalHalfDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Half Days
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Shifts</div>
              </div>

              {/* 4. Absent */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FEE2E2] dark:bg-[#991B1B]/40 text-[#991B1B] dark:text-[#FCA5A5] flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-[#991B1B] dark:text-[#FCA5A5] text-xs sm:text-sm tabular-nums leading-none">
                    {weeklySummary.totalAbsentDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] dark:text-[#F5F5F4] leading-tight truncate">
                  Absent
                </div>
                <div className="text-[9px] text-[#8C867E] dark:text-[#A8A29E] leading-none mt-0.5">Shifts</div>
              </div>
            </div>
          </div>

          {/* WEEKLY TABLE (DESKTOP >= 768px) */}
          {weeklyLaborerAggregation.rows.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 sm:p-12 text-center space-y-2 shadow-xs">
              <CalendarIcon className="w-8 h-8 text-[#99958F] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[#242424] font-inter">
                No wage entries recorded for this week.
              </h3>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('daily')}
                  className="h-9 px-4 border-[#E2DDD5] text-xs font-semibold"
                >
                  Go to Daily Wages
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-[#242424] font-heading">
                  Laborers Logged ({weeklyLaborerAggregation.rows.length})
                </h3>
                <div className="hidden md:flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#E8E4DC] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setWeeklyViewMode('cards')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      weeklyViewMode === 'cards'
                        ? 'bg-[#5A0F12] text-white shadow-2xs'
                        : 'text-[#6B6B6B] hover:text-[#242424]'
                    }`}
                  >
                    Cards View
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeeklyViewMode('ledger')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      weeklyViewMode === 'ledger'
                        ? 'bg-[#5A0F12] text-white shadow-2xs'
                        : 'text-[#6B6B6B] hover:text-[#242424]'
                    }`}
                  >
                    Ledger Table
                  </button>
                </div>
              </div>

              {/* DESKTOP LEDGER TABLE (Visible when weeklyViewMode === 'ledger') */}
              {weeklyViewMode === 'ledger' && (
                <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#F7F5F0] border-b border-[#E2DDD5] flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E]">
                    Laborer Weekly Ledger ({weekRange.label})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E2DDD5] bg-[#FFFFFF] text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                        <th className="py-3 px-4">Laborer</th>
                        <th className="py-3 px-2 text-center">Mon</th>
                        <th className="py-3 px-2 text-center">Tue</th>
                        <th className="py-3 px-2 text-center">Wed</th>
                        <th className="py-3 px-2 text-center">Thu</th>
                        <th className="py-3 px-2 text-center">Fri</th>
                        <th className="py-3 px-2 text-center">Sat</th>
                        <th className="py-3 px-2 text-center">Sun</th>
                        <th className="py-3 px-3 text-center">Full</th>
                        <th className="py-3 px-3 text-center">Half</th>
                        <th className="py-3 px-3 text-center">Abs</th>
                        <th className="py-3 px-4">Sites Worked</th>
                        <th className="py-3 px-4 text-right">Weekly Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD5] text-sm text-[#242424]">
                      {weeklyLaborerAggregation.rows.map((row) => (
                        <tr key={row.employeeId} className="hover:bg-[#F7F5F0]/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-sm text-[#242424] font-inter">{row.name}</div>
                          </td>

                          {/* 7 Days columns */}
                          {weekRange.days.map((dateISO) => {
                            const dayRec = row.dailyAmounts[dateISO];
                            if (!dayRec) {
                              return (
                                <td key={dateISO} className="py-3 px-2 text-center text-[#99958F] text-xs">
                                  —
                                </td>
                              );
                            }
                            return (
                              <td key={dateISO} className="py-3 px-2 text-center tabular-nums">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded-sm text-[11px] font-semibold ${
                                    dayRec.status === 'Absent'
                                      ? 'text-[#991B1B] bg-[#FEF2F2]'
                                      : dayRec.status === 'Half Day'
                                      ? 'text-[#854D0E] bg-[#FEFCE8]'
                                      : 'text-[#166534] bg-[#F0FDF4]'
                                  }`}
                                  title={`${dayRec.projectName}: ${dayRec.status} (₹${dayRec.amount})`}
                                >
                                  {dayRec.amount > 0 ? `₹${dayRec.amount}` : dayRec.status === 'Absent' ? 'Abs' : '₹0'}
                                </span>
                              </td>
                            );
                          })}

                          <td className="py-3 px-3 text-center font-semibold text-[#166534] tabular-nums">
                            {row.fullDays}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-[#854D0E] tabular-nums">
                            {row.halfDays}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-[#991B1B] tabular-nums">
                            {row.absentDays}
                          </td>

                          <td className="py-3 px-4 text-xs text-[#6B6B6B] max-w-[160px] truncate">
                            {row.projects.size > 0 ? Array.from(row.projects).join(', ') : '—'}
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-sm tabular-nums text-[#242424]">
                            {formatINR(row.totalPaid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Table Footer with Column Totals */}
                    <tfoot>
                      <tr className="border-t-2 border-[#E2DDD5] bg-[#F7F5F0] font-bold text-xs text-[#242424]">
                        <td className="py-3 px-4 uppercase text-[11px] text-[#6B6B6B]">Day Totals</td>
                        {weekRange.days.map((dateISO) => (
                          <td key={dateISO} className="py-3 px-2 text-center tabular-nums">
                            {weeklyLaborerAggregation.dayTotals[dateISO] > 0
                              ? formatINR(weeklyLaborerAggregation.dayTotals[dateISO])
                              : '—'}
                          </td>
                        ))}
                        <td colSpan={4} className="py-3 px-4 text-right uppercase text-[11px] text-[#6B6B6B]">
                          Weekly Grand Total:
                        </td>
                        <td className="py-3 px-4 text-right font-sans text-base text-[#4A0E0E] tabular-nums">
                          {formatINR(weeklyLaborerAggregation.grandWeeklyTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              )}

              {/* WEEKLY CARDS (Visible on mobile, and on desktop when weeklyViewMode === "cards") */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 ${weeklyViewMode === 'ledger' ? 'md:hidden' : ''}`}>
                {weeklyLaborerAggregation.rows.map((row) => {
                  const isExpanded = expandedWeeklyLaborerId === row.employeeId;

                  return (
                    <div
                      key={row.employeeId}
                      className="bg-white dark:bg-[#1A1714] border border-[#E8E4DC] dark:border-white/10 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div>
                        {/* Header: Laborer Avatar/Icon, Name, Weekly Total on Top Right */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#FBEFEF] dark:bg-[#2A1616] text-[#4A0E0E] dark:text-[#E2A855] flex items-center justify-center shrink-0">
                              <HardHat className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#242424] dark:text-[#F5F5F4] font-inter group-hover:text-[#4A0E0E] dark:group-hover:text-[#E2A855] transition-colors truncate">
                                {row.name}
                              </h4>
                            </div>
                          </div>

                          {/* Top Right: Weekly Total and Amount */}
                          <div className="shrink-0 text-right">
                            <span className="block text-[10px] font-semibold text-[#8C867E] dark:text-[#A8A29E] uppercase tracking-wider">
                              Weekly Total
                            </span>
                            <span className="font-bold text-base sm:text-lg tabular-nums text-[#166534] dark:text-[#4ADE80] font-sans">
                              {formatINR(row.totalPaid)}
                            </span>
                          </div>
                        </div>

                        {/* Details: Sites worked and Attendance pills (Full, Half, Absent always visible) */}
                        <div className="mt-3 space-y-2 text-xs text-[#6B6B6B] dark:text-[#A8A29E] pl-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#8C867E] dark:text-[#A8A29E] shrink-0" />
                            <span className="truncate">
                              {row.projects.size > 0 ? Array.from(row.projects).join(', ') : 'General Site Work'}
                            </span>
                          </div>

                          {/* Attendance breakdown pills: Full, Half, Absent */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] dark:bg-[#132B1C] text-[#166534] dark:text-[#4ADE80] border border-[#86EFAC]/70 dark:border-[#225A38]/50 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-[#166534] dark:text-[#4ADE80]" />
                              <span>{row.fullDays} Full</span>
                            </span>

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEFCE8] dark:bg-[#2A2414] text-[#854D0E] dark:text-[#FDE047] border border-[#FDE047]/70 dark:border-[#854D0E]/50 text-[11px] font-semibold">
                              <Clock className="w-3 h-3 text-[#854D0E] dark:text-[#FDE047]" />
                              <span>{row.halfDays} Half</span>
                            </span>

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-[#2F1515] text-[#991B1B] dark:text-[#F87171] border border-[#FCA5A5]/70 dark:border-[#5C2323]/50 text-[11px] font-semibold">
                              <X className="w-3 h-3 text-[#991B1B] dark:text-[#F87171] stroke-[2.5]" />
                              <span>{row.absentDays} Absent</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar: Accordion Toggle */}
                      <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] dark:border-white/10 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedWeeklyLaborerId(isExpanded ? null : row.employeeId)}
                          className="font-medium text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#4A0E0E] dark:hover:text-[#E2A855] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Daily Details' : 'View Daily Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* 7-Day Expanded Breakdown */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#F0EAE1] dark:border-white/10 space-y-2">
                          <div className="text-[10.5px] font-bold text-[#6B6B6B] dark:text-[#A8A29E] uppercase tracking-wider pl-1">
                            7-Day Daily Breakdown
                          </div>
                          <div className="bg-[#FAF7F0] dark:bg-[#231F1B] border border-[#E8E4DC] dark:border-white/10 rounded-xl p-2.5 space-y-1.5 text-xs animate-in fade-in duration-100">
                            {weekRange.days.map((dISO) => {
                              const dayRec = row.dailyAmounts[dISO];
                              const dObj = new Date(
                                Number(dISO.split('-')[0]),
                                Number(dISO.split('-')[1]) - 1,
                                Number(dISO.split('-')[2])
                              );
                              const dayName = dObj.toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              });

                              return (
                                <div key={dISO} className="flex items-center justify-between py-1 border-b border-[#E8E4DC]/60 dark:border-white/10 last:border-0">
                                  <span className="font-medium text-[#6B6B6B] dark:text-[#A8A29E]">{dayName}</span>
                                  {dayRec ? (
                                    <span className="font-semibold text-[#242424] dark:text-[#F5F5F4] tabular-nums">
                                      {dayRec.projectName} — <span className={dayRec.status === 'Absent' ? 'text-[#991B1B] dark:text-[#F87171]' : dayRec.status === 'Half Day' ? 'text-[#854D0E] dark:text-[#FDE047]' : 'text-[#166534] dark:text-[#4ADE80]'}>{dayRec.status}</span> ({formatINR(dayRec.amount)})
                                    </span>
                                  ) : (
                                    <span className="text-[#99958F] italic">No work recorded</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Laborers Directory Drawer */}
      <LaborersDrawer
        isOpen={isLaborersDrawerOpen}
        initialAddMode={openInAddMode}
        onClose={() => {
          setIsLaborersDrawerOpen(false);
          setOpenInAddMode(false);
        }}
        onSelectLaborer={() => {
          // Keep drawer open or close as needed
        }}
      />

      {/* Add / Edit Daily Wage Modal */}
      <SimpleDailyWageModal
        isOpen={isAddWageModalOpen}
        onClose={() => {
          setIsAddWageModalOpen(false);
          setEditingWage(null);
        }}
        preselectedDate={selectedDate}
        existingWage={editingWage}
        onSuccess={() => {
          setToastMessage(editingWage ? 'Wage entry updated.' : 'Wage entry saved.');
        }}
      />

      {/* Delete Wage Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingWageItem)}
        onClose={() => setDeletingWageItem(null)}
        onConfirm={confirmDeleteWage}
        itemName={deletingWageItem ? `${deletingWageItem.laborerName} (${formatINR(deletingWageItem.wage.amount || 0)})` : undefined}
        isLoading={deleteWageMutation.isPending}
      />
    </PageContainer>
  );
}
