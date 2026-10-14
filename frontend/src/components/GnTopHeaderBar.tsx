import React from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GlobalSearchBar from './GlobalSearchBar';
import { useLanguage } from '../context/LanguageContext';
import { MOBILE_CATEGORIES } from './mobile/mobileCategories';
import { useEdgeFadeMask } from './survey/SurveyKit';
import { cleanMojibake } from '../utils/mojibake';

interface GnTopHeaderBarProps {
  districts?: any[];
  selectedDistrict?: string;
  onDistrictChange?: (d: string) => void;
  dsDivisions?: any[];
  selectedCity?: string;
  onCityChange?: (c: string) => void;
  gramaNiladharis?: any[];
  selectedGN?: string;
  onGNChange?: (g: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  activeCategorySlug?: string;
  onSelectCategory?: (slug: string) => void;
  onCycleLanguage?: () => void;
}

export const GnTopHeaderBar: React.FC<GnTopHeaderBarProps> = ({
  districts = [],
  selectedDistrict = '',
  onDistrictChange,
  dsDivisions = [],
  selectedCity = '',
  onCityChange,
  gramaNiladharis = [],
  selectedGN = '',
  onGNChange,
  isDarkMode = false,
  activeCategorySlug,
  onSelectCategory = () => {},
}) => {
  const { language } = useLanguage();
  const theme = useTheme();
  /* `noSsr` keeps the first paint from flashing the desktop layout on phones. */
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const railMask = useEdgeFadeMask(railRef);

  /* The survey page renders this header for context only — it passes no change
     handlers, so the selects there can't actually switch location. Detect that
     and present the location as read-only instead of offering a picker that
     silently does nothing. */
  const interactive = !!(onDistrictChange || onCityChange || onGNChange);

  const t = {
    en: { district: 'District', dsDivision: 'DS Division', village: 'Village', home: 'Home' },
    si: { district: 'දිස්ත්‍රික්කය', dsDivision: 'ප්‍රාදේශීය ලේකම්', village: 'ග්‍රාම නිලධාරී', home: 'මුල් පිටුව' },
    ta: { district: 'மாவட்டம்', dsDivision: 'பிரதேச செயலகம்', village: 'கிராம அலுவலர்', home: 'முகப்பு' },
  }[language] || { district: 'District', dsDivision: 'DS Division', village: 'Village', home: 'Home' };

  const categoryLabels: Record<string, string> = {
    'location-1-1': { en: 'Boundaries', si: 'මායිම්', ta: 'எல்லைகள்' }[language] || 'Boundaries',
    'location-1-2': { en: 'Space', si: 'අවකාශය', ta: 'வெளி' }[language] || 'Space',
    'location-1-3': { en: 'Land', si: 'ඉඩම්', ta: 'நிலம்' }[language] || 'Land',
    'location-1-4': { en: 'Building / Land', si: 'ගොඩනැගිලි/ඉඩම්', ta: 'கட்டிடம்/நிலம்' }[language] || 'Building / Land',
    'location-1-5': { en: 'Roads', si: 'මාර්ග', ta: 'சாலைகள்' }[language] || 'Roads',
    'location-1-6': { en: 'Geo Location', si: 'භූගෝලීය පිහිටීම', ta: 'புவியியல் அமைவிடம்' }[language] || 'Geo Location',
    'location-1-7': { en: 'Natural', si: 'ස්වාභාවික', ta: 'இயற்கை' }[language] || 'Natural',
    'location-1-8': { en: 'Water Spaces', si: 'ජල අවකාශ', ta: 'நீர் இடங்கள்' }[language] || 'Water Spaces',
    'location-1-9': { en: 'Lines', si: 'රේඛා', ta: 'கோடுகள்' }[language] || 'Lines',
    'location-1-10': { en: 'Flora', si: 'ශාක', ta: 'தாவரங்கள்' }[language] || 'Flora',
  };

  // ── Derive Current Village Identity Names ──────────────────────────────
  const activeDistrictObj = districts?.find((d: any) => d.id === selectedDistrict || d.admin2Pcode === selectedDistrict);

  const activeCityObj = dsDivisions?.find((c: any) => c.divisionalSecretariatCode === selectedCity);

  const activeGnObj = gramaNiladharis?.find((g: any) => String(g.id) === String(selectedGN) || g.CCODE === selectedGN || g.ccode === selectedGN);

  const activeCcode = activeGnObj?.CCODE || activeGnObj?.code || activeGnObj?.ccode || selectedGN || '';

  /* Localized display names, used by the read-only location summary. */
  const districtName = cleanMojibake(language === 'si'
    ? (activeDistrictObj?.admin2NameSi || activeDistrictObj?.nameSi || activeDistrictObj?.nameEn)
    : language === 'ta'
      ? (activeDistrictObj?.admin2NameTa || activeDistrictObj?.nameTa || activeDistrictObj?.nameEn)
      : (activeDistrictObj?.admin2NameEn || activeDistrictObj?.nameEn));
  const dsName = cleanMojibake(language === 'si'
    ? (activeCityObj?.dsSi || activeCityObj?.dsEn)
    : language === 'ta'
      ? (activeCityObj?.dsTa || activeCityObj?.dsEn)
      : activeCityObj?.dsEn);
  const gnName = cleanMojibake(language === 'si'
    ? (activeGnObj?.nameSi || activeGnObj?.nameEn)
    : language === 'ta'
      ? (activeGnObj?.nameTa || activeGnObj?.nameEn)
      : activeGnObj?.nameEn);

  const surface = isDarkMode ? '#111827' : '#ffffff';
  const border = isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e9f0';
  const textMain = isDarkMode ? '#ffffff' : '#0f172a';
  const textMuted = isDarkMode ? '#cbd5e1' : '#64748b';
  const fieldBg = isDarkMode ? 'rgba(255,255,255,0.08)' : '#f8fafc';

  /* Compact on desktop; full-width and 48px tall inside the mobile drawer so
     every control clears the 44px touch-target minimum. */
  const selectSx = {
    minWidth: isMobile ? '100%' : 128,
    width: isMobile ? '100%' : undefined,
    height: isMobile ? 48 : 36,
    fontSize: isMobile ? '0.95rem' : '0.82rem',
    fontWeight: 600,
    bgcolor: fieldBg,
    borderRadius: isMobile ? '12px' : '9px',
    color: textMain,
    '& .MuiSelect-select': { color: textMain, py: isMobile ? 1.4 : 0.8 },
    '& .MuiSvgIcon-root': { color: textMuted },
    '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#3b82f6 !important' },
  };

