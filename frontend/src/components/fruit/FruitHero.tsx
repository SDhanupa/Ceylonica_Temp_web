import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, ButtonBase, Container, Skeleton, Typography } from '@mui/material';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { FruitIcon } from './FruitIcons';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { primaryCtaSx } from './StartSurveyDialog';
import type { Lang } from './fruitBusinessTypes';
import type { LandingCopy } from './landingCopy';

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

/* ── Frame geometry ───────────────────────────────────────────────────────────
   /HERO FRAME.png is drawn whole at its own aspect ratio: never stretched or
   cropped. A higher-resolution file with the same proportions can replace it
   with no code change. The constants below were measured from its alpha channel. */
const FRAME_SRC = encodeURI('/HERO FRAME.png');
const FRAME_W = 669;
const FRAME_H = 373;
// Transparent area the content may occupy (fractions of the frame box). The frame
// is asymmetric (fruit and leaves on the left, open on the right), so this box is
// right of centre.
const SAFE = { left: 0.33, right: 0.12, top: 0.14, bottom: 0.27 };
// Where the green ends: inside the bottom fruit row (it occupies ~82-100% of the
// frame height), so the fruit straddles the edge and blends into the light page.
const GREEN_END = 0.9;
// The frame dips this far (fraction of its height) into the section below and
// its last strip fades out, so the fruit row melts into the page with no seam.
const OVERLAP = 0.04;
const FADE = 0.1;

const GREEN = 'radial-gradient(ellipse 110% 90% at 60% 35%, #176B3C 0%, #0E4E2C 60%, #07351D 100%)';

/* What sits inside the frame, from most to least. The hero measures itself and
   steps down until the content fits the frame's clear area; anything left out is
   shown just below the frame instead. Works for any width, height and language.
     4: badge, title, subtitle, buttons, area   3: subtitle moves below
     2: badge moves below   1: area link moves below   0: only the title inside */
const MAX_LEVEL = 4;
// Next section's top padding is at least 32px; the overlap beyond that needs extra room.
const NEXT_SECTION_MIN_PAD = 32;

