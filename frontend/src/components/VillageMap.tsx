import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Box, Typography, IconButton, Tooltip, Divider, useTheme } from '@mui/material';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ExploreIcon from '@mui/icons-material/Explore';
import LayersIcon from '@mui/icons-material/Layers';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import GridViewIcon from '@mui/icons-material/GridView';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

// Fix Leaflet's default marker icons in Vite/React bundling
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const customPinIcon = L.icon({
  iconUrl: iconMarker,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [28, 44],
  iconAnchor: [14, 44],
  popupAnchor: [1, -38],
  shadowSize: [44, 44],
});

// Custom map controls helper
function MapCustomControls({
  bounds,
  zoomIn,
  zoomOut,
  resetView,
}: {
  bounds: [[number, number], [number, number]] | null;
  zoomIn: number;
  zoomOut: number;
  resetView: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16, duration: 1.5 });
    }
  }, [bounds, map]);

  useEffect(() => {
    if (zoomIn > 0) map.zoomIn();
  }, [zoomIn, map]);

  useEffect(() => {
    if (zoomOut > 0) map.zoomOut();
  }, [zoomOut, map]);

  useEffect(() => {
    if (resetView > 0 && bounds) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
    }
  }, [resetView, bounds, map]);

  return null;
}

export interface VillageMapProps {
  gnName?: string;
  district?: string;
  dsDivision?: string;
  ccode?: string;
  boundary?: any;
  height?: number | string;
  /** Immersive/background mode: drops the card chrome (border, radius, shadow)
   *  and the "VILLAGE MAP" header pill, and lowers the floating controls so a
   *  separate app bar can sit above them. Used by the mobile map-background view. */
  immersive?: boolean;
}