  const fieldLabelSx = {
    fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em',
    textTransform: 'uppercase' as const, color: textMuted, mb: 0.75, display: 'block',
  };

  /* The three location selects, shared by the desktop row and the mobile
     drawer — one definition, so the two can't drift apart. */
  const districtSelect = (
    <Select
      size="small"
      value={selectedDistrict || ''}
      onChange={(e) => onDistrictChange?.(e.target.value)}
      displayEmpty
      sx={selectSx}
      renderValue={(v) => {
        if (!v) return <Box component="span" sx={{ color: textMuted, fontWeight: 500 }}>{t.district}</Box>;
        const d = activeDistrictObj;
        const name = cleanMojibake(language === 'si' ? (d?.admin2NameSi || d?.nameSi || d?.nameEn) : language === 'ta' ? (d?.admin2NameTa || d?.nameTa || d?.nameEn) : (d?.admin2NameEn || d?.nameEn));
        return name || v;
      }}
    >
      {districts.map((d: any) => {
        const name = cleanMojibake(language === 'si' ? (d.admin2NameSi || d.nameSi || d.nameEn) : language === 'ta' ? (d.admin2NameTa || d.nameTa || d.nameEn) : (d.admin2NameEn || d.nameEn));
        return <MenuItem key={d.id || d.admin2Pcode} value={d.id || d.admin2Pcode}>{name}</MenuItem>;
      })}
    </Select>
  );

  const dsSelect = (
    <Select
      size="small"
      value={selectedCity || ''}
      onChange={(e) => onCityChange?.(e.target.value)}
      displayEmpty
      disabled={!selectedDistrict || dsDivisions.length === 0}
      sx={selectSx}
      renderValue={(v) => {
        if (!v) return <Box component="span" sx={{ color: textMuted, fontWeight: 500 }}>{t.dsDivision}</Box>;
        const c = activeCityObj;
        const name = cleanMojibake(language === 'si' ? (c?.dsSi || c?.dsEn) : language === 'ta' ? (c?.dsTa || c?.dsEn) : (c?.dsEn || v));
        return name || v;
      }}
    >
      {dsDivisions.map((city: any) => {
        const name = cleanMojibake(language === 'si' ? (city.dsSi || city.dsEn) : language === 'ta' ? (city.dsTa || city.dsEn) : (city.dsEn || city.divisionalSecretariatCode || city.dsCode));
        return <MenuItem key={city.divisionalSecretariatCode || city.dsCode} value={city.divisionalSecretariatCode || city.dsCode}>{name}</MenuItem>;
      })}
    </Select>
  );

