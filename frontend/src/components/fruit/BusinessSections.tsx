import React, { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Container, Typography } from '@mui/material';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { SectionScene } from './SectionScenes';
import { SectionEmblem, TypeRow } from './LandingParts';
import { BusinessSection, BusinessType, Lang, SECTIONS, SectionId, pick, typesInSection } from './fruitBusinessTypes';
import type { LandingCopy } from './landingCopy';

const TOP_BAR = 65;
const NAV_HEIGHT = 64;
const SCROLL_OFFSET = TOP_BAR + NAV_HEIGHT + 12;
const sectionDomId = (id: SectionId) => `section-${id}`;

interface Props {
  lang: Lang;
  copy: LandingCopy;
  onSelect: (t: BusinessType) => void;
}

const SectionNav: React.FC<{ lang: Lang; active: SectionId; onJump: (id: SectionId) => void }> = ({ lang, active, onJump }) => {
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const rail = railRef.current;
    const tab = tabRefs.current[active];
    if (!rail || !tab) return;
    // Instant, and on the rail only: a second smooth scroll makes Chrome abandon the page's smooth jump.
    rail.scrollTo({ left: tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2, behavior: 'auto' });
  }, [active]);

  return (
    <Box
      component="nav"
      aria-label="1–5"
      sx={{
        position: 'sticky', top: TOP_BAR, zIndex: 20,
        bgcolor: 'rgba(245,249,242,0.94)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.line}`,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 3 } }}>
        <Box
          ref={railRef}
          sx={{
            display: 'flex', gap: 1, alignItems: 'center', height: NAV_HEIGHT, overflowX: 'auto', px: { xs: 2, sm: 0 },
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
            justifyContent: { lg: 'space-between' },
          }}
        >
          {SECTIONS.map((s) => {
            const on = s.id === active;
            const Emblem = SectionEmblem[s.id];
            return (
              <ButtonBase
                key={s.id}
                ref={(el) => { tabRefs.current[s.id] = el; }}
                onClick={() => onJump(s.id)}
                aria-current={on ? 'true' : undefined}
                sx={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 1, height: 44, pl: 0.6, pr: 1.75,
                  borderRadius: '999px',
                  bgcolor: on ? C.field : C.card,
                  border: `1.5px solid ${on ? C.field : C.line}`,
                  color: on ? C.onDark : C.ink,
                  transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
                  '&:hover': { borderColor: C.field },
                  ...focusRing,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    bgcolor: on ? C.mango : C.sprout, color: on ? C.leafDeep : C.field,
                    fontFamily: displayFont('en'), fontWeight: 800, fontSize: '1rem', transition: 'background-color 200ms ease',
                  }}
                >
                  {on ? s.number : <Emblem sx={{ fontSize: '1.05rem' }} />}
                </Box>
                <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', color: 'inherit' }}>
                  {s.number}. {pick(s.short, lang)}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

const SectionIntro: React.FC<{ section: BusinessSection; lang: Lang; copy: LandingCopy; count: number }> = ({ section, lang, copy, count }) => {
  const Emblem = SectionEmblem[section.id];
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 60, height: 60, borderRadius: '20px', display: 'grid', placeItems: 'center', flexShrink: 0,
            bgcolor: C.leafDeep, color: C.mango, fontFamily: displayFont('en'), fontWeight: 800, fontSize: '2rem',
            boxShadow: '0 10px 22px -14px rgba(15,61,34,0.9)',
          }}
        >
          {section.number}
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, height: 36, borderRadius: '999px', bgcolor: C.sprout, color: C.leaf }}>
          <Emblem aria-hidden sx={{ fontSize: '1.15rem' }} />
          <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{copy.typesCount(count)}</Typography>
        </Box>
      </Box>
      <Typography
        id={`${sectionDomId(section.id)}-title`}
        component="h2"
        sx={{
          mt: 2.5, fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, color: C.leaf, textWrap: 'balance',
          fontSize: lang === 'ta' ? { xs: '1.7rem', md: '2.25rem' } : { xs: '2rem', md: '2.75rem' },
        }}
      >
        {pick(section.title, lang)}
      </Typography>
      <Typography sx={{ mt: 1.25, maxWidth: '34rem', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.7, color: C.inkMuted }}>
        {pick(section.blurb, lang)}
      </Typography>
    </Box>
  );
};

const Scene: React.FC<{ id: SectionId; title: string }> = ({ id, title }) => {
  const Emblem = SectionEmblem[id];

  if (id === 'cultivation') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'center', md: 'center' },
          py: { xs: 1, md: 2 },
        }}
      >
        <Box
          component="img"
          src="/Farm.png"
          alt={title}
          sx={{
            width: '100%',
            maxWidth: { xs: 340, sm: 420, md: 480 },
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 16px 36px rgba(0, 0, 0, 0.4))',
            transition: 'transform 300ms ease',
            '&:hover': {
              transform: 'scale(1.04)',
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          borderRadius: '28px',
          overflow: 'hidden',
          aspectRatio: '360 / 160',
          bgcolor: C.sprout,
          boxShadow: '0 24px 48px -32px rgba(15,61,34,0.55)',
          border: `1.5px solid ${C.line}`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SectionScene id={id} title={title} />
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: { xs: 16, md: 24 },
          bottom: -22,
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: C.mango,
          color: C.leafDeep,
          border: `4px solid ${C.card}`,
          boxShadow: '0 8px 18px -10px rgba(15,61,34,0.7)',
        }}
      >
        <Emblem sx={{ fontSize: '1.5rem' }} />
      </Box>
    </Box>
  );
};

