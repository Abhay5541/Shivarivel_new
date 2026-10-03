import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#242424] font-heading"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full h-10 px-3.5 py-2 text-sm bg-white border border-[#E2DDD5] rounded-lg text-[#242424] placeholder:text-[#6B6B6B]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A0E0E] focus:border-transparent disabled:bg-[#F7F5F0] disabled:text-[#6B6B6B] disabled:cursor-not-allowed',
            error && 'border-[#9E2A2B] focus:ring-[#9E2A2B]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#9E2A2B] font-medium flex items-center gap-1">
            <span>•</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
