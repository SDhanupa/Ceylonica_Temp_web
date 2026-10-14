import { createTheme } from '@mui/material/styles';

// A shared, calm visual system for public and management screens.
const colors = {
  primary: '#1677c8',
  secondary: '#5f6f81',
  success: '#168a6b',
  info: '#1677c8',
  warning: '#b87908',
  danger: '#d64b4b',
  background: '#f7fafc',
  surface: '#ffffff',
  text: '#172b3a',
  textMuted: '#627486',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
    success: {
      main: colors.success,
    },
    info: {
      main: colors.info,
    },
    warning: {
      main: colors.warning,
    },
    error: {
      main: colors.danger,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.text,
      secondary: colors.textMuted,
    },
  },
  typography: {
    fontFamily: "'DM Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', sans-serif",
    h1: { fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', color: colors.text },
    h2: { fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.035em', color: colors.text },
    h3: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: colors.text },
    h4: { fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: colors.text },
    h5: { fontSize: '1rem', fontWeight: 700, color: colors.text },
    h6: { fontSize: '0.875rem', fontWeight: 700, color: colors.text },
    body1: { fontSize: '0.9375rem', fontWeight: 400, color: colors.text },
    body2: { fontSize: '0.875rem', fontWeight: 400, color: colors.text },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        body: {
          backgroundColor: colors.background,
          color: colors.text,
          minHeight: '100vh',
          fontFamily: "'DM Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', sans-serif",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '9px 18px',
          boxShadow: '0 2px 5px rgba(23, 43, 58, 0.08)',
          fontWeight: 700,
          transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
          '&:hover': {
            boxShadow: '0 8px 18px rgba(23, 43, 58, 0.14)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(23, 43, 58, 0.06)',
          border: '1px solid rgba(23, 43, 58, 0.08)',
          backgroundImage: 'none',
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 18px rgba(23, 43, 58, 0.09)',
          backgroundColor: colors.primary,
          color: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          color: colors.text,
          borderRight: '1px solid rgba(120, 130, 140, 0.13)',
          boxShadow: '4px 0 24px rgba(23, 43, 58, 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '10px 12px',
          color: colors.text,
          '&.Mui-selected': {
            backgroundColor: 'rgba(22, 119, 200, 0.10)',
            color: colors.primary,
            '&:hover': {
              backgroundColor: 'rgba(22, 119, 200, 0.14)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(23, 43, 58, 0.04)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: '35px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e9ecef',
          padding: '1rem',
          color: colors.text,
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
          color: '#4f5467',
        },
      },
    },
  },
});

export default theme;
