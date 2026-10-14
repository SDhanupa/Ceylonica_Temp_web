import React from 'react';
import CropFreeIcon from '@mui/icons-material/CropFree';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import GrassIcon from '@mui/icons-material/Grass';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import PublicIcon from '@mui/icons-material/Public';
import TerrainIcon from '@mui/icons-material/Terrain';
import WaterIcon from '@mui/icons-material/Water';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

type Lang = 'en' | 'si' | 'ta';

export interface MobileCategory {
  slug: string;
  color: string;
  icon: React.ReactNode;
  label: Record<Lang, string>;
}

// Canonical location categories (slugs match /gnpage/:gn/:cc/:slug -> CategoryDetailPage)
export const MOBILE_CATEGORIES: MobileCategory[] = [
  { slug: 'location-1-1', color: '#6366f1', icon: <CropFreeIcon />, label: { en: 'Boundaries', si: 'මායිම්', ta: 'எல்லைகள்' } },
  { slug: 'location-1-2', color: '#8b5cf6', icon: <SquareFootIcon />, label: { en: 'Space', si: 'අවකාශය', ta: 'வெளி' } },
  { slug: 'location-1-3', color: '#22c55e', icon: <GrassIcon />, label: { en: 'Land', si: 'ඉඩම්', ta: 'நிலம்' } },
  { slug: 'location-1-4', color: '#f59e0b', icon: <HomeWorkIcon />, label: { en: 'Building / Land', si: 'ගොඩනැගිලි/ඉඩම්', ta: 'கட்டிடம்/நிலம்' } },
  { slug: 'location-1-5', color: '#0ea5e9', icon: <AddRoadIcon />, label: { en: 'Roads', si: 'මාර්ග', ta: 'சாலைகள்' } },
  { slug: 'location-1-6', color: '#06b6d4', icon: <PublicIcon />, label: { en: 'Geo Location', si: 'භූගෝලීය පිහිටීම', ta: 'புவியியல் அமைவிடம்' } },
  { slug: 'location-1-7', color: '#10b981', icon: <TerrainIcon />, label: { en: 'Natural', si: 'ස්වාභාවික', ta: 'இயற்கை' } },
  { slug: 'location-1-8', color: '#38bdf8', icon: <WaterIcon />, label: { en: 'Water Spaces', si: 'ජල අවකාශ', ta: 'நீர் இடங்கள்' } },
  { slug: 'location-1-9', color: '#f97316', icon: <TimelineIcon />, label: { en: 'Lines', si: 'රේඛා', ta: 'கோடுகள்' } },
  { slug: 'location-1-10', color: '#84cc16', icon: <LocalFloristIcon />, label: { en: 'Flora', si: 'ශාක', ta: 'தாவரங்கள்' } },
];

export const catLabel = (c: MobileCategory, lang: string): string =>
  c.label[(lang as Lang)] || c.label.en;
