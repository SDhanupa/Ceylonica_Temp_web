import React from 'react';
import { Alert, Button, Dialog, DialogContent, DialogTitle, IconButton, Skeleton, TextField } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { publicPhotoUrls, publicProfileDetails } from '../utils/publicBusinessProfile';
import './PublicBusinessProfilePage.css';

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
const fallbackLabel = (key: string) => key.replace(/^(b|q)_/, '').split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const PublicBusinessProfilePage: React.FC = () => {
  const { regNumber = '' } = useParams<{ regNumber: string }>();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [business, setBusiness] = React.useState<PublicBusiness | null>(null);
  const [questions, setQuestions] = React.useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = React.useState(Boolean(regNumber));
  const [error, setError] = React.useState<'not-found' | 'unavailable' | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [lookup, setLookup] = React.useState('');
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const [activePhoto, setActivePhoto] = React.useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = React.useState<string[]>([]);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>();
  const L = (en: string, si: string, ta: string) => language === 'si' ? si : language === 'ta' ? ta : en;
  const registrationLabel = L('Registration number', 'ලියාපදිංචි අංකය', 'பதிவு எண்');
  const profileLabel = L('Business profile', 'ව්‍යාපාර පැතිකඩ', 'வணிக சுயவிவரம்');
  const galleryLabel = L('Business photos', 'ව්‍යාපාරයේ ඡායාරූප', 'வணிகப் புகைப்படங்கள்');
  const copyLabel = L('Copy profile link', 'පැතිකඩ සබැඳිය පිටපත් කරන්න', 'சுயவிவர இணைப்பை நகலெடுக்கவும்');

  React.useEffect(() => {
    setBusiness(null); setQuestions([]); setError(null); setActivePhoto(null); setFailedPhotos([]); setCopyState('idle');
    if (!regNumber) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    // A failed question-label request must not hide an otherwise available profile.
    fetch('/api/business-survey-questions', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        if (!controller.signal.aborted && payload?.success && Array.isArray(payload.data)) setQuestions(payload.data);
      }).catch(() => {});
    fetch(`/api/public/business/${encodeURIComponent(regNumber)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 404 ? 'not-found' : 'unavailable');
        const profile = await response.json();
        if (!profile?.reg_number || !profile.form_values || typeof profile.form_values !== 'object' || Array.isArray(profile.form_values)) throw new Error('unavailable');
        if (!controller.signal.aborted) setBusiness(profile);
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason.message === 'not-found' ? 'not-found' : 'unavailable');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [regNumber, attempt]);
  React.useEffect(() => () => { clearTimeout(copyTimer.current); }, []);
  React.useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${business?.form_values.b_name || profileLabel} | Ceylonica`;
  }, [business, language, profileLabel]);

  const questionByKey = React.useMemo(() => new Map(questions.map(question => [question.field_key, question])), [questions]);
  const details = React.useMemo(() => publicProfileDetails(business?.form_values || {}), [business]);
  const photoUrls = React.useMemo(() => publicPhotoUrls(business?.form_values.b_photo), [business]);
  const availablePhotos = photoUrls.filter(url => !failedPhotos.includes(url));
  const businessName = business?.form_values.b_name || L('Registered business', 'ලියාපදිංචි ව්‍යාපාරය', 'பதிவுசெய்யப்பட்ட வணிகம்');
  const location = [business?.gn_name, business?.ds_division, business?.district].filter(Boolean).join(', ');
  const fieldLabel = (key: string) => {
    const dynamic = questionByKey.get(key);
    if (dynamic) return language === 'si' ? dynamic.question_si || dynamic.question_en : language === 'ta' ? dynamic.question_ta || dynamic.question_en : dynamic.question_en;
    return STATIC_LABELS[key]?.[language] || fallbackLabel(key);
  };
  const fieldValue = (key: string, value: string) => {
    const question = questionByKey.get(key);
    const options = question?.options_json?.[language] || question?.options_json?.en || [];
    if (!options.length) return value;
    return value.split(',').map(answer => {
      const trimmed = answer.trim();
      return options.find(option => option.split('.')[0].trim() === trimmed) || trimmed;
    }).join(', ');
  };
  const copyLink = async () => {
    clearTimeout(copyTimer.current);
    try {
      // Never share incidental query strings or fragments alongside the public link.
      await navigator.clipboard.writeText(`${window.location.origin}/business/${encodeURIComponent(business!.reg_number)}`);
      setCopyState('copied');
      copyTimer.current = setTimeout(() => setCopyState('idle'), 3000);
    } catch { setCopyState('failed'); }
  };
  const photoFailed = (url: string) => setFailedPhotos(previous => previous.includes(url) ? previous : [...previous, url]);
  const galleryIndex = activePhoto === null ? 0 : Math.min(activePhoto, Math.max(0, availablePhotos.length - 1));
  const lookupForm = <form className="business-lookup-form" onSubmit={event => {
    event.preventDefault();
    if (lookup.trim()) navigate(`/business/${encodeURIComponent(lookup.trim())}`);
  }}>
    <TextField fullWidth required label={registrationLabel} value={lookup} onChange={event => setLookup(event.target.value)}
      placeholder="RAOPA/1341124/01" inputProps={{ maxLength: 160 }} />
    <Button type="submit" variant="contained" className="business-primary" endIcon={<SearchRoundedIcon />}>
      {L('Find business', 'ව්‍යාපාරය සොයන්න', 'வணிகத்தைத் தேடுங்கள்')}
    </Button>
  </form>;

  return <div className="business-page" lang={language}>
    <a className="business-skip" href="#business-main">{L('Skip to content', 'අන්තර්ගතයට යන්න', 'உள்ளடக்கத்திற்குச் செல்லவும்')}</a>
    <header className="business-header"><div className="business-shell business-header-inner">
      <Link to="/gnpage" className="business-brand" aria-label={L('Ceylonica home', 'Ceylonica මුල් පිටුව', 'Ceylonica முகப்பு')}>
        <img src="/logo-96.webp" alt="CDIC" width="44" height="44" />
        <span>Ceylonica<small>{L('Business community', 'ව්‍යාපාරික ප්‍රජාව', 'வணிக சமூகம்')}</small></span>
      </Link>
      <nav className="business-languages" aria-label={L('Language', 'භාෂාව', 'மொழி')}>
        {(['si', 'ta', 'en'] as const).map(lang => <button key={lang} type="button" lang={lang}
          aria-label={{ si: 'සිංහල', ta: 'தமிழ்', en: 'English' }[lang]} aria-pressed={language === lang}
          onClick={() => setLanguage(lang)}>{{ si: 'සිං', ta: 'தமிழ்', en: 'EN' }[lang]}</button>)}
      </nav>
    </div></header>
    <main id="business-main" className="business-shell" tabIndex={-1}>
      <nav className="business-breadcrumb" aria-label={L('Breadcrumb', 'පිටු මාර්ගය', 'பக்க வழிகாட்டி')}>
        <Link to="/gnpage"><ArrowBackRoundedIcon fontSize="small" />{L('Home', 'මුල් පිටුව', 'முகப்பு')}</Link>
        <span aria-hidden="true">/</span><span>{profileLabel}</span>
      </nav>
      {!regNumber ? <section className="business-lookup">
        <div className="business-lookup-art" aria-hidden="true"><StorefrontOutlinedIcon /></div>
        <div><h1>{L('Every business has a story.', 'සෑම ව්‍යාපාරයකටම කතාවක් ඇත.', 'ஒவ்வொரு வணிகத்திற்கும் ஒரு கதை உண்டு.')}</h1>
          <p>{L('Enter a registration number to explore its business profile, photos and details.', 'ව්‍යාපාර පැතිකඩ, ඡායාරූප සහ විස්තර බැලීමට ලියාපදිංචි අංකය ඇතුළත් කරන්න.', 'வணிக சுயவிவரம், புகைப்படங்கள் மற்றும் விவரங்களைப் பார்க்க பதிவு எண்ணை உள்ளிடவும்.')}</p>
          {lookupForm}
        </div>
      </section> : loading ? <section className="business-loading" role="status" aria-label={L('Loading business profile', 'ව්‍යාපාර පැතිකඩ පූරණය වෙමින් පවතී', 'வணிக சுயவிவரம் ஏற்றப்படுகிறது')}>
        <div><Skeleton width="45%" height={32} /><Skeleton width="85%" height={80} /><Skeleton width="65%" height={32} /><Skeleton width="55%" height={52} /></div>
        <Skeleton variant="rounded" height={340} />
      </section> : error || !business ? <section className="business-error">
        <StorefrontOutlinedIcon className="business-state-icon" />
        <h1>{error === 'not-found' ? L('Profile not found', 'පැතිකඩ හමු නොවීය', 'சுயவிவரம் காணப்படவில்லை') : L('Unable to load this profile', 'මෙම පැතිකඩ පූරණය කළ නොහැක', 'இந்தச் சுயவிவரத்தை ஏற்ற முடியவில்லை')}</h1>
        <p>{error === 'not-found' ? L('Check the registration number or ask the business owner for their profile link.', 'ලියාපදිංචි අංකය පරීක්ෂා කරන්න හෝ ව්‍යාපාර හිමිකරුගෙන් පැතිකඩ සබැඳිය ඉල්ලන්න.', 'பதிவு எண்ணைச் சரிபார்க்கவும் அல்லது வணிக உரிமையாளரிடம் சுயவிவர இணைப்பைக் கேட்கவும்.') : L('Check your connection and try again. Your saved information has not changed.', 'ඔබේ සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න. සුරැකි තොරතුරු වෙනස් වී නැත.', 'உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும். சேமித்த தகவல்கள் மாறவில்லை.')}</p>
        {error !== 'not-found' && <Button className="business-primary" variant="contained" onClick={() => setAttempt(value => value + 1)}>{L('Try again', 'නැවත උත්සාහ කරන්න', 'மீண்டும் முயற்சிக்கவும்')}</Button>}
        {lookupForm}
      </section> : <>
        <section className="business-hero" aria-labelledby="business-name">
          <div className="business-intro">
            <span className="business-profile-tag"><StorefrontOutlinedIcon fontSize="small" />{profileLabel}</span>
            <h1 id="business-name">{businessName}</h1>
            {business.form_values.b_type_name && <p className="business-category">{business.form_values.b_type_name}</p>}
            {location && <p className="business-hero-location"><LocationOnOutlinedIcon fontSize="small" /><span>{location}</span></p>}
            <div className="business-hero-actions">
              <Button component="a" href="#business-details" className="business-light" endIcon={<ArrowForwardRoundedIcon />}>
                {L('Explore business', 'ව්‍යාපාර විස්තර බලන්න', 'வணிக விவரங்களைப் பாருங்கள்')}
              </Button>
              <Button onClick={copyLink} className="business-ghost" startIcon={copyState === 'copied' ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}>
                {copyState === 'copied' ? L('Copied', 'පිටපත් කළා', 'நகலெடுக்கப்பட்டது') : L('Copy link', 'සබැඳිය පිටපත් කරන්න', 'இணைப்பை நகலெடுக்கவும்')}
              </Button>
            </div>
          </div>
          <div className="business-hero-media">
            {availablePhotos.length > 0 ? <button className="business-cover" onClick={() => setActivePhoto(0)} aria-label={L('Open business photo', 'ව්‍යාපාරයේ ඡායාරූපය විවෘත කරන්න', 'வணிகப் புகைப்படத்தைத் திறக்கவும்')}>
              <img src={availablePhotos[0]} alt={businessName} onError={() => photoFailed(availablePhotos[0])} />
              <span className="business-photo-count"><PhotoLibraryOutlinedIcon fontSize="small" />{availablePhotos.length} {L('photos', 'ඡායාරූප', 'புகைப்படங்கள்')}<OpenInFullRoundedIcon fontSize="small" /></span>
            </button> : <div className="business-no-photo">
              <StorefrontOutlinedIcon aria-hidden="true" />
              <strong>{L('A place for this business', 'මෙම ව්‍යාපාරය සඳහා ඉඩක්', 'இந்த வணிகத்திற்கான ஓர் இடம்')}</strong>
              <span>{photoUrls.length ? L('Photos are currently unavailable', 'ඡායාරූප දැනට ලබාගත නොහැක', 'புகைப்படங்கள் தற்போது கிடைக்கவில்லை') : L('No business photos added yet', 'තවම ව්‍යාපාර ඡායාරූප එක් කර නැත', 'வணிகப் புகைப்படங்கள் இன்னும் சேர்க்கப்படவில்லை')}</span>
            </div>}
          </div>
        </section>
        <div className="business-content">
          <div className="business-main-column">
            <section id="business-details" className="business-details" aria-labelledby="business-details-title">
              <h2 id="business-details-title">{L('Get to know the business', 'ව්‍යාපාරය ගැන දැනගන්න', 'வணிகத்தை அறிந்துகொள்ளுங்கள்')}</h2>
              <p className="business-section-description">{L('Information shared through the business registration.', 'ව්‍යාපාර ලියාපදිංචියේදී ලබා දුන් තොරතුරු.', 'வணிகப் பதிவின்போது பகிரப்பட்ட தகவல்கள்.')}</p>
              {details.length ? <dl className="business-detail-list">
                {details.map(([key, value]) => <div key={key} className="business-detail-row"><dt>{fieldLabel(key)}</dt><dd>{fieldValue(key, value)}</dd></div>)}
              </dl> : <p>{L('No additional details have been shared.', 'අමතර විස්තර ලබා දී නැත.', 'கூடுதல் விவரங்கள் பகிரப்படவில்லை.')}</p>}
            </section>
            {availablePhotos.length > 0 && <section className="business-gallery" aria-labelledby="business-gallery-title">
              <div className="business-section-heading"><h2 id="business-gallery-title">{galleryLabel}</h2><span>{availablePhotos.length}</span></div>
              <div className="business-photo-grid">{availablePhotos.map((url, index) => <button key={url} onClick={() => setActivePhoto(index)} aria-label={`${galleryLabel} ${index + 1}`}>
                <img src={url} alt={`${businessName} — ${index + 1}`} loading="lazy" onError={() => photoFailed(url)} />
                <span><OpenInFullRoundedIcon fontSize="small" /></span>
              </button>)}</div>
            </section>}
          </div>
          <aside className="business-sidebar">
            <section className="business-registration" aria-labelledby="business-registration-title">
              <StorefrontOutlinedIcon aria-hidden="true" />
              <h2 id="business-registration-title">{registrationLabel}</h2>
              <p className="business-registration-number">{business.reg_number}</p>
              <p>{L('A direct link to this business and its shared details.', 'මෙම ව්‍යාපාරය සහ එහි විස්තර සඳහා සෘජු සබැඳියක්.', 'இந்த வணிகம் மற்றும் பகிரப்பட்ட விவரங்களுக்கான நேரடி இணைப்பு.')}</p>
              <Button fullWidth variant="contained" className="business-primary" onClick={copyLink} startIcon={copyState === 'copied' ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}>
                {copyState === 'copied' ? L('Link copied', 'සබැඳිය පිටපත් කළා', 'இணைப்பு நகலெடுக்கப்பட்டது') : copyLabel}
              </Button>
              <span className="business-copy-status" role="status">{copyState === 'copied' ? L('Ready to paste and share.', 'බෙදා ගැනීමට සූදානම්.', 'ஒட்டிப் பகிரத் தயார்.') : ''}</span>
              {copyState === 'failed' && <Alert severity="info">{L('Copying is unavailable. Copy the address from your browser to share this page.', 'පිටපත් කළ නොහැක. මෙම පිටුව බෙදා ගැනීමට බ්‍රවුසරයේ ලිපිනය පිටපත් කරන්න.', 'நகலெடுக்க முடியவில்லை. இந்தப் பக்கத்தைப் பகிர உலாவியின் முகவரியை நகலெடுக்கவும்.')}</Alert>}
            </section>
            {location && <section className="business-location" aria-labelledby="business-location-title">
              <div className="business-location-heading"><LocationOnOutlinedIcon /><h2 id="business-location-title">{L('Where we are', 'අප සිටින ස්ථානය', 'எங்கள் இருப்பிடம்')}</h2></div>
              <dl>{[
                [L('GN division', 'ග්‍රාම නිලධාරී වසම', 'கிராம அலுவலர் பிரிவு'), business.gn_name],
                [L('DS division', 'ප්‍රාදේශීය ලේකම් කොට්ඨාසය', 'பிரதேச செயலகப் பிரிவு'), business.ds_division],
                [L('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்'), business.district],
              ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </section>}
          </aside>
        </div>
      </>}
    </main>
    <footer className="business-footer business-shell"><span>Ceylonica</span><p>{L('Connecting local businesses and communities.', 'දේශීය ව්‍යාපාර සහ ප්‍රජාවන් සම්බන්ධ කරමින්.', 'உள்ளூர் வணிகங்களையும் சமூகங்களையும் இணைக்கிறது.')}</p><Link to="/gnpage">{L('Back to home', 'මුල් පිටුවට යන්න', 'முகப்புக்குத் திரும்புக')}</Link></footer>
    <Dialog open={activePhoto !== null} onClose={() => setActivePhoto(null)} maxWidth="lg" fullWidth aria-labelledby="business-photo-dialog-title">
      <DialogTitle id="business-photo-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {galleryLabel}<IconButton onClick={() => setActivePhoto(null)} aria-label={L('Close photos', 'ඡායාරූප වසන්න', 'புகைப்படங்களை மூடவும்')}><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {availablePhotos.length ? <img className="business-lightbox-image" src={availablePhotos[galleryIndex]} alt={`${businessName} — ${galleryIndex + 1}`} onError={() => photoFailed(availablePhotos[galleryIndex])} /> : <p>{L('Photos are unavailable.', 'ඡායාරූප ලබාගත නොහැක.', 'புகைப்படங்கள் கிடைக்கவில்லை.')}</p>}
        {availablePhotos.length > 1 && <div className="business-gallery-controls">
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => setActivePhoto((galleryIndex + availablePhotos.length - 1) % availablePhotos.length)}>{L('Previous', 'පෙර', 'முந்தையது')}</Button>
          <span aria-live="polite">{galleryIndex + 1} / {availablePhotos.length}</span>
          <Button endIcon={<ArrowForwardRoundedIcon />} onClick={() => setActivePhoto((galleryIndex + 1) % availablePhotos.length)}>{L('Next', 'ඊළඟ', 'அடுத்தது')}</Button>
        </div>}
      </DialogContent>
    </Dialog>
  </div>;
};

export default PublicBusinessProfilePage;
