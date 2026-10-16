import React, { useState, useEffect, useRef } from 'react';
import GnTopHeaderBar from '../components/GnTopHeaderBar';
import SiteTopBar from '../components/fruit/SiteTopBar';
import LandingFooter from '../components/fruit/LandingFooter';
import { COPY } from '../components/fruit/landingCopy';
import type { Lang } from '../components/fruit/fruitBusinessTypes';
import SurveyDialog, { DialogButton, DetailList, Callout, DialogTone } from '../components/survey/SurveyDialog';
import { Box, Typography, Button, ButtonBase, Container, TextField, CircularProgress, FormControl, Select, MenuItem, Autocomplete } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Tooltip, IconButton } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageContext';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_QUESTIONS, GET_GN_FOR_SURVEY, GET_CATEGORIES_BY_ROOT_SLUG } from '../graphql/queries';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import GnLocationModal from '../components/GnLocationModal';
import { getUserName } from '../utils/cookieUtils';
import { saveSurveyRequest, restoreRecoveredDraft } from '../utils/surveyDraftRecovery';

/* ── Survey design system ─────────────────────────────────────────────────── */
import {
  T, SurveyKeyframes, SurveyErrorContext, QuestionField, SText, SDropdown, ChipMultiSelect,
} from '../components/survey/SurveyKit';
import SurveyProgress, { SurveySection } from '../components/survey/SurveyProgress';
import {
  getStepErrors, getFirstInvalidStep, isDynamicStep, DYNAMIC_STEPS, TOTAL_STEPS,
  dobFromNIC, formatDobAge, dobFromStored, calcAge, todayIso, MIN_DOB,
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
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import LocationOffRoundedIcon from '@mui/icons-material/LocationOffRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

// ─── Reusable Photo Uploader Component ───────────────────────────────────────
interface PhotoUploaderProps {
  fieldKey: string;
  value: string;
  multiple?: boolean;
  language: string;
  onChange: (paths: string) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ fieldKey, value, multiple = false, language, onChange }) => {
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [storedPaths, setStoredPaths] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const imageUrl = (path: string) => path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')
    ? path
    : `/api/uploads/${path}`;

  // Drafts restored from the server already contain the relative upload path.
  React.useEffect(() => {
    const paths = value ? value.split(', ').map(path => path.trim()).filter(Boolean) : [];
    setStoredPaths(current => current.join(', ') === paths.join(', ') ? current : paths);
    setPreviews(paths.map(imageUrl));
  }, [value]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      const uploadedPaths = await Promise.all(Array.from(files).map(async (file) => {
        const body = new FormData();
        body.append('photo', file);
        const response = await fetch('/api/industry-survey/upload-photo', { method: 'POST', body });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.path) {
          throw new Error(result?.error || 'Photo upload failed.');
        }
        return result.path as string;
      }));

      const nextPaths = multiple ? [...storedPaths, ...uploadedPaths] : uploadedPaths.slice(0, 1);
      setStoredPaths(nextPaths);
      setPreviews(nextPaths.map(imageUrl));
      onChange(nextPaths.join(', '));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removePreview = (idx: number) => {
    const nextPaths = storedPaths.filter((_, i) => i !== idx);
    setStoredPaths(nextPaths);
    setPreviews(nextPaths.map(imageUrl));
    onChange(nextPaths.join(', '));
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
            disabled={uploading}
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
            disabled={uploading}
            onChange={e => handleFiles(e.target.files)}
          />
        </Button>
      </Box>

      {uploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption">{language === 'si' ? 'ඡායාරූපය උඩුගත කරමින්...' : language === 'ta' ? 'புகைப்படம் பதிவேற்றப்படுகிறது...' : 'Uploading photo...'}</Typography>
        </Box>
      )}

      {uploadError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          {uploadError}
        </Typography>
      )}

      {value && !uploading && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
          {language === 'si' ? 'ඡායාරූපය උඩුගත කර ඇත' : language === 'ta' ? 'புகைப்படம் பதிவேற்றப்பட்டது' : 'Photo uploaded'}
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
      case 'date':
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
  const { language, setLanguage } = useLanguage();
  const lang = ((language as Lang) || 'si');
  const siteCopy = COPY[lang] ?? COPY.si;
  const { gnName, ccode } = useParams<{ gnName?: string, ccode?: string }>();
  const [searchParams] = useSearchParams();
  const presetType = searchParams.get('type');
  const presetAppliedFor = useRef<string | null>(null);
  const navigate = useNavigate();
  const locationState = useLocation().state as { fromSelector?: boolean };
  // The name is collected on the GN panel and stored in a cookie. It is the
  // surveyor identity for this public survey, independent of login details.
  const surveyorName = getUserName()?.trim() || 'Unknown';

  const { data, loading, error } = useQuery(GET_QUESTIONS, {
    fetchPolicy: 'cache-and-network',
  });

  // Light query (names + boundary). The full GN record pulls a dozen census
  // tables and, on a single-threaded dev server, held the first dialog back.
  const { data: gnData, loading: gnLoading } = useQuery(GET_GN_FOR_SURVEY, {
    variables: { CCODE: ccode },
    skip: !ccode,
  });

  // Where "back" goes: this area's GN page.
  const gnHomeUrl = gnName && ccode
    ? `/gnpage/${encodeURIComponent(gnName)}/${encodeURIComponent(ccode)}`
    : (localStorage.getItem('last_gn_url') || '/gnpage');
  const gnPick = (base: 'name' | 'ds' | 'dis'): string | undefined => {
    const gn = gnData?.gnByCcode;
    if (!gn) return undefined;
    const sfx = language === 'si' ? 'Si' : language === 'ta' ? 'Ta' : 'En';
    return gn[`${base}${sfx}`] || gn[`${base}En`] || '';
  };
  const areaName = gnPick('name') || (gnName ? decodeURIComponent(gnName).replace(/-/g, ' ') : '');

  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  /* Date of birth: only the date is entered; q_dob_age ("YYYY-MM-DD / age") is
     always derived from it so the two can never disagree. */
  const setDob = (iso: string) => {
    setFormValues(prev => ({ ...prev, q_dob: iso, q_dob_age: formatDobAge(iso) }));
  };
  // A NIC change re-derives the date only while the date still came from the
  // previous NIC (or is empty); a date the user typed themselves is kept.
  const applyNicToDob = (prev: Record<string, string>, oldNic: string | undefined, newNic: string) => {
    const fromOld = dobFromNIC(oldNic);
    const current = prev['q_dob'] || '';
    if (current && current !== fromOld) return prev;
    const iso = dobFromNIC(newNic);
    return { ...prev, q_dob: iso, q_dob_age: formatDobAge(iso) };
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
      fetchCategories({ variables: { rootSlug: 'location-1-4', slugPrefix: '1.3.4.' } });
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

  /* Only show DB-driven sections that actually have configured questions.
     Steps 0 and 1 are always present because they are rendered locally. This
     prevents respondents from reaching an empty section when a later survey
     section has not yet been configured in the question builder. */
  const activeStepIndexes = React.useMemo(() => {
    // Keep the complete sequence while the request is in flight so a saved
    // draft can be restored without a transient invalid step index.
    if (loadingDynamicQuestions) return [0, 1, ...DYNAMIC_STEPS];

    const configuredSteps = new Set(dynamicQuestions.map((question) => question.step_index));
    return [0, 1, ...DYNAMIC_STEPS.filter((step) => configuredSteps.has(step))];
  }, [dynamicQuestions, loadingDynamicQuestions]);

  const previousActiveStep = React.useCallback(
    (step: number) => {
      const position = activeStepIndexes.indexOf(step);
      return position > 0 ? activeStepIndexes[position - 1] : undefined;
    },
    [activeStepIndexes],
  );

  const nextActiveStep = React.useCallback(
    (step: number) => {
      const position = activeStepIndexes.indexOf(step);
      return position >= 0 && position < activeStepIndexes.length - 1
        ? activeStepIndexes[position + 1]
        : undefined;
    },
    [activeStepIndexes],
  );

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
    const allSections = [
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
    return allSections.filter((_, stepIndex) => activeStepIndexes.includes(stepIndex));
  }, [language, L, activeStepIndexes]);

  /* ── Validation state ────────────────────────────────────────────────────── */
  const [showErr, setShowErr] = useState(false);
  const [maxReached, setMaxReached] = useState(0);

  /* A draft may point to a section that has subsequently been emptied in the
     admin question builder. Return it to the closest available earlier page. */
  useEffect(() => {
    if (loadingDynamicQuestions || activeStepIndexes.includes(currentStep)) return;
    const fallbackStep = [...activeStepIndexes].reverse().find((step) => step < currentStep) ?? 0;
    setCurrentStep(fallbackStep);
  }, [activeStepIndexes, currentStep, loadingDynamicQuestions]);

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

    if (stepQuestions.length === 0) return null;

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
        {nextActiveStep(stepIndex) === undefined
          ? StepNav({ prev: previousActiveStep(stepIndex), submit: true })
          : StepNav({ prev: previousActiveStep(stepIndex), next: nextActiveStep(stepIndex) })}
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
  const [genericAlertPopup, setGenericAlertPopup] = useState<{ open: boolean, title: string, message: string, tone?: DialogTone } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

  // Universal draft key works with or without ccode
  const draftKey = ccode ? `survey_draft_${ccode}` : `survey_draft_user_${userInfo?.sub || 'anon'}`;
  const editTokenKey = `${draftKey}_edit_token`;

  useEffect(() => {
    const forceNew = localStorage.getItem('force_new_submission');
    if (forceNew) {
      localStorage.removeItem('force_new_submission');
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`${draftKey}_db_id`);
      localStorage.removeItem(`${draftKey}_edit_token`);
    }

    // A saved draft is not resumed silently: the user still confirms the area,
    // then the "Pick up where you left off?" dialog offers resume or start over.
    // The draft stays in storage until they choose (the autosave skips empty forms).
    const hasDraft = !!localStorage.getItem(draftKey);

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
        if (hasDraft) setShowResumePopup(true);
        else setShowMetadataPopup(true);
      } else {
        setLocationConfirmed(false);
      }
    }
  }, [ccode, gnName, locationState]);

  // Drafts saved before q_dob existed only have q_dob_age; recover the date when it is ISO.
  // Older locale-formatted values ("4/12/1985 / 41") can't be read reliably and are left for re-entry.
  useEffect(() => {
    if (formValues['q_dob'] || !formValues['q_dob_age']) return;
    const iso = dobFromStored(formValues['q_dob_age']);
    if (iso) setFormValues(prev => (prev['q_dob'] ? prev : { ...prev, q_dob: iso }));
  }, [formValues['q_dob'], formValues['q_dob_age']]);

  // Auto-save draft, debounced so typing doesn't serialise the whole form on every keystroke.
  const pendingDraftWrite = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!(Object.keys(formValues).length > 0 || currentStep > 0)) { pendingDraftWrite.current = null; return; }
    const write = () => {
      pendingDraftWrite.current = null;
      localStorage.setItem(draftKey, JSON.stringify({
        formValues,
        currentStep,
        surveyStartTime: surveyStartTime?.toISOString() || new Date().toISOString(),
        gpsCoordinates,
      }));
    };
    pendingDraftWrite.current = write;
    const t = window.setTimeout(write, 400);
    return () => window.clearTimeout(t);
  }, [formValues, currentStep, surveyStartTime, gpsCoordinates, draftKey]);
  // Never lose the last keystrokes: flush on tab close and when leaving the page in-app.
  useEffect(() => {
    const flush = () => pendingDraftWrite.current?.();
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, []);

  const openRecovery = () => {
    setRecoveryId(localStorage.getItem(`${draftKey}_db_id`) || '');
    setRecoveryCode('');
    setRecoveryError('');
    setRecoveryOpen(true);
  };

  // Serialize initial saves so multiple Next clicks cannot create duplicate rows.
  const saveSurvey = (payload: Record<string, any>): Promise<Response> => {
    const task = saveQueue.current.then(() => saveSurveyRequest(payload, draftKey, localStorage));
    saveQueue.current = task.catch(() => undefined);
    return task;
  };

  const handleRecoverDraft = async () => {
    setRecoveryBusy(true);
    setRecoveryError('');
    try {
      await saveQueue.current;
      const response = await fetch('/api/industry-survey/recover-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: Number(recoveryId), edit_token: recoveryCode.trim() }),
      });
      const body = await response.json();
      if (!response.ok || !body.survey) throw new Error(L(
        'Check the draft ID and private code. Only unfinished drafts can be recovered.',
        'කෙටුම්පත් අංකය සහ පුද්ගලික කේතය පරීක්ෂා කරන්න. නැවත ලබාගත හැක්කේ අසම්පූර්ණ කෙටුම්පත් පමණි.',
        'வரைவு எண்ணையும் தனிப்பட்ட குறியீட்டையும் சரிபார்க்கவும். முடிக்கப்படாத வரைவுகளை மட்டுமே மீட்கலாம்.',
      ));
      if (body.survey.ccode !== ccode) throw new Error(L(
        'Select this draft’s original GN area before recovering it.',
        'නැවත ලබාගැනීමට පෙර කෙටුම්පතේ මුල් ග්‍රාම නිලධාරී වසම තෝරන්න.',
        'மீட்பதற்கு முன் இந்த வரைவின் அசல் கிராம அலுவலர் பிரிவைத் தேர்ந்தெடுக்கவும்.',
      ));
      pendingDraftWrite.current?.();
      const draft = restoreRecoveredDraft(body.survey, recoveryCode.trim(), draftKey, localStorage);
      setFormValues(draft.formValues);
      setCurrentStep(draft.currentStep);
      setGpsCoordinates(draft.gpsCoordinates);
      setSurveyStartTime(new Date(draft.surveyStartTime));
      setShowResumePopup(false);
      setShowMetadataPopup(false);
      setRecoveryCode('');
      setRecoveryOpen(false);
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : L('Recovery failed. Your draft is unchanged.', 'නැවත ලබාගැනීම අසාර්ථකයි. කෙටුම්පත වෙනස් වී නැත.', 'மீட்பு தோல்வியடைந்தது. வரைவு மாற்றப்படவில்லை.'));
    } finally {
      setRecoveryBusy(false);
    }
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
    // The answers are safe now; confirm immediately instead of waiting on the server sync.
    if (showPopup) setSaveDraftDialogOpen(true);

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

      if (res.status === 403) {
        setSaveDraftDialogOpen(false);
        openRecovery();
        return;
      }

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
          setSaveDraftDialogOpen(false);
          setGenericAlertPopup({
            open: true, tone: 'warning',
            title: L('Saved on this device only', 'මෙම උපාංගයේ පමණක් සුරැකිණි', 'இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்பட்டது'),
            message: L(
              `Your answers are safe here, but syncing to the server failed.${reason ? ` (${reason})` : ''}`,
              `ඔබේ පිළිතුරු මෙහි සුරක්ෂිතයි, නමුත් සර්වරයට යැවීමට අසමත් විය.${reason ? ` (${reason})` : ''}`,
              `உங்கள் பதில்கள் இங்கே பாதுகாப்பாக உள்ளன, ஆனால் சேவையகத்துடன் ஒத்திசைக்க முடியவில்லை.${reason ? ` (${reason})` : ''}`,
            ),
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync draft to server', err);
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
            id={fieldKey ? `${fieldKey}-label` : undefined}
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
  // Called as StepNav({...}), not <StepNav/>: defined in render, a component
  // identity would change every render and remount the buttons on each keystroke.
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
            boxShadow: submit ? '0 8px 20px rgba(5,150,105,0.28)' : '0 8px 20px rgba(21,128,61,0.26)',
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
        type="button"
        onClick={() => handleSaveDraft()}
        startIcon={<BookmarkAddOutlinedIcon />}
        sx={{
          alignSelf: 'center', minHeight: 44, px: 2, borderRadius: '999px', textTransform: 'none', fontWeight: 700,
          fontSize: '0.9rem', color: T.muted,
          '@media (hover: hover)': { '&:hover': { color: T.brand, bgcolor: T.brandSoft } },
        }}
      >
        {L('Save and finish later', 'සුරකා පසුව අවසන් කරන්න', 'சேமித்து பின்னர் முடி')}
      </Button>
      <Button type="button" onClick={openRecovery} sx={{ alignSelf: 'center', textTransform: 'none' }}>
        {L('Recover an older draft', 'පැරණි කෙටුම්පතක් නැවත ලබාගන්න', 'பழைய வரைவை மீட்கவும்')}
      </Button>
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
        setOtpCode('');
        setOtpError(null);
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
        setOtpCode('');
        setOtpError(null);
        setGenericAlertPopup({ open: true, tone: 'success', title: L('Mobile number verified', 'ජංගම අංකය තහවුරු විය', 'கைபேசி எண் சரிபார்க்கப்பட்டது'), message: L('You can now submit the survey.', 'දැන් ඔබට සමීක්ෂණය ඉදිරිපත් කළ හැක.', 'இப்போது கணக்கெடுப்பைச் சமர்ப்பிக்கலாம்.') });
      } else {
        setOtpError(L('That code is not correct. Check the SMS and try again.', 'එම කේතය නිවැරදි නොවේ. SMS පණිවිඩය පරීක්ෂා කර නැවත උත්සාහ කරන්න.', 'அந்தக் குறியீடு தவறு. SMS ஐச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'));
      }
    } catch {
      setOtpError(L('Could not reach the server. Please try again.', 'සර්වරයට සම්බන්ධ විය නොහැකි විය. නැවත උත්සාහ කරන්න.', 'சேவையகத்தை அடைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'));
    } finally {
      setOtpVerifying(false);
    }
  };

  const failAlert = (title: string, message: string) => setGenericAlertPopup({ open: true, tone: 'danger', title, message });

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
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
        // Age is recomputed at submission so it is correct as of the day the survey is sent.
        formValues: { ...formValues, b_reg_no: regNumber, ...(formValues['q_dob'] ? { q_dob_age: formatDobAge(formValues['q_dob']) } : {}) },
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
      // The backend uses this real browser origin to form the public profile
      // link that is sent by SMS after the OTP-verified submission succeeds.
      public_profile_base_url: window.location.origin,
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
          setSubmitDialogOpen(false);
          openRecovery();
        } else if (response.status === 409) {
          failAlert(L('Already approved', 'දැනටමත් අනුමතයි', 'ஏற்கனவே அங்கீகரிக்கப்பட்டது'), L('This survey has already been approved and can no longer be changed.', 'මෙම සමීක්ෂණය දැනටමත් අනුමත කර ඇති බැවින් වෙනස් කළ නොහැක.', 'இந்தக் கணக்கெடுப்பு ஏற்கனவே அங்கீகரிக்கப்பட்டதால் மாற்ற முடியாது.'));
        } else if (response.status === 429) {
          failAlert(L('Please wait', 'මොහොතක් රැඳී සිටින්න', 'சற்று காத்திருங்கள்'), L('Too many attempts. Please wait a minute and try again.', 'උත්සාහයන් වැඩියි. මිනිත්තුවක් රැඳී නැවත උත්සාහ කරන්න.', 'அதிக முயற்சிகள். ஒரு நிமிடம் காத்திருந்து மீண்டும் முயற்சிக்கவும்.'));
        } else {
          failAlert(L('Could not submit', 'ඉදිරිපත් කළ නොහැකි විය', 'சமர்ப்பிக்க முடியவில்லை'), `${L('Your answers are still saved on this device. Please try again.', 'ඔබේ පිළිතුරු තවමත් මෙම උපාංගයේ සුරැකී ඇත. නැවත උත්සාහ කරන්න.', 'உங்கள் பதில்கள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டுள்ளன. மீண்டும் முயற்சிக்கவும்.')}${reason ? ` (${reason})` : ''}`);
        }
        return;
      }

      const saved = await response.json().catch(() => null);
      const publishedRegNumber = saved?.survey?.reg_number || regNumber;
      setSubmitSuccessData({
        startTime: surveyStartTime?.toLocaleTimeString() || '',
        endTime: endTime.toLocaleTimeString(),
        regNumber: publishedRegNumber,
      });
      setSubmitDialogOpen(false);
      setSuccessDialogOpen(true);

      // Answers include NIC and phone numbers; don't leave them in browser storage once submitted.
      pendingDraftWrite.current = null;
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`${draftKey}_db_id`);
      localStorage.removeItem(editTokenKey);
    } catch (error) {
      console.error('Submission error:', error);
      failAlert(L('Connection problem', 'සම්බන්ධතා ගැටලුවක්', 'இணைப்புச் சிக்கல்'), L('Could not reach the server. Your answers are still saved on this device. Please try again.', 'සර්වරයට සම්බන්ධ විය නොහැකි විය. ඔබේ පිළිතුරු තවමත් මෙම උපාංගයේ සුරැකී ඇත. නැවත උත්සාහ කරන්න.', 'சேவையகத்தை அடைய முடியவில்லை. உங்கள் பதில்கள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டுள்ளன.'));
    } finally {
      setSubmitting(false);
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


  /* ── GPS capture (used by the GPS dialog and its retry buttons) ──────────── */
  const isInsideBoundary = (lat: number, lng: number): boolean => {
    const boundary = gnData?.gnByCcode?.boundary;
    if (!boundary) return true;
    if (boundary.polygons && boundary.polygons.length > 0) {
      try {
        const polygons: number[][][] = typeof boundary.polygons === 'string' ? JSON.parse(boundary.polygons) : boundary.polygons;
        for (const ring of polygons) {
          let inside = false;
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][1], yi = ring[i][0]; // [lng, lat]
            const xj = ring[j][1], yj = ring[j][0];
            const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          if (inside) return true;
        }
        return false;
      } catch {
        return lat >= boundary.minLat && lat <= boundary.maxLat && lng >= boundary.minLng && lng <= boundary.maxLng;
      }
    }
    const buffer = 0.02; // ~2 km around the bounding box
    return lat >= boundary.minLat - buffer && lat <= boundary.maxLat + buffer && lng >= boundary.minLng - buffer && lng <= boundary.maxLng + buffer;
  };

  const captureGps = () => {
    setGpsErrorPopup(null);
    if (!navigator.geolocation) {
      setGpsErrorPopup(L('This browser cannot share your location.', 'ඔබගේ බ්‍රවුසරය ස්ථානය බෙදා ගැනීමට සහය නොදක්වයි.', 'இந்த உலாவி உங்கள் இருப்பிடத்தைப் பகிர முடியாது.'));
      return;
    }
    setGpsChecking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsChecking(false);
        const { latitude: lat, longitude: lng } = position.coords;
        setShowGpsPopup(false);
        if (isInsideBoundary(lat, lng)) setGpsCoordinates({ lat, lng });
        else setGpsWrongLocationPopup({ lat, lng });
      },
      (error) => {
        setGpsChecking(false);
        let msg = L('We could not get your location.', 'ස්ථානය ලබා ගැනීමට නොහැකි විය.', 'உங்கள் இருப்பிடத்தைப் பெற முடியவில்லை.');
        if (error.code === error.PERMISSION_DENIED) msg = L('Location access is blocked for this site.', 'මෙම වෙබ් අඩවියට ස්ථාන අවසරය අවහිර කර ඇත.', 'இந்தத் தளத்திற்கு இருப்பிட அணுகல் தடுக்கப்பட்டுள்ளது.');
        else if (error.code === error.POSITION_UNAVAILABLE) msg = L('Your location is not available right now.', 'ඔබේ ස්ථානය දැනට ලබා ගත නොහැක.', 'உங்கள் இருப்பிடம் தற்போது கிடைக்கவில்லை.');
        else if (error.code === error.TIMEOUT) msg = L('Finding your location took too long.', 'ස්ථානය සොයා ගැනීමට වැඩි කාලයක් ගත විය.', 'இருப்பிடத்தைக் கண்டறிய அதிக நேரம் ஆனது.');
        setGpsErrorPopup(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // Business type chosen on the GN landing page (?type=slug), applied once the survey starts.
  useEffect(() => {
    if (!presetType || !surveyStartTime || presetAppliedFor.current === presetType || businessCategories.length === 0) return;
    if (formValues['b_type']) { presetAppliedFor.current = presetType; return; }
    const match = businessCategories.find((c: any) => c.slug === presetType);
    presetAppliedFor.current = presetType;
    if (!match) return;
    setSelectedCategory(match);
    setFormValues(prev => ({ ...prev, b_type: match.slug, b_type_name: match.nameEn }));
  }, [presetType, surveyStartTime, businessCategories, formValues['b_type']]);

  const answeredCount = Object.entries(formValues).filter(([k, v]) => v && String(v).trim() && !k.endsWith('_name')).length;
  const maskedMobile = (formValues['b_mobile'] || '').replace(/\d(?=\d{3})/g, '•');
  const gnLookupFailed = !!ccode && !gnLoading && !gnData?.gnByCcode;

  const mockDistricts = gnData?.gnByCcode ? [{ id: 'mock-dist', nameEn: gnData.gnByCcode.disEn }] : [];
  const mockDs = gnData?.gnByCcode ? [{ divisionalSecretariatCode: 'mock-ds', dsEn: gnData.gnByCcode.dsEn }] : [];
  const mockGns = gnData?.gnByCcode ? [{ id: ccode, CCODE: ccode, nameEn: gnData.gnByCcode.nameEn }] : [];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: T.canvasTop }}>
      <SiteTopBar
        lang={lang}
        onLanguage={(l) => setLanguage(l)}
        onLogo={() => navigate(gnHomeUrl)}
        logoLabel={L('Back to the area page', 'ප්‍රදේශ පිටුවට', 'பகுதிப் பக்கத்திற்கு')}
        action={
          <ButtonBase
            onClick={() => navigate(gnHomeUrl)}
            aria-label={L('Back to the area page', 'ප්‍රදේශ පිටුවට', 'பகுதிப் பக்கத்திற்கு')}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75, minHeight: 44, minWidth: 44, px: { xs: 1.25, sm: 2 },
              borderRadius: '999px', border: `1.5px solid ${T.line}`, color: T.ink, fontWeight: 700, fontSize: '0.92rem',
              transition: 'border-color 160ms ease, background-color 160ms ease',
              '&:hover': { borderColor: T.brand, bgcolor: T.brandSoft },
              '&:focus-visible': { outline: '3px solid #FFC233', outlineOffset: 2 },
            }}
          >
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: '0.95rem' }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {areaName || L('Back', 'ආපසු', 'பின்')}
            </Box>
          </ButtonBase>
        }
      />
      <Box sx={{ position: 'relative', zIndex: 2, pt: { xs: 1.5, md: 2 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <GnTopHeaderBar
            districts={mockDistricts}
            selectedDistrict={mockDistricts.length ? 'mock-dist' : ''}
            dsDivisions={mockDs}
            selectedCity={mockDs.length ? 'mock-ds' : ''}
            gramaNiladharis={mockGns}
            selectedGN={mockGns.length ? ccode : ''}
            {...{ activeCcode: ccode, activeGnObj: gnName ? { nameEn: gnName } : null }}
            userName={getUserName() || ''}
            hideCategoryRail
            hideSearch
          />
        </Container>
      </Box>

      <SurveyKeyframes />

      <Box component="main" sx={{ flex: 1 }}>
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
                sectionLabel={L('Section', 'කොටස', 'பகுதி')}
                current={Math.max(0, activeStepIndexes.indexOf(currentStep))}
                maxReached={Math.max(0, activeStepIndexes.reduce(
                  (lastReached, stepIndex, sectionIndex) => stepIndex <= maxReached ? sectionIndex : lastReached,
                  0,
                ))}
                onJump={(sectionIndex) => {
                  const stepIndex = activeStepIndexes[sectionIndex];
                  if (stepIndex !== undefined) goToStep(stepIndex);
                }}
              />

              <SurveyErrorContext.Provider value={{ show: showErr, errors: stepErrors }}>
                <Box
                  component="form"
                  onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAttemptSubmit(); }}
                  sx={{
                    // Every input and select in the form gets a 48px touch target on phones (44px on larger screens).
                    '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { minHeight: { xs: 48, sm: 44 } },
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
                      '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(21,128,61,0.10)' },
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
                    <TextField inputProps={{ 'aria-labelledby': 'b_name-label' }} fullWidth variant="outlined" size="small" value={formValues['b_name'] || ''} onChange={(e) => handleInputChange('b_name', e.target.value)} />
                  </Box>



                  <Box>
                    <QuestionLabel fieldKey="b_address" text={getDynamicLabel('b_address', 'Address', 'ලිපිනය', 'முகவரி')} />
                    <TextField inputProps={{ 'aria-labelledby': 'b_address-label' }} fullWidth variant="outlined" size="small" value={formValues['b_address'] || ''} onChange={(e) => handleInputChange('b_address', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_owner_name" text={getDynamicLabel('b_owner_name', 'Business Owner Name', 'ව්‍යාපාර හිමියාගේ නම', 'உரிமையாளரின் பெயர்')} />
                    <TextField inputProps={{ 'aria-labelledby': 'b_owner_name-label' }} fullWidth variant="outlined" size="small" value={formValues['b_owner_name'] || ''} onChange={(e) => handleInputChange('b_owner_name', e.target.value)} />
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
                        inputProps={{ 'aria-labelledby': 'b_mobile-label', inputMode: 'tel', autoComplete: 'tel' }}
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
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="b_nic" text={getDynamicLabel('b_nic', 'NIC', 'NIC', 'தேசிய அடையாள அட்டை')} />
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      inputProps={{ 'aria-labelledby': 'b_nic-label', inputMode: 'text', autoCapitalize: 'characters', autoComplete: 'off' }}
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

                  {StepNav({
                    next: nextActiveStep(0),
                    before: () => {
                      if (!formValues['q_owner_name'] && formValues['b_owner_name']) {
                        setFormValues(prev => ({ ...prev, q_owner_name: prev['b_owner_name'] }));
                      }
                      if (!formValues['q_nic'] && formValues['b_nic']) {
                        setFormValues(prev => applyNicToDob({ ...prev, q_nic: prev['b_nic'] }, undefined, prev['b_nic']));
                      }
                    },
                  })}
                </Box>
              )}
              {currentStep === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, pb: 1.25, mb: 0.5, borderBottom: `1px solid ${T.lineSoft}` }}>
                    {language === 'si' ? 'ව්‍යාපාර හිමිකරු පිළිබඳ තොරතුරු' : language === 'ta' ? 'வணிக உரிமையாளர் தகவல்' : 'Business Owner Information'}
                  </Typography>

                  <Box>
                    <QuestionLabel fieldKey="q_owner_name" text={getDynamicLabel('q_owner_name', "Owner's Full Name", "හිමිකරුගේ සම්පූර්ණ නම", "உரிமையாளரின் முழுப் பெயர்")} />
                    <TextField inputProps={{ 'aria-labelledby': 'q_owner_name-label' }} fullWidth variant="outlined" size="small" value={formValues['q_owner_name'] || ''} onChange={(e) => handleInputChange('q_owner_name', e.target.value)} />
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
                    <TextField inputProps={{ 'aria-labelledby': 'q_nic-label' }} fullWidth variant="outlined" size="small" value={formValues['q_nic'] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormValues(prev => applyNicToDob({ ...prev, q_nic: val }, prev['q_nic'], val));
                      }}
                    />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_dob_age" text={getDynamicLabel('q_dob_age', 'Date of Birth / Age', 'උපන් දිනය / වයස', 'பிறந்த தேதி / வயது')} />
                    {(() => {
                      const dob = formValues['q_dob'] || '';
                      const age = calcAge(dob);
                      const nicDob = dobFromNIC(formValues['q_nic']);
                      const mismatch = !!dob && !!nicDob && dob !== nicDob;
                      return (
                        <>
                          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'stretch' }}>
                            <TextField
                              type="date"
                              size="small"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                              inputProps={{ 'aria-labelledby': 'q_dob_age-label',
                                min: MIN_DOB,
                                max: todayIso(),
                                'aria-label': L('Date of birth', 'උපන් දිනය', 'பிறந்த தேதி'),
                              }}
                              sx={{ flex: 1, minWidth: 0 }}
                            />
                            <Box
                              aria-live="polite"
                              sx={{
                                minWidth: 104, px: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                border: `1px solid ${T.line}`, borderRadius: `${T.field}px`, bgcolor: age !== null ? T.brandSoft : '#f8fafc',
                              }}
                            >
                              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, lineHeight: 1.2 }}>
                                {L('Age', 'වයස', 'வயது')}
                              </Typography>
                              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: age !== null ? T.ink : T.faint, lineHeight: 1.3 }}>
                                {age !== null ? L(`${age} years`, `අවු. ${age}`, `${age} வயது`) : '—'}
                              </Typography>
                            </Box>
                          </Box>
                          {mismatch && (
                            <Typography sx={{ mt: 0.75, fontSize: '0.8rem', color: '#B45309' }}>
                              {L(`This differs from the NIC (${nicDob}). Please check it.`, `මෙය ජා.හැ. අංකයේ දිනයට (${nicDob}) වෙනස්ය. කරුණාකර පරීක්ෂා කරන්න.`, `இது NIC தேதியிலிருந்து (${nicDob}) வேறுபடுகிறது. சரிபார்க்கவும்.`)}
                            </Typography>
                          )}
                        </>
                      );
                    })()}
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_whatsapp" text={getDynamicLabel('q_whatsapp', 'WhatsApp Number', 'වට්ස්ඇප් දුරකථන අංකය', 'வாட்ஸ்அப் எண்')} />
                    <TextField fullWidth variant="outlined" size="small" type="tel" inputProps={{ 'aria-labelledby': 'q_whatsapp-label', inputMode: 'tel', autoComplete: 'tel' }} value={formValues['q_whatsapp'] || ''} onChange={(e) => handleInputChange('q_whatsapp', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_mobile" text={getDynamicLabel('q_mobile', 'Main Phone Number', 'ප්‍රධාන දුරකථන අංකය', 'முக்கிய தொலைபேசி எண்')} />
                    <TextField fullWidth variant="outlined" size="small" type="tel" inputProps={{ 'aria-labelledby': 'q_mobile-label', inputMode: 'tel', autoComplete: 'tel' }} value={formValues['q_mobile'] || ''} onChange={(e) => handleInputChange('q_mobile', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_email" text={getDynamicLabel('q_email', 'Email Address (if any)', 'විද්‍යුත් තැපැල් ලිපිනය (ඇත්නම්)', 'மின்னஞ்சல் முகவரி (ஏதேனும் இருந்தால்)')} />
                    <TextField fullWidth variant="outlined" size="small" type="email" inputProps={{ 'aria-labelledby': 'q_email-label', inputMode: 'email', autoComplete: 'email' }} value={formValues['q_email'] || ''} onChange={(e) => handleInputChange('q_email', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_address" text={getDynamicLabel('q_address', 'Residential Address', 'නේවාසික ලිපිනය', 'குடியிருப்பு முகவரி')} />
                    <TextField inputProps={{ 'aria-labelledby': 'q_address-label' }} fullWidth variant="outlined" size="small" multiline rows={2} value={formValues['q_address'] || ''} onChange={(e) => handleInputChange('q_address', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_education" text={getDynamicLabel('q_education', 'Highest Educational Qualification', 'උසස්ම අධ්‍යාපන සුදුසුකම', 'மிக உயர்ந்த கல்வித் தகுதி')} />
                    <FormControl fullWidth size="small">
                      <Select value={formValues['q_education'] || ''} onChange={(e) => handleInputChange('q_education', e.target.value as string)}>
                        <MenuItem value="1. Primary">{language === 'si' ? '1. ප්‍රාථමික' : language === 'ta' ? '1. ஆரம்பக் கல்வி' : '1. Primary'}</MenuItem>
                        <MenuItem value="2. Secondary">{language === 'si' ? '2. ද්විතීයික' : language === 'ta' ? '2. இடைநிலைக் கல்வி' : '2. Secondary'}</MenuItem>
                        <MenuItem value="3. A-Level">{language === 'si' ? '3. උසස් පෙළ' : language === 'ta' ? '3. உயர்தர நிலை' : '3. A-Level'}</MenuItem>
                        <MenuItem value="4. Diploma">{language === 'si' ? '4. ඩිප්ලෝමා' : language === 'ta' ? '4. டிப்ளோமா' : '4. Diploma'}</MenuItem>
                        <MenuItem value="5. Degree">{language === 'si' ? '5. උපාධිය' : language === 'ta' ? '5. பட்டம்' : '5. Degree'}</MenuItem>
                        <MenuItem value="6. Postgraduate">{language === 'si' ? '6. උපාධියට වඩා ඉහළ' : language === 'ta' ? '6. முதுநிலை' : '6. Postgraduate'}</MenuItem>
                        <MenuItem value="7. No formal education">{language === 'si' ? '7. විධිමත් අධ්‍යාපනයක් නැත' : language === 'ta' ? '7. முறையான கல்வி இல்லை' : '7. No formal education'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_experience" text={getDynamicLabel('q_experience', 'Experience in this Industry (Years)', 'මෙම කර්මාන්තයේ පළපුරුද්ද (වසර)', 'இந்தத் துறையில் அனுபவம் (ஆண்டுகள்)')} />
                    <TextField fullWidth variant="outlined" size="small" type="number" inputProps={{ 'aria-labelledby': 'q_experience-label', inputMode: 'numeric', min: 0 }} value={formValues['q_experience'] || ''} onChange={(e) => handleInputChange('q_experience', e.target.value)} />
                  </Box>

                  <Box>
                    <QuestionLabel fieldKey="q_prev_occupation" text={getDynamicLabel('q_prev_occupation', 'Occupation before starting the industry', 'කර්මාන්තය ආරම්භ කිරීමට පෙර රැකියාව', 'தொழில் தொடங்கும் முன் வேலைவாய்ப்பு')} />
                    <TextField inputProps={{ 'aria-labelledby': 'q_prev_occupation-label' }} fullWidth variant="outlined" size="small" value={formValues['q_prev_occupation'] || ''} onChange={(e) => handleInputChange('q_prev_occupation', e.target.value)} />
                  </Box>

                  {StepNav({ prev: previousActiveStep(1), next: nextActiveStep(1) })}
                </Box>
              )}


              {isDynamicStep(currentStep) && activeStepIndexes.includes(currentStep) && renderDynamicStep(currentStep)}
                </Box>
              </SurveyErrorContext.Provider>
            </Box>
          </Container>
        </Box>
      )}

      {/* ── Location confirmation (opens immediately; details fill in as they load) ── */}
      <SurveyDialog
        open={!!ccode && !locationConfirmed && !showLocationSelector}
        tone={gnLookupFailed ? 'warning' : 'brand'}
        icon={gnLookupFailed ? <LocationOffRoundedIcon /> : <PlaceRoundedIcon />}
        title={gnLookupFailed
          ? L('We could not find this area', 'මෙම ප්‍රදේශය සොයා ගත නොහැකි විය', 'இந்தப் பகுதியைக் கண்டுபிடிக்க முடியவில்லை')
          : L('Is this your area?', 'මෙය ඔබේ ප්‍රදේශයද?', 'இது உங்கள் பகுதியா?')}
        subtitle={gnLookupFailed
          ? L('The link may be out of date. Please choose your Grama Niladhari division.', 'සබැඳිය යල් පැන ගොස් තිබිය හැක. කරුණාකර ඔබේ ග්‍රාම නිලධාරී වසම තෝරන්න.', 'இணைப்பு காலாவதியாகியிருக்கலாம். உங்கள் கிராம அலுவலர் பிரிவைத் தேர்ந்தெடுக்கவும்.')
          : L('Your business will be recorded under this Grama Niladhari division.', 'ඔබේ ව්‍යාපාරය මෙම ග්‍රාම නිලධාරී වසම යටතේ සටහන් වේ.', 'உங்கள் வணிகம் இந்தக் கிராம அலுவலர் பிரிவின் கீழ் பதிவு செய்யப்படும்.')}
        actions={gnLookupFailed ? (
          <DialogButton onClick={() => setShowLocationSelector(true)} startIcon={<MapRoundedIcon />}>
            {L('Choose my area', 'මගේ ප්‍රදේශය තෝරන්න', 'என் பகுதியைத் தேர்ந்தெடு')}
          </DialogButton>
        ) : (
          <>
            <DialogButton kind="secondary" onClick={() => setShowLocationSelector(true)}>
              {L('No, change area', 'නැත, වෙනස් කරන්න', 'இல்லை, மாற்று')}
            </DialogButton>
            <DialogButton
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => {
                setLocationConfirmed(true);
                if (localStorage.getItem(`survey_draft_${ccode}`)) setShowResumePopup(true);
                else setShowMetadataPopup(true);
              }}
            >
              {L('Yes, continue', 'ඔව්, ඉදිරියට', 'ஆம், தொடர்க')}
            </DialogButton>
          </>
        )}
      >
        {!gnLookupFailed && (
          <DetailList rows={[
            { icon: <PlaceRoundedIcon />, label: L('Village / GN division', 'ග්‍රාම නිලධාරී වසම', 'கிராம அலுவலர் பிரிவு'), value: areaName ? <>{areaName} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>({ccode})</Box></> : undefined },
            { icon: <ApartmentRoundedIcon />, label: L('DS division', 'ප්‍රාදේශීය ලේකම් කොට්ඨාසය', 'பிரதேச செயலகப் பிரிவு'), value: gnPick('ds') },
            { icon: <MapRoundedIcon />, label: L('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்'), value: gnPick('dis') },
          ]} />
        )}
      </SurveyDialog>

      <SurveyDialog
        open={recoveryOpen}
        onClose={recoveryBusy ? undefined : () => { setRecoveryOpen(false); setRecoveryCode(''); }}
        icon={<HistoryRoundedIcon />}
        title={L('Recover your saved draft', 'සුරැකි කෙටුම්පත නැවත ලබාගන්න', 'சேமித்த வரைவை மீட்கவும்')}
        subtitle={L(
          'Your answers have not been deleted. Ask the administrator to verify ownership and privately issue a recovery code for this draft. Never share the code publicly.',
          'ඔබේ පිළිතුරු මකා නැත. හිමිකාරීත්වය තහවුරු කර මෙම කෙටුම්පත සඳහා පුද්ගලික ප්‍රතිසාධන කේතයක් ලබාදෙන ලෙස පරිපාලකගෙන් ඉල්ලන්න. කේතය ප්‍රසිද්ධියේ බෙදා නොගන්න.',
          'உங்கள் பதில்கள் நீக்கப்படவில்லை. உரிமையைச் சரிபார்த்து இந்த வரைவுக்கான தனிப்பட்ட மீட்புக் குறியீட்டை வழங்க நிர்வாகியிடம் கேளுங்கள். குறியீட்டைப் பொதுவில் பகிர வேண்டாம்.',
        )}
        actions={<DialogButton disabled={recoveryBusy || !/^\d+$/.test(recoveryId) || recoveryCode.trim().length < 48} onClick={handleRecoverDraft}>
          {L('Recover draft', 'කෙටුම්පත නැවත ලබාගන්න', 'வரைவை மீட்கவும்')}
        </DialogButton>}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField label={L('Draft ID', 'කෙටුම්පත් අංකය', 'வரைவு எண்')} value={recoveryId} onChange={e => setRecoveryId(e.target.value)} disabled={recoveryBusy} inputProps={{ inputMode: 'numeric' }} />
          <TextField label={L('Private recovery code', 'පුද්ගලික ප්‍රතිසාධන කේතය', 'தனிப்பட்ட மீட்புக் குறியீடு')} type="password" autoComplete="off" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} disabled={recoveryBusy} />
          {recoveryError && <Typography role="alert" color="error">{recoveryError}</Typography>}
        </Box>
      </SurveyDialog>

      {/* ── Resume an unfinished survey ── */}
      <SurveyDialog
        open={showResumePopup}
        tone="info"
        icon={<HistoryRoundedIcon />}
        title={L('Pick up where you left off?', 'ඔබ නතර කළ තැනින් දිගටම කරගෙන යනවාද?', 'நிறுத்திய இடத்திலிருந்து தொடரவா?')}
        subtitle={L('You have an unfinished survey for this area. Your earlier answers are saved on this device.', 'මෙම ප්‍රදේශය සඳහා අසම්පූර්ණ සමීක්ෂණයක් ඇත. ඔබේ පෙර පිළිතුරු මෙම උපාංගයේ සුරැකී ඇත.', 'இந்தப் பகுதிக்கு முடிக்கப்படாத கணக்கெடுப்பு உள்ளது. உங்கள் முந்தைய பதில்கள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டுள்ளன.')}
        actions={
          <>
            <DialogButton
              kind="ghost"
              onClick={() => {
                localStorage.removeItem(`survey_draft_${ccode}`);
                localStorage.removeItem(`survey_draft_${ccode}_db_id`);
                localStorage.removeItem(`survey_draft_${ccode}_edit_token`);
                setFormValues({});
                setCurrentStep(0);
                setShowResumePopup(false);
                setShowMetadataPopup(true);
              }}
            >
              {L('Start over', 'අලුතින් අරඹන්න', 'புதிதாகத் தொடங்கு')}
            </DialogButton>
            <DialogButton
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => {
                const draftStr = localStorage.getItem(`survey_draft_${ccode}`);
                let started = new Date();
                if (draftStr) {
                  try {
                    const draft = JSON.parse(draftStr);
                    setFormValues(draft.formValues || {});
                    setGpsCoordinates(draft.gpsCoordinates || null);
                    if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
                    if (draft.surveyStartTime) started = new Date(draft.surveyStartTime);
                  } catch { /* corrupt draft: start fresh with the current time */ }
                }
                setSurveyStartTime(started);
                setShowResumePopup(false);
              }}
            >
              {L('Resume survey', 'නැවත අරඹන්න', 'தொடர்க')}
            </DialogButton>
          </>
        }
      />

      {/* ── Survey details before starting ── */}
      <SurveyDialog
        open={showMetadataPopup && !surveyStartTime}
        icon={<AssignmentRoundedIcon />}
        title={L('Ready to begin?', 'ආරම්භ කිරීමට සූදානම්ද?', 'தொடங்கத் தயாரா?')}
        subtitle={L('The start time is recorded when you tap Start, and the end time when you submit.', 'ඔබ "අරඹන්න" තට්ටු කළ විට ආරම්භක වේලාව ද, ඉදිරිපත් කළ විට අවසන් වේලාව ද සටහන් වේ.', '"தொடங்கு" தட்டும்போது தொடக்க நேரமும், சமர்ப்பிக்கும்போது முடிவு நேரமும் பதிவாகும்.')}
        actions={
          <DialogButton
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => {
              setSurveyStartTime(new Date());
              setShowMetadataPopup(false);
              setShowGpsPopup(true);
            }}
          >
            {L('Start survey', 'සමීක්ෂණය අරඹන්න', 'கணக்கெடுப்பைத் தொடங்கு')}
          </DialogButton>
        }
      >
        <DetailList rows={[
          { icon: <PlaceRoundedIcon />, label: L('Village / GN division', 'ග්‍රාම නිලධාරී වසම', 'கிராம அலுவலர் பிரிவு'), value: areaName || undefined },
          { icon: <ApartmentRoundedIcon />, label: L('DS division', 'ප්‍රාදේශීය ලේකම් කොට්ඨාසය', 'பிரதேச செயலகப் பிரிவு'), value: gnPick('ds') },
          { icon: <EventRoundedIcon />, label: L('Survey date', 'සමීක්ෂණ දිනය', 'கணக்கெடுப்பு தேதி'), value: new Date().toLocaleDateString(language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
          { icon: <PersonRoundedIcon />, label: L('Surveyor', 'සමීක්ෂකගේ නම', 'கணக்கெடுப்பாளர்'), value: surveyorName === 'Unknown' ? L('Not set', 'ලබා දී නැත', 'அமைக்கப்படவில்லை') : surveyorName },
        ]} />
      </SurveyDialog>

      {/* ── GPS ── */}
      <SurveyDialog
        open={showGpsPopup && !gpsErrorPopup}
        icon={<MyLocationRoundedIcon />}
        title={L('Are you at the business right now?', 'ඔබ දැන් ව්‍යාපාරික ස්ථානයේ සිටිනවාද?', 'நீங்கள் இப்போது வணிக இடத்தில் இருக்கிறீர்களா?')}
        subtitle={L('If yes, we will record its location from your phone. Nothing else on your device is accessed.', 'ඔව් නම්, ඔබේ දුරකථනයෙන් එහි ස්ථානය සටහන් කරමු. ඔබේ උපාංගයේ වෙනත් කිසිවක් භාවිත නොකෙරේ.', 'ஆம் எனில், உங்கள் தொலைபேசியிலிருந்து அதன் இருப்பிடத்தைப் பதிவு செய்வோம். வேறு எதுவும் அணுகப்படாது.')}
        actions={
          <>
            <DialogButton kind="secondary" disabled={gpsChecking} onClick={() => setShowGpsPopup(false)}>
              {L('No, skip', 'නැත, මඟ හරින්න', 'இல்லை, தவிர்')}
            </DialogButton>
            <DialogButton loading={gpsChecking} startIcon={<MyLocationRoundedIcon />} onClick={captureGps}>
              {L('Yes, use my location', 'ඔව්, මගේ ස්ථානය', 'ஆம், என் இருப்பிடம்')}
            </DialogButton>
          </>
        }
      >
        {gpsChecking ? (
          <Callout tone="info" icon={<CircularProgress size={18} sx={{ color: 'inherit' }} />}>
            {L('Finding your location… this can take a few seconds outdoors.', 'ඔබේ ස්ථානය සොයමින්… එළිමහනේ තත්පර කිහිපයක් ගත විය හැක.', 'இருப்பிடத்தைக் கண்டறிகிறது… சில விநாடிகள் ஆகலாம்.')}
          </Callout>
        ) : (
          <DetailList rows={[{ icon: <PlaceRoundedIcon />, label: L('Survey area', 'සමීක්ෂණ ප්‍රදේශය', 'கணக்கெடுப்புப் பகுதி'), value: areaName ? [areaName, gnPick('ds')].filter(Boolean).join(', ') : undefined }]} />
        )}
      </SurveyDialog>

      <SurveyDialog
        open={!!gpsErrorPopup}
        tone="danger"
        icon={<LocationOffRoundedIcon />}
        title={L('Location not available', 'ස්ථානය ලබා ගත නොහැක', 'இருப்பிடம் கிடைக்கவில்லை')}
        subtitle={gpsErrorPopup || undefined}
        actions={
          <>
            <DialogButton kind="secondary" disabled={gpsChecking} onClick={() => { setGpsErrorPopup(null); setShowGpsPopup(false); }}>
              {L('Continue without it', 'එය නොමැතිව ඉදිරියට', 'அது இல்லாமல் தொடர்க')}
            </DialogButton>
            <DialogButton loading={gpsChecking} startIcon={<RefreshRoundedIcon />} onClick={captureGps}>
              {L('Try again', 'නැවත උත්සාහ කරන්න', 'மீண்டும் முயற்சி')}
            </DialogButton>
          </>
        }
      >
        <Callout tone="info" icon={<InfoRoundedIcon />}>
          {L('Tap the lock icon next to the web address, allow Location, then try again.', 'ලිපිනය අසල ඇති අගුළු අයිකනය තට්ටු කර "Location" සඳහා අවසර දී නැවත උත්සාහ කරන්න.', 'இணைய முகவரிக்கு அருகிலுள்ள பூட்டு ஐகானைத் தட்டி, இருப்பிடத்தை அனுமதித்து மீண்டும் முயற்சிக்கவும்.')}
        </Callout>
      </SurveyDialog>

      <SurveyDialog
        open={!!gpsWrongLocationPopup}
        tone="warning"
        icon={<WarningAmberRoundedIcon />}
        title={L('You seem to be outside this area', 'ඔබ මෙම ප්‍රදේශයෙන් පිටත සිටින බව පෙනේ', 'நீங்கள் இந்தப் பகுதிக்கு வெளியே இருப்பதாகத் தெரிகிறது')}
        subtitle={L(`Your phone's location is not inside ${areaName || 'the selected GN division'}.`, `ඔබේ දුරකථනයේ ස්ථානය ${areaName || 'තෝරාගත් වසම'} තුළ නොවේ.`, `உங்கள் தொலைபேசியின் இருப்பிடம் ${areaName || 'தேர்ந்தெடுத்த பிரிவு'} உள்ளே இல்லை.`)}
        actions={
          <>
            <DialogButton kind="secondary" startIcon={<RefreshRoundedIcon />} onClick={() => { setGpsWrongLocationPopup(null); setShowGpsPopup(true); }}>
              {L('Try again', 'නැවත උත්සාහ කරන්න', 'மீண்டும் முயற்சி')}
            </DialogButton>
            <DialogButton kind="warning" onClick={() => { setGpsCoordinates(null); setGpsWrongLocationPopup(null); }}>
              {L('Continue without location', 'ස්ථානය නොමැතිව ඉදිරියට', 'இருப்பிடம் இல்லாமல் தொடர்க')}
            </DialogButton>
          </>
        }
      >
        <Callout tone="info" icon={<InfoRoundedIcon />}>
          {L('If you continue, the location is not saved. All your other answers are saved as normal.', 'ඔබ ඉදිරියට ගියහොත් ස්ථානය සුරැකෙන්නේ නැත. අනෙක් සියලු පිළිතුරු සාමාන්‍ය පරිදි සුරැකේ.', 'தொடர்ந்தால் இருப்பிடம் சேமிக்கப்படாது. மற்ற பதில்கள் வழக்கம்போல் சேமிக்கப்படும்.')}
        </Callout>
      </SurveyDialog>

      {/* ── Progress saved ── */}
      <SurveyDialog
        open={saveDraftDialogOpen}
        onClose={() => setSaveDraftDialogOpen(false)}
        tone="success"
        icon={<CloudDoneRoundedIcon />}
        title={L('Progress saved', 'ප්‍රගතිය සුරැකිණි', 'முன்னேற்றம் சேமிக்கப்பட்டது')}
        subtitle={L(`Saved at step ${currentStep + 1}. Come back any time and you will continue from here.`, `පියවර ${currentStep + 1} හිදී සුරැකිණි. ඕනෑම වේලාවක පැමිණ මෙතැන් සිට දිගටම කළ හැක.`, `படி ${currentStep + 1} இல் சேமிக்கப்பட்டது. எப்போது வேண்டுமானாலும் வந்து இங்கிருந்து தொடரலாம்.`)}
        actions={
          <>
            <DialogButton kind="secondary" onClick={() => { setSaveDraftDialogOpen(false); navigate(gnHomeUrl); }}>
              {L('Leave for now', 'දැනට පිටවන්න', 'இப்போது வெளியேறு')}
            </DialogButton>
            <DialogButton onClick={() => setSaveDraftDialogOpen(false)}>
              {L('Keep going', 'දිගටම කරන්න', 'தொடர்ந்து நிரப்பு')}
            </DialogButton>
          </>
        }
      />

      {/* ── Location selector: the same picker the GN page uses ── */}
      <GnLocationModal
        open={showLocationSelector}
        onClose={() => {
          // Closed without choosing: back to the area confirmation when an area is
          // already set, otherwise there is nothing to survey, so return home.
          setShowLocationSelector(false);
          if (!ccode) navigate(gnHomeUrl);
        }}
        onLocationSelected={(gn) => {
          const code = gn?.CCODE || gn?.ccode;
          if (!code || !gn?.nameEn) return;
          setShowLocationSelector(false);
          const slug = encodeURIComponent(String(gn.nameEn).trim().replace(/\s+/g, '-'));
          const query = presetType ? `?${new URLSearchParams({ type: presetType })}` : '';
          // fromSelector: the area was just chosen, so skip re-confirming it.
          navigate(`/industry-survey/${slug}/${encodeURIComponent(code)}${query}`, { state: { fromSelector: true } });
        }}
      />

      {/* ── Confirm submission ── */}
      <SurveyDialog
        open={submitDialogOpen}
        onClose={submitting ? undefined : () => setSubmitDialogOpen(false)}
        icon={<SendRoundedIcon />}
        title={L('Submit your survey?', 'සමීක්ෂණය ඉදිරිපත් කරනවාද?', 'கணக்கெடுப்பைச் சமர்ப்பிக்கவா?')}
        subtitle={L('Check the details below. After submitting, your business gets its public page.', 'පහත විස්තර පරීක්ෂා කරන්න. ඉදිරිපත් කළ පසු ඔබේ ව්‍යාපාරයට පොදු පිටුවක් ලැබේ.', 'கீழே உள்ள விவரங்களைச் சரிபார்க்கவும். சமர்ப்பித்த பிறகு உங்கள் வணிகத்திற்கு பொதுப் பக்கம் கிடைக்கும்.')}
        actions={
          <>
            <DialogButton kind="secondary" disabled={submitting} onClick={() => setSubmitDialogOpen(false)}>
              {L('Keep reviewing', 'තවත් පරීක්ෂා කරන්න', 'மேலும் சரிபார்')}
            </DialogButton>
            <DialogButton loading={submitting} startIcon={<SendRoundedIcon />} onClick={handleSubmit}>
              {L('Submit survey', 'ඉදිරිපත් කරන්න', 'சமர்ப்பி')}
            </DialogButton>
          </>
        }
      >
        <DetailList rows={[
          { icon: <CategoryRoundedIcon />, label: L('Business type', 'ව්‍යාපාර වර්ගය', 'வணிக வகை'), value: (selectedCategory && (language === 'si' ? selectedCategory.nameSi : language === 'ta' ? selectedCategory.nameTa : selectedCategory.nameEn)) || formValues['b_type_name'] || '—' },
          { icon: <TagRoundedIcon />, label: L('Registration number', 'ලියාපදිංචි අංකය', 'பதிவு எண்'), value: formValues['b_reg_no'] || '—' },
          { icon: <PlaceRoundedIcon />, label: L('Area', 'ප්‍රදේශය', 'பகுதி'), value: areaName || '—' },
          { icon: <CheckCircleRoundedIcon />, label: L('Answers given', 'ලබා දුන් පිළිතුරු', 'அளித்த பதில்கள்'), value: String(answeredCount) },
        ]} />
      </SurveyDialog>

      {/* ── OTP ── */}
      <SurveyDialog
        open={otpDialogOpen}
        onClose={otpVerifying ? undefined : () => setOtpDialogOpen(false)}
        tone="info"
        icon={<SmsRoundedIcon />}
        title={L('Enter the 6-digit code', 'අංක 6 කේතය ඇතුළත් කරන්න', '6 இலக்கக் குறியீட்டை உள்ளிடவும்')}
        subtitle={L(`We sent it by SMS to ${maskedMobile || 'your mobile'}.`, `එය ${maskedMobile || 'ඔබේ ජංගම දුරකථනයට'} SMS මඟින් යවන ලදී.`, `${maskedMobile || 'உங்கள் கைபேசிக்கு'} SMS மூலம் அனுப்பப்பட்டது.`)}
        actions={
          <>
            <DialogButton kind="ghost" disabled={otpVerifying || otpSending} onClick={handleSendOtp}>
              {otpSending ? L('Sending…', 'යවමින්…', 'அனுப்புகிறது…') : L('Resend code', 'නැවත යවන්න', 'மீண்டும் அனுப்பு')}
            </DialogButton>
            <DialogButton loading={otpVerifying} disabled={otpCode.length !== 6} onClick={handleVerifyOtp}>
              {L('Verify', 'තහවුරු කරන්න', 'சரிபார்')}
            </DialogButton>
          </>
        }
      >
        <TextField
          fullWidth
          autoFocus
          value={otpCode}
          onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && otpCode.length === 6 && !otpVerifying) handleVerifyOtp(); }}
          error={!!otpError}
          helperText={otpError || ' '}
          placeholder="••••••"
          inputProps={{
            inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, 'aria-label': L('6-digit code', 'අංක 6 කේතය', '6 இலக்கக் குறியீடு'),
            style: { textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.5em', paddingLeft: '0.5em' },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: '#FAFCF8' } }}
        />
      </SurveyDialog>

      {/* ── Submitted ── */}
      <SurveyDialog
        open={successDialogOpen}
        tone="success"
        icon={<CheckCircleRoundedIcon />}
        title={L('Survey submitted', 'සමීක්ෂණය ඉදිරිපත් කරන ලදී', 'கணக்கெடுப்பு சமர்ப்பிக்கப்பட்டது')}
        subtitle={L('Thank you. Keep your registration number for future reference.', 'ස්තූතියි. ඔබේ ලියාපදිංචි අංකය ඉදිරි අවශ්‍යතා සඳහා තබා ගන්න.', 'நன்றி. உங்கள் பதிவு எண்ணை எதிர்காலக் குறிப்புக்காக வைத்திருங்கள்.')}
        actions={
          <>
            <DialogButton kind="secondary" onClick={() => { setSuccessDialogOpen(false); navigate(gnHomeUrl); }}>
              {L('Back to area page', 'ප්‍රදේශ පිටුවට', 'பகுதிப் பக்கத்திற்கு')}
            </DialogButton>
            {submitSuccessData?.regNumber && (
              <DialogButton endIcon={<ArrowForwardRoundedIcon />} onClick={() => { setSuccessDialogOpen(false); navigate(`/business/${encodeURIComponent(submitSuccessData.regNumber)}`); }}>
                {L('View business page', 'ව්‍යාපාර පිටුව බලන්න', 'வணிகப் பக்கத்தைப் பார்')}
              </DialogButton>
            )}
          </>
        }
      >
        {submitSuccessData && (
          <DetailList rows={[
            { icon: <TagRoundedIcon />, label: L('Registration number', 'ලියාපදිංචි අංකය', 'பதிவு எண்'), value: submitSuccessData.regNumber || '—' },
            { icon: <ScheduleRoundedIcon />, label: L('Started – finished', 'ආරම්භය – අවසානය', 'தொடக்கம் – முடிவு'), value: `${submitSuccessData.startTime} – ${submitSuccessData.endTime}` },
          ]} />
        )}
      </SurveyDialog>

      {/* ── Already submitted before ── */}
      <SurveyDialog
        open={duplicatePromptOpen}
        tone="info"
        icon={<InfoRoundedIcon />}
        title={L('You already have a submission', 'ඔබට දැනටමත් ඉදිරිපත් කිරීමක් ඇත', 'நீங்கள் ஏற்கனவே சமர்ப்பித்துள்ளீர்கள்')}
        subtitle={L('Do you want to add another business?', 'ඔබට තවත් ව්‍යාපාරයක් එක් කිරීමට අවශ්‍යද?', 'மற்றொரு வணிகத்தைச் சேர்க்க விரும்புகிறீர்களா?')}
        actions={
          <>
            <DialogButton kind="secondary" onClick={() => { setDuplicatePromptOpen(false); navigate(gnHomeUrl); }}>
              {L('No, go back', 'නැත, ආපසු', 'இல்லை, திரும்பு')}
            </DialogButton>
            <DialogButton onClick={() => setDuplicatePromptOpen(false)}>
              {L('Yes, add another', 'ඔව්, තවත් එකක්', 'ஆம், மற்றொன்று')}
            </DialogButton>
          </>
        }
      />

      {/* ── Mobile not verified ── */}
      <SurveyDialog
        open={otpRequiredAlertOpen}
        tone="warning"
        icon={<SmsRoundedIcon />}
        title={L('Verify your mobile number first', 'පළමුව ජංගම අංකය තහවුරු කරන්න', 'முதலில் கைபேசி எண்ணைச் சரிபார்க்கவும்')}
        subtitle={L('We need a verified number before the survey can be submitted. It is on the first step.', 'සමීක්ෂණය ඉදිරිපත් කිරීමට පෙර තහවුරු කළ අංකයක් අවශ්‍යයි. එය පළමු පියවරේ ඇත.', 'சமர்ப்பிப்பதற்கு முன் சரிபார்க்கப்பட்ட எண் தேவை. அது முதல் படியில் உள்ளது.')}
        actions={
          <DialogButton
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => { setOtpRequiredAlertOpen(false); setSubmitDialogOpen(false); setCurrentStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            {L('Go to mobile number', 'ජංගම අංකයට යන්න', 'கைபேசி எண்ணுக்குச் செல்')}
          </DialogButton>
        }
      />

      {/* ── Generic message ── */}
      <SurveyDialog
        open={genericAlertPopup?.open || false}
        onClose={() => setGenericAlertPopup(null)}
        tone={genericAlertPopup?.tone || 'info'}
        icon={genericAlertPopup?.tone === 'success' ? <CheckCircleRoundedIcon /> : genericAlertPopup?.tone === 'danger' ? <ErrorOutlineRoundedIcon /> : genericAlertPopup?.tone === 'warning' ? <WarningAmberRoundedIcon /> : <InfoRoundedIcon />}
        title={genericAlertPopup?.title}
        subtitle={genericAlertPopup?.message}
        actions={
          <DialogButton sx={{ width: { xs: '100%', sm: 'auto' } }} onClick={() => setGenericAlertPopup(null)}>
            {L('OK', 'හරි', 'சரி')}
          </DialogButton>
        }
      />
      </Box>

      <LandingFooter
        lang={lang}
        copy={siteCopy}
        showCta={false}
        onStart={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onFind={() => navigate(`${gnHomeUrl}#types`)}
        onSection={(id) => navigate(`${gnHomeUrl}#section-${id}`)}
      />
    </Box>
  );
};

export default IndustrySurveyPage;







