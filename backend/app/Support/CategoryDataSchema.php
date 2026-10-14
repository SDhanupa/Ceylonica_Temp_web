<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Category data lives in one dynamically created table per leaf category
 * (`category_data_<slug>`), and their schemas have drifted over time — older
 * tables lack columns newer code relies on. Everything that needs a column
 * guarantees it through here instead of assuming it.
 */
class CategoryDataSchema
{
    public const TABLE_PREFIX = 'category_data_';

    public static function tableFor(string $slug): string
    {
        return self::TABLE_PREFIX . str_replace('-', '_', $slug);
    }

    public static function slugFor(string $table): string
    {
        return str_replace('_', '-', substr($table, strlen(self::TABLE_PREFIX)));
    }

    /** @return string[] */
    public static function allTables(): array
    {
        return collect(DB::select(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE ?",
            [self::TABLE_PREFIX . '%']
        ))->pluck('tablename')->all();
    }

    /**
     * Keycloak subject of whoever contributed the row. `added_by_user_id` could
     * never hold this: it is a bigint, while user ids in this system are strings.
     */
    public static function ensureContributorColumn(string $table): void
    {
        if (Schema::hasColumn($table, 'contributor_sub')) {
            return;
        }

        Schema::table($table, function (Blueprint $t) use ($table) {
            $t->string('contributor_sub')->nullable();
            // Hashed name: some table names already use 62 of Postgres's 63
            // identifier characters, and truncated names would collide.
            $t->index('contributor_sub', 'cd_' . substr(md5($table), 0, 16) . '_contrib_idx');
        });
    }
}