  const gnSelect = (
    <Select
      size="small"
      value={selectedGN || ''}
      onChange={(e) => onGNChange?.(e.target.value)}
      displayEmpty
      disabled={!selectedCity || gramaNiladharis.length === 0}
      sx={{ ...selectSx, minWidth: isMobile ? '100%' : 150 }}
      renderValue={(v) => {
        if (!v) return <Box component="span" sx={{ color: textMuted, fontWeight: 500 }}>{t.village}</Box>;
        const g = activeGnObj;
        const name = cleanMojibake(language === 'si' ? (g?.nameSi || g?.nameEn) : language === 'ta' ? (g?.nameTa || g?.nameEn) : g?.nameEn);
        const code = g?.CCODE || g?.code || g?.ccode;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || v}</Box>
            {code && (
              <Box component="span" sx={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, bgcolor: isDarkMode ? 'rgba(59,130,246,0.25)' : '#dbeafe', color: '#2563eb', px: 0.6, py: 0.1, borderRadius: '4px', fontFamily: 'monospace' }}>
                {code}
              </Box>
            )}
          </Box>
        );
      }}
    >
      {gramaNiladharis.map((gn: any) => {
        const name = cleanMojibake(language === 'si' ? (gn.nameSi || gn.nameEn) : language === 'ta' ? (gn.nameTa || gn.nameEn) : gn.nameEn);
        const code = gn.CCODE || gn.code || gn.ccode;
        return (
          <MenuItem key={gn.id || gn.CCODE || gn.ccode} value={String(gn.id) || gn.CCODE || gn.ccode} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, py: 0.8 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{name}</Typography>
            {code && (
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.75rem', bgcolor: isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.09)', color: '#2563eb', px: 0.8, py: 0.25, borderRadius: '6px' }}>
                {code}
              </Typography>
            )}
          </MenuItem>
        );
      })}
    </Select>
  );

  const goHome = () => {
    if (activeGnObj?.nameEn && activeCcode) {
      window.location.href = `/gnpage/${activeGnObj.nameEn.replace(/ /g, '-')}/${activeCcode}`;
    } else {
      window.location.href = '/gnpage';
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        mb: { xs: 1.5, md: 3 },
        position: 'relative',
        zIndex: 9999,
        /* Respect the notch / status bar when this sits at the top on phones. */
        pt: { xs: 'env(safe-area-inset-top, 0px)', md: 0 },
      }}
    >
      <Box
        sx={{
          borderRadius: { xs: '14px', md: '18px' },
          bgcolor: surface,
          border,
          boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)',
          overflow: 'visible',
          animation: 'fadeInUp 0.4s ease both',
        }}
      >
        {/* ── ROW 1: CCODE badge · Search · Selectors (desktop) / Filters (mobile) ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
            px: { xs: 1.5, sm: 2, md: 3 },
            py: { xs: 1.1, md: 1.8 },
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            minWidth: 0,
          }}
        >
          {/* Area code badge — drops the caption on phones to buy width */}
          <Tooltip title={language === 'si' ? 'ග්‍රාම නිලධාරී වසම් කේතය' : language === 'ta' ? 'கிராம அலுவலர் பிரிவு குறியீடு' : 'Grama Niladhari Area Code'}>
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, md: 1 },
                px: { xs: 1, md: 1.6 },
                py: { xs: 0.5, md: 0.6 },
                minHeight: { xs: 40, md: 'auto' },
                borderRadius: '10px',
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(30,58,138,0.2) 100%)'
                  : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: isDarkMode ? '1.5px solid rgba(96,165,250,0.45)' : '1.5px solid #93c5fd',
                boxShadow: isDarkMode ? '0 2px 10px rgba(37,99,235,0.2)' : '0 2px 8px rgba(37,99,235,0.1)',
                transition: 'all 0.2s ease',
                '&:hover': { transform: { md: 'scale(1.02)' }, borderColor: '#2563eb' },
              }}
            >
              <TagRoundedIcon sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, color: '#2563eb' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    fontSize: '0.62rem', fontWeight: 800,
                    color: isDarkMode ? '#93c5fd' : '#1d4ed8',
                    letterSpacing: '0.8px', lineHeight: 1, textTransform: 'uppercase',
                  }}
                >
                  {language === 'si' ? 'වසම් කේතය' : language === 'ta' ? 'குறியீடு' : 'AREA CODE'}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                    fontWeight: 900,
                    fontSize: { xs: '0.82rem', md: '0.95rem' },
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    letterSpacing: { xs: '0.5px', md: '1px' },
                    lineHeight: 1.2,
                  }}
                >
                  {activeCcode || '—'}
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          {/* Search */}
          <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 260px' }, minWidth: 0 }}>
            <GlobalSearchBar isDarkMode={isDarkMode} activeGn={activeGnObj ? { nameEn: activeGnObj.nameEn, CCODE: activeCcode } : null} language={language} />
          </Box>

          {isMobile ? (
            /* One 44px control opens the location filters, instead of three
               selects wrapping onto their own rows and doubling the header. */
            <Tooltip title={interactive
              ? (language === 'si' ? 'ස්ථානය තෝරන්න' : language === 'ta' ? 'இடத்தைத் தேர்ந்தெடுக்கவும்' : 'Select location')
              : (language === 'si' ? 'වත්මන් ස්ථානය' : language === 'ta' ? 'தற்போதைய இடம்' : 'Current location')}>
              <IconButton
                onClick={() => setFiltersOpen(true)}
                aria-label={interactive
                  ? `${t.district} / ${t.dsDivision} / ${t.village}`
                  : (language === 'si' ? 'වත්මන් ස්ථානය' : language === 'ta' ? 'தற்போதைய இடம்' : 'Current location')}
                sx={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: '12px',
                  bgcolor: fieldBg, color: textMain,
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.18)' : '1px solid #e2e8f0',
                  '&:active': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.14)' : '#eef2f7' },
                }}
              >
                <TuneRoundedIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
              {districtSelect}
              {dsSelect}
              {gnSelect}
            </Box>
          )}
        </Box>

        <Box sx={{ height: '1px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)' }} />

        {/* ── ROW 2: category rail (scrolls) + pinned Home ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Box
            ref={railRef}
            sx={{
              maskImage: railMask,
              WebkitMaskImage: railMask,
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, md: 0.75 },
              px: { xs: 1.25, md: 2.25 },
              py: { xs: 0.85, md: 1.4 },
              overflowX: 'auto',
              /* Keep a sideways flick on the rail from triggering the browser's
                 back-navigation / pull-to-refresh gesture. */
              overscrollBehaviorX: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: { xs: 'none', md: 'thin' },
              '&::-webkit-scrollbar': { height: { xs: 0, md: '4px' } },
              '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)', borderRadius: '4px' },
            }}
          >
            {MOBILE_CATEGORIES.map((cat, idx) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <Box
                  key={cat.slug}
                  onClick={() => onSelectCategory(cat.slug)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectCategory(cat.slug); } }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.7, flexShrink: 0, cursor: 'pointer',
                    /* 44px minimum tap height on touch; unchanged on desktop. */
                    minHeight: { xs: 44, md: 'auto' },
                    px: { xs: 1.5, md: 1.3 },
                    py: { xs: 0, md: 0.7 },
                    borderRadius: '9px',
                    color: isActive ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#f8fafc' : '#475569'),
                    bgcolor: isActive ? (isDarkMode ? 'rgba(59,130,246,0.22)' : 'rgba(37,99,235,0.08)') : 'transparent',
                    transition: 'background-color 150ms ease, color 150ms ease, transform 150ms ease',
                    animation: `fadeInUp 0.35s ease ${idx * 30}ms both`,
                    WebkitTapHighlightColor: 'transparent',
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.05rem',
                      color: isActive ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#93c5fd' : '#64748b'),
                      transition: 'transform 150ms ease, color 150ms ease',
                    },
                    /* Press feedback for touch, hover polish for pointers. */
                    '&:active': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.07)' },
                    '@media (hover: hover)': {
                      '&:hover': {
                        bgcolor: isActive ? (isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.12)') : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.05)'),
                        color: isActive ? (isDarkMode ? '#93c5fd' : '#1d4ed8') : (isDarkMode ? '#ffffff' : '#0f172a'),
                        '& .MuiSvgIcon-root': { transform: 'scale(1.15)', color: isDarkMode ? '#ffffff' : '#1e293b' },
                      },
                    },
                  }}
                >
                  {cat.icon}
                  <Typography sx={{ fontSize: { xs: '0.82rem', md: '0.8rem' }, fontWeight: isActive ? 700 : 600, whiteSpace: 'nowrap', color: 'inherit' }}>
                    {categoryLabels[cat.slug]}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Pinned so it stays reachable however far the rail is scrolled */}
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              pl: 0.5,
              pr: { xs: 0.75, md: 1.5 },
              borderLeft: { xs: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.06)', md: 'none' },
            }}
          >
            <Tooltip title={t.home}>
              <IconButton
                onClick={goHome}
                aria-label={t.home}
                sx={{
                  width: { xs: 44, md: 32 },
                  height: { xs: 44, md: 32 },
                  color: isDarkMode ? '#e2e8f0' : '#64748b',
                  '&:active': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.06)' },
                  '@media (hover: hover)': { '&:hover': { color: isDarkMode ? '#ffffff' : '#0f172a' } },
                }}
              >
                <HomeRoundedIcon sx={{ fontSize: { xs: '1.3rem', md: '1.1rem' } }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── Mobile location filters: bottom sheet ──────────────────────────── */}
      <Drawer
        anchor="bottom"
        open={isMobile && filtersOpen}
        onClose={() => setFiltersOpen(false)}
        /* Keep the select popovers above the sheet. */
        sx={{ zIndex: 10000 }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            bgcolor: surface,
            backgroundImage: 'none',
            px: 2,
            pt: 1,
            /* Clear the home indicator on gesture-nav phones. */
            pb: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '85dvh',
          },
        }}
      >
        {/* Grab handle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <Box sx={{ width: 38, height: 4, borderRadius: 999, bgcolor: isDarkMode ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.16)' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: textMain }}>
            {interactive
              ? (language === 'si' ? 'ස්ථානය තෝරන්න' : language === 'ta' ? 'இடத்தைத் தேர்ந்தெடுக்கவும்' : 'Select location')
              : (language === 'si' ? 'වත්මන් ස්ථානය' : language === 'ta' ? 'தற்போதைய இடம்' : 'Current location')}
          </Typography>
          <IconButton
            onClick={() => setFiltersOpen(false)}
            aria-label={language === 'si' ? 'වසන්න' : language === 'ta' ? 'மூடு' : 'Close'}
            sx={{ width: 44, height: 44, color: textMuted }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1, overflowY: 'auto' }}>
          {interactive ? (
            <>
              <Box>
                <Typography component="label" sx={fieldLabelSx}>{t.district}</Typography>
                {districtSelect}
              </Box>
              <Box>
                <Typography component="label" sx={fieldLabelSx}>{t.dsDivision}</Typography>
                {dsSelect}
              </Box>
              <Box>
                <Typography component="label" sx={fieldLabelSx}>{t.village}</Typography>
                {gnSelect}
              </Box>
            </>
          ) : (
            /* Context only — this header was given no way to change location. */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {[
                { label: t.district, value: districtName },
                { label: t.dsDivision, value: dsName },
                { label: t.village, value: gnName },
              ].map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    px: 1.75, py: 1.25, borderRadius: '12px', bgcolor: fieldBg,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
                  }}
                >
                  <Typography sx={fieldLabelSx}>{row.label}</Typography>
                  <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: textMain, mb: 0, wordBreak: 'break-word' }}>
                    {row.value || '—'}
                  </Typography>
                </Box>
              ))}
              {activeCcode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
                  <TagRoundedIcon sx={{ fontSize: '1rem', color: '#2563eb' }} />
                  <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.85rem', color: textMain }}>
                    {activeCcode}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Box
            role="button"
            tabIndex={0}
            onClick={goHome}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); } }}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              minHeight: 48, borderRadius: '12px', cursor: 'pointer',
              color: textMuted, bgcolor: fieldBg,
              border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid #e2e8f0',
              fontWeight: 700, fontSize: '0.9rem',
              '&:active': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.14)' : '#eef2f7' },
            }}
          >
            <HomeRoundedIcon sx={{ fontSize: '1.2rem' }} />
            {t.home}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default GnTopHeaderBar;
