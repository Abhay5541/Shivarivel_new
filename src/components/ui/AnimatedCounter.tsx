import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  /** The target integer value to display */
  value: number;
  /** Duration of count-up in milliseconds (default: 600) */
  duration?: number;
  /** Optional delay before count-up starts in milliseconds */
  delay?: number;
  /** Additional CSS class names */
  className?: string;
  /** Optional formatter function (e.g. formatINR) */
  formatFn?: (value: number) => React.ReactNode;
}

/**
 * AnimatedCounter
 * Lightweight, accessible requestAnimationFrame-driven integer count-up.
 * Features:
 * - Cancels animation frames on unmount
 * - Clamps and validates numerical inputs to prevent NaN/Infinity
 * - Smoothly tweens from previous value to new value on updates
 * - Respects prefers-reduced-motion by rendering target value immediately
 * - Adds zero external dependencies
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 600,
  delay = 0,
  className,
  formatFn,
}) => {
  // Validate and sanitize target value (strictly finite integers)
  const target = Number.isFinite(value) ? Math.trunc(value) : 0;

  // Helper to detect reduced motion preference
  const isReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initial displayed value: target if reduced-motion is preferred, otherwise 0
  const [displayValue, setDisplayValue] = useState<number>(() => {
    return isReducedMotion() ? target : 0;
  });

  // Track the actual numerical value currently displayed on screen at any instant
  const currentValueRef = useRef<number>(isReducedMotion() ? target : 0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  // Helper to clear pending animation frame and timeout
  const cancelActiveAnimation = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // 1. Listen for live changes to prefers-reduced-motion while mounted
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        cancelActiveAnimation();
        currentValueRef.current = target;
        setDisplayValue(target);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionPreferenceChange);
      return () => mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMotionPreferenceChange);
      return () => mediaQuery.removeListener(handleMotionPreferenceChange);
    }
  }, [target]);

  // 2. Main animation effect
  useEffect(() => {
    // If reduced motion is active, jump to target immediately with no animation
    if (isReducedMotion()) {
      cancelActiveAnimation();
      currentValueRef.current = target;
      setDisplayValue(target);
      isFirstMountRef.current = false;
      return;
    }

    // Always start from whatever number is currently displayed on screen (prevents mid-flight jumps)
    const startValue = currentValueRef.current;
    const endValue = target;

    // If already at target value, ensure state matches and exit
    if (startValue === endValue) {
      setDisplayValue(endValue);
      isFirstMountRef.current = false;
      return;
    }

    // Cancel any previous in-flight animation before starting the new one
    cancelActiveAnimation();

    let startTime: number | null = null;
    // On first mount, respect the configured delay (for stagger sequence); on subsequent target changes, start immediately
    const effectiveDelay = isFirstMountRef.current && delay > 0 ? delay : 0;
    isFirstMountRef.current = false;

    const step = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / Math.max(duration, 1), 1);

      // Quartic ease-out curve (1 - (1 - progress)^4) for crisp, luxury deceleration
      const ease = 1 - Math.pow(1 - progress, 4);
      const calculated = Math.round(startValue + (endValue - startValue) * ease);
      const nextValue = Number.isFinite(calculated) ? calculated : endValue;

      currentValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        currentValueRef.current = endValue;
        setDisplayValue(endValue);
        rafRef.current = null;
      }
    };

    if (effectiveDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        rafRef.current = requestAnimationFrame(step);
      }, effectiveDelay);
    } else {
      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      cancelActiveAnimation();
    };
  }, [target, duration, delay]);

  return <span className={className}>{formatFn ? formatFn(displayValue) : displayValue}</span>;
};
