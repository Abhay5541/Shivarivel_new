import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Auto focus
      modalRef.current?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242424]/60 backdrop-blur-xs transition-opacity modal-backdrop-spring"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-xl border border-[#E2DDD5] z-10 overflow-hidden flex flex-col modal-spring focus:outline-none',
          maxWidths[maxWidth],
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-[#242424] font-heading leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[#6B6B6B] mt-0.5 leading-snug">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
