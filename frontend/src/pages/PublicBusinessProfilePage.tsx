import React from 'react';
import { Box, Button, ButtonBase, Container, Dialog, IconButton, Skeleton, Typography } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SiteTopBar from '../components/fruit/SiteTopBar';
import LandingFooter from '../components/fruit/LandingFooter';
import { COPY } from '../components/fruit/landingCopy';
import { C } from '../components/fruit/tokens';
import { stepTitle } from '../components/survey/surveySteps';
import { findBySlug, pick as pickName } from '../components/fruit/fruitBusinessTypes';
import { useQuery } from '@apollo/client';
import { GET_GN_LABEL_BY_CCODE } from '../graphql/queries';

type Language = 'en' | 'si' | 'ta';

type PublicBusiness = {
  reg_number: string;
  status?: 'submitted' | 'approved' | string;
  ccode?: string | null;
  district?: string | null;
  ds_division?: string | null;
  gn_name?: string | null;
  created_at?: string | null;
  form_values: Record<string, string>;
};

type SurveyQuestion = {
  field_key: string;
  step_index?: number;
  sort_order?: number;
  question_en: string;
  question_si?: string;
  question_ta?: string;
  options_json?: Record<string, string[]>;
};

/* Design tokens: one ink, one accent, hairlines, square corners. */
const INK = C.ink;
const MUTED = C.inkMuted;
const LINE = '#DFE4DD';
const SOFT = '#F4F6F2';
const ACCENT = C.field;

// Shown in the header or not meaningful to the public. Personal identifiers are
// already removed by the API; this list only keeps them out if they ever slip in.
const HIDDEN_FIELDS = new Set([
  'b_nic', 'q_nic', 'q_dob', 'q_dob_age', 'q_email', 'q_address', 'q_whatsapp', 'q_mobile', 'b_mobile',
  'b_photo', 'b_reg_no', 'b_type', 'b_name', 'b_type_name',
]);

const STATIC_LABELS: Record<string, Record<Language, string>> = {
  b_address: { en: 'Address', si: 'ලිපිනය', ta: 'முகவரி' },
  b_owner_name: { en: 'Owner', si: 'හිමිකරු', ta: 'உரிமையாளர்' },
  q_owner_name: { en: 'Owner’s full name', si: 'හිමිකරුගේ සම්පූර්ණ නම', ta: 'உரிமையாளரின் முழுப் பெயர்' },
  q_gender: { en: 'Gender', si: 'ස්ත්‍රී/පුරුෂ භාවය', ta: 'பாலினம்' },
  q_education: { en: 'Education', si: 'අධ්‍යාපනය', ta: 'கல்வி' },
  q_experience: { en: 'Years in this industry', si: 'මෙම කර්මාන්තයේ වසර', ta: 'இந்தத் துறையில் ஆண்டுகள்' },
  q_prev_occupation: { en: 'Previous occupation', si: 'පෙර රැකියාව', ta: 'முந்தைய தொழில்' },
};

const fallbackLabel = (key: string) => key
  .replace(/^(b|q)_/, '')
  .split('_')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

// Section titles in the survey carry numbering such as "3 වන කොටස: …"; a profile only needs the name.
const cleanTitle = (t: string) => (t.includes(':') ? t.split(':').slice(1).join(':').trim() : t);

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((w) => w.charAt(0).toUpperCase())
  .join('') || '•';

const squareBtn = {
  borderRadius: 0, textTransform: 'none', fontWeight: 700, fontSize: '0.92rem', minHeight: 44, px: 2, boxShadow: 'none',
  '&:hover': { boxShadow: 'none' },
  '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: 2 },
} as const;

