// Must mirror FruitCultivationCategoriesSeeder.php: the survey matches the ?type= preset on `slug`.

export type Lang = 'si' | 'en' | 'ta';

export type FruitKind =
  | 'grapes' | 'mango' | 'banana' | 'papaya' | 'pineapple' | 'passion' | 'rambutan'
  | 'avocado' | 'kiwi' | 'guava' | 'orange' | 'lime' | 'mandarin' | 'lemon'
  | 'woodapple' | 'pomegranate' | 'pear' | 'basket' | 'cashew' | 'strawberry'
  | 'sapling' | 'coconut';

export type SectionId = 'cultivation' | 'postharvest' | 'processing' | 'trade' | 'services';

export interface Localized {
  si: string;
  en: string;
  ta: string;
}

export interface BusinessType {
  slug: string;
  code: string;
  name: Localized;
  section: SectionId;
  fruit?: FruitKind;
  /** Section 1 only: a broad crop class rather than a single fruit. */
  isClass?: boolean;
}

export interface BusinessSection {
  id: SectionId;
  number: number;
  title: Localized;
  short: Localized;
  blurb: Localized;
}

const t = (si: string, en: string, ta: string): Localized => ({ si, en, ta });

export const SECTIONS: BusinessSection[] = [
  {
    id: 'cultivation',
    number: 1,
    title: t('පලතුරු වගාව, ඉඩම් හා තවාන්', 'Fruit cultivation, land and nurseries', 'பழச் செய்கை, காணி மற்றும் நாற்றுமேடைகள்'),
    short: t('වගාව හා තවාන්', 'Cultivation', 'பயிர்ச்செய்கை'),
    blurb: t(
      'පලතුරු වතු, ගෙවතු වගා සහ පැළ තවාන් හිමියන් සඳහා.',
      'For orchards, home gardens and plant nurseries.',
      'பழத்தோட்டங்கள், வீட்டுத் தோட்டங்கள் மற்றும் நாற்றுமேடை உரிமையாளர்களுக்கு.',
    ),
  },
  {
    id: 'postharvest',
    number: 2,
    title: t('පලතුරු අස්වනු පසු හා ආධාරක සේවා', 'Post-harvest and support services', 'அறுவடைக்குப் பிந்தைய மற்றும் ஆதரவு சேவைகள்'),
    short: t('අස්වනු පසු සේවා', 'Post-harvest', 'அறுவடைக்குப் பின்'),
    blurb: t(
      'අස්වනු නෙළීම, තේරීම, ඇසිරීම සහ බීජ සැකසීම.',
      'Harvesting, sorting, packing and seed preparation.',
      'அறுவடை, தரம் பிரித்தல், பொதியிடல் மற்றும் விதை தயாரிப்பு.',
    ),
  },
  {
    id: 'processing',
    number: 3,
    title: t('පලතුරු ආශ්‍රිත නිෂ්පාදන හා සැකසුම්', 'Fruit products and processing', 'பழம் சார்ந்த உற்பத்திகள் மற்றும் பதப்படுத்தல்'),
    short: t('නිෂ්පාදන හා සැකසුම්', 'Processing', 'பதப்படுத்தல்'),
    blurb: t(
      'ජෑම්, යුෂ, කෝඩියල්, අච්චාරු සහ කල්තබා ගන්නා නිෂ්පාදන.',
      'Jams, juices, cordials, pickles and preserved goods.',
      'ஜாம், பழச்சாறு, கோர்டியல், ஊறுகாய் மற்றும் பதப்படுத்திய பொருட்கள்.',
    ),
  },
  {
    id: 'trade',
    number: 4,
    title: t('පලතුරු තොග හා සිල්ලර වෙළඳාම', 'Fruit wholesale and retail trade', 'பழ மொத்த மற்றும் சில்லறை வர்த்தகம்'),
    short: t('තොග හා සිල්ලර', 'Trade', 'வர்த்தகம்'),
    blurb: t(
      'තොග වෙළෙන්දන්, කඩ, පොළ, ගෙයින් ගෙට සහ අන්තර්ජාල විකිණීම.',
      'Wholesalers, shops, markets, door-to-door and online sellers.',
      'மொத்த வியாபாரிகள், கடைகள், சந்தைகள், வீடு வீடாக மற்றும் இணைய விற்பனை.',
    ),
  },
  {
    id: 'services',
    number: 5,
    title: t('පලතුරු ආශ්‍රිත සේවා', 'Fruit-related services', 'பழம் சார்ந்த சேவைகள்'),
    short: t('ආශ්‍රිත සේවා', 'Services', 'சேவைகள்'),
    blurb: t(
      'පලතුරු බීම හල් සහ අයිස් ක්‍රීම් වෙළඳාම.',
      'Fruit drink stalls and ice cream sellers.',
      'பழப் பான நிலையங்கள் மற்றும் ஐஸ்கிரீம் விற்பனை.',
    ),
  },
];

