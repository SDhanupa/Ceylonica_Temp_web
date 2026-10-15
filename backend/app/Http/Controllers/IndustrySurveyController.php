<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IndustrySurvey;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class IndustrySurveyController extends Controller
{
    /** Postgres SQLSTATE for a unique-constraint violation. */
    private const UNIQUE_VIOLATION = '23505';

    /**
     * Resolve the caller's identity as set by KeycloakAuthGuard.
     *
     * `$request->user()` is always null in this app (the guard never calls
     * Auth::login), and `$request->input('keycloak_sub')` shares a bag with
     * client-supplied parameters — with a public guest token a caller could
     * post someone else's sub and act as them. Request attributes are only
     * writable server-side. A guest token leaves the sub unset, which this
     * endpoint must refuse: a survey has to be owned by someone identifiable.
     */
    private function requireIdentity(Request $request): ?string
    {
        $sub = $request->attributes->get('keycloak_sub');
        return is_string($sub) && $sub !== '' ? $sub : null;
    }

    public function store(Request $request)
    {
        // Public portal: no authentication, so the caller is anonymous (null).
        $userId = $this->requireIdentity($request);

        $validator = Validator::make($request->all(), [
            'id'          => 'nullable|integer|min:1',
            'ccode'       => 'nullable|string|max:50',
            'district'    => 'nullable|string|max:255',
            'ds_division' => 'nullable|string|max:255',
            'gn_name'     => 'nullable|string|max:255',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            // 'approved' is intentionally excluded: it can only be set via the
            // dedicated, super_admin-gated approve() endpoint below. Accepting
            // it here would let any authenticated caller self-approve.
            'status'      => 'nullable|string|in:draft,submitted',
            'form_data'   => 'nullable|array',
            // Single-use proof from OtpController::verify(), required only when
            // actually submitting (drafts can be saved before verification).
            'mobile_verification_token' => 'nullable|string',
            // The public site origin supplied by the submitting browser. It is
            // used only for the post-submission profile link sent to that same
            // OTP-verified mobile number.
            'public_profile_base_url' => 'nullable|url|max:2048',
        ]);

        if ($validator->fails()) {
            // A failed request-shape validation is routine client behaviour
            // (stale form state, a manual API call), not an application fault —
            // logging it at error level would drown real errors in noise.
            Log::info('Industry survey validation failed', ['errors' => $validator->errors(), 'user_id' => $userId]);
            return response()->json(['error' => $validator->errors()], 422);
        }

        $status = $request->input('status', 'draft');
        $formData = $request->input('form_data') ?? [];
        // Both write paths nest survey answers under `formValues` (see the
        // frontend's handleSaveDraft/handleSubmit) — this is the one shape new
        // rows are written in; the dual-path reads elsewhere stay only for
        // rows that predate that being consistent.
        $formValues = $formData['formValues'] ?? [];

        if ($status === 'submitted') {
            $mobile = $formValues['b_mobile'] ?? null;
            $proof = $request->input('mobile_verification_token');
            if (!$mobile || !$proof || !hash_equals((string) Cache::get('otp_verified_' . $mobile, ''), (string) $proof)) {
                return response()->json([
                    'error' => 'Mobile number is not verified. Please verify via OTP before submitting.',
                ], 422);
            }
        }

        try {
            return DB::transaction(function () use ($request, $userId, $status, $formData, $formValues) {
                // Determine target owner based on NIC if provided.
                $targetUserId = $userId;
                $bNic = $formValues['b_nic'] ?? null;
                $bName = $formValues['b_name'] ?? null;
                $bMobile = $formValues['b_mobile'] ?? null;
                $bAddress = $formValues['b_address'] ?? null;

                if ($bNic && $bName && $bMobile) {
                    $createdOrFoundId = $this->getOrCreateKeycloakUserForSurvey($bNic, $bName, $bMobile, $bAddress);
                    if ($createdOrFoundId) {
                        $targetUserId = $createdOrFoundId;
                    }
                }

                $data = [
                    'user_id'     => $targetUserId,
                    'ccode'       => $request->input('ccode'),
                    'district'    => $request->input('district'),
                    'ds_division' => $request->input('ds_division'),
                    'gn_name'     => $request->input('gn_name'),
                    'latitude'    => $request->input('latitude'),
                    'longitude'   => $request->input('longitude'),
                    'status'      => $status,
                    'form_data'   => $formData,
                ];

                $id = $request->input('id');
                $survey = $id ? IndustrySurvey::find($id) : null;

                if ($id && !$survey) {
                    // Client believes it has an existing draft that no longer
                    // exists server-side (e.g. wiped local DB). Silently
                    // creating a new row under that ID would be surprising —
                    // fail clearly so the frontend can clear its stale local
                    // reference and retry as a fresh save.
                    return response()->json(['error' => 'The referenced survey no longer exists'], 404);
                }

                if ($survey) {
                    // Check if logged in user is admin
                    $token = $request->bearerToken();
                    $isAdmin = false;
                    if ($token) {
                        $parts = explode('.', $token);
                        if (count($parts) === 3) {
                            $payload = json_decode(base64_decode($parts[1]), true);
                            $roles = $payload['realm_access']['roles'] ?? [];
                            $isAdmin = in_array('super_admin', $roles) || in_array('admin', $roles) || in_array('moderator', $roles);
                        }
                    }

                    if (!$isAdmin && $survey->user_id !== $userId && $survey->user_id !== $targetUserId && $survey->created_by !== $userId) {
                        return response()->json(['error' => 'You do not have permission to modify this survey'], 403);
                    }
                    if ($survey->status === 'approved') {
                        return response()->json(['error' => 'This survey has already been approved and can no longer be modified'], 409);
                    }
                    // Keep original user_id if we are just updating
                    $data['user_id'] = $survey->user_id;
                    $survey->update($data);
                } else {
                    $data['created_by'] = $userId;
                    $survey = IndustrySurvey::create($data);
                }

                if ($status === 'submitted') {
                    $this->persistRegistrationNumber($survey, $formData);
                    // The proof is single-use: forget it so the same OTP
                    // verification can't be replayed against a second, later
                    // submission with a different (or since-changed) phone.
                    if ($mobile = ($formData['formValues']['b_mobile'] ?? null)) {
                        Cache::forget('otp_verified_' . $mobile);
                    }

                    // Send SMS with profile + QR links
                    $this->sendBusinessProfileSms(
                        $survey->fresh(),
                        $formData,
                        $request->input('public_profile_base_url'),
                        $request,
                    );
                }

                return response()->json([
                    'message' => 'Survey saved successfully',
                    'survey'  => $survey->fresh(),
                ], 200);
            });
        } catch (\Throwable $e) {
            Log::error('Error submitting industry survey: ' . $e->getMessage(), ['user_id' => $userId]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Store a business photo before the survey is submitted.
     *
     * The returned relative path is saved in form_data and can safely be used
     * by the public profile page through the existing /api/uploads/{path}
     * route. Files are assigned a server-generated name, never the original
     * client filename.
     */
    public function uploadPhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Please choose an image no larger than 10 MB (JPG, PNG, GIF, or WebP).',
                'errors' => $validator->errors(),
            ], 422);
        }

        $photo = $request->file('photo');
        $directory = public_path('uploads/industry-survey');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = (string) Str::uuid() . '.' . strtolower($photo->getClientOriginalExtension());
        $photo->move($directory, $filename);
        $path = 'industry-survey/' . $filename;

        return response()->json([
            'path' => $path,
            'url' => '/api/uploads/' . $path,
        ], 201);
    }

    /**
     * Copy the client-supplied registration number (already computed via
     * generateRegNumber() and shown to the user before they submitted) into
     * the indexed, UNIQUE `reg_number` column. On a genuine collision — two
     * submissions racing past the advisory lock in generateRegNumber(), or a
     * client retrying with a stale number — increment the numeric suffix and
     * retry a bounded number of times rather than let the request fail on a
     * transient race.
     */
    private function persistRegistrationNumber(IndustrySurvey $survey, array $formData): void
    {
        $regNumber = $formData['formValues']['b_reg_no'] ?? $formData['b_reg_no'] ?? null;
        if (!$regNumber) {
            return;
        }

        $prefix = $regNumber;
        $sequence = null;
        if (preg_match('/^(.*\/)(\d+)$/', $regNumber, $m)) {
            $prefix = $m[1];
            $sequence = (int) $m[2];
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $candidate = $sequence !== null
                ? $prefix . str_pad((string) ($sequence + $attempt), 2, '0', STR_PAD_LEFT)
                : $regNumber;
            try {
                // This method runs inside store()'s outer transaction. Postgres
                // (unlike MySQL) aborts the *entire* transaction on the first
                // failed statement — every subsequent query in it raises
                // "current transaction is aborted" until a rollback happens,
                // so a bare retry loop here would only ever succeed on its
                // first attempt and hard-fail on every one after. Wrapping
                // each attempt in its own DB::transaction() makes Laravel
                // issue a SAVEPOINT for it; on a caught exception only that
                // savepoint rolls back, leaving the outer transaction (and the
                // survey row/status write already done in store()) intact.
                DB::transaction(function () use ($survey, $candidate) {
                    $survey->forceFill(['reg_number' => $candidate])->save();
                });
                return;
            } catch (QueryException $e) {
                $isUniqueViolation = ($e->errorInfo[0] ?? null) === self::UNIQUE_VIOLATION;
                if (!$isUniqueViolation || $sequence === null) {
                    throw $e;
                }
                // Fall through and retry with the next sequence number.
            }
        }

        Log::warning('Could not allocate a unique registration number after retries', [
            'survey_id' => $survey->id,
            'attempted' => $regNumber,
        ]);
    }

    /**
     * Generate a *proposed* unique registration number for an industry survey.
     * Format: {CCODE}/{CATEGORY_CODE}/{NN}
     * Example: GKEDK/SAPDSGV/02
     *
     * This is shown to the user before they submit; store() re-validates and
     * persists it into the UNIQUE `reg_number` column, which is the actual
     * source of truth for uniqueness. The advisory lock here only prevents two
     * concurrent preview requests for the same ccode+category from computing
     * the same "next" number in the common case — it cannot protect against a
     * client that fetches a preview and takes a long time to submit, which is
     * exactly why persistRegistrationNumber() also retries on conflict.
     */
    public function generateRegNumber(Request $request)
    {
        $ccode        = strtoupper(trim($request->input('ccode', '')));
        $categorySlug = trim($request->input('category_slug', ''));

        if (!$ccode || !$categorySlug) {
            return response()->json(['error' => 'ccode and category_slug are required'], 422);
        }

        $category = DB::table('categories')->where('slug', $categorySlug)->first();
        $catCode  = ($category && !empty($category->code))
            ? strtoupper($category->code)
            : $this->slugToCode($categorySlug);

        $base = $ccode . '/' . $catCode . '/';

        // Serialize generation per ccode+category prefix so two concurrent
        // requests for the *same* combination can't both compute sequence N.
        // Different prefixes hash to (almost certainly) different lock keys
        // and don't block each other.
        return DB::transaction(function () use ($base, $ccode, $categorySlug, $catCode) {
            DB::statement('SELECT pg_advisory_xact_lock(hashtext(?))', [$base]);

            $existing = IndustrySurvey::where('ccode', $ccode)
                ->where(function ($query) use ($categorySlug) {
                    $query->whereRaw("form_data->'formValues'->>'b_type' = ?", [$categorySlug])
                          ->orWhereRaw("form_data->>'b_type' = ?", [$categorySlug]);
                })
                ->count();

            $sequence  = $existing + 1;
            $regNumber = $base . str_pad((string) $sequence, 2, '0', STR_PAD_LEFT);

            while (
                IndustrySurvey::where('reg_number', $regNumber)
                    ->orWhereRaw("form_data->'formValues'->>'b_reg_no' = ?", [$regNumber])
                    ->orWhereRaw("form_data->>'b_reg_no' = ?", [$regNumber])
                    ->exists()
            ) {
                $sequence++;
                $regNumber = $base . str_pad((string) $sequence, 2, '0', STR_PAD_LEFT);
            }

            return response()->json([
                'reg_number'    => $regNumber,
                'ccode'         => $ccode,
                'category_code' => $catCode,
                'sequence'      => $sequence,
            ]);
        });
    }

    /**
     * Derive a short uppercase code from a slug.
     * e.g. "small-scale-food-processing" → "SSFP"
     */
    private function slugToCode(string $slug): string
    {
        $parts = explode('-', $slug);
        $code  = implode('', array_map(fn($p) => strtoupper(substr($p, 0, 1)), $parts));
        return substr($code, 0, 8);
    }

    public function approve($id)
    {
        try {
            $survey = IndustrySurvey::findOrFail($id);
            $survey->update(['status' => 'approved']);

            return response()->json([
                'message' => 'Survey approved successfully',
                'survey'  => $survey
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error approving industry survey: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $query = IndustrySurvey::query();

            if ($request->filled('district')) {
                $query->where('district', $request->district);
            }
            if ($request->filled('ds_division')) {
                $query->where('ds_division', $request->ds_division);
            }
            if ($request->filled('gn_name')) {
                $query->where('gn_name', $request->gn_name);
            }

            $surveys = $query->latest()->paginate($request->get('per_page', 15));

            return response()->json($surveys);
        } catch (\Exception $e) {
            Log::error('Error fetching industry surveys: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
    public function mySurveys(Request $request)
    {
        $userId = $this->requireIdentity($request);
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $surveys = IndustrySurvey::where(function($query) use ($userId) {
                    $query->where('user_id', $userId)
                          ->orWhere('created_by', $userId);
                })
                ->orderBy('updated_at', 'desc')
                ->get();

            return response()->json($surveys);
        } catch (\Exception $e) {
            Log::error('Error fetching my surveys: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $userId = $this->requireIdentity($request);
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $survey = IndustrySurvey::findOrFail($id);

            // Check if logged in user is admin
            $token = $request->bearerToken();
            $isAdmin = false;
            if ($token) {
                $parts = explode('.', $token);
                if (count($parts) === 3) {
                    $payload = json_decode(base64_decode($parts[1]), true);
                    $roles = $payload['realm_access']['roles'] ?? [];
                    $isAdmin = in_array('super_admin', $roles) || in_array('admin', $roles) || in_array('moderator', $roles);
                }
            }

            if (!$isAdmin && $survey->user_id !== $userId) {
                return response()->json(['error' => 'You do not have permission to delete this survey'], 403);
            }

            if ($survey->status === 'approved') {
                return response()->json(['error' => 'Approved surveys cannot be deleted'], 409);
            }

            $survey->delete();

            return response()->json(['message' => 'Survey deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting survey: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    private function getOrCreateKeycloakUserForSurvey($nic, $name, $mobile, $address)
    {
        try {
            $baseUrl = env('KEYCLOAK_BASE_URL');
            $realm = env('KEYCLOAK_REALM');
            $clientId = env('KEYCLOAK_ADMIN_CLIENT_ID');
            $clientSecret = env('KEYCLOAK_ADMIN_CLIENT_SECRET');

            if (!$baseUrl || !$realm || !$clientId || !$clientSecret) {
                return null; // Keycloak admin API not configured
            }

            // 1. Get Admin Token
            $tokenUrl = "$baseUrl/realms/$realm/protocol/openid-connect/token";
            $response = Http::asForm()->post($tokenUrl, [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'grant_type' => 'client_credentials',
            ]);

            if (!$response->successful()) {
                // fallback to master realm if admin-cli belongs there
                $tokenUrlMaster = "$baseUrl/realms/master/protocol/openid-connect/token";
                $response = Http::asForm()->post($tokenUrlMaster, [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'grant_type' => 'client_credentials',
                ]);
                if (!$response->successful()) {
                    Log::error('Failed to get Keycloak admin token: ' . $response->body());
                    return null;
                }
            }

            $token = $response->json('access_token');
            if (!$token) return null;

            // 2. Search if user with this NIC exists
            $searchUrl = "$baseUrl/admin/realms/$realm/users";
            $searchRes = Http::withToken($token)->get($searchUrl, [
                'q' => "nic:$nic",
                'exact' => 'true'
            ]);

            if ($searchRes->successful()) {
                $users = $searchRes->json();
                if (is_array($users) && count($users) > 0) {
                    // Found existing user with this NIC, return their ID
                    return $users[0]['id'];
                }
            }

            // 3. User not found, create them. 
            // Username = Name stripped of spaces + last 4 digits of mobile
            $safeName = Str::slug($name, '');
            $mobileSuffix = substr(preg_replace('/[^0-9]/', '', $mobile), -4);
            if (empty($mobileSuffix)) {
                $mobileSuffix = rand(1000, 9999);
            }
            $username = strtolower($safeName . $mobileSuffix);
            if (empty($username)) {
                $username = 'user' . time();
            }

            // Generate a strong password to pass Keycloak password policies
            $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
            $password = substr(str_shuffle($chars), 0, 12);
            // Ensure at least one of each required character type
            $password .= 'A1!a'; 
            $password = str_shuffle($password);

            $newUserPayload = [
                'username' => $username,
                'enabled' => true,
                'firstName' => $name,
                'attributes' => [
                    'nic' => [$nic],
                    'mobile_number' => [$mobile],
                ],
                'credentials' => [
                    [
                        'type' => 'password',
                        'value' => $password,
                        'temporary' => false
                    ]
                ]
            ];
            
            if ($address) {
                $newUserPayload['attributes']['address'] = [$address];
            }

            $createRes = Http::withToken($token)->post($searchUrl, $newUserPayload);

            if ($createRes->successful() || $createRes->status() === 201) {
                // Send Welcome SMS with credentials
                try {
                    $apiUrl = config('services.textware.api_url');
                    if ($apiUrl) {
                        $loginLink = env('FRONTEND_URL', 'https://ceystem.com') . '/login';
                        $message = "Welcome to Ceylonica! Your account is created. Username: {$username} Password: {$password}. Login at: {$loginLink}";
                        
                        Http::get($apiUrl, [
                            'username' => config('services.textware.username'),
                            'password' => config('services.textware.password'),
                            'src' => config('services.textware.sender_id'),
                            'dst' => $mobile,
                            'msg' => $message,
                            'dr' => 1
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send welcome SMS: " . $e->getMessage());
                }

                // Keycloak returns 201 Created and Location header with new user ID
                $location = $createRes->header('Location');
                if ($location) {
                    $parts = explode('/', $location);
                    return end($parts);
                } else {
                    // Try to fetch it again just in case Location header wasn't readable
                    $fetchRes = Http::withToken($token)->get($searchUrl, ['username' => $username, 'exact' => 'true']);
                    if ($fetchRes->successful() && count($fetchRes->json()) > 0) {
                        return $fetchRes->json()[0]['id'];
                    }
                }
            } else {
                Log::error("Failed to create Keycloak user: " . $createRes->body());
                // Handle conflict (409) if username exists by returning null so it defaults to logged in user,
                // or we could retry with random string, but returning null ensures survey still saves.
            }

        } catch (\Exception $e) {
            Log::error('Keycloak user creation error: ' . $e->getMessage());
        }

        return null;
    }

    /** Send the registration number and public profile link after submission. */
    private function sendBusinessProfileSms(
        IndustrySurvey $survey,
        array $formData,
        ?string $submittedPublicBaseUrl,
        Request $request,
    ): void
    {
        try {
            $fv = $formData['formValues'] ?? $formData;
            $mobile = $fv['b_mobile'] ?? null;
            $regNumber = $survey->reg_number;

            if (!$mobile || !$regNumber) {
                return;
            }

            $apiUrl = config('services.textware.api_url');
            if (!$apiUrl) {
                return;
            }

            // Prefer the public origin of the browser that submitted this
            // questionnaire. If it is unavailable, use the actual request
            // host rather than a hard-coded domain.
            $frontendUrl = rtrim($submittedPublicBaseUrl ?: $request->getSchemeAndHttpHost(), '/');
            $profileLink = $frontendUrl . '/business/' . urlencode($regNumber);
            $bName = $fv['b_name'] ?? 'Business';

            $message = "Ceylonica: {$bName}\n"
                . "ලියාපදිංචිය සාර්ථකයි.\n"
                . "ලියාපදිංචි අංකය: {$regNumber}\n"
                . "ව්‍යාපාර පිටුව: {$profileLink}";

            $response = Http::timeout(15)->get($apiUrl, [
                'username' => config('services.textware.username'),
                'password' => config('services.textware.password'),
                'src'      => config('services.textware.sender_id'),
                'dst'      => $mobile,
                'msg'      => $message,
                'dr'       => 1,
            ]);

            if (!$response->successful()) {
                Log::warning('Business profile SMS gateway request failed', [
                    'reg_number' => $regNumber,
                    'status' => $response->status(),
                ]);
                return;
            }

            Log::info('Business profile SMS sent', ['reg_number' => $regNumber]);
        } catch (\Exception $e) {
            Log::error("Failed to send business profile SMS: " . $e->getMessage());
        }
    }
}
