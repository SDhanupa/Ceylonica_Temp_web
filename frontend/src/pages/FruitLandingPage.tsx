import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, ButtonBase, Container, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import HolidayVillageRoundedIcon from '@mui/icons-material/HolidayVillageRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded';
import { useLanguage } from '../context/LanguageContext';
import { getUserName, setUserName } from '../utils/cookieUtils';
import GnLocationModal from '../components/GnLocationModal';
import { GnTopHeaderBar } from '../components/GnTopHeaderBar';
import { useGnSelection } from '../components/fruit/useGnSelection';
import { cleanMojibake } from '../utils/mojibake';
import FruitHero, { AreaSummary } from '../components/fruit/FruitHero';
import StartSurveyDialog, { primaryCtaSx } from '../components/fruit/StartSurveyDialog';
import AreaPickerDialog, { AreaOption } from '../components/fruit/AreaPickerDialog';
import { FruitIcon } from '../components/fruit/FruitIcons';
import BusinessSections from '../components/fruit/BusinessSections';
import SiteTopBar from '../components/fruit/SiteTopBar';
import LandingFooter from '../components/fruit/LandingFooter';
import { FruitTile, LanguageSwitch, TypeRow } from '../components/fruit/LandingParts';
import { COPY } from '../components/fruit/landingCopy';
import { C, displayFont, displayLeading, focusRing } from '../components/fruit/tokens';
import { BusinessType, FRUIT_PICKS, Lang, searchBusinessTypes } from '../components/fruit/fruitBusinessTypes';

const HEADER_OFFSET = 80;

const h2Sx = (lang: Lang) => ({
  fontFamily: displayFont(lang),
  lineHeight: displayLeading(lang),
  fontWeight: 800,
  fontSize: lang === 'ta' ? { xs: '1.65rem', md: '2.2rem' } : { xs: '1.95rem', md: '2.6rem' },
  color: C.leaf,
});

const leadSx = { mt: 1, maxWidth: '40rem', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.7, color: C.inkMuted } as const;

