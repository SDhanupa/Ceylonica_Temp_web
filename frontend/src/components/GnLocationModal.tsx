import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, ButtonBase, CircularProgress, Dialog, IconButton, Slide, TextField, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useQuery } from '@apollo/client';
import { GET_GN_LABEL_BY_COORDINATES, GET_P_DISTRICTS, GET_P_DISTRICT_GN_OPTIONS } from '../graphql/queries';
import { getUserName, setUserName } from '../utils/cookieUtils';
import { useLanguage } from '../context/LanguageContext';
import { C } from './fruit/tokens';
import { buildDsDivisions } from '../utils/dsDivisions';

interface Props {
  open: boolean;
  onClose?: () => void;
  onLocationSelected: (gn: any) => void;
}

type Lang = 'si' | 'ta' | 'en';
type Mode = 'manual' | 'gps';

const INK = C.ink;
const MUTED = C.inkMuted;
const LINE = '#DADFD8';
const ACCENT = C.field;

const norm = (v?: string) => v?.trim().toLocaleLowerCase() || '';

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Select your location', sub: 'Industry and Business Survey · Sri Lanka', manual: 'Choose manually', gps: 'Use my location',
    district: 'District', ds: 'DS division', gn: 'Grama Niladhari division', pickDistrict: 'Choose a district first', pickDs: 'Choose a DS division first',
    locating: 'Finding your location…', identifying: 'Matching it to a GN division…', notFound: 'We could not match this location to a GN division. Choose it manually instead.',
    gpsDenied: 'Location access is blocked. Allow it in your browser, or choose manually.', gpsFailed: 'We could not get your location. Choose manually instead.',
    retry: 'Try again', cont: 'Continue', found: 'Your location', nameTitle: 'Your name', nameSub: 'Recorded as the person filling in the survey.',
    namePh: 'Full name', skip: 'Skip', save: 'Save and continue', close: 'Close', loading: 'Loading…', noOptions: 'No matches',
  },
  si: {
    title: 'ස්ථානය තෝරන්න', sub: 'කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණය · ශ්‍රී ලංකා', manual: 'අතින් තෝරන්න', gps: 'මගේ ස්ථානය',
    district: 'දිස්ත්‍රික්කය', ds: 'ප්‍රාදේශීය ලේකම් කොට්ඨාසය', gn: 'ග්‍රාම නිලධාරී වසම', pickDistrict: 'පළමුව දිස්ත්‍රික්කය තෝරන්න', pickDs: 'පළමුව ප්‍රා. ලේ. කොට්ඨාසය තෝරන්න',
    locating: 'ඔබේ ස්ථානය සොයමින්…', identifying: 'ග්‍රාම නිලධාරී වසමට ගළපමින්…', notFound: 'මෙම ස්ථානය වසමකට ගැළපිය නොහැකි විය. අතින් තෝරන්න.',
    gpsDenied: 'ස්ථාන අවසරය අවහිර කර ඇත. බ්‍රවුසරයේ අවසර දෙන්න, නැතහොත් අතින් තෝරන්න.', gpsFailed: 'ඔබේ ස්ථානය ලබා ගත නොහැකි විය. අතින් තෝරන්න.',
    retry: 'නැවත උත්සාහ කරන්න', cont: 'ඉදිරියට', found: 'ඔබේ ස්ථානය', nameTitle: 'ඔබේ නම', nameSub: 'සමීක්ෂණය පුරවන්නාගේ නම ලෙස සටහන් වේ.',
    namePh: 'සම්පූර්ණ නම', skip: 'මඟ හරින්න', save: 'සුරකා ඉදිරියට', close: 'වසන්න', loading: 'පූරණය වෙමින්…', noOptions: 'ගැළපීම් නැත',
  },
  ta: {
    title: 'உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்', sub: 'கைத்தொழில் மற்றும் வணிகக் கணக்கெடுப்பு · இலங்கை', manual: 'கைமுறையாக', gps: 'என் இருப்பிடம்',
    district: 'மாவட்டம்', ds: 'பிரதேச செயலகப் பிரிவு', gn: 'கிராம அலுவலர் பிரிவு', pickDistrict: 'முதலில் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்', pickDs: 'முதலில் பி.செ. பிரிவைத் தேர்ந்தெடுக்கவும்',
    locating: 'இருப்பிடத்தைக் கண்டறிகிறது…', identifying: 'கி.அ. பிரிவுடன் பொருத்துகிறது…', notFound: 'இந்த இருப்பிடத்தை ஒரு பிரிவுடன் பொருத்த முடியவில்லை. கைமுறையாகத் தேர்ந்தெடுக்கவும்.',
    gpsDenied: 'இருப்பிட அணுகல் தடுக்கப்பட்டுள்ளது. உலாவியில் அனுமதிக்கவும் அல்லது கைமுறையாகத் தேர்ந்தெடுக்கவும்.', gpsFailed: 'இருப்பிடத்தைப் பெற முடியவில்லை. கைமுறையாகத் தேர்ந்தெடுக்கவும்.',
    retry: 'மீண்டும் முயற்சி', cont: 'தொடர்க', found: 'உங்கள் இருப்பிடம்', nameTitle: 'உங்கள் பெயர்', nameSub: 'கணக்கெடுப்பை நிரப்புபவரின் பெயராகப் பதிவாகும்.',
    namePh: 'முழுப் பெயர்', skip: 'தவிர்', save: 'சேமித்து தொடர்க', close: 'மூடு', loading: 'ஏற்றுகிறது…', noOptions: 'பொருத்தம் இல்லை',
  },
};

