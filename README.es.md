# KanClaw

<p align="center">
  <img src="https://kanclaw.com/logo-light.png" alt="KanClaw" width="200" />
</p>

<p align="center">
  <strong>Sistema Operativo de Workspace Local-First Premium para Equipos de Agentes IA</strong>
</p>

<p align="center">
  <a href="https://kanclaw.com">
    <img src="https://img.shields.io/badge/Live-kanclaw.com-000000?style=for-the-badge" alt="Sitio Web" />
  </a>
  <a href="https://github.com/smouj/kanclaw">
    <img src="https://img.shields.io/github/stars/smouj/kanclaw?style=for-the-badge" alt="Estrellas" />
  </a>
  <a href="https://github.com/smouj/kanclaw/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/smouj/kanclaw?style=for-the-badge" alt="Licencia" />
  </a>
  <a href="https://discord.gg/kanclaw">
    <img src="https://img.shields.io/badge/Discord-KanClaw-5865F2?style=for-the-badge" alt="Discord" />
  </a>
</p>

---

## ¿Qué es KanClaw?

KanClaw es un **sistema operativo de workspace local-first premium** para equipos de agentes IA. Proporciona un entorno persistente y cinematográfico donde humanos y agentes IA colaboran en proyectos con memoria estructurada, gestión de tareas, chat en tiempo real y profunda integración con GitHub.

A diferencia de soluciones basadas en la nube, KanClaw almacena todos los datos localmente en `~/.kanclaw/`, dándote propiedad total sobre el conocimiento, decisiones y artefactos de tu equipo.

## ¿Por qué KanClaw?

| Problema | Solución KanClaw |
|----------|------------------|
| Contexto disperso entre prompts | Memory Hub estructurado con Knowledge, Decisions, Artifacts |
| Sin persistencia entre sesiones | Almacenamiento local-first con SQLite + sistema de archivos |
| Delegación ciega a agentes IA | Runs con seguimiento en tiempo real y provenance |
| Herramientas desconectadas | Conector GitHub con autenticación PAT, cifrado local |
| Interfaces genéricas de IA | Diseño cinematográfico premium con filosofía "Anti-AI Slop" |

## Características Principales

### 🖥️ Workspace Shell Premium
- Interfaz oscura cinematográfica con capas R3F ambientales
- Paleta de comandos (Cmd+K) para navegación rápida
- Paneles contextuales (sidebar, contenido principal, rail derecho)
- Navegación persistente entre vistas

### 🤖 Colaboración con Agentes
- **Sala de Equipo** — Chat global para colaboración humano-agente
- **Canales por Agente** — Conversaciones directas con agentes individuales
- **Runs Reales** — Seguimiento de ejecución en vivo con integración OpenClaw
- **Estado Offline** — Respuesta honesta cuando OpenClaw no está disponible

### 🧠 Memory Hub
Acumulación estructurada del conocimiento del proyecto:
- **Overview** — Grid bento con métricas del proyecto
- **Knowledge** — Base de información estructurada
- **Decisions** — Decisiones arquitectónicas y su rationale
- **Artifacts** — Salidas generadas y exportaciones
- **Agent Souls** — Personalidades de agentes (SOUL.md)
- **Runs** — Historial de ejecuciones y provenance

### 📸 Snapshots
- Exportaciones de estado del proyecto en un momento dado
- Artefactos JSON para auditoría y recuperación
- Incluye tareas, runs, decisiones, knowledge y artifacts

### 🔗 Conector GitHub
- Almacenamiento seguro de PAT (cifrado local)
- Listado y búsqueda de repositorios
- Previsualización antes de importar
- Importar como proyecto nuevo o enlazar a existente

### 📁 Arquitectura Local-First
Todos los datos viven en `~/.kanclaw/`:
```
~/.kanclaw/workspace/projects/<slug>/
├── agents/          # Definiciones de agentes + memoria
├── tasks/           # Tablero Kanban
├── knowledge/       # Base de conocimiento
├── decisions/       # Decisiones arquitectónicas
├── artifacts/       # Salidas generadas
│   └── snapshots/  # Exportaciones punto-en-tiempo
└── project-memory.md
```

### 🖥️ Listo para Desktop
- Wrapper Tauri 2 para experiencia nativa
- Servidor standalone de Next.js como sidecar
- Local-first conservado en modo desktop

## Capturas de Pantalla

| Vista | Descripción |
|------|-------------|
| Dashboard | Vista general del workspace con fondo R3F ambiental |
| Project Workspace | Shell completo con sidebar y paneles |
| Kanban Board | Gestión de tareas con drag-and-drop |
| Agent Chat | Sala de equipo + canales por agente |
| Memory Hub | Grid bento con knowledge/decisions/artifacts |
| GitHub Connector | Input de PAT, listado de repos, flujo de importación |
| Command Palette | Acciones rápidas con Cmd+K |

