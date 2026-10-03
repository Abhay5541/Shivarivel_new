import type { ReportDatePreset, DateRange } from '@/types/reports';

/**
 * Format a Date object to YYYY-MM-DD string using local time
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for an approved report preset according to Monday -> Sunday week convention
 */
export function getDateRangeForPreset(preset: ReportDatePreset, customRange?: DateRange): DateRange {
  const today = new Date();

  switch (preset) {
    case 'today': {
      const d = toISODateString(today);
      return { startDate: d, endDate: d };
    }

    case 'this_week': {
      // Monday to Sunday (ISO week)
      const day = today.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        startDate: toISODateString(monday),
        endDate: toISODateString(sunday),
      };
    }

    case 'last_week': {
      // Previous week Monday to Sunday
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const prevMonday = new Date(today);
      prevMonday.setDate(today.getDate() + diffToMonday - 7);

      const prevSunday = new Date(prevMonday);
      prevSunday.setDate(prevMonday.getDate() + 6);

      return {
        startDate: toISODateString(prevMonday),
        endDate: toISODateString(prevSunday),
      };
    }

    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return {
        startDate: toISODateString(firstDay),
        endDate: toISODateString(lastDay),
      };
    }

    case 'last_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

      return {
        startDate: toISODateString(firstDay),
        endDate: toISODateString(lastDay),
      };
    }

    case 'custom': {
      if (customRange?.startDate && customRange?.endDate) {
        return customRange;
      }
      // fallback to current week
      return getDateRangeForPreset('this_week');
    }
  }
}

/**
 * Human-readable date range description for report headers and print statements
 * e.g. "02 Oct 2026 – 08 Oct 2026"
 */
export function formatReportDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '';

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startFormatted = start.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const endFormatted = end.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (startDateStr === endDateStr) {
    return startFormatted;
  }

  return `${startFormatted} — ${endFormatted}`;
}

/**
 * Printable timestamp for document generation
 */
export function getGeneratedTimestamp(): string {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