const SheetUp = React.forwardRef(function SheetUp(props: TransitionProps & { children: React.ReactElement }, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/* Square, hairline-bordered field used for all three selects and the name input. */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0, bgcolor: '#fff', minHeight: 52, fontSize: '1rem',
    '& fieldset': { borderColor: LINE },
    '&:hover fieldset': { borderColor: INK },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: 2 },
    '&.Mui-disabled': { bgcolor: '#F6F7F5' },
  },
} as const;

const squareButton = {
  borderRadius: 0, textTransform: 'none', fontWeight: 700, fontSize: '1rem', minHeight: 52, boxShadow: 'none',
  '&:hover': { boxShadow: 'none' },
  '&:focus-visible': { outline: `2px solid ${INK}`, outlineOffset: 2 },
} as const;

const Step: React.FC<{ n: string; label: string; done: boolean; children: React.ReactNode }> = ({ n, label, done, children }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
      <Typography component="span" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: done ? ACCENT : MUTED }}>{n}</Typography>
      <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.85rem', color: INK }}>{label}</Typography>
    </Box>
    {children}
  </Box>
);

const GnLocationModal: React.FC<Props> = ({ open, onClose, onLocationSelected }) => {
  const { language, setLanguage } = useLanguage();
  const lang = (language as Lang) in T ? (language as Lang) : 'si';
  const t = T[lang];
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  // Phones usually have GPS; desktops usually don't, so they start on the dropdowns.
  const [mode, setMode] = useState<Mode>(() => (window.matchMedia('(max-width: 600px)').matches ? 'gps' : 'manual'));

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<'denied' | 'failed' | null>(null);
  const [locating, setLocating] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedGN, setSelectedGN] = useState('');

  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [pendingGn, setPendingGn] = useState<any>(null);

  // Light queries only: names and codes. The previous village query pulled full
  // census records for every GN in the district (~450 KB, ~8 s on the dev API).
  const { data: districtsData, loading: districtsLoading } = useQuery(GET_P_DISTRICTS, { fetchPolicy: 'cache-first', skip: !open });
  const { data: gnData, loading: gnLoading } = useQuery(GET_P_DISTRICT_GN_OPTIONS, {
    variables: { id: selectedDistrict },
    skip: !open || !selectedDistrict,
    fetchPolicy: 'cache-first',
  });
  const { data: autoGnData, loading: autoGnLoading } = useQuery(GET_GN_LABEL_BY_COORDINATES, {
    variables: { lat: location?.lat, lng: location?.lng },
    skip: !location,
    fetchPolicy: 'cache-first',
  });

  const activeGn = autoGnData?.gnByCoordinates || null;
  const districts: any[] = useMemo(
    () => [...(districtsData?.pDistricts || [])].sort((a, b) => String(a.admin2NameEn).localeCompare(String(b.admin2NameEn))),
    [districtsData],
  );
  const gnRows: any[] = gnData?.pDistrict?.gramaNiladharis || [];

  const dsOptions = useMemo(() => buildDsDivisions(gnRows), [gnRows]);

  const gnOptions = useMemo(
    () => (selectedCity ? gnRows.filter((g: any) => (g.divisionalSecretariatCode || g.dsEn) === selectedCity) : [])
      .slice().sort((a: any, b: any) => String(a.nameEn).localeCompare(String(b.nameEn))),
    [gnRows, selectedCity],
  );

  const pick = (o: any, en: string, si: string, ta: string) => (o ? (lang === 'si' ? o[si] : lang === 'ta' ? o[ta] : o[en]) || o[en] || '' : '');
  const distLabel = (d: any) => pick(d, 'admin2NameEn', 'admin2NameSi', 'admin2NameTa');
  const dsLabel = (c: any) => pick(c, 'dsEn', 'dsSi', 'dsTa');
  const gnLabel = (g: any) => pick(g, 'nameEn', 'nameSi', 'nameTa');
  const disLabelOfGn = (g: any) => pick(g, 'disEn', 'disSi', 'disTa');

  // Fill the dropdowns from a GPS match so switching to manual shows it pre-selected.
  useEffect(() => {
    if (!activeGn) return;
    const distId = activeGn.pDistrict?.id
      || districts.find((d) => norm(d.admin2NameEn) === norm(activeGn.disEn))?.id;
    if (distId) setSelectedDistrict(String(distId));
    const ds = activeGn.divisionalSecretariatCode || activeGn.dsEn;
    if (ds) setSelectedCity(ds);
    if (activeGn.CCODE) setSelectedGN(activeGn.CCODE);
  }, [activeGn, districts]);

  const requestGps = () => {
    setGpsError(null);
    setLocation(null);
    if (!navigator.geolocation) { setGpsError('failed'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      (err) => { setGpsError(err.code === err.PERMISSION_DENIED ? 'denied' : 'failed'); setLocating(false); },
      // Without a timeout some browsers wait indefinitely on desktops with no GPS.
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    if (open && mode === 'gps' && !location && !gpsError && !locating) requestGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const manualGn = gnRows.find((g: any) => g.CCODE === selectedGN || String(g.id) === String(selectedGN)) || null;
  const chosenGn = mode === 'gps' ? activeGn : manualGn;
  const canContinue = !!chosenGn?.CCODE;

  const handleConfirm = () => {
    if (!chosenGn) return;
    if (!getUserName()) {
      setNameInput('');
      setPendingGn(chosenGn);
      setShowNameModal(true);
    } else {
      onLocationSelected(chosenGn);
    }
  };

  const handleNameSave = (name: string) => {
    setUserName(name.trim() || (lang === 'si' ? 'නොදන්නා' : 'Unknown'));
    setShowNameModal(false);
    if (pendingGn) onLocationSelected(pendingGn);
  };

  const paperSx = {
    borderRadius: 0,
    m: { xs: 0, sm: 3 },
    width: { xs: '100%', sm: 'min(520px, calc(100% - 48px))' },
    maxWidth: 'none',
    maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 64px)' },
    bgcolor: '#fff',
    border: { xs: 'none', sm: `1px solid ${LINE}` },
    boxShadow: '0 24px 64px -32px rgba(16,36,26,0.45)',
    display: 'flex', flexDirection: 'column',
  } as const;

  const dialogCommon = {
    TransitionComponent: phone ? SheetUp : undefined,
    transitionDuration: { enter: 200, exit: 150 },
    slotProps: { backdrop: { sx: { bgcolor: 'rgba(16,24,20,0.55)' } } },
    sx: { '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } } },
  };

  const langOrder: Lang[] = ['si', 'ta', 'en'];
  const langLabel: Record<Lang, string> = { si: 'සිං', ta: 'த', en: 'EN' };

  const autocompleteCommon = {
    fullWidth: true,
    loadingText: t.loading,
    noOptionsText: t.noOptions,
    slotProps: { paper: { sx: { borderRadius: 0, border: `1px solid ${LINE}`, boxShadow: '0 16px 32px -20px rgba(16,36,26,0.4)', mt: 0.5 } } },
  };

  const gpsStatus = () => {
    if (locating) return { tone: MUTED, text: t.locating, busy: true };
    if (gpsError) return { tone: '#B42318', text: gpsError === 'denied' ? t.gpsDenied : t.gpsFailed, busy: false };
    if (location && autoGnLoading) return { tone: MUTED, text: t.identifying, busy: true };
    if (location && !activeGn) return { tone: '#B42318', text: t.notFound, busy: false };
    return null;
  };
  const status = mode === 'gps' ? gpsStatus() : null;

  return (
    <>
      <Dialog open={open && !showNameModal} disableEscapeKeyDown={!onClose} onClose={onClose ? () => onClose() : undefined} PaperProps={{ sx: paperSx }} aria-labelledby="gn-loc-title" {...dialogCommon}>
        {/* Header */}
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: { xs: 2.5, sm: 3 }, pb: 2, borderBottom: `1px solid ${LINE}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box component="img" src="/logo-96.webp" alt="" width={32} height={32} sx={{ width: 32, height: 32, objectFit: 'contain' }} />
            <Box sx={{ flex: 1 }} />
            <Box role="group" aria-label="Language" sx={{ display: 'flex', border: `1px solid ${LINE}` }}>
              {langOrder.map((l, i) => (
                <ButtonBase
                  key={l}
                  onClick={() => setLanguage(l)}
                  aria-pressed={lang === l}
                  sx={{
                    minWidth: 40, height: 32, px: 1, fontSize: '0.8rem', fontWeight: 700,
                    borderLeft: i ? `1px solid ${LINE}` : 'none',
                    bgcolor: lang === l ? INK : 'transparent', color: lang === l ? '#fff' : MUTED,
                    '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: -2 },
                  }}
                >
                  {langLabel[l]}
                </ButtonBase>
              ))}
            </Box>
            {onClose && (
              <IconButton onClick={onClose} aria-label={t.close} sx={{ borderRadius: 0, width: 36, height: 36, color: MUTED, '&:hover': { color: INK, bgcolor: '#F2F4F1' } }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Typography id="gn-loc-title" component="h2" sx={{ mt: 2.5, fontWeight: 800, fontSize: { xs: '1.4rem', sm: '1.6rem' }, lineHeight: 1.25, color: INK, letterSpacing: '-0.01em' }}>
            {t.title}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: '0.88rem', color: MUTED }}>{t.sub}</Typography>
        </Box>

        {/* Mode tabs */}
        <Box role="tablist" sx={{ display: 'flex', borderBottom: `1px solid ${LINE}` }}>
          {([['manual', t.manual, <TuneRoundedIcon key="m" sx={{ fontSize: '1.05rem' }} />], ['gps', t.gps, <MyLocationRoundedIcon key="g" sx={{ fontSize: '1.05rem' }} />]] as const).map(([m, label, icon]) => {
            const on = mode === m;
            return (
              <ButtonBase
                key={m}
                role="tab"
                aria-selected={on}
                onClick={() => setMode(m)}
                sx={{
                  flex: 1, height: 48, gap: 1, fontSize: '0.92rem', fontWeight: 700,
                  color: on ? INK : MUTED,
                  boxShadow: on ? `inset 0 -2px 0 ${ACCENT}` : 'none',
                  transition: 'color 150ms ease, box-shadow 150ms ease',
                  '&:hover': { color: INK },
                  '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: -2 },
                }}
              >
                {icon}{label}
              </ButtonBase>
            );
          })}
        </Box>

        {/* Body */}
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: 3, overflowY: 'auto', flex: 1, minHeight: { sm: 300 } }}>
          {mode === 'manual' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Step n="01" label={t.district} done={!!selectedDistrict}>
                <Autocomplete
                  {...autocompleteCommon}
                  options={districts}
                  loading={districtsLoading}
                  getOptionLabel={(o: any) => distLabel(o)}
                  isOptionEqualToValue={(a: any, b: any) => String(a.id) === String(b.id)}
                  value={districts.find((d) => String(d.id) === String(selectedDistrict)) || null}
                  onChange={(_, v: any) => { setSelectedDistrict(v ? String(v.id) : ''); setSelectedCity(''); setSelectedGN(''); }}
                  renderInput={(params) => <TextField {...params} placeholder={t.district} sx={fieldSx} inputProps={{ ...params.inputProps, 'aria-label': t.district }} />}
                />
              </Step>
              <Step n="02" label={t.ds} done={!!selectedCity}>
                <Autocomplete
                  {...autocompleteCommon}
                  options={dsOptions}
                  loading={gnLoading}
                  disabled={!selectedDistrict}
                  getOptionLabel={(o: any) => dsLabel(o)}
                  isOptionEqualToValue={(a: any, b: any) => a.code === b.code}
                  value={dsOptions.find((c) => c.code === selectedCity) || null}
                  onChange={(_, v: any) => { setSelectedCity(v ? v.code : ''); setSelectedGN(''); }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedDistrict ? (gnLoading ? t.loading : t.ds) : t.pickDistrict}
                      sx={fieldSx}
                      inputProps={{ ...params.inputProps, 'aria-label': t.ds }}
                      InputProps={{ ...params.InputProps, endAdornment: <>{gnLoading ? <CircularProgress size={18} sx={{ color: MUTED }} /> : null}{params.InputProps.endAdornment}</> }}
                    />
                  )}
                />
              </Step>
              <Step n="03" label={t.gn} done={!!selectedGN}>
                <Autocomplete
                  {...autocompleteCommon}
                  options={gnOptions}
                  disabled={!selectedCity}
                  getOptionLabel={(o: any) => gnLabel(o)}
                  isOptionEqualToValue={(a: any, b: any) => a.CCODE === b.CCODE}
                  value={gnOptions.find((g: any) => g.CCODE === selectedGN) || null}
                  onChange={(_, v: any) => setSelectedGN(v ? v.CCODE : '')}
                  renderOption={(props, o: any) => (
                    <li {...props} key={o.CCODE}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                        <span>{gnLabel(o)}</span>
                        <Typography component="span" sx={{ fontSize: '0.78rem', color: MUTED, fontFamily: "'Inter', sans-serif" }}>{o.CCODE}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => <TextField {...params} placeholder={selectedCity ? t.gn : t.pickDs} sx={fieldSx} inputProps={{ ...params.inputProps, 'aria-label': t.gn }} />}
                />
              </Step>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {status && (
                <Box role="status" aria-live="polite" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, borderLeft: `3px solid ${status.tone}`, bgcolor: '#F6F7F5' }}>
                  {status.busy && <CircularProgress size={18} sx={{ color: MUTED, mt: '2px' }} />}
                  <Typography sx={{ fontSize: '0.95rem', color: status.busy ? INK : status.tone, lineHeight: 1.55 }}>{status.text}</Typography>
                </Box>
              )}
              {activeGn && !autoGnLoading && (
                <Box sx={{ border: `1px solid ${LINE}` }}>
                  <Typography sx={{ px: 2, pt: 1.5, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>{t.found}</Typography>
                  {[
                    [t.gn, `${gnLabel(activeGn)} (${activeGn.CCODE})`],
                    [t.ds, dsLabel(dsOptions.find(ds => ds.code === (activeGn.divisionalSecretariatCode || activeGn.dsEn)) || activeGn)],
                    [t.district, disLabelOfGn(activeGn)],
                  ].map(([k, v], i) => (
                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, px: 2, py: 1.25, borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                      <Typography sx={{ fontSize: '0.88rem', color: MUTED }}>{k}</Typography>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK, textAlign: 'right' }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {(gpsError || (location && !activeGn && !autoGnLoading)) && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={requestGps} variant="outlined" sx={{ ...squareButton, flex: 1, color: INK, borderColor: LINE, '&:hover': { borderColor: INK, bgcolor: 'transparent' } }}>{t.retry}</Button>
                  <Button onClick={() => setMode('manual')} variant="outlined" sx={{ ...squareButton, flex: 1, color: INK, borderColor: LINE, '&:hover': { borderColor: INK, bgcolor: 'transparent' } }}>{t.manual}</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 2, pb: { xs: 'calc(16px + env(safe-area-inset-bottom, 0px))', sm: 3 }, borderTop: `1px solid ${LINE}` }}>
          <Button
            fullWidth
            variant="contained"
            disabled={!canContinue}
            onClick={handleConfirm}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ ...squareButton, bgcolor: INK, color: '#fff', '&:hover': { bgcolor: ACCENT, boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: '#E4E7E2', color: '#8A958D' } }}
          >
            {t.cont}
          </Button>
        </Box>
      </Dialog>

      {/* Name */}
      <Dialog open={showNameModal} PaperProps={{ sx: { ...paperSx, width: { xs: '100%', sm: 'min(440px, calc(100% - 48px))' } } }} aria-labelledby="gn-name-title" {...dialogCommon}>
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: 2, borderBottom: `1px solid ${LINE}` }}>
          <Typography id="gn-name-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.4rem', color: INK }}>{t.nameTitle}</Typography>
          <Typography sx={{ mt: 0.5, fontSize: '0.9rem', color: MUTED }}>{t.nameSub}</Typography>
        </Box>
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: 3 }}>
          <TextField
            autoFocus
            fullWidth
            value={nameInput}
            placeholder={t.namePh}
            onChange={(e) => setNameInput(e.target.value.slice(0, 120))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNameSave(nameInput); } }}
            inputProps={{ 'aria-label': t.nameTitle, autoComplete: 'name', maxLength: 120 }}
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, px: { xs: 2.5, sm: 3.5 }, pt: 2, pb: { xs: 'calc(16px + env(safe-area-inset-bottom, 0px))', sm: 3 }, borderTop: `1px solid ${LINE}` }}>
          <Button onClick={() => handleNameSave('')} variant="text" sx={{ ...squareButton, color: MUTED, px: 2.5, '&:hover': { bgcolor: '#F2F4F1' } }}>{t.skip}</Button>
          <Button onClick={() => handleNameSave(nameInput)} variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{ ...squareButton, flex: 1, bgcolor: INK, color: '#fff', '&:hover': { bgcolor: ACCENT, boxShadow: 'none' } }}>{t.save}</Button>
        </Box>
      </Dialog>
    </>
  );
};

export default GnLocationModal;
