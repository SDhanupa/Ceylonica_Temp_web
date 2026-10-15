import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogContent, TextField, Typography } from '@mui/material';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { getUserName } from '../../utils/cookieUtils';
import { C, displayFont, displayLeading, focusRing } from './tokens';
import { CodeChip, TypeGlyph, sheetDialogProps } from './LandingParts';
import { BusinessType, Lang, pick } from './fruitBusinessTypes';
import type { LandingCopy } from './landingCopy';

// Placeholders the old GN page stored when a visitor skipped the name prompt.
const PLACEHOLDER_NAMES = new Set(['Unknown', 'Guest', 'නොදන්නා']);

const savedName = (): string => {
  const name = getUserName();
  return name && !PLACEHOLDER_NAMES.has(name) ? name : '';
};

interface Props {
  open: boolean;
  lang: Lang;
  copy: LandingCopy;
  type: BusinessType | null;
  areaText: string | null;
  onChangeArea: () => void;
  onClose: () => void;
  onStart: (name: string) => void;
}

export const primaryCtaSx = {
  minHeight: 56,
  px: 3.5,
  borderRadius: '999px',
  textTransform: 'none',
  fontWeight: 800,
  fontSize: '1.08rem',
  color: C.leafDeep,
  bgcolor: C.mango,
  boxShadow: '0 10px 24px -12px rgba(255,178,10,0.9)',
  transition: 'background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
  '&:hover': { bgcolor: C.mangoHover, boxShadow: '0 14px 28px -12px rgba(255,178,10,0.95)', transform: 'translateY(-1px)' },
  '&:active': { transform: 'translateY(0)' },
  ...focusRing,
} as const;

const StartSurveyDialog: React.FC<Props> = ({ open, lang, copy, type, areaText, onChangeArea, onClose, onStart }) => {
  const t = copy.dialog;
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(savedName());
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(name.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="start-survey-title" {...sheetDialogProps}>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: 3, pb: 3 }}>
        <Box component="form" onSubmit={submit} noValidate>
          <Typography
            id="start-survey-title"
            component="h2"
            sx={{ fontFamily: displayFont(lang), lineHeight: displayLeading(lang), fontWeight: 800, fontSize: '1.7rem', color: C.leaf }}
          >
            {t.title}
          </Typography>

          {type ? (
            <Box sx={{ mt: 2, p: 2, borderRadius: '18px', bgcolor: '#FFF8E1', border: '1.5px solid #FFE08A' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#7A4A00' }}>{t.selectedType}</Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TypeGlyph type={type} size={52} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.45, color: C.ink }}>
                    {pick(type.name, lang)}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <CodeChip code={type.code} tone="mango" />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'flex-start', gap: 0.75, color: C.field }}>
                <CheckCircleRoundedIcon aria-hidden sx={{ fontSize: '1.15rem', mt: 0.2 }} />
                <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5, color: C.leaf }}>{t.presetNote}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ mt: 1, color: C.inkMuted, lineHeight: 1.6 }}>{t.noType}</Typography>
          )}

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, borderRadius: '14px', bgcolor: C.page }}>
            <PlaceRoundedIcon aria-hidden sx={{ color: C.field }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: C.inkMuted }}>{t.area}</Typography>
              <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.45, color: areaText ? C.ink : C.inkMuted, fontWeight: areaText ? 700 : 400 }}>
                {areaText || t.areaLater}
              </Typography>
            </Box>
            <Button
              onClick={onChangeArea}
              sx={{ minHeight: 44, px: 1.5, flexShrink: 0, borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: C.field, ...focusRing }}
            >
              {areaText ? t.change : t.choose}
            </Button>
          </Box>

          <TextField
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            label={t.nameLabel}
            helperText={t.nameHelp}
            inputProps={{ maxLength: 120, autoComplete: 'name', enterKeyHint: 'go' }}
            sx={{
              mt: 2.5,
              '& .MuiOutlinedInput-root': { borderRadius: '14px', '&.Mui-focused fieldset': { borderColor: C.field } },
              '& label.Mui-focused': { color: C.field },
              '& .MuiFormHelperText-root': { mx: 0.5, lineHeight: 1.5, color: C.inkMuted },
            }}
          />

          <Button type="submit" fullWidth startIcon={<EditNoteRoundedIcon />} sx={{ ...primaryCtaSx, mt: 3 }}>
            {t.start}
          </Button>
          <Button
            onClick={onClose}
            fullWidth
            sx={{ mt: 1, minHeight: 48, borderRadius: '999px', textTransform: 'none', fontWeight: 700, color: C.leaf, ...focusRing }}
          >
            {t.back}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default StartSurveyDialog;
