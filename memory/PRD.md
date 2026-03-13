# PRD — KanClaw MVP

## Problema original
Construir el MVP de KanClaw como un Living Workspace OS para equipos de agentes IA con Next.js 14, App Router, Tailwind, Zustand y Prisma SQLite. Debe incluir proyectos aislados, agentes por proyecto, tablero Kanban drag-and-drop, subtareas, memoria persistente, flujo de actividad en tiempo real, explorador de archivos del workspace y conexión a OpenClaw por REST + WebSocket, sin datos falsos y con estados reales de desconexión.

## Decisiones de arquitectura
- Frontend principal en `/app/frontend` como proyecto estándar Next.js 14 + TypeScript + App Router.
- Persistencia local con Prisma + SQLite y estructura real de archivos en `.kanclaw/workspace/projects/<slug>`.
- API nativa en Next.js para modo portable/local y proxy FastAPI mínimo en `/app/backend` para que `/api` funcione correctamente en esta preview.
- Estado cliente con Zustand para actividad y selección de archivos.
- Kanban con dnd-kit y render client-only para evitar mismatches SSR/hydration.
- OpenClaw tratado como integración real: health real, stream real, error claro si el gateway está caído.

## Implementado
- Dashboard premium oscuro con branding KanClaw y creación de proyectos.
- Workspace por proyecto con sidebar, Kanban, feed de actividad, panel de dispatch y explorador de archivos editable.
- Rutas `/api/projects`, `/api/tasks`, `/api/files`, `/api/send-task`, `/api/health`, `/api/events`.
- Creación automática de carpetas/agentes/memory files por proyecto.
- Delegation parser seguro para `create_subtask`, `append_decision`, `append_knowledge`, `create_artifact`.
- Manejo real de OpenClaw desconectado y error 503 claro al enviar tareas.
- README de setup y seed demo FlickClaw.

## Backlog priorizado
### P0
- Verificar con un gateway OpenClaw real el flujo exitoso de `/agents/task` y eventos WebSocket end-to-end.
- Añadir reconexión visual más rica para eventos cuando OpenClaw pase de offline a online.

### P1
- Vista previa enriquecida para markdown/json en el explorador.
- Filtros/búsqueda de tareas y logs.
- Crear/editar roles de agentes desde la UI.

### P2
- Paneles de conocimiento/decisiones dedicados.
- Mejoras de accesibilidad y atajos de teclado estilo desktop workspace.
- Más analítica/telemetría de ejecución por agente.

## Siguientes tareas
1. Probar con un gateway OpenClaw real para validar el flujo online completo.
2. Añadir gestión visual de estado de reconexión/eventos.
3. Expandir edición de workspace con creación de carpetas y vistas enriquecidas.
