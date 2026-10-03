import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users2,
  Save,
  Check,
  Building2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useEmployees,
  useAttendanceForDate,
  useSaveAttendanceBatch,
  getTodayDateString,
  type AttendanceBatchItem,
} from '@/hooks/useWorkforce';
import type { AttendanceStatus } from '@/types/workforce';

export function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load all active employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees({
    status: 'active',
  });

  // Load existing attendance for date
  const { data: existingAttendance = [], isLoading: isLoadingAttendance } = useAttendanceForDate(
    selectedDate,
    selectedProject !== 'all' ? selectedProject : undefined
  );

  const saveBatchMutation = useSaveAttendanceBatch();

  // Local state map: employeeId -> status ('Present' | 'Half Day' | 'Absent' | undefined)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Sync existing attendance when records load or date changes
  useEffect(() => {
    const newMap: Record<string, AttendanceStatus> = {};
    const newNotes: Record<string, string> = {};

    existingAttendance.forEach((rec) => {
      newMap[rec.employee_id] = rec.status;
      if (rec.notes) {
        newNotes[rec.employee_id] = rec.notes;
      }
    });

    setAttendanceMap(newMap);
    setNotesMap(newNotes);
    setNotification(null);
  }, [existingAttendance, selectedDate]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate);
    const today = getTodayDateString();
    const isToday = selectedDate === today;

    const formatted = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);

    return isToday ? `Today (${formatted})` : formatted;
  }, [selectedDate]);

  // Filtered employees for this site
  const visibleEmployees = useMemo(() => {
    if (selectedProject === 'all') return employees;
    return employees.filter(
      (e) => !e.assigned_project_id || e.assigned_project_id === selectedProject
    );
  }, [employees, selectedProject]);

  // Action: Mark single employee
  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [employeeId]: status,
    }));
  };

  // Action: Fast "MARK ALL PRESENT" (Supervisor rapid 1-click workflow)
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = { ...attendanceMap };
    visibleEmployees.forEach((emp) => {
      // Only set if unmarked or change all to present
      updated[emp.id] = 'Present';
    });
    setAttendanceMap(updated);
    setNotification({
      type: 'success',
      message: `Marked ${visibleEmployees.length} employees as Present. Adjust exceptions if any, then click Save.`,
    });
  };

  // Derived counts
  const presentCount = useMemo(
    () => visibleEmployees.filter((e) => attendanceMap[e.id] === 'Present').length,
    [visibleEmployees, attendanceMap]
  );
  const halfDayCount = useMemo(
    () => visibleEmployees.filter((e) => attendanceMap[e.id] === 'Half Day').length,
    [visibleEmployees, attendanceMap]
  );
  const absentCount = useMemo(
    () => visibleEmployees.filter((e) => attendanceMap[e.id] === 'Absent').length,
    [visibleEmployees, attendanceMap]
  );
  const unmarkedCount = useMemo(
    () => visibleEmployees.filter((e) => !attendanceMap[e.id]).length,
    [visibleEmployees, attendanceMap]
  );

  // Save Attendance Action
  const handleSaveAttendance = async () => {
    setNotification(null);

    const entriesToSave: AttendanceBatchItem[] = [];
    visibleEmployees.forEach((emp) => {
      const status = attendanceMap[emp.id];
      if (status) {
        entriesToSave.push({
          employee_id: emp.id,
          status,
          project_id: emp.assigned_project_id || (selectedProject !== 'all' ? selectedProject : null),
          notes: notesMap[emp.id] || null,
        });
      }
    });

    if (entriesToSave.length === 0) {
      setNotification({
        type: 'error',
        message: 'No employee attendance statuses marked to save.',
      });
      return;
    }

    try {
      await saveBatchMutation.mutateAsync({
        date: selectedDate,
        entries: entriesToSave,
      });

      setNotification({
        type: 'success',
        message: `Muster roll saved successfully! ${entriesToSave.length} workers recorded for ${selectedDate}.`,
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Attendance could not be saved. Please try again.',
      });
    }
  };

  const isSaving = saveBatchMutation.isPending;
  const isLoading = isLoadingEmployees || isLoadingAttendance;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Site Attendance Muster"
        subtitle="Rapid one-touch daily labor shift attendance logging and daily wage calculation"
        badge={
          <Badge variant="primary" className="gap-1">
            <Users2 className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span>Field Muster</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/employees">
              <Button variant="outline" size="sm" className="h-9">
                Employees Roster
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              disabled={visibleEmployees.length === 0}
              className="gap-1.5 h-9 font-semibold text-[#1E6B37] border-[#1E6B37]/30 hover:bg-[#EAF5EE]"
            >
              <Sparkles className="w-4 h-4 text-[#1E6B37]" />
              <span>Mark All Present</span>
            </Button>
          </div>
        }
      />

      {/* Date Navigation & Site Filter Control Bar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between select-none">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            className="h-10 w-10 p-0 shrink-0"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-[#242424]" />
          </Button>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg">
            <div className="flex items-center gap-1.5 min-w-0">
              <CalendarIcon className="w-4 h-4 text-[#4A0E0E] shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-[#242424] font-heading truncate">
                {formattedDate}
              </span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Attendance Date"
              className="w-6 sm:w-auto bg-transparent text-xs font-mono text-[#6B6B6B] focus:outline-none cursor-pointer shrink-0"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="h-10 w-10 p-0 shrink-0"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 text-[#242424]" />
          </Button>

          {selectedDate !== getTodayDateString() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="h-10 px-3 text-xs font-semibold shrink-0"
            >
              Today
            </Button>
          )}
        </div>

        {/* Site Filter & Quick Action */}
        <div className="flex items-center gap-2">
          <div className="flex-1 sm:w-64 flex items-center gap-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg px-3 py-2 text-xs">
            <Building2 className="w-4 h-4 text-[#6B6B6B] shrink-0" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-semibold text-[#242424] focus:outline-none"
            >
              <option value="all">All Assigned Sites</option>
              <option value="proj-01">Annamalai Residential Villa</option>
              <option value="proj-02">Meenakshi Commercial Complex</option>
            </select>
          </div>

          {/* Desktop Mark All Present Button */}
          <Button
            variant="outline"
            onClick={handleMarkAllPresent}
            disabled={visibleEmployees.length === 0}
            className="hidden md:flex items-center gap-2 h-10 px-4 text-xs font-bold text-[#1E6B37] border-[#1E6B37]/40 hover:bg-[#EAF5EE]"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Present</span>
          </Button>
        </div>
      </div>

      {/* Live Notification Bar */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-[#EAF5EE] border-[#1E6B37]/30 text-[#1E6B37]'
              : 'bg-[#F7EFEF] border-[#9E2A2B]/30 text-[#9E2A2B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline font-medium opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Attendance Operational Metrics Banner */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3.5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2 bg-[#F7F5F0] rounded-lg">
          <div className="text-[11px] text-[#6B6B6B] font-medium uppercase tracking-wider">
            Total Crew
          </div>
          <div className="text-xl font-bold text-[#242424] font-heading tabular-nums mt-0.5">
            {visibleEmployees.length}
          </div>
        </div>

        <div className="p-2 bg-[#EAF5EE] rounded-lg">
          <div className="text-[11px] text-[#1E6B37] font-semibold uppercase tracking-wider">
            Present (P)
          </div>
          <div className="text-xl font-bold text-[#1E6B37] font-heading tabular-nums mt-0.5">
            {presentCount}
          </div>
        </div>

        <div className="p-2 bg-[#FEF5E7] rounded-lg">
          <div className="text-[11px] text-[#B86E00] font-semibold uppercase tracking-wider">
            Half Day (H)
          </div>
          <div className="text-xl font-bold text-[#B86E00] font-heading tabular-nums mt-0.5">
            {halfDayCount}
          </div>
        </div>

        <div className="p-2 bg-[#F7EFEF] rounded-lg">
          <div className="text-[11px] text-[#9E2A2B] font-semibold uppercase tracking-wider">
            Absent (A)
          </div>
          <div className="text-xl font-bold text-[#9E2A2B] font-heading tabular-nums mt-0.5">
            {absentCount}
          </div>
        </div>
      </div>

      {/* Employee Muster Rows */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white border border-[#E2DDD5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : visibleEmployees.length === 0 ? (
        <div className="p-8 bg-white border border-[#E2DDD5] rounded-xl text-center space-y-3">
          <Users2 className="w-8 h-8 text-[#6B6B6B] mx-auto" />
          <h3 className="text-sm font-bold text-[#242424]">No active employees for this selection</h3>
          <p className="text-xs text-[#6B6B6B]">
            Add active employees to your roster to mark shift attendance.
          </p>
          <Link to="/employees/new">
            <Button variant="primary" size="sm">
              Add Employee
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5 pb-28 md:pb-6">
          {visibleEmployees.map((emp) => {
            const currentStatus = attendanceMap[emp.id];
            return (
              <div
                key={emp.id}
                className={`bg-white border rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  currentStatus === 'Present'
                    ? 'border-[#1E6B37]/40 bg-[#F4FAF6]'
                    : currentStatus === 'Half Day'
                    ? 'border-[#B86E00]/40 bg-[#FFFDF7]'
                    : currentStatus === 'Absent'
                    ? 'border-[#9E2A2B]/40 bg-[#FDF7F7]'
                    : 'border-[#E2DDD5]'
                }`}
              >
                {/* Employee Info: Large touch-friendly label */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#4A0E0E] bg-[#4A0E0E]/10 px-1.5 py-0.5 rounded">
                      {emp.employee_code}
                    </span>
                    <h4 className="font-bold text-base text-[#242424] font-heading truncate">
                      {emp.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mt-1 flex-wrap">
                    <span className="font-medium text-[#242424]">{emp.worker_type}</span>
                    <span>•</span>
                    <span className="tabular-nums">
                      Rate: <strong>₹{emp.daily_wage || 0}</strong>/day
                    </span>
                    {emp.assigned_project_name && (
                      <>
                        <span>•</span>
                        <span className="truncate">{emp.assigned_project_name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 1-Touch Fast Attendance Button Group (Touch targets 48px minimum) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-stretch sm:self-auto">
                  {/* PRESENT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(emp.id, 'Present')}
                    className={`flex-1 sm:flex-none h-12 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all select-none active:scale-95 ${
                      currentStatus === 'Present'
                        ? 'bg-[#1E6B37] text-white shadow-sm ring-2 ring-[#1E6B37]/30'
                        : 'bg-[#F7F5F0] text-[#242424] border border-[#E2DDD5] hover:bg-[#EAF5EE] hover:text-[#1E6B37]'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Present</span>
                  </button>

                  {/* HALF DAY BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(emp.id, 'Half Day')}
                    className={`flex-1 sm:flex-none h-12 px-3 sm:px-4 rounded-xl text-sm font-bold flex items-center justify-center transition-all select-none active:scale-95 ${
                      currentStatus === 'Half Day'
                        ? 'bg-[#B86E00] text-white shadow-sm ring-2 ring-[#B86E00]/30'
                        : 'bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#FEF5E7] hover:text-[#B86E00]'
                    }`}
                  >
                    <span>Half Day</span>
                  </button>

                  {/* ABSENT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(emp.id, 'Absent')}
                    className={`flex-1 sm:flex-none h-12 px-3 sm:px-4 rounded-xl text-sm font-bold flex items-center justify-center transition-all select-none active:scale-95 ${
                      currentStatus === 'Absent'
                        ? 'bg-[#9E2A2B] text-white shadow-sm ring-2 ring-[#9E2A2B]/30'
                        : 'bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#F7EFEF] hover:text-[#9E2A2B]'
                    }`}
                  >
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop Sticky Save / Confirm Bar */}
      <div className="hidden md:flex bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-sm items-center justify-between mt-4">
        <div className="flex items-center gap-3 text-xs text-[#242424]">
          <span className="font-bold text-sm font-heading">{visibleEmployees.length} Workers</span>
          <span>•</span>
          <span className="font-bold text-[#1E6B37]">{presentCount} Present</span>
          <span>•</span>
          <span className="font-bold text-[#B86E00]">{halfDayCount} Half Day</span>
          <span>•</span>
          <span className="font-bold text-[#9E2A2B]">{absentCount} Absent</span>
          {unmarkedCount > 0 && (
            <>
              <span>•</span>
              <span className="text-[#6B6B6B] font-semibold">{unmarkedCount} Unmarked</span>
            </>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAttendance}
          disabled={isSaving || visibleEmployees.length === 0}
          className="h-11 px-8 font-bold gap-2 text-sm shadow-sm"
        >
          <Save className="w-4 h-4 text-[#C99A2E]" />
          <span>{isSaving ? 'Saving Muster...' : 'Save Site Attendance'}</span>
        </Button>
      </div>

      {/* Mobile Sticky Save Action Bar (360px & 390px Optimized - One-Hand Field Usable) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E2DDD5] p-3 shadow-2xl z-30 space-y-2">
        <div className="flex items-center justify-between text-xs px-1 text-[#242424]">
          <span className="font-bold">{visibleEmployees.length} Crew</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E6B37]">{presentCount} P</span>
            <span>•</span>
            <span className="font-bold text-[#B86E00]">{halfDayCount} H</span>
            <span>•</span>
            <span className="font-bold text-[#9E2A2B]">{absentCount} A</span>
            {unmarkedCount > 0 && (
              <>
                <span>•</span>
                <span className="text-[#6B6B6B]">{unmarkedCount} Unmarked</span>
              </>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAttendance}
          disabled={isSaving || visibleEmployees.length === 0}
          className="w-full h-12 font-bold text-base gap-2 shadow-md"
        >
          <Save className="w-5 h-5 text-[#C99A2E]" />
          <span>{isSaving ? 'Saving...' : 'SAVE ATTENDANCE'}</span>
        </Button>
      </div>
    </PageContainer>
  );
}
