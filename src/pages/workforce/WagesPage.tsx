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
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/Button';
import { useWages, useEmployees, useDeleteDailyWage } from '@/hooks/useWorkforce';
import { useProjects } from '@/hooks/useProjects';
import { formatINR } from '@/lib/utils';
import { SimpleDailyWageModal } from '@/components/business/SimpleDailyWageModal';
import { LaborersDrawer } from '@/components/business/LaborersDrawer';
import { SlidingSegmentedControl, type SegmentOption } from '@/components/ui/SlidingSegmentedControl';
import { SplitText } from '@/components/ui/SplitText';
import type { DailyWage, AttendanceStatus } from '@/types/workforce';

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
  const [editingWage, setEditingWage] = useState<DailyWage | null>(null);

  // Segment options for Daily Muster vs Weekly Wages
  const wageViewOptions = useMemo<SegmentOption<'daily' | 'weekly'>[]>(
    () => [
      {
        id: 'daily',
        label: 'Daily Muster',
        icon: <CalendarIcon className="w-4 h-4 text-[#C99A2E]" />,
        activeColorClass: 'text-[#4A0E0E]',
      },
      {
        id: 'weekly',
        label: 'Weekly Wages',
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

  const handleDeleteWage = (wage: DailyWage, laborerName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete this wage entry of ${formatINR(wage.amount || 0)} for ${laborerName}?`
      )
    ) {
      deleteWageMutation.mutate(
        { wageId: wage.id, attendanceId: wage.attendance_id || undefined },
        {
          onSuccess: () => {
            setToastMessage(`Wage entry for ${laborerName} deleted successfully.`);
          },
        }
      );
    }
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
      setSelectedDate(`${y}-${m}-${day}`);
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
      code: string;
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
      const code = wage.employee?.employee_code || emp?.employee_code || 'EMP';
      const amount = Number(wage.amount || 0);

      const status: AttendanceStatus =
        wage.payable_units === 0.5 ? 'Half Day' : wage.payable_units === 0 ? 'Absent' : 'Present';

      const proj = projects.find((p) => p.id === wage.project_id);
      const projectName = wage.project?.name || proj?.name || 'Site Work';

      let row = map.get(empId);
      if (!row) {
        row = {
          employeeId: empId,
          name,
          code,
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

      {/* Top Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SplitText
            text="Wages"
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

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Laborers Directory Trigger */}
          <ActionButton
            variant="outline"
            icon={<Users className="w-4 h-4 text-[#4A0E0E]" />}
            label="Laborers Directory"
            onClick={() => setIsLaborersDrawerOpen(true)}
          />

          {/* Primary Action Button */}
          {activeTab === 'daily' && (
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              label="Add Wage Entry"
              onClick={() => {
                setEditingWage(null);
                setIsAddWageModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* View Switcher: [ Daily Muster ] [ Weekly Wages ] */}
      <div className="mb-6 overflow-x-auto no-scrollbar">
        <SlidingSegmentedControl
          options={wageViewOptions}
          value={activeTab}
          onChange={setActiveTab}
          size="md"
          ariaLabel="Wages view"
        />
      </div>

      {/* ========================================================= */}
      {/* 1. DAILY VIEW */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div key={activeTab} className="space-y-4 animate-filter-slide">
          {/* Date Navigator Bar */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigateDate(-1)}
                className="h-9 px-3 border-[#E2DDD5] text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isSelectedDateToday ? 'Yesterday' : 'Previous Day'}</span>
              </Button>

              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <span className="font-display font-bold text-sm sm:text-base text-[#242424] px-2 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#C99A2E]" />
                    <span>{formattedSelectedDate}</span>
                  </span>
                  {/* Invisible native date picker over button for instant jump */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Choose a specific date"
                    aria-label="Choose a specific date"
                  />
                </div>

                {isSelectedDateToday ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#FDF9EE] text-[#854D0E] border border-[#FDE047] text-[10px] font-bold uppercase tracking-wider">
                    Today
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-xs text-[#4A0E0E] font-semibold hover:underline cursor-pointer"
                  >
                    Jump to Today
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigateDate(1)}
                className="h-9 px-3 border-[#E2DDD5] text-xs font-medium cursor-pointer gap-1 hover:border-[#4A0E0E]"
              >
                <span>{selectedDate === todayStr ? 'Tomorrow' : 'Next Day'}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Action when in mobile */}
            <div className="sm:hidden w-full pt-1 border-t border-[#E2DDD5] flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingWage(null);
                  setIsAddWageModalOpen(true);
                }}
                className="w-full h-9 bg-[#4A0E0E] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Wage Entry for this Day
              </Button>
            </div>
          </div>

          {/* Daily Operational Summary Bar */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#6B6B6B]">
                {isSelectedDateToday ? "Today's Wages Paid" : `Wages Paid on ${formattedSelectedDate}`}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display tabular-nums text-[#242424] mt-0.5">
                {formatINR(dailySummary.totalPaid)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B6B] border-t sm:border-t-0 sm:border-l border-[#E2DDD5] pt-3 sm:pt-0 sm:pl-6">
              <div>
                <span className="block text-[11px] font-semibold text-[#6B6B6B] uppercase">Total Logged</span>
                <span className="font-bold text-[#242424] text-sm tabular-nums">
                  {dailySummary.totalEntries} Workers
                </span>
              </div>
              <span className="text-[#E2DDD5] hidden sm:inline">•</span>
              <div>
                <span className="block text-[11px] font-semibold text-[#6B6B6B] uppercase">Full Days</span>
                <span className="font-bold text-[#166534] text-sm tabular-nums">{dailySummary.fullDays}</span>
              </div>
              <span className="text-[#E2DDD5] hidden sm:inline">•</span>
              <div>
                <span className="block text-[11px] font-semibold text-[#6B6B6B] uppercase">Half Days</span>
                <span className="font-bold text-[#854D0E] text-sm tabular-nums">{dailySummary.halfDays}</span>
              </div>
              <span className="text-[#E2DDD5] hidden sm:inline">•</span>
              <div>
                <span className="block text-[11px] font-semibold text-[#6B6B6B] uppercase">Absent</span>
                <span className="font-bold text-[#991B1B] text-sm tabular-nums">{dailySummary.absent}</span>
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
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingWage(null);
                    setIsAddWageModalOpen(true);
                  }}
                  className="h-10 px-5 bg-[#4A0E0E] hover:bg-[#380A0A] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#C99A2E]" />
                  <span>Add Wage Entry</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* DESKTOP TABLE (>= 768px) */}
              <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#F7F5F0] border-b border-[#E2DDD5] flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A0E0E]">
                    Daily Muster Matrix ({dayEntries.length} Recorded)
                  </h3>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2DDD5] bg-[#FFFFFF] text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                      <th className="py-3 px-5">Laborer</th>
                      <th className="py-3 px-4">Project / Site</th>
                      <th className="py-3 px-4">Attendance Status</th>
                      <th className="py-3 px-5 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD5] text-sm text-[#242424]">
                    {dayEntries.map((wage) => {
                      const emp = employees.find((e) => e.id === wage.employee_id);
                      const laborerName = wage.employee?.name || emp?.name || 'Laborer';
                      const laborerCode = wage.employee?.employee_code || emp?.employee_code || 'EMP';
                      const proj = projects.find((p) => p.id === wage.project_id);
                      const projectName = wage.project?.name || proj?.name || 'General Site Work';

                      return (
                        <tr key={wage.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#242424] font-display">{laborerName}</span>
                              <span className="px-1.5 py-0.5 rounded-sm bg-[#F3EFEA] text-[10px] font-semibold text-[#4A0E0E] tabular-nums">
                                {laborerCode}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-[#242424]">
                              <Building2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                              <span>{projectName}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">{renderAttendancePill(wage.payable_units)}</td>

                          <td className="py-3.5 px-5 text-right font-bold tabular-nums text-sm text-[#242424]">
                            {formatINR(wage.amount || 0)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(wage)}
                                className="p-1.5 text-[#6B6B6B] hover:text-[#4A0E0E] hover:bg-[#F7EFEF] rounded-md transition-colors cursor-pointer"
                                title="Edit wage entry"
                                aria-label={`Edit wage for ${laborerName}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWage(wage, laborerName)}
                                disabled={deleteWageMutation.isPending}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Delete wage entry"
                                aria-label={`Delete wage for ${laborerName}`}
                              >
                                <Trash2 className="w-4 h-4" />
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
              <div className="md:hidden space-y-2.5">
                {dayEntries.map((wage) => {
                  const emp = employees.find((e) => e.id === wage.employee_id);
                  const laborerName = wage.employee?.name || emp?.name || 'Laborer';
                  const laborerCode = wage.employee?.employee_code || emp?.employee_code || 'EMP';
                  const proj = projects.find((p) => p.id === wage.project_id);
                  const projectName = wage.project?.name || proj?.name || 'General Site Work';

                  return (
                    <div
                      key={wage.id}
                      className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#242424] font-display">{laborerName}</h4>
                            <span className="px-1.5 py-0.5 rounded-sm bg-[#F3EFEA] text-[10px] font-semibold text-[#4A0E0E] tabular-nums">
                              {laborerCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#6B6B6B] mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{projectName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(wage)}
                            className="p-1.5 text-[#6B6B6B] hover:text-[#4A0E0E] rounded-md transition-colors cursor-pointer"
                            aria-label={`Edit ${laborerName}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWage(wage, laborerName)}
                            disabled={deleteWageMutation.isPending}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            aria-label={`Delete wage for ${laborerName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E2DDD5]">
                        <div>{renderAttendancePill(wage.payable_units)}</div>
                        <div className="text-right">
                          <span className="block text-[10px] font-semibold text-[#6B6B6B] uppercase">Amount Paid</span>
                          <span className="font-bold text-base tabular-nums text-[#242424]">
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
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
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

          {/* Weekly Operational Summary Banner */}
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#6B6B6B]">Weekly Total Wages Disbursed</div>
              <div className="text-2xl sm:text-3xl font-bold font-display tabular-nums text-[#242424] mt-0.5">
                {formatINR(weeklyLaborerAggregation.grandWeeklyTotal)}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#6B6B6B] border-t sm:border-t-0 sm:border-l border-[#E2DDD5] pt-3 sm:pt-0 sm:pl-6">
              <div>
                <span className="block text-[11px] font-semibold text-[#6B6B6B] uppercase">Active Laborers</span>
                <span className="font-bold text-[#242424] text-sm tabular-nums">
                  {weeklyLaborerAggregation.rows.length}
                </span>
              </div>
              <span className="text-[#E2DDD5]">•</span>
              <div>
                <span className="block text-[11px] font-semibold text-[#6B6B6B] uppercase">Total Entries</span>
                <span className="font-bold text-[#242424] text-sm tabular-nums">
                  {weeklyEntries.length}
                </span>
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
                  Go to Daily Muster
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
                            <div className="text-[11px] text-[#6B6B6B] font-mono">{row.code}</div>
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
                      className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#242424] font-display">{row.name}</h4>
                            <span className="px-1.5 py-0.5 rounded-sm bg-[#F3EFEA] text-[10px] font-semibold text-[#4A0E0E] tabular-nums">
                              {row.code}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">
                            {row.projects.size > 0 ? Array.from(row.projects).join(', ') : 'No sites recorded'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="block text-[10px] font-semibold text-[#6B6B6B] uppercase">Weekly Total</span>
                          <span className="font-bold text-base tabular-nums text-[#242424]">
                            {formatINR(row.totalPaid)}
                          </span>
                        </div>
                      </div>

                      {/* Attendance breakdown pills */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#166534] border border-[#86EFAC] rounded-sm font-semibold">
                          {row.fullDays} Full
                        </span>
                        <span className="px-2 py-0.5 bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047] rounded-sm font-semibold">
                          {row.halfDays} Half
                        </span>
                        <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-sm font-semibold">
                          {row.absentDays} Absent
                        </span>
                      </div>

                      {/* Accordion trigger for 7-day breakdown */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedWeeklyLaborerId(isExpanded ? null : row.employeeId)
                        }
                        className="w-full pt-2 border-t border-[#E2DDD5] flex items-center justify-between text-xs text-[#4A0E0E] font-semibold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Daily Breakdown' : 'View Daily Breakdown'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="bg-[#F7F5F0] rounded-lg p-2.5 space-y-1.5 text-xs animate-in fade-in duration-100">
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
                              <div key={dISO} className="flex items-center justify-between py-1 border-b border-[#E2DDD5]/70 last:border-0">
                                <span className="font-medium text-[#6B6B6B]">{dayName}</span>
                                {dayRec ? (
                                  <span className="font-semibold text-[#242424] tabular-nums">
                                    {dayRec.projectName} — {dayRec.status} ({formatINR(dayRec.amount)})
                                  </span>
                                ) : (
                                  <span className="text-[#99958F] italic">No work recorded</span>
                                )}
                              </div>
                            );
                          })}
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
        onClose={() => setIsLaborersDrawerOpen(false)}
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
    </PageContainer>
  );
}
