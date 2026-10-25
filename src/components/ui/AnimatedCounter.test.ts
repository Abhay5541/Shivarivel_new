import { describe, it, expect, vi } from 'vitest';
import {
  sanitizePrecision,
  detectValuePrecision,
  sanitizeValue,
  interpolateValue,
  CounterAnimationController,
  MAX_PRECISION,
} from './AnimatedCounter';
import { formatINR } from '@/lib/utils';

describe('AnimatedCounter Math & Sanitization Logic', () => {
  describe('sanitizePrecision', () => {
    it('defaults to 0 for undefined, null, NaN, or non-finite inputs', () => {
      expect(sanitizePrecision(undefined)).toBe(0);
      expect(sanitizePrecision(null as unknown as number)).toBe(0);
      expect(sanitizePrecision(NaN)).toBe(0);
      expect(sanitizePrecision(Infinity)).toBe(0);
      expect(sanitizePrecision(-Infinity)).toBe(0);
    });

    it('clamps negative precision to 0', () => {
      expect(sanitizePrecision(-1)).toBe(0);
      expect(sanitizePrecision(-10)).toBe(0);
    });

    it('clamps precision greater than MAX_PRECISION (20) to 20', () => {
      expect(sanitizePrecision(21)).toBe(MAX_PRECISION);
      expect(sanitizePrecision(100)).toBe(MAX_PRECISION);
    });

    it('floors fractional precision numbers', () => {
      expect(sanitizePrecision(2.7)).toBe(2);
      expect(sanitizePrecision(0.9)).toBe(0);
    });

    it('supports valid precision values from 0 through 20', () => {
      for (let i = 0; i <= 20; i++) {
        expect(sanitizePrecision(i)).toBe(i);
      }
    });
  });

  describe('detectValuePrecision', () => {
    it('returns 0 for integers and non-finite values', () => {
      expect(detectValuePrecision(0)).toBe(0);
      expect(detectValuePrecision(42)).toBe(0);
      expect(detectValuePrecision(1000000)).toBe(0);
      expect(detectValuePrecision(NaN)).toBe(0);
      expect(detectValuePrecision(Infinity)).toBe(0);
    });

    it('returns accurate decimal count for fractional and financial amounts', () => {
      expect(detectValuePrecision(1450.5)).toBe(1);
      expect(detectValuePrecision(1450.75)).toBe(2);
      expect(detectValuePrecision(99.999)).toBe(3);
      expect(detectValuePrecision(-500.25)).toBe(2);
    });
  });

  describe('sanitizeValue', () => {
    it('converts non-finite values (NaN, Infinity, -Infinity) to 0', () => {
      expect(sanitizeValue(NaN, 2)).toBe(0);
      expect(sanitizeValue(Infinity, 2)).toBe(0);
      expect(sanitizeValue(-Infinity, 2)).toBe(0);
    });

    it('truncates to integer when precision is 0', () => {
      expect(sanitizeValue(1234.56, 0)).toBe(1234);
      expect(sanitizeValue(-1234.56, 0)).toBe(-1234);
    });

    it('preserves negative values', () => {
      expect(sanitizeValue(-500, 0)).toBe(-500);
      expect(sanitizeValue(-1250.75, 2)).toBe(-1250.75);
    });

    it('preserves specified decimal precision for currency amounts', () => {
      expect(sanitizeValue(1250.756, 2)).toBe(1250.76);
      expect(sanitizeValue(1250.754, 2)).toBe(1250.75);
      expect(sanitizeValue(99.9, 2)).toBe(99.9);
    });

    it('normalizes -0 to 0', () => {
      expect(Object.is(sanitizeValue(-0, 0), 0)).toBe(true);
      expect(Object.is(sanitizeValue(-0.0001, 2), 0)).toBe(true);
    });
  });

  describe('interpolateValue', () => {
    it('returns start when progress <= 0', () => {
      expect(interpolateValue(100, 500, 0, 0)).toBe(100);
      expect(interpolateValue(100, 500, -0.5, 0)).toBe(100);
    });

    it('returns exact end value when progress >= 1', () => {
      expect(interpolateValue(100, 500, 1, 0)).toBe(500);
      expect(interpolateValue(100, 500, 1.5, 0)).toBe(500);
      expect(interpolateValue(0, 1250.75, 1, 2)).toBe(1250.75);
    });

    it('interpolates intermediate values along quartic ease-out curve', () => {
      // At progress = 0.5: ease = 1 - (1 - 0.5)^4 = 1 - 0.0625 = 0.9375
      const val = interpolateValue(0, 1000, 0.5, 0);
      expect(val).toBe(938); // Math.round(937.5)
    });

    it('interpolates negative ranges correctly', () => {
      expect(interpolateValue(0, -1000, 1, 0)).toBe(-1000);
      const mid = interpolateValue(0, -1000, 0.5, 0);
      // In JS, Math.round(-937.5) rounds towards +Infinity to -937
      expect(mid).toBe(-937);
    });

    it('avoids floating-point drift with decimal precision', () => {
      const val = interpolateValue(0, 0.3, 1, 2);
      expect(val).toBe(0.3);
      expect(val.toString()).toBe('0.3');
    });
  });
});

