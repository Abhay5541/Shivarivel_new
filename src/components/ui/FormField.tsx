import React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required,
  error,
  description,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#242424] font-heading">
          {label} {required && <span className="text-[#9E2A2B]">*</span>}
        </label>
      </div>
      {children}
      {description && !error && (
        <p className="text-[11px] text-[#6B6B6B] leading-tight">{description}</p>
      )}
      {error && (
        <p className="text-xs text-[#9E2A2B] font-medium flex items-center gap-1">
          <span>•</span> {error}
        </p>
      )}
    </div>
  );
}
