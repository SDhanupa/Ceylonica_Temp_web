import React from 'react';
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import type { VillageProgress } from '../../api/contributions';
import { fill, useContributeCopy } from './copy';
import { CountUp, EASE, useMounted } from './motion';
import { ink } from './tokens';

export const formatPercent = (value: number): string => (value > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value)));

interface VillageProgressCardProps {
  progress: VillageProgress | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  actions?: React.ReactNode;
}

const SIZE = 112;
const STROKE = 9;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/**
 * How complete a village's record is, as the reason to contribute. The ring
 * tracks topics (leaf categories) with at least one approved record.
 */
const VillageProgressCard: React.FC<VillageProgressCardProps> = ({ progress, loading, error, onRetry, actions }) => {
  const { t } = useContributeCopy();
  const mounted = useMounted();

  if (error) {
    return (
      <Alert
        severity="warning"
        sx={{ borderRadius: '16px' }}
        action={
          <Button color="inherit" size="small" onClick={onRetry} sx={{ boxShadow: 'none' }}>
            {t.retry}
          </Button>
        }
      >
        {t.progressError}
      </Alert>
    );
  }

  const s = progress?.summary;
  const pct = s?.completion ?? 0;
  // A sliver keeps the ring legible when a village has barely started.
  const shown = !loading && mounted ? (pct > 0 ? Math.max(pct, 3) : 0) : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: { xs: '20px', sm: '24px' },
        bgcolor: 'rgba(255,255,255,.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,.6)',
        boxShadow: '0 1px 2px rgba(10,12,15,.06), 0 30px 60px -24px rgba(10,12,15,.45)',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 4 }} sx={{ alignItems: { md: 'center' } }}>
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }} role="img" aria-label={fill(t.progressComplete, { pct: formatPercent(pct) })}>
            <Box component="svg" viewBox={`0 0 ${SIZE} ${SIZE}`} sx={{ width: SIZE, height: SIZE, transform: 'rotate(-90deg)' }}>
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={ink[100]} strokeWidth={STROKE} />
              <Box
                component="circle"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={ink[900]}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - shown / 100)}
                sx={{ transition: `stroke-dashoffset 1400ms ${EASE}`, '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}
              />
            </Box>
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              {loading ? (
                <Skeleton width={44} height={30} />
              ) : (
                <Typography sx={{ fontWeight: 800, fontSize: '1.55rem', letterSpacing: '-0.04em', lineHeight: 1, color: ink[900], fontVariantNumeric: 'tabular-nums' }}>
                  {formatPercent(pct)}
                  <Box component="span" sx={{ fontSize: '0.85rem', fontWeight: 600, color: ink[400] }}>
                    %
                  </Box>
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: ink[400], textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t.progressTitle}
            </Typography>
            {loading || !s ? (
              <>
                <Skeleton width={180} height={26} />
                <Skeleton width={150} height={20} />
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', mt: 0.25, color: ink[900], letterSpacing: '-0.01em' }}>
                  {fill(t.progressTopics, { covered: s.topics_covered, total: s.topics_total })}
                </Typography>
                <Typography variant="body2" sx={{ color: ink[500] }}>
                  {fill(t.progressCategories, { covered: s.categories_covered, total: s.categories_total })}
                </Typography>
              </>
            )}
          </Box>
        </Stack>

        <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: '1px', bgcolor: ink[100], borderRadius: '16px', overflow: 'hidden', border: `1px solid ${ink[100]}` }}>
          <Stat label={t.statRecords} value={s?.records} loading={loading} />
          <Stat label={t.statInReview} value={s?.in_review} loading={loading} />
          <Stat label={t.statContributors} value={s?.contributors} loading={loading} />
          <Stat label={t.statBusinesses} value={s?.businesses_surveyed} loading={loading} />
        </Box>
      </Stack>

      {actions && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${ink[100]}` }}>
          {actions}
        </Stack>
      )}
    </Paper>
  );
};

const Stat: React.FC<{ label: string; value?: number; loading: boolean }> = ({ label, value, loading }) => (
  <Box sx={{ p: 1.75, bgcolor: '#fff', transition: 'background-color 200ms ease', '&:hover': { bgcolor: ink[50] } }}>
    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: ink[400] }} noWrap>
      {label}
    </Typography>
    {loading || value === undefined ? (
      <Skeleton width={40} height={30} />
    ) : (
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em', color: ink[900], fontVariantNumeric: 'tabular-nums' }}>
        <CountUp value={value} />
      </Typography>
    )}
  </Box>
);

export default VillageProgressCard;
