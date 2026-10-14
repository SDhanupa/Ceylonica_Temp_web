import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  InputBase,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  ClickAwayListener,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { MOBILE_CATEGORIES } from './mobile/mobileCategories';

// Categories Configuration (Shared from CategoryDetailPage)
export const CATEGORIES = [
  { name: 'Boundaries', slug: 'location-1-1', color: '#6366f1' },
  { name: 'Space', slug: 'location-1-2', color: '#8b5cf6' },
  { name: 'Land', slug: 'location-1-3', color: '#22c55e' },
  { name: 'Building/Land', slug: 'location-1-4', color: '#f59e0b' },
  { name: 'Roads', slug: 'location-1-5', color: '#94a3b8' },
  { name: 'Geographical location', slug: 'location-1-6', color: '#0ea5e9' },
  { name: 'Natural location', slug: 'location-1-7', color: '#10b981' },
  { name: 'Water base spaces', slug: 'location-1-8', color: '#38bdf8' },
  { name: 'Lines', slug: 'location-1-9', color: '#f97316' },
  { name: 'Flora', slug: 'location-1-10', color: '#84cc16' },
];

const iconForSlug = (slug?: string): React.ReactNode =>
  MOBILE_CATEGORIES.find((c) => c.slug === slug)?.icon ?? <CategoryIcon fontSize="small" />;

interface SearchResult {
  type: 'gn' | 'category' | 'subcategory' | 'data_item';
  id: string;
  display: string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  data: any;
}

interface GlobalSearchBarProps {
  isDarkMode?: boolean;
  activeGn?: { nameEn: string; CCODE: string } | null;
  language?: 'en' | 'si' | 'ta';
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ isDarkMode = false, activeGn, language = 'en' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [subCatTables, setSubCatTables] = useState<any[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, login, userInfo } = useAuth();

