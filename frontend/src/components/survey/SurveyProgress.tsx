import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { T, useEdgeFadeMask } from './SurveyKit';

export type SurveySection = {
  icon: React.ReactNode;
  title: string;
  short: string;
};

const SurveyProgress: React.FC<{
  sections: SurveySection[];
  current: number;
  maxReached: number;
  onJump: (i: number) => void;
}> = ({ sections, current, maxReached, onJump }) => {
  const total = sections.length;
  const pct = Math.round(((current + 1) / total) * 100);
  const active = sections[current];
  const dotsRef = React.useRef<HTMLDivElement | null>(null);
  const dotsMask = useEdgeFadeMask(dotsRef);

  /* With 14 sections the dot rail overflows a phone screen, so bring the
     active step back into view whenever it changes. */
  React.useEffect(() => {
    const rail = dotsRef.current;
    const dot = rail?.querySelector(`[data-step="${current}"]`);
    if (!rail || !dot) return;
    const r = rail.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    if (d.left < r.left || d.right > r.right) {
      rail.scrollTo({
        left: rail.scrollLeft + (d.left - r.left) - r.width / 2 + d.width / 2,
        behavior: 'smooth',
      });
    }
  }, [current]);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.lineSoft}`,
        px: { xs: 2, sm: 3.5 },
        pt: { xs: 2, sm: 2.5 },
        pb: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Header row: icon + section title + counter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: 42, sm: 48 },
            height: { xs: 42, sm: 48 },
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`,
            color: '#fff',
            boxShadow: '0 6px 16px rgba(37,99,235,0.30)',
            '& .MuiSvgIcon-root': { fontSize: { xs: '1.35rem', sm: '1.5rem' } },
            animation: 'sk-fade .4s ease both',
          }}
        >
          {active?.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: T.brand,
              lineHeight: 1,
              mb: 0.4,
            }}
          >
            {`Section ${current + 1} / ${total}`}
          </Typography>
          <Typography
            noWrap
            sx={{ fontSize: { xs: '1.02rem', sm: '1.18rem' }, fontWeight: 800, color: T.ink, lineHeight: 1.25 }}
          >
            {active?.title}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
          <Typography sx={{ fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 900, color: T.accent, lineHeight: 1 }}>
            {pct}
            <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>%</Box>
          </Typography>
        </Box>
      </Box>

      {/* Progress track */}
      <Box sx={{ position: 'relative', height: 7, borderRadius: 999, bgcolor: T.lineSoft, overflow: 'hidden', mb: 1.5 }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${pct}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${T.accent} 0%, #34d399 100%)`,
            transition: 'width .45s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </Box>

      {/* Step dots — clickable up to the furthest reached section */}
      <Box
        ref={dotsRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 0.75 },
          overflowX: 'auto',
          /* Stop a sideways flick here from triggering browser back-nav. */
          overscrollBehaviorX: 'contain',
          WebkitOverflowScrolling: 'touch',
          pb: 0.5,
          '&::-webkit-scrollbar': { height: 0 },
          scrollbarWidth: 'none',
          maskImage: dotsMask,
          WebkitMaskImage: dotsMask,
        }}
      >
        {sections.map((s, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const reachable = i <= maxReached;
          return (
            <Tooltip key={i} title={s.short} arrow>
              {/* Padded wrapper carries the tap area (>=44px on touch) while the
                  inner chip keeps its compact visual size. */}
              <Box
                role="button"
                tabIndex={reachable ? 0 : -1}
                aria-label={s.short}
                aria-current={isCurrent ? 'step' : undefined}
                data-step={i}
                onClick={() => reachable && onJump(i)}
                onKeyDown={(e) => { if (reachable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onJump(i); } }}
                sx={{
                  flexShrink: 0,
                  cursor: reachable ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: { xs: 44, sm: 'auto' },
                  minHeight: { xs: 44, sm: 'auto' },
                  px: { xs: 0.25, sm: 0 },
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isCurrent ? { xs: 34, sm: 30 } : { xs: 30, sm: 26 },
                    height: isCurrent ? { xs: 34, sm: 30 } : { xs: 30, sm: 26 },
                    borderRadius: '9px',
                    fontSize: { xs: '0.78rem', sm: '0.72rem' },
                    fontWeight: 800,
                    transition: 'all .2s ease',
                    color: isCurrent ? '#fff' : done ? '#fff' : reachable ? T.muted : T.faint,
                    bgcolor: isCurrent ? T.brand : done ? T.accent : reachable ? '#fff' : '#f1f5f9',
                    border: `1.5px solid ${isCurrent ? T.brand : done ? T.accent : T.line}`,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.14)' : 'none',
                    '@media (hover: hover)': {
                      '&:hover': reachable && !isCurrent ? { borderColor: T.brand, color: T.brand } : {},
                    },
                  }}
                >
                  {done ? <CheckRoundedIcon sx={{ fontSize: '0.95rem' }} /> : i + 1}
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default SurveyProgress;
