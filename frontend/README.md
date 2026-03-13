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

1. Instala dependencias:

   ```bash
   yarn install
   ```

2. Crea tu entorno local:

   ```bash
   cp .env.example .env
   ```

3. Genera Prisma y crea la base de datos:

   ```bash
   yarn db:generate
   yarn db:push
   ```

4. Opcional: carga el proyecto demo:

   ```bash
   yarn seed
   ```

5. Arranca KanClaw:

   ```bash
   yarn dev
   ```

6. Abre `http://localhost:3000`.

## Variables de entorno

```env
DATABASE_URL="file:./dev.db"
OPENCLAW_HTTP="http://localhost:3001"
OPENCLAW_WS="ws://localhost:3001/events"
OPENCLAW_BEARER_TOKEN=""
```

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

KanClaw queda preparado para evolucionar a app de escritorio. La base local-first y el shell están diseñados para ese paso. Si usas la carpeta `src-tauri`, puedes adaptar el wrapper desktop para tu flujo local.

## Scripts

- `yarn dev`
- `yarn build`
- `yarn serve`
- `yarn db:generate`
- `yarn db:push`
- `yarn seed`
