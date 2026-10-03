import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

    const variants = {
      primary:
        'bg-[#4A0E0E] text-white hover:bg-[#380A0A] active:bg-[#2B0707] focus-visible:ring-[#4A0E0E]',
      secondary:
        'bg-white text-[#242424] border border-[#E2DDD5] hover:bg-[#F7F5F0] hover:border-[#C99A2E] active:bg-[#EFECE6] focus-visible:ring-[#4A0E0E]',
      accent:
        'bg-[#C99A2E] text-white hover:bg-[#B38722] active:bg-[#9D751C] focus-visible:ring-[#C99A2E]',
      danger:
        'bg-[#9E2A2B] text-white hover:bg-[#852324] active:bg-[#6D1B1C] focus-visible:ring-[#9E2A2B]',
      outline:
        'border border-[#4A0E0E] text-[#4A0E0E] bg-transparent hover:bg-[#F9F3E5] focus-visible:ring-[#4A0E0E]',
      ghost:
        'bg-transparent text-[#242424] hover:bg-[#EFECE6] active:bg-[#E2DDD5] focus-visible:ring-[#4A0E0E]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
