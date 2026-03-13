<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./frontend/public/kanclaw-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./frontend/public/kanclaw-logo-light.png">
    <img src="./frontend/public/kanclaw-logo-light.png" alt="KanClaw official logo" width="340" />
  </picture>

# KanClaw

### Premium Local-First Workspace OS for AI Agent Teams

<p>
  <a href="https://github.com/smouj/kanclaw/stargazers"><img src="https://img.shields.io/github/stars/smouj/kanclaw?style=for-the-badge" alt="stars" /></a>
  <a href="https://github.com/smouj/kanclaw/network/members"><img src="https://img.shields.io/github/forks/smouj/kanclaw?style=for-the-badge" alt="forks" /></a>
  <a href="https://github.com/smouj/kanclaw/issues"><img src="https://img.shields.io/github/issues/smouj/kanclaw?style=for-the-badge" alt="issues" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge" alt="license" /></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-14-000?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-Local--First-0f766e?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tauri-2-111827?logo=tauri" alt="Tauri" />
</p>

[Español](./README.es.md) · [Architecture](./ARCHITECTURE.md) · [Docs Landing](./docs/index.html) · [Open Issues](https://github.com/smouj/kanclaw/issues)
</div>

---

## 🧭 Who is this for?

- **Founders** shipping product features with AI copilots
- **Indie hackers** who need speed without losing traceability
- **Small teams** coordinating agent runs with persistent context

> KanClaw helps you move fast with AI while keeping structure, auditability, and delivery quality.

---

## 📚 Table of Contents

- [Why KanClaw](#-why-kanclaw)
- [Feature Highlights](#-feature-highlights)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🚀 Why KanClaw

KanClaw is a local-first workspace OS where **humans + AI agents** collaborate with persistent context, structured memory, and production-ready team workflows.

| Problem | KanClaw Solution |
|---|---|
| Context gets lost between sessions | Persistent Memory Hub (Knowledge, Decisions, Artifacts, Runs) |
| AI delegation is opaque | Real run tracking with provenance and activity logs |
| Tooling is fragmented | GitHub connector + OpenClaw integration in one interface |
| Generic UI fatigue | Premium cinematic UX with strict anti-slop design system |

---

## ✨ Feature Highlights

- **Workspace Shell:** focused, cinematic interface with command palette and context rails
- **Agent Collaboration:** team room, per-agent channels, real task execution traces
- **Memory Hub:** queryable knowledge, decision records, artifacts and run history
- **Project Ops:** tasks, snapshots, imports, and structured execution loops
- **Desktop-ready:** native packaging via Tauri 2

<details>
<summary><strong>🔎 Product positioning</strong></summary>

KanClaw is designed for indie builders and small teams that need **speed + structure**: move fast with agents, without losing reliability, context, or auditability.

</details>

---

## 🖼 Screenshots

| Dashboard | Project Workspace |
|---|---|
| ![KanClaw Dashboard](./screenshots/01-dashboard.png) | ![KanClaw Workspace](./screenshots/02-workspace.png) |

> Screenshots are maintained in `./screenshots` and verified against real file paths.

---

## ⚡ Quick Start

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
# optional demo data
npm run seed
```

### 4) Run development server

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## 🧱 Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling/UI | Tailwind CSS, shadcn/ui, dnd-kit |
| State | Zustand |
| 3D Ambient | React Three Fiber, drei, three |
| Data | Prisma + SQLite |
| Desktop | Tauri 2 |
| Integrations | OpenClaw (HTTP/WS), GitHub REST API |

---

## 🗂 Project Structure

```text
kanclaw/
├── frontend/            # Next.js app
├── backend/             # Legacy Python backend
├── docs/                # Landing + static docs
├── screenshots/         # README visual assets
└── ARCHITECTURE.md      # High-level architecture
```

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push Prisma schema |
| `npm run seed` | Seed demo project data |
| `npm run lint` | Run lint checks |
| `npm run desktop:dev` | Run Tauri development mode |
| `npm run desktop:build` | Build Tauri app |

---

## 🗺 Roadmap

- [ ] One-command CLI installer
- [ ] Multi-project templates and starter packs
- [ ] Live analytics + observability overlay
- [ ] Expanded automation library for agent workflows

---

## 📈 Why teams share KanClaw

- Clear product story (local-first + agent workflows)
- Professional visual identity and premium UX
- Practical setup (Next.js + Prisma + SQLite + Tauri)
- Ready for rapid iteration and public demos

---

## 🤝 Contributing

PRs are welcome. For major changes, open an issue first to align on scope, UX direction, and architecture.

### Support the project

If KanClaw helps your workflow:
- ⭐ Star the repository
- 🍴 Fork and build your flavor
- 🐛 Report issues with reproducible steps
- 📣 Share it with #aiagents and #buildinpublic communities
