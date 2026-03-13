# KanClaw

KanClaw es un **Living Workspace OS local-first** para proyectos de agentes IA. Cada proyecto vive como un mini-sistema operativo con agentes persistentes, chat por equipo y por agente, tablero de tareas, memoria acumulativa, snapshots, imports y un filesystem real en disco.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Zustand
- dnd-kit
- React Three Fiber
- GitHub REST connector local-first

## Estructura local-first

Los datos reales del workspace se guardan fuera del repo en:

```bash
~/.kanclaw/workspace/projects/<project-slug>/
```

Cada proyecto crea esta estructura:

```bash
agents/
  <agent-name>/
    SOUL.md
    TOOLS.md
    memory.md
tasks/
knowledge/
decisions/
artifacts/
workspace/
project-memory.md
```

## Configuración local

1. Instala dependencias (recomendado: `npm` por `package-lock.json`):

   ```bash
   npm install
   ```

2. Crea tu entorno local:

   ```bash
   cp .env.example .env
   ```

3. Genera Prisma y crea la base de datos:

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Opcional: carga el proyecto demo:

   ```bash
   npm run seed
   ```

5. Arranca KanClaw:

   ```bash
   npm run dev
   ```

6. Abre `http://localhost:3000`.

## Variables de entorno

```env
DATABASE_URL="file:./dev.db"
OPENCLAW_HTTP="http://localhost:3001"
OPENCLAW_WS="ws://localhost:3001/events"
OPENCLAW_BEARER_TOKEN=""
```

> Seguridad: si configuras URLs OpenClaw remotas (no loopback), KanClaw exige bearer token para guardar la configuración.

## Conector GitHub

KanClaw guarda la configuración del conector en local de forma cifrada dentro de:

```bash
~/.kanclaw/config/
```

Flujo actual:

1. Abre un proyecto
2. Ve a **Connectors**
3. Pega tu **GitHub PAT**
4. Carga repositorios
5. Previsualiza un repo
6. Impórtalo como proyecto nuevo o vincúlalo al proyecto actual

Lo que importa en esta fase:

- metadata principal
- rama por defecto
- README
- manifests relevantes
- árbol de directorios de primer nivel ampliado
- mapeo al Project Memory

## Chat con agentes

KanClaw incluye:

- **Team Room** del proyecto
- **canales directos por agente**
- historial persistente por hilo
- integración real con OpenClaw
- estado honesto offline si OpenClaw no responde
- runs y delegaciones conectadas al chat

## Snapshots

Cada snapshot captura:

- estado del proyecto
- tareas recientes
- runs recientes
- decisiones
- conocimiento
- artefactos
- resumen de memorias de agentes

Además se exporta un JSON en:

```bash
artifacts/snapshots/<snapshot-id>.json
```

## Desktop / Tauri

KanClaw ahora incluye una base real para wrapper desktop con **Tauri 2 + sidecar SSR**.

### Scripts

```bash
npm run desktop:dev
npm run desktop:prepare-sidecar
npm run desktop:build
```

### Qué hace

- empaqueta el servidor standalone de Next como sidecar
- abre KanClaw como app de escritorio
- mantiene App Router + API routes
- conserva el workspace local-first en `~/.kanclaw/`

### Nota importante

El empaquetado del sidecar usa `pkg`, que actualmente apunta a targets Node 18 por compatibilidad del empaquetador.

## OpenClaw online

Cuando OpenClaw emite eventos reales, KanClaw ahora:

- normaliza eventos soportados
- los persiste como actividad
- actualiza runs y tareas cuando puede enlazarlos
- refleja progreso/fallo/finalización en el chat del proyecto

## Super-chat

El chat del proyecto ahora incluye:

- contexto automático del proyecto por mensaje
- búsqueda híbrida local sobre memory, knowledge, decisions, artifacts, runs, tareas, imports y mensajes
- selección explícita de contexto antes de enviar
- inspector lateral con vínculos de provenance por mensaje

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run serve`
- `npm run db:generate`
- `npm run db:push`
- `npm run seed`
- `npm run smoke:api`
- `npm run audit:policy`
- `npm run desktop:dev`
- `npm run desktop:prepare-sidecar`
- `npm run desktop:build`

## CI / calidad

Workflow activo: `.github/workflows/kanclaw-ci.yml`

Incluye:
- `npm ci`
- `npm run db:generate`
- `npm run db:push`
- `npm run seed`
- `npm run lint`
- `npm run build`
- smoke API (`node scripts/e2e-smoke-api.mjs`)
- auditoría de dependencias con política (`node scripts/audit-policy.mjs`)

## Runbook rápido (rollback + troubleshooting)

### Rollback a commit anterior

```bash
cd /home/smouj/apps/kanclaw/frontend
git log --oneline -5
git revert <commit>
npm install
npm run build
systemctl --user restart kanclaw.service
```

### Diagnóstico básico de servicio

```bash
systemctl --user status kanclaw.service --no-pager -n 50
journalctl --user -u kanclaw.service -n 100 --no-pager
curl -sf http://127.0.0.1:3020/api/health
```

### Validación de chat OpenClaw

```bash
curl -sS -X POST http://127.0.0.1:3020/api/chat \
  -H 'content-type: application/json' \
  --data '{"projectSlug":"flickclaw","threadId":"<thread-id>","targetAgentName":"ClipAgent","content":"ping"}'
```

