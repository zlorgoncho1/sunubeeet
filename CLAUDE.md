# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Bët (SUNUBETT)

Incident reporting & dispatch platform for large events. Primary use case: **JOJ Dakar 2026** (Youth Olympic Games, Senegal). Connects three populations — spectators, field agents, coordinators — around a single use case: **Alerter** (raise an alert).

**Documentation is in French.** Match the language of surrounding docs/code when writing new content.

## Current state

The repository is in a **pre-implementation / scaffolding** phase:

- [backend/](backend/), [frontend/](frontend/), [bi/](bi/), [ml/](ml/), [infra/](infra/) contain only `.gitkeep` — no code, no `package.json`, no `composer.json`, no Docker config, no tests yet.
- The single source of truth is the spec set in [prompt/](prompt/). When implementing anything, read the relevant section there first.
- There is no build, lint, or test command to document yet. When you scaffold a service, add the canonical commands here.
- A standalone HTML mockup [generated-page (8).html](generated-page%20(8).html) at the root is a UI reference (Tailwind via CDN, Manrope font, dark map aesthetic) — not part of the app build.

## Source-of-truth specs

Always consult [prompt/](prompt/) before designing or implementing a feature:

- [prompt/CONTEXT.md](prompt/CONTEXT.md) — product framing: actors, the four flows, MVP scope, glossary.
- [prompt/FEATURES.md](prompt/FEATURES.md) — feature catalogue. Each feature has an ID (`F1.3`, `F4.4`, …) mapping directly to a Figma node, with endpoints, UI components, and DoD.
- [prompt/TYPES.md](prompt/TYPES.md) — **technical reference**: enums, entities, SQL schemas, JWT/QR token shapes, full REST + WebSocket API contract, end-to-end scenarios per flow, summary SQL schema. Locked stack declared here: Laravel 11 · Next.js 14 · PostgreSQL 16 · Docker · MinIO/S3.
- [prompt/STACK.md](prompt/STACK.md), [prompt/DESIGN.md](prompt/DESIGN.md), [prompt/RULES.md](prompt/RULES.md) — currently empty placeholders. Fill these as decisions get made; do not invent content.

If a feature or behavior isn't in these docs, it is out of scope for the MVP — flag it instead of building it.

## Domain model — what to internalize before touching code

The cascade is **Alerte → Incident → Mission**. Conflating these breaks the model.

- **Alerte** — raw signal submitted by a spectator. Cheap, frequent, possibly duplicate. Status: `received | validated | duplicate | false_alert | rejected`.
- **Incident** — qualified business event. One incident aggregates one or more alertes. Status: `open | qualified | mission_assigned | in_progress | resolved | closed | cancelled`.
- **Mission** — single-agent intervention dispatched by a coordinator from an incident. **One mission = one agent.** Reinforcement = a new mission on the same incident, never multi-assignment. Status: `created | assigned | accepted | refused | on_route | on_site | completed | cancelled`.
- **Site** — the codebase name for what the Figma board calls **"agent tiers"** (third-party services: hospitals, police, pompiers, postes de secours, event venues). When users say "agent tiers" they mean `Site`.

### Four flows (and their invariants)

| Flow | Actor | Auth | Notes |
|---|---|---|---|
| **F1 — QR Code Urgence** | Spectator (anonymous) | None for user; QR token (JWT HS256) is what's authenticated | Position comes from the QR token, **never** from the browser — cannot be spoofed. Tracking later via phone-number OTP. |
| **F2 — App** | Spectator (registered) | JWT access+refresh | Position comes from device GPS. Same alert form as F1. |
| **F3 — Agent** | Field agent | JWT | First screen is the **on/off availability toggle**. While `available`, presence pings every 30s. |
| **F4 — Coordinator** | PC operator | JWT | Desktop/tablet dashboard. Dispatches missions; CRUDs agents, missions, sites. |

### Cross-cutting rules that are easy to get wrong

- **"On authentifie pas le user, mais le QR"** — for F1, the QR token IS the authentication of the source. Do not bolt user accounts onto F1.
- **The alert form is universal** — F1 and F2 submit the same fields. Diverging the two forms is a bug.
- **Anti-spam is by spatio-temporal proximity**, not rate-limit per user/token. Defaults: same category + GPS distance < 100 m + age < 2 min ⇒ mark `is_potential_duplicate = true`. The duplicate is **still accepted and stored**, then the coordinator confirms/infirms. Never silently drop.
- **Photo blur** — every uploaded photo runs through an async face-blur job before being served. Originals retained 7 days for audit. Never serve raw originals.
- **Media URLs are signed** (5-minute TTL, regenerated on each fetch). No public S3 URLs.
- **Phone numbers are stored hashed** (sha256 + salt) on alertes / `phone_trackings`. Used for anonymous tracking in F1.
- **Agent presence is a binary toggle** (`available` | `offline`). Operational sub-states (`on_route`, `on_site`, …) are **derived from the agent's active mission**, not stored on the presence record.

## API & data conventions (from [prompt/TYPES.md](prompt/TYPES.md))

- All routes prefixed `/api/v1`. Response envelope: `data` + `meta` + `links`.
- **snake_case** everywhere on the API surface (request bodies, response keys, query params).
- IDs exposed via API: **UUID v4 or v7** for `User`, `Alerte`, `Incident`, `Mission`, `Site`, `QRCode`. `BIGSERIAL` for `TrackingEvent`, `AuditLog` (internal only).
- GPS: `DECIMAL(10, 7)` in SQL. Distance via Haversine in Laravel. PostGIS only in phase 2.
- Timestamps: UTC, ISO 8601 (`2026-04-17T10:23:45.123Z`).
- Three token types — never confuse them:
  - **Access JWT** (Bearer, user-authenticated routes)
  - **QR token** (HS256 with `QR_TOKEN_SECRET`, encodes `{ qr_id, lat, lng, label }`)
  - **Tracking token** (issued after phone OTP for anonymous F1 follow-up, header `X-Tracking-Token`)
- Real-time: Laravel Reverb WebSocket. Channels: `private-coordinator.zone.{zoneId}`, `private-agent.{agentId}`, `private-spectator-tracking.{phone_hash}`. **Always implement a 5s polling fallback.**

## Out of scope for MVP

If asked to build any of these, push back and reference [prompt/CONTEXT.md §9](prompt/CONTEXT.md): native mobile apps, native push notifications, full offline mode, two-way SMS, full UI i18n, ML hot-zone prediction, video surveillance integration, agent-to-agent chat, agent rating, payments.
