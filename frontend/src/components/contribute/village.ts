/**
 * The contributor's chosen village is kept in browser storage under one key,
 * shared by the region picker, the contribute pages and the survey form.
 */
export const VILLAGE_STORAGE_KEY = 'user_selected_location';

export interface SavedVillage {
  nameEn?: string;
  nameSi?: string;
  nameTa?: string;
  CCODE?: string;
  ccode?: string;
  code?: string;
  dsEn?: string;
  pDistrict?: { admin2NameEn?: string };
  [key: string]: unknown;
}

import { cleanMojibake, sanitizeObject } from '../../utils/mojibake';

/** A corrupted or hand-edited entry must not take a page down. */
export const readSavedVillage = (): SavedVillage | null => {
  const raw = sessionStorage.getItem(VILLAGE_STORAGE_KEY) || localStorage.getItem(VILLAGE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const sanitized = sanitizeObject(parsed) as SavedVillage;
      // If the raw data contained corrupted mojibake, write back the cleaned version
      if (raw.includes('α') || raw.includes('Γ') || raw.includes('«')) {
        saveVillage(sanitized);
      }
      return sanitized;
    }
    return null;
  } catch {
    clearSavedVillage();
    return null;
  }
};

export const saveVillage = (village: SavedVillage): void => {
  const sanitized = sanitizeObject(village);
  const serialised = JSON.stringify(sanitized);
  sessionStorage.setItem(VILLAGE_STORAGE_KEY, serialised);
  localStorage.setItem(VILLAGE_STORAGE_KEY, serialised);
};

export const clearSavedVillage = (): void => {
  sessionStorage.removeItem(VILLAGE_STORAGE_KEY);
  localStorage.removeItem(VILLAGE_STORAGE_KEY);
};

export const villageCode = (village: SavedVillage | null | undefined): string | null =>
  (village?.CCODE || village?.ccode || village?.code || null) as string | null;

export const villageName = (village: SavedVillage | null | undefined, language: 'en' | 'si' | 'ta'): string => {
  if (!village) return '';
  if (language === 'si' && village.nameSi) return cleanMojibake(village.nameSi);
  if (language === 'ta' && village.nameTa) return cleanMojibake(village.nameTa);
  return cleanMojibake(village.nameEn || village.nameSi || village.nameTa || '');
};

export const villagePath = (village: SavedVillage): string =>
  `/gnpage/${encodeURIComponent(String(village.nameEn || '').replace(/ /g, '-'))}/${encodeURIComponent(villageCode(village) || '')}`;
