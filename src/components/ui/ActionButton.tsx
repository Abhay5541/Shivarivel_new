import React, { useEffect, useRef, useState } from "react";
import "./ActionButton.css";

/* ══ ActionButton ══════════════════════════════════════════
   A primary action button with the SAME spring physics as
   the Search pill. Click it and it compresses, then springs
   back with a visible overshoot — the same "yields before it
   moves" beat that makes a click feel like a push.

   The scale is driven by useSpring, not by CSS transition,
   so the overshoot, the settle, and the damping are all
   frame-accurate. A CSS transition can ease-in or ease-out;
   it cannot overshoot, which is the one thing that makes a
   spring read as physical rather than interpolated.

   The width never changes. What changes is the SCALE, and
   the spring is what makes that scale bounce past 1.0 for
   a moment on the way back from 0.92 — enough to feel the
   object inflate, not enough to notice it got bigger. */

/* ── inlined spring, same maths as Search ────────────── */
const springOf = (tune: number) => ({
  k: 0.08 + (tune / 100) * 0.16,
  d: 0.62 + (tune / 100) * 0.2,
});

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/* Scale is expressed in hundredths (0..100) rather than
   0..1, because the snap threshold is absolute: a spring
   driven over 0..1 would be "settled" before it had visibly
   moved. 100 = scale(1.00), 92 = scale(0.92). */
function useSpring(target: number, tune = 50, instant = false) {
  const [at, setAt] = useState(target);
  const cur = useRef(target);
  const vel = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (instant) {
      cur.current = target;
      vel.current = 0;
      setAt(target);
      return;
    }
    const { k, d } = springOf(tune);
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      vel.current += (target - cur.current) * k * dt;
      vel.current *= Math.pow(d, dt);
      cur.current += vel.current * dt;
      if (
        Math.abs(target - cur.current) < 0.02 &&
        Math.abs(vel.current) < 0.02
      ) {
        cur.current = target;
        vel.current = 0;
        setAt(target);
        raf.current = 0;
        return;
      }
      setAt(cur.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [target, tune, instant]);

  return at;
}

const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant: 'primary' (signature maroon) or 'outline' (white card with border) */
  variant?: "primary" | "outline" | "secondary";
  /** The icon to display (e.g. <Plus />) */
  icon?: React.ReactNode;
  /** Button label text */
  label: string;
  /** Spring responsiveness 0..100 (default 60) */
  spring?: number;
  /** Magnetic lean strength 0..100 (default 40) */
  give?: number;
}

export function ActionButton({
  variant = "primary",
  icon,
  label,
  spring = 60,
  give = 40,
  className = "",
  onClick,
  disabled,
  ...props
}: ActionButtonProps) {
  const frame = useRef<HTMLDivElement | null>(null);
  const beat = useRef(0);
  const clickEvent = useRef<React.MouseEvent<HTMLButtonElement> | null>(null);

  const [phase, setPhase] = useState<"rest" | "compress" | "release">("rest");
  const [lean, setLean] = useState({ x: 0, y: 0 });
  const still = stillness();

  /* ── scale spring ─────────────────────────────────────
     The target is in hundredths so the spring has room to
     work. At rest it is 100 (scale 1.00). When pressed it
     drops to 92 (scale 0.92). When released it jumps back
     to 100, and the spring's overshoot carries it past —
     to ~103–104 for a moment — before it settles. That
     brief inflation is the whole effect: the object bounces
     back from a push. */
  const scaleTarget =
    phase === "compress" ? 92 : 100;

  const scaleSpring = useSpring(
    scaleTarget,
    clamp(spring, 0, 100),
    still,
  );

  /* Convert hundredths back to a CSS scale factor */
  const scaleFactor = scaleSpring / 100;

  /* When the spring settles back to 100 after release,
     fire the actual onClick and go to rest */
  useEffect(() => {
    if (phase === "release" && Math.abs(scaleSpring - 100) < 0.5) {
      setPhase("rest");
      if (clickEvent.current) {
        onClick?.(clickEvent.current);
        clickEvent.current = null;
      }
    }
  }, [phase, scaleSpring, onClick]);

  /* ── the magnet ────────────────────────────────────── */
  useEffect(() => {
    const el = frame.current;
    if (!el || still) return;
    let raf = 0;
    let at = { x: 0, y: 0 };
    const publish = () => {
      raf = 0;
      setLean(at);
    };
    const read = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const k = b.width / (el.offsetWidth || b.width) || 1;
      const dx = (e.clientX - (b.left + b.width / 2)) / k;
      const dy = (e.clientY - (b.top + b.height / 2)) / k;
      const d = Math.hypot(dx, dy);
      const R = 120;
      if (d > R) {
        if (at.x || at.y) {
          at = { x: 0, y: 0 };
          if (!raf) raf = requestAnimationFrame(publish);
        }
        return;
      }
      const pull = (1 - d / R) ** 1.4 * (1.5 + (give / 100) * 4);
      at = { x: (dx / (d || 1)) * pull, y: (dy / (d || 1)) * pull };
      if (!raf) raf = requestAnimationFrame(publish);
    };
    const gone = () => {
      at = { x: 0, y: 0 };
      if (!raf) raf = requestAnimationFrame(publish);
    };
    document.addEventListener("pointermove", read, { passive: true });
    document.addEventListener("pointerleave", gone);
    return () => {
      document.removeEventListener("pointermove", read);
      document.removeEventListener("pointerleave", gone);
      cancelAnimationFrame(raf);
    };
  }, [give, still]);

  /* ── press beat: compress, hold, then release ──────── */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || phase !== "rest") return;
    clickEvent.current = e;
    setPhase("compress");
    window.clearTimeout(beat.current);
    /* Hold the compress for 90ms — long enough to feel the
       object yield, short enough nobody waits for it — then
       release so the spring carries it back with a bounce. */
    beat.current = window.setTimeout(() => {
      setPhase("release");
    }, still ? 0 : 90);
  };

  useEffect(() => () => window.clearTimeout(beat.current), []);

  return (
    <div
      className={`act-btn ${className}`.trim()}
      ref={frame}
      data-variant={variant}
      data-press={phase === "compress"}
      data-disabled={disabled || undefined}
      style={
        {
          "--lx": `${lean.x.toFixed(2)}px`,
          "--ly": `${lean.y.toFixed(2)}px`,
          "--sk": scaleFactor.toFixed(4),
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className="act-btn-skin"
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {icon && <span className="act-btn-icon">{icon}</span>}
        <span className="act-btn-label">{label}</span>
      </button>
    </div>
  );
}

export default ActionButton;
