<?php

/*
| Rapid fire: a timed yes / no / not-sure round asking whether each topic
| (leaf category) exists in the contributor's village.
*/

return [
    // Questions per round.
    'session_size' => (int) env('RAPID_FIRE_SESSION_SIZE', 10),

    // Time a player gets per card before it is skipped.
    'seconds_per_question' => (int) env('RAPID_FIRE_SECONDS_PER_QUESTION', 10),

    // A round that is not finished within this window can no longer be answered.
    'session_ttl_minutes' => 30,

    // Answers quicker than this cannot have been read. They are stored, but earn
    // nothing and are excluded from the village consensus.
    'hasty_threshold_ms' => 400,

    // Two answers arriving closer together than this on the server clock are
    // treated as hasty regardless of the response time the client reports.
    'min_server_gap_ms' => 250,

    // Top-level categories whose topics are administrative/GIS divisions (zones,
    // boundaries) rather than things a resident can confirm from memory.
    'excluded_root_slugs' => ['location-1-1'],
];
