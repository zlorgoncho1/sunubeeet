# ─── Bët — Makefile ──────────────────────────────────────────────────────────
# 6 cibles : up / down / build  ×  dev (défaut) / prod
# Override de service via la variable `s` (un ou plusieurs services compose).
#
#   make up                          # dev complet
#   make up s=frontend               # dev frontend seul
#   make up s="backend backend-reverb backend-queue"
#   make build                       # rebuild dev
#   make down
#
#   make up-prod                     # 1-click déploiement prod
#   make build-prod
#   make down-prod

DEV  := docker compose -f docker-compose.dev.yml
PROD := docker compose -f docker-compose.prod.yml

s ?=

.PHONY: up down build up-prod down-prod build-prod help

help:
	@echo "Usage:"
	@echo "  make up [s=<svc>]        Lance la stack DEV (hot reload)"
	@echo "  make down                Stoppe la stack DEV"
	@echo "  make build [s=<svc>]     Rebuild les images DEV"
	@echo "  make up-prod [s=<svc>]   Lance la stack PROD (single nginx entry)"
	@echo "  make down-prod           Stoppe la stack PROD"
	@echo "  make build-prod [s=<svc>] Rebuild les images PROD"

up:
	$(DEV) up -d $(s)

down:
	$(DEV) down

build:
	$(DEV) build $(s)

up-prod:
	$(PROD) up -d $(s)

down-prod:
	$(PROD) down

build-prod:
	$(PROD) build $(s)
