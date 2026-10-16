<?php
// Standalone integration regression suite. Run only in a disposable container:
// docker run --rm --network none --entrypoint php IMAGE /checks/draft-recovery.php
require '/var/www/vendor/autoload.php';
$app = require '/var/www/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\IndustrySurvey;
use App\Services\SurveyDraftAccess;
use App\Http\Controllers\IndustrySurveyController;
use Illuminate\Support\Facades\{Artisan, Cache, DB, Http, Schema};
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;

config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:',
    'cache.default' => 'array', 'logging.default' => 'stderr']);
DB::purge('sqlite');
if (DB::connection()->getDatabaseName() !== ':memory:') throw new RuntimeException('Not an isolated test database');
Http::preventStrayRequests();
Schema::create('industry_surveys', function (Blueprint $t) {
    $t->id();
    foreach (['user_id', 'created_by', 'ccode', 'district', 'ds_division', 'gn_name', 'reg_number'] as $column) $t->string($column)->nullable();
    $t->decimal('latitude', 12, 8)->nullable();
    $t->decimal('longitude', 12, 8)->nullable();
    $t->string('status');
    $t->json('form_data')->nullable();
    $t->timestamps();
});
$checks = 0;
function check(bool $ok, string $label): void {
    global $checks;
    if (!$ok) throw new RuntimeException('FAIL: '.$label);
    $checks++;
}
function rejected(callable $action): void {
    try { $action(); } catch (RuntimeException $e) { return; }
    throw new RuntimeException('Expected issuance to be rejected');
}
function snapshot(): string { return IndustrySurvey::orderBy('id')->get()->toJson(); }
function req(array $payload): Request { return Request::create('/api/industry-survey', 'POST', $payload); }
$controller = new IndustrySurveyController;
$access = new SurveyDraftAccess;
$legacyData = ['formValues' => ['b_name' => 'Synthetic draft', 'q_old' => 'සිංහල தமிழ்', 'b_mobile' => ''],
    'currentStep' => 4, 'surveyStartTime' => '2026-01-01T10:00:00Z',
    'photos' => ['industry-survey/example.jpg'], 'legacy_metadata' => ['preserve' => true]];
$legacy = IndustrySurvey::create(['ccode' => 'TESTGN', 'status' => 'draft', 'form_data' => $legacyData]);
$submitted = IndustrySurvey::create(['ccode' => 'TESTGN', 'status' => 'submitted', 'reg_number' => 'TEST/01', 'form_data' => $legacyData]);
$flat = IndustrySurvey::create(['ccode' => 'TESTGN', 'status' => 'draft', 'form_data' => ['b_name' => 'Older flat draft', 'photo' => 'keep.jpg']]);
$original = snapshot();
$denied = $controller->store(req(['id' => $legacy->id, 'status' => 'draft', 'form_data' => ['formValues' => ['b_name' => 'attacker']]]));
check($denied->getStatusCode() === 403 && snapshot() === $original, 'anonymous updates cannot alter legacy records');
check(Artisan::call('survey:issue-draft-recovery', ['id' => $legacy->id]) === 1, 'operator must confirm ownership');
check(snapshot() === $original, 'refused command leaves all records intact');
rejected(fn () => $access->issueLegacyCode($submitted->id));
rejected(fn () => $access->issueLegacyCode(99999));
check(snapshot() === $original, 'submitted and missing IDs cannot be issued a code');
check(Artisan::call('survey:issue-draft-recovery', ['id' => $legacy->id, '--confirm-owner' => true]) === 0, 'CLI issues code for an existing legacy draft');
$code = trim(Artisan::output());
check((bool) preg_match('/^[a-f0-9]{64}$/', $code), 'code is a 256-bit random bearer secret');
$afterIssue = $legacy->fresh()->form_data;
check($afterIssue[SurveyDraftAccess::TOKEN_KEY] === hash('sha256', $code), 'only the code hash is stored');
unset($afterIssue[SurveyDraftAccess::TOKEN_KEY]);
check($afterIssue === $legacyData, 'every existing answer, photo and metadata field survives issuance');
check(IndustrySurvey::count() === 3 && $legacy->fresh()->status === 'draft', 'issuance preserves ID, count and draft status');
$issuedSnapshot = snapshot();
rejected(fn () => $access->issueLegacyCode($legacy->id));
check(snapshot() === $issuedSnapshot, 'second issuance never rotates an existing code');
foreach ([$legacy->id, $flat->id, 99999] as $id) {
    $bad = $controller->recoverDraft(req(['id' => $id, 'edit_token' => str_repeat('x', 64)]));
    check($bad->getStatusCode() === 403 && !isset($bad->getData(true)['survey']), 'wrong codes disclose no answers');
}
check(snapshot() === $issuedSnapshot, 'failed recovery does not write records');
$read = $controller->recoverDraft(req(['id' => $legacy->id, 'edit_token' => $code]));
check($read->getStatusCode() === 200 && $read->getData(true)['survey']['form_data'] === $legacyData, 'correct code returns original answers without hash');
check($read->headers->get('Cache-Control') === 'no-store, private', 'recovered personal data is not cacheable');
check(snapshot() === $issuedSnapshot, 'reading a recovered draft is read-only');
$saved = $controller->store(req(['id' => $legacy->id, 'edit_token' => $code, 'ccode' => 'TESTGN', 'status' => 'draft',
    'form_data' => ['formValues' => ['b_name' => 'Continued draft'], 'currentStep' => 5]]));