const Card: React.FC<{ title?: React.ReactNode; children: React.ReactNode; id?: string }> = ({ title, children, id }) => (
  <Box component="section" aria-labelledby={id} sx={{ bgcolor: '#fff', border: `1px solid ${LINE}` }}>
    {title && (
      <Typography id={id} component="h2" sx={{ px: { xs: 2, sm: 3 }, py: 1.75, borderBottom: `1px solid ${LINE}`, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
        {title}
      </Typography>
    )}
    {children}
  </Box>
);

const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; first?: boolean }> = ({ label, value, first }) => (
  <Box
    sx={{
      display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 2fr) minmax(0, 3fr)' }, gap: { xs: 0.25, sm: 3 },
      px: { xs: 2, sm: 3 }, py: 1.6, borderTop: first ? 'none' : `1px solid ${LINE}`,
    }}
  >
    <Typography component="dt" sx={{ fontSize: '0.88rem', color: MUTED, lineHeight: 1.5 }}>{label}</Typography>
    <Typography component="dd" sx={{ m: 0, fontSize: '0.98rem', fontWeight: 600, color: INK, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</Typography>
  </Box>
);

const PublicBusinessProfilePage: React.FC = () => {
  const { regNumber = '' } = useParams<{ regNumber: string }>();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const lang = (['en', 'si', 'ta'].includes(language) ? language : 'si') as Language;
  const [business, setBusiness] = React.useState<PublicBusiness | null>(null);
  const [questions, setQuestions] = React.useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [copied, setCopied] = React.useState<'link' | 'reg' | null>(null);
  const [viewer, setViewer] = React.useState<number | null>(null);

  const L = (en: string, si: string, ta: string) => (lang === 'si' ? si : lang === 'ta' ? ta : en);

  React.useEffect(() => {
    if (!regNumber) { setNotFound(true); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    Promise.all([
      fetch(`/api/public/business/${encodeURIComponent(regNumber)}`, { headers: { Accept: 'application/json' } }),
      fetch('/api/business-survey-questions', { headers: { Accept: 'application/json' } }),
    ])
      .then(async ([profileRes, questionRes]) => {
        if (!profileRes.ok) throw new Error('not-found');
        const profile = await profileRes.json();
        const payload = questionRes.ok ? await questionRes.json().catch(() => null) : null;
        if (cancelled) return;
        setBusiness(profile);
        setQuestions(payload?.success && Array.isArray(payload.data) ? payload.data : []);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [regNumber]);

  const name = business?.form_values.b_name?.trim() || L('Registered business', 'ලියාපදිංචි ව්‍යාපාරය', 'பதிவுசெய்யப்பட்ட வணிகம்');

  React.useEffect(() => {
    document.title = business ? `${name} · Ceylonica` : 'Ceylonica';
  }, [business, name]);

  const questionByKey = React.useMemo(() => new Map(questions.map((q) => [q.field_key, q])), [questions]);

  const fieldLabel = (key: string) => {
    const q = questionByKey.get(key);
    if (q) return (lang === 'si' ? q.question_si : lang === 'ta' ? q.question_ta : q.question_en) || q.question_en;
    return STATIC_LABELS[key]?.[lang] || fallbackLabel(key);
  };

  const fieldValue = (key: string, value: string) => {
    const q = questionByKey.get(key);
    const options = q?.options_json?.[lang] || q?.options_json?.en || [];
    const answers = value.split(',').map((a) => a.trim()).filter(Boolean);
    // Steps 0-1 store the full label ("1. Male"); drop the option number for display.
    if (!options.length) return value.replace(/^\d+\.\s+(?=\S)/, '');
    // Stored answers are option numbers ("1") or full labels ("1. Yes"); show the label without its number.
    return answers.map((a) => {
      const num = a.split('.')[0].trim();
      const match = options.find((o) => o.split('.')[0].trim() === num);
      return (match || a).replace(/^\d+\.\s*/, '');
    }).join(', ');
  };

  // Answers grouped into the survey's own sections, in survey order.
  const sections = React.useMemo(() => {
    if (!business) return [] as { index: number; title: string; rows: [string, string][] }[];
    const groups = new Map<number, [string, string][]>();
    const order = (key: string) => questionByKey.get(key)?.sort_order ?? 0;
    Object.entries(business.form_values)
      .filter(([key, value]) => !HIDDEN_FIELDS.has(key) && typeof value === 'string' && value.trim() !== '')
      .forEach(([key, value]) => {
        const q = questionByKey.get(key);
        const index = q?.step_index ?? (key.startsWith('b_') ? 0 : 1);
        if (!groups.has(index)) groups.set(index, []);
        groups.get(index)!.push([key, value]);
      });
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([index, rows]) => ({
        index,
        title: index === 0 ? L('About the business', 'ව්‍යාපාරය ගැන', 'வணிகம் பற்றி') : cleanTitle(stepTitle(index, lang)),
        rows: rows.sort(([a], [b]) => order(a) - order(b)),
      }));
  }, [business, questionByKey, lang]);

  const photos = (business?.form_values.b_photo || '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => `/api/uploads/${p}`);
  const areaUrl = business?.ccode && business?.gn_name
    ? `/gnpage/${encodeURIComponent(business.gn_name.trim().replace(/\s+/g, '-'))}/${encodeURIComponent(business.ccode)}`
    : (localStorage.getItem('last_gn_url') || '/gnpage');
  // Localised names: the profile API stores English only, so look up the area and type.
  const { data: gnLabel } = useQuery(GET_GN_LABEL_BY_CCODE, { variables: { CCODE: business?.ccode }, skip: !business?.ccode, fetchPolicy: 'cache-first' });
  const gnL = gnLabel?.gnByCcode;
  const local = (en: string | null | undefined, si?: string, ta?: string) => (lang === 'si' ? si || en : lang === 'ta' ? ta || en : en) || '';
  const gnNameL = local(business?.gn_name, gnL?.nameSi, gnL?.nameTa);
  const dsL = local(business?.ds_division, gnL?.dsSi, gnL?.dsTa);
  const districtL = local(business?.district, gnL?.disSi, gnL?.disTa);
  const knownType = findBySlug(business?.form_values.b_type);
  const typeName = knownType ? pickName(knownType.name, lang) : business?.form_values.b_type_name;
  const place = business ? [gnNameL, dsL, districtL].filter(Boolean).join(', ') : '';
  const approved = business?.status === 'approved';
  const registeredOn = business?.created_at
    ? new Date(business.created_at).toLocaleDateString(lang === 'si' ? 'si-LK' : lang === 'ta' ? 'ta-LK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const flash = (what: 'link' | 'reg') => { setCopied(what); window.setTimeout(() => setCopied(null), 1800); };
  const copyText = async (text: string, what: 'link' | 'reg') => {
    try { await navigator.clipboard.writeText(text); flash(what); } catch { /* clipboard blocked: nothing to do */ }
  };
  const share = async () => {
    const data = { title: name, text: `${name} · ${business?.reg_number}`, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch { /* cancelled */ return; }
    }
    copyText(window.location.href, 'link');
  };

  const siteCopy = COPY[lang] ?? COPY.si;
  const topBar = (
    <SiteTopBar
      lang={lang}
      onLanguage={(l) => setLanguage(l)}
      onLogo={() => navigate(areaUrl)}
      action={
        <ButtonBase
          onClick={() => navigate(areaUrl)}
          aria-label={L('Back to the area page', 'ප්‍රදේශ පිටුවට', 'பகுதிப் பக்கத்திற்கு')}
          sx={{ minHeight: 44, minWidth: 44, px: { xs: 1.25, sm: 2 }, gap: 0.75, border: `1px solid ${LINE}`, color: INK, fontWeight: 700, fontSize: '0.9rem', '&:hover': { borderColor: INK }, '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: 2 } }}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: '0.9rem' }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{business?.gn_name || L('Back', 'ආපසු', 'பின்')}</Box>
        </ButtonBase>
      }
    />
  );
  const footer = (
    <LandingFooter
      lang={lang}
      copy={siteCopy}
      showCta={false}
      onStart={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      onFind={() => navigate(`${areaUrl}#types`)}
      onSection={(id) => navigate(`${areaUrl}#section-${id}`)}
    />
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: SOFT, display: 'flex', flexDirection: 'column' }}>
        {topBar}
        <Skeleton variant="rectangular" sx={{ height: { xs: 160, sm: 240 }, transform: 'none' }} />
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 3, flex: 1 }} aria-busy="true">
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mt: { xs: -6, sm: -8 } }}>
            <Skeleton variant="rectangular" sx={{ width: { xs: 80, sm: 112 }, height: { xs: 80, sm: 112 }, transform: 'none', border: '4px solid #fff' }} />
            <Box sx={{ flex: 1 }}><Skeleton width="50%" height={40} /><Skeleton width="30%" /></Box>
          </Box>
          <Box sx={{ mt: 4, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
            <Skeleton variant="rectangular" height={260} sx={{ transform: 'none' }} />
            <Skeleton variant="rectangular" height={180} sx={{ transform: 'none' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (notFound || !business) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: SOFT, display: 'flex', flexDirection: 'column' }}>
        {topBar}
        <Container maxWidth="sm" sx={{ flex: 1, display: 'grid', placeItems: 'center', py: 8, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ width: '100%', bgcolor: '#fff', border: `1px solid ${LINE}`, p: { xs: 3, sm: 5 } }}>
            <SearchOffRoundedIcon sx={{ fontSize: '2rem', color: MUTED }} />
            <Typography component="h1" sx={{ mt: 2, fontWeight: 800, fontSize: '1.5rem', color: INK }}>
              {L('Business not found', 'ව්‍යාපාරය හමු නොවීය', 'வணிகம் கிடைக்கவில்லை')}
            </Typography>
            <Typography sx={{ mt: 1, color: MUTED, lineHeight: 1.6 }}>
              {L('Check the registration number in the link. Profiles appear once the survey has been submitted.', 'සබැඳියේ ලියාපදිංචි අංකය පරීක්ෂා කරන්න. සමීක්ෂණය ඉදිරිපත් කළ පසු පැතිකඩ දිස් වේ.', 'இணைப்பில் உள்ள பதிவு எண்ணைச் சரிபார்க்கவும். கணக்கெடுப்பு சமர்ப்பிக்கப்பட்ட பிறகு சுயவிவரம் தோன்றும்.')}
            </Typography>
            <Button onClick={() => navigate(areaUrl)} variant="contained" sx={{ ...squareBtn, mt: 3, bgcolor: INK, color: '#fff', '&:hover': { bgcolor: ACCENT, boxShadow: 'none' } }}>
              {L('Go to the area page', 'ප්‍රදේශ පිටුවට යන්න', 'பகுதிப் பக்கத்திற்குச் செல்')}
            </Button>
          </Box>
        </Container>
        {footer}
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SOFT, display: 'flex', flexDirection: 'column', color: INK }}>
      {topBar}

      <Box component="main" sx={{ flex: 1 }}>
        {/* Cover */}
        <Box
          sx={{
            height: { xs: 150, sm: 240 }, bgcolor: '#1B2620', position: 'relative', overflow: 'hidden',
            backgroundImage: photos[0]
              ? `linear-gradient(180deg, rgba(10,16,12,0) 40%, rgba(10,16,12,0.55) 100%), url("${photos[0]}")`
              : `linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: photos[0] ? 'cover' : '32px 32px',
            backgroundPosition: 'center',
          }}
        />

        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Identity */}
          {/* Only the logo block overlaps the cover; the text stays on the light background. */}
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, alignItems: { xs: 'flex-start', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box
              aria-hidden
              sx={{
                width: { xs: 88, sm: 120 }, height: { xs: 88, sm: 120 }, flexShrink: 0, position: 'relative', zIndex: 1,
                mt: { xs: -5.5, sm: -7.5 }, mb: { xs: -0.5, sm: 0 },
                border: '4px solid #fff', bgcolor: ACCENT, color: '#fff', display: 'grid', placeItems: 'center',
                fontWeight: 800, fontSize: { xs: '1.9rem', sm: '2.6rem' }, letterSpacing: '0.02em',
                backgroundImage: photos[0] ? `url("${photos[0]}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                boxShadow: '0 12px 28px -18px rgba(16,36,26,0.6)',
              }}
            >
              {!photos[0] && initials(name)}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1, pt: { sm: 2.5 } }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.25 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, height: 26, fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', bgcolor: approved ? ACCENT : INK, color: '#fff' }}>
                  {approved ? <VerifiedOutlinedIcon sx={{ fontSize: '0.95rem' }} /> : <ScheduleRoundedIcon sx={{ fontSize: '0.95rem' }} />}
                  {approved ? L('Verified', 'තහවුරු කළ', 'சரிபார்க்கப்பட்டது') : L('Registered', 'ලියාපදිංචි', 'பதிவுசெய்யப்பட்டது')}
                </Box>
                {typeName && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, height: 26, fontSize: '0.8rem', fontWeight: 700, border: `1px solid ${LINE}`, bgcolor: '#fff', color: INK }}>
                    {typeName}
                  </Box>
                )}
              </Box>
              <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.4rem' }, lineHeight: 1.15, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                {name}
              </Typography>
              {place && (
                <Typography sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, color: MUTED, fontSize: '0.95rem' }}>
                  <PlaceOutlinedIcon sx={{ fontSize: '1.05rem' }} />{place}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, pt: { sm: 3 } }}>
              <Button onClick={share} variant="contained" startIcon={copied === 'link' ? <CheckRoundedIcon /> : <IosShareRoundedIcon />}
                sx={{ ...squareBtn, flex: { xs: 1, sm: 'none' }, bgcolor: INK, color: '#fff', '&:hover': { bgcolor: ACCENT, boxShadow: 'none' } }}>
                {copied === 'link' ? L('Link copied', 'සබැඳිය පිටපත් විය', 'இணைப்பு நகலெடுக்கப்பட்டது') : L('Share', 'බෙදාගන්න', 'பகிர்')}
              </Button>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ mt: { xs: 3, sm: 4 }, mb: { xs: 6, sm: 8 }, display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(280px, 1fr)' }, alignItems: 'start' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, minWidth: 0 }}>
              {photos.length > 1 && (
                <Card title={L('Photos', 'ඡායාරූප', 'புகைப்படங்கள்')} id="photos-title">
                  <Box sx={{ p: { xs: 2, sm: 3 }, display: 'grid', gap: 1, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' } }}>
                    {photos.map((src, i) => (
                      <ButtonBase key={src} onClick={() => setViewer(i)} aria-label={`${L('Open photo', 'ඡායාරූපය බලන්න', 'புகைப்படத்தைத் திற')} ${i + 1}`}
                        sx={{ aspectRatio: '1 / 1', overflow: 'hidden', '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: 2 } }}>
                        <Box component="img" src={src} alt={`${name} ${i + 1}`} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 200ms ease', '&:hover': { transform: 'scale(1.03)' } }} />
                      </ButtonBase>
                    ))}
                  </Box>
                </Card>
              )}

              {sections.map((s) => (
                <Card key={s.index} title={s.title} id={`sec-${s.index}`}>
                  <Box component="dl" sx={{ m: 0 }}>
                    {s.rows.map(([key, value], i) => <Row key={key} first={i === 0} label={fieldLabel(key)} value={fieldValue(key, value)} />)}
                  </Box>
                </Card>
              ))}
            </Box>

            <Box component="aside" sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, position: { md: 'sticky' }, top: { md: 88 } }}>
              <Card title={L('Registration', 'ලියාපදිංචිය', 'பதிவு')} id="reg-title">
                <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: MUTED }}>{L('Registration number', 'ලියාපදිංචි අංකය', 'பதிவு எண்')}</Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.02em', wordBreak: 'break-all', flex: 1 }}>
                      {business.reg_number}
                    </Typography>
                    <IconButton onClick={() => copyText(business.reg_number, 'reg')} aria-label={L('Copy registration number', 'ලියාපදිංචි අංකය පිටපත් කරන්න', 'பதிவு எண்ணை நகலெடு')}
                      sx={{ borderRadius: 0, width: 40, height: 40, border: `1px solid ${LINE}`, color: copied === 'reg' ? ACCENT : INK }}>
                      {copied === 'reg' ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>
                <Box component="dl" sx={{ m: 0, borderTop: `1px solid ${LINE}` }}>
                  <SideRow label={L('Status', 'තත්ත්වය', 'நிலை')} value={approved ? L('Verified', 'තහවුරු කළ', 'சரிபார்க்கப்பட்டது') : L('Registered', 'ලියාපදිංචි', 'பதிவுசெய்யப்பட்டது')} first />
                  {registeredOn && <SideRow label={L('Registered on', 'ලියාපදිංචි දිනය', 'பதிவு தேதி')} value={registeredOn} />}
                </Box>
              </Card>

              {place && (
                <Card title={L('Location', 'ස්ථානය', 'இருப்பிடம்')} id="loc-title">
                  <Box component="dl" sx={{ m: 0 }}>
                    {business.gn_name && <SideRow label={L('GN division', 'ග්‍රාම නිලධාරී වසම', 'கி.அ. பிரிவு')} value={gnNameL} first />}
                    {business.ds_division && <SideRow label={L('DS division', 'ප්‍රා. ලේ. කොට්ඨාසය', 'பி.செ. பிரிவு')} value={dsL} first={!business.gn_name} />}
                    {business.district && <SideRow label={L('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்')} value={districtL} first={!business.gn_name && !business.ds_division} />}
                  </Box>
                  <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2.5, pt: 0.5 }}>
                    <Button fullWidth onClick={() => navigate(areaUrl)} variant="outlined" sx={{ ...squareBtn, color: INK, borderColor: LINE, '&:hover': { borderColor: INK, bgcolor: 'transparent' } }}>
                      {L('View area page', 'ප්‍රදේශ පිටුව බලන්න', 'பகுதிப் பக்கத்தைப் பார்')}
                    </Button>
                  </Box>
                </Card>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {footer}

      {/* Photo viewer */}
      <Dialog open={viewer !== null} onClose={() => setViewer(null)} fullScreen PaperProps={{ sx: { bgcolor: 'rgba(8,12,10,0.96)', borderRadius: 0 } }}>
        {viewer !== null && (
          <Box sx={{ position: 'relative', height: '100%', display: 'grid', placeItems: 'center', p: { xs: 1, sm: 6 } }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setViewer((v) => (v === null ? v : (v + 1) % photos.length));
              if (e.key === 'ArrowLeft') setViewer((v) => (v === null ? v : (v - 1 + photos.length) % photos.length));
            }}
            tabIndex={-1}
          >
            <Box component="img" src={photos[viewer]} alt={`${name} ${viewer + 1}`} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            <IconButton onClick={() => setViewer(null)} aria-label={L('Close', 'වසන්න', 'மூடு')} sx={{ position: 'absolute', top: 12, right: 12, borderRadius: 0, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <CloseRoundedIcon />
            </IconButton>
            {photos.length > 1 && (
              <>
                <IconButton onClick={() => setViewer((viewer - 1 + photos.length) % photos.length)} aria-label={L('Previous photo', 'පෙර ඡායාරූපය', 'முந்தைய புகைப்படம்')} sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', borderRadius: 0, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <ChevronLeftRoundedIcon />
                </IconButton>
                <IconButton onClick={() => setViewer((viewer + 1) % photos.length)} aria-label={L('Next photo', 'ඊළඟ ඡායාරූපය', 'அடுத்த புகைப்படம்')} sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', borderRadius: 0, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <ChevronRightRoundedIcon />
                </IconButton>
                <Typography sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{viewer + 1} / {photos.length}</Typography>
              </>
            )}
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

const SideRow: React.FC<{ label: React.ReactNode; value: React.ReactNode; first?: boolean }> = ({ label, value, first }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, px: { xs: 2, sm: 3 }, py: 1.4, borderTop: first ? 'none' : `1px solid ${LINE}` }}>
    <Typography component="dt" sx={{ fontSize: '0.86rem', color: MUTED }}>{label}</Typography>
    <Typography component="dd" sx={{ m: 0, fontSize: '0.92rem', fontWeight: 700, color: INK, textAlign: 'right', wordBreak: 'break-word' }}>{value}</Typography>
  </Box>
);

export default PublicBusinessProfilePage;
