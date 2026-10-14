<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Keycloak Configuration
    |--------------------------------------------------------------------------
    */

    // Internal URL for fetching JWKS and admin API (Docker container or localhost)
    'base_url'  => env('KEYCLOAK_BASE_URL', 'http://localhost:8080'),

    // Public URL used in JWT 'iss' claim (what the browser sees)
    // Falls back to base_url if not set (for local dev)
    'public_url' => env('KEYCLOAK_PUBLIC_URL', env('KEYCLOAK_BASE_URL', 'http://localhost:8080')),

    'realm'     => env('KEYCLOAK_REALM', 'ceylonica-admin'),
    'client_id' => env('KEYCLOAK_CLIENT_ID', 'ceylonica-frontend'),

    // JWKS endpoint (uses internal URL for fetching)
    'jwks_url'  => env('KEYCLOAK_BASE_URL', 'http://localhost:8080')
        . '/realms/'
        . env('KEYCLOAK_REALM', 'ceylonica-admin')
        . '/protocol/openid-connect/certs',

    // Admin API Credentials
    'admin_client_id'     => env('KEYCLOAK_ADMIN_CLIENT_ID', 'admin-cli'),
    'admin_client_secret' => env('KEYCLOAK_ADMIN_CLIENT_SECRET', ''),
];
