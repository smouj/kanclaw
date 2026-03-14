# Changelog

All notable changes to **KanClaw** will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [0.3.2] - 2026-03-14

### Added
- **Toast Notifications** - ToastProvider with success/error/warning/info toasts
- **Offline Indicator** - Banner showing online/offline status
- **Global Search** - Search projects and agents with Ctrl+K
- **Skeleton Loaders** - CardSkeleton, StatsSkeleton, ActivitySkeleton, etc.
- **Markdown Preview** - Preview markdown files in editor
- **Export Project** - Export project data as JSON
- **Run Timeline** - Visual timeline of agent runs with status icons
- **Keyboard Shortcuts Modal** - Improved styling with kanclaw-panel

### Changed
- ExportProject button integrated in project workspace header
- RunTimeline integrated in Memory Hub (runs tab)
- Keyboard shortcuts modal improved with premium styling

### Fixed
- Project delete API call now uses slug correctly

## [0.3.1] - 2026-03-14

### Added
- Project delete functionality with confirmation dialog
- Visual delete button on project cards (appears on hover)
- ConfirmDialog component with loading state

### Changed
- Homepage project cards: add kanclaw-panel styling for consistency
- Memory page: use kanclaw-panel instead of theme-surface-soft
- Config panel: remove green accent, use black/silver premium style
- All panels now use consistent .kanclaw-panel class

### Fixed
- Official logo updates: logo-white.png and logo-black.png (transparent background)
- Favicon now uses white logo
- Social banner updated with correct logo URL

## [0.3.0] - 2026-03-14

### Added
- Custom React hooks library:
  - `useFetch` - Data fetching with loading/error states
  - `useDebounce` - Debounce any value
  - `useLocalStorage` - Persistent storage with SSR support
  - `useInterval` - Interval timer
  - `useMediaQuery` - Responsive breakpoints
  - `useWindowSize` - Window dimensions
  - `useClickOutside` - Click outside detection
  - `useOnline` - Network connectivity detection

### Changed
- Build passes with minor warnings

## [0.2.9] - 2026-03-14

### Added
- Bundle analyzer (`@next/bundle-analyzer`)
- API response types (`lib/api-types.ts`)
- PWA offline improvements (enhanced service worker with cache strategies)
- CONTRIBUTING.md guidelines
- API documentation (`docs/API.md`)

### Changed
- Build optimized with bundle analyzer integration

## [0.2.8] - 2026-03-14

### Added
- Unit tests infrastructure:
  - Vitest configuration
  - Logger unit tests (4 tests passing)
  - Test scripts: `test`, `test:watch`, `test:coverage`

## [0.2.7] - 2026-03-14

### Added
- Logging & observability system:
  - `lib/logger.ts` - Logger singleton with levels (debug/info/warn/error)
  - `lib/usePerformance.ts` - Performance tracking hook
  - Integrated logger into ErrorBoundary for automatic error capture

## [0.2.6] - 2026-03-14

### Added
- Keyboard navigation system:
  - `useKeyboardShortcuts` hook for global shortcuts
  - `createShortcuts` factory for common shortcuts
  - `KeyboardShortcutsHelp` component (Ctrl+K shows palette)
  - Shortcuts: Ctrl+1-5 (views), Ctrl+B (sidebar), Ctrl+T (theme), Ctrl+. (panel)

## [0.2.5] - 2026-03-14

### Added
- Quick wins:
  - Enhanced metadata (Open Graph, Twitter cards, keywords)
  - SVG favicon
  - Toast utility component with predefined messages
  - `Toast.tsx` for consistent notifications across app

## [0.2.4] - 2026-03-14

### Added
- E2E tests with Playwright:
  - Homepage loads test
  - Project page loads test
  - Navigation tabs test
  - Theme toggle test
  - Language selector test
  - API health check test
- Scripts: `test:e2e`, `test:e2e:ui`

### Changed
- All 6 E2E tests passing

## [0.2.3] - 2026-03-14

### Added
- Security middleware with headers:
  - X-XSS-Protection, X-Frame-Options, X-Content-Type-Options
  - Content-Security-Policy (CSP)
  - Referrer-Policy, Permissions-Policy
  - HSTS for production domains
- Rate limiting utility (`lib/rate-limit.ts`)
- Middleware: 26.8 kB (acceptable)

### Changed
- First load JS: 87.3 kB (well under 350KB target)

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
