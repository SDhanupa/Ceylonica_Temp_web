import React from 'react';
import { Box, Typography, Container, Grid } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface GnPageFooterProps {
  isDarkMode?: boolean;
}

const GnPageFooter: React.FC<GnPageFooterProps> = () => {
  const { gnName, ccode } = useParams<{ gnName?: string, ccode?: string }>();
  const { language } = useLanguage();
  
  let targetUrl = '/industry-survey';
  if (gnName && ccode) {
    targetUrl = `/industry-survey/${gnName}/${ccode}`;
  }

  const t = {
    en: {
      desc: 'A modern data intelligence platform delivering regional demographic insights and advanced analytics for the nation.',
      quickLinks: 'Quick Links',
      industrySurvey: 'Industry Survey',
      dataGather: 'Dashboard',
      boundaries: 'Boundaries',
      land: 'Land',
      roads: 'Roads',
      naturalLocation: 'Natural location',
      flora: 'Flora',
      categories: 'Categories',
      space: 'Space',
      buildingLand: 'Building/Land',
      waterBase: 'Water base spaces',
      lines: 'Lines',
      geoLoc: 'Geographical location',
      insights: 'Insights',
      demographics: 'Demographics',
      housing: 'Housing & Infrastructure',
      economy: 'Economic Activity',
      platform: 'Platform',
      about: 'About Project',
      methodology: 'Methodology',
      privacy: 'Privacy Policy',
      contact: 'Contact Us',
      rights: `© ${new Date().getFullYear()} Ceylonica Data Platform. All rights reserved.`,
      designed: 'Designed with precision and care'
    },
    si: {
      desc: 'ජාතිය සඳහා කලාපීය ජනවිකාස තොරතුරු සහ උසස් දත්ත විශ්ලේෂණ සපයන නවීන දත්ත වේදිකාවක්.',
      quickLinks: 'ඉක්මන් සබැඳි',
      industrySurvey: 'දත්ත රැස් කිරීම',
      dataGather: 'උපකරණ පුවරුව',
      boundaries: 'මායිම්',
      land: 'ඉඩම්',
      roads: 'මාර්ග',
      naturalLocation: 'ස්වාභාවික ස්ථාන',
      flora: 'ශාක',
      categories: 'කාණ්ඩ',
      space: 'අවකාශය',
      buildingLand: 'ගොඩනැගිලි/ඉඩම්',
      waterBase: 'ජලය ආශ්‍රිත ස්ථාන',
      lines: 'රේඛා',
      geoLoc: 'භූගෝලීය පිහිටීම',
      insights: 'තොරතුරු',
      demographics: 'ජනවිකාස',
      housing: 'නිවාස හා යටිතල පහසුකම්',
      economy: 'ආර්ථික ක්‍රියාකාරකම්',
      platform: 'වේදිකාව',
      about: 'ව්‍යාපෘතිය ගැන',
      methodology: 'ක්‍රමවේදය',
      privacy: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය',
      contact: 'අප අමතන්න',
      rights: `© ${new Date().getFullYear()} Ceylonica දත්ත වේදිකාව. සියලුම හිමිකම් ඇවිරිණි.`,
      designed: 'නිරවද්‍යතාවයෙන් සහ සැලකිල්ලෙන් නිර්මාණය කර ඇත'
    },
    ta: {
      desc: 'நாட்டிற்கான பிராந்திய மக்கள்தொகை நுண்ணறிவு மற்றும் மேம்பட்ட பகுப்பாய்வுகளை வழங்கும் நவீன தரவு தளம்.',
      quickLinks: 'விரைவு இணைப்புகள்',
      industrySurvey: 'தரவு சேகரிப்பு',
      dataGather: 'கட்டுப்பாடு',
      boundaries: 'எல்லைகள்',
      land: 'நிலம்',
      roads: 'சாலைகள்',
      naturalLocation: 'இயற்கை இருப்பிடம்',
      flora: 'தாவரங்கள்',
      categories: 'வகைகள்',
      space: 'இடம்',
      buildingLand: 'கட்டிடம்/நிலம்',
      waterBase: 'நீர் சார்ந்த இடங்கள்',
      lines: 'கோடுகள்',
      geoLoc: 'புவியியல் இருப்பிடம்',
      insights: 'நுண்ணறிவு',
      demographics: 'மக்கள்தொகை',
      housing: 'வீடமைப்பு மற்றும் உள்கட்டமைப்பு',
      economy: 'பொருளாதார செயல்பாடு',
      platform: 'தளம்',
      about: 'திட்டம் பற்றி',
      methodology: 'முறைமை',
      privacy: 'தனியுரிமை கொள்கை',
      contact: 'எங்களை தொடர்பு கொள்ள',
      rights: `© ${new Date().getFullYear()} சிலோனிகா தரவு தளம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.`,
      designed: 'துல்லியத்துடனும் கவனத்துடனும் வடிவமைக்கப்பட்டுள்ளது'
    }
  }[language];

  return (
    <Box sx={{
      bgcolor: '#0f172a',
      color: '#e2e8f0',
      py: { xs: 4, md: 5 },
      borderTop: '1px solid rgba(255,255,255,0.1)',
      mt: 'auto',
      width: '100%',
    }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} justifyContent="space-between">
          
          {/* Branding */}
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' }, pr: { md: 4 } }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Box component="img" src="/logo.png" alt="Ceylonica Logo" sx={{ height: { xs: 48, md: 62 }, width: 'auto', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif", color: '#ffffff', mb: 2 }}>
              Ceylonica
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', lineHeight: 1.6, maxWidth: 400, mx: { xs: 'auto', md: 0 } }}>
              {t.desc}
            </Typography>
          </Grid>
          
          {/* Links / Info */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={4} sx={{ textAlign: { xs: 'center', md: 'left' }, justifyContent: { xs: 'center', md: 'space-between' } }}>
              
              {/* Quick Links */}
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t.quickLinks}
                </Typography>
                <Typography component={Link} to={targetUrl} variant="body2" sx={{ display: 'block', color: '#38bdf8', mb: 1.5, textDecoration: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {t.industrySurvey}
                </Typography>
                <Typography component={Link} to="/fill-data" variant="body2" sx={{ display: 'block', color: '#38bdf8', mb: 1.5, textDecoration: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {t.dataGather}
                </Typography>
                {[t.boundaries, t.land, t.roads, t.naturalLocation, t.flora].map((item) => (
                  <Typography key={item} variant="body2" sx={{ color: '#94a3b8', mb: 1.5, cursor: 'default' }}>
                    {item}
                  </Typography>
                ))}
              </Grid>

              {/* Categories */}
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t.categories}
                </Typography>
                {[t.space, t.buildingLand, t.waterBase, t.lines, t.geoLoc].map((item) => (
                  <Typography key={item} variant="body2" sx={{ color: '#94a3b8', mb: 1.5, cursor: 'default' }}>
                    {item}
                  </Typography>
                ))}
              </Grid>

              {/* Insights */}
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t.insights}
                </Typography>
                {[t.demographics, t.housing, t.economy].map((item) => (
                  <Typography key={item} variant="body2" sx={{ color: '#94a3b8', mb: 1.5, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: '#38bdf8' } }}>
                    {item}
                  </Typography>
                ))}
              </Grid>

              {/* Platform */}
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t.platform}
                </Typography>
                {[t.about, t.methodology, t.privacy].map((item) => (
                  <Typography key={item} variant="body2" sx={{ color: '#94a3b8', mb: 1.5, cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: '#38bdf8' } }}>
                    {item}
                  </Typography>
                ))}
                
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', mt: 4, mb: 2, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t.contact}
                </Typography>
                <Typography 
                  component="a" 
                  href="mailto:cdicceylon@gmail.com"
                  variant="body2" 
                  sx={{ display: 'block', color: '#94a3b8', mb: 1.5, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: '#38bdf8' } }}
                >
                  cdicceylon@gmail.com
                </Typography>
              </Grid>
              
            </Grid>
          </Grid>
        </Grid>
        
        {/* Footer Bottom */}
        <Box sx={{ 
          mt: 8, 
          pt: 4, 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {t.rights}
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', pr: { md: 6 } }}>
            {t.designed}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default GnPageFooter;
