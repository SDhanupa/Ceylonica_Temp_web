import React from 'react';
import { Alert, Box, Button, CircularProgress, Container, Divider, Paper, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

type Language = 'en' | 'si' | 'ta';

type PublicBusiness = {
  reg_number: string;
  district?: string | null;
  ds_division?: string | null;
  gn_name?: string | null;
  form_values: Record<string, string>;
};

type SurveyQuestion = {
  field_key: string;
  question_en: string;
  question_si?: string;
  question_ta?: string;
  options_json?: Record<string, string[]>;
};

const HIDDEN_FIELDS = new Set([
  'b_nic', 'q_nic', 'q_dob_age', 'q_email', 'q_address', 'q_whatsapp', 'q_mobile', 'b_mobile',
  'b_photo', 'b_reg_no', 'b_type',
]);

const STATIC_LABELS: Record<string, Record<Language, string>> = {
  b_name: { en: 'Business name', si: 'ව්‍යාපාරයේ නම', ta: 'வணிகத்தின் பெயர்' },
  b_address: { en: 'Business address', si: 'ව්‍යාපාර ලිපිනය', ta: 'வணிக முகவரி' },
  b_owner_name: { en: 'Business owner', si: 'ව්‍යාපාර හිමිකරු', ta: 'வணிக உரிமையாளர்' },
  b_type_name: { en: 'Business type', si: 'ව්‍යාපාර වර්ගය', ta: 'வணிக வகை' },
  q_owner_name: { en: 'Owner’s full name', si: 'හිමිකරුගේ සම්පූර්ණ නම', ta: 'உரிமையாளரின் முழுப் பெயர்' },
  q_gender: { en: 'Gender', si: 'ස්ත්‍රී/පුරුෂ භාවය', ta: 'பாலினம்' },
  q_education: { en: 'Highest educational qualification', si: 'උසස්ම අධ්‍යාපන සුදුසුකම', ta: 'மிக உயர்ந்த கல்வித் தகுதி' },
  q_experience: { en: 'Experience in this industry', si: 'මෙම කර්මාන්තයේ පළපුරුද්ද', ta: 'இந்தத் துறையில் அனுபவம்' },
  q_prev_occupation: { en: 'Previous occupation', si: 'පෙර රැකියාව', ta: 'முந்தைய தொழில்' },
};

const fallbackLabel = (key: string) => key
  .replace(/^(b|q)_/, '')
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const PublicBusinessProfilePage: React.FC = () => {
  const { regNumber = '' } = useParams<{ regNumber: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [business, setBusiness] = React.useState<PublicBusiness | null>(null);
  const [questions, setQuestions] = React.useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const L = (en: string, si: string, ta: string) => language === 'si' ? si : language === 'ta' ? ta : en;

  React.useEffect(() => {
    if (!regNumber) {
      setError(L('Business not found.', 'ව්‍යාපාරය හමු නොවීය.', 'வணிகம் காணப்படவில்லை.'));
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([
      fetch(`/api/public/business/${encodeURIComponent(regNumber)}`),
      fetch('/api/business-survey-questions'),
    ])
      .then(async ([businessResponse, questionResponse]) => {
        if (!businessResponse.ok) throw new Error('not-found');
        const profile = await businessResponse.json();
        const questionPayload = questionResponse.ok ? await questionResponse.json() : null;
        if (cancelled) return;
        setBusiness(profile);
        setQuestions(questionPayload?.success && Array.isArray(questionPayload.data) ? questionPayload.data : []);
      })
      .catch(() => {
        if (!cancelled) setError(L('This business profile is not available.', 'මෙම ව්‍යාපාර පැතිකඩ ලබාගත නොහැක.', 'இந்த வணிக சுயவிவரம் கிடைக்கவில்லை.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [regNumber]);

  const questionByKey = React.useMemo(
    () => new Map(questions.map(question => [question.field_key, question])),
    [questions],
  );

  const fieldLabel = (key: string) => {
    const dynamic = questionByKey.get(key);
    if (dynamic) return language === 'si' ? dynamic.question_si || dynamic.question_en : language === 'ta' ? dynamic.question_ta || dynamic.question_en : dynamic.question_en;
    return STATIC_LABELS[key]?.[language] || fallbackLabel(key);
  };

  const fieldValue = (key: string, value: string) => {
    const question = questionByKey.get(key);
    const options = question?.options_json?.[language] || question?.options_json?.en || [];
    if (!options.length) return value;
    return value.split(',').map((answer) => {
      const trimmed = answer.trim();
      return options.find(option => option.split('.')[0].trim() === trimmed) || trimmed;
    }).join(', ');
  };

  const details = React.useMemo(() => {
    if (!business) return [];
    const preferredOrder = ['b_name', 'b_type_name', 'b_address', 'b_owner_name'];
    return Object.entries(business.form_values)
      .filter(([key, value]) => !HIDDEN_FIELDS.has(key) && typeof value === 'string' && value.trim() !== '')
      .sort(([left], [right]) => {
        const leftIndex = preferredOrder.indexOf(left);
        const rightIndex = preferredOrder.indexOf(right);
        return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      });
  }, [business]);

  const photoPaths = (business?.form_values.b_photo || '').split(',').map(path => path.trim()).filter(Boolean);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }

  if (error || !business) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>{error || L('Business not found.', 'ව්‍යාපාරය හමු නොවීය.', 'வணிகம் காணப்படவில்லை.')}</Alert>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/gnpage')}>{L('Back to home', 'මුල් පිටුවට යන්න', 'முகப்புக்குத் திரும்புக')}</Button>
      </Container>
    );
  }

  const businessName = business.form_values.b_name || L('Registered business', 'ලියාපදිංචි ව්‍යාපාරය', 'பதிவுசெய்யப்பட்ட வணிகம்');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f8fc', py: { xs: 2, sm: 5 } }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/gnpage')} sx={{ mb: 2, textTransform: 'none' }}>
          {L('Back to home', 'මුල් පිටුවට යන්න', 'முகப்புக்குத் திரும்புக')}
        </Button>

        <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 4, border: '1px solid #dbe4ef' }}>
          <Box sx={{ p: { xs: 2.5, sm: 4 }, color: '#fff', background: 'linear-gradient(135deg, #1d4ed8, #0f766e)' }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
              <StorefrontOutlinedIcon />
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.75rem' } }}>{businessName}</Typography>
            </Box>
            <Typography sx={{ opacity: 0.9, fontSize: '0.9rem' }}>{business.form_values.b_type_name || L('Registered business profile', 'ලියාපදිංචි ව්‍යාපාර පැතිකඩ', 'பதிவுசெய்யப்பட்ட வணிக சுயவிவரம்')}</Typography>
            <Box sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, border: '1px solid rgba(255,255,255,0.45)', borderRadius: 2 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{L('Registration number', 'ලියාපදිංචි අංකය', 'பதிவு எண்')}:</Typography>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.04em' }}>{business.reg_number}</Typography>
            </Box>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            {photoPaths.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
                {photoPaths.map((path, index) => (
                  <Box key={path} component="img" src={`/api/uploads/${path}`} alt={`${businessName} ${index + 1}`} onError={(event: any) => { event.currentTarget.style.display = 'none'; }} sx={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 3, border: '1px solid #dbe4ef' }} />
                ))}
              </Box>
            )}

            <Typography sx={{ fontWeight: 800, color: '#1e293b', mb: 1.5 }}>{L('Business details', 'ව්‍යාපාර විස්තර', 'வணிக விவரங்கள்')}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>
              {details.map(([key, value]) => (
                <Box key={key} sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{fieldLabel(key)}</Typography>
                  <Typography sx={{ color: '#1e293b', mt: 0.35, whiteSpace: 'pre-wrap' }}>{fieldValue(key, value)}</Typography>
                </Box>
              ))}
            </Box>

            {(business.district || business.ds_division || business.gn_name) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', color: '#475569' }}>
                  <LocationOnOutlinedIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                  <Typography sx={{ fontSize: '0.9rem' }}>{[business.gn_name, business.ds_division, business.district].filter(Boolean).join(', ')}</Typography>
                </Box>
              </>
            )}

            <Divider sx={{ my: 3 }} />
            <Button variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={copyLink} sx={{ textTransform: 'none' }}>
              {copied ? L('Link copied', 'සබැඳිය පිටපත් කරන ලදී', 'இணைப்பு நகலெடுக்கப்பட்டது') : L('Copy public link', 'පොදු සබැඳිය පිටපත් කරන්න', 'பொது இணைப்பை நகலெடுக்கவும்')}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicBusinessProfilePage;