check($saved->getStatusCode() === 200 && $saved->getData(true)['survey']['id'] === $legacy->id, 'recovered draft saves to the same ID');
$updated = $legacy->fresh()->form_data;
check($updated['formValues']['q_old'] === 'සිංහල தமிழ்' && $updated['photos'] === $legacyData['photos'] && $updated['legacy_metadata'] === $legacyData['legacy_metadata'], 'saving retains unknown legacy fields and photos');
check(!isset($saved->getData(true)['survey']['form_data'][SurveyDraftAccess::TOKEN_KEY]), 'saving never returns the token hash');
check($submitted->fresh()->form_data === $legacyData && $submitted->fresh()->reg_number === 'TEST/01', 'submitted records remain unchanged');
$flatCode = $access->issueLegacyCode($flat->id);
$flatRead = $controller->recoverDraft(req(['id' => $flat->id, 'edit_token' => $flatCode]));
check($flatRead->getData(true)['survey']['form_data'] === ['b_name' => 'Older flat draft', 'photo' => 'keep.jpg'], 'flat legacy payloads remain recoverable');
$create = $controller->store(req(['ccode' => 'TESTGN', 'status' => 'draft', 'form_data' => ['formValues' => ['b_name' => 'New draft']]]));
check($create->getStatusCode() === 200 && !empty($create->getData(true)['edit_token']), 'new drafts still get an edit token');
$new = $create->getData(true);
$newSave = $controller->store(req(['id' => $new['survey']['id'], 'edit_token' => $new['edit_token'], 'ccode' => 'TESTGN', 'status' => 'draft', 'form_data' => ['formValues' => ['b_name' => 'New updated']]]));
check($newSave->getStatusCode() === 200 && IndustrySurvey::count() === 4, 'new-token updates do not duplicate records');
$noOtp = $controller->store(req(['id' => $legacy->id, 'edit_token' => $code, 'status' => 'submitted', 'form_data' => ['formValues' => ['b_mobile' => '0700000000']]]));
check($noOtp->getStatusCode() === 422, 'recovery does not bypass final submission OTP');
check(Http::recorded()->isEmpty(), 'no outbound HTTP or SMS requests');
echo "PASS: {$checks} recovery/data-preservation checks; SQLite memory only; no SMS or network requests.\n";
