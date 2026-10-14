<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;

class CategoryDataUploadController extends Controller
{
    private function invalidateCategoryCache($slug)
    {
        Cache::put('category_data_version_' . $slug, microtime(true));
    }

    public function upload(Request $request)
    {
        // Manual validation so we always return JSON (not HTML) on failure.
        // Laravel's $request->validate() returns an HTML redirect for multipart
        // form requests when the client doesn't explicitly set Accept: application/json.
        if (!$request->has('slug') || !$request->input('slug')) {
            return response()->json(['success' => false, 'message' => 'Category slug is required.'], 422);
        }
        if (!$request->has('name_en') || !$request->input('name_en')) {
            return response()->json(['success' => false, 'message' => 'Category name (EN) is required.'], 422);
        }
        if (!$request->hasFile('file')) {
            return response()->json(['success' => false, 'message' => 'Please select a CSV file to upload.'], 422);
        }

        // Accept all common MIME types that browsers send for .csv files.
        // Windows browsers often send text/plain or application/vnd.ms-excel.
        $allowedMimes = ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream'];
        $file = $request->file('file');
        $fileMime = $file->getMimeType();
        $fileExt  = strtolower($file->getClientOriginalExtension());

        if (!in_array($fileMime, $allowedMimes) && !in_array($fileExt, ['csv', 'txt'])) {
            return response()->json(['success' => false, 'message' => 'Invalid file type. Please upload a .csv file. (Got: ' . $fileMime . ')'], 422);
        }

        $slug = $request->input('slug');
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!$slug) {
            return response()->json(['success' => false, 'message' => 'Invalid category slug.'], 400);
        }

        // Verify category exists
        $category = DB::table('categories')->where('slug', $slug)->first();
        if (!$category) {
            return response()->json(['success' => false, 'message' => 'Category not found.'], 404);
        }

