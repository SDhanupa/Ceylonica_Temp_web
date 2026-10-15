import React, { useState, useEffect } from 'react';
import GnTopHeaderBar from '../components/GnTopHeaderBar';
import GnPageFooter from '../components/GnPageFooter';
import { Box, Typography, Button, Container, TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Select, MenuItem, Autocomplete, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Tooltip, IconButton } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageContext';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_QUESTIONS, GET_GN_BY_CCODE, GET_CATEGORIES_BY_ROOT_SLUG } from '../graphql/queries';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LocationSelectorModal from '../components/LocationSelectorModal';
import { getUserName } from '../utils/cookieUtils';

/* ── Survey design system ─────────────────────────────────────────────────── */
import {
  T, SurveyKeyframes, SurveyErrorContext, QuestionField, SText, SDropdown, ChipMultiSelect,
} from '../components/survey/SurveyKit';
import SurveyProgress, { SurveySection } from '../components/survey/SurveyProgress';
import {
  extractNICDetails, getStepErrors, getFirstInvalidStep, isDynamicStep, TOTAL_STEPS,
} from '../components/survey/surveyValidation';
import { DYNAMIC_STEP_TITLES } from '../components/survey/surveySteps';

/* Section icons — one per step, shown in the sticky progress header */
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import ParkOutlinedIcon from '@mui/icons-material/ParkOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';

/* UI icons */
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

