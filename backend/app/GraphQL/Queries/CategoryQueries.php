<?php

namespace App\GraphQL\Queries;

use App\Models\Category;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class CategoryQueries
{
    public function categories($rootValue, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        // Get all root categories (parent_id is null) ordered by sort_order
        return Category::whereNull('parent_id')->orderBy('sort_order')->get();
    }

    public function categoryBySlug($rootValue, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        return Category::where('slug', $args['slug'])->first();
    }

    /**
     * Returns a flat list of all descendants under a root slug,
     * with their full breadcrumb path string included.
     */
    public function categoriesByRootSlug($rootValue, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        $rootSlug = $args['rootSlug'];
        $root = Category::where('slug', $rootSlug)->first();
        if (!$root) return [];

        // Load ALL categories from DB at once (avoid N+1 queries) and group them by parent
        $allCategories = Category::all();
        $childrenByParent = $allCategories->groupBy('parent_id');

        $allDescendants = [];
        $this->collectDescendants($root, [], $allDescendants, $childrenByParent);
        return $allDescendants;
    }

    private function collectDescendants(Category $category, array $ancestorNames, array &$result, $childrenByParent): void
    {
        $path = array_merge($ancestorNames, [$category->name_en]);
        $result[] = [
            'id'         => (string) $category->id,
            'slug'       => $category->slug,
            'nameEn'     => $category->name_en ?? '',
            'nameSi'     => $category->name_si ?? $category->name_en ?? '',
            'nameTa'     => $category->name_ta ?? $category->name_en ?? '',
            'parentId'   => $category->parent_id ? (string) $category->parent_id : null,
            'breadcrumb' => implode(' > ', $path),
            'depth'      => count($ancestorNames),
        ];
        // Get children directly from the grouped collection
        $children = $childrenByParent->get($category->id, collect())->sortBy('sort_order');
        foreach ($children as $child) {
            $this->collectDescendants($child, $path, $result, $childrenByParent);
        }
    }

    public function progress($category, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        try {
            $user = request()->get('current_user');
            if (!$user) {
                return null;
            }

            $roles = $user['realm_roles'] ?? [];
            if (in_array('super_admin', $roles) || in_array('admin', $roles) || in_array('moderator', $roles)) {
                return null; 
            }

            // Statically cache all categories and their hierarchy for this entire request 
            // to completely eliminate N+1 database query timeouts.
            static $childrenByParent = null;
            if ($childrenByParent === null) {
                $childrenByParent = Category::all()->groupBy('parent_id');
            }

            // Handle both array representation and eloquent model
            $categoryId = is_array($category) ? $category['id'] : $category->id;
            $categoryIds = $this->getAllCategoryIdsFast($categoryId, $childrenByParent);

            $totalQuestions = \App\Models\Question::whereIn('category_id', $categoryIds)
                ->where('is_active', true)
                ->count();

            if ($totalQuestions === 0) {
                return 100.0;
            }

            $answeredQuestions = \App\Models\UserAnswer::where('user_id', $user->id)
                ->whereHas('question', function ($q) use ($categoryIds) {
                    $q->whereIn('category_id', $categoryIds)
                      ->where('is_active', true);
                })
                ->distinct('question_id')
                ->count('question_id');

            return ($answeredQuestions / $totalQuestions) * 100;
        } catch (\Throwable $e) {
            error_log('[CategoryQueries@progress] Error: ' . $e->getMessage());
            return null;
        }
    }

    private function getAllCategoryIdsFast($categoryId, $childrenByParent)
    {
        $ids = [$categoryId];
        $children = $childrenByParent->get($categoryId, collect());
        foreach ($children as $child) {
            $ids = array_merge($ids, $this->getAllCategoryIdsFast($child->id, $childrenByParent));
        }
        return $ids;
    }
}
