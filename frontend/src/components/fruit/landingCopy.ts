import type { Lang } from './fruitBusinessTypes';

export interface LandingCopy {
  langName: string;
  navSurvey: string;
  eventBadge: string;
  heroTitle: string;
  heroLead: string;
  startSurvey: string;
  findType: string;
  areaChoose: string;
  areaChange: string;
  areaLabel: string;
  growTitle: string;
  growLead: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchClear: string;
  searchCount: (n: number) => string;
  searchEmpty: (q: string) => string;
  searchEmptyHint: string;
  startWithoutType: string;
  stepsTitle: string;
  steps: [string, string][];
  allTypesTitle: string;
  allTypesLead: string;
  classesLabel: string;
  fruitsLabel: string;
  codeLabel: string;
  typesCount: (n: number) => string;
  benefitsTitle: string;
  benefits: [string, string][];
  objectionsTitle: string;
  objections: [string, string][];
  finalTitle: string;
  finalLead: string;
  stickyLead: string;
  footerContact: string;
  footerRights: string;
  dialog: {
    title: string;
    selectedType: string;
    presetNote: string;
    noType: string;
    area: string;
    areaLater: string;
    nameLabel: string;
    nameHelp: string;
    start: string;
    back: string;
    change: string;
    choose: string;
  };
  area: {
    title: string;
    lead: string;
    searchLabel: string;
    searchPlaceholder: string;
    minChars: string;
    noResults: string;
    useGps: string;
    locating: string;
    gpsFailed: string;
    gpsNotFound: string;
    cancel: string;
  };
}

const year = new Date().getFullYear();