const row = (
  slug: string,
  code: string,
  section: SectionId,
  name: Localized,
  extra: Partial<Pick<BusinessType, 'fruit' | 'isClass'>> = {},
): BusinessType => ({ slug, code, section, name, ...extra });

export const BUSINESS_TYPES: BusinessType[] = [
  row('1.3.4.1.1.2.1', '121', 'cultivation', t('මිදි වගා කිරීම', 'Grape growing', 'திராட்சை பயிரிடுதல்'), { fruit: 'grapes', isClass: true }),
  row('1.3.4.1.1.2.3', '123', 'cultivation', t('දොඩම් කුලයට අයත් පලතුරු වගාව', 'Citrus fruit growing', 'சிட்ரஸ் பழங்கள் பயிரிடுதல்'), { fruit: 'orange', isClass: true }),
  row('1.3.4.1.1.2.4', '124', 'cultivation', t('මාංසල පලතුරු සහ ඝන පෘෂ්ඨ සහිත පලතුරු වගාව', 'Fleshy and stone fruit growing', 'மென் சதை மற்றும் கடினக் கொட்டை பழங்கள் பயிரிடுதல்'), { fruit: 'pear', isClass: true }),
  row('1.3.4.1.1.2.5', '125', 'cultivation', t('වෙනත් ගස් සහ පඳුරුවල හටගන්නා පලතුරු සහ ගෙඩි වගාව', 'Other tree and bush fruit and nut growing', 'பிற மர மற்றும் புதர்ப் பழங்கள் மற்றும் கொட்டைகள் பயிரிடுதல்'), { fruit: 'cashew', isClass: true }),
  row('1.3.4.1.1.2.6', '126', 'cultivation', t('තෙල් සහිත පලතුරු වගා කිරීම', 'Oil fruit growing', 'எண்ணெய் பழங்கள் பயிரிடுதல்'), { fruit: 'coconut', isClass: true }),
  row('1.3.4.1.1.2.9', '129', 'cultivation', t('වෙනත් ස්ථිර බෝග වගා කිරීම', 'Other perennial crop growing', 'பிற நிரந்தரப் பயிர்கள் பயிரிடுதல்'), { fruit: 'sapling', isClass: true }),

  row('1.3.4.1.1.2.1.1', '1210', 'cultivation', t('මිදි', 'Grapes', 'திராட்சை'), { fruit: 'grapes' }),
  row('1.3.4.1.1.2.2.1', '1221', 'cultivation', t('අඹ', 'Mangoes', 'மாம்பழம்'), { fruit: 'mango' }),
  row('1.3.4.1.1.2.2.2', '1222', 'cultivation', t('කෙසෙල්', 'Bananas', 'வாழைப்பழம்'), { fruit: 'banana' }),
  row('1.3.4.1.1.2.3.1', '1223', 'cultivation', t('ගස්ලබු', 'Papayas', 'பப்பாளி'), { fruit: 'papaya' }),
  row('1.3.4.1.1.2.4.1', '1224', 'cultivation', t('අන්නාසි', 'Pineapples', 'அன்னாசிப்பழம்'), { fruit: 'pineapple' }),
  row('1.3.4.1.1.2.5.1', '1225', 'cultivation', t('පැෂන් ෆෘට්', 'Passion fruit', 'பேஷன் பழம்'), { fruit: 'passion' }),
  row('1.3.4.1.1.2.6.1', '1226', 'cultivation', t('රඹුටන්', 'Rambutan', 'ரம்புட்டான்'), { fruit: 'rambutan' }),
  row('1.3.4.1.1.2.7.1', '1227', 'cultivation', t('අලිගැට පේර', 'Avocados', 'அவகாடோ'), { fruit: 'avocado' }),
  row('1.3.4.1.1.2.8.1', '1228', 'cultivation', t('කිවි පේර', 'Kiwifruit', 'கிவிப்பழம்'), { fruit: 'kiwi' }),
  row('1.3.4.1.1.2.9.1', '1229', 'cultivation', t('වෙනත් නිවර්තන සහ උපනිවර්තන කලාපීය පලතුරු වගාව', 'Other tropical and subtropical fruit growing', 'பிற வெப்பமண்டல மற்றும் துணை வெப்பமண்டலப் பழங்கள் பயிரிடுதல்'), { fruit: 'guava' }),
  row('1.3.4.1.1.2.9.2', '1231', 'cultivation', t('දොඩම්', 'Oranges', 'ஆரஞ்சு'), { fruit: 'orange' }),
  row('1.3.4.1.1.2.9.3', '1232', 'cultivation', t('දෙහි හා ලෙමන් වර්ග වගාව', 'Lime and lemon variety growing', 'நாரத்தை மற்றும் எலுமிச்சை வகைகள் பயிரிடுதல்'), { fruit: 'lime' }),
  row('1.3.4.1.1.2.9.4', '1233', 'cultivation', t('ජමනාරං, හීන්නාරං, ක්ලෙමෙන්ටින්', 'Tangerines, mandarins and clementines', 'டாங்கரின்கள், மண்டரின்கள் மற்றும் கிளெமென்டைன்கள்'), { fruit: 'mandarin' }),
  row('1.3.4.1.1.2.9.5', '1239', 'cultivation', t('දොඩම් කුලයට අයත් වෙනත් පලතුරු', 'Other citrus fruits', 'பிற சிட்ரஸ் பழங்கள்'), { fruit: 'lemon' }),
  row('1.3.4.1.1.2.9.6', '1241', 'cultivation', t('දිවුල් සහ බෙලි', 'Wood apple and bael', 'விளாம்பழம் மற்றும் வில்வப்பழம்'), { fruit: 'woodapple' }),
  row('1.3.4.1.1.2.9.7', '1242', 'cultivation', t('දෙළුම්', 'Pomegranates', 'மாதுளை'), { fruit: 'pomegranate' }),
  row('1.3.4.1.1.2.9.8', '1243', 'cultivation', t('පෙයාර්ස්', 'Pears', 'பேரிக்காய்'), { fruit: 'pear' }),
  row('1.3.4.1.1.2.9.9', '1249', 'cultivation', t('මාංසල පලතුරු සහ ඝන පෘෂ්ඨ සහිත පලතුරු', 'Other fleshy and stone fruits', 'பிற மென் சதை மற்றும் கடினக் கொட்டை பழங்கள்'), { fruit: 'basket' }),
  row('1.3.4.1.1.2.9.10', '1251', 'cultivation', t('කජු', 'Cashew nuts', 'முந்திரி'), { fruit: 'cashew' }),
  row('1.3.4.1.1.2.9.12', '1253', 'cultivation', t('ස්ට්‍රෝබෙරි', 'Strawberries', 'ஸ்ட்ராபெரி'), { fruit: 'strawberry' }),
  row('1.3.4.1.1.2.9.13', '1259', 'cultivation', t('වෙනත් ගස් සහ පඳුරුවල හටගන්නා පලතුරු සහ ගෙඩි', 'Other tree and bush fruits and nuts', 'பிற மர மற்றும் புதர்ப் பழங்கள் மற்றும் கொட்டைகள்'), { fruit: 'sapling' }),

  row('1.3.4.1.1.6.1', '161', 'postharvest', t('බෝග නිෂ්පාදනය සඳහා වන ආධාරක කාර්යයන්', 'Support activities for crop production', 'பயிர் உற்பத்திக்கான ஆதரவு நடவடிக்கைகள்')),
  row('1.3.4.1.1.6.3', '163', 'postharvest', t('පශ්චාත් අස්වනු කාර්යයන් (මූලික වෙළෙඳ පොළ සඳහා සැකසීම)', 'Post-harvest crop activities (preparation for primary markets)', 'அறுவடைக்குப் பிந்தைய நடவடிக்கைகள் (முதன்மை சந்தைக்கான தயாரிப்பு)')),
  row('1.3.4.1.1.6.4', '164', 'postharvest', t('ව්‍යාප්තිය සඳහා බීජ සැකසීම', 'Seed processing for propagation', 'விதை இனப்பெருக்கத்திற்கான செயலாக்கம்')),

  row('1.3.4.3.1.3', 'C103', 'processing', t('එළවළු සහ පලතුරු සැකසීම සහ කල්තබා ගැනීම', 'Processing and preserving of fruit and vegetables', 'காய்கறி மற்றும் பழங்களைப் பதப்படுத்துதல் மற்றும் பாதுகாத்தல்')),
  row('1.3.4.3.1.3.1', '1030', 'processing', t('එළවළු සහ පලතුරු සැකසීම සහ කල්තබා ගැනීම', 'Processing and preserving of fruit and vegetables', 'காய்கறி மற்றும் பழங்களைப் பதப்படுத்துதல் மற்றும் பாதுகாத்தல்')),
  row('1.3.4.3.1.3.1.1', '10301', 'processing', t('පලතුරු කල් තබා ගැනීම සඳහා සැකසීම', 'Processing fruit for preservation', 'பாதுகாப்பிற்காகப் பழங்களைச் செயலாக்குதல்')),
  row('1.3.4.3.1.3.1.4', '10304', 'processing', t('පලතුරු වලින් ආහාර ද්‍රව්‍ය නිෂ්පාදනය, ඇසිරීම, ටින් කිරීම, ජෑම්, මාමලේඩ්, මේස ජෙලි නිෂ්පාදනය', 'Manufacture, packing and canning of fruit products, jams, marmalades and table jellies', 'பழப் பொருட்கள், ஜாம், மார்மலேடு மற்றும் மேசை ஜெல்லி தயாரித்தல், பொதியிடல் மற்றும் டின்னில் அடைத்தல்')),
  row('1.3.4.3.1.3.1.5', '10305', 'processing', t('අච්චාරු, චට්නි, උම්බලකඩ සහ ලුණු මිරිස් නිෂ්පාදනය', 'Manufacture of pickles, chutneys, Maldive fish and chilli paste', 'ஊறுகாய், சட்டினி, மாலைத்தீவு மீன் மற்றும் மிளகாய் பேஸ்ட் தயாரித்தல்')),
  row('1.3.4.3.1.3.1.6', '10306', 'processing', t('පලතුරු යුෂ සහ ඒවායේ සාන්ද්‍රණ නිෂ්පාදනය (කෝඩියල් නිෂ්පාදනය)', 'Manufacture of fruit juice and concentrates (cordial)', 'பழச்சாறு மற்றும் அதன் செறிவூட்டல்கள் தயாரித்தல் (கோர்டியல் தயாரித்தல்)')),
  row('1.3.4.3.2.1.4.1', '11041', 'processing', t('සිසිල් බීම, සෝඩා, පැණි බීම, පලතුරු බීම ආදිය නිෂ්පාදනය', 'Manufacture of soft drinks, soda, sweet drinks and fruit drinks', 'குளிர்பானங்கள், சோடா, இனிப்புப் பானங்கள் மற்றும் பழப் பானங்கள் தயாரித்தல்')),
  row('1.3.4.3.2.1.4.4', '11049', 'processing', t('මධ්‍යසාර රහිත වෙනත් බීම වර්ග නිෂ්පාදනය', 'Manufacture of other non-alcoholic beverages', 'பிற மதுபானமற்ற பானங்கள் தயாரித்தல்')),
  row('1.3.4.3.1.7.3.5', '10735', 'processing', t('සීනි වල බහා පලතුරු, පලතුරු ලෙලි, ඇට වර්ග සහ වෙනත් ශාකමය කොටස් කල්තබාගැනීම', 'Preserving fruit, fruit peels, nuts and other plant parts in sugar', 'சர்க்கரையில் பழங்கள், பழத்தோல்கள், கொட்டைகள் மற்றும் பிற தாவரப் பகுதிகளைப் பாதுகாத்தல்')),

  row('1.3.4.7.2.3.1.1', '46301', 'trade', t('බීම (මධ්‍යසාර නොවන) තොග වෙළඳාම', 'Wholesale of non-alcoholic beverages', 'மது அல்லாத பானங்கள் மொத்த விற்பனை')),
  row('1.3.4.7.2.3.1.3', '46303', 'trade', t('පලතුරු සහ එළවළු තොග වෙළඳාම', 'Wholesale of fruit and vegetables', 'பழங்கள் மற்றும் காய்கறிகள் மொத்த விற்பனை')),
  row('1.3.4.7.2.3.1.8', '46308', 'trade', t('තොග වෙළඳාම (කෑමට ගන්නා තෙල් උදා: පොල්තෙල්, එළඟි තෙල්)', 'Wholesale of edible oils (for example coconut oil and sesame oil)', 'உண்ணக்கூடிய எண்ணெய்கள் மொத்த விற்பனை (எ.கா., தேங்காய் எண்ணெய், எள்ளெண்ணெய்)')),
  row('1.3.4.7.3.2.1.1', '47211', 'trade', t('සිල්ලර වෙළඳාම අළුත් හෝ කල්තබා ගන්නා පලතුරු සහ එළවළු', 'Retail sale of fresh or preserved fruit and vegetables', 'புதிய அல்லது பதப்படுத்தப்பட்ட பழங்கள் மற்றும் காய்கறிகள் சில்லறை விற்பனை')),
  row('1.3.4.7.3.2.2.2', '47222', 'trade', t('ඇල්කොහොල් රහිත බීම විශේෂිත වූ සිල්ලර වෙළඳාම', 'Specialised retail sale of non-alcoholic beverages', 'மது அல்லாத பானங்களின் சிறப்பு சில்லறை விற்பனை')),
  row('1.3.4.7.3.8.1.1', '47811', 'trade', t('එළවළු, පලතුරු සිල්ලර වෙළඳාම කඩ මඟින් සහ වෙළඳපොළ මඟින්', 'Retail sale of vegetables and fruit through stalls and markets', 'கடைகள் மற்றும் சந்தைகள் வழியாக காய்கறிகள், பழங்கள் சில்லறை விற்பனை')),
  row('1.3.4.7.3.9.1.2', '47912', 'trade', t('සෑම වර්ගයකම නිෂ්පාදන - අන්තර්ජාලය තුළින් සිල්ලර වෙළඳාම', 'Retail sale of all kinds of products via the internet', 'அனைத்து வகைப் பொருட்களையும் இணையம் மூலம் சில்லறை விற்பனை')),
  row('1.3.4.7.3.9.2.7', '47996', 'trade', t('ගෙයින් ගෙට ගොස් මාළු, පලතුරු හා එළවළු සිල්ලර විකිණීම', 'Door-to-door retail sale of fish, fruit and vegetables', 'வீடு வீடாகச் சென்று மீன், பழங்கள் மற்றும் காய்கறிகள் சில்லறை விற்பனை')),

  row('1.3.4.9.2.3.1.3', '56303', 'services', t('පලතුරු බීම විකුණන ස්ථාන', 'Places selling fruit beverages', 'பழப் பானங்கள் விற்கும் இடங்கள்')),
  row('1.3.4.9.2.1.1.5', '56105', 'services', t('වාහන/බයිසිකල් මගින් අයිස් ක්‍රීම් වෙළඳාම', 'Ice cream sales by vehicle or bicycle', 'வாகனம் அல்லது மிதிவண்டி மூலம் ஐஸ்கிரீம் விற்பனை')),
  row('1.3.4.9.2.1.1.8', '56108', 'services', t('අයිස් ක්‍රීම් වෙළඳ කුටි', 'Ice cream sales booths', 'ஐஸ்கிரீம் விற்பனைக்கூடங்கள்')),
];

