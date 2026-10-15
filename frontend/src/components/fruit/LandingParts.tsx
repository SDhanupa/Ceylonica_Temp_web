import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import FactoryRoundedIcon from '@mui/icons-material/FactoryRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import IcecreamRoundedIcon from '@mui/icons-material/IcecreamRounded';
import { C, displayFont, focusRing } from './tokens';
import { FruitIcon } from './FruitIcons';
import { BusinessType, Lang, SectionId, pick } from './fruitBusinessTypes';

const LANGS: { id: Lang; short: string; label: string }[] = [
  { id: 'si', short: 'සිං', label: 'සිංහල' },
  { id: 'ta', short: 'த', label: 'தமிழ்' },
  { id: 'en', short: 'EN', label: 'English' },
];

export const LanguageSwitch: React.FC<{ value: Lang; onChange: (l: Lang) => void; tone?: 'light' | 'dark' }> = ({
  value, onChange, tone = 'light',
}) => (
  <Box
    role="radiogroup"
    aria-label="Language / භාෂාව / மொழி"
    sx={{
      display: 'inline-flex',
      p: 0.4,
      gap: 0.25,
      borderRadius: '999px',
      bgcolor: tone === 'light' ? C.sprout : 'rgba(255,255,255,0.12)',
    }}
  >
    {LANGS.map((l) => {
      const active = l.id === value;
      return (
        <ButtonBase
          key={l.id}
          role="radio"
          aria-checked={active}
          aria-label={l.label}
          onClick={() => onChange(l.id)}
          sx={{
            minWidth: 44,
            height: 36,
            px: 1.2,
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.9rem',
            fontFamily: displayFont(l.id),
            color: active ? C.onDark : tone === 'light' ? C.leaf : C.onDark,
            bgcolor: active ? C.field : 'transparent',
            transition: 'background-color 160ms ease, color 160ms ease',
            '&:hover': { bgcolor: active ? C.fieldHover : tone === 'light' ? C.sproutLine : 'rgba(255,255,255,0.18)' },
            ...focusRing,
          }}
        >
          {l.short}
        </ButtonBase>
      );
    })}
  </Box>
);

/** MUI Dialog props that turn it into a bottom sheet on phones and a centred card elsewhere. */
export const sheetDialogProps = {
  sx: { '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } } },
  PaperProps: {
    sx: {
      m: { xs: 0, sm: 4 },
      width: { xs: '100%', sm: 'calc(100% - 64px)' },
      maxWidth: { xs: '100%', sm: 480 },
      maxHeight: { xs: '92dvh', sm: 'calc(100% - 64px)' },
      borderRadius: { xs: '24px 24px 0 0', sm: '24px' },
      bgcolor: C.card,
      color: C.ink,
      pb: { xs: 'env(safe-area-inset-bottom)', sm: 0 },
    },
  },
  slotProps: { backdrop: { sx: { bgcolor: 'rgba(15,61,34,0.55)', backdropFilter: 'blur(4px)' } } },
} as const;

const SECTION_ICON: Record<SectionId, React.ElementType> = {
  cultivation: AgricultureRoundedIcon,
  postharvest: Inventory2RoundedIcon,
  processing: FactoryRoundedIcon,
  trade: StorefrontRoundedIcon,
  services: IcecreamRoundedIcon,
};

/** The fruit drawing when there is one, otherwise the section's emblem. */
export const TypeGlyph: React.FC<{ type: BusinessType; size?: number }> = ({ type, size = 40 }) => {
  if (type.fruit) return <FruitIcon kind={type.fruit} size={size} />;
  const Icon = SECTION_ICON[type.section];
  return (
    <Box
      aria-hidden
      sx={{
        width: size, height: size, borderRadius: '30%', flexShrink: 0,
        display: 'grid', placeItems: 'center', bgcolor: C.sprout, color: C.field,
      }}
    >
      <Icon sx={{ fontSize: size * 0.58 }} />
    </Box>
  );
};

export const SectionEmblem = SECTION_ICON;

export const CodeChip: React.FC<{ code: string; tone?: 'green' | 'mango' }> = ({ code, tone = 'green' }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 52,
      px: 1,
      height: 26,
      borderRadius: '8px',
      flexShrink: 0,
      fontFamily: "'Gemunu Libre', 'DM Sans', sans-serif",
      fontWeight: 700,
      fontSize: '0.98rem',
      letterSpacing: '0.02em',
      fontVariantNumeric: 'tabular-nums',
      bgcolor: tone === 'green' ? C.sprout : '#FFF1C7',
      color: tone === 'green' ? C.leaf : '#7A4A00',
    }}
  >
    {code}
  </Box>
);