// ─── Reusable Photo Uploader Component ───────────────────────────────────────
interface PhotoUploaderProps {
  fieldKey: string;
  value: string;
  multiple?: boolean;
  language: string;
  onChange: (names: string, previews: string[]) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ fieldKey, value, multiple = false, language, onChange }) => {
  const [previews, setPreviews] = React.useState<string[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const names = arr.map(f => f.name).join(', ');
    const readers = arr.map(f => new Promise<string>(resolve => {
      const r = new FileReader();
      r.onload = e => resolve(e.target?.result as string);
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(urls => {
      const next = multiple ? [...previews, ...urls] : urls;
      setPreviews(next);
      onChange(names, next);
    });
  };

  const removePreview = (idx: number) => {
    const next = previews.filter((_, i) => i !== idx);
    setPreviews(next);
    onChange(next.length ? `${next.length} photo(s)` : '', next);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: previews.length ? 1.5 : 0 }}>
        {/* Gallery / Drive */}
        <Button
          component="label"
          variant="outlined"
          startIcon={<FolderOpenIcon />}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
        >
          {language === 'si' ? 'ගැලරිය / ෆයිල්' : language === 'ta' ? 'கோப்பு / கேலரி' : 'Gallery / Drive'}
          <input
            type="file"
            hidden
            accept="image/*"
            multiple={multiple}
            onChange={e => handleFiles(e.target.files)}
          />
        </Button>

        {/* Camera */}
        <Button
          component="label"
          variant="contained"
          color="secondary"
          startIcon={<CameraAltIcon />}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
        >
          {language === 'si' ? 'කැමරාවෙන් ගන්න' : language === 'ta' ? 'புகைப்படம் எடு' : 'Take Photo'}
          <input
            type="file"
            hidden
            accept="image/*"
            capture="environment"
            onChange={e => handleFiles(e.target.files)}
          />
        </Button>
      </Box>

      {value && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
          {value}
        </Typography>
      )}

      {previews.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {previews.map((src, i) => (
            <Box key={i} sx={{ position: 'relative', display: 'inline-block' }}>
              <Box
                component="img"
                src={src}
                alt={`preview-${i}`}
                sx={{
                  width: 90, height: 90,
                  objectFit: 'cover',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: 2,
                }}
              />
              <IconButton
                size="small"
                onClick={() => removePreview(i)}
                sx={{
                  position: 'absolute', top: -8, right: -8,
                  bgcolor: 'error.main', color: 'white',
                  width: 22, height: 22,
                  '&:hover': { bgcolor: 'error.dark' },
                }}
              >
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
// ──────────────────────────────────────────────────────────────────────────────


// ─── Dynamic Question Renderer ──────────────────────────────────────────────
interface DynamicQuestionRendererProps {
  question: any;
  language: string;
  formValues: Record<string, string>;
  handleInputChange: (key: string, value: string) => void;
  /** Derived by the caller from validation rules (see `requiredIds`), same as
   *  the hardcoded steps' `QuestionLabel` — without this the required asterisk
   *  never renders for any DB-driven field. */
  required?: boolean;
}

/**
 * A DB-driven question is shown only when its `depends_on` ("field:1,2") is
 * satisfied. Shared by the renderer and the validator so the two can never
 * disagree about which questions are actually on screen.
 */
const isQuestionVisible = (question: any, formValues: Record<string, string>): boolean => {
  if (!question?.depends_on) return true;
  const [depKey, depValsStr] = question.depends_on.split(':');
  const depVals = (depValsStr || '').split(',');
  const currentVal = formValues[depKey] || '';
  return depVals.some((v: string) => currentVal.includes(v) || currentVal === v);
};

const DynamicQuestionRenderer: React.FC<DynamicQuestionRendererProps> = ({ question, language, formValues, handleInputChange, required }) => {
  const langKey = language === 'si' ? 'question_si' : language === 'ta' ? 'question_ta' : 'question_en';
  const label = question[langKey] || question.question_en;
  
  const expKey = language === 'si' ? 'explanation_si' : language === 'ta' ? 'explanation_ta' : 'explanation_en';
  const explanation = question[expKey] || question.explanation_en;

  // Check dependencies
  if (!isQuestionVisible(question, formValues)) return null;

  const getOptions = () => {
    if (!question.options_json) return [];
    const opts = question.options_json[language] || question.options_json['en'];
    return opts || [];
  };

  const key = question.field_key;
  const val = formValues[key] || '';
  const set = (v: string) => handleInputChange(key, v);

  /* Option lists are authored as "1. Label"; the stored value is the numeric
     prefix, which is also what `depends_on` matches against. */
  const opts = getOptions().map((opt: string) => ({ value: opt.split('.')[0], label: opt }));

  const renderInput = () => {
    switch (question.type) {
      case 'text':
      case 'email':
      case 'tel':
        return <SText value={val} onChange={set} type={question.type} inputMode={question.type === 'tel' ? 'tel' : undefined} />;
      case 'number':
        return <SText value={val} onChange={set} type="number" inputMode="numeric" />;
      case 'textarea':
        return <SText value={val} onChange={set} multiline rows={3} />;
      case 'select':
        return <SDropdown value={val} onChange={set} options={opts} />;
      case 'multiselect':
        return <ChipMultiSelect value={val} onChange={set} options={opts} />;
      default:
        return null;
    }
  };

  return (
    <QuestionField
      id={key}
      required={required}
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
          {label}
          {explanation ? (
            <Tooltip title={explanation} arrow placement="top">
              <IconButton size="small" sx={{ color: T.faint, p: 0.25 }} aria-label="More information">
                <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      }
    >
      {question.explanation_image_url ? (
        <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', justifyContent: 'center', p: 1 }}>
          <img src={question.explanation_image_url} alt="Example" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} />
        </Box>
      ) : null}
      {renderInput()}
    </QuestionField>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const IndustrySurveyPage: React.FC = () => {
  const { isAuthenticated, login, isLoading, userInfo, token } = useAuth();
  const { language } = useLanguage();
  const { gnName, ccode } = useParams<{ gnName?: string, ccode?: string }>();
  const navigate = useNavigate();
  const locationState = useLocation().state as { fromSelector?: boolean };
  // The name is collected on the GN panel and stored in a cookie. It is the
  // surveyor identity for this public survey, independent of login details.
  const surveyorName = getUserName()?.trim() || 'Unknown';

  const { data, loading, error } = useQuery(GET_QUESTIONS, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: gnData, loading: gnLoading } = useQuery(GET_GN_BY_CCODE, {
    variables: { CCODE: ccode },
    skip: !ccode,
  });

  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [duplicatePromptOpen, setDuplicatePromptOpen] = useState(false);
  const [otpRequiredAlertOpen, setOtpRequiredAlertOpen] = useState(false);

  useEffect(() => {
    const checkUserSurveys = async () => {
      if (!token) return;
      
      const forceNew = localStorage.getItem('force_new_submission');
      if (forceNew) {
        return;
      }

      const draftStr = ccode ? localStorage.getItem(`survey_draft_${ccode}`) : null;
      if (draftStr) return; 

      try {
        const res = await fetch('/api/my-industry-surveys', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setDuplicatePromptOpen(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkUserSurveys();
  }, [token, ccode]);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Business category search
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [fetchCategories, { data: catData, loading: catLoading }] = useLazyQuery(GET_CATEGORIES_BY_ROOT_SLUG, {
    fetchPolicy: 'cache-first',
  });
  // This survey's business-type list is the PDF-derived classification set.
  // Its source "අංකය" values are preserved as dotted numeric slugs.
  const businessCategories: any[] = (catData?.categoriesByRootSlug || []).filter(
    (category: any) => category.slug?.startsWith('1.3.4.'),
  );

  // Load categories once auth is ready
  useEffect(() => {
    if (!isLoading) {
      fetchCategories({ variables: { rootSlug: 'location-1-4' } });
    }
  }, [isLoading]);

  // Restore selectedCategory from saved formValues when categories load
  useEffect(() => {
    if (businessCategories.length > 0 && formValues['b_type'] && !selectedCategory) {
      const saved = businessCategories.find((c: any) => c.slug === formValues['b_type']);
      if (saved) setSelectedCategory(saved);
    }
  }, [businessCategories, formValues['b_type']]);

  // Auto-generate registration number when ccode + category are both available and b_reg_no not yet set
  useEffect(() => {
    if (!ccode || !selectedCategory?.slug || formValues['b_reg_no']) return;
    let cancelled = false;
    fetch('/api/industry-survey/generate-reg-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ccode, category_slug: selectedCategory.slug }),
    })
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.reg_number) {
          setFormValues(prev => ({ ...prev, b_reg_no: data.reg_number }));
        }
      })
      .catch(() => { }); // silent fail — user can type manually
    return () => { cancelled = true; };
  }, [ccode, selectedCategory?.slug]);


  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [loadingDynamicQuestions, setLoadingDynamicQuestions] = useState(true);

  useEffect(() => {
    fetch('/api/business-survey-questions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDynamicQuestions(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDynamicQuestions(false));
  }, []);

  const getDynamicLabel = (key: string, defaultEn: string, defaultSi: string, defaultTa: string) => {
    const q = dynamicQuestions.find(q => q.field_key === key);
    if (!q) return language === 'si' ? defaultSi : language === 'ta' ? defaultTa : defaultEn;
    return language === 'si' ? q.question_si : language === 'ta' ? q.question_ta : q.question_en;
  };

  const getDynamicExplanation = (key: string, defaultEn?: string, defaultSi?: string, defaultTa?: string) => {
    const q = dynamicQuestions.find(q => q.field_key === key);
    if (!q) return language === 'si' ? defaultSi : language === 'ta' ? defaultTa : defaultEn;
    return language === 'si' ? q.explanation_si : language === 'ta' ? q.explanation_ta : q.explanation_en;
  };

  /* Titles for the DB-driven steps live in surveySteps.ts so the admin builder
     and this page can never disagree about what a step is called. */
  const stepTitles: Record<number, any> = DYNAMIC_STEP_TITLES;

  /* ── Localisation helper ─────────────────────────────────────────────────── */
  const L = React.useCallback(
    (en: string, si: string, ta?: string) => (language === 'si' ? si : language === 'ta' ? (ta || en) : en),
    [language],
  );

  /* ── Section metadata for the sticky progress header ─────────────────────── */
  const SECTIONS: SurveySection[] = React.useMemo(() => {
    const t = (i: number, en: string, si: string, ta: string) => {
      const fromTitles = stepTitles[i];
      return fromTitles ? (language === 'si' ? fromTitles.si : language === 'ta' ? fromTitles.ta : fromTitles.en) : L(en, si, ta);
    };
    return [
      { icon: <StorefrontOutlinedIcon />, title: t(0, 'Basic Information', 'මූලික තොරතුරු', 'அடிப்படை தகவல்கள்'), short: L('Basics', 'මූලික', 'அடிப்படை') },
      { icon: <PersonOutlineRoundedIcon />, title: t(1, 'Business Owner', 'ව්‍යාපාර හිමිකරු', 'வணிக உரிமையாளர்'), short: L('Owner', 'හිමිකරු', 'உரிமையாளர்') },
      { icon: <GavelRoundedIcon />, title: t(2, 'Legal Status', 'නීතිමය තත්ත්වය', 'சட்ட நிலை'), short: L('Legal', 'නීතිය', 'சட்டம்') },
      { icon: <PlaceOutlinedIcon />, title: t(3, 'Location & Infrastructure', 'ස්ථානය හා යටිතල පහසුකම්', 'இடம் & உள்கட்டமைப்பு'), short: L('Location', 'ස්ථානය', 'இடம்') },
      { icon: <BoltOutlinedIcon />, title: t(4, 'Infrastructure & Services', 'යටිතල පහසුකම් හා සේවා', 'உள்கட்டமைப்பு & சேவைகள்'), short: L('Utilities', 'සේවා', 'சேவைகள்') },
      { icon: <SavingsOutlinedIcon />, title: t(5, 'Capital Sources', 'ප්‍රාග්ධන මූලාශ්‍ර', 'மூலதன ஆதாரங்கள்'), short: L('Capital', 'ප්‍රාග්ධන', 'மூலதனம்') },
      { icon: <GroupsOutlinedIcon />, title: t(6, 'Workforce', 'ශ්‍රම බලකාය', 'பணியாளர்கள்'), short: L('Workforce', 'ශ්‍රමය', 'பணியாளர்') },
      { icon: <PrecisionManufacturingOutlinedIcon />, title: t(7, 'Production & Operations', 'නිෂ්පාදනය හා මෙහෙයුම්', 'உற்பத்தி & செயல்பாடுகள்'), short: L('Production', 'නිෂ්පාදන', 'உற்பத்தி') },
      { icon: <PaymentsOutlinedIcon />, title: t(8, 'Finance & Accounting', 'මූල්‍ය හා ගිණුම්කරණය', 'நிதி & கணக்கியல்'), short: L('Finance', 'මූල්‍ය', 'நிதி') },
      { icon: <CampaignOutlinedIcon />, title: L('Market & Marketing', 'වෙළඳපොළ හා අලෙවිකරණය', 'சந்தை & சந்தைப்படுத்தல்'), short: L('Market', 'වෙළඳපොළ', 'சந்தை') },
      { icon: <LightbulbOutlinedIcon />, title: L('Innovation & Technology', 'නවෝත්පාදන හා තාක්ෂණය', 'புதுமை & தொழில்நுட்பம்'), short: L('Innovation', 'නවෝත්පාදන', 'புதுமை') },
      { icon: <PolicyOutlinedIcon />, title: L('Business Environment & Government', 'ව්‍යාපාරික පරිසරය හා රාජ්‍ය මැදිහත්වීම', 'வணிகச் சூழல் & அரசு'), short: L('Environment', 'පරිසරය', 'சூழல்') },
      { icon: <ParkOutlinedIcon />, title: L('Environmental & Social Impact', 'පාරිසරික හා සමාජීය බලපෑම', 'சுற்றுச்சூழல் & சமூக தாக்கம்'), short: L('Impact', 'බලපෑම', 'தாக்கம்') },
      { icon: <RocketLaunchOutlinedIcon />, title: L('Future Needs & Logistics', 'අනාගත අවශ්‍යතා සහ ලොජිස්ටික්ස්', 'எதிர்கால தேவைகள் & தளவாடங்கள்'), short: L('Future', 'අනාගත', 'எதிர்காலம்') },
    ];
  }, [language, L, dynamicQuestions]);

  /* ── Validation state ────────────────────────────────────────────────────── */
  const [showErr, setShowErr] = useState(false);
  const [maxReached, setMaxReached] = useState(0);

  /** Field keys currently rendered on a DB-driven step (after depends_on). */
  const visibleDynamicKeys = React.useCallback(
    (step: number): string[] =>
      dynamicQuestions
        .filter(q => q.step_index === step && isQuestionVisible(q, formValues))
        .map(q => q.field_key),
    [dynamicQuestions, formValues],
  );

  const dynamicKeysByStep = React.useMemo(() => {
    const map: Record<number, string[]> = {};
    for (let s = 0; s < TOTAL_STEPS; s++) if (isDynamicStep(s)) map[s] = visibleDynamicKeys(s);
    return map;
  }, [visibleDynamicKeys]);

  const stepErrors = React.useMemo(
    () => getStepErrors(currentStep, formValues, L, isDynamicStep(currentStep) ? visibleDynamicKeys(currentStep) : undefined),
    [currentStep, formValues, L, visibleDynamicKeys],
  );
  const errorCount = Object.keys(stepErrors).length;

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-invalid="true"], [data-sk-invalid="true"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  /**
   * Submit gate: sweep every section, and if any is incomplete jump the user to
   * the first offending one with its errors revealed, rather than letting the
   * confirm dialog open over an invalid form.
   */
  const handleAttemptSubmit = () => {
    const bad = getFirstInvalidStep(formValues, L, dynamicKeysByStep);
    if (bad >= 0) {
      setShowErr(true);
      if (bad !== currentStep) {
        setCurrentStep(bad);
        setMaxReached(prev => Math.max(prev, bad));
      }
      scrollToFirstError();
      return;
    }
    setShowErr(false);
    setSubmitDialogOpen(true);
  };

  const goToStep = (next: number) => {
    setShowErr(false);
    setCurrentStep(next);
    setMaxReached(prev => Math.max(prev, next));
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  /** Advance only when the current section validates; otherwise reveal errors. */
  const goNext = (next: number, before?: () => void) => {
    if (errorCount > 0) {
      setShowErr(true);
      scrollToFirstError();
      return;
    }
    if (currentStep === 0 && !isMobileVerified) {
      setGenericAlertPopup({
        open: true,
        title: language === 'si' ? 'අවධානයයි' : 'Attention',
        message: language === 'si' ? 'කරුණාකර මොබයිල් අංකය තහවුරු කරන්න (Verify Mobile Number).' : 'Please verify your mobile number (OTP) before proceeding.'
      });
      return;
    }
    before?.();
    goToStep(next);
    
    // Auto-sync draft to backend silently on step progression
    if (next > 0) {
      handleSaveDraft(false, next);
    }
  };

  const goPrev = (prev: number) => goToStep(prev);

  /* Keep the furthest-reached marker in step with a restored draft. */
  useEffect(() => { setMaxReached(prev => Math.max(prev, currentStep)); }, [currentStep]);

  const renderDynamicStep = (stepIndex: number) => {
    const stepQuestions = dynamicQuestions.filter(q => q.step_index === stepIndex).sort((a, b) => a.sort_order - b.sort_order);

    if (stepQuestions.length === 0) {
      if (loadingDynamicQuestions) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
      }
      return <Typography>No questions found for this step.</Typography>;
    }

    const titleObj = stepTitles[stepIndex];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {titleObj && (
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, pb: 1.25, mb: 0.5, borderBottom: `1px solid ${T.lineSoft}` }}>
            {language === 'si' ? titleObj.si : language === 'ta' ? titleObj.ta : titleObj.en}
          </Typography>
        )}
        {stepQuestions.map(q => (
          <DynamicQuestionRenderer
            key={q.field_key}
            question={q}
            language={language}
            formValues={formValues}
            handleInputChange={handleInputChange}
            required={requiredIds.has(q.field_key)}
          />
        ))}
        {/* Steps 2..TOTAL_STEPS-2 chain to the next dynamic/hardcoded step;
            the last step (TOTAL_STEPS-1) must submit instead of advancing to a
            step that doesn't exist. */}
        {stepIndex === TOTAL_STEPS - 1
          ? <StepNav prev={stepIndex - 1} submit />
          : <StepNav prev={stepIndex - 1} next={stepIndex + 1} />}
      </Box>
    );
  };


  const [isMobileVerified, setIsMobileVerified] = useState(false);
  // Single-use proof issued by /api/otp/verify, bound to the specific mobile
  // number that was verified. The backend requires and consumes this at final
  // submission — without it, "Verified" was purely a client-side checkmark
  // that nothing on the server ever looked at.
  const [mobileVerificationToken, setMobileVerificationToken] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [submitSuccessData, setSubmitSuccessData] = useState<{ startTime: string, endTime: string, regNumber: string } | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showMetadataPopup, setShowMetadataPopup] = useState(false);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [saveDraftDialogOpen, setSaveDraftDialogOpen] = useState(false);
  const [showGpsPopup, setShowGpsPopup] = useState(false);
  const [gpsErrorPopup, setGpsErrorPopup] = useState<string | null>(null);
  const [surveyStartTime, setSurveyStartTime] = useState<Date | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number, lng: number } | null>(null);
  const [gpsChecking, setGpsChecking] = useState(false);
  const [gpsWrongLocationPopup, setGpsWrongLocationPopup] = useState<{ lat: number, lng: number } | null>(null);
  const [genericAlertPopup, setGenericAlertPopup] = useState<{ open: boolean, title: string, message: string } | null>(null);

  // Universal draft key works with or without ccode
  const draftKey = ccode ? `survey_draft_${ccode}` : `survey_draft_user_${userInfo?.sub || 'anon'}`;

  useEffect(() => {
    const forceNew = localStorage.getItem('force_new_submission');
    if (forceNew) {
      localStorage.removeItem('force_new_submission');
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`${draftKey}_db_id`);
    }

    // On route change: check for existing draft and silently resume
    const draftStr = localStorage.getItem(draftKey);
    if (draftStr && !forceNew) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft.formValues && Object.keys(draft.formValues).length > 0) {
          setFormValues(draft.formValues);
          if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
          if (draft.gpsCoordinates) setGpsCoordinates(draft.gpsCoordinates);
          if (draft.surveyStartTime) setSurveyStartTime(new Date(draft.surveyStartTime));
          // Skip all popups, go straight to form
          setLocationConfirmed(true);
          setShowLocationSelector(false);
          return;
        }
      } catch { }
    }

    // No draft — normal flow
    setFormValues({});
    setCurrentStep(0);
    setSurveyStartTime(null);
    setShowMetadataPopup(false);
    setShowResumePopup(false);
    setShowGpsPopup(false);
    setGpsCoordinates(null);

    if (!ccode) {
      setShowLocationSelector(true);
      setLocationConfirmed(false);
    } else if (gnName && ccode) {
      localStorage.setItem('last_gn_url', `/gnpage/${encodeURIComponent(gnName)}/${encodeURIComponent(ccode)}`);
      if (locationState?.fromSelector) {
        setLocationConfirmed(true);
        setShowMetadataPopup(true);
      } else {
        setLocationConfirmed(false);
      }
    }
  }, [ccode, gnName, locationState]);

  // Auto-save draft on every change
  useEffect(() => {
    if (Object.keys(formValues).length > 0 || currentStep > 0) {
      localStorage.setItem(draftKey, JSON.stringify({
        formValues,
        currentStep,
        surveyStartTime: surveyStartTime?.toISOString() || new Date().toISOString(),
        gpsCoordinates,
      }));
    }
  }, [formValues, currentStep, surveyStartTime, gpsCoordinates, draftKey]);

  /**
   * POST the given payload to /api/industry-survey. If the server reports the
   * `id` we sent no longer exists or isn't ours (404/403 — e.g. localStorage
   * points at a row that was deleted, or was left over from a different
   * account on a shared computer), clear the stale local reference and retry
   * exactly once as a fresh save rather than getting permanently stuck
   * resubmitting against a dead ID.
   */
  const saveSurvey = async (payload: Record<string, any>, retrying = false): Promise<Response> => {
    const res = await fetch('/api/industry-survey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!retrying && (res.status === 404 || res.status === 403) && payload.id) {
      localStorage.removeItem(`${draftKey}_db_id`);
      const { id, ...retryPayload } = payload;
      return saveSurvey(retryPayload, true);
    }

    return res;
  };

  const handleSaveDraft = async (showPopup = true, stepOverride?: number) => {
    const stepToSave = stepOverride !== undefined ? stepOverride : currentStep;
    const draftData = {
      formValues,
      currentStep: stepToSave,
      surveyStartTime: surveyStartTime?.toISOString() || new Date().toISOString(),
      gpsCoordinates,
    };

    // Save to local storage for instant resume
    localStorage.setItem(draftKey, JSON.stringify(draftData));

    // Sync draft to backend
    try {
      const existingId = localStorage.getItem(`${draftKey}_db_id`);
      const payload: any = {
        ccode: ccode || 'unknown',
        district: gnData?.gnByCcode?.disEn,
        ds_division: gnData?.gnByCcode?.dsEn,
        gn_name: gnData?.gnByCcode?.nameEn,
        latitude: gpsCoordinates?.lat,
        longitude: gpsCoordinates?.lng,
        form_data: draftData,
        status: 'draft',
      };
      if (existingId) {
        payload.id = parseInt(existingId, 10);
      }

      const res = await saveSurvey(payload);

      if (res.ok) {
        const data = await res.json();
        if (data.survey?.id) {
          localStorage.setItem(`${draftKey}_db_id`, data.survey.id.toString());
        }
      } else {
        // The draft is already safe in localStorage regardless (that write
        // happened above, unconditionally) — this is only the cross-device
        // backend sync, so warn rather than silently discarding the failure
        // as the previous code did (any non-2xx response was just ignored).
        const body = await res.json().catch(() => null);
        const reason = body?.error && typeof body.error === 'string' ? body.error : null;
        console.warn('Draft saved locally but backend sync failed:', reason || res.status);
        if (showPopup) {
          alert(
            language === 'si'
              ? `ෆෝරමය ඔබගේ උපාංගයේ සුරැකිණි, නමුත් සර්වරයට යැවීමට අසමත් විය.${reason ? ` (${reason})` : ''}`
              : `Saved on this device, but syncing to the server failed.${reason ? ` (${reason})` : ''}`
          );
        }
      }
    } catch (err) {
      console.error('Failed to sync draft to server', err);
    }

    if (showPopup) {
      setSaveDraftDialogOpen(true);
    }
  };

  const questions = data?.questions || [];

  /**
   * Fields that error on an empty form are, by definition, the required ones —
   * so the asterisk is derived from the validation rules rather than duplicated
   * by hand, and the two can never fall out of sync.
   */
  const requiredIds = React.useMemo(
    () => new Set(Object.keys(getStepErrors(currentStep, {}, L, dynamicKeysByStep[currentStep]))),
    [currentStep, L, dynamicKeysByStep],
  );

  /**
   * Label for the hardcoded steps. Renders the kit's label treatment, the
   * required marker and the inline validation message, and tags itself with
   * `data-sk-invalid` so the sibling control is painted red by the form-level
   * style block. The message sits between label and control on purpose — it is
   * announced before the user reaches the input.
   */
  const QuestionLabel = ({ text, fieldKey }: { text: string, fieldKey?: string }) => {
    const { show, errors } = React.useContext(SurveyErrorContext);
    const message = fieldKey && show ? errors[fieldKey] : undefined;
    const required = !!fieldKey && requiredIds.has(fieldKey);

    const dq = fieldKey ? dynamicQuestions.find((q: any) => q.field_key === fieldKey) : null;
    const q = questions.find((q: any) => q.questionTextEn === text || q.questionTextSi === text || q.questionTextTa === text);
    let explanation = '';
    if (dq) {
      const exp = language === 'si' ? dq.explanation_si : language === 'ta' ? dq.explanation_ta : dq.explanation_en;
      if (exp) explanation = exp;
    } else if (q) {
      const exp = language === 'si' ? q.explanationSi : language === 'ta' ? q.explanationTa : q.explanationEn;
      if (exp) explanation = exp;
    }

    return (
      <Box
        id={fieldKey}
        data-sk-invalid={message ? 'true' : undefined}
        sx={{ scrollMarginTop: 140 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: message ? 0.5 : 1 }}>
          <Typography
            component="label"
            sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' }, fontWeight: 700, color: T.ink, lineHeight: 1.4 }}
          >
            {text}
            {required ? <Box component="span" sx={{ color: T.danger, ml: 0.4 }}>*</Box> : null}
          </Typography>
          {explanation ? (
            <Tooltip title={explanation} arrow placement="top">
              <IconButton size="small" sx={{ p: 0.25, color: T.faint }} aria-label="More information">
                <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
        {message ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: T.danger, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.danger, lineHeight: 1.4 }}>{message}</Typography>
          </Box>
        ) : null}
      </Box>
    );
  };

  /**
   * Section footer: Previous / Next (or Submit) + Save draft.
   * Replaces the per-step button blocks, which mixed a `space-between` row with
   * a full-width third button and so laid out inconsistently between steps.
   */
  /* Shared surface for every dialog on the page, so the modals read as part of
     the same system as the form card rather than default MUI paper. */
  const dialogPaperProps = {
    sx: {
      borderRadius: `${T.radius}px`,
      border: `1px solid ${T.line}`,
      boxShadow: '0 24px 64px rgba(15,23,42,0.18)',

      /* Phones: near-full-bleed with a small inset, and `dvh` so the sheet is
         not cut off by mobile browser chrome. */
      m: { xs: 1.5, sm: 4 },
      width: { xs: 'calc(100% - 24px)', sm: 'auto' },
      maxWidth: { xs: 'calc(100% - 24px)', sm: undefined },
      maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100% - 64px)' },

      '& .MuiDialogTitle-root': {
        fontWeight: 800, color: T.ink, letterSpacing: '-0.01em',
        fontSize: { xs: '1.05rem', sm: '1.25rem' },
        px: { xs: 2, sm: 3 },
      },
      '& .MuiDialogContent-root': { px: { xs: 2, sm: 3 } },

      /* Actions stack on phones so each button keeps a full-width, 48px target
         instead of three cramped buttons fighting for one row. */
      '& .MuiDialogActions-root': {
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1,
        px: { xs: 2, sm: 3 },
        pb: { xs: 'calc(16px + env(safe-area-inset-bottom, 0px))', sm: 2 },
        '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
      },
      '& .MuiButton-root': {
        borderRadius: `${T.field}px`, textTransform: 'none', fontWeight: 700,
        minHeight: { xs: 48, sm: 40 },
        width: { xs: '100%', sm: 'auto' },
      },
      '& .MuiOutlinedInput-root': { borderRadius: `${T.field}px` },
    },
  };

  const StepNav = ({ prev, next, submit, before }: { prev?: number; next?: number; submit?: boolean; before?: () => void }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1 }}>
      {showErr && errorCount > 0 && (
        <Box
          role="alert"
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: `${T.field}px`, px: 1.75, py: 1.25,
            animation: 'sk-shake .4s ease',
          }}
        >
          <ErrorOutlineRoundedIcon sx={{ color: T.danger, fontSize: '1.15rem' }} />
          <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: '#991b1b' }}>
            {errorCount === 1
              ? L('1 question needs your attention', 'ප්‍රශ්න 1ක් නිවැරදි කරන්න', '1 கேள்வியை சரிபார்க்கவும்')
              : L(`${errorCount} questions need your attention`, `ප්‍රශ්න ${errorCount}ක් නිවැරදි කරන්න`, `${errorCount} கேள்விகளை சரிபார்க்கவும்`)}
          </Typography>
        </Box>
      )}

      {/* 8px gap and a 48px minimum keep both controls comfortably tappable */}
      <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.25 } }}>
        {prev !== undefined && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => goPrev(prev)}
            sx={{
              flex: { xs: '0 0 auto', sm: '0 0 auto' },
              minWidth: { xs: 108, sm: 150 },
              minHeight: { xs: 48, sm: 46 },
              px: { xs: 1.5, sm: 3 },
              borderRadius: `${T.field}px`, textTransform: 'none', fontWeight: 700,
              fontSize: { xs: '0.88rem', sm: '0.92rem' },
              color: T.body, borderColor: T.line, bgcolor: '#fff',
              WebkitTapHighlightColor: 'transparent',
              '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
              '&:active': { bgcolor: T.brandSoft },
              '@media (hover: hover)': { '&:hover': { borderColor: T.brand, color: T.brand, bgcolor: T.brandSoft } },
            }}
          >
            {L('Previous', 'පෙර', 'முந்தைய')}
          </Button>
        )}
        <Button
          type="button"
          variant="contained"
          disableElevation
          endIcon={submit ? <CheckCircleRoundedIcon /> : <ArrowForwardRoundedIcon />}
          onClick={() => (submit ? handleAttemptSubmit() : next !== undefined && goNext(next, before))}
          sx={{
            flex: 1, minWidth: 0,
            minHeight: { xs: 48, sm: 46 },
            borderRadius: `${T.field}px`, textTransform: 'none',
            fontWeight: 800, fontSize: { xs: '0.92rem', sm: '0.95rem' },
            px: { xs: 1.5, sm: 2 },
            background: submit
              ? `linear-gradient(135deg, ${T.accent} 0%, #047857 100%)`
              : `linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`,
            boxShadow: submit ? '0 8px 20px rgba(5,150,105,0.28)' : '0 8px 20px rgba(37,99,235,0.26)',
            WebkitTapHighlightColor: 'transparent',
            '& .MuiButton-label, & span': { minWidth: 0 },
            '&:active': { filter: 'brightness(0.96)' },
            '@media (hover: hover)': { '&:hover': { filter: 'brightness(1.06)' } },
          }}
        >
          {submit ? L('Review & Submit', 'සමාලෝචනය කර ඉදිරිපත් කරන්න', 'மதிப்பாய்வு & சமர்ப்பி') : L('Next', 'ඊළඟ', 'அடுத்தது')}
        </Button>
      </Box>

      <Button
        variant="text"
        startIcon={<BookmarkAddOutlinedIcon />}
        onClick={handleSaveDraft}
        sx={{
          alignSelf: 'center', textTransform: 'none', fontWeight: 700,
          minHeight: 44, px: 2,
          fontSize: '0.84rem', color: T.muted, borderRadius: `${T.field}px`,
          WebkitTapHighlightColor: 'transparent',
          '&:active': { bgcolor: T.brandSoft },
          '@media (hover: hover)': { '&:hover': { color: T.brand, bgcolor: T.brandSoft } },
        }}
      >
        {L('Save & continue later', 'සුරකින්න හා පසුව දිගටම කරන්න', 'சேமித்து பින்னர் தொடரவும்')}
      </Button>

      <Dialog PaperProps={dialogPaperProps} open={duplicatePromptOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleRoundedIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            {language === 'si' ? 'ඔබට දැනටමත් ගිණුමක් ඇත' : 'You Already Have a Submission'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            {language === 'si' 
              ? 'ඔබ දැනටමත් සමීක්ෂණයක් සම්පූර්ණ කර ඇත. ඔබට තවත් ව්‍යාපාරයක් සඳහා නව සමීක්ෂණයක් ආරම්භ කිරීමට අවශ්‍යද?'
              : 'You have already submitted a survey or have one in progress. Do you need to add another business?'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setDuplicatePromptOpen(false);
              navigate('/fill-data');
            }}
            variant="outlined"
            color="inherit"
          >
            {language === 'si' ? 'නැත, මගේ උපකරණ පුවරුවට යන්න' : 'No, go to Dashboard'}
          </Button>
          <Button 
            onClick={() => setDuplicatePromptOpen(false)} 
            variant="contained" 
            color="primary"
          >
            {language === 'si' ? 'ඔව්, නව සමීක්ෂණයක් ආරම්භ කරන්න' : 'Yes, add another one'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog PaperProps={dialogPaperProps} open={otpRequiredAlertOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
          <ErrorOutlineRoundedIcon />
          <Typography variant="h6" fontWeight="bold">
            {language === 'si' ? 'අවධානයයි' : 'Attention'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            {language === 'si' 
              ? 'ඉදිරිපත් කිරීමට පෙර ඔබගේ දුරකථන අංකය තහවුරු කරන්න.' 
              : 'Please verify your mobile number (OTP) before submitting.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setOtpRequiredAlertOpen(false);
              setCurrentStep(0);
            }} 
            variant="contained" 
            color="primary"
          >
            {language === 'si' ? 'හරි' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const handleSendOtp = async () => {
    const mobile = formValues['b_mobile'];
    if (!mobile) {
      setGenericAlertPopup({ open: true, title: language === 'si' ? 'අවධානයයි' : 'Attention', message: language === 'si' ? 'කරුණාකර මොබයිල් අංකය ඇතුළත් කරන්න' : 'Please enter a mobile number first.' });
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpDialogOpen(true);
      } else if (res.status === 429) {
        setGenericAlertPopup({ open: true, title: language === 'si' ? 'අවධානයයි' : 'Attention', message: language === 'si' ? 'කරුණාකර මොහොතක් රැඳී නැවත උත්සාහ කරන්න' : 'Please wait a moment before requesting another code.' });
      } else {
        setGenericAlertPopup({ open: true, title: language === 'si' ? 'දෝෂයකි' : 'Error', message: language === 'si' ? 'අසාර්ථකයි' : 'Failed' });
      }
    } catch {
      setGenericAlertPopup({ open: true, title: language === 'si' ? 'දෝෂයකි' : 'Error', message: language === 'si' ? 'දෝෂයක් ඇතිවිය' : 'Error' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const mobile = formValues['b_mobile'];
    setOtpVerifying(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ mobile, code: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsMobileVerified(true);
        setMobileVerificationToken(data.verification_token ?? null);
        setOtpDialogOpen(false);
        setGenericAlertPopup({ open: true, title: language === 'si' ? 'සාර්ථකයි' : 'Success', message: language === 'si' ? 'සාර්ථකයි' : 'Success' });
      } else {
        setGenericAlertPopup({ open: true, title: language === 'si' ? 'අවධානයයි' : 'Attention', message: language === 'si' ? 'වැරදි කේතයකි' : 'Invalid OTP' });
      }
    } catch {
      setGenericAlertPopup({ open: true, title: language === 'si' ? 'දෝෂයකි' : 'Error', message: language === 'si' ? 'දෝෂයක් ඇතිවිය' : 'Error' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endTime = new Date();
    const existingId = localStorage.getItem(`${draftKey}_db_id`);
    const regNumber = formValues['b_reg_no'] || '';
    const payload: any = {
      ccode: ccode || 'unknown',
      district: gnData?.gnByCcode?.disEn,
      ds_division: gnData?.gnByCcode?.dsEn,
      gn_name: gnData?.gnByCcode?.nameEn,
      latitude: gpsCoordinates?.lat,
      longitude: gpsCoordinates?.lng,
      status: 'submitted',
      // Nested under `formValues`, matching handleSaveDraft's shape exactly —
      // this used to spread formValues directly at the top level here while
      // the draft path nested it, so a submitted row's answers lived at a
      // different JSON path than a draft's. Any consumer of form_data (the
      // registration-number query, an admin export, a future report) had to
      // either handle both shapes forever or silently miss one of them.
      form_data: {
        formValues: { ...formValues, b_reg_no: regNumber },
        currentStep,
        surveyStartTime: surveyStartTime?.toISOString(),
        gpsCoordinates,
        survey_metadata: {
          date: new Date().toISOString(),
          surveyor: surveyorName,
          startTime: surveyStartTime?.toISOString(),
          endTime: endTime.toISOString(),
        },
      },
      mobile_verification_token: mobileVerificationToken,
    };
    if (existingId) {
      payload.id = parseInt(existingId, 10);
    }

    try {
      const response = await saveSurvey(payload);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const reason = body?.error && typeof body.error === 'string' ? body.error : null;
        if (response.status === 422 && reason?.toLowerCase().includes('verif')) {
          setOtpRequiredAlertOpen(true);
        } else if (response.status === 403) {
          alert(language === 'si'
            ? 'මෙම සමීක්ෂණය සංස්කරණය කිරීමට ඔබට අවසර නැත.'
            : 'You do not have permission to modify this survey.');
        } else if (response.status === 409) {
          alert(language === 'si'
            ? 'මෙම සමීක්ෂණය දැනටමත් අනුමත කර ඇති බැවින් වෙනස් කළ නොහැක.'
            : 'This survey has already been approved and can no longer be modified.');
        } else if (response.status === 401) {
          alert(language === 'si'
            ? 'ඔබගේ සැසිය කල් ඉකුත් වී ඇත. කරුණාකර නැවත පිවිසෙන්න.'
            : 'Your session has expired. Please log in again.');
        } else {
          alert(language === 'si'
            ? `සමීක්ෂණය ඉදිරිපත් කිරීමට අසමත් විය.${reason ? ` (${reason})` : ''}`
            : `Failed to submit the survey.${reason ? ` (${reason})` : ''} Please try again.`);
        }
        return;
      }

      setSubmitSuccessData({
        startTime: surveyStartTime?.toLocaleTimeString() || '',
        endTime: endTime.toLocaleTimeString(),
        regNumber,
      });
      setSuccessDialogOpen(true);

      localStorage.removeItem(draftKey);
      localStorage.removeItem(`${draftKey}_db_id`);
    } catch (error) {
      console.error('Submission error:', error);
      alert(language === 'si' ? 'දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.' : 'Failed to submit the survey. Please try again.');
    }
  };

  const title = {
    en: 'Industry and Business Survey Questionnaire',
    si: 'කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණ ප්‍රශ්නාවලිය',
    ta: 'தொழில் மற்றும் வணிக ஆய்வு கேள்வித்தாள்',
  }[language] || 'Industry and Business Survey Questionnaire';

  const subtitle = {
    en: 'Note: This survey covers all production, services, sales, industries and business establishments within the Grama Niladhari Division. Please answer all questions. Mark "Not Applicable" for irrelevant questions.',
    si: 'සටහන: මෙම සමීක්ෂණය ග්‍රාම නිලධාරි වසම තුළ ඇති සියලුම නිෂ්පාදන, සේවා, විකුණුම්, කර්මාන්ත හා ව්‍යාපාර ආයතන ආවරණය කරයි. කරුණාකර සියලු ප්‍රශ්නවලට පිළිතුරු සපයන්න. අදාළ නොවන ප්‍රශ්න සඳහා "අදාළ නොවේ" ලෙස සලකුණු කරන්න.',
    ta: 'குறிப்பு: இந்த கணக்கெடுப்பு கிராம உத்தியோகத்தர் பிரிவுக்குள் உள்ள அனைத்து உற்பத்தி, சேவைகள், விற்பனை, தொழில்கள் மற்றும் வணிக நிறுவனங்களை உள்ளடக்கியது. அனைத்து கேள்விகளுக்கும் பதிலளிக்கவும். பொருத்தமற்ற கேள்விகளுக்கு "பொருந்தாது" என்று குறிக்கவும்.',
  }[language] || 'Note: This survey covers all production, services, sales, industries and business establishments within the Grama Niladhari Division. Please answer all questions. Mark "Not Applicable" for irrelevant questions.';


  const mockDistricts = gnData?.gnByCcode ? [{ id: 'mock-dist', nameEn: gnData.gnByCcode.disEn }] : [];
  const mockDs = gnData?.gnByCcode ? [{ divisionalSecretariatCode: 'mock-ds', dsEn: gnData.gnByCcode.dsEn }] : [];
  const mockGns = gnData?.gnByCcode ? [{ id: ccode, CCODE: ccode, nameEn: gnData.gnByCcode.nameEn }] : [];

  return (
    <Box>
      <GnTopHeaderBar
        districts={mockDistricts}
        selectedDistrict={mockDistricts.length ? 'mock-dist' : ''}
        dsDivisions={mockDs}
        selectedCity={mockDs.length ? 'mock-ds' : ''}
        gramaNiladharis={mockGns}
        selectedGN={mockGns.length ? ccode : ''}
        {...{ activeCcode: ccode, activeGnObj: gnName ? { nameEn: gnName } : null }}
        userName={getUserName() || ''}
      />

      <SurveyKeyframes />

      {surveyStartTime && !showGpsPopup && (
        <Box
          sx={{
            background: `linear-gradient(180deg, ${T.canvasTop} 0%, ${T.canvasBottom} 100%)`,
            pt: { xs: 2, sm: 5 },
            /* Clear the gesture-nav home indicator on phones. */
            pb: { xs: 'calc(24px + env(safe-area-inset-bottom, 0px))', sm: 5 },
            /* Nothing inside the survey may widen the page. */
            overflowX: 'hidden',
          }}
        >
          <Container maxWidth="md" sx={{ px: { xs: 1.5, sm: 3 }, minWidth: 0 }}>

            {/* Intro */}
            <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 3.5 }, animation: 'sk-rise .4s ease both' }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 800,
                  color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.2, mb: 1,
                }}
              >
                {title}
              </Typography>
              <Typography sx={{ fontSize: { xs: '0.82rem', sm: '0.88rem' }, color: T.muted, lineHeight: 1.6, maxWidth: 640, mx: 'auto' }}>
                {subtitle}
              </Typography>
            </Box>

            {/* Survey card */}
            <Box
              sx={{
                bgcolor: T.surface,
                borderRadius: `${T.radius}px`,
                border: `1px solid ${T.line}`,
                boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.06)',
                overflow: 'hidden',
              }}
            >
              <SurveyProgress
                sections={SECTIONS}
                current={Math.min(currentStep, SECTIONS.length - 1)}
                maxReached={maxReached}
                onJump={goToStep}
              />

              <SurveyErrorContext.Provider value={{ show: showErr, errors: stepErrors }}>
                <Box
                  component="form"
                  onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAttemptSubmit(); }}
                  sx={{
                    px: { xs: 1.75, sm: 3.5 },
                    py: { xs: 2.25, sm: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 2.5, sm: 3 },
                    minWidth: 0,
                    /* Any control that insists on being wide scrolls itself
                       rather than pushing the page sideways. */
                    '& .MuiTable-root': { minWidth: 0 },

                    /* Field styling applied form-wide, so every control — the
                       hardcoded ones and the DB-driven ones alike — matches
                       without each call site repeating `sx`. */
                    '& .MuiOutlinedInput-root': {
                      borderRadius: `${T.field}px`,
                      bgcolor: '#fff',
                      transition: 'box-shadow .18s ease, border-color .18s ease',
                      '& fieldset': { borderColor: T.line },
                      '&:hover fieldset': { borderColor: '#c7d2e2' },
                      '&.Mui-focused fieldset': { borderColor: T.brand, borderWidth: '1.5px' },
                      '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(37,99,235,0.10)' },
                    },
                    '& .MuiInputBase-input': { color: T.ink, fontWeight: 500 },

                    /* An invalid label paints its following control red. The
                       message itself is rendered by QuestionLabel. */
                    '& [data-sk-invalid="true"] ~ * .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${T.danger} !important`,
                    },
                    '& [data-sk-invalid="true"] ~ * .sk-choice': {
                      borderColor: '#fca5a5 !important',
                    },
                  }}
                >

              {currentStep === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, pb: 1.25, mb: 0.5, borderBottom: `1px solid ${T.lineSoft}` }}>
                    {language === 'si' ? 'මූලික තොරතුරු (Basic Information)' : language === 'ta' ? 'அடிப்படை தகவல்கள்' : 'Basic Information'}
                  </Typography>

                  {formValues['b_reg_no'] && (
                    <Box sx={{
                      bgcolor: 'success.50',
                      p: 2,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'success.main',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        {language === 'si' ? 'ඔබගේ ලියාපදිංචි අංකය' : 'Your Registration Number'}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.dark" sx={{ letterSpacing: 2 }}>
                        {formValues['b_reg_no']}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <QuestionLabel fieldKey="b_name" text={getDynamicLabel('b_name', 'Business Location Name', 'ව්‍යාපාර ස්ථානයේ නම', 'வணிகத்தின் பெயர்')} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['b_name'] || ''} onChange={(e) => handleInputChange('b_name', e.target.value)} />
                  </Box>



                  <Box>
                    <QuestionLabel fieldKey="b_address" text={getDynamicLabel('b_address', 'Address', 'ලිපිනය', 'முகவரி')} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['b_address'] || ''} onChange={(e) => handleInputChange('b_address', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_owner_name" text={getDynamicLabel('b_owner_name', 'Business Owner Name', 'ව්‍යාපාර හිමියාගේ නම', 'உரிமையாளரின் பெயர்')} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['b_owner_name'] || ''} onChange={(e) => handleInputChange('b_owner_name', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_mobile" text={getDynamicLabel('b_mobile', 'WhatsApp / Mobile Number', 'වට්ස්ඇප්/ මොබයිල් අංකය', 'வாட்ஸ்அப்/ மொபைல் எண்')} />
                    {/* Stacks on phones — a 120px button beside the field left
                        too little room for a full number at 375px. */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 }, alignItems: { xs: 'stretch', sm: 'center' } }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="tel"
                        inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
                        value={formValues['b_mobile'] || ''}
                        disabled={isMobileVerified}
                        onChange={(e) => {
                          const next = e.target.value;
                          handleInputChange('b_mobile', next);
                          // The verification proof is bound to the exact number
                          // that was verified; editing it afterward must drop
                          // the (now stale) "Verified" state client-side too,
                          // not just fail silently at submission — the backend
                          // would reject a mismatched proof regardless, but the
                          // UI showing a false checkmark until then is its own
                          // bug.
                          if (isMobileVerified && next !== formValues['b_mobile']) {
                            setIsMobileVerified(false);
                            setMobileVerificationToken(null);
                          }
                        }}
                      />
                      {!isMobileVerified ? (
                        <Button
                          variant="contained"
                          onClick={handleSendOtp}
                          disabled={otpSending || !formValues['b_mobile']}
                          sx={{
                            minWidth: { xs: '100%', sm: '120px' }, minHeight: { xs: 48, sm: 40 }, flexShrink: 0,
                            borderRadius: `${T.field}px`, textTransform: 'none', fontWeight: 700,
                          }}
                        >
                          {otpSending ? <CircularProgress size={22} color="inherit" /> : (language === 'si' ? 'තහවුරු කරන්න' : language === 'ta' ? 'சரிபார்' : 'Verify')}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleRoundedIcon />}
                          sx={{
                            minWidth: { xs: '100%', sm: '120px' }, minHeight: { xs: 48, sm: 40 }, flexShrink: 0,
                            pointerEvents: 'none', borderRadius: `${T.field}px`, textTransform: 'none', fontWeight: 700,
                          }}
                        >
                          {L('Verified', 'තහවුරුයි', 'சரிபார்க்கப்பட்டது')}
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_type" text={getDynamicLabel('b_type', 'Business Type', 'ව්‍යාපාර වර්ගය', 'வணிக வகை')} />
                    <Autocomplete
                      options={businessCategories}
                      loading={catLoading}
                      getOptionLabel={(opt: any) => {
                        const name = language === 'si' ? opt.nameSi : language === 'ta' ? opt.nameTa : opt.nameEn;
                        return name || opt.nameEn;
                      }}
                      filterOptions={(options, state) => {
                        const q = state.inputValue.toLowerCase();
                        return options.filter((o: any) =>
                          o.nameEn?.toLowerCase().includes(q) ||
                          o.nameSi?.toLowerCase().includes(q) ||
                          o.nameTa?.toLowerCase().includes(q) ||
                          o.breadcrumb?.toLowerCase().includes(q)
                        );
                      }}
                      value={selectedCategory}
                      onChange={(_: any, newVal: any) => {
                        setSelectedCategory(newVal);
                        handleInputChange('b_type', newVal ? newVal.slug : '');
                        handleInputChange('b_type_name', newVal ? newVal.nameEn : '');
                        handleInputChange('b_reg_no', '');
                      }}
                      renderOption={(props: any, opt: any) => (
                        <li {...props} key={opt.id}>
                          <Box sx={{ pl: opt.depth * 1.5 }}>
                            <Typography variant="body2" fontWeight={opt.depth === 0 ? 700 : 400}>
                              {language === 'si' ? opt.nameSi : language === 'ta' ? opt.nameTa : opt.nameEn}
                            </Typography>
                            {opt.depth > 0 && (
                              <Typography variant="caption" color="text.secondary">{opt.breadcrumb}</Typography>
                            )}
                          </Box>
                        </li>
                      )}
                      renderInput={(params: any) => (
                        <TextField
                          {...params}
                          size="small"
                          fullWidth
                          variant="outlined"
                          placeholder={language === 'si' ? 'ව්‍යාපාර වර්ගය සොයන්න...' : language === 'ta' ? 'வணிக வகையை தேடுங்கள்...' : 'Search business type...'}
                          InputProps={{ ...params.InputProps, endAdornment: (<>{catLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }}
                        />
                      )}
                    />
                    {/* Breadcrumb scrolls inside its own box so a long trail can
                        never widen the page on a phone. */}
                    {selectedCategory && (
                      <Box
                        sx={{
                          mt: 1, border: '1px solid', borderColor: 'divider',
                          borderRadius: `${T.field}px`, overflow: 'hidden',
                          maxWidth: '100%',
                        }}
                      >
                        <Box sx={{ overflowX: 'auto', overscrollBehaviorX: 'contain' }}>
                        <Table size="small" sx={{ minWidth: 320 }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                              <TableCell sx={{ color: 'white', fontWeight: 700, width: '40%' }}>{language === 'si' ? 'මට්ටම' : language === 'ta' ? 'நிலை' : 'Level'}</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 700 }}>{language === 'si' ? 'නම' : language === 'ta' ? 'பெயர்' : 'Name'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedCategory.breadcrumb.split(' > ').map((part: string, i: number) => (
                              <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? 'grey.50' : 'white' }}>
                                <TableCell>
                                  <Chip label={`Level ${i + 1}`} size="small" color={i === selectedCategory.depth ? 'primary' : 'default'} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={i === selectedCategory.depth ? 700 : 400}>{part}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_nic" text={getDynamicLabel('b_nic', 'NIC', 'NIC', 'தேசிய அடையாள அட்டை')} />
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      inputProps={{ inputMode: 'text', autoCapitalize: 'characters', autoComplete: 'off' }}
                      value={formValues['b_nic'] || ''}
                      onChange={(e) => handleInputChange('b_nic', e.target.value)}
                    />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_photo" text={getDynamicLabel('b_photo', 'Photo of the Business', 'ව්‍යාපාරයේ ඡායාරූපයක්', 'வணிகத்தின் புகைப்படம்')} />
                    <PhotoUploader
                      fieldKey="b_photo"
                      value={formValues['b_photo'] || ''}
                      multiple={false}
                      language={language}
                      onChange={(names) => handleInputChange('b_photo', names)}
                    />
                  </Box>

                  <StepNav
                    next={1}
                    before={() => {
                      if (!formValues['q_owner_name'] && formValues['b_owner_name']) {
                        setFormValues(prev => ({ ...prev, q_owner_name: prev['b_owner_name'] }));
                      }
                      if (!formValues['q_nic'] && formValues['b_nic']) {
                        const { dob, age } = extractNICDetails(formValues['b_nic']);
                        setFormValues(prev => ({
                          ...prev,
                          q_nic: prev['b_nic'],
                          q_dob_age: (dob && age) ? `${dob} / ${age}` : '',
                        }));
                      }
                    }}
                  />
                </Box>
              )}
              {currentStep === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, pb: 1.25, mb: 0.5, borderBottom: `1px solid ${T.lineSoft}` }}>
                    {language === 'si' ? 'ව්‍යාපාර හිමිකරු පිළිබඳ තොරතුරු' : language === 'ta' ? 'வணிக உரிமையாளர் தகவல்' : 'Business Owner Information'}
                  </Typography>

                  <Box>
                    <QuestionLabel fieldKey="q_owner_name" text={getDynamicLabel('q_owner_name', "Owner's Full Name", "හිමිකරුගේ සම්පූර්ණ නම", "உரிமையாளரின் முழுப் பெயர்")} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['q_owner_name'] || ''} onChange={(e) => handleInputChange('q_owner_name', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_gender" text={getDynamicLabel('q_gender', 'Gender', 'ස්ත්‍රී/පුරුෂ භාවය', 'பாலினம்')} />
                    <FormControl fullWidth size="small">
                      <Select value={formValues['q_gender'] || ''} onChange={(e) => handleInputChange('q_gender', e.target.value as string)}>
                        <MenuItem value="1. Male">{language === 'si' ? '1. පිරිමි' : language === 'ta' ? '1. ஆண்' : '1. Male'}</MenuItem>
                        <MenuItem value="2. Female">{language === 'si' ? '2. ගැහැණු' : language === 'ta' ? '2. பெண்' : '2. Female'}</MenuItem>
                        <MenuItem value="3. Other">{language === 'si' ? '3. වෙනත්' : language === 'ta' ? '3. மற்றவை' : '3. Other'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_nic" text={getDynamicLabel('q_nic', 'National Identity Card Number (NIC)', 'ජාතික හැඳුනුම්පත් අංකය', 'தேசிய அடையாள அட்டை எண் (NIC)')} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['q_nic'] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange('q_nic', val);
                        const { dob, age } = extractNICDetails(val);
                        handleInputChange('q_dob_age', (dob && age) ? `${dob} / ${age}` : '');
                      }}
                    />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_dob_age" text={getDynamicLabel('q_dob_age', 'Date of Birth / Age', 'උපන් දිනය / වයස', 'பிறந்த தேதி / வயது')} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['q_dob_age'] || ''} disabled sx={{ bgcolor: 'grey.100' }} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_whatsapp" text={getDynamicLabel('q_whatsapp', 'WhatsApp Number', 'වට්ස්ඇප් දුරකථන අංකය', 'வாட்ஸ்அப் எண்')} />
                    <TextField fullWidth variant="outlined" size="small" type="tel" inputProps={{ inputMode: 'tel', autoComplete: 'tel' }} value={formValues['q_whatsapp'] || ''} onChange={(e) => handleInputChange('q_whatsapp', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_mobile" text={getDynamicLabel('q_mobile', 'Main Phone Number', 'ප්‍රධාන දුරකථන අංකය', 'முக்கிய தொலைபேசி எண்')} />
                    <TextField fullWidth variant="outlined" size="small" type="tel" inputProps={{ inputMode: 'tel', autoComplete: 'tel' }} value={formValues['q_mobile'] || ''} onChange={(e) => handleInputChange('q_mobile', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_email" text={getDynamicLabel('q_email', 'Email Address (if any)', 'විද්‍යුත් තැපැල් ලිපිනය (ඇත්නම්)', 'மின்னஞ்சல் முகவரி (ஏதேனும் இருந்தால்)')} />
                    <TextField fullWidth variant="outlined" size="small" type="email" inputProps={{ inputMode: 'email', autoComplete: 'email' }} value={formValues['q_email'] || ''} onChange={(e) => handleInputChange('q_email', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_address" text={getDynamicLabel('q_address', 'Residential Address', 'නේවාසික ලිපිනය', 'குடியிருப்பு முகவரி')} />
                    <TextField fullWidth variant="outlined" size="small" multiline rows={2} value={formValues['q_address'] || ''} onChange={(e) => handleInputChange('q_address', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_education" text={getDynamicLabel('q_education', 'Highest Educational Qualification', 'උසස්ම අධ්‍යාපන සුදුසුකම', 'மிக உயர்ந்த கல்வித் தகுதி')} />
                    <FormControl fullWidth size="small">
                      <Select value={formValues['q_education'] || ''} onChange={(e) => handleInputChange('q_education', e.target.value as string)}>
                        <MenuItem value="1. Primary">{language === 'si' ? '1. ප්‍රාථමික' : '1. Primary'}</MenuItem>
                        <MenuItem value="2. Secondary">{language === 'si' ? '2. ද්විතීයික' : '2. Secondary'}</MenuItem>
                        <MenuItem value="3. A-Level">{language === 'si' ? '3. උසස් පෙළ' : '3. A-Level'}</MenuItem>
                        <MenuItem value="4. Diploma">{language === 'si' ? '4. ඩිප්ලෝමා' : '4. Diploma'}</MenuItem>
                        <MenuItem value="5. Degree">{language === 'si' ? '5. උපාධිය' : '5. Degree'}</MenuItem>
                        <MenuItem value="6. Postgraduate">{language === 'si' ? '6. උපාධියට වඩා ඉහළ' : '6. Postgraduate'}</MenuItem>
                        <MenuItem value="7. No formal education">{language === 'si' ? '7. විධිමත් අධ්‍යාපනයක් නැත' : '7. No formal education'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_experience" text={getDynamicLabel('q_experience', 'Experience in this Industry (Years)', 'මෙම කර්මාන්තයේ පළපුරුද්ද (වසර)', 'இந்தத் துறையில் அனுபவம் (ஆண்டுகள்)')} />
                    <TextField fullWidth variant="outlined" size="small" type="number" inputProps={{ inputMode: 'numeric', min: 0 }} value={formValues['q_experience'] || ''} onChange={(e) => handleInputChange('q_experience', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_prev_occupation" text={getDynamicLabel('q_prev_occupation', 'Occupation before starting the industry', 'කර්මාන්තය ආරම්භ කිරීමට පෙර රැකියාව', 'தொழில் தொடங்கும் முன் வேலைவாய்ப்பு')} />
                    <TextField fullWidth variant="outlined" size="small" value={formValues['q_prev_occupation'] || ''} onChange={(e) => handleInputChange('q_prev_occupation', e.target.value)} />
                  </Box>

                  <StepNav prev={0} next={2} />
                </Box>
              )}


              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(currentStep) && renderDynamicStep(currentStep)}
                </Box>
              </SurveyErrorContext.Provider>
            </Box>
          </Container>
        </Box>
      )}

      {/* Success Dialog */}
      <Dialog PaperProps={dialogPaperProps} open={successDialogOpen} onClose={() => { setSuccessDialogOpen(false); navigate('/fill-data'); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          {language === 'si' ? 'සාර්ථකයි!' : language === 'ta' ? 'வெற்றி!' : 'Success!'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            {language === 'si' ? 'සමීක්ෂණය සාර්ථකව ඉදිරිපත් කරන ලදි.' : language === 'ta' ? 'கணக்கெடுப்பு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.' : 'Survey submitted successfully!'}
          </Typography>
          {submitSuccessData && (
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
              <Typography variant="body2" mb={1}>
                <strong>{language === 'si' ? 'ආරම්භක වේලාව:' : language === 'ta' ? 'தொடக்க நேரம்:' : 'Start Time:'}</strong> {submitSuccessData.startTime}
              </Typography>
              <Typography variant="body2">
                <strong>{language === 'si' ? 'අවසන් වේලාව:' : language === 'ta' ? 'முடிவு நேரம்:' : 'End Time:'}</strong> {submitSuccessData.endTime}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="contained" color="success" onClick={() => { setSuccessDialogOpen(false); navigate('/fill-data'); }}>
            {language === 'si' ? 'හරි' : language === 'ta' ? 'சரி' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Confirmation Dialog */}
      <Dialog PaperProps={dialogPaperProps} open={!!ccode && !locationConfirmed && !showLocationSelector && !!gnData?.gnByCcode} onClose={() => { }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {language === 'si' ? 'ස්ථානය තහවුරු කරන්න' : language === 'ta' ? 'இடத்தை உறுதிப்படுத்தவும்' : 'Confirm Location'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            {language === 'si' ? 'මෙය ඔබගේ නිවැරදි ග්‍රාම නිලධාරී වසම දැයි තහවුරු කරන්න:' : language === 'ta' ? 'இது உங்களின் சரியான கிராம உத்தியோகத்தர் பிரிவு என்பதை உறுதிப்படுத்தவும்:' : 'Are you sure this is your correct Village / GN Division?'}
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
            <Typography variant="body2"><strong>{language === 'si' ? 'දිස්ත්‍රික්කය:' : language === 'ta' ? 'மாவட்டம்:' : 'District:'}</strong> {gnData?.gnByCcode?.disEn}</Typography>
            <Typography variant="body2"><strong>{language === 'si' ? 'ප්‍රාදේශීය ලේකම් කොට්ඨාසය:' : language === 'ta' ? 'பிரதேச செயலகம்:' : 'DS Division:'}</strong> {gnData?.gnByCcode?.dsEn}</Typography>
            <Typography variant="body2"><strong>{language === 'si' ? 'ග්‍රාම නිලධාරී වසම:' : language === 'ta' ? 'கிராம உத்தியோகத்தர் பிரிவு:' : 'Village / GN Division:'}</strong> {gnData?.gnByCcode?.nameEn}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setShowLocationSelector(true)}
          >
            {language === 'si' ? 'නැත, වෙනස් කරන්න' : language === 'ta' ? 'இல்லை, மாற்றவும்' : 'No, Change'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setLocationConfirmed(true);
              const draftStr = localStorage.getItem(`survey_draft_${ccode}`);
              if (draftStr) {
                setShowResumePopup(true);
              } else {
                setShowMetadataPopup(true);
              }
            }}
          >
            {language === 'si' ? 'ඔව්, නිවැරදියි' : language === 'ta' ? 'ஆம், சரியானது' : 'Yes, Proceed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Survey Metadata Popup */}
      <Dialog PaperProps={dialogPaperProps} open={showMetadataPopup && !surveyStartTime} onClose={() => { }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {language === 'si' ? 'සමීක්ෂණ තොරතුරු' : language === 'ta' ? 'கணக்கெடுப்பு தகவல்' : 'Survey Information'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1">
              <strong>{language === 'si' ? 'ග්‍රාම නිලධාරි වසම:' : 'Village / GN Division:'}</strong> {gnData?.gnByCcode?.nameEn}
            </Typography>
            <Typography variant="body1">
              <strong>{language === 'si' ? 'ප්‍රාදේශීය ලේකම් කොට්ඨාශය:' : 'DS Division:'}</strong> {gnData?.gnByCcode?.dsEn}
            </Typography>
            <Typography variant="body1">
              <strong>{language === 'si' ? 'සමීක්ෂණ දිනය:' : 'Survey Date:'}</strong> {new Date().toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              <strong>{language === 'si' ? 'සමීක්ෂකගේ නම:' : 'Surveyor Name:'}</strong> {surveyorName}
            </Typography>
            <Typography variant="body1">
              <strong>{language === 'si' ? 'සමීක්ෂණ ආරම්භය:' : 'Start Time:'}</strong> {language === 'si' ? 'ස්වයංක්‍රීයව' : 'Auto'} (____:____)
            </Typography>
            <Typography variant="body1">
              <strong>{language === 'si' ? 'අවසානය:' : 'End Time:'}</strong> {language === 'si' ? 'ස්වයංක්‍රීයව' : 'Auto'} (____:____)
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={2}>
              * {language === 'si' ? 'ඔබ OK බොත්තම ක්ලික් කළ විට ආරම්භක වේලාව සටහන් වේ. අවසන් වේලාව පෝරමය ඉදිරිපත් කිරීමේදී සටහන් වේ.' : 'Start time will be recorded when you click OK. End time will be recorded when you submit the form.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSurveyStartTime(new Date());
              setShowMetadataPopup(false);
              setShowGpsPopup(true);
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* GPS Confirmation Popup */}
      <Dialog PaperProps={dialogPaperProps} open={showGpsPopup} onClose={() => { }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          📍 {language === 'si' ? 'භූගෝලීය ඛණ්ඩාංක (GPS)' : language === 'ta' ? 'புவியியல் ஆயத்தொலைவுகள் (GPS)' : 'GPS Coordinates'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {language === 'si'
              ? 'ඔබ දැනට සිටින්නේ නිවැරදි සමීක්ෂණ ස්ථානයේ ද? (ඔව් නම්, ස්ථානය ස්වයංක්‍රීයව සටහන් වේ)'
              : 'Are you currently at the correct survey location? (If Yes, location will be recorded automatically)'}
          </Typography>
          {gnData?.gnByCcode && (
            <Box sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 2, p: 1.5 }}>
              <Typography variant="caption" color="primary.main" fontWeight={700}>
                {language === 'si' ? 'සමීක්ෂණ ස්ථානය:' : 'Survey Location:'}
              </Typography>
              <Typography variant="body2" fontWeight={600}>{gnData.gnByCcode.nameEn}</Typography>
              <Typography variant="caption" color="text.secondary">{gnData.gnByCcode.dsEn} · {gnData.gnByCcode.disEn}</Typography>
            </Box>
          )}
          {gpsChecking && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {language === 'si' ? 'GPS ස්ථානය ලබා ගනිමින් සිටී...' : 'Getting your GPS location...'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            disabled={gpsChecking}
            onClick={() => {
              setShowGpsPopup(false);
            }}
          >
            {language === 'si' ? 'නැත' : 'No'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={gpsChecking}
            onClick={() => {
              if (!navigator.geolocation) {
                setGpsErrorPopup(language === 'si' ? 'ඔබගේ බ්‍රවුසරය GPS සඳහා සහය නොදක්වයි.' : 'Geolocation is not supported by this browser.');
                return;
              }
              setGpsChecking(true);
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setGpsChecking(false);
                  const userLat = position.coords.latitude;
                  const userLng = position.coords.longitude;
                  const boundary = gnData?.gnByCcode?.boundary;

                  // Check if inside boundary
                  let isInside = false;
                  if (boundary) {
                    // First try polygon point-in-polygon check
                    if (boundary.polygons && boundary.polygons.length > 0) {
                      try {
                        const polygons: number[][][] = typeof boundary.polygons === 'string'
                          ? JSON.parse(boundary.polygons)
                          : boundary.polygons;
                        // Check against each polygon ring
                        for (const ring of polygons) {
                          let inside = false;
                          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                            const xi = ring[i][1], yi = ring[i][0]; // [lng, lat] format
                            const xj = ring[j][1], yj = ring[j][0];
                            const intersect = ((yi > userLng) !== (yj > userLng)) &&
                              (userLat < (xj - xi) * (userLng - yi) / (yj - yi) + xi);
                            if (intersect) inside = !inside;
                          }
                          if (inside) { isInside = true; break; }
                        }
                      } catch (e) {
                        // Fall back to bounding box
                        isInside = userLat >= boundary.minLat && userLat <= boundary.maxLat &&
                          userLng >= boundary.minLng && userLng <= boundary.maxLng;
                      }
                    } else {
                      // Bounding box check (with 0.02° ~2km buffer)
                      const buffer = 0.02;
                      isInside = userLat >= (boundary.minLat - buffer) && userLat <= (boundary.maxLat + buffer) &&
                        userLng >= (boundary.minLng - buffer) && userLng <= (boundary.maxLng + buffer);
                    }
                  } else {
                    // No boundary data — accept location as-is
                    isInside = true;
                  }

                  if (isInside) {
                    setGpsCoordinates({ lat: userLat, lng: userLng });
                    setShowGpsPopup(false);
                  } else {
                    // Wrong location — show warning popup
                    setGpsWrongLocationPopup({ lat: userLat, lng: userLng });
                    setShowGpsPopup(false);
                  }
                },
                (error) => {
                  setGpsChecking(false);
                  let errorMsg = language === 'si' ? 'ස්ථානය ලබා ගැනීමට නොහැකි විය.' : 'Failed to get location.';
                  if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = language === 'si'
                      ? 'ස්ථානය ලබා ගැනීමට අවසර ලබා දී නොමැත. කරුණාකර බ්‍රවුසරයේ සැකසුම් පරීක්ෂා කරන්න.'
                      : 'Location permission denied. Please check your browser settings.';
                  } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = language === 'si' ? 'ස්ථාන තොරතුරු ලබා ගත නොහැක.' : 'Location information is unavailable.';
                  } else if (error.code === error.TIMEOUT) {
                    errorMsg = language === 'si' ? 'ස්ථානය ලබා ගැනීමේ කාලය ඉකුත් විය.' : 'The request to get your location timed out.';
                  }
                  setGpsErrorPopup(errorMsg);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
              );
            }}
          >
            {gpsChecking ? <CircularProgress size={20} color="inherit" /> : (language === 'si' ? 'ඔව්' : 'Yes')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wrong Location Warning Popup */}
      <Dialog PaperProps={dialogPaperProps} open={!!gpsWrongLocationPopup} onClose={() => { }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚠️ {language === 'si' ? 'ස්ථානය නිවැරදි නොවේ' : language === 'ta' ? 'தவறான இடம்' : 'Wrong Location'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1">
              {language === 'si'
                ? 'ඔබ දැනට සිටිනු ලබන ස්ථානය තෝරාගත් ග්‍රාම නිලධාරී වසමෙහි අයත් නොවේ. කරුණාකර නිවැරදි ස්ථානයේ සිට සමීක්ෂණය පුරවන්න.'
                : language === 'ta'
                  ? 'நீங்கள் தேர்ந்தெடுத்த கிராம உத்தியோகத்தர் பிரிவில் இல்லை. சரியான இடத்திலிருந்து கணக்கெடுப்பை பூர்த்தி செய்யவும்.'
                  : 'You are not currently in the correct survey location (GN Division). Please fill the survey from the correct location.'}
            </Typography>
            {gpsWrongLocationPopup && (
              <Box sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.300', borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" color="warning.dark" fontWeight={700} display="block">
                  {language === 'si' ? 'ඔබගේ වර්තමාන ස්ථානය:' : 'Your current location:'}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {language === 'si' ? 'අක්ෂාංශ' : 'Lat'}: {gpsWrongLocationPopup.lat.toFixed(6)},&nbsp;
                  {language === 'si' ? 'දේශාංශ' : 'Lng'}: {gpsWrongLocationPopup.lng.toFixed(6)}
                </Typography>
                {gnData?.gnByCcode?.boundary && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {language === 'si' ? 'අපේක්ෂිත ප්‍රදේශය:' : 'Expected area:'} {gnData.gnByCcode.nameEn}
                  </Typography>
                )}
              </Box>
            )}
            <Box sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 2, p: 1.5 }}>
              <Typography variant="body2" color="info.dark">
                {language === 'si'
                  ? '"දිගටම" ක්ලික් කළ හොත්, ඔබේ ස්ථාන තොරතුරු සුරකිනු නොලැබේ, නමුත් අනෙකුත් සමීක්ෂණ දත්ත සුරකිනු ලැබේ.'
                  : language === 'ta'
                    ? '"தொடரவும்" கிளிக் செய்தால், இடம் சேமிக்கப்படாது, ஆனால் மற்ற தரவு சேமிக்கப்படும்.'
                    : 'If you click "Continue", location will NOT be saved, but all other survey data will be saved normally.'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setGpsWrongLocationPopup(null);
              setShowGpsPopup(true);
            }}
          >
            🔄 {language === 'si' ? 'නැවත උත්සාහ කරන්න' : language === 'ta' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
          </Button>
          <Button
            variant="contained"
            color="warning"
            sx={{ fontWeight: 'bold', color: 'white' }}
            onClick={() => {
              // Continue WITHOUT saving GPS coordinates
              setGpsCoordinates(null);
              setGpsWrongLocationPopup(null);
            }}
          >
            {language === 'si' ? 'දිගටම' : language === 'ta' ? 'தொடரவும்' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Draft Success Dialog */}
      <Dialog PaperProps={dialogPaperProps} open={saveDraftDialogOpen} onClose={() => setSaveDraftDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'success.main', pt: 3 }}>
          {language === 'si' ? 'ෆෝරමය සේව් කෙරිණ!' : language === 'ta' ? 'படிவம் சேமிக்கப்பட்டது!' : 'Progress Saved!'}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {language === 'si'
              ? 'ඔබගේ තොරතුරු සාර්ථකව සේව් කෙරිණ. ඔබ ඊළඟ වර ෆෝරමය විවෘත කළ විට, ඔබ නතර කළ තැනින් නැවත ආරම්භ වේ.'
              : language === 'ta'
                ? 'உங்கள் தரவு சேமிக்கப்பட்டது. அடுத்த முறை படிவத்தை திறக்கும்போது, நீங்கள் நிறுத்திய இடத்திலிருந்து தொடரலாம்.'
                : 'Your progress has been saved. When you return to this form, you can continue from where you left off.'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {language === 'si' ? `සුරකින ලද පියවර: ${currentStep + 1}` : language === 'ta' ? `சேமித்த படி: ${currentStep + 1}` : `Saved at step: ${currentStep + 1}`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ borderRadius: '20px', py: 1.5, fontWeight: 'bold' }}
            onClick={() => {
              setSaveDraftDialogOpen(false);
              const lastGnUrl = localStorage.getItem('last_gn_url');
              navigate(lastGnUrl || '/');
            }}
          >
            🏠 {language === 'si' ? 'ප්‍රධාන පිටුවට යන්න' : language === 'ta' ? 'முகப்பு பக்கத்திற்கு செல்லவும்' : 'Go to Home Page'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            sx={{ borderRadius: '20px', py: 1, fontWeight: 'bold' }}
            onClick={() => setSaveDraftDialogOpen(false)}
          >
            {language === 'si' ? 'ෆෝරමය දිගටම කරන්න' : language === 'ta' ? 'படிவத்தை தொடரவும்' : 'Continue Filling Form'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resume Draft Popup */}
      <Dialog PaperProps={dialogPaperProps} open={showResumePopup} onClose={() => { }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {language === 'si' ? 'අසම්පූර්ණ සමීක්ෂණයක් සොයා ගන්නා ලදී' : language === 'ta' ? 'முடிக்கப்படாத கணக்கெடுப்பு' : 'Unfinished Survey Found'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {language === 'si'
              ? 'මෙම ග්‍රාම නිලධාරී වසම සඳහා ඔබ මින් පෙර ආරම්භ කළ අසම්පූර්ණ සමීක්ෂණයක් ඇත. ඔබ එය නැවත ආරම්භ කිරීමට හෝ අලුතින් සමීක්ෂණයක් ආරම්භ කිරීමට කැමතිද?'
              : 'There is an unfinished survey for this Village. Do you want to resume where you left off, or start a new survey?'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem(`survey_draft_${ccode}`);
              setShowResumePopup(false);
              setShowMetadataPopup(true);
            }}
          >
            {language === 'si' ? 'අලුතින් ආරම්භ කරන්න' : 'Start New'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const draftStr = localStorage.getItem(`survey_draft_${ccode}`);
              if (draftStr) {
                const draft = JSON.parse(draftStr);
                setFormValues(draft.formValues || {});
                setGpsCoordinates(draft.gpsCoordinates || null);
                if (draft.currentStep !== undefined) {
                  setCurrentStep(draft.currentStep);
                }
                if (draft.surveyStartTime) {
                  setSurveyStartTime(new Date(draft.surveyStartTime));
                }
              }
              setShowResumePopup(false);
            }}
          >
            {language === 'si' ? 'නැවත ආරම්භ කරන්න' : 'Resume Survey'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        open={showLocationSelector}
        onLocationSelected={(gn) => {
          setShowLocationSelector(false);
          const formattedGnName = encodeURIComponent(gn.nameEn.replace(/ /g, '-'));
          navigate(`/industry-survey/${formattedGnName}/${gn.CCODE}`, { state: { fromSelector: true } });
        }}
      />


      <Dialog PaperProps={dialogPaperProps} open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {language === 'si' ? 'තහවුරු කරන්න' : 'Confirm Submission'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography mb={2}>
            {language === 'si'
              ? 'ඔබගේ සියලුම තොරතුරු නිවැරදි දැයි තහවුරු කරගන්න. ඉදිරිපත් කිරීමට පෙර අවශ්‍ය නම් ආපසු ගොස් පරීක්ෂා කළ හැක. ඔබ ඉදිරිපත් කළ පසු මෙම තොරතුරු පද්ධතියට සුරැකෙනු ඇත.'
              : 'Please review all your details. You can scroll back and check before submitting. Once you click Done, the data will be securely saved to the database.'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            * Note: Saving up to {Object.keys(formValues).length} fields!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setSubmitDialogOpen(false)}>
            {language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
          </Button>
          <Button variant="contained" color="success" sx={{ fontWeight: 'bold', px: 4 }} onClick={() => {
            setSubmitDialogOpen(false);
            handleSubmit(new Event('submit') as any);
          }}>
            {language === 'si' ? 'තහවුරු කර ඉදිරිපත් කරන්න' : 'Done / Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog PaperProps={dialogPaperProps} open={otpDialogOpen} onClose={() => { }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {language === 'si' ? 'OTP අංකය ඇතුළත් කරන්න' : 'Enter 6-Digit OTP'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            {language === 'si'
              ? 'කරුණාකර ඔබගේ ජංගම දුරකථනයට ලැබුණු අංක 6 කින් යුත් කේතය ඇතුළත් කරන්න.'
              : 'Please enter the 6-digit code sent to your mobile.'}
          </Typography>
          <TextField
            fullWidth
            autoFocus
            variant="outlined"
            label="OTP Code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleVerifyOtp} disabled={otpVerifying || otpCode.length !== 6}>
            {otpVerifying ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* GPS Error Popup */}
      <Dialog PaperProps={dialogPaperProps} open={!!gpsErrorPopup} onClose={() => { }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          {language === 'si' ? 'දෝෂයකි' : language === 'ta' ? 'பிழை' : 'Error'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {gpsErrorPopup}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
            {language === 'si' ? 'කරුණාකර ඔබගේ බ්‍රවුසරයේ ඉහළ ඇති ලොක් (Lock) අයිකනය ක්ලික් කර "Location" සඳහා අවසර ලබා දී නැවත උත්සාහ කරන්න.' : 'Please click the lock icon in the address bar, allow Location access, and try again.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setGpsErrorPopup(null);
              setShowGpsPopup(false);
            }}
          >
            {language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setGpsErrorPopup(null);
            }}
          >
            {language === 'si' ? 'නැවත උත්සාහ කරන්න' : 'Try Again'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generic Alert Popup */}
      <Dialog PaperProps={dialogPaperProps} open={genericAlertPopup?.open || false} onClose={() => setGenericAlertPopup(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {genericAlertPopup?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {genericAlertPopup?.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="contained" color="primary" onClick={() => setGenericAlertPopup(null)}>
            {language === 'si' ? 'හරි' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>

      <GnPageFooter />
    </Box>
  );
};

export default IndustrySurveyPage;







