<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Public Portal
|--------------------------------------------------------------------------
|
| The routes the GN page and the industry survey use, copied from the main
| app's routes/api.php with authentication removed (`keycloak.admin` and
| `keycloak.optional` dropped). Paths, controllers and throttles are unchanged.
| The GraphQL endpoint is handled by Lighthouse via its own route.
|
*/

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'Ceylonica Admin API']));

use App\Http\Controllers\IndustrySurveyController;

Route::middleware('throttle:60,1')->get('/search-gns', [\App\Http\Controllers\SearchController::class, 'searchGns']);

Route::middleware('throttle:120,1')->group(function () {
    Route::get('/all-categories', [\App\Http\Controllers\CategoryDataUploadController::class, 'getAllCategories']);
    Route::get('/search-all-data', [\App\Http\Controllers\CategoryDataUploadController::class, 'searchAllData']);
    Route::get('/category-data/{slug}', [\App\Http\Controllers\CategoryDataUploadController::class, 'getData']);
    Route::get('/category-tables/{slug}', [\App\Http\Controllers\CategoryTablesController::class, 'getTablesForCategory']);

    // Public read: the survey form needs to load questions without auth
    Route::get('/business-survey-questions', [App\Http\Controllers\Api\BusinessSurveyQuestionController::class, 'index']);

    // Village progress is public: it is counts only, and it is what invites a
    // visitor to contribute in the first place.
    Route::get('/contributions/village/{ccode}', [\App\Http\Controllers\ContributionController::class, 'village']);
});

// Industry Survey submission — authentication removed for the public portal.
Route::middleware(['throttle:20,1'])->group(function () {
    Route::post('/industry-survey', [IndustrySurveyController::class, 'store']);
    Route::post('/industry-survey/generate-reg-number', [IndustrySurveyController::class, 'generateRegNumber']);
});

// OTP routes stay outside the auth group: verifying phone ownership is a
// precondition of reaching a fully-authenticated state on some flows and must
// not itself require one. Both are still rate-limited, and OtpController adds
// a per-mobile send cooldown on top of the per-IP throttle below.
Route::middleware('throttle:20,1')->group(function () {
    Route::post('/otp/send', [\App\Http\Controllers\OtpController::class, 'send']);
    Route::post('/otp/verify', [\App\Http\Controllers\OtpController::class, 'verify']);
});

// Serve images through PHP since frontend Nginx container doesn't share the volume
Route::get('/uploads/{path}', function($path) {
    $file = public_path('uploads/' . $path);
    if (file_exists($file)) {
        return response()->file($file);
    }
    abort(404);
})->where('path', '.*');

// ─── Public Business Profile Routes (No Auth) ───────────────────────────────
use App\Http\Controllers\PublicBusinessController;

Route::middleware('throttle:120,1')->group(function () {
    Route::get('/public/surveys-by-ccode/{ccode}', [PublicBusinessController::class, 'byCcode']);
});
