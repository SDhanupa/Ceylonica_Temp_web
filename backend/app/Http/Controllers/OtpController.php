<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    private const OTP_TTL_MINUTES = 5;
    private const RESEND_COOLDOWN_SECONDS = 60;
    /** How long a successful verification remains usable to submit the survey. */
    private const VERIFICATION_TTL_MINUTES = 30;

    public function send(Request $request)
    {
        $request->validate([
            'mobile' => 'required|string|max:15',
        ]);

        $mobile = $request->mobile;

        // Per-mobile cooldown, independent of the route's per-IP throttle: the
        // IP limit protects the endpoint, this protects a *specific phone
        // number* from being spammed with SMS by someone who doesn't own it
        // (repeatedly typing a victim's number and hitting "send").
        $cooldownKey = 'otp_cooldown_' . $mobile;
        if (Cache::has($cooldownKey)) {
            return response()->json([
                'success' => false,
                'error' => 'Please wait before requesting another code',
            ], 429);
        }

        // A uniformly-distributed 6-digit code from PHP's CSPRNG. (The
        // previous implementation hashed a random string with SHA-256 and
        // stripped non-digit characters to find 6 digits — strictly more
        // code for a *less* clearly uniform result, since it depends on where
        // digits happen to fall in a hex digest. random_int() is simpler,
        // correct by construction, and was already used here as the
        // "shouldn't happen" fallback path.)
        $otp = (string) random_int(100000, 999999);

        Cache::put('otp_' . $mobile, $otp, now()->addMinutes(self::OTP_TTL_MINUTES));
        Cache::put($cooldownKey, true, now()->addSeconds(self::RESEND_COOLDOWN_SECONDS));

        $message = "Your Ceylonica Industry Survey verification code is: {$otp}. Please do not share this code.";

        try {
            $apiUrl = config('services.textware.api_url');
            if (empty($apiUrl)) {
                Log::warning("OTP generated for {$mobile} but SMS Gateway is not configured in .env");
                return response()->json(['success' => true, 'message' => 'OTP generated (SMS simulated in dev)']);
            }

            $response = Http::get($apiUrl, [
                'username' => config('services.textware.username'),
                'password' => config('services.textware.password'),
                'src' => config('services.textware.sender_id'),
                'dst' => $mobile,
                'msg' => $message,
                'dr' => 1
            ]);

            if (!$response->successful()) {
                // The gateway rejected the request outright (bad credentials,
                // invalid destination, etc.) — that is not "sent successfully"
                // and the client should know to retry rather than wait for an
                // SMS that was never sent. The OTP itself stays valid in cache
                // in case the failure was reporting-only and the SMS did go
                // out; the user can still request a fresh one after cooldown.
                Log::error("SMS gateway rejected OTP request for {$mobile}: HTTP {$response->status()} " . $response->body());
                return response()->json(['success' => false, 'error' => 'Failed to send SMS'], 502);
            }

            Log::info("OTP sent to {$mobile}. Gateway response: " . $response->body());

            return response()->json(['success' => true, 'message' => 'OTP sent successfully']);
        } catch (\Throwable $e) {
            Log::error("Failed to send SMS to {$mobile}: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to send SMS'], 500);
        }
    }

    public function verify(Request $request)
    {
        $request->validate([
            'mobile' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $mobile = $request->mobile;
        $userCode = $request->code;

        $cachedCode = Cache::get('otp_' . $mobile);

        if (!$cachedCode) {
            return response()->json(['success' => false, 'error' => 'OTP expired or not requested'], 400);
        }

        // hash_equals() for a credential-like comparison, per PHP's own
        // recommendation — '===' on strings is not guaranteed constant-time.
        if (!hash_equals((string) $cachedCode, (string) $userCode)) {
            return response()->json(['success' => false, 'error' => 'Invalid OTP'], 400);
        }

        Cache::forget('otp_' . $mobile);

        // Issue a single-use proof binding "this mobile number was verified"
        // to a short-lived opaque token. Without this, OTP verification was
        // purely a client-side checkmark: nothing stopped a request from
        // submitting the survey with an unverified (or different) phone
        // number, since the backend never checked verification state at all.
        // IndustrySurveyController::store() requires and consumes this token
        // when status=submitted.
        $verificationToken = Str::random(48);
        Cache::put('otp_verified_' . $mobile, $verificationToken, now()->addMinutes(self::VERIFICATION_TTL_MINUTES));

        return response()->json([
            'success' => true,
            'message' => 'Verified successfully',
            'verification_token' => $verificationToken,
        ]);
    }
}