describe('CounterAnimationController Lifecycle & Integration', () => {
  // Mock RAF / timer test harness
  const createMockHarness = () => {
    let rafQueue: Array<{ id: number; cb: (t: number) => void }> = [];
    let timeoutQueue: Array<{ id: any; cb: () => void; time: number }> = [];
    let nextId = 1;
    let currentTime = 1000;

    const mockRaf = vi.fn((cb: (t: number) => void) => {
      const id = nextId++;
      rafQueue.push({ id, cb });
      return id;
    });

    const mockCancelRaf = vi.fn((id: number) => {
      rafQueue = rafQueue.filter((item) => item.id !== id);
    });

    const mockSetTimeout = vi.fn((cb: () => void, ms: number) => {
      const id = nextId++;
      timeoutQueue.push({ id, cb, time: currentTime + ms });
      return id as unknown as ReturnType<typeof setTimeout>;
    });

    const mockClearTimeout = vi.fn((id: any) => {
      timeoutQueue = timeoutQueue.filter((item) => item.id !== id);
    });

    const triggerNextRaf = (timeAdvanceMs: number) => {
      currentTime += timeAdvanceMs;
      const currentQueue = [...rafQueue];
      rafQueue = [];
      currentQueue.forEach((item) => item.cb(currentTime));
    };

    const triggerTimeout = () => {
      const currentQueue = [...timeoutQueue];
      timeoutQueue = [];
      currentQueue.forEach((item) => item.cb());
    };

    return {
      mockRaf,
      mockCancelRaf,
      mockSetTimeout,
      mockClearTimeout,
      triggerNextRaf,
      triggerTimeout,
      getPendingRafCount: () => rafQueue.length,
      getPendingTimeoutCount: () => timeoutQueue.length,
      getCurrentTime: () => currentTime,
    };
  };

  it('handles integer counts from 0 to target correctly', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    const controller = new CounterAnimationController({
      value: 1000,
      decimals: 0,
      duration: 600,
      delay: 0,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    expect(controller.getTarget()).toBe(1000);
    expect(harness.mockRaf).toHaveBeenCalledTimes(1);

    // Initial step at t=0
    harness.triggerNextRaf(0);
    expect(updates[updates.length - 1]).toBe(0);

    // Step at t=300 (halfway, quartic ease 0.9375)
    harness.triggerNextRaf(300);
    expect(updates[updates.length - 1]).toBe(938);

    // Step at t=600 (completed)
    harness.triggerNextRaf(300);
    expect(updates[updates.length - 1]).toBe(1000);
    expect(controller.getCurrentValue()).toBe(1000);
    expect(harness.getPendingRafCount()).toBe(0);
  });

  it('handles decimal currency values with formatting without precision loss', () => {
    const harness = createMockHarness();
    const formattedOutputs: string[] = [];

    const controller = new CounterAnimationController({
      value: 1250.75,
      decimals: 2,
      duration: 600,
      delay: 0,
      onUpdate: (val) => formattedOutputs.push(formatINR(val)),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    expect(controller.getTarget()).toBe(1250.75);

    harness.triggerNextRaf(0); // t=0
    harness.triggerNextRaf(600); // t=600 (completion)

    expect(controller.getCurrentValue()).toBe(1250.75);
    expect(formattedOutputs[formattedOutputs.length - 1]).toBe(formatINR(1250.75));
  });

  it('preserves negative values and interpolates down to negative target', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    const controller = new CounterAnimationController({
      value: -500.5,
      decimals: 2,
      duration: 500,
      delay: 0,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    expect(controller.getTarget()).toBe(-500.5);

    harness.triggerNextRaf(0);
    harness.triggerNextRaf(500);

    expect(controller.getCurrentValue()).toBe(-500.5);
    expect(updates[updates.length - 1]).toBe(-500.5);
  });

  it('continues in-flight target changes smoothly from current displayed value', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    const controller = new CounterAnimationController({
      value: 1000,
      decimals: 0,
      duration: 600,
      delay: 0,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    harness.triggerNextRaf(0); // t=0
    harness.triggerNextRaf(300); // t=300, reached 938

    expect(controller.getCurrentValue()).toBe(938);

    // Mid-flight target change to 2000
    controller.updateTarget(2000);
    expect(controller.getTarget()).toBe(2000);

    // Animation must continue from 938, NOT reset to 0
    harness.triggerNextRaf(0); // Start of new tween
    expect(updates[updates.length - 1]).toBe(938);

    harness.triggerNextRaf(600); // Completion
    expect(updates[updates.length - 1]).toBe(2000);
    expect(controller.getCurrentValue()).toBe(2000);
  });

  it('respects delay on initial mount and cancels delay on unmount', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    const controller = new CounterAnimationController({
      value: 500,
      decimals: 0,
      duration: 400,
      delay: 150,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    expect(harness.mockSetTimeout).toHaveBeenCalledTimes(1);
    expect(harness.getPendingTimeoutCount()).toBe(1);
    expect(harness.getPendingRafCount()).toBe(0);

    // Timeout fires after 150ms delay
    harness.triggerTimeout();
    expect(harness.getPendingRafCount()).toBe(1);

    // Step to completion
    harness.triggerNextRaf(0);
    harness.triggerNextRaf(400);
    expect(controller.getCurrentValue()).toBe(500);
  });

  it('handles prefers-reduced-motion: snaps immediately when enabled mid-flight and cancels pending work', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    const controller = new CounterAnimationController({
      value: 1000,
      decimals: 0,
      duration: 600,
      delay: 100,
      isReducedMotion: false,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    expect(harness.getPendingTimeoutCount()).toBe(1);

    // OS reduced motion preference toggled ON
    controller.setReducedMotion(true);

    // Must immediately cancel pending timeouts and RAFs and snap to target
    expect(harness.mockClearTimeout).toHaveBeenCalled();
    expect(harness.getPendingTimeoutCount()).toBe(0);
    expect(harness.getPendingRafCount()).toBe(0);
    expect(controller.getCurrentValue()).toBe(1000);
    expect(updates[updates.length - 1]).toBe(1000);
  });

  it('resumes animation when prefers-reduced-motion is toggled from enabled to disabled if target differs', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    const controller = new CounterAnimationController({
      value: 1000,
      decimals: 0,
      duration: 600,
      isReducedMotion: true,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    // Starts immediately at target with reduced-motion true
    expect(controller.getCurrentValue()).toBe(1000);

    // Update target to 1500 while reduced motion is still on
    controller.updateTarget(1500);
    expect(controller.getCurrentValue()).toBe(1500);

    // Simulate current value difference and motion re-enabled
    controller.setReducedMotion(false);
    // Target is already 1500 and currentValue is 1500 -> no duplicate animation
    expect(harness.getPendingRafCount()).toBe(0);

    // Target change with reduced motion disabled initiates smooth animation
    controller.updateTarget(2500);
    expect(harness.getPendingRafCount()).toBe(1);
    harness.triggerNextRaf(0);
    harness.triggerNextRaf(600);
    expect(controller.getCurrentValue()).toBe(2500);
  });

  it('cleans up pending work on destroy/unmount', () => {
    const harness = createMockHarness();

    const controller = new CounterAnimationController({
      value: 800,
      decimals: 0,
      duration: 500,
      delay: 100,
      onUpdate: vi.fn(),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    expect(harness.getPendingTimeoutCount()).toBe(1);

    // Simulate component unmount
    controller.destroy();

    expect(harness.mockClearTimeout).toHaveBeenCalled();
    expect(harness.getPendingTimeoutCount()).toBe(0);
    expect(harness.getPendingRafCount()).toBe(0);
  });

  it('preserves rupee amounts with paise and formats properly with formatINR when decimals is omitted', () => {
    const harness = createMockHarness();
    const updates: number[] = [];

    // Financial amount e.g. ₹1,25,450.75
    const controller = new CounterAnimationController({
      value: 125450.75,
      duration: 600,
      onUpdate: (val) => updates.push(val),
      raf: harness.mockRaf,
      cancelRaf: harness.mockCancelRaf,
      setTimeoutFn: harness.mockSetTimeout,
      clearTimeoutFn: harness.mockClearTimeout,
    });

    harness.triggerNextRaf(0);
    harness.triggerNextRaf(600);

    const finalVal = controller.getCurrentValue();
    expect(finalVal).toBe(125450.75);
    // Verified formatINR produces proper Indian Rupee formatting with paise
    expect(formatINR(finalVal)).toBe('₹1,25,450.75');
  });
});
