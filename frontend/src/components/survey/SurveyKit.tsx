import React from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Dialog,
  useMediaQuery,
  useTheme,
  Fade,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

/* ──────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — harmonised with the app's blue brand + emerald progress
   ────────────────────────────────────────────────────────────────────────── */
export const T = {
  brand: '#2563eb',
  brandDark: '#1d4ed8',
  brandSoft: '#eff6ff',
  brandSofter: 'rgba(37,99,235,0.06)',
  accent: '#059669',
  accentSoft: '#ecfdf5',
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  lineSoft: '#eef2f7',
  surface: '#ffffff',
  canvasTop: '#f4f7fc',
  canvasBottom: '#eef2f9',
  danger: '#dc2626',
  radius: 16,
  field: 12,
};

/* ──────────────────────────────────────────────────────────────────────────
   Error context — lets QuestionField surface validation messages and paint
   descendant controls red, without threading props through every field.
   ────────────────────────────────────────────────────────────────────────── */
export const SurveyErrorContext = React.createContext<{ show: boolean; errors: Record<string, string> }>({ show: false, errors: {} });

/**
 * Fades whichever edge of a horizontal scroller still has content beyond it, so
 * a rail that overflows (step dots, category chips) reads as scrollable instead
 * of looking like a clipped element. Returns a `mask-image` value for the
 * scroller's `sx`; edges with nothing past them are left solid.
 */
export function useEdgeFadeMask(ref: React.RefObject<HTMLElement | null>, fadePx = 20) {
  const [edges, setEdges] = React.useState({ start: false, end: false });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft < max - 2 });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, [ref]);

  if (!edges.start && !edges.end) return undefined;
  return `linear-gradient(to right, ${edges.start ? 'transparent' : '#000'} 0px, #000 ${fadePx}px, #000 calc(100% - ${fadePx}px), ${edges.end ? 'transparent' : '#000'} 100%)`;
}

