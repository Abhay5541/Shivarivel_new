import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  CalendarDays,
  Plus,
  Phone,
  MapPin,
  CheckSquare,
  Building2,
  User,
  CalendarCheck2,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMyDay, useCompleteTask, useCompleteFollowUp } from '@/hooks/useMyDay';
import type { MyDayItem } from '@/types/dashboard';

type TabType = 'overdue' | 'today' | 'upcoming';
type FilterType = 'all' | 'task' | 'follow_up' | 'site_visit';

export function TodayPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  const { data, isLoading, isError, error, refetch } = useMyDay(selectedDate);
  const completeTaskMutation = useCompleteTask();
  const completeFollowUpMutation = useCompleteFollowUp();

  // Date manipulation helpers
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
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate);
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    const text = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);

    return isToday ? `Today (${text})` : text;
  }, [selectedDate]);

  // Current tab items
  const activeItems = useMemo(() => {
    if (!data) return [];
    let items: MyDayItem[] = [];
    if (activeTab === 'overdue') items = data.overdue || [];
    else if (activeTab === 'today') items = data.today || [];
    else if (activeTab === 'upcoming') items = data.upcoming || [];

    if (typeFilter !== 'all') {
      items = items.filter((item) => item.item_type === typeFilter);
    }
    return items;
  }, [data, activeTab, typeFilter]);

  const handleToggleTask = (task: MyDayItem) => {
    if (task.item_type === 'task') {
      completeTaskMutation.mutate({ taskId: task.item_id });
    } else if (task.item_type === 'follow_up') {
      completeFollowUpMutation.mutate({ followUpId: task.item_id });
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-64 bg-[#EFECE6] rounded-sm" />
          <div className="h-12 w-full bg-white border border-[#E2DDD5] rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white border border-[#E2DDD5] rounded-xl p-4"
              />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <ErrorState
          title="Unable to load My Day"
          description="Failed to load your operational agenda from the server."
          error={error}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const overdueCount = data.overdue?.length || 0;
  const todayCount = data.today?.length || 0;
  const upcomingCount = data.upcoming?.length || 0;

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="My Day"
        subtitle="Personal Operational Work Queue &amp; Field Execution"
        badge={
          <Badge variant="primary" className="gap-1">
            <CheckSquare className="w-3 h-3 text-[#C99A2E]" />
            <span>Operational Agenda</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/attendance">
              <Button variant="primary" size="sm" className="gap-1.5 h-9 font-semibold">
                <CalendarCheck2 className="w-4 h-4 text-[#C99A2E]" />
                <span>Mark Attendance</span>
              </Button>
            </Link>
            <Link to="/tasks">
              <Button variant="secondary" size="sm" className="gap-1.5 h-9">
                <Plus className="w-4 h-4 text-[#C99A2E]" />
                <span>Add Task</span>
              </Button>
            </Link>
            <Link to="/site-visits">
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <MapPin className="w-4 h-4 text-[#4A0E0E]" />
                <span>Site Visits</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Date Navigation & Control Bar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            className="h-9 w-9 p-0"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg">
            <CalendarIcon className="w-4 h-4 text-[#4A0E0E]" />
            <span className="text-xs sm:text-sm font-bold text-[#242424] font-heading">
              {formattedDate}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="h-9 w-9 p-0"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs font-semibold text-[#4A0E0E] hover:bg-[#F9F3E5]"
          >
            Jump to Today
          </Button>
        </div>

        {/* Item Type Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'task', label: 'Tasks' },
              { id: 'follow_up', label: 'Follow-ups' },
              { id: 'site_visit', label: 'Site Visits' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTypeFilter(filter.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                typeFilter === filter.id
                  ? 'bg-[#4A0E0E] text-white shadow-xs'
                  : 'bg-[#F7F5F0] text-[#6B6B6B] hover:bg-[#EFECE6]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Temporal Navigation Tabs (Strictly: Overdue, Today, Upcoming) */}
      <div className="flex border-b border-[#E2DDD5] mt-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'overdue'
              ? 'border-[#9E2A2B] text-[#9E2A2B]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#9E2A2B]" />
          <span>Overdue</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-bold ${
              overdueCount > 0
                ? 'bg-[#FCEEEE] text-[#9E2A2B] border border-[#9E2A2B]/20'
                : 'bg-[#F1F3F5] text-[#6B6B6B]'
            }`}
          >
            {overdueCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'today'
              ? 'border-[#C99A2E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-[#C99A2E]" />
          <span>Today</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-bold bg-[#FEF5E7] text-[#B86E00] border border-[#B86E00]/20">
            {todayCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'upcoming'
              ? 'border-[#4A0E0E] text-[#4A0E0E]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#242424]'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-[#6B6B6B]" />
          <span>Next 7 Days</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-bold bg-[#F1F3F5] text-[#6B6B6B]">
            {upcomingCount}
          </span>
        </button>
      </div>

      {/* Main Agenda List */}
      <div className="mt-4 space-y-3">
        {activeItems.length === 0 ? (
          <EmptyState
            icon={
              activeTab === 'today' ? (
                <CheckCircle2 className="w-6 h-6 text-[#1E6B37]" />
              ) : (
                <CalendarIcon className="w-6 h-6" />
              )
            }
            title={
              activeTab === 'today'
                ? 'All clear! No pending tasks or follow-ups for today'
                : activeTab === 'overdue'
                ? 'No overdue items'
                : 'No upcoming scheduled items'
            }
            description={
              activeTab === 'today'
                ? 'All site milestones and follow-ups are up to date. You can add new field tasks or review tomorrow\'s schedule.'
                : activeTab === 'overdue'
                ? 'Outstanding work is currently on track.'
                : 'No tasks, visits, or follow-ups scheduled for the next 7 days.'
            }
            actionLabel="+ Add New Task"
            onAction={() => {
              window.location.href = '/tasks';
            }}
            className="py-12"
          />
        ) : (
          <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden divide-y divide-[#E2DDD5]/70 shadow-xs">
            {activeItems.map((item) => {
              const isTask = item.item_type === 'task';
              const isFollowUp = item.item_type === 'follow_up';
              const isVisit = item.item_type === 'site_visit';
              const isCompleted = item.status === 'Completed';

              return (
                <div
                  key={item.item_id}
                  className={`p-4 sm:p-5 hover:bg-[#F7F5F0]/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    isCompleted ? 'opacity-60 bg-[#F7F5F0]/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Action Checkbox for tasks and follow-ups */}
                    {(isTask || isFollowUp) && (
                      <button
                        type="button"
                        onClick={() => handleToggleTask(item)}
                        disabled={isCompleted}
                        aria-label={`Mark "${item.title}" as completed`}
                        className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                          isCompleted
                            ? 'bg-[#1E6B37] border-[#1E6B37] text-white'
                            : 'border-[#E2DDD5] hover:border-[#4A0E0E] bg-white'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    )}

                    {isVisit && (
                      <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#4A0E0E] shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isTask
                              ? 'bg-[#F9F3E5] text-[#C99A2E]'
                              : isFollowUp
                              ? 'bg-[#FEF5E7] text-[#B86E00]'
                              : 'bg-[#F7F5F0] text-[#4A0E0E]'
                          }`}
                        >
                          {item.item_type.replace('_', ' ')}
                        </span>

                        {item.priority === 'Urgent' && (
                          <StatusBadge variant="overdue">Urgent</StatusBadge>
                        )}
                        {item.priority === 'High' && (
                          <StatusBadge variant="in-progress">High Priority</StatusBadge>
                        )}

                        <span className="text-xs text-[#6B6B6B] flex items-center gap-1 font-medium">
                          <CalendarIcon className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold font-heading leading-snug ${
                          isCompleted
                            ? 'line-through text-[#6B6B6B]'
                            : 'text-[#242424]'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.notes && (
                        <p className="text-xs text-[#6B6B6B] leading-relaxed">
                          {item.notes}
                        </p>
                      )}

                      {/* Associated Entity Metadata */}
                      <div className="flex items-center gap-4 text-xs text-[#6B6B6B] pt-1 flex-wrap">
                        {item.project_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#C99A2E]" />
                            <strong className="text-[#242424] font-medium">
                              {item.project_name}
                            </strong>
                          </span>
                        )}
                        {item.customer_name && (
                          <Link
                            to={item.customer_id ? `/customers/${item.customer_id}` : '/customers'}
                            className="flex items-center gap-1 hover:text-[#4A0E0E] hover:underline"
                          >
                            <User className="w-3.5 h-3.5 text-[#4A0E0E]" />
                            <span>Client: {item.customer_name}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Affordance / Action */}
                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    {isFollowUp && (
                      <a
                        href="tel:+919876543210"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EAF5EE] text-[#1E6B37] hover:bg-[#1E6B37] hover:text-white transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                    {isVisit && (
                      <Link
                        to="/site-visits"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4A0E0E] text-white hover:bg-[#380A0A] transition-colors"
                      >
                        <span>View Visit</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
