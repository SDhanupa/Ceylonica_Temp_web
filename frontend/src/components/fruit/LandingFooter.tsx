import React from 'react';
import { Box, Button, ButtonBase, Container, Typography } from '@mui/material';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { SECTIONS, Lang, pick } from './fruitBusinessTypes';
import { SectionEmblem } from './LandingParts';
import { CDIC, CSA, MinistryEmblem, PartnerCard, logoSx } from './PartnerLogos';
import type { LandingCopy } from './landingCopy';

const EMAIL = 'cdicceylon@gmail.com';

const TEXT: Record<Lang, { tagline: string; sections: string; ctaTitle: string; contact: string; contactLead: string; backToTop: string }> = {
  si: {
    tagline: 'ඔබේ ග්‍රාම නිලධාරී වසමේ කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණය.',
    sections: 'ව්‍යාපාර කොටස්',
    ctaTitle: 'ඔබේ ව්‍යාපාරය තවම ලියාපදිංචි කර නැද්ද?',
    contact: 'අප අමතන්න',
    contactLead: 'ප්‍රශ්නයක් තිබේද? අපට ලියන්න.',
    backToTop: 'ඉහළට',
  },
  ta: {
    tagline: 'உங்கள் கிராம உத்தியோகத்தர் பிரிவின் கைத்தொழில் மற்றும் வணிகக் கணக்கெடுப்பு.',
    sections: 'வணிகப் பிரிவுகள்',
    ctaTitle: 'உங்கள் வணிகத்தை இன்னும் பதிவு செய்யவில்லையா?',
    contact: 'தொடர்புக்கு',
    contactLead: 'கேள்வி உள்ளதா? எங்களுக்கு எழுதுங்கள்.',
    backToTop: 'மேலே',
  },
  en: {
    tagline: 'The Industry and Business Survey for your Grama Niladhari division.',
    sections: 'Business sections',
    ctaTitle: 'Is your business registered yet?',
    contact: 'Contact us',
    contactLead: 'Have a question? Write to us.',
    backToTop: 'Back to top',
  },
};

interface Props {
  lang: Lang;
  copy: LandingCopy;
  onStart: () => void;
  onFind: () => void;
  /** Where a section link goes; defaults to scrolling within the current page. */
  onSection?: (sectionId: string) => void;
  /** The "register your business" card; off on the survey itself. */
  showCta?: boolean;
}

const ColumnTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography component="h2" sx={{ fontWeight: 800, fontSize: '0.95rem', color: C.onDark, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box aria-hidden component="span" sx={{ width: 18, height: 3, borderRadius: 2, bgcolor: C.mango }} />
    {children}
  </Typography>
);

const LandingFooter: React.FC<Props> = ({ lang, copy, onStart, onFind, onSection, showCta = true }) => {
  const t = TEXT[lang] ?? TEXT.si;
  const jump = onSection ?? ((id: string) => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  return (
    <Box component="footer" sx={{ position: 'relative', bgcolor: C.page }}>
      {/* Curved top edge */}
      <Box aria-hidden sx={{ display: 'block', lineHeight: 0, color: '#0B3320' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" width="100%" height="80" style={{ display: 'block' }}>
          <path d="M0,80 C320,10 1120,10 1440,80 L1440,80 L0,80 Z" fill="currentColor" />
        </svg>
      </Box>

      <Box
        sx={{
          position: 'relative', color: C.onDarkMuted,
          background: [
            'radial-gradient(600px circle at 12% 18%, rgba(255,194,51,0.16), transparent 60%)',
            'radial-gradient(700px circle at 92% 70%, rgba(21,128,61,0.45), transparent 60%)',
            'linear-gradient(180deg, #0B3320 0%, #072414 100%)',
          ].join(', '),
          pb: { xs: 'calc(104px + env(safe-area-inset-bottom))', md: 4 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative' }}>
          <Box sx={{ position: 'relative', zIndex: 1, mt: { xs: -5, md: -6 } }}>
            <PartnerCard lang={lang} />
          </Box>

          <Box
            sx={{
              mt: { xs: 6, md: 8 },
              display: 'grid', gap: { xs: 5, md: 4 },
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: showCta ? '1.3fr 1fr 1.25fr 1fr' : '1.4fr 1fr 1fr' },
            }}
          >
            {/* Brand */}
            <Box>
              <Box
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1.25, bgcolor: C.card, borderRadius: '999px',
                  px: 1.5, py: 0.75, boxShadow: '0 10px 24px -16px rgba(0,0,0,0.8)',
                }}
              >
                <Box component="img" src={CDIC.src} alt={CDIC.alt} loading="lazy" sx={{ ...logoSx, height: 38, width: 'auto' }} />
                <Box aria-hidden sx={{ width: '1px', height: 24, bgcolor: C.line }} />
                <Box component="img" src={CSA.src} alt={CSA.alt} loading="lazy" sx={{ ...logoSx, height: 34, width: 'auto' }} />
                <Box aria-hidden sx={{ width: '1px', height: 24, bgcolor: C.line }} />
                <MinistryEmblem height={38} width={28} />
              </Box>
              <Typography sx={{ mt: 2.5, fontFamily: "'Gemunu Libre', sans-serif", fontWeight: 800, fontSize: '2rem', lineHeight: 1, color: C.onDark }}>
                Ceylonica
              </Typography>
              <Typography sx={{ mt: 1.25, maxWidth: '22rem', fontSize: '0.98rem', lineHeight: 1.7, color: C.onDarkMuted }}>
                {t.tagline}
              </Typography>
            </Box>

            {/* Sections */}
            <Box component="nav" aria-label={t.sections}>
              <ColumnTitle>{t.sections}</ColumnTitle>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 0.25 }}>
                {SECTIONS.map((s) => {
                  const Emblem = SectionEmblem[s.id];
                  return (
                    <li key={s.id}>
                      <ButtonBase
                        onClick={() => jump(s.id)}
                        sx={{
                          width: '100%', justifyContent: 'flex-start', gap: 1.25, minHeight: 44, px: 1, ml: -1, borderRadius: '12px',
                          color: C.onDarkMuted, textAlign: 'left', transition: 'background-color 160ms ease, color 160ms ease',
                          '& .emblem': { transition: 'background-color 160ms ease, color 160ms ease' },
                          '&:hover': { color: C.onDark, bgcolor: 'rgba(255,255,255,0.06)', '& .emblem': { bgcolor: C.mango, color: C.leafDeep } },
                          ...focusRing,
                        }}
                      >
                        <Box
                          className="emblem"
                          aria-hidden
                          sx={{ width: 30, height: 30, borderRadius: '10px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: 'rgba(255,255,255,0.08)', color: C.mango }}
                        >
                          <Emblem sx={{ fontSize: '1rem' }} />
                        </Box>
                        <Typography component="span" sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'inherit' }}>
                          {s.number}. {pick(s.short, lang)}
                        </Typography>
                      </ButtonBase>
                    </li>
                  );
                })}
              </Box>
            </Box>

            {/* Call to action */}
            {showCta && (<Box
              sx={{
                alignSelf: 'start', borderRadius: '24px', p: { xs: 2.5, md: 3 },
                bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,194,51,0.35)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Typography
                component="h2"
                sx={{ fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, color: C.mango, fontSize: lang === 'ta' ? '1.3rem' : '1.55rem', textWrap: 'balance' }}
              >
                {t.ctaTitle}
              </Typography>
              <Button
                onClick={onStart}
                startIcon={<EditNoteRoundedIcon />}
                fullWidth
                sx={{
                  mt: 2.25, minHeight: 48, borderRadius: '999px', textTransform: 'none', fontWeight: 800, fontSize: '1rem',
                  color: C.leafDeep, bgcolor: C.mango, boxShadow: '0 12px 26px -14px rgba(255,194,51,0.9)',
                  '&:hover': { bgcolor: C.mangoHover, boxShadow: '0 12px 26px -14px rgba(255,194,51,0.9)' },
                  ...focusRing,
                }}
              >
                {copy.startSurvey}
              </Button>
              <ButtonBase
                onClick={onFind}
                sx={{
                  mt: 1, width: '100%', minHeight: 44, borderRadius: '999px', gap: 1, color: C.onDark, fontWeight: 700, fontSize: '0.95rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }, ...focusRing,
                }}
              >
                <SearchRoundedIcon aria-hidden sx={{ fontSize: '1.15rem' }} />
                {copy.findType}
              </ButtonBase>
            </Box>)}

            {/* Contact */}
            <Box>
              <ColumnTitle>{t.contact}</ColumnTitle>
              <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, mb: 1.5, color: C.onDarkMuted }}>{t.contactLead}</Typography>
              <Box
                component="a"
                href={`mailto:${EMAIL}`}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25, minHeight: 52, px: 1.5, borderRadius: '16px',
                  bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: C.onDark, textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem', wordBreak: 'break-all',
                  transition: 'border-color 160ms ease, background-color 160ms ease',
                  '&:hover': { borderColor: C.mango, bgcolor: 'rgba(255,255,255,0.1)' },
                  ...focusRing,
                }}
              >
                <Box aria-hidden sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: C.mango, color: C.leafDeep }}>
                  <MailOutlineRoundedIcon sx={{ fontSize: '1.15rem' }} />
                </Box>
                {EMAIL}
              </Box>
            </Box>
          </Box>

          {/* Bottom bar */}
          <Box
            sx={{
              mt: { xs: 5, md: 7 }, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between', gap: 2,
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: C.onDarkMuted }}>{copy.footerRights}</Typography>
            <ButtonBase
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              sx={{
                gap: 1, minHeight: 44, pl: 1.75, pr: 0.75, borderRadius: '999px', color: C.onDark, fontWeight: 700, fontSize: '0.9rem',
                border: '1px solid rgba(255,255,255,0.18)',
                '& .arrow': { transition: 'transform 180ms ease' },
                '&:hover': { borderColor: C.mango, '& .arrow': { transform: 'translateY(-2px)' } },
                ...focusRing,
              }}
            >
              {t.backToTop}
              <Box className="arrow" aria-hidden sx={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: C.mango, color: C.leafDeep }}>
                <NorthRoundedIcon sx={{ fontSize: '1.05rem' }} />
              </Box>
            </ButtonBase>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingFooter;
