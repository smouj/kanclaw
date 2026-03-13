<div align="center">

# KanClaw

**Premium Local-First Living Workspace OS for AI Agent Teams**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-black?style=flat&logo=tauri)](https://tauri.app/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/smouj/kanclaw/pulls)

---

[Español](./README.es.md) · [简体中文](./README.zh.md) · [Architecture](./ARCHITECTURE.md)

</div>

---

## What is KanClaw?

KanClaw is a **premium local-first workspace operating system** for AI agent teams. It provides a persistent, cinematic environment where humans and AI agents collaborate on projects with structured memory, task management, real-time chat, and deep GitHub integration.

### Why KanClaw?

| Problem | KanClaw Solution |
|---------|------------------|
| Scattered context across prompts | Structured Memory Hub with Knowledge, Decisions, Artifacts |
| No persistence between sessions | Local-first storage with SQLite + filesystem |
| Blind delegation to AI agents | Runs with real-time tracking and provenance |
| Disconnected tooling | GitHub connector with PAT-based auth, local encryption |
| Generic AI interfaces | Premium cinematic design with "Anti-AI Slop" philosophy |

---

## Quick Start

### One-Command Installation

```bash
# Clone and install with a single command
curl -sL https://raw.githubusercontent.com/smouj/kanclaw/main/scripts/install.sh | bash
```

### Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/smouj/kanclaw.git
cd kanclaw/frontend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Initialize database
npm run db:generate
npm run db:push

# 5. (Optional) Seed demo data
npm run seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

### 🖥️ Premium Workspace Shell
- Cinematic dark interface with ambient R3F layers
- Command palette (Cmd+K) for quick navigation
- Contextual panels (sidebar, main content, right rail)

### 🤖 Agent Collaboration
- **Team Room** — Project-wide chat
- **Per-Agent Channels** — Direct conversations
- **Real Runs** — Live execution tracking with OpenClaw

### 🧠 Memory Hub
- **Overview** — Bento grid with metrics
- **Knowledge** — Structured information base
- **Decisions** — Architectural choices
- **Artifacts** — Generated outputs
- **Runs** — Execution history

### 📸 Snapshots
- Point-in-time exports
- JSON artifacts for auditing

### 🔗 GitHub Connector
- Secure PAT storage (encrypted locally)
- Repository listing and preview
- Import as new project or link to existing

### 📁 Local-First
All data lives in `~/.kanclaw/workspace/projects/<slug>/`

### 🖥️ Desktop Ready
Tauri 2 wrapper for native desktop experience

---

## Screenshots

| Dashboard | Project Workspace | Kanban Board | Agent Chat |
|-----------|-----------------|--------------|------------|
| ![Dashboard](./screenshots/01-dashboard.png) | ![Workspace](./screenshots/02-project-workspace.png) | ![Kanban](./screenshots/03-kanban.png) | ![Chat](./screenshots/04-chat.png) |

---

## Screenshots

| Dashboard | Project Workspace |
|-----------|-----------------|
| ![Dashboard](./screenshots/01-dashboard.png) | ![Workspace](./screenshots/02-workspace.png) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Drag & Drop | @dnd-kit |
| 3D Ambient | React Three Fiber (R3F) |
| Database | Prisma + SQLite |
| Desktop | Tauri 2 |
| AI Integration | OpenClaw (WebSocket) |
| GitHub | REST API with local PAT storage |

---

## Project Structure

```
kanclaw/
├── frontend/                 # Next.js 14 application
│   ├── app/                # App Router pages
│   ├── components/          # React components
│   ├── prisma/            # Database schema
│   └── public/             # Static assets
├── backend/                 # Python server (legacy)
├── .github/                # CI/CD workflows
├── design_guidelines.json  # Design system spec
└── screenshots/            # Visual documentation
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run seed` | Load demo project data |
| `npm run lint` | Run ESLint |
| `yarn desktop:dev` | Run Tauri dev mode |
| `yarn desktop:build` | Build Tauri app |

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
OPENCLAW_HTTP="http://localhost:3001"
OPENCLAW_WS="ws://localhost:3001/events"
OPENCLAW_BEARER_TOKEN=""
```

---

## CLI Installer (Coming Soon)

We're developing a one-command installer for KanClaw:

```bash
# Future installation
npx kanclaw create my-workspace
kanclaw start
kanclaw connect github
kanclaw agent add planner
```

Would you like to help build the CLI? [Contributions welcome!](#contributing)

---

## Design Philosophy

KanClaw follows a "Anti-AI Slop" philosophy:

- ✅ Cinematic, Quiet, Precision aesthetic
- ✅ High contrast text on deep backgrounds
- ✅ Luxurious spacing (2-3x normal)
- ✅ Meaningful motion with reduced-motion support
- ✅ Glass morphism with backdrop blur

### Anti-Patterns (Never Use)
- ❌ Generic purple/teal AI gradients
- ❌ Center-everything layouts
- ❌ Space Grotesk font
- ❌ Particle storms
- ❌ Rainbow dashboards

See [`design_guidelines.json`](design_guidelines.json) for the complete specification.

---

## Architecture

For detailed system architecture, see [`ARCHITECTURE.md`](ARCHITECTURE.md):

- System layers (Presentation → State → Business → Data)
- Database schema (Prisma entities)
- Filesystem structure
- Component architecture
- Integration patterns (OpenClaw, GitHub)
- Security model
- Performance considerations

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the design guidelines in `design_guidelines.json`
4. Run lint and build before submitting PRs

```bash
# Development workflow
git checkout -b feat/your-feature
npm run dev
# Make your changes
git commit -m "feat: your feature"
git push origin feat/your-feature
```

---

## License

MIT License — see [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Built with 🔥 by [Smouj](https://github.com/smouj)**

*KanClaw — Your Local-First AI Agent Workspace*

</div>
