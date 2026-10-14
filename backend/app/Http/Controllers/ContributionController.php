<?php

namespace App\Http\Controllers;

use App\Support\CategoryDataSchema;
use App\Support\GnRecordScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Contributor-facing views of the data people add: what *I* have contributed,
 * and how complete *my village* is. Both are read-only aggregates.
 */
class ContributionController extends Controller
{
    private const VILLAGE_CACHE_SECONDS = 300;
    private const MINE_LIMIT = 200;

    public static function villageCacheKey(string $ccode): string
    {
        return 'village_progress_' . strtoupper(trim($ccode));
    }

    /** Called after a contribution lands so the progress a contributor sees next includes it. */
    public static function forgetVillageCache(?string $ccode): void
    {
        if ($ccode) {
            Cache::forget(self::villageCacheKey($ccode));
        }
    }

    public static function forgetMineCache(string $sub): void
    {
        Cache::forget("contributions_mine_{$sub}");
    }

    /**
     * GET /api/contributions/mine — everything the signed-in caller has
     * contributed, newest first, with a status summary.
     */
    public function mine(Request $request): JsonResponse
    {
        $sub = $request->attributes->get('keycloak_sub');
        if (!is_string($sub) || $sub === '') {
            return response()->json(['success' => false, 'message' => 'Sign in to see your contributions.'], 401);
        }

        $categories = $this->categoryIndex();
        $cacheKey = "contributions_mine_{$sub}";
        $items = Cache::remember($cacheKey, 60, function () use ($sub, $categories) {
            $items = collect();

            foreach (CategoryDataSchema::allTables() as $table) {
                if (!GnRecordScope::hasColumn($table, 'contributor_sub')) {
                    continue;
                }

                $slug = CategoryDataSchema::slugFor($table);
                $category = $categories->get($slug);
                $hasStatus = GnRecordScope::hasColumn($table, 'status');

                $columns = ['*'];

                DB::table($table)
                    ->where('contributor_sub', $sub)
                    ->orderByDesc('id')
                    ->limit(self::MINE_LIMIT)
                    ->get($columns)
                    ->each(function ($row) use ($items, $slug, $category, $hasStatus) {
                        $items->push([
                            'id' => "place:{$slug}:{$row->id}",
                            'kind' => 'place',
                            'title' => $row->name_en ?: ($row->name_si ?: ($row->name_ta ?: null)),
                            'category' => $category ? $this->categoryPayload($category) : ['slug' => $slug, 'name_en' => $slug, 'root_slug' => null, 'root_name_en' => null],
                            'village' => $row->final_gn ?? $row->raw_gn ?? null,
                            'reg_number' => $row->reg_number,
                            'status' => $this->placeStatus($row, $hasStatus),
                            'is_update' => (bool) ($row->is_update_proposal ?? false),
                            'created_at' => $row->created_at,
                            'full_data' => $row,
                        ]);
                    });
            }

            DB::table('industry_surveys')
                ->where('user_id', $sub)
                ->orderByDesc('updated_at')
                ->limit(self::MINE_LIMIT)
                ->get(['*'])
                ->each(function ($row) use ($items) {
                    $items->push([
                        'id' => "survey:{$row->id}",
                        'kind' => 'business_survey',
                        'title' => null,
                        'category' => null,
                        'village' => $row->gn_name,
                        'ccode' => $row->ccode,
                        'reg_number' => $row->reg_number,
                        'status' => in_array($row->status, ['draft', 'submitted', 'approved'], true) ? $row->status : 'draft',
                        'is_update' => false,
                        'created_at' => $row->updated_at ?? $row->created_at,
                        'full_data' => $row,
                    ]);
                });

            return $items->sortByDesc(fn ($i) => (string) $i['created_at'])->values()->take(self::MINE_LIMIT);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total' => $items->count(),
                    'approved' => $items->where('status', 'approved')->count(),
                    'in_review' => $items->whereIn('status', ['pending', 'submitted'])->count(),
                    'drafts' => $items->where('status', 'draft')->count(),
                    'villages' => $items->pluck('village')->filter()->unique()->count(),
                ],
                'items' => $items,
            ],
        ]);
    }

    /**
     * GET /api/contributions/village/{ccode} — how much of this village has
     * been mapped, broken down by top-level category. Public: counts only.
     */
    public function village(string $ccode): JsonResponse
    {
        if (!preg_match('/^[A-Za-z0-9_-]{1,32}$/', $ccode)) {
            return response()->json(['success' => false, 'message' => 'Invalid village code.'], 422);
        }

        $gn = GnRecordScope::resolveGn($ccode);
        if (!$gn) {
            return response()->json(['success' => false, 'message' => 'Village not found.'], 404);
        }

        $payload = Cache::remember(self::villageCacheKey($ccode), self::VILLAGE_CACHE_SECONDS, fn () => $this->buildVillageProgress($gn, strtoupper($ccode)));

        return response()->json(['success' => true, 'data' => $payload]);
    }

    private function buildVillageProgress(object $gn, string $ccode): array
    {
        $all = DB::table('categories')->get(['id', 'parent_id', 'slug', 'name_en', 'name_si', 'name_ta', 'sort_order']);
        $byId = $all->keyBy('id');
        $childCount = $all->whereNotNull('parent_id')->countBy('parent_id');

        $rootOf = function ($category) use ($byId) {
            $seen = [];
            while ($category && $category->parent_id && isset($byId[$category->parent_id]) && !isset($seen[$category->id])) {
                $seen[$category->id] = true;
                $category = $byId[$category->parent_id];
            }
            return $category;
        };

        $roots = $all->whereNull('parent_id')->sortBy('sort_order')->values();
        $perRoot = $roots->mapWithKeys(fn ($r) => [$r->id => [
            'slug' => $r->slug,
            'name_en' => $r->name_en,
            'name_si' => $r->name_si,
            'name_ta' => $r->name_ta,
            'records' => 0,
            'in_review' => 0,
            'topics_total' => 0,
            'topics_covered' => 0,
        ]])->all();

        // A "topic" is a leaf category: the unit someone can actually add data to.
        foreach ($all as $category) {
            if (($childCount[$category->id] ?? 0) > 0) {
                continue;
            }
            $root = $rootOf($category);
            if ($root && isset($perRoot[$root->id]) && $root->id !== $category->id) {
                $perRoot[$root->id]['topics_total']++;
            }
        }

        $bySlug = $all->keyBy('slug');
        $contributors = [];

        foreach (CategoryDataSchema::allTables() as $table) {
            $category = $bySlug->get(CategoryDataSchema::slugFor($table));
            $root = $category ? $rootOf($category) : null;
            if (!$root || !isset($perRoot[$root->id])) {
                continue;
            }

            $scoped = fn () => tap(DB::table($table), fn ($q) => GnRecordScope::apply($q, $table, $ccode, $gn));
            $hasApproval = GnRecordScope::hasColumn($table, 'is_approved');

            $approved = $hasApproval ? $scoped()->where('is_approved', true)->count() : $scoped()->count();
            $inReview = $hasApproval ? $scoped()->where('is_approved', false)->count() : 0;

            $perRoot[$root->id]['records'] += $approved;
            $perRoot[$root->id]['in_review'] += $inReview;
            if ($approved > 0 && ($childCount[$category->id] ?? 0) === 0) {
                $perRoot[$root->id]['topics_covered']++;
            }

            if (GnRecordScope::hasColumn($table, 'contributor_sub')) {
                foreach ($scoped()->whereNotNull('contributor_sub')->distinct()->pluck('contributor_sub') as $sub) {
                    $contributors[$sub] = true;
                }
            }
        }

        $surveys = DB::table('industry_surveys')->where('ccode', $ccode);
        $businessesSurveyed = (clone $surveys)->whereIn('status', ['submitted', 'approved'])->count();
        foreach ((clone $surveys)->whereNotNull('user_id')->distinct()->pluck('user_id') as $sub) {
            $contributors[$sub] = true;
        }

        // Rapid-fire answers: topics residents have confirmed present or absent.
        // Hasty and not-sure answers are excluded — they are not information.
        $checked = DB::table('village_topic_answers')
            ->where('ccode', $ccode)
            ->where('is_hasty', false)
            ->whereIn('answer', ['yes', 'no']);
        $topicsChecked = (clone $checked)->distinct()->count('category_id');
        foreach ((clone $checked)->distinct()->pluck('contributor_sub') as $sub) {
            $contributors[$sub] = true;
        }

        $categories = collect($perRoot)->values();
        $topicsTotal = $categories->sum('topics_total');
        $topicsCovered = $categories->sum('topics_covered');

        return [
            'village' => [
                'ccode' => $gn->CCODE ?? $ccode,
                'name_en' => $gn->name_en ?? null,
                'name_si' => $gn->name_si ?? null,
                'name_ta' => $gn->name_ta ?? null,
                'ds_en' => $gn->ds_en ?? null,
                'district_en' => $gn->dis_en ?? null,
            ],
            'summary' => [
                'records' => $categories->sum('records'),
                'in_review' => $categories->sum('in_review'),
                'contributors' => count($contributors),
                'businesses_surveyed' => $businessesSurveyed,
                'categories_total' => $categories->count(),
                'categories_covered' => $categories->where('records', '>', 0)->count(),
                'topics_total' => $topicsTotal,
                'topics_covered' => $topicsCovered,
                'topics_checked' => $topicsChecked,
                'completion' => $topicsTotal > 0 ? round($topicsCovered / $topicsTotal * 100, 1) : 0.0,
            ],
            'categories' => $categories,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function placeStatus(object $row, bool $hasStatus): string
    {
        if ($row->is_approved ?? false) {
            return 'approved';
        }
        if ($hasStatus && $row->status === 'rejected') {
            return 'rejected';
        }
        return 'pending';
    }

    /** slug => category with its root resolved, for labelling contributions. */
    private function categoryIndex(): Collection
    {
        $all = DB::table('categories')->get(['id', 'parent_id', 'slug', 'name_en', 'name_si']);
        $byId = $all->keyBy('id');

        return $all->mapWithKeys(function ($category) use ($byId) {
            $root = $category;
            $guard = 0;
            while ($root->parent_id && isset($byId[$root->parent_id]) && $guard++ < 20) {
                $root = $byId[$root->parent_id];
            }
            $category->root = $root;
            return [$category->slug => $category];
        });
    }

    private function categoryPayload(object $category): array
    {
        return [
            'slug' => $category->slug,
            'name_en' => $category->name_en,
            'name_si' => $category->name_si,
            'root_slug' => $category->root->slug ?? null,
            'root_name_en' => $category->root->name_en ?? null,
        ];
    }
}
