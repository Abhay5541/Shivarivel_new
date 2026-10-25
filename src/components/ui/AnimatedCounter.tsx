import React, { useEffect, useState, useRef } from 'react';

export const MAX_PRECISION = 20;

/**
 * Clamps and sanitizes decimal precision to an integer between 0 and MAX_PRECISION (20).
 * Invalid or non-finite inputs safely default to 0.
 */
export const sanitizePrecision = (decimals?: number): number => {
  if (typeof decimals !== 'number' || !Number.isFinite(decimals)) {
    return 0;
  }
  return Math.min(MAX_PRECISION, Math.max(0, Math.floor(decimals)));
};

/**
 * Automatically detects the precision of a number if not explicitly specified.
 * Integer numbers (e.g. 5 projects) return 0 precision.
 * Floating numbers (e.g. 1450.50) return the actual decimal places count (up to MAX_PRECISION).
 */
export const detectValuePrecision = (val: number): number => {
  if (!Number.isFinite(val) || Number.isInteger(val)) return 0;
  const str = val.toString();
  if (str.includes('e-')) {
    const parts = str.split('e-');
    return Math.min(parseInt(parts[1], 10) || 0, MAX_PRECISION);
  }
  const decimalPart = str.split('.')[1];
  return decimalPart ? Math.min(decimalPart.length, MAX_PRECISION) : 0;
};

/**
 * Sanitizes target numbers:
 * - Non-finite values safely become 0.
 * - Negative values are preserved.
 * - Numbers are rounded to the supported precision without scaling overflow.
 * - Negative zero (-0) is normalized to 0.
 */
export const sanitizeValue = (val: number, precision: number): number => {
  if (!Number.isFinite(val)) return 0;
  if (precision === 0) {
    const truncated = Math.trunc(val);
    return Object.is(truncated, -0) ? 0 : truncated;
  }
  const parsed = Number(val.toFixed(precision));
  if (!Number.isFinite(parsed) || Object.is(parsed, -0)) {
    return 0;
  }
  return parsed;
};

/**
 * Calculates intermediate value along the quartic ease-out curve.
 * Clamps progress between 0 and 1.
 * Prevents floating-point drift and overflow.
 */
