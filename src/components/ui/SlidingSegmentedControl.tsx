import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  count?: number;
  dotColor?: string;
  activeColorClass?: string;
}

interface SlidingSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  id?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  ariaLabel?: string;
}

export function SlidingSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  id,
  size = 'sm',
  fullWidth = false,
  ariaLabel = 'Navigation tabs',
}: SlidingSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeEl = buttonRefs.current[value];
    if (activeEl && containerRef.current) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [value]);

  // Synchronous measurement before paint
  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, options]);

  // Handle window resizing or font loading
  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);

    // Also observe the container if ResizeObserver is available
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateIndicator();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
    };
  }, [updateIndicator]);

  const isMd = size === 'md';

  return (
    <div
      ref={containerRef}
      id={id}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative ${
        fullWidth ? 'flex w-full' : 'inline-flex'
      } items-center p-1 bg-[#F7F5F0] border border-[#E2DDD5] ${
        isMd ? 'rounded-xl sm:rounded-2xl' : 'rounded-xl'
      } select-none ${className}`}
    >
      {/* Sliding Pill Indicator */}
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 ${
          isMd ? 'rounded-lg sm:rounded-xl' : 'rounded-lg'
        } bg-white shadow-xs border border-[#E2DDD5]/80 pointer-events-none ${
          indicatorStyle.ready
            ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
            : 'transition-none opacity-0'
        }`}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {/* Segment Buttons */}
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              buttonRefs.current[opt.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 ${
              fullWidth ? 'flex-1 justify-center' : ''
            } ${
              isMd ? 'px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl' : 'px-2 sm:px-3 py-1.5 text-xs rounded-lg'
            } font-bold transition-colors duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap active:scale-[0.98] ${
              isActive
                ? opt.activeColorClass || 'text-[#242424]'
                : 'text-[#6B6B6B] hover:text-[#242424]'
            }`}
          >
            {opt.icon && (
              <span className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'opacity-70'}`}>
                {opt.icon}
              </span>
            )}
            {opt.dotColor && (
              <span
                className={`w-1.5 h-1.5 rounded-full transition-transform duration-200 shrink-0 ${
                  isActive ? 'scale-110' : 'scale-90 opacity-70'
                }`}
                style={{ backgroundColor: opt.dotColor }}
              />
            )}
            <span className={opt.shortLabel ? 'hidden sm:inline' : ''}>{opt.label}</span>
            {opt.shortLabel && (
              <span className="sm:hidden">{opt.shortLabel}</span>
            )}
            {opt.count !== undefined && (
              <span
                className={`tabular-nums text-[11px] sm:text-xs transition-opacity duration-200 ${
                  isActive ? 'opacity-90 font-bold' : 'opacity-65 font-medium'
                }`}
              >
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