        // Create table if it doesn't exist
        if (!Schema::hasTable($tableName)) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->id();
                $table->string('district_id')->nullable();
                $table->string('ds_division_code')->nullable();
                $table->string('gn_id')->nullable();
                $table->string('raw_province')->nullable();
                $table->string('raw_district')->nullable();
                $table->string('raw_ds')->nullable();
                $table->string('raw_gn')->nullable();
                $table->string('reg_number')->nullable();
                $table->string('name_si')->nullable();
                $table->string('name_en')->nullable();
                $table->string('name_ta')->nullable();
                $table->string('name_singlish')->nullable();
                $table->string('longitude')->nullable();
                $table->string('latitude')->nullable();
                $table->string('mobile')->nullable();
                $table->text('description')->nullable();
                $table->string('contact_person_name')->nullable();
                $table->text('address')->nullable();
                $table->string('image_path')->nullable();
                $table->unsignedBigInteger('added_by_user_id')->nullable();
                $table->boolean('is_approved')->default(true);
                $table->string('status')->default('pending');
                $table->boolean('coordinate_mismatch')->default(false);
                $table->boolean('is_update_proposal')->default(false);
                $table->timestamps();
            });
        }
        
        // Ensure existing tables have the raw and final columns
        if (!Schema::hasColumn($tableName, 'raw_province')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('raw_province')->nullable();
                $table->string('raw_district')->nullable();
                $table->string('raw_ds')->nullable();
                $table->string('raw_gn')->nullable();
                $table->string('final_province')->nullable();
                $table->string('final_district')->nullable();
                $table->string('final_ds')->nullable();
                $table->string('final_gn')->nullable();
            });
        }
        
        if (!Schema::hasColumn($tableName, 'final_province')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('final_province')->nullable();
                $table->string('final_district')->nullable();
                $table->string('final_ds')->nullable();
                $table->string('final_gn')->nullable();
            });
        }

        // Ensure existing tables have the image_path column
        if (!Schema::hasColumn($tableName, 'image_path')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('image_path')->nullable();
            });
        }

        // Pre-fetch all GNs to build a fast memory map
        $allGns = DB::table('grama_niladharis')->get([
            'id', 'name_en', 'CCODE', 'pro_en', 'dis_en', 'ds_en', 'district_code', 'divisional_secretariat_code'
        ]);
        
        $gnMap = [];
        foreach ($allGns as $gn) {
            // Build the 4-tier hierarchy key (we ignore National as it's always SL)
            $key = strtolower(trim($gn->name_en) . '|' . trim($gn->ds_en) . '|' . trim($gn->dis_en) . '|' . trim($gn->pro_en));
            $gnMap[$key] = $gn;
            
            // Also map by CCODE if it exists
            if ($gn->CCODE) {
                $gnMap[strtolower(trim($gn->CCODE))] = $gn;
            }
        }

        // Process CSV
        $file = $request->file('file');
        $path = $file->getRealPath();
        
        $data = array_map('str_getcsv', file($path));
        
        if (count($data) < 2) {
            return response()->json(['success' => false, 'message' => 'File is empty or contains only headers.'], 400);
        }
        
        // Remove headers
        array_shift($data);
        
        // Fetch existing records for duplicate checking globally for this table
        $existingRecords = DB::table($tableName)->select('gn_id', 'name_en', 'name_si', 'name_ta')->get();
        $existingHashes = [];
        foreach ($existingRecords as $record) {
            $hash = md5(($record->gn_id ?: 'null') . '|' . trim($record->name_en ?: '') . '|' . trim($record->name_si ?: '') . '|' . trim($record->name_ta ?: ''));
            $existingHashes[$hash] = true;
        }

        $insertData = [];
        $duplicates = [];
        $savedCount = 0;

        foreach ($data as $row) {
            // New 16-column CSV structure
            $row = array_pad($row, 16, null);
            
            $province = strtolower(trim($row[1] ?? ''));
            $district = strtolower(trim($row[2] ?? ''));
            $ds = strtolower(trim($row[3] ?? ''));
            $gn_val = strtolower(trim($row[4] ?? ''));
            
            $mapped_gn_id = null;
            $mapped_district_id = null;
            $mapped_ds_code = null;
            $matchedGn = null;
            
            if (isset($gnMap[$gn_val])) {
                $matchedGn = $gnMap[$gn_val];
                $mapped_gn_id = $matchedGn->id;
                $mapped_district_id = $matchedGn->district_code;
                $mapped_ds_code = $matchedGn->divisional_secretariat_code;
            } else {
                $searchKey = $gn_val . '|' . $ds . '|' . $district . '|' . $province;
                if (isset($gnMap[$searchKey])) {
                    $matchedGn = $gnMap[$searchKey];
                    $mapped_gn_id = $matchedGn->id;
                    $mapped_district_id = $matchedGn->district_code;
                    $mapped_ds_code = $matchedGn->divisional_secretariat_code;
                }
            }

            // The data columns start from index 5
            $reg_number = $row[5] ?: null;
            $name_si = $row[6] ?: null;
            $name_en = $row[7] ?: null;
            $name_ta = $row[8] ?: null;
            $name_singlish = $row[9] ?: null;
            $longitude = $row[10] ?: null;
            $latitude = $row[11] ?: null;
            $mobile = $row[12] ?: null;
            $description = $row[13] ?: null;
            $contact_person = $row[14] ?: null;
            $address = $row[15] ?: null;
            
            $hash = md5(($mapped_gn_id ?: 'null') . '|' . trim($name_en ?: '') . '|' . trim($name_si ?: '') . '|' . trim($name_ta ?: ''));
            
            if (isset($existingHashes[$hash])) {
                $duplicates[] = [
                    'name_en' => $name_en,
                    'name_si' => $name_si,
                    'name_ta' => $name_ta
                ];
                continue;
            }
            
            $insertData[] = [
                'district_id' => $mapped_district_id,
                'ds_division_code' => $mapped_ds_code,
                'gn_id' => $mapped_gn_id,
                'raw_province' => $province ?: null,
                'raw_district' => $district ?: null,
                'raw_ds' => $ds ?: null,
                'raw_gn' => $gn_val ?: null,
                'final_province' => $matchedGn ? $matchedGn->pro_en : ($province ?: null),
                'final_district' => $matchedGn ? $matchedGn->dis_en : ($district ?: null),
                'final_ds' => $matchedGn ? $matchedGn->ds_en : ($ds ?: null),
                'final_gn' => $matchedGn ? $matchedGn->name_en : ($gn_val ?: null),
                'reg_number' => $reg_number,
                'name_si' => $name_si,
                'name_en' => $name_en,
                'name_ta' => $name_ta,
                'name_singlish' => $name_singlish,
                'longitude' => $longitude,
                'latitude' => $latitude,
                'mobile' => $mobile,
                'description' => $description,
                'contact_person_name' => $contact_person,
                'address' => $address,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            $existingHashes[$hash] = true;
            $savedCount++;
            
            if (count($insertData) >= 500) {
                DB::table($tableName)->insert($insertData);
                $insertData = [];
            }
        }
        
        if (count($insertData) > 0) {
            DB::table($tableName)->insert($insertData);
        }

        if ($savedCount > 0) {
            $this->invalidateCategoryCache($slug);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data processing completed.',
            'saved_count' => $savedCount,
            'duplicate_count' => count($duplicates),
            'duplicates' => $duplicates
        ]);
    }

    public function getData(Request $request, $slug)
    {
        $version = Cache::get('category_data_version_' . $slug, '1');
        $cacheKey = 'category_data_' . $slug . '_v' . $version . '_' . md5(json_encode($request->all()));

        $data = Cache::remember($cacheKey, 3600, function() use ($request, $slug) {
            $tableName = 'category_data_' . str_replace('-', '_', $slug);
            $tableExists = Schema::hasTable($tableName);
            $data = collect();

        // Extract GN code early so submissions can be filtered even without a bulk table
        $gnCode = null;
        if ($request->has('gn_id') && $request->input('gn_id')) {
            $gnCode = strtoupper($request->input('gn_id'));
        }

        $limit = $request->has('limit') ? (int) $request->input('limit') : 50;
        $offset = $request->has('offset') ? (int) $request->input('offset') : 0;
        $totalCount = 0;

        if ($tableExists) {
        $query = DB::table($tableName);

        // Only show approved bulk records on the public GN page, admins see everything
        if (Schema::hasColumn($tableName, 'is_approved') && !$request->has('is_admin')) {
            $query->where($tableName . '.is_approved', true);
        }

        // Optional filtering by specific GN/DS/District (mapped)
        if ($request->has('district_id') && $request->input('district_id')) {
            $query->where($tableName . '.district_id', $request->input('district_id'));
        }
        if ($request->has('ds_division_code') && $request->input('ds_division_code')) {
            $query->where($tableName . '.ds_division_code', $request->input('ds_division_code'));
        }
        
        // Optional filtering by raw strings (unmapped or mapped)
        if ($request->has('raw_province') && $request->input('raw_province')) {
            $query->where($tableName . '.raw_province', $request->input('raw_province'));
        }
        if ($request->has('raw_district') && $request->input('raw_district')) {
            $query->where($tableName . '.raw_district', $request->input('raw_district'));
        }
        if ($request->has('raw_ds') && $request->input('raw_ds')) {
            $query->where($tableName . '.raw_ds', $request->input('raw_ds'));
        }
        if ($request->has('raw_gn') && $request->input('raw_gn')) {
            $query->where($tableName . '.raw_gn', $request->input('raw_gn'));
        }
        if ($request->has('gn_id') && $request->input('gn_id')) {
            $gnCode = strtoupper($request->input('gn_id'));
            \App\Support\GnRecordScope::apply($query, $tableName, $gnCode, \App\Support\GnRecordScope::resolveGn($gnCode));
        }

        // Special flag to only return NULL data (unmapped)
        if ($request->has('unmapped_only') && $request->input('unmapped_only') == 'true') {
            $query->whereNull($tableName . '.gn_id');
        } elseif ($request->has('mapped_only') && $request->input('mapped_only') == 'true') {
            $query->whereNotNull($tableName . '.gn_id');
        }

        // Ensure the table has the raw columns before querying to prevent SQL errors on older tables
        if (!Schema::hasColumn($tableName, 'raw_province')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('raw_province')->nullable();
                $table->string('raw_district')->nullable();
                $table->string('raw_ds')->nullable();
                $table->string('raw_gn')->nullable();
            });
        }
        
        if (!Schema::hasColumn($tableName, 'image_path')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('image_path')->nullable();
            });
        }

        if (!Schema::hasColumn($tableName, 'final_province')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('final_province')->nullable();
                $table->string('final_district')->nullable();
                $table->string('final_ds')->nullable();
                $table->string('final_gn')->nullable();
            });
        }

        // Search functionality
        if ($request->has('search') && $request->input('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function($q) use ($tableName, $search) {
                $q->where($tableName . '.name_en', 'ilike', '%' . $search . '%')
                  ->orWhere($tableName . '.name_si', 'ilike', '%' . $search . '%')
                  ->orWhere($tableName . '.name_ta', 'ilike', '%' . $search . '%')
                  ->orWhere($tableName . '.reg_number', 'ilike', '%' . $search . '%')
                  ->orWhere($tableName . '.mobile', 'ilike', '%' . $search . '%')
                  ->orWhere($tableName . '.description', 'ilike', '%' . $search . '%')
                  ->orWhere($tableName . '.contact_person_name', 'ilike', '%' . $search . '%');
            });
        }


        // Simply select the final columns (or fallback to raw) and return instantly
        $query->select($tableName . '.*',
            DB::raw("COALESCE($tableName.final_province, $tableName.raw_province) as province_name"),
            DB::raw("COALESCE($tableName.final_district, $tableName.raw_district) as district_name"),
            DB::raw("COALESCE($tableName.final_ds, $tableName.raw_ds) as ds_name"),
            DB::raw("COALESCE($tableName.final_gn, $tableName.raw_gn) as gn_name")
        );

        $totalCount += $query->count();

        $baseData = $query->orderBy($tableName . '.id', 'desc')->offset($offset)->limit($limit)->get();
        $data = collect($baseData);

        } // end if ($tableExists)

        // Merge normal user submissions — search category AND all descendants
        $category = \App\Models\Category::where('slug', $slug)->first();

        if ($category) {
            // Collect category IDs: the parent + all descendants
            $categoryIds = [$category->id];
            $this->collectDescendantIds($category->id, $categoryIds);

            $submissionsQuery = \App\Models\CategorySubmission::whereIn('category_id', $categoryIds);
            
            if (!$request->has('is_admin')) {
                $submissionsQuery->where('status', 'approved');
            }

            if ($gnCode !== null) {
                $submissionsQuery->where('gn_code', $gnCode);
            }

            if ($request->has('search') && $request->input('search')) {
                $search = strtolower(trim($request->input('search')));
                $submissionsQuery->where(function($q) use ($search) {
                    $q->where('generated_code', 'ilike', '%' . $search . '%')
                      ->orWhere('answers_data', 'ilike', '%' . $search . '%');
                });
            }

            $totalCount += $submissionsQuery->count();
            
            // For submissions, if we have a table, the offset might be tricky.
            // But since Admin is usually just looking at bulk data or submissions independently, we do a basic limit/offset
            $submissions = $submissionsQuery->orderBy('created_at', 'desc')->offset($offset)->limit($limit)->get();

            foreach ($submissions as $sub) {
                $answers = json_decode($sub->answers_data, true) ?: [];

                $mapped = new \stdClass();
                $mapped->id = 'sub_' . $sub->id;
                $mapped->reg_number = $sub->generated_code;
                $mapped->address = $answers['Address'] ?? null;
                $mapped->mobile = $answers['Mobile'] ?? null;
                $mapped->contact_person_name = $answers['Contact Person'] ?? null;
                $mapped->name_en = $answers['Name (EN)'] ?? $answers['Name'] ?? null;
                $mapped->name_si = $answers['Name (SI)'] ?? null;
                $mapped->name_ta = $answers['Name (TA)'] ?? null;
                $mapped->district_name = $sub->district;
                $mapped->ds_name = $sub->ds_division;
                $mapped->gn_name = $sub->gn_name;
                $mapped->latitude = $sub->latitude;
                $mapped->longitude = $sub->longitude;
                $mapped->image_path = $answers['Image'] ?? null;
                $mapped->created_at = $sub->created_at;

                // Flatten all other answer fields as q_ keys so cards display them
                foreach ($answers as $key => $value) {
                    if (!in_array($key, ['Address', 'Mobile', 'Contact Person', 'Name (EN)', 'Name (SI)', 'Name (TA)', 'Image', 'Name'])) {
                        $safeKey = 'q_ans_' . preg_replace('/[^a-z0-9]/i', '_', strtolower($key));
                        $mapped->$safeKey = $value;
                    }
                }

                $data->push($mapped);
            }

            $data = $data->sortByDesc('created_at')->values();
        }


            return [
                'data' => $data,
                'total' => $totalCount
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data['data'],
            'total' => $data['total']
        ]);
    }

    /**
     * Collect all descendant category IDs using a single recursive SQL CTE.
     * This avoids N+1 queries on large category trees (34k+ rows).
     */
    private function collectDescendantIds($parentId, &$ids)
    {
        $results = DB::select("
            WITH RECURSIVE cat_tree AS (
                SELECT id FROM categories WHERE parent_id = ?
                UNION ALL
                SELECT c.id FROM categories c INNER JOIN cat_tree t ON c.parent_id = t.id
            )
            SELECT id FROM cat_tree
        ", [$parentId]);

        foreach ($results as $row) {
            $ids[] = $row->id;
        }
    }

    public function getBulkDataCategories()
    {
        $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'category_data_%'");
        $slugs = [];
        foreach ($tables as $table) {
            $slugs[] = str_replace('_', '-', substr($table->table_name, 14));
        }
        
        $categories = \App\Models\Category::whereIn('slug', $slugs)->get(['slug', 'name_en', 'parent_id']);
        
        return response()->json([
            'success' => true,
            'categories' => $categories
        ]);
    }

    public function getAllCategories()
    {
        $categories = \App\Models\Category::whereNotNull('parent_id')->get(['slug', 'name_en', 'name_si', 'name_ta', 'parent_id']);
        
        $formattedCategories = $categories->map(function($cat) {
            return [
                'slug' => $cat->slug,
                'nameEn' => $cat->name_en,
                'nameSi' => $cat->name_si,
                'nameTa' => $cat->name_ta,
                'parent_id' => $cat->parent_id
            ];
        });

        return response()->json([
            'success' => true,
            'tables' => $formattedCategories
        ]);
    }

    public function updateData(Request $request, $slug, $id)
    {
        // Handle user submissions (id prefixed with 'sub_')
        if (str_starts_with((string)$id, 'sub_')) {
            $submissionId = substr((string)$id, 4);
            $submission = \App\Models\CategorySubmission::find($submissionId);
            if (!$submission) {
                return response()->json(['success' => false, 'message' => 'Submission not found.'], 404);
            }

            // Merge editable fields into the answers_data JSON
            $answers = json_decode($submission->answers_data, true) ?: [];
            $fields = $request->only(['name_en', 'name_si', 'name_ta', 'mobile', 'contact_person_name', 'address']);
            if (isset($fields['name_en']))            $answers['Name (EN)']       = $fields['name_en'];
            if (isset($fields['name_si']))            $answers['Name (SI)']       = $fields['name_si'];
            if (isset($fields['name_ta']))            $answers['Name (TA)']       = $fields['name_ta'];
            if (isset($fields['mobile']))             $answers['Mobile']          = $fields['mobile'];
            if (isset($fields['contact_person_name'])) $answers['Contact Person'] = $fields['contact_person_name'];
            if (isset($fields['address']))            $answers['Address']         = $fields['address'];

            $submission->answers_data = json_encode($answers);
            $submission->save();

            return response()->json(['success' => true, 'message' => 'Submission updated successfully.']);
        }

        // Handle bulk uploaded data
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found.'], 404);
        }

        $record = DB::table($tableName)->where('id', $id)->first();
        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Record not found.'], 404);
        }

        $updateData = $request->only([
            'reg_number', 'name_en', 'name_si', 'name_ta', 'name_singlish',
            'mobile', 'contact_person_name', 'address', 'description',
            'latitude', 'longitude'
        ]);

        $updateData['updated_at'] = now();

        DB::table($tableName)->where('id', $id)->update($updateData);

        $this->invalidateCategoryCache($slug);

        return response()->json([
            'success' => true,
            'message' => 'Record updated successfully.'
        ]);
    }

    public function deleteData($slug, $id)
    {
        // Handle user submissions (id prefixed with 'sub_')
        if (str_starts_with((string)$id, 'sub_')) {
            $submissionId = substr((string)$id, 4); // strip 'sub_' prefix
            $deleted = \App\Models\CategorySubmission::where('id', $submissionId)->delete();
            if ($deleted) {
                $this->invalidateCategoryCache($slug);
                return response()->json(['success' => true, 'message' => 'Submission deleted successfully.']);
            }
            return response()->json(['success' => false, 'message' => 'Submission not found.'], 404);
        }

        // Handle bulk uploaded data
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'No data table exists for this category yet.'], 404);
        }

        try {
            $deleted = DB::table($tableName)->where('id', $id)->delete();

            if ($deleted) {
                $this->invalidateCategoryCache($slug);
                return response()->json(['success' => true, 'message' => 'Record deleted successfully.']);
            }

            return response()->json(['success' => false, 'message' => 'Record not found.'], 404);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Delete failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function bulkDeleteData(Request $request, $slug)
    {
        \Illuminate\Support\Facades\Log::info('bulkDeleteData hit', ['slug' => $slug, 'ids' => $request->input('ids')]);

        $ids = $request->input('ids');
        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['success' => false, 'message' => 'No IDs provided.'], 400);
        }

        // Separate sub_ IDs (user submissions) from bulk data IDs
        $subIds = [];
        $bulkIds = [];
        foreach ($ids as $id) {
            if (str_starts_with((string)$id, 'sub_')) {
                $subIds[] = substr((string)$id, 4);
            } else {
                $bulkIds[] = $id;
            }
        }

        $totalDeleted = 0;

        // Delete user submissions
        if (!empty($subIds)) {
            $totalDeleted += \App\Models\CategorySubmission::whereIn('id', $subIds)->delete();
        }

        // Delete bulk data records
        if (!empty($bulkIds)) {
            $tableName = 'category_data_' . str_replace('-', '_', $slug);
            if (Schema::hasTable($tableName)) {
                try {
                    $totalDeleted += DB::table($tableName)->whereIn('id', $bulkIds)->delete();
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Bulk delete failed: ' . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Server error during deletion: ' . $e->getMessage()
                    ], 500);
                }
            }
        }

        \Illuminate\Support\Facades\Log::info('Deleted count: ' . $totalDeleted);
        
        if ($totalDeleted > 0) {
            $this->invalidateCategoryCache($slug);
        }

        return response()->json([
            'success' => true,
            'message' => $totalDeleted . ' records deleted successfully.'
        ]);
    }

    public function clearAllData(Request $request, $slug)
    {
        $tableName = 'category_data_' . str_replace('-', '_', $slug);
        
        $totalDeleted = 0;

        // Delete all submissions for this category
        $category = DB::table('categories')->where('slug', $slug)->first();
        if ($category) {
            $categoryIds = [$category->id];
            $this->collectDescendantIds($category->id, $categoryIds);
            $totalDeleted += \App\Models\CategorySubmission::whereIn('category_id', $categoryIds)->delete();
        }

        // Truncate the bulk data table if it exists
        if (Schema::hasTable($tableName)) {
            try {
                $count = DB::table($tableName)->count();
                if ($count > 0) {
                    DB::table($tableName)->truncate(); // Faster than delete() for the whole table
                    $totalDeleted += $count;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Clear all failed: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Server error during clear all: ' . $e->getMessage()
                ], 500);
            }
        }

        if ($totalDeleted > 0) {
            $this->invalidateCategoryCache($slug);
        }

        return response()->json([
            'success' => true,
            'message' => 'All data cleared successfully (' . $totalDeleted . ' records removed).'
        ]);
    }

    public function uploadImage(Request $request, $slug, $id)
    {
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found.'], 404);
        }

        $record = DB::table($tableName)->where('id', $id)->first();
        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Record not found.'], 404);
        }

        // 50MB validation = 51200 kilobytes
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:51200',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $id . '_' . str_replace(' ', '_', $file->getClientOriginalName());
            
            $destinationPath = public_path('uploads/category_images');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            
            // Delete old image if exists
            if (isset($record->image_path) && $record->image_path && file_exists($destinationPath . '/' . $record->image_path)) {
                unlink($destinationPath . '/' . $record->image_path);
            }

            DB::table($tableName)->where('id', $id)->update([
                'image_path' => $filename,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully.',
                'image_path' => $filename
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No image provided.'], 400);
    }

    public function uploadSurveyImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,gif|max:51200', // 50MB max
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . rand(1, 1000) . '_' . $file->getClientOriginalName();
            $destinationPath = public_path('uploads/survey_images');

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            
            $file->move($destinationPath, $filename);
            
            return response()->json([
                'success' => true,
                'image_path' => $filename,
                'url' => '/api/uploads/survey_images/' . $filename
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No file uploaded.'], 400);
    }

    public function searchCategoryData(Request $request, $slug)
    {
        $query = $request->query('query');
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $dbQuery = DB::table($tableName)->where('is_approved', true);

        $hasLocationFilter = false;
        if ($request->has('province') && $request->query('province')) {
            $val = trim(str_ireplace(' Province', '', $request->query('province')));
            $dbQuery->where(function($q) use ($val) {
                $q->where('raw_province', 'LIKE', '%' . $val . '%')
                  ->orWhereNull('raw_province')
                  ->orWhere('raw_province', '');
            });
            $hasLocationFilter = true;
        }
        if ($request->has('district') && $request->query('district')) {
            $val = trim(str_ireplace(' District', '', $request->query('district')));
            $dbQuery->where(function($q) use ($val) {
                $q->where('raw_district', 'LIKE', '%' . $val . '%')
                  ->orWhereNull('raw_district')
                  ->orWhere('raw_district', '');
            });
            $hasLocationFilter = true;
        }
        if ($request->has('ds') && $request->query('ds')) {
            $val = $request->query('ds');
            $dbQuery->where(function($q) use ($val) {
                $q->where('raw_ds', 'LIKE', '%' . $val . '%')
                  ->orWhereNull('raw_ds')
                  ->orWhere('raw_ds', '');
            });
            $hasLocationFilter = true;
        }
        if ($request->has('gn') && $request->query('gn')) {
            $val = $request->query('gn');
            $dbQuery->where(function($q) use ($val) {
                $q->where('raw_gn', 'LIKE', '%' . $val . '%')
                  ->orWhereNull('raw_gn')
                  ->orWhere('raw_gn', '');
            });
            $hasLocationFilter = true;
        }

        if (empty($query) && !$hasLocationFilter) {
            return response()->json(['success' => true, 'data' => []]);
        }

        if (!empty($query)) {
            $dbQuery->where(function($q) use ($query) {
                $q->where('name_en', 'LIKE', '%' . $query . '%')
                  ->orWhere('name_si', 'LIKE', '%' . $query . '%')
                  ->orWhere('name_ta', 'LIKE', '%' . $query . '%')
                  ->orWhere('reg_number', 'LIKE', '%' . $query . '%');
            });
        }

        try {
            $results = $dbQuery->limit(50)->get();
            return response()->json(['success' => true, 'data' => $results]);
        } catch (\Throwable $e) {
            error_log('[searchCategoryData] Query error slug=' . $slug . ': ' . $e->getMessage());
            return response()->json(['success' => false, 'data' => [], 'message' => $e->getMessage()], 500);
        }
    }

    public function searchAllData(Request $request)
    {
        $query = $request->query('q');
        if (!$query || strlen($query) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'category_data_%'");
        $allMatches = [];

        foreach ($tables as $table) {
            $tableName = $table->table_name;
            $slug = str_replace('_', '-', substr($tableName, 14));
            
            $dbQuery = DB::table($tableName)
                ->where('is_approved', true)
                ->where(function($q) use ($query) {
                    $q->where('name_en', 'ILIKE', '%' . $query . '%')
                      ->orWhere('name_si', 'ILIKE', '%' . $query . '%')
                      ->orWhere('name_ta', 'ILIKE', '%' . $query . '%')
                      ->orWhere('reg_number', 'ILIKE', '%' . $query . '%');
                })
                ->limit(20);
                
            $results = $dbQuery->get();
            
            foreach ($results as $result) {
                // Fetch GN context
                $gn = DB::table('grama_niladharis')->where('id', $result->gn_id)->first();
                if ($gn) {
                    $disEn = $gn->dis_en ?? '';
                    $dsEn = $gn->ds_en ?? '';
                    $nameEn = $gn->name_en ?? '';
                    $ccode = $gn->CCODE ?? '';
                    $gnDisplay = trim("{$disEn} - {$dsEn} - {$nameEn} ({$ccode})", ' -()');

                    $allMatches[] = [
                        'id' => $result->id,
                        'slug' => $slug,
                        'nameEn' => $result->name_en,
                        'nameSi' => $result->name_si,
                        'nameTa' => $result->name_ta,
                        'regNumber' => $result->reg_number,
                        'gn_id' => $result->gn_id,
                        'ccode' => $ccode,
                        'gn_display' => $gnDisplay,
                        'gn_district' => $disEn,
                        'gn_ds' => $dsEn,
                    ];
                }
                
                // Hard limit to avoid huge payload
                if (count($allMatches) >= 20) {
                    break 2; // Break both loops
                }
            }
        }

        return response()->json(['success' => true, 'data' => $allMatches]);
    }

    public function submitSurveyData(Request $request, $slug)
    {
        // This endpoint is public and creates a table on first use, so it must
        // only ever do that for a category that actually exists — otherwise any
        // caller could create arbitrary tables just by varying the URL.
        if (!preg_match('/^[a-z0-9-]{1,120}$/', (string) $slug) || !DB::table('categories')->where('slug', $slug)->exists()) {
            return response()->json(['success' => false, 'message' => 'Unknown category.'], 404);
        }

        $request->validate([
            'reg_number' => ['nullable', 'string', 'max:64'],
            'gn_code' => ['nullable', 'string', 'max:32'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'name_si' => ['nullable', 'string', 'max:255'],
            'name_ta' => ['nullable', 'string', 'max:255'],
            'name_singlish' => ['nullable', 'string', 'max:255'],
            'raw_province' => ['nullable', 'string', 'max:120'],
            'raw_district' => ['nullable', 'string', 'max:120'],
            'raw_ds' => ['nullable', 'string', 'max:120'],
            'raw_gn' => ['nullable', 'string', 'max:120'],
            'mobile' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:1000'],
            'contact_person_name' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'coordinate_mismatch' => ['nullable', 'boolean'],
        ]);

        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->id();
                $table->string('district_id')->nullable();
                $table->string('ds_division_code')->nullable();
                $table->string('gn_id')->nullable();
                $table->string('raw_province')->nullable();
                $table->string('raw_district')->nullable();
                $table->string('raw_ds')->nullable();
                $table->string('raw_gn')->nullable();
                $table->string('final_province')->nullable();
                $table->string('final_district')->nullable();
                $table->string('final_ds')->nullable();
                $table->string('final_gn')->nullable();
                $table->string('reg_number')->nullable();
                $table->string('name_si')->nullable();
                $table->string('name_en')->nullable();
                $table->string('name_ta')->nullable();
                $table->string('name_singlish')->nullable();
                $table->string('longitude')->nullable();
                $table->string('latitude')->nullable();
                $table->string('mobile')->nullable();
                $table->text('description')->nullable();
                $table->string('contact_person_name')->nullable();
                $table->text('address')->nullable();
                $table->string('image_path')->nullable();
                $table->unsignedBigInteger('added_by_user_id')->nullable();
                $table->boolean('is_approved')->default(true);
                $table->string('status')->default('pending');
                $table->boolean('coordinate_mismatch')->default(false);
                $table->boolean('is_update_proposal')->default(false);
                $table->timestamps();
            });
        }

        \App\Support\CategoryDataSchema::ensureContributorColumn($tableName);

        $payload = $request->all();
        $isUpdate = !empty($payload['reg_number']);
        
        $regNumber = $payload['reg_number'] ?? null;
        
        $mappedGnId = null;
        $mappedDsCode = null;
        $mappedDistrictId = null;
        $finalProvince = null;
        $finalDistrict = null;
        $finalDs = null;
        $finalGn = null;

        // Generate new Reg Number if not provided
        if (!$regNumber) {
            $gnCode = $payload['gn_code'] ?? null;
            $gn = null;
            if (!$gnCode && !empty($payload['raw_gn'])) {
                $gn = $this->resolveGramaNiladhari(
                    $payload['raw_gn'],
                    $payload['raw_ds'] ?? null,
                    $payload['raw_district'] ?? null
                );
                $gnCode = $gn ? ($gn->CCODE ?: $gn->code) : null;
            } elseif ($gnCode) {
                // If gn_code was passed directly, try to resolve it to get mapping info
                $gn = DB::table('grama_niladharis')
                        ->where('CCODE', $gnCode)
                        ->orWhere('code', $gnCode)
                        ->first();
            }

            if ($gn) {
                $mappedGnId = $gn->id;
                $mappedDsCode = $gn->divisional_secretariat_code;
                $mappedDistrictId = $gn->district_code;
                $finalProvince = $gn->pro_en;
                $finalDistrict = $gn->dis_en;
                $finalDs = $gn->ds_en;
                $finalGn = $gn->name_en;
            }

            // If GN code could not be resolved, do NOT generate — leave reg_number null
            if ($gnCode) {
                $category = DB::table('categories')->where('slug', $slug)->first();
                $cCode = $category ? $category->code : 'CAT';

                // Find the next unique sequence number for this GN
                $base = $gnCode . '-' . $cCode . '-';
                $count = DB::table($tableName)->where('reg_number', 'like', $base . '%')->count() + 1;
                $regNumber = $base . str_pad($count, 3, '0', STR_PAD_LEFT);

                // Guarantee uniqueness — keep incrementing until we find an unused code
                while (DB::table($tableName)->where('reg_number', $regNumber)->exists()) {
                    $count++;
                    $regNumber = $base . str_pad($count, 3, '0', STR_PAD_LEFT);
                }
            }
            // else: gnCode is null → regNumber stays null, no code generated
        }

        $insertData = [
            'gn_id' => $mappedGnId,
            'district_id' => $mappedDistrictId,
            'ds_division_code' => $mappedDsCode,
            'final_province' => $finalProvince,
            'final_district' => $finalDistrict,
            'final_ds' => $finalDs,
            'final_gn' => $finalGn,
            'reg_number' => $regNumber,
            'name_en' => $payload['name_en'] ?? null,
            'name_si' => $payload['name_si'] ?? null,
            'name_ta' => $payload['name_ta'] ?? null,
            'name_singlish' => $payload['name_singlish'] ?? null,
            'raw_province' => $payload['raw_province'] ?? null,
            'raw_district' => $payload['raw_district'] ?? null,
            'raw_ds' => $payload['raw_ds'] ?? null,
            'raw_gn' => $payload['raw_gn'] ?? null,
            'mobile' => $payload['mobile'] ?? null,
            'address' => $payload['address'] ?? null,
            'contact_person_name' => $payload['contact_person_name'] ?? null,
            'longitude' => $payload['longitude'] ?? null,
            'latitude' => $payload['latitude'] ?? null,
            'image_path' => $payload['image_path'] ?? null,
            // Set by OptionalKeycloakAuth from a verified token only; null for
            // anonymous contributions. (`auth()->id()` is always null in this app.)
            'contributor_sub' => $request->attributes->get('keycloak_sub'),
            'is_approved' => false,
            'status' => 'pending',
            'is_update_proposal' => $isUpdate,
            'coordinate_mismatch' => $payload['coordinate_mismatch'] ?? false,
            'created_at' => now(),
            'updated_at' => now()
        ];

        DB::table($tableName)->insert($insertData);

        $this->invalidateCategoryCache($slug);
        \App\Http\Controllers\ContributionController::forgetVillageCache($payload['gn_code'] ?? null);
        if ($insertData['contributor_sub']) {
            \App\Http\Controllers\ContributionController::forgetMineCache($insertData['contributor_sub']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data submitted successfully.',
            'reg_number' => $regNumber,
            'status' => 'pending',
            'is_update_proposal' => $isUpdate,
            'credited' => $insertData['contributor_sub'] !== null,
        ]);
    }

    public function approveData(Request $request, $slug, $id)
    {
        $tableName = 'category_data_' . str_replace('-', '_', $slug);
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found.'], 404);
        }

        DB::table($tableName)->where('id', $id)->update([
            'is_approved' => true,
            'status' => 'approved'
        ]);

        $this->invalidateCategoryCache($slug);

        return response()->json(['success' => true]);
    }

    public function replaceData(Request $request, $slug, $id)
    {
        $tableName = 'category_data_' . str_replace('-', '_', $slug);
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found.'], 404);
        }

        $newRecord = DB::table($tableName)->where('id', $id)->first();
        if (!$newRecord) {
            return response()->json(['success' => false, 'message' => 'Proposal not found.'], 404);
        }

        // Delete the old record that has the same reg_number and is approved
        DB::table($tableName)
            ->where('reg_number', $newRecord->reg_number)
            ->where('id', '!=', $id)
            ->where('status', 'approved')
            ->delete();

        // Mark the proposal as approved
        DB::table($tableName)->where('id', $id)->update([
            'is_approved' => true,
            'status' => 'approved',
            'is_update_proposal' => false
        ]);

        $this->invalidateCategoryCache($slug);

        return response()->json(['success' => true]);
    }

    public function getUserSubmissions(Request $request)
    {
        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'category_data_%'");
        $allSubmissions = [];

        foreach ($tables as $table) {
            $tableName = $table->tablename;
            
            // Reconstruct slug from table name
            $slug = str_replace('_', '-', substr($tableName, 14));
            $category = DB::table('categories')->where('slug', $slug)->first();
            $categoryName = $category ? $category->name_en : $slug;

            $submissions = DB::table($tableName)
                ->where('is_approved', false)
                ->orWhere('is_update_proposal', true)
                ->get()
                ->map(function($item) use ($slug, $categoryName) {
                    $item->category_slug = $slug;
                    $item->category_name = $categoryName;
                    return $item;
                });

            foreach ($submissions as $sub) {
                $allSubmissions[] = $sub;
            }
        }

        // Sort by created_at desc
        usort($allSubmissions, function($a, $b) {
            return strtotime($b->created_at) - strtotime($a->created_at);
        });

        return response()->json(['success' => true, 'data' => $allSubmissions]);
    }

    /**
     * Generate a reg number for a bulk-uploaded row using the same format as user submissions.
     * Format: {CCODE}/{category.code}/{zero-padded sequence}
     * If gn_name doesn't match any GN in grama_niladharis, return error and leave reg_number empty.
     */
    public function generateRegNumber(Request $request, $slug, $id)
    {
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found.'], 404);
        }

        // Ensure final_* columns exist (older tables may not have them)
        if (!Schema::hasColumn($tableName, 'final_province')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('final_province')->nullable();
                $table->string('final_district')->nullable();
                $table->string('final_ds')->nullable();
                $table->string('final_gn')->nullable();
            });
        }

        // Fetch the row with COALESCE aliases (same logic as getData)
        $row = DB::table($tableName)
            ->where('id', $id)
            ->select(
                $tableName . '.*',
                DB::raw("COALESCE({$tableName}.final_province, {$tableName}.raw_province) as province_name"),
                DB::raw("COALESCE({$tableName}.final_district, {$tableName}.raw_district) as district_name"),
                DB::raw("COALESCE({$tableName}.final_ds, {$tableName}.raw_ds) as ds_name"),
                DB::raw("COALESCE({$tableName}.final_gn, {$tableName}.raw_gn) as gn_name")
            )
            ->first();

        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Record not found.'], 404);
        }

        // Verify all required fields are present (using resolved aliases)
        $requiredFields = [
            'name_ta'       => $row->name_ta,
            'Province'      => $row->province_name,
            'District'      => $row->district_name,
            'DS Division'   => $row->ds_name,
            'GN Name'       => $row->gn_name,
        ];
        foreach ($requiredFields as $label => $value) {
            if (empty($value)) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot generate reg number: '{$label}' is empty."
                ], 422);
            }
        }

        // Look up GN code from grama_niladharis using resolved gn_name, falling back with DS division and District
        $gnName = trim($row->gn_name);
        $gn = $this->resolveGramaNiladhari($gnName, $row->ds_name, $row->district_name, $row->gn_id ?? null);

        if (!$gn) {
            return response()->json([
                'success' => false,
                'message' => "GN Division '{$gnName}' was not found in the system. Reg number cannot be generated."
            ], 422);
        }

        $gnCode = $gn->CCODE ?: $gn->code;

        if (!$gnCode) {
            return response()->json([
                'success' => false,
                'message' => "GN Division '{$gnName}' does not have a valid code. Reg number cannot be generated."
            ], 422);
        }

        // Get category code
        $category = DB::table('categories')->where('slug', $slug)->first();
        $cCode = $category ? ($category->code ?? 'CAT') : 'CAT';

        // Get next sequence for this GN (exclude current row to avoid double-counting)
        $existingCount = DB::table($tableName)
            ->where('reg_number', 'like', $gnCode . '/%')
            ->where('id', '!=', $id)
            ->count();
        $sequence = $existingCount + 1;
        $regNumber = $gnCode . '/' . $cCode . '/' . str_pad($sequence, 2, '0', STR_PAD_LEFT);

        // Save to DB
        DB::table($tableName)->where('id', $id)->update([
            'reg_number' => $regNumber,
            'updated_at' => now(),
        ]);

        $this->invalidateCategoryCache($slug);

        return response()->json([
            'success'    => true,
            'reg_number' => $regNumber,
            'message'    => "Reg number generated: {$regNumber}"
        ]);
    }

    /**
     * Generate reg numbers for ALL rows in a category that don't have one yet.
     */
    public function generateAllRegNumbers(Request $request, $slug)
    {
        set_time_limit(300); // Allow up to 5 minutes for bulk generation
        
        $tableName = 'category_data_' . str_replace('-', '_', $slug);

        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found.'], 404);
        }

        // Ensure final_* columns exist (older tables may not have them)
        if (!Schema::hasColumn($tableName, 'final_province')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('final_province')->nullable();
                $table->string('final_district')->nullable();
                $table->string('final_ds')->nullable();
                $table->string('final_gn')->nullable();
            });
        }

        $excludeIds = $request->input('exclude_ids', []);

        $rowsQuery = DB::table($tableName)
            ->whereNull('reg_number');
            
        if (!empty($excludeIds)) {
            $rowsQuery->whereNotIn('id', $excludeIds);
        }

        $rows = $rowsQuery->select(
                $tableName . '.*',
                DB::raw("COALESCE({$tableName}.final_province, {$tableName}.raw_province) as province_name"),
                DB::raw("COALESCE({$tableName}.final_district, {$tableName}.raw_district) as district_name"),
                DB::raw("COALESCE({$tableName}.final_ds, {$tableName}.raw_ds) as ds_name"),
                DB::raw("COALESCE({$tableName}.final_gn, {$tableName}.raw_gn) as gn_name")
            )
            ->limit(1000)
            ->get();

        $category = DB::table('categories')->where('slug', $slug)->first();
        $cCode = $category ? ($category->code ?? 'CAT') : 'CAT';

        $generatedCount = 0;
        $skippedNames = [];
        $skippedIds = [];
        $gnSequenceMap = [];
        $gnCache = []; // In-memory cache to avoid repeated DB lookups for the same GN

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
            $rowName = $row->name_en ?: ($row->name_si ?: ($row->name_ta ?: "ID: {$row->id}"));

            $requiredFields = [
                'name_ta'       => $row->name_ta,
                'Province'      => $row->province_name,
                'District'      => $row->district_name,
                'DS Division'   => $row->ds_name,
                'GN Name'       => $row->gn_name,
            ];
            
            $hasMissing = false;
            foreach ($requiredFields as $label => $value) {
                if (empty($value)) {
                    $skippedNames[] = "{$rowName} (Missing required data: {$label})";
                    $skippedIds[] = $row->id;
                    $hasMissing = true;
                    break;
                }
            }
            if ($hasMissing) continue;

            $gnName = trim($row->gn_name);
            
            // Use cache to prevent duplicate DB queries
            $cacheKey = md5($gnName . '|' . $row->ds_name . '|' . $row->district_name . '|' . ($row->gn_id ?? ''));
            if (array_key_exists($cacheKey, $gnCache)) {
                $gn = $gnCache[$cacheKey];
            } else {
                $gn = $this->resolveGramaNiladhari($gnName, $row->ds_name, $row->district_name, $row->gn_id ?? null);
                $gnCache[$cacheKey] = $gn;
            }

            if (!$gn) {
                $skippedNames[] = "{$rowName} (GN Division '{$gnName}' not found in system)";
                $skippedIds[] = $row->id;
                continue;
            }

            $gnCode = $gn->CCODE ?: $gn->code;
            if (!$gnCode) {
                $skippedNames[] = "{$rowName} (GN Division '{$gnName}' lacks valid code)";
                $skippedIds[] = $row->id;
                continue;
            }

            if (!isset($gnSequenceMap[$gnCode])) {
                $existingCount = DB::table($tableName)
                    ->where('reg_number', 'like', $gnCode . '/%')
                    ->count();
                $gnSequenceMap[$gnCode] = $existingCount + 1;
            }

            $sequence = $gnSequenceMap[$gnCode]++;
            $regNumber = $gnCode . '/' . $cCode . '/' . str_pad($sequence, 2, '0', STR_PAD_LEFT);

            DB::table($tableName)->where('id', $row->id)->update([
                'reg_number' => $regNumber,
                'updated_at' => now(),
            ]);

            $generatedCount++;
        }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
        }

        if ($generatedCount > 0) {
            $this->invalidateCategoryCache($slug);
        }

        return response()->json([
            'success'     => true,
            'generated'   => $generatedCount,
            'total'       => $rows->count(),
            'skipped'     => $skippedNames,
            'skipped_ids' => $skippedIds
        ]);
    }

    /**
     * Resolve a Grama Niladhari division by ID, code, or name (case-insensitive) using a fallback chain
     * to narrow down the correct CCODE in case of duplicate or slightly misspelled names.
     */
    private function resolveGramaNiladhari($gnName, $dsName = null, $districtName = null, $gnId = null, $gnCode = null)
    {
        // 1. Resolve by ID if provided
        if (!empty($gnId)) {
            $match = DB::table('grama_niladharis')->where('id', $gnId)->first();
            if ($match) {
                return $match;
            }
        }

        // 2. Resolve by exact Code/CCODE if provided
        if (!empty($gnCode)) {
            $match = DB::table('grama_niladharis')
                ->where('code', trim($gnCode))
                ->orWhere('CCODE', trim($gnCode))
                ->first();
            if ($match) {
                return $match;
            }
        }

        $gnClean = strtolower(trim($gnName));
        if (empty($gnClean)) {
            return null;
        }

        // 3. Attempt: Exact GN + DS + District (most specific)
        if (!empty($dsName) && !empty($districtName)) {
            $dsClean = strtolower(trim($dsName));
            $distClean = strtolower(trim($districtName));

            $match = DB::table('grama_niladharis')
                ->where(function($q) use ($gnClean) {
                    $q->whereRaw('LOWER(name_en) = ?', [$gnClean])
                      ->orWhereRaw('LOWER(name_si) = ?', [$gnClean])
                      ->orWhereRaw('LOWER(name_ta) = ?', [$gnClean]);
                })
                ->where(function($q) use ($dsClean) {
                    $q->whereRaw('LOWER(ds_en) = ?', [$dsClean])
                      ->orWhereRaw('LOWER(ds_si) = ?', [$dsClean])
                      ->orWhereRaw('LOWER(ds_ta) = ?', [$dsClean]);
                })
                ->where(function($q) use ($distClean) {
                    $q->whereRaw('LOWER(dis_en) = ?', [$distClean])
                      ->orWhereRaw('LOWER(dis_si) = ?', [$distClean])
                      ->orWhereRaw('LOWER(dis_ta) = ?', [$distClean]);
                })
                ->first();

            if ($match) {
                return $match;
            }
        }

        // 4. Attempt: Exact GN + DS
        if (!empty($dsName)) {
            $dsClean = strtolower(trim($dsName));

            $match = DB::table('grama_niladharis')
                ->where(function($q) use ($gnClean) {
                    $q->whereRaw('LOWER(name_en) = ?', [$gnClean])
                      ->orWhereRaw('LOWER(name_si) = ?', [$gnClean])
                      ->orWhereRaw('LOWER(name_ta) = ?', [$gnClean]);
                })
                ->where(function($q) use ($dsClean) {
                    $q->whereRaw('LOWER(ds_en) = ?', [$dsClean])
                      ->orWhereRaw('LOWER(ds_si) = ?', [$dsClean])
                      ->orWhereRaw('LOWER(ds_ta) = ?', [$dsClean]);
                })
                ->first();

            if ($match) {
                return $match;
            }
        }

        // 5. Attempt: Exact GN name / code / CCODE only (case-insensitive)
        $match = DB::table('grama_niladharis')
            ->where(function($q) use ($gnClean) {
                $q->whereRaw('LOWER(name_en) = ?', [$gnClean])
                  ->orWhereRaw('LOWER(name_si) = ?', [$gnClean])
                  ->orWhereRaw('LOWER(name_ta) = ?', [$gnClean])
                  ->orWhereRaw('LOWER(code) = ?', [$gnClean])
                  ->orWhereRaw('LOWER("CCODE") = ?', [$gnClean]);
            })
            ->first();

        if ($match) {
            return $match;
        }

        // 6. Attempt: Fuzzy search (wildcard vowels) + DS
        $wildcard = preg_replace('/[aeiou]/i', '_', $gnClean);
        if (!empty($dsName)) {
            $dsClean = strtolower(trim($dsName));
            $match = DB::table('grama_niladharis')
                ->whereRaw('LOWER(name_en) LIKE ?', [$wildcard])
                ->whereRaw('LOWER(ds_en) = ?', [$dsClean])
                ->first();
            if ($match) {
                return $match;
            }
        }

        // 7. Attempt: Fuzzy search (wildcard vowels) GN name only
        return DB::table('grama_niladharis')
            ->whereRaw('LOWER(name_en) LIKE ?', [$wildcard])
            ->first();
    }
}

