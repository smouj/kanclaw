# KanClaw v0.2.1 — Post-release QA Hardening

Date: 2026-03-14

## Summary
This release finalizes the post-release QA checklist for accessibility, responsive behavior, and polish consistency across project views.

## Highlights

### 1) Accessibility final audit pass
- Improved keyboard/focus behavior in core navigation and controls:
  - visible focus rings on interactive controls,
  - stronger button semantics (`type`, `aria-label`, `aria-pressed`, `aria-expanded`),
  - command palette close behavior with `Esc`, dialog semantics.

### 2) Responsive fine-tuning
- Project header spacing/wrapping improved for small widths.
- Chat thread rail hidden on small screens with a mobile thread selector in header.
- Chat right stats rail hidden on small screens to prioritize message readability.
- Sidebars remain retractable with persisted per-project preferences.

### 3) Visual/contrast polish
- Refined selected/hover states in chat bubbles for better dark/light consistency.
- Eliminated residual low-contrast border/ring states in primary project screens.

### 4) i18n residual coverage improvements
- Continued translation coverage for connectors/chat/system microcopy.
- Locale-aware date/time rendering reinforced in project views.

## Validation checklist
- [x] `npm run audit:design`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run smoke:api`
- [x] service restart + `/api/health`

## Notes
No breaking architectural changes were introduced.
This is a quality/stability/polish release over v0.2.0.
