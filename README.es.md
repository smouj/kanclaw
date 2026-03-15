<div align="center">

![KanClaw Banner](./assets/social/github-social-preview.png)

# KanClaw

### Sistema Operativo de Workspace Local-First Premium para Equipos de Agentes IA

[![GitHub stars](https://img.shields.io/github/stars/smouj/kanclaw?style=for-the-badge)](https://github.com/smouj/kanclaw/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/smouj/kanclaw?style=for-the-badge)](https://github.com/smouj/kanclaw/network/members)
[![GitHub issues](https://img.shields.io/github/issues/smouj/kanclaw?style=for-the-badge)](https://github.com/smouj/kanclaw/issues)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-149eca?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06b6d4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

[English](./README.md) · [Issues](https://github.com/smouj/kanclaw/issues) · [Discussions](https://github.com/smouj/kanclaw/discussions)

</div>

---

## Última Versión

- **v0.3.2** — Telemetry en chat, realtime en board, mejoras en selector GitHub
- [Notas de Release](./RELEASE_NOTES_v0.3.0.md)
- [Changelog](./CHANGELOG.md)

---

## ¿Qué es KanClaw?

KanClaw es un **sistema operativo de workspace local-first** donde **humanos + agentes IA** colaboran con contexto persistente, memoria estructurada y flujos de trabajo de equipo listos para producción.

A diferencia de herramientas genéricas de chat IA, KanClaw proporciona:
- **Control Plane**: Gobernanza de proyecto, gestión de contexto y coordinación de agentes
- **Execution Plane**: Delega a OpenClaw para ejecución real de agentes
- **Memoria Persistente**: Conocimiento del proyecto que sobrevive a las sesiones
- **Provenance**: Trazabilidad completa desde conversación hasta resultado
- **UX Premium**: Interfaz cinematográfica black/silver

---

## Inicio Rápido

### Requisitos

- Node.js 18+
- Gateway OpenClaw (ver abajo)

### Configuración

```bash
# Clonar el repositorio
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend

# Instalar dependencias
npm install

# Configurar OpenClaw (o usar valores por defecto)
# Por defecto: http://127.0.0.1:18789

# Iniciar servidor de desarrollo
npm run dev
```

Visitar **http://localhost:3020**

### Conexión OpenClaw

KanClaw requiere un gateway de [OpenClaw](https://github.com/openclaw) para ejecutar agentes IA.

**Configuración por defecto** (ya configurado en `.env`):
```
OPENCLAW_HTTP=http://127.0.0.:18789
OPENCLAW_WS=ws://127.0.0.1:18789/events
```

Para configurar una instancia personalizada de OpenClaw, establece las variables de entorno o visita la página de Settings en la app.

---

## Características

### Core
- **Colaboración Multi-Agente**: Equipo oficial de 6 agentes + agentes personalizados
- **Chat en Tiempo Real**: Ejecución live con SSE y telemetría
- **Board Kanban**: Gestión de tareas con visualización en grafo
- **Explorador de Archivos**: Multi-fuente (workspace, GitHub, memoria)
- **Memory Hub**: Base de conocimiento persistente del proyecto

### Control Plane (Servicios Backend)
- **Context Engine**: Paquetes de contexto curados para prompts de IA
- **Model Configuration**: Selección de modelo por proyecto/agente
- **Provenance**: Trazabilidad completa (mensaje → run → tarea → resultado)
- **Memory Orchestrator**: Handoffs y resúmenes entre agentes
- **Repo Intelligence**: Indexación de workspace y búsqueda de archivos

### Integraciones
- **GitHub**: Importación de repositorios con búsqueda, filtros, paginación
- **OpenClaw**: Runtime de ejecución de agentes
- **i18n**: Soporte para Inglés, Español, Francés
- **PWA**: App web instalable
- **Tema Oscuro/Claro**: Soporte de preferencia del sistema

---

## Arquitectura

```
┌──────────────────────────────────────┐
│         INTERFAZ KANCLAW              │
│  Chat │ Board │ Files │ Memory         │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│      CONTROL PLANE KANCLAW            │
│  Context │ Models │ Provenance        │
│  Memory  │ Repo   │ Agent Policy     │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│           OPENCLAW                    │
│  Runtime de Agentes │ Tools │ Models   │
└──────────────────────────────────────┘
```

**Control Plane** gestiona el contexto del proyecto, memoria y coordinación.  
**OpenClaw** maneja la ejecución real de agentes y llamadas a tools.

---

## Stack Técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router, Standalone) |
| UI | React 18, TypeScript, Tailwind CSS v3 |
| Base de Datos | Prisma + SQLite |
| Estado | React Context + Hooks |
| Estilos | Sistema de diseño custom con variables CSS |
| PWA | Service Worker, Manifest |

---

## Estructura del Proyecto

```
kanclaw/
├── frontend/                 # Aplicación Next.js (este repositorio)
│   ├── app/                # Páginas y rutas API de App Router
│   ├── components/          # Componentes React
│   ├── lib/                # Servicios core y utilidades
│   ├── prisma/             # Schema de base de datos
│   ├── tests/             # Tests unitarios
│   └── docs/               # Documentación técnica
├── docs/                   # Documentación (raíz)
├── CHANGELOG.md            # Historial de versiones
└── README.md               # Este archivo
```

---

## Desarrollo

```bash
cd frontend

# Instalar dependencias
npm install

# Servidor de desarrollo (puerto 3020)
npm run dev

# Lint
npm run lint

# Build
npm run build

# Tests
npm run test
```

---

## Despliegue

### Docker (Recomendado)

```bash
cd frontend

# Build de imagen standalone
npm run build

# Ejecutar con Docker
docker build -t kanclaw .
docker run -p 3020:3020 kanclaw
```

### Node.js

```bash
cd frontend
npm run build
PORT=3020 npm start
```

---

## Variables de Entorno

| Variable | Por Defecto | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Ruta de base de datos Prisma |
| `OPENCLAW_HTTP` | `http://127.0.0.1:18789` | Endpoint HTTP de OpenClaw |
| `OPENCLAW_WS` | `ws://127.0.0.1:18789/events` | WebSocket de OpenClaw |
| `OPENCLAW_BEARER_TOKEN` | - | Token de autenticación |

### Feature Flags

| Flag | Por Defecto | Descripción |
|------|-------------|-------------|
| `USE_AGENT_MODEL_OVERRIDES` | `true` | Config de modelo por agente |
| `USE_PROVENANCE_V2` | `true` | Trazabilidad mejorada de ejecución |
| `USE_KANCLAW_CONTEXT_ENGINE` | `false` | Nuevo constructor de context packs |
| `USE_MEMORY_ORCHESTRATOR` | `false` | Handoffs y resúmenes |
| `USE_REPO_INTELLIGENCE` | `false` | Indexación de workspace |

---

## Documentación

- [Arquitectura](./docs/ARCHITECTURE.md) - Diseño del sistema y modelos de datos
- [Referencia API](./docs/API_REFERENCE.md) - Documentación de endpoints
- [Control Plane](./docs/CONTROL_PLANE.md) - Guía de servicios backend

---

## Contribuir

¡Contribuciones bienvenidas! Lee primero nuestras [Guías de Contribución](./CONTRIBUTING.md).

1. Fork del repositorio
2. Crear rama de feature
3. Hacer cambios
4. Ejecutar tests y lint
5. Enviar Pull Request

---

## Licencia

Licencia MIT - Ver [LICENSE](./LICENSE).

---

## Enlaces

- [Web](https://kanclaw.io)
- [GitHub](https://github.com/smouj/kanclaw)
- [OpenClaw](https://github.com/openclaw)
- [Reportar Issues](https://github.com/smouj/kanclaw/issues)

---

<div align="center">

**Hecho con ❤️ por el Equipo KanClaw**

</div>