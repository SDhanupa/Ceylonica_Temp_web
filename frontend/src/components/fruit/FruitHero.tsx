import React from 'react';
import { keyframes } from '@emotion/react';
import { Box, Button, ButtonBase, Container, Skeleton, Typography } from '@mui/material';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { FruitIcon } from './FruitIcons';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { primaryCtaSx } from './StartSurveyDialog';
import type { FruitKind, Lang } from './fruitBusinessTypes';
import type { LandingCopy } from './landingCopy';

const fruitIn = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.82); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

interface Placement {
  kind: FruitKind;
  left: number;
  top: number;
  size: number;
  rotate?: number;
}

/* left/size are % of the box width, top is % of its height. */
const SQUARE: Placement[] = [
  { kind: 'grapes', left: 70, top: 4, size: 26, rotate: 8 },
  { kind: 'pineapple', left: 40, top: -4, size: 36, rotate: -4 },
  { kind: 'passion', left: 10, top: 8, size: 26 },
  { kind: 'papaya', left: 0, top: 30, size: 36, rotate: -16 },
  { kind: 'orange', left: 64, top: 31, size: 32 },
  { kind: 'mango', left: 30, top: 27, size: 42, rotate: 14 },
  { kind: 'banana', left: 13, top: 57, size: 44, rotate: -8 },
  { kind: 'pomegranate', left: 72, top: 61, size: 25 },
  { kind: 'avocado', left: 50, top: 63, size: 28, rotate: 12 },
  { kind: 'rambutan', left: 0, top: 70, size: 22 },
  { kind: 'lime', left: 87, top: 50, size: 15 },
];

const BAND: Placement[] = [
  { kind: 'passion', left: -3, top: 30, size: 22 },
  { kind: 'papaya', left: 11, top: 4, size: 26, rotate: -14 },
  { kind: 'pineapple', left: 35, top: -8, size: 30 },
  { kind: 'grapes', left: 81, top: 4, size: 22, rotate: 8 },
  { kind: 'mango', left: 59, top: 12, size: 28, rotate: 14 },
  { kind: 'banana', left: 21, top: 44, size: 31, rotate: -6 },
  { kind: 'orange', left: 50, top: 50, size: 21 },
  { kind: 'rambutan', left: 72, top: 52, size: 19 },
];

const Leaf: React.FC<{ style: React.CSSProperties; fill: string }> = ({ style, fill }) => (
  <svg viewBox="0 0 120 60" aria-hidden focusable="false" style={{ position: 'absolute', ...style }}>
    <path d="M2 30C30 2 84 -2 118 30 84 62 30 58 2 30z" fill={fill} />
    <path d="M8 30h104M40 30l-14-12M40 30l-14 12M70 30l-14-14M70 30l-14 14M96 30l-10-10M96 30l-10 10"
      stroke="rgba(0,0,0,0.18)" strokeWidth={2} strokeLinecap="round" fill="none" />
  </svg>
);

const FruitCluster: React.FC<{ layout: Placement[]; ratio: string; leaves?: boolean }> = ({ layout, ratio, leaves }) => (
  <Box aria-hidden sx={{ position: 'relative', width: '100%', aspectRatio: ratio }}>
    <Box
      sx={{
        position: 'absolute', inset: '8% 6%', borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, rgba(255,194,51,0.28) 0%, rgba(255,194,51,0) 68%)',
      }}
    />
    {leaves && (
      <>
        <Leaf fill="#2F9E44" style={{ width: '46%', left: '-6%', top: '20%', transform: 'rotate(-28deg)' }} />
        <Leaf fill="#237A35" style={{ width: '42%', right: '-8%', top: '50%', transform: 'rotate(24deg)' }} />
        <Leaf fill="#3FB950" style={{ width: '34%', left: '40%', top: '-4%', transform: 'rotate(-70deg)' }} />
      </>
    )}
    {layout.map((p, i) => (
      <Box
        key={`${p.kind}-${i}`}
        sx={{
          position: 'absolute',
          left: `${p.left}%`,
          top: `${p.top}%`,
          width: `${p.size}%`,
          transform: `rotate(${p.rotate ?? 0}deg)`,
          filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.25))',
        }}
      >
        <Box sx={{ animation: `${fruitIn} 640ms cubic-bezier(.34,1.56,.64,1) ${120 + i * 70}ms both` }}>
          <FruitIcon kind={p.kind} size="100%" />
        </Box>
      </Box>
    ))}
  </Box>
);

export interface AreaSummary {
  name: string;
  place: string;
  code: string;
}

interface Props {
  lang: Lang;
  copy: LandingCopy;
  area: AreaSummary | null;
  areaLoading: boolean;
  onStart: () => void;
  onFind: () => void;
  onPickArea: () => void;
  ctaRef: React.Ref<HTMLDivElement>;
}

