<?php

namespace App\Services;

use App\Models\IndustrySurvey;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SurveyDraftAccess
{
    public const TOKEN_KEY = '_edit_token_hash';

    public static function allows(IndustrySurvey $survey, mixed $token): bool
    {
        $hash = is_array($survey->form_data) ? ($survey->form_data[self::TOKEN_KEY] ?? null) : null;
        return is_string($hash) && is_string($token) && $token !== ''
            && hash_equals($hash, hash('sha256', $token));
    }

    /** Server operator only: never expose issuance through a public HTTP route.
     * The caller must verify the recipient and deliver the code privately.
     * No answers, IDs, status, registration numbers or ownership are replaced.
     */
    public function issueLegacyCode(int $id): string
    {
        return DB::transaction(function () use ($id) {
            $survey = IndustrySurvey::whereKey($id)->lockForUpdate()->first();
            if (!$survey || $survey->status !== 'draft') {
                throw new RuntimeException('Only an existing draft can receive a recovery code.');
            }
            $data = $survey->form_data;
            if (!is_array($data)) {
                throw new RuntimeException('Draft data needs manual inspection; nothing was changed.');
            }
            if (!empty($data[self::TOKEN_KEY])) {
                throw new RuntimeException('This draft already has an edit token; it was not replaced.');
            }
            $token = bin2hex(random_bytes(32));
            $data[self::TOKEN_KEY] = hash('sha256', $token);
            $survey->form_data = $data;
            $survey->save();
            return $token;
        });
    }
}
