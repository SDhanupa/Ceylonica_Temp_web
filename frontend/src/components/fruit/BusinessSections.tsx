import React, { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Container, Typography } from '@mui/material';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { SectionEmblem, TypeRow } from './LandingParts';
import { BusinessSection, BusinessType, Lang, SECTIONS, SectionId, pick, typesInSection } from './fruitBusinessTypes';
import type { LandingCopy } from './landingCopy';

const TOP_BAR = 65;
const NAV_HEIGHT = 64;
const SCROLL_OFFSET = TOP_BAR + NAV_HEIGHT + 12;
const sectionDomId = (id: SectionId) => `section-${id}`;

const PHOTO: Record<SectionId, string> = {
  cultivation: '/1.jpg',
  postharvest: '/2.jpg',
  processing: '/3.jpg',
  trade: '/4.jpg',
  services: '/5.jpg',
};

// Neutral shade so white text stays readable on any photo without recolouring it.
const SHADE = 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.5) 100%)';
const NO_PHOTO = '#2B2B2B';

/* The tear line in /tear_strip.png (597×95), traced to a filled shape. Masking a
   section's top with it and drawing the PNG on that edge makes the section look
   torn over the one above. Both are stretched to the same box, so they line up. */
const TEAR_PATH =
  'M0,45.1 L3,45.7 L6,46.4 L9,45.8 L12,45.6 L15,44.8 L18,45.2 L21,45.7 L24,46.4 L27,46.2 L30,45.0 L33,45.2 L36,45.1 L39,44.5 L42,44.0 L45,44.6 L48,44.9 L51,44.6 L54,44.5 L57,45.0 L60,45.5 L63,46.0 L66,46.2 L69,46.0 L72,45.3 L75,45.0 L78,45.4 L81,45.4 L84,45.1 L87,45.2 L90,45.2 L93,45.5 L96,44.5 L99,43.1 L102,43.0 L105,42.3 L108,41.8 L111,40.3 L114,38.3 L117,37.5 L120,37.1 L123,37.5 L126,36.8 L129,36.2 L132,36.0 L135,35.4 L138,34.6 L141,34.1 L144,34.2 L147,34.1 L150,35.0 L153,36.1 L156,38.0 L159,39.4 L162,40.0 L165,42.2 L168,43.2 L171,44.6 L174,46.2 L177,48.5 L180,50.2 L183,51.3 L186,51.3 L189,52.4 L192,52.4 L195,53.1 L198,55.2 L201,57.6 L204,59.8 L207,62.8 L210,63.9 L213,64.4 L216,65.0 L219,65.6 L222,66.8 L225,68.2 L228,69.3 L231,70.6 L234,73.4 L237,75.2 L240,77.0 L243,77.0 L246,76.6 L249,75.0 L252,74.7 L255,74.1 L258,73.4 L261,71.8 L264,70.7 L267,70.0 L270,69.0 L273,67.8 L276,67.1 L279,65.9 L282,65.4 L285,65.2 L288,64.9 L291,63.2 L294,62.1 L297,61.4 L300,60.5 L303,59.9 L306,60.2 L309,59.5 L312,58.8 L315,57.6 L318,55.5 L321,54.1 L324,52.5 L327,51.1 L330,49.0 L333,46.2 L336,43.1 L339,42.5 L342,41.8 L345,39.8 L348,38.2 L351,36.1 L354,34.5 L357,33.2 L360,31.2 L363,29.7 L366,28.1 L369,25.3 L372,23.8 L375,22.8 L378,22.4 L381,22.4 L384,21.9 L387,21.8 L390,22.3 L393,22.0 L396,21.8 L399,21.6 L402,20.3 L405,19.5 L408,19.0 L411,19.4 L414,18.7 L417,17.6 L420,16.6 L423,15.3 L426,14.2 L429,15.3 L432,17.5 L435,19.9 L438,23.1 L441,24.9 L444,25.5 L447,28.5 L450,31.4 L453,33.3 L456,35.0 L459,37.6 L462,38.6 L465,39.7 L468,42.0 L471,43.4 L474,45.6 L477,48.1 L480,49.3 L483,50.4 L486,50.9 L489,52.1 L492,53.5 L495,55.4 L498,57.4 L501,59.5 L504,60.8 L507,62.3 L510,62.5 L513,61.6 L516,60.7 L519,61.2 L522,61.8 L525,61.8 L528,61.2 L531,59.8 L534,58.7 L537,57.8 L540,58.2 L543,57.6 L546,57.2 L549,57.2 L552,57.8 L555,57.3 L558,56.3 L561,56.5 L564,56.5 L567,56.9 L570,58.1 L573,57.3 L576,56.3 L579,57.0 L582,57.4 L585,57.1 L588,57.8 L591,59.3 L594,60.7 L597,60.8 L597,95 L0,95 Z';

