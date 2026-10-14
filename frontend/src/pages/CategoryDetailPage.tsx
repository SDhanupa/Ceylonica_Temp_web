import React, { useState } from 'react';
import {
  Box, Typography, IconButton, Menu, MenuItem, Divider,
  useTheme, useMediaQuery, CircularProgress, Paper,
  Table, TableBody, TableRow, TableCell, TableContainer,
  Chip, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, InputBase,
  Skeleton,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlaceIcon from '@mui/icons-material/Place';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useAuth } from '../auth/AuthProvider';
import { GET_CATEGORY_BY_SLUG } from '../graphql/queries';
import GnPageFooter from '../components/GnPageFooter';
import GlobalSearchBar from '../components/GlobalSearchBar';
import { MOBILE_CATEGORIES } from '../components/mobile/mobileCategories';

// ─── Category Config ─────────────────────────────────────────────────────────
// Name/slug kept for compatibility with existing consumers (UserDashboard's
// Categories menu, GlobalSearchBar). Icons come from MOBILE_CATEGORIES (same slug
// order) so the icon set is identical across mobile, desktop nav, and this page.
// This page uses a single brand-blue accent — not per-category colors — so the UI
// reads as one cohesive system rather than a rainbow of colored badges.

export const CATEGORIES = [
  { name: 'Boundaries', slug: 'location-1-1', color: '#6366f1', dbId: '31720' },
  { name: 'Space', slug: 'location-1-2', color: '#8b5cf6', dbId: '31945' },
  { name: 'Land', slug: 'location-1-3', color: '#22c55e', dbId: '32021' },
  { name: 'Building/Land', slug: 'location-1-4', color: '#f59e0b', dbId: '32063' },
  { name: 'Roads', slug: 'location-1-5', color: '#94a3b8', dbId: '34514' },
  { name: 'Geographical location', slug: 'location-1-6', color: '#0ea5e9', dbId: '34641' },
  { name: 'Natural location', slug: 'location-1-7', color: '#10b981', dbId: '34655' },
  { name: 'Water base spaces', slug: 'location-1-8', color: '#38bdf8', dbId: '34663' },
  { name: 'Lines', slug: 'location-1-9', color: '#f97316', dbId: '34750' },
  { name: 'Flora', slug: 'location-1-10', color: '#84cc16', dbId: '34759' },
];

const ACCENT = '#2563eb';
const ACCENT_DARK = '#1d4ed8';

const iconForSlug = (slug?: string): React.ReactNode => {
  const match = MOBILE_CATEGORIES.find((c) => c.slug === slug);
  return match?.icon ?? <PlaceIcon />;
};

// ─── Helper ────────────────────────────────────────────────────────────────

const getThemeColors = (dark: boolean) => ({
  bg: dark ? '#0b1120' : '#f7f9fc',
  card: dark ? '#111827' : '#ffffff',
  text: dark ? '#f1f5f9' : '#0f172a',
  muted: dark ? '#94a3b8' : '#64748b',
  faint: dark ? '#64748b' : '#94a3b8',
  border: dark ? 'rgba(255,255,255,0.08)' : '#e6eaf0',
  tint: dark ? 'rgba(37,99,235,0.16)' : 'rgba(37,99,235,0.08)',
  chipBg: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
});

// ─── Detail Card ────────────────────────────────────────────────────────────

