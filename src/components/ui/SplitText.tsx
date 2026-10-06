import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  onLetterAnimationComplete?: () => void;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 40,
  duration = 0.8,
  ease = 'power3.out',
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  tag: Tag = 'h1',
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !text) return;

      const chars = containerRef.current.querySelectorAll('.split-char');
      if (!chars.length) return;

      gsap.fromTo(
        chars,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          onComplete: () => {
            onLetterAnimationComplete?.();
          },
          overwrite: 'auto',
        }
      );
    },
    { scope: containerRef, dependencies: [text, delay, duration, ease] }
  );

  return (
    <Tag ref={containerRef as any} className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="split-char inline-block"
          style={{ willChange: 'transform, opacity' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Tag>
  );
};

export default SplitText;
