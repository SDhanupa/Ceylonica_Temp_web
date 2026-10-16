<?php

namespace App\Console\Commands;

use App\Services\SurveyDraftAccess;
use Illuminate\Console\Command;
use RuntimeException;

class IssueSurveyDraftRecovery extends Command
{
    protected $signature = 'survey:issue-draft-recovery {id : Existing draft ID} {--confirm-owner : Confirm you verified who may edit this draft}';
    protected $description = 'Issue a private edit/recovery code for a legacy draft without changing its answers';

    public function handle(SurveyDraftAccess $access): int
    {
        $id = (string) $this->argument('id');
        if (!$this->option('confirm-owner') || !ctype_digit($id) || (int) $id < 1) {
            $this->error('Verify the draft owner first, then provide a positive ID and --confirm-owner.');
            return self::FAILURE;
        }
        try {
            // Sensitive bearer credential: redirect stdout to a private 0600 file.
            $this->line($access->issueLegacyCode((int) $id));
            return self::SUCCESS;
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }
}