const TEAR_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 597 95' preserveAspectRatio='none'><path d='${TEAR_PATH}'/></svg>`,
)}")`;

const tearMask = {
  image: `${TEAR_MASK}, linear-gradient(#000, #000)`,
  // 1px overlap between the two layers avoids a hairline gap from sub-pixel rounding.
  size: '100% var(--tear), 100% calc(100% - var(--tear) + 1px)',
  position: 'left top, left bottom',
  repeat: 'no-repeat',
};

const tornEdgeSx = {
  '--tear': { xs: '44px', md: '80px' },
  mt: 'calc(-1 * var(--tear))',
  pt: { xs: 'calc(64px + 44px)', md: 'calc(96px + 80px)' },
  maskImage: tearMask.image,
  maskSize: tearMask.size,
  maskPosition: tearMask.position,
  maskRepeat: tearMask.repeat,
  WebkitMaskImage: tearMask.image,
  WebkitMaskSize: tearMask.size,
  WebkitMaskPosition: tearMask.position,
  WebkitMaskRepeat: tearMask.repeat,
} as const;

const tearLineSx = {
  position: 'absolute', top: 0, left: 0, right: 0, height: 'var(--tear)', zIndex: 1, pointerEvents: 'none',
  backgroundImage: 'url(/tear_strip.png)', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
} as const;

interface Props {
  lang: Lang;
  copy: LandingCopy;
  onSelect: (t: BusinessType) => void;
}

const useInView = <T extends Element>(): [React.RefObject<T>, boolean] => {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
};

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box
          aria-hidden
          sx={{
            width: 60, height: 60, borderRadius: '20px', display: 'grid', placeItems: 'center', flexShrink: 0,
            bgcolor: C.mango, color: C.leafDeep, fontFamily: displayFont('en'), fontWeight: 800, fontSize: '2rem',
            boxShadow: '0 10px 22px -12px rgba(0,0,0,0.7)',
          }}
        >
          {section.number}
        </Box>
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, height: 36, borderRadius: '999px',
            bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', color: C.onDark, backdropFilter: 'blur(6px)',
          }}
        >
          <Emblem aria-hidden sx={{ fontSize: '1.15rem', color: C.mango }} />
          <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{copy.typesCount(count)}</Typography>
        </Box>
      </Box>
      <Typography
        id={`${sectionDomId(section.id)}-title`}
        component="h2"
        sx={{
          mt: 2.5, fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, color: C.onDark, textWrap: 'balance',
          textShadow: '0 2px 14px rgba(0,0,0,0.45)',
          fontSize: lang === 'ta' ? { xs: '1.75rem', md: '2.4rem' } : { xs: '2.1rem', md: '3rem' },
        }}
      >
        {pick(section.title, lang)}
      </Typography>
      <Box aria-hidden sx={{ mt: 2, width: 64, height: 4, borderRadius: 2, bgcolor: C.mango }} />
      <Typography sx={{ mt: 2, maxWidth: '34rem', fontSize: { xs: '1.02rem', md: '1.12rem' }, lineHeight: 1.75, color: C.onDarkMuted }}>
        {pick(section.blurb, lang)}
      </Typography>
    </Box>
  );
};