export const interpolateValue = (
  start: number,
  end: number,
  progress: number,
  precision: number
): number => {
  if (progress <= 0) return start;
  if (progress >= 1) return end;

  // Quartic ease-out curve (1 - (1 - progress)^4) for crisp, luxury deceleration
  const ease = 1 - Math.pow(1 - progress, 4);
  const interpolated = start + (end - start) * ease;

  if (precision === 0) {
    const rounded = Math.round(interpolated);
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  const parsed = Number(interpolated.toFixed(precision));
  if (!Number.isFinite(parsed) || Object.is(parsed, -0)) {
    return 0;
  }
  return parsed;
};

export interface CounterAnimationControllerOptions {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  isReducedMotion?: boolean;
  onUpdate: (displayValue: number) => void;
  raf?: (cb: (time: number) => void) => number;
  cancelRaf?: (id: number) => void;
  setTimeoutFn?: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (id: ReturnType<typeof setTimeout>) => void;
}

/**
 * Autonomous lifecycle and timing controller for AnimatedCounter.
 * Encapsulates timing, RAF loops, precision math, reduced-motion transitions,
 * in-flight target updates, and unmount cleanup.
 */
export class CounterAnimationController {
  private precision: number;
  private explicitDecimals?: number;
  private target: number;
  private duration: number;
  private delay: number;
  private isReducedMotion: boolean;
  private onUpdate: (val: number) => void;

  private currentValue: number;
  private startValue: number;
  private rafId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private destroyed: boolean = false;

  private raf: (cb: (time: number) => void) => number;
  private cancelRaf: (id: number) => void;
  private setTimeoutFn: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
  private clearTimeoutFn: (id: ReturnType<typeof setTimeout>) => void;

  constructor(options: CounterAnimationControllerOptions) {
    this.explicitDecimals = options.decimals;
    this.precision =
      options.decimals !== undefined
        ? sanitizePrecision(options.decimals)
        : detectValuePrecision(options.value);
    this.target = sanitizeValue(options.value, this.precision);
    this.duration = Math.max(options.duration ?? 600, 1);
    this.delay = Math.max(options.delay ?? 0, 0);
    this.isReducedMotion = !!options.isReducedMotion;
    this.onUpdate = options.onUpdate;

    this.raf =
      options.raf ||
      (typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame.bind(window)
        : (cb) => setTimeout(() => cb(Date.now()), 16) as unknown as number);

    this.cancelRaf =
      options.cancelRaf ||
      (typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame.bind(window)
        : (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>));

    this.setTimeoutFn = options.setTimeoutFn || setTimeout.bind(window);
    this.clearTimeoutFn = options.clearTimeoutFn || clearTimeout.bind(window);

    // Initial value: target if reduced-motion is preferred, otherwise 0
    this.currentValue = this.isReducedMotion ? this.target : 0;
    this.startValue = this.currentValue;

    if (this.isReducedMotion) {
      this.onUpdate(this.target);
    } else if (this.startValue !== this.target) {
      this.startAnimation(this.delay);
    } else {
      this.onUpdate(this.target);
    }
  }

  public getCurrentValue(): number {
    return this.currentValue;
  }

  public getTarget(): number {
    return this.target;
  }

  public cancelActiveAnimation(): void {
    if (this.timeoutId !== null) {
      this.clearTimeoutFn(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.rafId !== null) {
      this.cancelRaf(this.rafId);
      this.rafId = null;
    }
  }

  private startAnimation(delayMs: number): void {
    if (this.destroyed) return;
    this.cancelActiveAnimation();

    let startTime: number | null = null;
    const startVal = this.startValue;
    const endVal = this.target;
    const duration = this.duration;
    const precision = this.precision;

    const step = (currentTime: number) => {
      if (this.destroyed) return;
      if (startTime === null) {
        startTime = currentTime;
      }
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const nextVal = interpolateValue(startVal, endVal, progress, precision);
      this.currentValue = nextVal;
      this.onUpdate(nextVal);

      if (progress < 1) {
        this.rafId = this.raf(step);
      } else {
        this.currentValue = endVal;
        this.onUpdate(endVal);
        this.rafId = null;
      }
    };

    if (delayMs > 0) {
      this.timeoutId = this.setTimeoutFn(() => {
        this.timeoutId = null;
        if (!this.destroyed) {
          this.rafId = this.raf(step);
        }
      }, delayMs);
    } else {
      this.rafId = this.raf(step);
    }
  }

  public updateTarget(newValue: number): void {
    if (this.destroyed) return;
    if (this.explicitDecimals === undefined) {
      this.precision = Math.max(this.precision, detectValuePrecision(newValue));
    }
    const newTarget = sanitizeValue(newValue, this.precision);
    if (this.target === newTarget) return;

    this.cancelActiveAnimation();
    this.startValue = this.currentValue;
    this.target = newTarget;

    if (this.isReducedMotion || this.startValue === this.target) {
      this.currentValue = this.target;
      this.onUpdate(this.target);
      return;
    }

    // Target change during runtime animates immediately without stagger delay
    this.startAnimation(0);
  }

  public setReducedMotion(reduced: boolean): void {
    if (this.destroyed || this.isReducedMotion === reduced) return;
    this.isReducedMotion = reduced;

    if (reduced) {
      // Preference enabled: immediately cancel pending work and display target
      this.cancelActiveAnimation();
      this.currentValue = this.target;
      this.onUpdate(this.target);
    } else {
      // Preference disabled: reconcile displayed value with current target and resume animation if needed
      if (this.currentValue !== this.target) {
        this.cancelActiveAnimation();
        this.startValue = this.currentValue;
        this.startAnimation(0);
      }
    }
  }

  public destroy(): void {
    this.destroyed = true;
    this.cancelActiveAnimation();
  }
}

interface AnimatedCounterProps {
  /** The target value to display */
  value: number;
  /** Number of decimal places to preserve (default: 0, supports 0..20) */
  decimals?: number;
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
 * Lightweight, accessible requestAnimationFrame-driven count-up.
 * Features:
 * - Cancels animation frames and timeouts on unmount
 * - Clamps and validates numerical inputs to prevent NaN/Infinity
 * - Smoothly tweens from previous value to new value on updates
 * - Supports decimal precision (0..20) for financial amounts without overflow
 * - Reacts dynamically to live prefers-reduced-motion preference changes
 * - Adds zero external dependencies
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals,
  duration = 600,
  delay = 0,
  className,
  formatFn,
}) => {
  const precision =
    decimals !== undefined
      ? sanitizePrecision(decimals)
      : detectValuePrecision(value);
  const target = sanitizeValue(value, precision);

  const isReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const controllerRef = useRef<CounterAnimationController | null>(null);
  const [displayValue, setDisplayValue] = useState<number>(() => (isReducedMotion() ? target : 0));

  // Initialize or recreate controller when duration/delay/decimals change
  useEffect(() => {
    const controller = new CounterAnimationController({
      value,
      decimals,
      duration,
      delay,
      isReducedMotion: isReducedMotion(),
      onUpdate: (val) => setDisplayValue(val),
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [duration, delay, decimals]);

  // Handle value prop updates dynamically
  useEffect(() => {
    controllerRef.current?.updateTarget(value);
  }, [value]);

  // Listen for live changes to prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = (e: MediaQueryListEvent | MediaQueryList) => {
      controllerRef.current?.setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionPreferenceChange);
      return () => mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMotionPreferenceChange);
      return () => mediaQuery.removeListener(handleMotionPreferenceChange);
    }
  }, []);

  return (
    <span className={className}>
      {formatFn
        ? formatFn(displayValue)
        : precision > 0
          ? displayValue.toFixed(precision)
          : displayValue}
    </span>
  );
};
