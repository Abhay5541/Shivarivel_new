import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'This is going to be permanently deleted. Are you sure?',
  itemName,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  isLoading = false,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onClose();
    }
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    const count = Number(document.body.dataset.scrollLockCount || '0') + 1;
    document.body.dataset.scrollLockCount = String(count);
    if (count === 1) {
      document.body.dataset.prevOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const remaining = Math.max(0, Number(document.body.dataset.scrollLockCount || '1') - 1);
      document.body.dataset.scrollLockCount = String(remaining);
      if (remaining === 0) {
        document.body.style.overflow = document.body.dataset.prevOverflow || '';
        delete document.body.dataset.prevOverflow;
      }
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 select-none modal-backdrop-spring"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-[#E2DDD5] z-10 modal-spring text-center">
        <button
          type="button"
          aria-label="Close"
          disabled={isLoading}
          onClick={onClose}
          className="absolute right-4 top-4 text-[#6B6B6B] hover:text-[#242424] p-1.5 rounded-lg hover:bg-[#F7F5F0] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center mx-auto text-[#DC2626] shadow-xs mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3
          id="confirm-delete-title"
          className="text-lg font-bold text-[#242424] font-heading mb-1.5"
        >
          {title}
        </h3>

        {/* Item context if provided */}
        {itemName && (
          <p className="text-xs font-semibold text-[#4A0E0E] bg-[#F7EFEF] px-2.5 py-1 rounded-md inline-block max-w-full truncate mb-2">
            &ldquo;{itemName}&rdquo;
          </p>
        )}

        {/* Message */}
        <p className="text-xs sm:text-sm text-[#6B6B6B] mb-6 leading-relaxed">
          {message}
        </p>

        {/* Two Options: Yes or No */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="h-10 px-4 bg-[#F7F5F0] hover:bg-[#E2DDD5] text-[#242424] text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#E2DDD5]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="h-10 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
