import React from 'react';
import { Box, ButtonBase, Container, Typography } from '@mui/material';
import { C, focusRing } from './tokens';
import { HeaderPartnerLogos } from './PartnerLogos';
import { LanguageSwitch } from './LandingParts';
import type { Lang } from './fruitBusinessTypes';

interface Props {
  lang: Lang;
  onLanguage: (l: Lang) => void;
  onLogo: () => void;
  logoLabel?: string;
  /** Right-most control, e.g. the survey button or a back link. */
  action?: React.ReactNode;
}

/** Sticky brand bar shared by the GN landing page and the survey. */
const SiteTopBar: React.FC<Props> = ({ lang, onLanguage, onLogo, logoLabel = 'Ceylonica', action }) => (
  <Box
    component="header"
    sx={{
      position: 'sticky', top: 0, zIndex: 30,
      // Opaque so the white-backed partner JPEGs never show as boxes over dark sections.
      bgcolor: '#FFFFFF', borderBottom: `1px solid ${C.line}`,
    }}
  >
    <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minHeight: 64, px: { xs: 2, sm: 3 } }}>
      <ButtonBase
        onClick={onLogo}
        aria-label={logoLabel}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: '12px', p: 0.5, ...focusRing }}
      >
        <Box component="img" src="/logo-96.webp" alt="" width={36} height={36} sx={{ width: 36, height: 36, objectFit: 'contain' }} />
        <Typography
          component="span"
          sx={{ display: { xs: 'none', sm: 'block' }, fontFamily: "'Gemunu Libre', sans-serif", fontWeight: 800, fontSize: '1.45rem', color: C.leaf }}
        >
          Ceylonica
        </Typography>
      </ButtonBase>
      <HeaderPartnerLogos />
      <Box sx={{ flex: 1 }} />
      <LanguageSwitch value={lang} onChange={onLanguage} />
      {action}
    </Container>
  </Box>
);

export default SiteTopBar;