const RowList: React.FC<{ types: BusinessType[]; lang: Lang; copy: LandingCopy; onSelect: (t: BusinessType) => void; glyph?: boolean; columns?: 1 | 2 }> = ({
  types, lang, copy, onSelect, glyph = false, columns = 1,
}) => (
  <Box
    component="ul"
    sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', md: columns === 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr' } }}
  >
    {types.map((t, i) => (
      <Box
        component="li"
        key={t.slug}
        sx={{
          borderRadius: '18px', bgcolor: C.card, border: `1px solid ${C.line}`, p: 0.5,
          transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
          '&:hover': { borderColor: C.field, boxShadow: '0 12px 24px -18px rgba(15,61,34,0.6)', transform: 'translateY(-1px)' },
          animation: `fadeInUp 360ms ease ${Math.min(i, 8) * 40}ms both`,
        }}
      >
        <TypeRow type={t} lang={lang} codeLabel={copy.codeLabel} onSelect={onSelect} showGlyph={glyph} />
      </Box>
    ))}
  </Box>
);

const SubHeading: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => (
  <Typography component="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', md: '1.3rem' }, color: C.leaf, mb: 2, ...sx }}>
    {children}
  </Typography>
);

const SectionIntroOnDark: React.FC<{ section: BusinessSection; lang: Lang; copy: LandingCopy; count: number }> = ({ section, lang, copy, count }) => {
  const Emblem = SectionEmblem[section.id];
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 60, height: 60, borderRadius: '20px', display: 'grid', placeItems: 'center', flexShrink: 0,
            bgcolor: C.mango, color: C.leafDeep, fontFamily: displayFont('en'), fontWeight: 800, fontSize: '2rem',
            boxShadow: '0 10px 22px -14px rgba(0,0,0,0.7)',
          }}
        >
          {section.number}
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, height: 36, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.15)', color: C.onDark, backdropFilter: 'blur(6px)' }}>
          <Emblem aria-hidden sx={{ fontSize: '1.15rem' }} />
          <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{copy.typesCount(count)}</Typography>
        </Box>
      </Box>
      <Typography
        id={`${sectionDomId(section.id)}-title`}
        component="h2"
        sx={{
          mt: 2.5, fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, color: C.onDark, textWrap: 'balance',
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          fontSize: lang === 'ta' ? { xs: '1.7rem', md: '2.25rem' } : { xs: '2rem', md: '2.75rem' },
        }}
      >
        {pick(section.title, lang)}
      </Typography>
      <Typography sx={{ mt: 1.25, maxWidth: '34rem', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.7, color: C.onDarkMuted }}>
        {pick(section.blurb, lang)}
      </Typography>
    </Box>
  );
};