const FastBigCardItem = ({ item, idx, tc, qMap, autoOpenId, isDarkMode }: any) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (autoOpenId && item.id.toString() === autoOpenId) {
      setDialogOpen(true);
    }
  }, [autoOpenId, item.id]);

  // Parse Answers dynamically
  const answers: { question: string, answer: string }[] = [];
  if (item.image_path) answers.push({ question: 'Image', answer: String(item.image_path) });

  // Core fields requested to be shown on the card
  answers.push({ question: 'Reg Number', answer: item.reg_number ? String(item.reg_number) : '-' });
  answers.push({ question: 'Name (EN)', answer: item.name_en ? String(item.name_en) : '-' });
  answers.push({ question: 'Name (SI)', answer: item.name_si ? String(item.name_si) : '-' });
  answers.push({ question: 'Name (TA)', answer: item.name_ta ? String(item.name_ta) : '-' });
  answers.push({ question: 'National', answer: 'Sri Lanka' });
  answers.push({ question: 'Province', answer: item.province_name ? String(item.province_name) : '-' });
  answers.push({ question: 'District', answer: item.district_name ? String(item.district_name) : '-' });
  answers.push({ question: 'DS Division', answer: item.ds_name ? String(item.ds_name) : '-' });
  answers.push({ question: 'GN Name', answer: item.gn_name ? String(item.gn_name) : '-' });

  // Additional details and custom questions
  if (item.address) answers.push({ question: 'Address', answer: String(item.address) });
  if (item.mobile) answers.push({ question: 'Mobile', answer: String(item.mobile) });

  Object.keys(item).forEach(key => {
    if (key.startsWith('q_')) {
      const parts = key.split('_');
      const qId = parts[1];
      const iter = parts[2];
      let label = qMap[qId] || `Question #${qId}`;
      if (iter && iter !== '1') label += ` (Item #${iter})`;
      if (item[key]) answers.push({ question: label, answer: String(item[key]) });
    }
  });

  const displayAnswers = answers.filter(a => a.question !== 'Image');
  const hasMap = item.latitude && item.longitude;
  const dateText = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const imageSrc = item.image_path
    ? `/api/uploads/category_images/${item.image_path}`
    : null;
  const title = item.name_en || item.name_si || item.name_ta || `Record ${idx + 1}`;
  const subNames = [item.name_si, item.name_ta].filter(Boolean).join('   •   ');
  const locationLine = [item.ds_name, item.district_name].filter(Boolean).join(', ');

  return (
    <>
      <Grid item xs={12} md={6} key={item.id}>
        <Paper
          elevation={0}
          onClick={() => setDialogOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDialogOpen(true);
            }
          }}
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1.6,
            bgcolor: tc.card,
            border: `1px solid ${tc.border}`,
            borderRadius: '16px',
            p: 1.6,
            pl: 2,
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease',
            animation: `fadeInUp 0.4s ease ${(idx % 8) * 50}ms both`,
            // left accent bar
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: '3px',
              bgcolor: ACCENT,
              opacity: 0.55,
              transition: 'opacity 0.22s ease',
            },
            '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: '2px' },
            '&:hover': {
              boxShadow: isDarkMode ? '0 10px 26px rgba(0,0,0,0.5)' : '0 12px 28px rgba(15,23,42,0.1)',
              borderColor: isDarkMode ? 'rgba(59,130,246,0.5)' : 'rgba(37,99,235,0.4)',
              transform: 'translateY(-2px)',
              '&::before': { opacity: 1 },
              '& .rec-cta': { bgcolor: ACCENT, color: '#fff' },
            },
          }}
        >
          {/* Thumbnail / icon avatar */}
          <Box
            sx={{
              width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: imageSrc ? 'transparent' : tc.tint,
              border: imageSrc ? `1px solid ${tc.border}` : 'none',
            }}
          >
            {imageSrc ? (
              <Box component="img" src={imageSrc} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <PlaceOutlinedIcon sx={{ fontSize: '1.4rem', color: ACCENT }} />
            )}
          </Box>

          {/* Names + meta */}
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 0.4 }}>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: tc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </Typography>
            {subNames && (
              <Typography sx={{ fontSize: '0.8rem', color: tc.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subNames}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mt: 0.2, flexWrap: 'wrap' }}>
              {item.reg_number && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: tc.faint }}>
                  <TagOutlinedIcon sx={{ fontSize: '0.85rem' }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{item.reg_number}</Typography>
                </Box>
              )}
              {locationLine && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: tc.faint, minWidth: 0 }}>
                  <PlaceOutlinedIcon sx={{ fontSize: '0.85rem' }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationLine}</Typography>
                </Box>
              )}
              {dateText && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: tc.faint }}>
                  <CalendarTodayOutlinedIcon sx={{ fontSize: '0.8rem' }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500 }}>{dateText}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* CTA chevron */}
          <Box
            className="rec-cta"
            sx={{
              width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: tc.chipBg, color: ACCENT,
              transition: 'background-color 0.22s ease, color 0.22s ease',
            }}
          >
            <NorthEastIcon sx={{ fontSize: '1.05rem' }} />
          </Box>
        </Paper>
      </Grid>

      {/* Popup Dialog for All Details */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: tc.card, color: tc.text, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, fontWeight: 800, fontSize: '1.05rem', color: tc.text, borderBottom: `1px solid ${tc.border}`, px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tc.tint, color: ACCENT }}>
              <PlaceOutlinedIcon sx={{ fontSize: '1.05rem' }} />
            </Box>
            <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Box>
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)} sx={{ color: tc.muted }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {imageSrc && (
            <Box
              component="img"
              src={imageSrc}
              alt="Submission"
              sx={{ width: '100%', maxHeight: 320, objectFit: 'contain', bgcolor: isDarkMode ? '#000' : '#f1f5f9' }}
            />
          )}
          <TableContainer>
            <Table size="medium">
              <TableBody>
                {displayAnswers.map((a, aIdx) => (
                  <TableRow key={aIdx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', color: tc.muted, width: '40%', py: 1.6, pl: 3, borderColor: tc.border }}>
                      {a.question}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.88rem', color: tc.text, fontWeight: 500, py: 1.6, pr: 3, wordBreak: 'break-word', borderColor: tc.border }}>
                      {a.answer}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${tc.border}`, p: 2, px: 3 }}>
          {hasMap && (
            <Button
              startIcon={<PlaceIcon sx={{ fontSize: '1.1rem !important' }} />}
              onClick={() => window.open(`https://maps.google.com/?q=${item.latitude},${item.longitude}`, '_blank')}
              sx={{ color: '#16a34a', fontWeight: 700, textTransform: 'none' }}
            >
              Show on Map
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained" disableElevation onClick={() => setDialogOpen(false)}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px', px: 3, bgcolor: ACCENT, boxShadow: 'none', '&:hover': { bgcolor: ACCENT_DARK, boxShadow: 'none' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ─── Loading skeleton row ───────────────────────────────────────────────────

const SkeletonRow = ({ tc }: any) => (
  <Grid item xs={12} md={6}>
    <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.6, p: 1.6, pl: 2, borderRadius: '16px', border: `1px solid ${tc.border}`, bgcolor: tc.card }}>
      <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '12px', flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="55%" height={20} />
        <Skeleton variant="text" width="35%" height={16} />
      </Box>
      <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: '10px' }} />
    </Paper>
  </Grid>
);

// ─── Section (a single category or subcategory data table) ─────────────────

const FastBigCardList = ({ slug, categoryName, gnId, parentQuestions, searchQuery, autoOpenId, isDarkMode, isSuperAdmin, onLoaded }: {
  slug: string; categoryName: string; gnId: string; parentQuestions: any[];
  searchQuery?: string; autoOpenId?: string | null; isDarkMode: boolean; isSuperAdmin?: boolean; onLoaded?: (slug: string, count: number) => void;
}) => {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const tc = getThemeColors(isDarkMode);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const url = `/api/category-data/${slug}?gn_id=${gnId}${isSuperAdmin ? '&is_admin=true' : ''}`;
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(res => {
        const rows = res.success ? res.data : [];
        setData(rows);
        setLoading(false);
        onLoaded?.(slug, rows.length);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setLoading(false);
          onLoaded?.(slug, 0);
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, gnId]);

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} tc={tc} />)}
        </Grid>
      </Box>
    );
  }

  let filteredData = data;
  if (searchQuery) {
    const lowerQ = searchQuery.toLowerCase();
    filteredData = data.filter((item: any) =>
      item.name_en?.toLowerCase().includes(lowerQ) ||
      item.name_si?.toLowerCase().includes(lowerQ) ||
      item.name_ta?.toLowerCase().includes(lowerQ) ||
      item.reg_number?.toLowerCase().includes(lowerQ)
    );
  }

  if (filteredData.length === 0) return null;

  const qMap: Record<string, string> = {};
  parentQuestions.forEach((q: any) => {
    qMap[String(q.id)] = q.questionTextEn || `Question ${q.id}`;
  });

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: tc.text, letterSpacing: '-0.01em' }}>
          {categoryName}
        </Typography>
        <Chip label={filteredData.length} size="small" sx={{ bgcolor: tc.tint, color: ACCENT, fontWeight: 700, fontSize: '0.72rem', height: 22 }} />
      </Box>

      <Grid container spacing={1.5}>
        {filteredData.map((item: any, idx: number) => (
          <FastBigCardItem key={item.id} item={item} idx={idx} tc={tc} qMap={qMap} autoOpenId={autoOpenId} isDarkMode={isDarkMode} />
        ))}
      </Grid>
    </Box>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────

