# KanClaw

Workspace con MVP de KanClaw en `/app/frontend` usando Next.js 14, Prisma, SQLite, Zustand y Tailwind.

## Ejecución local

```bash
cd frontend
yarn install
yarn db:generate
yarn db:push
yarn seed
yarn dev
```

Abre `http://localhost:3000`.

## Variables de entorno

Usa `frontend/.env.example` como base y define:

- `DATABASE_URL`
- `OPENCLAW_HTTP`
- `OPENCLAW_WS`
- `OPENCLAW_BEARER_TOKEN`

## Proyecto

- Dashboard de proyectos
- Workspace por proyecto con Kanban, actividad, envío a agentes y explorador de archivos real
- Integración REST + WebSocket con OpenClaw