/** Single fruits, shown as the "what do you grow?" picker. */
export const FRUIT_PICKS: BusinessType[] = BUSINESS_TYPES.filter((b) => b.section === 'cultivation' && !b.isClass);

export const typesInSection = (id: SectionId): BusinessType[] => BUSINESS_TYPES.filter((b) => b.section === id);

export const findBySlug = (slug: string | null | undefined): BusinessType | undefined =>
  slug ? BUSINESS_TYPES.find((b) => b.slug === slug) : undefined;

export const pick = (value: Localized, lang: Lang): string => value[lang] || value.en;

// Sinhala conjuncts carry ZWJ/ZWNJ that people rarely type ("ද්‍රව්‍ය" vs "ද්රව්ය").
const normalise = (s: string): string => s.replace(/[‌‍]/g, '').toLocaleLowerCase().trim();

export const searchBusinessTypes = (query: string): BusinessType[] => {
  const q = normalise(query);
  if (!q) return [];
  const scored = BUSINESS_TYPES.map((b) => {
    const code = b.code.toLowerCase();
    const names = [b.name.si, b.name.en, b.name.ta].map(normalise);
    let score = 0;
    if (code === q) score = 4;
    else if (code.startsWith(q)) score = 3;
    else if (names.some((n) => n.startsWith(q))) score = 2;
    else if (names.some((n) => n.includes(q))) score = 1;
    return { b, score };
  }).filter((r) => r.score > 0);
  return scored.sort((a, b) => b.score - a.score).map((r) => r.b);
};
