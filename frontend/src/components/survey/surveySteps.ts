/* ──────────────────────────────────────────────────────────────────────────
   Industry survey — step identity (single source of truth)

   The step titles used to live in two places: `stepTitles` inside
   IndustrySurveyPage (what respondents see) and `STEP_LABELS` inside
   AdminIndustrySurveysQuestions (what admins see). They drifted, and the admin
   copy also stopped at step 8 — so questions saved to steps 9-13 were live on
   the form but invisible in the builder. Both screens now read from here.

   Step count and which steps are DB-driven are owned by surveyValidation.ts;
   this module only names them.
   ────────────────────────────────────────────────────────────────────────── */

import { TOTAL_STEPS, isDynamicStep } from './surveyValidation';

export interface SurveyStepMeta {
  index: number;
  en: string;
  si: string;
  ta: string;
  /**
   * Rendered from hardcoded JSX rather than from `business_survey_questions`.
   * Their rows exist only to carry editable labels/explanations, so the builder
   * must not offer to change their field key, type or step.
   */
  hardcoded: boolean;
}

export const SURVEY_STEPS: SurveyStepMeta[] = [
  { index: 0, en: 'Basic Information', si: 'මූලික තොරතුරු', ta: 'அடிப்படை தகவல்கள்', hardcoded: true },
  { index: 1, en: 'Business Owner', si: 'ව්‍යාපාර හිමිකරු', ta: 'வணிக உரிமையாளர்', hardcoded: true },
  { index: 2, en: 'Legal Status of the Business', si: 'ව්‍යාපාරයේ නීතිමය තත්ත්වය', ta: 'வணிகத்தின் சட்ட நிலை', hardcoded: false },
  { index: 3, en: 'Location & Infrastructure', si: 'ස්ථානය හා යටිතල පහසුකම්', ta: 'இடம் மற்றும் உள்கட்டமைப்பு', hardcoded: false },
  { index: 4, en: 'Infrastructure and Services', si: 'යටිතල පහසුකම් හා සේවා', ta: 'உள்கட்டமைப்பு மற்றும் சேவைகள்', hardcoded: false },
  { index: 5, en: 'Capital Sources', si: '3 වන කොටස: ප්‍රාග්ධන මූලාශ්‍ර', ta: '3 வது பகுதி: மூலதன ஆதாரங்கள்', hardcoded: false },
  { index: 6, en: 'Workforce & Human Resources', si: '4 වන කොටස: ශ්‍රම බලකාය හා මානව සම්පත්', ta: '4 வது பகுதி: பணியாளர்கள் & மனித வளங்கள்', hardcoded: false },
  { index: 7, en: 'Production & Operations', si: '5 වන කොටස: නිෂ්පාදනය හා මෙහෙයුම්', ta: '5 வது பகுதி: உற்பத்தி & செயல்பாடுகள்', hardcoded: false },
  { index: 8, en: 'Finance & Accounting', si: '6 වන කොටස: මූල්‍ය හා ගිණුම්කරණය', ta: '6 வது பகுதி: நிதி & கணக்கியல்', hardcoded: false },
  { index: 9, en: 'Market & Marketing', si: '7 වන කොටස: වෙළඳපොළ හා අලෙවිකරණය', ta: '7 வது பகுதி: சந்தை & சந்தைப்படுத்தல்', hardcoded: false },
  { index: 10, en: 'Innovation & Technology', si: '8 වන කොටස: නවෝත්පාදන හා තාක්ෂණය', ta: '8 வது பகுதி: புதுமை & தொழில்நுட்பம்', hardcoded: false },
  { index: 11, en: 'Business Environment & Government', si: '9 වන කොටස: ව්‍යාපාරික පරිසරය හා රාජ්‍ය මැදිහත්වීම', ta: '9 வது பகுதி: வணிகச் சூழல் & அரசு தலையீடு', hardcoded: false },
  { index: 12, en: 'Environmental & Social Impact', si: '10 වන කොටස: පාරිසරික හා සමාජීය බලපෑම', ta: '10 வது பகுதி: சுற்றுச்சூழல் & சமூக தாக்கம்', hardcoded: false },
  { index: 13, en: 'Future Needs & Logistics', si: '11 වන කොටස: අනාගත අවශ්‍යතා සහ ලොජිස්ටික්ස්', ta: '11 வது பகுதி: எதிர்கால தேவைகள் & தளவாடங்கள்', hardcoded: false },
];

if (SURVEY_STEPS.length !== TOTAL_STEPS) {
  throw new Error(
    `surveySteps.ts defines ${SURVEY_STEPS.length} steps but surveyValidation.ts declares TOTAL_STEPS=${TOTAL_STEPS}.`,
  );
}

export const MAX_STEP_INDEX = TOTAL_STEPS - 1;

export const getStepMeta = (index: number): SurveyStepMeta | undefined =>
  SURVEY_STEPS.find((s) => s.index === index);

export const stepTitle = (index: number, language: 'en' | 'si' | 'ta'): string => {
  const meta = getStepMeta(index);
  if (!meta) return `Step ${index}`;
  return (language === 'si' ? meta.si : language === 'ta' ? meta.ta : meta.en) || meta.en;
};

/**
 * The DB-driven steps only, in the record shape IndustrySurveyPage's section
 * heading expects. Steps 0-1 are deliberately excluded: that page falls back to
 * its own localised strings for them via the progress-header helper.
 */
export const DYNAMIC_STEP_TITLES: Record<number, { en: string; si: string; ta: string }> =
  SURVEY_STEPS.filter((s) => isDynamicStep(s.index)).reduce(
    (acc, s) => {
      acc[s.index] = { en: s.en, si: s.si, ta: s.ta };
      return acc;
    },
    {} as Record<number, { en: string; si: string; ta: string }>,
  );