*Ver [`screenshots/`](screenshots/) para los assets visuales requeridos.*

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado | Zustand |
| Drag & Drop | @dnd-kit |
| 3D Ambiental | React Three Fiber (R3F) |
| Base de Datos | Prisma + SQLite |
| Desktop | Tauri 2 |
| Integración IA | OpenClaw (eventos WebSocket) |
| GitHub | REST API con almacenamiento PAT local |

## Inicio Rápido

### Requisitos Previos

- Node.js 20+
- npm o yarn
- (Opcional) CLI de Tauri para builds de escritorio

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend

# Instalar dependencias
npm install
# o
yarn install

# Copiar plantilla de entorno
cp .env.example .env

# Generar cliente Prisma y crear base de datos
npm run db:generate
npm run db:push

# (Opcional) Sembrar proyecto demo
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Variables de Entorno

```env
DATABASE_URL="file:./dev.db"
OPENCLAW_HTTP="http://localhost:3001"
OPENCLAW_WS="ws://localhost:3001/events"
OPENCLAW_BEARER_TOKEN=""
```

## Estructura del Proyecto

```
kanclaw/
├── frontend/                 # Aplicación Next.js
│   ├── app/                # Páginas App Router
│   │   ├── page.tsx       # Dashboard
│   │   └── project/
│   │       └── [slug]/
│   │           └── page.tsx  # Workspace de proyecto
│   ├── components/          # Componentes React
│   │   ├── shell/         # Workspace shell
│   │   ├── kanban/        # Tablero de tareas
│   │   ├── chat/          # Chat de agentes
│   │   ├── memory/        # Memory Hub
│   │   ├── connectors/     # Conector GitHub
│   │   └── ui/            # Componentes compartidos
│   ├── prisma/             # Esquema de base de datos
│   └── public/             # Assets estáticos
├── backend/                 # Servidor Python (heredado)
├── .github/                # Workflows CI/CD
├── design_guidelines.json  # Spec del sistema de diseño
└── screenshots/            # Documentación visual
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:push` | Aplicar esquema a la base de datos |
| `npm run seed` | Cargar datos de demostración |
| `npm run lint` | Ejecutar ESLint |
| `yarn desktop:dev` | Ejecutar Tauri en modo desarrollo |
| `yarn desktop:build` | Construir app Tauri |

## CI/CD

El repositorio incluye workflows de GitHub Actions:

- **Frontend CI** — `.github/workflows/frontend-ci.yml`
  - Instalación de dependencias
  - Generación Prisma + push a base de datos
  - Siembra de base de datos
  - Validación ESLint
  - Build de producción

## Filosofía de Diseño

KanClaw sigue una filosofía "Anti-AI Slop":

### Principios Fundamentales
- ✅ Estética **Cinematográfica, Tranquila, Precisa**
- ✅ **Alto contraste** de texto sobre fondos profundos
- ✅ **Espaciado lujoso** (2-3x lo normal)
- ✅ **Movimiento significativo** con soporte para reduced-motion
- ✅ **Glass morphism** con backdrop blur

### Tipografía
- **Encabezados:** Manrope
- **Cuerpo:** IBM Plex Sans
- **Mono:** JetBrains Mono

### Paleta de Colores
- Canvas: `#020202`
- Surface: `#0A0A0A`, `#121212`, `#1A1A1A`
- Border: `#1F1F1F`, `#2A2A2A`
- Texto: `#EDEDED`, `#A1A1AA`, `#52525B`

### Anti-Patrones (Nunca Usar)
- ❌ Gradientes genéricos morados/celestes de IA
- ❌ Layouts centrados en todo
- ❌ Fuente Space Grotesk
- ❌ Tormentas de partículas
- ❌ Dashboards arcoíris
- ❌ Emojis genéricos de asistente IA

Consulta [`design_guidelines.json`](design_guidelines.json) para la especificación completa.

## Arquitectura

Para arquitectura detallada del sistema, ver [`ARCHITECTURE.md`](ARCHITECTURE.md):

- Capas del sistema (Presentación → Estado → Negocio → Datos)
- Esquema de base de datos (entidades Prisma)
- Estructura del sistema de archivos
- Arquitectura de componentes
- Patrones de integración (OpenClaw, GitHub)
- Modelo de seguridad
- Consideraciones de rendimiento

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork del repositorio
2. Crear una rama de feature
3. Seguir las guías de diseño en `design_guidelines.json`
4. Ejecutar lint y build antes de enviar PRs

## Licencia

Licencia MIT — ver [`LICENSE`](LICENSE) para más detalles.

---

Construido con 🔥 por [Smouj](https://github.com/smouj)

*KanClaw — Tu Workspace Local-First para Agentes IA*
