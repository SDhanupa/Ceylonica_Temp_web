<?php

namespace App\GraphQL\Queries;

use Illuminate\Support\Facades\DB;
use App\Models\GramaNiladhari;

class GnByCoordinates
{
    /**
     * @param  null  $_
     * @param  array{}  $args
     */
    public function __invoke($_, array $args)
    {
        $lat = $args['lat'];
        $lng = $args['lng'];

        $candidates = [];
        try {
            // Fast bounding box check
            $candidates = DB::table('gn_divisions')
                ->where('min_lat', '<=', $lat)
                ->where('max_lat', '>=', $lat)
                ->where('min_lng', '<=', $lng)
                ->where('max_lng', '>=', $lng)
                ->get();
        } catch (\Exception $e) {
            // Table might not exist, proceed to fallback
        }

        $found = null;
        foreach ($candidates as $c) {
            $polygons = json_decode($c->polygons, true);
            if (!is_array($polygons)) continue;
            
            foreach ($polygons as $polygon) {
                if ($this->pointInPolygon([$lng, $lat], $polygon)) {
                    $found = $c;
                    break 2;
                }
            }
        }

        if ($found) {
            $details = json_decode($found->details, true);
            $gnCode = $details['GND_NO_Cen'] ?? null;
            
            $exactCode = null;
            if (isset($details['PROVINCE_C']) && isset($details['DISTRICT_C']) && isset($details['DSD_C']) && isset($details['GND_C'])) {
                $exactCode = 'LK' . $details['PROVINCE_C'] . $details['DISTRICT_C'] . $details['DSD_C'] . $details['GND_C'];
            }
            
            $districtName = explode(' ', $found->district)[0]; // e.g. "AMPARA (1)" -> "AMPARA"
            $district = DB::table('p_district')->where('admin2Name_en', 'ilike', '%' . $districtName . '%')->first();
            
            if ($district) {
                if ($exactCode) {
                    $gn = GramaNiladhari::where('code', $exactCode)->first();
                    if ($gn) return $gn;
                }

                if ($gnCode) {
                    $gn = GramaNiladhari::where('district_code', $district->admin2Pcode)
                        ->where('code', 'like', '%' . $gnCode . '%')
                        ->first();
                    if ($gn) return $gn;
                }
                
                $cleanName = trim(preg_replace('/[0-9A-Za-z]?$/', '', $found->name)); // Remove trailing 01A
                $gn = GramaNiladhari::where('district_code', $district->admin2Pcode)
                    ->where('name_en', 'like', '%' . $cleanName . '%')
                    ->first();
                if ($gn) return $gn;
            } else {
                if ($exactCode) {
                    $gn = GramaNiladhari::where('code', $exactCode)->first();
                    if ($gn) return $gn;
                }

                if ($gnCode) {
                    $gn = GramaNiladhari::where('code', 'like', '%' . $gnCode . '%')->first();
                    if ($gn) return $gn;
                }
                
                // Fallback to name search
                $gn = GramaNiladhari::where('name_en', 'like', '%' . $found->name . '%')->first();
                if ($gn) return $gn;
            }
        }
        
        // Fallback to Nominatim if local DB fails or returns nothing
        $options = [
            'http' => [
                'header' => "User-Agent: CeylonicaApp/1.0\r\n"
            ]
        ];
        $context = stream_context_create($options);
        $response = @file_get_contents("https://nominatim.openstreetmap.org/reverse?lat={$lat}&lon={$lng}&format=json", false, $context);
        
        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['address'])) {
                $address = $data['address'];
                $city = $address['city'] ?? $address['town'] ?? $address['village'] ?? $address['suburb'] ?? null;
                $district = $address['state_district'] ?? $address['county'] ?? null;
                
                if ($city) {
                    $query = GramaNiladhari::query();
                    
                    if ($district) {
                        $cleanDistrict = str_ireplace([' District', ' ', 'Maha'], '', $district);
                        $query->where('dis_en', 'ilike', '%' . trim($cleanDistrict) . '%');
                    }
                    
                    $query->where(function($q) use ($city) {
                        $q->where('name_en', 'ilike', '%' . $city . '%')
                          ->orWhere('ds_en', 'ilike', '%' . $city . '%');
                    });
                    
                    $gn = $query->first();
                    if ($gn) return $gn;
                }
            }
        }

        return null;
    }

    private function pointInPolygon($point, $polygon) {
        $x = $point[0]; // lng
        $y = $point[1]; // lat
        $inside = false;
        
        // Handle multipolygon structure which might have deeper arrays
        if (isset($polygon[0][0]) && is_array($polygon[0][0])) {
            $polygon = $polygon[0]; // Take the first linear ring
        }

        for ($i = 0, $j = count($polygon) - 1; $i < count($polygon); $j = $i++) {
            if (!isset($polygon[$i][0]) || !isset($polygon[$j][0])) continue;
            
            $xi = $polygon[$i][0];
            $yi = $polygon[$i][1];
            $xj = $polygon[$j][0];
            $yj = $polygon[$j][1];

            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }
        return $inside;
    }
}
