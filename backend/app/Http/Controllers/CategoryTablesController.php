<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CategoryTablesController extends Controller
{
    /**
     * Get a list of all subcategories (including deep descendants) 
     * that have a bulk data table for a given top-level category slug.
     */
    public function getTablesForCategory($slug)
    {
        // 1. Find the top level category
        $topCat = DB::table('categories')->where('slug', $slug)->first();
        if (!$topCat) {
            return response()->json(['success' => true, 'tables' => []]);
        }

        // 2. Get ALL descendants recursively
        $descendants = [];
        $this->getDescendants($topCat->id, $descendants);
        
        // Also check if the top level category itself has a table (rare, but possible)
        array_unshift($descendants, clone $topCat); 

        // 3. For each descendant, check if table exists
        $tables = [];
        foreach ($descendants as $cat) {
            $tableName = 'category_data_' . str_replace('-', '_', $cat->slug);
            if (Schema::hasTable($tableName)) {
                $tables[] = [
                    'slug' => $cat->slug,
                    'nameEn' => $cat->name_en,
                    'nameSi' => $cat->name_si,
                    'nameTa' => $cat->name_ta,
                ];
            }
        }

        return response()->json(['success' => true, 'tables' => $tables]);
    }

    private function getDescendants($parentId, &$descendants) {
        $children = DB::table('categories')
                      ->where('parent_id', $parentId)
                      ->orderBy('sort_order', 'asc')
                      ->get();
                      
        foreach ($children as $child) {
            $descendants[] = $child;
            $this->getDescendants($child->id, $descendants);
        }
    }
}