/* Shared field styling for outlined inputs/selects */
const fieldSx = {
  bgcolor: '#fff',
  borderRadius: `${T.field}px`,
  '& .MuiOutlinedInput-root': {
    borderRadius: `${T.field}px`,
    transition: 'box-shadow .18s ease, border-color .18s ease',
    '& fieldset': { borderColor: T.line },
    '&:hover fieldset': { borderColor: '#c7d2e2' },
    '&.Mui-focused fieldset': { borderColor: T.brand, borderWidth: '1.5px' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(37,99,235,0.10)' },
  },
  '& .MuiInputBase-input': { color: T.ink, fontWeight: 500 },
};

/* ──────────────────────────────────────────────────────────────────────────
   QuestionField — label + optional hint + control, with a number chip
   ────────────────────────────────────────────────────────────────────────── */
export const QuestionField: React.FC<{
  index?: string | number;
  id?: string;
  required?: boolean;
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}> = ({ index, id, required, label, hint, children }) => {
  const { show, errors } = React.useContext(SurveyErrorContext);
  const message = id && show ? errors[id] : undefined;
  return (
    <Box
      id={id}
      data-invalid={message ? 'true' : undefined}
      sx={{
        display: 'flex',
        gap: { xs: 1.25, sm: 1.75 },
        alignItems: 'flex-start',
        animation: 'sk-rise .35s ease both',
        scrollMarginTop: 96,
      }}
    >
      {index !== undefined && (
        <Box
          sx={{
            flexShrink: 0,
            mt: 0.25,
            width: 26,
            height: 26,
            borderRadius: '8px',
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: message ? '#fee2e2' : T.brandSoft,
            color: message ? T.danger : T.brand,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.02em',
            transition: 'background-color .18s ease, color .18s ease',
          }}
        >
          {index}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="label"
          sx={{
            display: 'block',
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
            fontWeight: 700,
            color: T.ink,
            lineHeight: 1.4,
            mb: hint ? 0.25 : 1,
          }}
        >
          {label}
          {required && <Box component="span" sx={{ color: T.danger, ml: 0.4 }}>*</Box>}
        </Typography>
        {hint && (
          <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 1, lineHeight: 1.45 }}>
            {hint}
          </Typography>
        )}
        {children}
        {message && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
            <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: T.danger, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.danger, lineHeight: 1.4 }}>{message}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   SText — text / number / multiline input
   ────────────────────────────────────────────────────────────────────────── */
export const SText: React.FC<{
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  inputMode?: any;
}> = ({ value, onChange, type = 'text', multiline, rows, placeholder, disabled, startAdornment, endAdornment, inputMode }) => (
  <TextField
    fullWidth
    size="medium"
    type={type}
    multiline={multiline}
    rows={rows}
    placeholder={placeholder}
    disabled={disabled}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{
      ...fieldSx,
      ...(disabled && { '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc' } }),
    }}
    InputProps={{
      inputProps: { inputMode },
      startAdornment: startAdornment ? (
        <Typography sx={{ mr: 1, color: T.faint, fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{startAdornment}</Typography>
      ) : undefined,
      endAdornment: endAdornment ? (
        <Typography sx={{ ml: 1, color: T.faint, fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{endAdornment}</Typography>
      ) : undefined,
    }}
  />
);

export type Opt = { value: string; label: React.ReactNode };
type OptInput = Opt[] | string[];
const normalize = (options: OptInput): Opt[] =>
  (options as any[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

/* ──────────────────────────────────────────────────────────────────────────
   SDropdown — styled single-select for longer option lists
   ────────────────────────────────────────────────────────────────────────── */
export const SDropdown: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: OptInput;
  placeholder?: string;
}> = ({ value, onChange, options, placeholder }) => {
  const opts = normalize(options);
  return (
    <FormControl fullWidth>
      <Select
        value={value || ''}
        displayEmpty
        onChange={(e) => onChange(e.target.value as string)}
        IconComponent={KeyboardArrowDownRoundedIcon}
        renderValue={(v) => {
          if (!v) return <Box component="span" sx={{ color: T.faint, fontWeight: 500 }}>{placeholder || '—'}</Box>;
          const found = opts.find((o) => o.value === v);
          return found ? found.label : (v as string);
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 1,
              borderRadius: `${T.field}px`,
              boxShadow: '0 12px 40px rgba(15,23,42,0.14)',
              border: `1px solid ${T.lineSoft}`,
              maxHeight: 360,
              '& .MuiMenuItem-root': {
                borderRadius: '9px',
                mx: 0.75,
                my: 0.25,
                fontSize: '0.9rem',
                fontWeight: 500,
                color: T.body,
                '&.Mui-selected': { bgcolor: T.brandSoft, color: T.brandDark, fontWeight: 700 },
                '&.Mui-selected:hover': { bgcolor: T.brandSoft },
              },
            },
          },
        }}
        sx={{
          ...fieldSx,
          '& .MuiSelect-select': { py: 1.6, color: T.ink, fontWeight: 600 },
          '& .MuiSvgIcon-root': { color: T.muted },
        }}
      >
        {opts.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Segmented — pill toggle group for binary / short single-select
   ────────────────────────────────────────────────────────────────────────── */
export const Segmented: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  columns?: number;
}> = ({ value, onChange, options, columns }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: columns
        ? `repeat(${columns}, 1fr)`
        : { xs: `repeat(${Math.min(options.length, 2)}, 1fr)`, sm: `repeat(${options.length}, 1fr)` },
      gap: 1,
    }}
  >
    {options.map((o) => {
      const active = value === o.value;
      return (
        <Box
          key={o.value}
          className="sk-choice"
          role="button"
          tabIndex={0}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(o.value); } }}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            textAlign: 'center',
            minHeight: 46,
            px: 1.5,
            py: 1,
            borderRadius: `${T.field}px`,
            fontSize: '0.88rem',
            fontWeight: 700,
            lineHeight: 1.3,
            color: active ? T.brandDark : T.body,
            bgcolor: active ? T.brandSoft : '#fff',
            border: `1.5px solid ${active ? T.brand : T.line}`,
            boxShadow: active ? '0 0 0 4px rgba(37,99,235,0.08)' : 'none',
            transition: 'all .18s ease',
            '&:hover': { borderColor: active ? T.brand : '#c7d2e2', bgcolor: active ? T.brandSoft : '#f8fafc' },
          }}
        >
          {active && <CheckRoundedIcon sx={{ fontSize: '1.05rem' }} />}
          <span>{o.label}</span>
        </Box>
      );
    })}
  </Box>
);

