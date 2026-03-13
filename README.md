<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./frontend/public/kanclaw-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./frontend/public/kanclaw-logo-light.png">
    <img src="./frontend/public/kanclaw-logo-light.png" alt="KanClaw logo" width="320" />
  </picture>

# KanClaw

**Premium Local-First Workspace OS for AI Agent Teams**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-black?style=flat&logo=tauri)](https://tauri.app/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/smouj/kanclaw/pulls)

[Español](./README.es.md) · [Architecture](./ARCHITECTURE.md)
</div>

---

## Overview

KanClaw is a local-first operating workspace where humans and AI agents collaborate with persistent context, structured memory, task orchestration, and deep GitHub integration.

### Why KanClaw

- **Persistent context** with Memory Hub (Knowledge, Decisions, Artifacts, Runs)
- **Local-first storage** using SQLite + filesystem
- **Real run tracking** for agent execution and provenance
- **Secure GitHub connector** with local PAT handling
- **Premium UI system** guided by the "Anti-AI Slop" design philosophy

---

## Quick Start

### 1) Clone and install

```bash
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

### 3) Initialize database

```bash
npm run db:generate
npm run db:push
# Optional demo data
npm run seed
```

### 4) Start development

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## Screenshots

| Dashboard | Project Workspace |
|---|---|
| ![KanClaw Dashboard](./screenshots/01-dashboard.png) | ![KanClaw Workspace](./screenshots/02-workspace.png) |

> Screenshots are maintained in `./screenshots` and validated to avoid broken references.

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **State/UI:** Zustand, Tailwind CSS, shadcn/ui, dnd-kit
- **3D Ambient Layer:** React Three Fiber + drei + three
- **Data:** Prisma + SQLite
- **Desktop:** Tauri 2
- **Integrations:** OpenClaw (HTTP/WS), GitHub REST

---

## Project Structure

```text
kanclaw/
├── frontend/            # Next.js app
├── backend/             # Legacy Python backend
├── screenshots/         # README visual assets
├── docs/                # Project docs site/static docs
└── ARCHITECTURE.md      # High-level architecture
```

---

## Available Scripts (frontend)

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run db:generate` — Prisma client generation
- `npm run db:push` — sync Prisma schema
- `npm run seed` — seed demo data
- `npm run lint` — lint checks
- `npm run desktop:dev` — Tauri dev
- `npm run desktop:build` — Tauri build

---

## Design Direction

KanClaw follows a strict **Anti-AI Slop** system:

- Cinematic and quiet visual language
- High contrast and readable hierarchy
- Purposeful spacing and restrained motion
- No generic AI gradients, no noisy effects

See `design_guidelines.json` for design rules.

---

## Contributing

PRs are welcome. For major changes, open an issue first to align on scope, UX direction, and architecture.
