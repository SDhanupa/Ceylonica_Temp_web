import React, { useEffect, useRef, useState } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { keyframes } from '@mui/system';

export const EASE = 'cubic-bezier(.22,1,.36,1)';

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Entrances animate `translate`, not `transform`, so a finished (fill: both)
// entrance never pins transform and hover lifts still work.
export const fadeUp = keyframes`from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}`;
export const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
export const slideInRight = keyframes`from{opacity:0;translate:28px 0}to{opacity:1;translate:0 0}`;
export const slideInLeft = keyframes`from{opacity:0;translate:-28px 0}to{opacity:1;translate:0 0}`;
export const sheen = keyframes`0%{transform:translateX(-150%) skewX(-20deg)}100%{transform:translateX(350%) skewX(-20deg)}`;
export const floatY = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}`;
export const ping = keyframes`0%{transform:scale(1);opacity:.55}100%{transform:scale(2.2);opacity:0}`;
const driftA = keyframes`0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(12%,8%,0) scale(1.18)}`;
const driftB = keyframes`0%,100%{transform:translate3d(0,0,0) scale(1.1)}50%{transform:translate3d(-14%,-6%,0) scale(.92)}`;

const noReduce = { '@media (prefers-reduced-motion: reduce)': { animation: 'none !important', transition: 'none !important' } };

/** Staggered entrance; `i` is the item's position in its group. */
export const enter = (i = 0, step = 55) => ({
  animation: `${fadeUp} 700ms ${EASE} both`,
  animationDelay: `${Math.min(i, 14) * step}ms`,
  ...noReduce,
});

/** Card hover: lift with a soft, long shadow. */
export const lift = {
  transition: `transform 450ms ${EASE}, box-shadow 450ms ${EASE}, border-color 200ms ease, background-color 200ms ease`,
  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 1px 2px rgba(10,12,15,.04), 0 22px 44px -16px rgba(10,12,15,.22)' },
  '&:active': { transform: 'translateY(-1px) scale(.995)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover, &:active': { transform: 'none' } },
};

/** Light that follows the pointer across a card. Pair with `spotlightMove`. */
export const spotlight = (tone = 'rgba(10,12,15,0.07)', size = 380) => ({
  position: 'relative' as const,
  isolation: 'isolate' as const,
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    zIndex: -1,
    background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), ${tone}, transparent 50%)`,
    opacity: 0,
    transition: 'opacity 350ms ease',
  },
  '&:hover::after': { opacity: 1 },
});

export const spotlightMove = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** A diagonal light sweep across a dark surface on hover. Parent needs overflow hidden. */
export const sheenOnHover = {
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '35%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent)',
    transform: 'translateX(-150%) skewX(-20deg)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  '&:hover::before': { animation: `${sheen} 1100ms ${EASE}` },
  ...noReduce,
};

export function useInView<T extends HTMLElement>(margin = '0px 0px -8% 0px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

/** Fades content up once it scrolls into view. */
export const Reveal: React.FC<{ index?: number; children: React.ReactNode; sx?: SxProps<Theme> }> = ({ index = 0, children, sx }) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <Box ref={ref} sx={[{ opacity: seen ? undefined : 0 }, seen ? enter(index) : {}, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}>
      {children}
    </Box>
  );
};

export function useCountUp(target: number, durationMs = 1100): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const from = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const v = Math.round(origin + (target - origin) * (1 - Math.pow(1 - p, 4)));
      setValue(v);
      from.current = v;
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // rAF pauses in hidden tabs; always land on the real number.
    const settle = setTimeout(() => {
      setValue(target);
      from.current = target;
    }, durationMs + 120);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [target, durationMs]);
  return value;
}

export const CountUp: React.FC<{ value: number }> = ({ value }) => <>{useCountUp(value).toLocaleString()}</>;

/** True one frame after mount, so CSS transitions can run from their initial state. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")";

/**
 * Slow-moving monochrome light, a fading grid and film grain behind a hero.
 * The parent must set `position: relative; isolation: isolate; overflow: hidden`.
 */
export const Ambient: React.FC<{ tone?: 'dark' | 'light'; grid?: boolean }> = ({ tone = 'dark', grid = true }) => {
  const dark = tone === 'dark';
  const glow = dark ? 'rgba(255,255,255,.13)' : 'rgba(10,12,15,.07)';
  const line = dark ? 'rgba(255,255,255,.06)' : 'rgba(10,12,15,.05)';
  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          width: '70vmax',
          height: '70vmax',
          top: '-42vmax',
          left: '-18vmax',
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${glow}, transparent)`,
          animation: `${driftA} 22s ease-in-out infinite`,
          ...noReduce,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '55vmax',
          height: '55vmax',
          bottom: '-38vmax',
          right: '-14vmax',
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${glow}, transparent)`,
          animation: `${driftB} 26s ease-in-out infinite`,
          ...noReduce,
        }}
      />
      {grid && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, #000 25%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, #000 25%, transparent 75%)',
          }}
        />
      )}
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, opacity: dark ? 0.09 : 0.05, mixBlendMode: dark ? 'overlay' : 'multiply' }} />
    </Box>
  );
};
