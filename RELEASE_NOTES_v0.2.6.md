# KanClaw v0.2.6 — Keyboard Navigation System

Date: 2026-03-14

## Summary
This release adds a comprehensive keyboard navigation system for power users.

## Highlights

### Keyboard Navigation
- Global keyboard shortcuts hook (`useKeyboardShortcuts`)
- Shortcuts factory for common actions
- Keyboard shortcuts help modal

### Shortcuts Available
| Shortcut | Action |
|----------|--------|
| Ctrl+K | Open command palette |
| Ctrl+B | Toggle sidebar |
| Ctrl+. | Toggle right panel |
| Ctrl+T | Toggle theme |
| Ctrl+1 | Go to Overview |
| Ctrl+2 | Go to Chat |
| Ctrl+3 | Go to Board |
| Ctrl+4 | Go to Memory |
| Ctrl+5 | Go to Files |
| Esc | Close dialogs |

## Previous Versions

### v0.2.5
- Enhanced metadata (Open Graph, Twitter cards)
- SVG favicon
- Toast utility component

### v0.2.4
- E2E tests with Playwright (6 tests)

### v0.2.3
- Security middleware with headers (CSP, HSTS)
- Rate limiting utility

### v0.2.2
- Error boundaries
- Loading states
- PWA basics (manifest, service worker)
- Skeleton components

## Validation
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run test:e2e` (6/6 passing)
- [x] First Load JS: 87.3KB

## Notes
This is a quality-of-life release focused on keyboard accessibility and power-user workflows.
