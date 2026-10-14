<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Apply CORS globally so GraphQL endpoint accepts cross-origin requests
        // Identity keys are stripped from every request, guarded or not, so a
        // client can never pre-seed `current_admin` / `keycloak_sub`.
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\StripClientIdentityKeys::class,
        ]);

        // Public portal: Keycloak guard aliases removed (no authentication).
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
