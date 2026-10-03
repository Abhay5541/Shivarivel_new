import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-10 px-4 text-center',
        className
      )}
    >
      <div className="relative w-8 h-8 mb-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A0E0E]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#C99A2E]" />
        </div>
      </div>
      <p className="text-xs font-medium text-[#6B6B6B]">{message}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white border border-[#E2DDD5] rounded-xl overflow-hidden animate-pulse">
      <div className="h-11 bg-[#F7F5F0] border-b border-[#E2DDD5]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 border-b border-[#E2DDD5]/60 px-5 flex items-center gap-4"
        >
          <div className="w-24 h-4 bg-[#EFECE6] rounded-sm" />
          <div className="flex-1 h-4 bg-[#EFECE6] rounded-sm" />
          <div className="w-20 h-4 bg-[#EFECE6] rounded-sm" />
          <div className="w-16 h-6 bg-[#EFECE6] rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-28 h-4 bg-[#EFECE6] rounded-sm" />
        <div className="w-6 h-6 bg-[#EFECE6] rounded-full" />
      </div>
      <div className="w-36 h-7 bg-[#EFECE6] rounded-sm" />
      <div className="w-48 h-3 bg-[#EFECE6] rounded-sm" />
    </div>
  );
}
