# syntax=docker/dockerfile:1.7
#
# Bët — ml-api : microservice FastAPI Python pour classification IA d'incidents.
# Consommé UNIQUEMENT par backend-php Laravel via http://ml-api:5000 (réseau
# interne `bet`). Pas de port hôte en prod.
#
# Base : python:3.11-slim (Debian, glibc) — scikit-learn / numpy ont un
# historique de bugs sous musl (alpine). Le surcoût taille est acceptable.

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps : compile et installe les dépendances Python dans un venv
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS deps

WORKDIR /app

# Outils de build (temporaires) pour compiler scikit-learn / numpy si pas
# de wheel disponible. Purge implicite à la stage suivante (multi-stage).
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# venv dédié → copie facile vers la stage runtime
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ml/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir 'uvicorn[standard]'
    # uvicorn[standard] : ajoute uvloop, httptools, watchfiles (--reload), websockets


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime : image minimale sans build tools
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Outils runtime mini : curl pour healthcheck, libgomp1 requis par scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# User non-root
RUN useradd -u 1001 -m -s /bin/bash ml \
    && mkdir -p /app \
    && chown ml:ml /app

# Importe le venv depuis la stage deps
COPY --from=deps /opt/venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000

WORKDIR /app

# Code applicatif. Le module `ml` est attendu importable depuis /app
# (cf. `from ml.api.routes import ...` dans app.py).
COPY --chown=ml:ml ml /app/ml

USER ml

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
    CMD curl -fsS http://localhost:${PORT}/health || exit 1

# Default = prod gunicorn + UvicornWorker (recommandation officielle FastAPI).
# Workers ajustables via WEB_CONCURRENCY (lu nativement par gunicorn ET via
# expansion shell ci-dessous, défaut 2).
# Surcharge dev (uvicorn --reload) = `command:` dans docker-compose.dev.yml.
CMD ["sh", "-c", "exec gunicorn ml.api.app:app \
      --bind 0.0.0.0:${PORT:-5000} \
      --worker-class uvicorn.workers.UvicornWorker \
      --workers ${WEB_CONCURRENCY:-2} \
      --timeout 120 \
      --access-logfile - \
      --error-logfile -"]
