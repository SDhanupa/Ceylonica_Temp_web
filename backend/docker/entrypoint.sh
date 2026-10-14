#!/bin/sh
set -e

# Rebuild caches from the live environment (env vars differ per deploy).
# Never run `optimize:clear` here — that would leave the app uncached.
php artisan config:cache
php artisan event:cache

# route:cache fails if any route is a closure (this app has a few). It is a
# smaller win than config cache, so treat it as best-effort and make sure a
# failed attempt never leaves a partial/stale route cache behind.
php artisan route:cache || php artisan route:clear

exec php-fpm