export const VillageMap: React.FC<VillageMapProps> = ({
  gnName,
  district,
  dsDivision,
  ccode,
  boundary,
  height = 520,
  immersive = false,
}) => {
  const { language } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mapTitle = language === 'si' ? 'ගම් සිතියම' : language === 'ta' ? 'கிராம வரைபடம்' : 'VILLAGE MAP';

  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);
  const [activeLayer, setActiveLayer] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const [showCadastre, setShowCadastre] = useState(true);

  // Parse polygons from GeoJSON [lng, lat] to Leaflet [lat, lng] format
  const parsedPositions = useMemo(() => {
    if (!boundary?.polygons) return [];
    try {
      const raw = JSON.parse(boundary.polygons);
      if (Array.isArray(raw)) {
        const ring =
          Array.isArray(raw[0]?.[0]) && typeof raw[0][0][0] === 'number'
            ? raw[0]
            : Array.isArray(raw[0]?.[0]?.[0])
            ? raw[0][0]
            : raw;

        return ring
          .map((pt: [number, number]) => [pt[1], pt[0]] as [number, number])
          .filter((p: [number, number]) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
      }
    } catch (e) {
      console.error('Error parsing GN polygon:', e);
    }
    return [];
  }, [boundary?.polygons]);

  // Generate simulated cadastral parcels inside the village boundary for realistic mapping visual
  const cadastralParcels = useMemo(() => {
    if (!boundary?.minLat || !boundary?.minLng || !boundary?.maxLat || !boundary?.maxLng) return [];
    const minLat = boundary.minLat;
    const maxLat = boundary.maxLat;
    const minLng = boundary.minLng;
    const maxLng = boundary.maxLng;

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;

    const parcels = [];
    const colors = ['#fef08a', '#fed7aa', '#bbf7d0', '#e2e8f0', '#fbcfe8', '#fed7aa'];

    for (let i = 0; i < 6; i++) {
      const pMinLat = minLat + latSpan * (0.25 + (i % 3) * 0.18);
      const pMaxLat = pMinLat + latSpan * 0.12;
      const pMinLng = minLng + lngSpan * (0.3 + Math.floor(i / 3) * 0.22);
      const pMaxLng = pMinLng + lngSpan * 0.16;

      parcels.push({
        coords: [
          [pMinLat, pMinLng],
          [pMaxLat, pMinLng],
          [pMaxLat, pMaxLng],
          [pMinLat, pMaxLng],
        ] as [number, number][],
        color: colors[i % colors.length],
      });
    }

    return parcels;
  }, [boundary]);

  // Compute center & bounding box.
  // `?? fallback` does NOT catch NaN (NaN is a number), and a single NaN in the
  // boundary would produce a NaN center and make Leaflet throw
  // "Invalid LatLng (NaN, NaN)" — which, now that the map renders as the mobile
  // background, would blank the whole page. So coerce every coordinate through a
  // finite check and fall back to Colombo when any is missing/invalid.
  const COLOMBO_LAT = 6.9271;
  const COLOMBO_LNG = 79.8612;
  const finite = (v: any): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  const bMinLat = finite(boundary?.minLat);
  const bMaxLat = finite(boundary?.maxLat);
  const bMinLng = finite(boundary?.minLng);
  const bMaxLng = finite(boundary?.maxLng);
  const hasValidBounds = bMinLat !== null && bMaxLat !== null && bMinLng !== null && bMaxLng !== null;

  const centerLat = hasValidBounds ? (bMinLat! + bMaxLat!) / 2 : COLOMBO_LAT;
  const centerLng = hasValidBounds ? (bMinLng! + bMaxLng!) / 2 : COLOMBO_LNG;

  const bounds: [[number, number], [number, number]] | null = useMemo(() => {
    if (hasValidBounds) {
      return [
        [bMinLat!, bMinLng!],
        [bMaxLat!, bMaxLng!],
      ];
    }
    return null;
  }, [hasValidBounds, bMinLat, bMaxLat, bMinLng, bMaxLng]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: height,
        borderRadius: immersive ? 0 : '20px',
        overflow: 'hidden',
        boxShadow: immersive
          ? 'none'
          : isDark
          ? 'none'
          : '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
        border: immersive
          ? 'none'
          : isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid #e5e9f0',
        bgcolor: isDark ? '#111827' : '#ffffff',
        animation: 'fadeIn 0.5s ease both',
      }}
    >
      {/* ── CARD HEADER (VILLAGE MAP / ගම් සිතියම) ────────────────── */}
      {!immersive && (
      <Box
        sx={{
          position: 'absolute',
          top: 14,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            pointerEvents: 'auto',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '20px',
            px: 3,
            py: 0.8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1rem',
              color: isDark ? '#ffffff' : '#0f172a',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}
          >
            {mapTitle}
          </Typography>
        </Box>
      </Box>
      )}

      {/* ── LEFT FLOATING CONTROLS (+, -, Fullscreen, Compass) ──────── */}
      <Box
        sx={{
          position: 'absolute',
          top: immersive ? 96 : 70,
          left: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          <Tooltip title="Zoom In" placement="right">
            <IconButton size="small" onClick={() => setZoomInTrigger((v) => v + 1)} sx={{ p: 1 }}>
              <AddIcon sx={{ fontSize: '1.2rem', color: isDark ? '#ffffff' : '#1e293b' }} />
            </IconButton>
          </Tooltip>
          <Divider />
          <Tooltip title="Zoom Out" placement="right">
            <IconButton size="small" onClick={() => setZoomOutTrigger((v) => v + 1)} sx={{ p: 1 }}>
              <RemoveIcon sx={{ fontSize: '1.2rem', color: isDark ? '#ffffff' : '#1e293b' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          <Tooltip title="Reset View" placement="right">
            <IconButton size="small" onClick={() => setResetViewTrigger((v) => v + 1)} sx={{ p: 1 }}>
              <FullscreenIcon sx={{ fontSize: '1.2rem', color: isDark ? '#ffffff' : '#1e293b' }} />
            </IconButton>
          </Tooltip>
          <Divider />
          <Tooltip title="North Compass" placement="right">
            <IconButton size="small" sx={{ p: 1 }}>
              <ExploreIcon sx={{ fontSize: '1.2rem', color: '#ef4444' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── RIGHT FLOATING TOOLBOX (Layers, Roads, Cadastre, Building, Pin) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: immersive ? 96 : 70,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          p: 0.5,
          border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}
      >
        <Tooltip title="Toggle Satellite / OSM Layer" placement="left">
          <IconButton
            size="small"
            onClick={() => setActiveLayer((prev) => (prev === 'osm' ? 'satellite' : 'osm'))}
            sx={{ p: 0.8, color: activeLayer === 'satellite' ? '#3b82f6' : isDark ? '#ffffff' : '#334155' }}
          >
            <LayersIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Roads & Transport Lines" placement="left">
          <IconButton size="small" sx={{ p: 0.8, color: isDark ? '#ffffff' : '#334155' }}>
            <AltRouteIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Cadastral Parcels / Lands" placement="left">
          <IconButton
            size="small"
            onClick={() => setShowCadastre(!showCadastre)}
            sx={{ p: 0.8, color: showCadastre ? '#10b981' : isDark ? '#ffffff' : '#334155' }}
          >
            <GridViewIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Buildings & Infrastructure" placement="left">
          <IconButton size="small" sx={{ p: 0.8, color: isDark ? '#ffffff' : '#334155' }}>
            <ApartmentIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Center Village Pin" placement="left">
          <IconButton size="small" onClick={() => setResetViewTrigger((v) => v + 1)} sx={{ p: 0.8, color: '#3b82f6' }}>
            <LocationOnIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Village Boundaries" placement="left">
          <IconButton size="small" sx={{ p: 0.8, color: isDark ? '#ffffff' : '#334155' }}>
            <MapIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Aerial Photos" placement="left">
          <IconButton size="small" sx={{ p: 0.8, color: isDark ? '#ffffff' : '#334155' }}>
            <PhotoLibraryIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Snapshot / Export Map" placement="left">
          <IconButton size="small" sx={{ p: 0.8, color: isDark ? '#ffffff' : '#334155' }}>
            <CameraAltIcon sx={{ fontSize: '1.15rem' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── LEAFLET MAP CONTAINER ─────────────────────────────────── */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        {activeLayer === 'satellite' ? (
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapCustomControls
          bounds={bounds}
          zoomIn={zoomInTrigger}
          zoomOut={zoomOutTrigger}
          resetView={resetViewTrigger}
        />

        {/* Highlighted Boundary Polygon */}
        {parsedPositions.length > 0 && (
          <Polygon
            positions={parsedPositions}
            pathOptions={{
              color: '#0f172a',
              weight: 3,
              opacity: 0.95,
              fillColor: '#60a5fa',
              fillOpacity: 0.15,
            }}
          >
            <Popup>
              <Box sx={{ p: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                  {gnName}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.3 }}>
                  {dsDivision} &bull; {district}
                </Typography>
              </Box>
            </Popup>
          </Polygon>
        )}

        {/* Cadastral Parcel Blocks Overlay */}
        {showCadastre &&
          cadastralParcels.map((parcel, idx) => (
            <Polygon
              key={idx}
              positions={parcel.coords}
              pathOptions={{
                color: '#334155',
                weight: 1.5,
                fillColor: parcel.color,
                fillOpacity: 0.45,
              }}
            />
          ))}

        {/* Center Pin Marker */}
        <Marker position={[centerLat, centerLng]} icon={customPinIcon}>
          <Popup>
            <Box sx={{ p: 0.5, minWidth: 150 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                {gnName}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.2 }}>
                {dsDivision ? `${dsDivision} DS Division` : ''}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', mt: 0.2 }}>
                {district} District
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                Lat: {centerLat.toFixed(4)}, Lng: {centerLng.toFixed(4)}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
};

export default VillageMap;
