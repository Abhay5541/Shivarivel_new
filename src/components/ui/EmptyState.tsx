import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E2DDD5] rounded-xl shadow-xs',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 mb-3 rounded-full bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#4A0E0E]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[#242424] font-heading mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-[#6B6B6B] max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
