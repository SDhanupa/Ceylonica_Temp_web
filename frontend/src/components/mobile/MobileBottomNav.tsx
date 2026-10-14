import React from 'react';
import { Box, Typography } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PollRoundedIcon from '@mui/icons-material/PollRounded';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  isDarkMode?: boolean;
  onHome: () => void;
  onCategories: () => void;
  onLocation: () => void;
  onSurvey: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isDarkMode = false, onHome, onCategories, onLocation, onSurvey,
}) => {
  const { language } = useLanguage();
  const L = (en: string, si: string, ta: string) => (language === 'si' ? si : language === 'ta' ? ta : en);

  const items = [
    { key: 'home', icon: <HomeRoundedIcon />, label: L('Home', 'මුල් පිටුව', 'முகப்பு'), onClick: onHome },
    { key: 'categories', icon: <GridViewRoundedIcon />, label: L('Categories', 'ප්‍රවර්ග', 'வகைகள்'), onClick: onCategories },
    { key: 'location', icon: <PlaceRoundedIcon />, label: L('Location', 'ස්ථානය', 'இடம்'), onClick: onLocation },
    { key: 'survey', icon: <PollRoundedIcon />, label: L('Survey', 'සමීක්ෂණය', 'ஆய்வு'), onClick: onSurvey },
  ];

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1200,
        px: 1.5,
        pt: 0.5,
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        bgcolor: isDarkMode ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(22px)',
        borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.07)',
        boxShadow: '0 -8px 30px rgba(15,23,42,0.12)',
      }}
    >
      {items.map((item) => (
        <Box
          key={item.key}
          role="button"
          tabIndex={0}
          onClick={item.onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') item.onClick(); }}
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 52,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.2,
            cursor: 'pointer',
            color: isDarkMode ? '#cbd5e1' : '#475569',
            borderRadius: '14px',
            transition: 'color 0.2s ease, background 0.2s ease',
            '& .MuiSvgIcon-root': { fontSize: '1.5rem' },
            '&:active': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.06)' },
          }}
        >
          {item.icon}
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1, letterSpacing: '0.1px' }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default MobileBottomNav;
