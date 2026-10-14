<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The single definition of "records that belong to this Grama Niladhari
 * division". Category rows are linked to a GN in several historical ways, so
 * the public data list and the contribution/progress figures must use the same
 * rule — otherwise a village could show records its progress bar says it lacks.
 */
class GnRecordScope
{
    /** Resolves a GN by CCODE, or by numeric id for older links. */
    public static function resolveGn(string $gnCode): ?object
    {
        $gnCode = strtoupper(trim($gnCode));
        if ($gnCode === '') {
            return null;
        }

        $query = DB::table('grama_niladharis')->where('CCODE', $gnCode);
        if (ctype_digit($gnCode)) {
            $query->orWhere('id', $gnCode);
        }

        return $query->first();
    }

    public static function apply(Builder $query, string $table, string $gnCode, ?object $gn): void
    {
        $gnCode = strtoupper(trim($gnCode));
        $gnNames = $gn ? array_values(array_filter([$gn->name_en ?? null, $gn->name_si ?? null, $gn->name_ta ?? null])) : [];
        $has = fn (string $column) => self::hasColumn($table, $column);

        $query->where(function ($q) use ($table, $gnCode, $gn, $gnNames, $has) {
            $matchedAny = false;

            // 1. Mapped to this GN, by internal id or by code.
            if ($has('gn_id')) {
                $q->orWhere($table . '.gn_id', $gn ? (string) $gn->id : $gnCode)
                  ->orWhere($table . '.gn_id', $gnCode);
                $matchedAny = true;
            }

            // 2. Unmapped, but carries a registration number issued for this GN.
            if ($has('reg_number')) {
                $q->orWhere($table . '.reg_number', 'ilike', $gnCode . '/%');
                $matchedAny = true;
            }

            // 3. Unmapped, but its raw location text names exactly this GN.
            if ($gn && $gnNames && $has('raw_gn')) {
                $q->orWhere(function ($sub) use ($table, $gnNames, $gn, $has) {
                    $sub->whereIn($table . '.raw_gn', $gnNames);
                    if (!empty($gn->ds_en) && $has('raw_ds')) {
                        $sub->where($table . '.raw_ds', $gn->ds_en);
                    }
                    if (!empty($gn->dis_en) && $has('raw_district')) {
                        $sub->where($table . '.raw_district', $gn->dis_en);
                    }
                });
                $matchedAny = true;
            }

            // A table with no location columns cannot belong to any village.
            if (!$matchedAny) {
                $q->whereRaw('1 = 0');
            }
        });
    }

    /** @var array<string, array<string, true>> */
    private static array $columns = [];

    public static function hasColumn(string $table, string $column): bool
    {
        if (!isset(self::$columns[$table])) {
            self::$columns[$table] = array_fill_keys(\Illuminate\Support\Facades\Schema::getColumnListing($table), true);
        }

        return isset(self::$columns[$table][$column]);
    }
}
