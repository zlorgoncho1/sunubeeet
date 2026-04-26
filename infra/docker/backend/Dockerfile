# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — vendor : installe les dépendances Composer en isolation
# ─────────────────────────────────────────────────────────────────────────────
FROM composer:2 AS vendor

WORKDIR /app

# Cache des layers : on copie d'abord les manifestes pour profiter du cache Docker
# tant que composer.{json,lock} ne changent pas.
COPY backend/api/composer.json backend/api/composer.lock ./

RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --no-interaction \
        --no-progress \
        --prefer-dist


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime : image PHP-FPM finale, mutualisée par web/queue/reverb
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.3-fpm-alpine AS runtime

# Outils runtime + tini pour signaler proprement les sous-process (queue/reverb)
RUN apk add --no-cache \
        bash \
        tini \
        postgresql-client \
        curl \
        git \
        unzip \
    && rm -rf /var/cache/apk/*

# Extensions PHP (installer dédié = build reproductible et léger)
#
# ⚠ NE PAS utiliser `ADD <url>` ici — BuildKit n'a aucun retry sur les fetch
# HTTP, et le 502 occasionnel des CDN GitHub Releases fait planter le build
# (vu en déploiement Coolify : `failed to load cache key: invalid response
# status 502`). On utilise curl avec --retry et version pinnée pour
# reproductibilité + résilience.
ARG IPE_VERSION=2.10.18
RUN set -eux; \
    curl --retry 6 --retry-all-errors --retry-delay 3 \
         --fail --silent --show-error --location \
         "https://github.com/mlocati/docker-php-extension-installer/releases/download/${IPE_VERSION}/install-php-extensions" \
         -o /usr/local/bin/install-php-extensions; \
    chmod +x /usr/local/bin/install-php-extensions
# (le binaire ne supporte pas `--version` comme flag — il interprète chaque
# arg comme un nom d'extension. La validation se fait au RUN suivant.)

RUN install-php-extensions \
        pdo_pgsql \
        redis \
        gd \
        bcmath \
        pcntl \
        intl \
        opcache \
        zip \
        sockets

# Composer binaire (utile à l'exec, pas en runtime normal)
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Configs PHP / FPM custom
COPY infra/docker/backend/php.ini          /usr/local/etc/php/conf.d/zz-app.ini
COPY infra/docker/backend/php-fpm.pool.conf /usr/local/etc/php-fpm.d/zz-app.conf

WORKDIR /var/www

# Code applicatif + vendor
COPY --from=vendor /app/vendor ./vendor
COPY backend/api ./

# Optimise l'autoloader maintenant que tout le code est là
RUN composer dump-autoload --optimize --classmap-authoritative --no-interaction

# Permissions : storage et bootstrap/cache doivent être writable par www-data (uid 82 sur alpine)
# ⚠ /bin/sh d'alpine ne fait PAS d'expansion brace — chaque dossier doit être listé.
# On crée aussi .env (depuis .env.example) à la build : l'entrypoint pourra y
# faire `key:generate` et `ensure_secret_in_env` au runtime sans souci de perms.
RUN mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/testing \
        storage/logs \
        bootstrap/cache \
    && cp .env.example .env \
    && chown -R www-data:www-data storage bootstrap/cache .env \
    && chmod -R ug+rwx storage bootstrap/cache \
    && chmod 664 .env

# Entrypoint : attend DB, génère secrets manquants, migre, exec CMD
COPY --chmod=0755 infra/docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh

USER www-data

EXPOSE 9000

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm", "-F"]
