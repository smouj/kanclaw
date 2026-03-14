# Changelog

All notable changes to **KanClaw** will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [0.2.2] - 2026-03-14

### Added
- Error handling infrastructure:
  - Global `ErrorBoundary` component for graceful error recovery
  - `app/error.tsx` - Error page with retry and navigation options
  - `app/loading.tsx` - Loading state for streaming SSR
- Skeleton components for future loading states:
  - `StatCardSkeleton`, `AgentListSkeleton`, `ThreadSkeleton`
  - `MessageSkeleton`, `KanbanColumnSkeleton`, `FileItemSkeleton`
  - `OverviewSkeleton`

### Changed
- Build optimized: maintained at < 355KB first load JS
- Error messages now include error ID for debugging

## [0.2.1] - 2026-03-14

### Added
- Post-release QA hardening pass with:
  - accessibility improvements (focus-visible, aria labels/pressed/expanded, keyboard close on overlays),
  - responsive behavior refinement by breakpoint,
  - locale-aware time formatting in project views.
- Mobile thread selector for chat when left thread rail is hidden on small screens.

### Changed
- Project shell header spacing and wrapping improved for smaller widths.
- Sidebar/panel toggles now include better accessibility semantics and keyboard-visible focus states.
- Chat selected-message highlight and hover contrast normalized for dark/light consistency.
- Right stats rail in chat now hidden on small screens to preserve readable message width.

### Fixed
- Removed remaining contrast/focus inconsistencies in primary project views.
- Unified residual connector/chat strings and status messaging for i18n consistency.

## [0.2.0] - 2026-03-14

### Added
- Premium UI pass across project views (`overview`, `chat`, `board`, `memory`, `files`, `connectors`).
- Global language system (ES/EN/FR):
  - `LanguageProvider`
  - `LanguageSelector`
  - persistent language preference and locale-aware formatting.
- Design token guardrail:
  - `scripts/design-token-audit.mjs`
  - CI step `npm run audit:design` in `frontend-ci`.
- `runs` API endpoint with manual cleanup support (`GET` + `DELETE`) for operational hygiene.
- Project API updates:
  - `PUT /api/projects?slug=...` for updates
  - `DELETE /api/projects?slug=...` for manual project cleanup.
- Per-project persisted layout preferences for retractable side panels.

### Changed
- OpenClaw integration bridge hardened:
  - RPC-first behavior
  - robust process `cwd` handling
  - better fallback behavior and operational reliability.
- Home and workspace shell visual hierarchy improved for premium black/silver style.
- Project overview expanded with useful product metrics and activity context.
- Chat UX significantly improved:
  - better message composition and layout
  - improved contrast in dark/light
  - markdown/code rendering improvements
  - context chips and thinking indicators.
- Connectors UX improved:
  - clearer status/error feedback
  - better import flow resilience.

### Fixed
- Resolved OpenClaw legacy endpoint mismatch (`/agents/task` incompatibility) by migrating to current gateway RPC flow.
- Fixed workspace routing to ensure project-level workspace use (instead of OpenClaw global workspace fallback when avoidable).
- Fixed mode/contrast issues in chat bubbles and key visual components.
- Cleaned stale demo sessions and obsolete demo workspace artifacts.

### Security
- Enforced safer remote OpenClaw config handling:
  - remote OpenClaw URL requires bearer token in config route.

### Quality
- Consistent pass on:
  - `lint`
  - `build`
  - `smoke:api`
  - `audit:design`

## [0.1.0] - 2026-03-13

### Added
- Initial KanClaw workspace shell with project views and OpenClaw integration baseline.