/* ──────────────────────────────────────────────────────────────────────────
   ChipMultiSelect — multi-select rendered as toggleable chips
   value/onChange use the app's ", " joined-string convention
   ────────────────────────────────────────────────────────────────────────── */
export const ChipMultiSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: OptInput;
}> = ({ value, onChange, options }) => {
  const opts = normalize(options);
  const selected = value ? value.split(', ') : [];
  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v];
    onChange(next.join(', '));
  };
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {opts.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Box
            key={o.value}
            className="sk-choice"
            role="button"
            tabIndex={0}
            onClick={() => toggle(o.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(o.value); } }}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.5,
              py: 0.9,
              borderRadius: '999px',
              fontSize: '0.84rem',
              fontWeight: 700,
              lineHeight: 1.2,
              color: active ? '#fff' : T.body,
              bgcolor: active ? T.brand : '#fff',
              border: `1.5px solid ${active ? T.brand : T.line}`,
              boxShadow: active ? '0 4px 12px rgba(37,99,235,0.22)' : 'none',
              transition: 'all .16s ease',
              '&:hover': { borderColor: active ? T.brandDark : '#c7d2e2', bgcolor: active ? T.brandDark : '#f8fafc' },
            }}
          >
            {active && <CheckRoundedIcon sx={{ fontSize: '1rem' }} />}
            <span>{o.label}</span>
          </Box>
        );
      })}
    </Box>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   RatingScale — 1..max selectable pills (barrier / likert questions)
   ────────────────────────────────────────────────────────────────────────── */