const CardGrid: React.FC<{ types: BusinessType[]; lang: Lang; copy: LandingCopy; onSelect: (t: BusinessType) => void; glyph?: boolean }> = ({
  types, lang, copy, onSelect, glyph = false,
}) => {
  const [ref, seen] = useInView<HTMLUListElement>();
  return (
    <Box
      component="ul"
      ref={ref}
      sx={{
        listStyle: 'none', p: 0, m: 0, display: 'grid', gap: { xs: 1.25, md: 1.5 },
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: types.length > 4 ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' },
      }}
    >
      {types.map((t, i) => (
        <Box
          component="li"
          key={t.slug}
          sx={{
            borderRadius: '18px', p: 0.5,
            bgcolor: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 14px 30px -22px rgba(0,0,0,0.8)',
            opacity: seen ? 1 : 0,
            transform: seen ? 'none' : 'translateY(16px)',
            transition: `opacity 380ms ease ${Math.min(i, 10) * 50}ms, transform 380ms cubic-bezier(.2,.8,.2,1) ${Math.min(i, 10) * 50}ms, box-shadow 180ms ease`,
            '@media (hover: hover)': {
              '&:hover': { boxShadow: `0 0 0 2px ${C.mango}, 0 18px 34px -20px rgba(0,0,0,0.85)` },
            },
            '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
          }}
        >
          <TypeRow type={t} lang={lang} codeLabel={copy.codeLabel} onSelect={onSelect} showGlyph={glyph} />
        </Box>
      ))}
    </Box>
  );
};

const PhotoSection: React.FC<{ section: BusinessSection; index: number; lang: Lang; copy: LandingCopy; onSelect: (t: BusinessType) => void }> = ({
  section, index, lang, copy, onSelect,
}) => {
  const isCultivation = section.id === 'cultivation';
  const all = typesInSection(section.id);
  const types = isCultivation ? all.filter((t) => t.isClass) : all;
  const numberOnLeft = index % 2 === 1;
  const torn = index > 0;

  return (
    <Box
      component="section"
      id={sectionDomId(section.id)}
      aria-labelledby={`${sectionDomId(section.id)}-title`}
      sx={{
        scrollMarginTop: SCROLL_OFFSET,
        position: 'relative', overflow: 'hidden', isolation: 'isolate',
        py: { xs: 8, md: 12 },
        backgroundColor: NO_PHOTO,
        backgroundImage: `${SHADE}, url(${PHOTO[section.id]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll',
        ...(torn && tornEdgeSx),
      }}
    >
      {torn && <Box aria-hidden sx={tearLineSx} />}
      <Typography
        aria-hidden
        sx={{
          position: 'absolute', zIndex: -1, top: { xs: -30, md: -60 },
          [numberOnLeft ? 'left' : 'right']: { xs: -10, md: 0 },
          fontFamily: displayFont('en'), fontWeight: 800, lineHeight: 1,
          fontSize: { xs: '13rem', md: '22rem' }, color: 'rgba(255,255,255,0.06)', userSelect: 'none', pointerEvents: 'none',
        }}
      >
        {String(section.number).padStart(2, '0')}
      </Typography>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <SectionIntro section={section} lang={lang} copy={copy} count={types.length} />

        <Box sx={{ mt: { xs: 6, md: 8 } }}>
          {isCultivation && (
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', md: '1.3rem' }, color: C.onDark, mb: 2 }}>
              {copy.classesLabel}
            </Typography>
          )}
          <CardGrid types={types} lang={lang} copy={copy} onSelect={onSelect} glyph={isCultivation} />
        </Box>
      </Container>
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

      {SECTIONS.map((section, index) => (
        <PhotoSection key={section.id} section={section} index={index} lang={lang} copy={copy} onSelect={onSelect} />
      ))}
    </Box>
  );
};

export default BusinessSections;
