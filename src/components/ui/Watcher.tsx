import React, { useRef, useEffect, useId } from 'react';
import './Watcher.css';

/* ─────────────────────────────────────────────
   Bencho Eye Tracker (Watcher)
   Exact original source implementation as-is
   ───────────────────────────────────────────── */

export interface WatcherProps {
  /** How far it turns to look (default 60) */
  follow?: number;
  /** How much the turn overshoots (default 30) */
  bounce?: number;
  /** Size in px (default 100) */
  size?: number;
  /** Shape of the outer body */
  shape?: 'Cube' | 'Ball' | 'Circle' | 'Pill' | 'Hexagon' | 'Hex flat';
  /** Eye style */
  eyes?: 'Slant' | 'Dots' | 'Squares';
  /** Eye scale multiplier (default 1) */
  eyeScale?: number;
  /** Eye width multiplier (default 1) */
  eyeWidth?: number;
  /** Eye round multiplier (default 1) */
  eyeRound?: number;
  /** Eye height multiplier (default 1) */
  eyeHeight?: number;
  /** Autonomous looking when idle */
  idle?: boolean;
  className?: string;
}

const Dw = 50;
const kw = 0.19;
const Aw = 64;

const Ow: Record<string, { w: number; h: number; r: number }> = {
  Slant: { w: 9, h: 15, r: 4.5 },
  Dots: { w: 11, h: 11, r: 5.5 },
  Squares: { w: 12, h: 12, r: 3.5 },
};

const Mw: Record<string, string> = {
  Ball: 'M50 0 A50 50 0 1 1 49.99 0 Z',
  Circle: 'M50 7 A43 43 0 1 1 49.99 7 Z',
  Cube: 'M30 6 H70 A24 24 0 0 1 94 30 V70 A24 24 0 0 1 70 94 H30 A24 24 0 0 1 6 70 V30 A24 24 0 0 1 30 6 Z',
  Pill: 'M34 17 H66 A33 33 0 0 1 66 83 H34 A33 33 0 0 1 34 17 Z',
  Hexagon:
    'M59.53 8.50 L81.18 21.00 Q90.70 26.50 90.70 37.50 L90.70 62.50 Q90.70 73.50 81.18 79.00 L59.53 91.50 Q50.00 97.00 40.47 91.50 L18.82 79.00 Q9.30 73.50 9.30 62.50 L9.30 37.50 Q9.30 26.50 18.82 21.00 L40.47 8.50 Q50.00 3.00 59.53 8.50 Z',
  'Hex flat':
    'M91.50 59.53 L79.00 81.18 Q73.50 90.70 62.50 90.70 L37.50 90.70 Q26.50 90.70 21.00 81.18 L8.50 59.53 Q3.00 50.00 8.50 40.47 L21.00 18.82 Q26.50 9.30 37.50 9.30 L62.50 9.30 Q73.50 9.30 79.00 18.82 L91.50 40.47 Q97.00 50.00 91.50 59.53 Z',
};

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

