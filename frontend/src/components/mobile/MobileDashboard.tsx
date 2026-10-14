import React, { useState } from 'react';
import {
  Box, Typography, IconButton, Chip, Menu, MenuItem, Divider,
  Dialog, DialogContent, DialogActions, Button, SwipeableDrawer, useScrollTrigger,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import TranslateIcon from '@mui/icons-material/Translate';
import PlaceIcon from '@mui/icons-material/Place';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import CloseIcon from '@mui/icons-material/Close';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import GlobalSearchBar from '../GlobalSearchBar';
import { VillageMap } from '../VillageMap';
import GnPageFooter from '../GnPageFooter';
import MobileSurveyCarousel from './MobileSurveyCarousel';
import MobileLocationSheet from './MobileLocationSheet';
import MobileBottomNav from './MobileBottomNav';
import { MOBILE_CATEGORIES, catLabel } from './mobileCategories';

interface MobileDashboardProps {
  isDarkMode?: boolean;
  onToggleDarkMode: () => void;
  onCycleLanguage: () => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  login: (redirect?: string) => void;
  register: (redirect?: string) => void;
  logout: () => void;
  userInfo?: any;
  displayGN?: string;
  displayDistrict?: string;
  displayCity?: string;
  displayCCODE?: string;
  activeGn?: any;
  districts: any[];
  selectedDistrict: string;
  onDistrictChange: (d: string) => void;
  dsDivisions: any[];
  selectedCity: string;
  onCityChange: (c: string) => void;
  gramaNiladharis: any[];
  selectedGN: string;
  onGNChange: (g: string) => void;
  onOpenCategory: (slug: string) => void;
  // Demographic data
  populationData?: any;
  gnEconomyData?: any;
  housingOwnershipData?: any;
  housingWallData?: any;
  housingUnitData?: any;
  toiletFacilityData?: any;
  drinkingWaterData?: any;
  solidWasteData?: any;
  roomsData?: any;
  roofData?: any;
  religionData?: any;
  householdHeadData?: any;
  /** Rendered prominently in the sheet, under the village identity. */
  contributeSlot?: React.ReactNode;
}

const MobileDashboard: React.FC<MobileDashboardProps> = (props) => {
  const {
    isDarkMode = false, onToggleDarkMode, onCycleLanguage,
    isAuthenticated, isLoading, login, register, logout, userInfo,
    displayGN, displayDistrict, displayCity, displayCCODE, activeGn,
    districts, selectedDistrict, onDistrictChange,
    dsDivisions, selectedCity, onCityChange,
    gramaNiladharis, selectedGN, onGNChange,
    onOpenCategory, populationData, contributeSlot,
  } = props;

  const navigate = useNavigate();
  const { gnName, ccode } = useParams<{ gnName: string; ccode: string }>();
  const { language } = useLanguage();
  const L = (en: string, si: string, ta: string) => (language === 'si' ? si : language === 'ta' ? ta : en);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const elevated = useScrollTrigger({ disableHysteresis: true, threshold: 12 });

  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const surface = isDarkMode ? '#0f172a' : '#ffffff';

  const male = populationData?.male ?? 0;
  const female = populationData?.female ?? 0;
  const totalPop = populationData?.both ?? male + female;
  const malePct = totalPop ? Math.round((male / totalPop) * 100) : 0;
  const femalePct = totalPop ? 100 - malePct : 0;

  const goHome = () => navigate(gnName && ccode ? `/gnpage/${gnName}/${ccode}` : '/gnpage');
  const goSurvey = () => navigate(gnName && ccode ? `/industry-survey/${gnName}/${ccode}` : '/industry-survey');

  const handleCategory = (slug: string) => {
    setCategoriesOpen(false);
    onOpenCategory(slug);
  };

  const breadcrumb = [displayDistrict, displayCity].filter(Boolean).join('  ›  ');

  return (
    <Box sx={{ position: 'relative', minHeight: '100dvh', bgcolor: isDarkMode ? '#0b1120' : '#eef3fb', overflowX: 'hidden' }}>

      {/* ── IMMERSIVE MAP BACKGROUND (fixed, interactive) ─────────────── */}
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '60dvh', zIndex: 0,
        bgcolor: isDarkMode ? '#0b1120' : '#e8eef7',
      }}>
        <VillageMap
          immersive
          height="100%"
          gnName={displayGN || ''}
          district={displayDistrict}
          dsDivision={displayCity}
          ccode={displayCCODE}
          boundary={activeGn?.boundary}
        />
        {/* Top scrim so the app bar stays legible over the map */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 130, pointerEvents: 'none',
          background: isDarkMode
            ? 'linear-gradient(180deg, rgba(11,17,32,0.6) 0%, rgba(11,17,32,0) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
        }} />
      </Box>

      {/* ── FIXED GLASS APP BAR ───────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, pb: 1, pt: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        bgcolor: elevated
          ? (isDarkMode ? 'rgba(11,17,32,0.85)' : 'rgba(255,255,255,0.85)')
          : (isDarkMode ? 'rgba(11,17,32,0.5)' : 'rgba(255,255,255,0.55)'),
        backdropFilter: 'blur(20px)',
        borderBottom: elevated ? (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.06)') : '1px solid transparent',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        <Box onClick={goHome} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
          <Box component="img" src="/logo.png" alt="Ceylonica" sx={{ height: 34, width: 34, objectFit: 'contain' }} />
          <Typography sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '1.2rem', color: textMain, letterSpacing: '-0.01em' }}>
            Ceylonica
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            onClick={onCycleLanguage}
            role="button"
            aria-label="Change language"
            sx={{
              minWidth: 40, height: 40, px: 1, borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3, cursor: 'pointer',
              color: textMain, fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
            }}
          >
            <TranslateIcon sx={{ fontSize: '1rem' }} /> {language}
          </Box>
          <IconButton onClick={onToggleDarkMode} aria-label="Toggle theme" sx={{ width: 40, height: 40, color: textMain }}>
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Menu" sx={{ width: 40, height: 40, color: textMain }}>
            <MenuRoundedIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { mt: 1, minWidth: 190, borderRadius: '16px', bgcolor: surface, color: textMain, boxShadow: '0 16px 40px rgba(15,23,42,0.2)' } }}
          >
            <MenuItem onClick={() => { setMenuAnchor(null); goHome(); }}>{L('Home', 'මුල් පිටුව', 'முகப்பு')}</MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); navigate('/mydashboard'); }}>{L('Dashboard', 'උපකරණ පුවරුව', 'கட்டுப்பாடு')}</MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); goSurvey(); }}>{L('Industry Survey', 'දත්ත රැස් කිරීම', 'தரவு சேகரிப்பு')}</MenuItem>
            <Divider />
            {isAuthenticated ? (
              [
                <MenuItem key="forms" onClick={() => { setMenuAnchor(null); navigate('/user'); }}>{L('Location form', 'ස්ථාන පෝරමය', 'இடப் படிவம்')}</MenuItem>,
                <MenuItem key="logout" onClick={() => { setMenuAnchor(null); logout(); }} sx={{ color: '#ef4444' }}>{L('Logout', 'ඉවත් වන්න', 'வெளியேறு')}</MenuItem>,
              ]
            ) : !isLoading ? (
              [
                <MenuItem key="login" onClick={() => { setMenuAnchor(null); login(window.location.href); }}>{L('Login', 'පිවිසෙන්න', 'உள்நுழைய')}</MenuItem>,
                <MenuItem key="join" onClick={() => { setMenuAnchor(null); register(window.location.href); }} sx={{ color: '#2563eb', fontWeight: 700 }}>{L('Join with us', 'අප හා එක්වන්න', 'எங்களுடன் இணையுங்கள்')}</MenuItem>,
              ]
            ) : null}
          </Menu>
        </Box>
      </Box>

      {/* ── SCROLLING CONTENT OVER THE MAP ────────────────────────────── */}
      {/* The wrapper is pointer-events:none so taps in the spacer region fall
          through to the fixed map and its floating controls beneath it. Only the
          floating pill and the sheet opt back in (pointer-events is inherited,
          so descendants inherit 'none' unless they set 'auto'). Without this the
          full-height wrapper would sit over the map at z-index 10 and swallow
          every tap on the zoom/layer controls. */}
      <Box sx={{ position: 'relative', zIndex: 10, pointerEvents: 'none' }}>

        {/* Transparent spacer reveals the map; taps pass through to keep the map
            pannable. The floating pill re-enables pointer events for itself. */}
        <Box sx={{ height: '42dvh', pointerEvents: 'none', position: 'relative' }}>
          <Box
            onClick={() => setLocationOpen(true)}
            role="button"
            aria-label={L('Change location', 'ස්ථානය වෙනස් කරන්න', 'இடத்தை மாற்று')}
            sx={{
              pointerEvents: 'auto',
              position: 'absolute', left: '50%', bottom: 22, transform: 'translateX(-50%)',
              display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              maxWidth: 'calc(100vw - 48px)',
              px: 1.6, py: 0.9, borderRadius: '999px',
              bgcolor: isDarkMode ? 'rgba(11,17,32,0.7)' : 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(18px)',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(15,23,42,0.08)',
              boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
              '&:active': { transform: 'translateX(-50%) scale(0.98)' },
            }}
          >
            <Box sx={{ width: 26, height: 26, borderRadius: '999px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              <PlaceIcon sx={{ fontSize: '1rem' }} />
            </Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {breadcrumb || L('Explore the map', 'සිතියම ගවේෂණය', 'வரைபடத்தை ஆராயுங்கள்')}
            </Typography>
            <KeyboardArrowRightIcon sx={{ color: textMuted, fontSize: '1.1rem', flexShrink: 0 }} />
          </Box>
        </Box>

        {/* ── BOTTOM SHEET ────────────────────────────────────────────── */}
        {/* Opts back into pointer events (wrapper is 'none') so the sheet is
            interactive and covers/blocks the map beneath it. */}
        <Box sx={{
          position: 'relative',
          pointerEvents: 'auto',
          borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
          bgcolor: surface,
          boxShadow: isDarkMode ? '0 -14px 44px rgba(0,0,0,0.5)' : '0 -14px 44px rgba(15,23,42,0.16)',
          minHeight: '58dvh',
          px: 2, pt: 0.5,
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
        }}>
          {/* Grab handle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.2, pb: 1.5 }}>
            <Box sx={{ width: 44, height: 5, borderRadius: 3, bgcolor: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.14)' }} />
          </Box>

          {/* Hero: village identity */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {breadcrumb && (
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.8 }}>
                {breadcrumb}
              </Typography>
            )}
            <Typography sx={{
              fontFamily: "'Playfair Display', serif", fontWeight: 900,
              fontSize: 'clamp(1.9rem, 8vw, 2.7rem)', lineHeight: 1.05, color: textMain,
              letterSpacing: '-0.02em', wordBreak: 'break-word',
            }}>
              {displayGN || L('Select a Village', 'ගමක් තෝරන්න', 'கிராமத்தைத் தேர்வுசெய்க')}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1.4, flexWrap: 'wrap' }}>
              {displayCCODE && (
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 0.5, borderRadius: '10px',
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(30,58,138,0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(219,234,254,0.85) 100%)',
                  border: isDarkMode ? '1.5px solid rgba(96,165,250,0.5)' : '1.5px solid rgba(37,99,235,0.35)',
                  boxShadow: isDarkMode ? '0 2px 10px rgba(37,99,235,0.2)' : '0 2px 8px rgba(37,99,235,0.1)',
                }}>
                  <TagRoundedIcon sx={{ fontSize: '1rem', color: '#2563eb' }} />
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: isDarkMode ? '#93c5fd' : '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    AREA CODE:
                  </Typography>
                  <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '0.95rem', color: isDarkMode ? '#ffffff' : '#0f172a', letterSpacing: '1px' }}>
                    {displayCCODE}
                  </Typography>
                </Box>
              )}
              <Chip
                icon={<InfoOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
                label={L('About Village', 'ගම පිළිබඳව', 'கிராமம் பற்றி')}
                size="small"
                onClick={() => setAboutOpen(true)}
                sx={{
                  height: 32, borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem',
                  color: textMain, bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  '& .MuiChip-icon': { color: textMuted },
                }}
              />
            </Box>
          </Box>

          {contributeSlot && <Box sx={{ mb: 2.5 }}>{contributeSlot}</Box>}

          {/* Search */}
          <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              <GlobalSearchBar isDarkMode={isDarkMode} activeGn={activeGn ? { nameEn: activeGn.nameEn, CCODE: displayCCODE || activeGn.CCODE } : null} language={language} />
            </Box>
          </Box>

          {/* Category rail */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: textMain, letterSpacing: '-0.01em' }}>
                {L('Explore Categories', 'ප්‍රවර්ග ගවේෂණය', 'வகைகளை ஆராயுங்கள்')}
              </Typography>
              <Typography onClick={() => setCategoriesOpen(true)} sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}>
                {L('See all', 'සියල්ල', 'அனைத்தும்')}
              </Typography>
            </Box>
            <Box sx={{
              display: 'flex', gap: 1.2, overflowX: 'auto', pb: 1, px: 0.5,
              scrollSnapType: 'x proximity',
              '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
            }}>
              {MOBILE_CATEGORIES.map((cat) => (
                <Box
                  key={cat.slug}
                  onClick={() => onOpenCategory(cat.slug)}
                  role="button"
                  sx={{
                    flexShrink: 0, scrollSnapAlign: 'start', width: 92,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8,
                    p: 1.2, borderRadius: '18px', cursor: 'pointer',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.03)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.06)',
                    boxShadow: isDarkMode ? 'none' : '0 4px 14px rgba(15,23,42,0.05)',
                    '&:active': { transform: 'scale(0.96)' },
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Box sx={{
                    width: 46, height: 46, borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cat.color, bgcolor: `${cat.color}1f`,
                    '& .MuiSvgIcon-root': { fontSize: '1.5rem' },
                  }}>
                    {cat.icon}
                  </Box>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: textMain, textAlign: 'center', lineHeight: 1.15 }}>
                    {catLabel(cat, language)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Population highlight card */}
          <Box sx={{
            mb: 2.5, borderRadius: '24px', p: 2.5, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 55%,#1e40af 100%)',
            boxShadow: '0 18px 44px rgba(37,99,235,0.4)',
          }}>
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)', filter: 'blur(6px)' }} />
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GroupsIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {L('Village Population', 'ග්‍රාමීය ජනගහනය', 'கிராம மக்கள்தொகை')}
              </Typography>
            </Box>
            <Typography sx={{ position: 'relative', color: '#fff', fontWeight: 900, fontSize: '2.6rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {totalPop.toLocaleString()}
            </Typography>

            <Box sx={{ position: 'relative', mt: 2 }}>
              <Box sx={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Box sx={{ width: `${malePct}%`, background: 'linear-gradient(90deg,#60a5fa,#93c5fd)' }} />
                <Box sx={{ width: `${femalePct}%`, background: 'linear-gradient(90deg,#f9a8d4,#f472b6)' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <MaleIcon sx={{ color: '#bfdbfe', fontSize: '1.1rem' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
                    {L('Male', 'පුරුෂ', 'ஆண்')} {male.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
                    {female.toLocaleString()} {L('Female', 'ස්ත්‍රී', 'பெண்')}
                  </Typography>
                  <FemaleIcon sx={{ color: '#fbcfe8', fontSize: '1.1rem' }} />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Survey carousel */}
          <Box sx={{ mb: 1 }}>
            <MobileSurveyCarousel {...props} isDarkMode={isDarkMode} onOpenCategory={onOpenCategory} />
          </Box>

          {/* Footer inside the sheet */}
          <Box sx={{ mx: -2, mt: 2 }}>
            <GnPageFooter isDarkMode={isDarkMode} />
          </Box>
        </Box>
      </Box>

      {/* Bottom nav */}
      <MobileBottomNav
        isDarkMode={isDarkMode}
        onHome={goHome}
        onCategories={() => setCategoriesOpen(true)}
        onLocation={() => setLocationOpen(true)}
        onSurvey={goSurvey}
      />

      {/* Location sheet */}
      <MobileLocationSheet
        open={locationOpen}
        onOpen={() => setLocationOpen(true)}
        onClose={() => setLocationOpen(false)}
        isDarkMode={isDarkMode}
        districts={districts}
        selectedDistrict={selectedDistrict}
        onDistrictChange={onDistrictChange}
        dsDivisions={dsDivisions}
        selectedCity={selectedCity}
        onCityChange={onCityChange}
        gramaNiladharis={gramaNiladharis}
        selectedGN={selectedGN}
        onGNChange={(g) => { onGNChange(g); setLocationOpen(false); }}
      />

      {/* Categories bottom sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={categoriesOpen}
        onOpen={() => setCategoriesOpen(true)}
        onClose={() => setCategoriesOpen(false)}
        disableSwipeToOpen
        PaperProps={{ sx: { borderTopLeftRadius: '28px', borderTopRightRadius: '28px', bgcolor: surface, pb: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 40, height: 5, borderRadius: 3, bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)' }} />
        </Box>
        <Box sx={{ px: 3, pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: textMain }}>
              {L('Categories', 'ප්‍රවර්ග', 'வகைகள்')}
            </Typography>
            <IconButton onClick={() => setCategoriesOpen(false)} aria-label="Close" sx={{ width: 44, height: 44, color: textMuted }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.2, pb: 1 }}>
            {MOBILE_CATEGORIES.map((cat) => (
              <Box
                key={cat.slug}
                onClick={() => handleCategory(cat.slug)}
                role="button"
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.2, p: 1.4, borderRadius: '16px', cursor: 'pointer',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.03)',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.05)',
                  '&:active': { transform: 'scale(0.98)' },
                }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, bgcolor: `${cat.color}1f` }}>
                  {cat.icon}
                </Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: textMain, lineHeight: 1.15 }}>
                  {catLabel(cat, language)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* About dialog */}
      <Dialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', bgcolor: surface, color: textMain, mx: 2 } }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            <InfoOutlinedIcon />
          </Box>
          <Typography sx={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '1.02rem', lineHeight: 1.65, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
            {language === 'si'
              ? 'ප්‍රජා තොරතුරු සම්පාදනය තුළින් ගම සංවර්ධනයේ පදනම සකස් වේ. ඒ සඳහා ලංකාවේ ඕනෑම පුද්ගලයෙකුට සාමාජිකත්වය, ප්‍රතිලාභ, නායකත්වය ලබාගත හැකි වේදිකාවකි. මෙය මුළුමනින්ම ගමේ සාමාජිකයින් එකතු වී ගම සංවිධානය කරගන්නා නව ප්‍රවේශයකි. දශක කිහිපයක පර්යේෂණයකින් ගොඩනැගුණු මහජන මෙවලමකි. ඔබ ඔබේ ගම ගොඩනගන්න, ගමේ වෙබ් අඩවිය නිර්මානය කරගනිමින් එකතු වෙන්න. Login වන්න. පද්ධතිය සඳහා ඔබේ ගමේ පළමු සාමාජිකයා, නියමුවා බවට පත්වන්න.'
              : language === 'ta'
              ? 'சமூக தகவல் தொகுப்பின் மூலம் கிராம வளர்ச்சியின் அடிப்படை அமைக்கப்படுகிறது. இது இலங்கையில் உள்ள எவரும் உறுப்புரிமை, நன்மைகள் மற்றும் தலைமையை பெறக்கூடிய ஒரு தளமாகும். இது கிராம உறுப்பினர்கள் ஒன்றிணைந்து கிராமத்தை ஒழுங்கமைக்கும் ஒரு புதிய அணுகுமுறையாகும். இது பல தசாப்த கால ஆராய்ச்சியின் மூலம் உருவாக்கப்பட்ட ஒரு பொது கருவியாகும். உங்கள் கிராமத்தை உருவாக்குங்கள், கிராம வலைத்தளத்தை உருவாக்குவதன் மூலம் இணையுங்கள். உள்நுழையவும். உங்கள் கிராமத்திற்கான அமைப்பின் முதல் உறுப்பினர் மற்றும் வழிகாட்டியாக மாறுங்கள்.'
              : 'Community information compilation lays the foundation for village development. It is a platform where any individual in Sri Lanka can obtain membership, benefits, and leadership. This is a completely new approach where village members come together to organize their own village. It is a public tool built on decades of research. Build your village, and join by creating your village website. Login now. Become the first member and the pioneer of your village system.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pb: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setAboutOpen(false)}
            variant="contained"
            disableElevation
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '12px', px: 4, py: 1, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {L('Close', 'වහන්න', 'மூடு')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileDashboard;
