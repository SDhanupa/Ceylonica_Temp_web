<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\GramaNiladhari;

class SearchController extends Controller
{
    public function searchGns(Request $request)
    {
        $query = $request->input('q');
        
        if (!$query || mb_strlen($query) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $queryLower = strtolower($query);

        $gns = GramaNiladhari::whereRaw('LOWER(name_en) LIKE ?', ["%{$queryLower}%"])
            ->orWhereRaw('LOWER(name_si) LIKE ?', ["%{$queryLower}%"])
            ->orWhereRaw('LOWER(name_ta) LIKE ?', ["%{$queryLower}%"])
            ->orWhereRaw('LOWER("CCODE") LIKE ?', ["%{$queryLower}%"])
            ->orWhereRaw('LOWER(ds_en) LIKE ?', ["%{$queryLower}%"])
            ->orWhereRaw('LOWER(ds_si) LIKE ?', ["%{$queryLower}%"])
            ->orWhereRaw('LOWER(ds_ta) LIKE ?', ["%{$queryLower}%"])
            ->limit(50)
            ->get();

        $formatted = $gns->map(function ($gn) {
            $ccode = $gn->CCODE ?? $gn->code ?? '';
            $nameEn = $gn->nameEn ?? $gn->name_en ?? '';
            $nameSi = $gn->nameSi ?? $gn->name_si ?? '';
            $nameTa = $gn->nameTa ?? $gn->name_ta ?? '';
            $dsEn = $gn->dsEn ?? $gn->ds_en ?? '';
            $dsSi = $gn->dsSi ?? $gn->ds_si ?? '';
            $dsTa = $gn->dsTa ?? $gn->ds_ta ?? '';

            $disEn = $gn->disEn ?? $gn->dis_en ?? '';
            $disSi = $gn->disSi ?? $gn->dis_si ?? '';
            $disTa = $gn->disTa ?? $gn->dis_ta ?? '';

            $proEn = $gn->proEn ?? $gn->pro_en ?? '';
            $proSi = $gn->proSi ?? $gn->pro_si ?? '';
            $proTa = $gn->proTa ?? $gn->pro_ta ?? '';

            // Construct display string: GN, DS, District, Province
            $displayEn = trim("{$nameEn} ({$ccode}), {$dsEn}, {$disEn}, {$proEn}", ' ,()');
            $displaySi = trim("{$nameSi} ({$ccode}), {$dsSi}, {$disSi}, {$proSi}", ' ,()');
            $displayTa = trim("{$nameTa} ({$ccode}), {$dsTa}, {$disTa}, {$proTa}", ' ,()');

            return [
                'type' => 'gn',
                'id' => $gn->id,
                'ccode' => $ccode,
                'nameEn' => $nameEn,
                'nameSi' => $nameSi,
                'nameTa' => $nameTa,
                'dsEn' => $dsEn,
                'dsSi' => $dsSi,
                'dsTa' => $dsTa,
                'disEn' => $disEn,
                'disSi' => $disSi,
                'disTa' => $disTa,
                'proEn' => $proEn,
                'proSi' => $proSi,
                'proTa' => $proTa,
                'display' => $displayEn,
                'displaySi' => $displaySi,
                'displayTa' => $displayTa
            ];
        });

        return response()->json(['success' => true, 'data' => $formatted]);
    }
}
