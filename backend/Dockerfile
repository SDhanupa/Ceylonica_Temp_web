FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libpq-dev \
    $PHPIZE_DEPS

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (including pgsql for PostgreSQL, opcache for throughput)
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip opcache

# Redis client extension — cache, rate limiting and JWKS all use it, shared
# across replicas. Without it Laravel silently falls back to the database cache.
RUN pecl install redis && docker-php-ext-enable redis

# OPcache + upload tuning. Code is baked into the image, so OPcache timestamp
# validation is off for maximum throughput; a new deploy is a new image.
COPY docker/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY docker/php-limits.ini /usr/local/etc/php/conf.d/zz-limits.ini

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application code
COPY . /var/www

# Install composer dependencies (runs package discovery via post-install scripts)
RUN composer install --optimize-autoloader --no-dev --no-interaction --prefer-dist

# Ensure permissions
RUN mkdir -p /var/www/public/uploads \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/public/uploads \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache /var/www/public/uploads

# Start: build fresh config/route/event caches from the live environment, then
# run php-fpm. Dependencies are baked at build time — no runtime `composer install`.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000
CMD ["/usr/local/bin/entrypoint.sh"]