export function Watcher({
  follow = 60,
  bounce = 30,
  size = 100,
  shape = 'Cube',
  eyes = 'Slant',
  eyeScale = 1,
  eyeWidth = 1,
  eyeRound = 1,
  eyeHeight = 1,
  idle = false,
  className = '',
}: WatcherProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const rootRef = useRef<HTMLDivElement>(null);
  const eyeRefs = useRef<(SVGGElement | null)[]>([]);
  const metaRef = useRef({ follow, bounce, eyeScale });
  metaRef.current = { follow, bounce, eyeScale };

  const eyeDef = Ow[eyes] ?? Ow.Slant;
  const eyeDims = {
    w: eyeDef.w * eyeScale * eyeWidth,
    h: eyeDef.h * eyeScale * eyeHeight,
    r: eyeDef.r * eyeScale * eyeWidth * eyeRound,
  };
  const dimsRef = useRef(eyeDims);
  dimsRef.current = eyeDims;

  const rawId = useId();
  const clipId = `eyt-clip-${rawId.replace(/:/g, '')}`;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const state = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let rafId = 0;
    let prevTime = 0;
    let blinkStartTime = 0;
    let nextBlinkTime = performance.now() + 2200;

    // Render frame
    const render = (time: number) => {
      let blinkScale = 1;
      if (time > nextBlinkTime) {
        blinkStartTime = time;
        nextBlinkTime = time + (idle ? 2000 : 2600 + Math.random() * 3200);
      }
      const blinkElapsed = time - blinkStartTime;
      if (blinkElapsed < 160) {
        blinkScale = 1 - 0.9 * Math.sin((blinkElapsed / 160) * Math.PI);
      }

      const clampAsin = (v: number) => Math.asin(clamp(v, -0.92, 0.92));
      const yaw = clampAsin(state.x);
      const pitch = -clampAsin(state.y);

      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);

      const rotZ = Aw * state.x * state.y;
      const eyeSpacing = kw * Math.max(1, metaRef.current.eyeScale * 0.8);

      [-eyeSpacing, eyeSpacing].forEach((eyeOffset, idx) => {
        const eyeGroup = eyeRefs.current[idx];
        if (!eyeGroup) return;

        const z0 = Math.sqrt(1 - eyeOffset * eyeOffset);
        const x1 = eyeOffset * cosYaw + z0 * sinYaw;
        const z1 = -eyeOffset * sinYaw + z0 * cosYaw;
        const y2 = -z1 * sinPitch;
        const z2 = z1 * cosPitch;

        const foreshorten = clamp(z2, 0, 1);
        const scaleDepth = 0.45 + 0.55 * foreshorten;
        const scaleX = scaleDepth * (0.7 + 0.3 * foreshorten);

        const currentDims = dimsRef.current;
        const w = currentDims.w * scaleX;
        const h = Math.max(0.6, currentDims.h * scaleDepth * blinkScale);

        const rect = eyeGroup.firstElementChild as SVGRectElement | null;
        if (rect) {
          rect.setAttribute('x', (-w / 2).toFixed(2));
          rect.setAttribute('y', (-h / 2).toFixed(2));
          rect.setAttribute('width', w.toFixed(2));
          rect.setAttribute('height', h.toFixed(2));
          rect.setAttribute('rx', Math.min(currentDims.r, w / 2, h / 2).toFixed(2));
        }

        eyeGroup.setAttribute(
          'transform',
          `translate(${(50 + x1 * Dw).toFixed(2)} ${(50 + y2 * Dw).toFixed(2)}) rotate(${rotZ.toFixed(2)})`
        );
        eyeGroup.style.opacity = z2 < 0.05 ? '0' : '1';
      });
    };

    // Physics step
    const step = (time: number) => {
      const dt = prevTime ? Math.min(2.5, (time - prevTime) / 16.67) : 1;
      prevTime = time;

      if (prefersReducedMotion) {
        state.x = state.tx;
        state.y = state.ty;
      } else {
        const stiffness = 0.06;
        const damping =
          0.34 - (clamp(metaRef.current.bounce, 0, 100) / 100) * 0.22;
        state.vx += ((state.tx - state.x) * stiffness - state.vx * damping) * dt;
        state.vy += ((state.ty - state.y) * stiffness - state.vy * damping) * dt;
        state.x += state.vx * dt;
        state.y += state.vy * dt;
      }

      render(time);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    const handlePointerMove = (e: PointerEvent) => {
      const elRect = el.getBoundingClientRect();
      const dx = e.clientX - (elRect.left + elRect.width / 2);
      const dy = e.clientY - (elRect.top + elRect.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.max(80, Math.min(window.innerWidth, window.innerHeight) * 0.35);
      const intensity = Math.min(
        0.85,
        Math.tanh(dist / reach) * (clamp(metaRef.current.follow, 0, 100) / 100) * 1.5
      );
      state.tx = (dx / dist) * intensity;
      state.ty = (dy / dist) * intensity;
    };

    const handlePointerLeave = () => {
      state.tx = 0;
      state.ty = 0;
    };

    if (idle) {
      let idleTimer = 0;
      const scheduleIdle = () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.45 + Math.random() * 0.25;
        state.tx = Math.cos(angle) * dist;
        state.ty = Math.sin(angle) * dist;
        idleTimer = window.setTimeout(() => {
          handlePointerLeave();
          idleTimer = window.setTimeout(scheduleIdle, 4100);
        }, 900);
      };
      idleTimer = window.setTimeout(scheduleIdle, 5000);

      return () => {
        cancelAnimationFrame(rafId);
        window.clearTimeout(idleTimer);
      };
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [prefersReducedMotion, idle]);

  const sizeVal = clamp(size, 16, 180);
  const shapePath = Mw[shape] ?? Mw.Cube;

  return (
    <div
      className={`eyt ${className}`.trim()}
      ref={rootRef}
      style={{ '--eyt-size': `${sizeVal}px` } as React.CSSProperties}
      role="img"
      aria-label="A ball with two eyes that follows the cursor"
    >
      <svg className="eyt-ball" viewBox="0 0 100 100">
        <defs>
          <clipPath id={clipId}>
            <path d={shapePath} />
          </clipPath>
        </defs>
        <path className="eyt-body" d={shapePath} />
        <g clipPath={`url(#${clipId})`}>
          {[0, 1].map((idx) => (
            <g
              key={idx}
              ref={(el) => {
                eyeRefs.current[idx] = el;
              }}
            >
              <rect
                className="eyt-eye"
                x={-eyeDims.w / 2}
                y={-eyeDims.h / 2}
                width={eyeDims.w}
                height={eyeDims.h}
                rx={eyeDims.r}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