export const COPY: Record<Lang, LandingCopy> = {
  si: {
    langName: 'සිංහල',
    navSurvey: 'ලියාපදිංචි වන්න',
    eventBadge: 'කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණය',
    heroTitle: 'ඔබේ පලතුරු ව්‍යාපාරයට ලියාපදිංචි අංකයක් ලබා ගන්න',
    heroLead: 'ඔබේ දුරකථනයෙන්ම සමීක්ෂණය පුරවන්න. වගාකරුවන්, සකසන්නන් සහ පලතුරු වෙළෙන්දන් සැමට ලියාපදිංචි විය හැක.',
    startSurvey: 'මගේ ලියාපදිංචි අංකය ලබා ගන්න',
    findType: 'මගේ ව්‍යාපාර වර්ගය සොයන්න',
    areaChoose: 'ඔබේ ප්‍රදේශය තෝරන්න',
    areaChange: 'වෙනස් කරන්න',
    areaLabel: 'ප්‍රදේශය',
    growTitle: 'ඔබ වගා කරන්නේ කුමන පලතුරද?',
    growLead: 'එය ඔබන්න. ඔබේ ව්‍යාපාර වර්ගය පුරවා ඇතිව සමීක්ෂණය විවෘත වේ.',
    searchLabel: 'ව්‍යාපාර වර්ගය හෝ කේතය සොයන්න',
    searchPlaceholder: 'උදා: අඹ, ජෑම්, 47811',
    searchClear: 'සෙවීම මකන්න',
    searchCount: (n) => `ගැළපෙන වර්ග ${n}`,
    searchEmpty: (q) => `"${q}" ට ගැළපෙන ව්‍යාපාර වර්ගයක් නැත.`,
    searchEmptyHint: 'වෙනත් වචනයක් උත්සාහ කරන්න, නැතහොත් වර්ගය සමීක්ෂණය තුළදී තෝරන්න.',
    startWithoutType: 'වර්ගය නොතෝරා අරඹන්න',
    stepsTitle: 'පියවර 3කින් ලියාපදිංචි වන්න',
    steps: [
      ['ව්‍යාපාර වර්ගය තෝරන්න', 'ඔබේ පලතුර ඔබන්න, නැතහොත් ලැයිස්තුවෙන් සොයන්න.'],
      ['ප්‍රදේශය හා ව්‍යාපාර තොරතුරු දෙන්න', 'මෙම පිටුවෙන් අරඹන විට ඔබේ ප්‍රදේශය දැනටමත් සකසා ඇත.'],
      ['ජංගම අංකය තහවුරු කර යොමු කරන්න', 'SMS මඟින් ලැබෙන අංක 6 කේතය ඇතුළත් කර යොමු කරන්න.'],
    ],
    allTypesTitle: 'වගාකරුවෙක් නොවේද? ඔබේ ව්‍යාපාරය මෙතැනින් සොයන්න',
    allTypesLead: 'සකසන්නන්, වෙළෙන්දන් සහ සේවා ව්‍යාපාර කොටස් අනුව ඇත. ඔබේ එක ඔබා අරඹන්න.',
    classesLabel: 'ප්‍රධාන වගා වර්ග',
    fruitsLabel: 'පලතුරු වර්ග අනුව',
    codeLabel: 'කේතය',
    typesCount: (n) => `වර්ග ${n}`,
    benefitsTitle: 'ලියාපදිංචි වූ විට ඔබට ලැබෙන දේ',
    benefits: [
      ['ඔබේම ලියාපදිංචි අංකයක්', 'ඔබ ප්‍රදේශය හා ව්‍යාපාර වර්ගය තේරූ විගස අංකය සැකසේ.'],
      ['ඔබේ ව්‍යාපාරයට පොදු පිටුවක්', 'යොමු කළ විගස ඕනෑම අයෙකුට ලියාපදිංචි අංකයෙන් එය විවෘත කළ හැක.'],
      ['ඔබේ ගමේ වාර්තාවේ ස්ථානයක්', 'ඔබේ ව්‍යාපාරය ඔබේ ග්‍රාම නිලධාරී වසම යටතේ ලැයිස්තුගත වේ.'],
    ],
    objectionsTitle: 'අරඹන්න පෙර',
    objections: [
      ['ලියාපදිංචිය නොමිලේ', 'කිසිදු පියවරකදී මුදල් ඉල්ලන්නේ නැත.'],
      ['ඔබේ දුරකථනයෙන්, ඔබේ භාෂාවෙන්', 'ඉහළ ඇති බොත්තම්වලින් සිංහල, දෙමළ හා ඉංග්‍රීසි අතර මාරු වන්න.'],
      ['ඕනෑම වේලාවක නවත්වන්න', 'ඔබ ටයිප් කරන විටම පිළිතුරු මෙම දුරකථනයේ සුරැකේ.'],
    ],
    finalTitle: 'අදම ඔබේ ලියාපදිංචි අංකය ලබා ගන්න',
    finalLead: 'ඔබේ ජංගම දුරකථනය ළඟ තබා ගන්න. SMS කේතය සඳහා එය අවශ්‍ය වේ.',
    stickyLead: 'ඔබේ පලතුරු ව්‍යාපාරයට ලියාපදිංචි අංකයක් ලබා ගන්න',
    footerContact: 'අප අමතන්න',
    footerRights: `© ${year} Ceylonica දත්ත වේදිකාව. සියලුම හිමිකම් ඇවිරිණි.`,
    dialog: {
      title: 'ලියාපදිංචිය අරඹන්න',
      selectedType: 'ඔබ තෝරාගත් ව්‍යාපාර වර්ගය',
      presetNote: 'සමීක්ෂණයේදී මෙම වර්ගය කලින්ම තෝරා තිබේ.',
      noType: 'ව්‍යාපාර වර්ගය සමීක්ෂණය තුළදී තෝරා ගත හැකිය.',
      area: 'ප්‍රදේශය',
      areaLater: 'ඊළඟ පියවරේදී ඔබේ ග්‍රාම නිලධාරී වසම තෝරනු ඇත.',
      nameLabel: 'ඔබේ නම',
      nameHelp: 'සමීක්ෂණය පුරවන්නාගේ නම ලෙස සටහන් වේ. අවශ්‍ය නම් හිස්ව තබන්න.',
      start: 'මගේ ලියාපදිංචි අංකය ලබා ගන්න',
      back: 'ආපසු',
      change: 'වෙනස් කරන්න',
      choose: 'තෝරන්න',
    },
    area: {
      title: 'ඔබේ ප්‍රදේශය තෝරන්න',
      lead: 'ඔබේ ව්‍යාපාරය පිහිටි ග්‍රාම නිලධාරී වසම සොයන්න.',
      searchLabel: 'ගම, වසම හෝ ප්‍රාදේශීය ලේකම් කොට්ඨාසය',
      searchPlaceholder: 'අකුරු 2ක් හෝ වැඩියෙන් ටයිප් කරන්න',
      minChars: 'සෙවීමට අකුරු 2ක් හෝ වැඩියෙන් ටයිප් කරන්න.',
      noResults: 'ගැළපෙන ප්‍රදේශයක් හමු නොවීය.',
      useGps: 'මගේ වත්මන් ස්ථානය භාවිතා කරන්න',
      locating: 'ඔබේ ස්ථානය සොයමින්...',
      gpsFailed: 'ස්ථානය ලබාගත නොහැකි විය. කරුණාකර නමින් සොයන්න.',
      gpsNotFound: 'මෙම ස්ථානයට ගැළපෙන වසමක් හමු නොවීය.',
      cancel: 'අවලංගු කරන්න',
    },
  },
  en: {
    langName: 'English',
    navSurvey: 'Register',
    eventBadge: 'Industry and Business Survey',
    heroTitle: 'Get a registration number for your fruit business',
    heroLead: 'Fill in the survey on your phone. Growers, processors and fruit sellers can all register.',
    startSurvey: 'Get my registration number',
    findType: 'Find my business type',
    areaChoose: 'Choose your area',
    areaChange: 'Change',
    areaLabel: 'Area',
    growTitle: 'What fruit do you grow?',
    growLead: 'Tap it. The survey opens with your business type already filled in.',
    searchLabel: 'Search a business type or code',
    searchPlaceholder: 'e.g. mango, jam, 47811',
    searchClear: 'Clear search',
    searchCount: (n) => `${n} matching ${n === 1 ? 'type' : 'types'}`,
    searchEmpty: (q) => `No business type matches "${q}".`,
    searchEmptyHint: 'Try another word, or pick the type inside the survey.',
    startWithoutType: 'Start without choosing',
    stepsTitle: 'Register in 3 steps',
    steps: [
      ['Pick your business type', 'Tap your fruit or search the list.'],
      ['Add your area and business details', 'Your area is already set when you start from this page.'],
      ['Verify your mobile and submit', 'Enter the 6-digit SMS code, then submit.'],
    ],
    allTypesTitle: 'Not a grower? Find your business here',
    allTypesLead: 'Processors, traders and service businesses are listed by group. Tap yours to start.',
    classesLabel: 'Main crop groups',
    fruitsLabel: 'By fruit',
    codeLabel: 'Code',
    typesCount: (n) => `${n} types`,
    benefitsTitle: 'What you get when you register',
    benefits: [
      ['Your own registration number', 'Created from your area and business type the moment you choose them.'],
      ['A public page for your business', 'Anyone can open it with your registration number, right after you submit.'],
      ['A place on your village record', 'Your business is listed under your Grama Niladhari division.'],
    ],
    objectionsTitle: 'Before you start',
    objections: [
      ['Free to register', 'No payment is asked at any step.'],
      ['On your phone, in your language', 'Switch between Sinhala, Tamil and English with the buttons at the top.'],
      ['Stop any time', 'Your answers are saved on this phone as you type.'],
    ],
    finalTitle: 'Get your registration number today',
    finalLead: 'Keep your mobile phone with you. You need it for the SMS code.',
    stickyLead: 'Get a registration number for your fruit business',
    footerContact: 'Contact us',
    footerRights: `© ${year} Ceylonica Data Platform. All rights reserved.`,
    dialog: {
      title: 'Start your registration',
      selectedType: 'Your business type',
      presetNote: 'This type will already be selected in the survey.',
      noType: 'You can choose your business type inside the survey.',
      area: 'Area',
      areaLater: "You'll choose your Grama Niladhari division in the next step.",
      nameLabel: 'Your name',
      nameHelp: 'Recorded as the name of the person filling in the survey. You can leave it empty.',
      start: 'Get my registration number',
      back: 'Back',
      change: 'Change',
      choose: 'Choose',
    },
    area: {
      title: 'Choose your area',
      lead: 'Find the Grama Niladhari division where your business is.',
      searchLabel: 'Village, GN division or DS division',
      searchPlaceholder: 'Type at least 2 letters',
      minChars: 'Type at least 2 letters to search.',
      noResults: 'No matching area found.',
      useGps: 'Use my current location',
      locating: 'Finding your location...',
      gpsFailed: "Couldn't get your location. Please search by name.",
      gpsNotFound: 'No GN division matches this location.',
      cancel: 'Cancel',
    },
  },
  ta: {
    langName: 'தமிழ்',
    navSurvey: 'பதிவு செய்',
    eventBadge: 'கைத்தொழில் மற்றும் வணிகக் கணக்கெடுப்பு',
    heroTitle: 'உங்கள் பழ வணிகத்திற்கு பதிவு இலக்கத்தைப் பெறுங்கள்',
    heroLead: 'உங்கள் கைபேசியிலேயே கணக்கெடுப்பை நிரப்புங்கள். பயிர்செய்பவர்கள், பதப்படுத்துபவர்கள், பழ விற்பனையாளர்கள் அனைவரும் பதிவு செய்யலாம்.',
    startSurvey: 'என் பதிவு இலக்கத்தைப் பெறு',
    findType: 'என் வணிக வகையைத் தேடு',
    areaChoose: 'உங்கள் பிரதேசத்தைத் தேர்ந்தெடுக்கவும்',
    areaChange: 'மாற்று',
    areaLabel: 'பிரதேசம்',
    growTitle: 'நீங்கள் எந்தப் பழத்தைப் பயிரிடுகிறீர்கள்?',
    growLead: 'அதை அழுத்துங்கள். உங்கள் வணிக வகை நிரப்பப்பட்ட நிலையில் கணக்கெடுப்பு திறக்கும்.',
    searchLabel: 'வணிக வகை அல்லது குறியீட்டைத் தேடுங்கள்',
    searchPlaceholder: 'எ.கா: மாம்பழம், ஜாம், 47811',
    searchClear: 'தேடலை அழி',
    searchCount: (n) => `பொருந்தும் வகைகள் ${n}`,
    searchEmpty: (q) => `"${q}" க்குப் பொருந்தும் வணிக வகை இல்லை.`,
    searchEmptyHint: 'வேறொரு சொல்லை முயற்சிக்கவும், அல்லது கணக்கெடுப்பினுள் வகையைத் தேர்ந்தெடுக்கவும்.',
    startWithoutType: 'வகையைத் தேர்ந்தெடுக்காமல் தொடங்கு',
    stepsTitle: '3 படிகளில் பதிவு செய்யுங்கள்',
    steps: [
      ['வணிக வகையைத் தேர்ந்தெடுக்கவும்', 'உங்கள் பழத்தை அழுத்துங்கள் அல்லது பட்டியலில் தேடுங்கள்.'],
      ['பிரதேசம் மற்றும் வணிக விவரங்களைச் சேர்க்கவும்', 'இந்தப் பக்கத்திலிருந்து தொடங்கினால் உங்கள் பிரதேசம் ஏற்கனவே அமைக்கப்பட்டிருக்கும்.'],
      ['கைபேசியைச் சரிபார்த்து சமர்ப்பிக்கவும்', 'SMS இல் வரும் 6 இலக்கக் குறியீட்டை உள்ளிட்டு சமர்ப்பிக்கவும்.'],
    ],
    allTypesTitle: 'பயிர்செய்பவர் இல்லையா? உங்கள் வணிகத்தை இங்கே கண்டறியுங்கள்',
    allTypesLead: 'பதப்படுத்துபவர்கள், வர்த்தகர்கள், சேவை வணிகங்கள் பிரிவுகளாக உள்ளன. உங்களுடையதை அழுத்தித் தொடங்குங்கள்.',
    classesLabel: 'முக்கிய பயிர் வகைகள்',
    fruitsLabel: 'பழ வகைகளின்படி',
    codeLabel: 'குறியீடு',
    typesCount: (n) => `${n} வகைகள்`,
    benefitsTitle: 'பதிவு செய்தால் உங்களுக்குக் கிடைப்பவை',
    benefits: [
      ['உங்களுக்கான பதிவு இலக்கம்', 'பிரதேசத்தையும் வணிக வகையையும் தேர்ந்தெடுத்தவுடன் இலக்கம் உருவாகும்.'],
      ['உங்கள் வணிகத்திற்கு ஒரு பொதுப் பக்கம்', 'சமர்ப்பித்தவுடன் பதிவு இலக்கத்தைக் கொண்டு யாரும் அதைத் திறக்கலாம்.'],
      ['உங்கள் கிராமப் பதிவில் இடம்', 'உங்கள் வணிகம் உங்கள் கிராம உத்தியோகத்தர் பிரிவின் கீழ் பட்டியலிடப்படும்.'],
    ],
    objectionsTitle: 'தொடங்குவதற்கு முன்',
    objections: [
      ['பதிவு இலவசம்', 'எந்தப் படியிலும் பணம் கேட்கப்படாது.'],
      ['உங்கள் கைபேசியில், உங்கள் மொழியில்', 'மேலே உள்ள பொத்தான்களால் சிங்களம், தமிழ், ஆங்கிலம் இடையே மாறலாம்.'],
      ['எப்போது வேண்டுமானாலும் நிறுத்தலாம்', 'நீங்கள் தட்டச்சு செய்யும்போதே பதில்கள் இந்தக் கைபேசியில் சேமிக்கப்படும்.'],
    ],
    finalTitle: 'இன்றே உங்கள் பதிவு இலக்கத்தைப் பெறுங்கள்',
    finalLead: 'உங்கள் கைபேசியை அருகில் வைத்திருங்கள். SMS குறியீட்டுக்கு அது தேவை.',
    stickyLead: 'உங்கள் பழ வணிகத்திற்கு பதிவு இலக்கத்தைப் பெறுங்கள்',
    footerContact: 'எங்களைத் தொடர்பு கொள்ள',
    footerRights: `© ${year} சிலோனிகா தரவு தளம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.`,
    dialog: {
      title: 'உங்கள் பதிவைத் தொடங்குங்கள்',
      selectedType: 'நீங்கள் தேர்ந்தெடுத்த வணிக வகை',
      presetNote: 'கணக்கெடுப்பில் இந்த வகை ஏற்கனவே தேர்ந்தெடுக்கப்பட்டிருக்கும்.',
      noType: 'வணிக வகையைக் கணக்கெடுப்பினுள் தேர்ந்தெடுக்கலாம்.',
      area: 'பிரதேசம்',
      areaLater: 'அடுத்த படியில் உங்கள் கிராம உத்தியோகத்தர் பிரிவைத் தேர்ந்தெடுப்பீர்கள்.',
      nameLabel: 'உங்கள் பெயர்',
      nameHelp: 'கணக்கெடுப்பை நிரப்புபவரின் பெயராகப் பதிவாகும். விரும்பினால் வெறுமையாக விடலாம்.',
      start: 'என் பதிவு இலக்கத்தைப் பெறு',
      back: 'பின்செல்',
      change: 'மாற்று',
      choose: 'தேர்ந்தெடு',
    },
    area: {
      title: 'உங்கள் பிரதேசத்தைத் தேர்ந்தெடுக்கவும்',
      lead: 'உங்கள் வணிகம் அமைந்துள்ள கிராம உத்தியோகத்தர் பிரிவைத் தேடுங்கள்.',
      searchLabel: 'கிராமம், கி.உ. பிரிவு அல்லது பி.செ. பிரிவு',
      searchPlaceholder: 'குறைந்தது 2 எழுத்துகளைத் தட்டச்சு செய்யவும்',
      minChars: 'தேட குறைந்தது 2 எழுத்துகளைத் தட்டச்சு செய்யவும்.',
      noResults: 'பொருந்தும் பிரதேசம் கிடைக்கவில்லை.',
      useGps: 'எனது தற்போதைய இருப்பிடத்தைப் பயன்படுத்து',
      locating: 'உங்கள் இருப்பிடத்தைத் தேடுகிறது...',
      gpsFailed: 'இருப்பிடத்தைப் பெற முடியவில்லை. பெயரால் தேடவும்.',
      gpsNotFound: 'இந்த இருப்பிடத்திற்குப் பொருந்தும் பிரிவு இல்லை.',
      cancel: 'ரத்து செய்',
    },
  },
};