const CategoryDetailPage: React.FC = () => {
  const { gnName, ccode, categorySlug } = useParams<{
    gnName: string;
    ccode: string;
    categorySlug: string;
  }>();

  const navigate = useNavigate();
  const { isAuthenticated, isLoading, userInfo, logout, login, register } = useAuth();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [catMenuAnchor, setCatMenuAnchor] = useState<null | HTMLElement>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});

  const tc = getThemeColors(isDarkMode);
  const isSuperAdmin = userInfo?.realm_roles?.includes('super_admin');
  const dataItemId = new URLSearchParams(window.location.search).get('dataItemId');

  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  const catName = category?.name ?? categorySlug ?? 'Category';
  const catIcon = iconForSlug(categorySlug);

  /* ── Industry survey businesses for location-1-4 ── */
  const [industrySurveys, setIndustrySurveys] = useState<any[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(false);

  React.useEffect(() => {
    if (categorySlug !== 'location-1-4' || !ccode) return;
    setSurveysLoading(true);
    fetch(`/api/public/surveys-by-ccode/${ccode}`)
      .then(r => r.json())
      .then(data => { setIndustrySurveys(Array.isArray(data) ? data : []); setSurveysLoading(false); })
      .catch(() => setSurveysLoading(false));
  }, [categorySlug, ccode]);

  const gnPageUrl = `/gnpage/${gnName}/${ccode}`;
  const gnDisplayName = decodeURIComponent(gnName ?? '').replace(/-/g, ' ');

  const [subCatTables, setSubCatTables] = useState<any[]>([]);

  // 1. Fetch subcategory tables by slug
  React.useEffect(() => {
    if (!categorySlug) return;
    setSectionCounts({});
    fetch(`/api/category-tables/${categorySlug}`)
      .then(res => res.json())
      .then(data => {
        setSubCatTables(data.success && data.tables ? data.tables : []);
      })
      .catch(err => {
        console.error('Error fetching category tables:', err);
        setSubCatTables([]);
      });
  }, [categorySlug]);

  // 2. Fetch the dynamic category ID for the GraphQL query
  const { data: catData } = useQuery(GET_CATEGORY_BY_SLUG, {
    variables: { slug: categorySlug },
    skip: !categorySlug,
  });

  const handleSectionLoaded = (slug: string, count: number) => {
    setSectionCounts((prev) => (prev[slug] === count ? prev : { ...prev, [slug]: count }));
  };

  const allSectionSlugs = [categorySlug!, ...subCatTables.map((s: any) => s.slug)];
  const allSectionsReported = allSectionSlugs.every((s) => s in sectionCounts);
  const totalItems = allSectionSlugs.reduce((sum, s) => sum + (sectionCounts[s] || 0), 0);
  const showEmptyState = allSectionsReported && totalItems === 0;

  const navBtnSx = {
    textTransform: 'none' as const, fontWeight: 600, fontSize: '0.88rem', borderRadius: '10px',
    color: isDarkMode ? '#cbd5e1' : '#334155', px: 1.5, boxShadow: 'none',
    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)', boxShadow: 'none', transform: 'none' },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        bgcolor: tc.bg,
      }}
    >
      {/* ── STICKY TOP NAVBAR (flat, matches /gnpage) ── */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: isDarkMode ? 'rgba(11,17,32,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${tc.border}`,
          px: { xs: 2, md: 4, lg: 6 },
          py: 1.2,
        }}
      >
        {/* Wordmark */}
        <Box onClick={() => navigate(gnPageUrl)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flexShrink: 0 }}>
          <Box component="img" src="/logo.png" alt="Ceylonica" sx={{ height: 28, width: 28, objectFit: 'contain' }} />
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '1.05rem', color: tc.text }}>
            Ceylonica
          </Typography>
        </Box>

        {!isMobile ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button onClick={() => navigate(gnPageUrl)} disableRipple sx={navBtnSx}>Home</Button>
              <Button onClick={(e) => setCatMenuAnchor(e.currentTarget)} disableRipple endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '1.1rem !important' }} />} sx={navBtnSx}>
                Categories
              </Button>
              <Menu
                anchorEl={catMenuAnchor}
                open={Boolean(catMenuAnchor)}
                onClose={() => setCatMenuAnchor(null)}
                PaperProps={{ sx: { bgcolor: tc.card, border: `1px solid ${tc.border}`, borderRadius: '14px', minWidth: 244, boxShadow: '0 16px 36px rgba(15,23,42,0.14)', mt: 1 } }}
              >
                {CATEGORIES.map((cat) => {
                  const active = cat.slug === categorySlug;
                  return (
                    <MenuItem
                      key={cat.slug}
                      selected={active}
                      onClick={() => { setCatMenuAnchor(null); navigate(`/gnpage/${gnName}/${ccode}/${cat.slug}`); }}
                      sx={{ gap: 1.2, py: 0.9, px: 2, fontSize: '0.88rem', fontWeight: active ? 700 : 500, color: active ? ACCENT : tc.text }}
                    >
                      <Box sx={{ width: 26, height: 26, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? ACCENT : tc.muted, bgcolor: active ? tc.tint : tc.chipBg, '& .MuiSvgIcon-root': { fontSize: '0.95rem' } }}>
                        {iconForSlug(cat.slug)}
                      </Box>
                      {cat.name}
                    </MenuItem>
                  );
                })}
              </Menu>
              {isAuthenticated && (
                <Button onClick={() => (isSuperAdmin ? navigate('/admins') : navigate('/user'))} disableRipple sx={navBtnSx}>
                  {isSuperAdmin ? 'Dashboard' : 'My Account'}
                </Button>
              )}
            </Box>

            <Box sx={{ flex: 1, maxWidth: 420, mx: 2 }}>
              <GlobalSearchBar isDarkMode={isDarkMode} activeGn={{ nameEn: gnName || '', CCODE: ccode || '' }} language="en" />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <IconButton onClick={() => setIsDarkMode(d => !d)} size="small" sx={{ width: 34, height: 34, color: tc.muted }}>
                {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
              {isAuthenticated ? (
                <Button onClick={() => { logout(); navigate('/gnpage'); }} disableRipple sx={{ ...navBtnSx, color: '#dc2626' }}>Logout</Button>
              ) : !isLoading ? (
                <>
                  <Button onClick={() => login(window.location.href)} disableRipple sx={navBtnSx}>Login</Button>
                  <Button
                    variant="contained" disableElevation onClick={() => register(window.location.href)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', borderRadius: '9px', bgcolor: ACCENT, px: 2, boxShadow: 'none', '&:hover': { bgcolor: ACCENT_DARK, boxShadow: 'none' } }}
                  >
                    Join with us
                  </Button>
                </>
              ) : null}
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={() => setIsDarkMode(d => !d)} size="small" sx={{ width: 34, height: 34, color: tc.muted }}>
              {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
            <IconButton onClick={(e) => setMobileMenuAnchor(e.currentTarget)} size="small" sx={{ width: 34, height: 34, color: tc.text }}>
              <MenuIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={mobileMenuAnchor} open={Boolean(mobileMenuAnchor)} onClose={() => setMobileMenuAnchor(null)} PaperProps={{ sx: { borderRadius: '14px', minWidth: 220, bgcolor: tc.card, border: `1px solid ${tc.border}` } }}>
              <MenuItem onClick={() => { setMobileMenuAnchor(null); navigate(gnPageUrl); }} sx={{ color: tc.text }}>Home</MenuItem>
              {isAuthenticated && (
                <>
                  <MenuItem onClick={() => { setMobileMenuAnchor(null); isSuperAdmin ? navigate('/admins') : navigate('/user'); }} sx={{ color: tc.text }}>
                    {isSuperAdmin ? 'Dashboard' : 'My Account'}
                  </MenuItem>
                  <MenuItem onClick={() => { setMobileMenuAnchor(null); logout(); navigate('/gnpage'); }} sx={{ color: '#dc2626' }}>Logout</MenuItem>
                </>
              )}
              <Divider sx={{ borderColor: tc.border }} />
              <MenuItem disabled sx={{ fontWeight: 700, fontSize: '0.78rem', opacity: 0.6 }}>Categories</MenuItem>
              {CATEGORIES.map((cat) => {
                const active = cat.slug === categorySlug;
                return (
                  <MenuItem
                    key={cat.slug}
                    selected={active}
                    onClick={() => { setMobileMenuAnchor(null); navigate(`/gnpage/${gnName}/${ccode}/${cat.slug}`); }}
                    sx={{ gap: 1.2, color: active ? ACCENT : tc.text }}
                  >
                    <Box sx={{ width: 24, height: 24, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? ACCENT : tc.muted, bgcolor: active ? tc.tint : tc.chipBg, '& .MuiSvgIcon-root': { fontSize: '0.85rem' } }}>
                      {iconForSlug(cat.slug)}
                    </Box>
                    {cat.name}
                  </MenuItem>
                );
              })}
            </Menu>
          </Box>
        )}
      </Box>

      {/* ── HERO PANEL ── */}
      <Box sx={{ px: { xs: 2, md: 4, lg: 6 }, pt: { xs: 3, md: 4 }, pb: 1, maxWidth: 1160, mx: 'auto', width: '100%' }}>
        {/* breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, animation: 'fadeInUp 0.35s ease both' }}>
          <IconButton onClick={() => navigate(gnPageUrl)} size="small" sx={{ width: 26, height: 26, color: tc.muted, '&:hover': { color: ACCENT } }}>
            <ArrowBackIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <Typography onClick={() => navigate(gnPageUrl)} sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.muted, cursor: 'pointer', '&:hover': { color: ACCENT } }}>
            {gnDisplayName || 'Village'}
          </Typography>
          <ChevronRightIcon sx={{ fontSize: '0.95rem', color: tc.faint }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tc.text }}>{catName}</Typography>
        </Box>

        {/* hero card */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '22px',
            border: `1px solid ${tc.border}`,
            bgcolor: tc.card,
            boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(15,23,42,0.04), 0 10px 30px rgba(15,23,42,0.05)',
            p: { xs: 2.5, md: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: { xs: 2, md: 3 },
            animation: 'fadeInUp 0.45s ease 60ms both',
          }}
        >
          {/* subtle accent wash */}
          <Box aria-hidden sx={{ position: 'absolute', top: -70, right: -40, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${tc.tint} 0%, transparent 70%)`, pointerEvents: 'none' }} />

          <Box sx={{
            position: 'relative', zIndex: 1, flexShrink: 0,
            width: 60, height: 60, borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
            boxShadow: '0 10px 24px rgba(37,99,235,0.35)',
            '& .MuiSvgIcon-root': { fontSize: '1.7rem' },
          }}>
            {catIcon}
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.8px', mb: 0.4 }}>
              Location Data
            </Typography>
            <Typography sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: { xs: '1.7rem', md: '2.2rem' }, color: tc.text, lineHeight: 1.05 }}>
              {catName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: tc.muted }}>
                <PlaceOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{gnDisplayName || 'Village'}</Typography>
              </Box>
              {allSectionsReported && (
                <Chip
                  label={`${totalItems} ${totalItems === 1 ? 'record' : 'records'}`}
                  size="small"
                  sx={{ height: 22, fontWeight: 700, fontSize: '0.72rem', bgcolor: tc.tint, color: ACCENT }}
                />
              )}
            </Box>
          </Box>

          {/* Local Search */}
          <Box sx={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f4f6fb',
            border: `1px solid ${tc.border}`,
            borderRadius: '12px', px: 1.6, height: 46, width: { xs: '100%', md: 280 },
            transition: 'border-color 0.2s ease',
            '&:focus-within': { borderColor: ACCENT },
          }}>
            <SearchIcon sx={{ color: tc.muted, fontSize: '1.2rem' }} />
            <InputBase
              placeholder="Search this category..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              sx={{ flex: 1, color: tc.text, fontSize: '0.9rem' }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, pt: 3, pb: 6, maxWidth: 1160, mx: 'auto', width: '100%' }}>
        {/* Main category data — always shown (captures user-submitted approved data) */}
        <FastBigCardList
          slug={categorySlug!}
          categoryName={catName}
          gnId={ccode!}
          parentQuestions={catData?.categoryBySlug?.questions || []}
          searchQuery={localSearchQuery}
          autoOpenId={dataItemId}
          isDarkMode={isDarkMode}
          isSuperAdmin={isSuperAdmin}
          onLoaded={handleSectionLoaded}
        />

        {/* Also show any bulk-uploaded subcategory tables */}
        {subCatTables.map((sub: any) => (
          <FastBigCardList
            key={sub.slug}
            slug={sub.slug}
            categoryName={sub.nameEn || sub.nameSi || sub.nameTa}
            gnId={ccode as string}
            parentQuestions={catData?.categoryBySlug?.questions || []}
            searchQuery={localSearchQuery}
            autoOpenId={dataItemId}
            isDarkMode={isDarkMode}
            isSuperAdmin={isSuperAdmin}
            onLoaded={handleSectionLoaded}
          />
        ))}

        {/* ── Registered Businesses (Industry Surveys) for location-1-4 ── */}
        {categorySlug === 'location-1-4' && industrySurveys.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Typography sx={{
                fontSize: '0.72rem', fontWeight: 700, color: tc.muted,
                textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap',
              }}>
                Registered Businesses ({industrySurveys.length})
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: tc.border }} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {industrySurveys.map((s: any) => (
                <Box
                  key={s.id}
                  onClick={() => navigate(`/business/${encodeURIComponent(s.reg_number)}`)}
                  sx={{
                    p: 2.5, borderRadius: '16px', cursor: 'pointer',
                    bgcolor: tc.card, border: `1px solid ${tc.border}`,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      bgcolor: tc.tint, borderColor: ACCENT,
                      transform: 'translateY(-3px)',
                      boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {s.b_photo && (
                    <Box sx={{
                      width: '100%', height: 120, borderRadius: '12px', overflow: 'hidden',
                      mb: 1.5, bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                    }}>
                      <Box
                        component="img"
                        src={`/api/uploads/${s.b_photo}`}
                        alt={s.b_name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                      />
                    </Box>
                  )}
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: tc.text, mb: 0.5, lineHeight: 1.3 }}>
                    {s.b_name || 'Unnamed Business'}
                  </Typography>
                  {s.b_type_name && (
                    <Typography sx={{ fontSize: '0.78rem', color: tc.muted, mb: 0.75 }}>
                      {s.b_type_name}
                    </Typography>
                  )}
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    bgcolor: isDarkMode ? 'rgba(99,102,241,0.12)' : 'rgba(37,99,235,0.08)',
                    borderRadius: '8px', px: 1, py: 0.3,
                  }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: ACCENT, letterSpacing: '0.02em' }}>
                      {s.reg_number}
                    </Typography>
                  </Box>
                  {s.status === 'approved' && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, mt: 0.75 }}>
                      ✓ Verified
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {categorySlug === 'location-1-4' && surveysLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        )}

        {/* Empty state — shown only once every section has reported in and none has data */}
        {showEmptyState && (
          <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
            py: 9, px: 3, textAlign: 'center',
            border: `1px dashed ${tc.border}`, borderRadius: '18px', bgcolor: tc.card,
          }}>
            <Box sx={{ width: 60, height: 60, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tc.tint, color: ACCENT }}>
              <InboxOutlinedIcon sx={{ fontSize: '1.7rem' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: tc.text }}>
              {localSearchQuery ? 'No matching records' : `No records yet for ${catName}`}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: tc.muted, maxWidth: 380 }}>
              {localSearchQuery
                ? 'Try a different search term, or clear the search to see all records.'
                : "Data submitted for this category and village will appear here once it's added."}
            </Typography>
          </Box>
        )}

        {/* Navigate to other categories */}
        <Box sx={{ mt: 7 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>
              Browse other categories
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: tc.border }} />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {CATEGORIES.filter((c) => c.slug !== categorySlug).map((cat) => (
              <Box
                key={cat.slug}
                onClick={() => navigate(`/gnpage/${gnName}/${ccode}/${cat.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/gnpage/${gnName}/${ccode}/${cat.slug}`);
                  }
                }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.9,
                  px: 1.6, py: 1, borderRadius: '12px',
                  bgcolor: tc.card,
                  border: `1px solid ${tc.border}`,
                  cursor: 'pointer',
                  color: tc.muted,
                  transition: 'background-color 0.2s ease, transform 0.15s ease, border-color 0.2s ease, color 0.2s ease',
                  '& .MuiSvgIcon-root': { fontSize: '1.1rem', transition: 'color 0.2s ease' },
                  '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: '2px' },
                  '&:hover': { bgcolor: tc.tint, borderColor: ACCENT, transform: 'translateY(-1px)', color: ACCENT, '& .rec-label': { color: tc.text } },
                }}
              >
                <Box sx={{ display: 'flex', color: 'inherit' }}>{iconForSlug(cat.slug)}</Box>
                <Typography className="rec-label" sx={{ fontSize: '0.82rem', fontWeight: 600, color: tc.text }}>{cat.name}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <GnPageFooter isDarkMode={isDarkMode} />
    </Box>
  );
};

export default CategoryDetailPage;
