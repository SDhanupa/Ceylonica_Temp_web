import type { Lang } from './fruitBusinessTypes';

// Contrast: mango on leafDeep ≈ 7.6:1, white on field ≈ 5:1, inkMuted on page ≈ 6.6:1.
export const C = {
  leafDeep: '#0F3D22',
  leaf: '#14532D',
  field: '#15803D',
  fieldHover: '#166534',
  sprout: '#E3F4DC',
  sproutLine: '#CFE6C6',
  mango: '#FFC233',
  mangoHover: '#FFB20A',
  papaya: '#EA580C',
  ink: '#10241A',
  inkMuted: '#4A5F52',
  page: '#F5F9F2',
  card: '#FFFFFF',
  line: '#DCE9D6',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.82)',
} as const;

export const displayFont = (lang: Lang): string =>
  lang === 'ta'
    ? "'Catamaran', 'Noto Sans Tamil', sans-serif"
    : "'Gemunu Libre', 'Noto Sans Sinhala', 'DM Sans', sans-serif";

// Sinhala and Tamil stack taller than Latin; tight leading clips their vowel signs.
export const displayLeading = (lang: Lang): number => (lang === 'en' ? 1.05 : 1.25);

export const focusRing = {
  '&:focus-visible': { outline: `3px solid ${C.mango}`, outlineOffset: 2 },
} as const;
