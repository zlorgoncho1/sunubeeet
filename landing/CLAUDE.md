# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository is **pre-implementation**. It currently contains only:

- `Landing-Page (1).md` — full copy/spec for the Bët landing page (in French), section by section, with layout hints (bento grids, sliders, timelines) baked into each section header.
- `Logo.png` — the Bët logo asset.

There is no code, no package manifest, no build pipeline, no tests. When the user asks to "build the landing page" or similar, treat `Landing-Page (1).md` as the source of truth for content and layout intent. Do not invent sections, copy, or statistics — every figure in the spec (e.g. *56 morts*, *135 morts*, *2 700 athlètes*, *50 000 places Stade Wade*, *Marché Sénégal mature 800 M – 1,5 Md FCFA / an*) is a load-bearing claim and must be reproduced verbatim.

When implementation begins, update this file with the actual stack, build/test/lint commands, and architecture once chosen.

## Project context: Bët

**Bët** (Wolof: *"œil"* — "eye") is the product. It is positioned as the first African real-time incident-coordination platform for large gatherings, with the **Dakar 2026 Youth Olympic Games (JOJ, 31 Oct – 13 Nov 2026)** as its showcase deployment. The market thesis extends beyond JOJ to religious/cultural events (Magal de Touba, Gamou de Tivaouane), stadiums, smart cities, and CEDEAO-wide expansion.

The platform connects four roles with deliberately distinct UX surfaces:

- **Spectateur** — anonymous reporter via QR scan, no account, no app
- **Agent de terrain** — single-screen mobile UX optimized for in-motion use
- **Coordinateur** — PC-operations live map with one-click validate/dispatch
- **Administrateur** — system configuration

Key product invariants (from the spec — preserve these in any UX or messaging work):

- **Authenticate the QR, not the user.** Spectator stays anonymous; the wall-mounted QR carries the signed token.
- **Anti-doublon by space + time.** Reports within ~100 m and ~2 min are grouped, not duplicated.
- **Server-side face blurring** on every photo (CDP Sénégal compliance).
- **Wolof voice in, French transcript out** — the spectator speaks Wolof, the coordinator reads French, the agent sees both.
- Stated SLA shift: alert-to-intervention from **12–20 min → under 5 min**; duplicates from **30–50% → under 5%**.

## Working with the landing-page spec

The spec is a **landing page**, not a full application. The 10 sections (Problème → Contexte JOJ → Bët → Valeur → Comment ça marche → Différenciation → Après-JOJ → Équipe → Pourquoi nous → CTA) are sequential and each carries an explicit layout hint in its header (e.g. *"Bento grid 2×3"*, *"Slider horizontal, un écran à la fois"*, *"Timeline horizontale 4 étapes"*). Honor those hints — they are art-direction, not suggestions.

Editorial conventions to preserve:

- **Language is French**, with Wolof brand terms (*Bët*, *Magal*, *Gamou*) kept verbatim. Do not translate copy to English unless asked.
- Tone is **terse, declarative, high-contrast**. Short sentences. Bold is used surgically for numbers and verdicts. Match this register if you generate any new copy.
- The `[PLACEHOLDER ÉQUIPE]`, `[BENTO …]`, `[TIMELINE …]`, and `[CALLOUT]` tokens in the spec mark layout slots — when implementing, replace them with real components/markup, not literal text.

## Platform notes

- Working directory contains a space-suffixed filename (`Landing-Page (1).md`) — quote paths in shell commands.
- Running on Windows; the bash shell wired into this session uses Unix syntax (forward slashes, `/dev/null`). PowerShell is also available when a Windows-native command is needed.
