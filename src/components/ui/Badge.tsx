import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({
  className,
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-[#F7EFEF] text-[#4A0E0E] border-[#4A0E0E]/20',
    accent: 'bg-[#F9F3E5] text-[#8C6514] border-[#C99A2E]/30',
    success: 'bg-[#EAF5EE] text-[#1E6B37] border-[#1E6B37]/25',
    warning: 'bg-[#FEF5E7] text-[#B86E00] border-[#B86E00]/25',
    danger: 'bg-[#FCEEEE] text-[#9E2A2B] border-[#9E2A2B]/25',
    neutral: 'bg-[#F1F3F5] text-[#55595D] border-[#E2DDD5]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