  // Fetch all subcategories globally to search through them
  useEffect(() => {
    fetch(`/api/all-categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tables) {
          setSubCatTables(data.tables);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setOpen(true);
    const lowerQuery = searchQuery.toLowerCase();
    
    let combinedResults: SearchResult[] = [];

    // 1. Search Categories
    CATEGORIES.forEach(cat => {
      if (cat.name.toLowerCase().includes(lowerQuery)) {
        combinedResults.push({
          type: 'category',
          id: cat.slug,
          display: cat.name,
          icon: iconForSlug(cat.slug),
          color: cat.color,
          data: cat
        });
      }
    });

    // 2. Search Subcategories
    subCatTables.forEach(sub => {
      if (sub.nameEn?.toLowerCase().includes(lowerQuery) || sub.nameSi?.toLowerCase().includes(lowerQuery) || sub.nameTa?.toLowerCase().includes(lowerQuery)) {
        // Find parent category to display hierarchy
        const parentCat = CATEGORIES.find(c => sub.slug?.startsWith(c.slug));
        const parentName = parentCat ? parentCat.name : 'Category';
        
        combinedResults.push({
          type: 'subcategory',
          id: sub.slug,
          display: `${sub.nameEn || sub.nameSi || sub.nameTa}`,
          subtitle: parentName,
          icon: parentCat ? iconForSlug(parentCat.slug) : <CategoryIcon fontSize="small" />,
          color: parentCat?.color || '#3b82f6',
          data: sub
        });
      }
    });

    // 3. Search GNs via Backend
    try {
      const response = await fetch(`/api/search-gns?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success && data.data) {
        const gnResults = data.data.map((gn: any) => ({
          type: 'gn',
          id: gn.ccode,
          display: language === 'en' ? gn.display : (language === 'si' ? gn.displaySi : gn.displayTa),
          data: gn
        }));
        combinedResults = [...combinedResults, ...gnResults];
      }
    } catch (err) {
      console.error("Error searching GNs", err);
    }

    // 4. Search Data Items across all categories
    try {
      const response = await fetch(`/api/search-all-data?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success && data.data) {
        const dataResults = data.data.map((item: any) => ({
          type: 'data_item',
          id: item.id.toString(),
          display: `Data: ${item.nameEn || item.nameSi || item.nameTa || item.regNumber} (${item.gn_display})`,
          icon: <DescriptionOutlinedIcon fontSize="small" />,
          color: '#10b981',
          data: item
        }));
        combinedResults = [...combinedResults, ...dataResults];
      }
    } catch (err) {
      console.error("Error searching data items", err);
    }

    setResults(combinedResults);
    setLoading(false);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');

    if (result.type === 'gn') {
      const gnName = encodeURIComponent(result.data.nameEn.replace(/ /g, '-'));
      window.location.href = `/gnpage/${gnName}/${result.data.ccode}`;
    } else if (result.type === 'category' || result.type === 'subcategory') {
      const slug = result.id;
      
      if (!isAuthenticated) {
        // Public routing
        if (activeGn && activeGn.nameEn && activeGn.CCODE) {
          const gnName = encodeURIComponent(activeGn.nameEn.replace(/ /g, '-'));
          window.location.href = `/gnpage/${gnName}/${activeGn.CCODE}/${slug}`;
        } else {
          // If no active GN, they need to select one first
          // We can just take them to gnpage
          window.location.href = '/gnpage';
        }
      } else {
        // Authenticated routing
        const isAdmin = userInfo?.realm_roles?.includes('super_admin') || userInfo?.realm_roles?.includes('admin') || userInfo?.realm_roles?.includes('moderator');
        const basePath = isAdmin ? '/categories' : '/user/categories';
        
        let targetUrl = `${window.location.origin}${basePath}/${slug}`;
        if (activeGn && activeGn.nameEn && activeGn.CCODE) {
          const gnName = encodeURIComponent(activeGn.nameEn.replace(/ /g, '-'));
          targetUrl = `${window.location.origin}${basePath}/${slug}?gnName=${gnName}&ccode=${activeGn.CCODE}`;
        }
        window.location.href = targetUrl;
      }
    } else if (result.type === 'data_item') {
      const slug = result.data.slug;
      const gnName = encodeURIComponent(result.data.gn_display.replace(/ /g, '-'));
      
      if (!isAuthenticated) {
        // Public routing
        window.location.href = `/gnpage/${gnName}/${result.data.ccode}/${slug}?dataItemId=${result.data.id}`;
      } else {
        // Authenticated routing
        const isAdmin = userInfo?.realm_roles?.includes('super_admin') || userInfo?.realm_roles?.includes('admin') || userInfo?.realm_roles?.includes('moderator');
        const basePath = isAdmin ? '/categories' : '/user/categories';
        
        const targetUrl = `${window.location.origin}${basePath}/${slug}?gnName=${gnName}&ccode=${result.data.ccode}&dataItemId=${result.data.id}`;
        window.location.href = targetUrl;
      }
    }
  };

  const textColor = isDarkMode ? '#fff' : '#333';
  const bgColor = isDarkMode ? alpha('#000', 0.4) : alpha('#fff', 0.8);
  const dropdownBg = isDarkMode ? '#1e293b' : '#ffffff';

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, zIndex: 1000 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: bgColor,
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
            px: 2,
            py: 0.5,
            transition: 'all 0.3s ease',
            boxShadow: open ? `0 4px 20px ${alpha('#000', 0.1)}` : 'none',
            '&:hover': {
              bgcolor: isDarkMode ? alpha('#000', 0.6) : alpha('#fff', 1),
            }
          }}
        >
          <SearchIcon sx={{ color: isDarkMode ? '#cbd5e1' : '#64748b', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search GNs, Categories, Subcategories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
            sx={{
              flex: 1,
              color: isDarkMode ? '#ffffff' : '#0f172a',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.95rem',
              '& input::placeholder': {
                color: isDarkMode ? '#94a3b8' : '#64748b',
                opacity: 0.9,
              }
            }}
          />
          {loading && <CircularProgress size={16} sx={{ color: isDarkMode ? '#38bdf8' : '#2563eb', ml: 1 }} />}
        </Box>

        {open && results.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: 400,
              overflowY: 'auto',
              bgcolor: dropdownBg,
              borderRadius: '16px',
              border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.05)}`,
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { bgcolor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.05), borderRadius: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? alpha('#fff', 0.3) : alpha('#000', 0.3), borderRadius: 4, '&:hover': { bgcolor: isDarkMode ? alpha('#fff', 0.5) : alpha('#000', 0.5) } }
            }}
          >
            {results.map((result, idx) => (
              <Box
                key={`${result.type}-${result.id}-${idx}`}
                onClick={() => handleSelect(result)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  '&:hover': {
                    bgcolor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                  }
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: result.type === 'gn' ? alpha('#3b82f6', 0.1) : alpha(result.color || '#94a3b8', 0.1),
                    color: result.type === 'gn' ? '#3b82f6' : (result.color || '#94a3b8'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    flexShrink: 0,
                    fontSize: '1.2rem'
                  }}
                >
                  {result.type === 'gn' ? <LocationOnIcon fontSize="small" /> : result.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {result.type === 'gn' ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                        <Typography sx={{ color: isDarkMode ? '#fff' : '#1e293b', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>
                          {result.data?.nameEn}
                        </Typography>
                        {(result.data?.CCODE || result.data?.code) && (
                          <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace', bgcolor: isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.09)', color: '#2563eb', px: 0.8, py: 0.2, borderRadius: '6px' }}>
                            {result.data?.CCODE || result.data?.code}
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.75rem', fontWeight: 500, fontFamily: "'Inter', sans-serif", mt: 0.2 }}>
                        {result.data?.disEn} {result.data?.disEn && result.data?.dsEn ? ' › ' : ''} {result.data?.dsEn}
                      </Typography>
                    </>
                  ) : (
                    <Typography
                      sx={{
                        color: isDarkMode ? '#fff' : '#1e293b',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {result.display}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      fontSize: '0.75rem',
                      fontFamily: "'Inter', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      mt: 0.2
                    }}
                  >
                    {result.subtitle ? result.subtitle : (result.type === 'gn' ? 'Grama Niladhari' : result.type === 'category' ? 'Main Category' : 'Subcategory')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        )}
        {open && results.length === 0 && !loading && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              bgcolor: dropdownBg,
              borderRadius: '16px',
              border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.05)}`,
              p: 3,
              textAlign: 'center'
            }}
          >
            <Typography sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontFamily: "'Inter', sans-serif" }}>
              No results found
            </Typography>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default GlobalSearchBar;
