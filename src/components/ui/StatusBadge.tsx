import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'active'
  | 'in-progress'
  | 'completed'
  | 'pending'
  | 'overdue'
  | 'draft'
  | 'inactive';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

export function StatusBadge({
  variant = 'active',
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const configs: Record<
    StatusVariant,
    { dot: string; bg: string; text: string; border: string }
  > = {
    active: {
      dot: 'bg-[#1E6B37]',
      bg: 'bg-[#EAF5EE]',
      text: 'text-[#1E6B37]',
      border: 'border-[#1E6B37]/20',
    },
    'in-progress': {
      dot: 'bg-[#B86E00]',
      bg: 'bg-[#FEF5E7]',
      text: 'text-[#B86E00]',
      border: 'border-[#B86E00]/20',
    },
    completed: {
      dot: 'bg-[#1E6B37]',
      bg: 'bg-[#EAF5EE]',
      text: 'text-[#1E6B37]',
      border: 'border-[#1E6B37]/20',
    },
    pending: {
      dot: 'bg-[#B86E00]',
      bg: 'bg-[#FEF5E7]',
      text: 'text-[#B86E00]',
      border: 'border-[#B86E00]/20',
    },
    overdue: {
      dot: 'bg-[#9E2A2B]',
      bg: 'bg-[#FCEEEE]',
      text: 'text-[#9E2A2B]',
      border: 'border-[#9E2A2B]/20',
    },
    draft: {
      dot: 'bg-[#55595D]',
      bg: 'bg-[#F1F3F5]',
      text: 'text-[#55595D]',
      border: 'border-[#E2DDD5]',
    },
    inactive: {
      dot: 'bg-[#55595D]',
      bg: 'bg-[#F1F3F5]',
      text: 'text-[#55595D]',
      border: 'border-[#E2DDD5]',
    },
  };

  const config = configs[variant] || configs.active;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none',
        config.bg,
        config.text,
        config.border,
        className
      )}
      {...props}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <span className="leading-none">{children}</span>
    </span>
  );
}
