export const ink = {
  900: '#0A0C0F',
  800: '#1A1D23',
  700: '#2D3139',
  600: '#454B55',
  500: '#60676F',
  400: '#878D95',
  300: '#B0B5BB',
  200: '#D5D8DC',
  100: '#ECEEF0',
  50: '#F7F8F9',
} as const;

export const semantic = {
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  success: '#15803D',
  successSoft: '#F0FDF4',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
} as const;

export const inkButton = {
  bgcolor: ink[900],
  color: '#fff',
  boxShadow: 'none',
  '&:hover': { bgcolor: ink[700], boxShadow: 'none', transform: 'none' },
  '&:active': { transform: 'scale(0.98)' },
  '&.Mui-disabled': { bgcolor: ink[200], color: ink[400] },
};

export const ghostButton = {
  bgcolor: 'transparent',
  color: ink[900],
  border: `1px solid ${ink[200]}`,
  boxShadow: 'none',
  '&:hover': { bgcolor: ink[50], border: `1px solid ${ink[300]}`, boxShadow: 'none', transform: 'none' },
  '&.Mui-disabled': { border: `1px solid ${ink[100]}`, color: ink[300] },
};

export const quietButton = {
  boxShadow: 'none',
  color: ink[500],
  '&:hover': { boxShadow: 'none', transform: 'none', bgcolor: ink[50] },
};

export const focusRing = {
  '&:focus-visible': { outline: `2px solid ${ink[900]}`, outlineOffset: 2 },
};

/** Pill-style segmented control for MUI ToggleButtonGroup. */
export const segmented = {
  p: 0.5,
  gap: 0.5,
  bgcolor: ink[100],
  borderRadius: 999,
  '& .MuiToggleButtonGroup-grouped': {
    border: 0,
    borderRadius: '999px !important',
    px: 1.75,
    py: 0.6,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.82rem',
    color: ink[500],
    transition: 'background-color 250ms ease, color 250ms ease, box-shadow 250ms ease',
    '&:hover': { bgcolor: 'rgba(255,255,255,.6)', color: ink[800] },
    '&.Mui-selected, &.Mui-selected:hover': { bgcolor: '#fff', color: ink[900], boxShadow: '0 1px 2px rgba(10,12,15,.08), 0 2px 8px rgba(10,12,15,.06)' },
    '&.Mui-disabled': { border: 0, color: ink[300] },
  },
};

export const reducedMotion = {
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none !important',
    animation: 'none !important',
    '&:hover': { transform: 'none' },
  },
};
