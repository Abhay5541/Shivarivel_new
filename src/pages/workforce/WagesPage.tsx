import { useState, useMemo, useEffect } from 'react';
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
  Ban,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  HardHat,
  Receipt,
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

      const units = entry.payable_units;
      if (units === 0.5) {
        halfDays += 1;
      } else if (units === 0) {
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

      const status: AttendanceStatus =
        wage.payable_units === 0.5 ? 'Half Day' : wage.payable_units === 0 ? 'Absent' : 'Present';

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

  // Actions
  const handleOpenEdit = (wage: DailyWage) => {
    setEditingWage(wage);
    setIsAddWageModalOpen(true);
  };

  // Helper for attendance pill display
  const renderAttendancePill = (units: number) => {
    if (units === 0.5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047] text-xs font-semibold">
          <Clock className="w-3 h-3" />
          <span>Half Day</span>
        </span>
      );
    }
    if (units === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] text-xs font-semibold">
          <Ban className="w-3 h-3" />
          <span>Absent</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F0FDF4] text-[#166534] border border-[#86EFAC] text-xs font-semibold">
        <CheckCircle2 className="w-3 h-3" />
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
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent sm:from-black/80 sm:via-black/35 sm:to-transparent pointer-events-none" />
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
        <SlidingSegmentedControl
          options={wageViewOptions}
          value={activeTab}
          onChange={setActiveTab}
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
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs">
            {/* Mobile Layout (sm:hidden) */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              <div className="flex items-center justify-between bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="w-4 h-4 text-[#C99A2E] shrink-0" />
                  <span className="font-display font-bold text-sm text-[#242424] truncate">
                    {formattedSelectedDateShort}
                  </span>
                </div>
                {!isSelectedDateToday ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-2.5 py-1 rounded-lg bg-[#5A0F12] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#430B0D] transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    JUMP TO TODAY
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-[#FDF9EE] text-[#854D0E] border border-[#FDE047] text-[10px] font-bold uppercase tracking-wider">
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
                  className="h-9 w-full border-[#E2DDD5] text-xs font-semibold text-[#242424] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E]"
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
                  className="h-9 w-full border-[#E2DDD5] text-xs font-semibold text-[#242424] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E] disabled:opacity-40"
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
                  className="h-9 px-3 border-[#E2DDD5] text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Day</span>
                </Button>

                <span className="font-display font-bold text-sm sm:text-base text-[#242424] px-2 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#C99A2E]" />
                  <span>{formattedSelectedDate}</span>
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSelectedDateToday}
                  onClick={() => navigateDate(1)}
                  className="h-9 px-3 border-[#E2DDD5] text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E] disabled:opacity-40"
                >
                  <span>Next Day</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {isSelectedDateToday ? (
                <span className="px-2.5 py-1 rounded-lg bg-[#FDF9EE] text-[#854D0E] border border-[#FDE047] text-[10px] font-bold uppercase tracking-wider">
                  TODAY
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-1 rounded-lg bg-[#5A0F12] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#430B0D] transition-colors cursor-pointer"
                >
                  JUMP TO TODAY
                </button>
              )}
            </div>
          </div>

          {/* Wage Summary Card (Kishore's Card with 4 Distinct Colored Status Tiles) */}
          <div className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-2xl shadow-xs relative overflow-hidden">
            {/* Background illustration for Today's Wages Paid */}
            <img
              src={totalWagesBanner}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none opacity-90"
            />

            {/* Header: Today's Wages Paid + Big Amount */}
            <div className="relative z-10 p-4 sm:p-5">
              <div className="text-xs sm:text-sm font-semibold text-[#166534]">
                {isSelectedDateToday ? "Today's Wages Paid" : `Wages Paid on ${formattedSelectedDate}`}
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tabular-nums text-[#0E2920] mt-0.5 tracking-tight">
                {formatINR(dailySummary.totalPaid)}
              </div>
            </div>

            {/* 4 Stats Grid in a Single Line at the Bottom */}
            <div className="relative z-10 grid grid-cols-4 border-t border-[#E8E4DC] bg-white/80 backdrop-blur-xs divide-x divide-[#E8E4DC] py-3 px-2 sm:px-3">
              {/* 1. Total Logged */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center shrink-0">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#1E3A8A] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.totalEntries}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] leading-tight truncate">
                  Total Logged
                </div>
                <div className="text-[9px] text-[#8C867E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 2. Full Days */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#E8F8EE] text-[#1E7E34] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#1E7E34] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.fullDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] leading-tight truncate">
                  Full Days
                </div>
                <div className="text-[9px] text-[#8C867E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 3. Half Days */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FEF9E7] text-[#B45309] flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="font-extrabold text-[#B45309] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.halfDays}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] leading-tight truncate">
                  Half Days
                </div>
                <div className="text-[9px] text-[#8C867E] leading-none mt-0.5">Workers</div>
              </div>

              {/* 4. Absent */}
              <div className="px-1.5 sm:px-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-[#991B1B] text-xs sm:text-sm tabular-nums leading-none">
                    {dailySummary.absent}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#242424] leading-tight truncate">
                  Absent
                </div>
                <div className="text-[9px] text-[#8C867E] leading-none mt-0.5">Workers</div>
              </div>
            </div>
          </div>

          {/* DAILY MUSTER SHEET (DESKTOP & MOBILE) */}
          {isWagesLoading ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 text-center text-xs text-[#6B6B6B]">
              Loading daily wages...
            </div>
          ) : dayEntries.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center mx-auto text-[#6B6B6B]">
                <CalendarIcon className="w-6 h-6 text-[#C99A2E]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#242424] font-display">
                  No wage entries for this day.
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-sm mx-auto">
                  Mark attendance and daily cash payments for site laborers who worked on {formattedSelectedDate}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-xs border border-[#E8E4DC] rounded-2xl overflow-hidden shadow-xs">
              {/* Header */}
              <div className="px-4 sm:px-5 py-3.5 bg-[#FAF8F5] border-b border-[#EFECE6] flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-[#3E1012] font-display">
                  Laborers ({dayEntries.length})
                </h3>

              </div>

              {/* DESKTOP TABLE (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFECE6] bg-[#FAF8F5]/50 text-[11px] font-bold text-[#8C867E] uppercase tracking-wider">
                      <th className="py-3 px-5">Laborer / Project</th>
                      <th className="py-3 px-4">Attendance</th>
                      <th className="py-3 px-5 text-right">Paid Amount</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6] text-sm text-[#242424]">
                    {dayEntries.map((wage) => {
                      const emp = employees.find((e) => e.id === wage.employee_id);
                      const laborerName = wage.employee?.name || emp?.name || 'Laborer';
                      const proj = projects.find((p) => p.id === wage.project_id);
                      const projectName = (wage.project?.name && wage.project.name !== 'Project')
                        ? wage.project.name
                        : proj?.name || 'General Site Work';

                      return (
                        <tr key={wage.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F9ECEB] text-[#5A0F12] flex items-center justify-center shrink-0">
                                <HardHat className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#242424] font-display truncate">{laborerName}</div>
                                <div className="flex items-center gap-1 text-xs text-[#8C867E] mt-0.5">
                                  <Building2 className="w-3 h-3 text-[#A8A29E]" />
                                  <span className="truncate">{projectName}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">{renderAttendancePill(wage.payable_units)}</td>

                          <td className="py-3.5 px-5 text-right font-bold tabular-nums text-sm text-[#242424]">
                            {formatINR(wage.amount || 0)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(wage)}
                                className="font-medium text-xs text-[#6B6B6B] hover:text-[#4A0E0E] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit wage entry"
                                aria-label={`Edit wage for ${laborerName}`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWage(wage, laborerName)}
                                disabled={deleteWageMutation.isPending}
                                className="font-medium text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
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

              {/* MOBILE STACKED CARDS (< 768px) */}
              <div className="md:hidden space-y-3">
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
                      className="bg-white border border-[#E8E4DC] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div>
                        {/* Header: Laborer Avatar/Icon, Name, Attendance Badge */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center shrink-0">
                              <HardHat className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#242424] font-display truncate">
                                {laborerName}
                              </h4>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {renderAttendancePill(wage.payable_units)}
                          </div>
                        </div>

                        {/* Details: Project Name */}
                        <div className="mt-3 space-y-1.5 text-xs text-[#6B6B6B] pl-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                            <span className="truncate">{projectName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar: Edit, Delete, Amount Paid */}
                      <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(wage)}
                            className="font-medium text-[#6B6B6B] hover:text-[#4A0E0E] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteWage(wage, laborerName)}
                            disabled={deleteWageMutation.isPending}
                            className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Delete wage for ${laborerName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium mr-1.5">Paid:</span>
                          <span className="font-bold text-sm sm:text-base text-[#242424] font-sans tabular-nums">
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
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs">
            {/* Mobile Layout (sm:hidden) */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              <div className="flex items-center justify-between bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="w-4 h-4 text-[#C99A2E] shrink-0" />
                  <span className="font-display font-bold text-sm text-[#242424] truncate">
                    {weekRange.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWeekReferenceDate(todayStr)}
                  className="text-xs text-[#4A0E0E] font-semibold hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Current Week
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                  className="h-9 w-full border-[#E2DDD5] text-xs font-semibold text-[#242424] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Week</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                  className="h-9 w-full border-[#E2DDD5] text-xs font-semibold text-[#242424] cursor-pointer justify-center gap-1 hover:border-[#4A0E0E]"
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
                  className="h-9 px-3 border-[#E2DDD5] text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Week</span>
                </Button>

                <span className="font-display font-bold text-sm sm:text-base text-[#242424] px-2 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#C99A2E]" />
                  <span>{weekRange.label}</span>
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                  className="h-9 px-3 border-[#E2DDD5] text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E]"
                >
                  <span>Next Week</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setWeekReferenceDate(todayStr)}
                className="text-xs text-[#4A0E0E] font-semibold hover:underline cursor-pointer"
              >
                Current Week
              </button>
            </div>
          </div>

          {/* Weekly Operational Summary Card (Matches Daily Wages Design) */}
          <div className="bg-white border border-[#E8E4DC] rounded-3xl p-5 sm:p-6 shadow-2xs">
            {/* Header: Icon + "Weekly wages disbursed" + Week Range Pill */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FBF0F0] text-[#4A0E0E] flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="leading-tight min-w-0">
                  <span className="text-sm sm:text-base font-semibold text-[#242424] block">
                    Weekly wages disbursed
                  </span>
                  <span className="text-xs text-[#6B6B6B] block mt-0.5 sm:hidden font-medium">
                    {weekRange.label}
                  </span>
                </div>
              </div>

              <div className="hidden sm:inline-flex px-3.5 py-1 rounded-full bg-[#FAF7F0] border border-[#E8E4DC] text-[#6B6B6B] text-xs sm:text-sm font-semibold tracking-wide shrink-0">
                {weekRange.label}
              </div>
            </div>

            {/* Big Currency Amount */}
            <div className="text-3xl sm:text-4xl lg:text-[40px] font-bold font-sans text-[#1F1F1F] tracking-tight mt-3 sm:mt-4 mb-4 sm:mb-5 tabular-nums">
              {formatINR(weeklyLaborerAggregation.grandWeeklyTotal)}
            </div>

            {/* Bottom 2 Boxes: Active Laborers & Total Entries (Both in beige/stone #F4F1EA matching Half day / Absent) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Active Laborers Tile */}
              <div className="bg-[#F4F1EA] rounded-2xl p-3.5 sm:p-4 transition-all">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-sans text-[#383838] tabular-nums">
                  {weeklyLaborerAggregation.rows.length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#6B6B6B] mt-1">
                  Active Laborers
                </div>
              </div>

              {/* Total Entries Tile */}
              <div className="bg-[#F4F1EA] rounded-2xl p-3.5 sm:p-4 transition-all">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-sans text-[#383838] tabular-nums">
                  {weeklyEntries.length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#6B6B6B] mt-1">
                  Total Entries
                </div>
              </div>
            </div>
          </div>

          {/* WEEKLY TABLE (DESKTOP >= 768px) */}
          {weeklyLaborerAggregation.rows.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] rounded-xl p-8 sm:p-12 text-center space-y-2 shadow-xs">
              <CalendarIcon className="w-8 h-8 text-[#99958F] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[#242424] font-display">
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
                            <div className="font-bold text-sm text-[#242424] font-display">{row.name}</div>
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
                        <td className="py-3 px-4 text-right font-display text-base text-[#4A0E0E] tabular-nums">
                          {formatINR(weeklyLaborerAggregation.grandWeeklyTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* MOBILE WEEKLY STACKED CARDS (< 768px) */}
              <div className="md:hidden space-y-3">
                {weeklyLaborerAggregation.rows.map((row) => {
                  const isExpanded = expandedWeeklyLaborerId === row.employeeId;

                  return (
                    <div
                      key={row.employeeId}
                      className="bg-white border border-[#E8E4DC] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div>
                        {/* Header: Laborer Avatar/Icon, Name, Days Badge */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center shrink-0">
                              <HardHat className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#242424] font-display truncate">
                                {row.name}
                              </h4>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F8EE] text-[#1E7E34]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34]" />
                              <span>{row.fullDays + row.halfDays} Days</span>
                            </span>
                          </div>
                        </div>

                        {/* Details: Sites worked and Attendance pills */}
                        <div className="mt-3 space-y-2 text-xs text-[#6B6B6B] pl-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                            <span className="truncate">
                              {row.projects.size > 0 ? Array.from(row.projects).join(', ') : 'General Site Work'}
                            </span>
                          </div>

                          {/* Attendance breakdown pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#86EFAC]/70 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                              <span>{row.fullDays} Full</span>
                            </span>

                            {row.halfDays > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047]/70 text-[11px] font-semibold">
                                <Clock className="w-3 h-3 text-[#854D0E]" />
                                <span>{row.halfDays} Half</span>
                              </span>
                            )}

                            {row.absentDays > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]/70 text-[11px] font-semibold">
                                <Ban className="w-3 h-3 text-[#991B1B]" />
                                <span>{row.absentDays} Absent</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar: Accordion Toggle & Amount Paid */}
                      <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedWeeklyLaborerId(isExpanded ? null : row.employeeId)}
                          className="font-medium text-[#6B6B6B] hover:text-[#4A0E0E] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Daily Details' : 'View Daily Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium mr-1.5">Paid:</span>
                          <span className="font-bold text-sm sm:text-base text-[#242424] font-sans tabular-nums">
                            {formatINR(row.totalPaid)}
                          </span>
                        </div>
                      </div>

                      {/* 7-Day Expanded Breakdown */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#F0EAE1] space-y-2">
                          <div className="text-[10.5px] font-bold text-[#6B6B6B] uppercase tracking-wider pl-1">
                            7-Day Daily Breakdown
                          </div>
                          <div className="bg-[#FAF7F0] border border-[#E8E4DC] rounded-xl p-2.5 space-y-1.5 text-xs animate-in fade-in duration-100">
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
                                <div key={dISO} className="flex items-center justify-between py-1 border-b border-[#E8E4DC]/60 last:border-0">
                                  <span className="font-medium text-[#6B6B6B]">{dayName}</span>
                                  {dayRec ? (
                                    <span className="font-semibold text-[#242424] tabular-nums">
                                      {dayRec.projectName} — <span className={dayRec.status === 'Absent' ? 'text-[#991B1B]' : dayRec.status === 'Half Day' ? 'text-[#854D0E]' : 'text-[#166534]'}>{dayRec.status}</span> ({formatINR(dayRec.amount)})
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
