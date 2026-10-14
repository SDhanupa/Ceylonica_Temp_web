import React from 'react';
import { Box, Button, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useVillageProgress } from '../../api/contributions';
import { fill, useContributeCopy } from './copy';
import { formatPercent } from './VillageProgressCard';
import { ink } from './tokens';

interface ContributeBannerProps {
  ccode: string | null | undefined;
  villageName: string;
  isAuthenticated: boolean;
  isDarkMode?: boolean;
  onContribute: () => void;
  onJoin: () => void;
  compact?: boolean;
}

/**
 * The invitation to contribute, on the public village page. Monochrome, and
 * adapts to the village page's own light/dark theme.
 */
const ContributeBanner: React.FC<ContributeBannerProps> = ({ ccode, villageName, isAuthenticated, isDarkMode = false, onContribute, onJoin, compact = false }) => {
  const { t } = useContributeCopy();
  const { data, loading } = useVillageProgress(ccode);

  if (!ccode) return null;

  const pct = data?.summary.completion ?? 0;
  const hasData = (data?.summary.records ?? 0) > 0;
  const body = hasData ? fill(t.bannerBody, { village: villageName, pct: formatPercent(pct) }) : fill(t.bannerBodyNoData, { village: villageName });

  const c = isDarkMode
    ? { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', fg: '#F5F6F8', muted: 'rgba(245,246,248,0.62)', tile: 'rgba(255,255,255,0.1)', track: 'rgba(255,255,255,0.12)', bar: '#F5F6F8', btnBg: '#F5F6F8', btnFg: ink[900] }
    : { bg: '#fff', border: ink[200], fg: ink[900], muted: ink[500], tile: ink[100], track: ink[100], bar: ink[900], btnBg: ink[900], btnFg: '#fff' };

  return (
    <Box
      component="section"
      aria-label={t.bannerTitle}
      sx={{ position: 'relative', borderRadius: compact ? '14px' : '16px', border: '1px solid', borderColor: c.border, bgcolor: c.bg, p: compact ? 2.25 : { xs: 2.5, md: 3 } }}
    >
      <Stack direction={{ xs: 'column', md: compact ? 'column' : 'row' }} spacing={compact ? 2 : { xs: 2.5, md: 4 }} sx={{ alignItems: { md: compact ? 'stretch' : 'center' } }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '11px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: c.tile, color: c.fg }}>
            <VolunteerActivismOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: compact ? '1rem' : '1.1rem', color: c.fg, letterSpacing: '-0.01em', mb: 0.5 }}>{t.bannerTitle}</Typography>
            {loading ? <Skeleton width="80%" height={20} /> : <Typography sx={{ color: c.muted, fontSize: '0.9rem', lineHeight: 1.55 }}>{body}</Typography>}
          </Box>
        </Stack>

        <Stack spacing={1.25} sx={{ width: { xs: '100%', md: compact ? '100%' : 280 }, flexShrink: 0 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.progressTitle}</Typography>
            <Typography sx={{ fontWeight: 700, color: c.fg }}>{loading ? '…' : `${formatPercent(pct)}%`}</Typography>
          </Stack>
          <LinearProgress
            variant={loading ? 'indeterminate' : 'determinate'}
            value={pct > 0 ? Math.max(pct, 2) : 0}
            aria-label={t.progressTitle}
            sx={{ height: 6, borderRadius: 999, bgcolor: c.track, '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: c.bar } }}
          />
          <Button
            disableElevation
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={isAuthenticated ? onContribute : onJoin}
            sx={{ mt: 0.5, py: 1, borderRadius: '10px', fontWeight: 700, textTransform: 'none', bgcolor: c.btnBg, color: c.btnFg, boxShadow: 'none', '&:hover': { bgcolor: c.btnBg, filter: 'brightness(0.92)', boxShadow: 'none', transform: 'none' } }}
          >
            {isAuthenticated ? t.bannerCta : t.bannerCtaGuest}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ContributeBanner;
