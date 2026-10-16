import React from 'react';
import {
  Box, Button, ButtonProps, CircularProgress, Dialog, IconButton, Skeleton, Slide, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { C } from '../fruit/tokens';

export type DialogTone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<DialogTone, { fg: string; soft: string; ring: string }> = {
  brand: { fg: C.field, soft: '#E6F4DF', ring: 'rgba(21,128,61,0.18)' },
  success: { fg: '#15803D', soft: '#DCFCE7', ring: 'rgba(21,128,61,0.2)' },
  warning: { fg: '#B45309', soft: '#FEF3C7', ring: 'rgba(180,83,9,0.18)' },
  danger: { fg: '#B91C1C', soft: '#FEE2E2', ring: 'rgba(185,28,28,0.16)' },
  info: { fg: '#1D4ED8', soft: '#DBEAFE', ring: 'rgba(29,78,216,0.16)' },
};

const SheetUp = React.forwardRef(function SheetUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface SurveyDialogProps {
  open: boolean;
  /** Omit to make the dialog blocking (no backdrop/Escape close, no close button). */
  onClose?: () => void;
  tone?: DialogTone;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: number;
  /** Stack actions vertically at every width (for 2+ equally important choices). */
  stackActions?: boolean;
}

/**
 * The one dialog surface for the survey: tone-coloured icon badge, title,
 * optional subtitle, body and an action row. Bottom sheet on phones.
 */
const SurveyDialog: React.FC<SurveyDialogProps> = ({
  open, onClose, tone = 'brand', icon, title, subtitle, children, actions, maxWidth = 480, stackActions = false,
}) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const t = TONE[tone];
  const titleId = React.useId();
  const descId = React.useId();

  return (
    <Dialog
      open={open}
      onClose={onClose ? () => onClose() : undefined}
      TransitionComponent={phone ? SheetUp : undefined}
      transitionDuration={{ enter: 220, exit: 160 }}
      aria-labelledby={titleId}
      aria-describedby={subtitle ? descId : undefined}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(8,28,17,0.5)', backdropFilter: 'blur(4px)' } } }}
      sx={{
        '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } },
        '@media (prefers-reduced-motion: reduce)': { '& .MuiDialog-paper, & .MuiBackdrop-root': { transition: 'none !important' } },
      }}
      PaperProps={{
        sx: {
          position: 'relative', overflow: 'hidden',
          width: { xs: '100%', sm: `min(${maxWidth}px, calc(100% - 48px))` },
          maxWidth: 'none',
          m: { xs: 0, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 32px)', sm: 'calc(100dvh - 64px)' },
          borderRadius: { xs: '24px 24px 0 0', sm: '24px' },
          bgcolor: C.card,
          boxShadow: '0 30px 80px -24px rgba(8,28,17,0.45)',
          display: 'flex', flexDirection: 'column',
        },
      }}
    >
      {/* Tone wash behind the header */}
      <Box aria-hidden sx={{ position: 'absolute', inset: '0 0 auto 0', height: 120, background: `linear-gradient(180deg, ${t.soft} 0%, rgba(255,255,255,0) 100%)`, pointerEvents: 'none' }} />
      {/* Grab handle on the phone sheet */}
      <Box aria-hidden sx={{ display: { xs: 'block', sm: 'none' }, position: 'relative', width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(16,36,26,0.18)', mx: 'auto', mt: 1.25 }} />

      {onClose && (
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{ position: 'absolute', top: { xs: 14, sm: 14 }, right: 14, width: 40, height: 40, color: C.inkMuted, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: '#fff', color: C.ink } }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      )}

      <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 3.5 }, pt: { xs: 2.5, sm: 3.5 }, pb: 1, pr: onClose ? 7 : undefined }}>
        <Box
          aria-hidden
          sx={{
            width: 56, height: 56, borderRadius: '18px', display: 'grid', placeItems: 'center',
            bgcolor: '#fff', color: t.fg, boxShadow: `0 0 0 6px ${t.ring}, 0 10px 24px -14px ${t.fg}`,
            '& .MuiSvgIcon-root': { fontSize: '1.75rem' },
            animation: open ? 'sd-pop 360ms cubic-bezier(.2,.9,.3,1.3) both' : undefined,
            '@keyframes sd-pop': { from: { transform: 'scale(0.6)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          {icon}
        </Box>
        <Typography id={titleId} component="h2" sx={{ mt: 2.25, fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.4rem' }, lineHeight: 1.3, color: C.ink, letterSpacing: '-0.01em', textWrap: 'balance' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography id={descId} sx={{ mt: 0.75, fontSize: '0.98rem', lineHeight: 1.6, color: C.inkMuted }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {children && (
        <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 3.5 }, py: 1.5, overflowY: 'auto' }}>
          {children}
        </Box>
      )}

      {actions && (
        <Box
          sx={{
            position: 'relative', display: 'flex', gap: 1.25,
            flexDirection: stackActions ? 'column' : { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'flex-end',
            px: { xs: 2.5, sm: 3.5 }, pt: 1.5,
            pb: { xs: 'calc(20px + env(safe-area-inset-bottom, 0px))', sm: 3 },
            '& > *': { flex: { xs: '1 1 auto', sm: stackActions ? '1 1 auto' : '0 0 auto' } },
          }}
        >
          {actions}
        </Box>
      )}
    </Dialog>
  );
};

/* ── Buttons ─────────────────────────────────────────────────────────────── */

type Kind = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';

const KIND: Record<Kind, object> = {
  primary: { bgcolor: C.field, color: '#fff', '&:hover': { bgcolor: C.fieldHover } },
  danger: { bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#991B1B' } },
  warning: { bgcolor: '#B45309', color: '#fff', '&:hover': { bgcolor: '#92400E' } },
  secondary: { bgcolor: '#fff', color: C.ink, border: `1.5px solid ${C.line}`, '&:hover': { borderColor: C.field, bgcolor: '#F5FAF2' } },
  ghost: { bgcolor: 'transparent', color: C.inkMuted, '&:hover': { bgcolor: 'rgba(16,36,26,0.05)', color: C.ink } },
};

export const DialogButton: React.FC<Omit<ButtonProps, 'variant' | 'color'> & { kind?: Kind; loading?: boolean }> = ({
  kind = 'primary', loading = false, children, disabled, sx, startIcon, ...rest
}) => (
  <Button
    disableElevation
    disabled={disabled || loading}
    startIcon={loading ? undefined : startIcon}
    aria-busy={loading || undefined}
    {...rest}
    sx={{
      minHeight: 48, px: 2.75, borderRadius: '14px', textTransform: 'none', fontWeight: 800, fontSize: '0.98rem',
      transition: 'background-color 160ms ease, border-color 160ms ease, transform 120ms ease',
      '&:active': { transform: 'scale(0.98)' },
      '&:focus-visible': { outline: `3px solid ${C.mango}`, outlineOffset: 2 },
      '&.Mui-disabled': { opacity: 0.55, color: kind === 'secondary' || kind === 'ghost' ? C.inkMuted : '#fff' },
      ...KIND[kind],
      ...(sx as object),
    }}
  >
    {loading ? <CircularProgress size={22} sx={{ color: 'inherit' }} /> : children}
  </Button>
);

/* ── Detail list ─────────────────────────────────────────────────────────── */

export interface DetailRow {
  icon?: React.ReactNode;
  label: React.ReactNode;
  /** `undefined` renders a loading skeleton. */
  value: React.ReactNode | undefined;
}

export const DetailList: React.FC<{ rows: DetailRow[] }> = ({ rows }) => (
  <Box component="dl" sx={{ m: 0, borderRadius: '18px', border: `1px solid ${C.line}`, bgcolor: '#FAFCF8', overflow: 'hidden' }}>
    {rows.map((r, i) => (
      // Each row holds exactly one <dt> and one <dd> (valid dl grouping). The
      // icon lives inside the <dt>, which uses display: contents so the icon,
      // label and value still lay out on one grid.
      <Box
        key={i}
        sx={{
          display: 'grid', gridTemplateColumns: r.icon ? '36px minmax(0, 1fr)' : 'minmax(0, 1fr)', columnGap: 1.5, alignItems: 'center',
          px: 2, py: 1.4, borderTop: i ? `1px solid ${C.line}` : 'none',
        }}
      >
        <Box component="dt" sx={{ display: 'contents' }}>
          {r.icon && (
            <Box aria-hidden sx={{ gridRow: '1 / span 2', width: 36, height: 36, borderRadius: '11px', display: 'grid', placeItems: 'center', bgcolor: '#E6F4DF', color: C.field, '& .MuiSvgIcon-root': { fontSize: '1.15rem' } }}>
              {r.icon}
            </Box>
          )}
          <Typography component="span" sx={{ gridColumn: r.icon ? 2 : 1, fontSize: '0.78rem', fontWeight: 700, color: C.inkMuted, lineHeight: 1.3 }}>{r.label}</Typography>
        </Box>
        <Typography component="dd" sx={{ gridColumn: r.icon ? 2 : 1, m: 0, fontSize: '1rem', fontWeight: 700, color: C.ink, lineHeight: 1.45, wordBreak: 'break-word' }}>
          {r.value === undefined ? <Skeleton width="60%" /> : r.value}
        </Typography>
      </Box>
    ))}
  </Box>
);

/* ── Callout ─────────────────────────────────────────────────────────────── */

export const Callout: React.FC<{ tone?: DialogTone; icon?: React.ReactNode; children: React.ReactNode }> = ({ tone = 'info', icon, children }) => {
  const t = TONE[tone];
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', p: 1.75, borderRadius: '16px', bgcolor: t.soft, color: t.fg, '& .MuiSvgIcon-root': { fontSize: '1.2rem', mt: '1px' } }}>
      {icon}
      <Typography component="div" sx={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'inherit', fontWeight: 600 }}>{children}</Typography>
    </Box>
  );
};

export default SurveyDialog;
