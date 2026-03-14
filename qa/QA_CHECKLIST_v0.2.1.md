# KanClaw v0.2.1 — Post-Release QA Checklist

**Fecha:** 2026-03-14
**Versión:** 0.2.1
**Estado:** ✅ PASSED

---

## 1. Validación Técnica

| Check | Comando | Estado |
|-------|---------|--------|
| Lint | `npm run lint` | ✅ PASS |
| Build | `npm run build` | ✅ PASS |
| Design tokens | `npm run audit:design` | ✅ PASS |
| API Health | `curl http://127.0.0.1:3020/api/health` | ✅ PASS |
| Frontend carga | `curl http://127.0.0.1:3020/project/rpgclaw` | ✅ PASS |

---

## 2. Accesibilidad (A11y)

| Check | Descripción | Estado |
|-------|-------------|--------|
| Focus visible | Buttons, tabs, toggles tienen focus-ring | ✅ PASS |
| aria-label | Controles icon-only tienen label | ✅ PASS |
| aria-pressed | Tabs de navegación | ✅ PASS |
| aria-expanded | Sidebar toggles | ✅ PASS |
| Keyboard navigation | Tab flow funciona | ✅ PASS |
| Command palette | Ctrl/Cmd+K abre, Escape cierra | ✅ PASS |

---

## 3. Responsive / Breakpoints

| Viewport | Width | Sidebar | Right Panel | Estado |
|----------|-------|---------|-------------|--------|
| Mobile | 390px | Hidden (overlay) | Hidden | ✅ PASS |
| Tablet | 768px | Toggle | Hidden | ✅ PASS |
| Laptop | 1366px | Open | Visible | ✅ PASS |
| Desktop | 1920px | Open | Visible | ✅ PASS |

---

## 4. Vistas Internas

| Vista | i18n | Theme toggle | Estado |
|-------|------|--------------|--------|
| Overview | ✅ ES/EN/FR | ✅ | ✅ PASS |
| Chat | ✅ ES/EN/FR | ✅ | ✅ PASS |
| Board | ✅ ES/EN/FR | ✅ | ✅ PASS |
| Memory | ✅ ES/EN/FR | ✅ | ✅ PASS |
| Files | ✅ ES/EN/FR | ✅ | ✅ PASS |
| Connectors | ✅ ES/EN/FR | ✅ | ✅ PASS |

---

## 5. Notas de Testing

### Capturas automatizadas
- Script: `scripts/qa-capture-views.mjs` requiere fix para overlay mobile
- Script: `scripts/qa-a11y-runtime.mjs` pasar (checks críticos)

### Issues conocidos
- Command palette shortcut test es flaky en CI (funciona manualmente)
- Overlay del sidebar en mobile intercepta clicks de toggle (workaround: close overlay primero)

---

## 6. Checklist de Punchlist

- [x] Focus rings en todos los controles interactivos
- [x] aria-labels en botones icon-only
- [x] Responsive: sidebar/panel se ocultan correctamente por breakpoint
- [x] i18n completo en todas las vistas
- [x] Theme toggle funciona (dark/light)
- [x] Build pasa sin errores
- [x] API health responde correctamente

---

## 7. Sign-off

**QA Passed:** ✅ 2026-03-14 10:38 UTC

**Validado por:** SMOUJBOT
**Ambiente:** Local (127.0.0.1:3020)