const FruitLandingPage: React.FC = () => {
  const { gnName, ccode } = useParams<{ gnName?: string; ccode?: string }>();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const lang = (language as Lang) || 'si';
  const copy = COPY[lang] ?? COPY.si;

  const [query, setQuery] = useState('');
  const [startOpen, setStartOpen] = useState(false);
  const [startType, setStartType] = useState<BusinessType | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(!ccode);
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  const [finalCtaVisible, setFinalCtaVisible] = useState(false);

  const findRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);

  const { activeGn: gn, activeGnLoading: gnLoading, headerProps } = useGnSelection(ccode);

  const area: AreaSummary | null = useMemo(() => {
    if (!ccode) return null;
    const sfx = lang === 'si' ? 'Si' : lang === 'ta' ? 'Ta' : 'En';
    const field = (base: string) => cleanMojibake(gn?.[`${base}${sfx}`] || gn?.[`${base}En`] || '');
    const name = field('name') || (gnName ? gnName.replace(/-/g, ' ') : '');
    if (!name && gnLoading) return null;
    return {
      name: name || ccode,
      place: gn ? [field('ds'), field('dis')].filter(Boolean).join(', ') : '',
      code: gn?.CCODE || ccode,
    };
  }, [ccode, gnName, gn, gnLoading, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `Ceylonica | ${copy.eventBadge}`;
  }, [lang, copy.eventBadge]);

  // Deep links from other pages (e.g. the survey footer) land on #section-… / #types.
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    return () => window.clearTimeout(t);
  }, [hash]);

  useEffect(() => {
    if (gnName && ccode) {
      localStorage.setItem('last_gn_url', `/gnpage/${encodeURIComponent(gnName)}/${encodeURIComponent(ccode)}`);
    }
  }, [gnName, ccode]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroCtaRef.current) setHeroCtaVisible(entry.isIntersecting);
          if (entry.target === finalCtaRef.current) setFinalCtaVisible(entry.isIntersecting);
        });
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px 0px 0px` },
    );
    [heroCtaRef.current, finalCtaRef.current].forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const results = useMemo(() => searchBusinessTypes(query), [query]);
  const searching = query.trim().length > 0;

  const openStart = useCallback((type: BusinessType | null) => {
    setStartType(type);
    setStartOpen(true);
  }, []);

  const surveyPath = (slug?: string) => {
    const base = gnName && ccode
      ? `/industry-survey/${encodeURIComponent(gnName)}/${encodeURIComponent(ccode)}`
      : '/industry-survey';
    return slug ? `${base}?${new URLSearchParams({ type: slug })}` : base;
  };

  const handleStart = (name: string) => {
    if (name) setUserName(name);
    setStartOpen(false);
    navigate(surveyPath(startType?.slug));
  };

  const handleAreaSelect = (o: AreaOption) => {
    setAreaOpen(false);
    const slugName = o.nameEn.trim().replace(/\s+/g, '-');
    navigate(`/gnpage/${encodeURIComponent(slugName)}/${encodeURIComponent(o.ccode)}`);
  };

  const goToFinder = () => {
    searchRef.current?.focus({ preventScroll: true });
    findRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showSticky = !heroCtaVisible && !finalCtaVisible && !startOpen && !areaOpen;
  const benefitIcons = [ConfirmationNumberRoundedIcon, StorefrontRoundedIcon, HolidayVillageRoundedIcon];
  const objectionIcons = [MoneyOffRoundedIcon, TranslateRoundedIcon, SaveRoundedIcon];
  const areaText = area ? `${area.name} (${area.code})` : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: C.page, color: C.ink, display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <SiteTopBar
        lang={lang}
        onLanguage={setLanguage}
        onLogo={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        action={
          <Button
            onClick={() => openStart(null)}
            aria-label={copy.navSurvey}
            sx={{
              // Icon-only on phones: logos + language switch + a long Sinhala/Tamil label don't fit in 390px.
              minHeight: 44, minWidth: 44, px: { xs: 0, sm: 2.25 }, borderRadius: '999px', textTransform: 'none', fontWeight: 800,
              fontSize: '0.95rem', color: C.onDark, bgcolor: C.field, boxShadow: 'none', whiteSpace: 'nowrap',
              '&:hover': { bgcolor: C.fieldHover, boxShadow: 'none', transform: 'none' },
              ...focusRing,
            }}
          >
            <EditNoteRoundedIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '1.4rem' }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{copy.navSurvey}</Box>
          </Button>
        }
      />

      <Box component="main" sx={{ flex: 1 }}>
        {/* The header sets zIndex 9999 on itself; this wrapper keeps it under the sticky top bar. */}
        <Box sx={{ position: 'relative', zIndex: 2, pt: { xs: 1.5, md: 2.5 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <GnTopHeaderBar {...headerProps} userName={getUserName() || ''} hideCategoryRail />
          </Container>
        </Box>

        <FruitHero
          lang={lang}
          copy={copy}
          area={area}
          areaLoading={gnLoading}
          onStart={() => openStart(null)}
          onFind={goToFinder}
          onPickArea={() => setAreaOpen(true)}
          ctaRef={heroCtaRef}
        />

        {/* ── What do you grow? ── */}
        <Box component="section" ref={findRef} id="find" aria-labelledby="find-title" sx={{ scrollMarginTop: HEADER_OFFSET, pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography id="find-title" component="h2" sx={h2Sx(lang)}>{copy.growTitle}</Typography>
            <Typography sx={leadSx}>{copy.growLead}</Typography>

            <TextField
              inputRef={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              inputProps={{ autoComplete: 'off', enterKeyHint: 'search', 'aria-controls': 'find-results' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: C.field }} />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <IconButton aria-label={copy.searchClear} onClick={() => { setQuery(''); searchRef.current?.focus(); }} edge="end" sx={{ width: 44, height: 44 }}>
                      <CloseRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
              sx={{
                mt: 3, width: '100%', maxWidth: 560,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '18px', bgcolor: C.card, minHeight: 60, fontSize: '1.05rem',
                  '& fieldset': { borderColor: C.line, borderWidth: 1.5 },
                  '&:hover fieldset': { borderColor: C.field },
                  '&.Mui-focused fieldset': { borderColor: C.field },
                },
                '& label.Mui-focused': { color: C.field },
              }}
            />

            <Box id="find-results" sx={{ mt: 3 }}>
              {searching ? (
                <Box sx={{ maxWidth: 760 }}>
                  <Typography role="status" aria-live="polite" sx={{ mb: 1, px: 0.5, fontWeight: 700, color: C.inkMuted }}>
                    {results.length > 0 ? copy.searchCount(results.length) : copy.searchEmpty(query.trim())}
                  </Typography>
                  {results.length > 0 ? (
                    <Box component="ul" sx={{ listStyle: 'none', p: 1, m: 0, borderRadius: '20px', bgcolor: C.card, border: `1px solid ${C.line}` }}>
                      {results.map((t) => (
                        <li key={t.slug}>
                          <TypeRow type={t} lang={lang} codeLabel={copy.codeLabel} onSelect={openStart} showGlyph />
                        </li>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ p: 3, borderRadius: '20px', bgcolor: C.card, border: `1px dashed ${C.sproutLine}` }}>
                      <Typography sx={{ color: C.inkMuted, lineHeight: 1.65 }}>{copy.searchEmptyHint}</Typography>
                      <Button
                        onClick={() => openStart(null)}
                        sx={{ mt: 2, minHeight: 48, px: 2.5, borderRadius: '999px', textTransform: 'none', fontWeight: 800, color: C.onDark, bgcolor: C.field, '&:hover': { bgcolor: C.fieldHover }, ...focusRing }}
                      >
                        {copy.startWithoutType}
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  component="ul"
                  aria-label={copy.growTitle}
                  sx={{
                    listStyle: 'none', p: 0, m: 0, display: 'grid', gap: { xs: 1.25, sm: 1.5 },
                    gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))', lg: 'repeat(7, minmax(0, 1fr))' },
                    // Narrow phones: two per row so long Sinhala/Tamil words fit without breaking mid-word.
                    '@media (max-width: 419.95px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  {FRUIT_PICKS.map((t, i) => (
                    <li key={t.slug} style={{ display: 'flex' }}>
                      <FruitTile type={t} lang={lang} codeLabel={copy.codeLabel} onSelect={openStart} index={i} />
                    </li>
                  ))}
                </Box>
              )}
            </Box>
          </Container>
        </Box>

        {/* ── How it works ── */}
        <Box component="section" aria-labelledby="steps-title" sx={{ py: { xs: 6, md: 8 }, bgcolor: C.card, borderBlock: `1px solid ${C.line}` }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography id="steps-title" component="h2" sx={h2Sx(lang)}>{copy.stepsTitle}</Typography>
            <Box
              component="ol"
              sx={{ listStyle: 'none', p: 0, m: 0, mt: 4, display: 'grid', gap: { xs: 3, md: 4 }, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}
            >
              {copy.steps.map(([title, text], i) => (
                <Box
                  component="li"
                  key={title}
                  sx={{
                    position: 'relative', display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 2,
                    '&:not(:last-of-type)::after': {
                      content: '""', position: 'absolute', display: { xs: 'none', md: 'block' },
                      top: 28, left: 72, right: -16, height: 0, borderTop: `2px dashed ${C.sproutLine}`,
                    },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      width: 56, height: 56, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      bgcolor: C.mango, color: C.leafDeep, fontFamily: displayFont('en'), fontWeight: 800, fontSize: '1.7rem',
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Box>
                    <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.12rem', lineHeight: 1.45, color: C.ink }}>{title}</Typography>
                    <Typography sx={{ mt: 0.5, color: C.inkMuted, lineHeight: 1.65 }}>{text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        <BusinessSections lang={lang} copy={copy} onSelect={openStart} />

        {/* ── Benefits ── */}
        <Box component="section" aria-labelledby="benefits-title" sx={{ pb: { xs: 6, md: 9 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography id="benefits-title" component="h2" sx={h2Sx(lang)}>{copy.benefitsTitle}</Typography>
            <Box
              component="ul"
              sx={{ listStyle: 'none', p: 0, m: 0, mt: 3.5, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' } }}
            >
              {copy.benefits.map(([title, text], i) => {
                const Icon = benefitIcons[i];
                return (
                  <Box component="li" key={title} sx={{ p: 2.5, borderRadius: '22px', bgcolor: C.card, border: `1px solid ${C.line}` }}>
                    <Box aria-hidden sx={{ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: C.sprout, color: C.field }}>
                      <Icon />
                    </Box>
                    <Typography component="h3" sx={{ mt: 1.75, fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.45, color: C.ink }}>{title}</Typography>
                    <Typography sx={{ mt: 0.5, color: C.inkMuted, lineHeight: 1.65 }}>{text}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Container>
        </Box>

        {/* ── Objections, answered right before the call to action ── */}
        <Box component="section" aria-labelledby="objections-title" sx={{ pb: { xs: 6, md: 9 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography id="objections-title" component="h2" sx={h2Sx(lang)}>{copy.objectionsTitle}</Typography>
            <Box
              component="ul"
              sx={{ listStyle: 'none', p: 0, m: 0, mt: 3, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}
            >
              {copy.objections.map(([title, text], i) => {
                const Icon = objectionIcons[i];
                return (
                  <Box component="li" key={title} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 2, borderRadius: '18px', bgcolor: '#EDF6E8' }}>
                    <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: C.card, color: C.field }}>
                      <Icon sx={{ fontSize: '1.25rem' }} />
                    </Box>
                    <Box>
                      <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.4, color: C.ink }}>{title}</Typography>
                      <Typography sx={{ mt: 0.25, color: C.inkMuted, lineHeight: 1.6, fontSize: '0.95rem' }}>{text}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Container>
        </Box>

        {/* ── Final call to action ── */}
        <Box component="section" aria-labelledby="final-title" sx={{ position: 'relative', overflow: 'hidden', bgcolor: C.leafDeep, color: C.onDark, py: { xs: 7, md: 9 } }}>
          <Box aria-hidden sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mb: 2.5 }}>
            {(['mango', 'banana', 'papaya', 'pineapple', 'rambutan', 'orange'] as const).map((k, i) => (
              <Box key={k} sx={{ width: { xs: 44, sm: 56 }, transform: `rotate(${i % 2 ? 8 : -8}deg)` }}>
                <FruitIcon kind={k} size="100%" />
              </Box>
            ))}
          </Box>
          <Container maxWidth="md" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
            <Typography
              id="final-title"
              component="h2"
              sx={{ ...h2Sx(lang), color: C.mango, textWrap: 'balance' }}
            >
              {copy.finalTitle}
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: { xs: '1.02rem', md: '1.12rem' }, lineHeight: 1.7, color: C.onDarkMuted }}>{copy.finalLead}</Typography>
            <Box ref={finalCtaRef} sx={{ mt: 3.5, display: 'flex', justifyContent: 'center' }}>
              <Button onClick={() => openStart(null)} startIcon={<EditNoteRoundedIcon />} sx={{ ...primaryCtaSx, width: { xs: '100%', sm: 'auto' } }}>
                {copy.startSurvey}
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>

      <LandingFooter lang={lang} copy={copy} onStart={() => openStart(null)} onFind={goToFinder} />

      {/* ── Mobile sticky CTA ── */}
      <Box
        aria-hidden={!showSticky}
        sx={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 25,
          display: { xs: 'block', md: 'none' },
          px: 2, pt: 1.5, pb: 'calc(12px + env(safe-area-inset-bottom))',
          bgcolor: 'rgba(255,255,255,0.97)', borderTop: `1px solid ${C.line}`, boxShadow: '0 -12px 28px -18px rgba(15,61,34,0.5)',
          transform: showSticky ? 'translateY(0)' : 'translateY(110%)',
          visibility: showSticky ? 'visible' : 'hidden',
          transition: showSticky ? 'transform 220ms ease' : 'transform 200ms ease, visibility 0s linear 200ms',
        }}
      >
        <Button onClick={() => openStart(null)} startIcon={<EditNoteRoundedIcon />} tabIndex={showSticky ? 0 : -1} sx={{ ...primaryCtaSx, width: '100%' }}>
          {copy.startSurvey}
        </Button>
      </Box>

      <StartSurveyDialog
        open={startOpen}
        lang={lang}
        copy={copy}
        type={startType}
        areaText={areaText}
        onChangeArea={() => setAreaOpen(true)}
        onClose={() => setStartOpen(false)}
        onStart={handleStart}
      />
      <AreaPickerDialog open={areaOpen} lang={lang} copy={copy} onClose={() => setAreaOpen(false)} onSelect={handleAreaSelect} />
      <GnLocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onLocationSelected={(gn) => {
          setLocationOpen(false);
          const slugName = gn.nameEn.trim().replace(/\s+/g, '-');
          navigate(`/gnpage/${encodeURIComponent(slugName)}/${encodeURIComponent(gn.CCODE)}`);
        }}
      />
    </Box>
  );
};

export default FruitLandingPage;
