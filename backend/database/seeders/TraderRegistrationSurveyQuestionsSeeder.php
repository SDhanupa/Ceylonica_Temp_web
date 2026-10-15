<?php

namespace Database\Seeders;

use App\Models\BusinessSurveyQuestion;
use Illuminate\Database\Seeder;

/**
 * Adds the Trader Registration fields that are not already captured by the
 * Industry Survey's unchanged Basic Information and Business Owner pages.
 *
 * Source: Trader registration fields.xlsx. The duplicate "business nature"
 * header in the source is deliberately represented once.
 */
class TraderRegistrationSurveyQuestionsSeeder extends Seeder
{
    public function run(): void
    {
        $yesNo = [
            'en' => ['1. Yes', '2. No'],
            'si' => ['1. ඔව්', '2. නැත'],
            'ta' => ['1. ஆம்', '2. இல்லை'],
        ];

        $ownershipTypes = [
            'en' => ['1. Sole proprietorship', '2. Partnership', '3. Private limited company', '4. Public limited company', '5. Cooperative', '6. Other'],
            'si' => ['1. තනි හිමිකාරිත්වය', '2. හවුල් ව්‍යාපාරය', '3. පෞද්ගලික සීමිත සමාගම', '4. පොදු සීමිත සමාගම', '5. සමුපකාරය', '6. වෙනත්'],
            'ta' => ['1. தனி உரிமை', '2. கூட்டாண்மை', '3. தனியார் வரையறுக்கப்பட்ட நிறுவனம்', '4. பொது வரையறுக்கப்பட்ட நிறுவனம்', '5. கூட்டுறவு', '6. பிற'],
        ];

        $premisesOwnership = [
            'en' => ['1. Owned by the business/owner', '2. Rented or leased', '3. Shared premises', '4. Government or local-authority premises', '5. Other'],
            'si' => ['1. ව්‍යාපාරයට/හිමිකරුට අයත්', '2. කුලියට හෝ බදු පදනම මත ගත්', '3. හවුල් පරිශ්‍රයක්', '4. රජයේ හෝ පළාත් පාලන ආයතනයක පරිශ්‍රයක්', '5. වෙනත්'],
            'ta' => ['1. வணிகம்/உரிமையாளருக்குச் சொந்தமானது', '2. வாடகை அல்லது குத்தகை', '3. பகிரப்பட்ட வளாகம்', '4. அரசு அல்லது உள்ளூராட்சி வளாகம்', '5. பிற'],
        ];

        $questions = [
            // Step 2 — Legal status of the business
            [
                'step_index' => 2, 'field_key' => 'q_ownership_nature', 'type' => 'select',
                'question_en' => 'Nature of ownership', 'question_si' => 'හිමිකාරිත්වයේ ස්වභාවය', 'question_ta' => 'உரிமையின் தன்மை',
                'options_json' => $ownershipTypes, 'sort_order' => 10,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_ds_business_registration_no', 'type' => 'text',
                'question_en' => 'Business name registration number at the Divisional Secretariat', 'question_si' => 'ප්‍රාදේශීය ලේකම් කාර්යාලයේ ව්‍යාපාර නාම ලියාපදිංචි අංකය', 'question_ta' => 'பிரதேச செயலகத்தில் உள்ள வணிகப் பெயர் பதிவு எண்',
                'sort_order' => 20,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_company_registration_no', 'type' => 'text',
                'question_en' => 'Company registration number', 'question_si' => 'සමාගම් ලියාපදිංචි කිරීමේ දෙපාර්තමේන්තුවේ ලියාපදිංචි අංකය', 'question_ta' => 'நிறுவனப் பதிவு எண்',
                'sort_order' => 30,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_business_registration_date', 'type' => 'date',
                'question_en' => 'Business registration date', 'question_si' => 'ව්‍යාපාරය ලියාපදිංචි කළ දිනය', 'question_ta' => 'வணிகம் பதிவு செய்யப்பட்ட தேதி',
                'sort_order' => 40,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_business_started_date', 'type' => 'date',
                'question_en' => 'Business commencement date', 'question_si' => 'ව්‍යාපාරය ආරම්භ කළ දිනය', 'question_ta' => 'வணிகம் தொடங்கிய தேதி',
                'sort_order' => 50,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_caa_legal_action', 'type' => 'select',
                'question_en' => 'Has the Consumer Affairs Authority filed a case against this business?', 'question_si' => 'පාරිභෝගික කටයුතු පිළිබඳ අධිකාරිය මෙම ව්‍යාපාරයට එරෙහිව නඩු පවරා තිබේද?', 'question_ta' => 'நுகர்வோர் அலுவல்கள் அதிகாரசபை இந்த வணிகத்திற்கு எதிராக வழக்கு தொடர்ந்துள்ளதா?',
                'options_json' => $yesNo, 'sort_order' => 60,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_caa_case_count', 'type' => 'number',
                'question_en' => 'If yes, how many times?', 'question_si' => 'ඔව් නම්, ඒ කී වරක්ද?', 'question_ta' => 'ஆம் என்றால், எத்தனை முறை?',
                'depends_on' => 'q_caa_legal_action:1', 'sort_order' => 70,
            ],
            [
                'step_index' => 2, 'field_key' => 'q_caa_case_reason', 'type' => 'textarea',
                'question_en' => 'If yes, state the reason', 'question_si' => 'ඔව් නම්, හේතුව සඳහන් කරන්න', 'question_ta' => 'ஆம் என்றால், காரணத்தைக் குறிப்பிடவும்',
                'depends_on' => 'q_caa_legal_action:1', 'sort_order' => 80,
            ],

            // Step 3 — Location and infrastructure
            [
                'step_index' => 3, 'field_key' => 'q_judicial_area', 'type' => 'text',
                'question_en' => 'Judicial area', 'question_si' => 'අධිකරණ බල ප්‍රදේශය', 'question_ta' => 'நீதித்துறைப் பகுதி',
                'sort_order' => 10,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_location_ownership', 'type' => 'select',
                'question_en' => 'Ownership of the business premises', 'question_si' => 'ව්‍යාපාර ස්ථානයේ හිමිකාරීත්වය', 'question_ta' => 'வணிக வளாகத்தின் உரிமை',
                'options_json' => $premisesOwnership, 'sort_order' => 20,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_rent_amount', 'type' => 'number',
                'question_en' => 'Monthly rent amount (LKR)', 'question_si' => 'මාසික කුලී මුදල (රු.)', 'question_ta' => 'மாத வாடகைத் தொகை (ரூ.)',
                'depends_on' => 'q_location_ownership:2', 'sort_order' => 30,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_business_nature', 'type' => 'text',
                'question_en' => 'Nature of the business', 'question_si' => 'ව්‍යාපාරයේ ස්වභාවය', 'question_ta' => 'வணிகத்தின் தன்மை',
                'sort_order' => 40,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_branch_count', 'type' => 'number',
                'question_en' => 'Number of branches', 'question_si' => 'ශාඛා ප්‍රමාණය', 'question_ta' => 'கிளைகளின் எண்ணிக்கை',
                'sort_order' => 50,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_branch_addresses', 'type' => 'textarea',
                'question_en' => 'Addresses of branches', 'question_si' => 'ශාඛා පිහිටි ලිපිනය/ලිපිනයන්', 'question_ta' => 'கிளைகள் அமைந்துள்ள முகவரி/முகவரிகள்',
                'sort_order' => 60,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_warehouse_count', 'type' => 'number',
                'question_en' => 'Number of warehouses', 'question_si' => 'ගබඩා ප්‍රමාණය', 'question_ta' => 'கிடங்குகளின் எண்ணிக்கை',
                'sort_order' => 70,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_warehouse_addresses', 'type' => 'textarea',
                'question_en' => 'Addresses of warehouses', 'question_si' => 'ගබඩාව/ගබඩා පිහිටි ලිපිනය/ලිපිනයන්', 'question_ta' => 'கிடங்கு/கிடங்குகள் அமைந்துள்ள முகவரி/முகவரிகள்',
                'sort_order' => 80,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_business_landline', 'type' => 'tel',
                'question_en' => 'Business landline number', 'question_si' => 'ව්‍යාපාරයේ ස්ථාවර දුරකථන අංකය', 'question_ta' => 'வணிக நிலையான தொலைபேசி எண்',
                'sort_order' => 90,
            ],
            [
                'step_index' => 3, 'field_key' => 'q_business_fax', 'type' => 'tel',
                'question_en' => 'Business fax number', 'question_si' => 'ව්‍යාපාරයේ ෆැක්ස් අංකය', 'question_ta' => 'வணிக தொலைநகல் எண்',
                'sort_order' => 100,
            ],
        ];

        foreach ($questions as $question) {
            BusinessSurveyQuestion::updateOrCreate(
                ['field_key' => $question['field_key']],
                [
                    ...$question,
                    'is_active' => true,
                    'explanation_en' => null,
                    'explanation_si' => null,
                    'explanation_ta' => null,
                ],
            );
        }
    }
}
