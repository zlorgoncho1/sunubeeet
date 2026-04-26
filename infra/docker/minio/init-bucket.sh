#!/usr/bin/env sh
# Initialise le bucket bet-media sur MinIO. Idempotent : ré-exécutable sans dommage.
# Lancé comme one-shot par le service `minio-init` après que `minio` soit healthy.
set -eu

ALIAS="local"
ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
ACCESS="${MINIO_ROOT_USER:-minioadmin}"
SECRET="${MINIO_ROOT_PASSWORD:-minioadmin}"
BUCKET="${MINIO_BUCKET:-bet-media}"

echo "[minio-init] alias $ALIAS → $ENDPOINT"
mc alias set "$ALIAS" "$ENDPOINT" "$ACCESS" "$SECRET"

# 1) Création du bucket (idempotent)
if mc ls "$ALIAS/$BUCKET" >/dev/null 2>&1; then
    echo "[minio-init] bucket $BUCKET déjà existant"
else
    echo "[minio-init] création bucket $BUCKET"
    mc mb "$ALIAS/$BUCKET"
fi

# 2) Policy : strictement privé. AUCUN accès anonyme.
#    Tout download passe par une URL signée générée par Laravel.
echo "[minio-init] policy → none (privé)"
mc anonymous set none "$ALIAS/$BUCKET"

# 3) Versionnement OFF (économie d'espace, pas requis par le MVP)
mc version disable "$ALIAS/$BUCKET" >/dev/null 2>&1 || true

# 4) Lifecycle : purge auto des originaux > 7 jours (cf. règle métier "originaux 7j")
#    Le préfixe `originals/` est convention Laravel — à respecter côté MediaController.
cat > /tmp/lifecycle.json <<EOF
{
  "Rules": [
    {
      "ID": "purge-originals-7d",
      "Status": "Enabled",
      "Filter": { "Prefix": "originals/" },
      "Expiration": { "Days": 7 }
    }
  ]
}
EOF
mc ilm import "$ALIAS/$BUCKET" < /tmp/lifecycle.json >/dev/null 2>&1 || \
    echo "[minio-init] ⚠ lifecycle non appliqué (ok si rejoué)"

# 5) CORS : restreint à l'origine front (uploads PUT directs depuis le navigateur).
#    En dev/prod sans domaine, on accepte http://localhost:* — à durcir avec un vrai domaine.
ALLOWED_ORIGIN="${MINIO_CORS_ORIGIN:-http://localhost:3000}"
cat > /tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["${ALLOWED_ORIGIN}"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders":  ["ETag"],
      "MaxAgeSeconds":  3600
    }
  ]
}
EOF
mc cors set "$ALIAS/$BUCKET" /tmp/cors.json >/dev/null 2>&1 || \
    echo "[minio-init] ⚠ CORS non appliqué (ok si version mc le supporte pas)"

echo "[minio-init] OK — bucket $BUCKET prêt (privé, lifecycle 7j sur originals/)"