export const RatingScale: React.FC<{
  value: string;
  onChange: (v: string) => void;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}> = ({ value, onChange, max = 5, lowLabel, highLabel }) => (
  <Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${max}, 1fr)`, gap: { xs: 0.75, sm: 1 } }}>
      {Array.from({ length: max }, (_, i) => String(i + 1)).map((n) => {
        const active = value === n;
        const ratio = (Number(n) - 1) / (max - 1);
        const activeColor = `rgb(${Math.round(5 + ratio * 215)},${Math.round(150 - ratio * 112)},${Math.round(105 - ratio * 67)})`;
        return (
          <Box
            key={n}
            className="sk-choice"
            role="button"
            tabIndex={0}
            onClick={() => onChange(n)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(n); } }}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              borderRadius: `${T.field}px`,
              fontSize: '1.05rem',
              fontWeight: 800,
              color: active ? '#fff' : T.muted,
              bgcolor: active ? activeColor : '#fff',
              border: `1.5px solid ${active ? activeColor : T.line}`,
              boxShadow: active ? '0 4px 14px rgba(15,23,42,0.16)' : 'none',
              transition: 'all .16s ease',
              '&:hover': { borderColor: active ? activeColor : '#c7d2e2', bgcolor: active ? activeColor : '#f8fafc' },
            }}
          >
            {n}
          </Box>
        );
      })}
    </Box>
    {(lowLabel || highLabel) && (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
        <Typography sx={{ fontSize: '0.72rem', color: T.faint, fontWeight: 600 }}>{lowLabel}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: T.faint, fontWeight: 600 }}>{highLabel}</Typography>
      </Box>
    )}
  </Box>
);

/* ──────────────────────────────────────────────────────────────────────────
   UploadField — image/file picker styled as a dropzone
   ────────────────────────────────────────────────────────────────────────── */
export const UploadField: React.FC<{
  value: string;
  onFiles: (fileList: FileList) => void;
  label?: string;
  accept?: string;
  multiple?: boolean;
}> = ({ value, onFiles, label = 'Upload', accept = 'image/*', multiple = true }) => (
  <Box>
    <Box
      component="label"
      sx={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2,
        py: 1.5,
        borderRadius: `${T.field}px`,
        border: `1.5px dashed ${value ? T.accent : T.line}`,
        bgcolor: value ? T.accentSoft : '#fbfdff',
        transition: 'all .18s ease',
        '&:hover': { borderColor: value ? T.accent : T.brand, bgcolor: value ? T.accentSoft : T.brandSoft },
      }}
    >
      <CloudUploadOutlinedIcon sx={{ color: value ? T.accent : T.brand, fontSize: '1.4rem' }} />
      <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: value ? '#047857' : T.brandDark }}>{label}</Typography>
      <input type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { if (e.target.files) onFiles(e.target.files); }} />
    </Box>
    {value && (
      <Typography sx={{ mt: 0.75, fontSize: '0.78rem', color: T.muted, lineHeight: 1.4, wordBreak: 'break-word' }}>{value}</Typography>
    )}
  </Box>
);

/* ──────────────────────────────────────────────────────────────────────────
   SurveyDialog — modern rounded dialog shell with icon header
   ────────────────────────────────────────────────────────────────────────── */
export const SurveyDialog: React.FC<{
  open: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  tone?: 'brand' | 'accent' | 'danger';
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md';
}> = ({ open, onClose, icon, tone = 'brand', title, children, actions, maxWidth = 'xs' }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const toneColor = tone === 'accent' ? T.accent : tone === 'danger' ? T.danger : T.brand;
  const toneSoft = tone === 'accent' ? T.accentSoft : tone === 'danger' ? '#fef2f2' : T.brandSoft;
  return (
    <Dialog
      open={open}
      onClose={onClose || (() => {})}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={Fade as any}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : '22px',
          overflow: 'hidden',
          m: fullScreen ? 0 : 2,
          boxShadow: '0 24px 70px rgba(15,23,42,0.28)',
          ...(fullScreen && { display: 'flex', justifyContent: 'center' }),
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3.25 }, ...(fullScreen && { maxWidth: 480, width: '100%', mx: 'auto', my: 'auto' }) }}>
        {icon && (
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: toneSoft,
              color: toneColor,
              mb: 1.75,
              '& .MuiSvgIcon-root': { fontSize: '1.7rem' },
            }}
          >
            {icon}
          </Box>
        )}
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: T.ink, mb: 1, lineHeight: 1.3 }}>{title}</Typography>
        <Box sx={{ color: T.body, fontSize: '0.92rem', lineHeight: 1.55 }}>{children}</Box>
        {actions && <Box sx={{ display: 'flex', gap: 1.25, mt: 2.75, flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
    </Dialog>
  );
};

/* Info row used inside metadata / confirmation dialogs */
export const InfoRow: React.FC<{ icon?: React.ReactNode; label: React.ReactNode; value: React.ReactNode }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 0.9 }}>
    {icon && (
      <Box sx={{ mt: 0.2, color: T.brand, '& .MuiSvgIcon-root': { fontSize: '1.15rem' } }}>{icon}</Box>
    )}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: T.ink, wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  </Box>
);

/* Keyframes injected once for subtle entrance motion (respects reduced-motion) */
export const SurveyKeyframes = () => (
  <style>{`
    @keyframes sk-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes sk-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sk-shake { 10%,90%{transform:translateX(-1px)} 30%,70%{transform:translateX(2px)} 50%{transform:translateX(-2px)} }
    [data-invalid="true"] .MuiOutlinedInput-notchedOutline { border-color:#dc2626 !important; }
    [data-invalid="true"] .sk-choice { border-color:#fca5a5 !important; }
    [data-invalid="true"] { animation: sk-shake .3s ease both; }
    @media (prefers-reduced-motion: reduce) {
      *[style*="sk-rise"], .sk-anim, [data-invalid="true"] { animation: none !important; }
    }
  `}</style>
);
