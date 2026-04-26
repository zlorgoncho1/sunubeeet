#!/usr/bin/env bash
# Entrypoint partagé par les 3 services Laravel (web FPM / queue / reverb).
#
# Stratégie : opt-in init via INIT_APP=true, posée uniquement sur le service
# "primary" (backend en dev / backend-php en prod). Les autres attendent
# simplement les dépendances et exec leur command. Évite race conditions
# (key:generate, jwt secret, qr secret, migrate) entre containers concurrents.
set -euo pipefail

cd /var/www

log() { printf '[entrypoint] %s\n' "$*" >&2; }

wait_for_tcp() {
  local host="$1" port="$2" label="$3" tries=0
  log "wait $label ($host:$port)…"
  until php -r "exit(@fsockopen('$host', $port) ? 0 : 1);" 2>/dev/null; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      log "timeout waiting for $label"
      exit 1
    fi
    sleep 1
  done
  log "$label ready"
}

ensure_secret_in_env() {
  # Append le secret en fin de .env si pas déjà valorisé. Pas de mv .env.tmp
  # (pas de write sur le dir parent) — on supprime la ligne vide existante via
  # un append simple : le DERNIER occurrence wins côté Dotenv.
  local key="$1" generator="$2"
  if [ -f .env ] && ! grep -qE "^${key}=.+" .env; then
    local value
    value=$(eval "$generator")
    printf '%s=%s\n' "$key" "$value" >> .env
    log "$key généré"
  fi
}

# ─── 1. Init .env si absent ──────────────────────────────────────────────────

if [ ! -f .env ] && [ -f .env.example ]; then
  log ".env absent → copie depuis .env.example"
  cp .env.example .env
fi

# ─── 2. Attente des dépendances réseau (toujours) ────────────────────────────

wait_for_tcp "${DB_HOST:-postgres}" "${DB_PORT:-5432}"   "postgres"
wait_for_tcp "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" "redis"

# ─── 3. Init applicatif (opt-in via INIT_APP=true) ───────────────────────────

if [ "${INIT_APP:-false}" = "true" ]; then
  log "INIT_APP=true — initialisation applicative"

  # APP_KEY
  if ! grep -qE '^APP_KEY=base64:' .env; then
    php artisan key:generate --force --no-interaction || log "⚠ key:generate échoué"
  fi

  # JWT + QR secrets
  ensure_secret_in_env "JWT_SECRET"      "openssl rand -base64 64 | tr -d '\n='"
  ensure_secret_in_env "QR_TOKEN_SECRET" "openssl rand -base64 48 | tr -d '\n='"

  # Migrations (concurrency-safe via pg_advisory_lock côté Laravel/Postgres)
  log "migrate --force"
  php artisan migrate --force --no-interaction

  # Optimisations prod uniquement
  if [ "${APP_ENV:-local}" = "production" ]; then
    log "cache config/route/view/event"
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
  else
    php artisan config:clear || true
    php artisan route:clear  || true
  fi
else
  log "INIT_APP non défini — skip init, attend que le primary ait migré"
  # Petite attente passive : le primary a aussi attendu la DB, il a quelques secondes
  # d'avance pour faire migrate. En pratique queue/reverb démarrent à vide ou
  # avec une connexion qui retry.
  sleep 2
fi

# ─── 4. Exec la command ──────────────────────────────────────────────────────

log "exec $*"
exec "$@"
