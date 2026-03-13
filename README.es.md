<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./frontend/public/kanclaw-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./frontend/public/kanclaw-logo-light.png">
    <img src="./frontend/public/kanclaw-logo-light.png" alt="Logo de KanClaw" width="320" />
  </picture>

# KanClaw

**Sistema operativo de workspace local-first premium para equipos de agentes IA**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-black?style=flat&logo=tauri)](https://tauri.app/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/smouj/kanclaw/pulls)

[English](./README.md) · [Arquitectura](./ARCHITECTURE.md)
</div>

---

## Resumen

KanClaw es un workspace operativo local-first donde humanos y agentes IA colaboran con contexto persistente, memoria estructurada, gestión de tareas e integración profunda con GitHub.

### ¿Por qué KanClaw?

- **Contexto persistente** con Memory Hub (Knowledge, Decisions, Artifacts, Runs)
- **Almacenamiento local-first** con SQLite + sistema de archivos
- **Trazabilidad real** de ejecuciones de agentes
- **Conector GitHub seguro** con manejo local de PAT
- **UI premium** siguiendo la filosofía "Anti-AI Slop"

---

## Inicio rápido

### 1) Clonar e instalar

```bash
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend
npm install
```

### 2) Configurar entorno

```bash
cp .env.example .env
```

### 3) Inicializar base de datos

```bash
npm run db:generate
npm run db:push
# Opcional: datos demo
npm run seed
```

### 4) Arrancar en desarrollo

```bash
npm run dev
```

Abrir: `http://localhost:3000`

---

## Capturas

<div align="center">
  <a href="./screenshots/01-dashboard.png">
    <img src="./screenshots/01-dashboard.png" alt="Dashboard KanClaw" width="48%" />
  </a>
  <a href="./screenshots/02-workspace.png">
    <img src="./screenshots/02-workspace.png" alt="Workspace KanClaw" width="48%" />
  </a>
</div>

<p align="center">
  <sub>Haz clic en una captura para verla en resolución completa.</sub>
</p>

> Las capturas se mantienen en `./screenshots` y se validan para evitar enlaces rotos.

---

## Stack técnico

- **Frontend:** Next.js 14, React 18, TypeScript
- **Estado/UI:** Zustand, Tailwind CSS, shadcn/ui, dnd-kit
- **Capa 3D ambiental:** React Three Fiber + drei + three
- **Datos:** Prisma + SQLite
- **Desktop:** Tauri 2
- **Integraciones:** OpenClaw (HTTP/WS), GitHub REST

---

## Estructura del proyecto

```text
kanclaw/
├── frontend/            # App Next.js
├── backend/             # Backend Python legado
├── screenshots/         # Assets visuales del README
├── docs/                # Documentación del proyecto
└── ARCHITECTURE.md      # Arquitectura de alto nivel
```

---

## Scripts disponibles (frontend)

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run db:generate` — generar cliente Prisma
- `npm run db:push` — sincronizar esquema Prisma
- `npm run seed` — cargar datos demo
- `npm run lint` — lint
- `npm run desktop:dev` — ejecutar KanClaw en modo escritorio (Tauri)
- `npm run desktop:prepare-sidecar` — preparar sidecar de Next.js para empaquetado
- `npm run desktop:build` — generar instalador/app de escritorio

---

## Instalación en escritorio (Desktop)

KanClaw se puede instalar como aplicación de escritorio usando **Tauri 2**.

### Requisitos

- Node.js 20+
- Rust toolchain (`rustup`, `cargo`)
- Dependencias del sistema para Tauri (según tu SO)

### Flujo recomendado

```bash
cd frontend
npm install
npm run build
npm run desktop:prepare-sidecar
npm run desktop:build
```

Al finalizar, Tauri genera los instaladores/binarios en `frontend/src-tauri/target/release/bundle/`.

> Si quieres solo probarlo en modo app de escritorio sin empaquetar: `npm run desktop:dev`.

---

## Dirección de diseño

KanClaw sigue una guía estricta **Anti-AI Slop**:

- Lenguaje visual cinematográfico y sobrio
- Alto contraste y jerarquía legible
- Espaciado intencional y motion moderado
- Sin gradientes IA genéricos ni efectos ruidosos

Consulta `design_guidelines.json` para reglas completas.

---

## Banner del repositorio / Social preview

Se incluye un banner optimizado para GitHub y redes en:

- `assets/social/github-social-preview.png` (1280×640)
- `assets/social/github-social-preview.svg` (fuente editable)

Para activarlo en GitHub:

1. Ve a **Settings → General** del repositorio
2. Busca **Social preview**
3. Sube `assets/social/github-social-preview.png`

Esto mejora la presentación del repositorio y el CTR cuando se comparte el enlace.
