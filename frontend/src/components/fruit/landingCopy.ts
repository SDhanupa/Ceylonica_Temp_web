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
    navSurvey: 'සමීක්ෂණය',
    eventBadge: 'කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණය',
    heroTitle: 'ඔබේ පලතුරු ව්‍යාපාරය ලියාපදිංචි කරන්න!',
    heroLead: 'වගාවේ සිට වෙළඳාම දක්වා ඕනෑම පලතුරු ව්‍යාපාරයක් කර්මාන්ත හා ව්‍යාපාර සමීක්ෂණයට එක් කළ හැකිය. ඔබේ ව්‍යාපාරය අදම ලියාපදිංචි කරන්න.',
    startSurvey: 'සමීක්ෂණය අරඹන්න',
    findType: 'මගේ ව්‍යාපාර වර්ගය සොයන්න',
    areaChoose: 'ඔබේ ප්‍රදේශය තෝරන්න',
    areaChange: 'වෙනස් කරන්න',
    areaLabel: 'ප්‍රදේශය',
    growTitle: 'ඔබ වගා කරන්නේ කුමක්ද?',
    growLead: 'ඔබේ පලතුර ඔබන්න. සමීක්ෂණය එම ව්‍යාපාර වර්ගය තෝරාගෙනම විවෘත වේ.',
    searchLabel: 'ව්‍යාපාර වර්ගය හෝ කේතය සොයන්න',
    searchPlaceholder: 'උදා: අඹ, ජෑම්, 47811',
    searchClear: 'සෙවීම මකන්න',
    searchCount: (n) => `ගැළපෙන වර්ග ${n}`,
    searchEmpty: (q) => `"${q}" ට ගැළපෙන ව්‍යාපාර වර්ගයක් නැත.`,
    searchEmptyHint: 'වෙනත් වචනයක් උත්සාහ කරන්න, නැතහොත් වර්ගය සමීක්ෂණය තුළදී තෝරන්න.',
    startWithoutType: 'වර්ගය නොතෝරා අරඹන්න',
    stepsTitle: 'ලියාපදිංචි වන්නේ කෙසේද?',
    steps: [
      ['ව්‍යාපාර වර්ගය තෝරන්න', 'පලතුරක් හෝ පහත ලැයිස්තුවෙන් ඔබේ ව්‍යාපාරය තෝරන්න.'],
      ['ප්‍රදේශය හා තොරතුරු දෙන්න', 'ඔබේ ග්‍රාම නිලධාරී වසම සහ ව්‍යාපාරයේ තොරතුරු ඇතුළත් කරන්න.'],
      ['තහවුරු කර යොමු කරන්න', 'පිළිතුරු පරීක්ෂා කර සමීක්ෂණය යොමු කරන්න.'],
    ],
    allTypesTitle: 'සියලු පලතුරු ව්‍යාපාර වර්ග',
    allTypesLead: 'ඔබේ ව්‍යාපාරය අයත් කොටස සොයා, එහි කේතය ඔබන්න.',
    classesLabel: 'ප්‍රධාන වගා වර්ග',
    fruitsLabel: 'පලතුරු වර්ග අනුව',
    codeLabel: 'කේතය',
    typesCount: (n) => `වර්ග ${n}`,
    benefitsTitle: 'ලියාපදිංචි වීමෙන් ඔබට',
    benefits: [
      ['ලියාපදිංචි අංකයක්', 'ඔබේ ප්‍රදේශය හා ව්‍යාපාර වර්ගය අනුව අංකයක් ස්වයංක්‍රීයව සැකසේ.'],
      ['ඔබේ භාෂාවෙන්', 'සිංහල, දෙමළ හෝ ඉංග්‍රීසියෙන් පිළිතුරු දිය හැකිය.'],
      ['නවතා නැවත අරඹන්න', 'පිළිතුරු මෙම උපාංගයේ ස්වයංක්‍රීයව සුරැකේ.'],
      ['ඔබේ ගමේ වාර්තාවට', 'ඔබේ ව්‍යාපාරය ඔබේ ග්‍රාම නිලධාරී වසම යටතේ සටහන් වේ.'],
    ],
    finalTitle: 'අද ම ඔබේ පලතුරු ව්‍යාපාරය ලියාපදිංචි කරන්න',
    finalLead: 'සමීක්ෂණය නොමිලේ. ඔබේ දුරකථනයෙන්ම සම්පූර්ණ කළ හැකිය.',
    stickyLead: 'ඔබේ පලතුරු ව්‍යාපාරය ලියාපදිංචි කරන්න',
    footerContact: 'අප අමතන්න',
    footerRights: `© ${year} Ceylonica දත්ත වේදිකාව. සියලුම හිමිකම් ඇවිරිණි.`,
    dialog: {
      title: 'සමීක්ෂණය අරඹමු',
      selectedType: 'ඔබ තෝරාගත් ව්‍යාපාර වර්ගය',
      presetNote: 'සමීක්ෂණයේදී මෙම වර්ගය කලින්ම තෝරා තිබේ.',
      noType: 'ව්‍යාපාර වර්ගය සමීක්ෂණය තුළදී තෝරා ගත හැකිය.',
      area: 'ප්‍රදේශය',
      areaLater: 'ඊළඟ පියවරේදී ඔබේ ග්‍රාම නිලධාරී වසම තෝරනු ඇත.',
      nameLabel: 'ඔබේ නම',
      nameHelp: 'සමීක්ෂණය පුරවන්නාගේ නම ලෙස සටහන් වේ. අවශ්‍ය නම් හිස්ව තබන්න.',
      start: 'සමීක්ෂණය අරඹන්න',
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
    navSurvey: 'Survey',
    eventBadge: 'Industry and Business Survey',
    heroTitle: 'Register your fruit business!',
    heroLead: "From the orchard to the market stall, any fruit business can join the Industry and Business Survey. Register your business today.",
    startSurvey: 'Start the survey',
    findType: 'Find my business type',
    areaChoose: 'Choose your area',
    areaChange: 'Change',
    areaLabel: 'Area',
    growTitle: 'What do you grow?',
    growLead: 'Tap your fruit. The survey opens with that business type already selected.',
    searchLabel: 'Search a business type or code',
    searchPlaceholder: 'e.g. mango, jam, 47811',
    searchClear: 'Clear search',
    searchCount: (n) => `${n} matching ${n === 1 ? 'type' : 'types'}`,
    searchEmpty: (q) => `No business type matches "${q}".`,
    searchEmptyHint: 'Try another word, or pick the type inside the survey.',
    startWithoutType: 'Start without choosing',
    stepsTitle: 'How to register',
    steps: [
      ['Choose your business type', 'Tap a fruit, or find your business in the list below.'],
      ['Add your area and details', 'Enter your Grama Niladhari division and business details.'],
      ['Check and submit', 'Review your answers and submit the survey.'],
    ],
    allTypesTitle: 'All fruit business types',
    allTypesLead: 'Find the group your business belongs to, then tap its code.',
    classesLabel: 'Main crop groups',
    fruitsLabel: 'By fruit',
    codeLabel: 'Code',
    typesCount: (n) => `${n} types`,
    benefitsTitle: 'What registering gives you',
    benefits: [
      ['A registration number', 'A number is generated from your area and business type.'],
      ['Your language', 'Answer in Sinhala, Tamil or English.'],
      ['Stop and continue later', 'Answers are saved automatically on this device.'],
      ['On your village record', 'Your business is recorded under your Grama Niladhari division.'],
    ],
    finalTitle: 'Register your fruit business today',
    finalLead: 'The survey is free, and you can complete it on your own phone.',
    stickyLead: 'Register your fruit business',
    footerContact: 'Contact us',
    footerRights: `© ${year} Ceylonica Data Platform. All rights reserved.`,
    dialog: {
      title: "Let's start the survey",
      selectedType: 'Your business type',
      presetNote: 'This type will already be selected in the survey.',
      noType: 'You can choose your business type inside the survey.',
      area: 'Area',
      areaLater: "You'll choose your Grama Niladhari division in the next step.",
      nameLabel: 'Your name',
      nameHelp: 'Recorded as the name of the person filling in the survey. You can leave it empty.',
      start: 'Start the survey',
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
    navSurvey: 'கணக்கெடுப்பு',
    eventBadge: 'கைத்தொழில் மற்றும் வணிகக் கணக்கெடுப்பு',
    heroTitle: 'உங்கள் பழ வணிகத்தைப் பதிவு செய்யுங்கள்!',
    heroLead: 'பயிர்ச்செய்கை முதல் விற்பனை வரை எந்தப் பழ வணிகமும் கைத்தொழில் மற்றும் வணிகக் கணக்கெடுப்பில் இணையலாம். இன்றே உங்கள் வணிகத்தைப் பதிவு செய்யுங்கள்.',
    startSurvey: 'கணக்கெடுப்பைத் தொடங்குங்கள்',
    findType: 'என் வணிக வகையைத் தேடு',
    areaChoose: 'உங்கள் பிரதேசத்தைத் தேர்ந்தெடுக்கவும்',
    areaChange: 'மாற்று',
    areaLabel: 'பிரதேசம்',
    growTitle: 'நீங்கள் எதைப் பயிரிடுகிறீர்கள்?',
    growLead: 'உங்கள் பழத்தை அழுத்துங்கள். அந்த வணிக வகை தேர்ந்தெடுக்கப்பட்ட நிலையில் கணக்கெடுப்பு திறக்கும்.',
    searchLabel: 'வணிக வகை அல்லது குறியீட்டைத் தேடுங்கள்',
    searchPlaceholder: 'எ.கா: மாம்பழம், ஜாம், 47811',
    searchClear: 'தேடலை அழி',
    searchCount: (n) => `பொருந்தும் வகைகள் ${n}`,
    searchEmpty: (q) => `"${q}" க்குப் பொருந்தும் வணிக வகை இல்லை.`,
    searchEmptyHint: 'வேறொரு சொல்லை முயற்சிக்கவும், அல்லது கணக்கெடுப்பினுள் வகையைத் தேர்ந்தெடுக்கவும்.',
    startWithoutType: 'வகையைத் தேர்ந்தெடுக்காமல் தொடங்கு',
    stepsTitle: 'எவ்வாறு பதிவு செய்வது?',
    steps: [
      ['வணிக வகையைத் தேர்ந்தெடுக்கவும்', 'ஒரு பழத்தை அல்லது கீழே உள்ள பட்டியலில் உங்கள் வணிகத்தைத் தேர்ந்தெடுக்கவும்.'],
      ['பிரதேசம் மற்றும் விவரங்களை வழங்கவும்', 'உங்கள் கிராம உத்தியோகத்தர் பிரிவையும் வணிக விவரங்களையும் உள்ளிடவும்.'],
      ['உறுதிசெய்து சமர்ப்பிக்கவும்', 'பதில்களைச் சரிபார்த்து கணக்கெடுப்பைச் சமர்ப்பிக்கவும்.'],
    ],
    allTypesTitle: 'அனைத்துப் பழ வணிக வகைகளும்',
    allTypesLead: 'உங்கள் வணிகம் சேரும் பகுதியைக் கண்டறிந்து, அதன் குறியீட்டை அழுத்துங்கள்.',
    classesLabel: 'முக்கிய பயிர் வகைகள்',
    fruitsLabel: 'பழ வகைகளின்படி',
    codeLabel: 'குறியீடு',
    typesCount: (n) => `${n} வகைகள்`,
    benefitsTitle: 'பதிவு செய்வதால் உங்களுக்கு',
    benefits: [
      ['பதிவு இலக்கம்', 'உங்கள் பிரதேசம் மற்றும் வணிக வகைக்கு ஏற்ப இலக்கம் தானாக உருவாகும்.'],
      ['உங்கள் மொழியில்', 'சிங்களம், தமிழ் அல்லது ஆங்கிலத்தில் பதிலளிக்கலாம்.'],
      ['நிறுத்தி மீண்டும் தொடரலாம்', 'பதில்கள் இந்தச் சாதனத்தில் தானாகச் சேமிக்கப்படும்.'],
      ['உங்கள் கிராமப் பதிவில்', 'உங்கள் வணிகம் உங்கள் கிராம உத்தியோகத்தர் பிரிவின் கீழ் பதிவாகும்.'],
    ],
    finalTitle: 'இன்றே உங்கள் பழ வணிகத்தைப் பதிவு செய்யுங்கள்',
    finalLead: 'கணக்கெடுப்பு இலவசம். உங்கள் கைபேசியிலேயே முழுமையாக நிரப்பலாம்.',
    stickyLead: 'உங்கள் பழ வணிகத்தைப் பதிவு செய்யுங்கள்',
    footerContact: 'எங்களைத் தொடர்பு கொள்ள',
    footerRights: `© ${year} சிலோனிகா தரவு தளம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.`,
    dialog: {
      title: 'கணக்கெடுப்பைத் தொடங்குவோம்',
      selectedType: 'நீங்கள் தேர்ந்தெடுத்த வணிக வகை',
      presetNote: 'கணக்கெடுப்பில் இந்த வகை ஏற்கனவே தேர்ந்தெடுக்கப்பட்டிருக்கும்.',
      noType: 'வணிக வகையைக் கணக்கெடுப்பினுள் தேர்ந்தெடுக்கலாம்.',
      area: 'பிரதேசம்',
      areaLater: 'அடுத்த படியில் உங்கள் கிராம உத்தியோகத்தர் பிரிவைத் தேர்ந்தெடுப்பீர்கள்.',
      nameLabel: 'உங்கள் பெயர்',
      nameHelp: 'கணக்கெடுப்பை நிரப்புபவரின் பெயராகப் பதிவாகும். விரும்பினால் வெறுமையாக விடலாம்.',
      start: 'கணக்கெடுப்பைத் தொடங்குங்கள்',
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
