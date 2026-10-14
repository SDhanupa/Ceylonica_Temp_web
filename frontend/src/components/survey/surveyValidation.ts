/* ──────────────────────────────────────────────────────────────────────────
   Industry survey — validation & verification logic
   Pure, framework-agnostic. `L(en, si, ta?)` supplies localized messages.

   Step layout (14 sections, 0..13):
     0  Basic Information            (hardcoded — b_* fields, OTP verified)
     1  Business Owner Information   (hardcoded — q_owner_name … q_prev_occupation)
     2..13 Legal / Location / Infrastructure / Capital / Workforce / Production /
           Finance / Market & Marketing / Innovation & Technology / Business
           Environment & Government / Environmental & Social / Future Needs
                                     (DB-driven — business_survey_questions)

   Steps 9-13 moved from hardcoded JSX to the database on 2026-09-10, matching
   how 2-8 already worked — see BusinessSurvey9to13QuestionSeeder. Only 0 and 1
   remain hardcoded: both carry logic no admin-editable question row can express
   (OTP verification, NIC-driven DOB/age prefill, business-category autocomplete,
   the b_*→q_* carry-over on first "Next").

   Option-value encoding differs between the two families of steps:
     • the still-hardcoded steps (0, 1) store the full label — "1. ඔව්"
     • DB-driven steps (2-13) store only the numeric prefix — "1"
   Every comparison below goes through `is()` / `hasOpt()`, which normalise to
   the numeric prefix, so a rule is correct under either encoding.
   ────────────────────────────────────────────────────────────────────────── */

export type FormValues = Record<string, string>;
export type Errors = Record<string, string>;
export type Translate = (en: string, si: string, ta?: string) => string;

export const TOTAL_STEPS = 14;

/** Steps rendered from `business_survey_questions` rather than hardcoded JSX. */
export const DYNAMIC_STEPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const isDynamicStep = (step: number) => DYNAMIC_STEPS.includes(step);

/* ── NIC parsing (also used to prefill DOB/age on the page) ───────────────── */
export const extractNICDetails = (nic: string): { dob: string; age: string } => {
  let year = 0;
  let dayText = 0;
  const cleanNic = (nic || '').trim().toUpperCase();

  if (cleanNic.length === 10) {
    year = 1900 + parseInt(cleanNic.substring(0, 2), 10);
    dayText = parseInt(cleanNic.substring(2, 5), 10);
  } else if (cleanNic.length === 12) {
    year = parseInt(cleanNic.substring(0, 4), 10);
    dayText = parseInt(cleanNic.substring(4, 7), 10);
  } else if (cleanNic.length === 9) {
    year = 1900 + parseInt(cleanNic.substring(0, 2), 10);
    dayText = parseInt(cleanNic.substring(2, 5), 10);
  } else {
    return { dob: '', age: '' };
  }

  if (isNaN(year) || isNaN(dayText)) return { dob: '', age: '' };
  if (dayText > 500) dayText -= 500;
  if (dayText < 1 || dayText > 366) return { dob: '', age: '' };

  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  if (!isLeapYear(year) && dayText > 59) dayText -= 1;

  const dob = new Date(year, 0);
  dob.setDate(dayText);

  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  const age = Math.abs(age_dt.getUTCFullYear() - 1970);

  return { dob: dob.toLocaleDateString(), age: age.toString() };
};