const FruitHero: React.FC<Props> = ({ lang, copy, area, areaLoading, onStart, onFind, onPickArea, ctaRef }) => (
  <Box
    component="section"
    aria-labelledby="hero-title"
    sx={{
      position: 'relative',
      overflow: 'hidden',
      color: C.onDark,
      bgcolor: C.leafDeep,
      backgroundImage:
        'radial-gradient(70% 90% at 88% 18%, #1D6B3B 0%, rgba(15,61,34,0) 70%), radial-gradient(50% 60% at 0% 100%, #134A29 0%, rgba(15,61,34,0) 70%)',
      pb: { xs: 8, md: 11 },
    }}
  >
    <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 2.5, md: 6 }, px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.08fr 0.92fr' },
          gap: { xs: 2, md: 5 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: '999px',
              bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)',
              animation: 'fadeInUp 420ms ease both',
            }}
          >
            <FruitIcon kind="sapling" size={22} />
            <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.95rem', color: C.onDark }}>
              {copy.eventBadge}
            </Typography>
          </Box>

          <Typography
            id="hero-title"
            component="h1"
            sx={{
              mt: 2,
              fontFamily: displayFont(lang),
              fontWeight: 800,
              lineHeight: displayLeading(lang),
              fontSize: lang === 'ta'
                ? { xs: '2rem', sm: '2.5rem', md: '2.9rem', lg: '3.3rem' }
                : { xs: '2.4rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
              color: C.mango,
              textWrap: 'balance',
              animation: 'fadeInUp 480ms ease 60ms both',
            }}
          >
            {copy.heroTitle}
          </Typography>

          <Typography
            sx={{
              mt: 2,
              maxWidth: '36rem',
              fontSize: { xs: '1.05rem', md: '1.18rem' },
              lineHeight: 1.75,
              color: C.onDarkMuted,
              animation: 'fadeInUp 480ms ease 120ms both',
            }}
          >
            {copy.heroLead}
          </Typography>

          <Box
            ref={ctaRef}
            sx={{
              mt: 3.5,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: 1.5,
              animation: 'fadeInUp 480ms ease 180ms both',
            }}
          >
            <Button onClick={onStart} startIcon={<EditNoteRoundedIcon />} sx={primaryCtaSx}>
              {copy.startSurvey}
            </Button>
            <Button
              onClick={onFind}
              startIcon={<SearchRoundedIcon />}
              sx={{
                minHeight: 56, px: 3, borderRadius: '999px', textTransform: 'none', fontWeight: 700, fontSize: '1.02rem',
                color: C.onDark, border: '1.5px solid rgba(255,255,255,0.5)', boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: C.onDark, boxShadow: 'none', transform: 'none' },
                ...focusRing,
              }}
            >
              {copy.findType}
            </Button>
          </Box>

          <ButtonBase
            onClick={onPickArea}
            aria-label={area ? `${copy.areaLabel}: ${area.name} (${area.code}). ${copy.areaChange}` : copy.areaChoose}
            sx={{
              mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.25,
              width: { xs: '100%', sm: 'auto' }, maxWidth: '100%', textAlign: 'left',
              px: 1.75, py: 1.1, minHeight: 56, borderRadius: '16px',
              bgcolor: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.3)',
              transition: 'background-color 160ms ease',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              ...focusRing,
              animation: 'fadeInUp 480ms ease 240ms both',
            }}
          >
            <PlaceRoundedIcon aria-hidden sx={{ color: C.mango }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {areaLoading && !area ? (
                <Skeleton variant="text" width={180} sx={{ bgcolor: 'rgba(255,255,255,0.18)' }} />
              ) : area ? (
                <>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1.4, color: C.onDark }}>
                    {area.name} <Box component="span" sx={{ opacity: 0.75, fontWeight: 600 }}>({area.code})</Box>
                  </Typography>
                  {area.place && <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.45, color: C.onDarkMuted }}>{area.place}</Typography>}
                </>
              ) : (
                <Typography sx={{ fontWeight: 700, color: C.onDark }}>{copy.areaChoose}</Typography>
              )}
            </Box>
            {area && (
              <Typography component="span" sx={{ flexShrink: 0, fontSize: '0.9rem', fontWeight: 700, color: C.mango, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {copy.areaChange}
              </Typography>
            )}
          </ButtonBase>
        </Box>

        <Box sx={{ order: { xs: 1, md: 2 }, minWidth: 0 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mx: { xs: -1, sm: 0 } }}>
            <FruitCluster layout={BAND} ratio="2 / 1" />
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 500, ml: 'auto' }}>
            <FruitCluster layout={SQUARE} ratio="1 / 1" leaves />
          </Box>
        </Box>
      </Box>
    </Container>

    <Box
      component="svg"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      aria-hidden
      sx={{ position: 'absolute', left: 0, bottom: -1, width: '100%', height: { xs: 28, md: 52 }, display: 'block' }}
    >
      <path d="M0 42C360 4 1080 4 1440 42V60H0z" fill={C.page} />
    </Box>
  </Box>
);

export default FruitHero;