export const TypeRow: React.FC<{
  type: BusinessType;
  lang: Lang;
  codeLabel: string;
  onSelect: (t: BusinessType) => void;
  showGlyph?: boolean;
}> = ({ type, lang, codeLabel, onSelect, showGlyph = false }) => {
  const name = pick(type.name, lang);
  return (
    <ButtonBase
      onClick={() => onSelect(type)}
      aria-label={`${name}, ${codeLabel} ${type.code}`}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        minHeight: 56,
        px: 1.5,
        py: 1,
        borderRadius: '14px',
        textAlign: 'left',
        transition: 'background-color 160ms ease',
        '&:hover': { bgcolor: '#F0F8EC' },
        '&:hover .row-chevron': { transform: 'translateX(2px)', color: C.field },
        ...focusRing,
      }}
    >
      {showGlyph && <TypeGlyph type={type} size={36} />}
      <CodeChip code={type.code} />
      <Typography component="span" sx={{ flex: 1, minWidth: 0, fontSize: '0.98rem', lineHeight: 1.55, color: C.ink, fontWeight: 500 }}>
        {name}
      </Typography>
      <ChevronRightRoundedIcon
        className="row-chevron"
        aria-hidden
        sx={{ color: C.inkMuted, fontSize: '1.35rem', transition: 'transform 160ms ease, color 160ms ease' }}
      />
    </ButtonBase>
  );
};

export const FruitTile: React.FC<{
  type: BusinessType;
  lang: Lang;
  codeLabel: string;
  onSelect: (t: BusinessType) => void;
  index: number;
}> = ({ type, lang, codeLabel, onSelect, index }) => {
  const name = pick(type.name, lang);
  return (
    <ButtonBase
      onClick={() => onSelect(type)}
      aria-label={`${name}, ${codeLabel} ${type.code}`}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0.75,
        p: { xs: 1.25, sm: 1.5 },
        pt: { xs: 1.5, sm: 2 },
        minHeight: { xs: 148, sm: 160 },
        borderRadius: '20px',
        bgcolor: C.card,
        border: `1.5px solid ${C.line}`,
        textAlign: 'center',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
        '& .tile-fruit': { transition: 'transform 220ms cubic-bezier(.34,1.56,.64,1)' },
        '&:hover': { borderColor: C.field, boxShadow: '0 10px 24px -14px rgba(15,61,34,0.45)' },
        '&:hover .tile-fruit': { transform: 'scale(1.08) rotate(-4deg)' },
        '&:active': { transform: 'scale(0.97)' },
        ...focusRing,
        animation: `fadeInUp 360ms ease ${Math.min(index, 12) * 35}ms both`,
      }}
    >
      <Box className="tile-fruit">
        <FruitIcon kind={type.fruit ?? 'basket'} size={60} />
      </Box>
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.9rem', sm: '0.95rem' },
          lineHeight: 1.35,
          color: C.ink,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {name}
      </Typography>
      <Box sx={{ mt: 'auto' }}>
        <CodeChip code={type.code} tone="mango" />
      </Box>
    </ButtonBase>
  );
};