const FruitHero: React.FC<Props> = ({ lang, copy, area, areaLoading, onStart, onFind, onPickArea, ctaRef }) => {
  const [level, setLevel] = useState(MAX_LEVEL);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const safeRef = useRef<HTMLDivElement | null>(null);

  // Re-fit from the top whenever the frame's size, the language or the area text changes.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== lastWidth) { lastWidth = el.clientWidth; setLevel(MAX_LEVEL); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { setLevel(MAX_LEVEL); }, [lang, copy, area?.name, areaLoading]);
  // Web fonts change text size after first paint.
  useEffect(() => { document.fonts?.ready.then(() => setLevel(MAX_LEVEL)).catch(() => {}); }, []);

  // Before paint: if the content spills out of the clear area, move one item below and re-check.
  useLayoutEffect(() => {
    const safe = safeRef.current;
    if (!safe || level === 0) return;
    const box = safe.getBoundingClientRect();
    const spills = [...safe.children].some((child) => {
      const r = child.getBoundingClientRect();
      return r.height > 0 && (r.top < box.top - 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.right > box.right + 1);
    });
    if (spills) setLevel((l) => Math.max(0, l - 1));
  });

  const inside = {
    badge: level >= 3,
    lead: level >= 4,
    actions: level >= 1,
    area: level >= 2,
  };
  const anythingBelow = !inside.badge || !inside.lead || !inside.actions || !inside.area;
  const overlapPx = `100vw * ${(FRAME_H / FRAME_W) * OVERLAP}`;
  const badge = (onDark: boolean) => (
    <Box
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.75, py: 0.5, borderRadius: '999px',
        bgcolor: onDark ? 'rgba(0,0,0,0.32)' : '#fff',
        border: onDark ? '1px solid rgba(255,255,255,0.28)' : `1px solid ${C.line}`,
      }}
    >
      <FruitIcon kind="sapling" size={18} />
      <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.88rem', color: onDark ? C.onDark : C.leaf }}>{copy.eventBadge}</Typography>
    </Box>
  );

  const actions = (onDark: boolean) => (
    <Box sx={{ display: 'flex', flexDirection: onDark ? 'row' : { xs: 'column', sm: 'row' }, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: onDark ? '1.2cqw' : 1.5, width: onDark ? 'auto' : { xs: '100%', sm: 'auto' } }}>
      <Button
        onClick={onStart}
        startIcon={<EditNoteRoundedIcon />}
        sx={{
          ...primaryCtaSx,
          minHeight: 44,
          height: onDark ? 'clamp(44px, 4.4cqw, 84px)' : 52,
          px: onDark ? 'clamp(16px, 2.4cqw, 48px)' : 3,
          fontSize: onDark ? 'clamp(0.88rem, 1.35cqw, 1.6rem)' : '1rem',
          width: onDark ? 'auto' : { xs: '100%', sm: 'auto' },
          border: onDark ? '2px solid rgba(255,255,255,0.7)' : 'none',
        }}
      >
        {copy.startSurvey}
      </Button>
      <Button
        onClick={onFind}
        startIcon={<SearchRoundedIcon />}
        sx={{
          minHeight: 44,
          height: onDark ? 'clamp(44px, 4.4cqw, 84px)' : 52,
          px: onDark ? 'clamp(14px, 2cqw, 40px)' : 3,
          borderRadius: '999px', textTransform: 'none', fontWeight: 700,
          fontSize: onDark ? 'clamp(0.85rem, 1.25cqw, 1.5rem)' : '1rem',
          width: onDark ? 'auto' : { xs: '100%', sm: 'auto' },
          color: onDark ? C.onDark : C.leaf,
          bgcolor: onDark ? 'rgba(0,0,0,0.32)' : '#fff',
          border: onDark ? '1.5px solid rgba(255,255,255,0.5)' : `1.5px solid ${C.line}`,
          '&:hover': { bgcolor: onDark ? 'rgba(0,0,0,0.5)' : C.sprout, borderColor: onDark ? '#fff' : C.field },
          ...focusRing,
        }}
      >
        {copy.findType}
      </Button>
    </Box>
  );

  const areaPill = (onDark: boolean) => (
    <ButtonBase
      onClick={onPickArea}
      aria-label={area ? `${copy.areaLabel}: ${area.name} (${area.code}). ${copy.areaChange}` : copy.areaChoose}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 44, px: 2, borderRadius: '999px',
        bgcolor: onDark ? 'rgba(0,0,0,0.38)' : '#fff',
        border: onDark ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${C.line}`,
        '&:hover': { bgcolor: onDark ? 'rgba(0,0,0,0.55)' : C.sprout },
        ...focusRing,
      }}
    >
      <PlaceRoundedIcon aria-hidden sx={{ color: onDark ? '#FFE27A' : C.field, fontSize: '1.2rem' }} />
      {areaLoading && !area ? (
        <Skeleton variant="text" width={150} sx={{ bgcolor: onDark ? 'rgba(255,255,255,0.25)' : undefined }} />
      ) : area ? (
        <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.9rem', color: onDark ? C.onDark : C.ink }}>
          {area.name} <Box component="span" sx={{ opacity: 0.75, fontWeight: 600 }}>({area.code})</Box>
          <Box component="span" sx={{ ml: 1, color: onDark ? '#FFE27A' : C.field, textDecoration: 'underline', textUnderlineOffset: 3 }}>{copy.areaChange}</Box>
        </Typography>
      ) : (
        <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.9rem', color: onDark ? C.onDark : C.ink }}>{copy.areaChoose}</Typography>
      )}
    </ButtonBase>
  );

  return (
    <Box component="section" aria-labelledby="hero-title" ref={ctaRef} sx={{ position: 'relative', bgcolor: C.page }}>
      {/* Full-width band: green behind the frame, ending inside its bottom fruit row. */}
      <Box sx={{ containerType: 'inline-size', containerName: 'band' }}>
        <Box
          sx={{
            // The frame's rendered height is min(100% width, max) * H/W; the green stops at GREEN_END of it.
            // The frame always spans the full width, so its height is width * H/W.
            '--frame-h': `calc(100cqw * ${FRAME_H / FRAME_W})`,
            // Top layer fades the green into the page colour over its last stretch,
            // so the green never ends in a straight line between the fruit.
            backgroundImage: `linear-gradient(to bottom, transparent 80%, ${C.page} 100%), ${GREEN}`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `100% calc(var(--frame-h) * ${GREEN_END})`,
            backgroundPosition: 'top',
          }}
        >
          {/* The frame box keeps the image's exact aspect ratio, so the image is never stretched. */}
          <Box
            ref={frameRef}
            sx={{
              position: 'relative', width: '100%',
              aspectRatio: `${FRAME_W} / ${FRAME_H}`,
              // Pull the following content up under the frame's bottom edge.
              mb: `calc(var(--frame-h) * ${-OVERLAP})`,
              zIndex: 2,
              containerType: 'inline-size', containerName: 'hero',
            }}
          >
            <Box
              component="img"
              src={FRAME_SRC}
              alt=""
              aria-hidden
              draggable={false}
              {...{ fetchpriority: 'high' }} // React 18 only passes the lowercase attribute through
              sx={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none', zIndex: 1,
                // Fade the hard bottom edge of the artwork into the page.
                maskImage: `linear-gradient(to bottom, #000 ${(1 - FADE) * 100}%, transparent 100%)`,
                WebkitMaskImage: `linear-gradient(to bottom, #000 ${(1 - FADE) * 100}%, transparent 100%)`,
              }}
            />

            {/* Content inside the frame's transparent centre */}
            <Box
              ref={safeRef}
              sx={{
                position: 'absolute', zIndex: 2,
                left: `${SAFE.left * 100}%`, right: `${SAFE.right * 100}%`, top: `${SAFE.top * 100}%`, bottom: `${SAFE.bottom * 100}%`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', gap: '1.5cqw',
              }}
            >
              {inside.badge && <Box>{badge(true)}</Box>}
              <Typography
                id="hero-title"
                component="h1"
                sx={{
                  m: 0,
                  fontFamily: displayFont(lang), fontWeight: 800, lineHeight: displayLeading(lang),
                  fontSize: lang === 'ta' ? 'clamp(0.95rem, 3.6cqw, 5rem)' : 'clamp(1rem, 4cqw, 5.6rem)',
                  color: '#FFE27A', textShadow: '0 2px 14px rgba(0,0,0,0.6)', textWrap: 'balance',
                }}
              >
                {copy.heroTitle}
              </Typography>
              {inside.lead && (
                <Typography sx={{ maxWidth: '62cqw', fontSize: 'clamp(0.95rem, 1.35cqw, 1.7rem)', lineHeight: 1.6, color: 'rgba(255,255,255,0.94)' }}>
                  {copy.heroLead}
                </Typography>
              )}
              {inside.actions && <Box>{actions(true)}</Box>}
              {inside.area && <Box>{areaPill(true)}</Box>}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Whatever didn't fit inside the frame, on the light page below it. */}
      {anythingBelow ? (
        <Container
          maxWidth="sm"
          sx={{
            // Clears the frame's overlap plus breathing room.
            px: { xs: 2, sm: 3 }, pt: `calc(${overlapPx} + 20px)`, pb: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center',
          }}
        >
          {!inside.badge && badge(false)}
          {!inside.lead && <Typography sx={{ fontSize: '1rem', lineHeight: 1.65, color: C.inkMuted }}>{copy.heroLead}</Typography>}
          {(!inside.actions || !inside.area) && (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {!inside.actions && actions(false)}
              {!inside.area && areaPill(false)}
            </Box>
          )}
        </Container>
      ) : (
        // Nothing below: keep the next section's heading clear of the frame's overlap on large screens.
        <Box aria-hidden sx={{ height: `max(0px, calc(${overlapPx} - ${NEXT_SECTION_MIN_PAD}px + 8px))` }} />
      )}
    </Box>
  );
};

export default FruitHero;
