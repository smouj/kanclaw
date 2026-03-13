# KanClaw Desktop Wrapper

Este wrapper usa **Tauri 2 + sidecar SSR** para ejecutar KanClaw como app de escritorio sin perder App Router ni API routes.

## Flujo

1. `npm run build`
2. `npm run desktop:prepare-sidecar`
3. `npm run desktop:build`

## Desarrollo

```bash
npm run desktop:dev
```

## Notas

- El sidecar empaqueta el servidor standalone de Next.
- El webview apunta a `http://127.0.0.1:3210` en producción desktop.
- Los datos reales del workspace siguen viviendo en `~/.kanclaw/`.
- Los instaladores/bundles se generan en `src-tauri/target/release/bundle/`.