/* ── Low-level predicates ─────────────────────────────────────────────────── */
const isBlank = (s?: string) => !s || !s.trim();
const digitsOnly = (s: string) => (s || '').replace(/\D/g, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidNIC = (s: string) => {
  const c = (s || '').trim().toUpperCase();
  if (!/^(\d{9}[VX]?|\d{12})$/.test(c)) return false;
  const { dob, age } = extractNICDetails(c);
  return !!(dob && age);
};

export const isValidPhone = (s: string) => {
  const d = digitsOnly(s);
  // Sri Lankan mobile/land: 10 local digits (0XXXXXXXXX) or 11 with 94 country code.
  return /^0\d{9}$/.test(d) || /^94\d{9}$/.test(d);
};

export const isValidEmail = (s: string) => EMAIL_RE.test((s || '').trim());
const isCount = (s: string) => /^\d+$/.test(s.trim()); // non-negative integer
const asNumber = (s: string) => Number((s || '').trim());

/* Normalise an option value to its numeric prefix: "1. ඔව්" -> "1", "1" -> "1" */
const optNum = (s?: string) => (s || '').trim().split('.')[0].trim();
/** True when a single-select value is option `n`, under either encoding. */
const is = (val: string | undefined, n: string) => optNum(val) === n;
/** True when a multi-select value contains option `n`, under either encoding. */
const hasOpt = (val: string | undefined, n: string) =>
  (val || '').split(',').map((v) => optNum(v)).filter(Boolean).includes(n);

/* ──────────────────────────────────────────────────────────────────────────
   Rule engine
   ────────────────────────────────────────────────────────────────────────── */
type Ctx = {
  fv: FormValues;
  e: Errors;
  REQ: string;
  SEL: string;
  PICK: string;
  req: (id: string, msg?: string) => void;
  pick: (id: string) => void;
  count: (id: string, required?: boolean) => void;
  numRange: (id: string, min: number, max: number, required?: boolean) => void;
  L: Translate;
};

/* Per-field rules keyed by `field_key`. Used directly for the DB-driven steps
   (2..8), where the admin can add, reorder or remove questions at will — a
   question with no rule here is simply left unvalidated, because the
   `business_survey_questions` table carries no `is_required` column and
   force-requiring every row would block users on genuinely optional ones. */
const FIELD_RULES: Record<string, (c: Ctx) => void> = {
  /* — Legal status (step 2) — */
  q_legal_status: (c) => {
    c.req('q_legal_status', c.SEL);
    if (is(c.fv['q_legal_status'], '7')) c.req('q_legal_status_other');
  },
  q_is_registered: (c) => {
    c.req('q_is_registered', c.SEL);
    if (is(c.fv['q_is_registered'], '1') || is(c.fv['q_is_registered'], '2')) {
      c.pick('q_registered_agencies');
      if (hasOpt(c.fv['q_registered_agencies'], '6')) c.req('q_registered_agencies_other');
    }
    if (is(c.fv['q_is_registered'], '1')) c.req('q_registration_number');
  },
  q_has_vat: (c) => {
    c.req('q_has_vat', c.SEL);
    if (is(c.fv['q_has_vat'], '1')) c.req('q_vat_number');
  },

  /* — Location (step 3) — */
  q_business_location_type: (c) => c.req('q_business_location_type', c.SEL),
  q_business_address: (c) => c.req('q_business_address'),
  q_location_ownership: (c) => {
    c.req('q_location_ownership', c.SEL);
    if (is(c.fv['q_location_ownership'], '2')) c.numRange('q_rent_amount', 0, 100000000, true);
  },
  q_pay_building_tax: (c) => {
    c.req('q_pay_building_tax', c.SEL);
    if (is(c.fv['q_pay_building_tax'], '1')) c.numRange('q_building_tax_amount', 0, 100000000, true);
  },

  /* — Infrastructure & services (step 4) — */
  q_uses_electricity: (c) => c.req('q_uses_electricity', c.SEL),
  q_main_energy_source: (c) => c.pick('q_main_energy_source'),
  q_power_outages: (c) => c.count('q_power_outages'),
  q_water_source: (c) => c.req('q_water_source', c.SEL),
  q_water_storage: (c) => c.req('q_water_storage', c.SEL),
  q_internet_access: (c) => c.req('q_internet_access', c.SEL),
  q_telephone_service: (c) => c.pick('q_telephone_service'),

  /* — Capital (step 5) — */
  q_capital_sources: (c) => c.pick('q_capital_sources'),
  q_business_scale: (c) => c.req('q_business_scale', c.SEL),
  q_engagement_nature: (c) => c.req('q_engagement_nature', c.SEL),
  q_business_place: (c) => c.req('q_business_place', c.SEL),

  /* — Workforce (step 6) — */
  q_total_workers: (c) => {
    c.count('q_total_workers', true);
    const fv = c.fv;
    if (isCount(fv['q_total_workers'] || '') && (isCount(fv['q_female_workers'] || '') || isCount(fv['q_male_workers'] || ''))) {
      const total = asNumber(fv['q_total_workers']);
      const female = isCount(fv['q_female_workers'] || '') ? asNumber(fv['q_female_workers']) : 0;
      const male = isCount(fv['q_male_workers'] || '') ? asNumber(fv['q_male_workers']) : 0;
      if (female + male > total) {
        c.e['q_total_workers'] = c.L(
          'Female + male workers cannot exceed the total',
          'කාන්තා + පිරිමි සේවක සංඛ්‍යාව මුළු සංඛ්‍යාව ඉක්මවිය නොහැක',
          'பெண் + ஆண் பணியாளர்கள் மொத்தத்தை மீற முடியாது',
        );
      }
    }
  },
  q_female_workers: (c) => c.count('q_female_workers'),
  q_male_workers: (c) => c.count('q_male_workers'),
  q_paid_workers: (c) => c.count('q_paid_workers'),
  q_unpaid_family_workers: (c) => c.count('q_unpaid_family_workers'),
  q_contract_workers: (c) => c.count('q_contract_workers'),
  q_labor_contribution: (c) => c.req('q_labor_contribution', c.SEL),
  q_provides_training: (c) => c.req('q_provides_training', c.SEL),
  q_pays_epf: (c) => c.req('q_pays_epf', c.SEL),

  /* — Production (step 7) — */
  q_machinery_value: (c) => c.numRange('q_machinery_value', 0, 100000000000, false),
  q_production_daily: (c) => c.count('q_production_daily'),
  q_production_weekly: (c) => c.count('q_production_weekly'),
  q_production_monthly: (c) => c.count('q_production_monthly'),
  q_production_yearly: (c) => c.count('q_production_yearly'),
  q_production_capacity: (c) => c.numRange('q_production_capacity', 0, 100, false),
  q_operating_hours: (c) => c.numRange('q_operating_hours', 0, 24, false),
  q_material_sources: (c) => c.pick('q_material_sources'),
  q_material_license_req: (c) => {
    c.req('q_material_license_req', c.SEL);
    if (is(c.fv['q_material_license_req'], '1')) c.req('q_material_license_agency', c.SEL);
  },
  q_material_cost: (c) => c.numRange('q_material_cost', 0, 100000000000, false),
  q_waste_disposal: (c) => c.pick('q_waste_disposal'),
  q_waste_recycled: (c) => c.req('q_waste_recycled', c.SEL),
  q_waste_income: (c) => c.req('q_waste_income', c.SEL),

  /* — Finance (step 8) — */
  q_profit_calculated: (c) => {
    c.req('q_profit_calculated', c.SEL);
    if (is(c.fv['q_profit_calculated'], '1')) c.numRange('q_profit_percentage', 0, 100, true);
  },
  q_cost_calculated: (c) => {
    c.req('q_cost_calculated', c.SEL);
    if (is(c.fv['q_cost_calculated'], '1')) c.numRange('q_unit_cost', 0, 100000000000, true);
  },
  q_monthly_income: (c) => c.numRange('q_monthly_income', 0, 100000000000, false),
  q_monthly_expense: (c) => c.numRange('q_monthly_expense', 0, 100000000000, false),
  q_monthly_net_profit: (c) => c.numRange('q_monthly_net_profit', 0, 100000000000, false),
  q_profitable: (c) => c.req('q_profitable', c.SEL),
  q_loan_installment: (c) => c.numRange('q_loan_installment', 0, 100000000000, false),
  q_total_loan: (c) => c.numRange('q_total_loan', 0, 100000000000, false),
  q_personal_loan: (c) => c.numRange('q_personal_loan', 0, 100000000000, false),
  q_bank_account: (c) => {
    c.req('q_bank_account', c.SEL);
    if (is(c.fv['q_bank_account'], '1')) c.req('q_bank_name');
  },
  q_financial_records: (c) => c.req('q_financial_records', c.SEL),
  q_receives_salary: (c) => c.req('q_receives_salary', c.SEL),
  q_knows_financial_concepts: (c) => c.req('q_knows_financial_concepts', c.SEL),

  /* — Market & Marketing (step 9) — */
  q_customers: (c) => c.pick('q_customers'),
  q_market_extent: (c) => c.req('q_market_extent', c.SEL),
  q_customer_trend: (c) => c.req('q_customer_trend', c.SEL),
  q_has_competitors: (c) => {
    c.req('q_has_competitors', c.SEL);
    if (is(c.fv['q_has_competitors'], '1') || is(c.fv['q_has_competitors'], '2')) {
      c.req('q_competitor_influence', c.SEL);
    }
  },
  q_marketing_methods: (c) => c.pick('q_marketing_methods'),
  q_has_brand: (c) => c.req('q_has_brand', c.SEL),

  /* — Innovation & Technology (step 10) — */
  q_new_products: (c) => c.req('q_new_products', c.SEL),
  q_new_tech: (c) => c.req('q_new_tech', c.SEL),
  q_tech_devices: (c) => c.pick('q_tech_devices'),
  q_uses_internet_for_business: (c) => c.req('q_uses_internet_for_business', c.SEL),
  q_digital_payments: (c) => c.pick('q_digital_payments'),

  /* — Business Environment & Government (step 11) — */
  q_reg_certificates: (c) => c.pick('q_reg_certificates'),
  q_taxes_paid: (c) => c.pick('q_taxes_paid'),
  q_gov_support_received: (c) => c.pick('q_gov_support_received'),
  /* 9.3 barriers: a 1-5 severity rating, each with its own field rule so a
     missing one is reported against the right field. */
  q_barrier_finance: (c) => c.req('q_barrier_finance', c.L('Please rate this from 1 to 5', 'කරුණාකර 1 සිට 5 දක්වා ශ්‍රේණිගත කරන්න', 'தயவுசெய்து 1 முதல் 5 வரை மதிப்பிடவும்')),
  q_barrier_infrastructure: (c) => c.req('q_barrier_infrastructure', c.L('Please rate this from 1 to 5', 'කරුණාකර 1 සිට 5 දක්වා ශ්‍රේණිගත කරන්න', 'தயவுசெய்து 1 முதல் 5 வரை மதிப்பிடவும்')),
  q_barrier_taxes: (c) => c.req('q_barrier_taxes', c.L('Please rate this from 1 to 5', 'කරුණාකර 1 සිට 5 දක්වා ශ්‍රේණිගත කරන්න', 'தயவுசெய்து 1 முதல் 5 வரை மதிப்பிடவும்')),
  q_barrier_labor: (c) => c.req('q_barrier_labor', c.L('Please rate this from 1 to 5', 'කරුණාකර 1 සිට 5 දක්වා ශ්‍රේණිගත කරන්න', 'தயவுசெய்து 1 முதல் 5 வரை மதிப்பிடவும்')),
  q_barrier_laws: (c) => c.req('q_barrier_laws', c.L('Please rate this from 1 to 5', 'කරුණාකර 1 සිට 5 දක්වා ශ්‍රේණිගත කරන්න', 'தயவுசெய்து 1 முதல் 5 வரை மதிப்பிடவும்')),

  /* — Environmental & Social Impact (step 12) — */
  q_env_impact_assessed: (c) => c.req('q_env_impact_assessed', c.SEL),
  q_energy_saving: (c) => c.req('q_energy_saving', c.SEL),
  q_social_responsibility: (c) => c.req('q_social_responsibility', c.SEL),

  /* — Future Needs & Logistics (step 13) — */
  q_business_expansion: (c) => c.pick('q_business_expansion'),
  q_expected_gov_support: (c) => c.pick('q_expected_gov_support'),
  /* q_additional_comments: intentionally no rule — free-text, optional. */
};

/* ──────────────────────────────────────────────────────────────────────────
   Per-step validation.

   `dynamicKeys` — for the DB-driven steps (2..8), the `field_key`s actually
   rendered on that step right now (i.e. after `depends_on` filtering). Passing
   it keeps validation in step with what the user can actually see; omitting it
   makes those steps pass, which is the correct behaviour while the question
   set is still loading.
   ────────────────────────────────────────────────────────────────────────── */
export function getStepErrors(step: number, fv: FormValues, L: Translate, dynamicKeys?: string[]): Errors {
  const e: Errors = {};

  const REQ = L('This field is required', 'මෙම ක්ෂේත්‍රය අවශ්‍යයි', 'இந்த புலம் தேவை');
  const SEL = L('Please select an option', 'කරුණාකර විකල්පයක් තෝරන්න', 'ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்');
  const PICK = L('Select at least one option', 'අවම වශයෙන් එකක් තෝරන්න', 'குறைந்தது ஒன்றைத் தேர்ந்தெடுக்கவும்');
  const NUM = L('Enter a valid number', 'වලංගු අංකයක් ඇතුළත් කරන්න', 'சரியான எண்ணை உள்ளிடவும்');
  const WHOLE = L('Enter a whole number (0 or more)', 'නිඛිල සංඛ්‍යාවක් ඇතුළත් කරන්න (0 හෝ වැඩි)', 'முழு எண்ணை உள்ளிடவும்');

  const req = (id: string, msg = REQ) => { if (isBlank(fv[id])) e[id] = msg; };
  const pick = (id: string) => { if (isBlank(fv[id]) || fv[id].split(', ').filter(Boolean).length === 0) e[id] = PICK; };
  const count = (id: string, required = false) => {
    const val = fv[id];
    if (isBlank(val)) { if (required) e[id] = REQ; return; }
    if (!isCount(val)) e[id] = WHOLE;
  };
  const numRange = (id: string, min: number, max: number, required = false) => {
    const val = fv[id];
    if (isBlank(val)) { if (required) e[id] = REQ; return; }
    const n = asNumber(val);
    if (!isFinite(n)) e[id] = NUM;
    else if (n < min || n > max) e[id] = L(`Enter a value between ${min} and ${max}`, `${min} සහ ${max} අතර අගයක් ඇතුළත් කරන්න`, `${min} முதல் ${max} வரை உள்ளிடவும்`);
  };

  const ctx: Ctx = { fv, e, REQ, SEL, PICK, req, pick, count, numRange, L };

  /* DB-driven steps: apply whatever rules exist for the visible questions. */
  if (isDynamicStep(step)) {
    (dynamicKeys || []).forEach((key) => FIELD_RULES[key]?.(ctx));
    return e;
  }

  switch (step) {
    /* ── 0. Basic Information ─────────────────────────────────────────────── */
    case 0: {
      req('b_name');
      req('b_address');
      req('b_owner_name');
      if (isBlank(fv['b_mobile'])) e['b_mobile'] = REQ;
      else if (!isValidPhone(fv['b_mobile'])) e['b_mobile'] = L('Enter a valid phone number', 'වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න', 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்');
      req('b_type', SEL);
      if (!isBlank(fv['b_nic']) && !isValidNIC(fv['b_nic'])) {
        e['b_nic'] = L('Enter a valid NIC number', 'වලංගු ජා.හැ. අංකයක් ඇතුළත් කරන්න', 'சரியான தேசிய அடையாள எண்ணை உள்ளிடவும்');
      }
      break;
    }

    /* ── 1. Business Owner Information ────────────────────────────────────── */
    case 1: {
      req('q_owner_name');
      req('q_gender', SEL);
      if (isBlank(fv['q_nic'])) e['q_nic'] = REQ;
      else if (!isValidNIC(fv['q_nic'])) e['q_nic'] = L('Enter a valid NIC number', 'වලංගු ජා.හැ. අංකයක් ඇතුළත් කරන්න', 'சரியான தேசிய அடையாள எண்ணை உள்ளிடவும்');
      if (isBlank(fv['q_mobile'])) e['q_mobile'] = REQ;
      else if (!isValidPhone(fv['q_mobile'])) e['q_mobile'] = L('Enter a valid phone number', 'වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න', 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்');
      if (!isBlank(fv['q_whatsapp']) && !isValidPhone(fv['q_whatsapp'])) e['q_whatsapp'] = L('Enter a valid phone number', 'වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න', 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்');
      if (!isBlank(fv['q_email']) && !isValidEmail(fv['q_email'])) e['q_email'] = L('Enter a valid email address', 'වලංගු විද්‍යුත් තැපෑලක් ඇතුළත් කරන්න', 'சரியான மின்னஞ்சலை உள்ளிடவும்');
      req('q_education', SEL);
      count('q_experience');
      break;
    }

    /* Steps 9-13 are DB-driven now (see isDynamicStep above) and are handled
       by the branch at the top of this function via FIELD_RULES. */

    default:
      break;
  }

  return e;
}

/**
 * First step (0..13) that has any validation error, or -1 when the whole survey
 * is valid. `dynamicKeysByStep` maps a DB-driven step index to the field keys
 * currently visible on it.
 */
export function getFirstInvalidStep(
  fv: FormValues,
  L: Translate,
  dynamicKeysByStep?: Record<number, string[]>,
): number {
  for (let s = 0; s < TOTAL_STEPS; s++) {
    if (Object.keys(getStepErrors(s, fv, L, dynamicKeysByStep?.[s])).length > 0) return s;
  }
  return -1;
}
