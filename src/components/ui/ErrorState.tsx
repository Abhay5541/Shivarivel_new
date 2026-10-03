import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this view. You can retry the operation or check your network connection.',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E2DDD5] rounded-xl shadow-xs max-w-lg mx-auto my-6',
        className
      )}
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-[#FCEEEE] border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B]">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-[#242424] font-heading mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-[#6B6B6B] mb-4 leading-relaxed">
        {description}
      </p>

      {errorMessage && (
        <div className="w-full mb-4 p-2.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-left overflow-x-auto">
          <p className="font-mono text-[11px] text-[#9E2A2B] whitespace-pre-wrap break-words">
            {errorMessage}
          </p>
        </div>
      )}

      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
