<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * KeycloakAuthGuard publishes the verified identity by merging keys such as
 * `current_admin` and `keycloak_sub` into the request input — the same bag that
 * carries client-supplied query and body parameters. Any path that did not
 * overwrite them (the guest-token branch, or a route with no guard at all) left
 * a client-sent `?current_admin=1` in place, which SuperAdminMiddleware accepted
 * as proof of admin rights.
 *
 * Removing these keys from every incoming request, before any guard or handler
 * runs, means they can only ever hold values the server itself put there.
 */
class StripClientIdentityKeys
{
    public const RESERVED_KEYS = [
        'current_admin',
        'current_user',
        'keycloak_sub',
        'keycloak_email',
        'keycloak_first_name',
        'keycloak_last_name',
        'needs_onboarding',
        'is_guest',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        self::strip($request);

        return $next($request);
    }

    public static function strip(Request $request): void
    {
        foreach (self::RESERVED_KEYS as $key) {
            $request->query->remove($key);
            $request->request->remove($key);
            $request->attributes->remove($key);

            if ($request->isJson()) {
                $request->json()->remove($key);
            }
        }
    }
}
