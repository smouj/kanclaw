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

- 🖥️ **Workspace Shell Premium** — Interfaz oscura cinematográfica con capas R3F ambientales, paleta de comandos (Cmd+K) y paneles contextuales
- 🤖 **Colaboración con Agentes** — Chat persistente con sala de equipo y canales por agente, runs reales con integración OpenClaw
- 🧠 **Memory Hub** — Acumulación estructurada de Knowledge, Decisions, Agent Souls y Artifacts
- 📸 **Snapshots** — Exportaciones de estado del proyecto en un momento dado para auditoría y recuperación
- 🔗 **Conector GitHub** — Almacenamiento seguro de PAT, listado de repos, previsualización e importación como proyectos nuevos
- 📁 **Local-First** — Todos los datos viven en `~/.kanclaw/workspace/projects/<slug>/` sin dependencia de la nube
- 🖥️ **Listo para Desktop** — Wrapper Tauri 2 para experiencia de escritorio nativa

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
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
│   ├── src/
│   │   ├── app/            # Páginas App Router
│   │   ├── components/      # Componentes React
│   │   ├── lib/            # Utilidades y stores
│   │   └── styles/         # Estilos globales
│   ├── prisma/             # Esquema de base de datos
│   └── public/             # Assets estáticos
├── backend/                 # Servidor Python (heredado)
├── .github/                # Workflows CI/CD
└── design_guidelines.json  # Especificación del sistema de diseño
```

## Arquitectura Local-First

Todos los datos del proyecto se almacenan fuera del repositorio:

```bash
~/.kanclaw/workspace/projects/<project-slug>/
├── agents/
│   └── <agent-name>/
│       ├── SOUL.md        # Personalidad del agente
│       ├── TOOLS.md       # Capacidades del agente
│       └── memory.md      # Memoria acumulada del agente
├── tasks/                  # Tablero Kanban
├── knowledge/             # Base de conocimiento del proyecto
├── decisions/             # Decisiones arquitectónicas
├── artifacts/             # Artefactos generados
│   └── snapshots/         # Exportaciones punto-en-tiempo
└── project-memory.md      # Resumen del proyecto
```

## Conector GitHub

1. Abre un proyecto en KanClaw
2. Navega a **Connectors**
3. Pega tu **Personal Access Token de GitHub** (almacenado cifrado localmente)
4. Explora y selecciona repositorios
5. Importa como nuevo proyecto o vincula al existente

El conector almacena tu PAT cifrado en `~/.kanclaw/config/`.

## Aplicación de Escritorio

KanClaw incluye un wrapper Tauri 2 para experiencia de escritorio nativa:

```bash
cd frontend

# Modo desarrollo
yarn desktop:dev

# Build para producción
yarn desktop:build
```

El build de escritorio empaqueta el servidor standalone de Next.js como un sidecar de Tauri.

## Referencia de Comandos

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

El repositorio incluye workflows de GitHub Actions en `.github/workflows/frontend-ci.yml`:

- Instalación de dependencias
- Generación Prisma y push a base de datos
- Siembra de base de datos
- Validación ESLint
- Build de producción

## Filosofía de Diseño

KanClaw sigue una filosofía "Anti-AI Slop":

- ✅ Estética **Cinematográfica, Tranquila, Precisa**
- ✅ **Alto contraste** de texto sobre fondos profundos
- ✅ **Espaciado lujoso** (2-3x lo normal)
- ✅ **Movimiento significativo** con soporte para reduced-motion

Anti-patrones que evitamos:
- ❌ Gradientes genéricos morados/celestes de IA
- ❌ Layouts centrados en todo
- ❌ Fuente Space Grotesk
- ❌ Tormentas de partículas
- ❌ Dashboards arcoíris

Consulta [`design_guidelines.json`](design_guidelines.json) para la especificación completa.

## Contribuir

Las contribuciones son bienvenidas. Por favor, lee nuestras guías de contribución antes de enviar PRs.

## Licencia

Licencia MIT — consulta [`LICENSE`](LICENSE) para más detalles.

---

Construido con 🔥 por [Smouj](https://github.com/smouj)
