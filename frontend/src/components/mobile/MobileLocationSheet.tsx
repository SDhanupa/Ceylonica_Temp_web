import React from 'react';
import {
  SwipeableDrawer,
  Box,
  Typography,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlaceIcon from '@mui/icons-material/Place';
import { useLanguage } from '../../context/LanguageContext';
import { cleanMojibake } from '../../utils/mojibake';

interface MobileLocationSheetProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
  districts: any[];
  selectedDistrict: string;
  onDistrictChange: (d: string) => void;
  dsDivisions: any[];
  selectedCity: string;
  onCityChange: (c: string) => void;
  gramaNiladharis: any[];
  selectedGN: string;
  onGNChange: (g: string) => void;
}

const MobileLocationSheet: React.FC<MobileLocationSheetProps> = ({
  open, onOpen, onClose, isDarkMode = false,
  districts, selectedDistrict, onDistrictChange,
  dsDivisions, selectedCity, onCityChange,
  gramaNiladharis, selectedGN, onGNChange,
}) => {
  const { language } = useLanguage();
  const L = (en: string, si: string, ta: string) => (language === 'si' ? si : language === 'ta' ? ta : en);

  const surface = isDarkMode ? '#0f172a' : '#ffffff';
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const fieldBg = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc';

  const selectSx = {
    borderRadius: '14px',
    bgcolor: fieldBg,
    color: textMain,
    fontWeight: 600,
    fontSize: '0.95rem',
    '& .MuiSvgIcon-root': { color: textMuted },
    '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)' },
    '&:hover fieldset': { borderColor: '#3b82f6' },
  };

  const labelSx = { color: textMuted, fontWeight: 600 };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          bgcolor: surface,
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          maxHeight: '85vh',
        },
      }}
    >
      {/* Grab handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 5, borderRadius: 3, bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)' }} />
      </Box>

      <Box sx={{ px: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            }}>
              <PlaceIcon fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: textMain, lineHeight: 1.1 }}>
                {L('Choose Location', 'ස්ථානය තෝරන්න', 'இடத்தைத் தேர்வுசெய்க')}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: textMuted, fontWeight: 600 }}>
                {L('District, DS division and village', 'දිස්ත්‍රික්කය, ප්‍රාදේශීය ලේකම් සහ ගම', 'மாவட்டம், பிரதேசம் மற்றும் கிராமம்')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" sx={{ width: 44, height: 44, color: textMuted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1 }}>
          {/* District */}
          <FormControl fullWidth size="medium">
            <InputLabel sx={labelSx}>{L('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்')}</InputLabel>
            <Select
              label={L('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்')}
              value={selectedDistrict || ''}
              onChange={(e) => onDistrictChange(e.target.value)}
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: { maxHeight: 320, bgcolor: surface, color: textMain } } }}
            >
              {districts.map((d: any) => {
                const name = cleanMojibake(language === 'si' ? (d.admin2NameSi || d.nameSi || d.nameEn) : language === 'ta' ? (d.admin2NameTa || d.nameTa || d.nameEn) : (d.admin2NameEn || d.nameEn));
                return <MenuItem key={d.id || d.admin2Pcode} value={d.id || d.admin2Pcode}>{name}</MenuItem>;
              })}
            </Select>
          </FormControl>

          {/* DS Division */}
          <FormControl fullWidth size="medium" disabled={!selectedDistrict || dsDivisions.length === 0}>
            <InputLabel sx={labelSx}>{L('DS Division', 'ප්‍රාදේශීය ලේකම්', 'பிரதேச செயலகம்')}</InputLabel>
            <Select
              label={L('DS Division', 'ප්‍රාදේශීය ලේකම්', 'பிரதேச செயலகம்')}
              value={selectedCity || ''}
              onChange={(e) => onCityChange(e.target.value)}
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: { maxHeight: 320, bgcolor: surface, color: textMain } } }}
            >
              {dsDivisions.map((city: any) => {
                const name = cleanMojibake(language === 'si' ? (city.dsSi || city.dsEn) : language === 'ta' ? (city.dsTa || city.dsEn) : (city.dsEn || city.divisionalSecretariatCode));
                return <MenuItem key={city.divisionalSecretariatCode || city.dsCode} value={city.divisionalSecretariatCode || city.dsCode}>{name}</MenuItem>;
              })}
            </Select>
          </FormControl>

          {/* GN Division */}
          <FormControl fullWidth size="medium" disabled={!selectedCity || gramaNiladharis.length === 0}>
            <InputLabel sx={labelSx}>{L('Village (GN)', 'ග්‍රාම නිලධාරී', 'கிராமம்')}</InputLabel>
            <Select
              label={L('Village (GN)', 'ග්‍රාම නිලධාරී', 'கிராமம்')}
              value={selectedGN || ''}
              onChange={(e) => onGNChange(e.target.value)}
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: { maxHeight: 320, bgcolor: surface, color: textMain } } }}
            >
              {gramaNiladharis.map((gn: any) => {
                const name = cleanMojibake(language === 'si' ? (gn.nameSi || gn.nameEn) : language === 'ta' ? (gn.nameTa || gn.nameEn) : gn.nameEn);
                return <MenuItem key={gn.id || gn.CCODE || gn.ccode} value={String(gn.id) || gn.CCODE || gn.ccode}>{name}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default MobileLocationSheet;
