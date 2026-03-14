# KanClaw v0.3.0 — Custom React Hooks Library

Date: 2026-03-14

## Summary
This release adds a comprehensive custom React hooks library for common frontend patterns.

## Highlights

### Custom Hooks Added
- `useFetch` - Data fetching with loading/error states
- `useDebounce` - Debounce any value
- `useLocalStorage` - Persistent storage with SSR support
- `useInterval` - Interval timer
- `useMediaQuery` - Responsive breakpoints detection
- `useWindowSize` - Window dimensions tracking
- `useClickOutside` - Click outside detection
- `useOnline` - Network connectivity detection with logging

### Features
- Full TypeScript support
- SSR compatible
- Lightweight and tree-shakeable

## Previous Versions

### v0.2.9
- Bundle analyzer
- API types
- PWA offline improvements
- CONTRIBUTING.md
- API documentation

### v0.2.8
- Unit tests with Vitest

## Validation
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run test` (4 passing)
- [x] First Load JS: 87.3KB
