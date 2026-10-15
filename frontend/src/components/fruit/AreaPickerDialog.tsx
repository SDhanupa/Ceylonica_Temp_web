import React, { useEffect, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  Box, Button, ButtonBase, CircularProgress, Dialog, DialogActions, DialogContent, InputAdornment, TextField, Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { GET_GN_LABEL_BY_COORDINATES } from '../../graphql/queries';
import { cleanMojibake } from '../../utils/mojibake';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { sheetDialogProps } from './LandingParts';
import type { Lang } from './fruitBusinessTypes';
import type { LandingCopy } from './landingCopy';

export interface AreaOption {
  ccode: string;
  nameEn: string;
  nameSi?: string;
  nameTa?: string;
  dsEn?: string;
  dsSi?: string;
  dsTa?: string;
  disEn?: string;
  disSi?: string;
  disTa?: string;
}

const MIN_CHARS = 2;

const local = (o: AreaOption, field: 'name' | 'ds' | 'dis', lang: Lang): string => {
  const suffix = lang === 'si' ? 'Si' : lang === 'ta' ? 'Ta' : 'En';
  const value = (o as any)[`${field}${suffix}`] || (o as any)[`${field}En`] || '';
  return cleanMojibake(value);
};

export const areaLines = (o: AreaOption, lang: Lang) => ({
  name: local(o, 'name', lang),
  place: [local(o, 'ds', lang), local(o, 'dis', lang)].filter(Boolean).join(', '),
});

const toOption = (raw: any): AreaOption | null => {
  const ccode = raw?.ccode || raw?.CCODE || raw?.code;
  if (!ccode || !raw?.nameEn) return null;
  return { ...raw, ccode };
};

interface Props {
  open: boolean;
  lang: Lang;
  copy: LandingCopy;
  onClose: () => void;
  onSelect: (area: AreaOption) => void;
}

const AreaPickerDialog: React.FC<Props> = ({ open, lang, copy, onClose, onSelect }) => {
  const t = copy.area;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AreaOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [gpsState, setGpsState] = useState<'idle' | 'locating' | 'failed' | 'notFound'>('idle');
  const [lookupGn] = useLazyQuery(GET_GN_LABEL_BY_COORDINATES, { fetchPolicy: 'network-only' });
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setSearched(false);
    setGpsState('idle');
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setSearching(false);
      setSearched(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search-gns?${new URLSearchParams({ q })}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        const rows: AreaOption[] = (json?.success ? json.data : []).map(toOption).filter(Boolean);
        setResults(rows);
        setSearched(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGpsState('failed');
      return;
    }
    setGpsState('locating');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await lookupGn({ variables: { lat: coords.latitude, lng: coords.longitude } });
          if (!openRef.current) return;
          const option = toOption(data?.gnByCoordinates);
          if (option) onSelect(option);
          else setGpsState('notFound');
        } catch {
          if (openRef.current) setGpsState('failed');
        }
      },
      () => setGpsState('failed'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const trimmed = query.trim();
  const hint =
    trimmed.length > 0 && trimmed.length < MIN_CHARS ? t.minChars
      : searched && !searching && results.length === 0 ? t.noResults
        : null;

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="area-picker-title" {...sheetDialogProps}>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: 3, pb: 1 }}>
        <Typography
          id="area-picker-title"
          component="h2"
          sx={{ fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, fontSize: '1.6rem', color: C.leaf }}
        >
          {t.title}
        </Typography>
        <Typography sx={{ mt: 0.5, color: C.inkMuted, lineHeight: 1.6 }}>{t.lead}</Typography>

        <Button
          onClick={locateMe}
          disabled={gpsState === 'locating'}
          startIcon={gpsState === 'locating' ? <CircularProgress size={18} sx={{ color: C.field }} /> : <MyLocationRoundedIcon />}
          sx={{
            mt: 2, width: '100%', minHeight: 48, borderRadius: '14px', textTransform: 'none', fontWeight: 700, fontSize: '0.98rem',
            color: C.leaf, bgcolor: C.sprout, boxShadow: 'none',
            '&:hover': { bgcolor: C.sproutLine, boxShadow: 'none', transform: 'none' },
            ...focusRing,
          }}
        >
          {gpsState === 'locating' ? t.locating : t.useGps}
        </Button>
        {(gpsState === 'failed' || gpsState === 'notFound') && (
          <Typography role="status" sx={{ mt: 1, fontSize: '0.9rem', color: '#9A3412' }}>
            {gpsState === 'failed' ? t.gpsFailed : t.gpsNotFound}
          </Typography>
        )}

        <TextField
          fullWidth
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          inputProps={{ 'aria-describedby': 'area-search-hint', autoComplete: 'off' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: C.inkMuted }} />
              </InputAdornment>
            ),
            endAdornment: searching ? <CircularProgress size={18} sx={{ color: C.field }} /> : undefined,
          }}
          sx={{
            mt: 2.5,
            '& .MuiOutlinedInput-root': { borderRadius: '14px', '&.Mui-focused fieldset': { borderColor: C.field } },
            '& label.Mui-focused': { color: C.field },
          }}
        />
        <Typography id="area-search-hint" role="status" sx={{ minHeight: 24, mt: 0.75, fontSize: '0.88rem', color: C.inkMuted }}>
          {hint}
        </Typography>

        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {results.map((o) => {
            const { name, place } = areaLines(o, lang);
            return (
              <li key={o.ccode}>
                <ButtonBase
                  onClick={() => onSelect(o)}
                  sx={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1.25,
                    textAlign: 'left', px: 1.25, py: 1.1, minHeight: 56, borderRadius: '12px',
                    '&:hover': { bgcolor: '#F0F8EC' },
                    ...focusRing,
                  }}
                >
                  <PlaceRoundedIcon aria-hidden sx={{ color: C.field, mt: 0.2 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
                      {name} <Box component="span" sx={{ color: C.inkMuted, fontWeight: 600 }}>({o.ccode})</Box>
                    </Typography>
                    {place && <Typography sx={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.45 }}>{place}</Typography>}
                  </Box>
                </ButtonBase>
              </li>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{ minHeight: 44, px: 2.5, borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: C.leaf, ...focusRing }}
        >
          {t.cancel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AreaPickerDialog;