const BusinessSections: React.FC<Props> = ({ lang, copy, onSelect }) => {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Current = the last section whose top has scrolled up to just under the sticky bars.
      let current: SectionId = SECTIONS[0].id;
      SECTIONS.forEach((s) => {
        const el = document.getElementById(sectionDomId(s.id));
        if (el && el.getBoundingClientRect().top <= SCROLL_OFFSET + 48) current = s.id;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const jump = (id: SectionId) => {
    setActive(id);
    document.getElementById(sectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box id="types">
      <Box sx={{ pt: { xs: 6, md: 8 }, pb: 3 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, color: C.leaf,
              fontSize: lang === 'ta' ? { xs: '1.65rem', md: '2.2rem' } : { xs: '1.95rem', md: '2.6rem' },
            }}
          >
            {copy.allTypesTitle}
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: '40rem', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.7, color: C.inkMuted }}>
            {copy.allTypesLead}
          </Typography>
        </Container>
      </Box>

      <SectionNav lang={lang} active={active} onJump={jump} />

      {SECTIONS.map((section, index) => {
        const types = typesInSection(section.id);
        const title = pick(section.title, lang);
        const tinted = index % 2 === 0;
        const isCultivation = section.id === 'cultivation';
        const sceneFirst = index % 2 === 1;
        // Short lists sit beside the intro; long ones scroll past a pinned intro.
        const shortList = types.length <= 4;

        return (
          <Box
            component="section"
            key={section.id}
            id={sectionDomId(section.id)}
            aria-labelledby={`${sectionDomId(section.id)}-title`}
            sx={{
              scrollMarginTop: SCROLL_OFFSET,
              py: { xs: 7, md: 10 },
              ...(isCultivation
                ? {
                    backgroundImage: 'url(/1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, rgba(10,44,22,0.82) 0%, rgba(15,61,34,0.70) 50%, rgba(20,83,45,0.60) 100%)',
                      pointerEvents: 'none',
                    },
                  }
                : { bgcolor: tinted ? '#EDF6E8' : C.page }),
              borderTop: index > 0 ? `1px solid ${C.line}` : undefined,
            }}
          >
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative' }}>
              {isCultivation ? (
                <>
                  <Box sx={{ display: 'grid', gap: { xs: 4, md: 6 }, alignItems: 'center', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' } }}>
                    <SectionIntroOnDark section={section} lang={lang} copy={copy} count={types.length} />
                    <Scene id={section.id} title={title} />
                  </Box>

                  <Box sx={{ mt: { xs: 7, md: 8 } }}>
                    <SubHeading sx={{ color: C.onDark }}>{copy.classesLabel}</SubHeading>
                    <RowList types={types.filter((t) => t.isClass)} lang={lang} copy={copy} onSelect={onSelect} glyph columns={2} />
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'grid', gap: { xs: 5, md: 7 }, alignItems: shortList ? 'center' : 'start', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' } }}>
                  <Box
                    sx={{
                      order: { md: sceneFirst ? 2 : 1 },
                      position: { md: shortList ? 'static' : 'sticky' }, top: { md: SCROLL_OFFSET + 8 },
                      display: 'flex', flexDirection: 'column', gap: { xs: 4, md: 5 },
                    }}
                  >
                    <SectionIntro section={section} lang={lang} copy={copy} count={types.length} />
                    <Scene id={section.id} title={title} />
                  </Box>
                  <Box sx={{ order: { md: sceneFirst ? 1 : 2 }, pt: { md: 1 } }}>
                    <RowList types={types} lang={lang} copy={copy} onSelect={onSelect} />
                  </Box>
                </Box>
              )}
            </Container>
          </Box>
        );
      })}
    </Box>
  );
};

export default BusinessSections;
