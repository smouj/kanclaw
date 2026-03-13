# KanClaw

KanClaw es un Living Workspace OS para equipos de agentes IA. Cada proyecto crea un workspace real con agentes, memoria persistente, tablero Kanban, stream de actividad y explorador de archivos editable.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Zustand
- dnd-kit

## Configuración

1. Instala dependencias:

   ```bash
   yarn install
   ```

2. Crea tu entorno local desde `.env.example`:

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

5. Arranca la app:

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

## Qué incluye el MVP

- Creación de proyectos con estructura real de carpetas
- Agentes por proyecto con memoria local
- Kanban persistente con drag and drop
- Subtareas y delegación validada
- Stream de actividad con reconexión SSE sobre WebSocket
- Explorador de archivos con edición guardada en disco
- Estados vacíos, errores inline y modo desconectado real para OpenClaw

## Scripts

- `yarn dev`
- `yarn build`
- `yarn serve`
- `yarn db:generate`
- `yarn db:push`
- `yarn seed`
