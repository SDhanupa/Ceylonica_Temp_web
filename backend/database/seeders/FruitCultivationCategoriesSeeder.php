<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * Imports the 50 business categories in "පලතුරු වගාව, ඉඩම් හා තවාන්".
 *
 * The source document's "අංකය" value is retained as the dotted slug. The
 * `code` value is the same identifier with its periods removed.
 */
class FruitCultivationCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $parent = Category::where('slug', 'location-1-4')->firstOrFail();

        $categories = [
            ['slug' => '1.3.4.1.1.2.1', 'code' => '121', 'name_en' => 'Grape growing', 'name_si' => 'මිදි වගා කිරීම', 'name_ta' => 'திராட்சை பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.3', 'code' => '123', 'name_en' => 'Citrus fruit growing', 'name_si' => 'දොඩම් කුලයට අයත් පලතුරු වගාව', 'name_ta' => 'சிட்ரஸ் பழங்கள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.4', 'code' => '124', 'name_en' => 'Fleshy and stone fruit growing', 'name_si' => 'මාංසල පලතුරු සහ ඝන පෘෂ්ඨ සහිත පලතුරු වගාව', 'name_ta' => 'மென் சதை மற்றும் கடினக் கொட்டை பழங்கள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.5', 'code' => '125', 'name_en' => 'Other tree and bush fruit and nut growing', 'name_si' => 'වෙනත් ගස් සහ පඳුරුවල හටගන්නා පලතුරු සහ ගෙඩි වගාව', 'name_ta' => 'பிற மர மற்றும் புதர்ப் பழங்கள் மற்றும் கொட்டைகள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.6', 'code' => '126', 'name_en' => 'Oil fruit growing', 'name_si' => 'තෙල් සහිත පලතුරු වගා කිරීම', 'name_ta' => 'எண்ணெய் பழங்கள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.9', 'code' => '129', 'name_en' => 'Other perennial crop growing', 'name_si' => 'වෙනත් ස්ථිර බෝග වගා කිරීම', 'name_ta' => 'பிற நிரந்தரப் பயிர்கள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.1.1', 'code' => '1210', 'name_en' => 'Grapes', 'name_si' => 'මිදි', 'name_ta' => 'திராட்சை'],
            ['slug' => '1.3.4.1.1.2.2.1', 'code' => '1221', 'name_en' => 'Mangoes', 'name_si' => 'අඹ', 'name_ta' => 'மாம்பழம்'],
            ['slug' => '1.3.4.1.1.2.2.2', 'code' => '1222', 'name_en' => 'Bananas', 'name_si' => 'කෙසෙල්', 'name_ta' => 'வாழைப்பழம்'],
            ['slug' => '1.3.4.1.1.2.3.1', 'code' => '1223', 'name_en' => 'Papayas', 'name_si' => 'ගස්ලබු', 'name_ta' => 'பப்பாளி'],
            ['slug' => '1.3.4.1.1.2.4.1', 'code' => '1224', 'name_en' => 'Pineapples', 'name_si' => 'අන්නාසි', 'name_ta' => 'அன்னாசிப்பழம்'],
            ['slug' => '1.3.4.1.1.2.5.1', 'code' => '1225', 'name_en' => 'Passion fruit', 'name_si' => 'පැෂන් ෆෘට්', 'name_ta' => 'பேஷன் பழம்'],
            ['slug' => '1.3.4.1.1.2.6.1', 'code' => '1226', 'name_en' => 'Rambutan', 'name_si' => 'රඹුටන්', 'name_ta' => 'ரம்புட்டான்'],
            ['slug' => '1.3.4.1.1.2.7.1', 'code' => '1227', 'name_en' => 'Avocados', 'name_si' => 'අලිගැට පේර', 'name_ta' => 'அவகாடோ'],
            ['slug' => '1.3.4.1.1.2.8.1', 'code' => '1228', 'name_en' => 'Kiwifruit', 'name_si' => 'කිවි පේර', 'name_ta' => 'கிவிப்பழம்'],
            ['slug' => '1.3.4.1.1.2.9.1', 'code' => '1229', 'name_en' => 'Other tropical and subtropical fruit growing', 'name_si' => 'වෙනත් නිවර්තන සහ උපනිවර්තන කලාපීය පලතුරු වගාව', 'name_ta' => 'பிற வெப்பமண்டல மற்றும் துணை வெப்பமண்டலப் பழங்கள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.9.2', 'code' => '1231', 'name_en' => 'Oranges', 'name_si' => 'දොඩම්', 'name_ta' => 'ஆரஞ்சு'],
            ['slug' => '1.3.4.1.1.2.9.3', 'code' => '1232', 'name_en' => 'Lime and lemon variety growing', 'name_si' => 'දෙහි හා ලෙමන් වර්ග වගාව', 'name_ta' => 'நாரத்தை மற்றும் எலுமிச்சை வகைகள் பயிரிடுதல்'],
            ['slug' => '1.3.4.1.1.2.9.4', 'code' => '1233', 'name_en' => 'Tangerines, mandarins and clementines', 'name_si' => 'ජමනාරං, හීන්නාරං, ක්ලෙමෙන්ටින්', 'name_ta' => 'டாங்கரின்கள், மண்டரின்கள் மற்றும் கிளெமென்டைன்கள்'],
            ['slug' => '1.3.4.1.1.2.9.5', 'code' => '1239', 'name_en' => 'Other citrus fruits', 'name_si' => 'දොඩම් කුලයට අයත් වෙනත් පලතුරු', 'name_ta' => 'பிற சிட்ரஸ் பழங்கள்'],
            ['slug' => '1.3.4.1.1.2.9.6', 'code' => '1241', 'name_en' => 'Wood apple and bael', 'name_si' => 'දිවුල් සහ බෙලි', 'name_ta' => 'விளாம்பழம் மற்றும் வில்வப்பழம்'],
            ['slug' => '1.3.4.1.1.2.9.7', 'code' => '1242', 'name_en' => 'Pomegranates', 'name_si' => 'දෙළුම්', 'name_ta' => 'மாதுளை'],
            ['slug' => '1.3.4.1.1.2.9.8', 'code' => '1243', 'name_en' => 'Pears', 'name_si' => 'පෙයාර්ස්', 'name_ta' => 'பேரிக்காய்'],
            ['slug' => '1.3.4.1.1.2.9.9', 'code' => '1249', 'name_en' => 'Other fleshy and stone fruits', 'name_si' => 'මාංසල පලතුරු සහ ඝන පෘෂ්ඨ සහිත පලතුරු', 'name_ta' => 'பிற மென் சதை மற்றும் கடினக் கொட்டை பழங்கள்'],
            ['slug' => '1.3.4.1.1.2.9.10', 'code' => '1251', 'name_en' => 'Cashew nuts', 'name_si' => 'කජු', 'name_ta' => 'முந்திரி'],
            ['slug' => '1.3.4.1.1.2.9.12', 'code' => '1253', 'name_en' => 'Strawberries', 'name_si' => 'ස්ට්‍රෝබෙරි', 'name_ta' => 'ஸ்ட்ராபெரி'],
            ['slug' => '1.3.4.1.1.2.9.13', 'code' => '1259', 'name_en' => 'Other tree and bush fruits and nuts', 'name_si' => 'වෙනත් ගස් සහ පඳුරුවල හටගන්නා පලතුරු සහ ගෙඩි', 'name_ta' => 'பிற மர மற்றும் புதர்ப் பழங்கள் மற்றும் கொட்டைகள்'],
            ['slug' => '1.3.4.1.1.6.1', 'code' => '161', 'name_en' => 'Support activities for crop production', 'name_si' => 'බෝග නිෂ්පාදනය සඳහා වන ආධාරක කාර්යයන්', 'name_ta' => 'பயிர் உற்பத்திக்கான ஆதரவு நடவடிக்கைகள்'],
            ['slug' => '1.3.4.1.1.6.3', 'code' => '163', 'name_en' => 'Post-harvest crop activities (preparation for primary markets)', 'name_si' => 'පශ්චාත් අස්වනු කාර්යයන් (මූලික වෙළෙඳ පොළ සඳහා සැකසීම)', 'name_ta' => 'அறுவடைக்குப் பிந்தைய நடவடிக்கைகள் (முதன்மை சந்தைக்கான தயாரிப்பு)'],
            ['slug' => '1.3.4.1.1.6.4', 'code' => '164', 'name_en' => 'Seed processing for propagation', 'name_si' => 'ව්‍යාප්තිය සඳහා බීජ සැකසීම', 'name_ta' => 'விதை இனப்பெருக்கத்திற்கான செயலாக்கம்'],
            ['slug' => '1.3.4.3.1.3', 'code' => 'C103', 'name_en' => 'Processing and preserving of fruit and vegetables', 'name_si' => 'එළවළු සහ පලතුරු සැකසීම සහ කල්තබා ගැනීම', 'name_ta' => 'காய்கறி மற்றும் பழங்களைப் பதப்படுத்துதல் மற்றும் பாதுகாத்தல்'],
            ['slug' => '1.3.4.3.1.3.1', 'code' => '1030', 'name_en' => 'Processing and preserving of fruit and vegetables', 'name_si' => 'එළවළු සහ පලතුරු සැකසීම සහ කල්තබා ගැනීම', 'name_ta' => 'காய்கறி மற்றும் பழங்களைப் பதப்படுத்துதல் மற்றும் பாதுகாத்தல்'],
            ['slug' => '1.3.4.3.1.3.1.1', 'code' => '10301', 'name_en' => 'Processing fruit for preservation', 'name_si' => 'පලතුරු කල් තබා ගැනීම සඳහා සැකසීම', 'name_ta' => 'பாதுகாப்பிற்காகப் பழங்களைச் செயலாக்குதல்'],
            ['slug' => '1.3.4.3.1.3.1.4', 'code' => '10304', 'name_en' => 'Manufacture, packing and canning of fruit products, jams, marmalades and table jellies', 'name_si' => 'පලතුරු වලින් ආහාර ද්‍රව්‍ය නිෂ්පාදනය, ඇසිරීම, ටින් කිරීම, ජෑම්, මාමලේඩ්, මේස ජෙලි නිෂ්පාදනය', 'name_ta' => 'பழப் பொருட்கள், ஜாம், மார்மலேடு மற்றும் மேசை ஜெல்லி தயாரித்தல், பொதியிடல் மற்றும் டின்னில் அடைத்தல்'],
            ['slug' => '1.3.4.3.1.3.1.5', 'code' => '10305', 'name_en' => 'Manufacture of pickles, chutneys, Maldive fish and chilli paste', 'name_si' => 'අච්චාරු, චට්නි, උම්බලකඩ සහ ලුණු මිරිස් නිෂ්පාදනය', 'name_ta' => 'ஊறுகாய், சட்டினி, மாலைத்தீவு மீன் மற்றும் மிளகாய் பேஸ்ட் தயாரித்தல்'],
            ['slug' => '1.3.4.3.1.3.1.6', 'code' => '10306', 'name_en' => 'Manufacture of fruit juice and concentrates (cordial)', 'name_si' => 'පලතුරු යුෂ සහ ඒවායේ සාන්ද්‍රණ නිෂ්පාදනය (කෝඩියල් නිෂ්පාදනය)', 'name_ta' => 'பழச்சாறு மற்றும் அதன் செறிவூட்டல்கள் தயாரித்தல் (கோர்டியல் தயாரித்தல்)'],
            ['slug' => '1.3.4.3.2.1.4.1', 'code' => '11041', 'name_en' => 'Manufacture of soft drinks, soda, sweet drinks and fruit drinks', 'name_si' => 'සිසිල් බීම, සෝඩා, පැණි බීම, පලතුරු බීම ආදිය නිෂ්පාදනය', 'name_ta' => 'குளிர்பானங்கள், சோடா, இனிப்புப் பானங்கள் மற்றும் பழப் பானங்கள் தயாரித்தல்'],
            ['slug' => '1.3.4.3.2.1.4.4', 'code' => '11049', 'name_en' => 'Manufacture of other non-alcoholic beverages', 'name_si' => 'මධ්‍යසාර රහිත වෙනත් බීම වර්ග නිෂ්පාදනය', 'name_ta' => 'பிற மதுபானமற்ற பானங்கள் தயாரித்தல்'],
            ['slug' => '1.3.4.3.1.7.3.5', 'code' => '10735', 'name_en' => 'Preserving fruit, fruit peels, nuts and other plant parts in sugar', 'name_si' => 'සීනි වල බහා පලතුරු, පලතුරු ලෙලි, ඇට වර්ග සහ වෙනත් ශාකමය කොටස් කල්තබාගැනීම', 'name_ta' => 'சர்க்கரையில் பழங்கள், பழத்தோல்கள், கொட்டைகள் மற்றும் பிற தாவரப் பகுதிகளைப் பாதுகாத்தல்'],
            ['slug' => '1.3.4.7.2.3.1.1', 'code' => '46301', 'name_en' => 'Wholesale of non-alcoholic beverages', 'name_si' => 'බීම (මධ්‍යසාර නොවන) තොග වෙළඳාම', 'name_ta' => 'மது அல்லாத பானங்கள் மொத்த விற்பனை'],
            ['slug' => '1.3.4.7.2.3.1.3', 'code' => '46303', 'name_en' => 'Wholesale of fruit and vegetables', 'name_si' => 'පලතුරු සහ එළවළු තොග වෙළඳාම', 'name_ta' => 'பழங்கள் மற்றும் காய்கறிகள் மொத்த விற்பனை'],
            ['slug' => '1.3.4.7.2.3.1.8', 'code' => '46308', 'name_en' => 'Wholesale of edible oils (for example coconut oil and sesame oil)', 'name_si' => 'තොග වෙළඳාම (කෑමට ගන්නා තෙල් උදා: පොල්තෙල්, එළඟි තෙල්)', 'name_ta' => 'உண்ணக்கூடிய எண்ணெய்கள் மொத்த விற்பனை (எ.கா., தேங்காய் எண்ணெய், எள்ளெண்ணெய்)'],
            ['slug' => '1.3.4.7.3.2.1.1', 'code' => '47211', 'name_en' => 'Retail sale of fresh or preserved fruit and vegetables', 'name_si' => 'සිල්ලර වෙළඳාම අළුත් හෝ කල්තබා ගන්නා පලතුරු සහ එළවළු', 'name_ta' => 'புதிய அல்லது பதப்படுத்தப்பட்ட பழங்கள் மற்றும் காய்கறிகள் சில்லறை விற்பனை'],
            ['slug' => '1.3.4.7.3.2.2.2', 'code' => '47222', 'name_en' => 'Specialised retail sale of non-alcoholic beverages', 'name_si' => 'ඇල්කොහොල් රහිත බීම විශේෂිත වූ සිල්ලර වෙළඳාම', 'name_ta' => 'மது அல்லாத பானங்களின் சிறப்பு சில்லறை விற்பனை'],
            ['slug' => '1.3.4.7.3.8.1.1', 'code' => '47811', 'name_en' => 'Retail sale of vegetables and fruit through stalls and markets', 'name_si' => 'එළවළු, පලතුරු සිල්ලර වෙළඳාම කඩ මඟින් සහ වෙළඳපොළ මඟින්', 'name_ta' => 'கடைகள் மற்றும் சந்தைகள் வழியாக காய்கறிகள், பழங்கள் சில்லறை விற்பனை'],
            ['slug' => '1.3.4.7.3.9.1.2', 'code' => '47912', 'name_en' => 'Retail sale of all kinds of products via the internet', 'name_si' => 'සෑම වර්ගයකම නිෂ්පාදන - අන්තර්ජාලය තුළින් සිල්ලර වෙළඳාම', 'name_ta' => 'அனைத்து வகைப் பொருட்களையும் இணையம் மூலம் சில்லறை விற்பனை'],
            ['slug' => '1.3.4.7.3.9.2.7', 'code' => '47996', 'name_en' => 'Door-to-door retail sale of fish, fruit and vegetables', 'name_si' => 'ගෙයින් ගෙට ගොස් මාළු, පලතුරු හා එළවළු සිල්ලර විකිණීම', 'name_ta' => 'வீடு வீடாகச் சென்று மீன், பழங்கள் மற்றும் காய்கறிகள் சில்லறை விற்பனை'],
            ['slug' => '1.3.4.9.2.3.1.3', 'code' => '56303', 'name_en' => 'Places selling fruit beverages', 'name_si' => 'පලතුරු බීම විකුණන ස්ථාන', 'name_ta' => 'பழப் பானங்கள் விற்கும் இடங்கள்'],
            ['slug' => '1.3.4.9.2.1.1.5', 'code' => '56105', 'name_en' => 'Ice cream sales by vehicle or bicycle', 'name_si' => 'වාහන/බයිසිකල් මගින් අයිස් ක්‍රීම් වෙළඳාම', 'name_ta' => 'வாகனம் அல்லது மிதிவண்டி மூலம் ஐஸ்கிரீம் விற்பனை'],
            ['slug' => '1.3.4.9.2.1.1.8', 'code' => '56108', 'name_en' => 'Ice cream sales booths', 'name_si' => 'අයිස් ක්‍රීම් වෙළඳ කුටි', 'name_ta' => 'ஐஸ்கிரீம் விற்பனைக்கூடங்கள்'],
        ];

        foreach ($categories as $position => $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                [
                    ...$category,
                    'code' => str_replace('.', '', $category['slug']),
                    'parent_id' => $parent->id,
                    'sort_order' => 10_000 + $position,
                ],
            );
        }
    }
}
