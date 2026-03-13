# PRD — KanClaw Phase Upgrade

## Problema original
Evolucionar el repositorio existente de KanClaw desde un MVP funcional hacia un auténtico Project OS premium local-first para equipos de agentes IA, sin romper los flujos ya operativos. El sistema debe diferenciarse mediante shell premium, chat persistente con agentes, memoria estructurada, runs, snapshots, conectores reales (GitHub primero), filesystem real en el home del usuario y estados honestos de OpenClaw.

## Decisiones de arquitectura
- Se mantuvo el stack estándar: Next.js 14 App Router + Prisma + SQLite + Tailwind + Zustand.
- El workspace real quedó consolidado en `~/.kanclaw/workspace/projects/<slug>/` con migración perezosa desde la ruta legada del repo.
- Los conectores se almacenan en local dentro de `~/.kanclaw/config/` con token GitHub cifrado en disco.
- Se añadió capa de producto para `Run`, `Snapshot`, `ChatThread`, `ChatMessage` y `ProjectImport` para visibilidad de conversación, importaciones y estado del proyecto.
- El shell del proyecto se rediseñó como un entorno de trabajo tipo desktop con navegación persistente, command palette, hub de memoria y panel contextual.
- El chat con agentes usa la integración real de OpenClaw y conserva un estado honesto offline sin respuestas fingidas.
- El Kanban se mantuvo y se reforzó con interacción drag/drop compatible con persistencia y uso real.

## Implementado
- Dashboard premium negro con ambient layer R3F sutil, métricas, actividad reciente y estado de conectores.
- Workspace shell premium con navegación lateral, panel central por vistas y rail contextual derecho.
- Command palette real con navegación rápida y acciones clave.
- Chat persistente por equipo y por agente con runs y errores honestos cuando OpenClaw está offline.
- Memory Hub con Overview, Knowledge, Decisions, Artifacts, Souls, Runs, Delegations y Snapshots.
- Snapshots persistidos en DB y exportados como JSON a `artifacts/snapshots/`.
- GitHub connector real con PAT cifrado localmente, listado de repos, preview y import como proyecto nuevo o contexto enlazado.
- Importación de carpeta local como contexto enlazado o proyecto nuevo.
- File explorer mejorado con metadata visible.
- Create agent, append decision y append knowledge desde el shell.
- Actualización del README con instrucciones reales de setup, conectores y local-first.

## Backlog priorizado
### P0
- Completar un wrapper desktop de producción (Tauri sidecar / estrategia definitiva de empaquetado) sin perder App Router + API routes.
- Validar el flujo online real completo con un gateway OpenClaw accesible desde el entorno.
- Añadir tests e2e más profundos sobre chat y connectors.

### P1
- Mejorar aún más el chat con búsqueda, archivos adjuntos y timeline de runs enlazado por mensaje.
- Añadir vista dedicada de Runs y provenance graph.
- Incorporar selectors/modals nativos para importación local cuando se use wrapper desktop.

### P2
- Más conectores: Git URL, ZIP, GitLab, Drive, Notion.
- Mejoras de accesibilidad y atajos avanzados.
- Superficie dedicada de artefactos con preview por tipo.

## Siguientes tareas
1. Resolver el empaquetado desktop de producción sobre la base ya local-first.
2. Conectar OpenClaw real para validar el chat online y los runs completos.
3. Profundizar la capa de provenance entre chat, runs, tareas, decisiones y artefactos.
