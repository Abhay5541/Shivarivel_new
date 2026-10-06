import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      drawerRef.current?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242424]/60 backdrop-blur-xs transition-opacity modal-backdrop-spring"
        onClick={onClose}
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          ref={drawerRef}
          tabIndex={-1}
          className={cn(
            'w-screen bg-white shadow-2xl border-l border-[#E2DDD5] flex flex-col drawer-spring focus:outline-none',
            widths[width],
            className
          )}
        >
          {/* Header */}
          <div className="h-16 px-5 sm:px-6 border-b border-[#E2DDD5] flex items-center justify-between gap-4 shrink-0 bg-[#F7F5F0]/30">
            <div>
              <h2 id="drawer-title" className="text-base font-bold text-[#242424] font-heading leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#6B6B6B] mt-0.5 leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Close panel"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
