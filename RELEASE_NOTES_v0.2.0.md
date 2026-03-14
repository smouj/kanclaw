# KanClaw v0.2.0 — Premium Workspace Pass

Date: 2026-03-14

## Release summary
v0.2.0 focuses on turning KanClaw into a coherent, premium, local-first workspace product.

Core outcomes:
- Cohesive product UX across all project views.
- Robust OpenClaw integration behavior.
- Better operator experience (cleanup endpoints, smoke checks, visual consistency).
- First-class i18n foundation with ES/EN/FR and locale-aware formatting.
- Automated design-token consistency checks in CI.

## What changed

### Product & UX
- Unified visual language across:
  - Overview
  - Chat
  - Board
  - Memory
  - Files
  - Connectors
- Upgraded premium black/silver design consistency.
- Improved panel behavior and persisted per-project layout preferences.

### Chat quality
- Enhanced chat composition and message rendering behavior.
- Better dark/light contrast handling.
- Improved markdown/code readability in messages.
- Added stronger operational feedback loops (thinking/progress UX where applicable).

### OpenClaw & integrations
- Gateway RPC-first integration path stabilized.
- Config hardening for remote OpenClaw usage (token required when remote URL is used).
- Improved connectors feedback and import flow resilience.

### Data/workspace integrity
- Added runs cleanup endpoint (`/api/runs`) to support manual hygiene workflows.
- Added project update/delete API support.
- Improved workspace routing behavior to favor project-local contexts.

### Internationalization
- Added language selector and provider for ES/EN/FR.
- Expanded translation coverage in critical project UI paths.
- Locale-aware date/time rendering improvements.

### DX / CI / quality
- Added design consistency audit (`audit:design`) and wired into CI.
- Continued passing checks:
  - lint
  - build
  - smoke API
  - design audit

## Known limitations
- Full i18n coverage is substantially improved but still may have residual microcopy outside critical paths.
- Some advanced integration behavior depends on external gateway/runtime availability.

## Upgrade notes
- Frontend package version bumped to `0.2.0`.
- No destructive migration required.

## Validation checklist used for release
- [x] `npm run audit:design`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run smoke:api`
- [x] service restart and health verification

## Recommended next step (v0.2.x)
- Final residual i18n sweep + accessibility pass (focus/aria/keyboard) per breakpoint with visual QA checklist.
