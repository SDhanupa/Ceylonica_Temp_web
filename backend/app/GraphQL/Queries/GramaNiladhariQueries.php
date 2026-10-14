<?php

namespace App\GraphQL\Queries;

use Illuminate\Support\Facades\DB;
use App\Models\GramaNiladhari;

class GramaNiladhariQueries
{
    /**
     * Resolve boundary for a GramaNiladhari model instance
     */
    public function boundary($root, array $args)
    {
        if (!$root || !isset($root->id)) return null;

        $cacheKey = "gn_boundary_root_" . $root->id;
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400 * 30, function () use ($root) {
            $nameEn   = $root->name_en ?? $root->nameEn ?? null;
            $code     = $root->code ?? null;
            $district = $root->dis_en ?? $root->disEn ?? null;
            $dsName   = $root->ds_en ?? $root->dsEn ?? null;

            $boundary = null;
            try {
                // 1. PRIMARY & MOST PRECISE: Match by official 7-digit Census Code structure
                if ($code && strlen($code) >= 9) {
                    $prov = substr($code, 2, 1);
                    $dist = substr($code, 3, 1);
                    $dsd  = substr($code, 4, 2);
                    $gnd  = substr($code, 6);

                    $boundary = DB::table('gn_divisions')
                        ->where('details', 'like', '%"PROVINCE_C": "' . $prov . '"%')
                        ->where('details', 'like', '%"DISTRICT_C": "' . $dist . '"%')
                        ->where('details', 'like', '%"DSD_C": "' . $dsd . '"%')
                        ->where('details', 'like', '%"GND_C": "' . $gnd . '"%')
                        ->first();
                }

                // 2. SECONDARY: Match by District AND Village Name
                if (!$boundary && $district && $nameEn && $nameEn !== '[unknown]') {
                    $cleanName = trim(preg_replace('/[0-9A-Za-z]?$/', '', $nameEn));
                    
                    $boundary = DB::table('gn_divisions')
                        ->where('district', 'like', '%' . strtoupper(trim($district)) . '%')
                        ->where(function ($q) use ($nameEn, $cleanName) {
                            $q->where('name', $nameEn)
                              ->orWhere('name', 'like', $cleanName . '%')
                              ->orWhere('details', 'like', '%"GND_N": "' . $nameEn . '"%');
                        })
                        ->first();
                }

                // 3. TERTIARY: If code has 4 digits
                if (!$boundary && $district && $code && strlen($code) >= 6) {
                    $dsd = substr($code, 4, 2);
                    $gnd = substr($code, 6);
                    $boundary = DB::table('gn_divisions')
                        ->where('district', 'like', '%' . strtoupper(trim($district)) . '%')
                        ->where('details', 'like', '%"DSD_C": "' . $dsd . '"%')
                        ->where('details', 'like', '%"GND_C": "' . $gnd . '"%')
                        ->first();
                }

                // 4. FOURTH: Match by DS Division and Name
                if (!$boundary && $dsName && $nameEn && $nameEn !== '[unknown]') {
                    $boundary = DB::table('gn_divisions')
                        ->where('details', 'like', '%"DSD_N": "' . $dsName . '"%')
                        ->where('name', 'like', '%' . $nameEn . '%')
                        ->first();
                }

                // 5. FALLBACK: Exact name match
                if (!$boundary && $nameEn && $nameEn !== '[unknown]') {
                    $matches = DB::table('gn_divisions')->where('name', $nameEn)->get();
                    if ($matches->count() === 1) {
                        $boundary = $matches->first();
                    }
                }
            } catch (\Exception $e) {
                // Return null if table does not exist
            }

            if ($boundary) {
                return [
                    'min_lat'  => (float) $boundary->min_lat,
                    'max_lat'  => (float) $boundary->max_lat,
                    'min_lng'  => (float) $boundary->min_lng,
                    'max_lng'  => (float) $boundary->max_lng,
                    'polygons' => $boundary->polygons,
                ];
            }

            return null;
        });
    }

    /**
     * Top-level query to get GN boundary by name, ccode, or district
     */
    public function getGnBoundary($root, array $args)
    {
        $gnName   = $args['gn_name'] ?? null;
        $ccode    = $args['ccode'] ?? null;
        $district = $args['district'] ?? null;

        if ($ccode) {
            $cacheKey = "gn_boundary_ccode_" . md5($ccode);
            return \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400 * 30, function () use ($ccode) {
                $gn = GramaNiladhari::where('CCODE', $ccode)->orWhere('code', $ccode)->first();
                if ($gn) {
                    return $this->boundary($gn, []);
                }
                return null;
            });
        }

        if ($gnName) {
            $cacheKey = "gn_boundary_name_" . md5($gnName . '_' . $district);
            return \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400 * 30, function () use ($gnName, $district) {
                $boundary = null;
                try {
                    $query = DB::table('gn_divisions');
                    if ($district) {
                        $query->where('district', 'like', '%' . strtoupper(trim($district)) . '%');
                    }
                    $query->where(function ($q) use ($gnName) {
                        $q->where('name', $gnName)
                          ->orWhere('name', 'like', $gnName . '%');
                    });
                    $boundary = $query->first();
                } catch (\Exception $e) {
                    // Ignore missing table
                }

                if ($boundary) {
                    return [
                        'min_lat'  => (float) $boundary->min_lat,
                        'max_lat'  => (float) $boundary->max_lat,
                        'min_lng'  => (float) $boundary->min_lng,
                        'max_lng'  => (float) $boundary->max_lng,
                        'polygons' => $boundary->polygons,
                    ];
                }
                return null;
            });
        }

        return null;
    }
}
