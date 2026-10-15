import React from 'react';
import { Box, Typography } from '@mui/material';
import { C } from './tokens';
import type { Lang } from './fruitBusinessTypes';

export const MINISTRY = {
  src: '/ministry.webp',
  alt: 'Ministry of Trade, Commerce, Food Security and Co-operative Development',
};
export const CSA = { src: '/csa.webp', alt: 'CSA' };
export const CDIC = { src: '/logo-192.webp', alt: 'CDIC' };

export const PARTNER_LABEL: Record<Lang, string> = {
  si: 'හවුල්කාරිත්වයෙන්',
  ta: 'கூட்டு முயற்சியுடன்',
  en: 'In partnership with',
};

const Divider: React.FC<{ height: number | object }> = ({ height }) => (
  <Box aria-hidden sx={{ width: '1px', height, bgcolor: C.line, flexShrink: 0 }} />
);

// White-background JPEGs sit on white surfaces; multiply drops any off-white edge.
export const logoSx = { display: 'block', objectFit: 'contain', mixBlendMode: 'multiply' } as const;

/** The Ministry lockup cropped to its emblem, for places too small to read its name. */
export const MinistryEmblem: React.FC<{ height: number; width: number }> = ({ height, width }) => (
  <Box
    component="img"
    src={MINISTRY.src}
    alt={MINISTRY.alt}
    sx={{ ...logoSx, height, width, objectFit: 'cover', objectPosition: 'left center' }}
  />
);

/** Partner marks beside the CDIC logo in the sticky header. */
export const HeaderPartnerLogos: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.25 }, minWidth: 0 }}>
    <Divider height={28} />
    <Box component="img" src={CSA.src} alt={CSA.alt} sx={{ ...logoSx, height: { xs: 30, sm: 34 }, width: 'auto' }} />
    {/* Emblem only: the lockup's three-language name is unreadable at header height. */}
    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.25 }}>
      <Divider height={28} />
      <MinistryEmblem height={40} width={30} />
    </Box>
  </Box>
);

/** White card with all three partners at readable size. */
export const PartnerCard: React.FC<{ lang: Lang }> = ({ lang }) => (
  <Box
    component="section"
    aria-label={PARTNER_LABEL[lang]}
    sx={{
      bgcolor: C.card, borderRadius: '28px',
      boxShadow: '0 30px 60px -28px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.6)',
      px: { xs: 2.5, md: 5 }, pt: { xs: 3.5, md: 4 }, pb: { xs: 3, md: 3.5 },
      position: 'relative', overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute', left: 0, right: 0, top: 0, height: 5,
        background: `linear-gradient(90deg, ${C.field}, ${C.mango}, ${C.papaya}, ${C.mango}, ${C.field})`,
      },
    }}
  >
    <Typography
      sx={{
        textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', letterSpacing: lang === 'en' ? '0.16em' : 0,
        textTransform: 'uppercase', color: C.inkMuted, mb: { xs: 2.5, md: 3 },
      }}
    >
      {PARTNER_LABEL[lang]}
    </Typography>
    <Box
      sx={{
        display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center',
        gap: { xs: 3, md: 5 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 5 } }}>
        <Box component="img" src={CDIC.src} alt={CDIC.alt} loading="lazy" sx={{ ...logoSx, height: { xs: 64, md: 76 }, width: 'auto' }} />
        <Divider height={{ xs: 48, md: 60 }} />
        <Box component="img" src={CSA.src} alt={CSA.alt} loading="lazy" sx={{ ...logoSx, height: { xs: 60, md: 72 }, width: 'auto' }} />
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Divider height={60} />
      </Box>
      <Box
        component="img"
        src={MINISTRY.src}
        alt={MINISTRY.alt}
        loading="lazy"
        sx={{ ...logoSx, width: '100%', maxWidth: { xs: 360, md: 460 }, height: 'auto' }}
      />
    </Box>
  </Box>
);
