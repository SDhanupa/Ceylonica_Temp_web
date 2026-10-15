import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, TextField, Typography,
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { useQuery } from '@apollo/client';
import { GET_GN_BY_COORDINATES, GET_P_DISTRICTS, GET_P_DISTRICT_WITH_GNS } from '../graphql/queries';
import { getUserName, setUserName } from '../utils/cookieUtils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  open: boolean;
  onClose?: () => void;
  onLocationSelected: (gn: any) => void;
}

const PRIMARY = '#00A8FF';

const norm = (v?: string) => v?.trim().toLocaleLowerCase() || '';

const GnLocationModal: React.FC<Props> = ({ open, onClose, onLocationSelected }) => {
  const { language, setLanguage } = useLanguage();

  // GPS state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Dropdown state
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedGN, setSelectedGN] = useState('');
  const [showManualForm, setShowManualForm] = useState(!window.matchMedia('(max-width: 600px)').matches);

  // Name modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [pendingGn, setPendingGn] = useState<any>(null);

  const { data: districtsData, loading: districtsLoading } = useQuery(GET_P_DISTRICTS, { fetchPolicy: 'cache-first' });
  const { data: gnData, loading: gnLoading } = useQuery(GET_P_DISTRICT_WITH_GNS, {
    variables: { id: selectedDistrict },
    skip: !selectedDistrict,
    fetchPolicy: 'cache-first',
  });
  const { data: autoGnData, loading: autoGnLoading } = useQuery(GET_GN_BY_COORDINATES, {
    variables: { lat: location?.lat, lng: location?.lng },
    skip: !location,
    fetchPolicy: 'network-only',
  });

  const activeGn = autoGnData?.gnByCoordinates;

  const uniqueCities = useMemo(() => {
    const gnRows = gnData?.pDistrict?.gramaNiladharis;
    if (!gnRows) return [];
    const map = new Map<string, any>();
    gnRows.forEach((gn: any) => {
      const code = gn.divisionalSecretariatCode || gn.dsEn;
      if (!code) return;
      const existing = map.get(code);
      if (!existing) {
        map.set(code, { divisionalSecretariatCode: code, dsEn: gn.dsEn || code, dsSi: gn.dsSi, dsTa: gn.dsTa });
      } else {
        existing.dsSi ||= gn.dsSi;
        existing.dsTa ||= gn.dsTa;
      }
    });
    return Array.from(map.values()).map((city) => {
      const match = gnRows.find(
        (g: any) => (g.divisionalSecretariatCode || g.dsEn) === city.divisionalSecretariatCode && norm(g.nameEn) === norm(city.dsEn),
      );
      return { ...city, dsSi: city.dsSi || match?.nameSi || city.dsEn, dsTa: city.dsTa || match?.nameTa || city.dsEn };
    });
  }, [gnData]);

  const filteredGNs = useMemo(() => {
    const rows = gnData?.pDistrict?.gramaNiladharis || [];
    if (!selectedCity) return rows;
    return rows.filter((gn: any) => gn.divisionalSecretariatCode === selectedCity || gn.dsEn === selectedCity);
  }, [gnData, selectedCity]);

  // Auto-sync dropdowns when GPS resolves a GN
  useEffect(() => {
    if (!activeGn) return;
    const distName = norm(activeGn.pDistrict?.admin2NameEn || activeGn.disEn);
    const distId = activeGn.pDistrict?.id ||
      districtsData?.pDistricts?.find((d: any) => norm(d.admin2NameEn) === distName || norm(d.nameEn) === distName)?.id;
    if (distId) setSelectedDistrict(String(distId));
    const ds = activeGn.divisionalSecretariatCode || activeGn.dsEn;
    if (ds) setSelectedCity(ds);
    if (activeGn.id) setSelectedGN(String(activeGn.id));
  }, [activeGn, districtsData]);

  // Trigger GPS on open (manual-form = false branch)
  useEffect(() => {
    if (!open || showManualForm || location || locationError) return;
    setLocating(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      (err) => { setLocationError(err.message || 'Unable to retrieve location'); setLocating(false); },
    );
  }, [open, showManualForm, location, locationError]);

  const canContinue = showManualForm
    ? selectedDistrict !== '' && selectedCity !== '' && selectedGN !== ''
    : location !== null || locationError !== null;

  const cycleLanguage = () => {
    if (language === 'en') setLanguage('si');
    else if (language === 'si') setLanguage('ta');
    else setLanguage('en');
  };

  const handleConfirm = () => {
    let gn: any = null;
    if (!showManualForm && activeGn) {
      gn = activeGn;
    } else if (showManualForm && selectedGN && gnData?.pDistrict?.gramaNiladharis) {
      gn = gnData.pDistrict.gramaNiladharis.find(
        (x: any) => String(x.id) === String(selectedGN) || x.CCODE === selectedGN || x.ccode === selectedGN,
      );
    }
    const saved = getUserName();
    if (!saved) {
      setNameInput('');
      setPendingGn(gn);
      setShowNameModal(true);
    } else if (gn) {
      onLocationSelected(gn);
    } else {
      onClose?.();
    }
  };

  const handleNameSave = (name: string) => {
    const toSave = name.trim() || (language === 'si' ? 'නොදන්නා' : 'Unknown');
    setUserName(toSave);
    setShowNameModal(false);
    if (pendingGn) onLocationSelected(pendingGn);
    else onClose?.();
  };

  const gnLabel = (gn: any) => {
    if (!gn) return '';
    return (language === 'en' ? gn.nameEn : language === 'si' ? gn.nameSi : gn.nameTa) || gn.nameEn || '';
  };
  const dsLabel = (city: any) => {
    if (!city) return '';
    return (language === 'en' ? city.dsEn : language === 'si' ? city.dsSi : city.dsTa) || city.dsEn || '';
  };
  const distLabel = (d: any) => {
    if (!d) return '';
    return (language === 'en' ? d.admin2NameEn : language === 'si' ? d.admin2NameSi : d.admin2NameTa) || d.admin2NameEn || '';
  };

  return (
    <>
      {/* ── Location Dialog ── */}
      <Dialog
        open={open && !showNameModal}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: { xs: '90%', sm: 420 },
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #ffffff 0%, #f0f4ff 100%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          },
        }}
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(14px)', bgcolor: 'rgba(0,0,0,0.6)' } } }}
      >
        {/* Blue gradient header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #00A8FF 0%, #0070CC 100%)',
            p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, position: 'relative',
          }}
        >
          {/* Language toggle */}
          <Box
            onClick={cycleLanguage}
            sx={{
              position: 'absolute', top: 14, right: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.4)',
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.8rem',
              color: '#ffffff', textTransform: 'uppercase', transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
            }}
          >
            {language}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Ceylonica" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
          </Box>

          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, fontFamily: "'Inter', sans-serif", textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
            {showManualForm
              ? (language === 'si' ? 'ස්ථානය තෝරන්න' : language === 'ta' ? 'உங்கள் இடத்தை தேர்வு செய்யவும்' : 'Select Your Location')
              : (language === 'si' ? 'ඔබගේ ස්ථානය' : language === 'ta' ? 'உங்கள் இடம்' : 'Your Location')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Inter', sans-serif" }}>
            {language === 'si' ? 'කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණය · ශ්‍රී ලංකා' : language === 'ta' ? 'தொழில் ஆய்வு · இலங்கை' : 'Industry and Business Survey · Sri Lanka'}
          </Typography>
        </Box>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3, px: 3 }}>
          {!showManualForm ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {locating ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <CircularProgress size={24} sx={{ color: PRIMARY }} />
                  <Typography>{language === 'si' ? 'GPS ස්ථානය ලබා ගනිමින්...' : language === 'ta' ? 'GPS இடத்தைப் பெறுகிறது...' : 'Fetching GPS coordinates...'}</Typography>
                </Box>
              ) : locationError ? (
                <Alert severity="warning" sx={{ bgcolor: 'rgba(255,152,0,0.1)', color: '#ff9800' }}>{locationError}</Alert>
              ) : location ? (
                <Box sx={{ p: 2, bgcolor: 'rgba(0,168,255,0.1)', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'si' ? '좌표' : 'Coordinates'}: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </Typography>
                  {autoGnLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={16} /><Typography variant="body2">{language === 'si' ? 'ස්ථානය හඳුනා ගනිමින්...' : 'Identifying location...'}</Typography>
                    </Box>
                  ) : activeGn ? (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {language === 'si' ? 'දිස්ත්‍රික්කය' : language === 'ta' ? 'மாவட்டம்' : 'District'}: {language === 'si' ? activeGn.pDistrict?.admin2NameSi : language === 'ta' ? activeGn.pDistrict?.admin2NameTa : activeGn.pDistrict?.admin2NameEn}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {language === 'si' ? 'නගරය / ප්‍රාදේශීය' : language === 'ta' ? 'நகரம் / பிரதேச' : 'City / DS Division'}: {language === 'si' ? activeGn.dsSi : language === 'ta' ? activeGn.dsTa : activeGn.dsEn}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {language === 'si' ? 'ග්‍රාම නිලධාරී වසම' : language === 'ta' ? 'கிராம அலுவலர்' : 'GN Division'}: {language === 'si' ? activeGn.nameSi : language === 'ta' ? activeGn.nameTa : activeGn.nameEn}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>Location not found in database.</Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Location not available.</Typography>
              )}
              <Button variant="outlined" onClick={() => setShowManualForm(true)} sx={{ mt: 2, color: PRIMARY, borderColor: PRIMARY }}>
                {language === 'si' ? 'අතින් තෝරන්න' : language === 'ta' ? 'கைமுறையாக தேர்ந்தெடுக்கவும்' : 'Select Manually'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <FormControl fullWidth>
                <Autocomplete
                  key={`dist-${language}`}
                  options={districtsData?.pDistricts || []}
                  getOptionLabel={(o: any) => distLabel(o)}
                  value={districtsData?.pDistricts?.find((d: any) => d.id === selectedDistrict) || null}
                  onChange={(_, v) => { setSelectedDistrict(v ? v.id : ''); setSelectedCity(''); setSelectedGN(''); }}
                  loading={districtsLoading}
                  renderInput={(params) => (
                    <TextField {...params} label={language === 'si' ? 'දිස්ත්‍රික්කය' : language === 'ta' ? 'மாவட்டம்' : 'District'}
                      InputProps={{ ...params.InputProps, endAdornment: <>{districtsLoading ? <CircularProgress size={20} /> : null}{params.InputProps.endAdornment}</> }}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth disabled={!selectedDistrict || gnLoading}>
                <Autocomplete
                  key={`ds-${language}`}
                  options={uniqueCities}
                  getOptionLabel={(o: any) => dsLabel(o)}
                  value={uniqueCities.find((c: any) => c.divisionalSecretariatCode === selectedCity) || null}
                  onChange={(_, v) => { setSelectedCity(v ? v.divisionalSecretariatCode : ''); setSelectedGN(''); }}
                  loading={gnLoading}
                  renderInput={(params) => (
                    <TextField {...params} label={language === 'si' ? 'නගරය / ප්‍රාදේශීය ලේකම් කොට්ඨාසය' : language === 'ta' ? 'நகரம் / பிரதேச செயலகப் பிரிவு' : 'City / DS Division'}
                      InputProps={{ ...params.InputProps, endAdornment: <>{gnLoading ? <CircularProgress size={20} /> : null}{params.InputProps.endAdornment}</> }}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth disabled={!selectedCity || gnLoading}>
                <Autocomplete
                  key={`gn-${language}`}
                  options={filteredGNs}
                  getOptionLabel={(o: any) => gnLabel(o)}
                  value={filteredGNs.find((g: any) => String(g.id) === String(selectedGN) || g.CCODE === selectedGN) || null}
                  onChange={(_, v) => { setSelectedGN(v ? (v.CCODE || v.id) : ''); }}
                  loading={gnLoading}
                  renderInput={(params) => (
                    <TextField {...params} label={language === 'si' ? 'ග්‍රාම නිලධාරී වසම (GN)' : language === 'ta' ? 'கிராம அலுவலர் பிரிவு (GN)' : 'Grama Niladhari (GN)'}
                      InputProps={{ ...params.InputProps, endAdornment: <>{gnLoading ? <CircularProgress size={20} /> : null}{params.InputProps.endAdornment}</> }}
                    />
                  )}
                />
              </FormControl>

              <Divider sx={{ my: 1, '&::before, &::after': { borderColor: 'rgba(0,0,0,0.15)' } }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, px: 1 }}>OR</Typography>
              </Divider>

              <Button
                variant="outlined"
                startIcon={<PlaceRoundedIcon sx={{ fontSize: '1.2rem' }} />}
                onClick={() => setShowManualForm(false)}
                sx={{ color: PRIMARY, borderColor: PRIMARY, alignSelf: 'center', borderRadius: '12px', px: 3, py: 1, fontWeight: 600, '&:hover': { bgcolor: 'rgba(0,168,255,0.08)', borderColor: PRIMARY } }}
              >
                {language === 'si' ? 'GPS මගින් ස්ථානය ලබාගන්න' : language === 'ta' ? 'GPS தானியங்கு இருப்பிடம்' : 'Use GPS Auto-Location'}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'center' }}>
          <Button
            variant="contained"
            disabled={!canContinue}
            onClick={handleConfirm}
            sx={{
              background: canContinue ? 'linear-gradient(135deg, #00A8FF 0%, #0070CC 100%)' : undefined,
              color: 'white', px: 5, py: 1.2, borderRadius: '12px',
              fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: '1rem',
              boxShadow: canContinue ? '0 4px 20px rgba(0,168,255,0.4)' : undefined,
              '&:hover': { background: 'linear-gradient(135deg, #0090E0 0%, #005AB0 100%)', boxShadow: '0 6px 24px rgba(0,168,255,0.5)' },
              transition: 'all 0.25s',
            }}
          >
            {language === 'si' ? 'ඉදිරියට' : language === 'ta' ? 'தொடரவும்' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Name Dialog ── */}
      <Dialog
        open={showNameModal}
        onClose={() => {}}
        maxWidth="xs"
        fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(10px)', bgcolor: 'rgba(15,23,42,0.6)' } } }}
        PaperProps={{
          sx: {
            borderRadius: '24px', p: 1.5, bgcolor: '#ffffff', color: '#0f172a',
            boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.06)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <PersonRoundedIcon sx={{ fontSize: '1.4rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: '#0f172a' }}>
              {language === 'si' ? 'ඔබගේ නම' : language === 'ta' ? 'உங்கள் பெயர்' : 'Your Name'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {language === 'si' ? 'ස්ථානය තහවුරු විය. කරුණාකර ඔබගේ නම ඇතුළත් කරන්න:' : language === 'ta' ? 'இடம் உறுதி செய்யப்பட்டது. தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்:' : 'Location confirmed. Please enter your name:'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            autoFocus fullWidth size="small" variant="outlined"
            placeholder={language === 'si' ? 'නම ඇතුළත් කරන්න...' : language === 'ta' ? 'பெயரை உள்ளிடவும்...' : 'Enter your name...'}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNameSave(nameInput); } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px', bgcolor: '#ffffff', color: '#0f172a',
                '& fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#2563eb' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1, justifyContent: 'space-between' }}>
          <Button variant="text" color="inherit" onClick={() => handleNameSave('')}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            {language === 'si' ? 'මඟහරින්න (Skip)' : language === 'ta' ? 'தவிர்க்கவும்' : 'Skip'}
          </Button>
          <Button variant="contained" onClick={() => handleNameSave(nameInput)}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700, bgcolor: '#2563eb', px: 3, '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {language === 'si' ? 'සුරකින්න' : language === 'ta' ? 'சேமிக்கவும்' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GnLocationModal;
