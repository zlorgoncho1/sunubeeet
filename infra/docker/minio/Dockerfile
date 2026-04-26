# syntax=docker/dockerfile:1.7
#
# Bët — minio-init : image one-shot qui initialise le bucket bet-media via mc.
#
# Le script init-bucket.sh est COPY'd dans l'image (au lieu de bind-mounté
# depuis l'hôte). Ça évite le bug Docker classique du bind-mount mono-fichier
# qui crée un dossier vide côté container quand le source path n'est pas
# correctement résolu au boot (notamment quand `docker compose` est lancé
# depuis un cwd différent).

FROM minio/mc:latest

COPY init-bucket.sh /usr/local/bin/init-bucket.sh

# Override de l'ENTRYPOINT par défaut de l'image (qui pointe sur `mc`).
# Le script appelle lui-même `mc` après s'être configuré via les env vars.
ENTRYPOINT ["/bin/sh", "/usr/local/bin/init-bucket.sh"]
