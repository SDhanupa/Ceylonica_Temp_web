<?php

namespace App\Http\Controllers;

use App\Models\IndustrySurvey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PublicBusinessController extends Controller
{
    /**
     * Sensitive fields that must NEVER appear on the public profile.
     */
    private const SENSITIVE_KEYS = [
        'b_nic', 'q_nic', 'q_dob_age', 'q_email', 'q_address',
        'q_whatsapp', 'q_mobile', 'b_mobile',
    ];

    /**
     * GET /api/public/business/{regNumber}
     * Returns a sanitized view of a submitted/approved survey for public display.
     */
    public function show(string $regNumber)
    {
        $survey = IndustrySurvey::where('reg_number', $regNumber)
            ->whereIn('status', ['submitted', 'approved'])
            ->first();

        if (!$survey) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $formData = $survey->form_data ?? [];
        $formValues = $formData['formValues'] ?? $formData;

        // Strip sensitive data
        $safeValues = collect($formValues)
            ->reject(fn($v, $k) => in_array($k, self::SENSITIVE_KEYS))
            ->all();

        return response()->json([
            'reg_number'  => $survey->reg_number,
            'status'      => $survey->status,
            'ccode'       => $survey->ccode,
            'district'    => $survey->district,
            'ds_division' => $survey->ds_division,
            'gn_name'     => $survey->gn_name,
            'created_at'  => $survey->created_at,
            'form_values' => $safeValues,
        ]);
    }

    /**
     * GET /api/public/surveys-by-ccode/{ccode}
     * Returns a list of submitted/approved businesses for a GN division.
     */
    public function byCcode(string $ccode)
    {
        $surveys = IndustrySurvey::where('ccode', strtoupper($ccode))
            ->whereIn('status', ['submitted', 'approved'])
            ->whereNotNull('reg_number')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($s) {
                $fd = $s->form_data ?? [];
                $fv = $fd['formValues'] ?? $fd;
                return [
                    'id'          => $s->id,
                    'reg_number'  => $s->reg_number,
                    'status'      => $s->status,
                    'b_name'      => $fv['b_name'] ?? null,
                    'b_type_name' => $fv['b_type_name'] ?? null,
                    'b_address'   => $fv['b_address'] ?? null,
                    'b_owner_name'=> $fv['b_owner_name'] ?? null,
                    'b_photo'     => $fv['b_photo'] ?? null,
                    'created_at'  => $s->created_at,
                ];
            });

        return response()->json($surveys);
    }

    /**
     * POST /api/public/qr-otp/send
     * Sends an OTP to the business mobile for QR download verification.
     */
    public function sendQrOtp(Request $request)
    {
        $regNumber = $request->input('reg_number');
        if (!$regNumber) {
            return response()->json(['error' => 'reg_number is required'], 422);
        }

        $survey = IndustrySurvey::where('reg_number', $regNumber)
            ->whereIn('status', ['submitted', 'approved'])
            ->first();

        if (!$survey) {
            return response()->json(['error' => 'Business not found'], 404);
        }

        $fd = $survey->form_data ?? [];
        $fv = $fd['formValues'] ?? $fd;
        $mobile = $fv['b_mobile'] ?? null;

        if (!$mobile) {
            return response()->json(['error' => 'No mobile number on file'], 422);
        }

        // Rate limit: 1 OTP per mobile per 60 seconds
        $cooldownKey = 'qr_otp_cooldown_' . $mobile;
        if (Cache::has($cooldownKey)) {
            return response()->json(['error' => 'Please wait before requesting another code'], 429);
        }

        $otp = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        Cache::put('qr_otp_' . $regNumber, $otp, now()->addMinutes(10));
        Cache::put($cooldownKey, true, now()->addSeconds(60));

        // Send via TextWare
        try {
            $apiUrl = config('services.textware.api_url');
            if ($apiUrl) {
                $message = "Your Ceylonica QR verification code is: {$otp}. Valid for 10 minutes.";
                Http::get($apiUrl, [
                    'username' => config('services.textware.username'),
                    'password' => config('services.textware.password'),
                    'src'      => config('services.textware.sender_id'),
                    'dst'      => $mobile,
                    'msg'      => $message,
                    'dr'       => 1,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to send QR OTP: " . $e->getMessage());
        }

        // Mask mobile for display
        $masked = substr($mobile, 0, 4) . '****' . substr($mobile, -3);

        return response()->json([
            'message' => 'OTP sent successfully',
            'masked_mobile' => $masked,
        ]);
    }

    /**
     * POST /api/public/qr-otp/verify
     * Verifies OTP and returns a short-lived download token.
     */
    public function verifyQrOtp(Request $request)
    {
        $regNumber = $request->input('reg_number');
        $otp = $request->input('otp');

        if (!$regNumber || !$otp) {
            return response()->json(['error' => 'reg_number and otp are required'], 422);
        }

        $stored = Cache::get('qr_otp_' . $regNumber);
        if (!$stored || $stored !== $otp) {
            return response()->json(['error' => 'Invalid or expired OTP'], 401);
        }

        Cache::forget('qr_otp_' . $regNumber);

        // Generate a short-lived download token
        $downloadToken = bin2hex(random_bytes(16));
        Cache::put('qr_download_' . $downloadToken, $regNumber, now()->addMinutes(15));

        return response()->json([
            'message' => 'OTP verified',
            'download_token' => $downloadToken,
        ]);
    }

    /**
     * GET /api/public/business/{regNumber}/qr-image?token={downloadToken}
     * Returns the QR code as a PNG image.
     */
    public function qrImage(Request $request, string $regNumber)
    {
        $token = $request->query('token');
        if (!$token) {
            return response()->json(['error' => 'Download token required'], 401);
        }

        $allowed = Cache::get('qr_download_' . $token);
        if ($allowed !== $regNumber) {
            return response()->json(['error' => 'Invalid or expired download token'], 401);
        }

        $frontendUrl = env('FRONTEND_URL', 'https://ceystem.com');
        $profileUrl = $frontendUrl . '/business/' . urlencode($regNumber);

        try {
            // Use chillerlan/php-qrcode if available
            if (class_exists(\chillerlan\QRCode\QRCode::class)) {
                $options = new \chillerlan\QRCode\QROptions([
                    'outputType'   => \chillerlan\QRCode\QRCode::OUTPUT_IMAGE_PNG,
                    'eccLevel'     => \chillerlan\QRCode\Common\EccLevel::H,
                    'scale'        => 10,
                    'imageBase64'  => false,
                ]);
                $qrcode = (new \chillerlan\QRCode\QRCode($options))->render($profileUrl);
                return response($qrcode, 200, [
                    'Content-Type' => 'image/png',
                    'Content-Disposition' => 'attachment; filename="' . $regNumber . '_qr.png"',
                ]);
            }

            // Fallback: use Google Charts API
            $googleUrl = 'https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=' . urlencode($profileUrl) . '&choe=UTF-8';
            $imageData = Http::get($googleUrl)->body();
            return response($imageData, 200, [
                'Content-Type' => 'image/png',
                'Content-Disposition' => 'attachment; filename="' . $regNumber . '_qr.png"',
            ]);
        } catch (\Exception $e) {
            Log::error("QR generation failed: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate QR code'], 500);
        }
    }
}
